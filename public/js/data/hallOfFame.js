/**
 * Hall of Fame Module
 * Manages high scores and player achievements via LocalStorage
 */

import { STORAGE_KEYS } from '../utils/constants.js';

export function initHallOfFame() {
    /**
     * Gets entries from LocalStorage
     * @returns {Array} Array of Hall of Fame entries
     */
    function getStoredEntries() {
        const storedData = localStorage.getItem(STORAGE_KEYS.HALL_OF_FAME);
        try {
            return storedData ? JSON.parse(storedData) : [];
        } catch (error) {
            console.error('Failed to parse stored Hall of Fame data:', error);
            return [];
        }
    }

    /**
     * Saves entries to LocalStorage
     * @param {Array} entries - Array of Hall of Fame entries
     */
    function saveEntries(entries) {
        try {
            localStorage.setItem(STORAGE_KEYS.HALL_OF_FAME, JSON.stringify(entries));
        } catch (error) {
            console.error('Failed to save Hall of Fame entries:', error);
        }
    }

    /**
     * Adds a new entry to the Hall of Fame
     * @param {Object} entry - The entry to add
     * @param {number} entry.score - Final score
     * @param {number} entry.questions - Total questions answered
     * @param {number} entry.accuracy - Percentage of correct answers
     * @param {number} entry.maxMultiplier - Highest multiplier achieved
     * @param {string} entry.catalogName - Name of the question catalog used
     * @returns {Promise<string>} The ID of the new entry
     */
    async function addEntry({ score, questions, accuracy, maxMultiplier, catalogName }) {
        try {
            const entries = getStoredEntries();
            const newEntry = {
                id: crypto.randomUUID(),
                username: localStorage.getItem(STORAGE_KEYS.CURRENT_USER),
                character: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA))?.character || '👤',
                score,
                questions,
                accuracy,
                maxMultiplier,
                catalogName,
                timestamp: new Date().toISOString()
            };
            
            entries.push(newEntry);
            entries.sort((a, b) => b.score - a.score); // Sort by score descending
            saveEntries(entries);
            return newEntry.id;
        } catch (error) {
            console.error('Failed to add Hall of Fame entry:', error);
            throw new Error('Failed to save your score. Please try again.');
        }
    }

    /**
     * Gets all Hall of Fame entries
     * @param {Object} options - Filter options
     * @param {string} [options.catalogName] - Filter by catalog name
     * @param {number} [options.limit] - Maximum number of entries to return
     * @returns {Promise<Array>} Array of Hall of Fame entries
     */
    async function getEntries({ catalogName, limit } = {}) {
        try {
            let entries = getStoredEntries();
            
            // Filter by catalog if specified
            if (catalogName) {
                entries = entries.filter(entry => entry.catalogName === catalogName);
            }
            
            // Apply limit if specified
            if (limit && limit > 0) {
                entries = entries.slice(0, limit);
            }
            
            return entries;
        } catch (error) {
            console.error('Failed to get Hall of Fame entries:', error);
            return [];
        }
    }

    /**
     * Gets a player's best entry
     * @param {string} username - Player's username
     * @returns {Promise<Object|null>} The player's best entry or null if not found
     */
    async function getPlayerBest(username) {
        try {
            const entries = getStoredEntries();
            const playerEntries = entries.filter(entry => entry.username === username);
            return playerEntries.length > 0 ? playerEntries[0] : null;
        } catch (error) {
            console.error('Failed to get player best:', error);
            return null;
        }
    }

    /**
     * Gets statistics for a specific catalog
     * @param {string} catalogName - Name of the catalog
     * @returns {Promise<Object>} Catalog statistics
     */
    async function getCatalogStats(catalogName) {
        try {
            let entries = getStoredEntries();
            
            // Filter by catalog if specified
            if (catalogName) {
                entries = entries.filter(entry => entry.catalogName === catalogName);
            }

            if (entries.length === 0) {
                return {
                    totalPlays: 0,
                    averageScore: 0,
                    highestScore: 0,
                    averageAccuracy: 0
                };
            }

            const stats = entries.reduce((acc, entry) => {
                acc.totalPlays++;
                acc.totalScore += (typeof entry.score === 'number' ? entry.score : 0);
                acc.totalAccuracy += (typeof entry.accuracy === 'number' ? entry.accuracy : 0);
                acc.highestScore = Math.max(acc.highestScore, (typeof entry.score === 'number' ? entry.score : 0));
                return acc;
            }, { totalPlays: 0, totalScore: 0, totalAccuracy: 0, highestScore: 0 });

            return {
                totalPlays: stats.totalPlays,
                averageScore: stats.totalPlays > 0 ? Math.round(stats.totalScore / stats.totalPlays) : 0,
                highestScore: stats.highestScore,
                averageAccuracy: stats.totalPlays > 0 ? Math.round(stats.totalAccuracy / stats.totalPlays) : 0
            };
        } catch (error) {
            console.error('Failed to get catalog stats:', error);
            return {
                totalPlays: 0,
                averageScore: 0,
                highestScore: 0,
                averageAccuracy: 0
            };
        }
    }

    /**
     * Clear all entries (useful for testing)
     */
    async function clearEntries() {
        try {
            localStorage.removeItem(STORAGE_KEYS.HALL_OF_FAME);
        } catch (error) {
            console.error('Failed to clear Hall of Fame:', error);
            throw new Error('Failed to clear Hall of Fame. Please try again.');
        }
    }

    return {
        getEntries,
        getCatalogStats,
        addEntry,
        getPlayerBest,
        clearEntries
    };
}