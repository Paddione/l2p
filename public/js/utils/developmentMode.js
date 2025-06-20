// public/js/utils/developmentMode.js
// Development mode utilities for cache management

import apiClient from '/js/api/apiClient.js';
import { t } from './translations.js';

class DevelopmentMode {
    constructor() {
        this.isDevelopmentMode = false;
        this.cacheCleared = false;
        this.cacheClearKey = 'l2p_dev_cache_cleared';
    }

    /**
     * Initialize development mode and check if cache clearing is required
     * @returns {Promise<boolean>} Whether the app should continue loading
     */
    async initialize() {
        try {
            console.log('DevelopmentMode: Checking development mode status...');
            
            // Check if backend is in development mode
            const response = await apiClient.get('/development-mode');
            this.isDevelopmentMode = response.developmentMode;
            
            console.log(`DevelopmentMode: isDevelopmentMode = ${this.isDevelopmentMode}`);
            
            if (!this.isDevelopmentMode) {
                console.log('DevelopmentMode: Not in development mode, continuing normal initialization');
                return true; // Continue normal app initialization
            }

            console.log('DevelopmentMode: In development mode, checking cache status...');
            
            // Check if cache has already been cleared for this session
            const cacheCleared = localStorage.getItem(this.cacheClearKey);
            const sessionStart = sessionStorage.getItem('l2p_session_start');
            
            if (cacheCleared && sessionStart) {
                console.log('DevelopmentMode: Cache already cleared this session, continuing...');
                return true; // Continue normal app initialization
            }

            console.log('DevelopmentMode: Forcing cache clear...');
            
            // Force cache clearing
            this.showCacheClearScreen();
            return false; // Stop normal app initialization
            
        } catch (error) {
            console.error('DevelopmentMode: Error checking development mode:', error);
            // If we can't check development mode, continue with normal initialization
            return true;
        }
    }

    /**
     * Show the cache clearing screen and handle the process
     */
    showCacheClearScreen() {
        // Hide all other screens
        const allScreens = document.querySelectorAll('.screen');
        allScreens.forEach(screen => screen.classList.remove('active'));

        // Create or show development cache clear screen
        let devClearScreen = document.getElementById('dev-cache-clear-screen');
        
        if (!devClearScreen) {
            devClearScreen = this.createCacheClearScreen();
            document.body.appendChild(devClearScreen);
        }

        devClearScreen.classList.add('active');
    }

