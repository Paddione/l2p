// public/js/app.js - Updated for API integration
// Import modules
import { initAuth } from '/js/auth/auth.js';
import { initScreenManager } from '/js/ui/screenManager.js';
import { initStorage, STORAGE_MODES } from '/js/data/storage.js';
import { initLobbyManager } from '/js/lobby/lobbyManager.js';
import { initPlayerManager } from '/js/lobby/playerManager.js';
import { initHallOfFameUI } from '/js/ui/hallOfFame.js';
import { initQuestionSetManager } from '/js/ui/questionSetManager.js';
import { initQuestionSetSelector } from '/js/ui/questionSetSelector.js';
import { initQuestionSetUploader } from '/js/ui/questionSetUploader.js';
import { initGameController } from '/js/game/gameController.js';
import { initAudioManager } from '/js/audio/audioManager.js';
import { initVolumeControls } from '/js/ui/volumeControls.js';
import { initHelpSystem } from '/js/ui/helpSystem.js';
import LanguageSwitcher from '/js/utils/languageSwitcher.js';
import themeManager from '/js/utils/themeManager.js';
import { SCREENS } from '/js/utils/constants.js';
import apiClient from '/js/api/apiClient.js';
import { questionSetsApi } from '/js/api/questionSetsApi.js';
import { developmentMode } from '/js/utils/developmentMode.js';
import { showNotification } from './ui/notifications.js';
import { t } from './utils/translations.js';
import websocketManager from '/js/websocket/websocketManager.js';

// Application state
let appState = {
    isInitialized: false,
    modules: {},
    currentUser: null
};

// Expose appState globally for API client access
window.appState = appState;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, starting Learn2Play application...');
    
    try {
        // Show loading screen first
        console.log('Showing loading screen...');
        showLoadingScreen();
        
        // Check development mode first - this may interrupt initialization
        console.log('Checking development mode...');
        const shouldContinue = await developmentMode.initialize();
        
        if (!shouldContinue) {
            console.log('Development mode cache clearing required - stopping initialization');
            return; // Stop initialization, development mode will handle the rest
        }
        
        console.log('Starting app initialization...');
        // Initialize core modules
        await initializeApp();
        console.log('App initialization completed successfully');
        
        console.log('Starting authentication check...');
        // Check authentication and show appropriate screen
        await handleInitialAuth();
        console.log('Authentication check completed successfully');
        
        console.log('Learn2Play initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        console.error('Error stack:', error.stack);
        
        // Ensure we show an error screen and hide loading
        try {
            showErrorScreen(error.message);
        } catch (errorScreenError) {
            console.error('Failed to show error screen:', errorScreenError);
            
            // Fallback: manually update loading screen content
            const loadingContent = document.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.innerHTML = `
                    <h1>Learn2Play</h1>
                    <div style="color: var(--error, red); margin: 2rem 0;">
                        <h2>Initialization Failed</h2>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Retry
                        </button>
                    </div>
                `;
            }
        }
    }
});

/**
 * Shows the loading screen with initialization status
 */
function showLoadingScreen() {
    // Show the loading screen using screen manager if available
    if (appState.modules.screenManager) {
        appState.modules.screenManager.showScreen('loading-screen');
    } else {
        // Fallback: manually show loading screen before screen manager is initialized
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('active');
        }
    }
    
    const loadingContent = document.querySelector('.loading-content');
    if (loadingContent) {
        loadingContent.innerHTML = `
                                <h1>Learn2Play</h1>
                    <div class="loading-spinner"></div>
                    <p>Anwendung wird initialisiert...</p>
        `;
    }
}

/**
 * Shows an error screen if initialization fails
 * @param {string} message - Error message to display
 */
function showErrorScreen(message) {
    // Show the loading screen (which will be used for error display)
    if (appState.modules.screenManager) {
        appState.modules.screenManager.showScreen('loading-screen');
    } else {
        // Fallback: manually show loading screen before screen manager is initialized
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('active');
        }
    }
    
    const loadingContent = document.querySelector('.loading-content');
    if (loadingContent) {
        loadingContent.innerHTML = `
            <h1>Learn2Play</h1>
            <div style="color: var(--error); margin: 2rem 0;">
                <h2>Initialisierung fehlgeschlagen</h2>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 1rem;">
                    Erneut versuchen
                </button>
            </div>
        `;
    }
}

/**
 * Updates loading screen with current step
 * @param {string} step - Current initialization step
 */
