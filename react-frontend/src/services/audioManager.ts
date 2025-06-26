import type { AudioSettings, AudioManager as AudioManagerInterface } from '../types/game';

// Audio file mappings - in a real implementation, these would be actual audio files
const AUDIO_FILES = {
  // Game Events
  gameStart: '/assets/audio/game-start.mp3',
  gameEnd: '/assets/audio/game-end.mp3',
  questionStart: '/assets/audio/question-start.mp3',
  questionEnd: '/assets/audio/question-end.mp3',
  
  // Answer Feedback
  correctAnswer: '/assets/audio/correct-answer.mp3',
  incorrectAnswer: '/assets/audio/incorrect-answer.mp3',
  perfectScore: '/assets/audio/perfect-score.mp3',
  
  // UI Interactions
  buttonClick: '/assets/audio/button-click.mp3',
  buttonHover: '/assets/audio/button-hover.mp3',
  notification: '/assets/audio/notification.mp3',
  error: '/assets/audio/error.mp3',
  success: '/assets/audio/success.mp3',
  warning: '/assets/audio/warning.mp3',
  
  // Timer
  countdown: '/assets/audio/countdown.mp3',
  timeWarning: '/assets/audio/time-warning.mp3',
  timeUp: '/assets/audio/time-up.mp3',
  
  // Multiplayer
  playerJoined: '/assets/audio/player-joined.mp3',
  playerLeft: '/assets/audio/player-left.mp3',
  lobbyFull: '/assets/audio/lobby-full.mp3',
  
  // Achievements
  firstPlace: '/assets/audio/first-place.mp3',
  newHighScore: '/assets/audio/new-high-score.mp3',
  streakBonus: '/assets/audio/streak-bonus.mp3',
  multiplierActivated: '/assets/audio/multiplier-activated.mp3',
  
  // Ambient
  lobbyAmbient: '/assets/audio/lobby-ambient.mp3',
  gameplayAmbient: '/assets/audio/gameplay-ambient.mp3',
  menuAmbient: '/assets/audio/menu-ambient.mp3',
  
  // Navigation
  pageTransition: '/assets/audio/page-transition.mp3',
  modalOpen: '/assets/audio/modal-open.mp3',
  modalClose: '/assets/audio/modal-close.mp3',
  
  // Feedback
  typing: '/assets/audio/typing.mp3',
  hover: '/assets/audio/hover.mp3',
  select: '/assets/audio/select.mp3',
  deselect: '/assets/audio/deselect.mp3',
} as const;

// Default audio settings
const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  soundEffectsVolume: 0.8,
  backgroundMusicVolume: 0.4,
  enabled: true,
};

