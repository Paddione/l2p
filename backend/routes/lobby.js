// backend/routes/lobby.js - Fixed version with missing endpoints
const express = require('express');
const router = express.Router();
const { query, getPoolMetrics } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { validateLobbyCreation, validateJoinLobby, validateGameAction, validateQuery, sanitizeBody, sanitizeQuery } = require('../middleware/validation');
const QuestionSet = require('../models/QuestionSet');
const websocketService = require('../services/websocketService');

// Apply authentication and sanitization middleware to all lobby routes
router.use(authenticateToken);
router.use(sanitizeBody);
router.use(sanitizeQuery);

// Generate a random 4-character code
function generateLobbyCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// Helper function to clean up inactive lobbies
async function cleanupInactiveLobbies() {
    try {
        // Delete lobbies that haven't been active for more than 5 minutes and haven't started
        const inactiveResult = await query(`
            DELETE FROM lobbies 
            WHERE last_activity < NOW() - INTERVAL '5 minutes' 
            AND started = FALSE
        `);
        
        // Delete started games older than 30 minutes (games should not last that long)
        const oldGamesResult = await query(`
            DELETE FROM lobbies 
            WHERE created_at < NOW() - INTERVAL '30 minutes' 
            AND started = TRUE
        `);
        
        // Delete post-game lobbies older than 10 minutes (give players time to return)
        const postGameResult = await query(`
            DELETE FROM lobbies 
            WHERE last_activity < NOW() - INTERVAL '10 minutes' 
            AND game_phase = 'post-game'
        `);
        
        // Delete empty lobbies (lobbies with no players)
        const emptyResult = await query(`
            DELETE FROM lobbies 
            WHERE code NOT IN (
                SELECT DISTINCT lobby_code 
                FROM lobby_players 
                WHERE lobby_code IS NOT NULL
            )
        `);
        
        // Delete very old lobbies regardless of status (older than 2 hours)
        const veryOldResult = await query(`
            DELETE FROM lobbies 
            WHERE created_at < NOW() - INTERVAL '2 hours'
        `);
        
        const totalCleaned = (inactiveResult.rowCount || 0) + (oldGamesResult.rowCount || 0) + 
                           (postGameResult.rowCount || 0) + (emptyResult.rowCount || 0) + (veryOldResult.rowCount || 0);
        
        if (totalCleaned > 0) {
            console.log(`Cleaned up ${totalCleaned} inactive/empty lobbies`);
        }
        
        return totalCleaned;
    } catch (error) {
        console.error('Error cleaning up lobbies:', error);
        return 0;
    }
}

// Fixed getLobbyData function with better question handling
async function getLobbyData(code) {
    try {
        // Update last_activity
        await query('UPDATE lobbies SET last_activity = CURRENT_TIMESTAMP WHERE code = $1', [code]);
        
        // Get lobby basic data and question set info
        const lobbyResult = await query(`
            SELECT l.*,
                   qs.name as question_set_name,
                   qs.description as question_set_description,
                   qs.question_count as question_set_count
            FROM lobbies l
            LEFT JOIN question_sets qs ON l.question_set_id = qs.id
            WHERE l.code = $1
        `, [code]);

        if (lobbyResult.rows.length === 0) return null;

        const lobby = lobbyResult.rows[0];

        // Get players
        const playersResult = await query(`
            SELECT username, character, score, multiplier, current_answer, answered, ready, is_host
            FROM lobby_players
            WHERE lobby_code = $1
            ORDER BY is_host DESC, username
        `, [code]);

        // Get questions and parse them properly
        const questionsResult = await query(`
            SELECT question_index, question_data
            FROM lobby_questions
            WHERE lobby_code = $1
            ORDER BY question_index
        `, [code]);

        // Parse question data and ensure it's properly formatted
        const questions = questionsResult.rows.map(row => {
            try {
                return typeof row.question_data === 'string' 
                    ? JSON.parse(row.question_data) 
                    : row.question_data;
            } catch (error) {
                console.error(`Error parsing question ${row.question_index} for lobby ${code}:`, error);
                return null;
            }
        }).filter(q => q !== null);

        // Get current question for the response
        let currentQuestion = null;
        if (lobby.started && lobby.current_question !== null && questions.length > lobby.current_question) {
            currentQuestion = questions[lobby.current_question];
        }

        return {
            ...lobby,
            players: playersResult.rows,
            questions: questions,
            currentQuestion: currentQuestion,
            totalQuestions: questions.length,
            question_set: lobby.question_set_name ? {
                name: lobby.question_set_name,
                description: lobby.question_set_description,
                question_count: lobby.question_set_count
            } : null,
            debug: {
                questionCount: questions.length,
                currentQuestionIndex: lobby.current_question,
                hasCurrentQuestion: !!currentQuestion,
                gamePhase: lobby.game_phase,
                started: lobby.started
            }
        };
    } catch (error) {
        console.error(`Error in getLobbyData for lobby ${code}:`, error);
        throw error;
    }
}

// Helper function to calculate score based on correctness and timing
function calculateScore(isCorrect, timeElapsed, multiplier = 1, baseScore = 60) {
    if (!isCorrect) return 0;
    
    // Ensure we have valid inputs
    if (typeof timeElapsed !== 'number' || timeElapsed < 0) {
        console.warn('Invalid timeElapsed for score calculation:', timeElapsed);
        return 0;
    }
    
    if (typeof multiplier !== 'number' || multiplier < 1) {
        console.warn('Invalid multiplier for score calculation:', multiplier);
        multiplier = 1;
    }
    
    if (typeof baseScore !== 'number' || baseScore <= 0) {
        baseScore = 60;
    }
    
    // Calculate time remaining from elapsed time
    const timeRemaining = Math.max(0, baseScore - timeElapsed);
    
    // Score calculation logic: award points based on time remaining
    const timeBasedPoints = Math.max(0, Math.round(timeRemaining));
    const finalScore = Math.round(timeBasedPoints * multiplier);
    
    console.log(`Backend score calculation: isCorrect=${isCorrect}, timeElapsed=${timeElapsed}s, multiplier=${multiplier}x, baseScore=${baseScore}, timeRemaining=${timeRemaining}s, finalScore=${finalScore}`);
    
    return finalScore;
}

