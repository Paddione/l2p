// js/ui.js

/**
 * @fileoverview Manages all UI updates, DOM manipulations, and screen transitions.
 */

import {
    gameState,
    setCurrentScreen,
    getIsHost,
    getCurrentPlayerId,
    getCurrentLobbyId,
    getCurrentPlayerName,
    getAvailableCategories,
    getSelectedAnswer,
    setSelectedAnswer,
    clearQuestionTimer
} from './state.js';
import { createEl } from './utils.js';

export const domElements = {};

/**
 * Initializes DOM element references and stores them in `domElements` and `gameState.elements`.
 * Also creates dynamic HTML content like audio tags.
 */
export function initUI() {
    console.log('UI: Initializing UI...');

    try {
        // Select all necessary DOM elements from your HTML
        selectDOMElements();

        // Dynamically create global notification and audio elements
        generateDynamicHTMLContent();

        // Store references in gameState as well
        gameState.elements = domElements;

        console.log('UI: ✅ UI Initialized, DOM elements selected');
    } catch (error) {
        console.error('UI: ❌ Error during UI initialization:', error);
        throw error; // Re-throw to let main.js handle it
    }
}

/**
 * Selects all DOM elements and stores them in domElements
 */
function selectDOMElements() {
    // Loading and main container
    domElements.loadingScreen = document.getElementById('loading-screen');
    domElements.gameContainer = document.getElementById('game-container');

    // Auth section elements
    domElements.authSection = document.getElementById('auth-section');
    domElements.emailLoginForm = document.getElementById('email-login-form');
    domElements.loginEmailInput = document.getElementById('login-email-input');
    domElements.loginPasswordInput = document.getElementById('login-password-input');
    domElements.authErrorMessage = document.getElementById('auth-error-message');
    domElements.guestBtn = document.getElementById('guest-btn');
    domElements.guestForm = document.getElementById('guest-form');
    domElements.guestNameInput = document.getElementById('guest-name');
    domElements.guestContinueBtn = document.getElementById('guest-continue');
    domElements.authOptionsDiv = document.getElementById('auth-options');

    // Lobby section elements
    domElements.lobbySection = document.getElementById('lobby-section');
    domElements.createLobbyBtn = document.getElementById('create-lobby-btn');
    domElements.joinLobbyIdInput = document.getElementById('join-lobby-id-input');
    domElements.joinLobbySubmitBtn = document.getElementById('join-lobby-submit-btn');
    domElements.lobbyErrorMessage = document.getElementById('lobby-error-message');
    domElements.logoutBtnLobby = document.getElementById('logout-btn-lobby');

    // Game section elements
    domElements.gamePlaySection = document.getElementById('game-section');
    domElements.gameSectionTitle = document.getElementById('game-section-title');

    // Waiting room elements
    domElements.waitingRoomContainer = document.getElementById('waiting-room-container');
    domElements.displayLobbyId = document.getElementById('display-lobby-id');
    domElements.displayPlayerName = document.getElementById('display-player-name');
    domElements.copyLobbyIdBtn = document.getElementById('copy-lobby-id-btn');
    domElements.hostControlsDiv = document.getElementById('host-controls');
    domElements.categorySelect = document.getElementById('category-select');
    domElements.startGameBtn = document.getElementById('start-game-btn');
    domElements.startGameError = document.getElementById('start-game-error');
    domElements.nonHostInfoDiv = document.getElementById('non-host-info');
    domElements.displaySelectedCategory = document.getElementById('display-selected-category');
    domElements.playerCountSpan = document.getElementById('player-count');
    domElements.playerListUl = document.getElementById('player-list');
    domElements.leaveLobbyBtn = document.getElementById('leave-lobby-btn');

    // Status elements
    domElements.connectionStatusSpan = document.getElementById('connection-status');
    domElements.configStatusSpan = document.getElementById('config-status');
}

/**
 * Creates dynamic HTML content like the global notification div and audio elements.
 */
function generateDynamicHTMLContent() {
    const body = document.body;

    // Create global notification if it doesn't exist
    if (!document.getElementById('global-notification')) {
        domElements.globalNotificationDiv = createEl('div',
            { id: 'global-notification' },
            'fixed top-5 right-5 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg hidden z-50',
            'Notification message'
        );
        body.appendChild(domElements.globalNotificationDiv);
    } else {
        domElements.globalNotificationDiv = document.getElementById('global-notification');
    }

    // Create audio elements
    createAudioElements(body);
}

/**
 * Creates audio elements for sound effects
 * @param {HTMLElement} container - Container to append audio elements to
 */