function updateLoadingStep(step) {
    const loadingContent = document.querySelector('.loading-content p');
    if (loadingContent) {
        loadingContent.textContent = step;
    }
}

/**
 * Initializes all application modules
 */
async function initializeApp() {
    try {
        console.log('initializeApp: Starting module initialization...');
        
        updateLoadingStep('Speicher wird initialisiert...');
        console.log('initializeApp: Initializing storage module...');
        
        // Initialize storage module
        appState.modules.storage = initStorage();
        console.log('initializeApp: Storage module initialized successfully');
        
        updateLoadingStep('Bildschirmverwaltung wird initialisiert...');
        console.log('initializeApp: Initializing screen manager...');
        
        // Initialize screen manager
        appState.modules.screenManager = initScreenManager();
        console.log('initializeApp: Screen manager initialized successfully');
        
        updateLoadingStep('Authentifizierung wird initialisiert...');
        console.log('initializeApp: Initializing authentication module...');
        
        // Initialize authentication module
        appState.modules.auth = initAuth(
            appState.modules.storage, 
            appState.modules.screenManager
        );
        console.log('initializeApp: Authentication module initialized successfully');
        
        updateLoadingStep('Lobby-System wird initialisiert...');
        console.log('initializeApp: Initializing lobby manager...');
        
        // Initialize lobby manager
        appState.modules.lobbyManager = initLobbyManager(
            appState.modules.storage, 
            appState.modules.screenManager
        );
        console.log('initializeApp: Lobby manager initialized successfully');
        
        console.log('initializeApp: Initializing player manager...');
        // Initialize player manager
        appState.modules.playerManager = initPlayerManager(
            appState.modules.lobbyManager, 
            appState.modules.storage, 
            appState.modules.screenManager
        );
        console.log('initializeApp: Player manager initialized successfully');
        
        updateLoadingStep('API-Client wird initialisiert...');
        console.log('initializeApp: Registering API client...');
        
        // Register API client as a module
        appState.modules.apiClient = apiClient;
        console.log('initializeApp: API client registered successfully');
        
        updateLoadingStep('Ruhmeshalle wird initialisiert...');
        console.log('initializeApp: Initializing Hall of Fame UI...');
        
        // Initialize Hall of Fame UI
        appState.modules.hallOfFameUI = initHallOfFameUI();
        console.log('initializeApp: Hall of Fame UI initialized successfully');
        
        updateLoadingStep('Hilfe-System wird initialisiert...');
        console.log('initializeApp: Initializing help system...');
        
        // Initialize help system
        appState.modules.helpSystem = initHelpSystem();
        console.log('initializeApp: Help system initialized successfully');
        
        updateLoadingStep('Fragensätze werden initialisiert...');
        console.log('initializeApp: Initializing question set manager...');
        
        // Initialize Question Set Manager
        appState.modules.questionSetManager = initQuestionSetManager();
        console.log('initializeApp: Question set manager initialized successfully');
        
        console.log('initializeApp: Initializing question set selector...');
        // Initialize Question Set Selector
        appState.modules.questionSetSelector = initQuestionSetSelector(
            questionSetsApi,
            appState.modules.screenManager,
            appState.modules.lobbyManager,
            appState.modules.storage,
            appState.modules.playerManager
        );
        appState.modules.questionSetSelector.init();
        console.log('initializeApp: Question set selector initialized successfully');
        
        console.log('initializeApp: Initializing question set uploader...');
        // Initialize Question Set Uploader
        appState.modules.questionSetUploader = initQuestionSetUploader(
            questionSetsApi,
            appState.modules.screenManager,
            apiClient
        );
        console.log('initializeApp: Question set uploader initialized successfully');
        
        updateLoadingStep('Audio-System wird initialisiert...');
        console.log('initializeApp: Initializing audio manager...');
        
        // Initialize Audio Manager globally
        appState.modules.audioManager = initAudioManager();
        console.log('initializeApp: Audio manager initialized successfully');
        
        console.log('initializeApp: Starting audio initialization...');
        // Initialize audio system (non-blocking)
        try {
            await appState.modules.audioManager.initialize();
            console.log('initializeApp: Audio manager initialize() completed');
            
            // Initialize volume controls after audio manager is ready
            console.log('initializeApp: Initializing volume controls...');
            appState.modules.volumeControls = initVolumeControls(appState.modules.audioManager);
            console.log('initializeApp: Volume controls initialized successfully');
            
            // Initialize language switcher
            console.log('initializeApp: Initializing language switcher...');
            appState.modules.languageSwitcher = new LanguageSwitcher();
            console.log('initializeApp: Language switcher initialized successfully');
            
            // Initialize theme manager
            console.log('initializeApp: Initializing theme manager...');
            appState.modules.themeManager = themeManager;
            console.log('initializeApp: Theme manager initialized successfully');
            
            // Start background music initialization in background (don't await)
            // This will fail due to browser autoplay policy until user interaction
            appState.modules.audioManager.playBackgroundMusic().then(() => {
                console.log('initializeApp: Background music started successfully');
            }).catch((error) => {
                console.warn('initializeApp: Background music initialization failed (expected due to browser autoplay policy):', error.message);
            });
            console.log('initializeApp: Background music initialization started (will complete after user interaction)');
        } catch (error) {
            console.warn('initializeApp: Failed to initialize audio system (continuing without audio):', error.message);
            // Don't throw - allow app to continue without audio
        }
        
        updateLoadingStep('Spiel-Controller wird initialisiert...');
        console.log('initializeApp: Initializing game controller...');
        
        // Initialize Game Controller
        appState.modules.gameController = initGameController(
            appState.modules.lobbyManager,
            appState.modules.playerManager,
            appState.modules.storage,
            appState.modules.screenManager
        );
        
        // Initialize the game controller (this sets up gameEngine, event listeners, etc.)
        appState.modules.gameController.init();
        console.log('initializeApp: Game controller initialized successfully');
        
        updateLoadingStep('Event-Handler werden eingerichtet...');
        console.log('initializeApp: Setting up main menu handlers...');
        
        // Setup main menu event handlers
        setupMainMenuHandlers();
        console.log('initializeApp: Main menu handlers set up successfully');
        
        console.log('initializeApp: Setting up results navigation handlers...');
        // Setup results screen navigation handlers
        setupResultsNavigationHandlers();
        console.log('initializeApp: Results navigation handlers set up successfully');
        
        console.log('initializeApp: Setting up error handlers...');
        // Setup global error handlers
        setupErrorHandlers();
        console.log('initializeApp: Error handlers set up successfully');
        
        console.log('initializeApp: Setting up audio interaction handler...');
        // Setup audio interaction handler for browser autoplay policy
        setupAudioInteractionHandler();
        console.log('initializeApp: Audio interaction handler set up successfully');
        
        // Mark app as initialized
        appState.isInitialized = true;
        console.log('initializeApp: All modules initialized successfully, app marked as initialized');
        
    } catch (error) {
        console.error('initializeApp: Failed to initialize application:', error);
        console.error('initializeApp: Error stack:', error.stack);
        throw error; // Re-throw to be caught by main error handler
    }
}