    /**
     * Create the development mode cache clear screen
     * @returns {HTMLElement} The cache clear screen element
     */
    createCacheClearScreen() {
        const screen = document.createElement('div');
        screen.id = 'dev-cache-clear-screen';
        screen.className = 'screen';
        
        screen.innerHTML = `
            <div class="container">
                <div class="dev-cache-clear-content">
                    <h1>🛠️ Development Mode</h1>
                    <div class="dev-info">
                        <h2>Cache-Bereinigung erforderlich</h2>
                        <p>Die Anwendung läuft im Entwicklungsmodus. Für optimale Funktionalität muss der Browser-Cache geleert werden.</p>
                    </div>
                    
                    <div class="cache-clear-actions">
                        <button id="auto-clear-btn" class="btn btn-primary">
                            🧹 Cache automatisch leeren
                        </button>
                        <button id="manual-clear-btn" class="btn btn-secondary">
                            📖 Manuelle Anleitung
                        </button>
                        <button id="skip-clear-btn" class="btn btn-tertiary">
                            ⏭️ Überspringen (nicht empfohlen)
                        </button>
                    </div>
                    
                    <div id="clear-status" class="clear-status"></div>
                    
                    <div id="manual-instructions" class="manual-instructions" style="display: none;">
                        <h3>Manuelle Cache-Bereinigung:</h3>
                        <ol>
                            <li>Drücken Sie <strong>Ctrl+Shift+R</strong> (oder <strong>Cmd+Shift+R</strong> auf Mac)</li>
                            <li>Oder öffnen Sie die Entwicklertools (F12) → Application/Anwendung → Storage → Clear storage</li>
                            <li>Oder verwenden Sie Ctrl+Shift+Delete um den Browser-Cache zu leeren</li>
                        </ol>
                        <button id="continue-after-manual" class="btn btn-primary">
                            ✅ Cache geleert - Fortfahren
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        screen.addEventListener('click', (e) => {
            if (e.target.id === 'auto-clear-btn') {
                this.performAutoClear();
            } else if (e.target.id === 'manual-clear-btn') {
                this.showManualInstructions();
            } else if (e.target.id === 'skip-clear-btn') {
                this.skipClearAndContinue();
            } else if (e.target.id === 'continue-after-manual') {
                this.continueAfterManualClear();
            }
        });

        return screen;
    }

    /**
     * Perform automatic cache clearing
     */
    async performAutoClear() {
        const statusDiv = document.getElementById('clear-status');
        statusDiv.innerHTML = '<div class="loading">' + t('STATUS.CLEARING_CACHE') + '</div>';

        try {
            // Clear all storage types
            localStorage.clear();
            sessionStorage.clear();

            // Clear IndexedDB if available
            if ('indexedDB' in window) {
                const databases = await indexedDB.databases();
                for (const db of databases) {
                    await this.deleteDatabase(db.name);
                }
            }

            // Clear service worker cache if available
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }

            statusDiv.innerHTML = '<div class="success">' + t('STATUS.CACHE_CLEARED_SUCCESS') + '</div>';
            
            // Mark cache as cleared and continue
            setTimeout(() => {
                this.setCacheClearedFlag();
                this.continueToApp();
            }, 1500);

        } catch (error) {
            console.error('Error clearing cache:', error);
            statusDiv.innerHTML = `
                <div class="error">
                    ❌ Automatische Cache-Bereinigung fehlgeschlagen: ${error.message}
                    <br>Bitte verwenden Sie die manuelle Methode.
                </div>
            `;
        }
    }

    /**
     * Delete an IndexedDB database
     * @param {string} dbName Database name to delete
     */
    deleteDatabase(dbName) {
        return new Promise((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(dbName);
            deleteReq.onsuccess = () => resolve();
            deleteReq.onerror = () => reject(deleteReq.error);
            deleteReq.onblocked = () => {
                console.warn(`Delete blocked for database: ${dbName}`);
                resolve(); // Continue anyway
            };
        });
    }

    /**
     * Show manual cache clearing instructions
     */
    showManualInstructions() {
        const instructions = document.getElementById('manual-instructions');
        instructions.style.display = 'block';
        
        const actionsDiv = document.querySelector('.cache-clear-actions');
        actionsDiv.style.display = 'none';
    }

    /**
     * Continue after manual cache clearing
     */
    continueAfterManualClear() {
        this.setCacheClearedFlag();
        this.continueToApp();
    }

    /**
     * Skip cache clearing (not recommended)
     */
    skipClearAndContinue() {
        console.warn('DevelopmentMode: Cache clearing skipped - this may cause issues');
        this.setCacheClearedFlag();
        this.continueToApp();
    }

    /**
     * Set the flag indicating cache has been cleared
     */
    setCacheClearedFlag() {
        try {
            localStorage.setItem(this.cacheClearKey, 'true');
            sessionStorage.setItem('l2p_session_start', Date.now().toString());
        } catch (error) {
            console.warn('Could not set cache cleared flag:', error);
        }
    }

    /**
     * Continue to the main application
     */
    continueToApp() {
        // Hide the cache clear screen
        const devClearScreen = document.getElementById('dev-cache-clear-screen');
        if (devClearScreen) {
            devClearScreen.classList.remove('active');
        }

        // Reload the page to start fresh with cleared cache
        window.location.reload();
    }
}

// Create and export singleton instance
const developmentMode = new DevelopmentMode();
export { developmentMode }; 