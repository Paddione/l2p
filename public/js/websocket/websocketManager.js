import { io } from '/node_modules/socket.io-client/dist/socket.io.esm.min.js';
import { API_BASE_URL } from '../utils/constants.js';

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.isAuthenticated = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.eventHandlers = new Map();
        this.currentLobbyCode = null;
        this.currentGameCode = null;
    }

    /**
     * Initialize WebSocket connection
     * @param {string} token - JWT token for authentication
     * @param {string} username - Username for authentication
     */
    async connect(token, username) {
        try {
            console.log('🔌 Initializing WebSocket connection...');
            
            // Get the WebSocket URL from API base URL
            const wsUrl = API_BASE_URL.replace('/api', '').replace('http', 'ws');
            
            this.socket = io(wsUrl, {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay,
                autoConnect: false
            });

            this.setupEventHandlers();
            
            // Connect to server
            this.socket.connect();
            
            // Wait for connection
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('WebSocket connection timeout'));
                }, 10000);

                this.socket.once('connect', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    console.log('✅ WebSocket connected');
                    resolve();
                });

                this.socket.once('connect_error', (error) => {
                    clearTimeout(timeout);
                    console.error('❌ WebSocket connection failed:', error);
                    reject(error);
                });
            });

            // Authenticate
            await this.authenticate(token, username);
            
            console.log('🔌 WebSocket initialization complete');
            return true;

        } catch (error) {
            console.error('❌ WebSocket initialization failed:', error);
            this.cleanup();
            throw error;
        }
    }

    /**
     * Authenticate with the server
     * @param {string} token - JWT token
     * @param {string} username - Username
     */
    async authenticate(token, username) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Authentication timeout'));
            }, 5000);

            this.socket.once('authenticated', (data) => {
                clearTimeout(timeout);
                this.isAuthenticated = true;
                console.log('✅ WebSocket authenticated:', data.username);
                resolve(data);
            });

            this.socket.once('authentication_error', (error) => {
                clearTimeout(timeout);
                console.error('❌ WebSocket authentication failed:', error);
                reject(new Error(error.error || 'Authentication failed'));
            });

            this.socket.emit('authenticate', { token, username });
        });
    }

    /**
     * Setup WebSocket event handlers
     */
    setupEventHandlers() {
        this.socket.on('connect', () => {
            console.log('🔌 WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 WebSocket disconnected:', reason);
            this.isConnected = false;
            this.isAuthenticated = false;
            this.emit('disconnected', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error);
            this.reconnectAttempts++;
            this.emit('connection_error', error);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
            this.reconnectAttempts = 0;
            this.emit('reconnected', attemptNumber);
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('❌ WebSocket reconnection error:', error);
            this.emit('reconnect_error', error);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('❌ WebSocket reconnection failed');
            this.emit('reconnect_failed');
        });

        // Lobby events
        this.socket.on('lobby_updated', (data) => {
            console.log('📢 Lobby updated:', data.code);
            this.emit('lobby_updated', data);
        });

        this.socket.on('lobby_joined', (data) => {
            console.log('👥 Lobby joined:', data.lobbyCode);
            this.currentLobbyCode = data.lobbyCode;
            this.emit('lobby_joined', data);
        });

        this.socket.on('lobby_left', (data) => {
            console.log('👥 Lobby left:', data.lobbyCode);
            if (this.currentLobbyCode === data.lobbyCode) {
                this.currentLobbyCode = null;
            }
            this.emit('lobby_left', data);
        });

        // Game events
        this.socket.on('game_updated', (data) => {
            console.log('🎮 Game updated:', data.code);
            this.emit('game_updated', data);
        });

        this.socket.on('game_joined', (data) => {
            console.log('🎮 Game joined:', data.lobbyCode);
            this.currentGameCode = data.lobbyCode;
            this.emit('game_joined', data);
        });

        this.socket.on('game_left', (data) => {
            console.log('🎮 Game left:', data.lobbyCode);
            if (this.currentGameCode === data.lobbyCode) {
                this.currentGameCode = null;
            }
            this.emit('game_left', data);
        });

        // Notification events
        this.socket.on('notification', (notification) => {
            console.log('📬 Notification received:', notification);
            this.emit('notification', notification);
        });

        // Error events
        this.socket.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            this.emit('error', error);
        });

        // Heartbeat
        this.socket.on('pong', () => {
            this.emit('pong');
        });
    }

    /**
     * Join a lobby room
     * @param {string} lobbyCode - Lobby code
     */
    joinLobby(lobbyCode) {
        if (!this.isAuthenticated) {
            console.warn('⚠️ Cannot join lobby - not authenticated');
            return;
        }

        console.log('👥 Joining lobby:', lobbyCode);
        this.socket.emit('join_lobby', { lobbyCode });
    }

    /**
     * Leave a lobby room
     * @param {string} lobbyCode - Lobby code
     */
    leaveLobby(lobbyCode) {
        if (!this.isAuthenticated) {
            console.warn('⚠️ Cannot leave lobby - not authenticated');
            return;
        }

        console.log('👥 Leaving lobby:', lobbyCode);
        this.socket.emit('leave_lobby', { lobbyCode });
    }

    /**
     * Join a game room
     * @param {string} lobbyCode - Lobby code
     */
    joinGame(lobbyCode) {
        if (!this.isAuthenticated) {
            console.warn('⚠️ Cannot join game - not authenticated');
            return;
        }

        console.log('🎮 Joining game:', lobbyCode);
        this.socket.emit('join_game', { lobbyCode });
    }

    /**
     * Leave a game room
     * @param {string} lobbyCode - Lobby code
     */
    leaveGame(lobbyCode) {
        if (!this.isAuthenticated) {
            console.warn('⚠️ Cannot leave game - not authenticated');
            return;
        }

        console.log('🎮 Leaving game:', lobbyCode);
        this.socket.emit('leave_game', { lobbyCode });
    }

    /**
     * Send heartbeat ping
     */
    ping() {
        if (this.isConnected) {
            this.socket.emit('ping');
        }
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).delete(handler);
        }
    }

    /**
     * Emit event to all handlers
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.socket) {
            console.log('🔌 Disconnecting WebSocket...');
            this.socket.disconnect();
        }
        this.cleanup();
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.isConnected = false;
        this.isAuthenticated = false;
        this.currentLobbyCode = null;
        this.currentGameCode = null;
        this.eventHandlers.clear();
        
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket = null;
        }
    }

    /**
     * Get connection status
     * @returns {Object} Connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            isAuthenticated: this.isAuthenticated,
            currentLobbyCode: this.currentLobbyCode,
            currentGameCode: this.currentGameCode,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    /**
     * Force reconnection
     */
    forceReconnect() {
        if (this.socket) {
            console.log('🔄 Forcing WebSocket reconnection...');
            this.socket.disconnect();
            this.socket.connect();
        }
    }
}

// Create singleton instance
const websocketManager = new WebSocketManager();

export default websocketManager; 