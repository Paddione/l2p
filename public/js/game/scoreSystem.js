/**
 * Score System Module
 * Handles scoring, multipliers, and score animations
 */

import { GAME_SETTINGS, CSS_CLASSES, ANIMATIONS } from '../utils/constants.js';
import { formatScore } from '../utils/helpers.js';
import { initAnimations } from '../ui/animations.js';

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
                <p>Upload your score to the Hall of Fame to compete with other players.</p>
                <button id="upload-to-hall-of-fame" class="btn-primary hall-of-fame-btn">
                    🏆 Upload to Hall of Fame
                </button>
                <div id="hall-of-fame-status" class="hall-of-fame-status"></div>
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
    }

    /**
     * Sets up the Hall of Fame upload functionality
     * @param {Object} scores - Player scores
     * @param {Object} gameData - Game data including multipliers, questions, etc.
     */
    function setupHallOfFameUpload(scores, gameData) {
        const uploadBtn = document.getElementById('upload-to-hall-of-fame');
        const statusDiv = document.getElementById('hall-of-fame-status');
        
        if (!uploadBtn || !statusDiv) return;

        uploadBtn.addEventListener('click', async () => {
            try {
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Uploading...';
                statusDiv.innerHTML = '<div class="loading-spinner"></div> Uploading your score...';

                // Get current user data
                const currentUser = JSON.parse(localStorage.getItem('quiz_meister_user_data'));
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

                // Upload to Hall of Fame
                const response = await fetch('/api/hall-of-fame', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('quiz_meister_token')}`
                    },
                    body: JSON.stringify(hallOfFameEntry)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to upload score');
                }

                const result = await response.json();
                
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



    return {
        updateScoreDisplay,
        updateTimerDisplay,
        showFinalScores
    };
} 