/**
 * Handles initial authentication check
 */
async function handleInitialAuth() {
    console.log('handleInitialAuth: Starting authentication check...');
    
    try {
        updateLoadingStep('Speichermodus wird überprüft...');
        console.log('handleInitialAuth: Checking storage mode...');
        
        // Check current storage mode
        const currentMode = appState.modules.storage.getStorageMode();
        console.log('handleInitialAuth: Current storage mode:', currentMode);
        
        if (currentMode === STORAGE_MODES.SINGLEPLAYER) {
            // Single-player mode: skip authentication, go directly to main menu
            console.log('handleInitialAuth: Single-player mode detected, skipping authentication');
            appState.modules.screenManager.showScreen(SCREENS.MAIN_MENU);
            return;
        }
        
        // Multiplayer mode: check authentication
        updateLoadingStep('Authentifizierung wird überprüft...');
        console.log('handleInitialAuth: Multiplayer mode, checking authentication...');
        
        // Check if user has a valid token
        const token = apiClient.getToken();
        console.log('handleInitialAuth: Token exists:', !!token);
        
        if (token) {
            updateLoadingStep('Anmeldedaten werden überprüft...');
            console.log('handleInitialAuth: Token found, verifying with server...');
            
            try {
                // Verify token with server
                console.log('handleInitialAuth: Calling getCurrentUser...');
                appState.currentUser = await apiClient.getCurrentUser();
                console.log('handleInitialAuth: getCurrentUser result:', appState.currentUser);
                
                if (appState.currentUser) {
                    console.log('handleInitialAuth: User authenticated:', appState.currentUser.username);
                    
                    // Update storage with current user
                    appState.modules.storage.setCurrentUser(appState.currentUser);
                    
                    // Initialize WebSocket connection
                    console.log('handleInitialAuth: Initializing WebSocket connection...');
                    await initializeWebSocket(token, appState.currentUser.username);
                    
                    // Check for saved game/lobby state
                    console.log('handleInitialAuth: Checking for saved state...');
                    await handleStateRecovery();
                    
                    // Show main menu
                    console.log('handleInitialAuth: Showing main menu...');
                    appState.modules.screenManager.showScreen(SCREENS.MAIN_MENU);
                    return;
                }
            } catch (authError) {
                console.log('handleInitialAuth: Token verification failed:', authError.message);
                // Clear invalid token
                apiClient.logout();
            }
        }
        
        // No valid authentication, show auth screen
        console.log('handleInitialAuth: No valid authentication found, showing login screen');
        appState.modules.auth.ensureInitialized();
        appState.modules.screenManager.showScreen(SCREENS.AUTH);
        
    } catch (error) {
        console.error('handleInitialAuth: Authentication check failed:', error);
        console.error('handleInitialAuth: Error stack:', error.stack);
        
        // Fallback to auth screen
        try {
            appState.modules.auth.ensureInitialized();
            appState.modules.screenManager.showScreen(SCREENS.AUTH);
        } catch (fallbackError) {
            console.error('handleInitialAuth: Fallback to auth screen failed:', fallbackError);
            throw fallbackError; // Re-throw to be caught by main error handler
        }
    } finally {
        // Always hide loading screen
        console.log('handleInitialAuth: Hiding loading screen...');
        try {
            if (appState.modules.screenManager) {
                appState.modules.screenManager.hideScreen(SCREENS.LOADING);
                console.log('handleInitialAuth: Loading screen hidden successfully');
            } else {
                console.warn('handleInitialAuth: Screen manager not available, manually hiding loading screen');
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.classList.remove('active');
                }
            }
        } catch (hideError) {
            console.error('handleInitialAuth: Failed to hide loading screen:', hideError);
            // Manual fallback
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.remove('active');
                loadingScreen.style.display = 'none';
            }
        }
    }
}