function createAudioElements(container) {
    const audioPath = 'assets/sounds/';
    const audioSources = [
        { id: 'sound-click', name: 'click', src: `${audioPath}click.mp3` },
        { id: 'sound-correct', name: 'correct', src: `${audioPath}correctanswer.mp3` },
        { id: 'sound-incorrect', name: 'incorrect', src: `${audioPath}incorrectanswer.mp3` },
        { id: 'sound-streak', name: 'streak', src: `${audioPath}streak.mp3` },
        { id: 'sound-timeup', name: 'timeup', src: `${audioPath}timesup.mp3` },
        { id: 'sound-join', name: 'join', src: `${audioPath}newquestion.mp3` },
        { id: 'sound-start', name: 'start', src: `${audioPath}newquestion.mp3` },
        { id: 'music-menu', name: 'menuMusic', src: `${audioPath}menumusic.mp3`, loop: true },
    ];

    const soundElements = {};
    audioSources.forEach(audio => {
        if (!document.getElementById(audio.id)) {
            const attrs = { id: audio.id, src: audio.src, preload: 'auto' };
            if (audio.loop) attrs.loop = true;
            const audioElement = createEl('audio', attrs);
            container.appendChild(audioElement);
            soundElements[audio.name] = audioElement;
        } else {
            soundElements[audio.name] = document.getElementById(audio.id);
        }
    });

    // Initialize sounds using the sound module
    if (gameState.dependencies?.sound?.initSounds) {
        gameState.dependencies.sound.initSounds(soundElements);
    } else {
        console.warn('UI: Sound module not available during audio element creation');
        // Store for later initialization
        gameState.pendingSoundElements = soundElements;
    }
}

/**
 * Shows a specific screen and hides others.
 * @param {string} screenName - The name of the screen to show
 */
export function showScreen(screenName) {
    console.log(`UI: Showing screen -> ${screenName}`);
    setCurrentScreen(screenName);

    // Hide all major sections first
    if (domElements.loadingScreen) domElements.loadingScreen.style.display = 'none';
    if (domElements.gameContainer) domElements.gameContainer.classList.remove('hidden');

    // Hide all sections
    const sectionsToHide = [
        domElements.authSection,
        domElements.lobbySection,
        domElements.gamePlaySection,
        domElements.waitingRoomContainer
    ];

    sectionsToHide.forEach(section => {
        if (section) section.classList.add('hidden');
    });

    let sectionToShow = null;
    let title = 'Quiz Spiel';

    switch (screenName) {
        case 'auth':
            console.log('UI: Case: auth screen');
            sectionToShow = domElements.authSection;
            resetAuthForm();
            break;
        case 'lobbyConnect':
            console.log('UI: Case: lobbyConnect screen');
            sectionToShow = domElements.lobbySection;
            title = 'Lobby Verbindung';
            clearLobbyErrors();
            // Ensure lobby input is cleared
            if (domElements.joinLobbyIdInput) {
                domElements.joinLobbyIdInput.value = '';
            }
            // Optionally clear any previous lobby state display
            if (domElements.displayLobbyId) {
                 domElements.displayLobbyId.textContent = '';
            }
            if (domElements.playerListUl) {
                domElements.playerListUl.innerHTML = '';
            }
            if (domElements.playerCountSpan) {
                 domElements.playerCountSpan.textContent = '0';
            }
            if (domElements.displaySelectedCategory) {
                 domElements.displaySelectedCategory.textContent = 'N/A';
            }
            if (domElements.startGameBtn) {
                domElements.startGameBtn.disabled = true;
            }
            if (domElements.hostControlsDiv) {
                domElements.hostControlsDiv.classList.add('hidden');
            }
            if (domElements.nonHostInfoDiv) {
                 domElements.nonHostInfoDiv.classList.remove('hidden');
            }
            if (domElements.startGameError) {
                domElements.startGameError.textContent = '';
            }
            break;
        case 'waitingRoom':
            console.log('UI: Case: waitingRoom screen');
            sectionToShow = domElements.gamePlaySection;
            if (domElements.waitingRoomContainer) {
                domElements.waitingRoomContainer.classList.remove('hidden');
            }
            clearGamePlayArea();
            renderWaitingRoom(); // This populates the waiting room UI based on gameState
            title = 'Warteraum';
            break;
        case 'game':
            console.log('UI: Case: game screen');
            sectionToShow = domElements.gamePlaySection;
            if (domElements.waitingRoomContainer) {
                domElements.waitingRoomContainer.classList.add('hidden');
            }
            title = 'Quiz Spiel';
            break;
        case 'loading':
            console.log('UI: Case: loading screen');
            if (domElements.loadingScreen) {
                domElements.loadingScreen.style.display = 'flex';
            }
            if (domElements.gameContainer) {
                domElements.gameContainer.classList.add('hidden');
            }
            return; // Exit early for loading screen
        default:
            console.warn(`UI: Screen '${screenName}' not recognized. Defaulting to auth.`);
            sectionToShow = domElements.authSection;
            resetAuthForm();
            break;
    }

    if (sectionToShow) {
        sectionToShow.classList.remove('hidden');
        console.log(`UI: Section for '${screenName}' is now visible.`);
    } else {
         console.error(`UI: No section found to show for screen: ${screenName}`);
    }

    if (domElements.gameSectionTitle) {
        domElements.gameSectionTitle.textContent = title;
    }
}

