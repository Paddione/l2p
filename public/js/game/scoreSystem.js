/**
 * Score System Module
 * Handles scoring, multipliers, and score animations
 */

import { GAME_SETTINGS, CSS_CLASSES, ANIMATIONS } from '../utils/constants.js';
import { formatScore } from '../utils/helpers.js';
import { initAnimations } from '../ui/animations.js';
import apiClient from '../api/apiClient.js';
import { t } from '../utils/translations.js';
import { showNotification } from '../ui/notifications.js';

export function initScoreSystem() {
    const animations = initAnimations();

    /**
     * Updates player score display
     * @param {string} username - Player username
     * @param {number} score - New score
     * @param {number} points - Points earned
     * @param {number} multiplier - Current multiplier
     */
    function updateScoreDisplay(username, score, points, multiplier) {
        const scoreElement = document.querySelector(`[data-player="${username}"] .player-score`);
        if (!scoreElement) return;

        // Animate score change
        const oldScore = parseInt(scoreElement.textContent.replace(/,/g, '')) || 0;
        animateScoreChange(scoreElement, oldScore, score);

        // Show points earned
        if (points > 0) {
            animations.animatePointsEarned(username, points, multiplier);
        }

        // Update multiplier display
        updateMultiplierDisplay(username, multiplier);
    }

    /**
     * Animates score change
     * @param {HTMLElement} element - Score element
     * @param {number} start - Start value
     * @param {number} end - End value
     */
    function animateScoreChange(element, start, end) {
        const duration = 1000;
        const steps = 20;
        const stepDuration = duration / steps;
        const increment = (end - start) / steps;
        let current = start;
        let step = 0;

        const animation = setInterval(() => {
            current += increment;
            element.textContent = formatScore(Math.round(current));
            
            step++;
            if (step >= steps) {
                clearInterval(animation);
                element.textContent = formatScore(end);
            }
        }, stepDuration);
    }

    /**
     * Updates multiplier display
     * @param {string} username - Player username
     * @param {number} multiplier - New multiplier
     */
    function updateMultiplierDisplay(username, multiplier) {
        const multiplierElement = document.querySelector(`[data-player="${username}"] .multiplier-badge`);
        if (!multiplierElement) return;

        const oldMultiplier = parseInt(multiplierElement.dataset.value) || 1;
        multiplierElement.dataset.value = multiplier;
        multiplierElement.textContent = `x${multiplier}`;

        // Animate multiplier change
        animations.animateMultiplier(username, oldMultiplier, multiplier);
    }

    /**
     * Updates the timer display
     * @param {number} timeRemaining - Time remaining in seconds
     */
    function updateTimerDisplay(timeRemaining) {
        const timerElement = document.querySelector('.timer');
        if (!timerElement) return;

        timerElement.textContent = timeRemaining;

        // Animate timer warning
        animations.animateTimerWarning(timerElement, timeRemaining);
    }

    /**
     * Shows the final scores with Hall of Fame upload option
     * @param {Object} scores - Player scores
     * @param {string} winner - Winner username
     * @param {Object} gameData - Additional game data for Hall of Fame
     */
    function showFinalScores(scores, winner, gameData = {}) {
        const resultsContainer = document.querySelector('.results-container');
        if (!resultsContainer) return;

        // Sort players by score
        const sortedPlayers = Object.entries(scores)
            .sort(([,a], [,b]) => b - a);

        // Create results HTML
        resultsContainer.innerHTML = `
            <h2>Final Results</h2>
            <div class="results-list">
                ${sortedPlayers.map(([username, score], index) => `
                    <div class="result-item ${username === winner ? CSS_CLASSES.WINNER : ''}">
                        <span class="position">${index + 1}</span>
                        <span class="player-name">${username}</span>
                        <span class="final-score">${formatScore(score)}</span>
                        ${username === winner ? '<span class="winner-badge">👑 Winner!</span>' : ''}
                    </div>
                `).join('')}
            </div>
            <div class="hall-of-fame-section">
                <h3>Save Your Score!</h3>
                ${gameData.playedAllQuestions 
                    ? `<p>Upload your score to the Hall of Fame to compete with other players.</p>
                       <button id="upload-to-hall-of-fame" class="btn-primary hall-of-fame-btn">
                           🏆 Upload to Hall of Fame
                       </button>
                       <div id="hall-of-fame-status" class="hall-of-fame-status"></div>`
                    : `<p class="hall-of-fame-disabled">
                           🚫 Hall of Fame upload is only available when playing all questions in a question set.
                           <br>You played ${gameData.totalQuestions || 0} out of ${getMaxQuestions(gameData)} questions.
                       </p>`
                }
            </div>
            <div class="results-controls">
                <button id="return-to-lobby" class="btn-primary" style="display: none;">Return to Lobby</button>
                <button id="rejoin-lobby" class="btn-primary" style="display: none;">Rejoin Lobby</button>
                <button id="view-hall-of-fame" class="btn-primary">🏆 Hall of Fame</button>
                <button id="back-to-menu-from-results" class="btn-secondary">Back to Menu</button>
            </div>
        `;

        // Add animations
        resultsContainer.querySelectorAll('.result-item').forEach((item, index) => {
            setTimeout(() => {
                item.classList.add(ANIMATIONS.SLIDE_IN);
            }, index * 200);
        });

        // Animate winner
        if (winner) {
            animations.animateWinner(winner);
        }

        // Setup Hall of Fame upload
        setupHallOfFameUpload(scores, gameData);
        
        // Setup navigation buttons
        setupNavigationButtons(gameData);
        
        // Listen for host returned to lobby event
        document.addEventListener('hostReturnedToLobby', (event) => {
            const { lobbyCode, hostName, gamePhase } = event.detail;
            const rejoinLobbyBtn = document.getElementById('rejoin-lobby');
            
            if (rejoinLobbyBtn && gamePhase === 'waiting') {
                rejoinLobbyBtn.style.display = 'inline-block';
                
                // Update game data for the rejoin button
                gameData.gamePhase = gamePhase;
                gameData.lobbyCode = lobbyCode;
                
                // Re-setup navigation buttons with updated data
                setupNavigationButtons(gameData);
            }
        });
    }

    /**
     * Gets the maximum questions available in the question set
     * @param {Object} gameData - Game data
     * @returns {number} Maximum questions count
     */
    function getMaxQuestions(gameData) {
        // Try to get from current lobby data stored in playerManager
        try {
            const currentUser = JSON.parse(localStorage.getItem('learn2play_current_user') || '{}');
            const currentLobby = JSON.parse(localStorage.getItem('learn2play_current_lobby') || '{}');
            
            if (currentLobby && currentLobby.question_set && currentLobby.question_set.question_count) {
                return currentLobby.question_set.question_count;
            }
        } catch (error) {
            console.warn('Failed to get max questions from stored data:', error);
        }
        
        // Fallback to total questions if available
        return gameData.totalQuestions || 0;
    }

    /**
     * Sets up the Hall of Fame upload functionality
     * @param {Object} scores - Player scores
     * @param {Object} gameData - Game data including multipliers, questions, etc.
     */
    function setupHallOfFameUpload(scores, gameData) {
        const uploadBtn = document.getElementById('upload-to-hall-of-fame');
        const statusDiv = document.getElementById('hall-of-fame-status');
        
        // If buttons don't exist (because all questions weren't played), skip setup
        if (!uploadBtn || !statusDiv) {
            console.log('Hall of Fame upload not available - not all questions were played');
            return;
        }

        uploadBtn.addEventListener('click', async () => {
            try {
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Uploading...';
                statusDiv.innerHTML = '<div class="loading-spinner"></div> ' + t('STATUS.UPLOADING_SCORE');

                // Get current user data
                const currentUser = JSON.parse(localStorage.getItem('learn2play_current_user'));
                if (!currentUser) {
                    throw new Error('Please log in to upload your score');
                }

                const username = currentUser.username;
                const userScore = scores[username];
                
                if (userScore === undefined) {
                    throw new Error('Your score was not found');
                }

                // Calculate game statistics
                const totalQuestions = gameData.totalQuestions || 10;
                const correctAnswers = gameData.correctAnswers?.[username] || 0;
                const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
                const maxMultiplier = gameData.multipliers?.[username] || 1;
                const catalogName = gameData.catalogName || 'Default Quiz';

                // Prepare Hall of Fame entry
                const hallOfFameEntry = {
                    score: userScore,
                    questions: totalQuestions,
                    accuracy: accuracy,
                    maxMultiplier: maxMultiplier,
                    catalogName: catalogName
                };

                // Upload to Hall of Fame using API client
                const result = await apiClient.addHallOfFameEntry(hallOfFameEntry);
                
                // Show success message
                statusDiv.innerHTML = `
                    <div class="success-message">
                        ✅ Score uploaded successfully! 
                        <br>Your score of ${formatScore(userScore)} has been added to the Hall of Fame.
                    </div>
                `;
                
                uploadBtn.textContent = '✅ Uploaded!';
                uploadBtn.classList.add('success');

            } catch (error) {
                console.error('Failed to upload to Hall of Fame:', error);
                
                statusDiv.innerHTML = `
                    <div class="error-message">
                        ❌ ${error.message}
                        <br><button id="retry-upload" class="btn-secondary">Try Again</button>
                    </div>
                `;
                
                uploadBtn.disabled = false;
                uploadBtn.textContent = '🏆 Upload to Hall of Fame';

                // Setup retry functionality
                const retryBtn = document.getElementById('retry-upload');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        statusDiv.innerHTML = '';
                        uploadBtn.click();
                    });
                }
            }
        });
    }

    /**
     * Sets up navigation button event handlers
     * @param {Object} gameData - Game data including lobby information
     */
    function setupNavigationButtons(gameData) {
        const returnToLobbyBtn = document.getElementById('return-to-lobby');
        const rejoinLobbyBtn = document.getElementById('rejoin-lobby');
        const viewHallOfFameBtn = document.getElementById('view-hall-of-fame');
        const backToMenuBtn = document.getElementById('back-to-menu-from-results');
        
        // Check if we have lobby information and current user
        const currentUser = JSON.parse(localStorage.getItem('learn2play_current_user') || '{}');
        const lobbyCode = gameData.lobbyCode;
        const isHost = gameData.isHost || false;
        const gamePhase = gameData.gamePhase;
        
        // Show return to lobby button for hosts in post-game phase
        if (returnToLobbyBtn && isHost && gamePhase === 'post-game' && lobbyCode) {
            returnToLobbyBtn.style.display = 'inline-block';
            returnToLobbyBtn.addEventListener('click', async () => {
                try {
                    returnToLobbyBtn.disabled = true;
                    returnToLobbyBtn.textContent = t('STATUS.RETURNING');
                    
                    // Call API to return to lobby
                    const result = await apiClient.returnToLobby(lobbyCode);
                    
                    // Dispatch event to return to lobby screen
                    const event = new CustomEvent('returnToLobby', { 
                        detail: { lobbyCode, lobbyData: result } 
                    });
                    document.dispatchEvent(event);
                    
                } catch (error) {
                    console.error('Failed to return to lobby:', error);
                    showNotification(t('ERRORS.FAILED_TO_RETURN_TO_LOBBY') + ': ' + error.message, 'error');
                    returnToLobbyBtn.disabled = false;
                    returnToLobbyBtn.textContent = t('LOBBY.RETURN_TO_LOBBY');
                }
            });
        }
        
        // Show rejoin lobby button for non-hosts when host has returned
        if (rejoinLobbyBtn && !isHost && gamePhase === 'waiting' && lobbyCode) {
            rejoinLobbyBtn.style.display = 'inline-block';
            rejoinLobbyBtn.addEventListener('click', async () => {
                try {
                    rejoinLobbyBtn.disabled = true;
                    rejoinLobbyBtn.textContent = t('STATUS.REJOINING');
                    
                    // Call API to rejoin lobby
                    const result = await apiClient.rejoinLobby(lobbyCode);
                    
                    // Dispatch event to return to lobby screen
                    const event = new CustomEvent('rejoinLobby', { 
                        detail: { lobbyCode, lobbyData: result } 
                    });
                    document.dispatchEvent(event);
                    
                } catch (error) {
                    console.error('Failed to rejoin lobby:', error);
                    showNotification(t('ERRORS.FAILED_TO_REJOIN_LOBBY') + ': ' + error.message, 'error');
                    rejoinLobbyBtn.disabled = false;
                    rejoinLobbyBtn.textContent = t('LOBBY.REJOIN_LOBBY');
                }
            });
        }
        
        if (viewHallOfFameBtn) {
            viewHallOfFameBtn.addEventListener('click', () => {
                // Dispatch event to show hall of fame
                const event = new CustomEvent('showHallOfFame');
                document.dispatchEvent(event);
            });
        }
        
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                // Dispatch event to go back to main menu
                const event = new CustomEvent('backToMenu');
                document.dispatchEvent(event);
            });
        }
    }

    return {
        updateScoreDisplay,
        updateTimerDisplay,
        showFinalScores
    };
} 