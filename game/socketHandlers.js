// game/socketHandlers.js

/**
 * @fileoverview Socket.IO event handlers for the game server.
 */

const { auth, db } = require('./firebaseAdmin');
const { getPlayerName } = require('./gameLogic');
const {
    createNewLobby,
    addPlayerToLobby,
    removePlayerFromLobby,
    markPlayerDisconnected,
    getLobby,
    updateLobbyCategory,
    prepareLobbyDataForClient
} = require('./lobbyManager');
const {
    startGame,
    submitAnswer
} = require('./gameManager');

/**
 * Sets up Socket.IO authentication middleware and event handlers.
 * @param {Server} io - Socket.IO server instance.
 * @param {Object} questionsData - The loaded questions data.
 */
function setupSocketHandlers(io, questionsData) {
    console.log('🔌 Setting up Socket.IO handlers...');

    // Authentication middleware
    setupAuthMiddleware(io);

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`🔌 User connected to Game Server: ${socket.user?.uid || 'unknown'} (Socket ID: ${socket.id})`);

        setupSocketEventHandlers(socket, io, questionsData);
    });

    console.log('✅ Socket.IO handlers setup complete');
}

/**
 * Sets up Socket.IO authentication middleware.
 * @param {Server} io - Socket.IO server instance.
 */
function setupAuthMiddleware(io) {
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        const guestName = socket.handshake.query.playerName;

        console.log('🔍 Auth middleware - Token present:', !!token);
        console.log('🔍 Auth middleware - Guest name:', guestName);

        try {
            if (token) {
                // Authenticated user
                console.log('🔍 Verifying Firebase token...');
                const decodedToken = await auth.verifyIdToken(token);
                console.log('🔍 Token verified for user:', decodedToken.uid);

                socket.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    isGuest: false
                };

                // Get display name from user profile with fallback
                try {
                    const userProfileDoc = await db.collection('users').doc(decodedToken.uid).get();

                    if (userProfileDoc.exists && userProfileDoc.data().displayName) {
                        socket.user.displayName = userProfileDoc.data().displayName;
                    } else if (decodedToken.email) {
                        socket.user.displayName = decodedToken.email.split('@')[0];
                    } else {
                        socket.user.displayName = `User-${decodedToken.uid.substring(0, 5)}`;
                    }
                } catch (dbError) {
                    console.warn('⚠️ Could not fetch user profile, using fallback name:', dbError.message);
                    socket.user.displayName = decodedToken.email
                        ? decodedToken.email.split('@')[0]
                        : `User-${decodedToken.uid.substring(0, 5)}`;
                }

                console.log(`🔐 User authenticated: ${socket.user.uid} (${socket.user.displayName})`);
                next();

            } else {
                // Guest user - ensure we always have valid data
                const safeGuestName = (guestName && guestName.trim())
                    ? guestName.trim()
                    : `Guest-${socket.id.substring(0, 5)}`;

                socket.user = {
                    uid: `guest_${socket.id}`,
                    isGuest: true,
                    displayName: safeGuestName
                };

                console.log(`👤 Guest connected: ${socket.user.uid} (${socket.user.displayName})`);
                next();
            }
        } catch (error) {
            console.error('🔐 Auth error details:', error);

            // Send structured error data for client handling
            const authError = new Error('Authentication failed');
            authError.data = {
                type: 'AuthError',
                message: error.message || 'Invalid authentication token'
            };

            next(authError);
        }
    });
}

/**
 * Sets up event handlers for a connected socket.
 * @param {Socket} socket - The connected socket.
 * @param {Server} io - Socket.IO server instance.
 * @param {Object} questionsData - The loaded questions data.
 */
function setupSocketEventHandlers(socket, io, questionsData) {
    // Lobby creation
    socket.on('createLobby', (data) => {
        handleCreateLobby(socket, data);
    });

    // Lobby joining
    socket.on('joinLobby', (data) => {
        handleJoinLobby(socket, data);
    });

    // Lobby leaving
    socket.on('leaveLobby', () => {
        handleLeaveLobby(socket);
    });

    // Category selection
    socket.on('selectCategory', (data) => {
        handleSelectCategory(socket, io, data);
    });

    // Game starting
    socket.on('startGame', () => {
        handleStartGame(socket, io, questionsData);
    });

    // Answer submission
    socket.on('submitAnswer', (data) => {
        handleSubmitAnswer(socket, io, data);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        handleDisconnect(socket, io);
    });
}

/**
 * Handles lobby creation request.
 * @param {Socket} socket - The requesting socket.
 * @param {Object} data - Request data.
 */