/**
 * Initialize WebSocket connection
 * @param {string} token - JWT token
 * @param {string} username - Username
 */
async function initializeWebSocket(token, username) {
    try {
        console.log('initializeWebSocket: Connecting to WebSocket...');
        await websocketManager.connect(token, username);
        
        // Store WebSocket manager in app state
        appState.modules.websocket = websocketManager;
        
        // Setup WebSocket event handlers
        setupWebSocketHandlers();
        
        console.log('initializeWebSocket: WebSocket initialization complete');
    } catch (error) {
        console.warn('initializeWebSocket: WebSocket initialization failed:', error.message);
        // Don't throw error - app should work without WebSocket (fallback to polling)
        showNotification('Real-time updates unavailable - using fallback mode', 'warning');
    }
}

/**
 * Setup WebSocket event handlers
 */
function setupWebSocketHandlers() {
    const ws = appState.modules.websocket;
    if (!ws) return;

    // Connection events
    ws.on('connected', () => {
        console.log('WebSocket connected');
        showNotification('Real-time updates enabled', 'success');
    });

    ws.on('disconnected', (reason) => {
        console.log('WebSocket disconnected:', reason);
        showNotification('Real-time updates disconnected', 'warning');
    });

    ws.on('reconnected', () => {
        console.log('WebSocket reconnected');
        showNotification('Real-time updates restored', 'success');
    });

    // Lobby events
    ws.on('lobby_updated', (lobbyData) => {
        console.log('Lobby updated via WebSocket:', lobbyData.code);
        // Update lobby UI if we're currently in a lobby
        if (appState.modules.playerManager && appState.modules.playerManager.getCurrentLobby()?.code === lobbyData.code) {
            appState.modules.playerManager.handleWebSocketLobbyUpdate(lobbyData);
        }
    });

    // Game events
    ws.on('game_updated', (gameData) => {
        console.log('Game updated via WebSocket:', gameData.code);
        // Update game UI if we're currently in a game
        if (appState.modules.gameController && appState.modules.gameController.getCurrentGame()?.lobbyCode === gameData.code) {
            appState.modules.gameController.handleWebSocketGameUpdate(gameData);
        }
    });

    // Notification events
    ws.on('notification', (notification) => {
        showNotification(notification.message, notification.type || 'info');
    });

    // Error events
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        showNotification('Real-time connection error', 'error');
    });
}

