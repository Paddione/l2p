// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken, authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin, sanitizeBody } = require('../middleware/validation');

// Apply sanitization to all routes
router.use(sanitizeBody);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateRegistration, async (req, res) => {
    try {
        console.log('Starting registration process for username:', req.body.username);
        const { username, password, character } = req.body;

        // Check if username already exists
        console.log('Checking if username exists:', username);
        const existingUser = await User.usernameExists(username);
        if (existingUser) {
            console.log('Username already exists:', username);
            return res.status(409).json({ 
                error: 'Username already exists',
                code: 'USERNAME_EXISTS'
            });
        }

        // Create new user
        console.log('Creating new user:', username);
        try {
            const user = await User.create({ username, password, character });
            console.log('User created successfully:', username);

            // Generate tokens
            console.log('Generating tokens for user:', username);
            const accessToken = generateToken(user);
            const refreshToken = generateRefreshToken(user);

            console.log('Registration successful for user:', username);
            res.status(201).json({
                message: 'User registered successfully',
                token: accessToken,
                refreshToken,
                user: user.toJSON()
            });
        } catch (createError) {
            console.error('Error creating user:', {
                error: createError.message,
                stack: createError.stack,
                query: createError.query,
                parameters: createError.parameters,
                code: createError.code,
                detail: createError.detail
            });
            throw createError;
        }
    } catch (error) {
        console.error('Registration error:', {
            error: error.message,
            stack: error.stack,
            body: req.body,
            code: error.code,
            detail: error.detail,
            query: error.query,
            parameters: error.parameters
        });

        // Check for specific database errors
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({
                error: 'Username already exists',
                code: 'USERNAME_EXISTS'
            });
        }

        if (error.code === '23502') { // Not null violation
            return res.status(400).json({
                error: 'Missing required fields',
                code: 'MISSING_FIELDS'
            });
        }

        if (error.code === '57014') { // Query cancelled
            return res.status(408).json({
                error: 'Registration request timed out',
                code: 'REQUEST_TIMEOUT'
            });
        }

        // Generic database errors
        if (error.code && error.code.startsWith('08')) { // Connection errors
            return res.status(503).json({
                error: 'Database connection error',
                code: 'DB_CONNECTION_ERROR'
            });
        }

        res.status(500).json({ 
            error: 'Registration failed',
            code: 'REGISTRATION_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Verify user credentials
        const user = await User.verifyPassword(username, password);
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Generate tokens
        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({
            message: 'Login successful',
            token: accessToken,
            refreshToken,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Login failed',
            code: 'LOGIN_ERROR'
        });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ 
                error: 'Refresh token required',
                code: 'NO_REFRESH_TOKEN'
            });
        }

        // Verify refresh token
        const decoded = await verifyRefreshToken(refreshToken);
        
        // Get current user data
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ 
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Generate new access token
        const newAccessToken = generateToken(user);
        const newRefreshToken = generateRefreshToken(user);

        res.json({
            message: 'Token refreshed successfully',
            token: newAccessToken,
            refreshToken: newRefreshToken,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Refresh token expired',
                code: 'REFRESH_TOKEN_EXPIRED'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            });
        }
        
        // Check if error comes from verifyRefreshToken middleware
        if (error.status === 401 && error.code === 'INVALID_REFRESH_TOKEN') {
            return res.status(401).json({ 
                error: 'Invalid refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            });
        }
        
        res.status(500).json({ 
            error: 'Token refresh failed',
            code: 'REFRESH_ERROR'
        });
    }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json(user.toJSON());

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ 
            error: 'Failed to get user information',
            code: 'GET_USER_ERROR'
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token invalidation)
 * Note: With JWT, we can't actually invalidate tokens server-side without a blacklist
 */
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // In a more sophisticated implementation, you might:
        // 1. Add the token to a blacklist
        // 2. Store active sessions in Redis
        // 3. Implement token versioning
        
        res.json({
            message: 'Logout successful. Please remove tokens from client storage.',
            code: 'LOGOUT_SUCCESS'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            error: 'Logout failed',
            code: 'LOGOUT_ERROR'
        });
    }
});

/**
 * GET /api/auth/verify
 * Verify if current token is valid
 */
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        // If we reach here, the token is valid (middleware passed)
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            valid: true,
            user: user.toJSON(),
            tokenInfo: {
                userId: req.user.userId,
                username: req.user.username
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ 
            error: 'Token verification failed',
            code: 'VERIFY_ERROR'
        });
    }
});

module.exports = router;