function handleCreateLobby(socket, data) {
    console.log(`🎮 Create lobby request from ${socket.user?.uid || 'unknown'}:`, data);
    console.log('🔍 Socket user object:', socket.user);

    // Add validation for socket.user
    if (!socket.user || !socket.user.uid) {
        console.error('❌ Socket user not properly initialized');
        socket.emit('lobbyError', { message: 'Benutzer nicht authentifiziert' });
        return;
    }

    try {
        const playerName = data.playerName || getPlayerName(socket);
        const playerId = socket.user.uid;

        console.log(`🔍 Player details - ID: ${playerId}, Name: ${playerName}`);

        // Validate required data
        if (!playerId || !playerName || !socket.id) {
            console.error('❌ Missing required data for lobby creation:', { playerId, playerName, socketId: socket.id });
            socket.emit('lobbyError', { message: 'Unvollständige Spielerdaten' });
            return;
        }

        const lobby = createNewLobby(playerId, playerName, socket.id);
        console.log(`✅ Lobby created successfully:`, lobby.id);

        // Join socket to lobby room
        socket.join(lobby.id);
        socket.currentLobbyId = lobby.id;

        // Send response to creator
        socket.emit('lobbyCreated', {
            lobbyId: lobby.id,
            hostId: playerId,
            players: lobby.players
        });

        // Update all players in lobby
        emitLobbyUpdate(lobby.id, io);

    } catch (error) {
        console.error('❌ Error creating lobby - Full error:', error);
        console.error('❌ Error stack:', error.stack);

        // Send more specific error message
        let errorMessage = 'Fehler beim Erstellen der Lobby';
        if (error.message && error.message !== 'io is not defined') {
            errorMessage += `: ${error.message}`;
        }

        socket.emit('lobbyError', { message: errorMessage });
    }
}

/**
 * Handles lobby join request.
 * @param {Socket} socket - The requesting socket.
 * @param {Object} data - Request data.
 */
function handleJoinLobby(socket, data) {
    console.log(`🎮 Join lobby request from ${socket.user?.uid || 'unknown'}:`, data);

    // Validate socket.user
    if (!socket.user || !socket.user.uid) {
        console.error('❌ Socket user not properly initialized');
        socket.emit('lobbyError', { message: 'Benutzer nicht authentifiziert' });
        return;
    }

    const { lobbyId, playerName } = data;
    const playerId = socket.user.uid;
    const actualPlayerName = playerName || getPlayerName(socket);

    if (!lobbyId) {
        socket.emit('lobbyError', { message: 'Lobby ID ist erforderlich' });
        return;
    }

    try {
        const lobby = addPlayerToLobby(lobbyId, playerId, actualPlayerName, socket.id);

        if (!lobby) {
            socket.emit('lobbyError', { message: 'Lobby nicht gefunden oder Spiel läuft bereits' });
            return;
        }

        const normalizedLobbyId = lobbyId.toUpperCase();

        // Join socket to lobby room
        socket.join(normalizedLobbyId);
        socket.currentLobbyId = normalizedLobbyId;

        // Send response to joiner
        socket.emit('joinedLobby', {
            lobbyId: normalizedLobbyId,
            yourPlayerId: playerId,
            hostId: lobby.hostId,
            players: lobby.players
        });

        // Update all players in lobby
        emitLobbyUpdate(normalizedLobbyId, io);

    } catch (error) {
        console.error('❌ Error joining lobby:', error);
        socket.emit('lobbyError', { message: 'Fehler beim Beitreten zur Lobby' });
    }
}

/**
 * Handles lobby leave request.
 * @param {Socket} socket - The requesting socket.
 */
function handleLeaveLobby(socket) {
    console.log(`🚪 Leave lobby request from ${socket.user?.uid || 'unknown'}`);

    if (!socket.currentLobbyId) {
        return;
    }

    const lobbyId = socket.currentLobbyId;
    const playerId = socket.user?.uid;

    if (!playerId) {
        console.error('❌ No valid player ID for leave lobby');
        return;
    }

    try {
        const lobby = removePlayerFromLobby(lobbyId, playerId);

        socket.leave(lobbyId);
        socket.currentLobbyId = null;

        // Update remaining players if lobby still exists
        if (lobby) {
            emitLobbyUpdate(lobbyId, io);
        }

    } catch (error) {
        console.error('❌ Error leaving lobby:', error);
    }
}

