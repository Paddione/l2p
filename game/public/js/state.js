// js/state.js

/**
 * @fileoverview Manages the shared state of the quiz game application.
 * This includes references to the socket, Firebase instances, current game details,
 * player information, UI states, and configurations.
 */

// Initial state values
export const gameState = {
    // Socket.IO
    socket: null,

    // Firebase
    firebaseApp: null,
    firebaseAuth: null,
    currentUser: null,
    idToken: null,
    firebaseConfig: null, // Will be populated from window.GAME_CONFIG

    // Lobby and Player
    currentLobbyId: null,
    currentPlayerId: null,
    currentPlayerName: localStorage.getItem('quizPlayerName') || '',
    isHost: false,

    // Game
    currentQuestionData: null,
    questionTimer: null,
    selectedAnswer: null,
    availableCategories: [], // Will be fetched from API

    // UI and Sound
    userHasInteracted: false, // For enabling auto-play sounds
    isMuted: localStorage.getItem('quizMuted') === 'true',
    currentScreen: 'loading', // Tracks the currently visible screen

    // DOM Element references - will be populated by ui.js
    elements: {},
};

// --- State Modifier Functions ---

export function setSocket(newSocket) {
    gameState.socket = newSocket;
    console.log('State: Socket updated', gameState.socket ? gameState.socket.id : 'null');
}

export function setFirebaseInstances(app, auth) {
    gameState.firebaseApp = app;
    gameState.firebaseAuth = auth;
    console.log('State: Firebase instances set.');
}

export function setCurrentUser(user, token) {
    gameState.currentUser = user;
    gameState.idToken = token;
    if (user) {
        gameState.currentPlayerName = user.displayName || user.email || 'Authenticated User';
    }
    console.log('State: Current user updated', user ? user.uid : 'null');
}

export function clearCurrentUser() {
    gameState.currentUser = null;
    gameState.idToken = null;
    gameState.currentPlayerName = ''; // Or reset to guest name if applicable
    console.log('State: Current user cleared.');
}

export function setLobbyDetails(lobbyId, playerId, hostStatus) {
    gameState.currentLobbyId = lobbyId;
    gameState.currentPlayerId = playerId;
    gameState.isHost = hostStatus;
    console.log(`State: Lobby details set - ID: ${lobbyId}, PlayerID: ${playerId}, IsHost: ${hostStatus}`);
}

// Add the missing function
export function setCurrentPlayerId(playerId) {
    gameState.currentPlayerId = playerId;
    console.log('State: Current player ID set to', playerId);
}

export function clearLobbyDetails() {
    gameState.currentLobbyId = null;
    gameState.currentPlayerId = null;
    gameState.isHost = false;
    console.log('State: Lobby details cleared.');
}

export function setPlayerName(name) {
    gameState.currentPlayerName = name;
    localStorage.setItem('quizPlayerName', name);
    console.log('State: Player name set to', name);
}

export function setGameConfig(config) {
    gameState.firebaseConfig = config;
    console.log('State: Game config set.');
}

export function setAvailableCategories(categories) {
    gameState.availableCategories = categories;
    console.log('State: Available categories updated', categories);
}

export function setCurrentQuestion(questionData) {
    gameState.currentQuestionData = questionData;
    gameState.selectedAnswer = null; // Reset selected answer for new question
    console.log('State: Current question set', questionData ? questionData.text : 'null');
}

export function setSelectedAnswer(answer) {
    gameState.selectedAnswer = answer;
    console.log('State: Selected answer set to', answer);
}

export function setQuestionTimer(timerId) {
    gameState.questionTimer = timerId;
}

export function clearQuestionTimer() {
    if (gameState.questionTimer) {
        clearInterval(gameState.questionTimer);
        gameState.questionTimer = null;
        console.log('State: Question timer cleared.');
    }
}

export function setUserInteracted(interacted) {
    gameState.userHasInteracted = interacted;
    console.log('State: User interaction status set to', interacted);
}

export function setMuted(muted) {
    gameState.isMuted = muted;
    localStorage.setItem('quizMuted', muted.toString());
    // This function might also need to update the sound objects' muted state directly
    // or trigger an event for sound.js to handle it.
    console.log('State: Muted status set to', muted);
}

export function setCurrentScreen(screenName) {
    gameState.currentScreen = screenName;
    console.log('State: Current screen set to', screenName);
}

export function setDomElements(elements) {
    gameState.elements = elements;
    console.log('State: DOM elements references set.');
}

// Add the missing resetGameState function
export function resetGameState() {
    // Clear lobby and player details
    clearLobbyDetails();

    // Clear game-specific data
    gameState.currentQuestionData = null;
    gameState.selectedAnswer = null;
    clearQuestionTimer();

    // Reset screen to initial state
    gameState.currentScreen = 'loading';

    // Keep user preferences (name, muted status)
    // Keep Firebase instances and auth state
    // Keep DOM element references

    console.log('State: Game state reset to initial values.');
}

// --- Getter Functions (examples, can add more as needed) ---
export function getSocket() { return gameState.socket; }
export function getCurrentLobbyId() { return gameState.currentLobbyId; }
export function getCurrentPlayerId() { return gameState.currentPlayerId; }
export function getCurrentPlayerName() { return gameState.currentPlayerName; }
export function getIsHost() { return gameState.isHost; }
export function getIsMuted() { return gameState.isMuted; }
export function getUserHasInteracted() { return gameState.userHasInteracted; }
export function getFirebaseConfig() { return gameState.firebaseConfig; }
export function getFirebaseAuth() { return gameState.firebaseAuth; }
export function getCurrentUser() { return gameState.currentUser; }
export function getIdToken() { return gameState.idToken; }
export function getAvailableCategories() { return gameState.availableCategories; }
export function getCurrentQuestionData() { return gameState.currentQuestionData; }
export function getSelectedAnswer() { return gameState.selectedAnswer; }

console.log('state.js loaded');