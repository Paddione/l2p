/**
 * Language Switcher Module
 * Handles language switching between German and English
 */

import { setLanguage, getCurrentLanguage, t } from './translations.js';

class LanguageSwitcher {
    constructor() {
        this.currentLanguage = getCurrentLanguage();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        
        // Initial translation update
        this.updateAllTexts();
        
        // Listen for language changes from other components
        window.addEventListener('languageChanged', (event) => {
            this.currentLanguage = event.detail.language;
            this.updateUI();
            this.updateAllTexts();
        });
    }

    setupEventListeners() {
        // Language button listeners
        const languageButtons = document.querySelectorAll('.language-btn');
        languageButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetLanguage = e.target.getAttribute('data-lang');
                if (targetLanguage && targetLanguage !== this.currentLanguage) {
                    this.switchLanguage(targetLanguage);
                }
            });
        });
    }

    switchLanguage(language) {
        if (language === 'en' || language === 'de') {
            setLanguage(language);
            this.currentLanguage = language;
            this.updateUI();
            this.updateAllTexts();
            
            // Show a quick notification
            this.showLanguageNotification(language);
        }
    }

    updateUI() {
        // Update button states
        const languageButtons = document.querySelectorAll('.language-btn');
        languageButtons.forEach(button => {
            const buttonLang = button.getAttribute('data-lang');
            if (buttonLang === this.currentLanguage) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update button titles
        const deButton = document.getElementById('language-de');
        const enButton = document.getElementById('language-en');
        
        if (deButton && enButton) {
            if (this.currentLanguage === 'de') {
                deButton.title = 'Bereits auf Deutsch';
                enButton.title = 'Switch to English';
            } else {
                deButton.title = 'Auf Deutsch wechseln';
                enButton.title = 'Already in English';
            }
        }
    }

    updateAllTexts() {
        // Update all elements with data-i18n attributes
        this.updateDataI18nElements();
        
        // Update volume control labels
        this.updateVolumeControls();
        
        // Update all screens with translatable content
        this.updateScreenTexts();
        
        // Update any dynamically created content
        this.updateDynamicContent();
    }

    updateDataI18nElements() {
        // Find all elements with data-i18n attributes and update their text
        const elementsWithI18n = document.querySelectorAll('[data-i18n]');
        elementsWithI18n.forEach(element => {
            const translationKey = element.getAttribute('data-i18n');
            if (translationKey) {
                const translatedText = t(translationKey);
                
                // Handle different element types
                if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'number')) {
                    // For input elements, update placeholder
                    element.placeholder = translatedText;
                } else if (element.tagName === 'INPUT' && element.type === 'button') {
                    // For input buttons, update value
                    element.value = translatedText;
                } else {
                    // For regular elements, update textContent
                    element.textContent = translatedText;
                }
            }
        });
    }

    updateVolumeControls() {
        const musicLabel = document.querySelector('label[for="music-volume"]');
        const soundLabel = document.querySelector('label[for="sound-volume"]');
        
        if (musicLabel) {
            musicLabel.textContent = t('VOLUME.MUSIC');
        }
        if (soundLabel) {
            soundLabel.textContent = t('VOLUME.EFFECTS');
        }
    }

    updateScreenTexts() {
        // Update loading screen
        this.updateLoadingScreen();
        
        // Update auth screen
        this.updateAuthScreen();
        
        // Update main menu
        this.updateMainMenu();
        
        // Update other screens as needed
        this.updateLobbyScreen();
        this.updateGameScreens();
        this.updateHallOfFame();
        this.updateQuestionSetScreens();
    }

    updateLoadingScreen() {
        const loadingTitle = document.querySelector('#loading-screen h2');
        if (loadingTitle) {
            loadingTitle.textContent = t('LOADING.TITLE');
        }
    }

    updateAuthScreen() {
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            const title = authForm.querySelector('h2');
            const usernameInput = authForm.querySelector('#username');
            const passwordInput = authForm.querySelector('#password');
            const submitButton = authForm.querySelector('#auth-submit');
            const switchLink = authForm.querySelector('#switch-auth');
            
            if (title) title.textContent = t('AUTH.WELCOME');
            if (usernameInput) usernameInput.placeholder = t('AUTH.USERNAME');
            if (passwordInput) passwordInput.placeholder = t('AUTH.PASSWORD');
            if (submitButton) {
                // Check if we're in sign-in or sign-up mode
                const isSignIn = submitButton.textContent.includes('Sign In') || submitButton.textContent.includes('Anmelden');
                submitButton.textContent = isSignIn ? t('AUTH.SIGN_IN') : t('AUTH.SIGN_UP');
            }
            if (switchLink) {
                const isSignInMode = switchLink.textContent.includes('Registrieren') || switchLink.textContent.includes('Sign up');
                switchLink.textContent = isSignInMode ? t('AUTH.SWITCH_TO_SIGNUP') : t('AUTH.SWITCH_TO_SIGNIN');
            }
        }

        // Update character selection
        const charSelection = document.querySelector('.character-selection h3');
        if (charSelection) {
            charSelection.textContent = t('AUTH.CHOOSE_CHARACTER');
        }
    }

    updateMainMenu() {
        const menuTitle = document.querySelector('#main-menu-screen h1');
        if (menuTitle) {
            menuTitle.textContent = t('MAIN_MENU.TITLE');
        }

        // Update menu buttons
        const buttons = {
            'create-game-btn': 'MAIN_MENU.CREATE_GAME',
            'join-game-btn': 'MAIN_MENU.JOIN_GAME',
            'hall-of-fame-btn': 'MAIN_MENU.HALL_OF_FAME',
            'help-btn': `📖 ${t('MAIN_MENU.HELP')}`,
            'logout-btn': 'MAIN_MENU.LOGOUT'
        };

        Object.entries(buttons).forEach(([id, translationKey]) => {
            const button = document.getElementById(id);
            if (button) {
                if (translationKey.includes('📖')) {
                    button.textContent = translationKey;
                } else {
                    button.textContent = t(translationKey);
                }
            }
        });
    }

    updateLobbyScreen() {
        // Update lobby screen elements
        const lobbyTitle = document.querySelector('#lobby-screen h2');
        if (lobbyTitle) {
            lobbyTitle.textContent = t('LOBBY.TITLE');
        }

        // Update lobby control buttons
        const readyBtn = document.getElementById('ready-btn');
        const startBtn = document.getElementById('start-game-btn');
        const leaveBtn = document.getElementById('leave-lobby-btn');
        const selectQsBtn = document.getElementById('select-question-set-btn');

        if (readyBtn) {
            const isReady = readyBtn.classList.contains('ready');
            readyBtn.textContent = isReady ? t('LOBBY.READY') : t('LOBBY.NOT_READY');
        }
        if (startBtn) startBtn.textContent = t('LOBBY.START_GAME');
        if (leaveBtn) leaveBtn.textContent = t('LOBBY.LEAVE_LOBBY');
        if (selectQsBtn) selectQsBtn.textContent = t('LOBBY.SELECT_QUESTION_SET');
    }

    updateGameScreens() {
        // Update game-related text elements that might be visible
        const timerLabel = document.querySelector('.timer-label');
        if (timerLabel) {
            timerLabel.textContent = t('GAME.TIME_LEFT');
        }
    }

    updateHallOfFame() {
        const hofTitle = document.querySelector('#hall-of-fame-screen h2');
        if (hofTitle) {
            hofTitle.textContent = t('HALL_OF_FAME.TITLE');
        }

        const selectCatalogLabel = document.querySelector('.catalog-selection label');
        if (selectCatalogLabel) {
            selectCatalogLabel.textContent = t('HALL_OF_FAME.SELECT_CATALOG');
        }
    }

    updateQuestionSetScreens() {
        // Update question set selection screen
        const qsTitle = document.querySelector('#question-set-selection-screen h2');
        if (qsTitle) {
            qsTitle.textContent = t('QUESTION_SETS.TITLE');
        }

        const qsDescription = document.querySelector('#question-set-selection-screen > .question-set-selection-container > p');
        if (qsDescription) {
            qsDescription.textContent = t('QUESTION_SETS.DESCRIPTION');
        }

        // Update upload screen
        const uploadTitle = document.querySelector('#upload-questions-screen h2');
        if (uploadTitle) {
            uploadTitle.textContent = t('UPLOAD_QUESTIONS.TITLE');
        }
    }

    updateDynamicContent() {
        // Update any toast notifications, modal dialogs, etc.
        // This will be called when language changes to update any dynamic content
        
        // Update modal titles and buttons
        const modalTitles = document.querySelectorAll('.modal-header h2');
        modalTitles.forEach(title => {
            if (title.textContent.includes('Join') || title.textContent.includes('Beitreten')) {
                title.textContent = t('JOIN_GAME.TITLE');
            }
        });

        // Update form labels and buttons in modals
        const joinModalButton = document.querySelector('.join-lobby-form button');
        if (joinModalButton) {
            joinModalButton.textContent = t('JOIN_GAME.JOIN');
        }
    }

    showLanguageNotification(language) {
        // Create a temporary notification to show language was changed
        const notification = document.createElement('div');
        notification.className = 'language-notification';
        notification.textContent = language === 'de' ? 'Sprache zu Deutsch geändert' : 'Language changed to English';
        
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 0.875rem;
            z-index: 1001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    // Method to update specific elements when content changes
    updateElement(element, translationKey) {
        if (element && translationKey) {
            element.textContent = t(translationKey);
        }
    }

    // Method to get current language for other components
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Export for use in other modules
export default LanguageSwitcher;

// Global function to force translation updates
window.updateTranslations = function() {
    if (window.appState && window.appState.modules && window.appState.modules.languageSwitcher) {
        window.appState.modules.languageSwitcher.updateAllTexts();
    }
}; 