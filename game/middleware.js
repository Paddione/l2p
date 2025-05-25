// game/middleware.js

/**
 * @fileoverview Express middleware configuration for the game server.
 */

const express = require('express'); // Add this import
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { getCorsOrigins } = require('./config');

/**
 * Sets up all Express middleware.
 * @param {express.Application} app - The Express application instance.
 */
function setupMiddleware(app) {
    console.log('🔧 Setting up middleware...');

    // Security headers
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
                ],
                scriptSrcAttr: ["'unsafe-inline'"], // For inline event handlers if any
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://fonts.googleapis.com",
                    "https://cdn.tailwindcss.com"
                ],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                connectSrc: [
                    "'self'",
                    "*.googleapis.com", // Firebase Auth communication
                    "*.firebaseio.com", // Firestore/Realtime Database
                    "wss://game.korczewski.de",
                    "https://*.firebaseapp.com", // Firebase Auth operations
                    "https://auth.korczewski.de",
                ],
                frameSrc: ["'self'", "https://*.firebaseapp.com"], // Firebase Auth iframes
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        crossOriginEmbedderPolicy: false
    }));

    // CORS
    app.use(cors({
        origin: getCorsOrigins(),
        credentials: true
    }));

    // Compression
    app.use(compression());

    // JSON parsing
    app.use(express.json());

    // Rate limiting for API endpoints
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', apiLimiter);

    console.log('✅ Middleware setup complete');
}

module.exports = {
    setupMiddleware
};