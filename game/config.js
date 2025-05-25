// game/config.js

/**
 * @fileoverview Configuration and environment validation for the game server.
 */

// Game Configuration Constants
const GAME_CONFIG = {
    QUESTIONS_PER_GAME: 10,
    DEFAULT_TIME_LIMIT: 60, // 60 seconds per question
    INITIAL_MULTIPLIER: 1,
    LOBBY_CLEANUP_DELAY: 300000, // 5 minutes
    PLAYER_DISCONNECT_GRACE_PERIOD: 30000, // 30 seconds
    QUESTION_DELAY: 5000, // 5 seconds between questions
    GAME_START_DELAY: 3000 // 3 seconds before first question
};

/**
 * Validates that all required environment variables are present.
 * @returns {boolean} True if all required variables are present.
 */
function validateEnvironment() {
    console.log('🔍 Game Server: Validating environment variables...');

    const requiredEnvVars = [
        'AUTH_APP_URL',
        'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('❌ Game Server CRITICAL: Missing required environment variables:', missingVars);
        return false;
    }

    console.log('✅ Environment validation passed');
    return true;
}

/**
 * Gets the Firebase configuration from environment variables.
 * @returns {Object} Firebase configuration object.
 */
function getFirebaseConfig() {
    return {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
    };
}

/**
 * Gets the complete game configuration for client injection.
 * @returns {Object} Game configuration object.
 */
function getGameConfigForClient() {
    return {
        authAppUrl: process.env.AUTH_APP_URL,
        firebaseConfig: getFirebaseConfig(),
        debugMode: process.env.NODE_ENV !== 'production'
    };
}

/**
 * Gets CORS origins configuration.
 * @returns {string[]} Array of allowed CORS origins.
 */
function getCorsOrigins() {
    return [
        process.env.CORS_ORIGIN_GAME_CLIENT || "https://game.korczewski.de",
        process.env.AUTH_APP_URL || "https://auth.korczewski.de",
        "http://localhost:3000",
        "http://localhost:3001"
    ];
}

module.exports = {
    GAME_CONFIG,
    validateEnvironment,
    getFirebaseConfig,
    getGameConfigForClient,
    getCorsOrigins
};