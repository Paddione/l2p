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
     * Shows the final scores
     * @param {Object} scores - Player scores
     * @param {string} winner - Winner username
     */
    function showFinalScores(scores, winner) {
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
    }

    return {
        updateScoreDisplay,
        updateTimerDisplay,
        showFinalScores
    };
} 