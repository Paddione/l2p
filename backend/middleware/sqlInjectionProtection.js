/**
 * SQL Injection Protection Middleware
 * Provides comprehensive protection against SQL injection attacks
 */

const { AppError } = require('./errorHandler');

/**
 * Detects potential SQL injection patterns
 * @param {string} input - Input string to check
 * @returns {boolean} - True if potential SQL injection detected
 */
function detectSQLInjection(input) {
    if (typeof input !== 'string') return false;
    
    const sqlInjectionPatterns = [
        // SQL operators and keywords
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /update\s+.+set/i,
        /insert\s+into/i,
        /create\s+table/i,
        /alter\s+table/i,
        /truncate\s+table/i,
        /exec\s*\(/i,
        /execute\s*\(/i,
        /sp_/i,
        /xp_/i,
        
        // SQL injection techniques
        /['"]?\s*or\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i, // or 1=1
        /['"]?\s*and\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i, // and 1=1
        /['"]?\s*or\s+['"]?true['"]?/i, // or true
        /['"]?\s*and\s+['"]?false['"]?/i, // and false
        /['"]?\s*;\s*drop/i, // ; drop
        /['"]?\s*;\s*delete/i, // ; delete
        /['"]?\s*;\s*update/i, // ; update
        /['"]?\s*;\s*insert/i, // ; insert
        
        // SQL comments
        /--[^\r\n]*/,
        /\/\*[\s\S]*?\*\//,
        /#[^\r\n]*/,
        
        // SQL string concatenation
        /\|\|/,
        /\+\s*['"][^'"]*['"]/,
        
        // SQL functions that could be dangerous
        /@@version/i,
        /@@servername/i,
        /sys\./i,
        /information_schema/i,
        /pg_catalog/i,
        /pg_tables/i,
        /pg_user/i,
        
        // Time-based attacks
        /sleep\s*\(/i,
        /pg_sleep\s*\(/i,
        /waitfor\s+delay/i,
        /benchmark\s*\(/i,
        
        // Blind SQL injection
        /if\s*\(/i,
        /case\s+when/i,
        /substring\s*\(/i,
        /ascii\s*\(/i,
        /char\s*\(/i,
        /length\s*\(/i,
        
        // UNION-based attacks
        /\bunion\b/i,
        /\bselect\b.*\bfrom\b/i,
        
        // Error-based attacks
        /convert\s*\(/i,
        /cast\s*\(/i,
        /extractvalue\s*\(/i,
        /updatexml\s*\(/i,
        
        // Stacked queries
        /;\s*select/i,
        /;\s*insert/i,
        /;\s*update/i,
        /;\s*delete/i,
        /;\s*drop/i,
        /;\s*create/i,
        /;\s*alter/i
    ];
    
    return sqlInjectionPatterns.some(pattern => pattern.test(input));
}

/**
 * Middleware to check for SQL injection in request parameters
 */
function checkSQLInjection(req, res, next) {
    try {
        // Check all request parameters
        const allParams = {
            ...req.query,
            ...req.params,
            ...req.body
        };
        
        for (const [key, value] of Object.entries(allParams)) {
            if (typeof value === 'string' && detectSQLInjection(value)) {
                console.warn(`Potential SQL injection detected in parameter '${key}': ${value}`);
                const error = new AppError('VALIDATION_ERROR', {
                    message: 'Invalid input detected',
                    field: key,
                    recovery: 'Please check your input and try again'
                });
                return res.status(error.httpStatus).json({
                    success: false,
                    error: {
                        code: error.code,
                        message: 'Invalid input format',
                        recovery: error.recovery
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('Error in SQL injection check:', error);
        next(); // Continue on error to avoid breaking functionality
    }
}

/**
 * Sanitizes a string to prevent SQL injection
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeSQL(input) {
    if (typeof input !== 'string') return input;
    
    return input
        // Remove dangerous characters
        .replace(/['"]/g, '') // Remove quotes
        .replace(/[;]/g, '') // Remove semicolons
        .replace(/--/g, '') // Remove SQL comments
        .replace(/\/\*/g, '') // Remove multi-line comment start
        .replace(/\*\//g, '') // Remove multi-line comment end
        .replace(/#/g, '') // Remove hash comments
        .trim();
}

/**
 * Validates that a parameter contains only safe characters for database queries
 * @param {string} input - Input to validate
 * @param {string} allowedChars - Regex pattern for allowed characters
 * @returns {boolean} - True if safe
 */
function isSafeForDB(input, allowedChars = /^[a-zA-Z0-9_-]+$/) {
    if (typeof input !== 'string') return false;
    return allowedChars.test(input) && !detectSQLInjection(input);
}

module.exports = {
    detectSQLInjection,
    checkSQLInjection,
    sanitizeSQL,
    isSafeForDB
}; 