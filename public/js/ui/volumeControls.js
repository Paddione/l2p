/**
 * Volume Controls Module
 * Handles the volume control sliders and connects them to the audio manager
 * Now includes mute functionality with clickable icons
 */

let audioManager = null;
let isMusicMuted = false;
let isSoundMuted = false;
let lastMusicVolume = 30;
let lastSoundVolume = 13;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;

/**
 * Initialize volume controls with retry mechanism
 * @param {Object} audioManagerInstance - The audio manager instance
 */
export function initVolumeControls(audioManagerInstance) {
    audioManager = audioManagerInstance;
    initializationAttempts = 0;
    
    // Try to initialize immediately, with retry mechanism
    attemptInitialization();
}

/**
 * Attempt to initialize volume controls with retry mechanism
 */
function attemptInitialization() {
    initializationAttempts++;
    
    if (initializationAttempts > MAX_INIT_ATTEMPTS) {
        console.error('Failed to initialize volume controls after', MAX_INIT_ATTEMPTS, 'attempts');
        return;
    }
    
    // Get volume control elements with better selectors
    const musicVolumeSlider = document.getElementById('music-volume') || document.querySelector('[id="music-volume"]');
    const soundVolumeSlider = document.getElementById('sound-volume') || document.querySelector('[id="sound-volume"]');
    const musicVolumeValue = document.getElementById('music-volume-value') || document.querySelector('[id="music-volume-value"]');
    const soundVolumeValue = document.getElementById('sound-volume-value') || document.querySelector('[id="sound-volume-value"]');
    const musicMuteBtn = document.getElementById('music-mute-btn') || document.querySelector('[id="music-mute-btn"]');
    const soundMuteBtn = document.getElementById('sound-mute-btn') || document.querySelector('[id="sound-mute-btn"]');
    
    // Check if all required elements are found
    const allElementsFound = musicVolumeSlider && soundVolumeSlider && musicVolumeValue && soundVolumeValue && musicMuteBtn && soundMuteBtn;
    
    if (!allElementsFound) {
        console.warn(`Volume control elements not found (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS}). Retrying...`);
        
        // Log which elements are missing for debugging
        const missingElements = [];
        if (!musicVolumeSlider) missingElements.push('music-volume slider');
        if (!soundVolumeSlider) missingElements.push('sound-volume slider');
        if (!musicVolumeValue) missingElements.push('music-volume-value display');
        if (!soundVolumeValue) missingElements.push('sound-volume-value display');
        if (!musicMuteBtn) missingElements.push('music-mute-btn button');
        if (!soundMuteBtn) missingElements.push('sound-mute-btn button');
        
        console.warn('Missing elements:', missingElements);
        
        // Retry after a short delay
        setTimeout(attemptInitialization, 200);
        return;
    }
    
    console.log('Volume controls found, initializing...');
    
    // Set initial values from audio manager
    const settings = audioManager.getSettings();
    const musicPercent = Math.round(settings.musicVolume * 100);
    const soundPercent = Math.round(settings.soundVolume * 100);
    
    musicVolumeSlider.value = musicPercent;
    soundVolumeSlider.value = soundPercent;
    musicVolumeValue.textContent = `${musicPercent}%`;
    soundVolumeValue.textContent = `${soundPercent}%`;
    
    lastMusicVolume = musicPercent;
    lastSoundVolume = soundPercent;
    
    // Load mute states from localStorage
    const savedMusicMuted = localStorage.getItem('musicMuted') === 'true';
    const savedSoundMuted = localStorage.getItem('soundMuted') === 'true';
    
    if (savedMusicMuted) {
        toggleMusicMute();
    }
    if (savedSoundMuted) {
        toggleSoundMute();
    }
    
    // Remove any existing event listeners to prevent duplicates
    musicVolumeSlider.removeEventListener('input', handleMusicVolumeChange);
    soundVolumeSlider.removeEventListener('input', handleSoundVolumeChange);
    musicMuteBtn.removeEventListener('click', toggleMusicMute);
    soundMuteBtn.removeEventListener('click', toggleSoundMute);
    
    // Music volume control
    musicVolumeSlider.addEventListener('input', handleMusicVolumeChange);
    
    // Sound effects volume control
    soundVolumeSlider.addEventListener('input', handleSoundVolumeChange);
    
    // Music mute button
    musicMuteBtn.addEventListener('click', toggleMusicMute);
    
    // Sound mute button
    soundMuteBtn.addEventListener('click', toggleSoundMute);
    
    // Load saved volumes from localStorage
    loadSavedVolumes();
    
    console.log('Volume controls with mute functionality initialized successfully');
}

/**
 * Handle music volume change
 */
