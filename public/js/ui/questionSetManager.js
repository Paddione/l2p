/**
 * Question Set Manager UI Component
 * Handles question set selection, upload, and management
 */

import { questionSetsApi } from '../api/questionSetsApi.js';
import { showNotification } from './notifications.js';
import apiClient from '../api/apiClient.js';
import { t } from '../utils/translations.js';

export function initQuestionSetManager() {
    let questionSets = [];
    let selectedQuestionSet = null;

    /**
     * Create question set selection modal
     */
    function createQuestionSetModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay question-set-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${t('QUESTION_SETS.TITLE')}</h2>
                    <button class="close-modal" onclick="this.closest('.modal-overlay').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="question-set-tabs">
                        <button class="tab-btn active" data-tab="available">${t('QUESTION_SET_MODAL.AVAILABLE_SETS')}</button>
                        <button class="tab-btn" data-tab="upload">${t('QUESTION_SET_MODAL.UPLOAD_NEW')}</button>
                        <button class="tab-btn" data-tab="manage">${t('QUESTION_SET_MODAL.MY_SETS')}</button>
                    </div>
                    
                    <div class="tab-content" id="available-tab">
                        <div class="question-sets-list" id="available-sets">
                            <div class="loading">${t('QUESTION_SETS.LOADING')}</div>
                        </div>
                    </div>
                    
                    <div class="tab-content hidden" id="upload-tab">
                        <div class="upload-section">
                            <h3>${t('UPLOAD_QUESTIONS.TITLE')}</h3>
                            <p>${t('QUESTION_SET_MODAL.UPLOAD_DESCRIPTION')}</p>
                            
                            <!-- JSON Text Input Section -->
                            <div class="json-input-section" style="margin-bottom: 20px;">
                                <h4>${t('QUESTION_SET_MODAL.OPTION_1_TITLE')}</h4>
                                <textarea id="json-text-input" placeholder="${t('QUESTION_SET_MODAL.JSON_PLACEHOLDER')}" style="width: 100%; height: 200px; font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; resize: vertical;">{
  "name": "Sample Quiz Questions",
  "description": "A comprehensive example of different question types",
  "is_public": false,
  "questions": [
    {
      "question": "What is the capital of France?",
      "type": "multiple_choice",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correct": 1
    },
    {
      "question": "Which planet is known as the Red Planet?",
      "type": "multiple_choice",
      "options": ["Venus", "Mars", "Jupiter", "Saturn"],
      "correct": 1
    },
    {
      "question": "The Great Wall of China is visible from space.",
      "type": "true_false",
      "correct": false
    },
    {
      "question": "Water boils at 100°C at sea level.",
      "type": "true_false",
      "correct": true
    }
  ]
}</textarea>
                                <div style="margin-top: 10px;">
                                    <button id="upload-json-text-btn" class="btn btn-primary">${t('QUESTION_SET_MODAL.UPLOAD_JSON_TEXT')}</button>
                                    <button id="clear-json-btn" class="btn btn-secondary" style="margin-left: 10px;">${t('QUESTION_SET_MODAL.CLEAR')}</button>
                                </div>
                            </div>
                            
                            <!-- File Upload Section -->
                            <div class="file-upload-section">
                                <h4>${t('QUESTION_SET_MODAL.OPTION_2_TITLE')}</h4>
                                <p>${t('QUESTION_SET_MODAL.FILE_UPLOAD_DESCRIPTION')}</p>
                                <div class="file-upload">
                                    <input type="file" id="question-set-file" accept=".json" />
                                    <button id="upload-btn" class="btn btn-primary" disabled>${t('UPLOAD_QUESTIONS.UPLOAD')}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tab-content hidden" id="manage-tab">
                        <div class="my-sets-list" id="my-sets">
                            <div class="loading">${t('QUESTION_SET_MODAL.LOADING_MY_SETS')}</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">${t('QUESTION_SET_MODAL.CANCEL')}</button>
                    <button class="btn btn-primary" id="select-question-set" disabled>${t('QUESTION_SETS.SELECT')}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setupModalEventListeners(modal);
        return modal;
    }

    /**
     * Setup event listeners for the modal
     */
    function setupModalEventListeners(modal) {
        // Tab switching
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                switchTab(modal, tabName);
            });
        });

        // File upload
        const uploadBtn = modal.querySelector('#upload-btn');
        const fileInput = modal.querySelector('#question-set-file');
        
        // JSON text upload
        const uploadJsonTextBtn = modal.querySelector('#upload-json-text-btn');
        const jsonTextInput = modal.querySelector('#json-text-input');
        const clearJsonBtn = modal.querySelector('#clear-json-btn');
        
        // Clear JSON text button
        if (clearJsonBtn) {
            clearJsonBtn.addEventListener('click', () => {
                jsonTextInput.value = `{
  "name": "Sample Quiz Questions",
  "description": "A comprehensive example of different question types",
  "is_public": false,
  "questions": [
    {
      "question": "What is the capital of France?",
      "type": "multiple_choice",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correct": 1
    },
    {
      "question": "Which planet is known as the Red Planet?",
      "type": "multiple_choice",
      "options": ["Venus", "Mars", "Jupiter", "Saturn"],
      "correct": 1
    },
    {
      "question": "The Great Wall of China is visible from space.",
      "type": "true_false",
      "correct": false
    },
    {
      "question": "Water boils at 100°C at sea level.",
      "type": "true_false",
      "correct": true
    }
  ]
}`;
            });
        }
        
        // Upload JSON text button
        if (uploadJsonTextBtn) {
            uploadJsonTextBtn.addEventListener('click', async () => {
                const jsonText = jsonTextInput.value.trim();
                
                if (!jsonText) {
                    showNotification('Please enter JSON data', 'error');
                    return;
                }

                // Verify authentication before upload
                const token = apiClient.getToken();
                if (!token) {
                    showNotification('Please log in first to upload question sets', 'error');
                    return;
                }

                try {
                    uploadJsonTextBtn.disabled = true;
                    uploadJsonTextBtn.textContent = t('UPLOAD_QUESTIONS.UPLOADING');
                    
                    // Validate JSON syntax first
                    let jsonData;
                    try {
                        jsonData = JSON.parse(jsonText);
                    } catch (parseError) {
                        showNotification('Invalid JSON format: ' + parseError.message, 'error');
                        return;
                    }
                    
                    console.log('Starting JSON text upload process...');
                    
                    // Create a blob from the JSON string and upload it
                    const blob = new Blob([jsonText], { type: 'application/json' });
                    const result = await questionSetsApi.upload(blob);
                    
                    console.log('JSON text upload successful:', result);
                    showNotification('Question set uploaded successfully!', 'success');
                    
                    // Refresh the lists
                    await loadAvailableQuestionSets(modal);
                    await loadMyQuestionSets(modal);
                    
                    // Switch to available tab
                    switchTab(modal, 'available');
                    
                } catch (error) {
                    console.error('JSON text upload error:', error);
                    let errorMessage = 'Failed to upload question set';
                    
                    if (error.message.includes('Authentication')) {
                        errorMessage = 'Authentication failed. Please log in again.';
                    } else if (error.message.includes('No file uploaded')) {
                        errorMessage = 'File upload failed. Please try again.';
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    
                    showNotification(errorMessage, 'error');
                } finally {
                    uploadJsonTextBtn.disabled = false;
                    uploadJsonTextBtn.textContent = t('UPLOAD_QUESTIONS.UPLOAD');
                }
            });
        }
        
        // File input change handler to enable/disable upload button
        if (fileInput) {
            fileInput.addEventListener('change', () => {
                const file = fileInput.files[0];
                const token = apiClient.getToken();
                if (uploadBtn) {
                    uploadBtn.disabled = !(file && token);
                    uploadBtn.style.opacity = (file && token) ? '1' : '0.65';
                    uploadBtn.style.cursor = (file && token) ? 'pointer' : 'not-allowed';
                }
            });
        }

        uploadBtn.addEventListener('click', async () => {
            const file = fileInput.files[0];
            if (!file) {
                showNotification('Please select a file to upload', 'error');
                return;
            }

            // Validate file type
            if (!file.name.toLowerCase().endsWith('.json')) {
                showNotification('Please select a JSON file', 'error');
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('File too large. Maximum size is 5MB.', 'error');
                return;
            }

            // Verify authentication before upload
            const token = apiClient.getToken();
            if (!token) {
                showNotification('Please log in first to upload question sets', 'error');
                return;
            }

            try {
                uploadBtn.disabled = true;
                uploadBtn.textContent = t('UPLOAD_QUESTIONS.UPLOADING');
                
                console.log('Starting file upload process...');
                console.log('File details:', {
                    name: file.name,
                    size: file.size,
                    type: file.type
                });
                
                const result = await questionSetsApi.upload(file);
                console.log('File upload successful:', result);
                showNotification('Question set uploaded successfully!', 'success');
                
                // Refresh the lists
                await loadAvailableQuestionSets(modal);
                await loadMyQuestionSets(modal);
                
                // Switch to available tab
                switchTab(modal, 'available');
                
            } catch (error) {
                console.error('File upload error:', error);
                let errorMessage = 'Failed to upload question set';
                
                if (error.message.includes('Authentication')) {
                    errorMessage = 'Authentication failed. Please log in again.';
                } else if (error.message.includes('No file uploaded')) {
                    errorMessage = 'File upload failed. Please try again.';
                } else if (error.message.includes('already exists')) {
                    errorMessage = 'A question set with this name already exists';
                } else if (error.message.includes('Invalid JSON')) {
                    errorMessage = 'Invalid JSON file format';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                showNotification(errorMessage, 'error');
            } finally {
                const hasFile = fileInput.files[0];
                const isAuthenticated = apiClient.getToken();
                uploadBtn.disabled = !(hasFile && isAuthenticated);
                uploadBtn.textContent = t('UPLOAD_QUESTIONS.UPLOAD');
                uploadBtn.style.opacity = (hasFile && isAuthenticated) ? '1' : '0.65';
                uploadBtn.style.cursor = (hasFile && isAuthenticated) ? 'pointer' : 'not-allowed';
            }
        });

        // Select button
        const selectBtn = modal.querySelector('#select-question-set');
        selectBtn.addEventListener('click', () => {
            if (selectedQuestionSet) {
                modal.style.display = 'none';
                // Trigger custom event with selected question set
                document.dispatchEvent(new CustomEvent('questionSetSelected', {
                    detail: selectedQuestionSet
                }));
            }
        });
    }

    /**
     * Switch between tabs
     */
    function switchTab(modal, tabName) {
        // Update tab buttons
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        modal.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('hidden', content.id !== `${tabName}-tab`);
        });

        // Load content for the selected tab
        if (tabName === 'available') {
            loadAvailableQuestionSets(modal);
        } else if (tabName === 'manage') {
            loadMyQuestionSets(modal);
        }
    }

    /**
     * Load available question sets
     */
    async function loadAvailableQuestionSets(modal) {
        const container = modal.querySelector('#available-sets');
        container.innerHTML = '<div class="loading">' + t('STATUS.LOADING_QUESTION_SETS') + '</div>';

        try {
            questionSets = await questionSetsApi.getAll();
            renderQuestionSetsList(container, questionSets, modal);
        } catch (error) {
            console.error('Failed to load question sets:', error);
            container.innerHTML = '<div class="error">' + t('STATUS.FAILED_TO_LOAD_QUESTION_SETS') + '</div>';
        }
    }

    /**
     * Load user's question sets
     */
    async function loadMyQuestionSets(modal) {
        const container = modal.querySelector('#my-sets');
        container.innerHTML = '<div class="loading">' + t('STATUS.LOADING_QUESTION_SETS') + '</div>';

        try {
            const myQuestionSets = await questionSetsApi.getMy();
            renderQuestionSetsList(container, myQuestionSets, modal, true);
        } catch (error) {
            console.error('Failed to load user question sets:', error);
            container.innerHTML = '<div class="error">' + t('STATUS.FAILED_TO_LOAD_QUESTION_SETS') + '</div>';
        }
    }

    /**
     * Render question sets list
     */
    function renderQuestionSetsList(container, sets, modal, showManageButtons = false) {
        if (sets.length === 0) {
            container.innerHTML = '<div class="empty">' + t('STATUS.NO_QUESTION_SETS_AVAILABLE') + '</div>';
            return;
        }

        container.innerHTML = sets.map(set => `
            <div class="question-set-item" data-id="${set.id}">
                <div class="question-set-info">
                    <h4>${set.name}</h4>
                    <p>${set.description || 'No description'}</p>
                    <div class="question-set-meta">
                        <span class="question-count">${set.question_count} questions</span>
                        <span class="created-by">by ${set.created_by}</span>
                        ${set.is_public ? '<span class="public-badge">Public</span>' : '<span class="private-badge">Private</span>'}
                    </div>
                </div>
                <div class="question-set-actions">
                    <button class="btn btn-sm btn-primary select-set" data-id="${set.id}">Select</button>
                    ${showManageButtons ? `
                        <button class="btn btn-sm btn-secondary edit-set" data-id="${set.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-set" data-id="${set.id}">Delete</button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.select-set').forEach(btn => {
            btn.addEventListener('click', () => {
                const setId = parseInt(btn.dataset.id);
                const questionSet = sets.find(s => s.id === setId);
                selectQuestionSet(questionSet, modal);
            });
        });

        if (showManageButtons) {
            container.querySelectorAll('.delete-set').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const setId = parseInt(btn.dataset.id);
                    const questionSet = sets.find(s => s.id === setId);
                    
                    if (confirm(t('QUESTION_SETS.CONFIRM_DELETE', { name: questionSet.name }))) {
                        try {
                            await questionSetsApi.delete(setId);
                            showNotification('Question set deleted successfully', 'success');
                            loadMyQuestionSets(modal);
                            loadAvailableQuestionSets(modal);
                        } catch (error) {
                            showNotification(error.message || 'Failed to delete question set', 'error');
                        }
                    }
                });
            });
        }
    }

    /**
     * Select a question set
     */
    function selectQuestionSet(questionSet, modal) {
        selectedQuestionSet = questionSet;
        
        // Update UI to show selection
        modal.querySelectorAll('.question-set-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = modal.querySelector(`[data-id="${questionSet.id}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        // Enable select button
        const selectBtn = modal.querySelector('#select-question-set');
        selectBtn.disabled = false;
        selectBtn.textContent = t('QUESTION_SETS.SELECT');
    }

    /**
     * Show question set selection modal
     */
    function showQuestionSetModal(defaultTab = 'available') {
        console.log('showQuestionSetModal called with defaultTab:', defaultTab);
        
        // Check if user is authenticated before showing modal
        const token = apiClient.getToken();
        if (!token) {
            showNotification('Please log in first to manage question sets', 'error');
            return;
        }
        
        let modal = document.querySelector('.question-set-modal');
        if (!modal) {
            console.log('Creating new modal');
            modal = createQuestionSetModal();
        } else {
            console.log('Using existing modal');
        }
        
        console.log('Setting modal display to flex');
        modal.style.display = 'flex';
        selectedQuestionSet = null;
        
        // Reset select button
        const selectBtn = modal.querySelector('#select-question-set');
        if (selectBtn) {
            selectBtn.disabled = true;
            selectBtn.textContent = 'Select';
        }
        
        // Switch to the specified tab
        console.log('Switching to tab:', defaultTab);
        switchTab(modal, defaultTab);
    }

    return {
        showQuestionSetModal,
        getSelectedQuestionSet: () => selectedQuestionSet
    };
} 