// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Common token verification logic
 * @param {string} token - JWT token to verify
 * @param {boolean} optional - Whether to fail if token is invalid
 * @returns {Promise<Object>} Decoded token payload
 */
async function verifyToken(token, optional = false) {
    if (!token) {
        if (optional) return null;
        throw new Error('Access token required');
    }

    try {
        return await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    if (optional) {
                        console.warn('Optional token verification failed:', err.message);
                        resolve(null);
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(decoded);
                }
            });
        });
    } catch (error) {
        if (optional) return null;
        
        if (error.name === 'TokenExpiredError') {
            throw { status: 401, message: 'Token expired', code: 'TOKEN_EXPIRED' };
        }
        if (error.name === 'JsonWebTokenError') {
            throw { status: 403, message: 'Invalid token', code: 'INVALID_TOKEN' };
        }
        throw { status: 403, message: 'Token verification failed', code: 'TOKEN_ERROR' };
    }
}

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function authenticateToken(req, res, next) {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        const user = await verifyToken(token);
        req.user = user;
        next();
    } catch (error) {
        res.status(error.status || 401).json({ 
            error: error.message,
            code: error.code
        });
    }
}

/**
 * Middleware to authenticate optional JWT tokens (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function authenticateOptionalToken(req, res, next) {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        req.user = await verifyToken(token, true);
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id and username
 * @param {string} expiresIn - Token expiration time (default: 24h)
 * @returns {string} JWT token
 */
function generateToken(user, expiresIn = '24h') {
    return jwt.sign(
        { 
            userId: user.id, 
            username: user.username 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn,
            issuer: 'learn2play-api',
            audience: 'learn2play-app'
        }
    );
}

/**
 * Generate refresh token for user
 * @param {Object} user - User object with id and username
 * @returns {string} Refresh token
 */
function generateRefreshToken(user) {
    return jwt.sign(
        { 
            userId: user.id, 
            username: user.username,
            type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { 
            expiresIn: '7d',
            issuer: 'learn2play-api',
            audience: 'learn2play-app'
        }
    );
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Promise<Object>} Decoded token payload
 */
async function verifyRefreshToken(token) {
    try {
        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
            });
        });
        
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        
        return decoded;
    } catch (error) {
        throw { status: 403, message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' };
    }
}

module.exports = {
    authenticateToken,
    authenticateOptionalToken,
    generateToken,
    generateRefreshToken,
    verifyRefreshToken
};