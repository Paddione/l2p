// game/database.js

/**
 * @fileoverview Database operations for game results and player statistics.
 */

const { db } = require('./firebaseAdmin');

/**
 * Saves game results to the database.
 * @param {Object} gameResults - Complete game results data.
 * @returns {Promise<void>}
 */
async function saveGameResults(gameResults) {
    try {
        // Save to Firestore for leaderboards
        const gameDoc = {
            category: gameResults.category,
            totalQuestions: gameResults.totalQuestions,
            startedAt: gameResults.gameData.startedAt,
            endedAt: gameResults.gameData.endedAt,
            duration: gameResults.gameData.duration,
            playerCount: gameResults.players.length,
            winner: gameResults.players[0] || null,
            players: gameResults.players
        };

        await db.collection('gameResults').add(gameDoc);
        console.log('✅ Game results saved to database');

        // Update player statistics
        for (const player of gameResults.players) {
            if (!player.playerId.startsWith('guest_')) {
                await updatePlayerStats(player.playerId, player);
            }
        }

    } catch (error) {
        console.error('❌ Error saving game results:', error);
        throw error;
    }
}

/**
 * Updates individual player statistics.
 * @param {string} playerId - The player's ID.
 * @param {Object} playerResult - The player's game result data.
 * @returns {Promise<void>}
 */
async function updatePlayerStats(playerId, playerResult) {
    try {
        const statsRef = db.collection('playerStats').doc(playerId);
        const statsDoc = await statsRef.get();

        if (statsDoc.exists) {
            // Update existing stats
            const currentStats = statsDoc.data();
            await statsRef.update({
                gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
                totalScore: (currentStats.totalScore || 0) + playerResult.score,
                totalCorrectAnswers: (currentStats.totalCorrectAnswers || 0) + playerResult.correctAnswers,
                totalQuestions: (currentStats.totalQuestions || 0) + playerResult.totalAnswers,
                wins: (currentStats.wins || 0) + (playerResult.rank === 1 ? 1 : 0),
                lastPlayed: new Date(),
                bestScore: Math.max(currentStats.bestScore || 0, playerResult.score)
            });
        } else {
            // Create new stats document
            await statsRef.set({
                playerId: playerId,
                gamesPlayed: 1,
                totalScore: playerResult.score,
                totalCorrectAnswers: playerResult.correctAnswers,
                totalQuestions: playerResult.totalAnswers,
                wins: playerResult.rank === 1 ? 1 : 0,
                firstPlayed: new Date(),
                lastPlayed: new Date(),
                bestScore: playerResult.score
            });
        }

        console.log(`✅ Updated stats for player ${playerId}`);
    } catch (error) {
        console.error(`❌ Error updating stats for player ${playerId}:`, error);
        // Don't throw here to avoid breaking game flow
    }
}

/**
 * Gets player statistics from the database.
 * @param {string} playerId - The player's ID.
 * @returns {Promise<Object|null>} Player statistics or null if not found.
 */
async function getPlayerStats(playerId) {
    try {
        const statsDoc = await db.collection('playerStats').doc(playerId).get();
        if (statsDoc.exists) {
            return statsDoc.data();
        }
        return null;
    } catch (error) {
        console.error(`❌ Error getting stats for player ${playerId}:`, error);
        return null;
    }
}

/**
 * Gets leaderboard data.
 * @param {number} limit - Maximum number of entries to return.
 * @param {string} orderBy - Field to order by ('totalScore', 'wins', 'gamesPlayed').
 * @returns {Promise<Array>} Array of leaderboard entries.
 */
async function getLeaderboard(limit = 10, orderBy = 'totalScore') {
    try {
        const snapshot = await db.collection('playerStats')
            .orderBy(orderBy, 'desc')
            .limit(limit)
            .get();

        const leaderboard = [];
        snapshot.forEach(doc => {
            leaderboard.push({
                playerId: doc.id,
                ...doc.data()
            });
        });

        return leaderboard;
    } catch (error) {
        console.error('❌ Error getting leaderboard:', error);
        return [];
    }
}

/**
 * Gets recent game results.
 * @param {number} limit - Maximum number of games to return.
 * @returns {Promise<Array>} Array of recent game results.
 */
async function getRecentGames(limit = 10) {
    try {
        const snapshot = await db.collection('gameResults')
            .orderBy('endedAt', 'desc')
            .limit(limit)
            .get();

        const games = [];
        snapshot.forEach(doc => {
            games.push({
                gameId: doc.id,
                ...doc.data()
            });
        });

        return games;
    } catch (error) {
        console.error('❌ Error getting recent games:', error);
        return [];
    }
}

module.exports = {
    saveGameResults,
    updatePlayerStats,
    getPlayerStats,
    getLeaderboard,
    getRecentGames
};