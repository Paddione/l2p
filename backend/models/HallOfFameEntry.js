// backend/models/HallOfFameEntry.js
const { query, transaction } = require('../database/connection');

class HallOfFameEntry {
    constructor(data) {
        this.id = data.id;
        this.userId = data.user_id;
        this.username = data.username;
        this.character = data.character;
        this.score = data.score;
        this.questions = data.questions;
        this.accuracy = data.accuracy;
        this.maxMultiplier = data.max_multiplier;
        this.catalogName = data.catalog_name;
        this.createdAt = data.created_at ? new Date(data.created_at) : null;
    }

    /**
     * Create a new hall of fame entry
     * @param {Object} entryData - Entry data
     * @param {number} entryData.userId - User ID
     * @param {string} entryData.username - Username (denormalized)
     * @param {string} entryData.character - Character (denormalized)
     * @param {number} entryData.score - Final score
     * @param {number} entryData.questions - Total questions answered
     * @param {number} entryData.accuracy - Accuracy percentage (0-100)
     * @param {number} entryData.maxMultiplier - Highest multiplier achieved (1-5)
     * @param {string} entryData.catalogName - Name of the question catalog
     * @returns {Promise<HallOfFameEntry>} Created entry instance
     */
    static async create({ userId, username, character, score, questions, accuracy, maxMultiplier, catalogName }) {
        const result = await query(
            `INSERT INTO hall_of_fame (user_id, username, character, score, questions, accuracy, max_multiplier, catalog_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, user_id, username, character, score, questions, accuracy, max_multiplier, catalog_name, created_at`,
            [userId, username, character, score, questions, accuracy, maxMultiplier, catalogName]
        );

        if (result.rows.length === 0) {
            throw new Error('Failed to create hall of fame entry');
        }

        return new HallOfFameEntry(result.rows[0]);
    }

    /**
     * Get hall of fame entries with optional filtering
     * @param {Object} options - Query options
     * @param {string} [options.catalogName] - Filter by catalog name
     * @param {number} [options.limit=10] - Maximum number of entries to return
     * @param {number} [options.offset=0] - Number of entries to skip
     * @param {string} [options.orderBy='score'] - Field to order by
     * @param {string} [options.orderDirection='DESC'] - Order direction
     * @returns {Promise<Array>} Array of hall of fame entries
     */
    static async getEntries({ 
        catalogName = null, 
        limit = 10, 
        offset = 0, 
        orderBy = 'score', 
        orderDirection = 'DESC' 
    } = {}) {
        let queryText = `
            SELECT id, user_id, username, character, score, questions, accuracy, max_multiplier, catalog_name, created_at
            FROM hall_of_fame
        `;
        const params = [];
        let paramCount = 0;

        // Add catalog filter if specified
        if (catalogName) {
            paramCount++;
            queryText += ` WHERE catalog_name = $${paramCount}`;
            params.push(catalogName);
        }

        // Add ordering
        const validOrderFields = ['score', 'accuracy', 'max_multiplier', 'questions', 'created_at'];
        const validDirections = ['ASC', 'DESC'];
        
        const safeOrderBy = validOrderFields.includes(orderBy) ? orderBy : 'score';
        const safeDirection = validDirections.includes(orderDirection.toUpperCase()) ? orderDirection.toUpperCase() : 'DESC';
        
        queryText += ` ORDER BY ${safeOrderBy} ${safeDirection}, created_at DESC`;

        // Add pagination
        paramCount++;
        queryText += ` LIMIT $${paramCount}`;
        params.push(limit);

        if (offset > 0) {
            paramCount++;
            queryText += ` OFFSET $${paramCount}`;
            params.push(offset);
        }

        const result = await query(queryText, params);
        return result.rows.map(row => new HallOfFameEntry(row));
    }

