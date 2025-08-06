export interface AudioFile {
  name: string
  path: string
  type: 'music' | 'sound' | 'ui' | 'streak'
}

export class AudioManager {
  private audioContext: AudioContext | null = null
  private audioBuffers: Map<string, AudioBuffer> = new Map()
  private gainNodes: Map<string, GainNode> = new Map()
  private isInitialized = false
  private audioFiles: AudioFile[] = [
    // Streak-based correct answer sounds
    { name: 'correct1', path: '/audio/correct1.mp3', type: 'streak' },
    { name: 'correct2', path: '/audio/correct2.mp3', type: 'streak' },
    { name: 'correct3', path: '/audio/correct3.mp3', type: 'streak' },
    { name: 'correct4', path: '/audio/correct4.mp3', type: 'streak' },
    { name: 'correct5', path: '/audio/correct5.mp3', type: 'streak' },
    
    // Wrong answer sound
    { name: 'wrong', path: '/audio/wrong.mp3', type: 'sound' },
    
    // UI interaction sounds
    { name: 'button-click', path: '/audio/button-click.mp3', type: 'ui' },
    { name: 'button-hover', path: '/audio/button-hover.mp3', type: 'ui' },
    { name: 'modal-open', path: '/audio/modal-open.mp3', type: 'ui' },
    { name: 'modal-close', path: '/audio/modal-close.mp3', type: 'ui' },
    
    // Player notification sounds
    { name: 'player-join', path: '/audio/player-join.mp3', type: 'sound' },
    { name: 'player-leave', path: '/audio/player-leave.mp3', type: 'sound' },
    
    // Timer warning sounds
    { name: 'timer-warning', path: '/audio/timer-warning.mp3', type: 'sound' },
    { name: 'timer-urgent', path: '/audio/timer-urgent.mp3', type: 'sound' },
    
    // Achievement sounds
    { name: 'applause', path: '/audio/applause.mp3', type: 'sound' },
    { name: 'high-score', path: '/audio/high-score.mp3', type: 'sound' },
    { name: 'perfect-score', path: '/audio/perfect-score.mp3', type: 'sound' },
    
    // Game state sounds
    { name: 'game-start', path: '/audio/game-start.mp3', type: 'sound' },
    { name: 'game-end', path: '/audio/game-end.mp3', type: 'sound' },
    { name: 'question-start', path: '/audio/question-start.mp3', type: 'sound' },
    { name: 'lobby-created', path: '/audio/lobby-created.mp3', type: 'sound' },
    { name: 'lobby-joined', path: '/audio/lobby-joined.mp3', type: 'sound' },
    
    // Background music
    { name: 'background-music', path: '/audio/background-music.mp3', type: 'music' },
    { name: 'lobby-music', path: '/audio/lobby-music.mp3', type: 'music' },
    
    // Additional UI sounds
    { name: 'notification', path: '/audio/notification.mp3', type: 'ui' },
    { name: 'success', path: '/audio/success.mp3', type: 'ui' },
    { name: 'error', path: '/audio/error.mp3', type: 'ui' },
    { name: 'tick', path: '/audio/tick.mp3', type: 'ui' },
    { name: 'countdown', path: '/audio/countdown.mp3', type: 'ui' },
    
    // Multiplier sounds
    { name: 'multiplier-up', path: '/audio/multiplier-up.mp3', type: 'sound' },
    { name: 'multiplier-reset', path: '/audio/multiplier-reset.mp3', type: 'sound' },
    
    // Score sounds
    { name: 'score-points', path: '/audio/score-points.mp3', type: 'sound' },
    { name: 'score-bonus', path: '/audio/score-bonus.mp3', type: 'sound' },
    
    // Menu sounds
    { name: 'menu-select', path: '/audio/menu-select.mp3', type: 'ui' },
    { name: 'menu-confirm', path: '/audio/menu-confirm.mp3', type: 'ui' },
    { name: 'menu-cancel', path: '/audio/menu-cancel.mp3', type: 'ui' },
    
    // Settings sounds
    { name: 'volume-change', path: '/audio/volume-change.mp3', type: 'ui' },
    { name: 'language-change', path: '/audio/language-change.mp3', type: 'ui' },
    { name: 'theme-change', path: '/audio/theme-change.mp3', type: 'ui' }
  ]

  constructor() {
    this.init()
  }

  private async init(): Promise<void> {
    try {
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create gain nodes for different audio types
      const musicGain = this.audioContext.createGain()
      const soundGain = this.audioContext.createGain()
      const uiGain = this.audioContext.createGain()
      const streakGain = this.audioContext.createGain()
      
      this.gainNodes.set('music', musicGain)
      this.gainNodes.set('sound', soundGain)
      this.gainNodes.set('ui', uiGain)
      this.gainNodes.set('streak', streakGain)
      
      // Connect gain nodes to destination
      musicGain.connect(this.audioContext.destination)
      soundGain.connect(this.audioContext.destination)
      uiGain.connect(this.audioContext.destination)
      streakGain.connect(this.audioContext.destination)
      
      // Load all audio files
      await this.loadAllAudioFiles()
      
      this.isInitialized = true
      console.log('AudioManager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize AudioManager:', error)
    }
  }

