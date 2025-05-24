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

    // --- Configure <body> (Don't modify <head> - it's already set up) ---
    const body = document.body;

    // Clear existing app container content only
    const existingContainer = document.getElementById('app-container');
    if (existingContainer) {
        existingContainer.innerHTML = '';
    } else {
        // Create app container if it doesn't exist
        const appContainer = createEl('div', { id: 'app-container' }, 'bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700');
        body.appendChild(appContainer);
    }

    const appContainer = document.getElementById('app-container');
    body.className = 'bg-slate-900 text-slate-100 font-sans flex flex-col items-center justify-center min-h-screen p-4';

    // --- Global Notification ---
    if (!document.getElementById('global-notification')) {
        const globalNotification = createEl('div', { id: 'global-notification' }, 'fixed top-5 right-5 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg hidden z-50', 'Notification message');
        body.appendChild(globalNotification);
    }

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
    window.hideInitialLoading = function() {
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');

        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        if (gameContainer) {
            gameContainer.classList.remove('hidden');
        }

        console.log('✅ Initial loading screen hidden');
    };
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
    hostControlsWaiting.appendChild(createEl('div', {}, 'text-sm text-slate-400 mb-4', '🎯 Game Format: 10 questions, 60 seconds each'));
    hostControlsWaiting.appendChild(createEl('button', { id: 'start-game-btn', disabled: '' }, 'btn btn-success w-full', '🚀 Start Game'));
    hostControlsWaiting.appendChild(createEl('p', { id: 'start-game-error' }, 'text-red-400 mt-2 text-sm'));
    waitingRoomScreen.appendChild(hostControlsWaiting);

    // Non-Host Info
    const nonHostInfoWaiting = createEl('div', { id: 'non-host-info-waiting' }, 'mb-6 hidden bg-slate-700 p-6 rounded-lg border border-slate-600 text-center');
    nonHostInfoWaiting.appendChild(createEl('p', {}, 'mb-2', '⏳ Waiting for host to select category and start the game...'));
    nonHostInfoWaiting.appendChild(createEl('p', {}, [], null, '📚 Selected Category: <strong id="selected-category-display" class="text-amber-400">N/A</strong>'));
    nonHostInfoWaiting.appendChild(createEl('div', {}, 'text-sm text-slate-400 mt-3', '🎯 Game Format: 10 questions, 60 seconds each'));
    waitingRoomScreen.appendChild(nonHostInfoWaiting);

    waitingRoomScreen.appendChild(createEl('h2', {}, 'text-xl mb-3 text-sky-300 font-semibold', null, '👥 Players in Lobby (<span id="player-count" class="text-lime-400">0</span>):'));
    waitingRoomScreen.appendChild(createEl('ul', { id: 'player-list-waiting' }, 'list-none bg-slate-700 p-4 rounded-lg h-40 overflow-y-auto border border-slate-600 space-y-2'));
    appContainer.appendChild(waitingRoomScreen);

    // --- Audio Elements (only add if they don't exist) ---
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
        if (!document.getElementById(audio.id)) {
            const attrs = { id: audio.id, src: audio.src, preload: 'auto' };
            if (audio.loop) attrs.loop = true;
            body.appendChild(createEl('audio', attrs));
        }
    });

    console.log('✅ HTML structure generated successfully');
}

