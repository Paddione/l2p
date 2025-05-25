// js/api.js

/**
 * @fileoverview Handles API calls for the quiz game, such as fetching quiz categories from the server.
 */

import { setAvailableCategories, gameState } from './state.js';

/**
 * Fetches quiz categories from the server.
 * Updates the global state and populates the category select UI.
 */
export async function fetchCategories() {
    try {
        console.log('📚 Fetching categories from server...');

        const response = await fetch('/api/categories');

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HTTP error ${response.status}: ${response.statusText}`, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
        }

        const data = await response.json();
        console.log('📚 Categories response:', data);

        if (data && data.categories && Array.isArray(data.categories)) {
            setAvailableCategories(data.categories);
            console.log('✅ Categories loaded:', data.categories);

            // Update UI if available
            if (gameState.dependencies?.ui?.populateCategorySelect) {
                gameState.dependencies.ui.populateCategorySelect(data.categories);
            } else {
                console.warn('📚 UI module not available for category population');
            }
        } else {
            console.error('❌ Invalid categories response format:', data);
            handleCategoriesFallback();
        }

    } catch (error) {
        console.error('❌ Failed to fetch categories:', error);
        handleCategoriesFallback();

        // Show error notification if UI is available
        if (gameState.dependencies?.ui?.showGlobalNotification) {
            gameState.dependencies.ui.showGlobalNotification(
                'Kategorien konnten nicht geladen werden. Fallback wird genutzt.',
                'warning'
            );
        }
    }
}

/**
 * Handles fallback when categories cannot be fetched
 */
function handleCategoriesFallback() {
    const fallbackCategories = ['Allgemeinwissen', 'Wissenschaft', 'Geschichte'];
    setAvailableCategories(fallbackCategories);

    if (gameState.dependencies?.ui?.populateCategorySelect) {
        gameState.dependencies.ui.populateCategorySelect(fallbackCategories);
    }

    console.log('📚 Using fallback categories:', fallbackCategories);
}

/**
 * Fetches user information from the server (requires authentication)
 * @returns {Promise<Object|null>} User data or null if failed
 */
export async function fetchUserInfo() {
    try {
        const idToken = gameState.idToken;
        if (!idToken) {
            console.log('📚 No ID token available for user info fetch');
            return null;
        }

        const response = await fetch('/api/user', {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.log('📚 Authentication failed for user info');
                return null;
            }
            throw new Error(`Failed to fetch user info: ${response.status}`);
        }

        const data = await response.json();
        console.log('📚 User info fetched:', data);
        return data.user;

    } catch (error) {
        console.error('❌ Failed to fetch user info:', error);
        return null;
    }
}

/**
 * Generic API call helper with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export async function apiCall(endpoint, options = {}) {
    try {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // Add auth header if token is available
        if (gameState.idToken) {
            defaultOptions.headers['Authorization'] = `Bearer ${gameState.idToken}`;
        }

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        const response = await fetch(endpoint, mergedOptions);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }

    } catch (error) {
        console.error(`❌ API call to ${endpoint} failed:`, error);
        throw error;
    }
}

console.log('api.js loaded');