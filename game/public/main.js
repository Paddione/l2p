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
    document.documentElement.lang = 'de'; // Changed to 'de' as per index.html

    // --- Populate <head> ---
    // Head content is now primarily managed by index.html.
    // We will only add scripts that are dynamically determined or essential for JS to load.

    const head = document.head;

    // Firebase SDK scripts (ensure these are loaded after firebase-app-compat.js)
    // These are now directly in index.html, but if dynamically loaded, would go here.
    // For this version, we assume they are in index.html.

    // Socket.IO client script (ensure this path is correct based on server setup)
    // This is also now directly in index.html.
    // head.appendChild(createEl('script', { src: '/socket.io/socket.io.js'}));


    // --- Configure <body> ---
    const body = document.body;
    body.innerHTML = ''; // Clear body only if absolutely necessary, index.html now has initial structure
    body.className = 'bg-slate-900 text-slate-100 font-sans flex flex-col items-center justify-center min-h-screen p-4';

    // --- Create App Container (if not already in index.html) ---
    // Assuming #app-container is provided by index.html
    let appContainer = document.getElementById('app-container');
    if (!appContainer) {
        appContainer = createEl('div', { id: 'app-container' }, 'bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700');
        body.appendChild(appContainer);
    } else {
        appContainer.className = 'bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700';
        appContainer.innerHTML = ''; // Clear existing content if reusing container
    }


    // --- Global Notification ---
    const globalNotification = createEl('div', { id: 'global-notification' }, 'fixed top-5 right-5 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg hidden z-50', 'Notification message');
    body.appendChild(globalNotification); // Append to body to be outside appContainer

    // --- Auth Screen ---
    const authScreen = createEl('div', { id: 'auth-screen' }, 'screen');
    authScreen.appendChild(createEl('h1', {}, 'text-3xl font-bold mb-6 text-center text-sky-400', '🎮 Quiz Game Login'));

    const authFormContainer = createEl('div', { id: 'auth-form-container' }, 'space-y-6');

    const loginFormEl = createEl('form', { id: 'login-form' }, 'bg-slate-700 p-6 rounded-lg border border-slate-600');
    loginFormEl.appendChild(createEl('h2', {}, 'text-xl mb-4 text-sky-300 font-semibold', '🔑 Login'));
    loginFormEl.appendChild(createEl('input', { type: 'email', id: 'login-email', placeholder: 'Email', required: '', autocomplete: 'username' }, 'input-field mb-3'));
    loginFormEl.appendChild(createEl('input', { type: 'password', id: 'login-password', placeholder: 'Password', required: '', autocomplete: 'current-password' }, 'input-field mb-4'));
    loginFormEl.appendChild(createEl('button', { type: 'submit' }, 'btn btn-primary w-full', 'Login'));
    authFormContainer.appendChild(loginFormEl);

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

    const hostControlsWaiting = createEl('div', { id: 'host-controls-waiting' }, 'mb-6 hidden bg-slate-700 p-6 rounded-lg border border-slate-600');
    hostControlsWaiting.appendChild(createEl('h2', {}, 'text-xl mb-4 text-sky-300 font-semibold', '👑 Host Controls'));
    hostControlsWaiting.appendChild(createEl('label', { for: 'category-select' }, 'block mb-2 text-sm font-medium text-slate-300', '📚 Select Category:'));
    const categorySelectEl = createEl('select', { id: 'category-select' }, 'input-field mb-4');
    categorySelectEl.appendChild(createEl('option', { value: '' }, [], '-- Select a Category --'));
    hostControlsWaiting.appendChild(categorySelectEl);
    hostControlsWaiting.appendChild(createEl('div', {}, 'text-sm text-slate-400 mb-4', '🎯 Game Format: 10 questions, 60 seconds each'));
    hostControlsWaiting.appendChild(createEl('button', { id: 'start-game-btn', disabled: '' }, 'btn btn-success w-full', '🚀 Start Game'));
    hostControlsWaiting.appendChild(createEl('p', { id: 'start-game-error' }, 'text-red-400 mt-2 text-sm'));
    waitingRoomScreen.appendChild(hostControlsWaiting);

    const nonHostInfoWaiting = createEl('div', { id: 'non-host-info-waiting' }, 'mb-6 hidden bg-slate-700 p-6 rounded-lg border border-slate-600 text-center');
    nonHostInfoWaiting.appendChild(createEl('p', {}, 'mb-2', '⏳ Waiting for host to select category and start the game...'));
    nonHostInfoWaiting.appendChild(createEl('p', {}, [], null, '📚 Selected Category: <strong id="selected-category-display" class="text-amber-400">N/A</strong>'));
    nonHostInfoWaiting.appendChild(createEl('div', {}, 'text-sm text-slate-400 mt-3', '🎯 Game Format: 10 questions, 60 seconds each'));
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

    quizScreen.appendChild(createEl('div', { id: 'timer-display' }, 'text-5xl font-bold text-center my-6 text-yellow-400 bg-slate-700 rounded-lg p-4 border border-slate-600', '60'));
    const questionTextContainer = createEl('div', {}, 'bg-slate-700 p-6 rounded-lg mb-6 min-h-[100px] border border-slate-600');
    questionTextContainer.appendChild(createEl('p', { id: 'question-text-display' }, 'text-lg md:text-xl leading-relaxed', 'Question text will appear here...'));
    quizScreen.appendChild(questionTextContainer);
    quizScreen.appendChild(createEl('div', { id: 'answer-options-container' }, 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'));
    quizScreen.appendChild(createEl('p', { id: 'answer-feedback-text' }, 'text-center text-lg mb-4 min-h-[2rem]', ''));

    const playerInfoQuiz = createEl('div', { id: 'player-info-quiz' }, 'text-center mb-4 bg-slate-700 p-4 rounded-lg border border-slate-600');
    playerInfoQuiz.innerHTML = '🏆 Your Score: <span id="current-player-score-quiz" class="font-bold text-lime-400">0</span> | 🔥 Streak: <span id="current-player-streak-quiz" class="font-bold text-orange-400">0</span> | ⚡ Multiplier: <span id="current-player-multiplier-quiz" class="font-bold text-purple-400">1</span>x';
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

    // --- Audio Elements (assuming these are in index.html's body or preloaded there) ---
    // If not, create them here:
    // const audioPath = 'assets/sounds/';
    // const audioSources = [ /* ... as before ... */ ];
    // audioSources.forEach(audio => {
    //     const attrs = { id: audio.id, src: audio.src, preload: 'auto' };
    //     if (audio.loop) attrs.loop = true;
    //     body.appendChild(createEl('audio', attrs)); // Append to body
    // });
}

// -----------------------------------------------------------------------------
// SECTION 2: Application Logic (Quiz Game)
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. Generate the dynamic HTML structure for the page if not fully in index.html
    // If index.html already contains the #app-container and basic layout,
    // generateQuizPageHTMLContent might only populate the #app-container.
    // For this version, we assume index.html provides the main structure,
    // and this function populates the dynamic parts within #app-container.
    generateQuizPageHTMLContent();


    // 2. Define Firebase Configuration (using config injected by server)
    // Ensure window.CONFIG is available before accessing its properties
    const firebaseConfig = window.CONFIG?.firebaseConfig || {
        apiKey: "YOUR_FALLBACK_API_KEY", // Fallback, should be configured
        authDomain: "YOUR_FALLBACK_AUTH_DOMAIN",
        projectId: "YOUR_FALLBACK_PROJECT_ID",
        storageBucket: "YOUR_FALLBACK_STORAGE_BUCKET",
        messagingSenderId: "YOUR_FALLBACK_MESSAGING_SENDER_ID",
        appId: "YOUR_FALLBACK_APP_ID"
    };
    const authAppUrl = window.CONFIG?.authAppUrl || "http://localhost:3001"; // Fallback for local dev

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
    // These elements are created by generateQuizPageHTMLContent
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
    const currentPlayerMultiplierQuiz = document.getElementById('current-player-multiplier-quiz');
    // const liveScoresContainer = document.getElementById('live-scores-container'); // Defined but not explicitly used for hiding/showing
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
    const globalNotificationDiv = document.getElementById('global-notification'); // Already defined in generateContent
    const userIdDisplayFooter = document.getElementById('user-id-display-footer');


    // Ensure audio elements are correctly referenced from index.html or created if not present
    const sounds = {
        click: document.getElementById('sound-click') || document.getElementById('preload-click'),
        correct: document.getElementById('sound-correct') || document.getElementById('preload-correct'),
        incorrect: document.getElementById('sound-incorrect') || document.getElementById('preload-incorrect'),
        streak: document.getElementById('sound-streak'), // Assuming IDs like 'sound-streak'
        timeup: document.getElementById('sound-timeup'),
        join: document.getElementById('sound-join'),
        start: document.getElementById('sound-start'),
        menuMusic: document.getElementById('music-menu'),
    };
    Object.values(sounds).forEach(sound => { if(sound) sound.muted = isMuted; });


    const handleUserInteraction = () => {
        if (!userHasInteracted) {
            userHasInteracted = true;
            // Attempt to play sounds that might have been blocked
            if (sounds.menuMusic && !isMuted && (
                (screens.auth && !screens.auth.classList.contains('hidden')) ||
                (screens.lobbyConnect && !screens.lobbyConnect.classList.contains('hidden')) ||
                (screens.waitingRoom && !screens.waitingRoom.classList.contains('hidden')) ||
                (screens.gameOver && !screens.gameOver.classList.contains('hidden'))
            )) {
                playSound('menuMusic', true);
            }
            // Remove listeners after first interaction
            document.body.removeEventListener('click', handleUserInteraction, true);
            document.body.removeEventListener('keydown', handleUserInteraction, true);
        }
    };
    document.body.addEventListener('click', handleUserInteraction, true);
    document.body.addEventListener('keydown', handleUserInteraction, true);


    // --- Utility Functions ---
    const showScreen = (screenName) => {
        Object.values(screens).forEach(screen => {
            if(screen) screen.classList.add('hidden');
        });
        if (screens[screenName]) {
            screens[screenName].classList.remove('hidden');
        }

        if (connectErrorP && connectErrorP.textContent && connectErrorP.textContent.trim() !== '') {
            connectErrorP.classList.remove('hidden');
        } else if (connectErrorP) {
            connectErrorP.classList.add('hidden');
        }


        if (['lobbyConnect', 'waitingRoom', 'gameOver', 'auth'].includes(screenName)) {
            if (userHasInteracted && !isMuted) playSound('menuMusic', true);
        } else {
            stopSound('menuMusic');
        }
    };

    const playSound = (soundName, loop = false) => {
        if (isMuted && soundName !== 'click') return; // Allow click sound even if muted for tactile feedback
        const sound = sounds[soundName];
        if (sound) {
            sound.loop = loop;
            sound.currentTime = 0;
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (!userHasInteracted && (soundName === 'menuMusic' || loop)) {
                        console.warn(`Autoplay for ${soundName} prevented. Requires user interaction.`);
                    } else {
                        console.warn(`Sound play error (${soundName}):`, error.message);
                    }
                });
            }
            // Adjust volume for click sound if it's the only one playing while muted
            if (isMuted && soundName === 'click') sound.volume = 0.3;
            else if (soundName === 'click') sound.volume = 0.7; // Default click volume
            else sound.volume = 0.8; // Default volume for other sounds
        }
    };


    const stopSound = (soundName) => {
        if (sounds[soundName]) {
            sounds[soundName].pause();
            sounds[soundName].currentTime = 0;
        }
    };

    const speakText = (text) => {
        // Implementation remains the same
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
            window.speechSynthesis.cancel(); // Cancel any previous speech
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn("Speech synthesis error:", e);
        }
    };

    if ('speechSynthesis' in window && window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            // Voices are loaded, you can now safely call getVoices()
        };
    }


    const showGlobalNotification = (message, type = 'info', duration = 3000) => {
        // Implementation remains the same
        if (!globalNotificationDiv) return;
        globalNotificationDiv.textContent = message;
        globalNotificationDiv.className = 'fixed top-5 right-5 text-white px-4 py-2 rounded-md shadow-lg z-50'; // Reset classes
        if (type === 'error') globalNotificationDiv.classList.add('bg-red-500');
        else if (type === 'success') globalNotificationDiv.classList.add('bg-green-500');
        else globalNotificationDiv.classList.add('bg-blue-500'); // Default info

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
        if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_FALLBACK_API_KEY") {
            console.error("Firebase configuration is missing or using fallback values.");
            if(authErrorP) authErrorP.textContent = "App configuration error. Cannot initialize.";
            showGlobalNotification("App configuration error. Please contact support.", "error", 10000);
            showScreen('auth'); // Stay on auth screen or show an error screen
            return;
        }

        try {
            // Check if Firebase and its services are loaded
            if (typeof firebase === 'undefined' ||
                typeof firebase.initializeApp !== 'function' ||
                typeof firebase.auth !== 'function' ||
                typeof firebase.firestore !== 'function') {
                console.error("Firebase SDK not fully loaded.");
                showGlobalNotification("Core libraries not loaded. Please refresh.", "error", 10000);
                if(authErrorP) authErrorP.textContent = "Error: Core libraries not ready.";
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
            showGlobalNotification(`Firebase Init Error: ${error.message}`, "error");
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
                    idToken = await user.getIdToken(true); // Force refresh token
                    console.log("User is signed in:", user.uid, "Token acquired.");
                    if(userEmailDisplay) userEmailDisplay.textContent = user.displayName || user.email;
                    currentPlayerId = user.uid;
                    currentPlayerName = user.displayName || user.email.split('@')[0];
                    if(playerNameInput) {
                        playerNameInput.value = currentPlayerName;
                        playerNameInput.disabled = true; // Disable name input for logged-in users
                    }
                    if(userIdDisplayFooter) userIdDisplayFooter.textContent = `UserID: ${user.uid}`;

                    authFormContainer.classList.add('hidden');
                    authUserInfoDiv.classList.remove('hidden');
                    if(authErrorP) authErrorP.textContent = '';

                    // Initialize or reconfigure socket with new auth state
                    initSocketConnection();

                } catch (tokenError) {
                    console.error("Error getting ID token:", tokenError);
                    if(authErrorP) authErrorP.textContent = "Session error. Please log in again.";
                    currentUser = null;
                    idToken = null;
                    authFormContainer.classList.remove('hidden');
                    authUserInfoDiv.classList.add('hidden');
                    if(playerNameInput) playerNameInput.disabled = false; // Enable for guest
                    // Attempt to connect as guest if token fails
                    initSocketConnection();
                }
            } else { // User is signed out or not yet signed in
                console.log("User is signed out or is a guest.");
                currentUser = null;
                idToken = null;
                // Generate a guest ID if not already set or if previous was Firebase UID
                if (!currentPlayerId || !currentPlayerId.startsWith('guest-')) {
                    currentPlayerId = `guest-${Date.now()}${Math.random().toString(36).substring(2,7)}`;
                }
                if(playerNameInput) playerNameInput.disabled = false; // Enable name input for guests
                if(userIdDisplayFooter) userIdDisplayFooter.textContent = `UserID: ${currentPlayerId} (Guest)`;


                authFormContainer.classList.remove('hidden');
                authUserInfoDiv.classList.add('hidden');
                if(authErrorP) authErrorP.textContent = '';

                // Initialize or reconfigure socket for guest
                initSocketConnection();
            }
        });

        if(loginForm) loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!loginEmailInput || !loginPasswordInput || !firebaseAuth) return;
            if(authErrorP) authErrorP.textContent = '';
            try {
                await firebaseAuth.signInWithEmailAndPassword(loginEmailInput.value, loginPasswordInput.value);
                // onAuthStateChanged will handle UI update and socket re-init
            } catch (error) {
                console.error("Login error:", error);
                if(authErrorP) authErrorP.textContent = error.message;
            }
        });

        if(registerForm) registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!registerDisplayNameInput || !registerEmailInput || !registerPasswordInput || !firebaseAuth) return;
            if(authErrorP) authErrorP.textContent = '';
            const displayName = registerDisplayNameInput.value;
            const email = registerEmailInput.value;
            const password = registerPasswordInput.value;
            try {
                const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
                await userCredential.user.updateProfile({ displayName: displayName });
                // onAuthStateChanged will handle UI update and socket re-init
                console.log("Registration successful, profile update requested.");
            } catch (error) {
                console.error("Registration error:", error);
                if(authErrorP) authErrorP.textContent = error.message;
            }
        });

        if(googleSignInBtn) googleSignInBtn.addEventListener('click', async () => {
            if(!firebaseAuth) return;
            if(authErrorP) authErrorP.textContent = '';
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                await firebaseAuth.signInWithPopup(provider);
                // onAuthStateChanged will handle UI update and socket re-init
            } catch (error) {
                console.error("Google Sign-In error:", error);
                if(authErrorP) authErrorP.textContent = `Google Sign-In Error: ${error.message} (Code: ${error.code})`;
                // Handle specific errors like popup closed by user
            }
        });

        if(logoutBtn) logoutBtn.addEventListener('click', async () => {
            if(!firebaseAuth) return;
            try {
                await firebaseAuth.signOut();
                // onAuthStateChanged will handle UI update and socket re-init for guest
                showScreen('auth'); // Explicitly show auth screen after logout
            } catch (error) {
                console.error("Logout error:", error);
                if(authErrorP) authErrorP.textContent = error.message;
            }
        });

        if(proceedToLobbyBtn) proceedToLobbyBtn.addEventListener('click', () => {
            // currentUser might be a Firebase user or a guest (if idToken is null but currentPlayerId is guest)
            if (currentPlayerId) { // Check if any player ID is set (user or guest)
                showScreen('lobbyConnect');
                fetchCategories(); // Fetch categories when proceeding to lobby
            } else {
                if(authErrorP) authErrorP.textContent = "Authentication state unclear. Please wait or refresh.";
            }
        });
    };

    if(backToAuthBtn) backToAuthBtn.addEventListener('click', () => showScreen('auth'));


    // --- Socket.IO Connection & Event Handlers ---
    const initSocketConnection = () => {
        const currentSocketId = socket ? socket.id : null;
        let newConnectionRequired = !socket || !socket.connected;

        const socketOptions = {
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            // Removed explicit path to use Socket.IO default '/socket.io/'
            // path: '/game/socket.io/', // REMOVED - Server uses default path
            auth: {} // Will be populated based on auth state
        };

        if (idToken) { // Authenticated user
            socketOptions.auth.token = idToken;
            if (socket && socket.auth && socket.auth.token !== idToken) newConnectionRequired = true;
            if (socket && socket.io && socket.io.opts && socket.io.opts.query) delete socket.io.opts.query.playerName; // Clear guest player name
        } else { // Guest user
            const guestName = currentPlayerName || `Guest-${Math.random().toString(36).substring(2,7)}`;
            socketOptions.query = { playerName: guestName };
            if (socket && socket.auth && socket.auth.token) newConnectionRequired = true; // Was authenticated, now guest
            if (socket && socket.io && socket.io.opts && socket.io.opts.query && socket.io.opts.query.playerName !== guestName) newConnectionRequired = true;
        }


        if (newConnectionRequired) {
            if (socket) {
                console.log("Reconfiguring socket connection. Disconnecting previous if any.");
                socket.disconnect();
            }
            console.log("Initializing new socket connection with options:", socketOptions);
            if (typeof io === 'undefined') {
                console.error("Socket.IO client (io) not loaded. Cannot connect.");
                if(connectionStatusSpan) connectionStatusSpan.textContent = "Error: Socket library missing";
                showGlobalNotification("Socket library error. Please refresh.", "error");
                return;
            }
            socket = io(window.location.origin, socketOptions); // Connect to same origin, server handles path
            setupSocketEventListeners(); // Setup listeners on the new socket instance
        } else if (socket && socket.connected) {
            console.log("Socket already connected and configured correctly for current auth state.");
        } else if (socket && !socket.connected) {
            console.log("Socket exists but not connected, attempting to connect.");
            socket.connect();
        }
    };


    const setupSocketEventListeners = () => {
        if (!socket) return;

        // Remove all existing listeners to prevent duplicates if called multiple times
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('sessionCheckResult');
        socket.off('lobbyCreated');
        socket.off('joinedLobby');
        socket.off('joinLobbyError');
        socket.off('lobbyUpdate');
        socket.off('categorySelectedByHost');
        socket.off('gameStarted');
        socket.off('startGameError');
        socket.off('question');
        socket.off('timerUpdate');
        socket.off('answerSubmittedFeedback');
        socket.off('answerError');
        socket.off('answerResult');
        socket.off('questionOver');
        socket.off('updateScores');
        socket.off('gameOver');
        socket.off('gamePaused');
        socket.off('gameResumed');
        socket.off('gameSkippedToEnd');
        socket.off('lobbyResetForPlayAgain');
        socket.off('hostChanged');
        socket.off('leftLobbySuccess');
        socket.off('leaveLobbyError');
        socket.off('hostDisconnectedDuringGame');
        socket.off('errorGame');


        socket.on('connect', () => {
            if(connectionStatusSpan) {
                connectionStatusSpan.textContent = 'Connected';
                connectionStatusSpan.classList.remove('text-red-500');
                connectionStatusSpan.classList.add('text-green-500');
            }
            console.log('Socket connected to server with ID:', socket.id);
            // If there's a currentLobbyId, maybe try to rejoin or signal server
            // For now, relies on user action to join/create lobby after connection.
            // socket.emit('checkExistingSession'); // If server supports this for rejoining
        });

        socket.on('disconnect', (reason) => {
            if(connectionStatusSpan) {
                connectionStatusSpan.textContent = `Disconnected: ${reason}`;
                connectionStatusSpan.classList.remove('text-green-500');
                connectionStatusSpan.classList.add('text-red-500');
            }
            console.warn('Socket disconnected:', reason);
            if (reason === 'io server disconnect' && socket) { // Server initiated disconnect
                // Optionally, attempt to reconnect or notify user
                // socket.connect(); // Be careful with auto-reconnect loops
            }
        });

        socket.on('connect_error', (err) => {
            console.error("Socket connection error:", err.message, err.data ? err.data : '');
            if(connectionStatusSpan) {
                connectionStatusSpan.textContent = `Connection Error`;
                connectionStatusSpan.classList.remove('text-green-500');
                connectionStatusSpan.classList.add('text-red-500');
            }
            const errData = err.data || {};
            if (err.message === 'Authentication error: Invalid token' || (errData && errData.message === 'Authentication error: Invalid token')) {
                showGlobalNotification("Session expired or invalid. Please log in again.", "error");
                if (firebaseAuth && currentUser) { // If was logged in
                    firebaseAuth.signOut().catch(e => console.error("Error signing out after socket auth error", e));
                } else { // Was guest or already signed out
                    showScreen('auth');
                }
            }
        });

        // socket.on('sessionCheckResult', (data) => { /* ... */ });

        socket.on('lobbyCreated', (data) => {
            currentLobbyId = data.lobbyId;
            // currentPlayerId is already set by auth flow
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
            playerMap = {}; // Reset playerMap
            lobbyData.players.forEach(p => playerMap[p.id] = p.name); // Update playerMap


            if(playerListWaitingUl) playerListWaitingUl.innerHTML = '';
            lobbyData.players.forEach(player => {
                const li = document.createElement('li');
                li.className = 'player-list-item bg-slate-600 p-3 rounded-lg';
                li.textContent = `${player.name} (Score: ${player.score || 0}, Streak: ${player.streak || 0}, Multiplier: ${player.multiplier || 1}x)`;

                if (player.id === lobbyData.hostId) {
                    const hostBadge = document.createElement('span');
                    hostBadge.className = 'inline-block ml-2 px-2 py-1 text-xs font-semibold bg-sky-500 text-white rounded-full';
                    hostBadge.textContent = '👑 Host';
                    li.appendChild(hostBadge);
                }
                if (player.id === currentPlayerId) {
                    li.classList.add('current-user', 'bg-lime-900/50', 'border', 'border-lime-500');
                    // Don't add "(You)" if name is already currentPlayerName
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
            if(playerCountSpan) playerCountSpan.textContent = lobbyData.players.filter(p => !p.disconnected).length.toString();

            if (lobbyData.category) {
                if(selectedCategoryDisplay) selectedCategoryDisplay.textContent = lobbyData.category;
                if (isHost && categorySelect && categorySelect.value !== lobbyData.category) {
                    categorySelect.value = lobbyData.category;
                }
            } else {
                if(selectedCategoryDisplay) selectedCategoryDisplay.textContent = 'N/A';
            }
            if(startGameBtn && categorySelect && playerListWaitingUl) {
                const activePlayerCount = Array.from(playerListWaitingUl.children).filter(li => !li.classList.contains('opacity-50')).length;
                startGameBtn.disabled = !(isHost && categorySelect.value && activePlayerCount > 0);
            }
            updateWaitingRoomUI(); // General UI update based on host status
        });

        socket.on('categorySelectedByHost', (data) => {
            if (!isHost) { // Only update for non-hosts
                if(selectedCategoryDisplay) selectedCategoryDisplay.textContent = data.category || 'N/A';
                showGlobalNotification(`Host selected category: ${data.category}`, 'info');
            }
        });

        socket.on('gameStarted', (data) => {
            console.log('Game started:', data);
            currentQuestionIndex = -1; // Reset for new game
            isGamePaused = false;
            if(gamePausedMessage) gamePausedMessage.classList.add('hidden');
            if(quizCategoryDisplay) quizCategoryDisplay.textContent = data.category;
            // Update playerMap with initial game players
            playerMap = {};
            data.players.forEach(p => playerMap[p.id] = p.name);

            showScreen('quiz');
            updateQuizUI(); // Update based on host status, pause status
            playSound('start');
            showGlobalNotification(`Game started! Category: ${data.category}`, 'success');
        });

        socket.on('startGameError', (data) => {
            if(startGameErrorP) startGameErrorP.textContent = data.message;
            showGlobalNotification(data.message, 'error');
        });

        const getCurrentQuestionData = () => { // Helper to get current question's time limit
            return { timeLimit: (timerDisplay && timerDisplay.dataset.initialTime) ? parseInt(timerDisplay.dataset.initialTime) : 60 };
        };

        socket.on('question', (data) => {
            console.log('Received question:', data);
            currentQuestionIndex = data.index;
            if(questionTextDisplay) questionTextDisplay.textContent = data.text;
            if(questionCounterDisplay) {
                questionCounterDisplay.textContent = `Question ${data.index + 1} of ${data.totalQuestions}`;
                // Update progress bar for question counter
                const progress = (data.index + 1) / data.totalQuestions * 100;
                questionCounterDisplay.style.setProperty('--progress', `${progress}%`);
            }
            if(quizCategoryDisplay) quizCategoryDisplay.textContent = data.category;
            if(answerFeedbackText) {
                answerFeedbackText.textContent = '';
                answerFeedbackText.className = 'text-center text-lg mb-4 min-h-[2rem]'; // Reset classes
            }

            if(answerOptionsContainer) answerOptionsContainer.innerHTML = '';
            data.options.forEach((option, idx) => {
                const button = document.createElement('button');
                button.className = 'answer-option-btn'; // Base class
                const optionLetter = String.fromCharCode(65 + idx);
                button.innerHTML = `<span class="font-bold text-sky-300 mr-2">${optionLetter}.</span> ${option}`; // Option letter
                button.dataset.answer = option; // Store answer value

                button.onclick = () => {
                    if (button.classList.contains('disabled') || isGamePaused) return;
                    playSound('click');
                    document.querySelectorAll('.answer-option-btn').forEach(btn => {
                        btn.classList.remove('selected'); // Remove selected from others
                        btn.classList.add('disabled'); // Disable all options
                        btn.disabled = true;
                    });
                    button.classList.add('selected'); // Mark this one as selected
                    socket.emit('submitAnswer', { lobbyId: currentLobbyId, questionIndex: currentQuestionIndex, answer: option });
                    if(answerFeedbackText) answerFeedbackText.textContent = '✅ Answer submitted... Waiting for results.';
                };
                if(answerOptionsContainer) answerOptionsContainer.appendChild(button);
            });

            if(timerDisplay) {
                timerDisplay.textContent = data.timeLimit.toString();
                timerDisplay.dataset.initialTime = data.timeLimit.toString(); // Store initial time for percentage calc
            }
            updateTimerDisplay(data.timeLimit, data.timeLimit); // Initialize timer display
            isGamePaused = false; // Reset pause state for new question
            if(gamePausedMessage) gamePausedMessage.classList.add('hidden');
            updateQuizUI(); // Update host controls, pause button text etc.
            speakText(data.text); // Speak the question
        });

        socket.on('timerUpdate', (data) => {
            const initialTime = timerDisplay && timerDisplay.dataset.initialTime ? parseInt(timerDisplay.dataset.initialTime) : GAME_CONFIG.DEFAULT_TIME_LIMIT;
            updateTimerDisplay(data.timeLeft, initialTime);
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
            // UI already updated optimistically or will be by answerResult/questionOver
        });

        socket.on('answerError', (data) => {
            showGlobalNotification(data.message, 'error');
            if(answerFeedbackText) {
                answerFeedbackText.textContent = data.message;
                answerFeedbackText.classList.add('text-red-400');
            }
        });

        socket.on('answerResult', (data) => { // Individual feedback
            if(currentPlayerScoreQuiz) currentPlayerScoreQuiz.textContent = data.score.toString();
            if(currentPlayerStreakQuiz) currentPlayerStreakQuiz.textContent = data.streak.toString();
            if(currentPlayerMultiplierQuiz) currentPlayerMultiplierQuiz.textContent = (data.multiplier || 1).toString();

            document.querySelectorAll('.answer-option-btn').forEach(btn => {
                // General disabling handled by questionOver, this is for immediate feedback
                if (btn.dataset.answer === data.yourAnswer) {
                    if (data.correct) {
                        btn.classList.add('correct');
                    } else {
                        btn.classList.add('incorrect');
                    }
                }
                // Ensure all are disabled after an answer is processed for this client
                btn.classList.add('disabled');
                btn.disabled = true;
            });

            if (data.correct) {
                const pointsMessage = data.pointsEarned ? ` (+${data.pointsEarned} points)` : '';
                if(answerFeedbackText) {
                    answerFeedbackText.textContent = `✅ Correct!${pointsMessage}`;
                    answerFeedbackText.className = 'text-center text-lg mb-4 text-green-400 font-semibold';
                }
                playSound('correct');
                if (data.streak > 1 && data.streak % 3 === 0) playSound('streak'); // Play streak sound e.g. every 3 correct answers
            } else {
                if(answerFeedbackText) {
                    answerFeedbackText.textContent = `❌ Incorrect! The correct answer was: ${data.correctAnswer}`;
                    answerFeedbackText.className = 'text-center text-lg mb-4 text-red-400 font-semibold';
                }
                playSound('incorrect');
            }
        });


        socket.on('questionOver', (data) => { // All players see this
            document.querySelectorAll('.answer-option-btn').forEach(btn => {
                btn.classList.add('disabled'); // Ensure all are disabled
                btn.disabled = true;
                btn.classList.remove('selected'); // Clear selection visual

                if (btn.dataset.answer === data.correctAnswer) {
                    btn.classList.add('correct'); // Highlight correct answer for everyone
                    btn.classList.remove('incorrect', 'opacity-60'); // Ensure it's clearly correct
                } else if (btn.dataset.answer === data.yourAnswer && data.yourAnswer !== data.correctAnswer) {
                    // This case is handled by 'answerResult' for the specific client.
                    // For other clients, their 'answerResult' would have handled their own pick.
                } else {
                    btn.classList.add('opacity-60'); // Dim other non-picked, incorrect options
                }
            });
            // Speak correct answer only once, not for every client individually here
            // speakText(`The correct answer was: ${data.correctAnswer}`);
            updateLiveScores(data.scores, data.streaks, data.multipliers);
        });


        socket.on('updateScores', (scores, streaks, multipliers) => {
            updateLiveScores(scores, streaks || {}, multipliers || {});
            // Update own score display if it's part of this generic update
            if (scores[currentPlayerId] !== undefined && currentPlayerScoreQuiz) {
                currentPlayerScoreQuiz.textContent = scores[currentPlayerId].toString();
            }
            if (streaks && streaks[currentPlayerId] !== undefined && currentPlayerStreakQuiz) {
                currentPlayerStreakQuiz.textContent = streaks[currentPlayerId].toString();
            }
            if (multipliers && multipliers[currentPlayerId] !== undefined && currentPlayerMultiplierQuiz) {
                currentPlayerMultiplierQuiz.textContent = multipliers[currentPlayerId].toString();
            }
        });

        socket.on('gameOver', (data) => {
            console.log('Game over:', data);
            showScreen('gameOver');
            updateGameOverUI(data.finalScores);
            playSound('start'); // Or a specific game over sound
            speakText("Game Over! Check the final scores.");
        });

        socket.on('gamePaused', (data) => {
            isGamePaused = true;
            if(gamePausedMessage) {
                gamePausedMessage.classList.remove('hidden');
                gamePausedMessage.textContent = `⏸️ Game Paused. Time left: ${data.timeLeft}s`;
            }
            if(timerDisplay) timerDisplay.classList.add('opacity-50');
            showGlobalNotification('Game Paused by Host', 'warning');
            updateQuizUI(); // Updates button states etc.
        });

        socket.on('gameResumed', (data) => {
            isGamePaused = false;
            if(gamePausedMessage) gamePausedMessage.classList.add('hidden');
            if(timerDisplay) {
                timerDisplay.classList.remove('opacity-50');
                timerDisplay.textContent = data.timeLeft.toString(); // Update timer with resumed time
            }
            // updateTimerDisplay(data.timeLeft, data.timeLeft); // Re-initialize timer display with remaining time
            showGlobalNotification('Game Resumed by Host', 'info');
            updateQuizUI(); // Updates button states etc.
            // Re-enable answer buttons if they were disabled by pause
            document.querySelectorAll('.answer-option-btn:not(.selected)').forEach(btn => {
                if (!btn.classList.contains('correct') && !btn.classList.contains('incorrect')) { // Don't re-enable if already answered
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                }
            });
        });

        socket.on('gameSkippedToEnd', () => {
            showGlobalNotification('Game skipped to end by host.', 'warning');
            // Server will send 'gameOver' event next
        });

        socket.on('lobbyResetForPlayAgain', (data) => {
            showGlobalNotification('Host wants to play again! Lobby reset.', 'info');
            currentLobbyId = data.lobbyId;
            // isHost will be updated by lobbyUpdate if it's part of data.players or by hostChanged
            // For now, assume it might change and update UI accordingly.
            if(lobbyIdDisplay) lobbyIdDisplay.textContent = currentLobbyId;

            // Reset local game state
            currentQuestionIndex = -1;
            isGamePaused = false;
            playerMap = {};
            data.players.forEach(p => playerMap[p.id] = p.name);


            if(playerListWaitingUl) playerListWaitingUl.innerHTML = ''; // Clear old list
            data.players.forEach(player => {
                const li = document.createElement('li');
                li.className = 'player-list-item bg-slate-600 p-3 rounded-lg';
                li.textContent = `${player.name} (Score: 0, Streak: 0, Multiplier: ${player.multiplier || 1}x)`;
                if (player.id === data.hostId) { /* Add host badge */ }
                if (player.id === currentPlayerId) { /* Add current user highlight */ }
                if(playerListWaitingUl) playerListWaitingUl.appendChild(li);
            });
            if(playerCountSpan) playerCountSpan.textContent = data.players.length.toString();


            if(categorySelect) categorySelect.value = ''; // Reset category selection
            if(selectedCategoryDisplay) selectedCategoryDisplay.textContent = 'N/A';
            if(startGameBtn) startGameBtn.disabled = !isHost; // Re-evaluate start button
            if(startGameErrorP) startGameErrorP.textContent = '';

            showScreen('waitingRoom');
            updateWaitingRoomUI(); // This will correctly set host controls
        });


        socket.on('hostChanged', (data) => {
            const newHostId = data.newHostId;
            isHost = (newHostId === currentPlayerId);
            let newHostName = playerMap[newHostId] || (isHost ? "You!" : `Player ${newHostId.substring(0,5)}`);
            showGlobalNotification(`Host changed. New host: ${newHostName}`, 'info');
            updateWaitingRoomUI();
            updateQuizUI(); // If game is in progress and host changes (though less common)
        });


        socket.on('leftLobbySuccess', () => {
            showGlobalNotification('You have left the lobby.', 'info');
            currentLobbyId = null;
            isHost = false;
            playerMap = {};
            showScreen('lobbyConnect');
        });

        socket.on('leaveLobbyError', (data) => {
            showGlobalNotification(`Error leaving lobby: ${data.message}`, 'error');
        });

        socket.on('hostDisconnectedDuringGame', () => {
            showGlobalNotification('Host disconnected during the game. The game will end.', 'error');
            // Server will likely send 'gameOver'
        });

        socket.on('errorGame', (data) => { // Generic game error from server
            showGlobalNotification(data.message, 'error');
        });
    };


    // --- UI Update Functions ---
    const updateWaitingRoomUI = () => {
        if (!screens.waitingRoom || screens.waitingRoom.classList.contains('hidden')) return;

        if(currentPlayerIdDisplay) currentPlayerIdDisplay.textContent = currentPlayerId;
        if(currentPlayerNameDisplay) currentPlayerNameDisplay.textContent = currentPlayerName;

        const showHostControls = isHost;
        if(hostControlsWaitingDiv) hostControlsWaitingDiv.classList.toggle('hidden', !showHostControls);
        if(nonHostInfoWaitingDiv) nonHostInfoWaitingDiv.classList.toggle('hidden', showHostControls);

        if (isHost && startGameBtn && categorySelect && playerListWaitingUl) {
            const activePlayerCount = Array.from(playerListWaitingUl.children).filter(li => !li.classList.contains('opacity-50')).length;
            startGameBtn.disabled = !categorySelect.value || activePlayerCount === 0;
        }
    };

    const updateQuizUI = () => {
        if (!screens.quiz || screens.quiz.classList.contains('hidden')) return;

        const showHostControls = isHost;
        if(hostGameControlsQuizDiv) hostGameControlsQuizDiv.classList.toggle('hidden', !showHostControls);

        if (isHost && pauseGameBtn) {
            pauseGameBtn.innerHTML = isGamePaused ? '▶️ Resume' : '⏸️ Pause';
        }

        if(gamePausedMessage) gamePausedMessage.classList.toggle('hidden', !isGamePaused);
        if(answerOptionsContainer) answerOptionsContainer.classList.toggle('opacity-50', isGamePaused);
        document.querySelectorAll('.answer-option-btn').forEach(btn => {
            // Disable if game is paused, OR if already answered (selected, correct, incorrect)
            btn.disabled = isGamePaused || btn.classList.contains('selected') || btn.classList.contains('correct') || btn.classList.contains('incorrect');
        });
    };

    const updateTimerDisplay = (timeLeft, initialTime) => {
        if(!timerDisplay) return;
        timerDisplay.textContent = timeLeft.toString();
        // timerDisplay.dataset.initialTime = initialTime.toString(); // Already set when question arrives

        const percentage = (initialTime > 0 ? (timeLeft / initialTime) : 0) * 100;
        // Remove old classes before adding new ones
        timerDisplay.classList.remove('text-yellow-400', 'text-orange-500', 'text-red-500', 'urgent-low', 'urgent-medium', 'urgent-high');

        if (percentage <= 25) {
            timerDisplay.classList.add('text-red-500', 'urgent-high');
        } else if (percentage <= 50) {
            timerDisplay.classList.add('text-orange-500', 'urgent-medium');
        } else {
            timerDisplay.classList.add('text-yellow-400', 'urgent-low');
        }
    };

    // let playerMap = {}; // Moved to global state for wider access

    const updateLiveScores = (scoresData, streaksData, multipliersData) => {
        if(!liveScoresListUl) return;
        liveScoresListUl.innerHTML = ''; // Clear previous scores

        const sortedPlayers = Object.entries(scoresData)
            .map(([id, score]) => {
                const name = playerMap[id] || (id === currentPlayerId ? currentPlayerName : `P-${id.substring(0, 5)}`);
                return {
                    id,
                    name,
                    score,
                    streak: (streaksData && streaksData[id]) ? streaksData[id] : 0,
                    multiplier: (multipliersData && multipliersData[id]) ? multipliersData[id] : 1
                };
            })
            .sort((a, b) => b.score - a.score);

        sortedPlayers.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'p-2 bg-slate-600/50 rounded'; // Slightly more subtle background

            let rank = '';
            if (index === 0) rank = '🥇 ';
            else if (index === 1) rank = '🥈 ';
            else if (index === 2) rank = '🥉 ';
            else rank = `${index + 1}. `;

            li.textContent = `${rank}${player.name}: ${player.score} (S: ${player.streak}, M: ${player.multiplier}x)`;
            if (player.id === currentPlayerId) {
                li.classList.add('font-bold', 'text-lime-300', 'bg-lime-900/30', 'border', 'border-lime-600');
            }
            liveScoresListUl.appendChild(li);
        });
    };

    const updateGameOverUI = (finalScores) => {
        if(!finalScoresListUl) return;
        finalScoresListUl.innerHTML = '';
        finalScores.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-slate-600 rounded-lg shadow-md';

            let medal = '';
            if (index === 0) medal = '<span class="medal-gold text-2xl" role="img" aria-label="Gold Medal">🥇</span> ';
            else if (index === 1) medal = '<span class="medal-silver text-2xl" role="img" aria-label="Silver Medal">🥈</span> ';
            else if (index === 2) medal = '<span class="medal-bronze text-2xl" role="img" aria-label="Bronze Medal">🥉</span> ';

            const playerName = playerMap[player.id] || player.name; // Use mapped name if available

            li.innerHTML = `${medal}${playerName}: ${player.score} points (Final Multiplier: ${player.multiplier || 1}x)`;
            if (player.id === currentPlayerId) {
                li.classList.add('font-bold', 'text-lime-300', 'bg-lime-900/50', 'border-2', 'border-lime-500');
                if(submitHallOfFameBtn) {
                    submitHallOfFameBtn.disabled = !(player.score > 0 && currentUser); // Enable only for logged-in users with score
                    submitHallOfFameBtn.dataset.score = player.score.toString();
                }
            }
            if (player.disconnected) {
                li.innerHTML += ' <span class="text-xs text-slate-500">(Disconnected)</span>';
                li.classList.add('italic', 'text-slate-400', 'opacity-70');
            }
            finalScoresListUl.appendChild(li);
        });

        const showHostControls = isHost;
        if(gameOverHostControlsDiv) gameOverHostControlsDiv.classList.toggle('hidden', !showHostControls);
        if(gameOverNonHostMsgDiv) gameOverNonHostMsgDiv.classList.toggle('hidden', showHostControls);

        if (submitHallOfFameBtn) { // Ensure button exists
            if (!currentUser) { // Disable for guests
                submitHallOfFameBtn.disabled = true;
                submitHallOfFameBtn.title = "Log in to submit your score to the Hall of Fame.";
            } else {
                submitHallOfFameBtn.title = "Submit your score!";
            }
        }
    };

    // --- Event Listeners ---
    if(playerNameInput) playerNameInput.addEventListener('input', (e) => {
        if (!currentUser) { // Only allow guests to change their name
            currentPlayerName = e.target.value;
            localStorage.setItem('quizPlayerName', currentPlayerName);
            // If socket is already connected as guest, update name for next connection attempt if needed
            if (socket && !idToken && socket.io && socket.io.opts && socket.io.opts.query) {
                socket.io.opts.query.playerName = currentPlayerName;
            }
        }
    });

    if(lobbyIdInput) lobbyIdInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    });


    if(createLobbyBtn) createLobbyBtn.addEventListener('click', () => {
        playSound('click');
        if (!socket || !socket.connected) {
            showGlobalNotification("Not connected. Attempting to connect...", "error");
            initSocketConnection(); // Try to connect if not already
            return;
        }
        if(connectErrorP) {
            connectErrorP.textContent = '';
            connectErrorP.classList.add('hidden');
        }
        // Name is derived from currentUser or guest playerName from socket options
        const nameForLobby = currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : (playerNameInput.value || `Guest-${Math.random().toString(36).substring(2,7)}`);
        if (!nameForLobby && !currentUser) { // Should not happen if playerNameInput is used for guests
            if(connectErrorP) {
                connectErrorP.textContent = 'Please enter your name.';
                connectErrorP.classList.remove('hidden');
            }
            return;
        }
        socket.emit('createLobby', { playerName: nameForLobby });
    });

    if(joinLobbyBtn) joinLobbyBtn.addEventListener('click', () => {
        playSound('click');
        if (!socket || !socket.connected) {
            showGlobalNotification("Not connected. Attempting to connect...", "error");
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
        const nameForLobby = currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : (playerNameInput.value || `Guest-${Math.random().toString(36).substring(2,7)}`);
        if (!nameForLobby && !currentUser) {
            if(connectErrorP) {
                connectErrorP.textContent = 'Please enter your name to join as guest.';
                connectErrorP.classList.remove('hidden');
            }
            return;
        }
        socket.emit('joinLobby', { lobbyId, playerName: nameForLobby });
    });


    if(copyLobbyIdBtn) copyLobbyIdBtn.addEventListener('click', () => {
        playSound('click');
        if(currentLobbyId && navigator.clipboard) {
            navigator.clipboard.writeText(currentLobbyId)
                .then(() => showGlobalNotification('Lobby ID copied to clipboard!', 'success'))
                .catch(err => {
                    console.error('Failed to copy Lobby ID:', err);
                    showGlobalNotification('Failed to copy. Manual copy: ' + currentLobbyId, 'error');
                });
        } else if (currentLobbyId) { // Fallback for older browsers
            showGlobalNotification('Manual copy: ' + currentLobbyId, 'info');
        }
    });

    const commonLeaveLobby = () => {
        playSound('click');
        if (socket && currentLobbyId) {
            socket.emit('leaveLobby', { lobbyId: currentLobbyId });
        } else { // If not in a lobby or socket disconnected, just go back
            currentLobbyId = null;
            isHost = false;
            playerMap = {};
            showScreen('lobbyConnect');
        }
    };
    if(leaveLobbyBtnWaiting) leaveLobbyBtnWaiting.addEventListener('click', commonLeaveLobby);
    if(leaveLobbyBtnGameover) leaveLobbyBtnGameover.addEventListener('click', commonLeaveLobby);


    if(categorySelect) categorySelect.addEventListener('change', () => {
        playSound('click');
        if (isHost && currentLobbyId && socket && categorySelect.value) {
            socket.emit('hostSelectedCategory', { lobbyId: currentLobbyId, category: categorySelect.value });
            if(startGameBtn && playerListWaitingUl) {
                const activePlayerCount = Array.from(playerListWaitingUl.children).filter(li => !li.classList.contains('opacity-50')).length;
                startGameBtn.disabled = activePlayerCount === 0; // Enable if category selected and players exist
            }
            if(startGameErrorP) startGameErrorP.textContent = '';
        } else if (isHost && startGameBtn) {
            startGameBtn.disabled = true; // Disable if no category selected
        }
    });


    if(startGameBtn) startGameBtn.addEventListener('click', () => {
        playSound('click');
        if (isHost && currentLobbyId && categorySelect && categorySelect.value && socket) {
            if(startGameErrorP) startGameErrorP.textContent = '';
            if(playerListWaitingUl) {
                const activePlayerCount = Array.from(playerListWaitingUl.children).filter(li => !li.classList.contains('opacity-50')).length;
                if (activePlayerCount === 0) {
                    if(startGameErrorP) startGameErrorP.textContent = 'Cannot start with 0 active players.';
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
            // Consider adding a confirmation modal here instead of window.confirm
            showGlobalNotification("Skipping to end...", "warning"); // Optimistic UI
            socket.emit('hostSkipToEnd', { lobbyId: currentLobbyId });
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
        const score = parseInt(submitHallOfFameBtn.dataset.score || "0");
        const category = quizCategoryDisplay ? quizCategoryDisplay.textContent || "Unknown Category" : "Unknown Category";
        const playerNameForHoF = currentUser.displayName || currentUser.email.split('@')[0];

        if (isNaN(score) || score <= 0) {
            showGlobalNotification("No valid score to submit.", "info");
            return;
        }

        submitHallOfFameBtn.disabled = true;
        submitHallOfFameBtn.textContent = 'Submitting...';
        try {
            // Ensure authAppUrl is correctly defined
            const submitUrl = `${authAppUrl}/api/hall-of-fame/submit`;
            console.log("Submitting to Hall of Fame URL:", submitUrl);

            const response = await fetch(submitUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ score, category, playerName: playerNameForHoF })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            // const result = await response.json(); // Assuming server sends back confirmation
            showGlobalNotification('Score submitted to Hall of Fame!', 'success');
        } catch (error) {
            console.error('Hall of Fame submission error:', error);
            showGlobalNotification(`Failed to submit score: ${error.message}`, 'error');
        } finally {
            if(submitHallOfFameBtn) {
                submitHallOfFameBtn.disabled = false; // Re-enable, or keep disabled if one-time submit
                submitHallOfFameBtn.textContent = '🌟 Submit Score to Hall of Fame';
            }
        }
    });


    if(muteToggleBtn) muteToggleBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        localStorage.setItem('quizMuted', isMuted.toString());
        updateMuteButton();
        playSound('click'); // Mute button click sound should always play lightly
        if (isMuted) {
            stopSound('menuMusic');
            if ('speechSynthesis'in window) window.speechSynthesis.cancel();
        } else {
            // If on a screen where menu music should play, start it
            const currentScreenVisible = Object.keys(screens).find(key => screens[key] && !screens[key].classList.contains('hidden'));
            if (['lobbyConnect', 'waitingRoom', 'gameOver', 'auth'].includes(currentScreenVisible)) {
                playSound('menuMusic', true);
            }
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
        // Allow Esc to close global notification
        if (e.key === 'Escape' && globalNotificationDiv && !globalNotificationDiv.classList.contains('hidden')) {
            globalNotificationDiv.classList.add('hidden');
        }
    });

    // --- Initial Setup ---
    const fetchCategories = async () => {
        try {
            const response = await fetch('/game/api/categories'); // Path relative to current host
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            availableCategories = await response.json();
            if(categorySelect) {
                categorySelect.innerHTML = '<option value="">-- Select a Category --</option>'; // Clear old
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
    // Ensure Firebase SDKs are loaded (they are linked in index.html)
    // Then initialize Firebase and the rest of the app.
    // A small delay can sometimes help ensure all scripts are parsed,
    // but ideally, script load order and DOMContentLoaded handle this.
    if (window.CONFIG && window.CONFIG.firebaseConfig) {
        initializeFirebase();
    } else {
        // Fallback or error if config not injected by server
        console.error("CRITICAL: Client configuration not found. Firebase cannot be initialized.");
        showGlobalNotification("Application configuration error. Please refresh.", "error", 10000);
        const appContainer = document.getElementById('app-container');
        if(appContainer) appContainer.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Application configuration is missing. The game cannot start.</p>";
    }

    updateMuteButton();
    showScreen('auth'); // Start at the authentication screen
    // Initial loading screen is handled by index.html and hideInitialLoading()
    if (typeof window.hideInitialLoading === 'function') {
        window.hideInitialLoading(); // Hide loading screen once JS is ready
    }
});
