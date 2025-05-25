// js/eventListeners.js

/**
 * @fileoverview Sets up all global and specific UI event listeners for the application.
 */

import { gameState, setUserInteracted, getCurrentLobbyId } from './state.js';
// Other modules (auth, socketHandlers, ui, game, sound, api) will be accessed via the 'dependencies' object.

/**
 * Sets up all event listeners for the application.
 * This function is called once the DOM is ready and dependencies are available.
 * @param {Object} dependencies - An object containing references to all other modules and state.
 * Expected: { auth, socketHandlers, ui, game, sound, api, state, elements }
 */
export function setupAllEventListeners(dependencies) {
    const { auth, socketHandlers, ui, game, sound, api, state, elements } = dependencies;

    console.log('EventListeners: Setting up UI event listeners...');

    // --- Global Listeners ---
    document.body.addEventListener('click', () => {
        if (!state.userHasInteracted) {
            setUserInteracted(true);
            console.log('EventListeners: User has interacted with the page.');
            // Attempt to play muted music or unlock audio context if needed
            // Example: sound.playBackgroundMusicIfNeeded();
        }
    }, { once: true });

    // --- Auth Section Listeners ---
    if (elements.emailLoginForm) {
        elements.emailLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = elements.loginEmailInput.value;
            const password = elements.loginPasswordInput.value;
            await auth.handleEmailLogin(email, password, dependencies);
        });
    }

    if (elements.guestBtn) {
        elements.guestBtn.addEventListener('click', () => {
            sound.playSound('click');
            if (elements.guestForm) elements.guestForm.classList.remove('hidden');
            if (elements.authOptionsDiv) elements.authOptionsDiv.classList.add('hidden');
        });
    }

    if (elements.guestContinueBtn) {
        elements.guestContinueBtn.addEventListener('click', () => {
            sound.playSound('click');
            const guestName = elements.guestNameInput ? elements.guestNameInput.value.trim() : '';
            auth.handleGuestLogin(guestName, dependencies);
        });
    }

    // --- Lobby Section Listeners ---
    if (elements.createLobbyBtn) {
        elements.createLobbyBtn.addEventListener('click', () => {
            sound.playSound('click');
            socketHandlers.emitCreateLobby();
        });
    }

    if (elements.joinLobbySubmitBtn) {
        elements.joinLobbySubmitBtn.addEventListener('click', () => {
            sound.playSound('click');
            const lobbyId = elements.joinLobbyIdInput ? elements.joinLobbyIdInput.value.trim().toUpperCase() : '';
            if (!lobbyId) {
                ui.showGlobalNotification('Bitte geben Sie eine Lobby ID ein.', 'warning');
                return;
            }
            socketHandlers.emitJoinLobby(lobbyId);
        });
    }

    if (elements.joinLobbyIdInput) {
        elements.joinLobbyIdInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    if (elements.logoutBtnLobby) { // Logout button in the lobby connection screen
        elements.logoutBtnLobby.addEventListener('click', async () => {
            sound.playSound('click');
            await auth.handleLogout(dependencies);
        });
    }

    // --- Waiting Room Listeners (Host Controls) ---
    // Note: These might need to be re-attached if waiting room UI is re-rendered dynamically.
    // ui.updateWaitingRoomUI should handle re-attaching if it clones/replaces nodes.
    // For simplicity, we assume they are stable or ui.updateWaitingRoomUI handles it.
    if (elements.copyLobbyIdBtn) {
        elements.copyLobbyIdBtn.addEventListener('click', async () => {
            sound.playSound('click');
            const lobbyId = getCurrentLobbyId();
            if (lobbyId) {
                try {
                    // navigator.clipboard.writeText might not work in all iframe contexts
                    // Using a fallback or a more robust solution might be needed.
                    const textArea = document.createElement("textarea");
                    textArea.value = lobbyId;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy'); // execCommand is deprecated but often works in iframes
                    document.body.removeChild(textArea);
                    ui.showGlobalNotification('Lobby ID kopiert!', 'success');
                } catch (error) {
                    console.error('EventListeners: Failed to copy lobby ID:', error);
                    ui.showGlobalNotification('Kopieren fehlgeschlagen. Manuell kopieren.', 'error');
                }
            }
        });
    }

    if (elements.categorySelect) {
        elements.categorySelect.addEventListener('change', () => {
            if (state.isHost) { // Make sure only host can trigger this
                sound.playSound('click');
                socketHandlers.emitSelectCategory(elements.categorySelect.value);
            }
            // Disable/enable start button based on selection
            if(elements.startGameBtn) {
                elements.startGameBtn.disabled = !elements.categorySelect.value || (state.players && Object.keys(state.players).length === 0);
                if (elements.startGameBtn.disabled) {
                    elements.startGameBtn.className = 'btn-lobby bg-gray-600 text-gray-400 cursor-not-allowed w-full';
                } else {
                    elements.startGameBtn.className = 'btn-lobby bg-green-600 hover:bg-green-700 focus:ring-green-500 transform hover:scale-105 transition-all duration-200 w-full';
                }
            }
        });
    }

    if (elements.startGameBtn) {
        elements.startGameBtn.addEventListener('click', () => {
            if (!state.isHost) return; // Double check
            sound.playSound('click');

            if (!elements.categorySelect || !elements.categorySelect.value) {
                if (elements.startGameError) elements.startGameError.textContent = 'Bitte wählen Sie eine Kategorie.';
                ui.showGlobalNotification('Bitte wählen Sie eine Kategorie aus.', 'warning');
                return;
            }
            if (elements.startGameError) elements.startGameError.textContent = '';

            socketHandlers.emitStartGame();

            // Disable button to prevent double-clicks, re-enable after a delay or server response
            elements.startGameBtn.disabled = true;
            elements.startGameBtn.textContent = 'Startet...';
            setTimeout(() => {
                if (elements.startGameBtn && gameState.currentScreen === 'waitingRoom') { // Only re-enable if still in waiting room
                    elements.startGameBtn.disabled = !elements.categorySelect.value; // Re-evaluate based on category
                    elements.startGameBtn.textContent = 'Spiel starten';
                }
            }, 3000);
        });
    }

    if (elements.leaveLobbyBtn) { // Button in the waiting room
        elements.leaveLobbyBtn.addEventListener('click', () => {
            sound.playSound('click');
            socketHandlers.emitLeaveLobby(); // Emits and clears local lobby state
            ui.showScreen('lobbyConnect'); // Transition UI
        });
    }

    // Note: Event listeners for buttons within dynamically generated HTML (like answer buttons,
    // leave game in question, final results buttons) are set up within the UI functions
    // that generate that HTML (e.g., ui.displayQuestion, ui.displayFinalResults).

    console.log('EventListeners: ✅ All UI event listeners set up.');
}


console.log('eventListeners.js loaded');
