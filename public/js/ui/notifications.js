/**
 * Enhanced Notifications Module
 * Handles user notifications and toasts with better visibility
 * Now with 60 FPS limiting for better performance
 */

import { CSS_CLASSES } from '../utils/constants.js';
import { translateRaw } from '../utils/translations.js';
import { requestAnimationFrame60 } from '../utils/helpers.js';

/**
 * Shows a toast notification
 * @param {string|Error} message - Message to display or Error object
 * @param {string} type - Type of toast ('success', 'error', 'warning', 'info')
 * @param {number} [duration=3000] - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Handle error objects with recovery information
    let displayMessage = message;
    let recovery = null;
    
    if (message instanceof Error) {
        displayMessage = message.message;
        recovery = message.recovery;
        
        // For errors, default to error type if not specified
        if (type === 'info') {
            type = 'error';
        }
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Add icon based on type
    const icon = getIconForType(type);
    const translatedMessage = translateRaw(displayMessage);
    
    // Build toast content with recovery suggestion if available
    let toastContent = `${icon}<div class="toast-content">`;
    toastContent += `<div class="toast-message">${translatedMessage}</div>`;
    
    if (recovery) {
        const translatedRecovery = translateRaw(recovery);
        toastContent += `<div class="toast-recovery">${translatedRecovery}</div>`;
        duration = Math.max(duration, 5000); // Show longer for recovery messages
    }
    
    toastContent += '</div>';
    toast.innerHTML = toastContent;

    // Add to container
    toastContainer.appendChild(toast);

    // Trigger animation with 60 FPS limiting
    requestAnimationFrame60(() => {
        toast.classList.add('show');
    });

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300); // Wait for fade out animation
    }, duration);
}

/**
 * Gets icon for notification type
 * @param {string} type - Notification type
 * @returns {string} - HTML for icon
 */
function getIconForType(type) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return `<span style="font-size: 1.2em; margin-right: 8px;">${icons[type] || icons.info}</span>`;
}

/**
 * Alias for showToast for compatibility
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success', 'error', 'warning', 'info')
 * @param {number} [duration=3000] - Duration in milliseconds
 */
export function showNotification(message, type = 'info', duration = 3000) {
    return showToast(message, type, duration);
}

// Make showToast globally available for other modules
window.showToast = showToast;
window.showNotification = showNotification;