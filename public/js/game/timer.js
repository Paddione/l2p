/**
 * Timer Module
 * Handles countdown timer functionality with 60 FPS limiting
 */

import { GAME_SETTINGS, EVENTS, PERFORMANCE_SETTINGS } from '../utils/constants.js';
import { throttle } from '../utils/helpers.js';

export function initTimer() {
    let timerInterval = null;
    let startTime = null;
    let pauseTime = null;
    let timeRemaining = 0;
    let callbacks = new Set();
    
    // Throttled version of notifySubscribers for performance
    const throttledNotifySubscribers = throttle(notifySubscribers, PERFORMANCE_SETTINGS.POLLING_INTERVALS.UI_UPDATES);

    /**
     * Starts the timer
     * @param {number} [duration=GAME_SETTINGS.QUESTION_TIME] - Timer duration in seconds
     */
    function startTimer(duration = GAME_SETTINGS.QUESTION_TIME) {
        stopTimer();
        timeRemaining = duration;
        startTime = Date.now();
        pauseTime = null;

        timerInterval = setInterval(() => {
            const elapsed = pauseTime ? 
                (pauseTime - startTime) : 
                (Date.now() - startTime);
            
            timeRemaining = Math.max(0, duration - Math.floor(elapsed / 1000));
            
            // Notify subscribers (throttled for performance)
            throttledNotifySubscribers();

            // Check if timer is finished
            if (timeRemaining <= 0) {
                stopTimer();
                dispatchTimerEvent(EVENTS.TIMER_FINISHED);
            } else {
                dispatchTimerEvent(EVENTS.TIMER_UPDATED);
            }
        }, PERFORMANCE_SETTINGS.TIMER_UPDATE_INTERVAL); // 60 FPS limited updates
    }

    /**
     * Stops the timer
     */
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        startTime = null;
        pauseTime = null;
    }

    /**
     * Pauses the timer
     */
    function pauseTimer() {
        if (timerInterval && !pauseTime) {
            pauseTime = Date.now();
            clearInterval(timerInterval);
            timerInterval = null;
            dispatchTimerEvent(EVENTS.TIMER_PAUSED);
        }
    }

    /**
     * Resumes the timer
     */
    function resumeTimer() {
        if (pauseTime && timeRemaining > 0) {
            const pauseDuration = Date.now() - pauseTime;
            startTime += pauseDuration;
            pauseTime = null;
            
            timerInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                timeRemaining = Math.max(0, GAME_SETTINGS.QUESTION_TIME - Math.floor(elapsed / 1000));
                
                // Notify subscribers (throttled for performance)
                throttledNotifySubscribers();

                // Check if timer is finished
                if (timeRemaining <= 0) {
                    stopTimer();
                    dispatchTimerEvent(EVENTS.TIMER_FINISHED);
                } else {
                    dispatchTimerEvent(EVENTS.TIMER_UPDATED);
                }
            }, PERFORMANCE_SETTINGS.TIMER_UPDATE_INTERVAL);

            dispatchTimerEvent(EVENTS.TIMER_RESUMED);
        }
    }

    /**
     * Gets remaining time
     * @returns {number} - Time remaining in seconds
     */
    function getTimeRemaining() {
        return timeRemaining;
    }

    /**
     * Subscribes to timer updates
     * @param {Function} callback - Callback function
     */
    function subscribe(callback) {
        callbacks.add(callback);
    }

    /**
     * Unsubscribes from timer updates
     * @param {Function} callback - Callback function
     */
    function unsubscribe(callback) {
        callbacks.delete(callback);
    }

    /**
     * Notifies all subscribers
     */
    function notifySubscribers() {
        callbacks.forEach(callback => {
            try {
                callback(timeRemaining);
            } catch (error) {
                console.error('Error in timer callback:', error);
            }
        });
    }

    /**
     * Dispatches a timer event
     * @param {string} eventName - Event name
     */
    function dispatchTimerEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: { timeRemaining }
        });
        document.dispatchEvent(event);
    }

    /**
     * Checks if timer is active
     * @returns {boolean} - Whether timer is active
     */
    function isActive() {
        return !!timerInterval;
    }

    /**
     * Checks if timer is paused
     * @returns {boolean} - Whether timer is paused
     */
    function isPaused() {
        return !!pauseTime;
    }

    return {
        startTimer,
        stopTimer,
        pauseTimer,
        resumeTimer,
        getTimeRemaining,
        subscribe,
        unsubscribe,
        isActive,
        isPaused
    };
} 