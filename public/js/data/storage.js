// public/js/data/storage.js - Hybrid Storage Module
/**
 * Storage Module - Supports both Single-player and Multiplayer modes
 * Handles local storage operations and API integration based on mode
 */

import apiClient from '../api/apiClient.js';

// Storage modes
export const STORAGE_MODES = {
    SINGLEPLAYER: 'singleplayer',
    MULTIPLAYER: 'multiplayer'
};

const STORAGE_KEYS = {
    USER_SETTINGS: 'quiz_user_settings',
    GAME_STATE: 'quiz_game_state',
    LOBBY_STATE: 'quiz_lobby_state',
    USERS: 'quiz_users',
    CURRENT_USER: 'quiz_current_user',
    HALL_OF_FAME: 'quiz_hall_of_fame',
    STORAGE_MODE: 'quiz_storage_mode'
};

export function initStorage(initialMode = STORAGE_MODES.MULTIPLAYER) {
    let currentMode = localStorage.getItem(STORAGE_KEYS.STORAGE_MODE) || initialMode;
    
    /**
     * Sets the storage mode (singleplayer or multiplayer)
     * @param {string} mode - Storage mode
     */
    function setStorageMode(mode) {
        if (!Object.values(STORAGE_MODES).includes(mode)) {
            throw new Error(`Invalid storage mode: ${mode}`);
        }
        currentMode = mode;
        localStorage.setItem(STORAGE_KEYS.STORAGE_MODE, mode);
        console.log(`Storage mode set to: ${mode}`);
    }

    /**
     * Gets the current storage mode
     * @returns {string} - Current storage mode
     */
    function getStorageMode() {
        return currentMode;
    }

    /**
     * Checks if currently in multiplayer mode
     * @returns {boolean} - True if in multiplayer mode
     */
    function isMultiplayer() {
        return currentMode === STORAGE_MODES.MULTIPLAYER;
    }

    /**
     * Saves data to local storage
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     */
    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save data:', error);
            throw new Error('Storage operation failed');
        }
    }

    /**
     * Retrieves data from local storage
     * @param {string} key - Storage key
     * @returns {any} - Stored data or null
     */
    function getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to retrieve data:', error);
            throw new Error('Storage operation failed');
        }
    }

    // ====== USER MANAGEMENT ======

    /**
     * Gets all registered users
     * @returns {Array|Promise<Array>} - Array of users
     */
    function getUsers() {
        if (isMultiplayer()) {
            console.warn('getUsers() not available in multiplayer mode - users are managed server-side');
            return [];
        }
        return getData(STORAGE_KEYS.USERS) || [];
    }

    /**
     * Saves a new user
     * @param {Object} user - User object
     * @returns {Promise<Object>|Object} - Saved user
     */
    async function saveUser(user) {
        if (isMultiplayer()) {
            // In multiplayer mode, use API registration
            return await apiClient.register(user.username, user.password, user.character);
        }
        
        // Single-player mode: save to local storage
        const users = getUsers();
        const existingIndex = users.findIndex(u => u.username === user.username);
        
        if (existingIndex >= 0) {
            users[existingIndex] = user;
        } else {
            users.push(user);
        }
        
        saveData(STORAGE_KEYS.USERS, users);
        return user;
    }

    /**
     * Gets a user by username
     * @param {string} username - Username to search for
     * @returns {Object|null} - User object or null
     */
    function getUser(username) {
        if (isMultiplayer()) {
            console.warn('getUser() not available in multiplayer mode - use authentication instead');
            return null;
        }
        
        const users = getUsers();
        return users.find(u => u.username === username) || null;
    }

    /**
     * Updates user data
     * @param {string} username - Username to update
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>|Object} - Updated user
     */
    async function updateUser(username, updates) {
        if (isMultiplayer()) {
            throw new Error('User updates in multiplayer mode are handled by the API');
        }
        
        const users = getUsers();
        const userIndex = users.findIndex(u => u.username === username);
        
        if (userIndex >= 0) {
            users[userIndex] = { ...users[userIndex], ...updates };
            saveData(STORAGE_KEYS.USERS, users);
            return users[userIndex];
        } else {
            throw new Error('User not found');
        }
    }

    /**
     * Sets the current logged-in user
     * @param {Object} user - User object
     */
    function setCurrentUser(user) {
        saveData(STORAGE_KEYS.CURRENT_USER, {
            ...user,
            lastLogin: new Date().toISOString()
        });
    }

    // Cache for current user to avoid redundant API calls
    let currentUserCache = null;
    let currentUserCacheTime = 0;
    const USER_CACHE_DURATION = 60000; // 1 minute cache

    /**
     * Gets the current logged-in user
     * @returns {Object|Promise<Object>|null} - Current user or null
     */
    async function getCurrentUser() {
        if (isMultiplayer()) {
            // Check cache first to avoid redundant API calls
            const now = Date.now();
            if (currentUserCache && (now - currentUserCacheTime) < USER_CACHE_DURATION) {
                console.log('Storage.getCurrentUser: Returning cached user data');
                return currentUserCache;
            }
            
            try {
                console.log('Storage.getCurrentUser: Fetching user from API...');
                const user = await apiClient.getCurrentUser();
                console.log('Storage.getCurrentUser: API response:', user);
                
                if (user) {
                    // Update local storage with latest user data for UI purposes
                    const userData = {
                        ...user,
                        lastLogin: new Date().toISOString()
                    };
                    saveData(STORAGE_KEYS.CURRENT_USER, userData);
                    
                    // Cache the user data
                    currentUserCache = userData;
                    currentUserCacheTime = now;
                    
                    return userData;
                }
                
                // If API call failed or returned null, try local storage as fallback
                console.log('Storage.getCurrentUser: API returned null, trying local storage...');
                const localUser = getData(STORAGE_KEYS.CURRENT_USER);
                console.log('Storage.getCurrentUser: Local fallback user:', localUser);
                
                // Cache the local user data for consistency
                if (localUser) {
                    currentUserCache = localUser;
                    currentUserCacheTime = now;
                }
                
                return localUser;
                
            } catch (error) {
                console.error('Failed to get current user from API:', error);
                
                // Try local storage as fallback
                console.log('Storage.getCurrentUser: API failed, trying local storage fallback...');
                const localUser = getData(STORAGE_KEYS.CURRENT_USER);
                console.log('Storage.getCurrentUser: Local fallback user:', localUser);
                
                if (!localUser) {
                    // Clear local user data on error if no fallback available
                    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                    currentUserCache = null;
                    currentUserCacheTime = 0;
                } else {
                    // Cache the local user data
                    currentUserCache = localUser;
                    currentUserCacheTime = now;
                }
                
                return localUser;
            }
        }
        
        // Single-player mode: get from local storage
        const localUser = getData(STORAGE_KEYS.CURRENT_USER);
        console.log('Storage.getCurrentUser: Local user data:', localUser);
        return localUser;
    }

    /**
     * Clears the current logged-in user
     */
    function clearCurrentUser() {
        if (isMultiplayer()) {
            apiClient.logout();
        }
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        // Clear cache as well
        currentUserCache = null;
        currentUserCacheTime = 0;
    }

    // ====== HALL OF FAME ======

    /**
     * Gets the hall of fame entries
     * @param {Object} options - Query options
     * @returns {Array|Promise<Array>} - Hall of fame entries
     */
    async function getHallOfFame(options = {}) {
        if (isMultiplayer()) {
            try {
                return await apiClient.getHallOfFame(options.catalogName, options.limit);
            } catch (error) {
                console.error('Failed to get hall of fame from API:', error);
                return [];
            }
        }
        
        // Single-player mode: get from local storage
        const hallOfFame = getData(STORAGE_KEYS.HALL_OF_FAME) || [];
        
        // Filter by catalog if specified
        let filtered = hallOfFame;
        if (options.catalogName) {
            filtered = hallOfFame.filter(entry => entry.catalogName === options.catalogName);
        }
        
        // Sort by score (descending)
        filtered.sort((a, b) => b.score - a.score);
        
        // Limit results if specified
        if (options.limit) {
            filtered = filtered.slice(0, options.limit);
        }
        
        return filtered;
    }

    /**
     * Adds a new hall of fame entry
     * @param {Object} entry - Score entry
     * @returns {Object|Promise<Object>} - Added entry
     */
    async function addHallOfFameEntry(entry) {
        if (isMultiplayer()) {
            try {
                return await apiClient.addHallOfFameEntry(entry);
            } catch (error) {
                console.error('Failed to add hall of fame entry to API:', error);
                throw new Error('Failed to save score');
            }
        }
        
        // Single-player mode: save to local storage
        const hallOfFame = getData(STORAGE_KEYS.HALL_OF_FAME) || [];
        
        const newEntry = {
            ...entry,
            timestamp: new Date().toISOString(),
            id: Date.now().toString() // Simple ID generation
        };
        
        hallOfFame.push(newEntry);
        saveData(STORAGE_KEYS.HALL_OF_FAME, hallOfFame);
        
        return newEntry;
    }

    // ====== LOBBY MANAGEMENT ======

    /**
     * Creates a new lobby
     * @param {Object} host - Host player object
     * @returns {Object|Promise<Object>} - Created lobby
     */
    async function createLobby(host) {
        if (isMultiplayer()) {
            return await apiClient.createLobby(host);
        }
        
        // Single-player mode: create local lobby
        const lobby = {
            code: Math.random().toString(36).substring(2, 6).toUpperCase(),
            host: host.username,
            players: [host],
            gameStarted: false,
            createdAt: new Date().toISOString()
        };
        
        saveLobbyState(lobby);
        return lobby;
    }

    /**
     * Joins an existing lobby
     * @param {string} code - Lobby code
     * @param {Object} player - Player object
     * @returns {Object|Promise<Object>} - Updated lobby
     */
    async function joinLobby(code, player) {
        if (isMultiplayer()) {
            return await apiClient.joinLobby(code, player);
        }
        
        // Single-player mode: not applicable (can't join other's lobbies)
        throw new Error('Cannot join lobbies in single-player mode');
    }

    /**
     * Leaves a lobby
     * @param {string} code - Lobby code
     * @param {string} username - Username leaving
     * @returns {Object|Promise<Object>} - Updated lobby
     */
    async function leaveLobby(code, username) {
        if (isMultiplayer()) {
            return await apiClient.leaveLobby(code, username);
        }
        
        // Single-player mode: clear local lobby
        clearLobbyState();
        return null;
    }

    /**
     * Gets a specific lobby
     * @param {string} code - Lobby code
     * @returns {Object|Promise<Object>|null} - Lobby object or null
     */
    async function getLobby(code) {
        if (isMultiplayer()) {
            return await apiClient.getLobby(code);
        }
        
        // Single-player mode: get local lobby
        const lobby = getLobbyState();
        return (lobby && lobby.code === code) ? lobby : null;
    }

    /**
     * Gets all available lobbies
     * @returns {Array|Promise<Array>} - Array of lobbies
     */
    async function getLobbies() {
        if (isMultiplayer()) {
            return await apiClient.getLobbies();
        }
        
        // Single-player mode: return local lobby if exists
        const lobby = getLobbyState();
        return lobby ? [lobby] : [];
    }

    // ====== GAME STATE ======

    /**
     * Saves game state
     * @param {Object} gameState - Current game state
     */
    async function saveGameState(gameState) {
        if (isMultiplayer() && gameState.lobbyCode) {
            try {
                // In multiplayer mode, save to server via lobby update
                await apiClient.updateLobby(gameState.lobbyCode, {
                    current_question: gameState.currentQuestion || 0,
                    game_phase: gameState.phase || 'waiting',
                    started: gameState.started || false
                });
                
                // Also cache locally for UI responsiveness
                saveData(STORAGE_KEYS.GAME_STATE, {
                    ...gameState,
                    timestamp: new Date().toISOString()
                });
                
                console.log('Game state saved to server and cached locally');
            } catch (error) {
                console.error('Failed to save game state to server:', error);
                // Fallback to local storage
                saveData(STORAGE_KEYS.GAME_STATE, {
                    ...gameState,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            // Single-player mode: save to local storage only
            saveData(STORAGE_KEYS.GAME_STATE, {
                ...gameState,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Gets saved game state
     * @returns {Object|Promise<Object>|null} - Saved game state or null
     */
    async function getGameState() {
        if (isMultiplayer()) {
            try {
                // In multiplayer mode, get from server
                const lobbyState = getLobbyState();
                if (lobbyState && lobbyState.code) {
                    const lobby = await apiClient.getLobby(lobbyState.code);
                    if (lobby) {
                        return {
                            lobbyCode: lobby.code,
                            currentQuestion: lobby.current_question || 0,
                            phase: lobby.game_phase || 'waiting',
                            started: lobby.started || false,
                            players: lobby.players || [],
                            questions: lobby.questions || [],
                            timestamp: new Date().toISOString()
                        };
                    }
                }
                return null;
            } catch (error) {
                console.error('Failed to get game state from server:', error);
                // Fallback to local storage
                return getLocalGameState();
            }
        } else {
            // Single-player mode: get from local storage
            return getLocalGameState();
        }
    }

    /**
     * Gets game state from local storage (helper function)
     * @returns {Object|null} - Local game state or null
     */
    function getLocalGameState() {
        const state = getData(STORAGE_KEYS.GAME_STATE);
        
        // Check if state is too old (more than 30 minutes)
        if (state && state.timestamp) {
            const stateAge = Date.now() - new Date(state.timestamp).getTime();
            if (stateAge > 30 * 60 * 1000) { // 30 minutes
                clearGameState();
                return null;
            }
        }
        
        return state;
    }

    /**
     * Clears saved game state
     */
    async function clearGameState() {
        // Always clear local storage
        localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
        
        if (isMultiplayer()) {
            try {
                // In multiplayer mode, also clear server state if we have a lobby
                const lobbyState = getLobbyState();
                if (lobbyState && lobbyState.code) {
                    await apiClient.updateLobby(lobbyState.code, {
                        current_question: 0,
                        game_phase: 'waiting',
                        started: false
                    });
                    console.log('Game state cleared on server');
                }
            } catch (error) {
                console.error('Failed to clear game state on server:', error);
                // Continue anyway - local state is cleared
            }
        }
    }

    // ====== LOBBY STATE (Always Local for UI) ======

    /**
     * Saves lobby state to local storage
     * @param {Object} lobbyState - Current lobby state
     */
    function saveLobbyState(lobbyState) {
        saveData(STORAGE_KEYS.LOBBY_STATE, {
            ...lobbyState,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Gets saved lobby state
     * @returns {Object|null} - Saved lobby state or null
     */
    function getLobbyState() {
        const state = getData(STORAGE_KEYS.LOBBY_STATE);
        
        // Check if state is too old (more than 10 minutes)
        if (state && state.timestamp) {
            const stateAge = Date.now() - new Date(state.timestamp).getTime();
            if (stateAge > 10 * 60 * 1000) { // 10 minutes
                clearLobbyState();
                return null;
            }
        }
        
        return state;
    }

    /**
     * Clears saved lobby state
     */
    function clearLobbyState() {
        localStorage.removeItem(STORAGE_KEYS.LOBBY_STATE);
    }

    // ====== USER SETTINGS (Always Local) ======

    /**
     * Saves user settings
     * @param {Object} settings - User settings
     */
    function saveUserSettings(settings) {
        saveData(STORAGE_KEYS.USER_SETTINGS, settings);
    }

    /**
     * Gets user settings
     * @returns {Object} - User settings
     */
    function getUserSettings() {
        return getData(STORAGE_KEYS.USER_SETTINGS) || {
            musicEnabled: true,
            soundEnabled: true,
            musicVolume: 0.3,
            soundVolume: 0.5
        };
    }

    return {
        // Mode management
        setStorageMode,
        getStorageMode,
        isMultiplayer,
        
        // User management methods
        getUsers,
        saveUser,
        getUser,
        updateUser,
        setCurrentUser,
        getCurrentUser,
        clearCurrentUser,
        
        // Hall of Fame methods
        getHallOfFame,
        addHallOfFameEntry,
        
        // Lobby management methods
        createLobby,
        joinLobby,
        leaveLobby,
        getLobby,
        getLobbies,
        
        // Game state methods
        saveGameState,
        getGameState,
        clearGameState,
        
        // Lobby state methods (always local for UI)
        saveLobbyState,
        getLobbyState,
        clearLobbyState,
        
        // User settings methods (always local)
        saveUserSettings,
        getUserSettings,
        
        // Generic storage methods
        saveData,
        getData
    };
}