// -----------------------------------------------------------------------------
// SECTION 2: Application Logic (Quiz Game)
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, starting application...');

    // 1. Generate the entire HTML structure for the page
    generateQuizPageHTMLContent();

    // 2. Validate Configuration from Server
    console.log('🔍 Checking for server configuration...');

    if (!window.GAME_CONFIG) {
        console.error('❌ CRITICAL: No configuration received from server!');
        document.body.innerHTML = `
            <div style="font-family: Arial; padding: 20px; background: #1f2937; color: white; text-align: center;">
                <h1>🚨 Configuration Error</h1>
                <p>The game configuration was not loaded from the server.</p>
                <p>This usually means:</p>
                <ul style="text-align: left; max-width: 400px; margin: 20px auto;">
                    <li>The .env.game file is missing or incorrect</li>
                    <li>The server is not running properly</li>
                    <li>Required environment variables are not set</li>
                </ul>
                <button onclick="window.location.reload()" 
                        style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                    🔄 Retry
                </button>
            </div>
        `;
        return;
    }

    if (!window.GAME_CONFIG.firebaseConfig || !window.GAME_CONFIG.firebaseConfig.apiKey) {
        console.error('❌ CRITICAL: Firebase configuration incomplete!', window.GAME_CONFIG);
        document.body.innerHTML = `
            <div style="font-family: Arial; padding: 20px; background: #1f2937; color: white; text-align: center;">
                <h1>🚨 Firebase Configuration Error</h1>
                <p>Firebase configuration is missing required fields.</p>
                <p>Please check your .env.game file and ensure all FIREBASE_* variables are set.</p>
                <button onclick="window.location.reload()" 
                        style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                    🔄 Retry
                </button>
            </div>
        `;
        return;
    }

    // 3. Use Configuration from .env (via server injection)
    const firebaseConfig = window.GAME_CONFIG.firebaseConfig;
    const authAppUrl = window.GAME_CONFIG.authAppUrl;

    console.log('🎮 Starting Quiz Game with config from .env.game');
    console.log('📦 Firebase Project:', firebaseConfig.projectId);
    console.log('🔐 Auth Domain:', firebaseConfig.authDomain);
    console.log('🌐 Auth App URL:', authAppUrl);

    // Hide initial loading screen now that we have valid config
    const loadingScreen = document.getElementById('loading-screen');
    const gameContainer = document.getElementById('game-container');

    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('✅ Loading screen hidden');
    }
    if (gameContainer) {
        gameContainer.classList.remove('hidden');
        console.log('✅ Game container shown');
    } else {
        console.warn('⚠️ Game container not found, app container should be visible');
    }

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

    // --- Utility Functions ---
    const showScreen = (screenName) => {
        Object.values(screens).forEach(screen => {
            if(screen) screen.classList.add('hidden');
        });
        if (screens[screenName]) {
            screens[screenName].classList.remove('hidden');
        }
        if (connectErrorP && connectErrorP.textContent.trim()) {
            connectErrorP.classList.remove('hidden');
        }
    };

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

    const playSound = (soundName, loop = false) => {
        if (isMuted && soundName !== 'click') return;
        if (sounds[soundName]) {
            sounds[soundName].loop = loop;
            sounds[soundName].currentTime = 0;
            const playPromise = sounds[soundName].play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Sound play error (${soundName}):`, error.message);
                });
            }
            sounds[soundName].volume = soundName === 'click' ? 0.7 : 0.8;
        }
    };

    const updateMuteButton = () => {
        if (!muteToggleBtn) return;
        muteToggleBtn.textContent = isMuted ? '🔊 Unmute Sounds' : '🔇 Mute Sounds';
        Object.values(sounds).forEach(sound => { if (sound) sound.muted = isMuted; });
    };

    // --- Firebase Auth Setup ---
    function setupFirebaseAuth() {
        if (!firebaseAuth) return;

        console.log('🔐 Setting up Firebase authentication...');

        firebaseAuth.onAuthStateChanged(async user => {
            if (user) {
                currentUser = user;
                try {
                    idToken = await user.getIdToken(true);
                    console.log("✅ User signed in:", user.uid);
                    if(userEmailDisplay) userEmailDisplay.textContent = user.displayName || user.email;
                    currentPlayerId = user.uid;
                    currentPlayerName = user.displayName || user.email.split('@')[0];

                    if(authFormContainer) authFormContainer.classList.add('hidden');
                    if(authUserInfoDiv) authUserInfoDiv.classList.remove('hidden');
                    if(authErrorP) authErrorP.textContent = '';

                } catch (error) {
                    console.error("❌ Error getting ID token:", error);
                    if(authErrorP) authErrorP.textContent = "Session error. Please try logging in again.";
                }
            } else {
                console.log("👤 User signed out - guest mode");
                currentUser = null;
                idToken = null;
                currentPlayerId = `guest-${Date.now()}${Math.random().toString(36).substring(2,7)}`;

                if(authFormContainer) authFormContainer.classList.remove('hidden');
                if(authUserInfoDiv) authUserInfoDiv.classList.add('hidden');
                if(authErrorP) authErrorP.textContent = '';
            }
        });
    }

    // --- Socket Connection ---
    function initSocketConnection() {
        console.log('🔌 Initializing socket connection...');

        const socketOptions = {
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            path: '/socket.io/',
            auth: {}
        };

        if (idToken) {
            socketOptions.auth.token = idToken;
        } else {
            socketOptions.query = { playerName: currentPlayerName || `Guest-${Math.random().toString(36).substring(7)}` };
        }

        socket = io(window.location.origin, socketOptions);

        socket.on('connect', () => {
            console.log('✅ Socket connected');
            if(connectionStatusSpan) {
                connectionStatusSpan.textContent = 'Connected';
                connectionStatusSpan.classList.remove('text-red-500');
                connectionStatusSpan.classList.add('text-green-500');
            }
        });

        socket.on('disconnect', (reason) => {
            console.warn('🔌 Socket disconnected:', reason);
            if(connectionStatusSpan) {
                connectionStatusSpan.textContent = `Disconnected: ${reason}`;
                connectionStatusSpan.classList.remove('text-green-500');
                connectionStatusSpan.classList.add('text-red-500');
            }
        });

        socket.on('lobbyCreated', (data) => {
            currentLobbyId = data.lobbyId;
            isHost = true;
            if(lobbyIdDisplay) lobbyIdDisplay.textContent = currentLobbyId;
            showScreen('waitingRoom');
            showGlobalNotification(`Lobby ${currentLobbyId} created!`, 'success');
            playSound('join');
        });

        socket.on('joinedLobby', (data) => {
            currentLobbyId = data.lobbyId;
            isHost = (data.hostId === currentPlayerId);
            if(lobbyIdDisplay) lobbyIdDisplay.textContent = currentLobbyId;
            showScreen('waitingRoom');
            showGlobalNotification(`Joined lobby ${currentLobbyId}`, 'success');
            playSound('join');
        });

        console.log('✅ Socket connection initialized');
    }

    // *** EVENT LISTENERS FUNCTION (Line ~520) ***
    function setupEventListeners() {
        console.log('🔗 Setting up event listeners...');

        // Auth form listeners
        if(loginForm) loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await firebaseAuth.signInWithEmailAndPassword(loginEmailInput.value, loginPasswordInput.value);
                initSocketConnection();
            } catch (error) {
                if(authErrorP) authErrorP.textContent = error.message;
            }
        });

        if(registerForm) registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const userCredential = await firebaseAuth.createUserWithEmailAndPassword(registerEmailInput.value, registerPasswordInput.value);
                await userCredential.user.updateProfile({ displayName: registerDisplayNameInput.value });
                initSocketConnection();
            } catch (error) {
                if(authErrorP) authErrorP.textContent = error.message;
            }
        });

        if(logoutBtn) logoutBtn.addEventListener('click', async () => {
            try {
                await firebaseAuth.signOut();
                if(socket) socket.disconnect();
                showScreen('auth');
            } catch (error) {
                if(authErrorP) authErrorP.textContent = error.message;
            }
        });

        if(proceedToLobbyBtn) proceedToLobbyBtn.addEventListener('click', () => {
            showScreen('lobbyConnect');
            if(!socket || !socket.connected) {
                initSocketConnection();
            }
        });

        // Lobby event listeners
        if(createLobbyBtn) createLobbyBtn.addEventListener('click', () => {
            playSound('click');
            const nameToSend = currentUser ?
                (currentUser.displayName || currentUser.email.split('@')[0]) :
                (playerNameInput ? playerNameInput.value : '');
            if(socket) socket.emit('createLobby', { playerName: nameToSend });
        });

        if(joinLobbyBtn) joinLobbyBtn.addEventListener('click', () => {
            playSound('click');
            const lobbyId = lobbyIdInput ? lobbyIdInput.value.trim() : '';
            const nameToSend = currentUser ?
                (currentUser.displayName || currentUser.email.split('@')[0]) :
                (playerNameInput ? playerNameInput.value : '');
            if(socket) socket.emit('joinLobby', { lobbyId, playerName: nameToSend });
        });

        if(muteToggleBtn) muteToggleBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            localStorage.setItem('quizMuted', isMuted);
            updateMuteButton();
            playSound('click');
        });

        console.log('✅ Event listeners set up successfully');
    }

    // --- Application Initialization ---
    function initializeApp() {
        console.log('🎮 Initializing Quiz Game Application...');

        setupEventListeners();  // *** CALLS THE FUNCTION ABOVE ***
        setupFirebaseAuth();
        showScreen('auth');
        updateMuteButton();

        console.log('✅ Application initialized successfully');
    }

    // --- Firebase Initialization ---
    setTimeout(() => {
        if (typeof firebase !== 'undefined' &&
            typeof firebase.initializeApp === 'function' &&
            typeof firebase.auth === 'function' &&
            typeof firebase.firestore === 'function') {

            console.log('🔥 Initializing Firebase with config from .env.game...');

            if (!firebase.apps.length) {
                firebaseApp = firebase.initializeApp(firebaseConfig);
            } else {
                firebaseApp = firebase.app();
            }
            firebaseAuth = firebase.auth();
            firestoreDB = firebase.firestore();
            console.log('✅ Firebase initialized successfully');

            initializeApp();  // *** STARTS THE APP - CALLS setupEventListeners ***
        } else {
            console.error("❌ Firebase SDK not loaded properly");
            showGlobalNotification("Error: Firebase not ready. Please refresh.", "error", 10000);
        }
    }, 100);

    console.log('🎯 Main application script loaded successfully');
});