/**
 * Resets the authentication form to default state
 */
function resetAuthForm() {
    if (domElements.emailLoginForm) domElements.emailLoginForm.reset();
    if (domElements.guestNameInput) domElements.guestNameInput.value = '';
    if (domElements.guestForm) domElements.guestForm.classList.add('hidden');
    if (domElements.authOptionsDiv) domElements.authOptionsDiv.classList.remove('hidden');
    if (domElements.authErrorMessage) domElements.authErrorMessage.textContent = '';
}

/**
 * Clears lobby-related error messages
 */
function clearLobbyErrors() {
    if (domElements.lobbyErrorMessage) domElements.lobbyErrorMessage.textContent = '';
}

/**
 * Displays a global notification message.
 * @param {string} message - The message to display.
 * @param {string} [type='info'] - Type of notification
 * @param {number} [duration=3000] - How long the notification stays visible
 */
export function showGlobalNotification(message, type = 'info', duration = 3000) {
    if (!domElements.globalNotificationDiv) {
        console.warn('UI: Global notification div not found.');
        return;
    }

    domElements.globalNotificationDiv.textContent = message;

    const typeClasses = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    const bgClass = typeClasses[type] || typeClasses.info;
    domElements.globalNotificationDiv.className =
        `fixed top-5 right-5 px-4 py-2 rounded-md shadow-lg z-50 text-white ${bgClass}`;

    domElements.globalNotificationDiv.classList.remove('hidden');

    setTimeout(() => {
        if (domElements.globalNotificationDiv) {
            domElements.globalNotificationDiv.classList.add('hidden');
        }
    }, duration);
}

/**
 * Populates the category select dropdown.
 * @param {string[]} categories - Array of category names
 */
export function populateCategorySelect(categories = getAvailableCategories()) {
    if (!domElements.categorySelect) {
        console.warn('UI: Category select element not found for populating.');
        return;
    }

    console.log('UI: Populating category select with:', categories);
    domElements.categorySelect.innerHTML = '<option value="">-- Kategorie wählen --</option>';

    categories.forEach(cat => {
        const option = createEl('option', { value: cat }, [], cat);
        domElements.categorySelect.appendChild(option);
    });

    console.log('UI: Category select populated with', categories.length, 'categories.');
    updateStartGameButtonState();
}

/**
 * Updates the start game button state based on current conditions
 */
function updateStartGameButtonState() {
    if (!domElements.startGameBtn || !domElements.categorySelect) return;

    const hasCategory = domElements.categorySelect.value;
    const hasPlayers = gameState.players && Object.keys(gameState.players).length > 0;

    domElements.startGameBtn.disabled = !hasCategory || !hasPlayers;

    if (domElements.startGameBtn.disabled) {
        domElements.startGameBtn.className = 'btn-lobby bg-gray-600 text-gray-400 cursor-not-allowed w-full';
    } else {
        domElements.startGameBtn.className = 'btn-lobby bg-green-600 hover:bg-green-700 focus:ring-green-500 transform hover:scale-105 transition-all duration-200 w-full';
    }
}

/**
 * Renders the initial structure for the waiting room.
 */
function renderWaitingRoom() {
    if (!domElements.waitingRoomContainer || !domElements.gamePlaySection) return;

    domElements.gamePlaySection.classList.remove('hidden');
    domElements.waitingRoomContainer.classList.remove('hidden');

    updateWaitingRoomUI(gameState.players || {}, getCurrentPlayerId());
}

/**
 * Updates the waiting room UI with player list, host controls, etc.
 * @param {Object} playersDataMap - Map of player objects from the server
 * @param {string} hostIdFromServer - The ID of the current host
 */
