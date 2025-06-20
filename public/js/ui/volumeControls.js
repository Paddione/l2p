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

/**
 * Initialize volume controls
 * @param {Object} audioManagerInstance - The audio manager instance
 */
export function initVolumeControls(audioManagerInstance) {
    audioManager = audioManagerInstance;
    
    // Get volume control elements
    const musicVolumeSlider = document.getElementById('music-volume');
    const soundVolumeSlider = document.getElementById('sound-volume');
    const musicVolumeValue = document.getElementById('music-volume-value');
    const soundVolumeValue = document.getElementById('sound-volume-value');
    const musicMuteBtn = document.getElementById('music-mute-btn');
    const soundMuteBtn = document.getElementById('sound-mute-btn');
    
    if (!musicVolumeSlider || !soundVolumeSlider || !musicVolumeValue || !soundVolumeValue) {
        console.warn('Volume control elements not found');
        return;
    }
    
    if (!musicMuteBtn || !soundMuteBtn) {
        console.warn('Mute button elements not found');
        return;
    }
    
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
    
    // Music volume control
    musicVolumeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const volume = value / 100;
        
        // If user moves slider and was muted, unmute
        if (isMusicMuted && value > 0) {
            isMusicMuted = false;
            musicMuteBtn.classList.remove('muted');
            localStorage.setItem('musicMuted', 'false');
        }
        
        // Update audio manager
        audioManager.setMusicVolume(volume);
        
        // Update display
        musicVolumeValue.textContent = `${value}%`;
        
        // Save to localStorage
        localStorage.setItem('musicVolume', volume.toString());
        
        // Update last known volume
        if (value > 0) {
            lastMusicVolume = value;
        }
        
        console.log(`Music volume set to ${value}%`);
    });
    
    // Sound effects volume control
    soundVolumeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const volume = value / 100;
        
        // If user moves slider and was muted, unmute
        if (isSoundMuted && value > 0) {
            isSoundMuted = false;
            soundMuteBtn.classList.remove('muted');
            localStorage.setItem('soundMuted', 'false');
        }
        
        // Update audio manager
        audioManager.setSoundVolume(volume);
        
        // Update display
        soundVolumeValue.textContent = `${value}%`;
        
        // Save to localStorage
        localStorage.setItem('soundVolume', volume.toString());
        
        // Update last known volume
        if (value > 0) {
            lastSoundVolume = value;
        }
        
        console.log(`Sound effects volume set to ${value}%`);
    });
    
    // Music mute button
    musicMuteBtn.addEventListener('click', toggleMusicMute);
    
    // Sound mute button
    soundMuteBtn.addEventListener('click', toggleSoundMute);
    
    // Load saved volumes from localStorage
    loadSavedVolumes();
    
    console.log('Volume controls with mute functionality initialized');
}

/**
 * Toggle music mute state
 */
function toggleMusicMute() {
    const musicVolumeSlider = document.getElementById('music-volume');
    const musicVolumeValue = document.getElementById('music-volume-value');
    const musicMuteBtn = document.getElementById('music-mute-btn');
    
    if (!musicVolumeSlider || !musicVolumeValue || !musicMuteBtn) return;
    
    if (isMusicMuted) {
        // Unmute - restore previous volume
        isMusicMuted = false;
        musicMuteBtn.classList.remove('muted');
        
        const volume = lastMusicVolume / 100;
        musicVolumeSlider.value = lastMusicVolume;
        musicVolumeValue.textContent = `${lastMusicVolume}%`;
        
        audioManager.setMusicVolume(volume);
        localStorage.setItem('musicVolume', volume.toString());
        localStorage.setItem('musicMuted', 'false');
        
        console.log(`Music unmuted - restored to ${lastMusicVolume}%`);
    } else {
        // Mute - save current volume and set to 0
        isMusicMuted = true;
        musicMuteBtn.classList.add('muted');
        
        const currentVolume = parseInt(musicVolumeSlider.value);
        if (currentVolume > 0) {
            lastMusicVolume = currentVolume;
        }
        
        musicVolumeSlider.value = 0;
        musicVolumeValue.textContent = '0%';
        
        audioManager.setMusicVolume(0);
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
    
    if (!soundVolumeSlider || !soundVolumeValue || !soundMuteBtn) return;
    
    if (isSoundMuted) {
        // Unmute - restore previous volume
        isSoundMuted = false;
        soundMuteBtn.classList.remove('muted');
        
        const volume = lastSoundVolume / 100;
        soundVolumeSlider.value = lastSoundVolume;
        soundVolumeValue.textContent = `${lastSoundVolume}%`;
        
        audioManager.setSoundVolume(volume);
        localStorage.setItem('soundVolume', volume.toString());
        localStorage.setItem('soundMuted', 'false');
        
        console.log(`Sound effects unmuted - restored to ${lastSoundVolume}%`);
    } else {
        // Mute - save current volume and set to 0
        isSoundMuted = true;
        soundMuteBtn.classList.add('muted');
        
        const currentVolume = parseInt(soundVolumeSlider.value);
        if (currentVolume > 0) {
            lastSoundVolume = currentVolume;
        }
        
        soundVolumeSlider.value = 0;
        soundVolumeValue.textContent = '0%';
        
        audioManager.setSoundVolume(0);
        localStorage.setItem('soundVolume', '0');
        localStorage.setItem('soundMuted', 'true');
        
        console.log(`Sound effects muted - saved volume: ${lastSoundVolume}%`);
    }
}

/**
 * Load saved volume settings from localStorage
 */
function loadSavedVolumes() {
    const savedMusicVolume = localStorage.getItem('musicVolume');
    const savedSoundVolume = localStorage.getItem('soundVolume');
    
    if (savedMusicVolume !== null) {
        const volume = parseFloat(savedMusicVolume);
        const percent = Math.round(volume * 100);
        
        document.getElementById('music-volume').value = percent;
        document.getElementById('music-volume-value').textContent = `${percent}%`;
        audioManager.setMusicVolume(volume);
        
        if (percent > 0) {
            lastMusicVolume = percent;
        }
    }
    
    if (savedSoundVolume !== null) {
        const volume = parseFloat(savedSoundVolume);
        const percent = Math.round(volume * 100);
        
        document.getElementById('sound-volume').value = percent;
        document.getElementById('sound-volume-value').textContent = `${percent}%`;
        audioManager.setSoundVolume(volume);
        
        if (percent > 0) {
            lastSoundVolume = percent;
        }
    }
}

/**
 * Update volume controls display (useful when volumes are changed programmatically)
 */
export function updateVolumeDisplay() {
    if (!audioManager) return;
    
    const settings = audioManager.getSettings();
    const musicPercent = Math.round(settings.musicVolume * 100);
    const soundPercent = Math.round(settings.soundVolume * 100);
    
    const musicSlider = document.getElementById('music-volume');
    const soundSlider = document.getElementById('sound-volume');
    const musicValue = document.getElementById('music-volume-value');
    const soundValue = document.getElementById('sound-volume-value');
    
    if (musicSlider && musicValue) {
        musicSlider.value = musicPercent;
        musicValue.textContent = `${musicPercent}%`;
        
        if (musicPercent > 0) {
            lastMusicVolume = musicPercent;
        }
    }
    
    if (soundSlider && soundValue) {
        soundSlider.value = soundPercent;
        soundValue.textContent = `${soundPercent}%`;
        
        if (soundPercent > 0) {
            lastSoundVolume = soundPercent;
        }
    }
} 