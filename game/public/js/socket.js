// js/socket.js

/**
 * @fileoverview Manages Socket.IO connection, event emission, and handling server events.
 */

import {
    gameState,
    setSocket,
    setLobbyDetails,
    setCurrentPlayerId,
    getIsHost,
    setCurrentQuestion,
    getIdToken,
    getCurrentPlayerName,
    clearLobbyDetails
} from './state.js';

// Store dependencies reference to avoid circular imports
let socketDependencies = null;

/**
 * Sets the dependencies for this module
 * @param {Object} deps - Dependencies object from main.js
 */
export function setSocketDependencies(deps) {
    socketDependencies = deps;
}

/**
 * Initializes the Socket.IO connection and sets up event handlers.
 * @param {Object} dependencies - Object containing references to other modules (ui, game, state).
 */
export function initSocketConnection(dependencies) {
    const { ui, game, api } = dependencies;

    // Store dependencies for use in event handlers
    if (!socketDependencies) {
        socketDependencies = dependencies;
    }

    if (gameState.socket && gameState.socket.connected) {
        const currentIdToken = getIdToken();
        if (currentIdToken && gameState.socket.auth && gameState.socket.auth.token !== currentIdToken) {
            console.log("Socket: Token changed, re-authenticating.");
            gameState.socket.auth.token = currentIdToken;
            gameState.socket.disconnect().connect(); // Reconnect to apply new token
        } else {
            console.log("Socket: Already connected or no token change needed.");
        }
        return;
    }

    console.log('Socket: Initializing connection...');
    ui.updateConnectionStatus('Verbinde...', 'text-yellow-500');

    const socketOptions = {
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        path: '/socket.io/', // Ensure this matches your server configuration
        auth: {}
    };

    const currentIdToken = getIdToken();
    if (currentIdToken) {
        socketOptions.auth.token = currentIdToken;
        console.log("Socket: Connecting with Firebase ID token.");
    } else {
        // For guest users, ensure playerName is correctly sourced
        let guestNameForSocket = getCurrentPlayerName() || `Gast-${Math.random().toString(36).substring(2,7)}`;
        if (!getCurrentPlayerName() && gameState.elements.guestNameInput && gameState.elements.guestNameInput.value) {
            guestNameForSocket = gameState.elements.guestNameInput.value.trim();
        }
        socketOptions.query = { playerName: guestNameForSocket };
        console.log("Socket: Connecting as guest:", guestNameForSocket);
    }

    if (typeof io === 'undefined') {
        console.error('Socket.IO client (io) not found. Ensure Socket.IO library is loaded.');
        ui.updateConnectionStatus('Socket.IO Fehler', 'text-red-500');
        ui.showGlobalNotification('Socket.IO Client nicht geladen!', 'error');
        return;
    }

    const newSocket = io(window.location.origin, socketOptions);
    setSocket(newSocket); // Store the socket instance in state

    // --- Standard Connection Events ---
    newSocket.on('connect', () => {
        console.log('Socket: ✅ Connected with ID:', newSocket.id);
        ui.updateConnectionStatus('Verbunden', 'text-green-500');
        // If rejoining a lobby is needed after reconnect, handle here
    });

    newSocket.on('connect_error', (err) => {
        console.error('Socket: 🔌 Connection Error:', err.message, err.data || '');
        ui.updateConnectionStatus('Verbindungsfehler', 'text-red-500');
        if (err.data && err.data.type === 'AuthError') {
            ui.showGlobalNotification(`Authentifizierungsfehler: ${err.data.message}`, 'error');
            // Potentially trigger logout or redirect to login
        } else {
            ui.showGlobalNotification('Verbindung zum Server fehlgeschlagen.', 'error');
        }
    });

    newSocket.on('disconnect', (reason) => {
        console.warn('Socket: 🔌 Disconnected:', reason);
        ui.updateConnectionStatus('Getrennt', 'text-yellow-500');
        if (reason === 'io server disconnect') {
            // The server intentionally disconnected the socket
            ui.showGlobalNotification('Vom Server getrennt.', 'warning');
        }
        // Consider if re-authentication or cleanup is needed
    });

    // --- Custom Game/Lobby Events ---
    newSocket.on('lobbyCreated', (data) => {
        console.log('Socket: lobbyCreated event data:', data);
        if (!data || !data.lobbyId || !data.hostId || !data.players) {
            console.error("Socket: Invalid data for lobbyCreated:", data);
            ui.showGlobalNotification("Fehler beim Erstellen der Lobby (ungültige Daten).", "error");
            return;
        }
        setLobbyDetails(data.lobbyId, data.hostId, true); // Host creates, so is host
        setCurrentPlayerId(data.hostId); // Make sure current player ID is set to host ID
        ui.updateWaitingRoomUI(data.players, data.hostId);
        ui.showScreen('waitingRoom');
        ui.showGlobalNotification(`Lobby ${data.lobbyId} erstellt! ID teilen.`, 'success');
        if (socketDependencies?.sound?.playSound) {
            socketDependencies.sound.playSound('join');
        }
    });

    newSocket.on('joinedLobby', (data) => {
        console.log('Socket: joinedLobby event data:', data);
        if (!data || !data.lobbyId || !data.yourPlayerId || !data.hostId || !data.players) {
            console.error("Socket: Invalid data for joinedLobby:", data);
            ui.showGlobalNotification("Fehler beim Beitreten zur Lobby (ungültige Daten).", "error");
            return;
        }
        setLobbyDetails(data.lobbyId, data.yourPlayerId, String(data.hostId) === String(data.yourPlayerId));
        ui.updateWaitingRoomUI(data.players, data.hostId);
        ui.showScreen('waitingRoom');
        ui.showGlobalNotification(`Lobby ${data.lobbyId} beigetreten.`, 'success');
        if (socketDependencies?.sound?.playSound) {
            socketDependencies.sound.playSound('join');
        }
    });

    newSocket.on('lobbyError', (data) => {
        console.error('Socket: Lobby error:', data.message || data);
        ui.showGlobalNotification(data.message || 'Lobby-Fehler aufgetreten.', 'error');
        if (gameState.elements.lobbyErrorMessage) gameState.elements.lobbyErrorMessage.textContent = data.message || 'Unbekannter Fehler';
    });

    newSocket.on('playerListUpdate', (data) => {
        console.log('Socket: playerListUpdate data:', data);
        if (data && data.players && data.hostId) {
            gameState.players = data.players; // Update local cache of players if needed
            ui.updateWaitingRoomUI(data.players, data.hostId);
        }
    });

    newSocket.on('categorySelectedByHost', (data) => {
        console.log('Socket: categorySelectedByHost data:', data);
        if (ui.domElements?.displaySelectedCategory) {
            ui.domElements.displaySelectedCategory.textContent = data.category || 'N/A';
        }
        if (getIsHost() && ui.domElements?.categorySelect) { // Update host's own select if needed
            ui.domElements.categorySelect.value = data.category;
        }
    });

    newSocket.on('gameStarted', (data) => {
        console.log('Socket: gameStarted data:', data); // data might include initial game info
        ui.showScreen('game');
        ui.showGlobalNotification('Spiel gestartet!', 'success');
        if (socketDependencies?.sound?.playSound) {
            socketDependencies.sound.playSound('start');
        }
    });

    newSocket.on('newQuestion', (data) => {
        console.log('Socket: newQuestion data:', data);
        setCurrentQuestion(data);
        ui.displayQuestion(data,
            (answer) => emitSubmitAnswer(answer), // submitAnswerCallback
            () => emitLeaveLobby(), // leaveGameCallback
            game.startQuestionTimer // startTimerCallback from game.js
        );
    });

    newSocket.on('answerSubmitted', (data) => { // Server confirms answer and gives feedback
        console.log('Socket: answerSubmitted feedback data:', data);
        game.handleAnswerFeedback(data); // Logic in game.js, UI updates in ui.js
    });

    newSocket.on('questionEnded', (data) => {
        console.log('Socket: questionEnded data:', data);
        ui.displayQuestionResults(data);
    });

    newSocket.on('liveScores', (data) => {
        console.log('Socket: liveScores data:', data.scores);
        ui.updateLiveScores(data.scores);
    });

    newSocket.on('gameEnded', (data) => {
        console.log('Socket: gameEnded data:', data);
        ui.displayFinalResults(data,
            () => { // playAgainCallback
                ui.showScreen('waitingRoom');
                ui.showGlobalNotification('Warte auf Host für neues Spiel...', 'info');
                // Client doesn't emit, just waits for host to start new game or new question
            },
            () => emitLeaveLobbyAndShowConnect(), // newLobbyCallback
            () => {
                if (socketDependencies?.auth?.handleLogout) {
                    socketDependencies.auth.handleLogout(socketDependencies);
                }
            } // logoutCallback
        );
    });

    newSocket.on('kicked', (data) => {
        console.warn('Socket: Kicked from lobby.', data.message);
        ui.showGlobalNotification(`Du wurdest gekickt: ${data.message || ''}`, 'warning');
        clearLobbyDetails();
        if (socketDependencies?.game?.resetGameState) {
            socketDependencies.game.resetGameState();
        }
        ui.showScreen('lobbyConnect');
    });

    console.log('Socket: ✅ Event listeners set up.');
}