export function updateWaitingRoomUI(playersDataMap, hostIdFromServer) {
    const requiredElements = [
        domElements.playerListUl,
        domElements.playerCountSpan,
        domElements.displayLobbyId,
        domElements.displayPlayerName
    ];

    if (requiredElements.some(el => !el)) {
        console.warn("UI: Required waiting room elements missing for update.");
        return;
    }

    console.log("UI: Updating waiting room. Host:", hostIdFromServer, "Current Player:", getCurrentPlayerId());

    // Update lobby and player info
    domElements.displayLobbyId.textContent = getCurrentLobbyId() || 'WARTET...';
    domElements.displayPlayerName.textContent = getCurrentPlayerName() || 'Unbekannt';

    // Update player list
    updatePlayerList(playersDataMap);

    // Update host controls
    updateHostControls(hostIdFromServer, Object.values(playersDataMap || {}));

    console.log("UI: Waiting Room UI update complete.");
}

/**
 * Updates the player list in the waiting room
 * @param {Object} playersDataMap - Map of player objects
 */
function updatePlayerList(playersDataMap) {
    domElements.playerListUl.innerHTML = '';
    const playerArray = Object.values(playersDataMap || {});
    domElements.playerCountSpan.textContent = playerArray.length;

    playerArray.forEach(player => {
        const isCurrentPlayer = player.id === getCurrentPlayerId();
        const li = createEl('li', {},
            `p-2 rounded-md text-sm ${isCurrentPlayer ? 'bg-sky-600 text-white font-semibold' : 'bg-gray-600'}`
        );

        let nameToDisplay = player.name || `Spieler ${player.id ? player.id.substring(0, 5) : '?'}`;
        if (isCurrentPlayer) nameToDisplay += " (Du)";
        if (player.id === gameState.currentLobbyId) nameToDisplay += " 👑 (Host)";
        if (player.disconnected) nameToDisplay += " (getrennt)";

        li.textContent = nameToDisplay;
        domElements.playerListUl.appendChild(li);
    });
}

/**
 * Updates host controls visibility and state
 * @param {string} hostIdFromServer - ID of the host
 * @param {Array} playerArray - Array of players
 */
function updateHostControls(hostIdFromServer, playerArray) {
    const isCurrentlyHost = getIsHost();

    if (domElements.hostControlsDiv) {
        domElements.hostControlsDiv.classList.toggle('hidden', !isCurrentlyHost);
    }
    if (domElements.nonHostInfoDiv) {
        domElements.nonHostInfoDiv.classList.toggle('hidden', isCurrentlyHost);
    }

    if (isCurrentlyHost) {
        // Fetch categories if needed
        if (getAvailableCategories().length === 0 && gameState.dependencies?.api?.fetchCategories) {
            gameState.dependencies.api.fetchCategories();
        } else {
            populateCategorySelect();
        }
        updateStartGameButtonState();
    }
}

/**
 * Displays a question to the user.
 * @param {Object} questionData - The question object from the server
 * @param {Function} submitAnswerCallback - Callback to handle answer submission
 * @param {Function} leaveGameCallback - Callback for leaving the game
 * @param {Function} startTimerCallback - Callback to start the question timer
 */
export function displayQuestion(questionData, submitAnswerCallback, leaveGameCallback, startTimerCallback) {
    if (!domElements.gamePlaySection) return;

    clearGamePlayArea();

    const questionHtml = generateQuestionHTML(questionData);
    domElements.gamePlaySection.innerHTML = questionHtml;

    // Set up answer button event listeners
    setupAnswerButtons(submitAnswerCallback);

    // Set up leave game button
    setupLeaveGameButton(leaveGameCallback);

    // Start countdown timer
    if (startTimerCallback) {
        startTimerCallback(questionData.timeLimit, updateTimerDisplay);
    }

    console.log('UI: Question displayed -', questionData.text);
}

/**
 * Generates HTML for a question
 * @param {Object} questionData - Question data
 * @returns {string} HTML string
 */
