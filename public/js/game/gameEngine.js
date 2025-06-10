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
    const audioManager = initAudioManager();
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
                questionEndTime: null
            };

            // Initialize player scores and multipliers
            if (Array.isArray(lobby.players)) {
                lobby.players.forEach(player => {
                    currentGame.scores[player.username] = player.score || 0;
                    currentGame.playerMultipliers[player.username] = 1;
                });
            }

            console.log(`[Engine ${engineId}] Game initialized for lobby:`, lobbyCode);
            
            // Play game start sound
            try {
                console.log(`[Engine ${engineId}] Playing game start sound`);
                await audioManager.playGameStart();
            } catch (error) {
                console.warn(`[Engine ${engineId}] Failed to play game start sound:`, error);
            }
            
            // Start polling for game state updates
            startGameStatePolling();

        } catch (error) {
            console.error(`[Engine ${engineId}] Failed to initialize game:`, error);
            throw error;
        }
    }

    /**
     * Starts polling for game state updates
     */
    function startGameStatePolling() {
        stopGameStatePolling();
        
        // Poll every 1 second for game state updates to ensure synchronization
        gameStateInterval = setInterval(async () => {
            try {
                if (currentGame && currentGame.lobbyCode) {
                    await syncGameState();
                }
            } catch (error) {
                console.error('Error syncing game state:', error);
            }
        }, 1000);
    }

    /**
     * Stops polling for game state updates
     */
    function stopGameStatePolling() {
        if (gameStateInterval) {
            clearInterval(gameStateInterval);
            gameStateInterval = null;
        }
    }

    /**
     * Syncs game state with server
     */
    async function syncGameState() {
        try {
            const gameState = await lobbyManager.getGameState(currentGame.lobbyCode);
            
            if (!gameState) {
                console.error('No game state received');
                return;
            }

            const previousPhase = currentGame.phase;
            const previousQuestion = currentGame.currentQuestion;

            // Update current game state
            currentGame.phase = gameState.game_phase;
            currentGame.currentQuestion = gameState.current_question;

            // Update player scores
            if (gameState.players) {
                gameState.players.forEach(player => {
                    currentGame.scores[player.username] = player.score || 0;
                });
            }

            // Handle phase transitions
            if (previousPhase !== currentGame.phase) {
                await handlePhaseChange(previousPhase, currentGame.phase, gameState);
            }

            // Handle question transitions
            if (previousQuestion !== currentGame.currentQuestion) {
                await handleQuestionChange(gameState);
            }

            // Update UI with current state
            if (currentGame.phase === 'question') {
                await updateQuestionUI(gameState);
            }

        } catch (error) {
            console.error('Failed to sync game state:', error);
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
            console.error('startQuestion: missing game or state data');
            return;
        }

        if (!gameState.questions || !Array.isArray(gameState.questions)) {
            console.error('startQuestion: no questions in game state');
            return;
        }

        if (currentGame.currentQuestion >= gameState.questions.length) {
            console.error('startQuestion: question index out of bounds');
            return;
        }

        const question = gameState.questions[currentGame.currentQuestion];
        console.log('startQuestion: current question:', question);
        
        if (!question) {
            console.error('startQuestion: question is null or undefined');
            return;
        }

        currentGame.questionStartTime = gameState.question_start_time ? new Date(gameState.question_start_time) : new Date();

        // Play question start sound
        try {
            await audioManager.playQuestionStart();
        } catch (error) {
            console.warn('Failed to play question start sound:', error);
        }

        // Prepare question data for UI
        const questionData = {
            ...question,
            currentQuestion: currentGame.currentQuestion + 1,
            totalQuestions: gameState.questions.length,
            timeRemaining: calculateTimeRemaining(),
            lobbyCode: currentGame.lobbyCode,
            playerCount: Array.isArray(gameState.players) ? gameState.players.length : Object.keys(gameState.players).length,
            players: gameState.players,
            scores: currentGame.scores,
            answerProgress: gameState.answerProgress
        };

        console.log('startQuestion: prepared questionData:', questionData);

        // Dispatch question started event
        dispatchGameEvent(EVENTS.QUESTION_STARTED, questionData);

        // Start local timer for UI updates
        startUITimer();
    }

    /**
     * Calculates time remaining for current question
     */
    function calculateTimeRemaining() {
        if (!currentGame.questionStartTime) {
            return GAME_SETTINGS.QUESTION_TIME;
        }

        const elapsed = Math.floor((Date.now() - currentGame.questionStartTime.getTime()) / 1000);
        return Math.max(0, GAME_SETTINGS.QUESTION_TIME - elapsed);
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
                } else if (timeRemaining <= 3 && timeRemaining > 0) {
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
            timeRemaining: calculateTimeRemaining(),
            lobbyCode: currentGame.lobbyCode,
            playerCount: Array.isArray(gameState.players) ? gameState.players.length : Object.keys(gameState.players).length,
            players: gameState.players,
            scores: currentGame.scores,
            answerProgress: gameState.answerProgress
        };

        // Update UI elements
        dispatchGameEvent(EVENTS.QUESTION_UPDATED, questionData);
    }

    /**
     * Submits a player's answer
     * @param {string} username - Player username
     * @param {any} answer - Player's answer
     * @returns {Promise<Object>} - Answer result
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

            // Get current question for validation
            const gameState = await lobbyManager.getGameState(currentGame.lobbyCode);
            const question = gameState.questions[currentGame.currentQuestion];
            const isCorrect = validateAnswer(question, answer);

            // Calculate timing
            const timeElapsed = Date.now() - (currentGame.questionStartTime?.getTime() || Date.now());
            const timeRemaining = Math.max(0, GAME_SETTINGS.QUESTION_TIME - Math.floor(timeElapsed / 1000));

            // INSTANT FEEDBACK: Play sounds immediately when answer is submitted
            try {
                if (isCorrect) {
                    // Play correct answer sound with current multiplier
                    const oldMultiplier = currentGame.playerMultipliers[username] || 1;
                    const newMultiplier = getNextMultiplier(oldMultiplier, isCorrect);
                    await audioManager.playMultiplierSound(newMultiplier);
                    
                    // Special achievement sounds
                    if (newMultiplier === 5) {
                        await audioManager.playMultiplierMax();
                    }
                    if (timeRemaining >= GAME_SETTINGS.QUESTION_TIME - 2) {
                        await audioManager.playTimeBonus();
                    }
                } else {
                    await audioManager.playWrongSound();
                }

                // Animate character
                animations.animateCharacter(username, isCorrect);
            } catch (error) {
                console.warn(`[Engine ${engineId}] Failed to play answer feedback:`, error);
            }

            return {
                isCorrect,
                timeRemaining,
                allAnswered: result.allAnswered,
                playersAnswered: result.playersAnswered,
                totalPlayers: result.totalPlayers
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
        if (!question || !question.correct_answer) return false;

        switch (question.type) {
            case QUESTION_TYPES.MULTIPLE_CHOICE:
                return answer === question.correct_answer;
            case QUESTION_TYPES.TRUE_FALSE:
                return answer === question.correct_answer;
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

        // Prepare results data
        const question = gameState.questions[currentGame.currentQuestion];
        const results = {
            question,
            answers: currentGame.playerAnswers,
            scores: currentGame.scores,
            multipliers: currentGame.playerMultipliers,
            correctAnswers: 0, // Server should provide this
            totalPlayers: gameState.players ? gameState.players.length : 0,
            answerProgress: gameState.answerProgress
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
        currentGame.phase = GAME_PHASES.FINISHED;

        const finalResults = {
            scores: currentGame.scores,
            multipliers: currentGame.playerMultipliers,
            totalQuestions: gameState.questions ? gameState.questions.length : 0,
            players: gameState.players ? gameState.players.map(p => p.username) : [],
            winner: getWinner()
        };

        // Play game end sound
        try {
            await audioManager.playGameEnd();
            
            // Play applause for winners
            const winner = getWinner();
            if (winner) {
                await audioManager.playApplause();
            }
        } catch (error) {
            console.warn('Failed to play game end sound:', error);
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
     */
    function dispatchGameEvent(eventName, detail) {
        const event = new CustomEvent(eventName, {
            detail: detail,
            bubbles: true
        });
        document.dispatchEvent(event);
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