// --- Emitter Functions ---
export function emitCreateLobby() {
    if (gameState.socket && gameState.socket.connected) {
        let nameToEmit = getCurrentPlayerName() || `Spieler-${Math.random().toString(36).substring(2, 7)}`;
        console.log(`Socket: Emitting 'createLobby'. Player Name: '${nameToEmit}'`);
        gameState.socket.emit('createLobby', { playerName: nameToEmit });
        if(gameState.elements.lobbyErrorMessage) gameState.elements.lobbyErrorMessage.textContent = '';
    } else {
        console.error('Socket: Cannot emit createLobby, not connected.');
        if (socketDependencies?.ui?.showGlobalNotification) {
            socketDependencies.ui.showGlobalNotification("Nicht mit Server verbunden.", "error");
        }
    }
}

export function emitJoinLobby(lobbyId) {
    if (gameState.socket && gameState.socket.connected) {
        let nameToEmit = getCurrentPlayerName() || `Spieler-${Math.random().toString(36).substring(2, 7)}`;
        console.log(`Socket: Emitting 'joinLobby' for ID ${lobbyId} with name ${nameToEmit}`);
        gameState.socket.emit('joinLobby', { lobbyId, playerName: nameToEmit });
        if(gameState.elements.lobbyErrorMessage) gameState.elements.lobbyErrorMessage.textContent = '';
    } else {
        console.error('Socket: Cannot emit joinLobby, not connected.');
        if (socketDependencies?.ui?.showGlobalNotification) {
            socketDependencies.ui.showGlobalNotification("Nicht mit Server verbunden.", "error");
        }
    }
}

