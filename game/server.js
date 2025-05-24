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
const lobbies = {};

// --- Middleware ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // For config script
                "https://www.gstatic.com/firebasejs/", // Firebase JS SDK
                "https://cdn.tailwindcss.com",      // Tailwind CSS
                "https://cdn.socket.io",            // Socket.IO client from CDN
                // "https://apis.google.com" // REMOVED as Google Sign-In is removed
            ],
            scriptSrcAttr: ["'unsafe-inline'"], // For inline event handlers if any (e.g. error fallbacks)
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.tailwindcss.com"
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: [
                "'self'",
                "*.googleapis.com", // Still needed for Firebase Auth communication
                "*.firebaseio.com", // For Firestore/Realtime Database if used
                "wss://game.korczewski.de",
                "https://*.firebaseapp.com", // For Firebase Auth operations
                "https://auth.korczewski.de",
            ],
            frameSrc: ["'self'", "https://*.firebaseapp.com"], // Firebase Auth uses iframes for some operations
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN_GAME_CLIENT || "http://localhost:3000",
    credentials: true
}));

app.use(compression());
app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false,
});
app.use('/game/api/', apiLimiter);

app.get('/', (req, res) => {
    console.log('🔍 Game Server: Main route / hit, checking environment variables...');
    const requiredEnvVars = [
        'AUTH_APP_URL', 'FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN',
        'FIREBASE_PROJECT_ID', 'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_APP_ID'
    ];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('❌ Game Server CRITICAL: Missing required environment variables:', missingVars);
        return res.status(500).send(`<html>...Configuration Error HTML...</html>`);
    }

    const indexPath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, htmlData) => {
        if (err) {
            console.error('❌ Game Server: Error reading index.html:', err);
            return res.send(generateFallbackHTML("Error reading main page."));
        }

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
            },
            debugMode: process.env.NODE_ENV !== 'production'
        };

        const configScript = `
            <script>
                console.log('🔧 Game Server: Config injection starting...');
                window.GAME_CONFIG = ${JSON.stringify(gameConfig)};
                console.log('✅ Game Server: window.GAME_CONFIG loaded:', !!window.GAME_CONFIG);
            </script>
        `;

        let injectedHtml = htmlData;
        // ***** CRITICAL FIX: Corrected injectionPoint *****
        const injectionPoint = '';
        const headCloseTag = '</head>';

        if (htmlData.includes(injectionPoint)) {
            injectedHtml = htmlData.replace(injectionPoint, configScript);
            console.log('✅ Game Server: Config injected via CONFIG_INJECTION_POINT placeholder');
        } else if (htmlData.includes(headCloseTag)) {
            injectedHtml = htmlData.replace(headCloseTag, configScript + '\n' + headCloseTag);
            console.log('✅ Game Server: Config injected before </head> (placeholder was missing)');
        } else {
            console.warn('⚠️ Game Server: No standard injection point found. Appending script to body.');
            injectedHtml = htmlData.replace('</body>', configScript + '\n</body>');
        }
        res.send(injectedHtml);
    });
});

app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
        if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
        if (process.env.NODE_ENV === 'production') res.setHeader('Cache-Control', 'public, max-age=3600');
    }
}));

function generateFallbackHTML(message = "Failed to load game.") {
    return `<!DOCTYPE html><html><head><title>Error</title></head><body><h1>${message}</h1><p>Please ensure public/index.html exists and server has permissions to read it.</p></body></html>`;
}

// API Endpoints (abbreviated for brevity)
app.get('/game/api/categories', (req, res) => {
    if (allQuestionsData && allQuestionsData.categories) {
        res.json(allQuestionsData.categories.map(cat => cat.name));
    } else {
        res.status(500).json({error: "Categories not loaded"});
    }
});
app.get('/game/api/user', async (req, res) => { /* ... */ });


// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
        try {
            const decodedToken = await auth.verifyIdToken(token);
            socket.user = decodedToken;
            const userProfileDoc = await db.collection('users').doc(decodedToken.uid).get();
            socket.user.displayName = userProfileDoc.exists && userProfileDoc.data().displayName
                ? userProfileDoc.data().displayName
                : (decodedToken.email ? decodedToken.email.split('@')[0] : `User-${decodedToken.uid.substring(0,5)}`);
            console.log(`Game Server Socket: User authenticated: ${socket.user.uid} (${socket.user.displayName})`);
            next();
        } catch (error) {
            console.error('Game Server Socket: Auth error:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    } else {
        socket.user = {
            uid: `guest_${socket.id}`, isGuest: true,
            displayName: socket.handshake.query.playerName || `Guest-${socket.id.substring(0,5)}`
        };
        console.log(`Game Server Socket: Guest connected: ${socket.user.uid} (${socket.user.displayName})`);
        next();
    }
});

// Socket.IO Event Handlers (structure only, implementation details omitted for brevity)
io.on('connection', (socket) => {
    console.log(`User connected to Game Server: ${socket.user.uid} (Socket ID: ${socket.id})`);
    // const emitLobbyUpdate = (lobbyId) => { /* ... */ };
    // const getPlayerName = (socketInternal) => { /* ... */ };
    // socket.on('createLobby', (data) => { /* ... */ });
    // socket.on('joinLobby', (data) => { /* ... */ });
    // ... other game-specific socket event handlers ...
    // socket.on('disconnect', () => { /* ... */ });
});

server.listen(PORT, () => {
    console.log(`Game server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => { console.log('SIGINT received...'); io.close(() => server.close(() => process.exit(0))); });
