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
import { SCREENS } from '/js/utils/constants.js';
import apiClient from '/js/api/apiClient.js';
import { questionSetsApi } from '/js/api/questionSetsApi.js';

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
    console.log('DOM loaded, starting Quiz Meister application...');
    
    try {
        // Show loading screen first
        console.log('Showing loading screen...');
        showLoadingScreen();
        
        console.log('Starting app initialization...');
        // Initialize core modules
        await initializeApp();
        console.log('App initialization completed successfully');
        
        console.log('Starting authentication check...');
        // Check authentication and show appropriate screen
        await handleInitialAuth();
        console.log('Authentication check completed successfully');
        
        console.log('Quiz Meister initialized successfully');
        
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
                    <h1>Quiz Meister</h1>
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
            <h1>Quiz Meister</h1>
            <div class="loading-spinner"></div>
            <p>Initializing application...</p>
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
            <h1>Quiz Meister</h1>
            <div style="color: var(--error); margin: 2rem 0;">
                <h2>Initialization Failed</h2>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 1rem;">
                    Retry
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
        
        updateLoadingStep('Initializing storage...');
        console.log('initializeApp: Initializing storage module...');
        
        // Initialize storage module
        appState.modules.storage = initStorage();
        console.log('initializeApp: Storage module initialized successfully');
        
        updateLoadingStep('Initializing screen manager...');
        console.log('initializeApp: Initializing screen manager...');
        
        // Initialize screen manager
        appState.modules.screenManager = initScreenManager();
        console.log('initializeApp: Screen manager initialized successfully');
        
        updateLoadingStep('Initializing authentication...');
        console.log('initializeApp: Initializing authentication module...');
        
        // Initialize authentication module
        appState.modules.auth = initAuth(
            appState.modules.storage, 
            appState.modules.screenManager
        );
        console.log('initializeApp: Authentication module initialized successfully');
        
        updateLoadingStep('Initializing lobby system...');
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
        
        updateLoadingStep('Initializing Hall of Fame...');
        console.log('initializeApp: Initializing Hall of Fame UI...');
        
        // Initialize Hall of Fame UI
        appState.modules.hallOfFameUI = initHallOfFameUI();
        console.log('initializeApp: Hall of Fame UI initialized successfully');
        
        updateLoadingStep('Initializing question set manager...');
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
            appState.modules.storage
        );
        console.log('initializeApp: Question set selector initialized successfully');
        
        console.log('initializeApp: Initializing question set uploader...');
        // Initialize Question Set Uploader
        appState.modules.questionSetUploader = initQuestionSetUploader(
            questionSetsApi,
            appState.modules.screenManager
        );
        console.log('initializeApp: Question set uploader initialized successfully');
        
        updateLoadingStep('Initializing audio system...');
        console.log('initializeApp: Initializing audio manager...');
        
        // Initialize Audio Manager globally
        appState.modules.audioManager = initAudioManager();
        console.log('initializeApp: Audio manager initialized successfully');
        
        console.log('initializeApp: Starting audio initialization...');
        // Initialize audio system (non-blocking)
        try {
            await appState.modules.audioManager.initialize();
            console.log('initializeApp: Audio manager initialize() completed');
            
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
        
        updateLoadingStep('Initializing game controller...');
        console.log('initializeApp: Initializing game controller...');
        
        // Initialize Game Controller
        appState.modules.gameController = initGameController(
            appState.modules.lobbyManager,
            appState.modules.storage,
            appState.modules.screenManager
        );
        console.log('initializeApp: Game controller initialized successfully');
        
        updateLoadingStep('Setting up event handlers...');
        console.log('initializeApp: Setting up main menu handlers...');
        
        // Setup main menu event handlers
        setupMainMenuHandlers();
        console.log('initializeApp: Main menu handlers set up successfully');
        
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
        updateLoadingStep('Checking storage mode...');
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
        updateLoadingStep('Checking authentication...');
        console.log('handleInitialAuth: Multiplayer mode, checking authentication...');
        
        // Check if user has a valid token
        const token = apiClient.getToken();
        console.log('handleInitialAuth: Token exists:', !!token);
        
        if (token) {
            updateLoadingStep('Verifying credentials...');
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
    const settingsBtn = document.getElementById('settings-btn');

    // Add click handlers
    if (createGameBtn) {
        createGameBtn.addEventListener('click', async () => {
            // Create lobby directly without question set selection
            try {
                // Get current user data for character information
                let currentUser = await appState.modules.storage.getCurrentUser();
                console.log('Current user data for lobby creation:', currentUser);
                
                if (!currentUser) {
                    throw new Error('No user data found. Please log in again.');
                }
                
                // If character is missing, try to refresh user data from API
                if (!currentUser.character) {
                    console.warn('User character is missing, attempting to refresh user data...');
                    try {
                        // Force refresh from API
                        const refreshedUser = await apiClient.getCurrentUser();
                        console.log('Refreshed user data:', refreshedUser);
                        
                        if (refreshedUser && refreshedUser.character) {
                            currentUser = refreshedUser;
                            // Update localStorage with fresh data
                            appState.modules.storage.saveData('quiz_meister_current_user', {
                                ...refreshedUser,
                                lastLogin: new Date().toISOString()
                            });
                        } else {
                            console.error('Refreshed user data still missing character:', refreshedUser);
                            throw new Error('User character information not found. Please log in again or update your profile.');
                        }
                    } catch (refreshError) {
                        console.error('Failed to refresh user data:', refreshError);
                        throw new Error('Unable to load user information. Please log in again.');
                    }
                }
                
                if (!currentUser.character) {
                    console.error('User character is still missing after refresh:', currentUser);
                    throw new Error('User character information not found. Please log in again or update your profile.');
                }
                
                // Create lobby without question set (will be selected inside lobby)
                await appState.modules.playerManager.handleCreateLobby();
                
            } catch (error) {
                console.error('Failed to create game:', error);
                alert('Failed to create game: ' + error.message);
            }
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
    

    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettings);
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

    // Setup join game form
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
                            appState.modules.storage.saveData('quiz_meister_current_user', {
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
                alert('Failed to join game: ' + error.message);
            }
        });
    }
}

/**
 * Refreshes the list of active lobbies
 */
async function refreshActiveLobbies() {
    const activeLobbiesList = document.getElementById('active-lobbies-list');
    if (!activeLobbiesList) return;

    try {
        const lobbies = await appState.modules.lobbyManager.getAllLobbies();
        activeLobbiesList.innerHTML = '';

        if (lobbies.length === 0) {
            activeLobbiesList.innerHTML = '<div class="no-lobbies">No active games found</div>';
            return;
        }

        lobbies.forEach(lobby => {
            const lobbyItem = document.createElement('div');
            lobbyItem.className = 'lobby-item';
            const playerCount = lobby.players ? lobby.players.length : 0;
            lobbyItem.innerHTML = `
                <div class="lobby-info">
                    <div class="lobby-code">${lobby.code}</div>
                    <div class="lobby-host">Host: ${lobby.host}</div>
                    <div class="lobby-players">Players: ${playerCount}/8</div>
                </div>
                <button class="join-btn" data-code="${lobby.code}">Join</button>
            `;
            activeLobbiesList.appendChild(lobbyItem);
        });

        // Add click handlers for join buttons
        activeLobbiesList.querySelectorAll('.join-btn').forEach(btn => {
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
                                appState.modules.storage.saveData('quiz_meister_current_user', {
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
                    alert('Failed to join game: ' + error.message);
                }
            });
        });
    } catch (error) {
        console.error('Failed to refresh active lobbies:', error);
        activeLobbiesList.innerHTML = '<div class="error">Failed to load active games</div>';
    }
}

/**
 * Shows the Hall of Fame
 */
async function showHallOfFame() {
    try {
        console.log('Opening Hall of Fame...');
        appState.modules.screenManager.showScreen(SCREENS.HALL_OF_FAME);
        
        // Add back button handler
        const backBtn = document.getElementById('back-from-hof');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                appState.modules.screenManager.showScreen(SCREENS.MAIN_MENU);
            });
        }
    } catch (error) {
        console.error('Failed to show Hall of Fame:', error);
    }
}



/**
 * Shows user settings
 */
function showSettings() {
    // TODO: Implement settings modal
    console.log('Settings not implemented yet');
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