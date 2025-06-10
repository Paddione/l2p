/**
 * apiClient.js - Fixed version with better error handling and endpoint mapping
 *
 * Centralized API client for handling requests to the backend.
 * Includes features like request timeouts, consistent error handling,
 * and JWT token management.
 */

import { API_BASE_URL, REQUEST_TIMEOUT } from '/js/utils/constants.js';
import { showToast } from '/js/ui/notifications.js';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const RETRY_STATUS_CODES = [502, 503, 504];

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE_URL;
        this.token = localStorage.getItem('jwtToken');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('jwtToken', token);
        } else {
            localStorage.removeItem('jwtToken');
        }
    }

    getToken() {
        return this.token || localStorage.getItem('jwtToken');
    }

    /**
     * Clears the JWT token from the client and localStorage.
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('jwtToken');
        console.log('Token cleared');
    }

    /**
     * Sleep function for retry delays
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch with timeout and retry logic
     * @param {string} resource - URL to fetch
     * @param {object} options - Fetch options
     * @param {number} timeout - Timeout in milliseconds
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<Response>}
     */
    async fetchWithTimeout(resource, options, timeout = REQUEST_TIMEOUT, retryCount = 0) {
        const controller = new AbortController();
        const id = setTimeout(() => {
            controller.abort();
            console.warn(`Request to ${resource} timed out after ${timeout}ms`);
        }, timeout);

        try {
            const response = await fetch(resource, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);

            // If we get a retryable status code and haven't exceeded max retries
            if (RETRY_STATUS_CODES.includes(response.status) && retryCount < MAX_RETRIES) {
                console.warn(`Received ${response.status}, attempting retry ${retryCount + 1} of ${MAX_RETRIES}`);
                await this.sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
                return this.fetchWithTimeout(resource, options, timeout, retryCount + 1);
            }

            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                // If timeout and we haven't exceeded max retries
                if (retryCount < MAX_RETRIES) {
                    console.warn(`Request timed out, attempting retry ${retryCount + 1} of ${MAX_RETRIES}`);
                    await this.sleep(RETRY_DELAY * (retryCount + 1));
                    return this.fetchWithTimeout(resource, options, timeout, retryCount + 1);
                }
                throw new Error(`Request timed out after ${MAX_RETRIES} attempts`);
            }
            throw error;
        }
    }

    /**
     * Generic request handler with improved error handling.
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
     * @param {string} endpoint - API endpoint (e.g., '/users').
     * @param {object} [body=null] - Request body for POST/PUT.
     * @param {object} [headers={}] - Custom headers.
     * @param {boolean} [isFormData=false] - Whether the body is FormData.
     * @returns {Promise<object>} - The JSON response from the API.
     */
    async request(method, endpoint, body = null, customHeaders = {}, isFormData = false) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = { ...customHeaders };

        // Don't set Content-Type for FormData - let the browser set it with boundary
        if (!isFormData && body) {
            headers['Content-Type'] = 'application/json';
        }

        const currentToken = this.getToken();
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        const options = {
            method,
            headers,
        };

        if (body) {
            options.body = isFormData ? body : JSON.stringify(body);
        }

        console.log(`Making ${method} request to ${url}`, body ? { body } : '');
        console.log('Request options:', {
            method,
            headers,
            bodyType: body ? (isFormData ? 'FormData' : typeof body) : 'none',
            hasBody: !!body
        });

        if (isFormData && body) {
            console.log('FormData entries:');
            for (let [key, value] of body.entries()) {
                console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
            }
        }

        try {
            const response = await this.fetchWithTimeout(url, options);
            let responseData;

            if (!response.ok) {
                const responseText = await response.text();
                let errorJson = null;
                
                try {
                    errorJson = JSON.parse(responseText);
                } catch (e) {
                    console.error(`Failed to parse error response as JSON: ${e.name}: ${e.message}. Response text: "${responseText}"`);
                }

                // Handle 401 authentication errors specifically
                if (response.status === 401) {
                    console.warn('Authentication failed - clearing token and redirecting to login');
                    this.clearToken();
                    
                    // Try to redirect to login screen if possible
                    try {
                        if (window.appState && window.appState.modules && window.appState.modules.screenManager) {
                            window.appState.modules.screenManager.showScreen('auth');
                        } else {
                            // Fallback: reload the page to trigger auth check
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        }
                    } catch (redirectError) {
                        console.error('Failed to redirect to login:', redirectError);
                    }
                    
                    const error = new Error('Your session has expired. Please log in again.');
                    error.status = 401;
                    error.data = errorJson || { rawResponse: responseText };
                    throw error;
                }

                // Enhanced error messages for common issues
                if (response.status === 502) {
                    const error = new Error('The server is temporarily unavailable. We tried multiple times but could not connect. Please try again in a few minutes.');
                    error.status = 502;
                    error.data = { rawResponse: responseText };
                    throw error;
                }

                // Handle specific HTTP status codes
                if (response.status === 404) {
                    const error = new Error('API endpoint not found. Please check if the backend is running.');
                    error.status = 404;
                    error.data = { rawResponse: responseText };
                    throw error;
                }

                if (response.status === 501) {
                    const error = new Error('API method not implemented. Please check backend implementation.');
                    error.status = 501;
                    error.data = { rawResponse: responseText };
                    throw error;
                }

                const error = new Error(
                    errorJson?.message || 
                    errorJson?.error || 
                    (responseText && responseText.length < 200 ? responseText : `Request failed with status ${response.status} ${response.statusText}`)
                );
                error.status = response.status;
                error.data = errorJson || { rawResponse: responseText };
                throw error;
            }

            const responseText = await response.text();
            if (responseText) {
                try {
                    responseData = JSON.parse(responseText);
                } catch (e) {
                    console.error(`Successfully fetched but failed to parse response as JSON: ${e.name}: ${e.message}. Response text: "${responseText}"`);
                    const error = new Error("Successfully fetched but received non-JSON response.");
                    error.status = response.status;
                    error.data = { rawResponse: responseText };
                    throw error;
                }
            } else {
                responseData = {};
            }

            return responseData;

        } catch (error) {
            console.error(`API request to ${method} ${endpoint} failed after ${MAX_RETRIES} retries:`, error.message, error.status ? `Status: ${error.status}` : '', error.data ? error.data : '');

            // Enhanced error messages
            let userMessage = 'An unexpected error occurred. Please try again.';
            
            if (error.name === 'AbortError' || (error.message && error.message.toLowerCase().includes('timed out'))) {
                userMessage = `The request timed out after ${MAX_RETRIES} attempts. Please check your connection and try again.`;
            } else if (error.status === 502) {
                userMessage = `The server is temporarily unavailable (Bad Gateway). We tried ${MAX_RETRIES} times but could not connect. Please try again in a few minutes.`;
            } else if (error.status === 404) {
                userMessage = 'API endpoint not found. Please ensure the backend server is running and accessible.';
            } else if (error.status === 501) {
                userMessage = 'This feature is not yet implemented on the server.';
            } else if (error.status === 401) {
                userMessage = error.message || 'Your session has expired. Please log in again.';
            } else if (error.status === 403) {
                userMessage = error.data?.message || 'You do not have permission to perform this action.';
            } else if (error.status && error.status >= 400 && error.status < 500) {
                userMessage = error.data?.message || error.data?.error || `An error occurred: ${error.message}`;
            } else if (error.message) {
                if (error.message.includes('Failed to fetch')) {
                    userMessage = 'Cannot connect to the server. Please check your network connection and ensure the backend is running.';
                } else {
                    userMessage = error.message;
                }
            }
            
            const enhancedError = new Error(userMessage);
            enhancedError.originalError = error;
            enhancedError.status = error.status;
            enhancedError.data = error.data;
            throw enhancedError;
        }
    }

    // Authentication methods with corrected endpoints
    async login({ username, password }) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }
        
        console.log(`Attempting login for user: ${username}`);
        try {
            const response = await this.request('POST', '/auth/login', { username, password });
            
            if (response.token) {
                this.setToken(response.token);
                return response;
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.clearToken();
            throw error;
        }
    }

    async register(username, password, character) {
        if (!username || !password || !character) {
            throw new Error('Username, password, and character are required');
        }

        try {
            const response = await this.request('POST', '/auth/register', { username, password, character });
            if (response.token) {
                this.setToken(response.token);
            }
            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    async logout() {
        try {
            // Try to call logout endpoint, but don't fail if it's not implemented
            try {
                await this.request('POST', '/auth/logout');
            } catch (error) {
                if (error.status !== 501 && error.status !== 404) {
                    console.warn('Logout endpoint failed:', error.message);
                }
            }
            this.clearToken();
        } catch (error) {
            console.error('Logout failed:', error);
            // Clear token anyway
            this.clearToken();
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const response = await this.request('GET', '/auth/me');
            return response;
        } catch (error) {
            if (error.status === 401) {
                this.clearToken();
                throw new Error('Session expired. Please log in again.');
            }
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        try {
            const response = await this.request('GET', '/health');
            return response;
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }

    // Hall of Fame methods
    async getHallOfFame(catalogName = null, limit = 10) {
        const params = new URLSearchParams();
        if (catalogName) params.append('catalog', catalogName);
        if (limit) params.append('limit', limit.toString());
        
        const endpoint = `/hall-of-fame${params.toString() ? '?' + params.toString() : ''}`;
        return this.request('GET', endpoint);
    }

    async addHallOfFameEntry(entry) {
        return this.request('POST', '/hall-of-fame', entry);
    }

    // Lobby methods
    async createLobby(requestBody) {
        return this.request('POST', '/lobbies/create', requestBody);
    }

    async joinLobby(code, player) {
        return this.request('POST', `/lobbies/${code}/join`, player);
    }

    async leaveLobby(code, username) {
        return this.request('POST', `/lobbies/${code}/leave`, { username });
    }

    async getLobby(code) {
        return this.request('GET', `/lobbies/${code}`);
    }

    async getLobbies() {
        return this.request('GET', '/lobbies/list');
    }

    async updateLobby(code, updates) {
        return this.request('PUT', `/lobbies/${code}`, updates);
    }
}

// Export a singleton instance
export default new ApiClient();