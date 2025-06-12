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
    try {
        console.log('Starting Quiz Meister application...');
        
        // Show loading screen first
        showLoadingScreen();
        
        // Initialize core modules
        await initializeApp();
        
        // Check authentication and show appropriate screen
        await handleInitialAuth();
        
        console.log('Quiz Meister initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showErrorScreen(error.message);
    }
});

/**
 * Shows the loading screen with initialization status
 */
function showLoadingScreen() {
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
        updateLoadingStep('Initializing storage...');
        
        // Initialize storage module
        appState.modules.storage = initStorage();
        
        updateLoadingStep('Initializing screen manager...');
        
        // Initialize screen manager
        appState.modules.screenManager = initScreenManager();
        
        updateLoadingStep('Initializing authentication...');
        
        // Initialize authentication module
        appState.modules.auth = initAuth(
            appState.modules.storage, 
            appState.modules.screenManager
        );
        
        updateLoadingStep('Initializing lobby system...');
        
        // Initialize lobby manager
        appState.modules.lobbyManager = initLobbyManager(
            appState.modules.storage, 
            appState.modules.screenManager
        );
        
        // Initialize player manager
        appState.modules.playerManager = initPlayerManager(
            appState.modules.lobbyManager, 
            appState.modules.storage, 
            appState.modules.screenManager
        );
        
        updateLoadingStep('Initializing Hall of Fame...');
        
        // Initialize Hall of Fame UI
        appState.modules.hallOfFameUI = initHallOfFameUI();
        
        updateLoadingStep('Initializing question set manager...');
        
        // Initialize Question Set Manager
        appState.modules.questionSetManager = initQuestionSetManager();
        
        // Initialize Question Set Selector
        appState.modules.questionSetSelector = initQuestionSetSelector(
            questionSetsApi,
            appState.modules.screenManager,
            appState.modules.lobbyManager,
            appState.modules.storage
        );
        
        // Initialize Question Set Uploader
        appState.modules.questionSetUploader = initQuestionSetUploader(
            questionSetsApi,
            appState.modules.screenManager
        );
        
        updateLoadingStep('Initializing game controller...');
        
        // Initialize Game Controller
        appState.modules.gameController = initGameController(
            appState.modules.lobbyManager,
            appState.modules.storage,
            appState.modules.screenManager
        );
        
        // Initialize the game controller
        appState.modules.gameController.init();
        
        // Initialize the new modules
        appState.modules.questionSetSelector.init();
        appState.modules.questionSetUploader.init();
        
        // Setup main menu event handlers
        setupMainMenuHandlers();
        
        // Setup global error handlers
        setupErrorHandlers();
        
        // Initialize button click sounds when audio manager becomes available
        setTimeout(() => {
            if (window.audioManager) {
                window.audioManager.addButtonClickSounds();
                console.log('Button click sounds initialized');
            }
        }, 1000);
        
        appState.isInitialized = true;
        
    } catch (error) {
        console.error('Module initialization failed:', error);
        throw new Error(`Failed to initialize modules: ${error.message}`);
    }
}

/**
 * Handles initial authentication check
 */
async function handleInitialAuth() {
    try {
        updateLoadingStep('Checking storage mode...');
        
        // Check current storage mode
        const currentMode = appState.modules.storage.getStorageMode();
        console.log('Current storage mode:', currentMode);
        
        if (currentMode === STORAGE_MODES.SINGLEPLAYER) {
            // Single-player mode: skip authentication, go directly to main menu
            console.log('Single-player mode: skipping authentication');
            appState.modules.screenManager.showScreen(SCREENS.MAIN_MENU);
            return;
        }
        
        // Multiplayer mode: check authentication
        updateLoadingStep('Checking authentication...');
        
        // Check if user has a valid token
        const token = apiClient.getToken();
        
        if (token) {
            updateLoadingStep('Verifying credentials...');
            
            try {
                // Verify token with server
                appState.currentUser = await apiClient.getCurrentUser();
                
                if (appState.currentUser) {
                    console.log('User authenticated:', appState.currentUser.username);
                    
                    // Update storage with current user
                    appState.modules.storage.setCurrentUser(appState.currentUser);
                    
                    // Check for saved game/lobby state
                    await handleStateRecovery();
                    
                    // Show main menu
                    appState.modules.screenManager.showScreen(SCREENS.MAIN_MENU);
                    return;
                }
            } catch (authError) {
                console.log('Token verification failed, clearing auth:', authError.message);
                // Clear invalid token
                apiClient.logout();
            }
        }
        
        // No valid authentication, show auth screen
        console.log('No valid authentication found, showing login screen');
        appState.modules.auth.ensureInitialized();
        appState.modules.screenManager.showScreen(SCREENS.AUTH);
        
    } catch (error) {
        console.error('Authentication check failed:', error);
        // Fallback to auth screen
        appState.modules.auth.ensureInitialized();
        appState.modules.screenManager.showScreen(SCREENS.AUTH);
    } finally {
        // Hide loading screen
        appState.modules.screenManager.hideScreen(SCREENS.LOADING);
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
    
    // Upload questions button
    const uploadQuestionsBtn = document.getElementById('upload-questions-btn');
    if (uploadQuestionsBtn) {
        uploadQuestionsBtn.addEventListener('click', () => {
            if (appState.modules.questionSetUploader) {
                appState.modules.questionSetUploader.showUploadScreen();
            } else {
                appState.modules.screenManager.showScreen(SCREENS.UPLOAD_QUESTIONS);
            }
        });
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
 * Shows the Upload Questions modal
 */
async function showUploadQuestions() {
    try {
        console.log('Opening Upload Questions...');
        
        // Use the question set manager to show the modal directly on the upload tab
        if (appState.modules.questionSetManager) {
            appState.modules.questionSetManager.showQuestionSetModal('upload');
        } else {
            console.error('Question set manager not initialized');
        }
    } catch (error) {
        console.error('Failed to show Upload Questions:', error);
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