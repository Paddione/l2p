/**
 * Utility helper functions
 */

import { PERFORMANCE_SETTINGS } from './constants.js';

/**
 * Generates a random 4-character lobby code
 * @returns {string} Random lobby code
 */
export function generateLobbyCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

/**
 * Formats a score number with commas
 * @param {number} score - Score to format
 * @returns {string} Formatted score
 */
export function formatScore(score) {
    return score.toLocaleString();
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Validates username format
 * @param {string} username - Username to validate
 * @returns {boolean} Whether username is valid
 */
export function isValidUsername(username) {
    if (!username || typeof username !== 'string') return false;
    if (username.length < 3 || username.length > 16) return false;
    return /^[a-zA-Z0-9_-]+$/.test(username);
}

/**
 * Validates password format
 * @param {string} password - Password to validate
 * @returns {boolean} Whether password is valid
 */
export function isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 6 && password.length <= 128;
}

/**
 * Calculates score based on time remaining and multiplier
 * @param {number} timeRemaining - Time remaining in seconds
 * @param {number} multiplier - Current multiplier
 * @returns {number} Calculated score
 */
export function calculateScore(timeRemaining, multiplier) {
    // New scoring logic: 60 points base, lose 1 point per second elapsed
    // If 45 seconds left, get 45 points, then multiply by personal multiplier
    const basePoints = Math.max(0, timeRemaining);
    return Math.round(basePoints * multiplier);
}

/**
 * Calculates next multiplier based on current multiplier and answer correctness
 * @param {number} currentMultiplier - Current multiplier value
 * @param {boolean} wasCorrect - Whether the answer was correct
 * @returns {number} Next multiplier value
 */
export function getNextMultiplier(currentMultiplier, wasCorrect) {
    if (wasCorrect) {
        return Math.min(5, currentMultiplier + 1);
    } else {
        return 1; // Reset to 1 on wrong answer
    }
}

// Framerate limiting utilities
let lastFrameTime = 0;
let animationFrameCallbacks = new Set();
let animationFrameId = null;

/**
 * Framerate-limited requestAnimationFrame
 * Limits animations to 60 FPS to prevent excessive CPU usage
 * @param {Function} callback - Function to call on next frame
 * @returns {number} - Request ID that can be used with cancelAnimationFrame
 */
export function requestAnimationFrame60(callback) {
    const callbackId = Math.random();
    animationFrameCallbacks.add({ id: callbackId, callback });
    
    if (!animationFrameId) {
        startFrameLoop();
    }
    
    return callbackId;
}

/**
 * Cancel a framerate-limited animation frame request
 * @param {number} id - Request ID returned by requestAnimationFrame60
 */
export function cancelAnimationFrame60(id) {
    animationFrameCallbacks.forEach(item => {
        if (item.id === id) {
            animationFrameCallbacks.delete(item);
        }
    });
    
    if (animationFrameCallbacks.size === 0 && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Starts the framerate-limited animation loop
 */
function startFrameLoop() {
    function frameLoop(currentTime) {
        // Limit to 60 FPS
        if (currentTime - lastFrameTime >= PERFORMANCE_SETTINGS.FRAME_TIME) {
            lastFrameTime = currentTime;
            
            // Execute all callbacks
            const callbacksToExecute = Array.from(animationFrameCallbacks);
            animationFrameCallbacks.clear();
            
            callbacksToExecute.forEach(({ callback }) => {
                try {
                    callback(currentTime);
                } catch (error) {
                    console.error('Error in animation frame callback:', error);
                }
            });
        }
        
        if (animationFrameCallbacks.size > 0) {
            animationFrameId = requestAnimationFrame(frameLoop);
        } else {
            animationFrameId = null;
        }
    }
    
    animationFrameId = requestAnimationFrame(frameLoop);
}

/**
 * Throttle function calls to prevent excessive execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Debounce function calls to prevent excessive execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;
    return function() {
        const args = arguments;
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Performance monitoring utility
 */
export const PerformanceMonitor = {
    timers: new Map(),
    
    /**
     * Start measuring performance for a given operation
     * @param {string} name - Operation name
     */
    start(name) {
        this.timers.set(name, performance.now());
    },
    
    /**
     * End measuring and log performance for a given operation
     * @param {string} name - Operation name
     * @param {boolean} log - Whether to log the result
     * @returns {number} - Time taken in milliseconds
     */
    end(name, log = false) {
        const startTime = this.timers.get(name);
        if (!startTime) {
            console.warn(`Performance timer '${name}' was not started`);
            return 0;
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.timers.delete(name);
        
        if (log) {
            console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        }
        
        return duration;
    }
}; 