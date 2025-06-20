const { query, transaction } = require('../database/connection');

class QuestionSet {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.created_by = data.created_by;
        // Parse questions if it's a string, otherwise use as-is
        this.questions = typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions;
        this.question_count = data.question_count;
        this.is_public = data.is_public;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Create a new question set
     * @param {Object} questionSetData - Question set data
     * @returns {Promise<QuestionSet>} - Created question set
     */
    static async create({ name, description, created_by, questions, is_public = true }) {
        // Validate questions format
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Questions must be a non-empty array');
        }

        // Validate each question
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            if (!QuestionSet.isValidQuestion(question)) {
                throw new Error(`Invalid question format at index ${i}`);
            }
        }

        const question_count = questions.length;

        const result = await query(
            `INSERT INTO question_sets (name, description, created_by, questions, question_count, is_public)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, name, description, created_by, questions, question_count, is_public, created_at, updated_at`,
            [name, description, created_by, JSON.stringify(questions), question_count, is_public]
        );

        return new QuestionSet(result.rows[0]);
    }

    /**
     * Get a question set by ID
     * @param {number} id - Question set ID
     * @returns {Promise<QuestionSet|null>} - Question set or null
     */
    static async findById(id) {
        const result = await query(
            'SELECT id, name, description, created_by, questions, question_count, is_public, created_at, updated_at FROM question_sets WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) return null;
        return new QuestionSet(result.rows[0]);
    }

    /**
     * Get a question set by name
     * @param {string} name - Question set name
     * @returns {Promise<QuestionSet|null>} - Question set or null
     */
    static async findByName(name) {
        const result = await query(
            'SELECT id, name, description, created_by, questions, question_count, is_public, created_at, updated_at FROM question_sets WHERE name = $1',
            [name]
        );

        if (result.rows.length === 0) return null;
        return new QuestionSet(result.rows[0]);
    }

    /**
     * Get all question sets (public and user's own)
     * @param {string} username - Current user's username
     * @returns {Promise<Array<QuestionSet>>} - Array of question sets
     */
    static async findAvailable(username) {
        const result = await query(
            `SELECT id, name, description, created_by, questions, question_count, is_public, created_at, updated_at 
             FROM question_sets 
             WHERE is_public = true OR created_by = $1 
             ORDER BY created_at DESC`,
            [username]
        );

        return result.rows.map(row => new QuestionSet(row));
    }

    /**
     * Get question sets created by a specific user
     * @param {string} username - User's username
     * @returns {Promise<Array<QuestionSet>>} - Array of question sets
     */
    static async findByCreator(username) {
        const result = await query(
            `SELECT id, name, description, created_by, questions, question_count, is_public, created_at, updated_at 
             FROM question_sets 
             WHERE created_by = $1 
             ORDER BY created_at DESC`,
            [username]
        );

        return result.rows.map(row => new QuestionSet(row));
    }

    /**
     * Update a question set
     * @param {number} id - Question set ID
     * @param {Object} updates - Fields to update
     * @param {string} username - Current user's username
     * @returns {Promise<QuestionSet|null>} - Updated question set or null
     */
    static async update(id, updates, username) {
        // Check if user owns this question set
        const existing = await QuestionSet.findById(id);
        if (!existing || existing.created_by !== username) {
            return null;
        }

        const allowedFields = ['name', 'description', 'questions', 'is_public'];
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        for (const [field, value] of Object.entries(updates)) {
            if (allowedFields.includes(field)) {
                if (field === 'questions') {
                    // Validate questions if being updated
                    if (!Array.isArray(value) || value.length === 0) {
                        throw new Error('Questions must be a non-empty array');
                    }
                    for (let i = 0; i < value.length; i++) {
                        if (!QuestionSet.isValidQuestion(value[i])) {
                            throw new Error(`Invalid question format at index ${i}`);
                        }
                    }
                    updateFields.push(`questions = $${paramIndex}, question_count = $${paramIndex + 1}`);
                    updateValues.push(JSON.stringify(value), value.length);
                    paramIndex += 2;
                } else {
                    updateFields.push(`${field} = $${paramIndex}`);
                    updateValues.push(value);
                    paramIndex++;
                }
            }
        }

        if (updateFields.length === 0) {
            return existing;
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id);

        const result = await query(
            `UPDATE question_sets SET ${updateFields.join(', ')} 
             WHERE id = $${paramIndex}
             RETURNING id, name, description, created_by, questions, question_count, is_public, created_at, updated_at`,
            updateValues
        );

        return new QuestionSet(result.rows[0]);
    }

    /**
     * Delete a question set
     * @param {number} id - Question set ID
     * @param {string} username - Current user's username
     * @returns {Promise<boolean>} - Success status
     */
    static async delete(id, username) {
        try {
            const result = await transaction(async (client) => {
                // First check if the user owns this question set
                const checkResult = await client.query(
                    'SELECT id, created_by FROM question_sets WHERE id = $1',
                    [id]
                );
                
                if (checkResult.rows.length === 0) {
                    return false; // Question set not found
                }
                
                if (checkResult.rows[0].created_by !== username) {
                    return false; // Access denied
                }
                
                // Clean up finished lobbies that reference this question set
                // This prevents foreign key constraint violations
                await client.query(
                    `DELETE FROM lobbies 
                     WHERE question_set_id = $1 
                     AND (game_phase = 'finished' OR started = true)`,
                    [id]
                );
                
                // Set question_set_id to NULL for any remaining active lobbies
                // This allows the question set to be deleted while preserving active games
                await client.query(
                    'UPDATE lobbies SET question_set_id = NULL WHERE question_set_id = $1',
                    [id]
                );
                
                // Now delete the question set
                const deleteResult = await client.query(
                    'DELETE FROM question_sets WHERE id = $1 AND created_by = $2',
                    [id, username]
                );
                
                return deleteResult.rowCount > 0;
            });
            
            return result;
            
        } catch (error) {
            console.error('Question set deletion error:', error);
            throw error;
        }
    }

    /**
     * Validate question format
     * @param {Object} question - Question to validate
     * @returns {boolean} - Whether question is valid
     */
    static isValidQuestion(question) {
        if (!question || typeof question !== 'object') {
            return false;
        }

        const { question: questionText, type, correct } = question;

        // Check required fields
        if (!questionText || !type || correct === undefined) {
            return false;
        }

        // Validate question types
        if (type === 'multiple_choice') {
            return Array.isArray(question.options) &&
                   question.options.length === 4 &&
                   typeof correct === 'number' &&
                   correct >= 0 &&
                   correct < 4;
        }

        if (type === 'true_false') {
            return typeof correct === 'boolean';
        }

        return false;
    }

    /**
     * Get summary data (without questions)
     * @returns {Object} - Question set summary
     */
    getSummary() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            created_by: this.created_by,
            question_count: this.question_count,
            is_public: this.is_public,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    /**
     * Convert to JSON
     * @returns {Object} - JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            created_by: this.created_by,
            questions: this.questions,
            question_count: this.question_count,
            is_public: this.is_public,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = QuestionSet; 