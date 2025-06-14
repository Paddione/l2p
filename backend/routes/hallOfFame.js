// backend/routes/hallOfFame.js
const express = require('express');
const router = express.Router();
const HallOfFameEntry = require('../models/HallOfFameEntry');
const User = require('../models/User');
const { authenticateToken, authenticateOptionalToken } = require('../middleware/auth');
const { validateHallOfFameEntry, validateQuery, sanitizeBody } = require('../middleware/validation');

// Apply sanitization to all routes
router.use(sanitizeBody);

/**
 * GET /api/hall-of-fame
 * Get hall of fame entries with optional filtering
 */
router.get('/', 
    authenticateOptionalToken,
    validateQuery({
        catalog: 'catalogName',
        limit: 'questions', // Reusing questions validator for limit (1-50)
        offset: 'score'     // Reusing score validator for offset (0+)
    }),
    async (req, res) => {
        try {
            const {
                catalog,
                limit = 10,
                offset = 0,
                orderBy = 'score',
                orderDirection = 'DESC'
            } = req.query;

            const options = {
                catalogName: catalog || null,
                limit: Math.min(parseInt(limit) || 10, 50),
                offset: Math.max(parseInt(offset) || 0, 0),
                orderBy,
                orderDirection
            };

            const entries = await HallOfFameEntry.getEntries(options);

            res.json({
                entries: entries.map(entry => entry.toJSON()),
                pagination: {
                    limit: options.limit,
                    offset: options.offset,
                    total: entries.length
                },
                filters: {
                    catalog: options.catalogName,
                    orderBy: options.orderBy,
                    orderDirection: options.orderDirection
                }
            });

        } catch (error) {
            console.error('Get hall of fame entries error:', error);
            res.status(500).json({ 
                error: 'Failed to get hall of fame entries',
                code: 'GET_ENTRIES_ERROR'
            });
        }
    }
);

/**
 * POST /api/hall-of-fame
 * Add a new hall of fame entry
 */
router.post('/', 
    authenticateToken,
    validateHallOfFameEntry,
    async (req, res) => {
        try {
            const { score, questions, accuracy, maxMultiplier, catalogName } = req.body;

            // Get user info for denormalized storage
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ 
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Create hall of fame entry
            const entry = await HallOfFameEntry.create({
                userId: user.id,
                username: user.username,
                character: user.character,
                score,
                questions,
                accuracy,
                maxMultiplier,
                catalogName
            });

            res.status(201).json({
                message: 'Hall of fame entry created successfully',
                entry: entry.toJSON()
            });

        } catch (error) {
            console.error('Add hall of fame entry error:', error);
            res.status(500).json({ 
                error: 'Failed to add hall of fame entry',
                code: 'ADD_ENTRY_ERROR'
            });
        }
    }
);

/**
 * GET /api/hall-of-fame/stats/:catalog
 * Get statistics for a specific catalog
 */
router.get('/stats/:catalog', async (req, res) => {
    try {
        const { catalog } = req.params;
        
        if (!catalog || catalog.length > 100) {
            return res.status(400).json({ 
                error: 'Invalid catalog name',
                code: 'INVALID_CATALOG_NAME'
            });
        }

        const stats = await HallOfFameEntry.getCatalogStats(catalog);

        res.json({
            catalog,
            statistics: stats
        });

    } catch (error) {
        console.error('Get catalog stats error:', error);
        res.status(500).json({ 
            error: 'Failed to get catalog statistics',
            code: 'GET_CATALOG_STATS_ERROR'
        });
    }
});

/**
 * GET /api/hall-of-fame/stats
 * Get overall statistics across all catalogs
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await HallOfFameEntry.getOverallStats();

        res.json({
            statistics: stats
        });

    } catch (error) {
        console.error('Get overall stats error:', error);
        res.status(500).json({ 
            error: 'Failed to get overall statistics',
            code: 'GET_OVERALL_STATS_ERROR'
        });
    }
});

/**
 * GET /api/hall-of-fame/leaderboard/:catalog
 * Get leaderboard for a specific catalog
 */
router.get('/leaderboard/:catalog', async (req, res) => {
    try {
        const { catalog } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        
        if (!catalog || catalog.length > 100) {
            return res.status(400).json({ 
                error: 'Invalid catalog name',
                code: 'INVALID_CATALOG_NAME'
            });
        }

        const leaderboard = await HallOfFameEntry.getLeaderboard(catalog, limit);

        res.json({
            catalog,
            leaderboard,
            total: leaderboard.length
        });

    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ 
            error: 'Failed to get leaderboard',
            code: 'GET_LEADERBOARD_ERROR'
        });
    }
});

/**
 * GET /api/hall-of-fame/catalogs
 * Get top performing catalogs
 */
router.get('/catalogs', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const catalogs = await HallOfFameEntry.getTopCatalogs(limit);

        res.json({
            catalogs,
            total: catalogs.length
        });

    } catch (error) {
        console.error('Get top catalogs error:', error);
        res.status(500).json({ 
            error: 'Failed to get top catalogs',
            code: 'GET_TOP_CATALOGS_ERROR'
        });
    }
});

/**
 * GET /api/hall-of-fame/player/:userId
 * Get all entries for a specific player
 */
