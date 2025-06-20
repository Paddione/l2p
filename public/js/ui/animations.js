/**
 * Animations Module
 * Handles all game animations including character, points, multiplier, and timer effects
 */

import { ANIMATIONS, CSS_CLASSES } from '../utils/constants.js';

export function initAnimations() {
    /**
     * Animates a character based on answer correctness
     * @param {string} playerId - Player element ID
     * @param {boolean} isCorrect - Whether the answer was correct
     */
    function animateCharacter(playerId, isCorrect) {
        // Try to find the avatar element in the game screen
        const avatarElement = document.querySelector(`[data-player="${playerId}"] .player-avatar`);
        if (!avatarElement) {
            // Fallback to old selector for compatibility
            const playerElement = document.querySelector(`[data-player="${playerId}"] .player-character`);
            if (playerElement) {
                playerElement.classList.remove('bounce', 'shake');
                playerElement.classList.add(isCorrect ? 'bounce' : 'shake');
                setTimeout(() => {
                    playerElement.classList.remove('bounce', 'shake');
                }, 1000);
            }
            return;
        }

        // Remove any existing animation classes
        avatarElement.classList.remove('bounce', 'shake', 'flash-correct', 'flash-incorrect');
        
        // Add appropriate animation class
        if (isCorrect) {
            avatarElement.classList.add('bounce', 'flash-correct');
        } else {
            avatarElement.classList.add('shake', 'flash-incorrect');
        }
        
        // Remove animation class after animation completes
        setTimeout(() => {
            avatarElement.classList.remove('bounce', 'shake', 'flash-correct', 'flash-incorrect');
        }, 1000);
    }

    /**
     * Animates points earned
     * @param {string} playerId - Player element ID
     * @param {number} points - Points earned
     * @param {number} multiplier - Current multiplier
     */
    function animatePointsEarned(playerId, points, multiplier) {
        const playerElement = document.querySelector(`[data-player="${playerId}"]`);
        if (!playerElement) return;

        // Flash the points display
        const pointsDisplay = document.createElement('div');
        pointsDisplay.className = 'points-display';
        pointsDisplay.textContent = `+${points * multiplier}`;
        playerElement.appendChild(pointsDisplay);

        // Create floating points element
        const pointsElement = document.createElement('div');
        pointsElement.className = 'points-earned';
        pointsElement.textContent = `+${points * multiplier}`;
        
        // Get player element position
        const rect = playerElement.getBoundingClientRect();
        
        // Style the points element
        Object.assign(pointsElement.style, {
            position: 'fixed',
            top: `${rect.top + rect.height / 2}px`,
            left: `${rect.left + rect.width / 2}px`,
            transform: 'translate(-50%, -50%)',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#48bb78',
            textShadow: '0 0 10px rgba(72, 187, 120, 0.5)',
            zIndex: '1000'
        });

        // Add to body (to avoid container clipping)
        document.body.appendChild(pointsElement);

        // Animate
        requestAnimationFrame(() => {
            pointsElement.style.transition = 'all 1s ease-out';
            pointsElement.style.transform = 'translate(-50%, -150%)';
            pointsElement.style.opacity = '0';
        });

        // Clean up
        setTimeout(() => {
            pointsElement.remove();
            pointsDisplay.remove();
        }, 1000);
    }

    /**
     * Animates multiplier changes
     * @param {string} playerId - Player element ID
     * @param {number} oldMultiplier - Previous multiplier value
     * @param {number} newMultiplier - New multiplier value
     */
    function animateMultiplier(playerId, oldMultiplier, newMultiplier) {
        const multiplierElement = document.querySelector(`[data-player="${playerId}"] .multiplier-badge`);
        if (!multiplierElement) return;

        // Add glow effect for increase, shake for decrease
        if (newMultiplier > oldMultiplier) {
            multiplierElement.classList.add('glow');
            setTimeout(() => multiplierElement.classList.remove('glow'), 1000);
        } else if (newMultiplier < oldMultiplier) {
            multiplierElement.classList.add('shake');
            setTimeout(() => multiplierElement.classList.remove('shake'), 1000);
        }
    }

    /**
     * Animates timer warning
     * @param {HTMLElement} timerElement - Timer DOM element
     * @param {number} seconds - Current seconds remaining
     */
    function animateTimerWarning(timerElement, seconds) {
        if (!timerElement) return;

        if (seconds <= 10) {
            timerElement.classList.add('pulse', 'warning');
        } else {
            timerElement.classList.remove('pulse', 'warning');
        }
    }

    /**
     * Animates winner celebration
     * @param {string} playerId - Player element ID
     */
    function animateWinner(playerId) {
        const playerElement = document.querySelector(`[data-player="${playerId}"]`);
        if (!playerElement) return;

        // Add celebration effects
        playerElement.classList.add('winner');
        
        // Create confetti effect
        createConfetti(playerElement);

        // Remove celebration after animation
        setTimeout(() => {
            playerElement.classList.remove('winner');
        }, 3000);
    }

    /**
     * Creates confetti effect
     * @param {HTMLElement} container - Container element for confetti
     */
    function createConfetti(container) {
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
        const confettiCount = 150;

        // Create confetti pieces
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random properties
            const size = Math.random() * 8 + 6; // 6-14px
            const type = Math.random();
            const color = colors[Math.floor(Math.random() * colors.length)];

            // Base styles
            const styles = {
                position: 'absolute',
                left: Math.random() * 100 + '%',
                top: -20,
                width: type > 0.6 ? `${size}px` : type > 0.3 ? `${size * 0.5}px` : '0',
                height: type > 0.6 ? `${size}px` : type > 0.3 ? `${size * 2}px` : '0',
                background: type > 0.3 ? color : 'none',
                borderRadius: type > 0.6 ? '50%' : '0',
                opacity: Math.random() * 0.4 + 0.6,
                transform: `rotate(${Math.random() * 360}deg)`,
                zIndex: 1000
            };

            // Special styles for triangles
            if (type <= 0.3) {
                Object.assign(styles, {
                    borderLeft: `${size * 0.5}px solid transparent`,
                    borderRight: `${size * 0.5}px solid transparent`,
                    borderBottom: `${size}px solid ${color}`
                });
            }

            Object.assign(confetti.style, styles);
            container.appendChild(confetti);

            // Animate
            const duration = Math.random() * 2 + 2; // 2-4 seconds
            const rotation = Math.random() * 720 - 360; // -360 to 360 degrees
            const spread = Math.random() * 200 - 100; // -100px to 100px
            const startDelay = Math.random() * 500; // 0-500ms delay

            setTimeout(() => {
                confetti.style.transition = `all ${duration}s ease-out`;
                Object.assign(confetti.style, {
                    top: '120%',
                    transform: `translateX(${spread}px) rotate(${rotation}deg)`,
                    opacity: '0'
                });

                // Remove after animation
                setTimeout(() => confetti.remove(), duration * 1000);
            }, startDelay);
        }
    }

    /**
     * Animates question transition
     * @param {HTMLElement} questionElement - Question container element
     */
    function animateQuestionTransition(questionElement) {
        if (!questionElement) return;

        // Add fade out animation
        questionElement.classList.add(ANIMATIONS.FADE_OUT);
        
        // After fade out, add fade in
        setTimeout(() => {
            questionElement.classList.remove(ANIMATIONS.FADE_OUT);
            questionElement.classList.add(ANIMATIONS.FADE_IN);
            
            // Remove fade in class after animation
            setTimeout(() => {
                questionElement.classList.remove(ANIMATIONS.FADE_IN);
            }, 500);
        }, 250);
    }

    /**
     * Flashes all player avatars based on their answer results
     * @param {Object} answerResults - Object mapping usernames to their answer correctness
     */
    function flashAllPlayerAvatars(answerResults) {
        Object.entries(answerResults).forEach(([username, isCorrect]) => {
            animateCharacter(username, isCorrect);
        });
    }

    return {
        animateCharacter,
        animatePointsEarned,
        animateMultiplier,
        animateTimerWarning,
        animateWinner,
        animateQuestionTransition,
        flashAllPlayerAvatars
    };
} 