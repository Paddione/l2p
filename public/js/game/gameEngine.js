/**
 * Game Engine Module
 * Handles core game logic and state management
 */

import { GAME_SETTINGS, GAME_PHASES, EVENTS, QUESTION_TYPES } from '../utils/constants.js';
import { calculateScore, getNextMultiplier } from '../utils/helpers.js';
import { initAudioManager } from '../audio/audioManager.js';
import { initAnimations } from '../ui/animations.js';

export function initGameEngine(lobbyManager, questionManager, storage) {
    let currentGame = null;
    let questionTimer = null;
    let questionTransitionTimer = null;
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
            const lobby = await lobbyManager.getLobby(lobbyCode);
            if (!lobby) {
                throw new Error('Lobby not found');
            }

            // Initialize game state
            currentGame = {
                lobbyCode,
                phase: GAME_PHASES.WAITING,
                currentQuestion: 0,
                scores: {},
                playerMultipliers: {},
                playerAnswers: {},
                correctAnswers: 0,
                timeRemaining: GAME_SETTINGS.QUESTION_TIME,
                questionStartTime: null,
                questionEndTime: null
            };

            // Initialize player scores and multipliers
            Object.keys(lobby.players).forEach(username => {
                currentGame.scores[username] = 0;
                currentGame.playerMultipliers[username] = 1;
            });

            console.log(`[Engine ${engineId}] Game initialized for lobby:`, lobbyCode);
            
            // Play game start sound
            try {
                console.log(`[Engine ${engineId}] Playing game start sound`);
                await audioManager.playGameStart();
            } catch (error) {
                console.warn(`[Engine ${engineId}] Failed to play game start sound:`, error);
            }
            
            // Start the first question
            await startQuestion();

        } catch (error) {
            console.error(`[Engine ${engineId}] Failed to initialize game:`, error);
            throw error;
        }
    }

    /**
     * Starts a new question
     */
    async function startQuestion() {
        if (!currentGame) {
            console.error('startQuestion: currentGame is null');
            return;
        }

        const lobby = await lobbyManager.getLobby(currentGame.lobbyCode);
        console.log('startQuestion: lobby data:', lobby);
        
        if (!lobby) {
            console.error('startQuestion: lobby not found');
            return;
        }

        if (!lobby.questions || !Array.isArray(lobby.questions)) {
            console.error('startQuestion: lobby.questions is missing or not an array:', lobby.questions);
            return;
        }

        if (currentGame.currentQuestion >= lobby.questions.length) {
            console.error('startQuestion: currentQuestion index out of bounds:', currentGame.currentQuestion, 'total questions:', lobby.questions.length);
            return;
        }

        const question = lobby.questions[currentGame.currentQuestion];
        console.log('startQuestion: current question:', question);
        
        if (!question) {
            console.error('startQuestion: question is null or undefined at index:', currentGame.currentQuestion);
            return;
        }

        currentGame.phase = GAME_PHASES.QUESTION;
        currentGame.questionStartTime = Date.now();
        currentGame.timeRemaining = GAME_SETTINGS.QUESTION_TIME;
        currentGame.playerAnswers = {};

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
            totalQuestions: lobby.questions.length,
            timeRemaining: currentGame.timeRemaining,
            lobbyCode: currentGame.lobbyCode,
            playerCount: Object.keys(lobby.players).length,
            players: lobby.players,
            scores: currentGame.scores
        };

        console.log('startQuestion: prepared questionData:', questionData);

        // Dispatch question started event
        dispatchGameEvent(EVENTS.QUESTION_STARTED, questionData);

        // Start timer
        startTimer();
    }

    /**
     * Submits a player's answer
     * @param {string} username - Player username
     * @param {any} answer - Player's answer
     * @returns {Promise<Object>} - Answer result
     */
    async function submitAnswer(username, answer) {
        if (!currentGame || currentGame.phase !== GAME_PHASES.QUESTION) {
            throw new Error('Invalid game state');
        }

        if (currentGame.playerAnswers[username]) {
            throw new Error('Already answered');
        }

        const lobby = await lobbyManager.getLobby(currentGame.lobbyCode);
        const question = lobby.questions[currentGame.currentQuestion];
        const timeElapsed = Date.now() - currentGame.questionStartTime;
        const timeRemaining = Math.max(0, GAME_SETTINGS.QUESTION_TIME - Math.floor(timeElapsed / 1000));
        const isCorrect = validateAnswer(question, answer);

        // Calculate score and update multiplier
        const oldMultiplier = currentGame.playerMultipliers[username];
        const points = isCorrect ? calculateScore(timeRemaining, oldMultiplier) : 0;
        const newMultiplier = getNextMultiplier(oldMultiplier, isCorrect);

        // Update player state
        currentGame.playerAnswers[username] = {
            answer,
            isCorrect,
            timeRemaining,
            points,
            timeElapsed: timeElapsed / 1000
        };

        currentGame.scores[username] += points;
        currentGame.playerMultipliers[username] = newMultiplier;
        if (isCorrect) {
            currentGame.correctAnswers++;
        }

        // INSTANT FEEDBACK: Play sounds immediately when answer is submitted
        try {
            if (isCorrect) {
                // Play correct answer sound with current multiplier
                await audioManager.playMultiplierSound(newMultiplier);
                
                // Special achievement sounds
                if (newMultiplier === 5) {
                    await audioManager.playMultiplierMax();
                }
                if (timeRemaining >= GAME_SETTINGS.QUESTION_TIME - 2) {
                    await audioManager.playTimeBonus();
                }
                
                // Animate character and points
                animations.animateCharacter(username, true);
                animations.animatePointsEarned(username, points, newMultiplier);
            } else {
                // Play wrong answer sound immediately
                console.log(`[Engine ${engineId}] Playing wrong sound for incorrect answer by ${username}`);
                await audioManager.playWrongSound();
                
                // Animate character for wrong answer
                animations.animateCharacter(username, false);
            }
        } catch (error) {
            console.warn('Failed to play instant feedback sounds:', error);
        }

        // Animate multiplier change (visual feedback)
        try {
            animations.animateMultiplier(username, oldMultiplier, newMultiplier);
        } catch (error) {
            console.warn('Failed to animate multiplier:', error);
        }

        // Dispatch answer submitted event
        dispatchGameEvent(EVENTS.ANSWER_SUBMITTED, {
            username,
            isCorrect,
            points,
            newMultiplier,
            timeRemaining
        });

        // Check if all players have answered
        const allAnswered = Object.keys(lobby.players).every(
            player => currentGame.playerAnswers[player]
        );

        if (allAnswered) {
            await endQuestion();
        }

        return {
            isCorrect,
            points,
            newMultiplier: currentGame.playerMultipliers[username]
        };
    }

    /**
     * Validates a player's answer
     * @param {Object} question - Question data
     * @param {any} answer - Player's answer
     * @returns {boolean} - Whether answer is correct
     */
    function validateAnswer(question, answer) {
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
     * Ends the current question
     */
    async function endQuestion() {
        if (!currentGame) return;

        stopTimer();
        currentGame.phase = GAME_PHASES.RESULTS;
        currentGame.questionEndTime = Date.now();

        const lobby = await lobbyManager.getLobby(currentGame.lobbyCode);
        const question = lobby.questions[currentGame.currentQuestion];

        // In single player mode, auto-submit if no answer was given
        if (lobby.isSinglePlayer) {
            const username = Object.keys(lobby.players)[0];
            if (!currentGame.playerAnswers[username]) {
                currentGame.playerAnswers[username] = {
                    answer: null,
                    isCorrect: false,
                    timeRemaining: 0,
                    points: 0,
                    timeElapsed: GAME_SETTINGS.QUESTION_TIME
                };
                currentGame.playerMultipliers[username] = 1;
            }
        }

        // Handle case where player didn't answer (timeout)
        try {
            const currentUser = await storage.getCurrentUser();
            if (currentUser && !currentGame.playerAnswers[currentUser.username]) {
                // No answer given - play wrong sound for timeout
                console.log(`[Engine ${engineId}] Playing wrong sound for timeout by ${currentUser.username}`);
                await audioManager.playWrongSound();
                animations.animateCharacter(currentUser.username, false);
            }
        } catch (error) {
            console.warn(`[Engine ${engineId}] Failed to play timeout feedback:`, error);
        }

        // Prepare results
        const results = {
            question,
            answers: currentGame.playerAnswers,
            scores: currentGame.scores,
            multipliers: currentGame.playerMultipliers,
            isSinglePlayer: lobby.isSinglePlayer,
            correctAnswers: currentGame.correctAnswers,
            totalPlayers: Object.keys(lobby.players).length
        };

        // Dispatch results event
        dispatchGameEvent(EVENTS.QUESTION_ENDED, results);

        // Start transition to next question
        questionTransitionTimer = setTimeout(async () => {
            if (currentGame.currentQuestion >= lobby.questions.length - 1) {
                await endGame();
            } else {
                await nextQuestion();
            }
        }, GAME_SETTINGS.QUESTION_TRANSITION_TIME || 5000);
    }

    /**
     * Moves to the next question
     */
    async function nextQuestion() {
        if (!currentGame) return;

        currentGame.currentQuestion++;
        await startQuestion();
    }

    /**
     * Starts the question timer
     */
    function startTimer() {
        stopTimer();
        const startTime = Date.now();
        const timerElement = document.querySelector('.timer');

        questionTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            currentGame.timeRemaining = Math.max(0, GAME_SETTINGS.QUESTION_TIME - Math.floor(elapsed / 1000));

            // Play timer warning sounds
            try {
                if (currentGame.timeRemaining === 10) {
                    audioManager.playTimerWarning().catch(e => console.warn('Timer warning sound failed:', e));
                } else if (currentGame.timeRemaining === 5) {
                    audioManager.playTimerUrgent().catch(e => console.warn('Timer urgent sound failed:', e));
                } else if (currentGame.timeRemaining <= 3 && currentGame.timeRemaining > 0) {
                    audioManager.playCountdownTick().catch(e => console.warn('Countdown tick sound failed:', e));
                }
            } catch (error) {
                console.warn('Failed to play timer sounds:', error);
            }

            // Update timer display with animation
            if (timerElement) {
                animations.animateTimerWarning(timerElement, currentGame.timeRemaining);
            }

            // Dispatch timer update event
            dispatchGameEvent(EVENTS.TIMER_UPDATED, {
                timeRemaining: currentGame.timeRemaining
            });

            if (currentGame.timeRemaining <= 0) {
                endQuestion();
            }
        }, 1000);
    }

    /**
     * Stops the question timer
     */
    function stopTimer() {
        if (questionTimer) {
            clearInterval(questionTimer);
            questionTimer = null;
        }
        if (questionTransitionTimer) {
            clearTimeout(questionTransitionTimer);
            questionTransitionTimer = null;
        }
    }

    /**
     * Ends the current game
     */
    async function endGame() {
        if (!currentGame) return;

        stopTimer();
        currentGame.phase = GAME_PHASES.FINISHED;

        const lobby = await lobbyManager.getLobby(currentGame.lobbyCode);
        const finalResults = {
            scores: currentGame.scores,
            multipliers: currentGame.playerMultipliers,
            correctAnswers: currentGame.correctAnswers,
            totalQuestions: currentGame.totalQuestions,
            players: Object.keys(lobby.players),
            isSinglePlayer: lobby.isSinglePlayer,
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

        // Save game results and update hall of fame
        Object.entries(currentGame.scores).forEach(([username, score]) => {
            const player = lobby.players[username];
            const accuracy = (currentGame.correctAnswers / currentGame.totalQuestions) * 100;
            const maxMultiplier = currentGame.playerMultipliers[username];

            // Add to hall of fame
            storage.addHallOfFameEntry({
                username,
                character: player.character,
                score,
                questions: currentGame.totalQuestions,
                accuracy,
                maxMultiplier,
                catalogName: lobby.catalog,
                isSinglePlayer: lobby.isSinglePlayer,
                date: new Date().toISOString()
            });

            // Update user data for single player
            if (lobby.isSinglePlayer) {
                const userData = storage.getUserData(username) || {};
                userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
                userData.totalScore = (userData.totalScore || 0) + score;
                userData.correctAnswers = (userData.correctAnswers || 0) + currentGame.correctAnswers;
                userData.maxMultiplier = Math.max(userData.maxMultiplier || 1, maxMultiplier);
                userData.bestScore = Math.max(userData.bestScore || 0, score);
                userData.bestAccuracy = Math.max(userData.bestAccuracy || 0, accuracy);
                storage.saveUserData(username, userData);
            }
        });

        return finalResults;
    }

    /**
     * Gets the winner(s) of the game
     * @returns {string|string[]} - Winner username(s)
     */
    function getWinner() {
        if (!currentGame) return null;

        const scores = currentGame.scores;
        const maxScore = Math.max(...Object.values(scores));
        const winners = Object.entries(scores)
            .filter(([_, score]) => score === maxScore)
            .map(([username]) => username);

        return winners.length === 1 ? winners[0] : winners;
    }

    /**
     * Dispatches a game event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event data
     */
    function dispatchGameEvent(eventName, detail) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Gets the current game state
     * @returns {Object|null} - Current game state
     */
    function getCurrentGame() {
        return currentGame;
    }

    return {
        initGame,
        startQuestion,
        submitAnswer,
        endQuestion,
        nextQuestion,
        endGame,
        getCurrentGame
    };
} 