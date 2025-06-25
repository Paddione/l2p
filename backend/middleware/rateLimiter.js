const { query } = require('../database/connection');
const { AppError } = require('./errorHandler');
const emailService = require('../services/emailService');

// In-memory storage for rate limiting (in production, use Redis)
const loginAttempts = new Map();
const lockedAccounts = new Map();

// Configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Clean up expired entries from memory
 */
function cleanupExpiredEntries() {
    const now = Date.now();
    
    // Clean up login attempts
    for (const [key, data] of loginAttempts.entries()) {
        if (now - data.firstAttempt > RATE_LIMIT_WINDOW) {
            loginAttempts.delete(key);
        }
    }
    
    // Clean up locked accounts
    for (const [key, lockTime] of lockedAccounts.entries()) {
        if (now - lockTime > LOCKOUT_DURATION) {
            lockedAccounts.delete(key);
        }
    }
}

// Start cleanup interval
setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);

/**
 * Get rate limit key for IP and username combination
 * @param {string} ip - Client IP address
 * @param {string} username - Username attempting login
 * @returns {string} Rate limit key
 */
function getRateLimitKey(ip, username) {
    return `${ip}:${username}`;
}

/**
 * Check if account is locked
 * @param {string} username - Username to check
 * @returns {boolean} True if account is locked
 */
function isAccountLocked(username) {
    const lockTime = lockedAccounts.get(username);
    if (!lockTime) return false;
    
    const now = Date.now();
    if (now - lockTime > LOCKOUT_DURATION) {
        lockedAccounts.delete(username);
        return false;
    }
    
    return true;
}

/**
 * Get remaining lockout time for an account
 * @param {string} username - Username to check
 * @returns {number} Remaining lockout time in milliseconds, 0 if not locked
 */
function getRemainingLockoutTime(username) {
    const lockTime = lockedAccounts.get(username);
    if (!lockTime) return 0;
    
    const now = Date.now();
    const remaining = LOCKOUT_DURATION - (now - lockTime);
    return remaining > 0 ? remaining : 0;
}

/**
 * Record a failed login attempt
 * @param {string} ip - Client IP address
 * @param {string} username - Username that failed login
 */
function recordFailedAttempt(ip, username) {
    const key = getRateLimitKey(ip, username);
    const now = Date.now();
    
    let attempts = loginAttempts.get(key);
    if (!attempts) {
        attempts = {
            count: 0,
            firstAttempt: now,
            lastAttempt: now
        };
    }
    
    // Reset counter if window has expired
    if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
        attempts = {
            count: 0,
            firstAttempt: now,
            lastAttempt: now
        };
    }
    
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(key, attempts);
    
    // Lock account if too many attempts
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        lockedAccounts.set(username, now);
        console.warn(`🔒 Account locked due to too many failed login attempts: ${username} from IP: ${ip}`);
        
        // Send lockout notification email if user has a verified email
        sendLockoutNotification(username).catch(error => {
            console.warn('Failed to send lockout notification email:', error.message);
        });
    }
}

/**
 * Record a successful login attempt (clears failed attempts)
 * @param {string} ip - Client IP address
 * @param {string} username - Username that successfully logged in
 */
function recordSuccessfulAttempt(ip, username) {
    const key = getRateLimitKey(ip, username);
    loginAttempts.delete(key);
    lockedAccounts.delete(username);
}

/**
 * Get current failed attempt count for IP/username combination
 * @param {string} ip - Client IP address
 * @param {string} username - Username to check
 * @returns {number} Number of failed attempts
 */
function getFailedAttemptCount(ip, username) {
    const key = getRateLimitKey(ip, username);
    const attempts = loginAttempts.get(key);
    
    if (!attempts) return 0;
    
    const now = Date.now();
    if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
        loginAttempts.delete(key);
        return 0;
    }
    
    return attempts.count;
}

/**
 * Middleware to check rate limits and account lockout
 */
function checkRateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const username = req.body.username;
    
    if (!username) {
        return next();
    }
    
    // Check if account is locked
    if (isAccountLocked(username)) {
        const remainingTime = getRemainingLockoutTime(username);
        const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
        
        return next(new AppError('ACCOUNT_LOCKED', {
            username,
            remainingMinutes,
            message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minutes.`
        }));
    }
    
    // Check rate limit
    const failedAttempts = getFailedAttemptCount(ip, username);
    const remainingAttempts = MAX_LOGIN_ATTEMPTS - failedAttempts;
    
    if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        return next(new AppError('RATE_LIMIT_EXCEEDED', {
            username,
            message: 'Too many failed login attempts. Account has been temporarily locked.'
        }));
    }
    
    // Add attempt info to request for logging
    req.loginAttemptInfo = {
        ip,
        username,
        failedAttempts,
        remainingAttempts
    };
    
    next();
}

/**
 * Middleware to handle failed login attempts
 */
function handleFailedLogin(req, res, next) {
    const originalSend = res.send;
    
    res.send = function(data) {
        // Check if this was a failed login (status 401 or error response)
        if (res.statusCode === 401 && req.loginAttemptInfo) {
            const { ip, username } = req.loginAttemptInfo;
            recordFailedAttempt(ip, username);
            
            const newFailedAttempts = getFailedAttemptCount(ip, username);
            const remainingAttempts = MAX_LOGIN_ATTEMPTS - newFailedAttempts;
            
            console.warn(`⚠️  Failed login attempt ${newFailedAttempts}/${MAX_LOGIN_ATTEMPTS} for ${username} from ${ip}. Remaining attempts: ${remainingAttempts}`);
            
            // Modify response to include remaining attempts info
            if (typeof data === 'string') {
                try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.error) {
                        parsedData.remainingAttempts = remainingAttempts;
                        if (remainingAttempts <= 2) {
                            parsedData.warning = `Warning: Only ${remainingAttempts} login attempts remaining before account lockout.`;
                        }
                        data = JSON.stringify(parsedData);
                    }
                } catch (e) {
                    // If not JSON, leave as is
                }
            }
        }
        
        originalSend.call(this, data);
    };
    
    next();
}

/**
 * Middleware to handle successful login attempts
 */
function handleSuccessfulLogin(req, res, next) {
    const originalSend = res.send;
    
    res.send = function(data) {
        // Check if this was a successful login (status 200 and contains token)
        if (res.statusCode === 200 && req.loginAttemptInfo) {
            let isSuccessfulLogin = false;
            
            if (typeof data === 'string') {
                try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.token || parsedData.success) {
                        isSuccessfulLogin = true;
                    }
                } catch (e) {
                    // If not JSON, check if it looks like success
                }
            }
            
            if (isSuccessfulLogin) {
                const { ip, username } = req.loginAttemptInfo;
                recordSuccessfulAttempt(ip, username);
                console.log(`✅ Successful login for ${username} from ${ip}`);
            }
        }
        
        originalSend.call(this, data);
    };
    
    next();
}

/**
 * Send lockout notification email to user
 * @param {string} username - Username that was locked
 */
async function sendLockoutNotification(username) {
    try {
        const User = require('../models/User');
        const user = await User.findByUsername(username);
        
        if (user && user.email && user.emailVerified) {
            const lockoutMinutes = Math.ceil(LOCKOUT_DURATION / (60 * 1000));
            await emailService.sendAccountLockoutEmail(user.email, username, lockoutMinutes);
            console.log(`📧 Lockout notification sent to ${user.email}`);
        }
    } catch (error) {
        console.warn('Failed to send lockout notification:', error.message);
    }
}

/**
 * Get rate limiting statistics (for monitoring)
 */
function getRateLimitStats() {
    return {
        activeAttempts: loginAttempts.size,
        lockedAccounts: lockedAccounts.size,
        configuration: {
            maxAttempts: MAX_LOGIN_ATTEMPTS,
            lockoutDurationMinutes: LOCKOUT_DURATION / (60 * 1000),
            rateLimitWindowMinutes: RATE_LIMIT_WINDOW / (60 * 1000)
        }
    };
}

module.exports = {
    checkRateLimit,
    handleFailedLogin,
    handleSuccessfulLogin,
    getRateLimitStats,
    isAccountLocked,
    getRemainingLockoutTime,
    recordFailedAttempt,
    recordSuccessfulAttempt
}; 