function handleMusicVolumeChange(e) {
    const value = parseInt(e.target.value);
    const volume = value / 100;
    
    // Update ARIA attributes for accessibility
    e.target.setAttribute('aria-valuenow', value);
    e.target.setAttribute('aria-valuetext', `${value} percent`);
    
    // If user moves slider and was muted, unmute
    if (isMusicMuted && value > 0) {
        isMusicMuted = false;
        const musicMuteBtn = document.getElementById('music-mute-btn');
        if (musicMuteBtn) {
            musicMuteBtn.classList.remove('muted');
            musicMuteBtn.setAttribute('aria-pressed', 'false');
        }
        localStorage.setItem('musicMuted', 'false');
    }
    
    // Update audio manager
    if (audioManager) {
        audioManager.setMusicVolume(volume);
    }
    
    // Update display
    const musicVolumeValue = document.getElementById('music-volume-value');
    if (musicVolumeValue) {
        musicVolumeValue.textContent = `${value}%`;
    }
    
    // Save to localStorage
    localStorage.setItem('musicVolume', volume.toString());
    
    // Update last known volume
    if (value > 0) {
        lastMusicVolume = value;
    }
    
    console.log(`Music volume set to ${value}%`);
}

/**
 * Handle sound volume change
 */
function handleSoundVolumeChange(e) {
    const value = parseInt(e.target.value);
    const volume = value / 100;
    
    // Update ARIA attributes for accessibility
    e.target.setAttribute('aria-valuenow', value);
    e.target.setAttribute('aria-valuetext', `${value} percent`);
    
    // If user moves slider and was muted, unmute
    if (isSoundMuted && value > 0) {
        isSoundMuted = false;
        const soundMuteBtn = document.getElementById('sound-mute-btn');
        if (soundMuteBtn) {
            soundMuteBtn.classList.remove('muted');
            soundMuteBtn.setAttribute('aria-pressed', 'false');
        }
        localStorage.setItem('soundMuted', 'false');
    }
    
    // Update audio manager
    if (audioManager) {
        audioManager.setSoundVolume(volume);
    }
    
    // Update display
    const soundVolumeValue = document.getElementById('sound-volume-value');
    if (soundVolumeValue) {
        soundVolumeValue.textContent = `${value}%`;
    }
    
    // Save to localStorage
    localStorage.setItem('soundVolume', volume.toString());
    
    // Update last known volume
    if (value > 0) {
        lastSoundVolume = value;
    }
    
    console.log(`Sound effects volume set to ${value}%`);
}

/**
 * Toggle music mute state
 */
function toggleMusicMute() {
    const musicVolumeSlider = document.getElementById('music-volume');
    const musicVolumeValue = document.getElementById('music-volume-value');
    const musicMuteBtn = document.getElementById('music-mute-btn');
    
    if (!musicVolumeSlider || !musicVolumeValue || !musicMuteBtn) {
        console.warn('Music volume controls not found for mute toggle');
        return;
    }
    
    if (isMusicMuted) {
        // Unmute - restore previous volume
        isMusicMuted = false;
        musicMuteBtn.classList.remove('muted');
        musicMuteBtn.setAttribute('aria-pressed', 'false');
        
        const volume = lastMusicVolume / 100;
        musicVolumeSlider.value = lastMusicVolume;
        musicVolumeSlider.setAttribute('aria-valuenow', lastMusicVolume);
        musicVolumeSlider.setAttribute('aria-valuetext', `${lastMusicVolume} percent`);
        musicVolumeValue.textContent = `${lastMusicVolume}%`;
        
        if (audioManager) {
            audioManager.setMusicVolume(volume);
        }
        localStorage.setItem('musicVolume', volume.toString());
        localStorage.setItem('musicMuted', 'false');
        
        console.log(`Music unmuted - restored to ${lastMusicVolume}%`);
    } else {
        // Mute - save current volume and set to 0
        isMusicMuted = true;
        musicMuteBtn.classList.add('muted');
        musicMuteBtn.setAttribute('aria-pressed', 'true');
        
        const currentVolume = parseInt(musicVolumeSlider.value);
        if (currentVolume > 0) {
            lastMusicVolume = currentVolume;
        }
        
        musicVolumeSlider.value = 0;
        musicVolumeSlider.setAttribute('aria-valuenow', '0');
        musicVolumeSlider.setAttribute('aria-valuetext', '0 percent');
        musicVolumeValue.textContent = '0%';
        
        if (audioManager) {
            audioManager.setMusicVolume(0);
        }
        localStorage.setItem('musicVolume', '0');
        localStorage.setItem('musicMuted', 'true');
        
        console.log(`Music muted - saved volume: ${lastMusicVolume}%`);
    }
}

