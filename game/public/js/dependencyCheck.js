/**
 * @fileoverview Checks for required global dependencies (Socket.IO, Firebase)
 * before dynamically loading the main application module (main.js).
 */

console.log('🔧 Pre-module check - Socket.IO available:', typeof io !== 'undefined');
console.log('🔧 Pre-module check - Firebase available:', typeof firebase !== 'undefined');

// Wait for both Socket.IO and Firebase to be available before loading modules
function waitForDependencies() {
    if (typeof io !== 'undefined' && typeof firebase !== 'undefined') {
        console.log('✅ All dependencies loaded, starting main module');
        // Load the main module
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'js/main.js';
        document.body.appendChild(script);
    } else {
        console.log('⏳ Waiting for dependencies...');
        setTimeout(waitForDependencies, 50);
    }
}

// Start dependency check after a short delay
setTimeout(waitForDependencies, 100);

console.log('dependencyCheck.js loaded'); 