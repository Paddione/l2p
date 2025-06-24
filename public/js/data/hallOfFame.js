/**
 * Hall of Fame Data Module
 * Provides data access layer for Hall of Fame functionality
 */

import apiClient from '/js/api/apiClient.js';

/**
 * Initializes the Hall of Fame data access layer
 * @returns {Object} Hall of Fame data interface
 */
export function initHallOfFame() {
    
    /**
     * Gets Hall of Fame entries
     * @param {Object} options - Query options
     * @param {string} options.catalogName - Filter by catalog name
     * @param {number} options.limit - Maximum number of entries to return
     * @returns {Promise<Array>} Array of Hall of Fame entries
     */
    async function getEntries(options = {}) {
        try {
            const response = await apiClient.getHallOfFame(options.catalogName, options.limit || 10);
            return response.entries || [];
        } catch (error) {
            console.error('Failed to get Hall of Fame entries:', error);
            throw error;
        }
    }

    /**
     * Gets statistics for a specific catalog
     * @param {string} catalogName - Catalog name (null for overall stats)
     * @returns {Promise<Object>} Statistics object
     */
    async function getCatalogStats(catalogName = null) {
        try {
            // For now, we'll calculate basic stats from the entries
            // This could be enhanced with a dedicated stats API endpoint
            const entries = await getEntries({ catalogName, limit: 1000 });
            
            if (entries.length === 0) {
                return {
                    totalPlays: 0,
                    averageScore: 0,
                    highestScore: 0,
                    averageAccuracy: 0
                };
            }

            const totalPlays = entries.length;
            const totalScore = entries.reduce((sum, entry) => sum + (entry.score || 0), 0);
            const totalAccuracy = entries.reduce((sum, entry) => sum + (entry.accuracy || 0), 0);
            const highestScore = Math.max(...entries.map(entry => entry.score || 0));

            return {
                totalPlays,
                averageScore: Math.round(totalScore / totalPlays),
                highestScore,
                averageAccuracy: totalAccuracy / totalPlays
            };
        } catch (error) {
            console.error('Failed to get catalog stats:', error);
            // Return default stats on error
            return {
                totalPlays: 0,
                averageScore: 0,
                highestScore: 0,
                averageAccuracy: 0
            };
        }
    }

    /**
     * Adds a new Hall of Fame entry
     * @param {Object} entry - Hall of Fame entry data
     * @returns {Promise<Object>} Created entry
     */
    async function addEntry(entry) {
        try {
            return await apiClient.addHallOfFameEntry(entry);
        } catch (error) {
            console.error('Failed to add Hall of Fame entry:', error);
            throw error;
        }
    }

    return {
        getEntries,
        getCatalogStats,
        addEntry
    };
} 