/**
 * Toggle sound effects mute state
 */
function toggleSoundMute() {
    const soundVolumeSlider = document.getElementById('sound-volume');
    const soundVolumeValue = document.getElementById('sound-volume-value');
    const soundMuteBtn = document.getElementById('sound-mute-btn');
    
    if (!soundVolumeSlider || !soundVolumeValue || !soundMuteBtn) {
        console.warn('Sound volume controls not found for mute toggle');
        return;
    }
    
    if (isSoundMuted) {
        // Unmute - restore previous volume
        isSoundMuted = false;
        soundMuteBtn.classList.remove('muted');
        soundMuteBtn.setAttribute('aria-pressed', 'false');
        
        const volume = lastSoundVolume / 100;
        soundVolumeSlider.value = lastSoundVolume;
        soundVolumeSlider.setAttribute('aria-valuenow', lastSoundVolume);
        soundVolumeSlider.setAttribute('aria-valuetext', `${lastSoundVolume} percent`);
        soundVolumeValue.textContent = `${lastSoundVolume}%`;
        
        if (audioManager) {
            audioManager.setSoundVolume(volume);
        }
        localStorage.setItem('soundVolume', volume.toString());
        localStorage.setItem('soundMuted', 'false');
        
        console.log(`Sound effects unmuted - restored to ${lastSoundVolume}%`);
    } else {
        // Mute - save current volume and set to 0
        isSoundMuted = true;
        soundMuteBtn.classList.add('muted');
        soundMuteBtn.setAttribute('aria-pressed', 'true');
        
        const currentVolume = parseInt(soundVolumeSlider.value);
        if (currentVolume > 0) {
            lastSoundVolume = currentVolume;
        }
        
        soundVolumeSlider.value = 0;
        soundVolumeSlider.setAttribute('aria-valuenow', '0');
        soundVolumeSlider.setAttribute('aria-valuetext', '0 percent');
        soundVolumeValue.textContent = '0%';
        
        if (audioManager) {
            audioManager.setSoundVolume(0);
        }
        localStorage.setItem('soundVolume', '0');
        localStorage.setItem('soundMuted', 'true');
        
        console.log(`Sound effects muted - saved volume: ${lastSoundVolume}%`);
    }
}

/**
 * Load saved volumes from localStorage
 */
function loadSavedVolumes() {
    // Load saved music volume
    const savedMusicVolume = localStorage.getItem('musicVolume');
    if (savedMusicVolume !== null) {
        const volume = parseFloat(savedMusicVolume);
        const percent = Math.round(volume * 100);
        
        const musicVolumeSlider = document.getElementById('music-volume');
        const musicVolumeValue = document.getElementById('music-volume-value');
        
        if (musicVolumeSlider && musicVolumeValue) {
            musicVolumeSlider.value = percent;
            musicVolumeValue.textContent = `${percent}%`;
            
            if (audioManager && !isMusicMuted) {
                audioManager.setMusicVolume(volume);
            }
        }
    }
    
    // Load saved sound volume
    const savedSoundVolume = localStorage.getItem('soundVolume');
    if (savedSoundVolume !== null) {
        const volume = parseFloat(savedSoundVolume);
        const percent = Math.round(volume * 100);
        
        const soundVolumeSlider = document.getElementById('sound-volume');
        const soundVolumeValue = document.getElementById('sound-volume-value');
        
        if (soundVolumeSlider && soundVolumeValue) {
            soundVolumeSlider.value = percent;
            soundVolumeValue.textContent = `${percent}%`;
            
            if (audioManager && !isSoundMuted) {
                audioManager.setSoundVolume(volume);
            }
        }
    }
}

/**
 * Update volume display
 */
export function updateVolumeDisplay() {
    if (!audioManager) return;
    
    const settings = audioManager.getSettings();
    const musicPercent = Math.round(settings.musicVolume * 100);
    const soundPercent = Math.round(settings.soundVolume * 100);
    
    const musicVolumeSlider = document.getElementById('music-volume');
    const soundVolumeSlider = document.getElementById('sound-volume');
    const musicVolumeValue = document.getElementById('music-volume-value');
    const soundVolumeValue = document.getElementById('sound-volume-value');
    
    if (musicVolumeSlider && !isMusicMuted) {
        musicVolumeSlider.value = musicPercent;
    }
    if (soundVolumeSlider && !isSoundMuted) {
        soundVolumeSlider.value = soundPercent;
    }
    if (musicVolumeValue) {
        musicVolumeValue.textContent = `${musicPercent}%`;
    }
    if (soundVolumeValue) {
        soundVolumeValue.textContent = `${soundPercent}%`;
    }
} 