// backend/routes/lobby.js - Fixed version with missing endpoints
const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const QuestionSet = require('../models/QuestionSet');

// Apply authentication middleware to all lobby routes
router.use(authenticateToken);

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
                           (emptyResult.rowCount || 0) + (veryOldResult.rowCount || 0);
        
        if (totalCleaned > 0) {
            console.log(`Cleaned up ${totalCleaned} inactive/empty lobbies`);
        }
        
        return totalCleaned;
    } catch (error) {
        console.error('Error cleaning up lobbies:', error);
        return 0;
    }
}

// Helper function to get full lobby data
async function getLobbyData(code) {
    // Update last_activity when lobby is accessed
    await query('UPDATE lobbies SET last_activity = CURRENT_TIMESTAMP WHERE code = $1', [code]);
    
    const result = await query(`
        SELECT l.*,
               qs.name as question_set_name,
               qs.description as question_set_description,
               qs.question_count as question_set_count,
               json_agg(json_build_object(
                   'username', lp.username,
                   'character', lp.character,
                   'score', lp.score,
                   'current_answer', lp.current_answer,
                   'answered', lp.answered,
                   'ready', lp.ready,
                   'is_host', lp.is_host
               )) as players,
               json_agg(lq.question_data ORDER BY lq.question_index) as questions
        FROM lobbies l
        LEFT JOIN lobby_players lp ON l.code = lp.lobby_code
        LEFT JOIN lobby_questions lq ON l.code = lq.lobby_code
        LEFT JOIN question_sets qs ON l.question_set_id = qs.id
        WHERE l.code = $1
        GROUP BY l.code, qs.name, qs.description, qs.question_count
    `, [code]);

    if (result.rows.length === 0) return null;

    const lobby = result.rows[0];
    return {
        ...lobby,
        players: lobby.players[0] ? lobby.players : [],
        questions: lobby.questions[0] ? lobby.questions : [],
        question_set: lobby.question_set_name ? {
            name: lobby.question_set_name,
            description: lobby.question_set_description,
            question_count: lobby.question_set_count
        } : null
    };
}

// Create a new lobby
router.post('/create', async (req, res) => {
    try {
        // Use authenticated user's username
        const host = req.user.username;
        const { character, question_set_id } = req.body;
        
        console.log('Lobby creation request received:');
        console.log('- Host (from token):', host);
        console.log('- Request body:', req.body);
        console.log('- Character from body:', character);
        console.log('- Question set ID:', question_set_id);
        
        if (!character) {
            console.log('Character validation failed - character is:', character);
            return res.status(400).json({ 
                error: 'Missing character selection',
                code: 'MISSING_CHARACTER'
            });
        }

        // Validate question set if provided
        if (question_set_id) {
            const questionSetResult = await query(
                'SELECT id, name FROM question_sets WHERE id = $1',
                [question_set_id]
            );
            
            if (questionSetResult.rows.length === 0) {
                return res.status(400).json({
                    error: 'Invalid question set ID',
                    code: 'INVALID_QUESTION_SET'
                });
            }
        }

        // Generate a unique code
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
            // Create lobby with optional question set
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

            await query('COMMIT');

            // Get full lobby data
            const lobby = await getLobbyData(code);
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
        const { questionSetId } = req.body;
        const username = req.user.username;

        if (!questionSetId) {
            return res.status(400).json({ 
                error: 'Question set ID is required',
                code: 'MISSING_QUESTION_SET_ID'
            });
        }

        await query('BEGIN');

        try {
            // Check if lobby exists and user is host
            const lobbyResult = await query(
                'SELECT host FROM lobbies WHERE code = $1',
                [code]
            );

            if (lobbyResult.rows.length === 0) {
                await query('ROLLBACK');
                return res.status(404).json({ 
                    error: 'Lobby not found',
                    code: 'LOBBY_NOT_FOUND'
                });
            }

            if (lobbyResult.rows[0].host !== username) {
                await query('ROLLBACK');
                return res.status(403).json({ 
                    error: 'Only the host can set the question set',
                    code: 'NOT_HOST'
                });
            }

            // Check if question set exists and user has access
            const questionSet = await QuestionSet.findById(questionSetId);
            if (!questionSet) {
                await query('ROLLBACK');
                return res.status(404).json({ 
                    error: 'Question set not found',
                    code: 'QUESTION_SET_NOT_FOUND'
                });
            }

            // Check if user has access to this question set
            if (!questionSet.is_public && questionSet.created_by !== username) {
                await query('ROLLBACK');
                return res.status(403).json({ 
                    error: 'Access denied to this question set',
                    code: 'QUESTION_SET_ACCESS_DENIED'
                });
            }

            // Update lobby with question set
            await query(
                'UPDATE lobbies SET question_set_id = $1 WHERE code = $2',
                [questionSetId, code]
            );

            // Clear existing questions and add new ones
            await query('DELETE FROM lobby_questions WHERE lobby_code = $1', [code]);

            // Add questions from the question set
            const questions = questionSet.questions;
            for (let i = 0; i < questions.length; i++) {
                await query(
                    'INSERT INTO lobby_questions (lobby_code, question_index, question_data) VALUES ($1, $2, $3)',
                    [code, i, JSON.stringify(questions[i])]
                );
            }

            await query('COMMIT');

            // Get updated lobby data
            const lobby = await getLobbyData(code);
            res.json(lobby);

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Set question set error:', error);
        res.status(500).json({ 
            error: 'Failed to set question set',
            code: 'QUESTION_SET_UPDATE_FAILED'
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

module.exports = router;
