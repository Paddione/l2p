// main.js - For the Game Application Client-Side

function generateQuizPageHTMLContent() {
    function createEl(tag, attributes = {}, classes = [], textContent = null, innerHTML = null) {
        const el = document.createElement(tag);
        Object.keys(attributes).forEach(key => el.setAttribute(key, attributes[key]));
        if (classes && classes.length > 0) {
            (Array.isArray(classes) ? classes : classes.split(' ')).forEach(cls => { if(cls) el.classList.add(cls); });
        }
        if (textContent) el.textContent = textContent;
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    }
    const body = document.body;
    if (!document.getElementById('global-notification')) {
        const globalNotification = createEl('div', { id: 'global-notification' }, 'fixed top-5 right-5 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg hidden z-50', 'Notification message');
        body.appendChild(globalNotification);
    }
    const audioPath = 'assets/sounds/';
    const audioSources = [
        { id: 'sound-click', src: `${audioPath}click.mp3` }, { id: 'sound-correct', src: `${audioPath}correctanswer.mp3` },
        { id: 'sound-incorrect', src: `${audioPath}incorrectanswer.mp3` }, { id: 'sound-streak', src: `${audioPath}streak.mp3` },
        { id: 'sound-timeup', src: `${audioPath}timesup.mp3` }, { id: 'sound-join', src: `${audioPath}newquestion.mp3` },
        { id: 'sound-start', src: `${audioPath}newquestion.mp3` }, { id: 'music-menu', src: `${audioPath}menumusic.mp3`, loop: true },
    ];
    audioSources.forEach(audio => {
        if (!document.getElementById(audio.id)) {
            const attrs = { id: audio.id, src: audio.src, preload: 'auto' };
            if (audio.loop) attrs.loop = true;
            body.appendChild(createEl('audio', attrs));
        }
    });
    // console.log('✅ Game App: HTML dynamic parts (audio, notifications) generated/verified.'); // Reduced verbosity
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Game App: DOM loaded, starting application...');
    generateQuizPageHTMLContent();
    // console.log('🔍 Game App: Checking for server configuration (GAME_CONFIG)...'); // Reduced verbosity

    setTimeout(() => {
        if (!window.GAME_CONFIG || !window.GAME_CONFIG.firebaseConfig || !window.GAME_CONFIG.firebaseConfig.apiKey) {
            console.error('❌ Game App CRITICAL: GAME_CONFIG or Firebase config missing/incomplete.', window.GAME_CONFIG);
            const loadingScreen = document.getElementById('loading-screen');
            if(loadingScreen) loadingScreen.innerHTML = '<p style="color:red; text-align:center; padding-top: 20px;">Fehler: Spielkonfiguration konnte nicht geladen werden.</p>';
            const configStatusSpan = document.getElementById('config-status');
            if(configStatusSpan) configStatusSpan.textContent = 'Error: Config Missing';
            return;
        }
        const configStatusSpan = document.getElementById('config-status');
        if(configStatusSpan) configStatusSpan.textContent = 'Loaded';

        const firebaseConfig = window.GAME_CONFIG.firebaseConfig;
        console.log('🎮 Game App: Starting with Firebase Project:', firebaseConfig.projectId);

        let socket; let currentLobbyId = null; let currentPlayerId = null;
        let currentPlayerName = localStorage.getItem('quizPlayerName') || '';
        let isHost = false; let isMuted = localStorage.getItem('quizMuted') === 'true';
        let firebaseApp; let firebaseAuth; let currentUser = null; let idToken = null;
        let userHasInteracted = false;
        let availableCategories = [];

        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');
        const authSection = document.getElementById('auth-section');
        const emailLoginForm = document.getElementById('email-login-form');
        const loginEmailInput = document.getElementById('login-email-input');
        const loginPasswordInput = document.getElementById('login-password-input');
        const authErrorMessage = document.getElementById('auth-error-message');
        const guestBtn = document.getElementById('guest-btn');
        const guestForm = document.getElementById('guest-form');
        const guestNameInput = document.getElementById('guest-name');
        const guestContinueBtn = document.getElementById('guest-continue');
        const authOptionsDiv = document.getElementById('auth-options');
        const lobbySection = document.getElementById('lobby-section');
        const createLobbyBtn = document.getElementById('create-lobby-btn');
        const joinLobbyIdInput = document.getElementById('join-lobby-id-input');
        const joinLobbySubmitBtn = document.getElementById('join-lobby-submit-btn');
        const lobbyErrorMessage = document.getElementById('lobby-error-message');
        const gamePlaySection = document.getElementById('game-section');
        const gameSectionTitle = document.getElementById('game-section-title');
        const displayLobbyId = document.getElementById('display-lobby-id');
        const displayPlayerName = document.getElementById('display-player-name');
        const copyLobbyIdBtn = document.getElementById('copy-lobby-id-btn');
        const hostControlsDiv = document.getElementById('host-controls');
        const categorySelect = document.getElementById('category-select');
        const startGameBtn = document.getElementById('start-game-btn');
        const startGameError = document.getElementById('start-game-error');
        const nonHostInfoDiv = document.getElementById('non-host-info');
        const displaySelectedCategory = document.getElementById('display-selected-category');
        const playerCountSpan = document.getElementById('player-count');
        const playerListUl = document.getElementById('player-list');
        const leaveLobbyBtn = document.getElementById('leave-lobby-btn');
        const logoutBtnLobby = document.getElementById('logout-btn-lobby');
        const logoutBtnGame = document.getElementById('logout-btn-game');

        const connectionStatusSpan = document.getElementById('connection-status');
        const globalNotificationDiv = document.getElementById('global-notification');
        const sounds = Array.from(document.querySelectorAll('audio[id^="sound-"], audio[id^="music-"]'))
            .reduce((acc, el) => { acc[el.id.replace(/^(sound-|music-)/, '')] = el; return acc; }, {});
        Object.values(sounds).forEach(sound => { if(sound) sound.muted = isMuted; });

        const showScreen = (screenName) => {
            console.log(`Game App: Showing screen -> ${screenName}`);
            if(loadingScreen) loadingScreen.style.display = 'none';
            if(gameContainer) gameContainer.classList.remove('hidden');
            if (authSection) authSection.classList.add('hidden');
            if (lobbySection) lobbySection.classList.add('hidden');
            if (gamePlaySection) gamePlaySection.classList.add('hidden');

            let sectionToShow = null;
            if (screenName === 'auth') sectionToShow = authSection;
            else if (screenName === 'lobbyConnect') sectionToShow = lobbySection;
            else if (screenName === 'waitingRoom' || screenName === 'game') sectionToShow = gamePlaySection;

            if (sectionToShow) {
                sectionToShow.classList.remove('hidden');
                console.log(`Game App: Section for '${screenName}' is now visible.`);
                if(screenName === 'waitingRoom' && gameSectionTitle) gameSectionTitle.textContent = 'Warteraum';
                else if (screenName === 'game' && gameSectionTitle) gameSectionTitle.textContent = 'Quiz Spiel';
            } else {
                console.warn(`Game App: Screen '${screenName}' has no corresponding section or section not found. Defaulting to auth.`);
                if (authSection) authSection.classList.remove('hidden');
            }
        };

        const showGlobalNotification = (message, type = 'info', duration = 3000) => { /* ... */ };
        const playSound = (soundName, loop = false) => { /* ... */ };
        document.body.addEventListener('click', () => { /* ... */ }, { once: true });

        async function fetchCategories() { /* ... */ }
        function populateCategorySelect() { /* ... */ }

        function updateWaitingRoomUI(playersDataMap, hostIdFromServer) {
            if (!playerListUl || !playerCountSpan || !displayLobbyId || !displayPlayerName) {
                console.warn("Game App: Waiting room UI elements missing for update."); return;
            }
            console.log("Game App: Updating waiting room UI. Host:", hostIdFromServer, "Current Player:", currentPlayerId, "Lobby ID:", currentLobbyId);
            console.log("Players Data for UI:", playersDataMap);

            displayLobbyId.textContent = currentLobbyId || 'WARTET...';
            displayPlayerName.textContent = currentPlayerName || 'Unbekannt';

            playerListUl.innerHTML = '';
            const playerArray = Object.values(playersDataMap || {});
            playerCountSpan.textContent = playerArray.length;

            playerArray.forEach(player => {
                const li = document.createElement('li');
                li.className = `p-2 rounded-md text-sm ${player.id === currentPlayerId ? 'bg-sky-600 text-white font-semibold' : 'bg-gray-600'}`;
                let nameToDisplay = player.name || `Spieler ${player.id ? player.id.substring(0,5) : '?'}`;
                if (player.id === currentPlayerId) nameToDisplay += " (Du)";
                if (player.id === hostIdFromServer) nameToDisplay += " 👑 (Host)";
                if (player.disconnected) nameToDisplay += " (getrennt)";
                li.textContent = nameToDisplay;
                playerListUl.appendChild(li);
            });

            isHost = (String(currentPlayerId) === String(hostIdFromServer)); // Ensure type consistency for comparison
            console.log(`Game App: Is current player host? ${isHost} (Current: ${currentPlayerId}, HostFromServer: ${hostIdFromServer})`);
            if (hostControlsDiv) hostControlsDiv.classList.toggle('hidden', !isHost);
            if (nonHostInfoDiv) nonHostInfoDiv.classList.toggle('hidden', isHost);

            if (isHost) {
                if (availableCategories.length === 0) fetchCategories();
                if (startGameBtn) startGameBtn.disabled = !categorySelect.value || playerArray.length === 0;
            }
            console.log("Game App: Waiting Room UI update complete.");
        }

        function setupFirebaseAuth() { /* ... */ } // Assuming this is working for login

        function initSocketConnection() {
            if (socket && socket.connected) {
                if (idToken && socket.auth.token !== idToken) {
                    console.log("Game App Socket: Token changed, re-authenticating.");
                    socket.auth.token = idToken; socket.disconnect(); socket.connect();
                } else {
                    console.log("Game App Socket: Already connected.");
                }
                return;
            }
            console.log('🔌 Game App: Initializing socket connection...');
            if (connectionStatusSpan) connectionStatusSpan.textContent = 'Verbinde...';
            const socketOptions = { reconnectionAttempts: 5, reconnectionDelay: 3000, path: '/socket.io/', auth: {} };
            if (idToken) { socketOptions.auth.token = idToken; console.log("Socket with Firebase ID token."); }
            else {
                let guestNameForSocket = currentPlayerName || `Gast-${Math.random().toString(36).substring(2,7)}`;
                if (!currentPlayerName && guestNameInput && guestNameInput.value) { // Ensure guest name is used if available
                    guestNameForSocket = guestNameInput.value.trim();
                }
                socketOptions.query = { playerName: guestNameForSocket }; console.log("Socket as guest:", guestNameForSocket);
            }
            if (typeof io === 'undefined') { console.error('Socket.IO client (io) not found.'); return; }
            socket = io(window.location.origin, socketOptions);
            socket.on('connect', () => {
                console.log('✅ Game App Socket connected:', socket.id);
                if (connectionStatusSpan) { connectionStatusSpan.textContent = 'Verbunden'; connectionStatusSpan.className = 'text-green-500';}
            });
            socket.on('connect_error', (err) => { console.error('🔌 Socket connection error:', err.message); if (connectionStatusSpan) { connectionStatusSpan.textContent = 'Verbindungsfehler'; connectionStatusSpan.className = 'text-red-500';}});
            socket.on('disconnect', (reason) => { console.warn('🔌 Socket disconnected:', reason); if (connectionStatusSpan) { connectionStatusSpan.textContent = 'Getrennt'; connectionStatusSpan.className = 'text-yellow-500';}});

            socket.on('lobbyCreated', (data) => {
                console.log('LOBBY CREATED event received from server:', data);
                if (!data || !data.lobbyId || !data.hostId || !data.players) {
                    console.error("Game App: Invalid data received for lobbyCreated:", data);
                    showGlobalNotification("Fehler beim Erstellen der Lobby (ungültige Daten).", "error");
                    return;
                }
                currentLobbyId = data.lobbyId; isHost = true; currentPlayerId = data.hostId; // Server confirms host
                console.log(`Game App: Lobby ${currentLobbyId} created. You are host. Player ID: ${currentPlayerId}`);
                updateWaitingRoomUI(data.players, data.hostId);
                showScreen('waitingRoom');
                showGlobalNotification(`Lobby ${currentLobbyId} erstellt! ID teilen.`, 'success');
                playSound('join');
            });
            socket.on('joinedLobby', (data) => {
                console.log('JOINED LOBBY event received from server:', data);
                if (!data || !data.lobbyId || !data.yourPlayerId || !data.hostId || !data.players) {
                    console.error("Game App: Invalid data received for joinedLobby:", data);
                    showGlobalNotification("Fehler beim Beitreten zur Lobby (ungültige Daten).", "error");
                    return;
                }
                currentLobbyId = data.lobbyId; currentPlayerId = data.yourPlayerId; isHost = (String(data.hostId) === String(currentPlayerId));
                console.log(`Game App: Joined lobby ${currentLobbyId}. Your Player ID: ${currentPlayerId}. Is host? ${isHost}`);
                updateWaitingRoomUI(data.players, data.hostId);
                showScreen('waitingRoom');
                showGlobalNotification(`Lobby ${currentLobbyId} beigetreten.`, 'success');
                playSound('join');
            });
            socket.on('lobbyError', (data) => { /* ... */ });
            socket.on('playerListUpdate', (data) => { /* ... */ });
            socket.on('categorySelectedByHost', (data) => { /* ... */ });
            socket.on('gameStarted', (data) => { /* ... */ });
            console.log('✅ Game App: Socket client event listeners set up.');
        }

        function setupEventListeners() {
            console.log('🔗 Game App: Setting up UI event listeners...');
            if (emailLoginForm) { /* ... email login ... */ }
            if (guestBtn) { /* ... guest button ... */ }
            if (guestContinueBtn) { /* ... guest continue ... */ }

            if (createLobbyBtn) {
                createLobbyBtn.addEventListener('click', () => {
                    playSound('click');
                    console.log("Game App: 'Create Lobby' button clicked.");
                    if (!socket || !socket.connected) {
                        showGlobalNotification("Nicht mit Server verbunden. Versuche Verbindung...", "error");
                        console.warn("Game App: Create lobby - socket not connected. Attempting init/reconnect.");
                        initSocketConnection(); // Try to connect
                        // Optionally, disable button and re-enable on connect, or show loading
                        return;
                    }
                    let nameToEmit = currentPlayerName;
                    if (!nameToEmit && guestNameInput && guestNameInput.value.trim()) { // If Firebase name is empty but guest name was entered
                        nameToEmit = guestNameInput.value.trim();
                    }
                    if (!nameToEmit) { // Fallback if still no name
                        nameToEmit = `Spieler-${Math.random().toString(36).substring(2, 7)}`;
                        console.warn("Game App: No current player name found for createLobby, generating temporary:", nameToEmit);
                    }
                    console.log(`Game App: Emitting 'createLobby'. Player Name: '${nameToEmit}', Socket ID: ${socket.id}, Connected: ${socket.connected}`);
                    socket.emit('createLobby', { playerName: nameToEmit });
                    if(lobbyErrorMessage) lobbyErrorMessage.textContent = '';
                });
            }
            if (joinLobbySubmitBtn) { /* ... join lobby ... */ }
            if (copyLobbyIdBtn) { /* ... */ }
            if (categorySelect) { /* ... */ }
            if (startGameBtn) { /* ... */ }
            if (leaveLobbyBtn) { /* ... */ }
            const handleLogout = async () => { /* ... */ };
            if(logoutBtnLobby) logoutBtnLobby.addEventListener('click', handleLogout);
            if(logoutBtnGame) logoutBtnGame.addEventListener('click', handleLogout);
            // console.log('✅ Game App: UI Event listeners set up.'); // Reduced verbosity
        }

        function initializeApp() {
            console.log('🎮 Game App: Initializing App Core Logic...');
            setupEventListeners();
            setupFirebaseAuth();
            if (guestNameInput && localStorage.getItem('quizPlayerName')) {
                guestNameInput.value = localStorage.getItem('quizPlayerName');
                currentPlayerName = localStorage.getItem('quizPlayerName');
            }
            // Initial screen is now determined by onAuthStateChanged
            console.log('✅ Game App: Core logic initialized. Waiting for auth state...');
        }

        console.log('🔥 Game App: Checking Firebase SDK availability...');
        if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function' && typeof firebase.auth === 'function') {
            console.log('✅ Game App: Firebase SDK global object found.');
            try {
                if (!firebase.apps.length) { firebaseApp = firebase.initializeApp(firebaseConfig); console.log('🔥 Game App: Firebase App initialized.'); }
                else { firebaseApp = firebase.app(); console.log('🔥 Game App: Firebase App already initialized.'); }
                initializeApp();
            } catch (e) { console.error("❌ Game App: Error initializing Firebase:", e); /* ... */ }
        } else { console.error("❌ Game App: Firebase SDK not loaded."); /* ... */ }
    }, 150);
    // console.log('🎯 Game App: main.js loaded.'); // Reduced verbosity
});
