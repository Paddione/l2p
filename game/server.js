// game/server.js
require('dotenv').config({ path: '.env.game' });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const { setupMiddleware } = require('./middleware');
const { setupRoutes } = require('./routes');
const { setupSocketHandlers } = require('./socketHandlers');
const { loadQuestions } = require('./gameLogic');
const { validateEnvironment } = require('./config');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            process.env.CORS_ORIGIN_GAME_CLIENT || "https://game.korczewski.de",
            process.env.AUTH_APP_URL || "https://auth.korczewski.de",
            "http://localhost:3000",
            "http://localhost:3001"
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true,
    transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Validate environment variables
        if (!validateEnvironment()) {
            console.error('❌ Environment validation failed');
            process.exit(1);
        }

        // Load questions
        const questionsData = loadQuestions();
        if (!questionsData) {
            console.error('❌ Failed to load questions');
            process.exit(1);
        }

        // Setup middleware
        setupMiddleware(app);

        // Setup routes (pass questionsData for API endpoints)
        setupRoutes(app, questionsData);

        // Setup Socket.IO handlers
        setupSocketHandlers(io, questionsData);

        // Start server
        server.listen(PORT, () => {
            console.log(`🎮 Game server running on http://localhost:${PORT}`);
            console.log(`📚 Loaded ${questionsData.categories.length} question categories`);
            console.log(`🔥 Firebase project: ${process.env.FIREBASE_PROJECT_ID}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    io.close(() => {
        server.close(() => {
            console.log('✅ Server closed successfully');
            process.exit(0);
        });
    });
});

process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    io.close(() => {
        server.close(() => {
            console.log('✅ Server closed successfully');
            process.exit(0);
        });
    });
});

startServer();