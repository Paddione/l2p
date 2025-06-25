/**
 * Application constants
 */

// API configuration
export const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'  // Development
    : `${window.location.protocol}//${window.location.host}/api`;  // Production

export const REQUEST_TIMEOUT = 30000; // Request timeout in milliseconds (30 seconds)

// Performance settings
export const PERFORMANCE_SETTINGS = {
    TARGET_FPS: 60,
    FRAME_TIME: 1000 / 60, // ~16.67ms for 60 FPS
    TIMER_UPDATE_INTERVAL: 1000 / 60, // 60 FPS for smooth timer updates
    ANIMATION_FRAME_LIMIT: 1000 / 60, // Limit requestAnimationFrame to 60 FPS
    WEBSOCKET_ENABLED: true, // Enable WebSocket real-time communication
    POLLING_INTERVALS: {
        GAME_STATE_MIN: 3000, // Minimum game state polling interval (3s) - used as fallback when WebSocket unavailable
        GAME_STATE_MAX: 23000, // Maximum game state polling interval (23s)
        LOBBY_STANDARD: 3000, // Standard lobby polling (3s, increased from 2s) - used as fallback when WebSocket unavailable
        LOBBY_POST_GAME: 5000, // Post-game lobby polling (5s, increased from 3s)
        UI_UPDATES: 100 // UI update throttling (100ms)
    }
};

// Game settings
export const GAME_SETTINGS = {
    MIN_PLAYERS: 1,
    MAX_PLAYERS: 8,
    QUESTION_TIME: 60, // seconds
    QUESTION_TRANSITION_TIME: 5000, // milliseconds
    MIN_QUESTIONS: 5,
    MAX_QUESTIONS: 15,
    MIN_MULTIPLIER: 1,
    MAX_MULTIPLIER: 5,
    LOBBY_CODE_LENGTH: 4
};

// Screen IDs
export const SCREENS = {
    LOADING: 'loading-screen',
    AUTH: 'auth-screen',
    MAIN_MENU: 'main-menu-screen',
    QUESTION_SET_SELECTION: 'question-set-selection-screen',
    UPLOAD_QUESTIONS: 'upload-questions-screen',
    CREATE_GAME: 'create-game-screen',
    JOIN_GAME: 'join-game-screen',
    LOBBY: 'lobby-screen',
    GAME: 'game-screen',
    RESULTS: 'results-screen',
    HALL_OF_FAME: 'hall-of-fame-screen'
};

// Question types
export const QUESTION_TYPES = {
    MULTIPLE_CHOICE: 'multiple_choice',
    TRUE_FALSE: 'true_false'
};

// Game phases
export const GAME_PHASES = {
    WAITING: 'waiting',
    QUESTION: 'question',
    RESULTS: 'results',
    FINISHED: 'finished',
    POST_GAME: 'post-game'
};

// Local storage keys
export const STORAGE_KEYS = {
    USERS: 'learn2play_users',
    CURRENT_USER: 'learn2play_current_user',
    HALL_OF_FAME: 'learn2play_hall_of_fame',
    USER_DATA: 'quiz_user_data',
    SETTINGS: 'quiz_settings',
    STORAGE_MODE: 'quiz_storage_mode',
    GAME_STATE: 'quiz_game_state',
    LOBBY_STATE: 'quiz_lobby_state'
};

// CSS classes
export const CSS_CLASSES = {
    HIDDEN: 'hidden',
    ACTIVE: 'active',
    SELECTED: 'selected',
    CORRECT: 'correct',
    INCORRECT: 'incorrect',
    ANSWERED: 'answered',
    WINNER: 'winner',
    WARNING: 'warning'
};

// Animation classes
export const ANIMATIONS = {
    FADE_IN: 'fade-in',
    SLIDE_IN: 'slide-in',
    PULSE: 'pulse',
    SHAKE: 'shake',
    FLOAT: 'float',
    GLOW: 'glow',
    FADE_OUT: 'fade-out'
};

// Event names
export const EVENTS = {
    PLAYER_JOINED: 'player-joined',
    PLAYER_LEFT: 'player-left',
    PLAYER_READY: 'player-ready',
    GAME_STARTED: 'game-started',
    QUESTION_STARTED: 'question-started',
    QUESTION_UPDATED: 'question-updated',
    ANSWER_SUBMITTED: 'answer-submitted',
    QUESTION_ENDED: 'question-ended',
    GAME_ENDED: 'game-ended',
    TIMER_UPDATED: 'timer-updated',
    TIMER_FINISHED: 'timer-finished',
    TIMER_PAUSED: 'timer-paused',
    TIMER_RESUMED: 'timer-resumed'
};

// Error messages
export const ERROR_MESSAGES = {
    // Legacy error messages (kept for backward compatibility)
    USERNAME_EXISTS: 'Benutzername existiert bereits',
    INVALID_USERNAME: 'Benutzername muss 3-16 Zeichen lang sein und darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten',
    INVALID_PASSWORD: 'Passwort muss mindestens 6 Zeichen lang sein',
    USER_NOT_FOUND: 'Benutzer nicht gefunden',
    INVALID_PASSWORD_LOGIN: 'Ungültiges Passwort',
    NO_CHARACTER: 'Bitte wähle einen Charakter',
    LOBBY_FULL: 'Lobby ist voll',
    INVALID_LOBBY: 'Ungültiger Lobby-Code',
    NOT_ENOUGH_PLAYERS: 'Nicht genügend Spieler zum Starten',
    GAME_IN_PROGRESS: 'Spiel bereits im Gange'
};

// Standardized error codes (matching backend)
export const ERROR_CODES = {
    // Authentication errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    
    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    MISSING_FIELDS: 'MISSING_FIELDS',
    
    // Resource errors
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
    
    // Game-specific errors
    LOBBY_FULL: 'LOBBY_FULL',
    GAME_IN_PROGRESS: 'GAME_IN_PROGRESS',
    INVALID_GAME_STATE: 'INVALID_GAME_STATE',
    
    // Database errors
    DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
    DB_QUERY_ERROR: 'DB_QUERY_ERROR',
    
    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // File upload errors
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
    
    // Generic errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
}; 