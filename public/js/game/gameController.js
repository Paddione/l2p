/**
 * Game Controller Module
 * Handles game initialization and coordination between game modules
 */

import { initGameEngine } from './gameEngine.js';
import { initQuestionManager } from './questionManager.js';
import { initScoreSystem } from './scoreSystem.js';
import { initTimer } from './timer.js';
import { EVENTS, SCREENS } from '../utils/constants.js';

export function initGameController(lobbyManager, storage, screenManager) {
    let gameEngine = null;
    let questionManager = null;
    let scoreSystem = null;
    let timer = null;
    let currentLobby = null;

    /**
     * Initialize the game controller
     */
    function init() {
        // Initialize game modules
        questionManager = initQuestionManager();
        scoreSystem = initScoreSystem();
        timer = initTimer();
        gameEngine = initGameEngine(lobbyManager, questionManager, storage);

        // Listen for game events
        setupEventListeners();

        console.log('Game controller initialized');
    }

    /**
     * Setup event listeners for game events
     */
    function setupEventListeners() {
        // Listen for game started event
        document.addEventListener(EVENTS.GAME_STARTED, handleGameStarted);
        
        // Listen for screen changes to handle game screen activation
        document.addEventListener('screenChanged', handleScreenChanged);
        
        // Listen for game engine events
        document.addEventListener(EVENTS.QUESTION_STARTED, handleQuestionStarted);
        document.addEventListener(EVENTS.QUESTION_UPDATED, handleQuestionUpdated);
        document.addEventListener(EVENTS.QUESTION_ENDED, handleQuestionEnded);
        document.addEventListener(EVENTS.GAME_ENDED, handleGameEnded);
        document.addEventListener(EVENTS.TIMER_UPDATED, handleTimerUpdate);
    }

    /**
     * Handles the game started event
     * @param {CustomEvent} event - Game started event
     */
    async function handleGameStarted(event) {
        try {
            console.log('Game started event received:', event.detail);
            currentLobby = event.detail.lobby;

            if (!currentLobby) {
                throw new Error('No lobby data in game started event');
            }

            // Ensure we're on the game screen
            if (screenManager.getCurrentScreen() !== SCREENS.GAME) {
                screenManager.showScreen(SCREENS.GAME);
            }

            // Initialize the game with the lobby
            // Note: initGame() internally calls startQuestion() which dispatches QUESTION_STARTED event
            await gameEngine.initGame(currentLobby.code);

            console.log('Game initialized successfully');

        } catch (error) {
            console.error('Failed to start game:', error);
            alert('Failed to start game: ' + error.message);
            screenManager.showScreen(SCREENS.LOBBY);
        }
    }

    /**
     * Handles screen changes
     * @param {CustomEvent} event - Screen changed event
     */
    function handleScreenChanged(event) {
        const { from, to } = event.detail;
        
        if (to === SCREENS.GAME && !gameEngine) {
            console.warn('Game screen shown but game engine not initialized');
        }
        
        if (from === SCREENS.GAME && to !== SCREENS.GAME) {
            // Clean up game state when leaving game screen
            cleanup();
        }
    }

    /**
     * Handles question started event
     * @param {CustomEvent} event - Question started event
     */
    function handleQuestionStarted(event) {
        const questionData = event.detail;
        updateGameUI(questionData);
    }

    /**
     * Handles question updated event
     * @param {CustomEvent} event - Question updated event
     */
    function handleQuestionUpdated(event) {
        const questionData = event.detail;
        updateGameUI(questionData);
    }

    /**
     * Handles question ended event
     * @param {CustomEvent} event - Question ended event
     */
    function handleQuestionEnded(event) {
        const results = event.detail;
        showQuestionResults(results);
        
        // Note: The server now handles question transitions automatically
        // No need for manual progression logic here
        console.log('Question ended, server will handle progression to next question or game end...');
    }

    /**
     * Handles game ended event
     * @param {CustomEvent} event - Game ended event
     */
    function handleGameEnded(event) {
        const finalResults = event.detail;
        scoreSystem.showFinalScores(finalResults.scores, finalResults.winner);
        
        // Show results screen after a delay
        setTimeout(() => {
            screenManager.showScreen(SCREENS.RESULTS);
        }, 5000);
    }

    /**
     * Handles timer update event
     * @param {CustomEvent} event - Timer update event
     */
    function handleTimerUpdate(event) {
        const { timeRemaining } = event.detail;
        scoreSystem.updateTimerDisplay(timeRemaining);
    }

    /**
     * Updates the game UI with question data
     * @param {Object} questionData - Question data
     */
    function updateGameUI(questionData) {
        console.log('updateGameUI called with:', questionData);
        
        if (!questionData) {
            console.error('updateGameUI: questionData is null or undefined');
            return;
        }

        if (!questionData.question && !questionData.type) {
            console.error('updateGameUI: questionData.question is missing. Available properties:', Object.keys(questionData));
            return;
        }

        const questionText = document.getElementById('question-text');
        const answersContainer = document.getElementById('answers-grid');
        const timerDisplay = document.getElementById('timer');
        const gameCodeDisplay = document.getElementById('game-code-display');
        const playerCountDisplay = document.getElementById('player-count');
        const answerProgressDisplay = document.getElementById('answer-progress');

        // Update question text
        if (questionText) {
            questionText.textContent = questionData.question || questionData.text;
        }

        // Update timer display
        if (timerDisplay) {
            timerDisplay.textContent = questionData.timeRemaining || 30;
        }

        // Update game header info
        if (gameCodeDisplay && questionData.lobbyCode) {
            gameCodeDisplay.textContent = questionData.lobbyCode;
        }

        if (playerCountDisplay && questionData.playerCount) {
            playerCountDisplay.textContent = questionData.playerCount;
        }

        // Update answer progress
        if (answerProgressDisplay && questionData.answerProgress) {
            const { answered, total } = questionData.answerProgress;
            answerProgressDisplay.textContent = `${answered}/${total} answered`;
        }

        // Update answers
        if (answersContainer) {
            answersContainer.innerHTML = '';
            
            if (questionData.type === 'multiple_choice' && questionData.options) {
                questionData.options.forEach((option, index) => {
                    const button = document.createElement('button');
                    button.className = 'answer-btn';
                    button.textContent = option;
                    button.dataset.answer = index;
                    button.addEventListener('click', () => handleAnswerClick(index, button));
                    answersContainer.appendChild(button);
                });
            } else if (questionData.type === 'true_false') {
                ['True', 'False'].forEach((option, index) => {
                    const button = document.createElement('button');
                    button.className = 'answer-btn';
                    button.textContent = option;
                    button.dataset.answer = index === 0;
                    button.addEventListener('click', () => handleAnswerClick(index === 0, button));
                    answersContainer.appendChild(button);
                });
            }
        }

        // Update player list
        updatePlayerList(questionData);
    }

    /**
     * Updates the player list during game
     * @param {Object} questionData - Question data
     */
    function updatePlayerList(questionData) {
        const playersList = document.getElementById('game-players-list');
        if (!playersList || !questionData.players) return;

        playersList.innerHTML = '';
        
        if (Array.isArray(questionData.players)) {
            // Handle array format from backend
            questionData.players.forEach(player => {
                const playerCard = document.createElement('div');
                playerCard.className = 'player-card';
                playerCard.innerHTML = `
                    <div class="player-avatar">${player.character}</div>
                    <div class="player-info">
                        <div class="player-name">${player.username}</div>
                        <div class="player-score">${questionData.scores?.[player.username] || 0}</div>
                    </div>
                `;
                playersList.appendChild(playerCard);
            });
        } else {
            // Handle object format (legacy)
            Object.entries(questionData.players).forEach(([username, playerData]) => {
                const playerCard = document.createElement('div');
                playerCard.className = 'player-card';
                playerCard.innerHTML = `
                    <div class="player-avatar">${playerData.character}</div>
                    <div class="player-info">
                        <div class="player-name">${username}</div>
                        <div class="player-score">${questionData.scores?.[username] || 0}</div>
                    </div>
                `;
                playersList.appendChild(playerCard);
            });
        }
    }

    /**
     * Resets answer button states
     */
    function resetAnswerButtons() {
        const answerButtons = document.querySelectorAll('.answer-btn');
        answerButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('answered', 'selected', 'correct', 'incorrect');
        });
    }

    /**
     * Handles answer button clicks
     * @param {any} answer - Selected answer
     * @param {HTMLElement} buttonElement - The clicked button element
     */
    async function handleAnswerClick(answer, buttonElement) {
        try {
            // Prevent multiple clicks
            if (buttonElement.disabled) return;

            // Get current user from storage
            const currentUser = await storage.getCurrentUser();
            if (!currentUser) {
                throw new Error('No current user found');
            }

            // Visual feedback - mark as selected
            const answerButtons = document.querySelectorAll('.answer-btn');
            answerButtons.forEach(btn => {
                btn.classList.remove('selected');
                btn.disabled = true; // Disable all buttons after selection
            });
            buttonElement.classList.add('selected');

            // Submit answer (sounds will be handled in gameEngine after validation)
            const result = await gameEngine.submitAnswer(currentUser.username, answer);
            
            // Update score display
            const currentGame = gameEngine.getCurrentGame();
            if (currentGame) {
                scoreSystem.updateScoreDisplay(
                    currentUser.username,
                    currentGame.scores[currentUser.username],
                    result.points,
                    result.newMultiplier
                );
            }

        } catch (error) {
            console.error('Failed to submit answer:', error);
            
            // Re-enable buttons on error
            const answerButtons = document.querySelectorAll('.answer-btn');
            answerButtons.forEach(btn => {
                btn.disabled = false;
            });
            
            alert('Failed to submit answer: ' + error.message);
        }
    }

    /**
     * Shows question results with visual feedback
     * @param {Object} results - Question results
     */
    function showQuestionResults(results) {
        console.log('Question results:', results);
        
        // Show correct/incorrect answers visually
        const answerButtons = document.querySelectorAll('.answer-btn');
        const currentUser = storage.getCurrentUser();
        
        if (results.question && answerButtons.length > 0) {
            const correctAnswer = results.question.correct;
            
            answerButtons.forEach((btn, index) => {
                const buttonAnswer = results.question.type === 'multiple_choice' ? index : 
                                   (btn.textContent === 'True' ? true : false);
                
                if (buttonAnswer === correctAnswer) {
                    btn.classList.add('correct');
                } else if (btn.classList.contains('selected')) {
                    btn.classList.add('incorrect');
                }
            });
        }

        // Update player scores in the UI
        if (results.scores) {
            updatePlayerScores(results.scores);
        }
    }

    /**
     * Updates player scores in the game UI
     * @param {Object} scores - Player scores
     */
    function updatePlayerScores(scores) {
        const playerCards = document.querySelectorAll('#game-players-list .player-card');
        playerCards.forEach(card => {
            const nameElement = card.querySelector('.player-name');
            const scoreElement = card.querySelector('.player-score');
            
            if (nameElement && scoreElement) {
                const username = nameElement.textContent;
                if (scores[username] !== undefined) {
                    scoreElement.textContent = scores[username];
                    scoreElement.classList.add('score-update');
                    setTimeout(() => scoreElement.classList.remove('score-update'), 500);
                }
            }
        });
    }

    /**
     * Cleanup game state
     */
    function cleanup() {
        if (timer) {
            timer.stopTimer();
        }
        currentLobby = null;
    }

    /**
     * Gets the current game state
     * @returns {Object|null} - Current game state
     */
    function getCurrentGame() {
        return gameEngine ? gameEngine.getCurrentGame() : null;
    }

    return {
        init,
        getCurrentGame
    };
} 