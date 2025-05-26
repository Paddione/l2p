// auth/app.js
require('dotenv').config({ path: '.env.auth' }); // Load environment variables

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const helmet = require('helmet');
const path = require('path');

const { db, auth: adminAuth, admin } = require('./firebaseAdmin');
const hallOfFameRoutes = require('./routes/hallOfFame');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://www.gstatic.com/firebasejs/", "'unsafe-inline'"],
            "frame-src": ["'self'", "https://*.firebaseapp.com"],
            "connect-src": ["'self'", "*.googleapis.com", "*.firebaseio.com", "https://*.firebaseapp.com", `http://localhost:${PORT}`],
        },
    },
}));

const corsOrigins = [process.env.CORS_ORIGIN_GAME_CLIENT, process.env.CORS_ORIGIN_AUTH_APP]
    .filter(Boolean)
    .map(o => o.replace(/\/$/, ''));

if (process.env.NODE_ENV !== 'production') {
    const localAuthOrigin = `http://localhost:${PORT}`;
    if (!corsOrigins.includes(localAuthOrigin)) {
        corsOrigins.push(localAuthOrigin);
    }
}

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (corsOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
    session({
        name: (process.env.SESSION_COOKIE_NAME || '_app_session'),
        secret: process.env.SESSION_SECRET || 'fallback_secret_auth_super_secure_!@#',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);

const csrfProtection = csurf({
    cookie: {
        key: process.env.CSRF_SECRET_COOKIE_NAME || '_csrf_secret',
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    }
});
app.use(csrfProtection);

app.use(express.static(path.join(__dirname, 'public')));

/**
 * Generates the dynamic HTML content for the main login/auth page.
 * Embeds Firebase and game configuration along with the CSRF token.
 * @param {object} clientFirebaseConfig - Firebase configuration for the client.
 * @param {object} gameConfig - Game server configuration for the client.
 * @param {string} csrfToken - CSRF token for form submissions.
 * @returns {string} The generated HTML content.
 */
function generateIndexHtml(clientFirebaseConfig, gameConfig, csrfToken) {
    const firebaseConfigJson = JSON.stringify(clientFirebaseConfig);
    const gameConfigJson = JSON.stringify(gameConfig);
    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="${csrfToken}">
    <title>Login - Kommillitonen Quiz</title>
    <link rel="stylesheet" href="/auth_style.css">
    
    <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>

    <script>
        console.log('Server-generated HTML: FIREBASE_CONFIG is about to be set.');
        window.FIREBASE_CONFIG = ${firebaseConfigJson};
        window.GAME_CONFIG = ${gameConfigJson};
        console.log('Server-generated HTML: window.FIREBASE_CONFIG set:', window.FIREBASE_CONFIG ? "Object present" : "Still undefined/falsy", JSON.stringify(window.FIREBASE_CONFIG));
        console.log('Server-generated HTML: window.GAME_CONFIG set:', window.GAME_CONFIG ? "Object present" : "Still undefined/falsy", JSON.stringify(window.GAME_CONFIG));
    </script>
</head>
<body>
<div class="auth-container">
    <h1>Kommillitonen Quiz</h1>

    <div id="login-section" class="auth-section">
        <h2>Login</h2>
        <form id="login-form">
            <div>
                <label for="login-email">Email:</label>
                <input type="email" id="login-email" name="email" required>
            </div>
            <div>
                <label for="login-password">Passwort:</label>
                <input type="password" id="login-password" name="password" required>
            </div>
            <button type="submit" class="btn">Login</button>
        </form>
        <p id="login-error" class="error-message"></p>
        <div class="auth-links">
            <button type="button" id="show-register-btn" class="link-btn">Noch kein Konto? Registrieren</button>
            <button type="button" id="show-forgot-password-btn" class="link-btn">Passwort vergessen?</button>
        </div>
    </div>

    <div id="register-section" class="auth-section" style="display: none;">
        <h2>Registrieren</h2>
        <form id="register-form">
            <div>
                <label for="register-display-name">Anzeigename:</label>
                <input type="text" id="register-display-name" name="displayName" required>
            </div>
            <div>
                <label for="register-email">Email:</label>
                <input type="email" id="register-email" name="email" required>
            </div>
            <div>
                <label for="register-password">Passwort (min. 6 Zeichen):</label>
                <input type="password" id="register-password" name="password" required>
            </div>
            <button type="submit" class="btn">Registrieren</button>
        </form>
        <p id="register-message" class="message"></p>
        <p id="register-error" class="error-message"></p>
        <div class="auth-links">
            <button type="button" id="show-login-btn-from-register" class="link-btn">Bereits ein Konto? Login</button>
        </div>
    </div>

    <div id="forgot-password-section" class="auth-section" style="display: none;">
        <h2>Passwort zurücksetzen</h2>
        <form id="forgot-password-form">
            <div>
                <label for="forgot-email">Email:</label>
                <input type="email" id="forgot-email" name="email" required>
            </div>
            <button type="submit" class="btn">Reset-Link senden</button>
        </form>
        <p id="forgot-message" class="message"></p>
        <p id="forgot-error" class="error-message"></p>
        <div class="auth-links">
            <button type="button" id="show-login-btn-from-forgot" class="link-btn">Zurück zum Login</button>
        </div>
    </div>
</div>

<script src="/auth_client.js"></script>
</body>
</html>
    `;
}

/**
 * Middleware to verify Firebase ID token from the Authorization header.
 * Attaches the decoded token to `req.user`.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
async function verifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error.message, '(Code:', error.code, ')');
        return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
}

/**
 * Route for the main login/auth page.
 * Dynamically generates and serves the HTML with embedded configuration.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
app.get('/', (req, res, next) => {
    try {
        console.log("Auth Server: '/' route hit. Generating dynamic HTML.");

        const clientFirebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID,
        };

        // Determine game URL based on environment
        const gameUrl = process.env.GAME_APP_URL || 
                       (process.env.NODE_ENV === 'production' 
                        ? 'https://game.korczewski.de/game/' 
                        : 'http://localhost:3000');

        const gameConfig = {
            gameUrl: gameUrl
        };

        console.log("Auth Server: Client Firebase Config to be embedded:", clientFirebaseConfig ? "Object present" : "Undefined/falsy"); // Avoid logging sensitive keys
        console.log("Auth Server: Game Config to be embedded:", JSON.stringify(gameConfig));
        
        if (!clientFirebaseConfig.apiKey || !clientFirebaseConfig.authDomain || !clientFirebaseConfig.projectId) {
            console.error("CRITICAL SERVER-SIDE ERROR: Essential Firebase client configuration is missing from environment variables. The login page will not function correctly.");
            return res.status(500).send('Server configuration error. Please contact administrator.');
        }

        const csrfToken = req.csrfToken();
        const htmlContent = generateIndexHtml(clientFirebaseConfig, gameConfig, csrfToken);
        res.send(htmlContent);
    } catch (routeError) {
        console.error("Error in '/' route handler:", routeError.stack);
        next(routeError);
    }
});

/**
 * API route for user registration.
 * Creates a new user in Firebase Authentication and adds a basic profile to Firestore.
 * Requires email, password, and display name in the request body.
 * @param {object} req - Express request object with body { email, password, displayName }.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
app.post('/api/auth/register', async (req, res, next) => {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
        return res.status(400).json({ error: 'Email, password, and display name are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    try {
        const userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            displayName: displayName,
            emailVerified: false,
        });

        await db.collection('users').doc(userRecord.uid).set({
            email: userRecord.email,
            displayName: userRecord.displayName,
            role: 'user',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isVerified: userRecord.emailVerified,
        });

        res.status(201).json({ uid: userRecord.uid, email: userRecord.email, message: 'User registered successfully. Please login.' });
    } catch (error) {
        console.error('Error creating new user:', error.message, '(Code:', error.code, ', Path:', req.path, ')');
        let errorMessage = 'Failed to register user.';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'This email address is already in use.';
        } else if (error.code === 'auth/invalid-password') {
            errorMessage = error.message;
        }

        // Only send a 400 if it's an auth error and headers haven't been sent
        if (error.code && error.code.startsWith('auth/') && !res.headersSent) {
            return res.status(400).json({ error: errorMessage, code: error.code });
        }

        // Otherwise, let the generic error handler take over
        next(error);
    }
});

// Mount Hall of Fame routes
app.use('/api/hall-of-fame', hallOfFameRoutes);

/**
 * API route to get the current authenticated user's profile.
 * Requires a valid Firebase ID token.
 * Creates a basic profile in Firestore if one doesn't exist.
 * @param {object} req - Express request object with `req.user` populated by `verifyFirebaseToken`.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
app.get('/api/user', verifyFirebaseToken, async (req, res, next) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (!userDoc.exists) {
            console.warn(`Auth Server: User profile not found in Firestore for UID: ${req.user.uid}. Creating a basic profile.`);
            const basicProfile = {
                email: req.user.email,
                displayName: req.user.name || (req.user.email ? req.user.email.split('@')[0] : `User-${req.user.uid.substring(0, 5)}`),
                role: 'user',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isVerified: req.user.email_verified
            };
            await db.collection('users').doc(req.user.uid).set(basicProfile);
            return res.json({ user: { uid: req.user.uid, ...basicProfile }});
        }
        res.json({ user: { uid: req.user.uid, ...userDoc.data() } });
    } catch (error) {
        console.error('Error fetching user profile:', error.message, '(Path:', req.path, ', User ID:', req.user?.uid, ')');
        next(error);
    }
});

/**
 * Function to create the first admin user if one doesn't exist based on environment variables.
 * Logs status or errors during the process.
 */
async function createFirstAdminUser() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.log('Auth Server: Admin email or password not set in .env.auth. Skipping initial admin creation.');
        return;
    }
    try {
        let userRecord = await adminAuth.getUserByEmail(adminEmail).catch(() => null);

        if (!userRecord) {
            console.log(`Auth Server: Admin user ${adminEmail} not found. Attempting to create...`);
            userRecord = await adminAuth.createUser({
                email: adminEmail,
                password: adminPassword,
                displayName: 'Admin',
                emailVerified: true,
            });
            console.log('Auth Server: Successfully created new admin user:', userRecord.uid);
            await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
            await db.collection('users').doc(userRecord.uid).set({
                email: userRecord.email,
                displayName: userRecord.displayName,
                role: 'admin',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isVerified: true,
            }, { merge: true });
            console.log('Auth Server: Admin role set and profile created/merged for user:', userRecord.uid);
        } else {
            console.log('Auth Server: Admin user already exists:', adminEmail);
            let claimsUpdated = false;
            if (!userRecord.customClaims || userRecord.customClaims.role !== 'admin') {
                await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
                claimsUpdated = true;
                console.log('Auth Server: Updated existing user to have admin custom claim:', userRecord.uid);
            }
            const userDoc = await db.collection('users').doc(userRecord.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'admin') {
                await db.collection('users').doc(userRecord.uid).set({
                    role: 'admin',
                    displayName: userDoc.exists ? userDoc.data().displayName : 'Admin',
                    email: userRecord.email
                }, { merge: true });
                console.log('Auth Server: Updated existing user Firestore document to have admin role:', userRecord.uid);
            } else if (claimsUpdated) {
                console.log('Auth Server: Admin user Firestore role was already correct.');
            }
        }
    } catch (error) {
        if (error.code === 'auth/configuration-not-found') {
            console.error(`Auth Server FirebaseAuthError (createFirstAdminUser): ${error.message}. Ensure Firebase Authentication is enabled...`);
        } else if (error.code === 'auth/email-already-exists') {
            console.log('Auth Server: Admin user email already exists (caught in createUser block). Ensuring role is set.');
            try {
                const existingUser = await adminAuth.getUserByEmail(adminEmail);
                if (existingUser && (!existingUser.customClaims || existingUser.customClaims.role !== 'admin')) {
                    await adminAuth.setCustomUserClaims(existingUser.uid, { role: 'admin' });
                    await db.collection('users').doc(existingUser.uid).set({ role: 'admin' }, { merge: true });
                    console.log('Auth Server: Updated existing user to have admin role (in createUser catch):', existingUser.uid);
                }
            } catch (e) {
                console.error('Auth Server: Error ensuring admin role for existing user (in createUser catch):', e);
            }
        } else {
            console.error('Auth Server: Error creating/verifying first admin user:', error.message, '(Code:', error.code, ')');
        }
    }
}

/**
 * Middleware to check if the authenticated user has the 'admin' role.
 * Requires `req.user` to be populated by `verifyFirebaseToken`.
 * Also checks the user's role in Firestore as a fallback/verification.
 * @param {object} req - Express request object with `req.user`.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
async function isAdmin(req, res, next) {
    // Check claims first for performance
    if (req.user && req.user.role === 'admin') {
        console.log('Auth Server: isAdmin check - Admin role found in claims for user:', req.user.uid);
        return next();
    }

    // Fallback check in Firestore
    if (req.user && req.user.uid) {
        try {
            console.log('Auth Server: isAdmin check - Role not in claims, checking Firestore for user:', req.user.uid);
            const userDoc = await db.collection('users').doc(req.user.uid).get();
            if (userDoc.exists && userDoc.data().role === 'admin') {
                 console.log('Auth Server: isAdmin check - Admin role found in Firestore for user:', req.user.uid);
                return next();
            }
             console.log('Auth Server: isAdmin check - Admin role NOT found in Firestore for user:', req.user.uid);
        } catch (dbError) {
            console.error("Auth Server: Error fetching user role from DB for admin check:", dbError.message, '(User ID:', req.user.uid, ')');
        }
    }

    console.warn('Auth Server: isAdmin check - Access denied for user:', req.user?.uid || 'unknown');
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
}

/**
 * Example admin-only route.
 * Requires authentication and admin role.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
app.get('/admin/dashboard', verifyFirebaseToken, isAdmin, (req, res) => {
    res.json({ message: 'Welcome to the Admin Dashboard!', adminUser: req.user.email });
});

// CSRF error handler specific to csurf's error code
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        console.warn('Auth Server: CSRF token validation failed (EBADCSRFTOKEN):', req.method, req.path, 'IP:', req.ip, 'Message:', err.message);
        res.status(403).json({ error: 'Invalid CSRF token. Please refresh the page and try again.' });
    } else {
        next(err);
    }
});

// Generic error handler (must be last app.use())
/**
 * Generic error handling middleware.
 * Logs the error stack and sends a generic error response to the client.
 * Includes error details in non-production environments.
 * @param {object} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
app.use((err, req, res, next) => {
    console.error("Auth Server: Unhandled error in Express:", err.stack, '(Path:', req.path, ', Method:', req.method, ')');
    const errorResponse = { error: 'Something went wrong on the server!' };
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.details = err.message;
    }
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.status || 500).json(errorResponse);
});

// Start the server
app.listen(PORT, async () => {
    try {
        console.log(`Auth server running on http://localhost:${PORT}`);
        console.log(`Auth Server: Login page will be available at your public domain or http://localhost:${PORT} for local dev`);
        console.log(`Auth Server: Serving static files from: ${path.join(__dirname, 'public')}`);
        console.log(`Auth Server: CORS enabled for origins: ${corsOrigins.join(', ')}`);
        await createFirstAdminUser();
    } catch (startupError) {
        console.error("CRITICAL STARTUP ERROR:", startupError.stack);
        process.exit(1);
    }
});
