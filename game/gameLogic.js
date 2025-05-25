// game/gameLogic.js

/**
 * @fileoverview Game logic, question management, and scoring for the quiz game.
 */

const fs = require('fs');
const path = require('path');
const { GAME_CONFIG } = require('./config');

/**
 * Loads questions from questions.json file.
 * @returns {Object|null} Questions data object or null if failed.
 */
function loadQuestions() {
    let allQuestionsData = { categories: [], fallbackQuestions: [] };

    try {
        const rawQuestions = fs.readFileSync(path.join(__dirname, 'questions.json'));
        allQuestionsData = JSON.parse(rawQuestions);
        console.log('✅ Game Server: Questions loaded successfully');
        console.log('📚 Available categories:', allQuestionsData.categories.map(cat => cat.name));
        return allQuestionsData;
    } catch (error) {
        console.error("❌ Game Server: Error loading questions.json:", error);

        // Create fallback questions
        allQuestionsData.fallbackQuestions.push({
            category: "Error",
            text: "Default question due to loading error. What is 1+1?",
            options: ["1", "2", "3"],
            answer: "2",
            timeLimit: GAME_CONFIG.DEFAULT_TIME_LIMIT
        });

        console.log("⚠️ Using fallback questions");
        return allQuestionsData;
    }
}

/**
 * Gets questions for a specific category.
 * @param {string} category - The category name.
 * @param {Object} questionsData - The loaded questions data.
 * @returns {Array} Array of questions for the category.
 */
function getQuestionsForCategory(category, questionsData) {
    if (!questionsData || !questionsData.categories) {
        console.error('❌ Questions data not available');
        return questionsData?.fallbackQuestions || [];
    }

    const categoryData = questionsData.categories.find(cat => cat.name === category);
    if (!categoryData || !categoryData.questions) {
        console.warn(`⚠️ Category '${category}' not found, using fallback`);
        return questionsData.fallbackQuestions || [];
    }

    // Shuffle and limit questions
    const shuffled = [...categoryData.questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, GAME_CONFIG.QUESTIONS_PER_GAME);
}

/**
 * Calculates points earned for an answer.
 * @param {boolean} isCorrect - Whether the answer is correct.
 * @param {number} timeToAnswer - Time taken to answer in milliseconds.
 * @param {number} timeLimit - Time limit for the question in seconds.
 * @returns {number} Points earned.
 */
function calculatePoints(isCorrect, timeToAnswer, timeLimit) {
    if (!isCorrect) return 0;

    // Base points for correct answer
    const basePoints = 100;

    // Time bonus: faster answers get more points
    const timeLimitMs = timeLimit * 1000;
    const timeRatio = 1 - (timeToAnswer / timeLimitMs);
    const timeBonus = Math.max(0, Math.floor(timeRatio * 50)); // Up to 50 bonus points

    return basePoints + timeBonus;
}

/**
 * Generates a unique lobby ID.
 * @param {Object} lobbies - Current lobbies object to check for uniqueness.
 * @returns {string} Unique 6-character lobby ID.
 */
function generateLobbyId(lobbies) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    do {
        result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (lobbies[result]); // Ensure uniqueness

    return result;
}

/**
 * Gets a display name for a player based on socket user data.
 * @param {Object} socket - Socket object with user data.
 * @returns {string} Display name for the player.
 */
// game/gameLogic.js - Updated getPlayerName function

function getPlayerName(socket) {
    console.log('🔍 getPlayerName called with socket.user:', socket.user);

    // Ensure socket and socket.user exist
    if (!socket || !socket.user) {
        const fallback = `Player-${Date.now()}`;
        console.warn('⚠️ No socket.user available, using fallback:', fallback);
        return fallback;
    }

    // Try different name sources in order of preference
    let name = null;

    if (socket.user.displayName && socket.user.displayName.trim()) {
        name = socket.user.displayName.trim();
    } else if (socket.user.email && socket.user.email.trim()) {
        name = socket.user.email.trim();
    } else if (socket.user.uid) {
        name = `Player-${socket.user.uid.substring(0, 5)}`;
    } else {
        name = `Guest-${socket.id ? socket.id.substring(0, 5) : Date.now()}`;
    }

    // Final safety check
    if (!name || name.trim() === '') {
        name = `Player-${Date.now()}`;
    }

    console.log('🔍 Resolved player name:', name);
    return name;
}

/**
 * Creates a new lobby object.
 * @param {string} lobbyId - The lobby ID.
 * @param {string} hostId - The host player ID.
 * @param {string} hostName - The host player name.
 * @param {string} hostSocketId - The host socket ID.
 * @returns {Object} New lobby object.
 */
function createLobby(lobbyId, hostId, hostName, hostSocketId) {
    return {
        id: lobbyId,
        hostId: hostId,
        gameState: 'waiting', // waiting, playing, finished
        selectedCategory: null,
        questions: [],
        currentQuestionIndex: 0,
        currentQuestion: null,
        questionStartTime: null,
        questionTimer: null,
        players: {
            [hostId]: {
                id: hostId,
                name: hostName,
                socketId: hostSocketId,
                score: 0,
                isReady: false,
                answers: [],
                currentAnswer: null,
                hasAnswered: false,
                connected: true
            }
        },
        createdAt: new Date()
    };
}

/**
 * Creates a new player object.
 * @param {string} playerId - The player ID.
 * @param {string} playerName - The player name.
 * @param {string} socketId - The socket ID.
 * @returns {Object} New player object.
 */
function createPlayer(playerId, playerName, socketId) {
    return {
        id: playerId,
        name: playerName,
        socketId: socketId,
        score: 0,
        isReady: false,
        answers: [],
        currentAnswer: null,
        hasAnswered: false,
        connected: true
    };
}

/**
 * Prepares question data for sending to clients (removes correct answer).
 * @param {Object} question - The question object.
 * @param {number} questionNumber - Current question number.
 * @param {number} totalQuestions - Total number of questions.
 * @param {string} category - The category name.
 * @returns {Object} Question data safe for client.
 */
function prepareQuestionForClient(question, questionNumber, totalQuestions, category) {
    const timeLimit = question.timeLimit || GAME_CONFIG.DEFAULT_TIME_LIMIT;

    return {
        questionNumber,
        totalQuestions,
        text: question.text,
        options: question.options,
        timeLimit,
        category
    };
}

module.exports = {
    loadQuestions,
    getQuestionsForCategory,
    calculatePoints,
    generateLobbyId,
    getPlayerName,
    createLobby,
    createPlayer,
    prepareQuestionForClient
};