/**
 * Question Set Uploader Module
 * Handles uploading of question set JSON files
 */

import { SCREENS } from '../utils/constants.js';
import { showToast } from './notifications.js';
import { t } from '../utils/translations.js';

export function initQuestionSetUploader(questionSetsApi, screenManager) {
    let selectedFile = null;

    function init() {
        setupEventListeners();
    }

    function setupEventListeners() {
        // Back button
        const backBtn = document.getElementById('back-to-menu-from-upload');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                screenManager.showScreen(SCREENS.MAIN_MENU);
            });
        }

        // File input
        const fileInput = document.getElementById('question-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelection);
        }

        // File input label (additional click handler for better compatibility)
        const fileLabel = document.querySelector('label[for="question-file-input"]');
        if (fileLabel) {
            fileLabel.addEventListener('click', () => {
                console.log('File label clicked');
                const fileInput = document.getElementById('question-file-input');
                if (fileInput) {
                    fileInput.click();
                }
            });
        }

        // Upload button
        const uploadBtn = document.getElementById('upload-file-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', handleFileUpload);
        }
    }

    function handleFileSelection(event) {
        const file = event.target.files[0];
        const uploadBtn = document.getElementById('upload-file-btn');
        const label = document.querySelector('label[for="question-file-input"]');

        if (file) {
            selectedFile = file;
            
            // Validate file type
            if (!file.name.endsWith('.json')) {
                showToast('Please select a JSON file', 'error');
                resetFileInput();
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                showToast('File too large. Maximum size is 5MB.', 'error');
                resetFileInput();
                return;
            }

            // Update UI
            if (label) {
                label.textContent = `Selected: ${file.name}`;
                label.style.background = 'var(--success)';
                label.style.color = 'white';
                label.style.borderColor = 'var(--success)';
            }

            if (uploadBtn) {
                uploadBtn.disabled = false;
            }

            console.log('File selected:', file.name, 'Size:', file.size, 'bytes');
        } else {
            resetFileInput();
        }
    }

    function resetFileInput() {
        selectedFile = null;
        const uploadBtn = document.getElementById('upload-file-btn');
        const label = document.querySelector('label[for="question-file-input"]');
        const fileInput = document.getElementById('question-file-input');

        if (fileInput) {
            fileInput.value = '';
        }

        if (label) {
            label.textContent = t('UPLOAD_QUESTIONS.CHOOSE_FILE');
            label.style.background = '';
            label.style.color = '';
            label.style.borderColor = '';
        }

        if (uploadBtn) {
            uploadBtn.disabled = true;
        }
    }

    async function handleFileUpload() {
        if (!selectedFile) {
            showToast('Please select a file first', 'warning');
            return;
        }

        const uploadBtn = document.getElementById('upload-file-btn');
        
        try {
            // Update button state
            if (uploadBtn) {
                uploadBtn.disabled = true;
                uploadBtn.textContent = t('UPLOAD_QUESTIONS.UPLOADING');
            }

            console.log('Starting file upload:', selectedFile.name);

            // Validate JSON content before uploading
            const fileContent = await readFileAsText(selectedFile);
            let jsonData;
            
            try {
                jsonData = JSON.parse(fileContent);
            } catch (parseError) {
                throw new Error('Invalid JSON file format');
            }

            // Basic validation
            if (!jsonData.name || !jsonData.questions) {
                throw new Error('JSON file must contain "name" and "questions" fields');
            }

            if (!Array.isArray(jsonData.questions) || jsonData.questions.length === 0) {
                throw new Error('Questions must be a non-empty array');
            }

            // Upload the file
            const result = await questionSetsApi.upload(selectedFile);
            
            console.log('Upload successful:', result);
            showToast(`Question set "${result.name}" uploaded successfully!`, 'success');
            
            // Reset form
            resetFileInput();
            
            // Go back to main menu or question set selection
            screenManager.showScreen(SCREENS.QUESTION_SET_SELECTION);

        } catch (error) {
            console.error('Upload failed:', error);
            
            let errorMessage = 'Failed to upload question set';
            
            if (error.message.includes('already exists')) {
                errorMessage = 'A question set with this name already exists';
            } else if (error.message.includes('Invalid JSON')) {
                errorMessage = 'Invalid JSON file format';
            } else if (error.message.includes('name') && error.message.includes('questions')) {
                errorMessage = 'JSON file must contain "name" and "questions" fields';
            } else if (error.message.includes('Invalid question format')) {
                errorMessage = 'Invalid question format in the file';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showToast(errorMessage, 'error');
            
        } finally {
            // Reset button state
            if (uploadBtn) {
                uploadBtn.disabled = !selectedFile;
                uploadBtn.textContent = t('UPLOAD_QUESTIONS.UPLOAD');
            }
        }
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    function showUploadScreen() {
        screenManager.showScreen(SCREENS.UPLOAD_QUESTIONS);
        resetFileInput();
    }

    return {
        init,
        showUploadScreen,
        resetFileInput
    };
} 