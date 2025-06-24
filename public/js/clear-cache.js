/**
 * Clear Cache JavaScript - CSP Compliant Version
 * Learn2Play - Cache clearing utilities
 */

function clearLocalStorage() {
    try {
        localStorage.clear();
        showStatus('✅ Lokaler Speicher erfolgreich geleert!');
    } catch (error) {
        showStatus('❌ Fehler beim Löschen des lokalen Speichers: ' + error.message);
    }
}

function clearSessionStorage() {
    try {
        sessionStorage.clear();
        showStatus('✅ Session-Speicher erfolgreich geleert!');
    } catch (error) {
        showStatus('❌ Fehler beim Löschen des Session-Speichers: ' + error.message);
    }
}

function clearAllStorage() {
    try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear IndexedDB if available
        if ('indexedDB' in window) {
            indexedDB.databases().then(databases => {
                databases.forEach(db => {
                    indexedDB.deleteDatabase(db.name);
                });
            });
        }
        
        showStatus('✅ Alle Daten erfolgreich geleert!');
    } catch (error) {
        showStatus('❌ Fehler beim Löschen der Daten: ' + error.message);
    }
}

function showStatus(message) {
    const status = document.getElementById('status');
    status.innerHTML = '<div class="success">' + message + '</div>';
    setTimeout(() => {
        status.innerHTML = '';
    }, 3000);
}

function goToGame() {
    window.location.href = '/';
}

// DOM Content Loaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners to buttons
    const clearLocalBtn = document.getElementById('clear-local-storage');
    const clearSessionBtn = document.getElementById('clear-session-storage');
    const clearAllBtn = document.getElementById('clear-all-storage');
    const goToGameBtn = document.getElementById('go-to-game');

    if (clearLocalBtn) {
        clearLocalBtn.addEventListener('click', clearLocalStorage);
    }
    
    if (clearSessionBtn) {
        clearSessionBtn.addEventListener('click', clearSessionStorage);
    }
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllStorage);
    }
    
    if (goToGameBtn) {
        goToGameBtn.addEventListener('click', goToGame);
    }

    // Auto-log on page load for debugging
    console.log('Cache-Leerungsseite geladen');
    console.log('Aktuelle localStorage-Schlüssel:', Object.keys(localStorage));
    console.log('Aktuelle sessionStorage-Schlüssel:', Object.keys(sessionStorage));
}); 