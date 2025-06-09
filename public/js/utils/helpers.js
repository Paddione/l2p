/**
 * Utility helper functions
 */

/**
 * Generates a random 4-character lobby code
 * @returns {string} Random lobby code
 */
export function generateLobbyCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

/**
 * Formats a score number with commas
 * @param {number} score - Score to format
 * @returns {string} Formatted score
 */
export function formatScore(score) {
    return score.toLocaleString();
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Validates username format
 * @param {string} username - Username to validate
 * @returns {boolean} Whether username is valid
 */
export function isValidUsername(username) {
    if (!username || typeof username !== 'string') return false;
    if (username.length < 3 || username.length > 16) return false;
    return /^[a-zA-Z0-9_-]+$/.test(username);
}

/**
 * Validates password format
 * @param {string} password - Password to validate
 * @returns {boolean} Whether password is valid
 */
export function isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 6 && password.length <= 128;
}

/**
 * Calculates score based on time remaining and multiplier
 * @param {number} timeRemaining - Time remaining in seconds
 * @param {number} multiplier - Current multiplier
 * @returns {number} Calculated score
 */
export function calculateScore(timeRemaining, multiplier) {
    const baseScore = 100;
    const timeBonus = Math.max(0, timeRemaining * 2);
    return Math.round((baseScore + timeBonus) * multiplier);
}

/**
 * Calculates next multiplier based on current multiplier and answer correctness
 * @param {number} currentMultiplier - Current multiplier value
 * @param {boolean} wasCorrect - Whether the answer was correct
 * @returns {number} Next multiplier value
 */
export function getNextMultiplier(currentMultiplier, wasCorrect) {
    if (wasCorrect) {
        return Math.min(5, currentMultiplier + 1);
    } else {
        return 1; // Reset to 1 on wrong answer
    }
} 