export function emitSelectCategory(category) {
    if (gameState.socket && gameState.socket.connected && getIsHost()) {
        console.log(`Socket: Emitting 'selectCategory': ${category}`);
        gameState.socket.emit('selectCategory', { category });
    } else {
        console.warn('Socket: Cannot emit selectCategory. Not connected or not host.');
    }
}

export function emitStartGame() {
    if (gameState.socket && gameState.socket.connected && getIsHost()) {
        console.log("Socket: Emitting 'startGame'");
        gameState.socket.emit('startGame');
        if (gameState.elements.startGameError) gameState.elements.startGameError.textContent = '';
    } else {
        console.error('Socket: Cannot emit startGame. Not connected or not host.');
        if (socketDependencies?.ui?.showGlobalNotification) {
            socketDependencies.ui.showGlobalNotification("Spiel konnte nicht gestartet werden.", "error");
        }
    }
}

export function emitSubmitAnswer(answer) {
    if (gameState.socket && gameState.socket.connected) {
        console.log(`Socket: Emitting 'submitAnswer': ${answer}`);
        gameState.socket.emit('submitAnswer', { answer });
    } else {
        console.error('Socket: Cannot emit submitAnswer, not connected.');
        if (socketDependencies?.ui?.showGlobalNotification) {
            socketDependencies.ui.showGlobalNotification("Antwort konnte nicht gesendet werden.", "error");
        }
    }
}

export function emitLeaveLobby() {
    if (gameState.socket && gameState.socket.connected) {
        console.log("Socket: Emitting 'leaveLobby'");
        gameState.socket.emit('leaveLobby');
    }
    // Client-side state cleanup is important regardless of socket state
    clearLobbyDetails();
    if (socketDependencies?.game?.resetGameState) {
        socketDependencies.game.resetGameState();
    }
    // Screen transition is handled by the caller of this function or specific logic
}

// Helper for "New Lobby" button on final results
function emitLeaveLobbyAndShowConnect() {
    emitLeaveLobby(); // Emits and clears local lobby state
    if (socketDependencies?.ui?.showScreen) {
        socketDependencies.ui.showScreen('lobbyConnect');
    }
}

console.log('socket.js loaded');