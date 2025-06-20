/**
 * Game Engine Module
 * Handles core game logic and state management with server synchronization
 */

import { GAME_SETTINGS, GAME_PHASES, EVENTS, QUESTION_TYPES } from '../utils/constants.js';
import { calculateScore, getNextMultiplier } from '../utils/helpers.js';
import { initAudioManager } from '../audio/audioManager.js';
import { initAnimations } from '../ui/animations.js';

export function initGameEngine(lobbyManager, questionManager, storage) {
    let currentGame = null;
    let gameStateInterval = null;
    let questionTimer = null;
    // Use global audio manager if available, otherwise create new instance
    const audioManager = window.audioManager || initAudioManager();
    const animations = initAnimations();

    // Add debugging to track instances
    const engineId = Math.random().toString(36).substr(2, 9);
    console.log(`Game engine initialized with ID: ${engineId}`);

    /**
     * Initializes a new game
     * @param {string} lobbyCode - Lobby code
     */
    async function initGame(lobbyCode) {
        try {
            console.log(`[Engine ${engineId}] Initializing game for lobby: ${lobbyCode}`);
            
            // Get initial lobby state
            const lobby = await lobbyManager.getLobby(lobbyCode);
            if (!lobby) {
                throw new Error('Lobby not found');
            }

            console.log(`[Engine ${engineId}] Retrieved lobby data:`, lobby);

            // Initialize game state
            currentGame = {
                lobbyCode,
                phase: lobby.game_phase || GAME_PHASES.WAITING,
                currentQuestion: lobby.current_question || 0,
                scores: {},
                playerMultipliers: {},
                playerAnswers: {},
                hasAnswered: false,
                questionStartTime: null,
                questionEndTime: null,
                playerStreaks: {},
                playerCorrectAnswers: {}, // Track correct answers for Hall of Fame
                totalQuestions: 0
            };

            // Initialize player scores, multipliers, streaks, and correct answer tracking
            if (Array.isArray(lobby.players)) {
                lobby.players.forEach(player => {
                    currentGame.scores[player.username] = player.score || 0;
                    currentGame.playerMultipliers[player.username] = player.multiplier || 1;
                    currentGame.playerStreaks[player.username] = 0;
                    currentGame.playerCorrectAnswers[player.username] = 0;
                });
            }

            // Set total questions from lobby data
            if (lobby.questions && Array.isArray(lobby.questions)) {
                currentGame.totalQuestions = lobby.questions.length;
                console.log(`[Engine ${engineId}] Found ${currentGame.totalQuestions} questions`);
            } else {
                console.warn(`[Engine ${engineId}] No questions found in lobby data:`, lobby);
            }

            console.log(`[Engine ${engineId}] Game initialized for lobby:`, lobbyCode);
            console.log(`[Engine ${engineId}] Current game state:`, currentGame);
            
            // Play game start sound
            try {
                console.log(`[Engine ${engineId}] Playing game start sound`);
                await audioManager.playGameStart();
            } catch (error) {
                console.warn(`[Engine ${engineId}] Failed to play game start sound:`, error);
            }
            
            // Start polling for game state updates
            startGameStatePolling();

            // Force an immediate sync to get the latest game state and start the first question
            console.log(`[Engine ${engineId}] Forcing immediate game state sync...`);
            await syncGameState();

        } catch (error) {
            console.error(`[Engine ${engineId}] Failed to initialize game:`, error);
            throw error;
        }
    }

    /**
     * Starts polling for game state updates during active games
     */
    function startGameStatePolling() {
        stopGameStatePolling();
        
        // Start with 3-second polling to be more conservative with rate limits
        let currentInterval = 3000;
        let rateLimitBackoffCount = 0;
        
        function scheduleNextPoll() {
            gameStateInterval = setTimeout(async () => {
                try {
                    if (currentGame && currentGame.lobbyCode) {
                        await syncGameState();
                        
                        // If successful, gradually reduce interval back to normal (min 2.5s)
                        if (rateLimitBackoffCount > 0) {
                            rateLimitBackoffCount--;
                            currentInterval = Math.max(2500, 3000 + (rateLimitBackoffCount * 1000));
                            console.log(`[Engine] Reducing polling interval to ${currentInterval}ms (backoff: ${rateLimitBackoffCount})`);
                        }
                        
                        scheduleNextPoll();
                    }
                } catch (error) {
                    console.error('Error syncing game state:', error);
                    
                    // Handle rate limiting with exponential backoff
                    if (error.message && error.message.includes('Too Many Requests') || error.message.includes('429')) {
                        rateLimitBackoffCount = Math.min(10, rateLimitBackoffCount + 1);
                        currentInterval = 3000 + (rateLimitBackoffCount * 2000); // Up to 23 seconds
                        console.log(`[Engine] Rate limit hit, increasing polling interval to ${currentInterval}ms (backoff: ${rateLimitBackoffCount})`);
                    }
                    
                    // Continue polling even on error
                    if (currentGame && currentGame.lobbyCode) {
                        scheduleNextPoll();
                    }
                }
            }, currentInterval);
        }
        
        scheduleNextPoll();
    }

    /**
     * Stops polling for game state updates
     */
    function stopGameStatePolling() {
        if (gameStateInterval) {
            clearTimeout(gameStateInterval);
            gameStateInterval = null;
        }
    }

    /**
     * Syncs game state with server
     */
    async function syncGameState() {
        try {
            console.log(`[Engine ${engineId}] 🔄 Syncing game state for lobby: ${currentGame.lobbyCode}`);
            const gameState = await lobbyManager.getGameState(currentGame.lobbyCode);
            
            if (!gameState) {
                console.error(`[Engine ${engineId}] ❌ No game state received`);
                return;
            }

            console.log(`[Engine ${engineId}] ✅ Received game state:`, gameState);

            const previousPhase = currentGame.phase;
            const previousQuestion = currentGame.currentQuestion;

            // Update current game state
            currentGame.phase = gameState.game_phase;
            currentGame.currentQuestion = gameState.current_question;

            console.log(`[Engine ${engineId}] 📊 State transitions:`, {
                phase: `${previousPhase} -> ${currentGame.phase}`,
                question: `${previousQuestion} -> ${currentGame.currentQuestion}`
            });

            // Sync timing from server for accurate synchronization
            if (gameState.timing && gameState.timing.questionStartTime) {
                currentGame.questionStartTime = new Date(gameState.timing.questionStartTime);
                console.log(`[Engine ${engineId}] ⏰ Synced question start time: ${currentGame.questionStartTime.toISOString()}`);
            }

            // Update player scores and multipliers
            if (gameState.players) {
                gameState.players.forEach(player => {
                    currentGame.scores[player.username] = player.score || 0;
                    currentGame.playerMultipliers[player.username] = player.multiplier || 1;
                });
                console.log(`[Engine ${engineId}] 🏆 Updated player scores:`, currentGame.scores);
            }

            // Handle phase transitions
            if (previousPhase !== currentGame.phase) {
                console.log(`[Engine ${engineId}] 🔄 Phase change detected: ${previousPhase} → ${currentGame.phase}`);
                await handlePhaseChange(previousPhase, currentGame.phase, gameState);
            }

            // Handle question transitions
            if (previousQuestion !== currentGame.currentQuestion) {
                console.log(`[Engine ${engineId}] ❓ Question change detected: ${previousQuestion} → ${currentGame.currentQuestion}`);
                await handleQuestionChange(gameState);
            }

            // CRITICAL: Always update UI when in question phase, even without transitions
            if (currentGame.phase === 'question' && gameState.questions && gameState.questions.length > 0) {
                console.log(`[Engine ${engineId}] 🎯 Game is in question phase, ensuring UI is updated`);
                
                // Force UI update with a small delay to ensure screen is ready
                setTimeout(() => {
                    updateQuestionUI(gameState);
                }, 100);
            }

        } catch (error) {
            console.error(`[Engine ${engineId}] ❌ Failed to sync game state:`, error);
        }
    }

    /**
     * Handles phase changes
     */
    async function handlePhaseChange(oldPhase, newPhase, gameState) {
        console.log(`[Engine ${engineId}] Phase changed from ${oldPhase} to ${newPhase}`);

        switch (newPhase) {
            case 'question':
                await startQuestion(gameState);
                break;
            case 'results':
                await showQuestionResults(gameState);
                break;
            case 'finished':
            case 'post-game':
                await endGame(gameState);
                break;
        }
    }

    /**
     * Handles question changes
     */
    async function handleQuestionChange(gameState) {
        console.log(`[Engine ${engineId}] Question changed to ${currentGame.currentQuestion}`);
        
        // Reset answer state for new question
        currentGame.hasAnswered = false;
        currentGame.playerAnswers = {};
        
        if (currentGame.phase === 'question') {
            await startQuestion(gameState);
        }
    }

    /**
     * Starts a new question
     */
    async function startQuestion(gameState) {
        if (!currentGame || !gameState) {
            console.error(`[Engine ${engineId}] startQuestion: missing game or state data`);
            return;
        }

        if (!gameState.questions || !Array.isArray(gameState.questions)) {
            console.error(`[Engine ${engineId}] startQuestion: no questions in game state`, gameState);
            return;
        }

        if (currentGame.currentQuestion >= gameState.questions.length) {
            console.error(`[Engine ${engineId}] startQuestion: question index out of bounds (${currentGame.currentQuestion} >= ${gameState.questions.length})`);
            return;
        }

        const question = gameState.questions[currentGame.currentQuestion];
        console.log(`[Engine ${engineId}] startQuestion: current question:`, question);
        
        if (!question) {
            console.error(`[Engine ${engineId}] startQuestion: question is null or undefined`);
            return;
        }

        currentGame.questionStartTime = gameState.question_start_time ? new Date(gameState.question_start_time) : new Date();

        // Prepare question data for UI with better error handling
        const questionData = {
            // Core question data
            question: question.question || question.text,
            text: question.question || question.text, // Fallback
            type: question.type,
            options: question.options,
            correct: question.correct,
            
            // Game state data
            currentQuestion: currentGame.currentQuestion + 1,
            totalQuestions: gameState.questions.length,
            timeRemaining: calculateTimeRemaining(gameState),
            lobbyCode: currentGame.lobbyCode,
            playerCount: Array.isArray(gameState.players) ? gameState.players.length : Object.keys(gameState.players || {}).length,
            players: gameState.players,
            scores: currentGame.scores,
            multipliers: currentGame.playerMultipliers,
            answerProgress: gameState.answerProgress
        };

        // Validate critical question data before dispatching
        if (!questionData.question && !questionData.text) {
            console.error(`[Engine ${engineId}] startQuestion: No question text found in question data:`, question);
            return;
        }

        if (!questionData.type) {
            console.error(`[Engine ${engineId}] startQuestion: No question type found:`, question);
            return;
        }

        if (questionData.type === 'multiple_choice' && (!questionData.options || !Array.isArray(questionData.options))) {
            console.error(`[Engine ${engineId}] startQuestion: Multiple choice question missing options:`, question);
            return;
        }

        console.log(`[Engine ${engineId}] startQuestion: prepared questionData:`, questionData);

        // Dispatch question started event
        console.log(`[Engine ${engineId}] startQuestion: dispatching QUESTION_STARTED event`);
        dispatchGameEvent(EVENTS.QUESTION_STARTED, questionData);

        // Start local timer for UI updates
        console.log(`[Engine ${engineId}] startQuestion: starting UI timer`);
        startUITimer();
    }

    /**
     * Calculates time remaining for current question using server timing for perfect sync
     */
    function calculateTimeRemaining(gameState = null) {
        // Use server-provided timing if available for perfect synchronization
        if (gameState && gameState.timing && gameState.timing.timeRemaining !== undefined) {
            console.log(`[Engine ${engineId}] Using server timing: ${gameState.timing.timeRemaining}s remaining`);
            return gameState.timing.timeRemaining;
        }
        
        // Fallback to local calculation
        if (!currentGame.questionStartTime) {
            return GAME_SETTINGS.QUESTION_TIME;
        }

        const elapsed = Math.floor((Date.now() - currentGame.questionStartTime.getTime()) / 1000);
        const timeRemaining = Math.max(0, GAME_SETTINGS.QUESTION_TIME - elapsed);
        console.log(`[Engine ${engineId}] Local timing calculation: ${timeRemaining}s remaining`);
        return timeRemaining;
    }

    /**
     * Starts UI timer for question countdown
     */
    function startUITimer() {
        stopUITimer();
        
        questionTimer = setInterval(() => {
            const timeRemaining = calculateTimeRemaining();

            // Play timer warning sounds
            try {
                if (timeRemaining === 10) {
                    audioManager.playTimerWarning().catch(e => console.warn('Timer warning sound failed:', e));
                } else if (timeRemaining === 5) {
                    audioManager.playTimerUrgent().catch(e => console.warn('Timer urgent sound failed:', e));
                } else if (timeRemaining === 3) {
                    // Play countdown tick only once at 3 seconds
                    audioManager.playCountdownTick().catch(e => console.warn('Countdown tick sound failed:', e));
                }
            } catch (error) {
                console.warn('Failed to play timer sounds:', error);
            }

            // Update timer display with animation
            const timerElement = document.querySelector('.timer');
            if (timerElement) {
                animations.animateTimerWarning(timerElement, timeRemaining);
            }

            // Dispatch timer update event
            dispatchGameEvent(EVENTS.TIMER_UPDATED, {
                timeRemaining: timeRemaining
            });

            if (timeRemaining <= 0) {
                stopUITimer();
            }
        }, 1000);
    }

    /**
     * Stops UI timer
     */
    function stopUITimer() {
        if (questionTimer) {
            clearInterval(questionTimer);
            questionTimer = null;
        }
    }

    /**
     * Updates question UI with current game state
     */
    async function updateQuestionUI(gameState) {
        if (!gameState.questions || currentGame.currentQuestion >= gameState.questions.length) {
            return;
        }

        const question = gameState.questions[currentGame.currentQuestion];
        const questionData = {
            ...question,
            currentQuestion: currentGame.currentQuestion + 1,
            totalQuestions: gameState.questions.length,
            timeRemaining: calculateTimeRemaining(gameState),
            lobbyCode: currentGame.lobbyCode,
            playerCount: Array.isArray(gameState.players) ? gameState.players.length : Object.keys(gameState.players).length,
            players: gameState.players,
            scores: currentGame.scores,
            multipliers: currentGame.playerMultipliers,
            answerProgress: gameState.answerProgress
        };

        // Update UI elements
        dispatchGameEvent(EVENTS.QUESTION_UPDATED, questionData);
    }

    /**
     * Submits an answer for the current question
     * @param {string} username - Player username
     * @param {any} answer - Player's answer
     * @returns {Object} - Answer result with feedback
     */
    async function submitAnswer(username, answer) {
        if (!currentGame || currentGame.phase !== 'question') {
            throw new Error('Invalid game state');
        }

        if (currentGame.hasAnswered) {
            throw new Error('Already answered');
        }

        try {
            // Submit answer to server
            const result = await lobbyManager.submitAnswer(currentGame.lobbyCode, answer);
            
            // Mark as answered locally
            currentGame.hasAnswered = true;

            // Use existing game state instead of making another API call to reduce rate limiting
            // The syncGameState polling will update us with the latest state
            let question;
            if (result.gameState && result.gameState.questions) {
                // Server returned updated game state with answer submission
                question = result.gameState.questions[currentGame.currentQuestion];
            } else {
                // Fallback: try to get from local cache or make API call as last resort
                try {
                    const gameState = await lobbyManager.getGameState(currentGame.lobbyCode);
                    question = gameState.questions[currentGame.currentQuestion];
                } catch (error) {
                    console.warn('Failed to get game state after answer submission, using local validation');
                    // We'll validate based on what we know locally
                    question = null;
                }
            }
            const isCorrect = validateAnswer(question, answer);

            // Calculate timing
            const timeElapsed = Date.now() - (currentGame.questionStartTime?.getTime() || Date.now());
            const timeRemaining = Math.max(0, GAME_SETTINGS.QUESTION_TIME - Math.floor(timeElapsed / 1000));

            // Get current multiplier before any changes
            const currentMultiplier = currentGame.playerMultipliers[username] || 1;

            // Update local score immediately for responsive UI
            if (isCorrect) {
                const points = calculateScore(timeRemaining, currentMultiplier);
                currentGame.scores[username] = (currentGame.scores[username] || 0) + points;
                
                // Update multiplier locally for immediate feedback
                currentGame.playerMultipliers[username] = Math.min(5, currentMultiplier + 1);
                
                // Track correct answer for Hall of Fame
                currentGame.playerCorrectAnswers[username] = (currentGame.playerCorrectAnswers[username] || 0) + 1;
            } else {
                // Reset multiplier on wrong answer
                currentGame.playerMultipliers[username] = 1;
            }

            // INSTANT FEEDBACK: Play sounds immediately when answer is submitted
            try {
                if (isCorrect) {
                    // Play sound based on the ORIGINAL multiplier (before increment)
                    // This ensures first correct answer plays correct1.mp3, second plays correct2.mp3, etc.
                    await audioManager.playMultiplierSound(currentMultiplier);
                    
                    // Special achievement sounds (use updated multiplier for achievements)
                    const updatedMultiplier = currentGame.playerMultipliers[username] || 1;
                    if (updatedMultiplier === 5) {
                        await audioManager.playMultiplierMax();
                    }
                    if (timeRemaining >= GAME_SETTINGS.QUESTION_TIME - 2) {
                        await audioManager.playTimeBonus();
                    }
                } else {
                    // Differentiate between wrong answers that lose multiplier stacks vs those that don't
                    // Use the original multiplier (before reset) to determine if combo breaker should play
                    if (currentMultiplier > 1) {
                        // Player had multiplier stacks and lost them - play combo breaker sound
                        await audioManager.playComboBreaker();
                        console.log(`[Engine ${engineId}] Combo breaker! Player ${username} lost multiplier stacks (${currentMultiplier} -> 1)`);
                    } else {
                        // Player had no multiplier stacks - play regular wrong answer sound
                        await audioManager.playWrongSound();
                        console.log(`[Engine ${engineId}] Wrong answer with no multiplier stacks lost for player ${username}`);
                    }
                }

                // Animate character
                animations.animateCharacter(username, isCorrect);
            } catch (error) {
                console.warn(`[Engine ${engineId}] Failed to play answer feedback:`, error);
            }

            return {
                isCorrect,
                correctAnswer: question ? question.correct : null,
                timeRemaining,
                allAnswered: result.allAnswered,
                playersAnswered: result.playersAnswered,
                totalPlayers: result.totalPlayers,
                newScore: currentGame.scores[username] || 0
            };

        } catch (error) {
            console.error('Failed to submit answer:', error);
            throw error;
        }
    }

    /**
     * Validates an answer against a question
     * @param {Object} question - Question object
     * @param {any} answer - Player's answer
     * @returns {boolean} - Whether answer is correct
     */
    function validateAnswer(question, answer) {
        if (!question || question.correct === undefined) return false;

        switch (question.type) {
            case QUESTION_TYPES.MULTIPLE_CHOICE:
                return answer === question.correct;
            case QUESTION_TYPES.TRUE_FALSE:
                return answer === question.correct;
            default:
                return false;
        }
    }

    /**
     * Shows question results
     */
    async function showQuestionResults(gameState) {
        try {
            // Play round end sound
            await audioManager.playRoundEnd();
        } catch (error) {
            console.warn('Failed to play round end sound:', error);
        }

        // Calculate answer results for all players to show avatar flashing
        const answerResults = {};
        if (gameState.questions && gameState.questions[currentGame.currentQuestion] && gameState.players) {
            const question = gameState.questions[currentGame.currentQuestion];
            gameState.players.forEach(player => {
                if (player.current_answer !== null && player.answered) {
                    try {
                        const playerAnswer = typeof player.current_answer === 'string' 
                            ? JSON.parse(player.current_answer) 
                            : player.current_answer;
                        answerResults[player.username] = validateAnswer(question, playerAnswer);
                    } catch (error) {
                        console.warn(`Failed to parse answer for player ${player.username}:`, error);
                        answerResults[player.username] = false;
                    }
                }
            });
        }

        // Flash all player avatars based on their answers
        if (Object.keys(answerResults).length > 0) {
            animations.flashAllPlayerAvatars(answerResults);
        }

        // Prepare results data
        const question = gameState.questions[currentGame.currentQuestion];
        const results = {
            question,
            answers: currentGame.playerAnswers,
            scores: currentGame.scores,
            multipliers: currentGame.playerMultipliers,
            correctAnswers: 0, // Server should provide this
            totalPlayers: gameState.players ? gameState.players.length : 0,
            answerProgress: gameState.answerProgress,
            answerResults: answerResults
        };

        // Dispatch results event
        dispatchGameEvent(EVENTS.QUESTION_ENDED, results);
    }

    /**
     * Ends the current game
     */
    async function endGame(gameState) {
        if (!currentGame) return;

        stopUITimer();
        stopGameStatePolling();
        currentGame.phase = GAME_PHASES.POST_GAME;

        const finalResults = {
            scores: currentGame.scores,
            multipliers: currentGame.playerMultipliers,
            correctAnswers: currentGame.playerCorrectAnswers,
            totalQuestions: currentGame.totalQuestions || (gameState.questions ? gameState.questions.length : 0),
            players: gameState.players ? gameState.players.map(p => p.username) : [],
            winner: getWinner()
        };

        // Play applause for winners
        try {
            const winner = getWinner();
            if (winner) {
                await audioManager.playApplause();
            }
        } catch (error) {
            console.warn('Failed to play winner applause sound:', error);
        }

        // Dispatch game ended event
        dispatchGameEvent(EVENTS.GAME_ENDED, finalResults);

        return finalResults;
    }

    /**
     * Gets the winner based on scores
     */
    function getWinner() {
        if (!currentGame || !currentGame.scores) return null;

        let maxScore = -1;
        let winner = null;

        Object.entries(currentGame.scores).forEach(([username, score]) => {
            if (score > maxScore) {
                maxScore = score;
                winner = username;
            }
        });

        return winner;
    }

    /**
     * Dispatches a game event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    function dispatchGameEvent(eventName, detail) {
        console.log(`[Engine ${engineId}] 🎯 Dispatching event: ${eventName}`, detail);
        
        try {
            const event = new CustomEvent(eventName, { detail });
            document.dispatchEvent(event);
            console.log(`[Engine ${engineId}] ✅ Event dispatched successfully: ${eventName}`);
        } catch (error) {
            console.error(`[Engine ${engineId}] 🚨 Failed to dispatch event ${eventName}:`, error);
        }
    }

    /**
     * Gets current game state
     */
    function getCurrentGame() {
        return currentGame;
    }

    /**
     * Cleanup function
     */
    function cleanup() {
        stopUITimer();
        stopGameStatePolling();
        currentGame = null;
    }

    return {
        initGame,
        submitAnswer,
        getCurrentGame,
        cleanup
    };
} 