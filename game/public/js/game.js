// js/game.js

/**
 * @fileoverview Handles core game logic such as question timers,
 * answer processing, and score updates.
 */

import { gameState, getSelectedAnswer, setSelectedAnswer, clearQuestionTimer, setQuestionTimer } from './state.js';
import { playSound } from './sound.js';
import { showAnswerFeedbackUI, updateTimerDisplay, showGlobalNotification } from './ui.js'; // For UI updates

/**
 * Starts the countdown timer for the current question.
 * @param {number} timeLimit - The time limit for the question in seconds.
 * @param {Function} updateDisplayCallback - UI function to update the timer display.
 */
export function startQuestionTimer(timeLimit, updateDisplayCallback) {
    clearQuestionTimer(); // Clear any existing timer

    let timeLeft = timeLimit;
    updateDisplayCallback(timeLeft, getTimerClass(timeLeft)); // Initial display

    const timerId = setInterval(() => {
        timeLeft--;
        updateDisplayCallback(timeLeft, getTimerClass(timeLeft));

        if (timeLeft <= 0) {
            clearQuestionTimer(); // Clears the interval via state function
            // Auto-submit if no answer selected (server might also handle this timeout)
            if (getSelectedAnswer() === null) {
                console.log('Game: Time up! No answer selected.');
                // Disable answer buttons visually (UI function might be needed)
                const answerButtons = gameState.elements.gamePlaySection?.querySelectorAll('.answer-option-btn');
                answerButtons?.forEach(btn => btn.classList.add('disabled'));

                const selectedDisplay = document.getElementById('selected-answer-display');
                if (selectedDisplay) selectedDisplay.textContent = 'Zeit abgelaufen';

                showGlobalNotification('Zeit abgelaufen!', 'warning');
                playSound('timeup');
                // Server will likely send 'questionEnded' event. Client might not need to emit anything here,
                // unless there's a specific "time_up_no_answer" event.
                // For now, we assume the server handles the timeout and proceeds.
            }
        }
    }, 1000);
    setQuestionTimer(timerId); // Store timerId in state
}

/**
 * Determines the CSS class for the timer based on time left.
 * @param {number} timeLeft - Time remaining in seconds.
 * @returns {string} Tailwind CSS class string.
 */
function getTimerClass(timeLeft) {
    let baseClass = 'text-3xl font-bold font-mono bg-gray-800 px-4 py-2 rounded-lg border';
    if (timeLeft <= 10) {
        return `${baseClass} text-red-400 border-red-400/30 urgent-high`;
    } else if (timeLeft <= 20) {
        return `${baseClass} text-orange-400 border-orange-400/30 urgent-medium`;
    }
    // Default class for timeLeft > 20 or if specific conditions aren't met
    return `${baseClass} text-yellow-400 border-yellow-400/30 urgent-low`;
}


/**
 * Handles the feedback received from the server after an answer is submitted.
 * @param {Object} feedbackData - Data from the server about the answer.
 * Expected: { isCorrect, correctAnswer, pointsEarned, totalScore }
 */
export function handleAnswerFeedback(feedbackData) {
    console.log('Game: Answer feedback received:', feedbackData);
    // The UI update is now primarily handled by ui.js
    showAnswerFeedbackUI(feedbackData, getSelectedAnswer());
}


/**
 * Resets game-specific state variables when a game ends or player leaves.
 */
export function resetGameState() {
    clearQuestionTimer();
    setSelectedAnswer(null);
    // gameState.currentQuestionData = null; // This is handled by setCurrentQuestion(null)
    // Other game-specific state resets can go here
    console.log('Game: Game state reset.');
}


console.log('game.js loaded');