// Helper function to validate answer against question
function validateAnswer(question, playerAnswer) {
    if (!question || question.correct === undefined || question.correct === null) {
        return false;
    }
    
    // Handle different question types
    switch (question.type) {
        case 'multiple_choice':
            return playerAnswer === question.correct;
        case 'true_false':
            return playerAnswer === question.correct;
        default:
            return playerAnswer === question.correct;
    }
}

// Helper function to process scores for all players after question ends
async function processQuestionScores(lobbyCode) {
    try {
        // Get current question and lobby info
        const lobbyResult = await query(
            'SELECT current_question, question_start_time FROM lobbies WHERE code = $1',
            [lobbyCode]
        );
        
        if (lobbyResult.rows.length === 0) return;
        
        const lobby = lobbyResult.rows[0];
        const questionStartTime = new Date(lobby.question_start_time);
        
        // Get current question data
        const questionResult = await query(
            'SELECT * FROM lobby_questions WHERE lobby_code = $1 AND question_index = $2',
            [lobbyCode, lobby.current_question]
        );
        
        if (questionResult.rows.length === 0) return;
        
        const questionRow = questionResult.rows[0];
        let question;
        try {
            question = typeof questionRow.question_data === 'string' 
                ? JSON.parse(questionRow.question_data) 
                : questionRow.question_data;
        } catch (parseError) {
            console.error('Error parsing question data in processQuestionScores:', parseError);
            question = questionRow.question_data;
        }
        
        // Get all player answers for this question
        const playersResult = await query(
            'SELECT username, current_answer, answered, multiplier, answer_time FROM lobby_players WHERE lobby_code = $1',
            [lobbyCode]
        );
        
                // Process each player's score
        for (const player of playersResult.rows) {
            if (!player.answered || !player.current_answer) continue;

            try {
                const playerAnswer = JSON.parse(player.current_answer);
                const isCorrect = validateAnswer(question, playerAnswer);
                const currentMultiplier = player.multiplier || 1;

                if (isCorrect) {
                    // Calculate time elapsed using actual answer submission time or fallback to current time
                    let timeElapsed;
                    if (player.answer_time) {
                        const answerTime = new Date(player.answer_time);
                        timeElapsed = Math.floor((answerTime.getTime() - questionStartTime.getTime()) / 1000);
                        console.log(`Score calculation debug: questionStartTime=${questionStartTime.toISOString()}, answerTime=${answerTime.toISOString()}, timeElapsed=${timeElapsed}s`);
                    } else {
                        // Fallback to current time if answer_time is not available
                        timeElapsed = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
                        console.log(`Score calculation fallback: questionStartTime=${questionStartTime.toISOString()}, currentTime=${new Date().toISOString()}, timeElapsed=${timeElapsed}s`);
                    }
                    
                    const points = calculateScore(true, timeElapsed, currentMultiplier);
                    console.log(`Final score calculation: timeElapsed=${timeElapsed}s, multiplier=${currentMultiplier}x, points=${points}`);

                    // Increase multiplier (max 5)
                    const newMultiplier = Math.min(5, currentMultiplier + 1);

                    // Update player score and multiplier
                    await query(
                        'UPDATE lobby_players SET score = score + $1, multiplier = $2 WHERE lobby_code = $3 AND username = $4',
                        [points, newMultiplier, lobbyCode, player.username]
                    );

                    console.log(`Player ${player.username} scored ${points} points (correct answer, ${timeElapsed}s, multiplier: ${currentMultiplier} -> ${newMultiplier})`);
                } else {
                    // Reset multiplier to 1 on wrong answer
                    await query(
                        'UPDATE lobby_players SET multiplier = 1 WHERE lobby_code = $1 AND username = $2',
                        [lobbyCode, player.username]
                    );

                    if (currentMultiplier > 1) {
                        console.log(`Player ${player.username} got wrong answer - COMBO BREAKER! Multiplier reset from ${currentMultiplier} to 1`);
                    } else {
                        console.log(`Player ${player.username} got wrong answer with no multiplier stacks lost (was already at 1x)`);
                    }
                }
            } catch (error) {
                console.error(`Error processing score for player ${player.username}:`, error);
            }
        }
        
    } catch (error) {
        console.error('Error processing question scores:', error);
    }
}

// Helper function to check if question should auto-advance
async function checkQuestionProgression(lobbyCode) {
    try {
        const lobby = await getLobbyData(lobbyCode);
        if (!lobby || !lobby.started || lobby.game_phase !== 'question') {
            return;
        }

        // Check if all players have answered
        const progressResult = await query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN answered THEN 1 ELSE 0 END) as answered FROM lobby_players WHERE lobby_code = $1',
            [lobbyCode]
        );

        const { total, answered } = progressResult.rows[0];
        const allAnswered = parseInt(answered) === parseInt(total);

        // Check if time has run out (60 seconds)
        const questionStartTime = new Date(lobby.question_start_time);
        const timeElapsed = (Date.now() - questionStartTime.getTime()) / 1000;
        const timeExpired = timeElapsed >= 60; // 60 seconds question time

        if (allAnswered || timeExpired) {
            console.log(`Auto-advancing question for lobby ${lobbyCode}: allAnswered=${allAnswered}, timeExpired=${timeExpired}`);
            
            await query('BEGIN');
            
            try {
                // IMPORTANT: Process scores for the current question before advancing
                await processQuestionScores(lobbyCode);
                
                // Get total number of questions
                const questionsResult = await query(
                    'SELECT COUNT(*) FROM lobby_questions WHERE lobby_code = $1',
                    [lobbyCode]
                );

                const totalQuestions = parseInt(questionsResult.rows[0].count);
                const nextQuestion = lobby.current_question + 1;

                if (nextQuestion >= totalQuestions) {
                    // Game is finished - set to post-game phase instead of finished
                    await query(
                        'UPDATE lobbies SET game_phase = $1 WHERE code = $2',
                        ['post-game', lobbyCode]
                    );
                    console.log(`Game finished for lobby ${lobbyCode}, entering post-game phase`);
                } else {
                    // Move to next question
                    const startTime = new Date();
                    await query(
                        'UPDATE lobbies SET current_question = $1, game_phase = $2, question_start_time = $3 WHERE code = $4',
                        [nextQuestion, 'question', startTime, lobbyCode]
                    );

                    // Reset all players' answer state for the new question
                    await query(
                        'UPDATE lobby_players SET answered = FALSE, current_answer = NULL WHERE lobby_code = $1',
                        [lobbyCode]
                    );
                    
                    console.log(`Advanced to question ${nextQuestion} for lobby ${lobbyCode}`);
                }

                await query('COMMIT');
                
            } catch (error) {
                await query('ROLLBACK');
                throw error;
            }
        }
    } catch (error) {
        console.error('Error checking question progression:', error);
        try {
            await query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
    }
}

