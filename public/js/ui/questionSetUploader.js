/**
 * Enhanced Question Set Uploader Module
 * Handles uploading of question set JSON files with comprehensive validation and progress tracking
 */

import { SCREENS } from '../utils/constants.js';
import { showToast } from './notifications.js';
import { t } from '../utils/translations.js';

export function initQuestionSetUploader(questionSetsApi, screenManager, apiClient) {
    let selectedFile = null;
    let uploadProgress = null;

    function init() {
        setupEventListeners();
        createProgressIndicator();
        resetFileInput();
    }

    function createProgressIndicator() {
        // Create progress bar container if it doesn't exist
        const uploadContainer = document.querySelector('.upload-container');
        if (uploadContainer && !document.getElementById('upload-progress-container')) {
            const progressHTML = `
                <div id="upload-progress-container" class="upload-progress-container" style="display: none;">
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar">
                            <div id="upload-progress-bar" class="progress-fill"></div>
                        </div>
                        <div id="upload-progress-text" class="progress-text">0%</div>
                    </div>
                    <div id="upload-status-text" class="upload-status">Preparing upload...</div>
                </div>
            `;
            uploadContainer.insertAdjacentHTML('beforeend', progressHTML);
        }
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

    /**
     * Enhanced file validation with detailed error reporting
     * @param {File} file - The file to validate
     * @returns {Object} - Validation result with details
     */
    function validateFile(file) {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };

        // File type validation
        const validExtensions = ['.json'];
        const validMimeTypes = ['application/json', 'text/json'];
        
        const hasValidExtension = file.name && validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext));
        const hasValidMimeType = validMimeTypes.includes(file.type);
        
        if (!hasValidExtension && !hasValidMimeType) {
            validation.errors.push('File must be a JSON file (.json extension)');
            validation.valid = false;
        }

        // File size validation with more granular limits
        const sizes = {
            warning: 1 * 1024 * 1024,  // 1MB warning
            error: 5 * 1024 * 1024     // 5MB error
        };

        if (file.size > sizes.error) {
            validation.errors.push(`File too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(sizes.error)}.`);
            validation.valid = false;
        } else if (file.size > sizes.warning) {
            validation.warnings.push(`Large file detected (${formatFileSize(file.size)}). Upload may take longer.`);
        }

        // Empty file check
        if (file.size === 0) {
            validation.errors.push('File is empty');
            validation.valid = false;
        }

        return validation;
    }

    /**
     * Comprehensive JSON content validation
     * @param {Object} jsonData - Parsed JSON data
     * @returns {Object} - Validation result with detailed feedback
     */
    function validateQuestionSetData(jsonData) {
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            stats: {}
        };

        try {
            // Required fields validation
            if (!jsonData.name || typeof jsonData.name !== 'string' || jsonData.name.trim().length === 0) {
                validation.errors.push('Question set must have a valid "name" field');
                validation.valid = false;
            } else {
                // Name length validation
                if (jsonData.name.length > 100) {
                    validation.warnings.push('Question set name is very long (>100 characters)');
                }
                validation.stats.name = jsonData.name.trim();
            }

            if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
                validation.errors.push('Question set must have a "questions" array');
                validation.valid = false;
            } else if (jsonData.questions.length === 0) {
                validation.errors.push('Question set must contain at least one question');
                validation.valid = false;
            } else {
                validation.stats.questionCount = jsonData.questions.length;
                
                // Validate individual questions
                const questionValidation = validateQuestions(jsonData.questions);
                validation.errors.push(...questionValidation.errors);
                validation.warnings.push(...questionValidation.warnings);
                validation.stats = { ...validation.stats, ...questionValidation.stats };
                
                if (questionValidation.errors.length > 0) {
                    validation.valid = false;
                }
            }

            // Optional fields validation
            if (jsonData.description && typeof jsonData.description !== 'string') {
                validation.warnings.push('Description should be a string');
            }

            if (jsonData.category && typeof jsonData.category !== 'string') {
                validation.warnings.push('Category should be a string');
            }

            // Check for unexpected fields
            const expectedFields = ['name', 'description', 'category', 'questions', 'author', 'version', 'tags'];
            const unexpectedFields = Object.keys(jsonData).filter(key => !expectedFields.includes(key));
            if (unexpectedFields.length > 0) {
                validation.warnings.push(`Unexpected fields found: ${unexpectedFields.join(', ')}`);
            }

        } catch (error) {
            validation.errors.push(`Validation error: ${error.message}`);
            validation.valid = false;
        }

        return validation;
    }

    /**
     * Validate individual questions
     * @param {Array} questions - Array of question objects
     * @returns {Object} - Validation result
     */
    function validateQuestions(questions) {
        const validation = {
            errors: [],
            warnings: [],
            stats: {
                multipleChoice: 0,
                trueFalse: 0,
                invalidQuestions: []
            }
        };

        questions.forEach((question, index) => {
            const qIndex = index + 1;
            
            // Required fields
            if (!question.question || typeof question.question !== 'string' || question.question.trim().length === 0) {
                validation.errors.push(`Question ${qIndex}: Missing or invalid question text`);
                validation.stats.invalidQuestions.push(qIndex);
                return;
            }

            if (!question.type || !['multiple_choice', 'true_false'].includes(question.type)) {
                validation.errors.push(`Question ${qIndex}: Invalid type. Must be 'multiple_choice' or 'true_false'`);
                validation.stats.invalidQuestions.push(qIndex);
                return;
            }

            // Type-specific validation
            if (question.type === 'multiple_choice') {
                validation.stats.multipleChoice++;
                
                if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
                    validation.errors.push(`Question ${qIndex}: Multiple choice questions must have at least 2 options`);
                    validation.stats.invalidQuestions.push(qIndex);
                } else {
                    // Check for empty options
                    const emptyOptions = question.options.some(opt => !opt || typeof opt !== 'string' || opt.trim().length === 0);
                    if (emptyOptions) {
                        validation.errors.push(`Question ${qIndex}: All options must be non-empty strings`);
                    }
                    
                    // Check answer validity
                    if (typeof question.correct_answer !== 'number' || 
                        question.correct_answer < 0 || 
                        question.correct_answer >= question.options.length) {
                        validation.errors.push(`Question ${qIndex}: Invalid correct_answer. Must be a valid option index (0-${question.options.length - 1})`);
                    }
                }
            } else if (question.type === 'true_false') {
                validation.stats.trueFalse++;
                
                if (typeof question.correct_answer !== 'boolean' && 
                    question.correct_answer !== 0 && 
                    question.correct_answer !== 1) {
                    validation.errors.push(`Question ${qIndex}: True/false questions must have correct_answer as boolean or 0/1`);
                }
            }

            // Optional fields validation
            if (question.explanation && typeof question.explanation !== 'string') {
                validation.warnings.push(`Question ${qIndex}: Explanation should be a string`);
            }

            if (question.difficulty && !['easy', 'medium', 'hard'].includes(question.difficulty)) {
                validation.warnings.push(`Question ${qIndex}: Difficulty should be 'easy', 'medium', or 'hard'`);
            }
        });

        return validation;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showValidationResults(validation) {
        if (validation.errors.length > 0) {
            showToast(`Validation failed: ${validation.errors[0]}`, 'error');
            console.error('Validation errors:', validation.errors);
        }
        
        if (validation.warnings.length > 0) {
            console.warn('Validation warnings:', validation.warnings);
            // Show first warning as info
            showToast(`Warning: ${validation.warnings[0]}`, 'warning');
        }

        if (validation.stats && validation.valid) {
            console.log('Question set statistics:', validation.stats);
            const { questionCount, multipleChoice, trueFalse, name } = validation.stats;
            showToast(`"${name}" validated: ${questionCount} questions (${multipleChoice} MC, ${trueFalse} T/F)`, 'info');
        }
    }

    function showProgress(visible = true) {
        const progressContainer = document.getElementById('upload-progress-container');
        if (progressContainer) {
            progressContainer.style.display = visible ? 'block' : 'none';
        }
    }

    function updateProgress(percent, status = '') {
        const progressBar = document.getElementById('upload-progress-bar');
        const progressText = document.getElementById('upload-progress-text');
        const statusText = document.getElementById('upload-status-text');

        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }

        if (progressText) {
            progressText.textContent = `${Math.round(percent)}%`;
        }

        if (statusText && status) {
            statusText.textContent = status;
        }
    }

    async function handleFileSelection(event) {
        const file = event.target.files[0];
        const uploadBtn = document.getElementById('upload-file-btn');
        const label = document.querySelector('label[for="question-file-input"]');

        if (file) {
            console.log('File selected:', file.name, 'Size:', formatFileSize(file.size));
            
            // Validate file
            const fileValidation = validateFile(file);
            
            if (!fileValidation.valid) {
                showValidationResults(fileValidation);
                resetFileInput();
                return;
            }

            // Show warnings but allow selection
            if (fileValidation.warnings.length > 0) {
                showValidationResults(fileValidation);
            }

            selectedFile = file;

            // Check authentication before enabling upload
            const token = apiClient.getToken();
            if (!token) {
                showToast('Please log in first to upload question sets', 'error');
                resetFileInput();
                return;
            }

            // Perform quick JSON validation
            try {
                updateProgress(0, 'Validating file content...');
                showProgress(true);
                
                const fileContent = await readFileAsText(file);
                let jsonData;
                
                try {
                    jsonData = JSON.parse(fileContent);
                } catch (parseError) {
                    showProgress(false);
                    showToast('Invalid JSON file format', 'error');
                    resetFileInput();
                    return;
                }

                // Validate question set structure
                const contentValidation = validateQuestionSetData(jsonData);
                showProgress(false);
                
                if (!contentValidation.valid) {
                    showValidationResults(contentValidation);
                    resetFileInput();
                    return;
                }

                // Show validation results (including warnings and stats)
                showValidationResults(contentValidation);

                // Update UI for successful validation
                if (label) {
                    label.textContent = `✓ ${file.name} (${formatFileSize(file.size)})`;
                    label.style.background = 'var(--success)';
                    label.style.color = 'white';
                    label.style.borderColor = 'var(--success)';
                }

                if (uploadBtn) {
                    uploadBtn.disabled = false;
                    uploadBtn.style.opacity = '1';
                    uploadBtn.style.cursor = 'pointer';
                }

            } catch (error) {
                showProgress(false);
                console.error('File validation error:', error);
                showToast('Failed to validate file: ' + error.message, 'error');
                resetFileInput();
            }
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
            uploadBtn.style.opacity = '0.65';
            uploadBtn.style.cursor = 'not-allowed';
        }

        showProgress(false);
    }

    async function handleFileUpload() {
        if (!selectedFile) {
            showToast('Please select a file first', 'warning');
            return;
        }

        // Check authentication before upload
        const token = apiClient.getToken();
        if (!token) {
            showToast('Please log in first to upload question sets', 'error');
            return;
        }

        const uploadBtn = document.getElementById('upload-file-btn');
        
        try {
            // Update button state
            if (uploadBtn) {
                uploadBtn.disabled = true;
                uploadBtn.textContent = t('UPLOAD_QUESTIONS.UPLOADING');
                uploadBtn.style.opacity = '0.65';
                uploadBtn.style.cursor = 'not-allowed';
            }

            // Show progress
            showProgress(true);
            updateProgress(0, 'Starting upload...');

            console.log('Starting file upload:', selectedFile.name);

            // Create progress tracking
            const progressSteps = [
                { percent: 10, status: 'Preparing file...' },
                { percent: 30, status: 'Validating content...' },
                { percent: 50, status: 'Uploading to server...' },
                { percent: 80, status: 'Processing on server...' },
                { percent: 100, status: 'Upload complete!' }
            ];

            // Simulate progress for user feedback
            for (let i = 0; i < progressSteps.length - 2; i++) {
                updateProgress(progressSteps[i].percent, progressSteps[i].status);
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Final validation before upload
            const fileContent = await readFileAsText(selectedFile);
            let jsonData;
            
            try {
                jsonData = JSON.parse(fileContent);
            } catch (parseError) {
                throw new Error('Invalid JSON file format');
            }

            // Comprehensive validation
            const validation = validateQuestionSetData(jsonData);
            if (!validation.valid) {
                throw new Error(`Validation failed: ${validation.errors[0]}`);
            }

            updateProgress(50, 'Uploading to server...');

            // Upload the file
            const result = await questionSetsApi.upload(selectedFile);
            
            updateProgress(100, 'Upload complete!');
            
            console.log('Upload successful:', result);
            showToast(`Question set "${result.name}" uploaded successfully!`, 'success');
            
            // Reset form after short delay
            setTimeout(() => {
                showProgress(false);
                resetFileInput();
            }, 1500);
            
            // Go back to question set selection
            setTimeout(() => {
                screenManager.showScreen(SCREENS.QUESTION_SET_SELECTION);
            }, 2000);

        } catch (error) {
            console.error('Upload failed:', error);
            showProgress(false);
            
            let errorMessage = 'Failed to upload question set';
            
            if (error.message.includes('already exists')) {
                errorMessage = 'A question set with this name already exists';
            } else if (error.message.includes('Invalid JSON')) {
                errorMessage = 'Invalid JSON file format';
            } else if (error.message.includes('Validation failed')) {
                errorMessage = error.message;
            } else if (error.message.includes('name') && error.message.includes('questions')) {
                errorMessage = 'JSON file must contain "name" and "questions" fields';
            } else if (error.message.includes('Invalid question format')) {
                errorMessage = 'Invalid question format in the file';
            } else if (error.message.includes('Authentication')) {
                errorMessage = 'Authentication failed. Please log in again.';
            } else if (error.message.includes('too large')) {
                errorMessage = 'File is too large. Please reduce the file size.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Network error occurred. Please check your connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showToast(errorMessage, 'error');
            
        } finally {
            // Reset button state
            if (uploadBtn) {
                const hasFile = selectedFile !== null;
                const isAuthenticated = apiClient.getToken() !== null;
                uploadBtn.disabled = !(hasFile && isAuthenticated);
                uploadBtn.textContent = t('UPLOAD_QUESTIONS.UPLOAD');
                uploadBtn.style.opacity = (hasFile && isAuthenticated) ? '1' : '0.65';
                uploadBtn.style.cursor = (hasFile && isAuthenticated) ? 'pointer' : 'not-allowed';
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