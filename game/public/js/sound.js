// js/sound.js

/**
 * @fileoverview Manages sound effects and music for the quiz game.
 */

import { getIsMuted, getUserHasInteracted, gameState } from './state.js';

// This object will be populated by ui.js after creating audio elements
export const sounds = {};

/**
 * Initializes the sounds object with references to the <audio> DOM elements.
 * This should be called after the audio elements are created in the DOM.
 * @param {Object} audioElements - An object mapping sound names to <audio> elements.
 */
export function initSounds(audioElements) {
    for (const key in audioElements) {
        sounds[key] = audioElements[key];
        if (sounds[key]) {
            sounds[key].muted = getIsMuted(); // Set initial muted state
        }
    }
    console.log('Sounds initialized:', sounds);
}

/**
 * Plays a sound by its name.
 * @param {string} soundName - The name of the sound to play (e.g., 'click', 'correct').
 * @param {boolean} [loop=false] - Whether the sound should loop.
 */
export function playSound(soundName, loop = false) {
    if (getIsMuted() || !getUserHasInteracted()) {
        // console.log(`Sound '${soundName}' skipped (muted: ${getIsMuted()}, interacted: ${getUserHasInteracted()})`);
        return;
    }

    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.loop = loop;
        sound.play().catch(e => console.warn(`Sound play failed for '${soundName}':`, e));
        // console.log(`Playing sound: ${soundName}`);
    } else {
        console.warn(`Sound '${soundName}' not found.`);
    }
}

/**
 * Toggles the mute state for all sounds.
 * This function will be called by an event listener for a mute button.
 */
export function toggleMute() {
    const newMutedState = !getIsMuted();
    gameState.isMuted = newMutedState; // Update state directly
    localStorage.setItem('quizMuted', newMutedState.toString());

    for (const key in sounds) {
        if (sounds[key]) {
            sounds[key].muted = newMutedState;
        }
    }
    console.log(`Sounds ${newMutedState ? 'muted' : 'unmuted'}.`);
    // Potentially update UI of mute button here or dispatch an event
    return newMutedState;
}

/**
 * Sets the muted state of all sounds.
 * @param {boolean} muted - True to mute, false to unmute.
 */
export function setAllSoundsMuted(muted) {
    gameState.isMuted = muted; // Update state directly
    for (const key in sounds) {
        if (sounds[key]) {
            sounds[key].muted = muted;
        }
    }
    console.log(`All sounds set to muted: ${muted}`);
}


console.log('sound.js loaded');
