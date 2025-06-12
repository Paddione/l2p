/**
 * Audio Manager Module
 * Handles background music and sound effects
 */

// Singleton instance
let audioManagerInstance = null;

export function initAudioManager() {
    // Return existing instance if already created
    if (audioManagerInstance) {
        console.log('Audio manager already initialized, returning existing instance');
        return audioManagerInstance;
    }

    let isMusicEnabled = true;
    let isSoundEnabled = true;
    let musicVolume = 0.3;
    let soundVolume = 0.5;
    let backgroundMusic = null;
    let audioContext = null;
    let gainNode = null;
    let isInitialized = false;
    const audioElements = new Map();

    /**
     * Initializes the audio system
     * @returns {Promise<void>}
     */
    async function initialize() {
        if (isInitialized) return;

        try {
            console.log('Initializing audio system...');
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context created:', audioContext.state);
            
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
            console.log('Main gain node created and connected');

            // Create audio elements
            const sounds = [
                'background-music',
                'correct1',
                'correct2',
                'correct3',
                'correct4',
                'correct5',
                'wrong',
                // UI Sounds
                'button-click',
                'button-hover',
                'modal-open',
                'modal-close',
                'notification',
                'error-alert',
                'success-chime',
                // Game State Sounds
                'question-start',
                'timer-warning',
                'timer-urgent',
                'game-start',
                'game-end',
                'round-end',
                // Player Interaction Sounds
                'player-join',
                'player-leave',
                'player-ready',
                'lobby-created',
                // Achievement/Score Sounds
                'perfect-score',
                'high-score',
                'streak-bonus',
                'multiplier-max',
                'time-bonus',
                // Ambient/Atmosphere
                'countdown-tick',
                'whoosh',
                'sparkle',
                'applause'
            ];

            for (const sound of sounds) {
                console.log(`Loading sound: ${sound}`);
                const audio = new Audio();
                audio.preload = 'auto';
                
                // Add error handling for loading
                audio.onerror = (e) => {
                    console.error(`Error loading ${sound}:`, e);
                };
                
                // Add load event handler
                audio.oncanplaythrough = () => {
                    console.log(`Sound loaded successfully: ${sound}`);
                };
                
                // Set source after adding handlers
                audio.src = `/public/assets/audio/${sound}.mp3`;
                audioElements.set(sound, audio);

                try {
                    // Connect to Web Audio API for volume control
                    const source = audioContext.createMediaElementSource(audio);
                    const soundGain = audioContext.createGain();
                    source.connect(soundGain);
                    soundGain.connect(audioContext.destination);
                    soundGain.gain.value = sound === 'background-music' ? musicVolume : soundVolume;

                    // Store gain node reference
                    audio.gainNode = soundGain;
                    console.log(`Audio routing set up for: ${sound}`);
                } catch (error) {
                    console.error(`Failed to set up audio routing for ${sound}:`, error);
                    throw error;
                }
            }

            // Set up background music
            backgroundMusic = audioElements.get('background-music');
            backgroundMusic.loop = true;

            // Resume audio context if it's suspended (browser autoplay policy)
            if (audioContext.state === 'suspended') {
                console.log('Audio context is suspended, attempting to resume...');
                await audioContext.resume();
                console.log('Audio context resumed:', audioContext.state);
            }

            isInitialized = true;
            console.log('Audio system initialization complete');
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw new Error(`Failed to initialize audio system: ${error.message}`);
        }
    }

    /**
     * Starts playing background music
     * @returns {Promise<void>}
     */
    async function playBackgroundMusic() {
        if (!isInitialized) {
            console.log('Audio not initialized, initializing now...');
            await initialize();
        }

        if (isMusicEnabled && backgroundMusic) {
            try {
                console.log('Attempting to play background music...');
                if (audioContext.state === 'suspended') {
                    console.log('Audio context suspended, resuming...');
                    await audioContext.resume();
                }
                await backgroundMusic.play();
                setMusicVolume(musicVolume);
                console.log('Background music started successfully');
            } catch (error) {
                console.error('Failed to play background music:', error);
                throw error;
            }
        }
    }

    /**
     * Stops background music
     */
    function stopBackgroundMusic() {
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        }
    }

    /**
     * Plays a sound effect for a multiplier
     * @param {number} multiplier - Current multiplier (1-5)
     * @returns {Promise<void>}
     */
    async function playMultiplierSound(multiplier) {
        if (!isInitialized) await initialize();

        if (!isSoundEnabled) return;

        const soundName = `correct${Math.min(Math.max(multiplier, 1), 5)}`;
        const sound = audioElements.get(soundName);
        
        if (sound) {
            try {
                sound.currentTime = 0;
                await sound.play();
            } catch (error) {
                console.error(`Failed to play sound effect ${soundName}:`, error);
            }
        }
    }

    /**
     * Plays the wrong answer sound
     * @returns {Promise<void>}
     */
    async function playWrongSound() {
        console.log('🔊 playWrongSound() called - Audio Manager Instance:', audioManagerInstance ? 'Singleton' : 'New');
        if (!isInitialized) await initialize();

        if (!isSoundEnabled) {
            console.log('🔇 Sound disabled, not playing wrong sound');
            return;
        }

        const sound = audioElements.get('wrong');
        if (sound) {
            try {
                console.log('🎵 Playing wrong.mp3 sound');
                sound.currentTime = 0;
                await sound.play();
                console.log('✅ Wrong sound played successfully');
            } catch (error) {
                console.error('❌ Failed to play wrong answer sound:', error);
            }
        } else {
            console.warn('⚠️ Wrong sound element not found in audioElements');
        }
    }

    /**
     * Plays UI interaction sounds
     */
    async function playButtonClick() {
        await playSound('button-click');
    }

    async function playButtonHover() {
        await playSound('button-hover');
    }

    async function playModalOpen() {
        await playSound('modal-open');
    }

    async function playModalClose() {
        await playSound('modal-close');
    }

    async function playNotification() {
        await playSound('notification');
    }

    async function playErrorAlert() {
        await playSound('error-alert');
    }

    async function playSuccessChime() {
        await playSound('success-chime');
    }

    /**
     * Plays game state sounds
     */
    async function playQuestionStart() {
        await playSound('question-start');
    }

    async function playTimerWarning() {
        await playSound('timer-warning');
    }

    async function playTimerUrgent() {
        await playSound('timer-urgent');
    }

    async function playGameStart() {
        await playSound('game-start');
    }

    async function playGameEnd() {
        await playSound('game-end');
    }

    async function playRoundEnd() {
        await playSound('round-end');
    }

    /**
     * Plays player interaction sounds
     */
    async function playPlayerJoin() {
        await playSound('player-join');
    }

    async function playPlayerLeave() {
        await playSound('player-leave');
    }

    async function playPlayerReady() {
        await playSound('player-ready');
    }

    async function playLobbyCreated() {
        await playSound('lobby-created');
    }

    /**
     * Plays achievement/score sounds
     */
    async function playPerfectScore() {
        await playSound('perfect-score');
    }

    async function playHighScore() {
        await playSound('high-score');
    }

    async function playStreakBonus() {
        await playSound('streak-bonus');
    }

    async function playMultiplierMax() {
        await playSound('multiplier-max');
    }

    async function playTimeBonus() {
        await playSound('time-bonus');
    }

    /**
     * Plays ambient/atmosphere sounds
     */
    async function playCountdownTick() {
        await playSound('countdown-tick');
    }

    async function playWhoosh() {
        await playSound('whoosh');
    }

    async function playSparkle() {
        await playSound('sparkle');
    }

    async function playApplause() {
        await playSound('applause');
    }

    /**
     * Generic sound playing function
     * @param {string} soundName - Name of the sound to play
     * @returns {Promise<void>}
     */
    async function playSound(soundName) {
        if (!isInitialized) await initialize();
        if (!isSoundEnabled) return;

        const sound = audioElements.get(soundName);
        if (sound) {
            try {
                sound.currentTime = 0;
                await sound.play();
            } catch (error) {
                console.warn(`Failed to play sound ${soundName}:`, error);
            }
        } else {
            console.warn(`Sound ${soundName} not found`);
        }
    }

    /**
     * Sets music enabled state
     * @param {boolean} enabled - Whether music is enabled
     */
    function setMusicEnabled(enabled) {
        isMusicEnabled = enabled;
        if (!enabled) {
            stopBackgroundMusic();
        } else if (isInitialized) {
            playBackgroundMusic();
        }
    }

    /**
     * Sets sound effects enabled state
     * @param {boolean} enabled - Whether sound effects are enabled
     */
    function setSoundEnabled(enabled) {
        isSoundEnabled = enabled;
    }

    /**
     * Sets music volume
     * @param {number} volume - Volume level (0-1)
     */
    function setMusicVolume(volume) {
        musicVolume = Math.min(Math.max(volume, 0), 1);
        if (backgroundMusic && backgroundMusic.gainNode) {
            backgroundMusic.gainNode.gain.value = musicVolume;
        }
    }

    /**
     * Sets sound effects volume
     * @param {number} volume - Volume level (0-1)
     */
    function setSoundVolume(volume) {
        soundVolume = Math.min(Math.max(volume, 0), 1);
        audioElements.forEach((audio, name) => {
            if (name !== 'background-music' && audio.gainNode) {
                audio.gainNode.gain.value = soundVolume;
            }
        });
    }

    /**
     * Gets current audio settings
     * @returns {Object} - Audio settings
     */
    function getSettings() {
        return {
            isMusicEnabled,
            isSoundEnabled,
            musicVolume,
            soundVolume
        };
    }

    /**
     * Adds click sound to a button element
     * @param {HTMLElement} button - Button element to add sound to
     */
    function addButtonClickSound(button) {
        if (!button) return;
        
        button.addEventListener('click', () => {
            playButtonClick().catch(e => console.warn('Failed to play button click sound:', e));
        });
    }

    /**
     * Adds click sounds to all buttons matching a selector
     * @param {string} selector - CSS selector for buttons
     */
    function addButtonClickSounds(selector = 'button, .btn') {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(button => addButtonClickSound(button));
    }

    audioManagerInstance = {
        initialize,
        playBackgroundMusic,
        stopBackgroundMusic,
        playMultiplierSound,
        playWrongSound,
        // UI Sounds
        playButtonClick,
        playButtonHover,
        playModalOpen,
        playModalClose,
        playNotification,
        playErrorAlert,
        playSuccessChime,
        // Game State Sounds
        playQuestionStart,
        playTimerWarning,
        playTimerUrgent,
        playGameStart,
        playGameEnd,
        playRoundEnd,
        // Player Interaction Sounds
        playPlayerJoin,
        playPlayerLeave,
        playPlayerReady,
        playLobbyCreated,
        // Achievement/Score Sounds
        playPerfectScore,
        playHighScore,
        playStreakBonus,
        playMultiplierMax,
        playTimeBonus,
        // Ambient/Atmosphere Sounds
        playCountdownTick,
        playWhoosh,
        playSparkle,
        playApplause,
        // Utility functions
        addButtonClickSound,
        addButtonClickSounds,
        // Settings
        setMusicEnabled,
        setSoundEnabled,
        setMusicVolume,
        setSoundVolume,
        getSettings
    };

    // Make audio manager globally accessible for debugging
    window.audioManager = audioManagerInstance;
    console.log('Audio manager instance created and set as window.audioManager');

    return audioManagerInstance;
} 