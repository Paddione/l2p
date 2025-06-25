// backend/middleware/validation.js

const { AppError } = require('./errorHandler');

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
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (password.length > 128) {
            return 'Password must be less than 128 characters';
        }
        
        // Relaxed password complexity for better usability
        // Require at least 2 of the 4 character types
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const complexityCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
        
        if (complexityCount < 2) {
            return 'Password must contain at least 2 of the following: uppercase letters, lowercase letters, numbers, special characters';
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
        if (!Number.isFinite(score) || score < 0) {
            return 'Score must be a non-negative number';
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
        // Sanitize catalog name to prevent injection
        if (/[<>'"&]/.test(catalogName)) {
            return 'Catalog name contains invalid characters';
        }
        return null;
    },

    limit: (limit) => {
        if (limit === undefined || limit === null) {
            return null; // Optional parameter
        }
        if (!Number.isInteger(limit) || limit < 1 || limit > 10000) {
            return 'Limit must be between 1 and 10000';
        }
        return null;
    },

    offset: (offset) => {
        if (offset === undefined || offset === null) {
            return null; // Optional parameter
        }
        if (!Number.isInteger(offset) || offset < 0) {
            return 'Offset must be a non-negative integer';
        }
        return null;
    },

    lobbyCode: (lobbyCode) => {
        if (!lobbyCode || typeof lobbyCode !== 'string') {
            return 'Lobby code is required';
        }
        if (lobbyCode.length !== 4) {
            return 'Lobby code must be exactly 4 characters';
        }
        if (!/^[A-Z0-9]+$/.test(lobbyCode)) {
            return 'Lobby code can only contain uppercase letters and numbers';
        }
        // Additional SQL injection protection
        const sqlInjectionPatterns = [
            /[';"]/, // Single and double quotes
            /--/, // SQL comments
            /\/\*/, // Multi-line comments
            /union\s+select/i, // Union select
            /drop\s+table/i, // Drop table
            /delete\s+from/i, // Delete from
            /update\s+set/i, // Update set
            /insert\s+into/i // Insert into
        ];
        if (sqlInjectionPatterns.some(pattern => pattern.test(lobbyCode))) {
            return 'Invalid characters detected in lobby code';
        }
        return null;
    },

    gamePhase: (gamePhase) => {
        if (!gamePhase || typeof gamePhase !== 'string') {
            return 'Game phase is required';
        }
        const validPhases = ['waiting', 'question', 'results', 'post-game'];
        if (!validPhases.includes(gamePhase)) {
            return 'Invalid game phase';
        }
        return null;
    },

    questionSetId: (questionSetId) => {
        if (questionSetId === undefined || questionSetId === null) {
            return 'Question set ID is required';
        }
        if (!Number.isInteger(questionSetId) || questionSetId < 1) {
            return 'Question set ID must be a positive integer';
        }
        return null;
    },

    maxPlayers: (maxPlayers) => {
        if (maxPlayers === undefined || maxPlayers === null) {
            return 'Max players is required';
        }
        if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 8) {
            return 'Max players must be between 2 and 8';
        }
        return null;
    },

    timePerQuestion: (timePerQuestion) => {
        if (timePerQuestion === undefined || timePerQuestion === null) {
            return 'Time per question is required';
        }
        if (!Number.isInteger(timePerQuestion) || timePerQuestion < 10 || timePerQuestion > 120) {
            return 'Time per question must be between 10 and 120 seconds';
        }
        return null;
    },

    answer: (answer) => {
        if (answer === undefined || answer === null) {
            return 'Answer is required';
        }
        if (typeof answer !== 'string' && typeof answer !== 'number' && typeof answer !== 'boolean') {
            return 'Answer must be a string, number, or boolean';
        }
        if (typeof answer === 'string' && answer.length > 500) {
            return 'Answer is too long';
        }
        return null;
    },

    email: (email) => {
        if (!email || typeof email !== 'string') {
            return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        if (email.length > 255) {
            return 'Email must be 255 characters or less';
        }
        // Enhanced email security checks
        if (email.includes('<') || email.includes('>') || email.includes('"')) {
            return 'Email contains invalid characters';
        }
        if (email.split('@').length !== 2) {
            return 'Email must contain exactly one @ symbol';
        }
        return null;
    },

    token: (token) => {
        if (!token || typeof token !== 'string') {
            return 'Token is required';
        }
        if (token.length < 10 || token.length > 256) {
            return 'Invalid token format';
        }
        // Check for valid token characters (alphanumeric and common safe chars)
        if (!/^[a-zA-Z0-9._-]+$/.test(token)) {
            return 'Token contains invalid characters';
        }
        return null;
    },

    optionalEmail: (email) => {
        if (!email) {
            return null; // Optional field
        }
        return validators.email(email);
    },

    token: (token) => {
        if (!token || typeof token !== 'string') {
            return 'Token is required';
        }
        if (token.length < 10 || token.length > 255) {
            return 'Invalid token format';
        }
        if (!/^[a-fA-F0-9]+$/.test(token)) {
            return 'Token contains invalid characters';
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
            
            // Skip validation for optional fields that are undefined
            if (value === undefined && validator.endsWith('?')) {
                continue;
            }
            
            const validatorName = validator.replace('?', '');
            const error = validators[validatorName](value);
            
            if (error) {
                errors[field] = error;
            }
        }
        
        if (Object.keys(errors).length > 0) {
            const error = new AppError('VALIDATION_ERROR', { fields: errors });
            return res.status(error.httpStatus).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    recovery: error.recovery
                },
                timestamp: new Date().toISOString(),
                details: { fields: errors }
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
    character: 'character',
    email: 'optionalEmail'
});

/**
 * Validation middleware for user login
 */
const validateLogin = validate({
    username: 'username',
    password: 'password'
});

/**
 * Validation middleware for email verification
 */
const validateEmailVerification = validate({
    token: 'token'
});

/**
 * Validation middleware for password reset request
 */
const validatePasswordReset = validate({
    email: 'email'
});

/**
 * Validation middleware for password reset confirmation
 */
const validatePasswordResetConfirm = validate({
    token: 'token',
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
 * Validation middleware for lobby creation
 */
const validateLobbyCreation = validate({
    questionSetId: 'questionSetId',
    maxPlayers: 'maxPlayers?',
    questionCount: 'questions',
    timePerQuestion: 'timePerQuestion?'
});

/**
 * Validation middleware for joining lobby
 */
const validateJoinLobby = validate({
    lobbyCode: 'lobbyCode'
});

/**
 * Validation middleware for game actions
 */
const validateGameAction = validate({
    lobbyCode: 'lobbyCode',
    answer: 'answer?'
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
            
            // Convert numeric strings to numbers for numeric validators
            let processedValue = value;
            const numericValidators = ['score', 'questions', 'accuracy', 'maxMultiplier', 'limit', 'offset', 'questionSetId', 'maxPlayers', 'timePerQuestion'];
            if (numericValidators.includes(validator)) {
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
            const error = new AppError('VALIDATION_ERROR', { fields: errors });
            return res.status(error.httpStatus).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    recovery: error.recovery
                },
                timestamp: new Date().toISOString(),
                details: { fields: errors }
            });
        }
        
        next();
    };
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data
 */
function sanitizeInput(data) {
    if (typeof data === 'string') {
        // Enhanced sanitization for better security
        return data
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .replace(/data:/gi, '') // Remove data: protocol
            .replace(/vbscript:/gi, '') // Remove vbscript: protocol
            .replace(/[^\w\s\-.,!?@#$%^&*()_+=|\\:";'/<>{}[\]]/g, '') // Allow only safe characters
            .replace(/script/gi, '') // Remove script tags
            .replace(/iframe/gi, '') // Remove iframe tags
            .replace(/object/gi, '') // Remove object tags
            .replace(/embed/gi, '') // Remove embed tags
            .replace(/form/gi, '') // Remove form tags
            .replace(/input/gi, '') // Remove input tags
            .trim()
            .substring(0, 1000); // Limit length to prevent buffer overflow
    }
    
    if (Array.isArray(data)) {
        return data.map(sanitizeInput);
    }
    
    if (data && typeof data === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[sanitizeInput(key)] = sanitizeInput(value);
        }
        return sanitized;
    }
    
    return data;
}

/**
 * Middleware to sanitize request body
 */
function sanitizeBody(req, res, next) {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    next();
}

/**
 * Middleware to sanitize query parameters
 */
function sanitizeQuery(req, res, next) {
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    next();
}

module.exports = {
    validate,
    validateRegistration,
    validateLogin,
    validateEmailVerification,
    validatePasswordReset,
    validatePasswordResetConfirm,
    validateHallOfFameEntry,
    validateLobbyCreation,
    validateJoinLobby,
    validateGameAction,
    validateQuery,
    sanitizeInput,
    sanitizeBody,
    sanitizeQuery
};