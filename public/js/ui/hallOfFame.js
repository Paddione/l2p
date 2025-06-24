/**
 * Hall of Fame UI Module
 * Handles the display and interaction with the Hall of Fame screen
 */

import { initHallOfFame } from '/js/data/hallOfFame.js';
import { questionSetsApi } from '/js/api/questionSetsApi.js';
import { SCREENS } from '/js/utils/constants.js';
import { t } from '../utils/translations.js';

export function initHallOfFameUI() {
    const hallOfFame = initHallOfFame();
    let currentCatalog = null;
    let availableQuestionSets = [];

    /**
     * Initializes the Hall of Fame UI
     */
    async function init() {
        console.log('Initializing Hall of Fame UI...');
        await loadAvailableQuestionSets();
        await setupUI();
        
        // Set up back button handler
        const backBtn = document.getElementById('back-from-hof');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                const screenManager = window.getModule('screenManager');
                if (screenManager) {
                    screenManager.showScreen(SCREENS.MAIN_MENU);
                }
            });
        }
    }

    /**
     * Loads available question sets from the API
     */
    async function loadAvailableQuestionSets() {
        try {
            console.log('Loading available question sets...');
            
            // Get all available question sets
            const questionSets = await questionSetsApi.getAll();
            
            // Extract catalog names from the question sets
            availableQuestionSets = questionSets.map(qs => qs.name).sort();
            
            console.log('Available question sets:', availableQuestionSets);
            
            // Set default catalog to first available
            if (availableQuestionSets.length > 0 && !currentCatalog) {
                currentCatalog = availableQuestionSets[0];
            }
        } catch (error) {
            console.error('Failed to load available question sets:', error);
            availableQuestionSets = [];
        }
    }

    /**
     * Sets up the Hall of Fame UI structure
     */
    async function setupUI() {
        const container = document.querySelector('.hall-of-fame');
        if (!container) {
            console.error('Hall of Fame container not found');
            return;
        }

        // Create the UI structure
        container.innerHTML = `
            <div class="hall-of-fame-header">
                <h2>${t('HALL_OF_FAME.TITLE')}</h2>
                <p class="subtitle">${t('HALL_OF_FAME.SELECT_CATALOG')}</p>
            </div>
            
            <div class="catalog-selection">
                <label for="catalog-select">${t('HALL_OF_FAME.SELECT_CATALOG')}:</label>
                <select id="catalog-select" class="catalog-selector">
                    <option value="">${t('HALL_OF_FAME.SELECT_CATALOG')}...</option>
                    ${availableQuestionSets.map(catalog => 
                        `<option value="${catalog}" ${catalog === currentCatalog ? 'selected' : ''}>${catalog}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="hall-of-fame-content">
                <div class="leaderboard-section">
                    <div id="leaderboard-container" class="leaderboard-container">
                        ${currentCatalog ? '' : '<div class="no-selection">' + t('STATUS.PLEASE_SELECT_QUESTION_SET') + '</div>'}
                    </div>
                </div>
            </div>
            
            <div class="hall-of-fame-actions">
                <button id="back-from-hof" class="btn-secondary">${t('HALL_OF_FAME.BACK_TO_MENU')}</button>
            </div>
        `;

        // Set up catalog selection handler
        const catalogSelect = document.getElementById('catalog-select');
        if (catalogSelect) {
            catalogSelect.addEventListener('change', async (e) => {
                const selectedCatalog = e.target.value;
                if (selectedCatalog) {
                    currentCatalog = selectedCatalog;
                    await refreshLeaderboard();
                } else {
                    currentCatalog = null;
                    showNoSelection();
                }
            });
        }

        // Load initial leaderboard if catalog is selected
        if (currentCatalog) {
            await refreshLeaderboard();
        }
    }

    /**
     * Shows no selection message
     */
    function showNoSelection() {
        const container = document.getElementById('leaderboard-container');
        if (container) {
            container.innerHTML = '<div class="no-selection">' + t('STATUS.PLEASE_SELECT_QUESTION_SET') + '</div>';
        }
    }

    /**
     * Refreshes the leaderboard display for the current catalog
     */
    async function refreshLeaderboard() {
        const container = document.getElementById('leaderboard-container');
        if (!container || !currentCatalog) return;

        try {
            // Show loading state
            container.innerHTML = '<div class="loading">' + t('STATUS.LOADING_SCORES') + '</div>';

            console.log('Loading leaderboard for catalog:', currentCatalog);
            
            // Get top 10 entries for the selected catalog
            const entries = await hallOfFame.getEntries({
                catalogName: currentCatalog,
                limit: 10
            });

            console.log('Loaded entries:', entries);

            // Update the leaderboard display
            updateLeaderboardUI(entries);

        } catch (error) {
            console.error('Failed to refresh leaderboard:', error);
            container.innerHTML = '<div class="error">' + t('STATUS.FAILED_TO_LOAD_SCORES') + '</div>';
        }
    }

    /**
     * Updates the leaderboard UI with entries
     * @param {Array} entries - Hall of Fame entries
     */
    function updateLeaderboardUI(entries) {
        const container = document.getElementById('leaderboard-container');
        if (!container) return;

        if (!entries || entries.length === 0) {
            container.innerHTML = `
                <div class="no-scores">
                    <div class="no-scores-icon">🎯</div>
                    <h3>Noch keine Punktzahlen</h3>
                    <p>Sei der Erste, der eine Punktzahl für <strong>${currentCatalog}</strong> einreicht!</p>
                </div>
            `;
            return;
        }

        // Create leaderboard header
        const leaderboardHTML = `
            <div class="leaderboard-header">
                <h3>Top ${entries.length} Punktzahl${entries.length !== 1 ? 'en' : ''} für ${currentCatalog}</h3>
            </div>
            <div class="leaderboard-list">
                ${entries.map((entry, index) => {
                    const rank = index + 1;
                    const isTopThree = rank <= 3;
                    const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                    
                    return `
                        <div class="leaderboard-entry ${isTopThree ? 'top-three' : ''} rank-${rank}">
                            <div class="rank-section">
                                <span class="rank-number">${rank}</span>
                                ${medalEmoji ? `<span class="medal">${medalEmoji}</span>` : ''}
                            </div>
                            <div class="player-section">
                                <div class="player-info">
                                    <span class="character">${entry.character || '👤'}</span>
                                    <span class="username">${entry.username}</span>
                                </div>
                            </div>
                            <div class="score-section">
                                <span class="score">${entry.score.toLocaleString()}</span>
                                <div class="score-details">
                                    <span class="accuracy">${Math.round(entry.accuracy || 0)}% Genauigkeit</span>
                                    <span class="multiplier">Max ${entry.maxMultiplier || 1}x</span>
                                    <span class="questions">${entry.questions || 0} Fragen</span>
                                </div>
                            </div>
                            <div class="date-section">
                                <span class="date">${formatDate(entry.createdAt || entry.created_at)}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.innerHTML = leaderboardHTML;
    }

    /**
     * Formats a date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    function formatDate(dateString) {
        if (!dateString) return 'Unbekannt';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                return 'Heute';
            } else if (diffDays === 2) {
                return 'Gestern';
            } else if (diffDays <= 7) {
                return `vor ${diffDays - 1} Tagen`;
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            return 'Unbekannt';
        }
    }

    /**
     * Public method to refresh the current view
     */
    async function refresh() {
        await loadAvailableQuestionSets();
        if (currentCatalog) {
            await refreshLeaderboard();
        }
    }

    // Initialize when module is loaded
    init();

    return {
        refresh,
        refreshLeaderboard
    };
} 