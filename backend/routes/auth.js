// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken, authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin, validateEmailVerification, validatePasswordReset, validatePasswordResetConfirm, sanitizeBody } = require('../middleware/validation');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { checkRateLimit, handleFailedLogin, handleSuccessfulLogin, getRateLimitStats } = require('../middleware/rateLimiter');
const emailService = require('../services/emailService');

// Apply sanitization to all routes
router.use(sanitizeBody);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateRegistration, asyncHandler(async (req, res) => {
    console.log('Starting registration process for username:', req.body.username);
    const { username, password, character, email } = req.body;

    // Check if username already exists
    console.log('Checking if username exists:', username);
    const existingUser = await User.usernameExists(username);
    if (existingUser) {
        console.log('Username already exists:', username);
        throw new AppError('RESOURCE_CONFLICT', { field: 'username', value: username });
    }

    // Check if email already exists (if provided)
    if (email) {
        console.log('Checking if email exists:', email);
        const existingEmail = await User.emailExists(email);
        if (existingEmail) {
            console.log('Email already exists:', email);
            throw new AppError('RESOURCE_CONFLICT', { field: 'email', value: email });
        }
    }

    // Create new user
    console.log('Creating new user:', username);
    const user = await User.create({ username, password, character });
    console.log('User created successfully:', username);

    // Handle email verification if email is provided
    let emailVerificationSent = false;
    if (email && emailService.isValidEmail(email)) {
        try {
            console.log('Setting up email verification for:', email);
            const verificationToken = await User.createEmailVerificationToken(user.id, email);
            emailVerificationSent = await emailService.sendVerificationEmail(email, username, verificationToken);
            console.log('Email verification setup completed');
        } catch (error) {
            console.warn('Email verification setup failed:', error.message);
            // Don't fail registration if email verification fails
        }
    }

    // Generate tokens
    console.log('Generating tokens for user:', username);
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log('Registration successful for user:', username);
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token: accessToken,
        refreshToken,
        user: user.toJSON(),
        emailVerificationSent
    });
}));

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', checkRateLimit, handleFailedLogin, handleSuccessfulLogin, validateLogin, asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Verify user credentials
    const user = await User.verifyPassword(username, password);
    if (!user) {
        throw new AppError('INVALID_CREDENTIALS');
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
        success: true,
        message: 'Login successful',
        token: accessToken,
        refreshToken,
        user: user.toJSON()
    });
}));

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
 * POST /api/auth/verify-email
 * Verify email address with token
 */
router.post('/verify-email', validateEmailVerification, asyncHandler(async (req, res) => {
    const { token } = req.body;

    console.log('Email verification attempt with token:', token.substring(0, 8) + '...');
    const user = await User.verifyEmailToken(token);
    
    if (!user) {
        console.log('Email verification failed - invalid or expired token');
        throw new AppError('INVALID_CREDENTIALS', { 
            message: 'Invalid or expired verification token'
        });
    }

    console.log('Email verification successful for user:', user.username);
    res.json({
        success: true,
        message: 'Email verified successfully',
        user: user.toJSON()
    });
}));

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post('/forgot-password', validatePasswordReset, asyncHandler(async (req, res) => {
    const { email } = req.body;

    console.log('Password reset request for email:', email);
    const result = await User.createPasswordResetToken(email);
    
    if (!result) {
        console.log('Password reset failed - email not found or not verified');
        // Don't reveal whether email exists for security
        res.json({
            success: true,
            message: 'If the email address is registered and verified, you will receive a password reset link.'
        });
        return;
    }

    const { user, token } = result;
    console.log('Sending password reset email to:', email);
    
    try {
        await emailService.sendPasswordResetEmail(email, user.username, token);
        console.log('Password reset email sent successfully');
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        // Don't fail the request if email sending fails
    }

    res.json({
        success: true,
        message: 'If the email address is registered and verified, you will receive a password reset link.'
    });
}));

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', validatePasswordResetConfirm, asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    console.log('Password reset attempt with token:', token.substring(0, 8) + '...');
    const user = await User.resetPasswordWithToken(token, password);
    
    if (!user) {
        console.log('Password reset failed - invalid or expired token');
        throw new AppError('INVALID_CREDENTIALS', { 
            message: 'Invalid or expired reset token'
        });
    }

    console.log('Password reset successful for user:', user.username);
    
    // Generate new tokens after password reset
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
        success: true,
        message: 'Password reset successfully',
        token: accessToken,
        refreshToken,
        user: user.toJSON()
    });
}));

/**
 * GET /api/auth/rate-limit-stats
 * Get rate limiting statistics (for monitoring)
 */
router.get('/rate-limit-stats', authenticateToken, async (req, res) => {
    try {
        const stats = getRateLimitStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Rate limit stats error:', error);
        res.status(500).json({
            error: 'Failed to get rate limit statistics',
            code: 'RATE_LIMIT_STATS_ERROR'
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