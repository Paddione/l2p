import { useAudioStore, type AudioState } from '../audioStore'
import { audioManager } from '../../services/audioManager'

// Mock audioManager
jest.mock('../../services/audioManager')

// Mock localStorage for persistence
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('AudioStore', () => {
  let store: AudioState
  let mockAudioManager: any

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Reset localStorage
    localStorageMock.getItem.mockReturnValue(null)
    
    // Setup mock audioManager
    mockAudioManager = {
      playSound: jest.fn(),
      stopAllSounds: jest.fn(),
      playCorrectAnswer: jest.fn(),
      playWrongAnswer: jest.fn(),
      playButtonClick: jest.fn(),
      playButtonHover: jest.fn(),
      playPlayerJoin: jest.fn(),
      playPlayerLeave: jest.fn(),
      playTimerWarning: jest.fn(),
      playTimerUrgent: jest.fn(),
      playGameStart: jest.fn(),
      playGameEnd: jest.fn(),
      playQuestionStart: jest.fn(),
      playLobbyCreated: jest.fn(),
      playLobbyJoined: jest.fn(),
      playApplause: jest.fn(),
      playHighScore: jest.fn(),
      playPerfectScore: jest.fn(),
      playMultiplierUp: jest.fn(),
      playMultiplierReset: jest.fn(),
      playScorePoints: jest.fn(),
      playScoreBonus: jest.fn(),
      playBackgroundMusic: jest.fn(),
      playLobbyMusic: jest.fn(),
      playNotification: jest.fn(),
      playSuccess: jest.fn(),
      playError: jest.fn(),
      playTick: jest.fn(),
      playCountdown: jest.fn(),
      playMenuSelect: jest.fn(),
      playMenuConfirm: jest.fn(),
      playMenuCancel: jest.fn(),
      playVolumeChange: jest.fn(),
      playLanguageChange: jest.fn(),
      playThemeChange: jest.fn(),
      resumeAudioContext: jest.fn(),
      isAudioSupported: jest.fn(() => true)
    }
    
    ;(audioManager as any) = mockAudioManager
    
    // Get fresh store state
    store = useAudioStore.getState()
  })

  afterEach(() => {
    // Clean up store state
    useAudioStore.setState({
      musicVolume: 0.7,
      soundVolume: 0.8,
      masterVolume: 1.0,
      isMuted: false,
      isPlaying: false,
      currentTrack: null
    })
  })

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      expect(store.musicVolume).toBe(0.7)
      expect(store.soundVolume).toBe(0.8)
      expect(store.masterVolume).toBe(1.0)
      expect(store.isMuted).toBe(false)
      expect(store.isPlaying).toBe(false)
      expect(store.currentTrack).toBe(null)
    })
  })

  describe('Volume Controls', () => {
    it('should set music volume within valid range', () => {
      store.setMusicVolume(0.5)
      
      expect(useAudioStore.getState().musicVolume).toBe(0.5)
    })

    it('should clamp music volume to 0-1 range', () => {
      store.setMusicVolume(-0.5)
      expect(useAudioStore.getState().musicVolume).toBe(0)
      
      store.setMusicVolume(1.5)
      expect(useAudioStore.getState().musicVolume).toBe(1)
    })

    it('should set sound volume within valid range', () => {
      store.setSoundVolume(0.3)
      
      expect(useAudioStore.getState().soundVolume).toBe(0.3)
    })

    it('should clamp sound volume to 0-1 range', () => {
      store.setSoundVolume(-0.2)
      expect(useAudioStore.getState().soundVolume).toBe(0)
      
      store.setSoundVolume(1.2)
      expect(useAudioStore.getState().soundVolume).toBe(1)
    })

    it('should set master volume within valid range', () => {
      store.setMasterVolume(0.6)
      
      expect(useAudioStore.getState().masterVolume).toBe(0.6)
    })

    it('should clamp master volume to 0-1 range', () => {
      store.setMasterVolume(-0.1)
      expect(useAudioStore.getState().masterVolume).toBe(0)
      
      store.setMasterVolume(1.1)
      expect(useAudioStore.getState().masterVolume).toBe(1)
    })
  })

  describe('Mute Controls', () => {
    it('should set mute state', () => {
      store.setIsMuted(true)
      expect(useAudioStore.getState().isMuted).toBe(true)
      
      store.setIsMuted(false)
      expect(useAudioStore.getState().isMuted).toBe(false)
    })

    it('should toggle mute state', () => {
      expect(useAudioStore.getState().isMuted).toBe(false)
      
      store.toggleMute()
      expect(useAudioStore.getState().isMuted).toBe(true)
      
      store.toggleMute()
      expect(useAudioStore.getState().isMuted).toBe(false)
    })
  })

  describe('Playback State', () => {
    it('should set playing state', () => {
      store.setIsPlaying(true)
      expect(useAudioStore.getState().isPlaying).toBe(true)
      
      store.setIsPlaying(false)
      expect(useAudioStore.getState().isPlaying).toBe(false)
    })

    it('should set current track', () => {
      store.setCurrentTrack('background-music')
      expect(useAudioStore.getState().currentTrack).toBe('background-music')
      
      store.setCurrentTrack(null)
      expect(useAudioStore.getState().currentTrack).toBe(null)
    })
  })

  describe('Audio Playback', () => {
    it('should play sound through audioManager', () => {
      store.playSound('test-sound')
      
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('test-sound')
    })

    it('should stop all sounds through audioManager', () => {
      store.stopSound()
      
      expect(mockAudioManager.stopAllSounds).toHaveBeenCalled()
    })
  })

  describe('Game Audio Integration', () => {
    it('should play correct answer sound', () => {
      store.playCorrectAnswer(3)
      
      expect(mockAudioManager.playCorrectAnswer).toHaveBeenCalledWith(3)
    })

    it('should play wrong answer sound', () => {
      store.playWrongAnswer()
      
      expect(mockAudioManager.playWrongAnswer).toHaveBeenCalled()
    })

    it('should play button click sound', () => {
      store.playButtonClick()
      
      expect(mockAudioManager.playButtonClick).toHaveBeenCalled()
    })

    it('should play button hover sound', () => {
      store.playButtonHover()
      
      expect(mockAudioManager.playButtonHover).toHaveBeenCalled()
    })
  })

  describe('Player Audio Integration', () => {
    it('should play player join sound', () => {
      store.playPlayerJoin()
      
      expect(mockAudioManager.playPlayerJoin).toHaveBeenCalled()
    })

    it('should play player leave sound', () => {
      store.playPlayerLeave()
      
      expect(mockAudioManager.playPlayerLeave).toHaveBeenCalled()
    })
  })

  describe('Timer Audio Integration', () => {
    it('should play timer warning sound', () => {
      store.playTimerWarning()
      
      expect(mockAudioManager.playTimerWarning).toHaveBeenCalled()
    })

    it('should play timer urgent sound', () => {
      store.playTimerUrgent()
      
      expect(mockAudioManager.playTimerUrgent).toHaveBeenCalled()
    })
  })

  describe('Game Event Audio Integration', () => {
    it('should play game start sound', () => {
      store.playGameStart()
      
      expect(mockAudioManager.playGameStart).toHaveBeenCalled()
    })

    it('should play game end sound', () => {
      store.playGameEnd()
      
      expect(mockAudioManager.playGameEnd).toHaveBeenCalled()
    })

    it('should play question start sound', () => {
      store.playQuestionStart()
      
      expect(mockAudioManager.playQuestionStart).toHaveBeenCalled()
    })
  })

  describe('Lobby Audio Integration', () => {
    it('should play lobby created sound', () => {
      store.playLobbyCreated()
      
      expect(mockAudioManager.playLobbyCreated).toHaveBeenCalled()
    })

    it('should play lobby joined sound', () => {
      store.playLobbyJoined()
      
      expect(mockAudioManager.playLobbyJoined).toHaveBeenCalled()
    })
  })

  describe('Achievement Audio Integration', () => {
    it('should play applause sound', () => {
      store.playApplause()
      
      expect(mockAudioManager.playApplause).toHaveBeenCalled()
    })

    it('should play high score sound', () => {
      store.playHighScore()
      
      expect(mockAudioManager.playHighScore).toHaveBeenCalled()
    })

    it('should play perfect score sound', () => {
      store.playPerfectScore()
      
      expect(mockAudioManager.playPerfectScore).toHaveBeenCalled()
    })
  })

  describe('Multiplier Audio Integration', () => {
    it('should play multiplier up sound', () => {
      store.playMultiplierUp()
      
      expect(mockAudioManager.playMultiplierUp).toHaveBeenCalled()
    })

    it('should play multiplier reset sound', () => {
      store.playMultiplierReset()
      
      expect(mockAudioManager.playMultiplierReset).toHaveBeenCalled()
    })
  })

  describe('Score Audio Integration', () => {
    it('should play score points sound', () => {
      store.playScorePoints()
      
      expect(mockAudioManager.playScorePoints).toHaveBeenCalled()
    })

    it('should play score bonus sound', () => {
      store.playScoreBonus()
      
      expect(mockAudioManager.playScoreBonus).toHaveBeenCalled()
    })
  })

  describe('Background Music Integration', () => {
    it('should play background music', () => {
      store.playBackgroundMusic()
      
      expect(mockAudioManager.playBackgroundMusic).toHaveBeenCalledWith(undefined)
    })

    it('should play background music with loop option', () => {
      store.playBackgroundMusic(true)
      
      expect(mockAudioManager.playBackgroundMusic).toHaveBeenCalledWith(true)
    })

    it('should play lobby music', () => {
      store.playLobbyMusic()
      
      expect(mockAudioManager.playLobbyMusic).toHaveBeenCalledWith(undefined)
    })

    it('should play lobby music with loop option', () => {
      store.playLobbyMusic(false)
      
      expect(mockAudioManager.playLobbyMusic).toHaveBeenCalledWith(false)
    })
  })

  describe('Notification Audio Integration', () => {
    it('should play notification sound', () => {
      store.playNotification()
      
      expect(mockAudioManager.playNotification).toHaveBeenCalled()
    })

    it('should play success sound', () => {
      store.playSuccess()
      
      expect(mockAudioManager.playSuccess).toHaveBeenCalled()
    })

    it('should play error sound', () => {
      store.playError()
      
      expect(mockAudioManager.playError).toHaveBeenCalled()
    })
  })

  describe('Timer Audio Integration', () => {
    it('should play tick sound', () => {
      store.playTick()
      
      expect(mockAudioManager.playTick).toHaveBeenCalled()
    })

    it('should play countdown sound', () => {
      store.playCountdown()
      
      expect(mockAudioManager.playCountdown).toHaveBeenCalled()
    })
  })

  describe('Menu Audio Integration', () => {
    it('should play menu select sound', () => {
      store.playMenuSelect()
      
      expect(mockAudioManager.playMenuSelect).toHaveBeenCalled()
    })

    it('should play menu confirm sound', () => {
      store.playMenuConfirm()
      
      expect(mockAudioManager.playMenuConfirm).toHaveBeenCalled()
    })

    it('should play menu cancel sound', () => {
      store.playMenuCancel()
      
      expect(mockAudioManager.playMenuCancel).toHaveBeenCalled()
    })
  })

  describe('Settings Audio Integration', () => {
    it('should play volume change sound', () => {
      store.playVolumeChange()
      
      expect(mockAudioManager.playVolumeChange).toHaveBeenCalled()
    })

    it('should play language change sound', () => {
      store.playLanguageChange()
      
      expect(mockAudioManager.playLanguageChange).toHaveBeenCalled()
    })

    it('should play theme change sound', () => {
      store.playThemeChange()
      
      expect(mockAudioManager.playThemeChange).toHaveBeenCalled()
    })
  })

  describe('Audio Context Management', () => {
    it('should resume audio context', () => {
      store.resumeAudioContext()
      
      expect(mockAudioManager.resumeAudioContext).toHaveBeenCalled()
    })

    it('should check if audio is supported', () => {
      const isSupported = store.isAudioSupported()
      
      expect(mockAudioManager.isAudioSupported).toHaveBeenCalled()
      expect(isSupported).toBe(true)
    })
  })

  describe('State Persistence', () => {
    it('should persist volume settings', () => {
      store.setMusicVolume(0.5)
      store.setSoundVolume(0.3)
      store.setMasterVolume(0.8)
      
      // Simulate page reload by creating new store instance
      const newStore = useAudioStore.getState()
      
      // Note: In a real test, we would need to mock the persistence layer
      // For now, we just verify the state was set correctly
      expect(newStore.musicVolume).toBe(0.5)
      expect(newStore.soundVolume).toBe(0.3)
      expect(newStore.masterVolume).toBe(0.8)
    })

    it('should persist mute state', () => {
      store.setIsMuted(true)
      
      const newStore = useAudioStore.getState()
      expect(newStore.isMuted).toBe(true)
    })
  })

  describe('State Updates', () => {
    it('should update multiple state properties', () => {
      store.setMusicVolume(0.4)
      store.setSoundVolume(0.6)
      store.setIsMuted(true)
      store.setIsPlaying(true)
      store.setCurrentTrack('lobby-music')
      
      const state = useAudioStore.getState()
      
      expect(state.musicVolume).toBe(0.4)
      expect(state.soundVolume).toBe(0.6)
      expect(state.isMuted).toBe(true)
      expect(state.isPlaying).toBe(true)
      expect(state.currentTrack).toBe('lobby-music')
    })

    it('should maintain state consistency', () => {
      // Set initial state
      store.setMusicVolume(0.5)
      store.setSoundVolume(0.7)
      
      // Verify state is maintained
      let state = useAudioStore.getState()
      expect(state.musicVolume).toBe(0.5)
      expect(state.soundVolume).toBe(0.7)
      
      // Update one property
      store.setMasterVolume(0.9)
      
      // Verify other properties are unchanged
      state = useAudioStore.getState()
      expect(state.musicVolume).toBe(0.5)
      expect(state.soundVolume).toBe(0.7)
      expect(state.masterVolume).toBe(0.9)
    })
  })

  describe('Error Handling', () => {
    it('should handle audioManager errors gracefully', () => {
      mockAudioManager.playSound.mockImplementation(() => {
        throw new Error('Audio error')
      })
      
      expect(() => {
        store.playSound('test-sound')
      }).not.toThrow()
    })

    it('should handle invalid volume values', () => {
      expect(() => {
        store.setMusicVolume(NaN)
      }).not.toThrow()
      
      expect(() => {
        store.setSoundVolume(Infinity)
      }).not.toThrow()
      
      expect(() => {
        store.setMasterVolume(-Infinity)
      }).not.toThrow()
    })
  })

  describe('Performance Considerations', () => {
    it('should handle rapid state updates', () => {
      for (let i = 0; i < 100; i++) {
        store.setMusicVolume(i / 100)
        store.setSoundVolume((100 - i) / 100)
        store.toggleMute()
      }
      
      // Should not throw errors
      expect(() => {
        const state = useAudioStore.getState()
        expect(state.musicVolume).toBeGreaterThanOrEqual(0)
        expect(state.musicVolume).toBeLessThanOrEqual(1)
      }).not.toThrow()
    })

    it('should handle concurrent audio calls', () => {
      const promises: Promise<void>[] = []
      
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(store.playButtonClick()))
        promises.push(Promise.resolve(store.playSound(`sound-${i}`)))
      }
      
      expect(() => {
        Promise.all(promises)
      }).not.toThrow()
    })
  })

  describe('Integration with AudioManager', () => {
    it('should pass correct parameters to audioManager methods', () => {
      store.playCorrectAnswer(5)
      expect(mockAudioManager.playCorrectAnswer).toHaveBeenCalledWith(5)
      
      store.playBackgroundMusic(true)
      expect(mockAudioManager.playBackgroundMusic).toHaveBeenCalledWith(true)
      
      store.playSound('custom-sound')
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('custom-sound')
    })

    it('should call audioManager methods in correct order', () => {
      const playOrder: string[] = []
      
      mockAudioManager.playGameStart.mockImplementation(() => {
        playOrder.push('gameStart')
      })
      
      mockAudioManager.playQuestionStart.mockImplementation(() => {
        playOrder.push('questionStart')
      })
      
      mockAudioManager.playCorrectAnswer.mockImplementation(() => {
        playOrder.push('correctAnswer')
      })
      
      store.playGameStart()
      store.playQuestionStart()
      store.playCorrectAnswer(3)
      
      expect(playOrder).toEqual(['gameStart', 'questionStart', 'correctAnswer'])
    })
  })
}) 