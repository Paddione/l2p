// js/auth.js

/**
 * @fileoverview Manages Firebase authentication, user login, logout, and state changes.
 */

import {
    gameState,
    setFirebaseInstances,
    setCurrentUser,
    clearCurrentUser,
    setPlayerName,
    clearLobbyDetails,
    resetGameState
} from './state.js';

/**
 * Initializes Firebase application.
 * @param {Object} firebaseConfig - The Firebase configuration object.
 * @param {Function} callback - Callback to execute after initialization, passing app and auth.
 */
export function initFirebase(firebaseConfig, callback) {
    console.log('Auth: Initializing Firebase with Project ID:', firebaseConfig.projectId);

    if (typeof firebase === 'undefined') {
        console.error('Auth: Firebase SDK not loaded');
        if (gameState.dependencies?.ui?.updateConfigStatusDisplay) {
            gameState.dependencies.ui.updateConfigStatusDisplay('Firebase SDK Fehler', true);
        }
        return;
    }

    try {
        let app;
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('Auth: Firebase App initialized.');
        } else {
            app = firebase.app();
            console.log('Auth: Firebase App already initialized.');
        }
        const auth = firebase.auth();
        setFirebaseInstances(app, auth);
        if (callback) callback(app, auth);
    } catch (e) {
        console.error("Auth: Error initializing Firebase:", e);
        if (gameState.dependencies?.ui?.updateConfigStatusDisplay) {
            gameState.dependencies.ui.updateConfigStatusDisplay('Firebase Init Fehler', true);
        }
        if (gameState.dependencies?.ui?.showScreen) {
            gameState.dependencies.ui.showScreen('auth');
        }
    }
}

/**
 * Sets up the Firebase authentication state change listener.
 * @param {Object} dependencies - Object containing references to other modules (ui, socketHandlers).
 */
export function setupAuthStateListener(dependencies) {
    const auth = gameState.firebaseAuth;
    if (!auth) {
        console.error('Auth: Firebase Auth not initialized. Cannot set up listener.');
        return;
    }

    console.log('Auth: Setting up Firebase auth state listener...');
    auth.onAuthStateChanged(async (user) => {
        console.log('Auth: Auth state changed. User:', user ? user.uid : 'null');

        if (user) {
            console.log('Auth: User is authenticated:', user.email || user.uid);
            try {
                const idToken = await user.getIdToken();
                setCurrentUser(user, idToken); // Updates name via state.js
                console.log('Auth: ID token obtained.');

                // Initialize socket connection with auth
                if (dependencies.socketHandlers?.initSocketConnection) {
                    console.log('Auth: Initializing socket connection via dependencies...');
                    dependencies.socketHandlers.initSocketConnection(dependencies);
                } else {
                    console.error('Auth: socketHandlers.initSocketConnection not found in dependencies.');
                }

                if (dependencies.ui?.showScreen) {
                    console.log('Auth: Showing lobbyConnect screen...');
                    dependencies.ui.showScreen('lobbyConnect');
                }

            } catch (error) {
                console.error('Auth: Error getting ID token:', error);
                if (dependencies.ui?.showGlobalNotification) {
                    dependencies.ui.showGlobalNotification('Fehler bei der Token-Verifizierung.', 'error');
                }
                await handleLogout(dependencies); // Logout if token fails
            }
        } else {
            console.log('Auth: User is not authenticated.');
            clearCurrentUser();
            // Show authentication screen
            if (dependencies.ui?.showScreen) {
                dependencies.ui.showScreen('auth');
            }
        }
    });
    console.log('Auth: Firebase auth state listener setup complete.');
}

/**
 * Handles user login with email and password.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @param {Object} dependencies - For UI updates.
 */
