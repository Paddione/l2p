/**
 * Help System Module
 * Handles the help modal and provides comprehensive user guidance
 */

import { t } from '/js/utils/translations.js';

let helpModal = null;
let isInitialized = false;

/**
 * Initialize the help system
 */
export function initHelpSystem() {
    if (isInitialized) {
        console.log('Help system already initialized');
        return;
    }

    console.log('Initializing help system...');
    
    createHelpModal();
    setupEventListeners();
    
    isInitialized = true;
    console.log('Help system initialized successfully');
    
    return {
        showHelp,
        hideHelp
    };
}

/**
 * Create the help modal HTML structure
 */
function createHelpModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('help-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
        <div id="help-modal" class="modal-overlay hidden">
            <div class="modal-content help-modal-content">
                <div class="modal-header">
                    <h2>${t('HELP.TITLE')}</h2>
                    <button class="close-modal" id="close-help-modal">&times;</button>
                </div>
                <div class="help-content">
                    <div class="help-navigation">
                        <button class="help-nav-btn active" data-section="getting-started">
                            ${t('HELP.GETTING_STARTED')}
                        </button>
                        <button class="help-nav-btn" data-section="game-modes">
                            ${t('HELP.GAME_MODES')}
                        </button>
                        <button class="help-nav-btn" data-section="scoring-system">
                            ${t('HELP.SCORING_SYSTEM')}
                        </button>
                        <button class="help-nav-btn" data-section="audio-features">
                            ${t('HELP.AUDIO_FEATURES')}
                        </button>
                        <button class="help-nav-btn" data-section="hall-of-fame">
                            ${t('HELP.HALL_OF_FAME_HELP')}
                        </button>
                        <button class="help-nav-btn" data-section="troubleshooting">
                            ${t('HELP.TROUBLESHOOTING')}
                        </button>
                    </div>
                    <div class="help-sections">
                        <div class="help-section active" id="help-getting-started">
                            ${t('HELP.GETTING_STARTED_CONTENT')}
                        </div>
                        <div class="help-section" id="help-game-modes">
                            ${t('HELP.GAME_MODES_CONTENT')}
                        </div>
                        <div class="help-section" id="help-scoring-system">
                            ${t('HELP.SCORING_SYSTEM_CONTENT')}
                        </div>
                        <div class="help-section" id="help-audio-features">
                            ${t('HELP.AUDIO_FEATURES_CONTENT')}
                        </div>
                        <div class="help-section" id="help-hall-of-fame">
                            ${t('HELP.HALL_OF_FAME_HELP_CONTENT')}
                        </div>
                        <div class="help-section" id="help-troubleshooting">
                            ${t('HELP.TROUBLESHOOTING_CONTENT')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    helpModal = document.getElementById('help-modal');
}

/**
 * Setup event listeners for the help modal
 */
function setupEventListeners() {
    if (!helpModal) return;

    // Close modal button
    const closeBtn = helpModal.querySelector('#close-help-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideHelp);
    }

    // Close modal when clicking outside
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            hideHelp();
        }
    });

    // Navigation buttons
    const navButtons = helpModal.querySelectorAll('.help-nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            showHelpSection(section);
            
            // Update active nav button
            navButtons.forEach(navBtn => navBtn.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !helpModal.classList.contains('hidden')) {
            hideHelp();
        }
    });
}

/**
 * Show the help modal
 */
export function showHelp() {
    if (!helpModal) {
        console.error('Help modal not initialized');
        return;
    }

    helpModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Focus on the modal for accessibility
    const firstNavBtn = helpModal.querySelector('.help-nav-btn');
    if (firstNavBtn) {
        firstNavBtn.focus();
    }
}

/**
 * Hide the help modal
 */
export function hideHelp() {
    if (!helpModal) return;

    helpModal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
}

/**
 * Show a specific help section
 * @param {string} sectionName - Name of the section to show
 */