    /**
     * Get statistics for a specific catalog
     * @param {string} catalogName - Catalog name
     * @returns {Promise<Object>} Catalog statistics
     */
    static async getCatalogStats(catalogName) {
        const result = await query(
            `SELECT 
                COUNT(*) as total_plays,
                COALESCE(AVG(score)::int, 0) as average_score,
                COALESCE(MAX(score), 0) as highest_score,
                COALESCE(AVG(accuracy)::int, 0) as average_accuracy,
                COALESCE(AVG(max_multiplier)::numeric(3,1), 1.0) as average_multiplier
             FROM hall_of_fame 
             WHERE catalog_name = $1`,
            [catalogName]
        );

        if (result.rows.length === 0) {
            return {
                totalPlays: 0,
                averageScore: 0,
                highestScore: 0,
                averageAccuracy: 0,
                averageMultiplier: 1.0
            };
        }

        const stats = result.rows[0];
        return {
            totalPlays: parseInt(stats.total_plays),
            averageScore: stats.average_score,
            highestScore: stats.highest_score,
            averageAccuracy: stats.average_accuracy,
            averageMultiplier: parseFloat(stats.average_multiplier)
        };
    }

    /**
     * Get overall statistics across all catalogs
     * @returns {Promise<Object>} Overall statistics
     */
    static async getOverallStats() {
        const result = await query(
            `SELECT 
                COUNT(*) as total_plays,
                COALESCE(AVG(score)::int, 0) as average_score,
                COALESCE(MAX(score), 0) as highest_score,
                COALESCE(AVG(accuracy)::int, 0) as average_accuracy,
                COALESCE(AVG(max_multiplier)::numeric(3,1), 1.0) as average_multiplier,
                COUNT(DISTINCT catalog_name) as total_catalogs,
                COUNT(DISTINCT user_id) as unique_players
             FROM hall_of_fame`
        );

        const stats = result.rows[0];
        return {
            totalPlays: parseInt(stats.total_plays),
            averageScore: stats.average_score,
            highestScore: stats.highest_score,
            averageAccuracy: stats.average_accuracy,
            averageMultiplier: parseFloat(stats.average_multiplier),
            totalCatalogs: parseInt(stats.total_catalogs),
            uniquePlayers: parseInt(stats.unique_players)
        };
    }

