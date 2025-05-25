// game/gameManager.js

/**
 * @fileoverview Manages game flow, questions, timers, and scoring during active games.
 */

const { GAME_CONFIG } = require('./config');
const { getQuestionsForCategory, calculatePoints, prepareQuestionForClient } = require('./gameLogic');
const { getLobby, scheduleLobbyCleanup } = require('./lobbyManager');
const { saveGameResults } = require('./database');

/**
 * Starts a game in the specified lobby.
 * @param {string} lobbyId - The lobby ID.
 * @param {Object} questionsData - The loaded questions data.
 * @param {Object} io - Socket.IO server instance.
 * @returns {boolean} True if game started successfully.
 */
function startGame(lobbyId, questionsData, io) {
    const lobby = getLobby(lobbyId);
    if (!lobby) {
        console.error(`❌ Cannot start game: Lobby ${lobbyId} not found`);
        return false;
    }

    if (!lobby.selectedCategory) {
        console.error(`❌ Cannot start game: No category selected for lobby ${lobbyId}`);
        return false;
    }

    const playerCount = Object.keys(lobby.players).length;
    if (playerCount === 0) {
        console.error(`❌ Cannot start game: No players in lobby ${lobbyId}`);
        return false;
    }

    // Get questions for the selected category
    lobby.questions = getQuestionsForCategory(lobby.selectedCategory, questionsData);
    lobby.currentQuestionIndex = 0;
    lobby.gameState = 'playing';
    lobby.currentQuestion = null;
    lobby.questionStartTime = null;
    lobby.questionTimer = null;

    // Reset all player scores and answers
    Object.keys(lobby.players).forEach(playerId => {
        lobby.players[playerId].score = 0;
        lobby.players[playerId].answers = [];
        lobby.players[playerId].currentAnswer = null;
        lobby.players[playerId].hasAnswered = false;
    });

    console.log(`🎮 Game started in lobby ${lobbyId} with category ${lobby.selectedCategory}`);
    console.log(`📝 Loaded ${lobby.questions.length} questions`);

    // Notify all players that game has started
    io.to(lobbyId).emit('gameStarted', {
        category: lobby.selectedCategory,
        totalQuestions: lobby.questions.length,
        playersCount: playerCount
    });

    // Start first question after a delay
    setTimeout(() => {
        sendNextQuestion(lobbyId, io);
    }, GAME_CONFIG.GAME_START_DELAY);

    return true;
}

/**
 * Sends the next question to all players in a lobby.
 * @param {string} lobbyId - The lobby ID.
 * @param {Object} io - Socket.IO server instance.
 */
function sendNextQuestion(lobbyId, io) {
    const lobby = getLobby(lobbyId);
    if (!lobby || lobby.gameState !== 'playing') {
        return;
    }

    // Check if game is finished
    if (lobby.currentQuestionIndex >= lobby.questions.length) {
        endGame(lobbyId, io);
        return;
    }

    const question = lobby.questions[lobby.currentQuestionIndex];
    const timeLimit = question.timeLimit || GAME_CONFIG.DEFAULT_TIME_LIMIT;

    // Prepare question data (without correct answer)
    const questionData = prepareQuestionForClient(
        question,
        lobby.currentQuestionIndex + 1,
        lobby.questions.length,
        lobby.selectedCategory
    );

    // Reset answer states for all players
    Object.keys(lobby.players).forEach(playerId => {
        lobby.players[playerId].hasAnswered = false;
        lobby.players[playerId].currentAnswer = null;
    });

    // Set current question and start time
    lobby.currentQuestion = question;
    lobby.questionStartTime = Date.now();

    console.log(`📋 Sending question ${lobby.currentQuestionIndex + 1}/${lobby.questions.length} to lobby ${lobbyId}`);

    // Send question to all players
    io.to(lobbyId).emit('newQuestion', questionData);

    // Set timer to end question automatically
    lobby.questionTimer = setTimeout(() => {
        console.log(`⏰ Time up for question ${lobby.currentQuestionIndex + 1} in lobby ${lobbyId}`);
        endCurrentQuestion(lobbyId, io);
    }, timeLimit * 1000);
}

/**
 * Ends the current question and shows results.
 * @param {string} lobbyId - The lobby ID.
 * @param {Object} io - Socket.IO server instance.
 */
function endCurrentQuestion(lobbyId, io) {
    const lobby = getLobby(lobbyId);
    if (!lobby || !lobby.currentQuestion) {
        return;
    }

    // Clear the timer
    if (lobby.questionTimer) {
        clearTimeout(lobby.questionTimer);
        lobby.questionTimer = null;
    }

    const question = lobby.currentQuestion;
    const questionNumber = lobby.currentQuestionIndex + 1;

    // Compile results for this question
    const questionResults = {
        questionNumber: questionNumber,
        question: question.text,
        correctAnswer: question.answer,
        options: question.options,
        playerAnswers: {}
    };

    // Get all player answers for this question
    Object.keys(lobby.players).forEach(playerId => {
        const player = lobby.players[playerId];
        if (player.connected) {
            questionResults.playerAnswers[playerId] = {
                name: player.name,
                answer: player.currentAnswer?.answer || null,
                isCorrect: player.currentAnswer?.isCorrect || false,
                pointsEarned: player.currentAnswer?.pointsEarned || 0,
                timeToAnswer: player.currentAnswer?.timeToAnswer || null,
                totalScore: player.score
            };
        }
    });

    console.log(`📊 Question ${questionNumber} ended in lobby ${lobbyId}`);

    // Send results to all players
    io.to(lobbyId).emit('questionEnded', questionResults);

    // Move to next question
    lobby.currentQuestionIndex++;
    lobby.currentQuestion = null;
    lobby.questionStartTime = null;

    // Send next question after a delay
    setTimeout(() => {
        sendNextQuestion(lobbyId, io);
    }, GAME_CONFIG.QUESTION_DELAY);
}

