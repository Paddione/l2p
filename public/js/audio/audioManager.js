/**
 * Audio Manager Module
 * Handles background music and sound effects with enhanced browser compatibility
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
    let soundVolume = 0.125; // 25% of previous 0.5 volume
    let backgroundMusic = null;
    let audioContext = null;
    let gainNode = null;
    let isInitialized = false;
    const audioElements = new Map();
    
    // Audio format fallback support
    const audioFormats = ['mp3', 'ogg', 'wav'];
    const supportedFormats = detectSupportedFormats();

    /**
     * Detects supported audio formats for this browser
     * @returns {Array<string>} Array of supported formats
     */
    function detectSupportedFormats() {
        const audio = document.createElement('audio');
        const formats = [];
        
        // Check MP3 support
        if (audio.canPlayType && audio.canPlayType('audio/mpeg') !== '') {
            formats.push('mp3');
        }
        
        // Check OGG support
        if (audio.canPlayType && audio.canPlayType('audio/ogg') !== '') {
            formats.push('ogg');
        }
        
        // Check WAV support
        if (audio.canPlayType && audio.canPlayType('audio/wav') !== '') {
            formats.push('wav');
        }
        
        console.log('Supported audio formats:', formats);
        return formats.length > 0 ? formats : ['mp3']; // Default to mp3 if detection fails
    }

    /**
     * Gets the best available audio format for a given sound
     * @param {string} soundName - Name of the sound file
     * @returns {string} URL to the best available format
     */
    function getBestAudioFormat(soundName) {
        // For now, we'll use MP3 as primary since all files are MP3
        // This structure allows for easy expansion to multiple formats
        const format = supportedFormats.includes('mp3') ? 'mp3' : supportedFormats[0];
        return `/assets/audio/${soundName}.${format}`;
    }

    /**
     * Creates a Web Audio API context with better browser compatibility
     * @returns {AudioContext|null}
     */
    function createAudioContext() {
        try {
            // Try standard AudioContext first
            if (window.AudioContext) {
                return new AudioContext();
            }
            // Fallback to webkit prefixed version
            if (window.webkitAudioContext) {
                return new webkitAudioContext();
            }
            console.warn('Web Audio API not supported in this browser');
            return null;
        } catch (error) {
            console.warn('Failed to create audio context:', error);
            return null;
        }
    }

    /**
     * Initializes the audio system with enhanced browser compatibility
     * @returns {Promise<void>}
     */
    async function initialize() {
        if (isInitialized) {
            console.log('Audio system already initialized');
            return;
        }

        try {
            console.log('Initializing audio system...');
            
            // Create audio context with fallbacks
            audioContext = createAudioContext();
            
            if (audioContext) {
                console.log('Audio context created:', audioContext.state);
                
                gainNode = audioContext.createGain();
                gainNode.connect(audioContext.destination);
                console.log('Main gain node created and connected');
            } else {
                console.warn('Web Audio API not available, using HTML5 audio only');
            }

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
                'applause',
                'combobreaker'
            ];

            console.log(`Starting to load ${sounds.length} audio files...`);
            
            // Load audio files asynchronously with enhanced error handling
            const loadPromises = sounds.map(sound => loadAudioFileWithFallback(sound));
            
            // Wait for all audio files to load (or timeout)
            const results = await Promise.allSettled(loadPromises);
            
            // Count successful loads
            let successCount = 0;
            let failCount = 0;
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successCount++;
                } else {
                    failCount++;
                    console.warn(`Failed to load ${sounds[index]}:`, result.reason);
                }
            });
            
            console.log(`Audio loading complete: ${successCount} successful, ${failCount} failed`);

            // Set up background music if it loaded successfully
            const backgroundMusicElement = audioElements.get('background-music');
            if (backgroundMusicElement) {
                backgroundMusic = backgroundMusicElement;
                backgroundMusic.loop = true;
                console.log('Background music configured');
            } else {
                console.warn('Background music failed to load');
            }

            // Handle audio context state for browser autoplay policy
            if (audioContext) {
                if (audioContext.state === 'suspended') {
                    console.log('Audio context is suspended (browser autoplay policy)');
                    // Set up user interaction handler to resume context
                    setupUserInteractionHandler();
                }
            }

            isInitialized = true;
            console.log('Audio system initialization complete');
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            // Don't throw error - allow app to continue without audio
            isInitialized = true; // Mark as initialized to prevent retry loops
            console.warn('Audio system initialized with errors - continuing without full audio support');
        }
    }

    /**
     * Sets up user interaction handler to resume audio context
     */
    function setupUserInteractionHandler() {
        const resumeAudioContext = async () => {
            if (audioContext && audioContext.state === 'suspended') {
                try {
                    await audioContext.resume();
                    console.log('Audio context resumed after user interaction');
                } catch (error) {
                    console.warn('Failed to resume audio context:', error);
                }
            }
            // Remove listeners after first successful resume
            document.removeEventListener('click', resumeAudioContext);
            document.removeEventListener('keydown', resumeAudioContext);
            document.removeEventListener('touchstart', resumeAudioContext);
        };

        // Listen for various user interaction events
        document.addEventListener('click', resumeAudioContext, { once: true });
        document.addEventListener('keydown', resumeAudioContext, { once: true });
        document.addEventListener('touchstart', resumeAudioContext, { once: true });
    }

    /**
     * Loads a single audio file with fallback format support and enhanced error handling
     * @param {string} sound - Sound name
     * @returns {Promise<void>}
     */
    async function loadAudioFileWithFallback(sound) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Timeout loading ${sound}`));
            }, 8000); // Increased timeout to 8 seconds for better reliability

            const audio = new Audio();
            
            // Enhanced preloading settings
            audio.preload = 'auto';
            audio.crossOrigin = 'anonymous'; // For CORS if needed
            
            // Success handler
            const onSuccess = () => {
                clearTimeout(timeout);
                console.log(`Sound loaded successfully: ${sound}`);
                
                try {
                    // Connect to Web Audio API for volume control (if available)
                    if (audioContext && audioContext.state !== 'closed') {
                        const source = audioContext.createMediaElementSource(audio);
                        const soundGain = audioContext.createGain();
                        source.connect(soundGain);
                        soundGain.connect(audioContext.destination);
                        soundGain.gain.value = sound === 'background-music' ? musicVolume : soundVolume;

                        // Store gain node reference
                        audio.gainNode = soundGain;
                        console.log(`Audio routing set up for: ${sound}`);
                    } else {
                        // Fallback to HTML5 audio volume control
                        audio.volume = sound === 'background-music' ? musicVolume : soundVolume;
                        console.log(`Using HTML5 audio volume for: ${sound}`);
                    }
                } catch (routingError) {
                    console.warn(`Failed to set up audio routing for ${sound}:`, routingError);
                    // Fallback to HTML5 audio volume control
                    audio.volume = sound === 'background-music' ? musicVolume : soundVolume;
                }
                
                audioElements.set(sound, audio);
                resolve();
            };
            
            // Error handler with fallback format support
            const onError = (e) => {
                clearTimeout(timeout);
                console.warn(`Primary format failed for ${sound}, trying fallbacks...`);
                
                // For now, just reject since all our files are MP3
                // This structure allows for future fallback format implementation
                reject(new Error(`Error loading ${sound}: ${e.message || 'Unknown error'}`));
            };
            
            // Enhanced event listeners
            audio.addEventListener('canplaythrough', onSuccess, { once: true });
            audio.addEventListener('loadeddata', () => {
                console.log(`Audio data loaded for: ${sound}`);
            }, { once: true });
            audio.addEventListener('error', onError, { once: true });
            
            // Start loading with best available format
            audio.src = getBestAudioFormat(sound);
        });
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
                    console.log('Audio context suspended, attempting to resume...');
                    try {
                        // Add timeout to prevent hanging on browser autoplay policy
                        await Promise.race([
                            audioContext.resume(),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('Audio context resume timeout')), 1000)
                            )
                        ]);
                        console.log('Audio context resumed successfully');
                    } catch (resumeError) {
                        console.warn('Audio context resume failed (this is expected due to browser autoplay policy):', resumeError.message);
                        // Don't throw - this is expected behavior, audio will start on user interaction
                        return;
                    }
                }
                
                // Only try to play if audio context is running
                if (audioContext.state === 'running') {
                    await backgroundMusic.play();
                    setMusicVolume(musicVolume);
                    console.log('Background music started successfully');
                } else {
                    console.log('Audio context not running, background music will start after user interaction');
                }
            } catch (error) {
                console.warn('Failed to play background music (this is expected due to browser autoplay policy):', error.message);
                // Don't throw - this is expected behavior, audio will start on user interaction
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
     * Plays the combo breaker sound (when multiplier stacks are lost)
     * @returns {Promise<void>}
     */
    async function playComboBreaker() {
        console.log('🔊 playComboBreaker() called - Playing combo breaker sound');
        if (!isInitialized) await initialize();

        if (!isSoundEnabled) {
            console.log('🔇 Sound disabled, not playing combo breaker sound');
            return;
        }

        const sound = audioElements.get('combobreaker');
        if (sound) {
            try {
                console.log('🎵 Playing combobreaker.mp3 sound');
                sound.currentTime = 0;
                await sound.play();
                console.log('✅ Combo breaker sound played successfully');
            } catch (error) {
                console.error('❌ Failed to play combo breaker sound:', error);
            }
        } else {
            console.warn('⚠️ Combo breaker sound element not found in audioElements');
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
     * Generic sound playing function with enhanced browser compatibility
     * @param {string} soundName - Name of the sound to play
     * @returns {Promise<void>}
     */
    async function playSound(soundName) {
        if (!isInitialized) await initialize();
        if (!isSoundEnabled) return;

        const sound = audioElements.get(soundName);
        if (sound) {
            try {
                // Reset audio position for replay
                sound.currentTime = 0;
                
                // Resume audio context if needed (browser autoplay policy)
                if (audioContext && audioContext.state === 'suspended') {
                    try {
                        await audioContext.resume();
                        console.log('Audio context resumed for sound playback');
                    } catch (resumeError) {
                        console.warn('Failed to resume audio context:', resumeError);
                    }
                }
                
                // Attempt to play the sound
                await sound.play();
                
            } catch (error) {
                // Handle different types of audio playback errors
                if (error.name === 'NotAllowedError') {
                    console.warn(`Autoplay blocked for ${soundName} - user interaction required`);
                    // Could implement a user interaction prompt here
                } else if (error.name === 'NotSupportedError') {
                    console.warn(`Audio format not supported for ${soundName}`);
                } else if (error.name === 'AbortError') {
                    console.warn(`Audio playback aborted for ${soundName}`);
                } else {
                    console.warn(`Failed to play sound ${soundName}:`, error.message);
                }
            }
        } else {
            console.warn(`Sound ${soundName} not found in audio elements`);
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
     * Sets music volume with HTML5 audio fallback support
     * @param {number} volume - Volume level (0-1)
     */
    function setMusicVolume(volume) {
        musicVolume = Math.min(Math.max(volume, 0), 1);
        console.log(`Setting music volume to: ${musicVolume}`);
        
        // Update background music volume if playing
        if (backgroundMusic) {
            if (backgroundMusic.gainNode) {
                // Use Web Audio API gain node if available
                backgroundMusic.gainNode.gain.value = musicVolume;
            } else {
                // Fallback to HTML5 audio volume
                backgroundMusic.volume = musicVolume;
            }
        }
        
        // Update volume for all music elements
        audioElements.forEach((audio, name) => {
            if (name === 'background-music') {
                if (audio.gainNode) {
                    audio.gainNode.gain.value = musicVolume;
                } else {
                    audio.volume = musicVolume;
                }
            }
        });
    }

    /**
     * Sets sound effects volume with HTML5 audio fallback support
     * @param {number} volume - Volume level (0-1)
     */
    function setSoundVolume(volume) {
        soundVolume = Math.min(Math.max(volume, 0), 1);
        console.log(`Setting sound effects volume to: ${soundVolume}`);
        
        // Update volume for all sound effect elements
        audioElements.forEach((audio, name) => {
            if (name !== 'background-music') {
                if (audio.gainNode) {
                    // Use Web Audio API gain node if available
                    audio.gainNode.gain.value = soundVolume;
                } else {
                    // Fallback to HTML5 audio volume
                    audio.volume = soundVolume;
                }
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
        playComboBreaker,
        playButtonClick,
        playButtonHover,
        playModalOpen,
        playModalClose,
        playNotification,
        playErrorAlert,
        playSuccessChime,
        playQuestionStart,
        playTimerWarning,
        playTimerUrgent,
        playGameStart,
        playRoundEnd,
        playPlayerJoin,
        playPlayerLeave,
        playPlayerReady,
        playLobbyCreated,
        playPerfectScore,
        playHighScore,
        playStreakBonus,
        playMultiplierMax,
        playTimeBonus,
        playCountdownTick,
        playWhoosh,
        playSparkle,
        playApplause,
        setMusicEnabled,
        setSoundEnabled,
        setMusicVolume,
        setSoundVolume,
        getSettings,
        addButtonClickSound,
        addButtonClickSounds
    };

    // Make audio manager globally accessible for debugging
    window.audioManager = audioManagerInstance;
    console.log('Audio manager instance created and set as window.audioManager');

    return audioManagerInstance;
} 