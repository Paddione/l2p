// -----------------------------------------------------------------------------
// SECTION 1: HTML Page Generation
// -----------------------------------------------------------------------------
function generateQuizPageHTMLContent() {
    // --- Helper function to create elements ---
    function createEl(tag, attributes = {}, classes = [], textContent = null, innerHTML = null) {
        const el = document.createElement(tag);
        for (const key in attributes) {
            el.setAttribute(key, attributes[key]);
        }
        if (classes && classes.length > 0) {
            const classArray = Array.isArray(classes) ? classes : classes.split(' ');
            classArray.forEach(cls => { if(cls) el.classList.add(cls); });
        }
        if (textContent) {
            el.textContent = textContent;
        }
        if (innerHTML) {
            el.innerHTML = innerHTML;
        }
        return el;
    }

    // --- Configure <html> tag ---
    document.documentElement.lang = 'en';

    // --- Populate <head> ---
    const head = document.head;
    const existingMetaCharset = head.querySelector('meta[charset]');
    head.innerHTML = ''; // Clear head for a fresh start
    if (existingMetaCharset) head.appendChild(existingMetaCharset);

    if (!head.querySelector('meta[charset]')) {
        head.appendChild(createEl('meta', { charset: 'UTF-8' }));
    }
    head.appendChild(createEl('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }));

    // Add Content Security Policy (CSP) meta tag
    const cspParts = [
        "default-src 'self';",
        "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.tailwindcss.com;",
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;",
        "media-src 'self' https://cdn.jsdelivr.net;",
        "connect-src 'self' wss://*.firebaseio.com ws: https://kommillitonen-quiz.firebaseapp.com https://*.firebaseio.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://game.korczewski.de http://localhost:3000 http://localhost:3001;",
        "img-src 'self' data: https:;",
        "font-src 'self' data: https:;"
    ];
    const cspMeta = createEl('meta', {
        'http-equiv': 'Content-Security-Policy',
        content: cspParts.join(' ')
    });
    head.appendChild(cspMeta);

    const titleTag = createEl('title');
    titleTag.textContent = 'Real-Time Quiz Game';
    head.appendChild(titleTag);

    // Placeholder favicon to prevent 404
    const faviconLink = createEl('link', { rel: 'icon', href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎮</text></svg>' });
    head.appendChild(faviconLink);

    head.appendChild(createEl('link', { href: 'https://cdn.tailwindcss.com', rel: 'stylesheet' }));
    head.appendChild(createEl('link', { rel: 'stylesheet', href: 'style.css' }));

    // Firebase SDK scripts
    head.appendChild(createEl('script', { src: 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js'}));
    head.appendChild(createEl('script', { src: 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js'}));
    head.appendChild(createEl('script', { src: 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'}));
    head.appendChild(createEl('script', { src: '/game/socket.io/socket.io.js' }));

    // --- Configure <body> ---
    const body = document.body;
    body.innerHTML = '';
    body.className = 'bg-slate-900 text-slate-100 font-sans flex flex-col items-center justify-center min-h-screen p-4';

    // --- Create App Container ---
    const appContainer = createEl('div', { id: 'app-container' }, 'bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700');
    body.appendChild(appContainer);

    // --- Global Notification ---
    const globalNotification = createEl('div', { id: 'global-notification' }, 'fixed top-5 right-5 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg hidden z-50', 'Notification message');
    body.appendChild(globalNotification);

    // --- Auth Screen ---
    const authScreen = createEl('div', { id: 'auth-screen' }, 'screen');
    authScreen.appendChild(createEl('h1', {}, 'text-3xl font-bold mb-6 text-center text-sky-400', '🎮 Quiz Game Login'));

    const authFormContainer = createEl('div', { id: 'auth-form-container' }, 'space-y-6');

    // Login Form
    const loginFormEl = createEl('form', { id: 'login-form' }, 'bg-slate-700 p-6 rounded-lg border border-slate-600');
    loginFormEl.appendChild(createEl('h2', {}, 'text-xl mb-4 text-sky-300 font-semibold', '🔑 Login'));
    loginFormEl.appendChild(createEl('input', { type: 'email', id: 'login-email', placeholder: 'Email', required: '', autocomplete: 'username' }, 'input-field mb-3'));
    loginFormEl.appendChild(createEl('input', { type: 'password', id: 'login-password', placeholder: 'Password', required: '', autocomplete: 'current-password' }, 'input-field mb-4'));
    loginFormEl.appendChild(createEl('button', { type: 'submit' }, 'btn btn-primary w-full', 'Login'));
    authFormContainer.appendChild(loginFormEl);

    // Register Form
    const registerFormEl = createEl('form', { id: 'register-form' }, 'bg-slate-700 p-6 rounded-lg border border-slate-600');
    registerFormEl.appendChild(createEl('h2', {}, 'text-xl mb-4 text-sky-300 font-semibold', '📝 Register'));
    registerFormEl.appendChild(createEl('input', { type: 'text', id: 'register-displayName', placeholder: 'Display Name', required: '', autocomplete: 'name' }, 'input-field mb-3'));
    registerFormEl.appendChild(createEl('input', { type: 'email', id: 'register-email', placeholder: 'Email', required: '', autocomplete: 'email' }, 'input-field mb-3'));
    registerFormEl.appendChild(createEl('input', { type: 'password', id: 'register-password', placeholder: 'Password (min 6 chars)', required: '', autocomplete: 'new-password' }, 'input-field mb-4'));
    registerFormEl.appendChild(createEl('button', { type: 'submit' }, 'btn btn-secondary w-full', 'Register'));
    authFormContainer.appendChild(registerFormEl);

    authFormContainer.appendChild(createEl('button', { id: 'google-signin-btn' }, 'btn btn-accent w-full', '🔗 Sign in with Google'));
    authScreen.appendChild(authFormContainer);

    authScreen.appendChild(createEl('div', { id: 'auth-loading' }, 'hidden text-center py-4', '⏳ Loading authentication...'));

    const authUserInfo = createEl('div', { id: 'auth-user-info' }, 'hidden text-center bg-slate-700 p-6 rounded-lg border border-slate-600');
    const pUser = createEl('p', {}, 'mb-4', '👤 Logged in as: ');
    pUser.appendChild(createEl('span', { id: 'user-email-display' }, 'font-semibold text-sky-300'));
    authUserInfo.appendChild(pUser);
    authUserInfo.appendChild(createEl('button', { id: 'logout-btn' }, 'btn btn-danger mt-2 mr-2', 'Logout'));
    authUserInfo.appendChild(createEl('button', { id: 'proceed-to-lobby-btn' }, 'btn btn-primary mt-2', 'Proceed to Lobby'));
    authScreen.appendChild(authUserInfo);

    authScreen.appendChild(createEl('p', { id: 'auth-error' }, 'text-red-400 mt-3 text-sm text-center'));
    appContainer.appendChild(authScreen);

    // --- Lobby Connect Screen ---
    const lobbyConnectScreen = createEl('div', { id: 'lobby-connect-screen' }, 'screen hidden');
    lobbyConnectScreen.appendChild(createEl('h1', {}, 'text-3xl font-bold mb-6 text-center text-sky-400', '🏠 Join or Create Quiz Lobby'));

    const playerNameDiv = createEl('div', {}, 'mb-6 bg-slate-700 p-4 rounded-lg border border-slate-600');
    playerNameDiv.appendChild(createEl('label', { for: 'player-name-input' }, 'block text-sm font-medium text-sky-300 mb-2', '👤 Player Name (for Guests)'));
    playerNameDiv.appendChild(createEl('input', { type: 'text', id: 'player-name-input', placeholder: 'Enter Your Name', autocomplete: 'nickname' }, 'input-field'));
    lobbyConnectScreen.appendChild(playerNameDiv);

    const gridDivLobby = createEl('div', {}, 'grid grid-cols-1 md:grid-cols-2 gap-6');

    const joinDiv = createEl('div', {}, 'bg-slate-700 p-6 rounded-lg border border-slate-600');
    joinDiv.appendChild(createEl('h2', {}, 'text-xl mb-4 text-sky-300 font-semibold', '🚪 Join Lobby'));
    joinDiv.appendChild(createEl('input', { type: 'text', id: 'lobby-id-input', placeholder: 'Enter Lobby ID' }, 'input-field uppercase-input mb-4'));
    joinDiv.appendChild(createEl('button', { id: 'join-lobby-btn' }, 'btn btn-primary w-full', 'Join Lobby'));
    gridDivLobby.appendChild(joinDiv);

    const createDiv = createEl('div', {}, 'bg-slate-700 p-6 rounded-lg border border-slate-600');
    createDiv.appendChild(createEl('h2', {}, 'text-xl mb-4 text-sky-300 font-semibold', '✨ Create Lobby'));
    createDiv.appendChild(createEl('p', {}, 'text-slate-400 text-sm mb-4', 'Start a new quiz lobby and invite friends!'));
    createDiv.appendChild(createEl('button', { id: 'create-lobby-btn' }, 'btn btn-secondary w-full', 'Create New Lobby'));
    gridDivLobby.appendChild(createDiv);

    lobbyConnectScreen.appendChild(gridDivLobby);
    lobbyConnectScreen.appendChild(createEl('p', { id: 'connect-error' }, 'text-red-400 mt-4 text-sm text-center bg-red-900/20 p-3 rounded-lg border border-red-700 hidden'));
    lobbyConnectScreen.appendChild(createEl('button', { id: 'back-to-auth-btn' }, 'btn btn-neutral mt-6 w-full', '← Back to Login'));
    appContainer.appendChild(lobbyConnectScreen);

    // --- Waiting Room Screen ---
    const waitingRoomScreen = createEl('div', { id: 'waiting-room-screen' }, 'screen hidden');

    const waitingHeaderFlex = createEl('div', {}, 'flex justify-between items-center mb-6');
    waitingHeaderFlex.appendChild(createEl('h1', {}, 'text-2xl md:text-3xl font-bold text-sky-400', '⏳ Waiting Room'));
    waitingHeaderFlex.appendChild(createEl('button', { id: 'leave-lobby-btn-waiting' }, 'btn btn-danger btn-sm', '🚪 Leave'));
    waitingRoomScreen.appendChild(waitingHeaderFlex);

    const waitingInfoBox = createEl('div', {}, 'bg-slate-700 p-4 rounded-lg mb-6 border border-slate-600');
    const pLobbyId = createEl('p', {}, 'text-lg mb-2', null, '🆔 Lobby ID: <strong id="lobby-id-display" class="text-yellow-400 font-mono"></strong>');
    pLobbyId.appendChild(createEl('button', { id: 'copy-lobby-id-btn' }, 'btn btn-outline btn-xs ml-2', '📋 Copy'));
    waitingInfoBox.appendChild(pLobbyId);
    waitingInfoBox.appendChild(createEl('p', {}, [], null, '👤 You are: <strong id="current-player-id-display" class="text-lime-400 font-mono"></strong> (<span id="current-player-name-display" class="text-sky-300"></span>)'));
    waitingRoomScreen.appendChild(waitingInfoBox);

    // Host Controls
    const hostControlsWaiting = createEl('div', { id: 'host-controls-waiting' }, 'mb-6 hidden bg-slate-700 p-6 rounded-lg border border-slate-600');
    hostControlsWaiting.appendChild(createEl('h2', {}, 'text-xl mb-4 text-sky-300 font-semibold', '👑 Host Controls'));
    hostControlsWaiting.appendChild(createEl('label', { for: 'category-select' }, 'block mb-2 text-sm font-medium text-slate-300', '📚 Select Category:'));
    const categorySelectEl = createEl('select', { id: 'category-select' }, 'input-field mb-4');
    categorySelectEl.appendChild(createEl('option', { value: '' }, [], '-- Select a Category --'));
    hostControlsWaiting.appendChild(categorySelectEl);
    hostControlsWaiting.appendChild(createEl('button', { id: 'start-game-btn', disabled: '' }, 'btn btn-success w-full', '🚀 Start Game'));
    hostControlsWaiting.appendChild(createEl('p', { id: 'start-game-error' }, 'text-red-400 mt-2 text-sm'));
    waitingRoomScreen.appendChild(hostControlsWaiting);

    // Non-Host Info
    const nonHostInfoWaiting = createEl('div', { id: 'non-host-info-waiting' }, 'mb-6 hidden bg-slate-700 p-6 rounded-lg border border-slate-600 text-center');
    nonHostInfoWaiting.appendChild(createEl('p', {}, 'mb-2', '⏳ Waiting for host to select category and start the game...'));
    nonHostInfoWaiting.appendChild(createEl('p', {}, [], null, '📚 Selected Category: <strong id="selected-category-display" class="text-amber-400">N/A</strong>'));
    waitingRoomScreen.appendChild(nonHostInfoWaiting);

    waitingRoomScreen.appendChild(createEl('h2', {}, 'text-xl mb-3 text-sky-300 font-semibold', null, '👥 Players in Lobby (<span id="player-count" class="text-lime-400">0</span>):'));
    waitingRoomScreen.appendChild(createEl('ul', { id: 'player-list-waiting' }, 'list-none bg-slate-700 p-4 rounded-lg h-40 overflow-y-auto border border-slate-600 space-y-2'));
    appContainer.appendChild(waitingRoomScreen);

    // --- Quiz Screen ---
    const quizScreen = createEl('div', { id: 'quiz-screen' }, 'screen hidden');

    const quizHeaderFlex = createEl('div', {}, 'flex justify-between items-start mb-4');
    const quizInfoDiv = createEl('div');
    quizInfoDiv.appendChild(createEl('h2', { id: 'quiz-category-display' }, 'text-xl font-semibold text-sky-400', '📚 Category'));
    quizInfoDiv.appendChild(createEl('p', { id: 'question-counter-display' }, 'text-sm text-slate-400', 'Question X of Y'));
    quizHeaderFlex.appendChild(quizInfoDiv);

    const hostGameControlsQuiz = createEl('div', { id: 'host-game-controls-quiz' }, 'hidden space-x-2');
    hostGameControlsQuiz.appendChild(createEl('button', { id: 'pause-game-btn' }, 'btn btn-warning btn-sm', '⏸️ Pause'));
    hostGameControlsQuiz.appendChild(createEl('button', { id: 'skip-to-end-btn' }, 'btn btn-danger btn-sm', '⏭️ Skip'));
    quizHeaderFlex.appendChild(hostGameControlsQuiz);
    quizScreen.appendChild(quizHeaderFlex);

    quizScreen.appendChild(createEl('div', { id: 'timer-display' }, 'text-5xl font-bold text-center my-6 text-yellow-400 bg-slate-700 rounded-lg p-4 border border-slate-600', '30'));

    const questionTextContainer = createEl('div', {}, 'bg-slate-700 p-6 rounded-lg mb-6 min-h-[100px] border border-slate-600');
    questionTextContainer.appendChild(createEl('p', { id: 'question-text-display' }, 'text-lg md:text-xl leading-relaxed', 'Question text will appear here...'));
    quizScreen.appendChild(questionTextContainer);

    quizScreen.appendChild(createEl('div', { id: 'answer-options-container' }, 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'));
    quizScreen.appendChild(createEl('p', { id: 'answer-feedback-text' }, 'text-center text-lg mb-4 min-h-[2rem]', ''));

    const playerInfoQuiz = createEl('div', { id: 'player-info-quiz' }, 'text-center mb-4 bg-slate-700 p-4 rounded-lg border border-slate-600');
    playerInfoQuiz.innerHTML = '🏆 Your Score: <span id="current-player-score-quiz" class="font-bold text-lime-400">0</span> | 🔥 Streak: <span id="current-player-streak-quiz" class="font-bold text-orange-400">0</span>';
    quizScreen.appendChild(playerInfoQuiz);

    const liveScoresContainer = createEl('div', { id: 'live-scores-container' }, 'mt-4');
    liveScoresContainer.appendChild(createEl('h3', {}, 'text-md font-semibold mb-2 text-sky-300', '📊 Live Scores:'));
    liveScoresContainer.appendChild(createEl('ul', { id: 'live-scores-list' }, 'text-sm bg-slate-700 p-3 rounded-lg max-h-32 overflow-y-auto border border-slate-600'));
    quizScreen.appendChild(liveScoresContainer);

    quizScreen.appendChild(createEl('p', { id: 'game-paused-message' }, 'text-center text-yellow-500 font-bold text-xl my-4 hidden bg-yellow-900/20 p-4 rounded-lg border border-yellow-600', '⏸️ Game Paused'));
    appContainer.appendChild(quizScreen);

    // --- Game Over Screen ---
    const gameOverScreen = createEl('div', { id: 'game-over-screen' }, 'screen hidden');
    gameOverScreen.appendChild(createEl('h1', {}, 'text-3xl font-bold mb-6 text-center text-sky-400', '🏁 Game Over!'));
    gameOverScreen.appendChild(createEl('h2', {}, 'text-xl mb-4 text-sky-300 font-semibold', '🏆 Final Scores:'));
    gameOverScreen.appendChild(createEl('ul', { id: 'final-scores-list' }, 'mb-6 bg-slate-700 p-4 rounded-lg border border-slate-600 space-y-2'));

    const gameOverHostControls = createEl('div', { id: 'game-over-host-controls' }, 'hidden');
    gameOverHostControls.appendChild(createEl('button', { id: 'play-again-btn' }, 'btn btn-success w-full mb-3', '🔄 Play Again'));
    gameOverScreen.appendChild(gameOverHostControls);

    const gameOverNonHostMsg = createEl('div', { id: 'game-over-non-host-msg' }, 'hidden text-center mb-4 bg-slate-700 p-4 rounded-lg border border-slate-600');
    gameOverNonHostMsg.appendChild(createEl('p', {}, [], '⏳ Waiting for host to start a new game...'));
    gameOverScreen.appendChild(gameOverNonHostMsg);

    gameOverScreen.appendChild(createEl('button', { id: 'submit-hall-of-fame-btn' }, 'btn btn-primary w-full mb-3', '🌟 Submit Score to Hall of Fame'));
    gameOverScreen.appendChild(createEl('button', { id: 'leave-lobby-btn-gameover' }, 'btn btn-danger w-full', '🚪 Leave Lobby'));
    appContainer.appendChild(gameOverScreen);

    // --- Footer Controls ---
    const footerDiv = createEl('div', {}, 'mt-8 pt-4 border-t border-slate-700 flex justify-between items-center');
    footerDiv.appendChild(createEl('button', { id: 'mute-toggle-btn' }, 'btn btn-neutral btn-sm', '🔊 Mute Sounds'));
    footerDiv.appendChild(createEl('span', { id: 'connection-status' }, 'text-xs text-slate-500', 'Disconnected'));
    appContainer.appendChild(footerDiv);
    appContainer.appendChild(createEl('div', { id: 'user-id-display-footer' }, 'text-xs text-slate-600 mt-2 text-center', 'UserID: N/A'));

    // --- Audio Elements ---
    const audioPath = 'assets/sounds/';
    const audioSources = [
        { id: 'sound-click', src: `${audioPath}click.mp3` },
        { id: 'sound-correct', src: `${audioPath}correctanswer.mp3` },
        { id: 'sound-incorrect', src: `${audioPath}incorrectanswer.mp3` },
        { id: 'sound-streak', src: `${audioPath}streak.mp3` },
        { id: 'sound-timeup', src: `${audioPath}timesup.mp3` },
        { id: 'sound-join', src: `${audioPath}newquestion.mp3` },
        { id: 'sound-start', src: `${audioPath}newquestion.mp3` },
        { id: 'music-menu', src: `${audioPath}menumusic.mp3`, loop: true },
    ];
    audioSources.forEach(audio => {
        const attrs = { id: audio.id, src: audio.src, preload: 'auto' };
        if (audio.loop) attrs.loop = true;
        body.appendChild(createEl('audio', attrs));
    });
}

// -----------------------------------------------------------------------------
// SECTION 2: Application Logic (Quiz Game)
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. Generate the entire HTML structure for the page
    generateQuizPageHTMLContent();

    // 2. Define Firebase Configuration
    const firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: "kommillitonen-quiz.firebaseapp.com",
        projectId: "kommillitonen-quiz",
        storageBucket: "kommillitonen-quiz.appspot.com",
        messagingSenderId: "215136246569",
        appId: "1:215136246569:web:7431d308369d9fb4d17538",
        measurementId: ""
    };
    const authAppUrl = "https://game.korczewski.de";

    // --- Global State ---
    let socket;
    let currentLobbyId = null;
    let currentPlayerId = null;
    let currentPlayerName = localStorage.getItem('quizPlayerName') || '';
    let isHost = false;
    let currentQuestionIndex = -1;
    let isMuted = localStorage.getItem('quizMuted') === 'true';
    let isGamePaused = false;
    let availableCategories = [];
    let firebaseApp;
    let firebaseAuth;
    let firestoreDB;
    let currentUser = null;
    let idToken = null;
    let userHasInteracted = false;

    // --- DOM Elements ---
    const screens = {
        auth: document.getElementById('auth-screen'),
        lobbyConnect: document.getElementById('lobby-connect-screen'),
        waitingRoom: document.getElementById('waiting-room-screen'),
        quiz: document.getElementById('quiz-screen'),
        gameOver: document.getElementById('game-over-screen'),
    };

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const googleSignInBtn = document.getElementById('google-signin-btn');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const registerDisplayNameInput = document.getElementById('register-displayName');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const authFormContainer = document.getElementById('auth-form-container');
    const authLoadingDiv = document.getElementById('auth-loading');
    const authUserInfoDiv = document.getElementById('auth-user-info');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const proceedToLobbyBtn = document.getElementById('proceed-to-lobby-btn');
    const authErrorP = document.getElementById('auth-error');
    const backToAuthBtn = document.getElementById('back-to-auth-btn');

    const playerNameInput = document.getElementById('player-name-input');
    if (playerNameInput) playerNameInput.value = currentPlayerName;
    const lobbyIdInput = document.getElementById('lobby-id-input');
    const joinLobbyBtn = document.getElementById('join-lobby-btn');
    const createLobbyBtn = document.getElementById('create-lobby-btn');
    const connectErrorP = document.getElementById('connect-error');

    const lobbyIdDisplay = document.getElementById('lobby-id-display');
    const copyLobbyIdBtn = document.getElementById('copy-lobby-id-btn');
    const currentPlayerIdDisplay = document.getElementById('current-player-id-display');
    const currentPlayerNameDisplay = document.getElementById('current-player-name-display');
    const hostControlsWaitingDiv = document.getElementById('host-controls-waiting');
    const categorySelect = document.getElementById('category-select');
    const startGameBtn = document.getElementById('start-game-btn');
    const startGameErrorP = document.getElementById('start-game-error');
    const nonHostInfoWaitingDiv = document.getElementById('non-host-info-waiting');
    const selectedCategoryDisplay = document.getElementById('selected-category-display');
    const playerListWaitingUl = document.getElementById('player-list-waiting');
    const playerCountSpan = document.getElementById('player-count');
    const leaveLobbyBtnWaiting = document.getElementById('leave-lobby-btn-waiting');

    const quizCategoryDisplay = document.getElementById('quiz-category-display');
    const questionCounterDisplay = document.getElementById('question-counter-display');
    const hostGameControlsQuizDiv = document.getElementById('host-game-controls-quiz');
    const pauseGameBtn = document.getElementById('pause-game-btn');
    const skipToEndBtn = document.getElementById('skip-to-end-btn');
    const timerDisplay = document.getElementById('timer-display');
    const questionTextDisplay = document.getElementById('question-text-display');
    const answerOptionsContainer = document.getElementById('answer-options-container');
    const answerFeedbackText = document.getElementById('answer-feedback-text');
    const currentPlayerScoreQuiz = document.getElementById('current-player-score-quiz');
    const currentPlayerStreakQuiz = document.getElementById('current-player-streak-quiz');
    const liveScoresContainer = document.getElementById('live-scores-container');
    const liveScoresListUl = document.getElementById('live-scores-list');
    const gamePausedMessage = document.getElementById('game-paused-message');

    const finalScoresListUl = document.getElementById('final-scores-list');
    const gameOverHostControlsDiv = document.getElementById('game-over-host-controls');
    const playAgainBtn = document.getElementById('play-again-btn');
    const gameOverNonHostMsgDiv = document.getElementById('game-over-non-host-msg');
    const submitHallOfFameBtn = document.getElementById('submit-hall-of-fame-btn');
    const leaveLobbyBtnGameover = document.getElementById('leave-lobby-btn-gameover');

    const muteToggleBtn = document.getElementById('mute-toggle-btn');
    const connectionStatusSpan = document.getElementById('connection-status');
    const globalNotificationDiv = document.getElementById('global-notification');
    const userIdDisplayFooter = document.getElementById('user-id-display-footer');

    const sounds = {
        click: document.getElementById('sound-click'),
        correct: document.getElementById('sound-correct'),
        incorrect: document.getElementById('sound-incorrect'),
        streak: document.getElementById('sound-streak'),
        timeup: document.getElementById('sound-timeup'),
        join: document.getElementById('sound-join'),
        start: document.getElementById('sound-start'),
        menuMusic: document.getElementById('music-menu'),
    };
    Object.values(sounds).forEach(sound => { if(sound) sound.muted = isMuted; });

    // Function to handle user interaction
    const handleUserInteraction = () => {
        if (!userHasInteracted) {
            userHasInteracted = true;
            if (screens.auth && !screens.auth.classList.contains('hidden') ||
                screens.lobbyConnect && !screens.lobbyConnect.classList.contains('hidden') ||
                screens.waitingRoom && !screens.waitingRoom.classList.contains('hidden') ||
                screens.gameOver && !screens.gameOver.classList.contains('hidden')) {
                playSound('menuMusic', true);
            }
            document.body.removeEventListener('click', handleUserInteraction, true);
            document.body.removeEventListener('keydown', handleUserInteraction, true);
        }
    };
    document.body.addEventListener('click', handleUserInteraction, true);
    document.body.addEventListener('keydown', handleUserInteraction, true);

    // --- Utility Functions ---
    const showScreen = (screenName) => {
        Object.values(screens).forEach(screen => {
            if(screen) {
                screen.classList.add('hidden');
            }
        });
        if (screens[screenName]) {
            screens[screenName].classList.remove('hidden');
        }

        // Show error message properly
        if (connectErrorP && connectErrorP.textContent.trim()) {
            connectErrorP.classList.remove('hidden');
        }

        if (['lobbyConnect', 'waitingRoom', 'gameOver', 'auth'].includes(screenName)) {
            if (userHasInteracted) playSound('menuMusic', true);
        } else {
            stopSound('menuMusic');
        }
    };

    const playSound = (soundName, loop = false) => {
        if (isMuted && soundName !== 'click') return;
        if (sounds[soundName]) {
            sounds[soundName].loop = loop;
            sounds[soundName].currentTime = 0;
            const playPromise = sounds[soundName].play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (soundName === 'menuMusic' && !userHasInteracted) {
                        console.warn(`Menu music autoplay prevented: ${error.message}. Will play after user interaction.`);
                    } else {
                        console.warn(`Sound play error (${soundName}):`, error.message);
                    }
                });
            }
            if (isMuted && soundName === 'click') sounds[soundName].volume = 0.3;
            else if (soundName === 'click') sounds[soundName].volume = 0.7;
            else sounds[soundName].volume = 0.8;
        }
    };

    const stopSound = (soundName) => {
        if (sounds[soundName]) {
            sounds[soundName].pause();
            sounds[soundName].currentTime = 0;
        }
    };

    const speakText = (text) => {
        if (isMuted || !('speechSynthesis' in window)) return;
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            let germanVoice = voices.find(voice => voice.lang.startsWith('de'));
            if (germanVoice) {
                utterance.voice = germanVoice;
            } else {
                utterance.lang = 'de-DE';
            }
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn("Speech synthesis error:", e);
        }
    };

    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    const showGlobalNotification = (message, type = 'info', duration = 3000) => {
        if (!globalNotificationDiv) return;
        globalNotificationDiv.textContent = message;
        globalNotificationDiv.className = 'fixed top-5 right-5 text-white px-4 py-2 rounded-md shadow-lg z-50';
        if (type === 'error') globalNotificationDiv.classList.add('bg-red-500');
        else if (type === 'success') globalNotificationDiv.classList.add('bg-green-500');
        else globalNotificationDiv.classList.add('bg-blue-500');

        globalNotificationDiv.classList.remove('hidden');
        setTimeout(() => {
            globalNotificationDiv.classList.add('hidden');
        }, duration);
    };

    const updateMuteButton = () => {
        if (!muteToggleBtn) return;
        muteToggleBtn.textContent = isMuted ? '🔊 Unmute Sounds' : '🔇 Mute Sounds';
        Object.values(sounds).forEach(sound => { if (sound) sound.muted = isMuted; });
    };

    // --- Firebase Initialization & Auth ---
    const initializeFirebase = () => {
        if (!firebaseConfig || !firebaseConfig.apiKey) {
            console.error("Firebase configuration is missing or incomplete.");
            if(authErrorP) authErrorP.textContent = "Firebase configuration error. Cannot initialize authentication.";
            showScreen('auth');
            return;
        }

        try {
            if (typeof firebase === 'undefined' || typeof firebase.initializeApp === 'undefined') {
                console.error("Firebase SDK not fully loaded before initializeFirebase call.");
                showGlobalNotification("Error: Firebase not ready. Please refresh.", "error", 10000);
                if(authErrorP) authErrorP.textContent = "Error: Firebase not ready.";
                return;
            }
            if (!firebase.apps.length) {
                firebaseApp = firebase.initializeApp(firebaseConfig);
            } else {
                firebaseApp = firebase.app();
            }
            firebaseAuth = firebase.auth();
            firestoreDB = firebase.firestore();
            console.log("Firebase initialized successfully.");
            setupFirebaseAuthUI();
        } catch (error) {
            console.error("Error initializing Firebase:", error);
            if(authErrorP) authErrorP.textContent = `Initialization Error: ${error.message}`;
            showScreen('auth');
        }
    };

    const setupFirebaseAuthUI = () => {
        if (!authLoadingDiv || !authFormContainer || !authUserInfoDiv || !firebaseAuth) {
            console.warn("Auth UI elements or Firebase Auth not ready in setupFirebaseAuthUI.");
            return;
        }

        authLoadingDiv.classList.remove('hidden');
        authFormContainer.classList.add('hidden');
        authUserInfoDiv.classList.add('hidden');

        firebaseAuth.onAuthStateChanged(async user => {
            authLoadingDiv.classList.add('hidden');
            if (user) {
                currentUser = user;
                try {
                    idToken = await user.getIdToken(true);
                    console.log("User is signed in:", user.uid, "Token acquired.");
                    if(userEmailDisplay) userEmailDisplay.textContent = user.displayName || user.email;
                    currentPlayerId = user.uid;
                    currentPlayerName = user.displayName || user.email.split('@')[0];
                    if(playerNameInput) {
                        playerNameInput.value = currentPlayerName;
                        playerNameInput.disabled = true;
                    }
                    if(userIdDisplayFooter) userIdDisplayFooter.textContent = `UserID: ${user.uid}`;

                    authFormContainer.classList.add('hidden');
                    authUserInfoDiv.classList.remove('hidden');
                    if(authErrorP) authErrorP.textContent = '';

                    if (socket && socket.connected) {
                        console.log("Socket already connected, potentially re-authenticating or re-joining.");
                        if (idToken && (!socket.auth || socket.auth.token !== idToken)) {
                            console.log("Auth token changed. Reconnecting socket.");
                            socket.auth = { token: idToken };
                            if (socket.io.opts.query) delete socket.io.opts.query.playerName;
                            socket.disconnect().connect();
                        }
                    } else {
                        initSocketConnection();
                    }
                } catch (tokenError) {
                    console.error("Error getting ID token:", tokenError);
                    if(authErrorP) authErrorP.textContent = "Session error. Please try logging in again.";
                    currentUser = null;
                    idToken = null;
                    authFormContainer.classList.remove('hidden');
                    authUserInfoDiv.classList.add('hidden');
                    if(playerNameInput) playerNameInput.disabled = false;
                }
            } else {
                console.log("User is signed out.");
                currentUser = null;
                idToken = null;
                currentPlayerId = `guest-${Date.now()}${Math.random().toString(36).substring(2,7)}`;
                if(playerNameInput) playerNameInput.disabled = false;
                if(userIdDisplayFooter) userIdDisplayFooter.textContent = `UserID: ${currentPlayerId} (Guest)`;

                authFormContainer.classList.remove('hidden');
                authUserInfoDiv.classList.add('hidden');
                if(authErrorP) authErrorP.textContent = '';

                if (socket && socket.connected) {
                    console.log("User logged out, socket might reconnect as guest or stay if already guest.");
                    if (socket.auth && socket.auth.token) {
                        console.log("Socket was authenticated, reconfiguring for guest mode.");
                        socket.auth = {};
                        if (!socket.io.opts.query) socket.io.opts.query = {};
                        socket.io.opts.query.playerName = currentPlayerName || `Guest-${Math.random().toString(36).substring(7)}`;
                        socket.disconnect().connect();
                    }
                } else {
                    initSocketConnection();
                }
            }
        });

        if(loginForm) loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!loginEmailInput || !loginPasswordInput) return;
            if(authErrorP) authErrorP.textContent = '';
            try {
                await firebaseAuth.signInWithEmailAndPassword(loginEmailInput.value, loginPasswordInput.value);
            } catch (error) {
                console.error("Login error:", error);
                if(authErrorP) authErrorP.textContent = error.message;
            }
        });

        if(registerForm) registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!registerDisplayNameInput || !registerEmailInput || !registerPasswordInput) return;
            if(authErrorP) authErrorP.textContent = '';
            const displayName = registerDisplayNameInput.value;
            const email = registerEmailInput.value;
            const password = registerPasswordInput.value;
            try {
                const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
                await userCredential.user.updateProfile({ displayName: displayName });
                console.log("Registration successful, profile update requested.");
            } catch (error) {
                console.error("Registration error:", error);
                if(authErrorP) authErrorP.textContent = error.message;
            }
        });

        if(googleSignInBtn) googleSignInBtn.addEventListener('click', async () => {
            if(authErrorP) authErrorP.textContent = '';
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                await firebaseAuth.signInWithPopup(provider);
            } catch (error) {
                console.error("Google Sign-In error:", error);
                if(authErrorP) authErrorP.textContent = `Google Sign-In Error: ${error.message} (Code: ${error.code})`;
                if (error.code === 'auth/popup-closed-by-user') {
                    if(authErrorP) authErrorP.textContent = 'Google Sign-In cancelled.';
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    if(authErrorP) authErrorP.textContent = 'An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.';
                }
            }
        });

        if(logoutBtn) logoutBtn.addEventListener('click', async () => {
            try {
                await firebaseAuth.signOut();
                showScreen('auth');
            } catch (error) {
                console.error("Logout error:", error);
                if(authErrorP) authErrorP.textContent = error.message;
            }
        });

        if(proceedToLobbyBtn) proceedToLobbyBtn.addEventListener('click', () => {
            if (currentUser) {
                showScreen('lobbyConnect');
                fetchCategories();
            } else {
                if(authErrorP) authErrorP.textContent = "Please log in to proceed.";
            }
        });
    };

    if(backToAuthBtn) backToAuthBtn.addEventListener('click', () => showScreen('auth'));

    // --- Socket.IO Connection & Event Handlers ---
    const initSocketConnection = () => {
        if (socket && socket.connected) {
            console.log("Socket already connected.");
            let needsReconnect = false;
            if (idToken && (!socket.auth || socket.auth.token !== idToken)) {
                console.log("Socket token update needed for authenticated user.");
                socket.auth = { token: idToken };
                if(socket.io.opts.query) delete socket.io.opts.query.playerName;
                needsReconnect = true;
            } else if (!idToken && (socket.auth && socket.auth.token)) {
                console.log("Socket token removal needed for guest user.");
                socket.auth = {};
                if (!socket.io.opts.query) socket.io.opts.query = {};
                socket.io.opts.query.playerName = currentPlayerName || `Guest-${Math.random().toString(36).substring(7)}`;
                needsReconnect = true;
            }
            if(needsReconnect && socket) socket.disconnect().connect();
            return;
        }

        if (socket) {
            socket.disconnect();
        }

        const socketOptions = {
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            path: '/game/socket.io/',
            auth: {}
        };

        if (idToken) {
            socketOptions.auth.token = idToken;
            console.log("Connecting socket with Firebase ID token.");
        } else {
            socketOptions.query = { playerName: currentPlayerName || `Guest-${Math.random().toString(36).substring(7)}` };
            console.log("Connecting socket as guest.", socketOptions.query.playerName);
        }

        if (typeof io === 'undefined') {
            console.error("Socket.IO client (io) not loaded. Cannot connect.");
            if(connectionStatusSpan) connectionStatusSpan.textContent = "Error: Socket library missing";
            return;
        }
        socket = io(window.location.origin, socketOptions);

        socket.on('connect', () => {
            if(connectionStatusSpan) {
                connectionStatusSpan.textContent = 'Connected';
                connectionStatusSpan.classList.remove('text-red-500');
                connectionStatusSpan.classList.add('text-green-500');
            }
            console.log('Socket connected to server with ID:', socket.id);
            socket.emit('checkExistingSession');
        });

        socket.on('disconnect', (reason) => {
            if(connectionStatusSpan) {
                connectionStatusSpan.textContent = `Disconnected: ${reason}`;
                connectionStatusSpan.classList.remove('text-green-500');
                connectionStatusSpan.classList.add('text-red-500');
            }
            console.warn('Socket disconnected:', reason);
            if (reason === 'io server disconnect' && socket) {
                socket.connect();
            }
        });

        socket.on('connect_error', (err) => {
            console.error("Socket connection error:", err.message, err.data);
            if(connectionStatusSpan) {
                connectionStatusSpan.textContent = `Connection Error: ${err.message}`;
                connectionStatusSpan.classList.remove('text-green-500');
                connectionStatusSpan.classList.add('text-red-500');
            }
            const errData = err.data || {};
            if (err.message === 'Authentication error: Invalid token' || errData.message === 'Authentication error: Invalid token') {
                showGlobalNotification("Session expired or invalid. Please log in again.", "error");
                if (firebaseAuth) firebaseAuth.signOut().then(() => showScreen('auth'));
                else showScreen('auth');
            }
        });

        socket.on('sessionCheckResult', (data) => {
            console.log('Session check result:', data);
        });

        socket.on('lobbyCreated', (data) => {
            currentLobbyId = data.lobbyId;
            isHost = (data.hostId === currentPlayerId);
            if(lobbyIdDisplay) lobbyIdDisplay.textContent = currentLobbyId;
            showScreen('waitingRoom');
            updateWaitingRoomUI();
            showGlobalNotification(`Lobby ${currentLobbyId} created!`, 'success');
            playSound('join');
        });

        socket.on('joinedLobby', (data) => {
            currentLobbyId = data.lobbyId;
            isHost = (data.hostId === currentPlayerId);
            if(lobbyIdDisplay) lobbyIdDisplay.textContent = currentLobbyId;
            showScreen('waitingRoom');
            updateWaitingRoomUI();
            showGlobalNotification(`Joined lobby ${currentLobbyId}`, 'success');
            playSound('join');
        });

        socket.on('joinLobbyError', (data) => {
            if(connectErrorP) {
                connectErrorP.textContent = data.message;
                connectErrorP.classList.remove('hidden');
            }
            showGlobalNotification(data.message, 'error');
        });

        socket.on('lobbyUpdate', (lobbyData) => {
            if (!currentLobbyId || currentLobbyId !== lobbyData.id) return;
            console.log("Lobby Update Received:", lobbyData);
            isHost = (lobbyData.hostId === currentPlayerId);

            if(playerListWaitingUl) playerListWaitingUl.innerHTML = '';
            lobbyData.players.forEach(player => {
                const li = document.createElement('li');
                li.className = 'player-list-item bg-slate-600 p-3 rounded-lg';
                li.textContent = `${player.name} (Score: ${player.score || 0}, Streak: ${player.streak || 0})`;

                if (player.id === lobbyData.hostId) {
                    const hostBadge = document.createElement('span');
                    hostBadge.className = 'inline-block ml-2 px-2 py-1 text-xs font-semibold bg-sky-500 text-white rounded-full';
                    hostBadge.textContent = '👑 Host';
                    li.appendChild(hostBadge);
                }

                if (player.id === currentPlayerId) {
                    li.classList.add('current-user', 'bg-lime-900', 'border', 'border-lime-500');
                    li.textContent += ' (You)';
                }

                if (player.disconnected) {
                    const disconnectedBadge = document.createElement('span');
                    disconnectedBadge.className = 'inline-block ml-2 px-2 py-1 text-xs font-semibold bg-slate-500 text-slate-300 rounded-full';
                    disconnectedBadge.textContent = '💤 Disconnected';
                    li.appendChild(disconnectedBadge);
                    li.classList.add('opacity-50', 'italic');
                }

                if(playerListWaitingUl) playerListWaitingUl.appendChild(li);
            });
            if(playerCountSpan) playerCountSpan.textContent = lobbyData.players.filter(p => !p.disconnected).length;

            if (lobbyData.category) {
                if(selectedCategoryDisplay) selectedCategoryDisplay.textContent = lobbyData.category;
                if (isHost && categorySelect && categorySelect.value !== lobbyData.category) {
                    categorySelect.value = lobbyData.category;
                }
            } else {
                if(selectedCategoryDisplay) selectedCategoryDisplay.textContent = 'N/A';
            }
            if(startGameBtn && categorySelect) startGameBtn.disabled = !(isHost && categorySelect.value && lobbyData.players.filter(p=>!p.disconnected).length > 0);
            updateWaitingRoomUI();
        });

        socket.on('categorySelectedByHost', (data) => {
            if (!isHost) {
                if(selectedCategoryDisplay) selectedCategoryDisplay.textContent = data.category || 'N/A';
                showGlobalNotification(`Host selected category: ${data.category}`, 'info');
            }
        });

        socket.on('gameStarted', (data) => {
            console.log('Game started:', data);
            currentQuestionIndex = -1;
            isGamePaused = false;
            if(gamePausedMessage) gamePausedMessage.classList.add('hidden');
            if(quizCategoryDisplay) quizCategoryDisplay.textContent = data.category;
            showScreen('quiz');
            updateQuizUI();
            playSound('start');
            showGlobalNotification(`Game started! Category: ${data.category}`, 'success');
        });

        socket.on('startGameError', (data) => {
            if(startGameErrorP) startGameErrorP.textContent = data.message;
            showGlobalNotification(data.message, 'error');
        });

        const getCurrentQuestionData = () => {
            return { timeLimit: (timerDisplay && timerDisplay.dataset.initialTime) ? parseInt(timerDisplay.dataset.initialTime) : 20 };
        };

        socket.on('question', (data) => {
            console.log('Received question:', data);
            currentQuestionIndex = data.index;
            if(questionTextDisplay) questionTextDisplay.textContent = data.text;
            if(questionCounterDisplay) questionCounterDisplay.textContent = `Question ${data.index + 1} of ${data.totalQuestions}`;
            if(quizCategoryDisplay) quizCategoryDisplay.textContent = data.category;
            if(answerFeedbackText) {
                answerFeedbackText.textContent = '';
                answerFeedbackText.className = 'text-center text-lg mb-4 min-h-[2rem]';
            }

            if(answerOptionsContainer) answerOptionsContainer.innerHTML = '';
            data.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.textContent = option;
                button.className = 'answer-option-btn';

                // Add option letters (A, B, C, D)
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                button.innerHTML = `<span class="font-bold text-sky-300">${optionLetter}.</span> ${option}`;

                button.onclick = () => {
                    if (button.classList.contains('disabled')) return;
                    playSound('click');
                    document.querySelectorAll('.answer-option-btn').forEach(btn => {
                        btn.classList.remove('selected');
                        btn.classList.add('disabled');
                        btn.disabled = true;
                    });
                    button.classList.add('selected');

                    socket.emit('submitAnswer', { lobbyId: currentLobbyId, questionIndex: currentQuestionIndex, answer: option });
                    if(answerFeedbackText) answerFeedbackText.textContent = '✅ Answer submitted... Waiting for results.';
                };
                if(answerOptionsContainer) answerOptionsContainer.appendChild(button);
            });
            if(timerDisplay) timerDisplay.textContent = data.timeLimit;
            updateTimerDisplay(data.timeLimit, data.timeLimit);
            isGamePaused = false;
            if(gamePausedMessage) gamePausedMessage.classList.add('hidden');
            updateQuizUI();
        });

        socket.on('timerUpdate', (data) => {
            const questionData = getCurrentQuestionData();
            updateTimerDisplay(data.timeLeft, questionData ? questionData.timeLimit : 20);
            if (data.timeLeft === 0 && !isGamePaused) {
                playSound('timeup');
                if(answerFeedbackText) answerFeedbackText.textContent = "⏰ Time's up!";
                document.querySelectorAll('.answer-option-btn').forEach(btn => {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                });
            }
        });

        socket.on('answerSubmittedFeedback', (data) => {
            console.log("Server ack for answer:", data.message);
        });

        socket.on('answerError', (data) => {
            showGlobalNotification(data.message, 'error');
            if(answerFeedbackText) {
                answerFeedbackText.textContent = data.message;
                answerFeedbackText.classList.add('text-red-400');
            }
        });

        socket.on('answerResult', (data) => {
            if(currentPlayerScoreQuiz) currentPlayerScoreQuiz.textContent = data.score;
            if(currentPlayerStreakQuiz) currentPlayerStreakQuiz.textContent = data.streak;

            document.querySelectorAll('.answer-option-btn').forEach(btn => {
                btn.classList.remove('selected');

                if (btn.textContent.includes(data.yourAnswer)) {
                    if (data.correct) {
                        btn.classList.add('correct');
                    } else {
                        btn.classList.add('incorrect');
                    }
                }
                btn.classList.add('disabled');
                btn.disabled = true;
            });

            if (data.correct) {
                if(answerFeedbackText) {
                    answerFeedbackText.textContent = '✅ Richtig! (Correct!)';
                    answerFeedbackText.className = 'text-center text-lg mb-4 text-green-400 font-semibold';
                }
                playSound('correct');
                if (data.streak > 1) playSound('streak');
            } else {
                if(answerFeedbackText) {
                    answerFeedbackText.textContent = `❌ Leider falsch! Correct was: ${data.correctAnswer}`;
                    answerFeedbackText.className = 'text-center text-lg mb-4 text-red-400 font-semibold';
                }
                playSound('incorrect');
            }
        });

        socket.on('questionOver', (data) => {
            document.querySelectorAll('.answer-option-btn').forEach(btn => {
                btn.classList.add('disabled');
                btn.disabled = true;
                btn.classList.remove('selected');

                if (btn.textContent.includes(data.correctAnswer)) {
                    btn.classList.add('correct');
                } else {
                    btn.classList.add('opacity-60');
                }
            });
            speakText(`Die richtige Antwort war: ${data.correctAnswer}`);
            updateLiveScores(data.scores, data.streaks);
        });

        socket.on('updateScores', (scores, streaks) => {
            updateLiveScores(scores, streaks || {});
        });

        socket.on('gameOver', (data) => {
            console.log('Game over:', data);
            showScreen('gameOver');
            updateGameOverUI(data.finalScores);
            playSound('start');
        });

        socket.on('gamePaused', (data) => {
            isGamePaused = true;
            if(gamePausedMessage) {
                gamePausedMessage.classList.remove('hidden');
                gamePausedMessage.textContent = `⏸️ Game Paused. Time left: ${data.timeLeft}s`;
            }
            if(timerDisplay) timerDisplay.classList.add('opacity-50');
            showGlobalNotification('Game Paused by Host', 'warning');
            updateQuizUI();
        });

        socket.on('gameResumed', (data) => {
            isGamePaused = false;
            if(gamePausedMessage) {
                gamePausedMessage.classList.add('hidden');
            }
            if(timerDisplay) {
                timerDisplay.classList.remove('opacity-50');
                timerDisplay.textContent = data.timeLeft;
            }
            updateTimerDisplay(data.timeLeft, data.timeLeft);
            showGlobalNotification('Game Resumed by Host', 'info');
            updateQuizUI();
        });

        socket.on('gameSkippedToEnd', () => {
            showGlobalNotification('Game skipped to end by host.', 'warning');
        });

        socket.on('lobbyResetForPlayAgain', (data) => {
            showGlobalNotification('Host wants to play again! Lobby reset.', 'info');
            currentLobbyId = data.lobbyId;
            const me = data.players.find(p => p.id === currentPlayerId);
            isHost = me ? (data.hostId === me.id) : (data.players[0] && data.players[0].id === currentPlayerId);

            if(lobbyIdDisplay) lobbyIdDisplay.textContent = currentLobbyId;

            if(playerListWaitingUl) playerListWaitingUl.innerHTML = '';
            data.players.forEach(player => {
                const li = document.createElement('li');
                li.className = 'player-list-item bg-slate-600 p-3 rounded-lg';
                li.textContent = `${player.name} (Score: 0, Streak: 0)`;

                if (player.id === data.hostId) {
                    const hostBadge = document.createElement('span');
                    hostBadge.className = 'inline-block ml-2 px-2 py-1 text-xs font-semibold bg-sky-500 text-white rounded-full';
                    hostBadge.textContent = '👑 Host';
                    li.appendChild(hostBadge);
                }

                if (player.id === currentPlayerId) {
                    li.classList.add('current-user', 'bg-lime-900', 'border', 'border-lime-500');
                    li.textContent += ' (You)';
                }

                if(playerListWaitingUl) playerListWaitingUl.appendChild(li);
            });
            if(playerCountSpan) playerCountSpan.textContent = data.players.length;
            if(categorySelect) categorySelect.value = '';
            if(selectedCategoryDisplay) selectedCategoryDisplay.textContent = 'N/A';
            if(startGameBtn) startGameBtn.disabled = !isHost;
            if(startGameErrorP) startGameErrorP.textContent = '';

            showScreen('waitingRoom');
            updateWaitingRoomUI();
        });

        socket.on('hostChanged', (data) => {
            const newHostId = data.newHostId;
            isHost = (newHostId === currentPlayerId);
            let newHostName = isHost ? "You!" : newHostId;
            if (playerListWaitingUl) {
                const newHostPlayerLi = Array.from(playerListWaitingUl.children).find(li => li.textContent.includes(newHostId));
                if (newHostPlayerLi) {
                    const match = newHostPlayerLi.textContent.match(/^(.*?)\s\(/);
                    if (match && match[1]) newHostName = match[1];
                }
            }
            showGlobalNotification(`Host changed. New host: ${newHostName}`, 'info');
            updateWaitingRoomUI();
            updateQuizUI();
        });

        socket.on('leftLobbySuccess', () => {
            showGlobalNotification('You have left the lobby.', 'info');
            currentLobbyId = null;
            isHost = false;
            showScreen('lobbyConnect');
        });

        socket.on('leaveLobbyError', (data) => {
            showGlobalNotification(`Error leaving lobby: ${data.message}`, 'error');
        });

        socket.on('hostDisconnectedDuringGame', () => {
            showGlobalNotification('Host disconnected during the game. The game will end.', 'error');
        });

        socket.on('errorGame', (data) => {
            showGlobalNotification(data.message, 'error');
        });
    };

    // --- UI Update Functions ---
    const updateWaitingRoomUI = () => {
        if (!screens.waitingRoom || screens.waitingRoom.classList.contains('hidden')) return;
        if(currentPlayerIdDisplay) currentPlayerIdDisplay.textContent = currentPlayerId;
        if(currentPlayerNameDisplay) currentPlayerNameDisplay.textContent = currentPlayerName;

        const showHostControls = isHost;
        if(hostControlsWaitingDiv) {
            hostControlsWaitingDiv.classList.toggle('hidden', !showHostControls);
        }
        if(nonHostInfoWaitingDiv) {
            nonHostInfoWaitingDiv.classList.toggle('hidden', showHostControls);
        }

        if (isHost && startGameBtn && categorySelect && playerListWaitingUl) {
            const activePlayerCount = Array.from(playerListWaitingUl.children).filter(li => !li.classList.contains('opacity-50')).length;
            startGameBtn.disabled = !categorySelect.value || activePlayerCount === 0;
        }
    };

    const updateQuizUI = () => {
        if (!screens.quiz || screens.quiz.classList.contains('hidden')) return;

        const showHostControls = isHost;
        if(hostGameControlsQuizDiv) {
            hostGameControlsQuizDiv.classList.toggle('hidden', !showHostControls);
        }

        if (isHost && pauseGameBtn) {
            pauseGameBtn.innerHTML = isGamePaused ? '▶️ Resume' : '⏸️ Pause';
        }

        if(gamePausedMessage) {
            gamePausedMessage.classList.toggle('hidden', !isGamePaused);
        }
        if(answerOptionsContainer) answerOptionsContainer.classList.toggle('opacity-50', isGamePaused);
        document.querySelectorAll('.answer-option-btn').forEach(btn => {
            btn.disabled = isGamePaused || btn.classList.contains('disabled');
        });
    };

    const updateTimerDisplay = (timeLeft, initialTime) => {
        if(!timerDisplay) return;
        timerDisplay.textContent = timeLeft;
        timerDisplay.dataset.initialTime = initialTime;
        const percentage = (initialTime > 0 ? (timeLeft / initialTime) : 0) * 100;
        timerDisplay.classList.remove('urgent-low', 'urgent-medium', 'urgent-high', 'text-yellow-400', 'text-orange-500', 'text-red-500');
        if (percentage <= 25) {
            timerDisplay.classList.add('text-red-500', 'urgent-high');
        } else if (percentage <= 50) {
            timerDisplay.classList.add('text-orange-500', 'urgent-medium');
        } else {
            timerDisplay.classList.add('text-yellow-400', 'urgent-low');
        }
    };

    let playerMap = {};

    const updateLiveScores = (scoresData, streaksData) => {
        if(!liveScoresListUl) return;
        liveScoresListUl.innerHTML = '';

        const sortedPlayers = Object.entries(scoresData)
            .map(([id, score]) => {
                const name = playerMap[id] || (id === currentPlayerId ? currentPlayerName : `P-${id.substring(0, 5)}`);
                return { id, name, score, streak: (streaksData && streaksData[id]) ? streaksData[id] : 0 };
            })
            .sort((a, b) => b.score - a.score);

        sortedPlayers.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'p-2 bg-slate-600 rounded';

            let rank = '';
            if (index === 0) rank = '🥇 ';
            else if (index === 1) rank = '🥈 ';
            else if (index === 2) rank = '🥉 ';
            else rank = `${index + 1}. `;

            li.textContent = `${rank}${player.name}: ${player.score} (Streak: ${player.streak})`;
            if (player.id === currentPlayerId) {
                li.classList.add('font-bold', 'text-lime-300', 'bg-lime-900', 'border', 'border-lime-500');
            }
            liveScoresListUl.appendChild(li);
        });
    };

    const updateGameOverUI = (finalScores) => {
        if(!finalScoresListUl) return;
        finalScoresListUl.innerHTML = '';
        finalScores.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-slate-600 rounded-lg';

            let medal = '';
            if (index === 0) medal = '<span class="medal-gold" role="img" aria-label="Gold Medal">🥇</span> ';
            else if (index === 1) medal = '<span class="medal-silver" role="img" aria-label="Silver Medal">🥈</span> ';
            else if (index === 2) medal = '<span class="medal-bronze" role="img" aria-label="Bronze Medal">🥉</span> ';

            li.innerHTML = `${medal}${player.name}: ${player.score} points`;
            if (player.id === currentPlayerId) {
                li.classList.add('font-bold', 'text-lime-300', 'bg-lime-900', 'border', 'border-lime-500');
                li.innerHTML += ' (You)';
                if(submitHallOfFameBtn) {
                    submitHallOfFameBtn.disabled = !(player.score > 0 && currentUser);
                    submitHallOfFameBtn.dataset.score = player.score;
                }
            }
            if (player.disconnected) {
                li.innerHTML += ' <span class="text-xs text-slate-500">(Disconnected)</span>';
                li.classList.add('italic', 'text-slate-400');
            }
            finalScoresListUl.appendChild(li);
        });

        const showHostControls = isHost;
        if(gameOverHostControlsDiv) {
            gameOverHostControlsDiv.classList.toggle('hidden', !showHostControls);
        }
        if(gameOverNonHostMsgDiv) {
            gameOverNonHostMsgDiv.classList.toggle('hidden', showHostControls);
        }
        if (submitHallOfFameBtn && !currentUser) {
            submitHallOfFameBtn.disabled = true;
        }
    };

    // --- Event Listeners ---
    if(playerNameInput) playerNameInput.addEventListener('input', (e) => {
        if (!currentUser) {
            currentPlayerName = e.target.value;
            localStorage.setItem('quizPlayerName', currentPlayerName);
            if (socket && !idToken && socket.io && socket.io.opts && socket.io.opts.query) {
                socket.io.opts.query.playerName = currentPlayerName;
            } else if (socket && !idToken && socket.io && socket.io.opts) {
                socket.io.opts.query = { playerName: currentPlayerName };
            }
        }
    });

    if(lobbyIdInput) lobbyIdInput.addEventListener('input', (e) => e.target.value = e.target.value.toUpperCase());

    if(createLobbyBtn) createLobbyBtn.addEventListener('click', () => {
        playSound('click');
        if (!socket || !socket.connected) {
            showGlobalNotification("Not connected to server. Please wait.", "error");
            initSocketConnection();
            return;
        }
        if(connectErrorP) {
            connectErrorP.textContent = '';
            connectErrorP.classList.add('hidden');
        }
        const nameToSend = currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : (playerNameInput ? playerNameInput.value : '');
        if (!nameToSend && !currentUser) {
            if(connectErrorP) {
                connectErrorP.textContent = 'Please enter your name.';
                connectErrorP.classList.remove('hidden');
            }
            return;
        }
        socket.emit('createLobby', { playerName: nameToSend });
    });

    if(joinLobbyBtn) joinLobbyBtn.addEventListener('click', () => {
        playSound('click');
        if (!socket || !socket.connected) {
            showGlobalNotification("Not connected to server. Please wait.", "error");
            initSocketConnection();
            return;
        }
        const lobbyId = lobbyIdInput ? lobbyIdInput.value.trim() : '';
        if (!lobbyId) {
            if(connectErrorP) {
                connectErrorP.textContent = 'Please enter a Lobby ID.';
                connectErrorP.classList.remove('hidden');
            }
            return;
        }
        if(connectErrorP) {
            connectErrorP.textContent = '';
            connectErrorP.classList.add('hidden');
        }
        const nameToSend = currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : (playerNameInput ? playerNameInput.value : '');
        if (!nameToSend && !currentUser) {
            if(connectErrorP) {
                connectErrorP.textContent = 'Please enter your name to join as guest.';
                connectErrorP.classList.remove('hidden');
            }
            return;
        }
        socket.emit('joinLobby', { lobbyId, playerName: nameToSend });
    });

    if(copyLobbyIdBtn) copyLobbyIdBtn.addEventListener('click', () => {
        playSound('click');
        if(currentLobbyId) {
            navigator.clipboard.writeText(currentLobbyId)
                .then(() => showGlobalNotification('Lobby ID copied to clipboard!', 'success'))
                .catch(err => showGlobalNotification('Failed to copy Lobby ID.', 'error'));
        }
    });

    const commonLeaveLobby = () => {
        playSound('click');
        if (socket && currentLobbyId) {
            socket.emit('leaveLobby', { lobbyId: currentLobbyId });
        } else {
            currentLobbyId = null;
            isHost = false;
            showScreen('lobbyConnect');
        }
    };
    if(leaveLobbyBtnWaiting) leaveLobbyBtnWaiting.addEventListener('click', commonLeaveLobby);
    if(leaveLobbyBtnGameover) leaveLobbyBtnGameover.addEventListener('click', commonLeaveLobby);

    if(categorySelect) categorySelect.addEventListener('change', () => {
        playSound('click');
        if (isHost && currentLobbyId && socket) {
            const selectedCat = categorySelect.value;
            if (selectedCat) {
                socket.emit('hostSelectedCategory', { lobbyId: currentLobbyId, category: selectedCat });
                if(startGameBtn && playerListWaitingUl) {
                    const activePlayerCount = Array.from(playerListWaitingUl.children).filter(li => !li.classList.contains('opacity-50')).length;
                    startGameBtn.disabled = activePlayerCount === 0;
                }
                if(startGameErrorP) startGameErrorP.textContent = '';
            } else {
                if(startGameBtn) startGameBtn.disabled = true;
            }
        }
    });

    if(startGameBtn) startGameBtn.addEventListener('click', () => {
        playSound('click');
        if (isHost && currentLobbyId && categorySelect && categorySelect.value && socket) {
            if(startGameErrorP) startGameErrorP.textContent = '';
            if(playerListWaitingUl) {
                const activePlayerCount = Array.from(playerListWaitingUl.children).filter(li => !li.classList.contains('opacity-50')).length;
                if (activePlayerCount === 0) {
                    if(startGameErrorP) startGameErrorP.textContent = 'Cannot start with 0 players.';
                    return;
                }
            }
            socket.emit('startGame', { lobbyId: currentLobbyId });
        } else {
            if(startGameErrorP) startGameErrorP.textContent = 'Select a category and ensure players are present.';
        }
    });

    if(pauseGameBtn) pauseGameBtn.addEventListener('click', () => {
        playSound('click');
        if (isHost && currentLobbyId && socket) {
            socket.emit('hostTogglePause', { lobbyId: currentLobbyId });
        }
    });

    if(skipToEndBtn) skipToEndBtn.addEventListener('click', () => {
        playSound('click');
        if (isHost && currentLobbyId && socket) {
            if (window.confirm("Are you sure you want to end the game for everyone?")) {
                socket.emit('hostSkipToEnd', { lobbyId: currentLobbyId });
            }
        }
    });

    if(playAgainBtn) playAgainBtn.addEventListener('click', () => {
        playSound('click');
        if (isHost && currentLobbyId && socket) {
            socket.emit('playAgain', { lobbyId: currentLobbyId });
        }
    });

    if(submitHallOfFameBtn) submitHallOfFameBtn.addEventListener('click', async () => {
        playSound('click');
        if (!currentUser || !idToken) {
            showGlobalNotification("You must be logged in to submit to Hall of Fame.", "error");
            return;
        }
        const score = parseInt(submitHallOfFameBtn.dataset.score);
        const category = quizCategoryDisplay ? quizCategoryDisplay.textContent || "Unknown" : "Unknown";
        const playerName = currentUser.displayName || currentUser.email.split('@')[0];

        if (isNaN(score) || score <= 0) {
            showGlobalNotification("No valid score to submit.", "info");
            return;
        }

        submitHallOfFameBtn.disabled = true;
        try {
            const response = await fetch(`${authAppUrl}/api/hall-of-fame/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ score, category, playerName })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Server error: ${response.status}`);
            }
            const result = await response.json();
            showGlobalNotification('Score submitted to Hall of Fame!', 'success');
        } catch (error) {
            console.error('Hall of Fame submission error:', error);
            showGlobalNotification(`Failed to submit score: ${error.message}`, 'error');
            if(submitHallOfFameBtn) submitHallOfFameBtn.disabled = false;
        }
    });

    if(muteToggleBtn) muteToggleBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        localStorage.setItem('quizMuted', isMuted);
        updateMuteButton();
        playSound('click');
        if (isMuted) {
            stopSound('menuMusic');
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        } else {
            if (screens.quiz && !screens.quiz.classList.contains('hidden')) { /* no music */ }
            else { playSound('menuMusic', true); }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') {
            const activeEl = document.activeElement;
            const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA');

            if (!isInputActive && screens.quiz && !screens.quiz.classList.contains('hidden') && isHost && pauseGameBtn) {
                e.preventDefault();
                pauseGameBtn.click();
            }
        }
    });

    // --- Initial Setup ---
    const fetchCategories = async () => {
        try {
            console.log("Fetching categories from: /game/api/categories");
            const response = await fetch('/game/api/categories');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, Path: /game/api/categories`);
            }
            availableCategories = await response.json();

            if(categorySelect) {
                categorySelect.innerHTML = '<option value="">-- Select a Category --</option>';
                availableCategories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = `📚 ${cat}`;
                    categorySelect.appendChild(option);
                });
                console.log("Categories loaded:", availableCategories);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            showGlobalNotification(`Could not load categories: ${error.message}`, "error");
        }
    };

    // --- Final Initialization Calls ---
    setTimeout(() => {
        if (typeof firebase !== 'undefined' &&
            typeof firebase.initializeApp === 'function' &&
            typeof firebase.auth === 'function' &&
            typeof firebase.firestore === 'function') {
            initializeFirebase();
        } else {
            console.error("CRITICAL: Firebase SDK not loaded after delay. Cannot initialize application.");
            showGlobalNotification("Error: Core libraries not loaded. App cannot start.", "error", 10000);
            const appContainer = document.getElementById('app-container');
            if(appContainer) appContainer.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Failed to load critical application components. Please refresh the page or check your internet connection and ensure browser extensions like AdBlockers are not interfering.</p>";
        }
    }, 250);

    updateMuteButton();
    showScreen('auth');
});