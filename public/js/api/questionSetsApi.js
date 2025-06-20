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
        if (!file) {
            throw new Error('No file provided');
        }

        // Validate file type
        if (file.name && !file.name.endsWith('.json') && file.type !== 'application/json') {
            throw new Error('File must be a JSON file');
        } else if (!file.name && file.type !== 'application/json') {
            throw new Error('File must be a JSON file');
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new Error('File size must be less than 10MB');
        }

        // Check if we have a valid token
        const token = apiClient.getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        try {
            // Create FormData for multipart upload
            const formData = new FormData();
            formData.append('file', file);

            // Validate FormData
            if (!formData.has('file')) {
                throw new Error('Failed to prepare file for upload');
            }

            // Use apiClient for the upload request
            const result = await apiClient.request('POST', '/question-sets/upload', formData, {}, true);

            return result;
        } catch (error) {
            throw new Error('Failed to upload file: ' + error.message);
        }
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