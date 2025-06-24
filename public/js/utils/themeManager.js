/**
 * Theme Manager - Handles light/dark mode switching
 */

import { t } from './translations.js';

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.themeButtons = {};
        
        this.initializeTheme();
        this.setupEventListeners();
    }

    /**
     * Initialize the theme system
     */
    initializeTheme() {
        // Apply the saved theme
        this.applyTheme(this.currentTheme);
        
        // Get theme buttons
        this.themeButtons.light = document.getElementById('theme-light');
        this.themeButtons.dark = document.getElementById('theme-dark');
        
        // Update button states
        this.updateButtonStates();
        
        // Update translations
        this.updateTranslations();
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
                } else {
                    button.classList.remove('active');
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
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeTheme();
            
            // Theme button event listeners
            const lightButton = document.getElementById('theme-light');
            const darkButton = document.getElementById('theme-dark');
            
            if (lightButton) {
                lightButton.addEventListener('click', () => {
                    this.switchTheme('light');
                });
            }
            
            if (darkButton) {
                darkButton.addEventListener('click', () => {
                    this.switchTheme('dark');
                });
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