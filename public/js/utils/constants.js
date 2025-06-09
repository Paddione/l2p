/**
 * Application constants
 */

// API configuration
export const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'  // Development
    : `${window.location.protocol}//${window.location.host}/api`;  // Production
export const REQUEST_TIMEOUT = 30000; // Request timeout in milliseconds (30 seconds)

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
    FINISHED: 'finished'
};

// Local storage keys
export const STORAGE_KEYS = {
    USERS: 'quiz_meister_users',
    CURRENT_USER: 'quiz_meister_current_user',
    HALL_OF_FAME: 'quiz_meister_hall_of_fame',
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
    USERNAME_EXISTS: 'Username already exists',
    INVALID_USERNAME: 'Username must be 3-16 characters and contain only letters, numbers, underscores, and hyphens',
    INVALID_PASSWORD: 'Password must be at least 6 characters long',
    USER_NOT_FOUND: 'User not found',
    INVALID_PASSWORD_LOGIN: 'Invalid password',
    NO_CHARACTER: 'Please select a character',
    LOBBY_FULL: 'Lobby is full',
    INVALID_LOBBY: 'Invalid lobby code',
    NOT_ENOUGH_PLAYERS: 'Not enough players to start',
    GAME_IN_PROGRESS: 'Game already in progress'
}; 