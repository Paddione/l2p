// auth/app.js
require('dotenv').config({ path: '.env.auth' }); // Load environment variables

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser'); // Require cookie-parser
const csurf = require('csurf'); // Require csurf
const helmet = require('helmet');
const path = require('path'); // For serving static files

const { db, auth: adminAuth, admin } = require('./firebaseAdmin'); // Firebase Admin SDK
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
            "connect-src": ["'self'", "*.googleapis.com", "*.firebaseio.com", "https://*.firebaseapp.com", "http://localhost:" + PORT],
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
        if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps or curl requests)
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

// Use cookie-parser BEFORE session and csurf
app.use(cookieParser());

app.use(
    session({
        name: (process.env.SESSION_COOKIE_NAME || '_app_session'), // Using a distinct name for the session cookie
        secret: process.env.SESSION_SECRET || 'fallback_secret_auth_super_secure_!@#', // IMPORTANT: Ensure SESSION_SECRET is set in .env.auth
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

// Initialize csurf middleware AFTER cookieParser and session
const csrfProtection = csurf({
    cookie: { // This configures csurf to store its secret in a cookie
        key: process.env.CSRF_SECRET_COOKIE_NAME || '_csrf_secret', // Using a distinct name for the CSRF secret cookie
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    }
});
app.use(csrfProtection); // Apply CSRF protection globally

// Serve static files from 'public' directory.
// GET requests for static files are ignored by csurf by default.
app.use(express.static(path.join(__dirname, 'public')));

// --- Dynamic HTML Generation Function ---
function generateIndexHtml(clientFirebaseConfig, csrfToken) {
    const firebaseConfigJson = JSON.stringify(clientFirebaseConfig);
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
        console.log('Server-generated HTML: window.FIREBASE_CONFIG set:', window.FIREBASE_CONFIG ? "Object present" : "Still undefined/falsy", JSON.stringify(window.FIREBASE_CONFIG));
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

// Middleware to verify Firebase ID token
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
        console.error('Error verifying Firebase ID token:', error);
        return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
}

// Route for the main login/auth page
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

        console.log("Auth Server: Client Firebase Config to be embedded:", JSON.stringify(clientFirebaseConfig));
        if (!clientFirebaseConfig.apiKey || !clientFirebaseConfig.authDomain || !clientFirebaseConfig.projectId) {
            console.error("CRITICAL SERVER-SIDE ERROR: Essential Firebase client configuration is missing from environment variables. The login page will not function correctly.");
            return res.status(500).send('Server configuration error. Please contact administrator.');
        }

        const csrfToken = req.csrfToken();
        const htmlContent = generateIndexHtml(clientFirebaseConfig, csrfToken);
        res.send(htmlContent);
    } catch (routeError) {
        console.error("Error in '/' route handler:", routeError);
        next(routeError);
    }
});

// API route for user registration
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
        console.error('Error creating new user:', error);
        let errorMessage = 'Failed to register user.';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'This email address is already in use.';
        } else if (error.code === 'auth/invalid-password') {
            errorMessage = error.message;
        }

        if (error.code && (error.code.startsWith('auth/') || res.headersSent)) {
            return res.status(400).json({ error: errorMessage, code: error.code });
        }
        next(error);
    }
});

// Mount Hall of Fame routes
app.use('/api/hall-of-fame', hallOfFameRoutes);

// API route to get current user's profile
app.get('/api/user', verifyFirebaseToken, async (req, res, next) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (!userDoc.exists) {
            console.warn(`User profile not found in Firestore for UID: ${req.user.uid}. Creating a basic profile.`);
            const basicProfile = {
                email: req.user.email,
                displayName: req.user.name || req.user.email.split('@')[0],
                role: 'user',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isVerified: req.user.email_verified
            };
            await db.collection('users').doc(req.user.uid).set(basicProfile);
            return res.json({ user: { uid: req.user.uid, ...basicProfile }});
        }
        res.json({ user: { uid: req.user.uid, ...userDoc.data() } });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        next(error);
    }
});

// Function to create the first admin user if not exists
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
            console.error('Auth Server: Error creating/verifying first admin user:', error);
        }
    }
}

// Middleware to check if user is admin
async function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    if (req.user && req.user.uid) {
        try {
            const userDoc = await db.collection('users').doc(req.user.uid).get();
            if (userDoc.exists && userDoc.data().role === 'admin') {
                return next();
            }
        } catch (dbError) {
            console.error("Auth Server: Error fetching user role from DB for admin check:", dbError);
        }
    }
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
}

// Example admin-only route
app.get('/admin/dashboard', verifyFirebaseToken, isAdmin, (req, res) => {
    res.json({ message: 'Welcome to the Admin Dashboard!', adminUser: req.user.email });
});

// CSRF error handler specific to csurf's error code
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        console.warn('Auth Server: CSRF token validation failed (EBADCSRFTOKEN):', req.path, req.ip, err.message);
        res.status(403).json({ error: 'Invalid CSRF token. Please refresh the page and try again.' });
    } else {
        next(err);
    }
});

// Generic error handler (must be last app.use())
app.use((err, req, res, next) => {
    console.error("Auth Server: Unhandled error in Express:", err.stack);
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
