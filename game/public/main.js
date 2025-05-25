// js/main.js

/**
 * @fileoverview Main entry point for the Quiz Game application.
 * Initializes modules, sets up dependencies, and starts the application flow.
 */

import { gameState, setGameConfig, setUserInteracted } from './state.js';
import * as ui from './ui.js';
import * as game from './game.js';
import * as socketHandlers from './socket.js'; // Renamed to avoid conflict if socket var is used
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
    elements: gameState.elements // Will be populated by ui.initUI()
};
// Make dependencies available in gameState if modules need to access it through there (e.g. api in ui.js)
gameState.dependencies = dependencies;


/**
 * Initializes the core application logic after DOM is loaded and config is available.
 */
function initializeAppCore() {
    console.log('Main: Initializing App Core Logic...');

    // 1. Initialize UI (selects DOM elements, creates dynamic content like audio tags)
    ui.initUI(); // This will also populate gameState.elements and initialize sounds via ui.generateDynamicHTMLContent -> sound.initSounds
    dependencies.elements = gameState.elements; // Ensure dependencies object has the populated elements

    // 2. Setup all event listeners, passing them the dependencies object
    eventSetup.setupAllEventListeners(dependencies);

    // 3. Initialize Firebase and setup auth state listener
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

    // Restore persisted guest name if available
    if (gameState.elements.guestNameInput && localStorage.getItem('quizPlayerName')) {
        gameState.elements.guestNameInput.value = localStorage.getItem('quizPlayerName');
        // gameState.currentPlayerName is already initialized from localStorage in state.js
    }

    // Set initial muted state for sounds based on localStorage
    sound.setAllSoundsMuted(gameState.isMuted);


    console.log('Main: ✅ Core logic initialized. Waiting for auth state changes...');
}

// --- Application Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Main: 🚀 DOM loaded, starting application pre-init...');
    ui.showScreen('loading'); // Show loading screen first

    // A short timeout to allow config to potentially load if it's injected slightly after DOMContentLoaded
    setTimeout(() => {
        console.log('Main: Checking for GAME_CONFIG...');
        if (!window.GAME_CONFIG || !window.GAME_CONFIG.firebaseConfig || !window.GAME_CONFIG.firebaseConfig.apiKey) {
            console.error('Main: ❌ CRITICAL - GAME_CONFIG or Firebase config missing/incomplete.', window.GAME_CONFIG);
            ui.updateConfigStatusDisplay('Config Fehler!', true);
            // Potentially show a more permanent error on the loading screen or redirect
            return; // Stop initialization if config is missing
        }

        ui.updateConfigStatusDisplay('Geladen', false);
        setGameConfig(window.GAME_CONFIG.firebaseConfig); // Store config in state

        initializeAppCore();

    }, 150); // Small delay, adjust if necessary
});

console.log('main.js loaded');