  private async loadAllAudioFiles(): Promise<void> {
    const loadPromises = this.audioFiles.map(file => this.loadAudioFile(file))
    await Promise.all(loadPromises)
  }

  private async loadAudioFile(audioFile: AudioFile): Promise<void> {
    try {
      const response = await fetch(audioFile.path)
      if (!response.ok) {
        console.warn(`Failed to load audio file: ${audioFile.path}`)
        return
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
      this.audioBuffers.set(audioFile.name, audioBuffer)
    } catch (error) {
      console.warn(`Error loading audio file ${audioFile.path}:`, error)
    }
  }

  public playSound(soundName: string, options: {
    volume?: number
    loop?: boolean
    fadeIn?: boolean
    fadeOut?: boolean
  } = {}): void {
    if (!this.isInitialized || !this.audioContext) {
      console.warn('AudioManager not initialized')
      return
    }

    const audioFile = this.audioFiles.find(file => file.name === soundName)
    if (!audioFile) {
      console.warn(`Audio file not found: ${soundName}`)
      return
    }

    const buffer = this.audioBuffers.get(soundName)
    if (!buffer) {
      console.warn(`Audio buffer not loaded: ${soundName}`)
      return
    }

    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()
    
    source.buffer = buffer
    source.loop = options.loop || false
    
    // Connect source to gain node, then to appropriate type gain node
    source.connect(gainNode)
    const typeGainNode = this.gainNodes.get(audioFile.type)
    if (typeGainNode) {
      gainNode.connect(typeGainNode)
    }

    // Apply volume settings based on audio type
    const baseVolume = this.getVolumeForType(audioFile.type)
    const finalVolume = (options.volume || 1) * baseVolume
    gainNode.gain.value = finalVolume

    // Apply fade in if requested
    if (options.fadeIn) {
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(finalVolume, this.audioContext.currentTime + 0.1)
    }

    // Apply fade out if requested
    if (options.fadeOut) {
      const duration = buffer.duration
      gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime + duration - 0.5)
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration)
    }

    source.start()
    
    // Clean up after playback
    source.onended = () => {
      source.disconnect()
      gainNode.disconnect()
    }
  }

  private getVolumeForType(type: string): number {
    // Default volume values - these will be overridden by the store when used in components
    const defaultMusicVolume = 0.7
    const defaultSoundVolume = 0.8
    
    switch (type) {
      case 'music':
        return defaultMusicVolume
      case 'sound':
      case 'streak':
        return defaultSoundVolume
      case 'ui':
        return defaultSoundVolume * 0.7 // UI sounds slightly quieter
      default:
        return defaultSoundVolume
    }
  }

  public playCorrectAnswer(streak: number): void {
    const streakSound = Math.min(streak, 5)
    this.playSound(`correct${streakSound}`)
  }

  public playWrongAnswer(): void {
    this.playSound('wrong')
  }

  public playButtonClick(): void {
    this.playSound('button-click')
  }

  public playButtonHover(): void {
    this.playSound('button-hover')
  }

  public playPlayerJoin(): void {
    this.playSound('player-join')
  }

  public playPlayerLeave(): void {
    this.playSound('player-leave')
  }

  public playTimerWarning(): void {
    this.playSound('timer-warning')
  }

  public playTimerUrgent(): void {
    this.playSound('timer-urgent')
  }

  public playGameStart(): void {
    this.playSound('game-start')
  }

  public playGameEnd(): void {
    this.playSound('game-end')
  }

  public playQuestionStart(): void {
    this.playSound('question-start')
  }

  public playLobbyCreated(): void {
    this.playSound('lobby-created')
  }

  public playLobbyJoined(): void {
    this.playSound('lobby-joined')
  }

  public playApplause(): void {
    this.playSound('applause')
  }

  public playHighScore(): void {
    this.playSound('high-score')
  }

  public playPerfectScore(): void {
    this.playSound('perfect-score')
  }

  public playMultiplierUp(): void {
    this.playSound('multiplier-up')
  }

  public playMultiplierReset(): void {
    this.playSound('multiplier-reset')
  }

  public playScorePoints(): void {
    this.playSound('score-points')
  }

  public playScoreBonus(): void {
    this.playSound('score-bonus')
  }

  public playBackgroundMusic(loop: boolean = true): void {
    this.playSound('background-music', { loop, fadeIn: true })
  }

  public playLobbyMusic(loop: boolean = true): void {
    this.playSound('lobby-music', { loop, fadeIn: true })
  }

  public playNotification(): void {
    this.playSound('notification')
  }

  public playSuccess(): void {
    this.playSound('success')
  }

  public playError(): void {
    this.playSound('error')
  }

  public playTick(): void {
    this.playSound('tick')
  }

  public playCountdown(): void {
    this.playSound('countdown')
  }

  public playMenuSelect(): void {
    this.playSound('menu-select')
  }

  public playMenuConfirm(): void {
    this.playSound('menu-confirm')
  }

  public playMenuCancel(): void {
    this.playSound('menu-cancel')
  }

  public playVolumeChange(): void {
    this.playSound('volume-change')
  }

  public playLanguageChange(): void {
    this.playSound('language-change')
  }

  public playThemeChange(): void {
    this.playSound('theme-change')
  }

  public stopAllSounds(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  public isAudioSupported(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext)
  }
}

// Create singleton instance
export const audioManager = new AudioManager() 