// backend/models/User.js
const crypto = require('crypto');
const { query, transaction } = require('../database/connection');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.character = data.character;
        this.email = data.email;
        this.emailVerified = data.email_verified || false;
        this.totalGamesPlayed = data.total_games_played || 0;
        this.bestScore = data.best_score || 0;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @param {string} userData.username - Username
     * @param {string} userData.password - Plain text password
     * @param {string} userData.character - Character emoji
     * @returns {Promise<User>} Created user instance
     */
    static async create({ username, password, character }) {
        try {
            console.log('Hashing password...');
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
            const passwordHash = `${salt}:${hash}`;
            console.log('Password hashed successfully');

            console.log('Executing INSERT query...');
            const result = await query(
                `INSERT INTO users (username, password_hash, character) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, username, character, total_games_played, best_score, created_at, updated_at`,
                [username, passwordHash, character]
            );
            console.log('INSERT query executed');

            if (result.rows.length === 0) {
                console.error('No rows returned from INSERT query');
                throw new Error('Failed to create user');
            }

            console.log('Creating User instance...');
            const user = new User(result.rows[0]);
            console.log('User instance created successfully');

            return user;
        } catch (error) {
            console.error('Error in User.create:', {
                error: error.message,
                stack: error.stack,
                username,
                character,
                code: error.code,
                detail: error.detail
            });
            throw error;
        }
    }

    /**
     * Find user by username
     * @param {string} username - Username to search for
     * @returns {Promise<User|null>} User instance or null if not found
     */
    static async findByUsername(username) {
        const result = await query(
            `SELECT id, username, character, total_games_played, best_score, created_at, updated_at 
             FROM users 
             WHERE username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return new User(result.rows[0]);
    }

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise<User|null>} User instance or null if not found
     */
    static async findById(id) {
        const result = await query(
            `SELECT id, username, character, total_games_played, best_score, created_at, updated_at 
             FROM users 
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return new User(result.rows[0]);
    }

    /**
     * Verify user password
     * @param {string} username - Username
     * @param {string} password - Plain text password
     * @returns {Promise<User|null>} User instance if password is correct, null otherwise
     */
    static async verifyPassword(username, password) {
        const result = await query(
            `SELECT id, username, password_hash, character, total_games_played, best_score, created_at, updated_at 
             FROM users 
             WHERE username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const userData = result.rows[0];
        const [salt, storedHash] = userData.password_hash.split(':');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        const isValidPassword = storedHash === hash;

        if (!isValidPassword) {
            return null;
        }

        return new User(userData);
    }

    /**
     * Check if username exists
     * @param {string} username - Username to check
     * @returns {Promise<boolean>} True if username exists
     */
    static async usernameExists(username) {
        const result = await query(
            'SELECT 1 FROM users WHERE username = $1',
            [username]
        );

        return result.rows.length > 0;
    }

    /**
     * Get user statistics
     * @param {number} userId - User ID
     * @returns {Promise<Object>} User statistics
     */
    static async getStatistics(userId) {
        const result = await query(
            `SELECT 
                u.total_games_played,
                u.best_score,
                COUNT(h.id) as hall_of_fame_entries,
                AVG(h.accuracy)::int as average_accuracy,
                MAX(h.max_multiplier) as highest_multiplier,
                COUNT(DISTINCT h.catalog_name) as catalogs_played
             FROM users u
             LEFT JOIN hall_of_fame h ON h.user_id = u.id
             WHERE u.id = $1
             GROUP BY u.id, u.total_games_played, u.best_score`,
            [userId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const stats = result.rows[0];
        return {
            totalGamesPlayed: stats.total_games_played,
            bestScore: stats.best_score,
            hallOfFameEntries: parseInt(stats.hall_of_fame_entries),
            averageAccuracy: stats.average_accuracy || 0,
            highestMultiplier: stats.highest_multiplier || 1,
            catalogsPlayed: parseInt(stats.catalogs_played)
        };
    }

    /**
     * Update user character
     * @param {number} userId - User ID
     * @param {string} character - New character
     * @returns {Promise<User>} Updated user instance
     */
    static async updateCharacter(userId, character) {
        const result = await query(
            `UPDATE users 
             SET character = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING id, username, character, total_games_played, best_score, created_at, updated_at`,
            [character, userId]
        );

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        return new User(result.rows[0]);
    }

    /**
     * Update user password
     * @param {number} userId - User ID
     * @param {string} newPassword - New plain text password
     * @returns {Promise<boolean>} Success status
     */
    static async updatePassword(userId, newPassword) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512').toString('hex');
        const passwordHash = `${salt}:${hash}`;

        const result = await query(
            `UPDATE users 
             SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [passwordHash, userId]
        );

        return result.rowCount > 0;
    }

    /**
     * Delete user account
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(userId) {
        return await transaction(async (client) => {
            // Delete hall of fame entries first (cascade should handle this, but being explicit)
            await client.query('DELETE FROM hall_of_fame WHERE user_id = $1', [userId]);
            
            // Delete user
            const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
            
            return result.rowCount > 0;
        });
    }

    /**
     * Get top users by best score
     * @param {number} limit - Number of users to return (default: 10)
     * @returns {Promise<Array>} Array of user objects with scores
     */
    static async getTopUsers(limit = 10) {
        const result = await query(
            `SELECT id, username, character, best_score, total_games_played, created_at
             FROM users 
             WHERE best_score > 0
             ORDER BY best_score DESC, total_games_played DESC
             LIMIT $1`,
            [limit]
        );

        return result.rows.map(row => ({
            id: row.id,
            username: row.username,
            character: row.character,
            bestScore: row.best_score,
            totalGamesPlayed: row.total_games_played,
            createdAt: row.created_at
        }));
    }

    /**
     * Create email verification token
     * @param {number} userId - User ID
     * @param {string} email - Email address
     * @returns {Promise<string>} Verification token
     */
    static async createEmailVerificationToken(userId, email) {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await query(
            `UPDATE users 
             SET email = $1, email_verification_token = $2, email_verification_expires = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [email.toLowerCase(), token, expires, userId]
        );

        return token;
    }

    /**
     * Verify email with token
     * @param {string} token - Verification token
     * @returns {Promise<User|null>} User instance if token is valid, null otherwise
     */
    static async verifyEmailToken(token) {
        const result = await query(
            `UPDATE users 
             SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE email_verification_token = $1 AND email_verification_expires > CURRENT_TIMESTAMP
             RETURNING id, username, character, email, email_verified, total_games_played, best_score, created_at, updated_at`,
            [token]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return new User(result.rows[0]);
    }

    /**
     * Create password reset token
     * @param {string} email - Email address
     * @returns {Promise<{user: User, token: string}|null>} User and token if email exists, null otherwise
     */
    static async createPasswordResetToken(email) {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        const result = await query(
            `UPDATE users 
             SET password_reset_token = $1, password_reset_expires = $2, updated_at = CURRENT_TIMESTAMP
             WHERE email = $3 AND email_verified = TRUE
             RETURNING id, username, character, email, email_verified, total_games_played, best_score, created_at, updated_at`,
            [token, expires, email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return {
            user: new User(result.rows[0]),
            token
        };
    }

    /**
     * Reset password with token
     * @param {string} token - Reset token
     * @param {string} newPassword - New plain text password
     * @returns {Promise<User|null>} User instance if token is valid, null otherwise
     */
    static async resetPasswordWithToken(token, newPassword) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512').toString('hex');
        const passwordHash = `${salt}:${hash}`;

        const result = await query(
            `UPDATE users 
             SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE password_reset_token = $2 AND password_reset_expires > CURRENT_TIMESTAMP
             RETURNING id, username, character, email, email_verified, total_games_played, best_score, created_at, updated_at`,
            [passwordHash, token]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return new User(result.rows[0]);
    }

    /**
     * Check if email exists
     * @param {string} email - Email address to check
     * @returns {Promise<boolean>} True if email exists
     */
    static async emailExists(email) {
        const result = await query(
            'SELECT 1 FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        return result.rows.length > 0;
    }

    /**
     * Find user by email
     * @param {string} email - Email address
     * @returns {Promise<User|null>} User instance or null if not found
     */
    static async findByEmail(email) {
        const result = await query(
            `SELECT id, username, character, email, email_verified, total_games_played, best_score, created_at, updated_at 
             FROM users 
             WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return new User(result.rows[0]);
    }

    /**
     * Convert user instance to JSON (excludes sensitive data)
     * @returns {Object} User data for API response
     */
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            character: this.character,
            email: this.email,
            emailVerified: this.emailVerified,
            totalGamesPlayed: this.totalGamesPlayed,
            bestScore: this.bestScore,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = User;