/**
 * Handles recovery of saved game or lobby state
 */
async function handleStateRecovery() {
    try {
        // Check for saved lobby state
        const lobbyState = appState.modules.storage.getLobbyState();
        if (lobbyState) {
            console.log('Found saved lobby state, attempting recovery...');
            // TODO: Implement lobby state recovery
            // This would need coordination with other players
        }
        
        // Check for saved game state
        const gameState = await appState.modules.storage.getGameState();
        if (gameState) {
            console.log('Found saved game state, attempting recovery...');
            // TODO: Implement game state recovery
            // This would need to check if the game is still active
        }
        
    } catch (error) {
        console.warn('State recovery failed:', error);
        // Clear invalid states
        appState.modules.storage.clearLobbyState();
        await appState.modules.storage.clearGameState();
    }
}

/**
 * Sets up main menu event handlers
 */
function setupMainMenuHandlers() {
    // Get menu buttons
    const createGameBtn = document.getElementById('create-game-btn');
    const joinGameBtn = document.getElementById('join-game-btn');
    const hallOfFameBtn = document.getElementById('hall-of-fame-btn');
    const helpBtn = document.getElementById('help-btn');

    // Add click handlers
    if (createGameBtn) {
        createGameBtn.addEventListener('click', async () => {
            // Skip question set selection and directly create a lobby
            await handleDirectLobbyCreation();
        });
    }
    if (joinGameBtn) {
        joinGameBtn.addEventListener('click', () => {
            appState.modules.screenManager.showScreen(SCREENS.JOIN_GAME);
            // Refresh active lobbies list
            refreshActiveLobbies();
        });
    }
    if (hallOfFameBtn) {
        hallOfFameBtn.addEventListener('click', showHallOfFame);
    }
    
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }

    // Setup back buttons
    const backToMenuBtn = document.getElementById('back-to-menu');
    const backToMenuJoinBtn = document.getElementById('back-to-menu-join');
    
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            appState.modules.screenManager.showScreen(SCREENS.MAIN_MENU);
        });
    }
    
    if (backToMenuJoinBtn) {
        backToMenuJoinBtn.addEventListener('click', () => {
            appState.modules.screenManager.showScreen(SCREENS.MAIN_MENU);
        });
    }



    // Setup join game form (original screen)
    const joinGameForm = document.getElementById('join-game-form');
    if (joinGameForm) {
        joinGameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const gameCode = document.getElementById('game-code-input').value.toUpperCase();
            
            try {
                // Get current user data for character information
                let currentUser = await appState.modules.storage.getCurrentUser();
                console.log('Current user data for join lobby:', currentUser);
                
                if (!currentUser) {
                    throw new Error('No user data found. Please log in again.');
                }
                
                // If character is missing, try to refresh user data from API
                if (!currentUser.character) {
                    console.warn('User character is missing for join, attempting to refresh user data...');
                    try {
                        // Force refresh from API
                        const refreshedUser = await apiClient.getCurrentUser();
                        console.log('Refreshed user data for join:', refreshedUser);
                        
                        if (refreshedUser && refreshedUser.character) {
                            currentUser = refreshedUser;
                            // Update localStorage with fresh data
                            appState.modules.storage.saveData('learn2play_current_user', {
                                ...refreshedUser,
                                lastLogin: new Date().toISOString()
                            });
                        } else {
                            console.error('Refreshed user data still missing character for join:', refreshedUser);
                            throw new Error('User character information not found. Please log in again or update your profile.');
                        }
                    } catch (refreshError) {
                        console.error('Failed to refresh user data for join:', refreshError);
                        throw new Error('Unable to load user information. Please log in again.');
                    }
                }
                
                if (!currentUser.character) {
                    console.error('User character is still missing after refresh for join:', currentUser);
                    throw new Error('User character information not found. Please log in again or update your profile.');
                }
                
                // Set current player in playerManager
                appState.modules.playerManager.setCurrentPlayer(currentUser);
                
                // Use playerManager to handle lobby joining
                await appState.modules.playerManager.handleJoinLobbyWithCode(gameCode);
                
            } catch (error) {
                console.error('Failed to join game:', error);
                if (error.code === 'LOBBY_FULL') {
                    showNotification(t('ERRORS.LOBBY_FULL'), 'error');
                } else if (error.code === 'INVALID_LOBBY') {
                    showNotification(t('ERRORS.INVALID_LOBBY'), 'error');
                } else {
                    showNotification(t('ERRORS.FAILED_TO_JOIN_GAME') + ': ' + error.message, 'error');
                }
            }
        });
    }
}

