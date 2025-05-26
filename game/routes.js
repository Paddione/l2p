// game/routes.js

/**
 * @fileoverview Express route handlers for the game server.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { auth, db } = require('./firebaseAdmin');
const { getGameConfigForClient } = require('./config');

/**
 * Sets up all Express routes.
 * @param {express.Application} app - The Express application instance.
 * @param {Object} questionsData - The loaded questions data.
 */
function setupRoutes(app, questionsData) {
    console.log('🛤️ Setting up routes...');

    // Main route - serves HTML with injected config
    app.get('/', (req, res, next) => {
        console.log('🔍 Game Server: Main route / hit');

        const indexPath = path.join(__dirname, 'public', 'index.html');
        fs.readFile(indexPath, 'utf8', (err, htmlData) => {
            if (err) {
                console.error('❌ Game Server: Error reading index.html:', err.stack);
                return next(err);
            }

            const gameConfig = getGameConfigForClient();
            const configScript = `
                <script>
                    console.log('🔧 Game Server: Config injection starting...');
                    window.GAME_CONFIG = ${JSON.stringify(gameConfig)};
                    console.log('✅ Game Server: window.GAME_CONFIG loaded:', !!window.GAME_CONFIG);
                </script>
            `;

            let injectedHtml = htmlData;
            const headCloseTag = '</head>';

            if (htmlData.includes(headCloseTag)) {
                injectedHtml = htmlData.replace(headCloseTag, configScript + '\n' + headCloseTag);
                console.log('✅ Game Server: Config injected before </head>');
            } else {
                console.warn('⚠️ Game Server: No </head> found. Appending script to body.');
                injectedHtml = htmlData.replace('</body>', configScript + '\n</body>');
            }

            res.send(injectedHtml);
        });
    });

    // Static files
    app.use(express.static(path.join(__dirname, 'public'), {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
            if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
            if (process.env.NODE_ENV === 'production') res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }));

    // API Routes
    setupApiRoutes(app, questionsData);

    console.log('✅ Routes setup complete');
}

/**
 * Sets up API routes.
 * @param {express.Application} app - The Express application instance.
 * @param {Object} questionsData - The loaded questions data.
 */
function setupApiRoutes(app, questionsData) {
    // Categories endpoint
    app.get('/api/categories', (req, res, next) => {
        console.log('📚 Categories requested', '(Path:', req.path, ')');
        if (questionsData && questionsData.categories) {
            const categories = questionsData.categories.map(cat => cat.name);
            console.log('📚 Returning', categories.length, 'categories');
            res.json({ categories });
        } else {
            console.error('❌ Categories not loaded or questionsData is null/undefined', '(Path:', req.path, ')');
            const error = new Error("Categories not loaded");
            error.status = 500;
            next(error);
        }
    });

    // User info endpoint (requires authentication)
    app.get('/api/user', async (req, res, next) => {
        console.log('👤 User info requested', '(Path:', req.path, ')');
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn('👤 User info - No token provided', '(Path:', req.path, ')');
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        try {
            const decodedToken = await auth.verifyIdToken(token);
            console.log('👤 User info - Token verified for user:', decodedToken.uid);
            const userDoc = await db.collection('users').doc(decodedToken.uid).get();

            const userData = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                displayName: userDoc.exists ? userDoc.data().displayName : decodedToken.email
            };

            console.log('👤 User info - Successfully retrieved for user:', decodedToken.uid);
            res.json({ user: userData });
        } catch (error) {
            console.error('👤 User info - Error verifying token or fetching profile:', error.message, '(Code:', error.code, ', Path:', req.path, ')');
            const authError = new Error('Authentication failed');
            authError.status = error.code === 'auth/invalid-token' || error.code === 'auth/argument-error' ? 403 : 500;
            authError.details = error.message;
            next(authError);
        }
    });
}

/**
 * Generates fallback HTML for error cases when index.html cannot be read.
 * @param {string} message - The error message to display.
 * @returns {string} HTML string.
 */
function generateFallbackHTML(message = "Failed to load game.") {
    return `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
    <h1>${message}</h1>
    <p>Please ensure public/index.html exists and server has permissions to read it.</p>
</body>
</html>`;
}

module.exports = {
    setupRoutes
};