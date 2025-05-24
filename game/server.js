// game/server.js
require('dotenv').config({ path: '.env.game' }); // Load environment variables

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { db, auth, admin } = require('./firebaseAdmin'); // Firebase Admin SDK

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            process.env.CORS_ORIGIN_GAME_CLIENT || "https://game.korczewski.de",
            process.env.AUTH_APP_URL || "https://auth.korczewski.de"
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true,
    transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3000;

// --- Game Configuration ---
const GAME_CONFIG = {
    QUESTIONS_PER_GAME: 10,
    DEFAULT_TIME_LIMIT: 60, // 60 seconds per question
    INITIAL_MULTIPLIER: 1
};

// --- Load Questions ---
let allQuestionsData = { categories: [], fallbackQuestions: [] };
try {
    const rawQuestions = fs.readFileSync(path.join(__dirname, 'questions.json'));
    allQuestionsData = JSON.parse(rawQuestions);
} catch (error) {
    console.error("Error loading questions.json, using fallback:", error);
    allQuestionsData.fallbackQuestions.push({
        category: "Error",
        text: "Default question due to loading error. What is 1+1?",
        options: ["1", "2", "3"],
        answer: "2",
        timeLimit: GAME_CONFIG.DEFAULT_TIME_LIMIT
    });
}

// --- Global Game State ---
const lobbies = {}; // { lobbyId: { players: { playerId: { ..., multiplier: 1 } }, hostId: '', category: '', questions: [], currentQuestionIndex: -1, scores: {}, gameActive: false, paused: false, timerInterval: null, questionTimer: 0 } }

// --- Middleware ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://www.gstatic.com/firebasejs/",
                "https://cdn.tailwindcss.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.tailwindcss.com"  // ADD THIS - This was missing!
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com"
            ],
            connectSrc: [
                "'self'",
                "*.googleapis.com",
                "*.firebaseio.com",
                "https://*.firebaseapp.com",
                "https://auth.korczewski.de",
                "https://game.korczewski.de",
                "wss://*.firebaseio.com",
                "ws://localhost:*",
                "http://localhost:*"
            ],
            frameSrc: ["'self'", "https://*.firebaseapp.com"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: process.env.CORS_ORIGIN_GAME_CLIENT || "http://localhost:3000", credentials: true }));
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies

// Rate limiting for API routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/game/api/', apiLimiter);

// --- Static File Serving ---


// Enhanced Config Injection Route
app.get('/', (req, res) => {
    // First, validate that all required env vars are loaded
app.use(express.static(path.join(__dirname, 'public')));
    const requiredEnvVars = [
        'AUTH_APP_URL',
        'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('CRITICAL: Missing required environment variables:', missingVars);
        console.error('Make sure your .env.game file exists and contains all required variables');
        return res.status(500).send(`
            <html><body style="font-family: Arial; padding: 20px; background: #1f2937; color: white;">
                <h1>Configuration Error</h1>
                <p>Missing required environment variables: ${missingVars.join(', ')}</p>
                <p>Please check your .env.game file and restart the server.</p>
            </body></html>
        `);
    }

    fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (err, htmlData) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('Error loading game page.');
        }

        // Build config object from environment variables
        const gameConfig = {
            authAppUrl: process.env.AUTH_APP_URL,
            firebaseConfig: {
                apiKey: process.env.FIREBASE_API_KEY,
                authDomain: process.env.FIREBASE_AUTH_DOMAIN,
                projectId: process.env.FIREBASE_PROJECT_ID,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.FIREBASE_APP_ID,
                measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
            }
        };

        console.log('✅ Injecting config from .env.game:', {
            authAppUrl: gameConfig.authAppUrl,
            projectId: gameConfig.firebaseConfig.projectId,
            authDomain: gameConfig.firebaseConfig.authDomain
        });

        // Create the injection script with error handling
        const configScript = `
            <script>
                window.GAME_CONFIG = ${JSON.stringify(gameConfig)};
                console.log('✅ Config loaded from server .env:', window.GAME_CONFIG);
            </script>
        `;

        // Replace the config injection placeholder
        const injectedHtml = htmlData.replace(
            '<!-- CONFIG_INJECTION_POINT -->',
            configScript
        );

        res.send(injectedHtml);
    });
});