/**
 * Handles direct lobby creation without question set selection
 */
async function handleDirectLobbyCreation() {
    try {
        // Get current user data for character information
        let currentUser = await appState.modules.storage.getCurrentUser();
        console.log('Current user data for direct lobby creation:', currentUser);
        
        if (!currentUser) {
            showNotification(t('ERRORS.PLEASE_LOGIN_FIRST'), 'error');
            return;
        }
        
        // If character is missing, try to refresh user data from API
        if (!currentUser.character) {
            console.warn('User character is missing for direct lobby creation, attempting to refresh user data...');
            try {
                // Force refresh from API
                const refreshedUser = await apiClient.getCurrentUser();
                console.log('Refreshed user data for direct lobby creation:', refreshedUser);
                
                if (refreshedUser && refreshedUser.character) {
                    currentUser = refreshedUser;
                    // Update localStorage with fresh data
                    appState.modules.storage.saveData('learn2play_current_user', {
                        ...refreshedUser,
                        lastLogin: new Date().toISOString()
                    });
                } else {
                    console.error('Refreshed user data still missing character for direct lobby creation:', refreshedUser);
                    showNotification(t('ERRORS.NO_CHARACTER'), 'error');
                    return;
                }
            } catch (refreshError) {
                console.error('Failed to refresh user data for direct lobby creation:', refreshError);
                showNotification(t('ERRORS.CONNECTION_ERROR'), 'error');
                return;
            }
        }
        
        if (!currentUser.character) {
            console.error('User character is still missing after refresh for direct lobby creation:', currentUser);
            showNotification(t('ERRORS.NO_CHARACTER'), 'error');
            return;
        }
        
        console.log('Creating lobby directly without question set...');
        
        // Create lobby without question set (will be selected later in lobby)
        const lobbyData = await appState.modules.lobbyManager.createLobby(
            {
                username: currentUser.username,
                character: currentUser.character
            },
            null // No question set initially
        );
        
        console.log('Lobby created successfully:', lobbyData);

        if (lobbyData) {
            // Notify playerManager about the new lobby and current player
            if (appState.modules.playerManager) {
                if (typeof appState.modules.playerManager.setCurrentPlayer === 'function') {
                    console.log('Setting current player in playerManager:', currentUser);
                    appState.modules.playerManager.setCurrentPlayer(currentUser);
                }
                
                if (typeof appState.modules.playerManager.setCurrentLobby === 'function') {
                    console.log('Setting current lobby in playerManager:', lobbyData);
                    appState.modules.playerManager.setCurrentLobby(lobbyData);
                }
            }
            
            // Dispatch custom event for lobby creation
            const lobbyCreatedEvent = new CustomEvent('lobbyCreated', {
                detail: { 
                    lobby: lobbyData,
                    isHost: true,
                    player: currentUser
                }
            });
            window.dispatchEvent(lobbyCreatedEvent);
            
            // Show lobby screen
            appState.modules.screenManager.showScreen(SCREENS.LOBBY);
            
            showNotification(t('SUCCESS.GAME_CREATED'), 'success');
        }
        
    } catch (error) {
        console.error('Failed to create lobby directly:', error);
        if (error.code === 'MISSING_CHARACTER') {
            showNotification(t('ERRORS.NO_CHARACTER'), 'error');
        } else {
            showNotification(t('ERRORS.FAILED_TO_CREATE_GAME') + ': ' + error.message, 'error');
        }
    }
}

/**
 * Refreshes the list of active lobbies
 */
