// backend/middleware/validation.js

/**
 * Validation helper functions
 */
const validators = {
    username: (username) => {
        if (!username || typeof username !== 'string') {
            return 'Username is required';
        }
        if (username.length < 3 || username.length > 16) {
            return 'Username must be between 3 and 16 characters';
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return 'Username can only contain letters, numbers, underscores, and hyphens';
        }
        return null;
    },

    password: (password) => {
        if (!password || typeof password !== 'string') {
            return 'Password is required';
        }
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if (password.length > 128) {
            return 'Password must be less than 128 characters';
        }
        return null;
    },

    character: (character) => {
        if (!character || typeof character !== 'string') {
            return 'Character is required';
        }
        if (character.length > 4) {
            return 'Character must be 4 characters or less';
        }
        return null;
    },

    score: (score) => {
        if (score === undefined || score === null) {
            return 'Score is required';
        }
        if (!Number.isInteger(score) || score < 0) {
            return 'Score must be a non-negative integer';
        }
        if (score > 1000000) {
            return 'Score is too large';
        }
        return null;
    },

    questions: (questions) => {
        if (questions === undefined || questions === null) {
            return 'Questions count is required';
        }
        if (!Number.isInteger(questions) || questions < 1 || questions > 50) {
            return 'Questions must be between 1 and 50';
        }
        return null;
    },

    accuracy: (accuracy) => {
        if (accuracy === undefined || accuracy === null) {
            return 'Accuracy is required';
        }
        if (!Number.isInteger(accuracy) || accuracy < 0 || accuracy > 100) {
            return 'Accuracy must be between 0 and 100';
        }
        return null;
    },

    maxMultiplier: (maxMultiplier) => {
        if (maxMultiplier === undefined || maxMultiplier === null) {
            return 'Max multiplier is required';
        }
        if (!Number.isInteger(maxMultiplier) || maxMultiplier < 1 || maxMultiplier > 5) {
            return 'Max multiplier must be between 1 and 5';
        }
        return null;
    },

    catalogName: (catalogName) => {
        if (!catalogName || typeof catalogName !== 'string') {
            return 'Catalog name is required';
        }
        if (catalogName.length > 100) {
            return 'Catalog name must be 100 characters or less';
        }
        return null;
    }
};

/**
 * Create validation middleware for specific fields
 * @param {Object} rules - Validation rules object
 * @returns {Function} Express middleware function
 */
function validate(rules) {
    return (req, res, next) => {
        const errors = {};
        
        for (const [field, validator] of Object.entries(rules)) {
            const value = req.body[field];
            const error = validators[validator](value);
            
            if (error) {
                errors[field] = error;
            }
        }
        
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }
        
        next();
    };
}

/**
 * Validation middleware for user registration
 */
const validateRegistration = validate({
    username: 'username',
    password: 'password',
    character: 'character'
});

/**
 * Validation middleware for user login
 */
const validateLogin = validate({
    username: 'username',
    password: 'password'
});

/**
 * Validation middleware for hall of fame entry
 */
const validateHallOfFameEntry = validate({
    score: 'score',
    questions: 'questions',
    accuracy: 'accuracy',
    maxMultiplier: 'maxMultiplier',
    catalogName: 'catalogName'
});

/**
 * Validation middleware for query parameters
 * @param {Object} rules - Validation rules for query parameters
 * @returns {Function} Express middleware function
 */
function validateQuery(rules) {
    return (req, res, next) => {
        const errors = {};
        
        for (const [field, validator] of Object.entries(rules)) {
            const value = req.query[field];
            
            // Skip validation if field is optional and not provided
            if (value === undefined) {
                continue;
            }
            
            // Convert numeric strings to numbers
            let processedValue = value;
            if (validator === 'score' || validator === 'questions' || validator === 'accuracy' || validator === 'maxMultiplier') {
                processedValue = parseInt(value, 10);
                if (isNaN(processedValue)) {
                    errors[field] = `${field} must be a valid number`;
                    continue;
                }
            }
            
            const error = validators[validator](processedValue);
            if (error) {
                errors[field] = error;
            }
        }
        
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                error: 'Query validation failed',
                details: errors
            });
        }
        
        next();
    };
}

/**
 * Sanitize and normalize input data
 * @param {Object} data - Input data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeInput(data) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            // Trim whitespace and normalize
            sanitized[key] = value.trim();
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

/**
 * Middleware to sanitize request body
 */
function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeInput(req.body);
    }
    next();
}

module.exports = {
    validate,
    validateRegistration,
    validateLogin,
    validateHallOfFameEntry,
    validateQuery,
    sanitizeInput,
    sanitizeBody,
    validators
};