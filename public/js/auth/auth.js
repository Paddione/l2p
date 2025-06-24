// public/js/auth/auth.js
/**
 * Authentication Module - Updated for API
 * Handles user registration and login functionality with backend API
 */

import { SCREENS, CSS_CLASSES, ERROR_MESSAGES } from '/js/utils/constants.js';
import { isValidUsername, isValidPassword } from '/js/utils/helpers.js';
import apiClient from '/js/api/apiClient.js';
import { STORAGE_KEYS } from '../utils/constants.js';
import { t } from '../utils/translations.js';

export function initAuth(storage, screenManager) {
    let selectedCharacter = null;
    let currentUser = null;
    let isRegisterMode = false;

    /**
     * Initializes authentication event listeners
     */
    function init() {
        // Get form elements
        const authForm = document.getElementById('auth-form');
        const authSwitchLink = document.getElementById('switch-auth');
        const characterButtons = document.querySelectorAll('.character-btn');
        const logoutBtn = document.getElementById('logout-btn');

        // Check if elements exist before adding listeners
        if (!authForm) {
            console.error('Auth form not found');
            return;
        }

        // Add form submit handler
        authForm.addEventListener('submit', handleAuthSubmit);

        // Add auth switch handler
        if (authSwitchLink) {
            authSwitchLink.addEventListener('click', (e) => {
                e.preventDefault();
                switchAuthMode();
            });
        }

        // Add character selection handlers
        characterButtons.forEach(btn => {
            btn.addEventListener('click', () => selectCharacter(btn));
        });

        // Add logout handler
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Add input validation handlers
        const usernameInputs = document.querySelectorAll('input[type="text"]');
        const passwordInputs = document.querySelectorAll('input[type="password"]');

        usernameInputs.forEach(input => {
            input.addEventListener('input', validateUsernameInput);
        });

        passwordInputs.forEach(input => {
            input.addEventListener('input', validatePasswordInput);
        });
    }

    /**
     * Checks for existing authentication token and validates it
     */
    async function checkExistingAuth() {
        const token = apiClient.getToken();
        console.log('checkExistingAuth: Token found:', !!token);
        
        if (token) {
            try {
                console.log('checkExistingAuth: Validating token...');
                const user = await apiClient.getCurrentUser();
                console.log('checkExistingAuth: User data received:', user);
                
                currentUser = user;
                
                // Also save to localStorage for persistence
                if (storage && storage.saveData && user) {
                    storage.saveData(STORAGE_KEYS.CURRENT_USER, {
                        ...user,
                        lastLogin: new Date().toISOString()
                    });
                    console.log('checkExistingAuth: User data saved to localStorage');
                }
                
                screenManager.showScreen(SCREENS.MAIN_MENU);
                return;
            } catch (error) {
                console.log('checkExistingAuth: Invalid token, clearing auth:', error);
                apiClient.logout();
            }
        }
        
        console.log('checkExistingAuth: No valid token, showing auth screen');
        screenManager.showScreen(SCREENS.AUTH);
    }

    /**
     * Validates username input in real-time
     * @param {Event} e - Input event
     */
    function validateUsernameInput(e) {
        const input = e.target;
        const username = input.value.trim();
        const isValid = isValidUsername(username);

        toggleInputValidation(input, isValid);
        
        if (!isValid && username.length > 0) {
            showInputError(input, ERROR_MESSAGES.INVALID_USERNAME);
        }
    }

    /**
     * Validates password input in real-time
     * @param {Event} e - Input event
     */
    function validatePasswordInput(e) {
        const input = e.target;
        const password = input.value;
        const isValid = isValidPassword(password);

        toggleInputValidation(input, isValid);
        
        if (!isValid && password.length > 0) {
            showInputError(input, ERROR_MESSAGES.INVALID_PASSWORD);
        }
    }

    /**
     * Toggles input validation styles
     * @param {HTMLElement} input - Input element
     * @param {boolean} isValid - Validation status
     */
    function toggleInputValidation(input, isValid) {
        input.classList.toggle('is-valid', isValid);
        input.classList.toggle('is-invalid', !isValid && input.value.length > 0);
    }

    /**
     * Shows input error message
     * @param {HTMLElement} input - Input element
     * @param {string} message - Error message
     */
    function showInputError(input, message) {
        let errorDiv = input.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('error-message')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
        }
        errorDiv.textContent = message;
    }

    /**
     * Common handler for both login and registration
     * @param {Event} e - Form submit event
     */
    async function handleAuthSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const type = isRegisterMode ? 'register' : 'login';

        try {
            // Show loading state
            const submitBtn = document.getElementById('auth-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = type === 'login' ? t('AUTH.SIGNING_IN') : t('AUTH.CREATING_ACCOUNT');
            submitBtn.disabled = true;

            // Validate common fields
            if (!username) throw new Error('Benutzername ist erforderlich');
            if (!password) throw new Error('Passwort ist erforderlich');
            if (!isValidUsername(username)) throw new Error(ERROR_MESSAGES.INVALID_USERNAME);
            if (!isValidPassword(password)) throw new Error(ERROR_MESSAGES.INVALID_PASSWORD);

            // Additional validation for registration
            if (type === 'register' && !selectedCharacter) {
                throw new Error(ERROR_MESSAGES.NO_CHARACTER);
            }

            // Perform authentication
            const response = type === 'login' 
                ? await apiClient.login({ username, password })
                : await apiClient.register(username, password, selectedCharacter);

            console.log(`${type} response:`, response);

            if (!response.user) {
                throw new Error(`${type === 'login' ? 'Anmeldung' : 'Registrierung'} fehlgeschlagen: Ungültige Antwort vom Server`);
            }

            console.log(`${type} successful, user data:`, response.user);
            currentUser = response.user;
            
            // Also save to localStorage for persistence and fallback
            if (storage && storage.saveData) {
                storage.saveData(STORAGE_KEYS.CURRENT_USER, {
                    ...response.user,
                    lastLogin: new Date().toISOString()
                });
                console.log('User data saved to localStorage');
            }

            // Success - redirect to main menu
            screenManager.showScreen(SCREENS.MAIN_MENU);
            form.reset();
            if (type === 'register') {
                selectedCharacter = null;
                resetCharacterSelection();
            }
            clearInputErrors(form);

        } catch (error) {
            console.error(`${type === 'login' ? 'Login' : 'Registration'} failed:`, error);
            showFormError(form, error.message);
        } finally {
            // Reset button state
            const submitBtn = document.getElementById('auth-submit');
            submitBtn.textContent = isRegisterMode ? t('AUTH.SIGN_UP') : t('AUTH.SIGN_IN');
            submitBtn.disabled = false;
        }
    }

    /**
     * Shows form-level error message
     * @param {HTMLElement} form - Form element
     * @param {string} message - Error message
     */
    function showFormError(form, message) {
        let errorDiv = form.querySelector('.form-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            form.insertBefore(errorDiv, form.firstChild);
        }
        errorDiv.textContent = message;
    }

    /**
     * Clears all input errors in a form
     * @param {HTMLElement} form - Form element
     */
    function clearInputErrors(form) {
        const errorMessages = form.querySelectorAll('.error-message, .form-error');
        errorMessages.forEach(el => el.remove());
        
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
    }

    /**
     * Switches between login and registration modes
     */
    function switchAuthMode() {
        isRegisterMode = !isRegisterMode;
        
        // Update UI elements
        const formTitle = document.querySelector('#auth-form h2');
        const submitBtn = document.getElementById('auth-submit');
        const switchLink = document.getElementById('switch-auth');
        const characterSelection = document.querySelector('.character-selection');
        const authForm = document.getElementById('auth-form');
        
        // Clear any existing errors
        clearInputErrors(authForm);
        
        if (isRegisterMode) {
            // Switch to register mode
            if (formTitle) formTitle.textContent = t('AUTH.CREATE_ACCOUNT');
            if (submitBtn) submitBtn.textContent = t('AUTH.SIGN_UP');
            if (switchLink) switchLink.textContent = t('AUTH.SWITCH_TO_SIGNIN');
            if (characterSelection) characterSelection.style.display = 'block';
        } else {
            // Switch to login mode
            if (formTitle) formTitle.textContent = t('AUTH.WELCOME');
            if (submitBtn) submitBtn.textContent = t('AUTH.SIGN_IN');
            if (switchLink) switchLink.textContent = t('AUTH.SWITCH_TO_SIGNUP');
            // Reset character selection
            selectedCharacter = null;
            resetCharacterSelection();
        }
    }

    /**
     * Handles character selection
     * @param {HTMLElement} button - Selected character button
     */
    function selectCharacter(button) {
        const buttons = document.querySelectorAll('.character-btn');
        buttons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedCharacter = button.dataset.character;
    }

    /**
     * Resets character selection state
     */
    function resetCharacterSelection() {
        const buttons = document.querySelectorAll('.character-btn');
        buttons.forEach(btn => btn.classList.remove('selected'));
    }

    /**
     * Handles user logout
     */
    async function handleLogout() {
        try {
            // Clear any active game/lobby state
            await storage.clearGameState();
            storage.clearLobbyState();
            
            // Clear current user
            currentUser = null;
            
            // Logout via API
            await apiClient.logout();
            
            console.log('User logged out successfully');
            
            // Show auth screen
            screenManager.showScreen(SCREENS.AUTH);
            
        } catch (error) {
            console.error('Logout failed:', error);
            // Force logout anyway
            apiClient.logout();
            screenManager.showScreen(SCREENS.AUTH);
        }
    }

    /**
     * Gets the current authenticated user
     * @returns {Object|null} Current user object or null if not authenticated
     */
    function getCurrentUser() {
        return currentUser;
    }

    // Don't initialize immediately - wait for screen to be shown
    let isInitialized = false;

    /**
     * Ensures the auth module is initialized when needed
     */
    function ensureInitialized() {
        if (!isInitialized) {
            init();
            isInitialized = true;
            // Check auth after initialization
            checkExistingAuth();
        }
    }

    return {
        getCurrentUser,
        logout: handleLogout,
        ensureInitialized
    };
}