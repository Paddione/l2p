// firebaseAdmin.js

/**
 * @fileoverview Firebase Admin SDK initialization and configuration.
 * This file can be used in both auth and game server directories.
 * Configured specifically for Docker development with service-account.json
 */

const admin = require('firebase-admin');

// Prevent multiple initializations
if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin: Already initialized, using existing instance');
} else {
    // Initialize Firebase Admin SDK using service-account.json
    let serviceAccount;

    try {
        // Load service account from service-account.json file (Docker standard)
        serviceAccount = require('./service-account.json');
        console.log('✅ Firebase Admin: Loaded service-account.json file');
    } catch (error) {
        console.error('❌ Firebase Admin: Failed to load service-account.json');
        console.error('Please ensure service-account.json exists in the application directory');
        console.error('Error details:', error.message);
        process.exit(1);
    }

    // Initialize Firebase Admin with service account
    try {
        const config = {
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
        };

        admin.initializeApp(config);
        console.log(`✅ Firebase Admin SDK initialized successfully for project: ${serviceAccount.project_id}`);
    } catch (error) {
        console.error('❌ Firebase Admin SDK initialization failed:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    }
}

// Export Firebase services
const db = admin.firestore();
const auth = admin.auth();

// Configure Firestore settings
try {
    db.settings({
        timestampsInSnapshots: true
    });
} catch (settingsError) {
    // Settings might already be configured, ignore the error
    console.log('⚠️ Firestore settings already configured');
}

// Log successful initialization
const app = admin.apps[0];
if (app) {
    console.log(`✅ Firebase Admin services ready for project: ${app.options.projectId || 'unknown'}`);
} else {
    console.error('❌ Firebase Admin app not found after initialization');
}

module.exports = {
    admin,
    db,
    auth
};