/**
 * Lobby Manager Module - Updated for API backend
 * Handles lobby creation, joining, and management via API
 */

import { GAME_SETTINGS, ERROR_MESSAGES, GAME_PHASES } from '../utils/constants.js';
import { generateLobbyCode } from '../utils/helpers.js';
import apiClient from '../api/apiClient.js';
import { questionSetsApi } from '../api/questionSetsApi.js';

export function initLobbyManager(storage, screenManager) {
    /**
     * Creates a new lobby via API
     * @param {Object} host - Host user data
     * @param {number} questionSetId - Question set ID to use for the lobby
     * @returns {Promise<Object>} - New lobby data
     */
    async function createLobby(host, questionSetId = null) {
        try {
            console.log('LobbyManager.createLobby called with host:', host, 'questionSetId:', questionSetId);
            
            const requestBody = {
                character: host.character
            };

            // Add question set if provided
            if (questionSetId) {
                requestBody.question_set_id = questionSetId;
            }
            
            console.log('Sending request body to API:', requestBody);
            
            const lobbyData = await apiClient.request('POST', '/lobbies/create', requestBody);
            
            if (!lobbyData || !lobbyData.code) {
                throw new Error('Invalid lobby data received from server');
            }
            
            return lobbyData;
        } catch (error) {
            console.error('Failed to create lobby:', error);
            throw new Error(error.message || 'Failed to create lobby');
        }
    }

    /**
     * Joins an existing lobby via API
     * @param {string} code - Lobby code
     * @param {Object} player - Player data
     * @returns {Promise<Object>} - Updated lobby data
     */
    async function joinLobby(code, player) {
        try {
            const lobbyData = await apiClient.request('POST', `/lobbies/${code}/join`, {
                character: player.character
            });
            
            if (!lobbyData) {
                throw new Error('Invalid lobby data received from server');
            }
            
            return lobbyData;
        } catch (error) {
            console.error('Failed to join lobby:', error);
            
            // Provide user-friendly error messages
            if (error.status === 404) {
                throw new Error('Lobby not found. Please check the code and try again.');
            } else if (error.status === 400) {
                if (error.message.includes('full')) {
                    throw new Error('This lobby is full. Please try joining a different lobby.');
                } else if (error.message.includes('already in progress')) {
                    throw new Error('This game has already started. Please create or join a different lobby.');
                } else if (error.message.includes('already in lobby')) {
                    throw new Error('You are already in this lobby.');
                }
            }
            
            throw new Error(error.message || 'Failed to join lobby');
        }
    }

    /**
     * Leaves a lobby via API
     * @param {string} code - Lobby code
     * @param {string} username - Player username
     * @returns {Promise<Object|null>} - Updated lobby data or null if lobby was closed
     */
    async function leaveLobby(code, username) {
        try {
            const result = await apiClient.request('POST', `/lobbies/${code}/leave`, {
                username
            });
            
            // If result.closed is true, the lobby was deleted
            if (result && result.closed) {
                return null;
            }
            
            return result;
        } catch (error) {
            console.error('Failed to leave lobby:', error);
            
            // If lobby doesn't exist, consider it as successfully left
            if (error.status === 404) {
                return null;
            }
            
            throw new Error(error.message || 'Failed to leave lobby');
        }
    }

    /**
     * Gets lobby data via API
     * @param {string} code - Lobby code
     * @returns {Promise<Object|null>} - Lobby data or null
     */
    async function getLobby(code) {
        try {
            return await apiClient.request('GET', `/lobbies/${code}`);
        } catch (error) {
            if (error.status === 404) {
                return null;
            }
            console.error('Failed to get lobby:', error);
            throw new Error(error.message || 'Failed to get lobby information');
        }
    }

    /**
     * Gets all active lobbies via API
     * @returns {Promise<Array>} - Array of lobby data
     */
    async function getAllLobbies() {
        try {
            const lobbies = await apiClient.request('GET', '/lobbies/list');
            return Array.isArray(lobbies) ? lobbies : [];
        } catch (error) {
            console.error('Failed to get lobbies:', error);
            // Return empty array for non-critical errors
            return [];
        }
    }

    /**
     * Updates player ready status via API
     * @param {string} code - Lobby code
     * @param {string} username - Player username
     * @param {boolean} ready - Ready status
     * @returns {Promise<Object>} - Updated lobby data
     */
    async function setPlayerReady(code, username, ready) {
        try {
            return await apiClient.request('POST', `/lobbies/${code}/ready`, {
                ready
            });
        } catch (error) {
            console.error('Failed to set player ready status:', error);
            throw new Error(error.message || 'Failed to update ready status');
        }
    }

    /**
     * Checks if all non-host players are ready
     * @param {Object} lobby - Lobby data
     * @returns {boolean} - Whether all non-host players are ready
     */
    function areAllPlayersReady(lobby) {
        if (!lobby || !lobby.players || lobby.players.length === 0) {
            return false;
        }
        
        // Filter out host players and check if all remaining players are ready
        const nonHostPlayers = lobby.players.filter(player => !player.is_host);
        
        // If there are no non-host players, consider all ready
        if (nonHostPlayers.length === 0) {
            return true;
        }
        
        return nonHostPlayers.every(player => player.ready);
    }

    /**
     * Updates lobby data via API
     * @param {string} code - Lobby code
     * @param {Object} updates - Data to update
     * @returns {Promise<Object>} - Updated lobby data
     */
    async function updateLobby(code, updates) {
        try {
            return await apiClient.request('PUT', `/lobbies/${code}`, updates);
        } catch (error) {
            console.error('Failed to update lobby:', error);
            throw new Error(error.message || 'Failed to update lobby');
        }
    }

    /**
     * Sets the question set for the lobby
     * @param {string} code - Lobby code
     * @param {number} questionSetId - Question set ID
     * @returns {Promise<Object>} - Updated lobby data
     */
    async function setQuestionSet(code, questionSetId) {
        try {
            console.log('Setting question set for lobby:', { code, questionSetId });
            
            // First, get the full question set data
            const questionSet = await questionSetsApi.getById(questionSetId);
            
            if (!questionSet) {
                throw new Error('Question set not found');
            }
            
            console.log('Retrieved question set:', questionSet);
            
            // Update the lobby with both the question set reference and the actual questions
            const updateData = {
                question_set_id: questionSetId,
                questions: questionSet.questions.slice(0, GAME_SETTINGS.MAX_QUESTIONS),
                catalog: questionSet.name
            };
            
            console.log('Updating lobby with data:', updateData);
            
            // Use the API to set the question set
            const updatedLobby = await questionSetsApi.setForLobby(code, questionSetId);
            
            console.log('Lobby updated successfully:', updatedLobby);
            
            return updatedLobby;
        } catch (error) {
            console.error('Failed to set question set:', error);
            throw new Error(error.message || 'Failed to set question set');
        }
    }

    /**
     * Sets the question catalog for the lobby
     * @param {string} code - Lobby code
     * @param {Object} catalog - Question catalog
     * @returns {Promise<Object>} - Updated lobby data
     */
    async function setCatalog(code, catalog) {
        if (!catalog || !catalog.questions || catalog.questions.length < GAME_SETTINGS.MIN_QUESTIONS) {
            throw new Error('Invalid question catalog');
        }

        try {
            return await updateLobby(code, {
                catalog: catalog.name,
                questions: catalog.questions.slice(0, GAME_SETTINGS.MAX_QUESTIONS)
            });
        } catch (error) {
            console.error('Failed to set catalog:', error);
            throw new Error(error.message || 'Failed to set question catalog');
        }
    }

    /**
     * Starts the game
     * @param {string} code - Lobby code
     * @returns {Promise<Object>} - Updated lobby data
     */
    async function startGame(code) {
        try {
            const lobby = await getLobby(code);
            
            if (!lobby) {
                throw new Error('Lobby not found');
            }

            const playerCount = lobby.players ? lobby.players.length : 0;
            if (playerCount < GAME_SETTINGS.MIN_PLAYERS) {
                throw new Error('Not enough players to start the game');
            }

            // Check if we need to load questions from the selected question set
            if ((!lobby.questions || lobby.questions.length === 0) && lobby.question_set) {
                console.log('Loading questions from question set:', lobby.question_set.id);
                
                try {
                    // Fetch the full question set with questions
                    const questionSetData = await questionSetsApi.getById(lobby.question_set.id);
                    
                    if (!questionSetData.questions || questionSetData.questions.length === 0) {
                        throw new Error('Selected question set has no questions');
                    }

                    // Update the lobby with the questions from the question set
                    const updatedLobby = await updateLobby(code, {
                        questions: questionSetData.questions.slice(0, GAME_SETTINGS.MAX_QUESTIONS),
                        catalog: questionSetData.name
                    });
                    
                    // Update our local lobby object
                    Object.assign(lobby, updatedLobby);
                    
                } catch (questionSetError) {
                    console.error('Failed to load questions from question set:', questionSetError);
                    throw new Error('Failed to load questions from selected question set');
                }
            }

            // Final check for questions
            if (!lobby.questions || lobby.questions.length === 0) {
                throw new Error('No questions available. Please select a question set first.');
            }

            if (!areAllPlayersReady(lobby)) {
                throw new Error('Not all players are ready');
            }

            return await updateLobby(code, {
                started: true,
                game_phase: GAME_PHASES.QUESTION
            });
        } catch (error) {
            console.error('Failed to start game:', error);
            throw new Error(error.message || 'Failed to start game');
        }
    }

    /**
     * Creates a single player game
     * @param {Object} player - Player data
     * @param {Object} catalog - Question catalog
     * @returns {Promise<Object>} - New lobby data
     */
    async function createSinglePlayerGame(player, catalog) {
        try {
            // Create a regular lobby first
            const lobby = await createLobby(player);
            
            // Set catalog and mark as single player
            const updatedLobby = await updateLobby(lobby.code, {
                catalog: catalog.name,
                questions: catalog.questions.slice(0, GAME_SETTINGS.MAX_QUESTIONS),
                isSinglePlayer: true
            });
            
            // Auto-ready the single player
            await setPlayerReady(lobby.code, player.username, true);
            
            return updatedLobby;
        } catch (error) {
            console.error('Failed to create single player game:', error);
            throw new Error(error.message || 'Failed to create single player game');
        }
    }

    /**
     * Closes a lobby via API
     * @param {string} code - Lobby code
     * @returns {Promise<void>}
     */
    async function closeLobby(code) {
        try {
            await apiClient.request('DELETE', `/lobbies/${code}`);
        } catch (error) {
            // If lobby doesn't exist, consider it successfully closed
            if (error.status === 404) {
                return;
            }
            console.error('Failed to close lobby:', error);
            throw new Error(error.message || 'Failed to close lobby');
        }
    }

    /**
     * Checks if a lobby exists
     * @param {string} code - Lobby code
     * @returns {Promise<boolean>} - Whether lobby exists
     */
    async function lobbyExists(code) {
        try {
            const lobby = await getLobby(code);
            return lobby !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generates a unique lobby code
     * @returns {Promise<string>} - Unique lobby code
     */
    async function generateUniqueLobbyCode() {
        let code;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            code = generateLobbyCode();
            const exists = await lobbyExists(code);
            attempts++;
            
            if (!exists) {
                return code;
            }
        } while (attempts < maxAttempts);
        
        throw new Error('Failed to generate unique lobby code after multiple attempts');
    }

    return {
        createLobby,
        joinLobby,
        leaveLobby,
        getLobby,
        getAllLobbies,
        setPlayerReady,
        areAllPlayersReady,
        updateLobby,
        setQuestionSet,
        setCatalog,
        startGame,
        createSinglePlayerGame,
        closeLobby,
        lobbyExists,
        generateUniqueLobbyCode
    };
}