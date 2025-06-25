const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socket
        this.lobbyRooms = new Map(); // lobbyCode -> Set of userIds
        this.gameRooms = new Map(); // lobbyCode -> Set of userIds
    }

    /**
     * Initialize WebSocket server
     * @param {Object} server - HTTP server instance
     */
    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.NODE_ENV === 'production' ?
                    ['https://game.korczewski.de', 'http://10.0.0.44', 'http://localhost:8080'] :
                    ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://10.0.0.44'],
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.setupEventHandlers();
        console.log('🔌 WebSocket service initialized');
    }

    /**
     * Setup Socket.IO event handlers
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            // Authentication middleware
            socket.on('authenticate', async (data) => {
                try {
                    const { token, username } = data;
                    
                    // Verify JWT token
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    
                    if (decoded.username !== username) {
                        throw new Error('Token username mismatch');
                    }

                    // Store user info in socket
                    socket.userId = decoded.userId;
                    socket.username = decoded.username;
                    socket.authenticated = true;

                    // Store connection in map
                    this.connectedUsers.set(socket.userId, socket);

                    console.log(`✅ User authenticated: ${username} (${socket.userId})`);
                    socket.emit('authenticated', { success: true, username });

                } catch (error) {
                    console.error('❌ Authentication failed:', error.message);
                    socket.emit('authentication_error', { error: 'Authentication failed' });
                    socket.disconnect();
                }
            });

            // Lobby events
            socket.on('join_lobby', (data) => {
                if (!socket.authenticated) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }

                const { lobbyCode } = data;
                this.joinLobbyRoom(socket, lobbyCode);
            });

            socket.on('leave_lobby', (data) => {
                if (!socket.authenticated) return;
                
                const { lobbyCode } = data;
                this.leaveLobbyRoom(socket, lobbyCode);
            });

            // Game events
            socket.on('join_game', (data) => {
                if (!socket.authenticated) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }

                const { lobbyCode } = data;
                this.joinGameRoom(socket, lobbyCode);
            });

            socket.on('leave_game', (data) => {
                if (!socket.authenticated) return;
                
                const { lobbyCode } = data;
                this.leaveGameRoom(socket, lobbyCode);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
                this.handleDisconnection(socket);
            });

            // Heartbeat for connection monitoring
            socket.on('ping', () => {
                socket.emit('pong');
            });
        });
    }

    /**
     * Join a lobby room
     * @param {Object} socket - Socket instance
     * @param {string} lobbyCode - Lobby code
     */
    joinLobbyRoom(socket, lobbyCode) {
        const roomName = `lobby_${lobbyCode}`;
        socket.join(roomName);

        if (!this.lobbyRooms.has(lobbyCode)) {
            this.lobbyRooms.set(lobbyCode, new Set());
        }
        this.lobbyRooms.get(lobbyCode).add(socket.userId);

        console.log(`👥 User ${socket.username} joined lobby ${lobbyCode}`);
        socket.emit('lobby_joined', { lobbyCode });
    }

    /**
     * Leave a lobby room
     * @param {Object} socket - Socket instance
     * @param {string} lobbyCode - Lobby code
     */
    leaveLobbyRoom(socket, lobbyCode) {
        const roomName = `lobby_${lobbyCode}`;
        socket.leave(roomName);

        if (this.lobbyRooms.has(lobbyCode)) {
            this.lobbyRooms.get(lobbyCode).delete(socket.userId);
            if (this.lobbyRooms.get(lobbyCode).size === 0) {
                this.lobbyRooms.delete(lobbyCode);
            }
        }

        console.log(`👥 User ${socket.username} left lobby ${lobbyCode}`);
        socket.emit('lobby_left', { lobbyCode });
    }

    /**
     * Join a game room
     * @param {Object} socket - Socket instance
     * @param {string} lobbyCode - Lobby code
     */
    joinGameRoom(socket, lobbyCode) {
        const roomName = `game_${lobbyCode}`;
        socket.join(roomName);

        if (!this.gameRooms.has(lobbyCode)) {
            this.gameRooms.set(lobbyCode, new Set());
        }
        this.gameRooms.get(lobbyCode).add(socket.userId);

        console.log(`🎮 User ${socket.username} joined game ${lobbyCode}`);
        socket.emit('game_joined', { lobbyCode });
    }

    /**
     * Leave a game room
     * @param {Object} socket - Socket instance
     * @param {string} lobbyCode - Lobby code
     */
    leaveGameRoom(socket, lobbyCode) {
        const roomName = `game_${lobbyCode}`;
        socket.leave(roomName);

        if (this.gameRooms.has(lobbyCode)) {
            this.gameRooms.get(lobbyCode).delete(socket.userId);
            if (this.gameRooms.get(lobbyCode).size === 0) {
                this.gameRooms.delete(lobbyCode);
            }
        }

        console.log(`🎮 User ${socket.username} left game ${lobbyCode}`);
        socket.emit('game_left', { lobbyCode });
    }

    /**
     * Handle client disconnection
     * @param {Object} socket - Socket instance
     */
    handleDisconnection(socket) {
        if (socket.authenticated && socket.userId) {
            this.connectedUsers.delete(socket.userId);

            // Remove from all lobby rooms
            for (const [lobbyCode, users] of this.lobbyRooms.entries()) {
                if (users.has(socket.userId)) {
                    users.delete(socket.userId);
                    if (users.size === 0) {
                        this.lobbyRooms.delete(lobbyCode);
                    }
                }
            }

            // Remove from all game rooms
            for (const [lobbyCode, users] of this.gameRooms.entries()) {
                if (users.has(socket.userId)) {
                    users.delete(socket.userId);
                    if (users.size === 0) {
                        this.gameRooms.delete(lobbyCode);
                    }
                }
            }

            console.log(`👋 User ${socket.username} fully disconnected`);
        }
    }

    /**
     * Broadcast lobby update to all users in a lobby
     * @param {string} lobbyCode - Lobby code
     * @param {Object} data - Lobby data
     */
    broadcastLobbyUpdate(lobbyCode, data) {
        const roomName = `lobby_${lobbyCode}`;
        this.io.to(roomName).emit('lobby_updated', data);
        console.log(`📢 Broadcasted lobby update to ${roomName}`);
    }

    /**
     * Broadcast game state update to all users in a game
     * @param {string} lobbyCode - Lobby code
     * @param {Object} data - Game state data
     */
    broadcastGameUpdate(lobbyCode, data) {
        const roomName = `game_${lobbyCode}`;
        this.io.to(roomName).emit('game_updated', data);
        console.log(`🎮 Broadcasted game update to ${roomName}`);
    }

    /**
     * Send notification to specific user
     * @param {number} userId - User ID
     * @param {Object} notification - Notification data
     */
    sendNotificationToUser(userId, notification) {
        const socket = this.connectedUsers.get(userId);
        if (socket) {
            socket.emit('notification', notification);
            console.log(`📬 Sent notification to user ${userId}`);
        }
    }

    /**
     * Send notification to all users in a lobby
     * @param {string} lobbyCode - Lobby code
     * @param {Object} notification - Notification data
     */
    sendNotificationToLobby(lobbyCode, notification) {
        const roomName = `lobby_${lobbyCode}`;
        this.io.to(roomName).emit('notification', notification);
        console.log(`📢 Sent notification to lobby ${lobbyCode}`);
    }

    /**
     * Send notification to all users in a game
     * @param {string} lobbyCode - Lobby code
     * @param {Object} notification - Notification data
     */
    sendNotificationToGame(lobbyCode, notification) {
        const roomName = `game_${lobbyCode}`;
        this.io.to(roomName).emit('notification', notification);
        console.log(`🎮 Sent notification to game ${lobbyCode}`);
    }

    /**
     * Get connection statistics
     * @returns {Object} Connection statistics
     */
    getStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            lobbyRooms: this.lobbyRooms.size,
            gameRooms: this.gameRooms.size,
            totalLobbyUsers: Array.from(this.lobbyRooms.values()).reduce((sum, users) => sum + users.size, 0),
            totalGameUsers: Array.from(this.gameRooms.values()).reduce((sum, users) => sum + users.size, 0)
        };
    }

    /**
     * Check if user is connected
     * @param {number} userId - User ID
     * @returns {boolean} True if user is connected
     */
    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }

    /**
     * Get users in lobby
     * @param {string} lobbyCode - Lobby code
     * @returns {Set} Set of user IDs
     */
    getLobbyUsers(lobbyCode) {
        return this.lobbyRooms.get(lobbyCode) || new Set();
    }

    /**
     * Get users in game
     * @param {string} lobbyCode - Lobby code
     * @returns {Set} Set of user IDs
     */
    getGameUsers(lobbyCode) {
        return this.gameRooms.get(lobbyCode) || new Set();
    }
}

// Create singleton instance
const websocketService = new WebSocketService();

module.exports = websocketService; 