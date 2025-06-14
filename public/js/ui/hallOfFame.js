/**
 * Hall of Fame UI Module
 * Handles the display and interaction with the Hall of Fame screen
 */

import { initHallOfFame } from '/js/data/hallOfFame.js';

export function initHallOfFameUI(storage) {
    const hallOfFame = initHallOfFame();
    let currentCatalog = null;

    /**
     * Initializes the Hall of Fame UI
     */
    async function init() {
        const container = document.querySelector('.hall-of-fame');
        if (!container) {
            console.error('Hall of Fame container not found');
            return;
        }

        // Add event listeners for catalog selection
        const catalogSelect = container.querySelector('.catalog-selector select');
        if (catalogSelect) {
            catalogSelect.addEventListener('change', (e) => {
                currentCatalog = e.target.value;
                refreshLeaderboard();
            });
        }

        // Initial load
        await refreshLeaderboard();
    }

    /**
     * Refreshes the leaderboard display
     */
    async function refreshLeaderboard() {
        const container = document.querySelector('.hall-of-fame');
        if (!container) return;

        try {
            const entries = await hallOfFame.getEntries({
                catalogName: currentCatalog,
                limit: 10
            });

            const stats = await hallOfFame.getCatalogStats(currentCatalog);

            updateLeaderboardUI(entries);
            updateStatsUI(stats);
        } catch (error) {
            console.error('Failed to refresh leaderboard:', error);
            container.innerHTML = '<p class="error">Failed to load Hall of Fame</p>';
        }
    }

    /**
     * Updates the leaderboard UI with entries
     * @param {Array} entries - Hall of Fame entries
     */
    function updateLeaderboardUI(entries) {
        const leaderboard = document.querySelector('.leaderboard');
        if (!leaderboard) return;

        if (entries.length === 0) {
            leaderboard.innerHTML = '<p class="empty">No entries yet</p>';
            return;
        }

        const html = entries.map((entry, index) => `
            <div class="leaderboard-entry ${index < 3 ? 'top-' + (index + 1) : ''}">
                <span class="rank">#${index + 1}</span>
                <span class="player">
                    <span class="character">${entry.character}</span>
                    <span class="username">${entry.username}</span>
                </span>
                <span class="score">${entry.score.toLocaleString()}</span>
                <span class="details">
                    <span class="accuracy">${Math.round(entry.accuracy)}%</span>
                    <span class="multiplier">x${entry.maxMultiplier}</span>
                </span>
            </div>
        `).join('');

        leaderboard.innerHTML = html;
    }

    /**
     * Updates the stats UI
     * @param {Object} stats - Hall of Fame statistics
     */
    function updateStatsUI(stats) {
        const statsContainer = document.querySelector('.hall-of-fame-stats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stat">
                <span class="label">Total Plays</span>
                <span class="value">${stats.totalPlays.toLocaleString()}</span>
            </div>
            <div class="stat">
                <span class="label">Average Score</span>
                <span class="value">${stats.averageScore.toLocaleString()}</span>
            </div>
            <div class="stat">
                <span class="label">Highest Score</span>
                <span class="value">${stats.highestScore.toLocaleString()}</span>
            </div>
            <div class="stat">
                <span class="label">Average Accuracy</span>
                <span class="value">${Math.round(stats.averageAccuracy)}%</span>
            </div>
        `;
    }

    // Initialize
    init();

    return {
        refreshLeaderboard
    };
} 