router.get('/player/:userId', 
    authenticateOptionalToken,
    async (req, res) => {
        try {
            const { userId } = req.params;
            const limit = Math.min(parseInt(req.query.limit) || 20, 100);

            // Check if requesting own data or if data is public
            const requestingOwnData = req.user && req.user.userId === parseInt(userId);
            
            if (!requestingOwnData) {
                // For privacy, limit what other users can see
                const entries = await HallOfFameEntry.getPlayerEntries(parseInt(userId), Math.min(limit, 10));
                
                res.json({
                    userId: parseInt(userId),
                    entries: entries.map(entry => ({
                        ...entry.toJSON(),
                        // Remove some details for other users
                        questions: undefined,
                        accuracy: undefined
                    })),
                    total: entries.length,
                    isOwnData: false
                });
            } else {
                // Full data for own entries
                const entries = await HallOfFameEntry.getPlayerEntries(parseInt(userId), limit);
                
                res.json({
                    userId: parseInt(userId),
                    entries: entries.map(entry => entry.toJSON()),
                    total: entries.length,
                    isOwnData: true
                });
            }

        } catch (error) {
            console.error('Get player entries error:', error);
            res.status(500).json({ 
                error: 'Failed to get player entries',
                code: 'GET_PLAYER_ENTRIES_ERROR'
            });
        }
    }
);

/**
 * GET /api/hall-of-fame/player/:userId/best/:catalog
 * Get player's best entry for a specific catalog
 */
router.get('/player/:userId/best/:catalog', async (req, res) => {
    try {
        const { userId, catalog } = req.params;

        if (!catalog || catalog.length > 100) {
            return res.status(400).json({ 
                error: 'Invalid catalog name',
                code: 'INVALID_CATALOG_NAME'
            });
        }

        const bestEntry = await HallOfFameEntry.getPlayerBest(parseInt(userId), catalog);

        if (!bestEntry) {
            return res.status(404).json({ 
                error: 'No entries found for this player and catalog',
                code: 'NO_ENTRIES_FOUND'
            });
        }

        res.json({
            userId: parseInt(userId),
            catalog,
            bestEntry: bestEntry.toJSON()
        });

    } catch (error) {
        console.error('Get player best entry error:', error);
        res.status(500).json({ 
            error: 'Failed to get player best entry',
            code: 'GET_PLAYER_BEST_ERROR'
        });
    }
});

/**
 * GET /api/hall-of-fame/my-entries
 * Get current user's entries
 */
router.get('/my-entries', authenticateToken, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const entries = await HallOfFameEntry.getPlayerEntries(req.user.userId, limit);

        res.json({
            entries: entries.map(entry => entry.toJSON()),
            total: entries.length
        });

    } catch (error) {
        console.error('Get my entries error:', error);
        res.status(500).json({ 
            error: 'Failed to get your entries',
            code: 'GET_MY_ENTRIES_ERROR'
        });
    }
});

/**
 * DELETE /api/hall-of-fame/my-entries
 * Delete all entries for current user
 */
router.delete('/my-entries', authenticateToken, async (req, res) => {
    try {
        const deletedCount = await HallOfFameEntry.deleteUserEntries(req.user.userId);

        res.json({
            message: 'Entries deleted successfully',
            deletedCount
        });

    } catch (error) {
        console.error('Delete my entries error:', error);
        res.status(500).json({ 
            error: 'Failed to delete entries',
            code: 'DELETE_MY_ENTRIES_ERROR'
        });
    }
});

/**
 * GET /api/hall-of-fame/:id
 * Get specific hall of fame entry by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const entryId = parseInt(id);

        if (isNaN(entryId)) {
            return res.status(400).json({ 
                error: 'Invalid entry ID',
                code: 'INVALID_ENTRY_ID'
            });
        }

        const entry = await HallOfFameEntry.findById(entryId);

        if (!entry) {
            return res.status(404).json({ 
                error: 'Entry not found',
                code: 'ENTRY_NOT_FOUND'
            });
        }

        res.json(entry.toJSON());

    } catch (error) {
        console.error('Get entry by ID error:', error);
        res.status(500).json({ 
            error: 'Failed to get entry',
            code: 'GET_ENTRY_ERROR'
        });
    }
});

/**
 * PUT /api/hall-of-fame/:id
 * Update hall of fame entry (admin only or corrections)
 */
router.put('/:id', 
    authenticateToken,
    validateHallOfFameEntry,
    async (req, res) => {
        try {
            const { id } = req.params;
            const entryId = parseInt(id);
            const updates = req.body;

            if (isNaN(entryId)) {
                return res.status(400).json({ 
                    error: 'Invalid entry ID',
                    code: 'INVALID_ENTRY_ID'
                });
            }

            // Check if entry exists and belongs to user
            const existingEntry = await HallOfFameEntry.findById(entryId);
            if (!existingEntry) {
                return res.status(404).json({ 
                    error: 'Entry not found',
                    code: 'ENTRY_NOT_FOUND'
                });
            }

            if (existingEntry.userId !== req.user.userId) {
                return res.status(403).json({ 
                    error: 'You can only update your own entries',
                    code: 'FORBIDDEN'
                });
            }

            const updatedEntry = await HallOfFameEntry.update(entryId, updates);

            res.json({
                message: 'Entry updated successfully',
                entry: updatedEntry.toJSON()
            });

        } catch (error) {
            console.error('Update entry error:', error);
            
            if (error.message === 'Entry not found') {
                return res.status(404).json({ 
                    error: 'Entry not found',
                    code: 'ENTRY_NOT_FOUND'
                });
            }

            res.status(500).json({ 
                error: 'Failed to update entry',
                code: 'UPDATE_ENTRY_ERROR'
            });
        }
    }
);

module.exports = router;