function generateQuestionHTML(questionData) {
    return `
        <div class="modern-card p-6 md:p-8">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">Quiz Spiel</h2>
                <div class="text-right">
                    <div class="text-sm text-gray-400">Frage ${questionData.questionNumber} von ${questionData.totalQuestions}</div>
                    <div id="timer-display" class="text-3xl font-bold text-yellow-400 font-mono bg-gray-800 px-4 py-2 rounded-lg border border-yellow-400/30">${questionData.timeLimit}</div>
                </div>
            </div>
            <div class="mb-6 modern-card p-6">
                <h3 class="text-xl font-semibold text-white mb-4">${questionData.text}</h3>
                <div id="answer-options" class="space-y-3">
                    ${questionData.options.map((option, index) => `
                        <button class="answer-option-btn w-full p-4 text-left bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 border border-gray-600 rounded-xl transition-all duration-300 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transform hover:scale-102 active:scale-98" data-answer="${option}">
                            <span class="inline-block w-8 h-8 bg-sky-600 text-white rounded-full text-center leading-8 mr-3 font-bold">${String.fromCharCode(65 + index)}</span>
                            ${option}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="modern-card p-6">
                    <h4 class="font-semibold text-sky-300 mb-4 flex items-center">
                        <span class="w-2 h-2 bg-sky-400 rounded-full mr-2"></span>Dein Fortschritt
                    </h4>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                            <span class="text-gray-300">Aktuelle Punkte:</span>
                            <span id="current-score" class="text-lime-400 font-bold text-lg">0</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                            <span class="text-gray-300">Ausgewählte Antwort:</span>
                            <span id="selected-answer-display" class="text-yellow-400 font-medium">Keine</span>
                        </div>
                    </div>
                </div>
                <div class="modern-card p-6">
                    <h4 class="font-semibold text-sky-300 mb-4 flex items-center">
                        <span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>Live Rangliste
                    </h4>
                    <div id="live-scores-list" class="space-y-2 max-h-32 overflow-y-auto">
                        <div class="text-gray-400 text-center py-4">Wird geladen...</div>
                    </div>
                </div>
            </div>
            <button id="leave-game-btn-q" class="mt-6 btn-lobby bg-red-600 hover:bg-red-700 focus:ring-red-500">
                🚪 Spiel verlassen
            </button>
        </div>
    `;
}

/**
 * Sets up event listeners for answer buttons
 * @param {Function} submitAnswerCallback - Callback for answer submission
 */
function setupAnswerButtons(submitAnswerCallback) {
    const answerButtons = domElements.gamePlaySection.querySelectorAll('.answer-option-btn');
    answerButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (getSelectedAnswer() !== null) return; // Already answered

            const answer = button.dataset.answer;
            setSelectedAnswer(answer);

            // Disable all buttons and mark selected
            answerButtons.forEach(btn => btn.classList.add('disabled'));
            button.classList.remove('disabled');
            button.classList.add('selected');

            // Update display
            const selectedDisplay = document.getElementById('selected-answer-display');
            if (selectedDisplay) selectedDisplay.textContent = answer;

            submitAnswerCallback(answer);

            if (gameState.dependencies?.sound?.playSound) {
                gameState.dependencies.sound.playSound('click');
            }
        });
    });
}

/**
 * Sets up the leave game button
 * @param {Function} leaveGameCallback - Callback for leaving the game
 */
function setupLeaveGameButton(leaveGameCallback) {
    const leaveGameBtn = document.getElementById('leave-game-btn-q');
    if (leaveGameBtn) {
        leaveGameBtn.addEventListener('click', leaveGameCallback);
    }
}

/**
 * Updates the timer display during a question.
 * @param {number} timeLeft - The time remaining
 * @param {string} timerClass - CSS class for timer
 */
export function updateTimerDisplay(timeLeft, timerClass = 'text-3xl font-bold text-yellow-400 font-mono bg-gray-800 px-4 py-2 rounded-lg border border-yellow-400/30') {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        timerDisplay.textContent = timeLeft;
        timerDisplay.className = timerClass;
    }
}

/**
 * Updates the UI to show feedback on an answer.
 * @param {Object} feedbackData - Data containing correctness, correct answer, score
 * @param {string} currentSelectedAnswer - The answer selected by the player
 */
export function showAnswerFeedbackUI(feedbackData, currentSelectedAnswer) {
    console.log('UI: Showing answer feedback', feedbackData);

    // Update score display
    const currentScoreDisplay = document.getElementById('current-score');
    if (currentScoreDisplay) {
        currentScoreDisplay.textContent = feedbackData.totalScore;
    }

    // Update answer buttons with feedback
    const answerButtons = domElements.gamePlaySection.querySelectorAll('.answer-option-btn');
    answerButtons.forEach(button => {
        const buttonAnswer = button.dataset.answer;
        button.classList.add('disabled');

        if (buttonAnswer === feedbackData.correctAnswer) {
            button.classList.add('correct');
            button.classList.remove('selected', 'incorrect');
        } else if (buttonAnswer === currentSelectedAnswer && !feedbackData.isCorrect) {
            button.classList.add('incorrect');
            button.classList.remove('selected');
        }
    });

    // Play sound and show notification
    if (gameState.dependencies?.sound?.playSound) {
        if (feedbackData.isCorrect) {
            gameState.dependencies.sound.playSound('correct');
            showGlobalNotification(`Richtig! +${feedbackData.pointsEarned} Punkte`, 'success', 2000);
        } else {
            gameState.dependencies.sound.playSound('incorrect');
            showGlobalNotification(`Falsch! Richtige Antwort: ${feedbackData.correctAnswer}`, 'error', 3000);
        }
    }
}

/**
 * Displays the results after a question has ended.
 * @param {Object} resultsData - Data about the question, answers, and scores
 */
export function displayQuestionResults(resultsData) {
    if (!domElements.gamePlaySection) return;
    clearQuestionTimer();

    const resultsHtml = generateQuestionResultsHTML(resultsData);
    domElements.gamePlaySection.innerHTML = resultsHtml;
    console.log('UI: Question results displayed.');
}

/**
 * Generates HTML for question results
 * @param {Object} resultsData - Results data
 * @returns {string} HTML string
 */
function generateQuestionResultsHTML(resultsData) {
    const playerAnswersHTML = Object.values(resultsData.playerAnswers || {})
        .map(player => `
            <div class="flex justify-between items-center">
                <span class="${player.isCorrect ? 'text-green-400' : 'text-red-400'}">${player.name}</span>
                <span class="text-gray-300">
                    ${player.answer || 'Keine Antwort'} 
                    ${player.isCorrect ? '✓' : '✗'}
                    (+${player.pointsEarned})
                </span>
            </div>
        `).join('');

    const scoresHTML = Object.values(resultsData.playerAnswers || {})
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((player, index) => `
            <div class="flex justify-between items-center">
                <span class="text-gray-300">${index + 1}. ${player.name}</span>
                <span class="text-lime-400 font-bold">${player.totalScore}</span>
            </div>
        `).join('');

    return `
        <div class="bg-gray-800 rounded-lg shadow-xl p-6 md:p-8">
            <h2 class="text-2xl font-bold text-sky-400 mb-4">Frage ${resultsData.questionNumber} - Ergebnisse</h2>
            <div class="bg-gray-700 p-4 rounded-lg mb-4">
                <div class="text-lg font-semibold text-white mb-2">${resultsData.question}</div>
                <div class="text-green-400 font-bold">Richtige Antwort: ${resultsData.correctAnswer}</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-700 p-4 rounded-lg">
                    <h4 class="font-semibold text-sky-300 mb-2">Spieler Antworten</h4>
                    <div class="space-y-2 text-sm max-h-40 overflow-y-auto">
                        ${playerAnswersHTML}
                    </div>
                </div>
                <div class="bg-gray-700 p-4 rounded-lg">
                    <h4 class="font-semibold text-sky-300 mb-2">Aktuelle Rangliste</h4>
                    <div id="question-results-scores" class="text-sm space-y-1 max-h-40 overflow-y-auto">
                        ${scoresHTML}
                    </div>
                </div>
            </div>
            <div class="text-center mt-6 text-gray-400">Nächste Frage in wenigen Sekunden...</div>
        </div>
    `;
}

/**
 * Updates the live scores display during a question.
 * @param {Array} scores - Array of player score objects
 */
export function updateLiveScores(scores) {
    const liveScoresList = document.getElementById('live-scores-list');
    if (!liveScoresList) return;

    liveScoresList.innerHTML = scores.map((player, index) => `
        <div class="flex justify-between items-center py-1 ${player.playerId === getCurrentPlayerId() ? 'text-lime-400 font-bold' : 'text-gray-300'}">
            <span>${index + 1}. ${player.name} ${player.hasAnswered ? '✓' : ''}</span>
            <span>${player.score}</span>
        </div>
    `).join('');
}

/**
 * Displays the final game results.
 * @param {Object} finalData - Data about the game outcome, player rankings, stats
 * @param {Function} playAgainCallback - Callback for playing again
 * @param {Function} newLobbyCallback - Callback for creating new lobby
 * @param {Function} logoutCallback - Callback for logout
 */
export function displayFinalResults(finalData, playAgainCallback, newLobbyCallback, logoutCallback) {
    if (!domElements.gamePlaySection) return;
    clearGamePlayArea();

    const yourResult = finalData.players.find(p => p.playerId === getCurrentPlayerId());
    const finalResultsHTML = generateFinalResultsHTML(finalData, yourResult);

    domElements.gamePlaySection.innerHTML = finalResultsHTML;

    // Add event listeners for final buttons
    setupFinalResultsButtons(playAgainCallback, newLobbyCallback, logoutCallback);

    // Play appropriate sound based on ranking
    playResultSound(yourResult);

    console.log('UI: Final results displayed.');
}

/**
 * Generates HTML for final results
 * @param {Object} finalData - Final game data
 * @param {Object} yourResult - Current player's result
 * @returns {string} HTML string
 */
function generateFinalResultsHTML(finalData, yourResult) {
    const yourStatsHTML = generatePlayerStatsHTML(yourResult, finalData.players.length);
    const playersHTML = generatePlayersRankingHTML(finalData.players);
    const gameInfoHTML = generateGameInfoHTML(finalData);

    return `
        <div class="bg-gray-800 rounded-lg shadow-xl p-6 md:p-8">
            <div class="text-center mb-6">
                <h2 class="text-3xl font-bold text-sky-400 mb-2">🏁 Spiel Beendet!</h2>
                <div class="text-lg text-gray-300">
                    Kategorie: <span class="text-yellow-400">${finalData.category}</span> | ${finalData.totalQuestions} Fragen
                </div>
            </div>
            <div class="bg-gray-700 p-6 rounded-lg mb-6">
                <h3 class="text-2xl font-bold text-sky-300 mb-4 text-center">🏆 Endergebnis</h3>
                <div class="space-y-3 max-h-60 overflow-y-auto">
                    ${playersHTML}
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="bg-gray-700 p-4 rounded-lg">
                    <h4 class="font-semibold text-sky-300 mb-2">🎯 Deine Statistiken</h4>
                    ${yourStatsHTML}
                </div>
                <div class="bg-gray-700 p-4 rounded-lg">
                    <h4 class="font-semibold text-sky-300 mb-2">📊 Spiel Info</h4>
                    ${gameInfoHTML}
                </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button id="play-again-btn-final" class="btn-primary flex-1 sm:flex-none px-6 py-3 font-semibold">🎮 Nochmal spielen</button>
                <button id="new-lobby-btn-final" class="btn-secondary flex-1 sm:flex-none px-6 py-3 font-semibold">🏠 Neue Lobby</button>
                <button id="logout-btn-final" class="btn-danger flex-1 sm:flex-none px-6 py-3 font-semibold">🚪 Logout</button>
            </div>
        </div>
    `;
}

/**
 * Generates HTML for player statistics
 * @param {Object} yourResult - Player's result data
 * @param {number} totalPlayers - Total number of players
 * @returns {string} HTML string
 */
function generatePlayerStatsHTML(yourResult, totalPlayers) {
    if (!yourResult) {
        return '<div class="text-gray-400">Keine Daten verfügbar</div>';
    }

    const accuracy = yourResult.totalAnswers > 0
        ? Math.round((yourResult.correctAnswers / yourResult.totalAnswers) * 100)
        : 0;

    const accuracyClass = accuracy >= 80 ? 'text-green-400' :
        accuracy >= 60 ? 'text-yellow-400' : 'text-red-400';

    return `
        <div class="space-y-2 text-sm">
            <div class="flex justify-between">
                <span>Platz:</span>
                <span class="font-bold text-yellow-400">${yourResult.rank}/${totalPlayers}</span>
            </div>
            <div class="flex justify-between">
                <span>Punkte:</span>
                <span class="font-bold text-lime-400">${yourResult.score}</span>
            </div>
            <div class="flex justify-between">
                <span>Genauigkeit:</span>
                <span class="font-bold ${accuracyClass}">${accuracy}%</span>
            </div>
            <div class="flex justify-between">
                <span>Durchschnittszeit:</span>
                <span class="font-bold text-blue-400">${Math.round(yourResult.averageTime/1000)}s</span>
            </div>
        </div>
    `;
}

/**
 * Generates HTML for players ranking
 * @param {Array} players - Array of player results
 * @returns {string} HTML string
 */
function generatePlayersRankingHTML(players) {
    return players.map((player) => {
        const isCurrentPlayer = player.playerId === getCurrentPlayerId();
        const rankClass = player.rank === 1 ? 'bg-yellow-600/20 border border-yellow-400' :
            player.rank === 2 ? 'bg-gray-500/20 border border-gray-400' :
                player.rank === 3 ? 'bg-orange-600/20 border border-orange-400' :
                    'bg-gray-600/20';

        const rankEmoji = player.rank === 1 ? '🥇' :
            player.rank === 2 ? '🥈' :
                player.rank === 3 ? '🥉' : `${player.rank}.`;

        return `
            <div class="flex items-center justify-between p-3 rounded-lg ${rankClass}">
                <div class="flex items-center space-x-3">
                    <span class="text-2xl">${rankEmoji}</span>
                    <div>
                        <div class="font-semibold ${isCurrentPlayer ? 'text-lime-400' : 'text-white'}">
                            ${player.name} ${isCurrentPlayer ? '(Du)' : ''}
                        </div>
                        <div class="text-sm text-gray-400">
                            ${player.correctAnswers}/${player.totalAnswers} richtig | Ø ${Math.round(player.averageTime/1000)}s
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-yellow-400">${player.score}</div>
                    <div class="text-sm text-gray-400">Punkte</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Generates HTML for game information
 * @param {Object} finalData - Final game data
 * @returns {string} HTML string
 */
function generateGameInfoHTML(finalData) {
    const duration = Math.round((finalData.gameData?.duration || 0) / 60000);
    const highestScore = finalData.players[0]?.score || 0;
    const averageScore = Math.round(
        finalData.players.reduce((sum, p) => sum + p.score, 0) / (finalData.players.length || 1)
    );

    return `
        <div class="space-y-2 text-sm">
            <div class="flex justify-between">
                <span>Dauer:</span>
                <span class="text-gray-300">${duration} Min</span>
            </div>
            <div class="flex justify-between">
                <span>Spieler:</span>
                <span class="text-gray-300">${finalData.players.length}</span>
            </div>
            <div class="flex justify-between">
                <span>Höchstpunktzahl:</span>
                <span class="text-yellow-400 font-bold">${highestScore}</span>
            </div>
            <div class="flex justify-between">
                <span>Durchschnitt:</span>
                <span class="text-gray-300">${averageScore}</span>
            </div>
        </div>
    `;
}

/**
 * Sets up event listeners for final results buttons
 * @param {Function} playAgainCallback - Callback for playing again
 * @param {Function} newLobbyCallback - Callback for new lobby
 * @param {Function} logoutCallback - Callback for logout
 */
function setupFinalResultsButtons(playAgainCallback, newLobbyCallback, logoutCallback) {
    const playAgainBtn = document.getElementById('play-again-btn-final');
    const newLobbyBtn = document.getElementById('new-lobby-btn-final');
    const logoutBtn = document.getElementById('logout-btn-final');

    if (playAgainBtn) playAgainBtn.addEventListener('click', playAgainCallback);
    if (newLobbyBtn) newLobbyBtn.addEventListener('click', newLobbyCallback);
    if (logoutBtn) logoutBtn.addEventListener('click', logoutCallback);
}

/**
 * Plays appropriate sound based on player ranking
 * @param {Object} yourResult - Player's result
 */
function playResultSound(yourResult) {
    if (!gameState.dependencies?.sound?.playSound || !yourResult) return;

    if (yourResult.rank === 1) {
        gameState.dependencies.sound.playSound('streak');
    } else if (yourResult.rank <= 3) {
        gameState.dependencies.sound.playSound('correct');
    } else {
        gameState.dependencies.sound.playSound('click');
    }
}

/**
 * Clears the content of the main game play area.
 */
function clearGamePlayArea() {
    if (domElements.gamePlaySection) {
        domElements.gamePlaySection.innerHTML = '';
    }
    if (domElements.waitingRoomContainer) {
        domElements.waitingRoomContainer.innerHTML = '';
        domElements.waitingRoomContainer.classList.add('hidden');
    }
}

/**
 * Updates the connection status display.
 * @param {string} statusText - Text to display
 * @param {string} colorClass - Tailwind color class
 */
export function updateConnectionStatus(statusText, colorClass) {
    if (domElements.connectionStatusSpan) {
        domElements.connectionStatusSpan.textContent = statusText;
        domElements.connectionStatusSpan.className = `text-sm ${colorClass}`;
    }
}

/**
 * Updates the config status on the loading screen.
 * @param {string} statusText - Status text to display
 * @param {boolean} isError - Whether this is an error state
 */
export function updateConfigStatusDisplay(statusText, isError = false) {
    if (domElements.configStatusSpan) {
        domElements.configStatusSpan.textContent = statusText;
        domElements.configStatusSpan.className = isError ? 'text-red-500 font-bold' : 'text-green-500';
    }

    if (isError && domElements.loadingScreen) {
        // Add error message to loading screen
        const existingError = domElements.loadingScreen.querySelector('.error-message');
        if (!existingError) {
            const errorElement = createEl('p',
                { class: 'error-message' },
                'text-red-500 text-center pt-5',
                'Fehler: Spielkonfiguration konnte nicht geladen werden.'
            );
            domElements.loadingScreen.appendChild(errorElement);
        }
    }
}

console.log('ui.js loaded');