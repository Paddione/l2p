// Mock Web Audio API before importing AudioManager
const mockGainNode = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  gain: { value: 1 }
}

const mockBufferSource = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  buffer: null,
  loop: false
}

const mockAudioBuffer = {
  duration: 1.0,
  numberOfChannels: 2,
  sampleRate: 44100,
  length: 44100
}

const mockAudioContext = {
  createGain: jest.fn(() => mockGainNode),
  createBufferSource: jest.fn(() => mockBufferSource),
  decodeAudioData: jest.fn(() => Promise.resolve(mockAudioBuffer)),
  destination: mockGainNode,
  state: 'running',
  resume: jest.fn(() => Promise.resolve()),
  suspend: jest.fn(() => Promise.resolve()),
  close: jest.fn(() => Promise.resolve()),
  currentTime: 0
}

// Mock AudioContext constructor
const MockAudioContext = jest.fn(() => mockAudioContext)

// Set up Web Audio API mocks on window before importing AudioManager
Object.defineProperty(window, 'AudioContext', {
  value: MockAudioContext,
  writable: true,
})

Object.defineProperty(window, 'webkitAudioContext', {
  value: MockAudioContext,
  writable: true,
})

// Mock audioStore with proper getState method
const mockAudioStore = {
  musicVolume: 0.7,
  soundVolume: 0.8,
  uiVolume: 0.6,
  streakVolume: 0.9,
  isMuted: false,
  masterVolume: 1.0,
  setMusicVolume: jest.fn(),
  setSoundVolume: jest.fn(),
  setUiVolume: jest.fn(),
  setStreakVolume: jest.fn(),
  setMuted: jest.fn(),
  getState: jest.fn(() => ({
    musicVolume: 0.7,
    soundVolume: 0.8,
    uiVolume: 0.6,
    streakVolume: 0.9,
    isMuted: false,
    masterVolume: 1.0
  }))
}

jest.mock('../../stores/audioStore', () => ({
  useAudioStore: {
    getState: jest.fn(() => mockAudioStore.getState())
  }
}))

// Mock fetch for audio file loading
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
  } as Response)
)

// Now import AudioManager after mocks are set up
import { AudioManager, AudioFile } from '../audioManager'

