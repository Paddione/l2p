/**
 * Question Sets API Client
 * Handles all API calls related to question sets
 */

import apiClient from './apiClient.js';

export const questionSetsApi = {
    /**
     * Get all available question sets
     * @returns {Promise<Array>} - Array of question set summaries
     */
    async getAll() {
        return await apiClient.request('GET', '/question-sets');
    },

    /**
     * Get user's own question sets
     * @returns {Promise<Array>} - Array of user's question sets
     */
    async getMy() {
        return await apiClient.request('GET', '/question-sets/my');
    },

    /**
     * Get a specific question set by ID
     * @param {number} id - Question set ID
     * @returns {Promise<Object>} - Question set with questions
     */
    async getById(id) {
        return await apiClient.request('GET', `/question-sets/${id}`);
    },

    /**
     * Create a new question set
     * @param {Object} questionSetData - Question set data
     * @returns {Promise<Object>} - Created question set
     */
    async create(questionSetData) {
        return await apiClient.request('POST', '/question-sets', questionSetData);
    },

    /**
     * Upload and create question set from file
     * @param {File|Blob} file - JSON file or blob containing question set
     * @returns {Promise<Object>} - Created question set
     */
    async upload(file) {
        console.log('Upload called with file:', file);
        console.log('File details:', {
            name: file.name || 'blob',
            size: file.size,
            type: file.type,
            lastModified: file.lastModified || 'N/A',
            constructor: file.constructor.name
        });

        // Check if we have a valid token
        const token = apiClient.getToken();
        console.log('Auth token available:', !!token);
        if (!token) {
            throw new Error('Authentication required. Please log in first.');
        }

        const formData = new FormData();
        
        // Handle both File objects and Blob objects
        if (file instanceof File) {
            formData.append('file', file);
        } else if (file instanceof Blob) {
            // For Blob objects, we need to provide a filename
            formData.append('file', file, 'question-set.json');
        } else {
            throw new Error('Invalid file type. Expected File or Blob object.');
        }

        // Debug: Log FormData contents
        console.log('FormData created');
        for (let [key, value] of formData.entries()) {
            console.log('FormData entry:', key, value);
            if (value instanceof File || value instanceof Blob) {
                console.log('File/Blob details in FormData:', {
                    name: value.name || 'blob',
                    size: value.size,
                    type: value.type
                });
            }
        }

        return await apiClient.request('POST', '/question-sets/upload', formData, {}, true);
    },

    /**
     * Update a question set
     * @param {number} id - Question set ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} - Updated question set
     */
    async update(id, updates) {
        return await apiClient.request('PUT', `/question-sets/${id}`, updates);
    },

    /**
     * Delete a question set
     * @param {number} id - Question set ID
     * @returns {Promise<Object>} - Success message
     */
    async delete(id) {
        return await apiClient.request('DELETE', `/question-sets/${id}`);
    },

    /**
     * Set question set for a lobby
     * @param {string} lobbyCode - Lobby code
     * @param {number} questionSetId - Question set ID
     * @returns {Promise<Object>} - Updated lobby data
     */
    async setForLobby(lobbyCode, questionSetId) {
        return await apiClient.request('POST', `/lobbies/${lobbyCode}/question-set`, {
            question_set_id: questionSetId
        });
    }
}; 