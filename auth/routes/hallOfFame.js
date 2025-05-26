// auth/routes/hallOfFame.js
const express = require('express');
const { db, auth: adminAuth } = require('../firebaseAdmin'); // Firebase Admin SDK
const router = express.Router();

/**
 * Middleware to verify Firebase ID token from the Authorization header.
 * Attaches the decoded token to `req.user`.
 * Used for protected Hall of Fame routes.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
async function verifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('HallOfFame: Unauthorized - No token provided', '(Path:', req.path, ', Method:', req.method, ')');
        return res.status(401).json({ error: 'Unauthorized: No token provided for Hall of Fame' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        req.user = decodedToken; // Add user info (uid, email, etc.) to request object
        next();
    } catch (error) {
        console.error('HallOfFame: Error verifying Firebase ID token:', error.message, '(Code:', error.code, ', Path:', req.path, ')');
        return res.status(403).json({ error: 'Unauthorized: Invalid token for Hall of Fame' });
    }
}

/**
 * POST /api/hall-of-fame/submit - Submit a score to the Hall of Fame.
 * Requires a valid Firebase ID token.
 * Expects score (number), category (string), and playerName (string) in the request body.
 * @param {object} req - Express request object with body { score, category, playerName } and `req.user` populated.
 * @param {object} res - Express response object.
 */
router.post('/submit', verifyFirebaseToken, async (req, res) => {
    const { score, category, playerName } = req.body;
    const userId = req.user.uid; // Get user ID from verified token

    if (typeof score !== 'number' || !category || !playerName) {
        console.warn('HallOfFame: Submit - Missing score, category, or playerName', '(User ID:', userId, ')');
        return res.status(400).json({ error: 'Missing score, category, or playerName.' });
    }

    // Basic validation for score range if necessary
    if (score < 0 || score > 100000) { // Example range, adjust as needed
         console.warn('HallOfFame: Submit - Score out of expected range', '(User ID:', userId, ', Score:', score, ')');
         return res.status(400).json({ error: 'Score out of valid range.' });
    }

    // Sanitize playerName to prevent potential issues
    const sanitizedPlayerName = playerName.substring(0, 50).replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (!sanitizedPlayerName) {
         console.warn('HallOfFame: Submit - Sanitized playerName is empty', '(Original:', playerName, ', User ID:', userId, ')');
         return res.status(400).json({ error: 'Invalid playerName after sanitization.' });
    }

    try {
        const userDoc = await db.collection('users').doc(userId).get();
        // Prefer displayName from user profile if available and different from submitted playerName
        let actualPlayerName = userDoc.exists && userDoc.data().displayName && userDoc.data().displayName !== sanitizedPlayerName
            ? userDoc.data().displayName
            : sanitizedPlayerName; // Use sanitized version if no profile name or if they match

        const entry = {
            userId: userId,
            playerName: actualPlayerName,
            score: parseInt(score, 10), // Ensure score is stored as an integer
            category: category.substring(0, 50).replace(/[^a-zA-Z0-9\s]/g, '').trim(), // Sanitize category
            // Use server timestamp for consistency
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection('hallOfFame').add(entry);
        console.log('HallOfFame: Score submitted successfully', '(User ID:', userId, ', Score ID:', docRef.id, ')');
        res.status(201).json({ message: 'Score submitted successfully!', id: docRef.id, entry });
    } catch (error) {
        console.error('HallOfFame: Error submitting score:', error.message, '(Code:', error.code, ', User ID:', userId, ')');
        res.status(500).json({ error: 'Failed to submit score.' });
    }
});

/**
 * GET /api/hall-of-fame - Retrieve Hall of Fame data.
 * Does not require authentication.
 * Supports optional query parameters: category, limit, sortBy, order.
 * @param {object} req - Express request object with optional query { category, limit, sortBy, order }.
 * @param {object} res - Express response object.
 */
router.get('/', async (req, res) => {
    const { category, limit = 10, sortBy = 'score', order = 'desc' } = req.query;
    const numLimit = parseInt(limit, 10);
    const sanitizedCategory = category ? category.substring(0, 50).replace(/[^a-zA-Z0-9\s]/g, '').trim() : null;

    if (isNaN(numLimit) || numLimit <= 0 || numLimit > 100) {
         console.warn('HallOfFame: Retrieve - Invalid limit parameter', '(Limit:', limit, ')');
        return res.status(400).json({ error: 'Invalid limit parameter. Must be between 1 and 100.' });
    }
    if (order !== 'asc' && order !== 'desc') {
        console.warn('HallOfFame: Retrieve - Invalid order parameter', '(Order:', order, ')');
        return res.status(400).json({ error: 'Invalid order parameter. Must be "asc" or "desc".' });
    }
    if (sortBy !== 'score' && sortBy !== 'submittedAt') {
        console.warn('HallOfFame: Retrieve - Invalid sortBy parameter', '(SortBy:', sortBy, ')');
        return res.status(400).json({ error: 'Invalid sortBy parameter. Must be "score" or "submittedAt".' });
    }


    try {
        let query = db.collection('hallOfFame');

        if (sanitizedCategory) {
            query = query.where('category', '==', sanitizedCategory);
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
             console.log('HallOfFame: Retrieve - No entries found', '(Category:', sanitizedCategory, ')');
            return res.json([]);
        }

        const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('HallOfFame: Retrieve - Successfully retrieved entries', '(Count:', entries.length, ', Category:', sanitizedCategory, ')');
        res.json(entries);
    } catch (error) {
        console.error('HallOfFame: Error retrieving Hall of Fame:', error.message, '(Code:', error.code, ', Path:', req.path, ')');
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