/**
 * Handles category selection by host.
 * @param {Socket} socket - The requesting socket.
 * @param {Server} io - Socket.IO server instance.
 * @param {Object} data - Request data containing category.
 */
function handleSelectCategory(socket, io, data) {
    console.log(`📚 Category selection from ${socket.user?.uid || 'unknown'}:`, data);

    if (!socket.currentLobbyId || !socket.user?.uid) {
        return;
    }

    const lobby = getLobby(socket.currentLobbyId);
    const playerId = socket.user.uid;

    if (!lobby || lobby.hostId !== playerId) {
        socket.emit('error', { message: 'Nur der Host kann die Kategorie wählen' });
        return;
    }

    try {
        updateLobbyCategory(socket.currentLobbyId, data.category);

        // Notify all players in lobby
        io.to(socket.currentLobbyId).emit('categorySelectedByHost', {
            category: data.category
        });

        emitLobbyUpdate(socket.currentLobbyId, io);

    } catch (error) {
        console.error('❌ Error selecting category:', error);
        socket.emit('error', { message: 'Fehler beim Auswählen der Kategorie' });
    }
}

/**
 * Handles game start request by host.
 * @param {Socket} socket - The requesting socket.
 * @param {Server} io - Socket.IO server instance.
 * @param {Object} questionsData - The loaded questions data.
 */
function handleStartGame(socket, io, questionsData) {
    console.log(`🚀 Start game request from ${socket.user?.uid || 'unknown'}`);

    if (!socket.currentLobbyId || !socket.user?.uid) {
        return;
    }

    const lobby = getLobby(socket.currentLobbyId);
    const playerId = socket.user.uid;

    if (!lobby || lobby.hostId !== playerId) {
        socket.emit('error', { message: 'Nur der Host kann das Spiel starten' });
        return;
    }

    if (!lobby.selectedCategory) {
        socket.emit('error', { message: 'Bitte wählen Sie eine Kategorie' });
        return;
    }

    const playerCount = Object.keys(lobby.players).length;
    if (playerCount === 0) {
        socket.emit('error', { message: 'Mindestens ein Spieler erforderlich' });
        return;
    }

    try {
        const success = startGame(socket.currentLobbyId, questionsData, io);
        if (!success) {
            socket.emit('error', { message: 'Spiel konnte nicht gestartet werden' });
        }

    } catch (error) {
        console.error('❌ Error starting game:', error);
        socket.emit('error', { message: 'Fehler beim Starten des Spiels' });
    }
}

/**
 * Handles answer submission during a game.
 * @param {Socket} socket - The requesting socket.
 * @param {Server} io - Socket.IO server instance.
 * @param {Object} data - Request data containing the answer.
 */
function handleSubmitAnswer(socket, io, data) {
    console.log(`📝 Answer submitted by ${socket.user?.uid || 'unknown'}:`, data);

    if (!socket.currentLobbyId || !socket.user?.uid) {
        return;
    }

    const playerId = socket.user.uid;

    try {
        const feedback = submitAnswer(socket.currentLobbyId, playerId, data.answer, io);

        if (feedback) {
            // Send confirmation to player
            socket.emit('answerSubmitted', feedback);
        }

    } catch (error) {
        console.error('❌ Error submitting answer:', error);
    }
}

/**
 * Handles player disconnect.
 * @param {Socket} socket - The disconnecting socket.
 * @param {Server} io - Socket.IO server instance.
 */
function handleDisconnect(socket, io) {
    console.log(`🔌 User disconnected: ${socket.user?.uid || 'unknown'} (Socket ID: ${socket.id})`);

    if (socket.currentLobbyId && socket.user?.uid) {
        const playerId = socket.user.uid;

        try {
            markPlayerDisconnected(socket.currentLobbyId, playerId, socket.id);
            emitLobbyUpdate(socket.currentLobbyId, io);

        } catch (error) {
            console.error('❌ Error handling disconnect:', error);
        }
    }
}

/**
 * Emits lobby update to all players in a lobby.
 * @param {string} lobbyId - The lobby ID.
 * @param {Server} io - Socket.IO server instance.
 */
function emitLobbyUpdate(lobbyId, io) {
    const lobby = getLobby(lobbyId);
    if (!lobby) return;

    const lobbyData = prepareLobbyDataForClient(lobby);

    // Emit to all players in the lobby
    Object.keys(lobby.players).forEach(playerId => {
        const player = lobby.players[playerId];
        if (player.socketId) {
            io.to(player.socketId).emit('playerListUpdate', lobbyData);
        }
    });
}

module.exports = {
    setupSocketHandlers
};