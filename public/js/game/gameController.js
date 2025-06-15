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
        console.log('🎯 handleQuestionStarted: Event received', event.detail);
        const questionData = event.detail;
        updateGameUI(questionData);
        console.log('🎯 handleQuestionStarted: updateGameUI called');
    }

    /**
     * Handles question updated event
     * @param {CustomEvent} event - Question updated event
     */
    function handleQuestionUpdated(event) {
        console.log('🎯 handleQuestionUpdated: Event received', event.detail);
        const questionData = event.detail;
        updateGameUI(questionData);
        console.log('🎯 handleQuestionUpdated: updateGameUI called');
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
        
        // Get additional game data for Hall of Fame
        const gameData = {
            scores: finalResults.scores,
            multipliers: finalResults.multipliers,
            correctAnswers: finalResults.correctAnswers,
            totalQuestions: finalResults.totalQuestions,
            players: finalResults.players,
            catalogName: getCurrentCatalogName() // Get the current question set name
        };
        
        // Immediately switch to results screen
        screenManager.showScreen(SCREENS.RESULTS);
        
        // Show final scores with Hall of Fame upload option on the results screen
        // Use a small delay to ensure the screen transition is complete
        setTimeout(() => {
            scoreSystem.showFinalScores(finalResults.scores, finalResults.winner, gameData);
        }, 100);
    }

    /**
     * Gets the current catalog/question set name
     * @returns {string} Current catalog name
     */
    function getCurrentCatalogName() {
        // Try to get from lobby data first
        const currentLobby = lobbyManager.getCurrentLobby();
        if (currentLobby && currentLobby.questionSet && currentLobby.questionSet.name) {
            return currentLobby.questionSet.name;
        }
        
        // Fallback to stored question set data
        const storedQuestionSet = localStorage.getItem('quiz_meister_selected_question_set');
        if (storedQuestionSet) {
            try {
                const questionSet = JSON.parse(storedQuestionSet);
                return questionSet.name || 'Custom Quiz';
            } catch (error) {
                console.warn('Failed to parse stored question set:', error);
            }
        }
        
        return 'Quiz Game';
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
        console.log('🎮 updateGameUI called with:', questionData);
        
        if (!questionData) {
            console.error('🚨 updateGameUI: questionData is null or undefined');
            return;
        }

        if (!questionData.question && !questionData.text) {
            console.error('🚨 updateGameUI: questionData.question/text is missing. Available properties:', Object.keys(questionData));
            return;
        }

        // Check if we're on the game screen
        const currentScreen = screenManager.getCurrentScreen();
        console.log('🎮 updateGameUI: Current screen:', currentScreen);
        
        if (currentScreen !== SCREENS.GAME) {
            console.warn('🚨 updateGameUI: Not on game screen, current screen is:', currentScreen);
            console.log('🎮 updateGameUI: Switching to game screen...');
            screenManager.showScreen(SCREENS.GAME);
            
            // Wait longer for screen transition to complete
            setTimeout(() => updateGameUIElements(questionData), 300);
            return;
        }

        // Update UI immediately if already on game screen
        updateGameUIElements(questionData);
    }

    /**
     * Separated UI update logic into its own function
     * @param {Object} questionData - Question data
     */
    function updateGameUIElements(questionData) {
        console.log('🎮 updateGameUIElements: Starting UI update');
        
        const questionText = document.getElementById('question-text');
        const answersContainer = document.getElementById('answers-grid');
        const timerDisplay = document.getElementById('timer');
        const gameCodeDisplay = document.getElementById('game-code-display');
        const playerCountDisplay = document.getElementById('player-count');

        console.log('🎮 updateGameUIElements: Found UI elements:', {
            questionText: !!questionText,
            answersContainer: !!answersContainer,
            timerDisplay: !!timerDisplay,
            gameCodeDisplay: !!gameCodeDisplay,
            playerCountDisplay: !!playerCountDisplay
        });

        // Check if game screen is actually visible
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            const isVisible = gameScreen.classList.contains('active');
            console.log('🎮 updateGameUIElements: Game screen visibility:', {
                exists: true,
                hasActiveClass: isVisible,
                display: window.getComputedStyle(gameScreen).display,
                visibility: window.getComputedStyle(gameScreen).visibility
            });
            
            if (!isVisible) {
                console.error('🚨 Game screen is not active! Force activating...');
                gameScreen.classList.add('active');
            }
        } else {
            console.error('🚨 updateGameUIElements: game-screen element not found in DOM');
            return;
        }

        // Update question text
        if (questionText) {
            const questionTextContent = questionData.question || questionData.text;
            console.log('🎮 updateGameUIElements: Setting question text:', questionTextContent);
            questionText.textContent = questionTextContent;
            console.log('🎮 updateGameUIElements: Question text updated successfully');
        } else {
            console.error('🚨 updateGameUIElements: question-text element not found');
            return; // Critical element missing, abort
        }

        // Update timer display
        if (timerDisplay) {
            const timeRemaining = questionData.timeRemaining || 30;
            console.log('🎮 updateGameUIElements: Setting timer:', timeRemaining);
            timerDisplay.textContent = timeRemaining;
            console.log('🎮 updateGameUIElements: Timer updated successfully');
        } else {
            console.error('🚨 updateGameUIElements: timer element not found');
        }

        // Update game header info
        if (gameCodeDisplay && questionData.lobbyCode) {
            console.log('🎮 updateGameUIElements: Setting game code:', questionData.lobbyCode);
            gameCodeDisplay.textContent = questionData.lobbyCode;
            console.log('🎮 updateGameUIElements: Game code updated successfully');
        }

        if (playerCountDisplay && questionData.playerCount) {
            console.log('🎮 updateGameUIElements: Setting player count:', questionData.playerCount);
            playerCountDisplay.textContent = questionData.playerCount;
            console.log('🎮 updateGameUIElements: Player count updated successfully');
        }

        // Update answers - CRITICAL FIX
        if (answersContainer) {
            console.log('🎮 updateGameUIElements: Clearing answers container');
            answersContainer.innerHTML = '';
            
            // Reset answer button states for new question
            resetAnswerButtons();
            
            console.log('🎮 updateGameUIElements: Question type:', questionData.type);
            console.log('🎮 updateGameUIElements: Question options:', questionData.options);
            
            if (questionData.type === 'multiple_choice' && questionData.options) {
                console.log('🎮 updateGameUIElements: Creating multiple choice buttons');
                questionData.options.forEach((option, index) => {
                    const button = document.createElement('button');
                    button.className = 'answer-btn';
                    button.textContent = option;
                    button.dataset.answer = index;
                    button.addEventListener('click', () => handleAnswerClick(index, button));
                    answersContainer.appendChild(button);
                    console.log(`🎮 updateGameUIElements: Created button ${index}: ${option}`);
                });
                console.log('🎮 updateGameUIElements: Multiple choice buttons created successfully');
            } else if (questionData.type === 'true_false') {
                console.log('🎮 updateGameUIElements: Creating true/false buttons');
                ['True', 'False'].forEach((option, index) => {
                    const button = document.createElement('button');
                    button.className = 'answer-btn';
                    button.textContent = option;
                    button.dataset.answer = index === 0;
                    button.addEventListener('click', () => handleAnswerClick(index === 0, button));
                    answersContainer.appendChild(button);
                    console.log(`🎮 updateGameUIElements: Created T/F button ${index}: ${option}`);
                });
                console.log('🎮 updateGameUIElements: True/false buttons created successfully');
            } else {
                console.error('🚨 updateGameUIElements: Unknown question type or missing options:', {
                    type: questionData.type,
                    options: questionData.options
                });
                
                // Create placeholder if no valid question data
                answersContainer.innerHTML = '<div class="error">Error loading question options</div>';
                return;
            }
        } else {
            console.error('🚨 updateGameUIElements: answers-grid element not found');
            return; // Critical element missing
        }

        // Update player list
        console.log('🎮 updateGameUIElements: Updating player list');
        updatePlayerList(questionData);
        
        console.log('🎮 updateGameUIElements: UI update completed successfully');
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
     * Resets answer button states for new question
     */
    function resetAnswerButtons() {
        const answerButtons = document.querySelectorAll('.answer-btn');
        answerButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('answered', 'selected', 'correct', 'incorrect', 'show-correct');
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

            // Submit answer and get immediate feedback
            const result = await gameEngine.submitAnswer(currentUser.username, answer);
            
            // IMMEDIATE VISUAL FEEDBACK: Show correct/incorrect state right after submission
            if (result.isCorrect) {
                // Show correct answer feedback
                buttonElement.classList.add('correct');
                buttonElement.classList.remove('selected');
                
                // Update score display immediately with animation
                const currentGame = gameEngine.getCurrentGame();
                if (currentGame && currentGame.scores) {
                    const newScore = currentGame.scores[currentUser.username] || 0;
                    updatePlayerScoreWithAnimation(currentUser.username, newScore);
                }
            } else {
                // Show incorrect answer feedback
                buttonElement.classList.add('incorrect');
                buttonElement.classList.remove('selected');
                
                // Also highlight the correct answer
                showCorrectAnswer(answerButtons, result.correctAnswer);
            }

        } catch (error) {
            console.error('Failed to submit answer:', error);
            
            // Re-enable buttons on error
            const answerButtons = document.querySelectorAll('.answer-btn');
            answerButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('selected');
            });
            
            alert('Failed to submit answer: ' + error.message);
        }
    }

    /**
     * Shows the correct answer by highlighting it
     * @param {NodeList} answerButtons - All answer buttons
     * @param {any} correctAnswer - The correct answer value
     */
    function showCorrectAnswer(answerButtons, correctAnswer) {
        // Get current question data to determine correct button
        const currentGame = gameEngine.getCurrentGame();
        if (!currentGame) return;

        answerButtons.forEach((btn, index) => {
            // For multiple choice, compare index with correct answer
            // For true/false, compare button text with correct answer
            const buttonAnswer = btn.textContent === 'True' ? true : 
                                btn.textContent === 'False' ? false : index;
            
            if (buttonAnswer === correctAnswer) {
                btn.classList.add('show-correct');
            }
        });
    }

    /**
     * Updates player score with visual animation
     * @param {string} username - Player username
     * @param {number} newScore - New score value
     */
    function updatePlayerScoreWithAnimation(username, newScore) {
        const playerCards = document.querySelectorAll('#game-players-list .player-card');
        playerCards.forEach(card => {
            const nameElement = card.querySelector('.player-name');
            const scoreElement = card.querySelector('.player-score');
            
            if (nameElement && scoreElement && nameElement.textContent === username) {
                // Animate score update
                scoreElement.textContent = newScore;
                scoreElement.classList.add('score-update');
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    scoreElement.classList.remove('score-update');
                }, 800);
            }
        });
    }

    /**
     * Shows question results with enhanced visual feedback
     * @param {Object} results - Question results
     */
    function showQuestionResults(results) {
        console.log('Question results:', results);
        
        // Enhanced visual feedback for all answer buttons
        const answerButtons = document.querySelectorAll('.answer-btn');
        
        if (results.question && answerButtons.length > 0) {
            const correctAnswer = results.question.correct;
            
            answerButtons.forEach((btn, index) => {
                const buttonAnswer = results.question.type === 'multiple_choice' ? index : 
                                   (btn.textContent === 'True' ? true : false);
                
                // Clear existing classes
                btn.classList.remove('selected', 'correct', 'incorrect', 'show-correct');
                
                if (buttonAnswer === correctAnswer) {
                    // Always show correct answer with green glow
                    btn.classList.add('show-correct');
                } else if (btn.classList.contains('selected')) {
                    // Show selected wrong answers as incorrect
                    btn.classList.add('incorrect');
                }
            });
        }

        // Update all player scores in the UI with animations
        if (results.scores) {
            updateAllPlayerScores(results.scores);
        }
    }

    /**
     * Updates all player scores in the game UI with animations
     * @param {Object} scores - Player scores object
     */
    function updateAllPlayerScores(scores) {
        const playerCards = document.querySelectorAll('#game-players-list .player-card');
        playerCards.forEach(card => {
            const nameElement = card.querySelector('.player-name');
            const scoreElement = card.querySelector('.player-score');
            
            if (nameElement && scoreElement) {
                const username = nameElement.textContent;
                if (scores[username] !== undefined) {
                    const oldScore = parseInt(scoreElement.textContent) || 0;
                    const newScore = scores[username];
                    
                    // Only animate if score actually changed
                    if (newScore !== oldScore) {
                        scoreElement.textContent = newScore;
                        scoreElement.classList.add('score-update');
                        setTimeout(() => scoreElement.classList.remove('score-update'), 800);
                    }
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