    /**
     * Get player's best entry for a specific catalog
     * @param {number} userId - User ID
     * @param {string} catalogName - Catalog name
     * @returns {Promise<HallOfFameEntry|null>} Best entry or null if not found
     */
    static async getPlayerBest(userId, catalogName) {
        const result = await query(
            `SELECT id, user_id, username, character, score, questions, accuracy, max_multiplier, catalog_name, created_at
             FROM hall_of_fame 
             WHERE user_id = $1 AND catalog_name = $2 
             ORDER BY score DESC 
             LIMIT 1`,
            [userId, catalogName]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return new HallOfFameEntry(result.rows[0]);
    }

    /**
     * Get player's all entries
     * @param {number} userId - User ID
     * @param {number} limit - Maximum number of entries to return
     * @returns {Promise<Array>} Array of player's entries
     */
    static async getPlayerEntries(userId, limit = 50) {
        const result = await query(
            `SELECT id, user_id, username, character, score, questions, accuracy, max_multiplier, catalog_name, created_at
             FROM hall_of_fame 
             WHERE user_id = $1 
             ORDER BY score DESC, created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );

        return result.rows.map(row => new HallOfFameEntry(row));
    }

    /**
     * Get leaderboard for a specific catalog
     * @param {string} catalogName - Catalog name
     * @param {number} limit - Number of entries to return
     * @returns {Promise<Array>} Leaderboard entries with ranking
     */
    static async getLeaderboard(catalogName, limit = 10) {
        const result = await query(
            `SELECT 
                h.id, h.user_id, h.username, h.character, h.score, h.questions, h.accuracy, h.max_multiplier, h.catalog_name, h.created_at,
                ROW_NUMBER() OVER (ORDER BY h.score DESC, h.created_at ASC) as rank
             FROM hall_of_fame h
             WHERE h.catalog_name = $1
             ORDER BY h.score DESC, h.created_at ASC
             LIMIT $2`,
            [catalogName, limit]
        );

        return result.rows.map(row => ({
            ...new HallOfFameEntry(row).toJSON(),
            rank: parseInt(row.rank)
        }));
    }

    /**
     * Get top performing catalogs
     * @param {number} limit - Number of catalogs to return
     * @returns {Promise<Array>} Top catalogs by play count
     */
    static async getTopCatalogs(limit = 10) {
        const result = await query(
            `SELECT 
                catalog_name,
                COUNT(*) as play_count,
                AVG(score)::int as average_score,
                MAX(score) as highest_score,
                AVG(accuracy)::int as average_accuracy,
                COUNT(DISTINCT user_id) as unique_players
             FROM hall_of_fame 
             GROUP BY catalog_name 
             ORDER BY play_count DESC, average_score DESC 
             LIMIT $1`,
            [limit]
        );

        return result.rows.map(row => ({
            catalogName: row.catalog_name,
            playCount: parseInt(row.play_count),
            averageScore: row.average_score,
            highestScore: row.highest_score,
            averageAccuracy: row.average_accuracy,
            uniquePlayers: parseInt(row.unique_players)
        }));
    }

    /**
     * Delete entries older than specified days
     * @param {number} days - Number of days to keep entries
     * @returns {Promise<number>} Number of deleted entries
     */
    static async deleteOldEntries(days = 365) {
        const result = await query(
            `DELETE FROM hall_of_fame 
             WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${days} days'`
        );

        return result.rowCount;
    }

    /**
     * Delete all entries for a user
     * @param {number} userId - User ID
     * @returns {Promise<number>} Number of deleted entries
     */
    static async deleteUserEntries(userId) {
        const result = await query(
            'DELETE FROM hall_of_fame WHERE user_id = $1',
            [userId]
        );

        return result.rowCount;
    }

    /**
     * Get entry by ID
     * @param {number} id - Entry ID
     * @returns {Promise<HallOfFameEntry|null>} Entry instance or null if not found
     */
    static async findById(id) {
        const result = await query(
            `SELECT id, user_id, username, character, score, questions, accuracy, max_multiplier, catalog_name, created_at
             FROM hall_of_fame 
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return new HallOfFameEntry(result.rows[0]);
    }

    /**
     * Update entry (rarely used, but might be useful for corrections)
     * @param {number} id - Entry ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<HallOfFameEntry>} Updated entry instance
     */
    static async update(id, updates) {
        const allowedFields = ['score', 'questions', 'accuracy', 'max_multiplier'];
        const updateFields = [];
        const updateValues = [];
        let paramCount = 0;

        for (const [field, value] of Object.entries(updates)) {
            if (allowedFields.includes(field)) {
                paramCount++;
                updateFields.push(`${field} = ${paramCount}`);
                updateValues.push(value);
            }
        }

        if (updateFields.length === 0) {
            throw new Error('No valid fields to update');
        }

        paramCount++;
        updateValues.push(id);

        const result = await query(
            `UPDATE hall_of_fame 
             SET ${updateFields.join(', ')} 
             WHERE id = ${paramCount}
             RETURNING id, user_id, username, character, score, questions, accuracy, max_multiplier, catalog_name, created_at`,
            updateValues
        );

        if (result.rows.length === 0) {
            throw new Error('Entry not found');
        }

        return new HallOfFameEntry(result.rows[0]);
    }

    /**
     * Convert entry instance to JSON
     * @returns {Object} Entry data for API response
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            username: this.username,
            character: this.character,
            score: this.score,
            questions: this.questions,
            accuracy: this.accuracy,
            maxMultiplier: this.maxMultiplier,
            catalogName: this.catalogName,
            createdAt: this.createdAt ? this.createdAt.toISOString() : null
        };
    }
}

module.exports = HallOfFameEntry;