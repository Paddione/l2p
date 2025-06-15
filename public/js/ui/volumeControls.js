/**
 * Volume Controls Module
 * Handles the volume control sliders and connects them to the audio manager
 */

let audioManager = null;

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
    
    if (!musicVolumeSlider || !soundVolumeSlider || !musicVolumeValue || !soundVolumeValue) {
        console.warn('Volume control elements not found');
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
    
    // Music volume control
    musicVolumeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const volume = value / 100;
        
        // Update audio manager
        audioManager.setMusicVolume(volume);
        
        // Update display
        musicVolumeValue.textContent = `${value}%`;
        
        // Save to localStorage
        localStorage.setItem('musicVolume', volume.toString());
        
        console.log(`Music volume set to ${value}%`);
    });
    
    // Sound effects volume control
    soundVolumeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const volume = value / 100;
        
        // Update audio manager
        audioManager.setSoundVolume(volume);
        
        // Update display
        soundVolumeValue.textContent = `${value}%`;
        
        // Save to localStorage
        localStorage.setItem('soundVolume', volume.toString());
        
        console.log(`Sound effects volume set to ${value}%`);
    });
    
    // Load saved volumes from localStorage
    loadSavedVolumes();
    
    console.log('Volume controls initialized');
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
    }
    
    if (savedSoundVolume !== null) {
        const volume = parseFloat(savedSoundVolume);
        const percent = Math.round(volume * 100);
        
        document.getElementById('sound-volume').value = percent;
        document.getElementById('sound-volume-value').textContent = `${percent}%`;
        audioManager.setSoundVolume(volume);
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
    }
    
    if (soundSlider && soundValue) {
        soundSlider.value = soundPercent;
        soundValue.textContent = `${soundPercent}%`;
    }
} 