class AudioManager implements AudioManagerInterface {
  private settings: AudioSettings;
  private audioContext: AudioContext | null = null;
  private audioCache: Map<string, AudioBuffer> = new Map();
  private backgroundMusic: HTMLAudioElement | null = null;
  private currentBackgroundTrack: string | null = null;
  private soundQueue: Array<{ buffer: AudioBuffer; volume: number; startTime: number }> = [];
  private mutedState: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Load settings from localStorage or use defaults
    const saved = localStorage.getItem('audioSettings');
    this.settings = saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    
    // Initialize on user interaction to comply with browser autoplay policies
    this.initializeOnUserInteraction();
  }

  private async initializeOnUserInteraction(): Promise<void> {
    const initAudio = async () => {
      if (!this.isInitialized) {
        await this.initialize();
        // Remove listeners after first initialization
        document.removeEventListener('click', initAudio);
        document.removeEventListener('keydown', initAudio);
        document.removeEventListener('touchstart', initAudio);
      }
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize Web Audio API context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Preload critical sounds
      await this.preloadCriticalSounds();
      
      this.isInitialized = true;
      console.log('🔊 Audio Manager initialized successfully');
    } catch (error) {
      console.warn('🔇 Failed to initialize audio:', error);
      this.settings.enabled = false;
    }
  }

  private async preloadCriticalSounds(): Promise<void> {
    const criticalSounds = [
      'buttonClick',
      'correctAnswer',
      'incorrectAnswer',
      'notification',
      'countdown'
    ];

    const promises = criticalSounds.map(sound => this.loadAudio(AUDIO_FILES[sound as keyof typeof AUDIO_FILES]));
    await Promise.allSettled(promises);
  }

  private async loadAudio(url: string): Promise<AudioBuffer | null> {
    if (!this.audioContext || this.audioCache.has(url)) {
      return this.audioCache.get(url) || null;
    }

    try {
      // For demonstration, we'll create a simple tone instead of loading files
      // In a real implementation, you would fetch and decode actual audio files
      const buffer = this.createToneBuffer(440, 0.2); // Simple beep
      this.audioCache.set(url, buffer);
      return buffer;
    } catch (error) {
      console.warn(`Failed to load audio: ${url}`, error);
      return null;
    }
  }

  private createToneBuffer(frequency: number, duration: number): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3);
    }

    return buffer;
  }

  private async playBuffer(buffer: AudioBuffer, volume: number = 1): Promise<void> {
    if (!this.audioContext || !this.settings.enabled || this.mutedState) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const finalVolume = volume * this.settings.soundEffectsVolume * this.settings.masterVolume;
      gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
      
      source.start();
    } catch (error) {
      console.warn('Failed to play audio buffer:', error);
    }
  }

  private async playSound(soundKey: keyof typeof AUDIO_FILES, volume: number = 1): Promise<void> {
    if (!this.settings.enabled || this.isMuted) return;

    const url = AUDIO_FILES[soundKey];
    let buffer = this.audioCache.get(url);

    if (!buffer) {
      buffer = await this.loadAudio(url);
      if (!buffer) return;
    }

    await this.playBuffer(buffer, volume);
  }

  private saveSettings(): void {
    localStorage.setItem('audioSettings', JSON.stringify(this.settings));
  }

  // Public API methods

  async playCorrectAnswer(): Promise<void> {
    await this.playSound('correctAnswer', 0.8);
  }

  async playIncorrectAnswer(): Promise<void> {
    await this.playSound('incorrectAnswer', 0.6);
  }

  async playGameStart(): Promise<void> {
    await this.playSound('gameStart', 1.0);
  }

  async playGameEnd(): Promise<void> {
    await this.playSound('gameEnd', 1.0);
  }

  async playCountdown(): Promise<void> {
    await this.playSound('countdown', 0.7);
  }

  async playButtonClick(): Promise<void> {
    await this.playSound('buttonClick', 0.5);
  }

  async playNotification(): Promise<void> {
    await this.playSound('notification', 0.6);
  }

  async playSuccess(): Promise<void> {
    await this.playSound('success', 0.8);
  }

  async playError(): Promise<void> {
    await this.playSound('error', 0.7);
  }

  async playWarning(): Promise<void> {
    await this.playSound('warning', 0.7);
  }

  async playPlayerJoined(): Promise<void> {
    await this.playSound('playerJoined', 0.6);
  }

  async playPlayerLeft(): Promise<void> {
    await this.playSound('playerLeft', 0.5);
  }

  async playTimeWarning(): Promise<void> {
    await this.playSound('timeWarning', 0.8);
  }

  async playMultiplierActivated(): Promise<void> {
    await this.playSound('multiplierActivated', 0.9);
  }

  async playNewHighScore(): Promise<void> {
    await this.playSound('newHighScore', 1.0);
  }

  // Background Music
  async playBackgroundMusic(track: keyof typeof AUDIO_FILES): Promise<void> {
    if (!this.settings.enabled || this.isMuted) return;

    // Stop current background music
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic = null;
    }

    try {
      // In a real implementation, you would use actual audio files
      // For now, we'll skip background music implementation
      this.currentBackgroundTrack = track;
      console.log(`🎵 Playing background music: ${track}`);
    } catch (error) {
      console.warn('Failed to play background music:', error);
    }
  }

  stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic = null;
    }
    this.currentBackgroundTrack = null;
  }

  // Volume Controls
  setVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  setMasterVolume(volume: number): void {
    this.setVolume(volume);
  }

  setSoundEffectsVolume(volume: number): void {
    this.settings.soundEffectsVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  setBackgroundMusicVolume(volume: number): void {
    this.settings.backgroundMusicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = volume * this.settings.masterVolume;
    }
    this.saveSettings();
  }

  // Mute Controls
  mute(): void {
    this.isMuted = true;
    if (this.backgroundMusic) {
      this.backgroundMusic.muted = true;
    }
  }

  unmute(): void {
    this.isMuted = false;
    if (this.backgroundMusic) {
      this.backgroundMusic.muted = false;
    }
  }

  isMuted(): boolean {
    return this.isMuted;
  }

  // Settings
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // Utility
  isEnabled(): boolean {
    return this.settings.enabled && this.isInitialized;
  }

  async testSound(): Promise<void> {
    await this.playButtonClick();
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
export default audioManager; 