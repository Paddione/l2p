// auth/routes/hallOfFame.js
const express = require('express');
const { db, auth: adminAuth } = require('../firebaseAdmin'); // Firebase Admin SDK
const router = express.Router();

// Middleware to verify Firebase ID token for protected routes
async function verifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided for Hall of Fame' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        req.user = decodedToken; // Add user info (uid, email, etc.) to request object
        next();
    } catch (error) {
        console.error('Error verifying Firebase ID token for Hall of Fame:', error);
        return res.status(403).json({ error: 'Unauthorized: Invalid token for Hall of Fame' });
    }
}

// POST /api/hall-of-fame/submit - Submit a score
// Requires authentication
router.post('/submit', verifyFirebaseToken, async (req, res) => {
    const { score, category, playerName } = req.body;
    const userId = req.user.uid; // Get user ID from verified token

    if (typeof score !== 'number' || !category || !playerName) {
        return res.status(400).json({ error: 'Missing score, category, or playerName.' });
    }

    try {
        const userDoc = await db.collection('users').doc(userId).get();
        let actualPlayerName = playerName;
        if (userDoc.exists && userDoc.data().displayName) {
            actualPlayerName = userDoc.data().displayName; // Prefer displayName from user profile
        }

        const entry = {
            userId: userId,
            playerName: actualPlayerName,
            score: parseInt(score, 10),
            category: category,
            submittedAt: new Date(), // Using client-side date, consider server timestamp
            // submittedAt: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp
        };
        const docRef = await db.collection('hallOfFame').add(entry);
        res.status(201).json({ message: 'Score submitted successfully!', id: docRef.id, entry });
    } catch (error) {
        console.error('Error submitting score to Hall of Fame:', error);
        res.status(500).json({ error: 'Failed to submit score.' });
    }
});

// GET /api/hall-of-fame - Retrieve Hall of Fame data
// Does not require authentication to view
router.get('/', async (req, res) => {
    const { category, limit = 10, sortBy = 'score', order = 'desc' } = req.query;
    const numLimit = parseInt(limit, 10);

    if (isNaN(numLimit) || numLimit <= 0 || numLimit > 100) {
        return res.status(400).json({ error: 'Invalid limit parameter. Must be between 1 and 100.' });
    }
    if (order !== 'asc' && order !== 'desc') {
        return res.status(400).json({ error: 'Invalid order parameter. Must be "asc" or "desc".' });
    }
    // Firestore does not support ordering by multiple fields if one is an inequality.
    // For simplicity, allow sorting by score or submittedAt.
    if (sortBy !== 'score' && sortBy !== 'submittedAt') {
        return res.status(400).json({ error: 'Invalid sortBy parameter. Must be "score" or "submittedAt".' });
    }


    try {
        let query = db.collection('hallOfFame');

        if (category) {
            query = query.where('category', '==', category);
        }

        // Order by the specified field and then by date as a secondary sort for tie-breaking if primary is score
        if (sortBy === 'score') {
            query = query.orderBy('score', order).orderBy('submittedAt', 'desc');
        } else { // sortBy === 'submittedAt'
            query = query.orderBy('submittedAt', order);
        }

        query = query.limit(numLimit);

        const snapshot = await query.get();
        if (snapshot.empty) {
            return res.json([]);
        }

        const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(entries);
    } catch (error) {
        console.error('Error retrieving Hall of Fame:', error);
        // Firestore specific error for complex queries needing composite indexes
        if (error.code === 'failed-precondition') {
            return res.status(500).json({
                error: 'Query requires a composite index. Please create it in your Firebase console.',
                details: error.message
            });
        }
        res.status(500).json({ error: 'Failed to retrieve Hall of Fame.' });
    }
});

module.exports = router;
