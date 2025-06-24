/**
 * Screen Manager Module
 * Handles screen transitions and visibility in the application
 */

export function initScreenManager() {
    // Private variables
    const screens = new Map();
    let currentScreen = null;

    // Initialize screen references
    document.querySelectorAll('.screen').forEach(screen => {
        screens.set(screen.id, screen);
    });

    /**
     * Shows a specific screen and hides others
     * @param {string} screenId - The ID of the screen to show
     * @returns {boolean} - Success status
     */
    function showScreen(screenId) {
        const screen = screens.get(screenId);
        if (!screen) {
            console.error(`Screen ${screenId} not found`);
            return false;
        }

        // Hide current screen if exists
        if (currentScreen) {
            currentScreen.classList.remove('active');
            currentScreen.classList.remove('fade-in');
        }

        // Show new screen
        screen.classList.add('active');
        screen.classList.add('fade-in');
        currentScreen = screen;
        
        // Dispatch screen change event
        const event = new CustomEvent('screenChanged', {
            detail: { screenId, previousScreen: currentScreen?.id }
        });
        document.dispatchEvent(event);
        
        return true;
    }

    /**
     * Hides a specific screen
     * @param {string} screenId - The ID of the screen to hide
     * @returns {boolean} - Success status
     */
    function hideScreen(screenId) {
        const screen = screens.get(screenId);
        if (!screen) {
            console.error(`Screen ${screenId} not found`);
            return false;
        }

        screen.classList.remove('active');
        screen.classList.remove('fade-in');
        if (currentScreen === screen) {
            currentScreen = null;
        }
        return true;
    }

    /**
     * Gets the currently active screen
     * @returns {string|null} - ID of the current screen or null
     */
    function getCurrentScreen() {
        return currentScreen ? currentScreen.id : null;
    }

    /**
     * Checks if a screen exists
     * @param {string} screenId - The ID of the screen to check
     * @returns {boolean} - Whether the screen exists
     */
    function hasScreen(screenId) {
        return screens.has(screenId);
    }

    return {
        showScreen,
        hideScreen,
        getCurrentScreen,
        hasScreen
    };
} 