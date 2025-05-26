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

    // Debug route to check file system
    app.get('/debug/files', (req, res) => {
        const publicPath = path.join(__dirname, 'public');
        const indexPath = path.join(publicPath, 'index.html');

        try {
            const publicExists = fs.existsSync(publicPath);
            const indexExists = fs.existsSync(indexPath);
            const publicContents = publicExists ? fs.readdirSync(publicPath) : [];

            res.json({
                __dirname,
                publicPath,
                indexPath,
                publicExists,
                indexExists,
                publicContents,
                cwd: process.cwd()
            });
        } catch (error) {
            res.status(500).json({
                error: error.message,
                stack: error.stack
            });
        }
    });

    // Main route - serves HTML with injected config
    app.get('/', (req, res, next) => {
        console.log('🔍 Game Server: Main route / hit');

        const indexPath = path.join(__dirname, 'public', 'index.html');

        // Debug: Check if file exists before trying to read
        if (!fs.existsSync(indexPath)) {
            console.error('❌ Game Server: index.html does not exist at:', indexPath);
            console.log('🔍 Current working directory:', process.cwd());
            console.log('🔍 __dirname:', __dirname);

            // Try to list contents of current directory and public directory
            try {
                console.log('🔍 Contents of __dirname:', fs.readdirSync(__dirname));
                const publicPath = path.join(__dirname, 'public');
                if (fs.existsSync(publicPath)) {
                    console.log('🔍 Contents of public directory:', fs.readdirSync(publicPath));
                } else {
                    console.log('❌ Public directory does not exist at:', publicPath);
                }
            } catch (dirError) {
                console.error('❌ Error reading directories:', dirError.message);
            }

            // Return fallback HTML
            return res.send(generateFallbackHTML('Game loading error: index.html not found'));
        }

        fs.readFile(indexPath, 'utf8', (err, htmlData) => {
            if (err) {
                console.error('❌ Game Server: Error reading index.html:', err.stack);
                return res.send(generateFallbackHTML('Game loading error: Could not read index.html'));
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

    /**
     * Health check endpoint for Docker and Traefik
     */
    app.get('/api/health', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            service: 'game-server',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            questionsLoaded: !!questionsData
        });
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
<head>
    <title>Game Loading Error</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #1a1a1a; color: #fff; }
        .error { background: #ff4444; padding: 20px; border-radius: 10px; margin: 20px auto; max-width: 600px; }
        .debug { background: #444; padding: 15px; border-radius: 5px; margin: 20px auto; max-width: 800px; font-family: monospace; text-align: left; }
    </style>
</head>
<body>
    <h1>Quiz Game - Loading Error</h1>
    <div class="error">
        <h2>${message}</h2>
        <p>The game could not load properly. Please contact the administrator.</p>
    </div>
    <div class="debug">
        <h3>Debug Information:</h3>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Issue:</strong> index.html file not found in public directory</p>
        <p><strong>Expected Location:</strong> /usr/src/app/public/index.html</p>
        <p><strong>Check:</strong> <a href="/debug/files" style="color: #4CAF50;">/debug/files</a> for filesystem debug info</p>
    </div>
</body>
</html>`;
}

module.exports = {
    setupRoutes
};