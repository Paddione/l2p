/**
 * Statistics Manager - Handles the Player Statistics Dashboard
 */

import { apiClient } from '../api/apiClient.js';
import { t } from '../utils/translations.js';
import { screenManager } from './screenManager.js';
import { showNotification } from './notifications.js';

class StatisticsManager {
    constructor() {
        this.currentStats = null;
        this.achievementsData = null;
        this.initialized = false;
        
        // Bind methods
        this.showStatistics = this.showStatistics.bind(this);
        this.refreshStatistics = this.refreshStatistics.bind(this);
        this.goBackToMenu = this.goBackToMenu.bind(this);
        this.startFirstGame = this.startFirstGame.bind(this);
        this.retryStatistics = this.retryStatistics.bind(this);
    }

    /**
     * Initialize the statistics manager
     */
    initialize() {
        if (this.initialized) return;
        
        this.setupEventListeners();
        this.setupAchievements();
        this.initialized = true;
        
        console.log('Statistics manager initialized');
    }

    /**
     * Setup event listeners for statistics dashboard
     */
    setupEventListeners() {
        // Statistics button in main menu
        const statisticsBtn = document.getElementById('statistics-btn');
        if (statisticsBtn) {
            statisticsBtn.addEventListener('click', this.showStatistics);
        }

        // Back to menu button
        const backBtn = document.getElementById('back-to-menu-from-stats');
        if (backBtn) {
            backBtn.addEventListener('click', this.goBackToMenu);
        }

        // Refresh statistics button
        const refreshBtn = document.getElementById('refresh-statistics-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.refreshStatistics);
        }

        // Retry button for error state
        const retryBtn = document.getElementById('retry-statistics-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', this.retryStatistics);
        }