export async function handleEmailLogin(email, password, dependencies) {
    // Clear previous error messages
    if (dependencies.ui?.domElements?.authErrorMessage) {
        dependencies.ui.domElements.authErrorMessage.textContent = '';
    }

    console.log('Auth: Email login attempted for', email);

    // Validate Firebase auth is available
    if (!gameState.firebaseAuth) {
        const errorMsg = 'Firebase Authentifizierung nicht verfügbar';
        console.error('Auth:', errorMsg);
        if (dependencies.ui?.showGlobalNotification) {
            dependencies.ui.showGlobalNotification(errorMsg, 'error');
        }
        return;
    }

    try {
        // Validate inputs first
        if (!email || !email.trim()) {
            throw new Error('E-Mail-Adresse ist erforderlich.');
        }
        if (!password || password.length < 6) {
            throw new Error('Passwort muss mindestens 6 Zeichen lang sein.');
        }

        await gameState.firebaseAuth.signInWithEmailAndPassword(email.trim(), password);
        console.log('Auth: Login successful.');
        // onAuthStateChanged will handle the screen transition and socket init
    } catch (error) {
        console.error('Auth: Login error:', error);

        // Better error message handling
        let errorMessage = 'Login fehlgeschlagen.';

        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Benutzer nicht gefunden.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Falsches Passwort.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Ungültige E-Mail-Adresse.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Benutzerkonto wurde deaktiviert.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'Ungültige Anmeldedaten.';
                    break;
                default:
                    errorMessage = error.message || `Fehler: ${error.code || 'Unbekannter Fehler'}`;
            }
        } else if (error.message && error.message.length > 1) {
            errorMessage = error.message;
        }

        console.error('Auth: Processed error message:', errorMessage);

        // Display error in UI
        if (dependencies.ui?.domElements?.authErrorMessage) {
            dependencies.ui.domElements.authErrorMessage.textContent = errorMessage;
        }
        if (dependencies.ui?.showGlobalNotification) {
            dependencies.ui.showGlobalNotification(errorMessage, 'error');
        }
    }
}

/**
 * Handles guest login.
 * @param {string} guestName - The name chosen by the guest.
 * @param {Object} dependencies - For UI and socket updates.
 */
export function handleGuestLogin(guestName, dependencies) {
    if (!guestName || !guestName.trim()) {
        if (dependencies.ui?.showGlobalNotification) {
            dependencies.ui.showGlobalNotification('Bitte geben Sie einen Namen ein.', 'warning');
        }
        return;
    }

    const cleanGuestName = guestName.trim();
    setPlayerName(cleanGuestName); // Updates state and localStorage
    console.log('Auth: Guest mode activated with name:', cleanGuestName);

    // Skip Firebase auth for guest mode, directly initialize socket and show lobby
    clearCurrentUser(); // Ensure no lingering Firebase user
    if (dependencies.socketHandlers?.initSocketConnection) {
        dependencies.socketHandlers.initSocketConnection(dependencies);
    } else {
        console.error('Auth: socketHandlers.initSocketConnection not found for guest login.');
    }
    if (dependencies.ui?.showScreen) {
        dependencies.ui.showScreen('lobbyConnect');
    }
}

/**
 * Handles user logout.
 * @param {Object} dependencies - For socket disconnection and UI updates.
 */
export async function handleLogout(dependencies) {
    console.log('Auth: Logout initiated');

    try {
        // Disconnect socket if connected
        const socket = gameState.socket;
        if (socket && typeof socket.disconnect === 'function') {
            socket.disconnect();
            console.log('Auth: Socket disconnected during logout.');
        }

        // Sign out from Firebase
        if (gameState.firebaseAuth && gameState.currentUser) {
            try {
                await gameState.firebaseAuth.signOut();
                console.log('Auth: Firebase signout successful');
            } catch (error) {
                console.error('Auth: Firebase signout error:', error);
                if (dependencies.ui?.showGlobalNotification) {
                    dependencies.ui.showGlobalNotification('Logout fehlgeschlagen.', 'error');
                }
            }
        }

        // Clear all relevant game state
        clearCurrentUser();
        clearLobbyDetails();
        resetGameState();

        // Reset game state if available
        if (dependencies.game?.resetGameState) {
            dependencies.game.resetGameState();
        }

        // Keep guest name for convenience but clear other data
        localStorage.removeItem('quizPlayerName'); // Actually remove it for clean logout

        if (dependencies.ui?.showScreen) {
            dependencies.ui.showScreen('auth');
        }
        if (dependencies.ui?.showGlobalNotification) {
            dependencies.ui.showGlobalNotification('Erfolgreich ausgeloggt.', 'info');
        }

        console.log('Auth: Logout process complete.');

    } catch (error) {
        console.error('Auth: Error during logout:', error);
        if (dependencies.ui?.showGlobalNotification) {
            dependencies.ui.showGlobalNotification('Fehler beim Logout.', 'error');
        }

        // Force cleanup even if there were errors
        clearCurrentUser();
        clearLobbyDetails();
        resetGameState();

        if (dependencies.ui?.showScreen) {
            dependencies.ui.showScreen('auth');
        }
    }
}

console.log('auth.js loaded');