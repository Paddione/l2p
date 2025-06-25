/**
 * Theme Manager - Handles light/dark mode switching
 */

import { t } from './translations.js';

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.themeButtons = {};
        this.initialized = false;
        
        // Initialize immediately if DOM is ready, otherwise wait
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
        
        this.setupEventListeners();
    }

    /**
     * Initialize the theme system
     */
    initialize() {
        if (this.initialized) return;
        
        // Apply the saved theme first
        this.applyTheme(this.currentTheme);
        
        // Get theme buttons with retry mechanism
        this.updateButtonReferences();
        
        // Update button states
        this.updateButtonStates();
        
        // Update translations
        this.updateTranslations();
        
        this.initialized = true;
        console.log('Theme manager initialized with theme:', this.currentTheme);
    }

    /**
     * Update button references with retry mechanism
     */
    updateButtonReferences() {
        this.themeButtons.light = document.getElementById('theme-light');
        this.themeButtons.dark = document.getElementById('theme-dark');
        
        // If buttons aren't found, try again in a moment (DOM might still be loading)
        if (!this.themeButtons.light || !this.themeButtons.dark) {
            setTimeout(() => this.updateButtonReferences(), 100);
        }
    }

    /**
     * Apply the theme to the document
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
    }

    /**
     * Switch to a specific theme
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    switchTheme(theme) {
        if (theme !== this.currentTheme) {
            this.applyTheme(theme);
            this.updateButtonStates();
            
            // Dispatch theme change event
            window.dispatchEvent(new CustomEvent('themeChanged', { 
                detail: { theme: this.currentTheme } 
            }));
            
            console.log(`Theme switched to: ${theme}`);
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.switchTheme(newTheme);
    }

    /**
     * Update button active states
     */
    updateButtonStates() {
        Object.entries(this.themeButtons).forEach(([theme, button]) => {
            if (button) {
                if (theme === this.currentTheme) {
                    button.classList.add('active');
                    button.setAttribute('aria-pressed', 'true');
                } else {
                    button.classList.remove('active');
                    button.setAttribute('aria-pressed', 'false');
                }
            }
        });
    }

    /**
     * Update button tooltips with translations
     */
    updateTranslations() {
        if (this.themeButtons.light) {
            this.themeButtons.light.title = t('THEME.LIGHT_MODE');
        }
        if (this.themeButtons.dark) {
            this.themeButtons.dark.title = t('THEME.DARK_MODE');
        }
    }

    /**
     * Setup event listeners for theme buttons
     */
    setupEventListeners() {
        // Use event delegation to handle dynamically added buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('#theme-light')) {
                e.preventDefault();
                this.switchTheme('light');
            } else if (e.target.matches('#theme-dark')) {
                e.preventDefault();
                this.switchTheme('dark');
            }
        });

        // Listen for language changes to update translations
        window.addEventListener('languageChanged', () => {
            this.updateTranslations();
        });

        // Listen for keyboard shortcuts (optional)
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + T to toggle theme
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // Re-initialize when DOM content changes (for dynamic content)
        const observer = new MutationObserver(() => {
            if (!this.initialized) {
                this.initialize();
            } else {
                this.updateButtonReferences();
                this.updateButtonStates();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if dark mode is active
     * @returns {boolean} True if dark mode is active
     */
    isDarkMode() {
        return this.currentTheme === 'dark';
    }
}

// Create and initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other modules
export default themeManager;

// Global access for debugging
window.themeManager = themeManager; 