/**
 * Centralized error handling middleware for Learn2Play API
 * Standardizes error responses and implements comprehensive error logging
 */

// Error codes and messages mapping
const ERROR_CODES = {
    // Authentication errors
    INVALID_CREDENTIALS: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password',
        httpStatus: 401,
        recovery: 'Please check your credentials and try again'
    },
    TOKEN_EXPIRED: {
        code: 'TOKEN_EXPIRED',
        message: 'Your session has expired',
        httpStatus: 401,
        recovery: 'Please log in again to continue'
    },
    UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        message: 'Access denied',
        httpStatus: 401,
        recovery: 'Please log in to access this resource'
    },
    
    // Validation errors
    VALIDATION_ERROR: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        httpStatus: 400,
        recovery: 'Please check your input and try again'
    },
    MISSING_FIELDS: {
        code: 'MISSING_FIELDS',
        message: 'Required fields are missing',
        httpStatus: 400,
        recovery: 'Please fill in all required fields'
    },
    
    // Resource errors
    RESOURCE_NOT_FOUND: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Requested resource not found',
        httpStatus: 404,
        recovery: 'Please check the resource identifier and try again'
    },
    RESOURCE_CONFLICT: {
        code: 'RESOURCE_CONFLICT',
        message: 'Resource already exists',
        httpStatus: 409,
        recovery: 'Please use a different identifier'
    },
    
    // Game-specific errors
    LOBBY_FULL: {
        code: 'LOBBY_FULL',
        message: 'Game lobby is full',
        httpStatus: 409,
        recovery: 'Try joining a different game or create your own'
    },
    GAME_IN_PROGRESS: {
        code: 'GAME_IN_PROGRESS',
        message: 'Game is already in progress',
        httpStatus: 409,
        recovery: 'Wait for the current game to finish or join a different lobby'
    },
    INVALID_GAME_STATE: {
        code: 'INVALID_GAME_STATE',
        message: 'Invalid game state for this action',
        httpStatus: 409,
        recovery: 'Please refresh the page and try again'
    },
    
    // Database errors
    DB_CONNECTION_ERROR: {
        code: 'DB_CONNECTION_ERROR',
        message: 'Database connection error',
        httpStatus: 503,
        recovery: 'Please try again in a few moments'
    },
    DB_QUERY_ERROR: {
        code: 'DB_QUERY_ERROR',
        message: 'Database query failed',
        httpStatus: 500,
        recovery: 'Please try again or contact support if the problem persists'
    },
    
    // Rate limiting
    RATE_LIMIT_EXCEEDED: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        httpStatus: 429,
        recovery: 'Please wait a moment before trying again'
    },
    ACCOUNT_LOCKED: {
        code: 'ACCOUNT_LOCKED',
        message: 'Account temporarily locked',
        httpStatus: 423,
        recovery: 'Account is locked due to too many failed login attempts. Please try again later.'
    },
    
    // File upload errors
    FILE_TOO_LARGE: {
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds limit',
        httpStatus: 413,
        recovery: 'Please choose a smaller file and try again'
    },
    INVALID_FILE_FORMAT: {
        code: 'INVALID_FILE_FORMAT',
        message: 'Invalid file format',
        httpStatus: 400,
        recovery: 'Please upload a valid JSON file'
    },
    
    // Generic errors
    INTERNAL_ERROR: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        httpStatus: 500,
        recovery: 'Please try again or contact support if the problem persists'
    },
    SERVICE_UNAVAILABLE: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
        httpStatus: 503,
        recovery: 'Please try again in a few moments'
    }
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
    constructor(errorCode, details = null, originalError = null) {
        const errorInfo = ERROR_CODES[errorCode] || ERROR_CODES.INTERNAL_ERROR;
        super(errorInfo.message);
        
        this.name = 'AppError';
        this.code = errorInfo.code;
        this.httpStatus = errorInfo.httpStatus;
        this.recovery = errorInfo.recovery;
        this.details = details;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
        
        // Capture stack trace
        Error.captureStackTrace(this, AppError);
    }
}

/**
 * Map database errors to application error codes
 */
