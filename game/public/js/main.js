// js/main.js

/**
 * @fileoverview Main entry point for the Quiz Game application.
 * Initializes modules, sets up dependencies, and starts the application flow.
 */

import { gameState, setGameConfig, setUserInteracted } from './state.js';
import * as ui from './ui.js';
import * as game from './game.js';
import * as socketHandlers from './socket.js';
import * as auth from './auth.js';
import * as eventSetup from './eventListeners.js';
import * as sound from './sound.js';
import * as api from './api.js';

// This object will be passed to modules that need access to other modules or shared state.
const dependencies = {
    state: gameState, // Direct access to the gameState object from state.js
    ui,
    game,
    socketHandlers,
    auth,
    eventSetup, // Though eventSetup itself uses dependencies
    sound,
    api,
    elements: null // Will be populated by ui.initUI()
};

// Make dependencies available in gameState if modules need to access it through there
gameState.dependencies = dependencies;

/**
 * Initializes the core application logic after DOM is loaded and config is available.
 */
function initializeAppCore() {
    console.log('Main: Initializing App Core Logic...');

    try {
        // 1. Initialize UI (selects DOM elements, creates dynamic content like audio tags)
        ui.initUI(); // This will also populate gameState.elements and initialize sounds
        dependencies.elements = gameState.elements; // Ensure dependencies object has the populated elements

        // 2. Set up socket dependencies to avoid circular imports
        socketHandlers.setSocketDependencies(dependencies);

        // 3. Setup all event listeners, passing them the dependencies object
        eventSetup.setupAllEventListeners(dependencies);

        // 4. Initialize Firebase and setup auth state listener
        // The auth state listener will then trigger socket connection and screen changes.
        if (gameState.firebaseConfig) {
            auth.initFirebase(gameState.firebaseConfig, (app, authInstance) => {
                // Firebase app and auth are already set in gameState by initFirebase
                auth.setupAuthStateListener(dependencies);
            });
        } else {
            console.error("Main: Firebase config missing in gameState. Cannot initialize Firebase.");
            ui.updateConfigStatusDisplay('Firebase Config Fehler', true);
            ui.showScreen('auth'); // Fallback to auth screen, though it might not work fully
        }

        // 5. Restore persisted guest name if available
        if (gameState.elements.guestNameInput && localStorage.getItem('quizPlayerName')) {
            gameState.elements.guestNameInput.value = localStorage.getItem('quizPlayerName');
            // gameState.currentPlayerName is already initialized from localStorage in state.js
        }

        // 6. Set initial muted state for sounds based on localStorage
        sound.setAllSoundsMuted(gameState.isMuted);

        console.log('Main: ✅ Core logic initialized. Waiting for auth state changes...');

    } catch (error) {
        console.error('Main: ❌ Error during initialization:', error);
        ui.updateConfigStatusDisplay('Initialisierungsfehler', true);
        // Show error to user
        if (ui.showGlobalNotification) {
            ui.showGlobalNotification('Fehler beim Laden der Anwendung', 'error');
        }
    }
}

/**
 * Validates that required global objects are available
 * @returns {boolean} True if all required globals are present
 */
function validateGlobalDependencies() {
    const required = ['firebase', 'io'];
    const missing = required.filter(dep => typeof window[dep] === 'undefined');

    if (missing.length > 0) {
        console.error('Main: Missing required global dependencies:', missing);
        ui.updateConfigStatusDisplay('Fehlende Bibliotheken: ' + missing.join(', '), true);
        return false;
    }

    return true;
}

/**
 * Validates the game configuration
 * @returns {boolean} True if config is valid
 */
function validateGameConfig() {
    if (!window.GAME_CONFIG) {
        console.error('Main: ❌ GAME_CONFIG not found on window object');
        return false;
    }

    if (!window.GAME_CONFIG.firebaseConfig) {
        console.error('Main: ❌ firebaseConfig missing from GAME_CONFIG');
        return false;
    }

    const requiredFirebaseFields = ['apiKey', 'authDomain', 'projectId'];
    const missingFields = requiredFirebaseFields.filter(field =>
        !window.GAME_CONFIG.firebaseConfig[field]
    );

    if (missingFields.length > 0) {
        console.error('Main: ❌ Missing required Firebase config fields:', missingFields);
        return false;
    }

    return true;
}

// --- Application Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Main: 🚀 DOM loaded, starting application pre-init...');

    // Show loading screen first
    try {
        ui.showScreen('loading');
    } catch (error) {
        console.error('Main: Error showing loading screen:', error);
        // Continue anyway, the page might still work
    }

    // Small timeout to allow config injection to complete
    setTimeout(() => {
        console.log('Main: Checking for GAME_CONFIG...');

        // Validate global dependencies first
        if (!validateGlobalDependencies()) {
            return; // Stop if critical dependencies are missing
        }

        // Validate game configuration
        if (!validateGameConfig()) {
            ui.updateConfigStatusDisplay('Config Fehler!', true);
            return; // Stop initialization if config is invalid
        }

        try {
            ui.updateConfigStatusDisplay('Geladen', false);
            setGameConfig(window.GAME_CONFIG.firebaseConfig); // Store config in state

            // Initialize the application core
            initializeAppCore();

        } catch (error) {
            console.error('Main: ❌ Error during core initialization:', error);
            ui.updateConfigStatusDisplay('Initialisierungsfehler', true);
        }

    }, 200); // Slightly longer delay to ensure all scripts are loaded
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Main: Global error caught:', event.error);

    // Try to show user-friendly error if UI is available
    if (gameState.dependencies?.ui?.showGlobalNotification) {
        gameState.dependencies.ui.showGlobalNotification(
            'Ein unerwarteter Fehler ist aufgetreten',
            'error'
        );
    }
});

// Promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Main: Unhandled promise rejection:', event.reason);

    // Try to show user-friendly error if UI is available
    if (gameState.dependencies?.ui?.showGlobalNotification) {
        gameState.dependencies.ui.showGlobalNotification(
            'Ein Netzwerk- oder Serverfehler ist aufgetreten',
            'error'
        );
    }
});

console.log('main.js loaded');