// --- API Endpoints ---
app.get('/game/api/categories', (req, res) => {
    res.json(allQuestionsData.categories.map(cat => cat.name));
});

// This endpoint now relies on Firebase token verification if a user is "logged in" via Firebase
app.get('/game/api/user', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
            const decodedToken = await auth.verifyIdToken(idToken);
            // You could fetch more user details from Firestore using decodedToken.uid if needed
            const userProfile = await db.collection('users').doc(decodedToken.uid).get();
            let displayName = decodedToken.email; // Fallback
            if (userProfile.exists && userProfile.data().displayName) {
                displayName = userProfile.data().displayName;
            }

            return res.json({
                isAuthenticated: true,
                isGuest: false, // Firebase users are not guests in this context
                user: {
                    id: decodedToken.uid,
                    email: decodedToken.email,
                    name: displayName,
                    // Add other relevant user fields from decodedToken or your Firestore 'users' collection
                }
            });
        } catch (error) {
            console.warn('Token verification failed for /game/api/user:', error.message);
            // Token invalid or expired, treat as anonymous or guest
        }
    }
    // If no token or token invalid, treat as anonymous/guest
    res.json({ isAuthenticated: false, isGuest: true, guestId: 'guest-' + Date.now() }); // Simple guest ID
});

// --- Socket.IO Authentication Middleware ---
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token; // Expecting token from client
    if (token) {
        try {
            const decodedToken = await auth.verifyIdToken(token);
            socket.user = decodedToken; // Attach user info to socket object
            // Fetch user profile from Firestore to get displayName, etc.
            const userProfileDoc = await db.collection('users').doc(decodedToken.uid).get();
            if (userProfileDoc.exists) {
                socket.user.displayName = userProfileDoc.data().displayName || decodedToken.email.split('@')[0];
                socket.user.role = userProfileDoc.data().role || 'user';
            } else {
                // User exists in Firebase Auth but not in Firestore 'users' collection yet.
                // This can happen if Firestore profile creation failed or is deferred.
                // Create a basic profile now.
                const basicProfile = {
                    email: decodedToken.email,
                    displayName: decodedToken.email.split('@')[0],
                    role: 'user',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    isVerified: decodedToken.email_verified
                };
                await db.collection('users').doc(decodedToken.uid).set(basicProfile);
                socket.user.displayName = basicProfile.displayName;
                socket.user.role = basicProfile.role;
                console.log(`Created basic Firestore profile for UID: ${decodedToken.uid}`);
            }

            console.log(`Socket authenticated: ${socket.user.uid} (${socket.user.displayName})`);
            next();
        } catch (error) {
            console.error('Socket authentication error:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    } else {
        // Allow guest connections - assign a temporary guest ID
        // The client will need to handle the 'guest' state appropriately
        socket.user = {
            uid: `guest_${socket.id}`,
            isGuest: true,
            displayName: socket.handshake.query.playerName || `Guest-${socket.id.substring(0,5)}`
        };
        console.log(`Socket connected as guest: ${socket.user.uid} (${socket.user.displayName})`);
        next();
    }
});

