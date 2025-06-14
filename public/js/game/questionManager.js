/**
 * Question Manager Module
 * Handles loading and managing question catalogs
 */

import { GAME_SETTINGS, QUESTION_TYPES } from '../utils/constants.js';
import { shuffleArray } from '../utils/helpers.js';

export function initQuestionManager() {
    let loadedCatalogs = new Map();

    /**
     * Loads a question catalog from a file
     * @param {File} file - JSON file containing questions
     * @returns {Promise<Object>} - Loaded catalog
     */
    async function loadCatalogFromFile(file) {
        try {
            const text = await file.text();
            const catalog = JSON.parse(text);

            if (!isValidCatalog(catalog)) {
                throw new Error('Invalid catalog format');
            }

            loadedCatalogs.set(catalog.name, catalog);
            return catalog;
        } catch (error) {
            console.error('Failed to load catalog:', error);
            throw new Error('Failed to load question catalog');
        }
    }

    /**
     * Loads a built-in catalog
     * @param {string} catalogName - Name of the catalog to load
     * @returns {Promise<Object>} - Loaded catalog
     */
    async function loadBuiltInCatalog(catalogName) {
        try {
            const response = await fetch(`/assets/data/${catalogName}.json`);
            if (!response.ok) {
                throw new Error('Failed to fetch catalog');
            }

            const catalog = await response.json();
            if (!isValidCatalog(catalog)) {
                throw new Error('Invalid catalog format');
            }

            loadedCatalogs.set(catalog.name, catalog);
            return catalog;
        } catch (error) {
            console.error('Failed to load built-in catalog:', error);
            throw new Error('Failed to load question catalog');
        }
    }

    /**
     * Validates a question catalog
     * @param {Object} catalog - Catalog to validate
     * @returns {boolean} - Whether catalog is valid
     */
    function isValidCatalog(catalog) {
        if (!catalog || !catalog.name || !Array.isArray(catalog.questions)) {
            return false;
        }

        if (catalog.questions.length < GAME_SETTINGS.MIN_QUESTIONS) {
            return false;
        }

        return catalog.questions.every(question => isValidQuestion(question));
    }

    /**
     * Validates a single question
     * @param {Object} question - Question to validate
     * @returns {boolean} - Whether question is valid
     */
    function isValidQuestion(question) {
        if (!question.question || !question.type || !question.hasOwnProperty('correct')) {
            return false;
        }

        if (!Object.values(QUESTION_TYPES).includes(question.type)) {
            return false;
        }

        if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
            return Array.isArray(question.options) && 
                   question.options.length === 4 &&
                   typeof question.correct === 'number' &&
                   question.correct >= 0 &&
                   question.correct < 4;
        }

        if (question.type === QUESTION_TYPES.TRUE_FALSE) {
            return typeof question.correct === 'boolean';
        }

        return false;
    }

    /**
     * Gets a catalog by name
     * @param {string} name - Catalog name
     * @returns {Object|null} - Catalog data or null
     */
    function getCatalog(name) {
        return loadedCatalogs.get(name) || null;
    }

    /**
     * Gets all loaded catalogs
     * @returns {Array} - Array of catalog names
     */
    function getLoadedCatalogs() {
        return Array.from(loadedCatalogs.keys());
    }

    /**
     * Prepares questions for a game
     * @param {Object} catalog - Question catalog
     * @returns {Array} - Prepared questions
     */
    function prepareGameQuestions(catalog) {
        const questions = catalog.questions.slice(0, GAME_SETTINGS.MAX_QUESTIONS);
        return shuffleArray(questions);
    }

    return {
        loadCatalogFromFile,
        loadBuiltInCatalog,
        getCatalog,
        getLoadedCatalogs,
        prepareGameQuestions
    };
} 