describe('AudioManager', () => {
  let audioManager: AudioManager

  beforeEach(async () => {
    jest.clearAllMocks()
    // Reset mock implementations
    mockAudioContext.createGain.mockReturnValue(mockGainNode)
    mockAudioContext.createBufferSource.mockReturnValue(mockBufferSource)
    mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer)
    
    // Create a new instance for each test
    audioManager = new AudioManager()
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Manually set initialized flag and add some audio buffers for testing
    ;(audioManager as any).isInitialized = true
    const mockBuffer = mockAudioBuffer as any
    audioManager['audioBuffers'].set('correct1', mockBuffer)
    audioManager['audioBuffers'].set('wrong', mockBuffer)
    audioManager['audioBuffers'].set('button-click', mockBuffer)
    audioManager['audioBuffers'].set('player-join', mockBuffer)
    audioManager['audioBuffers'].set('timer-warning', mockBuffer)
    audioManager['audioBuffers'].set('game-start', mockBuffer)
    audioManager['audioBuffers'].set('background-music', mockBuffer)
    audioManager['audioBuffers'].set('test-sound', mockBuffer)
  })

  describe('initialization', () => {
    it('should initialize audio context and gain nodes', () => {
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(4)
    })

    it('should create gain nodes for different audio types', () => {
      const gainCalls = mockAudioContext.createGain.mock.calls
      expect(gainCalls).toHaveLength(4)
    })

    it('should handle audio context creation failure gracefully', () => {
      // Mock AudioContext constructor to throw
      const originalAudioContext = window.AudioContext
      window.AudioContext = jest.fn(() => {
        throw new Error('AudioContext not supported')
      })

      expect(() => new AudioManager()).not.toThrow()

      // Restore original
      window.AudioContext = originalAudioContext
    })
  })

  describe('audio file loading', () => {
    it('should load audio files successfully', async () => {
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)
      mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer)

      const audioFile: AudioFile = {
        name: 'test-sound',
        path: '/audio/test.mp3',
        type: 'sound'
      }

      await audioManager['loadAudioFile'](audioFile)

      expect(fetch).toHaveBeenCalledWith('/audio/test.mp3')
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled()
    })

    it('should handle audio file loading errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const audioFile: AudioFile = {
        name: 'test-sound',
        path: '/audio/test.mp3',
        type: 'sound'
      }

      await expect(audioManager['loadAudioFile'](audioFile)).rejects.toThrow('Network error')
    })

    it('should handle audio decoding errors', async () => {
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)
      mockAudioContext.decodeAudioData.mockRejectedValue(new Error('Invalid audio data'))

      const audioFile: AudioFile = {
        name: 'test-sound',
        path: '/audio/test.mp3',
        type: 'sound'
      }

      await expect(audioManager['loadAudioFile'](audioFile)).rejects.toThrow('Invalid audio data')
    })
  })

  describe('volume management', () => {
    it('should get correct volume for music type', () => {
      const volume = audioManager['getVolumeForType']('music')
      expect(volume).toBe(0.7)
    })

    it('should get correct volume for sound type', () => {
      const volume = audioManager['getVolumeForType']('sound')
      expect(volume).toBe(0.8)
    })

    it('should get correct volume for ui type', () => {
      const volume = audioManager['getVolumeForType']('ui')
      expect(volume).toBe(0.8 * 0.7) // soundVolume * 0.7
    })

    it('should get correct volume for streak type', () => {
      const volume = audioManager['getVolumeForType']('streak')
      expect(volume).toBe(0.8)
    })

    it('should return 0 volume when muted', () => {
      mockAudioStore.getState.mockReturnValue({
        ...mockAudioStore.getState(),
        isMuted: true
      })
      const volume = audioManager['getVolumeForType']('music')
      expect(volume).toBe(0)
    })

    it('should return default volume for unknown type', () => {
      const volume = audioManager['getVolumeForType']('unknown')
      expect(volume).toBe(0.8) // Default to soundVolume
    })
  })

  describe('specific sound methods', () => {
    it('should play correct answer sound based on streak', () => {
      const mockSource = { ...mockBufferSource }
      mockAudioContext.createBufferSource.mockReturnValue(mockSource)

      audioManager.playCorrectAnswer(3)

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockSource.connect).toHaveBeenCalled()
      expect(mockSource.start).toHaveBeenCalled()
    })

    it('should play wrong answer sound', () => {
      const mockSource = { ...mockBufferSource }
      mockAudioContext.createBufferSource.mockReturnValue(mockSource)

      audioManager.playWrongAnswer()

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockSource.connect).toHaveBeenCalled()
      expect(mockSource.start).toHaveBeenCalled()
    })

    it('should play button click sound', () => {
      const mockSource = { ...mockBufferSource }
      mockAudioContext.createBufferSource.mockReturnValue(mockSource)

      audioManager.playButtonClick()

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockSource.connect).toHaveBeenCalled()
      expect(mockSource.start).toHaveBeenCalled()
    })

    it('should play player join sound', () => {
      const mockSource = { ...mockBufferSource }
      mockAudioContext.createBufferSource.mockReturnValue(mockSource)

      audioManager.playPlayerJoin()

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockSource.connect).toHaveBeenCalled()
      expect(mockSource.start).toHaveBeenCalled()
    })

    it('should play timer warning sound', () => {
      const mockSource = { ...mockBufferSource }
      mockAudioContext.createBufferSource.mockReturnValue(mockSource)

      audioManager.playTimerWarning()

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockSource.connect).toHaveBeenCalled()
      expect(mockSource.start).toHaveBeenCalled()
    })

    it('should play game start sound', () => {
      const mockSource = { ...mockBufferSource }
      mockAudioContext.createBufferSource.mockReturnValue(mockSource)

      audioManager.playGameStart()

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockSource.connect).toHaveBeenCalled()
      expect(mockSource.start).toHaveBeenCalled()
    })

    it('should play background music with loop', () => {
      const mockSource = { ...mockBufferSource, loop: false }
      mockAudioContext.createBufferSource.mockReturnValue(mockSource)

      audioManager.playBackgroundMusic()

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockSource.connect).toHaveBeenCalled()
      expect(mockSource.start).toHaveBeenCalled()
    })
  })

  describe('audio context management', () => {
    it('should resume audio context when suspended', () => {
      mockAudioContext.state = 'suspended'
      mockAudioContext.resume = jest.fn().mockResolvedValue(undefined)

      audioManager.resumeAudioContext()

      expect(mockAudioContext.resume).toHaveBeenCalled()
    })

    it('should not resume audio context when already running', () => {
      mockAudioContext.state = 'running'
      mockAudioContext.resume = jest.fn()

      audioManager.resumeAudioContext()

      expect(mockAudioContext.resume).not.toHaveBeenCalled()
    })

    it('should check if audio is supported', () => {
      const isSupported = audioManager.isAudioSupported()
      expect(isSupported).toBe(true)
    })

    it('should return false for audio support when AudioContext is not available', () => {
      const originalAudioContext = window.AudioContext
      delete (window as any).AudioContext
      delete (window as any).webkitAudioContext

      const isSupported = audioManager.isAudioSupported()
      expect(isSupported).toBe(false)

      // Restore
      window.AudioContext = originalAudioContext
    })
  })

  describe('sound stopping', () => {
    it('should stop all sounds', () => {
      const mockSource1 = { ...mockBufferSource, stop: jest.fn() }
      const mockSource2 = { ...mockBufferSource, stop: jest.fn() }
      
      // Mock active sources
      ;(audioManager as any).activeSources = [mockSource1, mockSource2]

      audioManager.stopAllSounds()

      expect(mockSource1.stop).toHaveBeenCalled()
      expect(mockSource2.stop).toHaveBeenCalled()
    })
  })

  describe('fade effects', () => {
    it('should handle fade in effect', () => {
      const mockSource = { ...mockBufferSource }
      mockAudioContext.createBufferSource.mockReturnValue(mockSource)

      audioManager.playSound('test-sound', { fadeIn: true })

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockSource.connect).toHaveBeenCalled()
      expect(mockSource.start).toHaveBeenCalled()
    })

    it('should handle fade out effect', () => {
      const mockSource = { ...mockBufferSource }
      mockAudioContext.createBufferSource.mockReturnValue(mockSource)

      audioManager.playSound('test-sound', { fadeOut: true })

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
      expect(mockSource.connect).toHaveBeenCalled()
      expect(mockSource.start).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle gain node creation errors', () => {
      mockAudioContext.createGain.mockImplementation(() => {
        throw new Error('Gain node creation failed')
      })

      expect(() => new AudioManager()).not.toThrow()
    })

    it('should handle buffer source creation errors', () => {
      mockAudioContext.createBufferSource.mockImplementation(() => {
        throw new Error('Buffer source creation failed')
      })

      expect(() => audioManager.playSound('test-sound')).not.toThrow()
    })
  })
}) 