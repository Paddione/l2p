/**
 * Lobby Storage Module - Updated to use API backend
 * This is now a wrapper around the API client for lobby operations
 */

import apiClient from '../api/apiClient.js';

class LobbyStorage {
    constructor() {
        // This class now acts as a wrapper around the API
    }

    /**
     * Gets all active lobbies
     * @returns {Promise<Object[]>} List of lobbies
     */
    async getAllLobbies() {
        try {
            const lobbies = await apiClient.request('GET', '/lobbies/list');
            return Array.isArray(lobbies) ? lobbies : [];
        } catch (error) {
            console.error('Failed to get lobbies:', error);
            // Return empty array for non-critical errors
            if (error.status === 502 || error.status === 503 || error.status === 504) {
                console.warn('Server temporarily unavailable, returning empty lobby list');
                return [];
            }
            throw new Error('Unable to fetch lobby list. Please try again later.');
        }
    }

    /**
     * Gets a specific lobby
     * @param {string} code - Lobby code
     * @returns {Promise<Object|null>} Lobby data or null if not found
     */
    async getLobby(code) {
        try {
            return await apiClient.request('GET', `/lobbies/${code}`);
        } catch (error) {
            // Return null for expected "not found" case
            if (error.status === 404) {
                return null;
            }
            
            // Log but don't throw for temporary server issues
            if (error.status === 502 || error.status === 503 || error.status === 504) {
                console.warn(`Server temporarily unavailable while getting lobby ${code}:`, error);
                throw new Error('The game server is temporarily unavailable. Please wait a moment and try again.');
            }

            console.error('Failed to get lobby:', error);
            throw new Error('Unable to fetch lobby information. Please try again later.');
        }
    }

    /**
     * Sets/updates a lobby
     * @param {string} code - Lobby code
     * @param {Object} lobbyData - Lobby data
     * @returns {Promise<Object>} Updated lobby data
     */
    async setLobby(code, lobbyData) {
        try {
            return await apiClient.request('PUT', `/lobbies/${code}`, lobbyData);
        } catch (error) {
            console.error('Failed to set lobby:', error);
            
            if (error.status === 502 || error.status === 503 || error.status === 504) {
                throw new Error('Unable to update lobby information due to server issues. Please try again in a moment.');
            }

            throw new Error('Failed to update lobby information. Please try again.');
        }
    }

    /**
     * Removes a lobby
     * @param {string} code - Lobby code
     * @returns {Promise<void>}
     */
    async removeLobby(code) {
        try {
            await apiClient.request('DELETE', `/lobbies/${code}`);
        } catch (error) {
            console.error('Failed to remove lobby:', error);
            
            // For server issues, we can assume the lobby will be cleaned up eventually
            if (error.status === 502 || error.status === 503 || error.status === 504) {
                console.warn('Server temporarily unavailable, lobby will be cleaned up later');
                return;
            }

            throw new Error('Failed to close the lobby. Please try again.');
        }
    }

    /**
     * Checks if a lobby exists
     * @param {string} code - Lobby code
     * @returns {Promise<boolean>}
     */
    async hasLobby(code) {
        try {
            const lobby = await this.getLobby(code);
            return lobby !== null;
        } catch (error) {
            // For server issues, we assume the lobby doesn't exist
            if (error.status === 502 || error.status === 503 || error.status === 504) {
                console.warn('Server temporarily unavailable while checking lobby existence');
                return false;
            }
            return false;
        }
    }

    /**
     * Creates a new lobby
     * @param {Object} host - Host player data
     * @returns {Promise<Object>} Created lobby data
     */
    async createLobby(host) {
        try {
            return await apiClient.request('POST', '/lobbies/create', {
                character: host.character
            });
        } catch (error) {
            console.error('Failed to create lobby:', error);
            
            if (error.status === 502 || error.status === 503 || error.status === 504) {
                throw new Error('Unable to create lobby due to server issues. Please try again in a few minutes.');
            }

            throw new Error('Failed to create lobby. Please try again.');
        }
    }

    /**
     * Joins a lobby
     * @param {string} code - Lobby code
     * @param {Object} player - Player data
     * @returns {Promise<Object>} Updated lobby data
     */
    async joinLobby(code, player) {
        try {
            return await apiClient.request('POST', `/lobbies/${code}/join`, {
                character: player.character
            });
        } catch (error) {
            console.error('Failed to join lobby:', error);
            
            if (error.status === 502 || error.status === 503 || error.status === 504) {
                throw new Error('Unable to join lobby due to server issues. Please try again in a moment.');
            }

            if (error.status === 404) {
                throw new Error('This lobby no longer exists. Please create a new lobby or join a different one.');
            }

            throw new Error('Failed to join lobby. Please try again.');
        }
    }

    /**
     * Leaves a lobby
     * @param {string} code - Lobby code
     * @param {string} username - Player username
     * @returns {Promise<Object>} Updated lobby data
     */
    async leaveLobby(code, username) {
        try {
            return await apiClient.request('POST', `/lobbies/${code}/leave`, { username });
        } catch (error) {
            console.error('Failed to leave lobby:', error);
            
            // For server issues, we can assume the player will be removed eventually
            if (error.status === 502 || error.status === 503 || error.status === 504) {
                console.warn('Server temporarily unavailable, player will be removed later');
                return null;
            }

            if (error.status === 404) {
                // If lobby doesn't exist, we can consider the player has left
                return null;
            }

            throw new Error('Failed to leave lobby. Please try again.');
        }
    }
}

// Export a singleton instance
const lobbyStorage = new LobbyStorage();
export default lobbyStorage;
