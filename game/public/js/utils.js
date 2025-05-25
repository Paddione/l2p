// js/utils.js

/**
 * @fileoverview Contains utility functions for the quiz game application.
 */

/**
 * Helper function to create DOM elements with attributes, classes, and text/HTML content.
 * @param {string} tag - The HTML tag for the element.
 * @param {Object} [attributes={}] - An object of attributes to set (e.g., { id: 'myId', src: 'path' }).
 * @param {string[]|string} [classes=[]] - An array or space-separated string of CSS classes.
 * @param {string|null} [textContent=null] - Text content for the element.
 * @param {string|null} [innerHTML=null] - Inner HTML for the element.
 * @returns {HTMLElement} The created DOM element.
 */
export function createEl(tag, attributes = {}, classes = [], textContent = null, innerHTML = null) {
    const el = document.createElement(tag);

    // Set attributes
    Object.keys(attributes).forEach(key => el.setAttribute(key, attributes[key]));

    // Add classes
    if (classes) {
        const classArray = Array.isArray(classes) ? classes : classes.split(' ');
        classArray.forEach(cls => {
            if (cls) el.classList.add(cls);
        });
    }

    // Set text content
    if (textContent) {
        el.textContent = textContent;
    }

    // Set inner HTML (use with caution, ensure HTML is sanitized if from user input)
    if (innerHTML) {
        el.innerHTML = innerHTML;
    }

    return el;
}

console.log('utils.js loaded');
