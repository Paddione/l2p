/**
 * Question Set Selector Module
 * Handles selection of question sets before lobby creation
 */

import { SCREENS } from '../utils/constants.js';
import { showToast } from './notifications.js';
import { t } from '../utils/translations.js';

export function initQuestionSetSelector(questionSetsApi, screenManager, lobbyManager, storage) {
    let selectedQuestionSet = null;
    let selectedQuestionCount = null;
    let currentUser = null;

    function init() {
        setupEventListeners();
    }

    function setupEventListeners() {
        // Back button
        const backBtn = document.getElementById('back-to-menu-from-selection');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                screenManager.showScreen(SCREENS.MAIN_MENU);
            });
        }

        // Upload new question set button
        const uploadBtn = document.getElementById('upload-new-question-set-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                screenManager.showScreen(SCREENS.UPLOAD_QUESTIONS);
            });
        }

        // Create game with selected set button
        const createBtn = document.getElementById('select-and-create-btn');
        if (createBtn) {
            createBtn.addEventListener('click', handleCreateGameWithQuestionSet);
        }

        // Question count input
        const questionCountInput = document.getElementById('question-count-input');
        if (questionCountInput) {
            questionCountInput.addEventListener('input', handleQuestionCountChange);
            questionCountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleCreateGameWithQuestionSet();
                }
            });
        }
    }

    async function showQuestionSetSelection() {
        try {
            currentUser = await storage.getCurrentUser();
            if (!currentUser) {
                throw new Error('Please log in first');
            }

            screenManager.showScreen(SCREENS.QUESTION_SET_SELECTION);
            await loadAndDisplayQuestionSets();
        } catch (error) {
            console.error('Failed to show question set selection:', error);
            showToast(error.message || 'Failed to load question sets', 'error');
            screenManager.showScreen(SCREENS.MAIN_MENU);
        }
    }

    async function loadAndDisplayQuestionSets() {
        const listContainer = document.getElementById('question-sets-list');
        const createBtn = document.getElementById('select-and-create-btn');
        
        if (!listContainer) return;

        try {
            listContainer.innerHTML = '<div class="loading">Loading question sets...</div>';
            
            const questionSets = await questionSetsApi.getAll();
            
            if (questionSets.length === 0) {
                listContainer.innerHTML = `
                    <div class="empty">
                        <p>No question sets available.</p>
                        <p>Upload a new question set to get started!</p>
                    </div>
                `;
                return;
            }

            listContainer.innerHTML = '';
            
            questionSets.forEach(questionSet => {
                const card = createQuestionSetCard(questionSet);
                listContainer.appendChild(card);
            });

            // Update create button state
            if (createBtn) {
                createBtn.disabled = !selectedQuestionSet;
            }

        } catch (error) {
            console.error('Failed to load question sets:', error);
            listContainer.innerHTML = `
                <div class="error">
                    Failed to load question sets. Please try again.
                </div>
            `;
        }
    }

    function createQuestionSetCard(questionSet) {
        const card = document.createElement('div');
        card.className = 'question-set-card';
        card.dataset.questionSetId = questionSet.id;

        card.innerHTML = `
            <div class="question-set-card-info">
                <h4>${escapeHtml(questionSet.name)}</h4>
                ${questionSet.description ? `<p>${escapeHtml(questionSet.description)}</p>` : ''}
                <div class="question-set-card-meta">
                    <span>📝 ${questionSet.question_count} questions</span>
                    <span>👤 ${escapeHtml(questionSet.created_by)}</span>
                    <span>🌐 Public</span>
                </div>
            </div>
            <div class="question-set-card-badge">
                <span>${t('QUESTION_SETS.SELECT')}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            selectQuestionSet(questionSet, card);
        });

        return card;
    }

    function selectQuestionSet(questionSet, cardElement) {
        // Clear previous selection
        document.querySelectorAll('.question-set-card.selected').forEach(card => {
            card.classList.remove('selected');
        });

        // Select new question set
        cardElement.classList.add('selected');
        selectedQuestionSet = questionSet;

        // Show question count section
        showQuestionCountSection(questionSet);

        // Update create button - disable until question count is set
        updateCreateButton();

        console.log('Selected question set:', selectedQuestionSet);
    }

    function showQuestionCountSection(questionSet) {
        const section = document.getElementById('question-count-section');
        const maxQuestionsSpan = document.getElementById('max-questions');
        const questionCountInput = document.getElementById('question-count-input');

        if (section && maxQuestionsSpan && questionCountInput) {
            maxQuestionsSpan.textContent = questionSet.question_count;
            questionCountInput.max = questionSet.question_count;
            questionCountInput.value = '';
            section.style.display = 'block';
            
            // Set focus to input for better UX
            setTimeout(() => questionCountInput.focus(), 100);
        }
    }

    function handleQuestionCountChange() {
        const questionCountInput = document.getElementById('question-count-input');
        const validationDiv = document.getElementById('question-count-validation');
        
        if (!questionCountInput || !selectedQuestionSet) return;

        const value = parseInt(questionCountInput.value);
        const maxQuestions = selectedQuestionSet.question_count;

        // Clear previous validation message
        if (validationDiv) {
            validationDiv.textContent = '';
            validationDiv.className = 'question-count-validation';
        }

        if (questionCountInput.value === '' || isNaN(value)) {
            selectedQuestionCount = null;
        } else if (value < 1) {
            selectedQuestionCount = null;
            if (validationDiv) {
                validationDiv.textContent = t('ERRORS.QUESTION_COUNT_MIN_ONE');
                validationDiv.className = 'question-count-validation error';
            }
        } else if (value > maxQuestions) {
            selectedQuestionCount = null;
            if (validationDiv) {
                validationDiv.textContent = t('ERRORS.QUESTION_COUNT_EXCEEDS_MAX', `Maximal ${maxQuestions} Fragen verfügbar.`);
                validationDiv.className = 'question-count-validation error';
            }
        } else {
            selectedQuestionCount = value;
            if (validationDiv) {
                validationDiv.textContent = t('QUESTION_SETS.QUESTIONS_SELECTED', `${value} Fragen ausgewählt.`);
                validationDiv.className = 'question-count-validation success';
            }
        }

        updateCreateButton();
    }

    function updateCreateButton() {
        const createBtn = document.getElementById('select-and-create-btn');
        if (!createBtn) return;

        const canCreate = selectedQuestionSet && selectedQuestionCount && selectedQuestionCount > 0;
        
        createBtn.disabled = !canCreate;
        
        if (selectedQuestionSet && selectedQuestionCount) {
            createBtn.textContent = t('QUESTION_SETS.CREATE_WITH_SET');
        } else if (selectedQuestionSet) {
            createBtn.textContent = t('QUESTION_SETS.CREATE_WITH_SET');
        } else {
            createBtn.textContent = t('QUESTION_SETS.CREATE_WITH_SET');
        }
    }

    async function handleCreateGameWithQuestionSet() {
        if (!selectedQuestionSet) {
            showToast(t('ERRORS.NO_QUESTION_SET_SELECTED'), 'warning');
            return;
        }

        if (!selectedQuestionCount || selectedQuestionCount <= 0) {
            showToast(t('ERRORS.INVALID_QUESTION_COUNT'), 'warning');
            return;
        }

        if (!currentUser) {
            showToast(t('ERRORS.PLEASE_LOGIN_FIRST'), 'error');
            return;
        }

        let timeoutId;
        try {
            const createBtn = document.getElementById('select-and-create-btn');
            if (createBtn) {
                createBtn.disabled = true;
                createBtn.textContent = t('STATUS.CREATING_GAME');
            }

            console.log('Creating lobby with question set:', selectedQuestionSet.id);
            console.log('Current user:', currentUser);
            
            // Set up a timeout to handle hanging requests
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    console.error('Request timed out after 30 seconds');
                    reject(new Error('Request timed out after 30 seconds. Please try again.'));
                }, 30000); // 30 second timeout
            });
            
            // Add debugging to the lobby creation promise
            const lobbyPromise = (async () => {
                console.log('Starting lobby creation...');
                const result = await lobbyManager.createLobby(
                    {
                        username: currentUser.username,
                        character: currentUser.character
                    },
                    selectedQuestionSet.id
                );
                console.log('Lobby creation completed:', result);
                
                // Immediately set the question count
                if (result && result.code && selectedQuestionCount) {
                    console.log('Setting question count to', selectedQuestionCount);
                    await lobbyManager.setQuestionCount(result.code, selectedQuestionCount);
                    console.log('Question count set successfully');
                }
                
                return result;
            })();
            
            console.log('Waiting for lobby creation or timeout...');
            
            // Race between the actual request and the timeout
            const lobbyData = await Promise.race([lobbyPromise, timeoutPromise]);
            
            // Clear the timeout if request succeeded
            clearTimeout(timeoutId);
            console.log('Lobby created successfully:', lobbyData);

            if (lobbyData) {
                showToast('Game created successfully!', 'success');
                console.log('Switching to lobby screen...');
                screenManager.showScreen(SCREENS.LOBBY);
                
                // Reset selection for next time
                selectedQuestionSet = null;
            }

        } catch (error) {
            console.error('Failed to create game with question set:', error);
            
            // Clear timeout if it exists
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            let errorMessage = error.message || 'Failed to create game';
            
            // Handle specific timeout case
            if (errorMessage.includes('timed out')) {
                errorMessage = 'The request is taking too long. Please check your connection and try again.';
            }
            
            showToast(errorMessage, 'error');
            
            // Re-enable button
            const createBtn = document.getElementById('select-and-create-btn');
            if (createBtn && selectedQuestionSet) {
                createBtn.disabled = false;
                createBtn.textContent = t('QUESTION_SETS.CREATE_WITH_SET');
            }
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getSelectedQuestionSet() {
        return selectedQuestionSet;
    }

    function clearSelection() {
        selectedQuestionSet = null;
        selectedQuestionCount = null;
        document.querySelectorAll('.question-set-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Hide question count section
        const questionCountSection = document.getElementById('question-count-section');
        if (questionCountSection) {
            questionCountSection.style.display = 'none';
        }
        
        // Clear question count input
        const questionCountInput = document.getElementById('question-count-input');
        if (questionCountInput) {
            questionCountInput.value = '';
        }
        
        // Clear validation message
        const validationDiv = document.getElementById('question-count-validation');
        if (validationDiv) {
            validationDiv.textContent = '';
            validationDiv.className = 'question-count-validation';
        }
        
        const createBtn = document.getElementById('select-and-create-btn');
        if (createBtn) {
            createBtn.disabled = true;
            createBtn.textContent = t('QUESTION_SETS.CREATE_WITH_SET');
        }
    }

    return {
        init,
        showQuestionSetSelection,
        getSelectedQuestionSet,
        clearSelection,
        loadAndDisplayQuestionSets
    };
}
