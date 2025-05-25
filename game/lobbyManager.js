// game/lobbyManager.js

/**
 * @fileoverview Manages lobby state, player connections, and lobby lifecycle.
 */

const { GAME_CONFIG } = require('./config');
const { generateLobbyId, createLobby, createPlayer } = require('./gameLogic');

// Global lobbies storage
const lobbies = {};

/**
 * Creates a new lobby with a host player.
 * @param {string} hostId - The host player ID.
 * @param {string} hostName - The host player name.
 * @param {string} hostSocketId - The host socket ID.
 * @returns {Object} The created lobby object.
 */
function createNewLobby(hostId, hostName, hostSocketId) {
    const lobbyId = generateLobbyId(lobbies);
    const lobby = createLobby(lobbyId, hostId, hostName, hostSocketId);
    lobbies[lobbyId] = lobby;

    console.log(`✅ Lobby ${lobbyId} created by ${hostName} (${hostId})`);
    return lobby;
}

/**
 * Adds a player to an existing lobby.
 * @param {string} lobbyId - The lobby ID to join.
 * @param {string} playerId - The player ID.
 * @param {string} playerName - The player name.
 * @param {string} socketId - The player's socket ID.
 * @returns {Object|null} The lobby object if successful, null if failed.
 */
function addPlayerToLobby(lobbyId, playerId, playerName, socketId) {
    const normalizedLobbyId = lobbyId.toUpperCase();
    const lobby = lobbies[normalizedLobbyId];

    if (!lobby) {
        console.log(`❌ Lobby ${normalizedLobbyId} not found`);
        return null;
    }

    if (lobby.gameState === 'playing') {
        console.log(`❌ Cannot join lobby ${normalizedLobbyId} - game in progress`);
        return null;
    }

    // Check if player already exists (reconnection)
    if (lobby.players[playerId]) {
        lobby.players[playerId].socketId = socketId;
        lobby.players[playerId].connected = true;
        lobby.players[playerId].name = playerName; // Update name if changed
        console.log(`🔄 Player ${playerName} reconnected to lobby ${normalizedLobbyId}`);
    } else {
        // New player joining
        lobby.players[playerId] = createPlayer(playerId, playerName, socketId);
        console.log(`✅ Player ${playerName} joined lobby ${normalizedLobbyId}`);
    }

    return lobby;
}

/**
 * Removes a player from a lobby.
 * @param {string} lobbyId - The lobby ID.
 * @param {string} playerId - The player ID to remove.
 * @returns {Object|null} Updated lobby or null if lobby was deleted.
 */
function removePlayerFromLobby(lobbyId, playerId) {
    const lobby = lobbies[lobbyId];
    if (!lobby || !lobby.players[playerId]) {
        return lobby;
    }

    // Remove player
    delete lobby.players[playerId];
    console.log(`👋 Player ${playerId} left lobby ${lobbyId}`);

    // If lobby is empty, delete it
    if (Object.keys(lobby.players).length === 0) {
        delete lobbies[lobbyId];
        console.log(`🗑️ Lobby ${lobbyId} deleted (empty)`);
        return null;
    }

    // If host left, assign new host
    if (lobby.hostId === playerId) {
        const remainingPlayers = Object.keys(lobby.players);
        if (remainingPlayers.length > 0) {
            lobby.hostId = remainingPlayers[0];
            console.log(`👑 New host for lobby ${lobbyId}: ${lobby.hostId}`);
        }
    }

    return lobby;
}

/**
 * Marks a player as disconnected but keeps them in the lobby.
 * @param {string} lobbyId - The lobby ID.
 * @param {string} playerId - The player ID.
 * @param {string} socketId - The socket ID to verify.
 */
function markPlayerDisconnected(lobbyId, playerId, socketId) {
    const lobby = lobbies[lobbyId];
    if (lobby && lobby.players[playerId] && lobby.players[playerId].socketId === socketId) {
        lobby.players[playerId].connected = false;
        lobby.players[playerId].socketId = null;
        console.log(`📴 Player ${playerId} marked as disconnected in lobby ${lobbyId}`);

        // Schedule cleanup for empty lobbies
        setTimeout(() => {
            const currentLobby = lobbies[lobbyId];
            if (currentLobby) {
                const connectedPlayers = Object.values(currentLobby.players).filter(p => p.connected);
                if (connectedPlayers.length === 0) {
                    delete lobbies[lobbyId];
                    console.log(`🗑️ Lobby ${lobbyId} deleted (no connected players)`);
                }
            }
        }, GAME_CONFIG.PLAYER_DISCONNECT_GRACE_PERIOD);
    }
}

/**
 * Gets a lobby by ID.
 * @param {string} lobbyId - The lobby ID.
 * @returns {Object|undefined} The lobby object or undefined.
 */
function getLobby(lobbyId) {
    return lobbies[lobbyId];
}

/**
 * Gets all lobbies (for debugging/admin purposes).
 * @returns {Object} All lobbies.
 */
function getAllLobbies() {
    return lobbies;
}

/**
 * Updates lobby category selection.
 * @param {string} lobbyId - The lobby ID.
 * @param {string} category - The selected category.
 * @returns {boolean} True if successful.
 */
function updateLobbyCategory(lobbyId, category) {
    const lobby = lobbies[lobbyId];
    if (!lobby) return false;

    lobby.selectedCategory = category;
    console.log(`✅ Category selected for lobby ${lobbyId}: ${category}`);
    return true;
}

/**
 * Prepares lobby data for client transmission.
 * @param {Object} lobby - The lobby object.
 * @returns {Object} Sanitized lobby data for clients.
 */
function prepareLobbyDataForClient(lobby) {
    return {
        lobbyId: lobby.id,
        hostId: lobby.hostId,
        players: lobby.players,
        gameState: lobby.gameState,
        selectedCategory: lobby.selectedCategory
    };
}

/**
 * Cleans up finished lobbies after a delay.
 * @param {string} lobbyId - The lobby ID to clean up.
 */
function scheduleLobbyCleanup(lobbyId) {
    setTimeout(() => {
        if (lobbies[lobbyId]) {
            delete lobbies[lobbyId];
            console.log(`🗑️ Lobby ${lobbyId} deleted after game completion`);
        }
    }, GAME_CONFIG.LOBBY_CLEANUP_DELAY);
}

/**
 * Gets the number of active lobbies.
 * @returns {number} Number of active lobbies.
 */
function getActiveLobbyCount() {
    return Object.keys(lobbies).length;
}

/**
 * Gets connected player count across all lobbies.
 * @returns {number} Total connected players.
 */
function getTotalConnectedPlayers() {
    let total = 0;
    Object.values(lobbies).forEach(lobby => {
        total += Object.values(lobby.players).filter(p => p.connected).length;
    });
    return total;
}

module.exports = {
    createNewLobby,
    addPlayerToLobby,
    removePlayerFromLobby,
    markPlayerDisconnected,
    getLobby,
    getAllLobbies,
    updateLobbyCategory,
    prepareLobbyDataForClient,
    scheduleLobbyCleanup,
    getActiveLobbyCount,
    getTotalConnectedPlayers
};