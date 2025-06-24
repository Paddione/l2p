// Enhanced playerManager.js with improved state management and error handling
import { CSS_CLASSES, EVENTS, SCREENS, PERFORMANCE_SETTINGS } from '../utils/constants.js';
import apiClient from '../api/apiClient.js';
import { t, translateRaw } from '../utils/translations.js';

export function initPlayerManager(lobbyManager, storage, screenManager) {
    let currentLobby = null;
    let currentPlayer = null;
    let lobbyListInterval = null;
    let lobbyRefreshInterval = null; // New interval for refreshing current lobby

    /**
     * Initializes player manager
     */
    function init() {
        // Add event listeners for lobby updates
        window.addEventListener('lobby_updated', handleLobbyUpdate);
        
        // Add event listener for screen changes
        document.addEventListener('screenChanged', (event) => {
            if (event.detail.screenId === 'lobby-screen') {
                initializeLobbyScreen();
                startLobbyPolling(); // Start polling when entering lobby
            } else if (event.detail.screenId === 'game-screen') {
                // When entering game screen, stop lobby polling to let GameEngine handle it
                console.log('🎮 Entering game screen - stopping lobby polling');
                stopLobbyPolling();
            } else {
                stopLobbyPolling(); // Stop polling when leaving lobby
            }
        });
        
        // Add event listener for lobby creation
        document.addEventListener('lobbyCreated', handleLobbyCreated);
        
        // Get UI elements
        const leaveLobbyBtn = document.getElementById('leave-lobby');
        const startGameBtn = document.getElementById('start-game');
        const readyBtn = document.getElementById('ready-btn');

        // Add event listeners with better error handling
        if (leaveLobbyBtn) {
            leaveLobbyBtn.addEventListener('click', handleLeaveLobby);
        }

        if (startGameBtn) {
            startGameBtn.addEventListener('click', handleStartGame);
        }

        if (readyBtn) {
            readyBtn.addEventListener('click', handleReadyToggle);
        }

        // Question set selection button
        const selectQuestionSetBtn = document.getElementById('select-question-set-btn');
        if (selectQuestionSetBtn) {
            selectQuestionSetBtn.addEventListener('click', handleSelectQuestionSet);
        }

        // 👉 ADD START: Ensure question count controls work on first render
        const lobbyScreenInit = document.getElementById('lobby-screen');
        if (lobbyScreenInit) {
            const setQuestionCountBtnInit = lobbyScreenInit.querySelector('#set-question-count-btn');
            if (setQuestionCountBtnInit) {
                setQuestionCountBtnInit.addEventListener('click', handleSetQuestionCount);
            }

            const questionCountInputInit = lobbyScreenInit.querySelector('#question-count-input');
            if (questionCountInputInit) {
                questionCountInputInit.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleSetQuestionCount();
                    }
                });
            }
        }
        // 👉 ADD END

        // Handle join lobby form submission
        const joinLobbyModal = document.getElementById('join-lobby-modal');
        if (joinLobbyModal) {
            const form = joinLobbyModal.querySelector('form');
            if (form) {
                form.addEventListener('submit', handleJoinLobbyByCode);
            }
        }

        // Custom events
        document.addEventListener(EVENTS.PLAYER_JOINED, handlePlayerJoined);
        document.addEventListener(EVENTS.PLAYER_LEFT, handlePlayerLeft);
        document.addEventListener('questionSetSelected', handleQuestionSetSelected);
        document.addEventListener(EVENTS.GAME_ENDED, handleGameEnded);

        // Close modal button
        const closeModalBtn = document.querySelector('.close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', hideJoinLobbyModal);
        }

        // Close modal when clicking outside
        if (joinLobbyModal) {
            joinLobbyModal.addEventListener('click', (e) => {
                if (e.target === joinLobbyModal) {
                    hideJoinLobbyModal();
                }
            });
        }
    }

    /**
     * Ensures current player data is available
     * @returns {Promise<Object>} Current player data
     */
    async function ensureCurrentPlayer() {
        if (currentPlayer) {
            return currentPlayer;
        }

        try {
            // Try to get current user from storage
            const user = await storage.getCurrentUser();
            if (user) {
                currentPlayer = user;
                return user;
            }

            // If not found, try to get from API
            const apiUser = await apiClient.getCurrentUser();
            if (apiUser) {
                currentPlayer = apiUser;
                return apiUser;
            }

            throw new Error('No current user found');
        } catch (error) {
            console.error('Failed to ensure current player:', error);
            throw new Error('Unable to get current user information');
        }
    }

    /**
     * Ensures current lobby data is available
     * @returns {Promise<Object>} Current lobby data
     */
    async function ensureCurrentLobby() {
        // First check if we have a current lobby
        if (currentLobby && currentLobby.code) {
            try {
                // Refresh lobby data from server
                const freshLobby = await lobbyManager.getLobby(currentLobby.code);
                if (freshLobby) {
                    currentLobby = freshLobby;
                    return currentLobby;
                }
            } catch (error) {
                console.warn('Failed to refresh lobby data:', error);
                // Continue to fallback methods
            }
        }

        // Try to get lobby from storage as fallback
        const lobbyState = storage.getLobbyState();
        if (lobbyState && lobbyState.code) {
            try {
                const lobby = await lobbyManager.getLobby(lobbyState.code);
                if (lobby) {
                    currentLobby = lobby;
                    storage.saveLobbyState(lobby); // Update storage with fresh data
                    return lobby;
                }
            } catch (error) {
                console.warn('Failed to get lobby from storage state:', error);
            }
        }

        // **FIXED**: Don't automatically redirect if we're on lobby screen
        // This allows the lobby screen to be shown even without a current lobby
        // The UI will handle showing appropriate messaging or forms
        console.debug('No current lobby found, but this may be normal for lobby initialization');
        throw new Error('No current lobby found');
    }

    /**
     * Helper function to find elements in the lobby screen
     * @param {string} selector - CSS selector for the element
     * @returns {Element|null} - Found element or null
     */
    function findLobbyElement(selector) {
        // Try standard lobby screen first
        const standardElement = document.querySelector(`#lobby-screen ${selector}`);
        if (standardElement) return standardElement;
        
        // Try without screen prefix as fallback
        return document.querySelector(selector);
    }

    /**
     * Helper function to find all elements matching selector in the lobby screen
     * @param {string} selector - CSS selector for the elements
     * @returns {NodeList} - All found elements
     */
    function findAllLobbyElements(selector) {
        const elements = [];
        
        // Add elements from standard screen
        const standardElements = document.querySelectorAll(`#lobby-screen ${selector}`);
        elements.push(...standardElements);
        
        return elements;
    }

    /**
     * Initializes the lobby screen when it becomes active
     */
    async function initializeLobbyScreen() {
        try {
            // Ensure we have current player data
            await ensureCurrentPlayer();
            
            // Try to ensure we have current lobby data
            try {
                await ensureCurrentLobby();
                updateLobbyUI();
            } catch (error) {
                console.debug('No current lobby in initializeLobbyScreen - this is normal for new lobby creation/joining');
                // This is okay - user might be entering lobby screen before joining/creating a lobby
                // Show a placeholder UI or loading state
                showLobbyPlaceholder();
            }
        } catch (error) {
            console.error('Failed to initialize lobby screen:', error);
            showNotification('Failed to initialize lobby. Please try again.', 'error');
        }
    }

    /**
     * Shows a placeholder UI when no lobby is available
     */
    function showLobbyPlaceholder() {
        const lobbyContainer = document.querySelector('.lobby-container');
        if (lobbyContainer) {
            lobbyContainer.innerHTML = `
                <div class="lobby-placeholder">
                    <h2>Initializing Lobby...</h2>
                    <p>Please wait while we set up your game lobby.</p>
                    <div class="loading-spinner"></div>
                </div>
            `;
        }
    }

    /**
     * Handles creating a new lobby
     */
    async function handleCreateLobby(questionSetId = null) {
        try {
            await ensureCurrentPlayer();

            console.log('Creating lobby with current player:', currentPlayer);

            // Create lobby without question set (will be selected inside lobby)
            const lobbyData = await lobbyManager.createLobby(currentPlayer);

            if (lobbyData) {
                console.log('Lobby created successfully:', lobbyData);
                currentLobby = lobbyData;
                
                // Save lobby state
                storage.saveLobbyState(lobbyData);
                
                // Navigate to lobby screen
                screenManager.showScreen('lobby-screen');
                
                // Update UI
                updateLobbyUI();
                
                showNotification(`Lobby ${lobbyData.code} created successfully!`, 'success');
            } else {
                throw new Error('Failed to create lobby - no data returned');
            }
        } catch (error) {
            console.error('Failed to create lobby:', error);
            showNotification(`Failed to create lobby: ${error.message}`, 'error');
        }
    }

    /**
     * Handles joining a lobby with a specific code
     * @param {string} code - Lobby code
     */
    async function handleJoinLobbyWithCode(code) {
        try {
            await ensureCurrentPlayer();
            
            const playerData = {
                character: currentPlayer.character,
                username: currentPlayer.username
            };
            
            const lobbyData = await lobbyManager.joinLobby(code, playerData);
            
            if (lobbyData) {
                currentLobby = lobbyData;
                // Save lobby state for persistence
                storage.saveLobbyState(lobbyData);
                showNotification('Joined lobby successfully!', 'success');
                screenManager.showScreen(SCREENS.LOBBY);
                updateLobbyUI();
            }
        } catch (error) {
            console.error('Failed to join lobby:', error);
            showNotification(error.message || 'Failed to join lobby', 'error');
        }
    }

    /**
     * Shows the join lobby modal
     */
    function showJoinLobbyModal() {
        const modal = document.getElementById('join-lobby-modal');
        if (modal) {
            modal.classList.remove(CSS_CLASSES.HIDDEN);
            refreshLobbyList();
        }
    }

    /**
     * Hides the join lobby modal
     */
    function hideJoinLobbyModal() {
        const modal = document.getElementById('join-lobby-modal');
        if (modal) {
            modal.classList.add(CSS_CLASSES.HIDDEN);
        }
        
        if (lobbyListInterval) {
            clearInterval(lobbyListInterval);
            lobbyListInterval = null;
        }
    }

    /**
     * Refreshes the lobby list in the modal
     */
    async function refreshLobbyList() {
        const lobbyList = document.querySelector('.lobby-list');
        if (!lobbyList) return;

        try {
            const lobbies = await lobbyManager.getAllLobbies();
            
            if (lobbies.length === 0) {
                lobbyList.innerHTML = '<div class="empty">' + t('STATUS.NO_ACTIVE_LOBBIES') + '</div>';
                return;
            }

            lobbyList.innerHTML = lobbies.map(lobby => {
                const playerCount = lobby.players ? lobby.players.length : 0;
                return `
                    <div class="lobby-item" data-code="${lobby.code}">
                        <div class="lobby-info">
                            <span class="lobby-code">${lobby.code}</span>
                            <span class="lobby-host">Host: ${lobby.host}</span>
                            <span class="lobby-players">${playerCount}/8 players</span>
                        </div>
                        <button class="join-btn" data-code="${lobby.code}">Join</button>
                    </div>
                `;
            }).join('');

            // Add click handlers
            lobbyList.querySelectorAll('.join-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await handleJoinLobbyWithCode(btn.dataset.code);
                    hideJoinLobbyModal();
                });
            });
        } catch (error) {
            console.error('Failed to refresh lobby list:', error);
            lobbyList.innerHTML = '<div class="error">' + t('STATUS.FAILED_TO_LOAD_LOBBIES') + '</div>';
        }
    }

    /**
     * Handles the leave lobby action
     */
    async function handleLeaveLobby() {
        try {
            await ensureCurrentPlayer();
            await ensureCurrentLobby();
            
            await lobbyManager.leaveLobby(currentLobby.code, currentPlayer.username);
            
            // Clear lobby state
            currentLobby = null;
            storage.clearLobbyState();
            
            showNotification('Left lobby', 'info');
            screenManager.showScreen(SCREENS.MAIN_MENU);
        } catch (error) {
            console.error('Failed to leave lobby:', error);
            showNotification('Failed to leave lobby', 'error');
            
            // Even if API call failed, clear local state and go to main menu
            currentLobby = null;
            storage.clearLobbyState();
            screenManager.showScreen(SCREENS.MAIN_MENU);
        }
    }

    /**
     * Handles the start game action
     */
    async function handleStartGame() {
        try {
            await ensureCurrentPlayer();
            await ensureCurrentLobby();
            
            const updatedLobby = await lobbyManager.startGame(currentLobby.code);
            if (updatedLobby) {
                console.log('🎮 Game started successfully, updating state and switching screens');
                
                currentLobby = updatedLobby;
                storage.saveLobbyState(updatedLobby);
                
                // CRITICAL: Stop lobby polling BEFORE switching to game screen
                console.log('🛑 Stopping lobby polling before game starts');
                stopLobbyPolling();
                
                // Show game screen first
                console.log('🎮 Switching to game screen');
                screenManager.showScreen(SCREENS.GAME);
                
                // Small delay to ensure screen is ready, then dispatch game started event
                setTimeout(() => {
                    console.log('🎯 Dispatching GAME_STARTED event');
                    document.dispatchEvent(new CustomEvent(EVENTS.GAME_STARTED, {
                        detail: { lobby: currentLobby }
                    }));
                }, 100);
            }
        } catch (error) {
            console.error('Failed to start game:', error);
            showNotification(error.message || 'Failed to start game', 'error');
        }
    }
    
    // Fixed section of playerManager.js - refreshCurrentLobby method
    async function refreshCurrentLobby() {
        if (!currentLobby || !currentLobby.code) return;
        
        try {
            // Store previous state for comparison
            const previousPlayers = currentLobby.players ? 
                new Map(currentLobby.players.map(p => [p.username, { character: p.character, ready: p.ready }])) : 
                new Map();
            const previousQuestionSetId = currentLobby.question_set_id;
            const wasStarted = currentLobby.started; // Track if game was already started
            
            const updatedLobby = await lobbyManager.getLobby(currentLobby.code);
            
            if (!updatedLobby) {
                // Lobby was closed
                currentLobby = null;
                storage.clearLobbyState();
                showNotification('The lobby has been closed', 'info');
                screenManager.showScreen(SCREENS.MAIN_MENU);
                return;
            }
    
            // Update current lobby data first
            currentLobby = updatedLobby;
            storage.saveLobbyState(updatedLobby);
            
            // Only update UI if we're still on the lobby screen
            if (screenManager.getCurrentScreen() === SCREENS.LOBBY) {
                updateLobbyUI();
            }
            
            // Handle player changes (only show notifications if on lobby screen)
            if (screenManager.getCurrentScreen() === SCREENS.LOBBY) {
                // ... existing player change notification logic ...
            }
            
            // Check for question set changes
            if (previousQuestionSetId !== updatedLobby.question_set_id && updatedLobby.question_set_id) {
                const questionSetName = updatedLobby.question_set?.name || 'Unknown';
                if (screenManager.getCurrentScreen() === SCREENS.LOBBY) {
                    showNotification(`Question set changed to "${questionSetName}"`, 'info');
                }
            }
            
            // CRITICAL FIX: Handle game start transition properly
            if (updatedLobby.started && !wasStarted) {
                console.log('🎮 Game starting detected in refreshCurrentLobby');
                
                // Stop lobby polling immediately
                console.log('🛑 Stopping lobby polling due to game start');
                stopLobbyPolling();
                
                // Only switch screens and show notification if not already on game screen
                if (screenManager.getCurrentScreen() !== SCREENS.GAME) {
                    showNotification('Game is starting!', 'success');
                    
                    console.log('🎮 Switching to game screen from lobby refresh');
                    screenManager.showScreen(SCREENS.GAME);
                    
                    // Dispatch game started event for non-host players with a delay
                    setTimeout(() => {
                        console.log('🎯 Dispatching GAME_STARTED event from lobby refresh');
                        document.dispatchEvent(new CustomEvent(EVENTS.GAME_STARTED, {
                            detail: { lobby: updatedLobby }
                        }));
                    }, 200);
                }
            }
            
        } catch (error) {
            console.error('Failed to refresh lobby:', error);
            
            // Handle authentication errors
            if (error.status === 401 || (error.message && error.message.includes('session has expired'))) {
                console.warn('Authentication failed during lobby refresh - stopping polling and redirecting to login');
                stopLobbyPolling();
                
                currentLobby = null;
                storage.clearLobbyState();
                
                try {
                    if (screenManager) {
                        screenManager.showScreen('auth-screen');
                    } else {
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }
                } catch (redirectError) {
                    console.error('Failed to redirect to login:', redirectError);
                    window.location.reload();
                }
                
                return;
            }
        }
    }

    /**
     * Handles the ready toggle action
     */
    async function handleReadyToggle() {
        try {
            await ensureCurrentPlayer();
            await ensureCurrentLobby();
            
            const playerData = currentLobby.players.find(p => p.username === currentPlayer.username);
            if (!playerData) {
                throw new Error('Player not found in lobby');
            }
            
            const newReadyState = !playerData.ready;
            
            const updatedLobby = await lobbyManager.setPlayerReady(
                currentLobby.code,
                currentPlayer.username,
                newReadyState
            );
            
            if (updatedLobby) {
                currentLobby = updatedLobby;
                storage.saveLobbyState(updatedLobby);
                updateLobbyUI();
            }
        } catch (error) {
            console.error('Failed to update ready status:', error);
            showNotification('Failed to update ready status', 'error');
        }
    }

    /**
     * Handles question set selection
     */
    function handleSelectQuestionSet() {
        const questionSetManager = window.getModule?.('questionSetManager');
        if (questionSetManager) {
            questionSetManager.showQuestionSetModal();
        } else {
            console.error('Question set manager not available');
        }
    }

    /**
     * Handles setting the question count
     */
    async function handleSetQuestionCount() {
        if (!currentLobby || !currentPlayer) {
            console.warn('No current lobby or player found for question count setting');
            return;
        }

        // Check if current player is host
        const hostPlayer = currentLobby.players.find(p => p.is_host);
        const isHost = hostPlayer && hostPlayer.username === currentPlayer.username;

        if (!isHost) {
            showNotification('Only the host can set question count', 'error');
            return;
        }

        // Check if question set is selected
        if (!currentLobby.question_set) {
            showNotification(t('ERRORS.NO_QUESTION_SET_SELECTED'), 'error');
            return;
        }

        // Scope element lookup to lobby screen to avoid grabbing the duplicate element
        const lobbyScreen = document.getElementById('lobby-screen');
        const questionCountInput = lobbyScreen ? lobbyScreen.querySelector('#question-count-input') : null;
        if (!questionCountInput) {
            console.error('Question count input not found');
            return;
        }

        const questionCount = parseInt(questionCountInput.value);
        const maxQuestions = currentLobby.question_set.question_count;
        
        if (!questionCount || isNaN(questionCount)) {
            showNotification('Please enter a valid number', 'error');
            return;
        }
        
        if (questionCount < 1) {
            showNotification(t('ERRORS.QUESTION_COUNT_MIN_ONE'), 'error');
            return;
        }
        
        if (questionCount > maxQuestions) {
            showNotification(t('ERRORS.QUESTION_COUNT_EXCEEDS_MAX', `Maximum ${maxQuestions} questions available in this set`), 'error');
            return;
        }

        try {
            const result = await lobbyManager.setQuestionCount(currentLobby.code, questionCount);
            
            // Show success message if there was a message in the response
            if (result.message) {
                showNotification(result.message, 'success');
            } else {
                showNotification(`Question count set to ${questionCount}`, 'success');
            }

            // Keep the count displayed in the input field
            questionCountInput.value = questionCount;
            questionCountInput.disabled = true; // Lock the input to show it's set
            
            // Make the set count button green to indicate success
            const setQuestionCountBtn = lobbyScreen ? lobbyScreen.querySelector('#set-question-count-btn') : null;
            if (setQuestionCountBtn) {
                setQuestionCountBtn.classList.remove('btn-secondary');
                setQuestionCountBtn.classList.add('btn-success');
                setQuestionCountBtn.textContent = t('LOBBY.COUNT_SET'); // We'll add this translation
            }

            // Refresh lobby to show updated state
            await refreshCurrentLobby();

        } catch (error) {
            console.error('Failed to set question count:', error);
            showNotification(error.message || 'Failed to set question count', 'error');
        }
    }

    /**
     * Handles join lobby by code form submission
     * @param {Event} event - Form submit event
     */
    async function handleJoinLobbyByCode(event) {
        event.preventDefault();
        const input = event.target.querySelector('input[type="text"]');
        if (input && input.value) {
            await handleJoinLobbyWithCode(input.value.toUpperCase());
        }
    }

    /**
     * Handles player joined event
     * @param {CustomEvent} event - Player joined event
     */
    function handlePlayerJoined(event) {
        const { player } = event.detail;
        showNotification(`${player.character} ${player.username} joined the lobby`, 'info');
        refreshCurrentLobby();
    }

    /**
     * Handles player left event
     * @param {CustomEvent} event - Player left event
     */
    function handlePlayerLeft(event) {
        const { username } = event.detail;
        showNotification(`${username} left the lobby`, 'info');
        refreshCurrentLobby();
    }

    /**
     * Handles game ended events
     */
    function handleGameEnded(event) {
        console.log('🏁 Game ended event received - starting post-game polling');
        
        // Start polling to detect when host returns to lobby
        // This is important for post-game phase notifications
        startPostGamePolling();
    }
    
    /**
     * Starts polling specifically for post-game phase to detect host return
     */
    function startPostGamePolling() {
        stopLobbyPolling();
        
        // Poll during post-game phase to detect host return (optimized interval)
        lobbyRefreshInterval = setInterval(async () => {
            if (currentLobby && currentLobby.code) {
                await refreshCurrentLobby();
                
                // If we're back in lobby screen (host or player returned), use standard polling
                if (screenManager.getCurrentScreen() === SCREENS.LOBBY) {
                    console.log('🏠 Back in lobby screen - switching to standard polling');
                    startStandardPolling();
                    return;
                }
                
                // If lobby is no longer in post-game phase, stop this polling
                if (currentLobby.game_phase !== 'post-game') {
                    console.log('📊 No longer in post-game phase - stopping post-game polling');
                    stopLobbyPolling();
                    return;
                }
            }
        }, PERFORMANCE_SETTINGS.POLLING_INTERVALS.LOBBY_POST_GAME); // Optimized post-game polling
    }

    /**
     * Starts polling for lobby updates
     */
    function startLobbyPolling() {
        // Clear any existing interval
        stopLobbyPolling();
        
        // Start with standard lobby polling (2 seconds)
        startStandardPolling();
    }

    /**
     * Starts standard lobby polling for pre-game state
     */
    function startStandardPolling() {
        stopLobbyPolling();
        
        // Poll for lobby updates during lobby management (optimized interval)
        lobbyRefreshInterval = setInterval(async () => {
            if (currentLobby && currentLobby.code) {
                await refreshCurrentLobby();
                
                // If game has started, stop lobby polling and let GameEngine handle it
                if (currentLobby.started && screenManager.getCurrentScreen() === SCREENS.GAME) {
                    console.log('🎮 Game started - stopping lobby polling, GameEngine will handle updates');
                    stopLobbyPolling();
                    return;
                }
            }
        }, PERFORMANCE_SETTINGS.POLLING_INTERVALS.LOBBY_STANDARD); // Optimized standard polling
    }

    /**
     * Starts rapid synchronization mode for active games
     * NOTE: This function is now deprecated - GameEngine handles polling during games
     */
    function startRapidSyncMode() {
        console.log('⚠️ startRapidSyncMode called but is deprecated - GameEngine should handle game polling');
        // Don't start rapid sync mode - let GameEngine handle it
        stopLobbyPolling();
    }

    /**
     * Stops polling for lobby updates
     */
    function stopLobbyPolling() {
        if (lobbyRefreshInterval) {
            clearInterval(lobbyRefreshInterval);
            lobbyRefreshInterval = null;
        }
    }

    /**
     * Handles lobby updates from other tabs
     * @param {CustomEvent} event
     */
    function handleLobbyUpdate(event) {
        if (!currentLobby) return;
        
        // Get the latest lobby data
        refreshCurrentLobby();
    }

    /**
     * Refreshes current lobby data from API
     */
    async function refreshCurrentLobby() {
        if (!currentLobby || !currentLobby.code) return;
        
        try {
            // Store previous state for comparison
            const previousPlayers = currentLobby.players ? 
                new Map(currentLobby.players.map(p => [p.username, { character: p.character, ready: p.ready }])) : 
                new Map();
            const previousQuestionSetId = currentLobby.question_set_id;
            const previousGamePhase = currentLobby.game_phase;
            
            const updatedLobby = await lobbyManager.getLobby(currentLobby.code);
            
            if (!updatedLobby) {
                // Lobby was closed
                currentLobby = null;
                storage.clearLobbyState();
                showNotification('The lobby has been closed', 'info');
                screenManager.showScreen(SCREENS.MAIN_MENU);
                return;
            }

            const currentPlayers = updatedLobby.players ? 
                new Map(updatedLobby.players.map(p => [p.username, { character: p.character, ready: p.ready }])) : 
                new Map();
            
            // Improved player change detection - only show notifications for actual membership changes
            const playersJoined = [];
            const playersLeft = [];
            
            // Find players who actually joined (new usernames that aren't the current user)
            currentPlayers.forEach((playerData, username) => {
                if (!previousPlayers.has(username) && username !== currentPlayer?.username) {
                    playersJoined.push({ username, character: playerData.character });
                }
            });
            
            // Find players who actually left (removed usernames that aren't the current user)
            previousPlayers.forEach((playerData, username) => {
                if (!currentPlayers.has(username) && username !== currentPlayer?.username) {
                    playersLeft.push({ username, character: playerData.character });
                }
            });
            
            // Update current lobby data first
            currentLobby = updatedLobby;
            storage.saveLobbyState(updatedLobby);
            
            // Update UI
            updateLobbyUI();
            
            // Only show notifications for actual player changes (not for ready state changes)
            playersJoined.forEach(player => {
                showNotification(`${player.username} joined the lobby`, 'info');
                // Play join sound if audio manager is available
                if (window.audioManager) {
                    window.audioManager.playPlayerJoin().catch(e => console.warn('Failed to play join sound:', e));
                }
            });
            
            playersLeft.forEach(player => {
                showNotification(`${player.username} left the lobby`, 'info');
                // Play leave sound if audio manager is available
                if (window.audioManager) {
                    window.audioManager.playPlayerLeave().catch(e => console.warn('Failed to play leave sound:', e));
                }
            });
            
            // Check for question set changes
            if (previousQuestionSetId !== updatedLobby.question_set_id && updatedLobby.question_set_id) {
                const questionSetName = updatedLobby.question_set?.name || 'Unknown';
                showNotification(`Question set changed to "${questionSetName}"`, 'info');
            }
            
            // Check if host returned to lobby (game phase changed from post-game to waiting)
            if (previousGamePhase === 'post-game' && updatedLobby.game_phase === 'waiting') {
                const hostName = updatedLobby.host;
                const currentUserName = currentPlayer?.username;
                
                // Show notification to non-host players
                if (currentUserName !== hostName) {
                    showNotification(`${hostName} has returned to the lobby! You can now rejoin or leave.`, 'info');
                    
                    // Play notification sound if audio manager is available
                    if (window.audioManager) {
                        window.audioManager.playNotification().catch(e => console.warn('Failed to play notification sound:', e));
                    }
                    
                    // If we're on the results screen, update the UI to show rejoin button
                    if (screenManager.getCurrentScreen() === 'results-screen') {
                        // Dispatch event to update results screen with rejoin option
                        document.dispatchEvent(new CustomEvent('hostReturnedToLobby', {
                            detail: { 
                                lobbyCode: updatedLobby.code,
                                hostName: hostName,
                                gamePhase: updatedLobby.game_phase
                            }
                        }));
                    }
                }
            }
            
            // If game started, switch to game screen and dispatch game started event
            if (updatedLobby.started && screenManager.getCurrentScreen() !== SCREENS.GAME) {
                showNotification('Game is starting!', 'success');
                
                // Stop lobby polling since GameEngine will handle updates during the game
                console.log('🎮 Game starting - stopping lobby polling');
                stopLobbyPolling();
                
                // Dispatch game started event for non-host players
                document.dispatchEvent(new CustomEvent(EVENTS.GAME_STARTED, {
                    detail: { lobby: updatedLobby }
                }));
                
                screenManager.showScreen(SCREENS.GAME);
            }
        } catch (error) {
            console.error('Failed to refresh lobby:', error);
            
            // If authentication failed, stop polling and redirect to login
            if (error.status === 401 || (error.message && error.message.includes('session has expired'))) {
                console.warn('Authentication failed during lobby refresh - stopping polling and redirecting to login');
                stopLobbyPolling();
                
                // Clear current state
                currentLobby = null;
                storage.clearLobbyState();
                
                // Try to redirect to login screen
                try {
                    if (screenManager) {
                        screenManager.showScreen('auth-screen');
                    } else {
                        // Fallback: reload the page to trigger auth check
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }
                } catch (redirectError) {
                    console.error('Failed to redirect to login:', redirectError);
                    // Force reload as last resort
                    window.location.reload();
                }
                
                return;
            }
            
            // Don't show error notifications for refresh failures to avoid spam
        }
    }

    /**
     * Shows a notification
     * @param {string} message - Message to show
     * @param {string} type - Notification type
     */
    function showNotification(message, type = 'info') {
        // Import notification function if available
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Handles question set selection event
     * @param {CustomEvent} event - Question set selected event
     */
    async function handleQuestionSetSelected(event) {
        try {
            const questionSet = event.detail;
            if (!questionSet) return;

            console.log('Question set selected:', questionSet);
            
            // Only set question set for existing lobby (no longer create new lobbies here)
            if (currentLobby && currentLobby.code) {
                console.log('Setting question set for existing lobby:', currentLobby.code);
                
                await ensureCurrentPlayer();
                
                // Check if current player is host
                const currentPlayerData = currentLobby.players.find(p => p.username === currentPlayer.username);
                if (!currentPlayerData || !currentPlayerData.is_host) {
                    showNotification(translateRaw('Only the host can select question sets'), 'error');
                    return;
                }
                
                console.log('📡 Calling lobbyManager.setQuestionSet with:', { code: currentLobby.code, questionSetId: questionSet.id });
                
                // Set question set for the existing lobby
                const updatedLobby = await lobbyManager.setQuestionSet(currentLobby.code, questionSet.id);
                
                console.log('📡 Received updated lobby from setQuestionSet:', updatedLobby);
                console.log('📡 Updated lobby question_set field:', updatedLobby?.question_set);
                
                if (updatedLobby) {
                    currentLobby = updatedLobby;
                    storage.saveLobbyState(updatedLobby);
                    
                    console.log('🎯 About to call updateLobbyUI with currentLobby.question_set:', currentLobby.question_set);
                    updateLobbyUI();
                    showNotification(`Question set "${questionSet.name}" selected`, 'success');
                } else {
                    console.error('❌ setQuestionSet returned null/undefined');
                    throw new Error('Failed to update lobby with question set');
                }
            } else {
                console.warn('No current lobby found for question set selection');
                showNotification('No active lobby found', 'error');
            }
        } catch (error) {
            console.error('Failed to handle question set selection:', error);
            
            // If authentication failed, redirect to login
            if (error.status === 401 || (error.message && error.message.includes('session has expired'))) {
                console.warn('Authentication failed during question set selection - redirecting to login');
                stopLobbyPolling();
                
                // Clear current state
                currentLobby = null;
                storage.clearLobbyState();
                
                // Redirect to login
                try {
                    if (screenManager) {
                        screenManager.showScreen('auth-screen');
                    } else {
                        window.location.reload();
                    }
                } catch (redirectError) {
                    console.error('Failed to redirect to login:', redirectError);
                    window.location.reload();
                }
                
                return;
            }
            
            showNotification(translateRaw(`Failed to select question set: ${error.message}`), 'error');
        }
    }

    /**
     * Updates the lobby UI
     */
    function updateLobbyUI() {
        if (!currentLobby) {
            console.warn('updateLobbyUI called but no current lobby');
            showLobbyPlaceholder();
            return;
        }

        // Get the lobby container and restore normal structure if needed
        const lobbyContainer = document.querySelector('.lobby-container');
        if (lobbyContainer && lobbyContainer.querySelector('.lobby-placeholder')) {
            // Replace placeholder with normal lobby content
            lobbyContainer.innerHTML = `
                <div class="lobby-header">
                    <h2>${t('LOBBY.TITLE')}</h2>
                    <div class="lobby-code">
                        <span>${t('LOBBY.GAME_CODE')}:</span>
                        <span class="code" id="lobby-code-display">${currentLobby.code}</span>
                    </div>
                </div>
                
                <div class="lobby-content">
                    <div class="players-section">
                        <h3 id="players-count-header">${t('LOBBY.PLAYERS').replace('(0/8)', `(${currentLobby.players ? currentLobby.players.length : 0}/8)`)}</h3>
                        <div class="players-list"></div>
                    </div>
                    
                    <div class="question-set-section" id="question-set-section">
                        <h3>${t('LOBBY.QUESTION_SET')}</h3>
                        <div class="selected-question-set" id="selected-question-set"></div>
                        <button class="btn btn-primary" id="select-question-set-btn">${t('LOBBY.SELECT_QUESTION_SET')}</button>
                        
                        <div class="question-count-section" id="question-count-section">
                            <h4>${t('CREATE_GAME.QUESTION_COUNT')} <span class="required-indicator">*</span></h4>
                            <div class="question-count-controls">
                                <input type="number" id="question-count-input" min="1" max="100" placeholder="${t('LOBBY.QUESTION_COUNT_PLACEHOLDER')}" />
                                <button class="btn btn-secondary" id="set-question-count-btn">${t('LOBBY.SET_COUNT')}</button>
                            </div>
                            <div class="question-count-info" id="question-count-info"></div>
                        </div>
                    </div>
                </div>
                
                <div class="lobby-controls">
                    <button class="btn btn-secondary" id="ready-btn">${t('LOBBY.READY')}</button>
                    <button class="btn btn-primary hidden" id="start-game">${t('LOBBY.START_GAME')}</button>
                    <button class="btn btn-secondary" id="leave-lobby">${t('LOBBY.LEAVE_LOBBY')}</button>
                </div>
            `;
            
            // Re-setup event listeners for the new elements
            setupLobbyEventListeners();
        }

        // Update lobby code in both screens
        const codeDisplays = findAllLobbyElements('#lobby-code-display');
        codeDisplays.forEach(codeDisplay => {
            if (codeDisplay) {
                codeDisplay.textContent = currentLobby.code;
            }
        });

        // Update player count in header in both screens
        const playersCountHeaders = findAllLobbyElements('#players-count-header');
        playersCountHeaders.forEach(playersCountHeader => {
            if (playersCountHeader && currentLobby.players) {
                playersCountHeader.textContent = t('LOBBY.PLAYERS').replace('(0/8)', `(${currentLobby.players.length}/8)`);
            }
        });

        // Update players list with animations in both screens
        const playersLists = findAllLobbyElements('.players-list');
        playersLists.forEach(playersList => {
            if (playersList) {
                // Get current player usernames for comparison
                const existingPlayerElements = Array.from(playersList.querySelectorAll('.player-item'));
                const existingPlayers = new Set(existingPlayerElements.map(item => item.dataset.username));
                const currentPlayerUsernames = new Set(currentLobby.players ? currentLobby.players.map(p => p.username) : []);
                
                // Remove players who are no longer in the lobby
                existingPlayerElements.forEach(element => {
                    const username = element.dataset.username;
                    if (!currentPlayerUsernames.has(username)) {
                        element.classList.add('fade-out');
                        setTimeout(() => {
                            if (element.parentNode) {
                                element.parentNode.removeChild(element);
                            }
                        }, 300);
                    }
                });
                
                // Add or update existing players
                if (currentLobby.players && currentLobby.players.length > 0) {
                    currentLobby.players.forEach(player => {
                        let playerItem = playersList.querySelector(`[data-username="${player.username}"]`);
                        
                        if (!playerItem) {
                            // Create new player item
                            playerItem = document.createElement('div');
                            playerItem.className = 'player-item fade-in';
                            playerItem.dataset.username = player.username;
                            playersList.appendChild(playerItem);
                        }
                        
                        // Update player item content
                        playerItem.innerHTML = `
                            <span class="player-character">${player.character}</span>
                            <span class="player-username">${player.username}</span>
                            ${player.is_host ? '<span class="host-badge">Host</span>' : ''}
                            <span class="player-status ${player.ready || player.is_host ? 'ready' : ''}">${player.is_host ? t('LOBBY.WAITING_FOR_PLAYERS').toLowerCase() : (player.ready ? t('LOBBY.READY') : t('LOBBY.NOT_READY'))}</span>
                        `;
                    });
                } else {
                    // No players, clear the list
                    playersList.innerHTML = '';
                }
            }
        });

        // Update question set section
        updateQuestionSetUI();

        // Update host controls in both screens
        const startGameBtns = findAllLobbyElements('#start-game');
        startGameBtns.forEach(startGameBtn => {
            if (startGameBtn && currentPlayer) {
                const hostPlayer = currentLobby.players.find(p => p.is_host);
                const isHost = hostPlayer && hostPlayer.username === currentPlayer.username;
                const hasQuestionSet = currentLobby.question_set || (currentLobby.questions && currentLobby.questions.length > 0);
                const hasQuestionCount = currentLobby.question_count && currentLobby.question_count > 0;
                const canStart = currentLobby.players && 
                               lobbyManager.areAllPlayersReady(currentLobby) &&
                               hasQuestionSet &&
                               hasQuestionCount;
                
                startGameBtn.classList.toggle(CSS_CLASSES.HIDDEN, !isHost);
                startGameBtn.disabled = !canStart;
                
                if (!canStart && isHost) {
                    if (!hasQuestionSet) {
                        startGameBtn.title = t('ERRORS.NO_QUESTION_SET_SELECTED');
                    } else if (!hasQuestionCount) {
                        startGameBtn.title = t('ERRORS.SET_QUESTION_COUNT_FIRST');
                    } else if (!lobbyManager.areAllPlayersReady(currentLobby)) {
                        startGameBtn.title = t('LOBBY.WAITING_FOR_PLAYERS');
                    }
                } else {
                    startGameBtn.title = '';
                }
            }
        });

        // Update ready button - hide for hosts, show for other players in both screens
        const readyBtns = findAllLobbyElements('#ready-btn');
        readyBtns.forEach(readyBtn => {
            if (readyBtn && currentPlayer) {
                const currentPlayerData = currentLobby.players.find(p => p.username === currentPlayer.username);
                const isHost = currentPlayerData && currentPlayerData.is_host;
                
                if (isHost) {
                    // Hide ready button for hosts
                    readyBtn.classList.add(CSS_CLASSES.HIDDEN);
                } else if (currentPlayerData) {
                    // Show ready button for non-host players
                    readyBtn.classList.remove(CSS_CLASSES.HIDDEN);
                    readyBtn.textContent = currentPlayerData.ready ? t('LOBBY.NOT_READY') : t('LOBBY.READY');
                    readyBtn.classList.toggle('ready', currentPlayerData.ready);
                }
            }
        });
    }

    /**
     * Setup event listeners for lobby elements (used when recreating the lobby UI)
     */
    function setupLobbyEventListeners() {
        // Ready buttons in both screens
        const readyBtns = findAllLobbyElements('#ready-btn');
        readyBtns.forEach(readyBtn => {
            if (readyBtn && !readyBtn.hasAttribute('data-listener-added')) {
                readyBtn.addEventListener('click', handleReadyToggle);
                readyBtn.setAttribute('data-listener-added', 'true');
            }
        });

        // Start game buttons in both screens
        const startGameBtns = findAllLobbyElements('#start-game');
        startGameBtns.forEach(startGameBtn => {
            if (startGameBtn && !startGameBtn.hasAttribute('data-listener-added')) {
                startGameBtn.addEventListener('click', handleStartGame);
                startGameBtn.setAttribute('data-listener-added', 'true');
            }
        });

        // Leave lobby buttons in both screens
        const leaveLobbyBtns = findAllLobbyElements('#leave-lobby');
        leaveLobbyBtns.forEach(leaveLobbyBtn => {
            if (leaveLobbyBtn && !leaveLobbyBtn.hasAttribute('data-listener-added')) {
                leaveLobbyBtn.addEventListener('click', handleLeaveLobby);
                leaveLobbyBtn.setAttribute('data-listener-added', 'true');
            }
        });

        // Select question set buttons in both screens
        const selectQuestionSetBtns = findAllLobbyElements('#select-question-set-btn');
        selectQuestionSetBtns.forEach(selectQuestionSetBtn => {
            if (selectQuestionSetBtn && !selectQuestionSetBtn.hasAttribute('data-listener-added')) {
                selectQuestionSetBtn.addEventListener('click', handleSelectQuestionSet);
                selectQuestionSetBtn.setAttribute('data-listener-added', 'true');
            }
        });

        // Set question count buttons in both screens
        const setQuestionCountBtns = findAllLobbyElements('#set-question-count-btn');
        setQuestionCountBtns.forEach(setQuestionCountBtn => {
            if (setQuestionCountBtn && !setQuestionCountBtn.hasAttribute('data-listener-added')) {
                setQuestionCountBtn.addEventListener('click', handleSetQuestionCount);
                setQuestionCountBtn.setAttribute('data-listener-added', 'true');
            }
        });

        // Question count input enter key in both screens
        const questionCountInputs = findAllLobbyElements('#question-count-input');
        questionCountInputs.forEach(questionCountInput => {
            if (questionCountInput && !questionCountInput.hasAttribute('data-listener-added')) {
                questionCountInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleSetQuestionCount();
                    }
                });
                questionCountInput.setAttribute('data-listener-added', 'true');
            }
        });
    }

    /**
     * Updates the question set UI section
     */
    function updateQuestionSetUI() {
        if (!currentLobby || !currentPlayer) {
            return;
        }
    
        const questionSetSections = findAllLobbyElements('#question-set-section');
        const selectedQuestionSetDivs = findAllLobbyElements('#selected-question-set');
        const selectBtns = findAllLobbyElements('#select-question-set-btn');
    
        if (questionSetSections.length === 0 || selectedQuestionSetDivs.length === 0) {
            return;
        }
    
        // Check if current player is host
        const hostPlayer = currentLobby.players.find(p => p.is_host);
        const isHost = hostPlayer && hostPlayer.username === currentPlayer.username;
    
        // Always show question set section to all players
        questionSetSections.forEach(questionSetSection => {
            questionSetSection.classList.remove(CSS_CLASSES.HIDDEN);
        });
    
        // Only show the select button for hosts
        selectBtns.forEach(selectBtn => {
            if (selectBtn) {
                selectBtn.classList.toggle(CSS_CLASSES.HIDDEN, !isHost);
            }
        });
    
        const hasSelection = currentLobby.question_set && currentLobby.question_set.name;
    
        // Update CSS classes for visual feedback - only for the selected question set div, not the whole section
        selectedQuestionSetDivs.forEach(selectedQuestionSetDiv => {
            selectedQuestionSetDiv.classList.toggle('has-selection', hasSelection);
        });
    
        // Update selected question set display for all players
        selectedQuestionSetDivs.forEach(selectedQuestionSetDiv => {
            if (hasSelection) {
                selectedQuestionSetDiv.innerHTML = `
                    <div class="question-set-info">
                        <div class="question-set-details">
                            <h4>${currentLobby.question_set.name}</h4>
                            <p>${currentLobby.question_set.description || 'No description available'}</p>
                            <div class="question-set-stats">
                                <span class="question-count">${currentLobby.question_set.question_count} ${t('QUESTION_SETS.QUESTIONS_AVAILABLE')}</span>
                                <span class="question-set-badge">${t('QUESTION_SETS.SELECTED')}</span>
                            </div>
                        </div>
                    </div>
                `;
                
                // Scroll the selected question set into view
                setTimeout(() => {
                    selectedQuestionSetDiv.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 100);
            } else {
                // No question set selected
                if (isHost) {
                    selectedQuestionSetDiv.innerHTML = `
                        <div class="no-selection">
                            <p>${t('LOBBY.NO_QUESTION_SET')}</p>
                            <p class="help-text">${t('LOBBY.CHOOSE_QUESTION_SET')}</p>
                        </div>
                    `;
                } else {
                    selectedQuestionSetDiv.innerHTML = `
                        <div class="no-selection">
                            <p>${t('LOBBY.WAITING_FOR_HOST_QUESTION_SET')}</p>
                            <p class="help-text">${t('LOBBY.HOST_WILL_SELECT_QUESTIONS')}</p>
                        </div>
                    `;
                }
            }
        });
        
        // Update button styling to show it's completed
        selectBtns.forEach(selectBtn => {
            if (selectBtn && isHost) {
                if (hasSelection) {
                    selectBtn.classList.remove('btn-secondary', 'btn-primary');
                    selectBtn.classList.add('btn-success');
                    selectBtn.innerHTML = `✅ ${t('LOBBY.SELECT_QUESTION_SET')}`;
                } else {
                    selectBtn.classList.remove('btn-success', 'btn-secondary');
                    selectBtn.classList.add('btn-primary');
                    selectBtn.textContent = t('LOBBY.SELECT_QUESTION_SET');
                }
            }
        });
    
        // Update question count section in both screens
        const questionCountSections = findAllLobbyElements('#question-count-section');
        const questionCountInfos = findAllLobbyElements('#question-count-info');
        
        questionCountSections.forEach((questionCountSection, index) => {
            if (questionCountSection) {
                // FIXED: Show question count section when there's a question set OR when user is host
                // This ensures hosts can always see the section, and non-hosts see it when there's a selection
                const showQuestionCount = hasSelection || isHost;
                questionCountSection.classList.toggle(CSS_CLASSES.HIDDEN, !showQuestionCount);
                
                const questionCountInfo = questionCountInfos[index];
                if (showQuestionCount && questionCountInfo) {
                    const questionCountInput = questionCountSection.querySelector('#question-count-input');
                    const setQuestionCountBtn = questionCountSection.querySelector('#set-question-count-btn');
                    
                    // Show controls to hosts when question count section is visible
                    const questionCountControls = questionCountSection.querySelector('.question-count-controls');
                    if (questionCountControls) {
                        questionCountControls.classList.toggle(CSS_CLASSES.HIDDEN, !isHost);
                    }
                    
                    if (hasSelection) {
                        // Question set is selected - enable controls for hosts
                        if (isHost) {
                            // Check if question count is already set
                            if (currentLobby.question_count) {
                                // Question count is already set - lock the input and make button green
                                if (questionCountInput) {
                                    questionCountInput.value = currentLobby.question_count;
                                    questionCountInput.disabled = true;
                                }
                                if (setQuestionCountBtn) {
                                    setQuestionCountBtn.disabled = false;
                                    setQuestionCountBtn.classList.remove('btn-secondary');
                                    setQuestionCountBtn.classList.add('btn-success');
                                    setQuestionCountBtn.innerHTML = `✅ ${t('LOBBY.COUNT_SET')}`;
                                    // Allow host to click to change the count
                                    setQuestionCountBtn.onclick = () => {
                                        if (questionCountInput) {
                                            questionCountInput.disabled = false;
                                            questionCountInput.focus();
                                            questionCountInput.select();
                                        }
                                        setQuestionCountBtn.classList.remove('btn-success');
                                        setQuestionCountBtn.classList.add('btn-secondary');
                                        setQuestionCountBtn.textContent = t('LOBBY.SET_COUNT');
                                        setQuestionCountBtn.onclick = null; // Remove this handler, the normal one will take over
                                    };
                                }
                            } else {
                                // Question count not set yet - allow host to set it
                                if (questionCountInput) {
                                    questionCountInput.disabled = false;
                                    questionCountInput.max = currentLobby.question_set.question_count;
                                    questionCountInput.placeholder = `Enter 1-${currentLobby.question_set.question_count}`;
                                    questionCountInput.value = ''; // Clear any previous value
                                }
                                if (setQuestionCountBtn) {
                                    setQuestionCountBtn.disabled = false;
                                    setQuestionCountBtn.classList.remove('btn-success');
                                    setQuestionCountBtn.classList.add('btn-secondary');
                                    setQuestionCountBtn.textContent = t('LOBBY.SET_COUNT');
                                    setQuestionCountBtn.onclick = null; // Use the default event handler
                                }
                            }
                        } else {
                            // Non-host players: disable controls and show current state
                            if (questionCountInput) {
                                questionCountInput.disabled = true;
                                if (currentLobby.question_count) {
                                    questionCountInput.value = currentLobby.question_count;
                                }
                            }
                            if (setQuestionCountBtn) {
                                setQuestionCountBtn.disabled = true;
                                if (currentLobby.question_count) {
                                    setQuestionCountBtn.classList.remove('btn-secondary');
                                    setQuestionCountBtn.classList.add('btn-success');
                                    setQuestionCountBtn.innerHTML = `✅ ${t('LOBBY.COUNT_SET')}`;
                                } else {
                                    setQuestionCountBtn.classList.remove('btn-success');
                                    setQuestionCountBtn.classList.add('btn-secondary');
                                    setQuestionCountBtn.textContent = t('LOBBY.SET_COUNT');
                                }
                            }
                        }
                        
                        // Display current question count status for all players
                        if (currentLobby.question_count) {
                            // Remove the green box display completely - no longer showing "Using X questions"
                            questionCountInfo.innerHTML = '';
                            questionCountInfo.classList.remove('has-count');
                        } else {
                            questionCountInfo.innerHTML = '';
                            questionCountInfo.classList.remove('has-count');
                        }
                    } else if (isHost) {
                        // No question set selected but host can see the section - show disabled state
                        if (questionCountInput) {
                            questionCountInput.disabled = true;
                            questionCountInput.placeholder = t('ERRORS.NO_QUESTION_SET_SELECTED');
                        }
                        if (setQuestionCountBtn) setQuestionCountBtn.disabled = true;
                        
                        // Remove the question count info display completely
                        questionCountInfo.innerHTML = '';
                        questionCountInfo.classList.remove('has-count');
                    }
                }
            }
        });
    }

    /**
     * Handles lobby creation event
     * @param {CustomEvent} event - Lobby created event
     */
    function handleLobbyCreated(event) {
        console.log('PlayerManager: Handling lobby created event:', event.detail);
        
        if (event.detail && event.detail.lobby) {
            currentLobby = event.detail.lobby;
            console.log('PlayerManager: Current lobby set to:', currentLobby);
            
            // Also set current player if provided
            if (event.detail.player && !currentPlayer) {
                currentPlayer = event.detail.player;
                console.log('PlayerManager: Current player set to:', currentPlayer);
            }
            
            // Update UI if we're on the lobby screen
            if (document.getElementById('lobby-screen').classList.contains('active')) {
                updateLobbyUI();
            }
        }
    }

    /**
     * Sets the current lobby (called externally)
     * @param {Object} lobby - Lobby data
     */
    function setCurrentLobby(lobby) {
        console.log('PlayerManager: setCurrentLobby called with:', lobby);
        currentLobby = lobby;
        
        // Save lobby state to storage
        storage.saveLobbyState(lobby);
        
        // Update UI if we're on the lobby screen
        if (document.getElementById('lobby-screen').classList.contains('active')) {
            updateLobbyUI();
        }
    }

    // Initialize the module
    init();

    // Return public methods
    return {
        getCurrentLobby: () => currentLobby,
        getCurrentPlayer: () => currentPlayer,
        setCurrentPlayer: (player) => { 
            currentPlayer = player;
            console.log('Current player set:', player);
        },
        setCurrentLobby,
        ensureCurrentPlayer,
        ensureCurrentLobby,
        initializeLobbyScreen,
        updateLobbyUI,
        refreshCurrentLobby,
        handleCreateLobby,
        handleJoinLobbyWithCode,
        handleLeaveLobby,
        handleStartGame,
        handleReadyToggle,
        handleSelectQuestionSet,
        handleSetQuestionCount,
        showJoinLobbyModal,
        hideJoinLobbyModal,
        startPostGamePolling,
        stopLobbyPolling
    };
}