/**
 * Processes a player's answer submission.
 * @param {string} lobbyId - The lobby ID.
 * @param {string} playerId - The player ID.
 * @param {string} answer - The submitted answer.
 * @param {Object} io - Socket.IO server instance.
 * @returns {Object|null} Answer feedback data or null if invalid.
 */
function submitAnswer(lobbyId, playerId, answer, io) {
    const lobby = getLobby(lobbyId);
    if (!lobby || lobby.gameState !== 'playing' || !lobby.players[playerId]) {
        return null;
    }

    // Check if question is still active
    if (!lobby.currentQuestion || lobby.players[playerId].hasAnswered) {
        return null;
    }

    const player = lobby.players[playerId];
    const question = lobby.currentQuestion;
    const answerTime = Date.now() - lobby.questionStartTime;
    const timeLimit = (question.timeLimit || GAME_CONFIG.DEFAULT_TIME_LIMIT) * 1000;

    // Check if answer was submitted in time
    if (answerTime > timeLimit) {
        console.log(`⏰ Late answer from ${playerId}, time: ${answerTime}ms, limit: ${timeLimit}ms`);
        return null;
    }

    // Record the answer
    const isCorrect = answer === question.answer;
    const points = calculatePoints(isCorrect, answerTime, timeLimit);

    player.currentAnswer = {
        questionIndex: lobby.currentQuestionIndex,
        answer: answer,
        isCorrect: isCorrect,
        timeToAnswer: answerTime,
        pointsEarned: points,
        submittedAt: new Date()
    };

    player.answers.push(player.currentAnswer);
    player.score += points;
    player.hasAnswered = true;

    console.log(`✅ ${playerId} answered "${answer}" (${isCorrect ? 'correct' : 'wrong'}) in ${answerTime}ms, earned ${points} points`);

    // Check if all players have answered
    const activePlayers = Object.values(lobby.players).filter(p => p.connected);
    const answeredPlayers = activePlayers.filter(p => p.hasAnswered);

    if (answeredPlayers.length === activePlayers.length) {
        // All players answered, end question early
        console.log(`🏁 All players answered question ${lobby.currentQuestionIndex + 1}`);
        endCurrentQuestion(lobbyId, io);
    }

    // Send live score update
    sendLiveScores(lobbyId, io);

    // Return feedback data
    return {
        isCorrect: isCorrect,
        correctAnswer: question.answer,
        pointsEarned: points,
        totalScore: player.score,
        timeToAnswer: answerTime
    };
}

/**
 * Sends live scores update to all players in a lobby.
 * @param {string} lobbyId - The lobby ID.
 * @param {Object} io - Socket.IO server instance.
 */
function sendLiveScores(lobbyId, io) {
    const lobby = getLobby(lobbyId);
    if (!lobby) return;

    const scores = Object.values(lobby.players)
        .filter(player => player.connected)
        .map(player => ({
            playerId: player.id,
            name: player.name,
            score: player.score,
            hasAnswered: player.hasAnswered
        }))
        .sort((a, b) => b.score - a.score); // Sort by score descending

    io.to(lobbyId).emit('liveScores', { scores });
}

/**
 * Ends the game and shows final results.
 * @param {string} lobbyId - The lobby ID.
 * @param {Object} io - Socket.IO server instance.
 */
function endGame(lobbyId, io) {
    const lobby = getLobby(lobbyId);
    if (!lobby) return;

    lobby.gameState = 'finished';

    // Calculate final results
    const finalResults = Object.values(lobby.players)
        .filter(player => player.connected)
        .map(player => ({
            playerId: player.id,
            name: player.name,
            score: player.score,
            correctAnswers: player.answers.filter(a => a.isCorrect).length,
            totalAnswers: player.answers.length,
            averageTime: player.answers.length > 0
                ? Math.round(player.answers.reduce((sum, a) => sum + (a.timeToAnswer || 0), 0) / player.answers.length)
                : 0
        }))
        .sort((a, b) => b.score - a.score); // Sort by score descending

    // Assign rankings
    finalResults.forEach((player, index) => {
        player.rank = index + 1;
        if (index === 0) player.medal = 'gold';
        else if (index === 1) player.medal = 'silver';
        else if (index === 2) player.medal = 'bronze';
    });

    const gameResults = {
        category: lobby.selectedCategory,
        totalQuestions: lobby.questions.length,
        players: finalResults,
        gameData: {
            lobbyId: lobbyId,
            startedAt: lobby.createdAt,
            endedAt: new Date(),
            duration: Date.now() - lobby.createdAt.getTime()
        }
    };

    console.log(`🏁 Game ended in lobby ${lobbyId}. Winner: ${finalResults[0]?.name} with ${finalResults[0]?.score} points`);

    // Send final results to all players
    io.to(lobbyId).emit('gameEnded', gameResults);

    // Save results to database (async, don't wait)
    saveGameResults(gameResults).catch(error => {
        console.error('Error saving game results:', error);
    });

    // Schedule lobby cleanup
    scheduleLobbyCleanup(lobbyId);
}

module.exports = {
    startGame,
    sendNextQuestion,
    endCurrentQuestion,
    submitAnswer,
    sendLiveScores,
    endGame
};