function showHelpSection(sectionName) {
    const sections = helpModal.querySelectorAll('.help-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = helpModal.querySelector(`#help-${sectionName}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

/**
 * Add help system styles to the page
 */
function addHelpStyles() {
    const styleId = 'help-system-styles';
    
    // Don't add styles if they already exist
    if (document.getElementById(styleId)) {
        return;
    }

    const styles = `
        <style id="${styleId}">
            .help-modal-content {
                max-width: 900px;
                width: 95%;
                max-height: 90vh;
                padding: 0;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .help-content {
                display: flex;
                flex: 1;
                overflow: hidden;
            }

            .help-navigation {
                width: 250px;
                background: var(--gray-50);
                border-right: 1px solid var(--gray-200);
                padding: 1rem 0;
                overflow-y: auto;
            }

            .help-nav-btn {
                display: block;
                width: 100%;
                padding: 0.75rem 1rem;
                text-align: left;
                background: none;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.9rem;
                color: var(--gray-700);
            }

            .help-nav-btn:hover {
                background: var(--gray-100);
                color: var(--primary);
            }

            .help-nav-btn.active {
                background: var(--primary);
                color: white;
                font-weight: 500;
            }

            .help-sections {
                flex: 1;
                padding: 2rem;
                overflow-y: auto;
                background: var(--surface);
                color: var(--text-primary);
            }

            .help-section {
                display: none;
                line-height: 1.6;
            }

            .help-section.active {
                display: block;
            }

            .help-section h4 {
                color: var(--primary);
                margin-bottom: 1rem;
                font-size: 1.25rem;
            }

            .help-section h5 {
                color: var(--text-primary);
                margin: 1.5rem 0 0.75rem 0;
                font-size: 1.1rem;
            }

            .help-section p {
                margin-bottom: 1rem;
                color: var(--text-secondary);
            }

            .help-section ul, .help-section ol {
                margin-bottom: 1rem;
                padding-left: 1.5rem;
            }

            .help-section li {
                margin-bottom: 0.5rem;
                color: var(--text-secondary);
            }

            .help-section code {
                background: var(--gray-100);
                color: var(--text-primary);
                padding: 0.2rem 0.4rem;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }

            .help-section strong {
                color: var(--text-primary);
                font-weight: 600;
            }

            /* Dark mode styles */
            [data-theme="dark"] .help-navigation {
                background: var(--gray-100);
                border-right: 1px solid var(--gray-200);
            }

            [data-theme="dark"] .help-nav-btn {
                color: var(--gray-600);
            }

            [data-theme="dark"] .help-nav-btn:hover {
                background: var(--gray-200);
                color: var(--primary);
            }

            [data-theme="dark"] .help-nav-btn.active {
                background: var(--primary);
                color: white;
            }

            [data-theme="dark"] .help-sections {
                background: var(--surface);
                color: var(--text-primary);
            }

            [data-theme="dark"] .help-section h4 {
                color: var(--primary);
            }

            [data-theme="dark"] .help-section h5 {
                color: var(--text-primary);
            }

            [data-theme="dark"] .help-section p {
                color: var(--text-secondary);
            }

            [data-theme="dark"] .help-section li {
                color: var(--text-secondary);
            }

            [data-theme="dark"] .help-section code {
                background: var(--gray-100);
                color: var(--text-primary);
            }

            [data-theme="dark"] .help-section strong {
                color: var(--text-primary);
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .help-modal-content {
                    width: 98%;
                    max-height: 95vh;
                }

                .help-content {
                    flex-direction: column;
                }

                .help-navigation {
                    width: 100%;
                    display: flex;
                    overflow-x: auto;
                    padding: 0.5rem;
                    border-right: none;
                    border-bottom: 1px solid var(--gray-200);
                }

                .help-nav-btn {
                    white-space: nowrap;
                    padding: 0.5rem 1rem;
                    margin-right: 0.5rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                }

                .help-sections {
                    padding: 1rem;
                }

                .help-section h4 {
                    font-size: 1.1rem;
                }

                .help-section h5 {
                    font-size: 1rem;
                }

                /* Dark mode mobile adjustments */
                [data-theme="dark"] .help-navigation {
                    border-bottom: 1px solid var(--gray-200);
                }
            }

            @media (max-width: 480px) {
                .help-sections {
                    padding: 0.75rem;
                }

                .help-section h4 {
                    font-size: 1rem;
                }

                .help-section h5 {
                    font-size: 0.95rem;
                }

                .help-section p, .help-section li {
                    font-size: 0.9rem;
                }
            }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
}

// Add styles when module loads
addHelpStyles(); 