// --- Socket.IO Event Handlers ---
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.uid} (Socket ID: ${socket.id})`);

    const emitLobbyUpdate = (lobbyId) => {
        if (lobbies[lobbyId]) {
            const lobbyData = {
                id: lobbyId,
                hostId: lobbies[lobbyId].hostId,
                players: Object.values(lobbies[lobbyId].players).map(p => ({
                    id: p.id,
                    name: p.name,
                    score: p.score,
                    streak: p.streak,
                    multiplier: p.multiplier || GAME_CONFIG.INITIAL_MULTIPLIER,
                    disconnected: p.disconnected
                })),
                category: lobbies[lobbyId].category,
                gameActive: lobbies[lobbyId].gameActive,
                isPaused: lobbies[lobbyId].isPaused,
            };
            io.to(lobbyId).emit('lobbyUpdate', lobbyData);
        }
    };

    const getPlayerName = (socket) => {
        return socket.user.displayName || socket.user.uid;
    }

    socket.on('createLobby', (data) => {
        const lobbyId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const playerId = socket.user.uid;
        const playerName = data.playerName || getPlayerName(socket); // Use provided name or fallback

        lobbies[lobbyId] = {
            players: {
                [playerId]: {
                    id: playerId,
                    name: playerName,
                    socketId: socket.id,
                    score: 0,
                    streak: 0,
                    multiplier: GAME_CONFIG.INITIAL_MULTIPLIER,
                    disconnected: false,
                    answers: {}
                }
            },
            hostId: playerId,
            category: null,
            questions: [],
            currentQuestionIndex: -1,
            scores: { [playerId]: 0 },
            gameActive: false,
            isPaused: false,
            timerInterval: null,
            questionTimer: 0,
            questionStartTime: 0,
            playerAnswers: {} // { questionIndex: { playerId: { answer, timeTaken } } }
        };
        socket.join(lobbyId);
        socket.emit('lobbyCreated', { lobbyId, playerId, hostId: playerId });
        emitLobbyUpdate(lobbyId);
        console.log(`Lobby ${lobbyId} created by ${playerName} (${playerId})`);
    });

    socket.on('joinLobby', (data) => {
        const { lobbyId, playerName: inputPlayerName } = data;
        const playerId = socket.user.uid;
        const playerName = inputPlayerName || getPlayerName(socket);

        if (lobbies[lobbyId]) {
            if (lobbies[lobbyId].gameActive && !lobbies[lobbyId].players[playerId]) {
                socket.emit('joinLobbyError', { message: 'Game already in progress. Cannot join.' });
                return;
            }

            // Reconnecting player
            if (lobbies[lobbyId].players[playerId]) {
                lobbies[lobbyId].players[playerId].disconnected = false;
                lobbies[lobbyId].players[playerId].socketId = socket.id; // Update socket ID
                console.log(`Player ${playerName} (${playerId}) reconnected to lobby ${lobbyId}`);
            } else {
                // New player joining
                lobbies[lobbyId].players[playerId] = {
                    id: playerId,
                    name: playerName,
                    socketId: socket.id,
                    score: 0,
                    streak: 0,
                    multiplier: GAME_CONFIG.INITIAL_MULTIPLIER,
                    disconnected: false,
                    answers: {}
                };
                lobbies[lobbyId].scores[playerId] = 0;
                console.log(`Player ${playerName} (${playerId}) joined lobby ${lobbyId}`);
            }

            socket.join(lobbyId);
            socket.emit('joinedLobby', { lobbyId, playerId, hostId: lobbies[lobbyId].hostId });
            emitLobbyUpdate(lobbyId);
            // If game is active and player reconnected, send current game state
            if (lobbies[lobbyId].gameActive && lobbies[lobbyId].currentQuestionIndex >= 0) {
                const currentQ = lobbies[lobbyId].questions[lobbies[lobbyId].currentQuestionIndex];
                if (currentQ) {
                    socket.emit('question', {
                        text: currentQ.text,
                        options: currentQ.options,
                        index: lobbies[lobbyId].currentQuestionIndex,
                        totalQuestions: lobbies[lobbyId].questions.length,
                        timeLimit: currentQ.timeLimit || GAME_CONFIG.DEFAULT_TIME_LIMIT,
                        category: lobbies[lobbyId].category
                    });
                    // Send current timer state
                    const timeElapsed = (Date.now() - lobbies[lobbyId].questionStartTime) / 1000;
                    const timeRemaining = Math.max(0, (currentQ.timeLimit || GAME_CONFIG.DEFAULT_TIME_LIMIT) - timeElapsed);
                    socket.emit('timerUpdate', { timeLeft: Math.round(timeRemaining) });
                }
                socket.emit('updateScores', lobbies[lobbyId].scores, collectStreaks(lobbyId), collectMultipliers(lobbyId));
            }

        } else {
            socket.emit('joinLobbyError', { message: 'Lobby not found.' });
        }
    });

    socket.on('checkExistingSession', () => {
        console.log(`Player ${socket.user.uid} requested checkExistingSession.`);
        socket.emit('sessionCheckResult', { inGame: false }); // Simplified
    });

    socket.on('hostSelectedCategory', ({ lobbyId, category }) => {
        if (lobbies[lobbyId] && lobbies[lobbyId].hostId === socket.user.uid) {
            lobbies[lobbyId].category = category;
            console.log(`Lobby ${lobbyId} category set to ${category} by host ${socket.user.uid}`);
            emitLobbyUpdate(lobbyId); // Notify all players of category change
            io.to(lobbyId).emit('categorySelectedByHost', { category });
        } else {
            socket.emit('errorGame', { message: 'Only host can select category or lobby not found.' });
        }
    });

    const startQuestionTimer = (lobbyId) => {
        const lobby = lobbies[lobbyId];
        if (!lobby || !lobby.gameActive || lobby.isPaused) return;

        const question = lobby.questions[lobby.currentQuestionIndex];
        if (!question) return;

        const timeLimit = question.timeLimit || GAME_CONFIG.DEFAULT_TIME_LIMIT;
        lobby.questionTimer = timeLimit;
        lobby.questionStartTime = Date.now(); // Record when question started

        if (lobby.timerInterval) clearInterval(lobby.timerInterval); // Clear existing timer

        lobby.timerInterval = setInterval(() => {
            if (lobby.isPaused) return; // Don't count down if paused

            lobby.questionTimer--;
            io.to(lobbyId).emit('timerUpdate', { timeLeft: lobby.questionTimer });

            if (lobby.questionTimer <= 0) {
                clearInterval(lobby.timerInterval);
                lobby.timerInterval = null;
                processAnswersAndNextQuestion(lobbyId);
            }
        }, 1000);
    };

    const processAnswersAndNextQuestion = (lobbyId) => {
        const lobby = lobbies[lobbyId];
        if (!lobby || !lobby.gameActive) return;

        // Ensure timer is cleared
        if (lobby.timerInterval) {
            clearInterval(lobby.timerInterval);
            lobby.timerInterval = null;
        }

        const question = lobby.questions[lobby.currentQuestionIndex];
        if (!question) {
            console.error(`Error: Question not found at index ${lobby.currentQuestionIndex} for lobby ${lobbyId}`);
            endGame(lobbyId); // End game if question is missing
            return;
        }

        const correctAnswer = question.answer;
        const questionPlayerAnswers = lobby.playerAnswers[lobby.currentQuestionIndex] || {};
        const timeLimit = question.timeLimit || GAME_CONFIG.DEFAULT_TIME_LIMIT;

        // Calculate scores for the current question with new system
        Object.keys(lobby.players).forEach(playerId => {
            const player = lobby.players[playerId];
            if (player.disconnected) return;

            const playerAnswerData = questionPlayerAnswers[playerId];
            let isCorrect = false;
            let pointsEarned = 0;

            if (playerAnswerData && playerAnswerData.answer === correctAnswer) {
                isCorrect = true;
                // Points = remaining time on clock
                const timeTaken = playerAnswerData.timeTaken || timeLimit;
                const remainingTime = Math.max(0, timeLimit - timeTaken);
                pointsEarned = Math.ceil(remainingTime); // Round up to avoid 0 points for last-second answers

                // Apply multiplier
                pointsEarned = pointsEarned * player.multiplier;

                // Update multiplier: +1 for correct answer
                player.multiplier = (player.multiplier || GAME_CONFIG.INITIAL_MULTIPLIER) + 1;
                player.streak = (player.streak || 0) + 1;
            } else {
                // Wrong answer or no answer
                pointsEarned = 0;
                // Update multiplier: -1 for wrong answer (minimum 1)
                player.multiplier = Math.max(1, (player.multiplier || GAME_CONFIG.INITIAL_MULTIPLIER) - 1);
                player.streak = 0; // Reset streak
            }

            player.score += pointsEarned;
            lobby.scores[playerId] = player.score;

            // Send individual answer result with new data
            io.to(player.socketId).emit('answerResult', {
                correct: isCorrect,
                correctAnswer: correctAnswer,
                yourAnswer: playerAnswerData ? playerAnswerData.answer : null,
                score: player.score,
                streak: player.streak,
                multiplier: player.multiplier,
                pointsEarned: pointsEarned,
                remainingTime: playerAnswerData ? Math.max(0, timeLimit - playerAnswerData.timeTaken) : 0
            });
        });

        // Announce correct answer and updated scores to everyone
        io.to(lobbyId).emit('questionOver', {
            correctAnswer: correctAnswer,
            scores: lobby.scores,
            streaks: collectStreaks(lobbyId),
            multipliers: collectMultipliers(lobbyId)
        });

        // Wait a bit before next question or game over
        setTimeout(() => {
            if (lobby.isPaused) return; // If paused during the timeout

            lobby.currentQuestionIndex++;
            if (lobby.currentQuestionIndex < lobby.questions.length && lobby.currentQuestionIndex < GAME_CONFIG.QUESTIONS_PER_GAME) {
                sendQuestion(lobbyId);
            } else {
                endGame(lobbyId);
            }
        }, 3000); // 3 second delay
    };

    const collectStreaks = (lobbyId) => {
        const lobby = lobbies[lobbyId];
        if (!lobby) return {};
        const streaks = {};
        Object.values(lobby.players).forEach(p => {
            streaks[p.id] = p.streak || 0;
        });
        return streaks;
    };

    const collectMultipliers = (lobbyId) => {
        const lobby = lobbies[lobbyId];
        if (!lobby) return {};
        const multipliers = {};
        Object.values(lobby.players).forEach(p => {
            multipliers[p.id] = p.multiplier || GAME_CONFIG.INITIAL_MULTIPLIER;
        });
        return multipliers;
    };

    const sendQuestion = (lobbyId) => {
        const lobby = lobbies[lobbyId];
        if (!lobby || !lobby.gameActive || lobby.isPaused || lobby.currentQuestionIndex < 0 || lobby.currentQuestionIndex >= lobby.questions.length) {
            return;
        }
        const question = lobby.questions[lobby.currentQuestionIndex];
        const timeLimit = question.timeLimit || GAME_CONFIG.DEFAULT_TIME_LIMIT;

        io.to(lobbyId).emit('question', {
            text: question.text,
            options: question.options,
            index: lobby.currentQuestionIndex,
            totalQuestions: Math.min(lobby.questions.length, GAME_CONFIG.QUESTIONS_PER_GAME),
            timeLimit: timeLimit,
            category: lobby.category
        });
        startQuestionTimer(lobbyId);
    };

    socket.on('startGame', ({ lobbyId }) => {
        const lobby = lobbies[lobbyId];
        if (lobby && lobby.hostId === socket.user.uid && lobby.category) {
            const selectedCategoryData = allQuestionsData.categories.find(c => c.name === lobby.category);
            if (!selectedCategoryData || selectedCategoryData.questions.length === 0) {
                socket.emit('startGameError', { message: 'Invalid category or no questions in category.' });
                return;
            }

            // Shuffle and limit to QUESTIONS_PER_GAME
            let shuffledQuestions = [...selectedCategoryData.questions].sort(() => 0.5 - Math.random());
            lobby.questions = shuffledQuestions.slice(0, GAME_CONFIG.QUESTIONS_PER_GAME);

            if (lobby.questions.length === 0) {
                socket.emit('startGameError', { message: 'No questions found for the selected category after attempting to load.' });
                return;
            }

            lobby.currentQuestionIndex = 0;
            lobby.gameActive = true;
            lobby.isPaused = false;
            lobby.playerAnswers = {}; // Reset answers for new game

            // Reset scores, streaks, and multipliers for all players in the lobby
            Object.keys(lobby.players).forEach(pid => {
                lobby.players[pid].score = 0;
                lobby.players[pid].streak = 0;
                lobby.players[pid].multiplier = GAME_CONFIG.INITIAL_MULTIPLIER;
                lobby.scores[pid] = 0;
                lobby.players[pid].answers = {}; // Clear previous game answers
            });

            io.to(lobbyId).emit('gameStarted', {
                category: lobby.category,
                totalQuestions: lobby.questions.length,
                players: Object.values(lobby.players).map(p=>({
                    id: p.id,
                    name: p.name,
                    score: 0,
                    streak: 0,
                    multiplier: GAME_CONFIG.INITIAL_MULTIPLIER
                }))
            });
            emitLobbyUpdate(lobbyId); // Update lobby state (gameActive)
            sendQuestion(lobbyId);
            console.log(`Game started in lobby ${lobbyId} with category ${lobby.category} (${lobby.questions.length} questions)`);
        } else {
            socket.emit('startGameError', { message: 'Only host can start game or category not selected.' });
        }
    });

    socket.on('submitAnswer', ({ lobbyId, questionIndex, answer }) => {
        const lobby = lobbies[lobbyId];
        const playerId = socket.user.uid;

        if (lobby && lobby.gameActive && !lobby.isPaused && lobby.currentQuestionIndex === questionIndex) {
            if (!lobby.playerAnswers[questionIndex]) {
                lobby.playerAnswers[questionIndex] = {};
            }
            // Prevent multiple submissions for the same question by the same player
            if (lobby.playerAnswers[questionIndex][playerId]) {
                socket.emit('answerError', { message: 'You have already answered this question.' });
                return;
            }

            const timeElapsed = (Date.now() - lobby.questionStartTime) / 1000; // Time in seconds
            lobby.playerAnswers[questionIndex][playerId] = { answer, timeTaken: timeElapsed };

            // Store answer in player object as well for client to show "picked"
            if(lobby.players[playerId]) {
                if(!lobby.players[playerId].answers) lobby.players[playerId].answers = {};
                lobby.players[playerId].answers[questionIndex] = answer;
            }

            socket.emit('answerSubmittedFeedback', { message: 'Answer received!', questionIndex });
            console.log(`Player ${playerId} in lobby ${lobbyId} answered ${answer} for Q${questionIndex}`);

            // Check if all active (non-disconnected) players have answered
            const activePlayers = Object.values(lobby.players).filter(p => !p.disconnected);
            const allAnswered = activePlayers.every(p => lobby.playerAnswers[questionIndex] && lobby.playerAnswers[questionIndex][p.id]);

            if (allAnswered) {
                if (lobby.timerInterval) clearInterval(lobby.timerInterval);
                lobby.timerInterval = null;
                processAnswersAndNextQuestion(lobbyId);
            }
        } else {
            socket.emit('answerError', { message: 'Cannot submit answer now (game not active, paused, or wrong question).' });
        }
    });

    const endGame = (lobbyId) => {
        const lobby = lobbies[lobbyId];
        if (!lobby) return;

        lobby.gameActive = false;
        if (lobby.timerInterval) clearInterval(lobby.timerInterval);
        lobby.timerInterval = null;

        // Calculate final rankings
        const finalScores = Object.entries(lobby.scores)
            .map(([id, score]) => ({
                id,
                name: lobby.players[id] ? lobby.players[id].name : 'Unknown Player',
                score,
                multiplier: lobby.players[id] ? lobby.players[id].multiplier : 1,
                disconnected: lobby.players[id] ? lobby.players[id].disconnected : true,
            }))
            .sort((a, b) => b.score - a.score); // Sort descending by score

        io.to(lobbyId).emit('gameOver', { finalScores });
        emitLobbyUpdate(lobbyId); // Update lobby state (gameActive = false)
        console.log(`Game over in lobby ${lobbyId} after ${lobby.currentQuestionIndex} questions`);
    };

    socket.on('hostTogglePause', ({ lobbyId }) => {
        const lobby = lobbies[lobbyId];
        if (lobby && lobby.hostId === socket.user.uid && lobby.gameActive) {
            lobby.isPaused = !lobby.isPaused;
            if (lobby.isPaused) {
                if (lobby.timerInterval) { // If timer is running, capture remaining time
                    const timeElapsed = (Date.now() - lobby.questionStartTime) / 1000;
                    const currentQuestion = lobby.questions[lobby.currentQuestionIndex];
                    const timeLimit = currentQuestion.timeLimit || GAME_CONFIG.DEFAULT_TIME_LIMIT;
                    lobby.questionTimer = Math.max(0, timeLimit - timeElapsed); // Store remaining time
                }
                io.to(lobbyId).emit('gamePaused', { timeLeft: Math.round(lobby.questionTimer) });
                console.log(`Game paused in lobby ${lobbyId}`);
            } else {
                // Resuming: restart timer with remaining time
                const currentQuestion = lobby.questions[lobby.currentQuestionIndex];
                const timeLimit = currentQuestion.timeLimit || GAME_CONFIG.DEFAULT_TIME_LIMIT;
                lobby.questionStartTime = Date.now() - ((timeLimit - lobby.questionTimer) * 1000);
                startQuestionTimer(lobbyId); // This will use the updated lobby.questionTimer if it was paused mid-question
                io.to(lobbyId).emit('gameResumed', { timeLeft: Math.round(lobby.questionTimer) });
                console.log(`Game resumed in lobby ${lobbyId}`);
            }
            emitLobbyUpdate(lobbyId);
        }
    });

    socket.on('hostSkipToEnd', ({ lobbyId }) => {
        const lobby = lobbies[lobbyId];
        if (lobby && lobby.hostId === socket.user.uid && lobby.gameActive) {
            io.to(lobbyId).emit('gameSkippedToEnd');
            endGame(lobbyId);
            console.log(`Game skipped to end in lobby ${lobbyId} by host.`);
        }
    });

    socket.on('playAgain', ({ lobbyId }) => {
        const lobby = lobbies[lobbyId];
        if (lobby && lobby.hostId === socket.user.uid && !lobby.gameActive) {
            // Reset game-specific state but keep players
            lobby.category = null;
            lobby.questions = [];
            lobby.currentQuestionIndex = -1;
            lobby.gameActive = false;
            lobby.isPaused = false;
            lobby.playerAnswers = {};
            Object.keys(lobby.players).forEach(pid => {
                lobby.players[pid].score = 0;
                lobby.players[pid].streak = 0;
                lobby.players[pid].multiplier = GAME_CONFIG.INITIAL_MULTIPLIER;
                lobby.scores[pid] = 0;
                lobby.players[pid].answers = {};
            });
            io.to(lobbyId).emit('lobbyResetForPlayAgain', {
                lobbyId,
                players: Object.values(lobby.players).map(p=>({
                    id: p.id,
                    name: p.name,
                    score: 0,
                    streak: 0,
                    multiplier: GAME_CONFIG.INITIAL_MULTIPLIER
                })),
                hostId: lobby.hostId
            });
            emitLobbyUpdate(lobbyId);
            console.log(`Lobby ${lobbyId} reset for play again by host.`);
        }
    });

    socket.on('leaveLobby', ({ lobbyId }) => {
        const lobby = lobbies[lobbyId];
        if (lobby) {
            const playerId = socket.user.uid;
            console.log(`Player ${getPlayerName(socket)} (${playerId}) is attempting to leave lobby ${lobbyId}`);
            if (lobby.players[playerId]) {
                delete lobby.players[playerId];
                delete lobby.scores[playerId];
                socket.leave(lobbyId);
                console.log(`Player ${playerId} left lobby ${lobbyId}.`);

                if (Object.keys(lobby.players).length === 0) {
                    console.log(`Lobby ${lobbyId} is empty, deleting.`);
                    if (lobby.timerInterval) clearInterval(lobby.timerInterval);
                    delete lobbies[lobbyId];
                } else {
                    // If host left, assign a new host (e.g., first player in list)
                    if (lobby.hostId === playerId) {
                        lobby.hostId = Object.keys(lobby.players)[0];
                        console.log(`Host left lobby ${lobbyId}. New host is ${lobby.hostId}.`);
                        io.to(lobbyId).emit('hostChanged', { newHostId: lobby.hostId });
                    }
                    emitLobbyUpdate(lobbyId);
                }
                socket.emit('leftLobbySuccess');
            } else {
                console.log(`Player ${playerId} not found in lobby ${lobbyId} to leave.`);
                socket.emit('leaveLobbyError', {message: 'You are not in this lobby.'});
            }
        } else {
            console.log(`Lobby ${lobbyId} not found for player ${socket.user.uid} to leave.`);
            socket.emit('leaveLobbyError', {message: 'Lobby not found.'});
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.uid} (Socket ID: ${socket.id})`);
        // Find which lobbies this player was in and mark them as disconnected
        for (const lobbyId in lobbies) {
            const lobby = lobbies[lobbyId];
            const player = lobby.players[socket.user.uid];
            if (player && player.socketId === socket.id) { // Check socketId to handle multiple tabs/connections by same user
                player.disconnected = true;
                console.log(`Player ${player.name} (${player.id}) marked as disconnected in lobby ${lobbyId}`);

                let allDisconnected = true;
                for(const pId in lobby.players){
                    if(!lobby.players[pId].disconnected){
                        allDisconnected = false;
                        break;
                    }
                }

                if (allDisconnected) {
                    console.log(`All players disconnected in lobby ${lobbyId}. Deleting lobby.`);
                    if (lobby.timerInterval) clearInterval(lobby.timerInterval);
                    delete lobbies[lobbyId];
                } else {
                    // If host disconnected and game is active, could pause or assign new host
                    if (lobby.hostId === socket.user.uid && lobby.gameActive) {
                        // Simple: end game if host disconnects during active game
                        // More complex: host migration
                        console.log(`Host ${player.name} disconnected from active game in lobby ${lobbyId}. Ending game.`);
                        io.to(lobbyId).emit('hostDisconnectedDuringGame');
                        endGame(lobbyId); // Or implement host migration
                    } else if (lobby.hostId === socket.user.uid && !lobby.gameActive) {
                        // If host disconnects from waiting room, assign new host
                        const remainingPlayers = Object.values(lobby.players).filter(p => !p.disconnected);
                        if (remainingPlayers.length > 0) {
                            lobby.hostId = remainingPlayers[0].id;
                            io.to(lobbyId).emit('hostChanged', { newHostId: lobby.hostId });
                            console.log(`Host disconnected in lobby ${lobbyId}. New host: ${lobby.hostId}`);
                        }
                    }
                    emitLobbyUpdate(lobbyId);
                }
                break; // Assume player is in at most one lobby with this socket
            }
        }
    });
});

// --- Server Start ---
server.listen(PORT, () => {
    console.log(`Game server running on http://localhost:${PORT}`);
    console.log('Serving client from:', path.join(__dirname, 'public'));
    console.log('Auth App URL configured as:', process.env.AUTH_APP_URL);
    console.log('Available categories:', allQuestionsData.categories.map(c => c.name));
    console.log(`Game Configuration: ${GAME_CONFIG.QUESTIONS_PER_GAME} questions per game, ${GAME_CONFIG.DEFAULT_TIME_LIMIT}s per question`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    io.close(() => {
        console.log('Socket.IO server closed.');
        server.close(() => {
            console.log('HTTP server closed.');
            // Any other cleanup (e.g., DB connections if not handled by Firebase Admin)
            process.exit(0);
        });
    });
});