async function refreshActiveLobbies() {
    const activeLobbiesList = document.getElementById('active-lobbies-list');
    const activeLobbiesListOriginal = document.getElementById('active-lobbies-list-original');
    
    // Handle both join game screen lists
    const targetLists = [activeLobbiesList, activeLobbiesListOriginal].filter(list => list !== null);
    if (targetLists.length === 0) return;

    try {
        const lobbies = await appState.modules.lobbyManager.getAllLobbies();
        
        const lobbyHTML = lobbies.length === 0 
            ? '<div class="no-lobbies">' + t('STATUS.NO_ACTIVE_GAMES_FOUND') + '</div>'
            : lobbies.map(lobby => `
            <div class="lobby-item" data-code="${lobby.code}">
                <div class="lobby-info">
                    <div class="lobby-code">${lobby.code}</div>
                    <div class="lobby-host">${t('JOIN_GAME.HOST')}: ${lobby.host}</div>
                    <div class="lobby-players">${t('JOIN_GAME.PLAYERS')}: ${lobby.players.length}/${lobby.maxPlayers}</div>
                </div>
                <button class="join-btn" data-code="${lobby.code}">${t('JOIN_GAME.JOIN')}</button>
            </div>
        `).join('');

        // Update all target lists
        targetLists.forEach(list => {
            list.innerHTML = lobbyHTML;
        });

        // Add click handlers for join buttons in all target lists
        targetLists.forEach(list => {
            list.querySelectorAll('.join-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const gameCode = btn.dataset.code;
                try {
                    // Get current user data for character information
                    let currentUser = await appState.modules.storage.getCurrentUser();
                    console.log('Current user data for active lobby join:', currentUser);
                    
                    if (!currentUser) {
                        throw new Error('No user data found. Please log in again.');
                    }
                    
                    // If character is missing, try to refresh user data from API
                    if (!currentUser.character) {
                        console.warn('User character is missing for active lobby join, attempting to refresh user data...');
                        try {
                            // Force refresh from API
                            const refreshedUser = await apiClient.getCurrentUser();
                            console.log('Refreshed user data for active lobby join:', refreshedUser);
                            
                            if (refreshedUser && refreshedUser.character) {
                                currentUser = refreshedUser;
                                // Update localStorage with fresh data
                                appState.modules.storage.saveData('learn2play_current_user', {
                                    ...refreshedUser,
                                    lastLogin: new Date().toISOString()
                                });
                            } else {
                                console.error('Refreshed user data still missing character for active lobby join:', refreshedUser);
                                throw new Error('User character information not found. Please log in again or update your profile.');
                            }
                        } catch (refreshError) {
                            console.error('Failed to refresh user data for active lobby join:', refreshError);
                            throw new Error('Unable to load user information. Please log in again.');
                        }
                    }
                    
                    if (!currentUser.character) {
                        console.error('User character is still missing after refresh for active lobby join:', currentUser);
                        throw new Error('User character information not found. Please log in again or update your profile.');
                    }
                    
                    const playerData = {
                        character: currentUser.character,
                        username: currentUser.username
                    };
                    
                    console.log('Joining active lobby with player data:', playerData);
                    const lobbyData = await appState.modules.lobbyManager.joinLobby(gameCode, playerData);
                    if (lobbyData) {
                        // Update player manager state with the joined lobby
                        appState.modules.playerManager.setCurrentLobby(lobbyData);
                        appState.modules.playerManager.setCurrentPlayer(currentUser);
                        appState.modules.screenManager.showScreen(SCREENS.LOBBY);
                    }
                } catch (error) {
                    console.error('Failed to join game:', error);
                    if (error.code === 'LOBBY_FULL') {
                        showNotification(t('ERRORS.LOBBY_FULL'), 'error');
                    } else if (error.code === 'INVALID_LOBBY') {
                        showNotification(t('ERRORS.INVALID_LOBBY'), 'error');
                    } else {
                        showNotification(t('ERRORS.FAILED_TO_JOIN_GAME') + ': ' + error.message, 'error');
                    }
                }
            });
            });
        });
    } catch (error) {
        console.error('Failed to refresh active lobbies:', error);
        targetLists.forEach(list => {
            list.innerHTML = '<div class="error">' + t('STATUS.FAILED_TO_LOAD_ACTIVE_GAMES') + '</div>';
        });
        showNotification(t('ERRORS.FAILED_TO_JOIN_GAME') + ': ' + error.message, 'error');
    }
}

/**
 * Shows the Hall of Fame
 */
async function showHallOfFame() {
    try {
        console.log('Opening Hall of Fame...');
        appState.modules.screenManager.showScreen(SCREENS.HALL_OF_FAME);
        
        // Refresh the Hall of Fame data when showing the screen
        if (appState.modules.hallOfFameUI && appState.modules.hallOfFameUI.refresh) {
            await appState.modules.hallOfFameUI.refresh();
        }
    } catch (error) {
        console.error('Failed to show Hall of Fame:', error);
    }
}

/**
 * Shows the help modal
 */