// Start automatic question progression checker with enhanced responsiveness
setInterval(async () => {
    try {
        // Get all active games
        const activeGamesResult = await query(
            'SELECT code FROM lobbies WHERE started = TRUE AND game_phase = $1',
            ['question']
        );

        // Check each active game for progression
        for (const game of activeGamesResult.rows) {
            await checkQuestionProgression(game.code);
        }
    } catch (error) {
        console.error('Error in automatic question progression:', error);
    }
}, 500); // Check every 500ms for ultra-responsive question transitions

// Create a new lobby
router.post('/create', async (req, res) => {
    try {
        const host = req.user.username;
        const { character, question_set_id } = req.body;
        
        if (!character) {
            return res.status(400).json({ 
                error: 'Missing character selection',
                code: 'MISSING_CHARACTER'
            });
        }

        // Validate and get question set if provided
        let questionSet = null;
        if (question_set_id) {
            const questionSetResult = await query(
                'SELECT id, name, questions FROM question_sets WHERE id = $1',
                [question_set_id]
            );
            
            if (questionSetResult.rows.length === 0) {
                return res.status(400).json({
                    error: 'Invalid question set ID',
                    code: 'INVALID_QUESTION_SET'
                });
            }
            questionSet = questionSetResult.rows[0];
        }

        // Generate unique lobby code
        let code;
        let exists;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            code = generateLobbyCode();
            const result = await query('SELECT code FROM lobbies WHERE code = $1', [code]);
            exists = result.rows.length > 0;
            attempts++;
        } while (exists && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            return res.status(500).json({ 
                error: 'Failed to generate unique lobby code',
                code: 'LOBBY_CODE_GENERATION_FAILED'
            });
        }

        await query('BEGIN');

        try {
            // Create lobby
            if (question_set_id) {
                await query(
                    'INSERT INTO lobbies (code, host, question_set_id) VALUES ($1, $2, $3)',
                    [code, host, question_set_id]
                );
            } else {
                await query(
                    'INSERT INTO lobbies (code, host) VALUES ($1, $2)',
                    [code, host]
                );
            }

            // Add host as player
            await query(
                'INSERT INTO lobby_players (lobby_code, username, character, is_host) VALUES ($1, $2, $3, true)',
                [code, host, character]
            );

            // **FIX: Load questions if question set is provided**
            if (questionSet && questionSet.questions) {
                const questions = typeof questionSet.questions === 'string' 
                    ? JSON.parse(questionSet.questions) 
                    : questionSet.questions;
                
                for (let i = 0; i < questions.length; i++) {
                    await query(
                        'INSERT INTO lobby_questions (lobby_code, question_index, question_data) VALUES ($1, $2, $3)',
                        [code, i, JSON.stringify(questions[i])]
                    );
                }
                console.log(`Loaded ${questions.length} questions for lobby ${code}`);
            }

            await query('COMMIT');

            const lobby = await getLobbyData(code);
            
            // Broadcast lobby creation (for lobby list updates)
            websocketService.broadcastLobbyUpdate(code, lobby);
            
            res.json(lobby);

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Create lobby error:', error);
        res.status(500).json({ 
            error: 'Failed to create lobby',
            code: 'LOBBY_CREATION_FAILED',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all active lobbies
router.get('/list', async (req, res) => {
    try {
        // Clean up inactive lobbies before listing
        await cleanupInactiveLobbies();
        
        const result = await query(`
            SELECT l.*, 
                   json_agg(json_build_object(
                       'username', lp.username,
                       'character', lp.character,
                       'is_host', lp.is_host
                   )) as players
            FROM lobbies l
            JOIN lobby_players lp ON l.code = lp.lobby_code
            WHERE l.started = false AND l.game_phase = 'waiting'
            GROUP BY l.code
            ORDER BY l.created_at DESC
        `);

        res.json(result.rows.map(row => ({
            ...row,
            players: row.players || []
        })));
    } catch (error) {
        console.error('List lobbies error:', error);
        res.status(500).json({ error: 'Failed to list lobbies' });
    }
});

// Get specific lobby - MISSING ENDPOINT
router.get('/:code', async (req, res) => {
    try {
        const lobby = await getLobbyData(req.params.code);
        if (!lobby) {
            return res.status(404).json({ error: 'Lobby not found' });
        }
        res.json(lobby);
    } catch (error) {
        console.error('Get lobby error:', error);
        res.status(500).json({ error: 'Failed to get lobby' });
    }
});

// Update/Set lobby data - MISSING ENDPOINT
router.put('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const lobbyData = req.body;
        
        // Check if lobby exists
        const existingLobby = await getLobbyData(code);
        if (!existingLobby) {
            return res.status(404).json({ error: 'Lobby not found' });
        }
        
        // Update lobby data
        await query('BEGIN');
        
        try {
            // Update main lobby fields if provided
            if (lobbyData.started !== undefined || lobbyData.game_phase !== undefined || lobbyData.catalog !== undefined) {
                await query(
                    `UPDATE lobbies SET 
                     started = COALESCE($2, started),
                     game_phase = COALESCE($3, game_phase),
                     catalog = COALESCE($4, catalog)
                     WHERE code = $1`,
                    [code, lobbyData.started, lobbyData.game_phase, lobbyData.catalog]
                );
            }
            
            // Update players if provided
            if (lobbyData.players) {
                // Clear existing players and re-insert
                await query('DELETE FROM lobby_players WHERE lobby_code = $1', [code]);
                
                for (const [username, player] of Object.entries(lobbyData.players)) {
                    await query(
                        `INSERT INTO lobby_players (lobby_code, username, character, score, current_answer, answered, ready, is_host)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [code, username, player.character, player.score || 0, player.current_answer, 
                         player.answered || false, player.ready || false, player.is_host || false]
                    );
                }
            }
            
            // Update questions if provided
            if (lobbyData.questions) {
                // Clear existing questions and re-insert
                await query('DELETE FROM lobby_questions WHERE lobby_code = $1', [code]);
                
                lobbyData.questions.forEach(async (question, index) => {
                    await query(
                        'INSERT INTO lobby_questions (lobby_code, question_index, question_data) VALUES ($1, $2, $3)',
                        [code, index, JSON.stringify(question)]
                    );
                });
            }
            
            await query('COMMIT');
            
            // Return updated lobby data
            const updatedLobby = await getLobbyData(code);
            res.json(updatedLobby);
            
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
        
    } catch (error) {
        console.error('Update lobby error:', error);
        res.status(500).json({ error: 'Failed to update lobby' });
    }
});

// Delete lobby - MISSING ENDPOINT
router.delete('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        // Check if lobby exists
        const lobby = await getLobbyData(code);
        if (!lobby) {
            return res.status(404).json({ error: 'Lobby not found' });
        }
        
        // Check if user is the host
        const isHost = lobby.players.some(player => 
            player.username === req.user.username && player.is_host
        );
        
        if (!isHost) {
            return res.status(403).json({ 
                error: 'Only the host can delete the lobby',
                code: 'NOT_HOST'
            });
        }
        
        // Delete lobby (cascade will handle related tables)
        await query('DELETE FROM lobbies WHERE code = $1', [code]);
        
        res.json({ message: 'Lobby deleted successfully' });
        
    } catch (error) {
        console.error('Delete lobby error:', error);
        res.status(500).json({ error: 'Failed to delete lobby' });
    }
});

// Join lobby
router.post('/:code/join', async (req, res) => {
    try {
        const { character } = req.body;
        const username = req.user.username;
        
        if (!character) {
            return res.status(400).json({ error: 'Missing character selection' });
        }

        await query('BEGIN');

        // Check if lobby exists and get its status
        const lobbyResult = await query(
            'SELECT started FROM lobbies WHERE code = $1',
            [req.params.code]
        );

        if (lobbyResult.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(404).json({ error: 'Lobby not found' });
        }

        if (lobbyResult.rows[0].started) {
            await query('ROLLBACK');
            return res.status(400).json({ error: 'Game already in progress' });
        }

        // Check player count
        const playerCountResult = await query(
            'SELECT COUNT(*) as count FROM lobby_players WHERE lobby_code = $1',
            [req.params.code]
        );

        if (playerCountResult.rows[0].count >= 8) {
            await query('ROLLBACK');
            return res.status(400).json({ error: 'Lobby is full' });
        }

        // Check if player already in lobby
        const playerResult = await query(
            'SELECT username FROM lobby_players WHERE lobby_code = $1 AND username = $2',
            [req.params.code, username]
        );

        if (playerResult.rows.length > 0) {
            await query('ROLLBACK');
            return res.status(400).json({ error: 'Player already in lobby' });
        }

        // Add player to lobby
        await query(
            'INSERT INTO lobby_players (lobby_code, username, character) VALUES ($1, $2, $3)',
            [req.params.code, username, character]
        );

        await query('COMMIT');

        // Get updated lobby data
        const lobby = await getLobbyData(req.params.code);
        
        // Broadcast lobby update to all users in the lobby
        websocketService.broadcastLobbyUpdate(req.params.code, lobby);
        
        res.json(lobby);

    } catch (error) {
        await query('ROLLBACK');
        console.error('Join lobby error:', error);
        res.status(500).json({ error: 'Failed to join lobby' });
    }
});

// Leave lobby
router.post('/:code/leave', async (req, res) => {
    try {
        const username = req.user.username;
        const { code } = req.params;

        await query('BEGIN');

        // Check if lobby exists and get current state
        const lobbyResult = await query(
            'SELECT host, started FROM lobbies WHERE code = $1',
            [code]
        );

        if (lobbyResult.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(404).json({ error: 'Lobby not found' });
        }

        const { host: currentHost, started } = lobbyResult.rows[0];
        const isHost = currentHost === username;

        // Check if player is actually in the lobby
        const playerCheck = await query(
            'SELECT username FROM lobby_players WHERE lobby_code = $1 AND username = $2',
            [code, username]
        );

        if (playerCheck.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(400).json({ error: 'Player not in lobby' });
        }

        // Remove player from lobby
        await query(
            'DELETE FROM lobby_players WHERE lobby_code = $1 AND username = $2',
            [code, username]
        );

        // Check remaining players after removal
        const remainingPlayersResult = await query(
            'SELECT username, is_host FROM lobby_players WHERE lobby_code = $1',
            [code]
        );

        if (remainingPlayersResult.rows.length === 0) {
            // No players left, delete the entire lobby
            await query('DELETE FROM lobbies WHERE code = $1', [code]);
            await query('COMMIT');
            console.log(`Lobby ${code} deleted - no players remaining`);
            return res.json({ closed: true, message: 'Lobby closed - no players remaining' });
        }

        // If the leaving player was the host, assign a new host
        if (isHost) {
            const newHost = remainingPlayersResult.rows[0].username;
            
            // Update lobby host
            await query(
                'UPDATE lobbies SET host = $1 WHERE code = $2',
                [newHost, code]
            );
            
            // Update player host status
            await query(
                'UPDATE lobby_players SET is_host = false WHERE lobby_code = $1',
                [code]
            );
            await query(
                'UPDATE lobby_players SET is_host = true WHERE lobby_code = $1 AND username = $2',
                [code, newHost]
            );
            
            console.log(`Host transferred from ${username} to ${newHost} in lobby ${code}`);
        }

        await query('COMMIT');

        // Get updated lobby data
        const lobby = await getLobbyData(code);
        
        // Broadcast lobby update to remaining users in the lobby
        websocketService.broadcastLobbyUpdate(code, lobby);
        
        res.json(lobby);

    } catch (error) {
        await query('ROLLBACK');
        console.error('Leave lobby error:', error);
        res.status(500).json({ error: 'Failed to leave lobby' });
    }
});

// Update player ready status
router.post('/:code/ready', async (req, res) => {
    try {
        const { ready } = req.body;
        const username = req.user.username;
        
        if (ready === undefined) {
            return res.status(400).json({ error: 'Missing ready status' });
        }

        await query('BEGIN');

        // Check if lobby exists
        const lobbyResult = await query(
            'SELECT code FROM lobbies WHERE code = $1',
            [req.params.code]
        );

        if (lobbyResult.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(404).json({ error: 'Lobby not found' });
        }

        // Update player ready status
        const playerResult = await query(
            'UPDATE lobby_players SET ready = $1 WHERE lobby_code = $2 AND username = $3 RETURNING username',
            [ready, req.params.code, username]
        );

        if (playerResult.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(404).json({ error: 'Player not found in lobby' });
        }

        await query('COMMIT');

        // Get updated lobby data
        const lobby = await getLobbyData(req.params.code);
        
        // Broadcast lobby update to all users in the lobby
        websocketService.broadcastLobbyUpdate(req.params.code, lobby);
        
        res.json(lobby);

    } catch (error) {
        await query('ROLLBACK');
        console.error('Update ready status error:', error);
        res.status(500).json({ error: 'Failed to update ready status' });
    }
});

// Set question set for lobby
router.post('/:code/question-set', async (req, res) => {
    try {
        const { code } = req.params;
        const { question_set_id } = req.body;
        const username = req.user.username;

        await query('BEGIN');

        try {
            // Check if lobby exists and user is host
            const lobbyResult = await query(
                'SELECT host, started FROM lobbies WHERE code = $1',
                [code]
            );

            if (lobbyResult.rows.length === 0) {
                await query('ROLLBACK');
                return res.status(404).json({ 
                    error: 'Lobby not found',
                    code: 'LOBBY_NOT_FOUND'
                });
            }

            const lobby = lobbyResult.rows[0];
            if (lobby.host !== username) {
                await query('ROLLBACK');
                return res.status(403).json({ 
                    error: 'Only the host can set question set',
                    code: 'PERMISSION_DENIED'
                });
            }

            if (lobby.started) {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Cannot change question set after game has started',
                    code: 'GAME_ALREADY_STARTED'
                });
            }

            // Validate question set
            const questionSetResult = await query(
                'SELECT id, name, questions FROM question_sets WHERE id = $1',
                [question_set_id]
            );
            
            if (questionSetResult.rows.length === 0) {
                await query('ROLLBACK');
                return res.status(400).json({
                    error: 'Invalid question set ID',
                    code: 'INVALID_QUESTION_SET'
                });
            }

            const questionSet = questionSetResult.rows[0];

            // Update lobby with new question set and reset question count
            await query(
                'UPDATE lobbies SET question_set_id = $1, question_count = NULL WHERE code = $2',
                [question_set_id, code]
            );

            // Delete any existing questions for this lobby
            await query(
                'DELETE FROM lobby_questions WHERE lobby_code = $1',
                [code]
            );

            // Insert all questions from the question set (host will set count later)
            const questions = questionSet.questions;
            for (let i = 0; i < questions.length; i++) {
                await query(
                    'INSERT INTO lobby_questions (lobby_code, question_index, question_data) VALUES ($1, $2, $3)',
                    [code, i, JSON.stringify(questions[i])]
                );
            }

            await query('COMMIT');

            // Get updated lobby data
            const updatedLobby = await getLobbyData(code);
            res.json(updatedLobby);

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Set question set error:', error);
        res.status(500).json({ 
            error: 'Failed to set question set',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Set question count for lobby
router.post('/:code/question-count', async (req, res) => {
    try {
        const { code } = req.params;
        const { question_count } = req.body;
        const username = req.user.username;

        // Validate question count
        if (!question_count || question_count < 1 || question_count > 100) {
            return res.status(400).json({
                error: 'Question count must be between 1 and 100',
                code: 'INVALID_QUESTION_COUNT'
            });
        }

        await query('BEGIN');

        try {
            // Check if lobby exists and user is host
            const lobbyResult = await query(
                'SELECT host, started, question_set_id FROM lobbies WHERE code = $1',
                [code]
            );

            if (lobbyResult.rows.length === 0) {
                await query('ROLLBACK');
                return res.status(404).json({ 
                    error: 'Lobby not found',
                    code: 'LOBBY_NOT_FOUND'
                });
            }

            const lobby = lobbyResult.rows[0];
            if (lobby.host !== username) {
                await query('ROLLBACK');
                return res.status(403).json({ 
                    error: 'Only the host can set question count',
                    code: 'PERMISSION_DENIED'
                });
            }

            if (lobby.started) {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Cannot change question count after game has started',
                    code: 'GAME_ALREADY_STARTED'
                });
            }

            if (!lobby.question_set_id) {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Please select a question set first',
                    code: 'NO_QUESTION_SET'
                });
            }

            // Get the question set to check available questions
            const questionSetResult = await query(
                'SELECT questions FROM question_sets WHERE id = $1',
                [lobby.question_set_id]
            );

            if (questionSetResult.rows.length === 0) {
                await query('ROLLBACK');
                return res.status(400).json({
                    error: 'Question set not found',
                    code: 'QUESTION_SET_NOT_FOUND'
                });
            }

            const questionSet = questionSetResult.rows[0];
            const availableQuestions = questionSet.questions;
            const maxQuestions = availableQuestions.length;
            const actualQuestionCount = Math.min(question_count, maxQuestions);

            // Update lobby with question count
            await query(
                'UPDATE lobbies SET question_count = $1 WHERE code = $2',
                [actualQuestionCount, code]
            );

            // Delete existing questions and re-insert with random selection
            await query(
                'DELETE FROM lobby_questions WHERE lobby_code = $1',
                [code]
            );

            // Randomly select questions
            const shuffledQuestions = [...availableQuestions].sort(() => Math.random() - 0.5);
            const selectedQuestions = shuffledQuestions.slice(0, actualQuestionCount);

            // Insert selected questions
            for (let i = 0; i < selectedQuestions.length; i++) {
                await query(
                    'INSERT INTO lobby_questions (lobby_code, question_index, question_data) VALUES ($1, $2, $3)',
                    [code, i, JSON.stringify(selectedQuestions[i])]
                );
            }

            await query('COMMIT');

            // Get updated lobby data
            const updatedLobby = await getLobbyData(code);
            res.json({
                ...updatedLobby,
                message: actualQuestionCount < question_count 
                    ? `Only ${maxQuestions} questions available in this set. Using all ${actualQuestionCount} questions.`
                    : `Question count set to ${actualQuestionCount}`
            });

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Set question count error:', error);
        res.status(500).json({ 
            error: 'Failed to set question count',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Start game endpoint
router.post('/:code/start', async (req, res) => {
    try {
        const { code } = req.params;
        const username = req.user.username;

        await query('BEGIN');

        try {
            // Check if lobby exists and user is host
            const lobbyResult = await query(
                'SELECT host, started, question_set_id FROM lobbies WHERE code = $1',
                [code]
            );

            if (lobbyResult.rows.length === 0) {
                await query('ROLLBACK');
                return res.status(404).json({ 
                    error: 'Lobby not found',
                    code: 'LOBBY_NOT_FOUND'
                });
            }

            const lobby = lobbyResult.rows[0];
            if (lobby.host !== username) {
                await query('ROLLBACK');
                return res.status(403).json({ 
                    error: 'Only the host can start the game',
                    code: 'PERMISSION_DENIED'
                });
            }

            if (lobby.started) {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Game has already started',
                    code: 'GAME_ALREADY_STARTED'
                });
            }

            if (!lobby.question_set_id) {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'No question set selected',
                    code: 'NO_QUESTION_SET'
                });
            }

            // Check if question count is set
            const questionCountResult = await query(
                'SELECT question_count FROM lobbies WHERE code = $1',
                [code]
            );
            
            if (!questionCountResult.rows[0].question_count) {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Please set the number of questions first',
                    code: 'NO_QUESTION_COUNT'
                });
            }

            // Check if there are enough players
            const playersResult = await query(
                'SELECT COUNT(*) FROM lobby_players WHERE lobby_code = $1',
                [code]
            );

            const playerCount = parseInt(playersResult.rows[0].count);
            if (playerCount < 1) {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Not enough players to start the game',
                    code: 'NOT_ENOUGH_PLAYERS'
                });
            }

            // Update lobby to started state
            const startTime = new Date();
            await query(
                'UPDATE lobbies SET started = TRUE, game_phase = $1, current_question = 0, question_start_time = $2 WHERE code = $3',
                ['question', startTime, code]
            );

            // Reset all players' answer state for the first question
            await query(
                'UPDATE lobby_players SET answered = FALSE, current_answer = NULL WHERE lobby_code = $1',
                [code]
            );

            await query('COMMIT');

            // Get updated lobby data
            const updatedLobby = await getLobbyData(code);
            
            // Broadcast game start to all users in the lobby
            websocketService.broadcastGameUpdate(code, updatedLobby);
            
            res.json(updatedLobby);

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Start game error:', error);
        res.status(500).json({ 
            error: 'Failed to start game',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Submit answer endpoint
router.post('/:code/answer', async (req, res) => {
    try {
        const { code } = req.params;
        const { answer } = req.body;
        const username = req.user.username;

        if (answer === undefined || answer === null) {
            return res.status(400).json({ 
                error: 'Answer is required',
                code: 'MISSING_ANSWER'
            });
        }

        // Validate answer format and value
        if (typeof answer !== 'number' && typeof answer !== 'boolean') {
            return res.status(400).json({ 
                error: 'Answer must be a number or boolean',
                code: 'INVALID_ANSWER_TYPE'
            });
        }

        await query('BEGIN');

        try {
            // Check if lobby exists and game is in progress
            const lobbyResult = await query(
                'SELECT started, current_question, game_phase FROM lobbies WHERE code = $1',
                [code]
            );

            if (lobbyResult.rows.length === 0) {
                await query('ROLLBACK');
                return res.status(404).json({ 
                    error: 'Lobby not found',
                    code: 'LOBBY_NOT_FOUND'
                });
            }

            const lobby = lobbyResult.rows[0];
            if (!lobby.started) {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Game has not started',
                    code: 'GAME_NOT_STARTED'
                });
            }

            if (lobby.game_phase !== 'question') {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Not currently accepting answers',
                    code: 'NOT_QUESTION_PHASE'
                });
            }

            // Check if player is in the lobby
            const playerResult = await query(
                'SELECT answered FROM lobby_players WHERE lobby_code = $1 AND username = $2',
                [code, username]
            );

            if (playerResult.rows.length === 0) {
                await query('ROLLBACK');
                return res.status(404).json({ 
                    error: 'Player not found in lobby',
                    code: 'PLAYER_NOT_FOUND'
                });
            }

            if (playerResult.rows[0].answered) {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Already answered this question',
                    code: 'ALREADY_ANSWERED'
                });
            }

            // Get question start time for scoring
            const questionStartResult = await query(
                'SELECT question_start_time FROM lobbies WHERE code = $1',
                [code]
            );
            const questionStartTime = new Date(questionStartResult.rows[0].question_start_time);
            const answerSubmissionTime = new Date();
            
            // Check if answer is submitted within time limit (60 seconds)
            const timeElapsed = Math.floor((answerSubmissionTime.getTime() - questionStartTime.getTime()) / 1000);
            if (timeElapsed > 60) {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Answer submitted too late - time limit exceeded',
                    code: 'TIME_LIMIT_EXCEEDED',
                    timeElapsed: timeElapsed
                });
            }
            
            // Submit the answer with timestamp - handle cases where answer_time column doesn't exist yet
            try {
                await query(
                    'UPDATE lobby_players SET current_answer = $1, answered = TRUE, answer_time = $2 WHERE lobby_code = $3 AND username = $4',
                    [JSON.stringify(answer), answerSubmissionTime, code, username]
                );
            } catch (columnError) {
                // Fallback if answer_time column doesn't exist yet
                console.warn('answer_time column not found, using fallback approach:', columnError.message);
                await query(
                    'UPDATE lobby_players SET current_answer = $1, answered = TRUE WHERE lobby_code = $2 AND username = $3',
                    [JSON.stringify(answer), code, username]
                );
            }

            // Get current question to validate answer for immediate feedback
            const questionResult = await query(
                'SELECT * FROM lobby_questions WHERE lobby_code = $1 AND question_index = $2',
                [code, lobby.current_question]
            );

            let isCorrect = false;
            let correctAnswer = null;
            
            if (questionResult.rows.length > 0) {
                const questionRow = questionResult.rows[0];
                let question;
                try {
                    question = typeof questionRow.question_data === 'string' 
                        ? JSON.parse(questionRow.question_data) 
                        : questionRow.question_data;
                } catch (parseError) {
                    console.error('Error parsing question data:', parseError);
                    question = questionRow.question_data;
                }
                
                if (!question || !question.type) {
                    await query('ROLLBACK');
                    return res.status(500).json({ 
                        error: 'Question data is corrupted or missing',
                        code: 'QUESTION_DATA_ERROR'
                    });
                }
                
                // Enhanced answer validation based on question type
                if (question.type === 'multiple_choice') {
                    // Ensure we have valid options array
                    if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
                        await query('ROLLBACK');
                        return res.status(500).json({ 
                            error: 'Question options are missing or invalid',
                            code: 'QUESTION_OPTIONS_ERROR'
                        });
                    }
                    
                    const maxAnswer = question.options.length - 1;
                    
                    // Strict validation for multiple choice answers
                    if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer > maxAnswer) {
                        await query('ROLLBACK');
                        return res.status(400).json({ 
                            error: `Answer must be an integer between 0 and ${maxAnswer} for multiple choice questions (got: ${answer})`,
                            code: 'INVALID_ANSWER_RANGE',
                            validRange: { min: 0, max: maxAnswer },
                            receivedAnswer: answer,
                            receivedType: typeof answer
                        });
                    }
                } else if (question.type === 'true_false') {
                    // Strict validation for true/false answers
                    const isValidBoolean = typeof answer === 'boolean';
                    const isValidNumber = (answer === 0 || answer === 1) && Number.isInteger(answer);
                    
                    if (!isValidBoolean && !isValidNumber) {
                        await query('ROLLBACK');
                        return res.status(400).json({ 
                            error: `Answer must be true/false (boolean) or 0/1 (integer) for true/false questions (got: ${answer})`,
                            code: 'INVALID_ANSWER_TYPE',
                            receivedAnswer: answer,
                            receivedType: typeof answer
                        });
                    }
                } else {
                    // For any other question types, ensure answer is reasonable
                    if (typeof answer !== 'number' && typeof answer !== 'boolean') {
                        await query('ROLLBACK');
                        return res.status(400).json({ 
                            error: `Answer must be a number or boolean for ${question.type} questions`,
                            code: 'INVALID_ANSWER_TYPE'
                        });
                    }
                }
                
                isCorrect = validateAnswer(question, answer);
                correctAnswer = question ? question.correct : null;
            } else {
                // No question found - this should not happen in a properly functioning game
                await query('ROLLBACK');
                return res.status(500).json({ 
                    error: 'Current question not found',
                    code: 'QUESTION_NOT_FOUND'
                });
            }

            // Check if all players have answered
            const allPlayersResult = await query(
                'SELECT COUNT(*) as total, SUM(CASE WHEN answered THEN 1 ELSE 0 END) as answered FROM lobby_players WHERE lobby_code = $1',
                [code]
            );

            const { total, answered } = allPlayersResult.rows[0];
            const allAnswered = parseInt(answered) === parseInt(total);

            await query('COMMIT');

            // Get updated lobby data for broadcasting
            const updatedLobby = await getLobbyData(code);
            
            // Broadcast game state update to all users in the game
            websocketService.broadcastGameUpdate(code, updatedLobby);

            // Return result with sync info and immediate feedback
            res.json({
                success: true,
                isCorrect,
                correctAnswer,
                allAnswered,
                playersAnswered: parseInt(answered),
                totalPlayers: parseInt(total)
            });

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ 
            error: 'Failed to submit answer',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Next question endpoint
router.post('/:code/next-question', async (req, res) => {
    try {
        const { code } = req.params;
        const username = req.user.username;

        await query('BEGIN');

        try {
            // Check if lobby exists and user is host
            const lobbyResult = await query(
                'SELECT host, started, current_question, game_phase FROM lobbies WHERE code = $1',
                [code]
            );

            if (lobbyResult.rows.length === 0) {
                await query('ROLLBACK');
                return res.status(404).json({ 
                    error: 'Lobby not found',
                    code: 'LOBBY_NOT_FOUND'
                });
            }

            const lobby = lobbyResult.rows[0];
            if (lobby.host !== username) {
                await query('ROLLBACK');
                return res.status(403).json({ 
                    error: 'Only the host can advance questions',
                    code: 'PERMISSION_DENIED'
                });
            }

            if (!lobby.started) {
                await query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Game has not started',
                    code: 'GAME_NOT_STARTED'
                });
            }

            // Get total number of questions
            const questionsResult = await query(
                'SELECT COUNT(*) FROM lobby_questions WHERE lobby_code = $1',
                [code]
            );

            const totalQuestions = parseInt(questionsResult.rows[0].count);
            const nextQuestion = lobby.current_question + 1;

            if (nextQuestion >= totalQuestions) {
                // Game is finished - set to post-game phase instead of finished
                await query(
                    'UPDATE lobbies SET game_phase = $1 WHERE code = $2',
                    ['post-game', code]
                );
            } else {
                // Move to next question
                const startTime = new Date();
                await query(
                    'UPDATE lobbies SET current_question = $1, game_phase = $2, question_start_time = $3 WHERE code = $4',
                    [nextQuestion, 'question', startTime, code]
                );

                // Reset all players' answer state for the new question
                await query(
                    'UPDATE lobby_players SET answered = FALSE, current_answer = NULL WHERE lobby_code = $1',
                    [code]
                );
            }

            await query('COMMIT');

            // Get updated lobby data
            const updatedLobby = await getLobbyData(code);
            res.json(updatedLobby);

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Next question error:', error);
        res.status(500).json({ 
            error: 'Failed to advance to next question',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Get game state endpoint for synchronization
router.get('/:code/game-state', async (req, res) => {
    try {
        const { code } = req.params;

        // Get current game state
        const lobby = await getLobbyData(code);
        
        if (!lobby) {
            return res.status(404).json({ 
                error: 'Lobby not found',
                code: 'LOBBY_NOT_FOUND'
            });
        }

        // Get answer progress for current question
        const progressResult = await query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN answered THEN 1 ELSE 0 END) as answered FROM lobby_players WHERE lobby_code = $1',
            [code]
        );

        const { total, answered } = progressResult.rows[0];

        // Calculate precise timing information for better synchronization
        let timeRemaining = 60; // Default 60 seconds
        let questionStartTime = null;
        
        if (lobby.question_start_time && lobby.game_phase === 'question') {
            questionStartTime = new Date(lobby.question_start_time);
            const elapsed = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
            timeRemaining = Math.max(0, 60 - elapsed);
        }

        res.json({
            ...lobby,
            answerProgress: {
                answered: parseInt(answered),
                total: parseInt(total),
                allAnswered: parseInt(answered) === parseInt(total)
            },
            timing: {
                questionStartTime: questionStartTime ? questionStartTime.toISOString() : null,
                timeRemaining,
                serverTime: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Get game state error:', error);
        res.status(500).json({ 
            error: 'Failed to get game state',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Return to lobby after game ends
router.post('/:code/return-to-lobby', async (req, res) => {
    try {
        const { code } = req.params;
        const username = req.user.username;

        await query('BEGIN');

        // Get lobby data
        const lobbyResult = await query(
            'SELECT host, game_phase, started FROM lobbies WHERE code = $1',
            [code]
        );

        if (lobbyResult.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(404).json({ 
                error: 'Lobby not found',
                code: 'LOBBY_NOT_FOUND'
            });
        }

        const lobby = lobbyResult.rows[0];

        // Check if game is in post-game phase
        if (lobby.game_phase !== 'post-game') {
            await query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Game is not in post-game phase',
                code: 'INVALID_GAME_PHASE'
            });
        }

        // Check if user is the host
        const isHost = lobby.host === username;
        if (!isHost) {
            await query('ROLLBACK');
            return res.status(403).json({ 
                error: 'Only the host can return to lobby first',
                code: 'NOT_HOST'
            });
        }

        // Reset lobby to waiting state
        await query(
            `UPDATE lobbies SET 
                game_phase = 'waiting', 
                started = FALSE, 
                current_question = 0, 
                question_start_time = NULL,
                last_activity = CURRENT_TIMESTAMP
            WHERE code = $1`,
            [code]
        );

        // Reset all players' game state but keep them in the lobby
        await query(
            `UPDATE lobby_players SET 
                score = 0, 
                multiplier = 1, 
                current_answer = NULL, 
                answered = FALSE, 
                ready = FALSE
            WHERE lobby_code = $1`,
            [code]
        );

        // Clear lobby questions for potential new game
        await query(
            'DELETE FROM lobby_questions WHERE lobby_code = $1',
            [code]
        );

        await query('COMMIT');

        // Get updated lobby data
        const updatedLobby = await getLobbyData(code);
        res.json({
            ...updatedLobby,
            message: 'Returned to lobby successfully',
            hostReturned: true
        });

    } catch (error) {
        await query('ROLLBACK');
        console.error('Return to lobby error:', error);
        res.status(500).json({ 
            error: 'Failed to return to lobby',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Allow other players to return to lobby after host has returned
router.post('/:code/rejoin-lobby', async (req, res) => {
    try {
        const { code } = req.params;
        const username = req.user.username;

        await query('BEGIN');

        // Get lobby data
        const lobbyResult = await query(
            'SELECT game_phase, started FROM lobbies WHERE code = $1',
            [code]
        );

        if (lobbyResult.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(404).json({ 
                error: 'Lobby not found',
                code: 'LOBBY_NOT_FOUND'
            });
        }

        const lobby = lobbyResult.rows[0];

        // Check if lobby is in waiting state (host has returned)
        if (lobby.game_phase !== 'waiting' || lobby.started) {
            await query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Lobby is not available for rejoining',
                code: 'LOBBY_NOT_AVAILABLE'
            });
        }

        // Check if player is already in the lobby
        const playerResult = await query(
            'SELECT username FROM lobby_players WHERE lobby_code = $1 AND username = $2',
            [code, username]
        );

        if (playerResult.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Player was not in the original game',
                code: 'PLAYER_NOT_IN_GAME'
            });
        }

        // Player is already in the lobby, just return the lobby data
        await query('COMMIT');

        // Get updated lobby data
        const updatedLobby = await getLobbyData(code);
        res.json({
            ...updatedLobby,
            message: 'Rejoined lobby successfully'
        });

    } catch (error) {
        await query('ROLLBACK');
        console.error('Rejoin lobby error:', error);
        res.status(500).json({ 
            error: 'Failed to rejoin lobby',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Manual cleanup endpoint (for admin/maintenance)
router.post('/cleanup', async (req, res) => {
    try {
        const cleanedCount = await cleanupInactiveLobbies();
        res.json({ 
            message: 'Lobby cleanup completed',
            cleaned: cleanedCount
        });
    } catch (error) {
        console.error('Cleanup lobbies error:', error);
        res.status(500).json({ error: 'Failed to cleanup lobbies' });
    }
});

// Debug endpoint to check lobby state
router.get('/:code/debug', async (req, res) => {
    try {
        const { code } = req.params;
        
        // Get raw lobby data
        const lobbyResult = await query(
            'SELECT * FROM lobbies WHERE code = $1',
            [code]
        );
        
        // Get players
        const playersResult = await query(
            'SELECT * FROM lobby_players WHERE lobby_code = $1',
            [code]
        );
        
        // Get questions
        const questionsResult = await query(
            'SELECT * FROM lobby_questions WHERE lobby_code = $1 ORDER BY question_index',
            [code]
        );
        
        // Get question set info
        let questionSetInfo = null;
        if (lobbyResult.rows.length > 0 && lobbyResult.rows[0].question_set_id) {
            const qsResult = await query(
                'SELECT id, name, question_count, questions FROM question_sets WHERE id = $1',
                [lobbyResult.rows[0].question_set_id]
            );
            questionSetInfo = qsResult.rows[0] || null;
        }
        
        res.json({
            lobby: lobbyResult.rows[0] || null,
            players: playersResult.rows,
            questions: questionsResult.rows,
            questionSet: questionSetInfo,
            debug: {
                lobbyExists: lobbyResult.rows.length > 0,
                questionCount: questionsResult.rows.length,
                hasQuestionSet: !!questionSetInfo,
                currentQuestion: lobbyResult.rows[0]?.current_question,
                gamePhase: lobbyResult.rows[0]?.game_phase,
                started: lobbyResult.rows[0]?.started
            }
        });
        
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
