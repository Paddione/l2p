// firebaseAdmin.js
// This file initializes the Firebase Admin SDK.
// It should be placed in both the 'auth' and 'game' server directories,
// or managed as a shared module if your project structure allows.

const admin = require('firebase-admin');

// IMPORTANT: Initialize Firebase Admin SDK
// You need to set up a service account and provide its credentials.
// Option 1: Set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// to the path of your service account key file.
// admin.initializeApp();

// Option 2: Initialize with explicit credentials (less common for deployed apps)
/*
try {
  // const serviceAccount = require('./path/to/your-service-account-key.json'); // Replace with your actual path
  // admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount),
  //   // databaseURL: `https://<YOUR_PROJECT_ID>.firebaseio.com` // If using Realtime Database
  // });
  console.log('Firebase Admin SDK initialized.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  // process.exit(1); // Exit if Firebase Admin cannot be initialized
}
*/

// For this example, we'll assume GOOGLE_APPLICATION_CREDENTIALS is set
// or the environment (like Google Cloud Functions/Run) provides default credentials.
// If not initialized elsewhere, do it here.
if (!admin.apps.length) {
    try {
        admin.initializeApp();
        console.log('Firebase Admin SDK initialized successfully.');
    } catch (e) {
        console.error('Firebase Admin SDK initialization error', e);
        // Depending on your error handling strategy, you might want to exit or throw
    }
}


const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