function showHelp() {
    try {
        console.log('Opening help system...');
        
        if (appState.modules.helpSystem && appState.modules.helpSystem.showHelp) {
            appState.modules.helpSystem.showHelp();
        } else {
            console.error('Help system not available');
            if (error.message.includes('Help system is not available')) {
                showNotification(t('ERRORS.HELP_NOT_AVAILABLE'), 'error');
            } else {
                showNotification(t('ERRORS.FAILED_TO_OPEN_HELP') + ': ' + error.message, 'error');
            }
        }
        
    } catch (error) {
        console.error('Failed to show help:', error);
        showNotification(t('ERRORS.FAILED_TO_OPEN_HELP') + ': ' + error.message, 'error');
    }
}



/**
 * Sets up global error handlers
 */
function setupErrorHandlers() {
    // Handle API authentication errors globally
    document.addEventListener('apiAuthError', (event) => {
        console.warn('API authentication error detected:', event.detail);
        handleLogout();
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Check if it's an authentication error
        if (event.reason && event.reason.message && 
            (event.reason.message.includes('token') || 
             event.reason.message.includes('authentication') ||
             event.reason.message.includes('401') ||
             event.reason.message.includes('403'))) {
            
            console.log('Authentication error detected, logging out...');
            handleLogout();
        }
    });
    
    // Handle general errors
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
    });
}

/**
 * Setup audio interaction handler to start background music on first user interaction
 */
function setupAudioInteractionHandler() {
    let audioStarted = false;
    
    const startAudio = async () => {
        if (audioStarted || !appState.modules.audioManager) return;
        
        try {
            await appState.modules.audioManager.playBackgroundMusic();
            console.log('Background music started after user interaction');
            audioStarted = true;
            
            // Remove event listeners after audio starts
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
            document.removeEventListener('touchstart', startAudio);
        } catch (error) {
            console.warn('Failed to start background music after user interaction:', error);
        }
    };
    
    // Listen for any user interaction to start audio
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
    document.addEventListener('touchstart', startAudio);
}

/**
 * Gets the current application state
 * @returns {Object} - Application state
 */
function getAppState() {
    return appState;
}

/**
 * Gets a specific module from the app state
 * @param {string} moduleName - Name of the module to get
 * @returns {Object|null} - Module instance or null
 */
function getModule(moduleName) {
    return appState.modules[moduleName] || null;
}

// Expose functions globally for other modules
window.getAppState = getAppState;
window.getModule = getModule;

/**
 * Sets up navigation handlers for the results screen
 */
function setupResultsNavigationHandlers() {
    // Listen for showHallOfFame event from results screen
    document.addEventListener('showHallOfFame', async () => {
        try {
            console.log('Hall of Fame clicked from results screen');
            
            // Show hall of fame screen
            await showHallOfFame();
            
        } catch (error) {
            console.error('Failed to show hall of fame:', error);
            showNotification(t('ERRORS.FAILED_TO_SHOW_HALL_OF_FAME') + ': ' + error.message, 'error');
        }
    });
    
    // Listen for backToMenu event from results screen
    document.addEventListener('backToMenu', () => {
        console.log('Back to Menu clicked from results screen');
        appState.modules.screenManager.showScreen(SCREENS.MAIN_MENU);
    });
    
    // Listen for returnToLobby event from results screen (host only)
    document.addEventListener('returnToLobby', (event) => {
        console.log('Return to Lobby clicked from results screen');
        const { lobbyCode, lobbyData } = event.detail;
        
        if (lobbyData) {
            // Update player manager with the returned lobby data
            appState.modules.playerManager.setCurrentLobby(lobbyData);
            appState.modules.screenManager.showScreen(SCREENS.LOBBY);
            
            // Show notification that host has returned
            if (appState.modules.notifications) {
                appState.modules.notifications.showToast('Returned to lobby successfully!', 'success');
            }
        }
    });
    
    // Listen for rejoinLobby event from results screen (other players)
    document.addEventListener('rejoinLobby', (event) => {
        console.log('Rejoin Lobby clicked from results screen');
        const { lobbyCode, lobbyData } = event.detail;
        
        if (lobbyData) {
            // Update player manager with the rejoined lobby data
            appState.modules.playerManager.setCurrentLobby(lobbyData);
            appState.modules.screenManager.showScreen(SCREENS.LOBBY);
            
            // Show notification that player has rejoined
            if (appState.modules.notifications) {
                appState.modules.notifications.showToast('Rejoined lobby successfully!', 'success');
            }
        }
    });
}