        // Start first game button
        const startGameBtn = document.getElementById('start-first-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', this.startFirstGame);
        }
    }

    /**
     * Show the statistics dashboard and load data
     */
    async showStatistics() {
        try {
            screenManager.showScreen('statistics-screen');
            this.showLoadingState();
            
            await this.loadStatistics();
            
        } catch (error) {
            console.error('Error showing statistics:', error);
            this.showErrorState();
        }
    }

    /**
     * Load user statistics from the API
     */
    async loadStatistics() {
        try {
            console.log('Loading user statistics...');
            
            const response = await apiClient.get('/api/auth/stats');
            
            if (response.success && response.statistics) {
                this.currentStats = response.statistics;
                this.populateStatistics(response.statistics);
                this.showContentState();
            } else {
                throw new Error('Invalid statistics response');
            }
            
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.showErrorState();
            
            // Show user-friendly error message
            if (error.status === 401) {
                showNotification(t('STATISTICS.ERROR_UNAUTHORIZED'), 'error');
            } else {
                showNotification(t('STATISTICS.ERROR_LOAD_FAILED'), 'error');
            }
        }
    }

    /**
     * Populate the statistics dashboard with user data
     */
    populateStatistics(stats) {
        console.log('Populating statistics dashboard:', stats);
        
        // Check if user has no data
        if (stats.totalGamesPlayed === 0) {
            this.showNoDataState();
            return;
        }

        // Populate overview cards
        this.populateOverviewCards(stats);
        
        // Populate performance analysis
        this.populatePerformanceAnalysis(stats);
        
        // Populate achievements
        this.populateAchievements(stats);
    }

    /**
     * Populate the overview statistics cards
     */
    populateOverviewCards(stats) {
        // Games played
        const gamesPlayedEl = document.getElementById('stat-games-played');
        if (gamesPlayedEl) {
            gamesPlayedEl.textContent = stats.totalGamesPlayed || 0;
        }

        // Best score
        const bestScoreEl = document.getElementById('stat-best-score');
        if (bestScoreEl) {
            bestScoreEl.textContent = stats.bestScore || 0;
        }

        // Hall of Fame entries
        const hallOfFameEl = document.getElementById('stat-hall-of-fame');
        if (hallOfFameEl) {
            hallOfFameEl.textContent = stats.hallOfFameEntries || 0;
        }

        // Average accuracy
        const accuracyEl = document.getElementById('stat-accuracy');
        if (accuracyEl) {
            const accuracy = Math.round(stats.averageAccuracy || 0);
            accuracyEl.textContent = `${accuracy}%`;
        }

        // Highest multiplier
        const multiplierEl = document.getElementById('stat-multiplier');
        if (multiplierEl) {
            multiplierEl.textContent = `${stats.highestMultiplier || 1}x`;
        }

        // Catalogs played
        const catalogsEl = document.getElementById('stat-catalogs');
        if (catalogsEl) {
            catalogsEl.textContent = stats.catalogsPlayed || 0;
        }
    }

    /**
     * Populate the performance analysis section
     */
    populatePerformanceAnalysis(stats) {
        // Accuracy visualization
        this.populateAccuracyVisualization(stats);
        
        // Score performance
        this.populateScorePerformance(stats);
        
        // Multiplier performance
        this.populateMultiplierPerformance(stats);
    }

    /**
     * Populate the accuracy circle visualization
     */
    populateAccuracyVisualization(stats) {
        const accuracy = stats.averageAccuracy || 0;
        const accuracyRounded = Math.round(accuracy);
        
        // Update accuracy percentage text
        const accuracyTextEl = document.getElementById('accuracy-percentage');
        if (accuracyTextEl) {
            accuracyTextEl.textContent = `${accuracyRounded}%`;
        }

        // Update accuracy circle fill
        const accuracyFillEl = document.getElementById('accuracy-fill');
        if (accuracyFillEl) {
            const degrees = (accuracy / 100) * 360;
            accuracyFillEl.style.background = `conic-gradient(var(--success) ${degrees}deg, var(--border) ${degrees}deg)`;
        }

        // Calculate correct/total answers (estimated from games played)
        const totalQuestions = (stats.totalGamesPlayed || 0) * 10; // Assuming average 10 questions per game
        const correctAnswers = Math.round((totalQuestions * accuracy) / 100);

        // Update correct answers
        const correctAnswersEl = document.getElementById('correct-answers');
        if (correctAnswersEl) {
            correctAnswersEl.textContent = correctAnswers;
        }

        // Update total questions
        const totalQuestionsEl = document.getElementById('total-questions');
        if (totalQuestionsEl) {
            totalQuestionsEl.textContent = totalQuestions;
        }
    }

    /**
     * Populate score performance data
     */
    populateScorePerformance(stats) {
        // Best score detail
        const bestScoreDetailEl = document.getElementById('best-score-detail');
        if (bestScoreDetailEl) {
            bestScoreDetailEl.textContent = stats.bestScore || 0;
        }

        // Average score (estimate based on best score and accuracy)
        const averageScore = Math.round((stats.bestScore || 0) * 0.7); // Rough estimate
        const averageScoreEl = document.getElementById('average-score');
        if (averageScoreEl) {
            averageScoreEl.textContent = averageScore;
        }

        // Score improvement (placeholder)
        const scoreImprovementEl = document.getElementById('score-improvement');
        if (scoreImprovementEl) {
            scoreImprovementEl.textContent = stats.totalGamesPlayed > 5 ? '+15%' : '--';
        }
    }

    /**
     * Populate multiplier performance data
     */
    populateMultiplierPerformance(stats) {
        // Highest multiplier detail
        const highestMultiplierEl = document.getElementById('highest-multiplier-detail');
        if (highestMultiplierEl) {
            highestMultiplierEl.textContent = `${stats.highestMultiplier || 1}x`;
        }

        // Average multiplier (estimate)
        const averageMultiplier = Math.max(1, Math.round((stats.highestMultiplier || 1) * 0.6));
        const averageMultiplierEl = document.getElementById('average-multiplier');
        if (averageMultiplierEl) {
            averageMultiplierEl.textContent = `${averageMultiplier}x`;
        }

        // Multiplier progress bar
        const multiplierFillEl = document.getElementById('multiplier-fill');
        if (multiplierFillEl) {
            const maxMultiplier = 10; // Assuming max multiplier is 10
            const fillPercent = Math.min(100, ((stats.highestMultiplier || 1) / maxMultiplier) * 100);
            
            setTimeout(() => {
                multiplierFillEl.style.width = `${fillPercent}%`;
            }, 500); // Delay for animation effect
        }
    }

    /**
     * Populate achievements section
     */
    populateAchievements(stats) {
        const achievementsGrid = document.getElementById('achievements-grid');
        if (!achievementsGrid) return;

        achievementsGrid.innerHTML = '';

        // Generate achievements based on stats
        const achievements = this.generateAchievements(stats);

        achievements.forEach(achievement => {
            const achievementCard = document.createElement('div');
            achievementCard.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            
            achievementCard.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
            `;
            
            achievementsGrid.appendChild(achievementCard);
        });
    }

    /**
     * Generate achievements based on user statistics
     */
    generateAchievements(stats) {
        return [
            {
                icon: '🎮',
                title: t('ACHIEVEMENTS.FIRST_GAME_TITLE'),
                description: t('ACHIEVEMENTS.FIRST_GAME_DESC'),
                unlocked: stats.totalGamesPlayed >= 1
            },
            {
                icon: '🏆',
                title: t('ACHIEVEMENTS.HALL_OF_FAME_TITLE'),
                description: t('ACHIEVEMENTS.HALL_OF_FAME_DESC'),
                unlocked: stats.hallOfFameEntries >= 1
            },
            {
                icon: '🎯',
                title: t('ACHIEVEMENTS.ACCURACY_MASTER_TITLE'),
                description: t('ACHIEVEMENTS.ACCURACY_MASTER_DESC'),
                unlocked: stats.averageAccuracy >= 80
            },
            {
                icon: '⚡',
                title: t('ACHIEVEMENTS.SPEED_DEMON_TITLE'),
                description: t('ACHIEVEMENTS.SPEED_DEMON_DESC'),
                unlocked: stats.highestMultiplier >= 5
            },
            {
                icon: '🔥',
                title: t('ACHIEVEMENTS.STREAK_MASTER_TITLE'),
                description: t('ACHIEVEMENTS.STREAK_MASTER_DESC'),
                unlocked: stats.highestMultiplier >= 8
            },
            {
                icon: '📚',
                title: t('ACHIEVEMENTS.SCHOLAR_TITLE'),
                description: t('ACHIEVEMENTS.SCHOLAR_DESC'),
                unlocked: stats.catalogsPlayed >= 5
            },
            {
                icon: '👑',
                title: t('ACHIEVEMENTS.CHAMPION_TITLE'),
                description: t('ACHIEVEMENTS.CHAMPION_DESC'),
                unlocked: stats.bestScore >= 1000
            },
            {
                icon: '🌟',
                title: t('ACHIEVEMENTS.VETERAN_TITLE'),
                description: t('ACHIEVEMENTS.VETERAN_DESC'),
                unlocked: stats.totalGamesPlayed >= 50
            }
        ];
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const loadingEl = document.getElementById('statistics-loading');
        const contentEl = document.getElementById('statistics-content');
        const errorEl = document.getElementById('statistics-error');
        const noDataEl = document.getElementById('no-data-section');

        if (loadingEl) loadingEl.style.display = 'block';
        if (contentEl) contentEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (noDataEl) noDataEl.style.display = 'none';
    }

    /**
     * Show content state
     */
    showContentState() {
        const loadingEl = document.getElementById('statistics-loading');
        const contentEl = document.getElementById('statistics-content');
        const errorEl = document.getElementById('statistics-error');
        const noDataEl = document.getElementById('no-data-section');

        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';
        if (noDataEl) noDataEl.style.display = 'none';
    }

    /**
     * Show error state
     */
    showErrorState() {
        const loadingEl = document.getElementById('statistics-loading');
        const contentEl = document.getElementById('statistics-content');
        const errorEl = document.getElementById('statistics-error');
        const noDataEl = document.getElementById('no-data-section');

        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (noDataEl) noDataEl.style.display = 'none';
    }

    /**
     * Show no data state
     */
    showNoDataState() {
        const loadingEl = document.getElementById('statistics-loading');
        const contentEl = document.getElementById('statistics-content');
        const errorEl = document.getElementById('statistics-error');
        const noDataEl = document.getElementById('no-data-section');

        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (noDataEl) noDataEl.style.display = 'block';
    }

    /**
     * Refresh statistics data
     */
    async refreshStatistics() {
        console.log('Refreshing statistics...');
        showNotification(t('STATISTICS.REFRESHING'), 'info');
        
        try {
            this.showLoadingState();
            await this.loadStatistics();
            showNotification(t('STATISTICS.REFRESH_SUCCESS'), 'success');
        } catch (error) {
            console.error('Error refreshing statistics:', error);
            showNotification(t('STATISTICS.REFRESH_ERROR'), 'error');
        }
    }

    /**
     * Retry loading statistics
     */
    async retryStatistics() {
        await this.loadStatistics();
    }

    /**
     * Go back to main menu
     */
    goBackToMenu() {
        screenManager.showScreen('main-menu-screen');
    }

    /**
     * Start first game (redirect to create game)
     */
    startFirstGame() {
        // Navigate to create game screen
        screenManager.showScreen('question-set-selection-screen');
    }

    /**
     * Setup achievements data
     */
    setupAchievements() {
        this.achievementsData = {
            // This could be expanded with more achievement logic
        };
    }

    /**
     * Get current statistics
     */
    getCurrentStats() {
        return this.currentStats;
    }

    /**
     * Update statistics after a game
     */
    updateAfterGame(gameStats) {
        // This could be called after a game to update cached stats
        if (this.currentStats) {
            // Update relevant stats
            console.log('Updating statistics after game:', gameStats);
        }
    }
}

// Create and export singleton instance
const statisticsManager = new StatisticsManager();

export default statisticsManager; 