function mapDatabaseError(error) {
    // PostgreSQL error codes
    switch (error.code) {
        case '23505': // Unique violation
            return 'RESOURCE_CONFLICT';
        case '23502': // Not null violation
            return 'MISSING_FIELDS';
        case '23503': // Foreign key violation
            return 'VALIDATION_ERROR';
        case '57014': // Query cancelled
        case '57P01': // Admin shutdown
            return 'DB_CONNECTION_ERROR';
        case '08000': // Connection exception
        case '08003': // Connection does not exist
        case '08006': // Connection failure
        case '08001': // SQL client unable to establish connection
        case '08004': // SQL server rejected establishment of connection
            return 'DB_CONNECTION_ERROR';
        case '53300': // Too many connections
            return 'SERVICE_UNAVAILABLE';
        default:
            // Check for connection-related errors by message
            if (error.message && (
                error.message.includes('connection') ||
                error.message.includes('timeout') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ENOTFOUND')
            )) {
                return 'DB_CONNECTION_ERROR';
            }
            return 'DB_QUERY_ERROR';
    }
}

/**
 * Enhanced error logging with structured data
 */
function logError(error, req = null, additionalContext = {}) {
    const logData = {
        timestamp: new Date().toISOString(),
        error: {
            name: error.name,
            message: error.message,
            code: error.code || 'UNKNOWN',
            stack: error.stack
        },
        request: req ? {
            method: req.method,
            url: req.originalUrl || req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user ? req.user.id : null,
            body: req.method !== 'GET' ? sanitizeForLogging(req.body) : undefined,
            query: Object.keys(req.query || {}).length > 0 ? sanitizeForLogging(req.query) : undefined
        } : null,
        context: additionalContext
    };
    
    // Log with appropriate level based on error type
    if (error.httpStatus >= 500) {
        console.error('🚨 Server Error:', JSON.stringify(logData, null, 2));
    } else if (error.httpStatus >= 400) {
        console.warn('⚠️ Client Error:', JSON.stringify(logData, null, 2));
    } else {
        console.info('ℹ️ Application Error:', JSON.stringify(logData, null, 2));
    }
}

/**
 * Sanitize sensitive data for logging
 */
function sanitizeForLogging(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveFields = ['password', 'token', 'refreshToken', 'authorization'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    
    return sanitized;
}

/**
 * Format error response for client
 */
function formatErrorResponse(error, req) {
    const response = {
        success: false,
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'An error occurred',
            recovery: error.recovery || 'Please try again'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id || generateRequestId()
    };
    
    // Add details in development mode
    if (process.env.NODE_ENV === 'development') {
        response.debug = {
            details: error.details,
            stack: error.stack,
            originalError: error.originalError ? {
                message: error.originalError.message,
                code: error.originalError.code
            } : null
        };
    }
    
    return response;
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Main error handling middleware
 */
function errorHandler(error, req, res, next) {
    let appError;
    
    // Convert different error types to AppError
    if (error instanceof AppError) {
        appError = error;
    } else if (error.name === 'ValidationError') {
        appError = new AppError('VALIDATION_ERROR', error.details, error);
    } else if (error.name === 'JsonWebTokenError') {
        appError = new AppError('UNAUTHORIZED', null, error);
    } else if (error.name === 'TokenExpiredError') {
        appError = new AppError('TOKEN_EXPIRED', null, error);
    } else if (error.code && error.code.startsWith('2')) { // Database errors
        const errorCode = mapDatabaseError(error);
        appError = new AppError(errorCode, { dbError: error.code }, error);
    } else if (error.name === 'MulterError') {
        if (error.code === 'LIMIT_FILE_SIZE') {
            appError = new AppError('FILE_TOO_LARGE', null, error);
        } else {
            appError = new AppError('VALIDATION_ERROR', { multerCode: error.code }, error);
        }
    } else {
        // Generic error handling
        appError = new AppError('INTERNAL_ERROR', null, error);
    }
    
    // Log the error
    logError(appError, req);
    
    // Send formatted response
    const response = formatErrorResponse(appError, req);
    res.status(appError.httpStatus).json(response);
}

/**
 * Async error wrapper for route handlers
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res, next) {
    const error = new AppError('RESOURCE_NOT_FOUND', {
        resource: req.originalUrl,
        method: req.method
    });
    next(error);
}

module.exports = {
    AppError,
    ERROR_CODES,
    errorHandler,
    asyncHandler,
    notFoundHandler,
    logError,
    mapDatabaseError
}; 