// Mock import.meta before importing the service
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_SOCKET_URL: 'http://localhost:3001'
      }
    }
  },
  writable: true
})

import { SocketService, type SocketEvents } from '../socketService'
import { useGameStore } from '../../stores/gameStore'
import { performanceOptimizer } from '../performanceOptimizer'
import { navigationService } from '../navigationService'
import { apiService } from '../apiService'

// Mock dependencies
jest.mock('../../stores/gameStore')
jest.mock('../performanceOptimizer')
jest.mock('../navigationService')
jest.mock('../apiService')
jest.mock('socket.io-client')

// Mock Socket.IO
const mockSocket = {
  connected: false,
  connect: jest.fn(),
  disconnect: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  io: jest.fn()
}

const mockIo = jest.fn(() => mockSocket)
})

describe('SocketService', () => {
  let socketService: SocketService
  let mockGameStore: any
  let mockPerformanceOptimizer: any
  let mockNavigationService: any
  let mockApiService: any

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup mock implementations
    mockGameStore = {
      setError: jest.fn(),
      setPlayers: jest.fn(),
      setLobbyCode: jest.fn(),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
      updatePlayer: jest.fn(),
      setGameStarted: jest.fn(),
      setCurrentQuestion: jest.fn(),
      setTimeRemaining: jest.fn(),
      setQuestionSetInfo: jest.fn(),
      setQuestionIndex: jest.fn(),
      setTotalQuestions: jest.fn(),
      setGameEnded: jest.fn(),
      setGameResults: jest.fn(),
      addLevelUpNotification: jest.fn(),
      lobbyCode: 'TEST123'
    }
    
    mockPerformanceOptimizer = {
      canCreateConnection: jest.fn(() => true),
      registerConnection: jest.fn(),
      unregisterConnection: jest.fn()
    }
    
    mockNavigationService = {
      navigateToGame: jest.fn(),
      navigateToResults: jest.fn()
    }
    
    mockApiService = {
      joinLobby: jest.fn(),
      createLobby: jest.fn()
    }
    
    // Setup mock returns
    ;(useGameStore.getState as jest.Mock).mockReturnValue(mockGameStore)
    ;(performanceOptimizer as any) = mockPerformanceOptimizer
    ;(navigationService as any) = mockNavigationService
    ;(apiService as any) = mockApiService
    
    // Mock socket.io-client
    const { io } = require('socket.io-client')
    io.mockReturnValue(mockSocket)
    
    // Create fresh instance
    socketService = new SocketService()
  })

  afterEach(() => {
    // Cleanup
    socketService.disconnect()
  })

  describe('Connection Management', () => {
    it('should connect to server with default URL', () => {
      socketService.connect()
      
      expect(mockIo).toHaveBeenCalledWith('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: false
      })
      expect(mockPerformanceOptimizer.registerConnection).toHaveBeenCalled()
    })

    it('should connect to server with custom URL', () => {
      const customUrl = 'http://custom-server:3002'
      socketService.connect(customUrl)
      
      expect(mockIo).toHaveBeenCalledWith(customUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: false
      })
    })

    it('should not connect if already connected', () => {
      mockSocket.connected = true
      socketService.connect()
      
      expect(mockIo).not.toHaveBeenCalled()
    })

    it('should not connect if maximum connections reached', () => {
      mockPerformanceOptimizer.canCreateConnection.mockReturnValue(false)
      socketService.connect()
      
      expect(mockIo).not.toHaveBeenCalled()
    })

    it('should disconnect properly', () => {
      socketService.connect()
      socketService.disconnect()
      
      expect(mockSocket.disconnect).toHaveBeenCalled()
      expect(mockPerformanceOptimizer.unregisterConnection).toHaveBeenCalled()
    })

    it('should handle disconnect when not connected', () => {
      socketService.disconnect()
      
      expect(mockSocket.disconnect).not.toHaveBeenCalled()
    })
  })

  describe('Event Handling', () => {
    beforeEach(() => {
      socketService.connect()
    })

    it('should handle connect event', () => {
      // Simulate connect event
      const connectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1]
      
      connectCallback()
      
      expect(mockGameStore.setError).toHaveBeenCalledWith(null)
    })

    it('should handle disconnect event', () => {
      const disconnectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1]
      
      disconnectCallback('io client disconnect')
      
      // Should attempt reconnection
      expect(setTimeout).toHaveBeenCalled()
    })

    it('should handle server-initiated disconnect', () => {
      const disconnectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1]
      
      disconnectCallback('io server disconnect')
      
      // Should not attempt reconnection
      expect(setTimeout).not.toHaveBeenCalled()
    })

    it('should handle connection error', () => {
      const errorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1]
      
      const error = new Error('Connection failed')
      errorCallback(error)
      
      expect(mockGameStore.setError).toHaveBeenCalledWith('Connection failed. Retrying...')
    })
  })

  describe('Lobby Events', () => {
    beforeEach(() => {
      socketService.connect()
    })

    it('should handle lobby joined event', () => {
      const lobbyJoinedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'lobby:joined'
      )?.[1]
      
      const data = {
        lobby: { code: 'TEST123' },
        players: [{ id: '1', name: 'Player 1' }]
      }
      
      lobbyJoinedCallback(data)
      
      expect(mockGameStore.setPlayers).toHaveBeenCalledWith(data.players)
      expect(mockGameStore.setLobbyCode).toHaveBeenCalledWith(data.lobby.code)
    })

    it('should handle player joined event', () => {
      const playerJoinedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'lobby:player_joined'
      )?.[1]
      
      const data = { player: { id: '1', name: 'Player 1' } }
      
      playerJoinedCallback(data)
      
      expect(mockGameStore.addPlayer).toHaveBeenCalledWith(data.player)
    })

    it('should handle player left event', () => {
      const playerLeftCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'lobby:player_left'
      )?.[1]
      
      const data = { playerId: '1' }
      
      playerLeftCallback(data)
      
      expect(mockGameStore.removePlayer).toHaveBeenCalledWith(data.playerId)
    })

    it('should handle player ready event', () => {
      const playerReadyCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'lobby:player_ready'
      )?.[1]
      
      const data = { playerId: '1', isReady: true }
      
      playerReadyCallback(data)
      
      expect(mockGameStore.updatePlayer).toHaveBeenCalledWith(data.playerId, { isReady: data.isReady })
    })

    it('should handle game started event', () => {
      const gameStartedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'lobby:game_started'
      )?.[1]
      
      const data = {
        gameData: {
          question: { text: 'Test question' },
          timeRemaining: 30
        }
      }
      
      gameStartedCallback(data)
      
      expect(mockGameStore.setGameStarted).toHaveBeenCalledWith(true)
      expect(mockGameStore.setCurrentQuestion).toHaveBeenCalledWith(data.gameData.question)
      expect(mockGameStore.setTimeRemaining).toHaveBeenCalledWith(data.gameData.timeRemaining)
      expect(mockNavigationService.navigateToGame).toHaveBeenCalledWith('TEST123')
    })
  })

  describe('Game Events', () => {
    beforeEach(() => {
      socketService.connect()
    })

    it('should handle question started event', () => {
      const questionStartedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'question-started'
      )?.[1]
      
      const data = {
        question: { text: 'Test question' },
        questionIndex: 1,
        totalQuestions: 10,
        timeRemaining: 30
      }
      
      questionStartedCallback(data)
      
      expect(mockGameStore.setCurrentQuestion).toHaveBeenCalledWith(data.question)
      expect(mockGameStore.setQuestionIndex).toHaveBeenCalledWith(data.questionIndex)
      expect(mockGameStore.setTotalQuestions).toHaveBeenCalledWith(data.totalQuestions)
      expect(mockGameStore.setTimeRemaining).toHaveBeenCalledWith(data.timeRemaining)
    })

    it('should handle time update event', () => {
      const timeUpdateCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'time-update'
      )?.[1]
      
      const data = { timeRemaining: 25 }
      
      timeUpdateCallback(data)
      
      expect(mockGameStore.setTimeRemaining).toHaveBeenCalledWith(data.timeRemaining)
    })

    it('should handle game ended event', () => {
      const gameEndedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'game-ended'
      )?.[1]
      
      const data = {
        results: [{ playerId: '1', score: 100 }],
        gameSessionId: 123,
        questionSetIds: [1, 2, 3]
      }
      
      gameEndedCallback(data)
      
      expect(mockGameStore.setGameEnded).toHaveBeenCalledWith(true)
      expect(mockGameStore.setGameResults).toHaveBeenCalledWith(data.results)
      expect(mockNavigationService.navigateToResults).toHaveBeenCalledWith('TEST123')
    })

    it('should handle player level up event', () => {
      const playerLevelUpCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'player-level-up'
      )?.[1]
      
      const data = {
        playerId: '1',
        username: 'Player 1',
        character: 'warrior',
        oldLevel: 1,
        newLevel: 2,
        experienceAwarded: 100
      }
      
      playerLevelUpCallback(data)
      
      expect(mockGameStore.addLevelUpNotification).toHaveBeenCalledWith(data)
    })
  })

  describe('Error Events', () => {
    beforeEach(() => {
      socketService.connect()
    })

    it('should handle server error event', () => {
      const errorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]
      
      const data = { message: 'Server error occurred' }
      
      errorCallback(data)
      
      expect(mockGameStore.setError).toHaveBeenCalledWith(data.message)
    })

    it('should handle question set update error', () => {
      const questionSetErrorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'question-sets-update-error'
      )?.[1]
      
      const data = { type: 'validation', message: 'Invalid question set' }
      
      questionSetErrorCallback(data)
      
      expect(mockGameStore.setError).toHaveBeenCalledWith(data.message)
    })
  })

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      socketService.connect()
    })

    it('should attempt reconnection on disconnect', () => {
      const disconnectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1]
      
      disconnectCallback('io client disconnect')
      
      expect(setTimeout).toHaveBeenCalled()
    })

    it('should stop reconnection attempts after max attempts', () => {
      // Mock max reconnection attempts
      ;(socketService as any).reconnectAttempts = 5
      ;(socketService as any).maxReconnectAttempts = 5
      
      const disconnectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1]
      
      disconnectCallback('io client disconnect')
      
      expect(mockGameStore.setError).toHaveBeenCalledWith('Connection lost. Please refresh the page.')
      expect(setTimeout).not.toHaveBeenCalled()
    })

    it('should not attempt reconnection if already connecting', () => {
      ;(socketService as any).isConnecting = true
      
      const disconnectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1]
      
      disconnectCallback('io client disconnect')
      
      expect(setTimeout).not.toHaveBeenCalled()
    })
  })

  describe('Lobby Operations', () => {
    beforeEach(() => {
      socketService.connect()
    })

    it('should join lobby successfully', async () => {
      const mockResponse = { success: true, data: { lobbyCode: 'TEST123' } }
      mockApiService.joinLobby.mockResolvedValue(mockResponse)
      
      const result = await socketService.joinLobby('TEST123')
      
      expect(mockApiService.joinLobby).toHaveBeenCalledWith({ lobbyCode: 'TEST123' })
      expect(mockSocket.emit).toHaveBeenCalledWith('lobby:join', { lobbyCode: 'TEST123' })
      expect(result).toEqual(mockResponse)
    })

    it('should handle join lobby failure', async () => {
      const mockResponse = { success: false, error: 'Lobby not found' }
      mockApiService.joinLobby.mockResolvedValue(mockResponse)
      
      await expect(socketService.joinLobby('INVALID')).rejects.toThrow('Lobby not found')
      expect(mockGameStore.setError).toHaveBeenCalledWith('Lobby not found')
    })

    it('should create lobby successfully', async () => {
      const mockResponse = { success: true, data: { lobbyCode: 'TEST123' } }
      mockApiService.createLobby.mockResolvedValue(mockResponse)
      
      const settings = { questionCount: 10 }
      const result = await socketService.createLobby(settings)
      
      expect(mockApiService.createLobby).toHaveBeenCalledWith({ questionCount: 10 })
      expect(mockSocket.emit).toHaveBeenCalledWith('lobby:create', { settings })
      expect(result).toEqual(mockResponse)
    })

    it('should handle create lobby failure', async () => {
      const mockResponse = { success: false, error: 'Failed to create lobby' }
      mockApiService.createLobby.mockResolvedValue(mockResponse)
      
      await expect(socketService.createLobby({ questionCount: 10 })).rejects.toThrow('Failed to create lobby')
      expect(mockGameStore.setError).toHaveBeenCalledWith('Failed to create lobby')
    })
  })

  describe('Game Operations', () => {
    beforeEach(() => {
      socketService.connect()
    })

    it('should set player ready status', () => {
      socketService.setReady(true)
      
      expect(mockSocket.emit).toHaveBeenCalledWith('lobby:ready', { isReady: true })
    })

    it('should start game', () => {
      socketService.startGame()
      
      expect(mockSocket.emit).toHaveBeenCalledWith('lobby:start_game')
    })

    it('should submit answer', () => {
      socketService.submitAnswer(2)
      
      expect(mockSocket.emit).toHaveBeenCalledWith('game:answer', { answerIndex: 2 })
    })
  })

  describe('Question Set Operations', () => {
    beforeEach(() => {
      socketService.connect()
    })

    it('should update question sets', () => {
      const lobbyCode = 'TEST123'
      const hostId = 'host1'
      const questionSetIds = [1, 2, 3]
      const questionCount = 10
      
      socketService.updateQuestionSets(lobbyCode, hostId, questionSetIds, questionCount)
      
      expect(mockSocket.emit).toHaveBeenCalledWith('update-question-sets', {
        lobbyCode,
        hostId,
        questionSetIds,
        questionCount
      })
    })

    it('should get question set info', () => {
      const lobbyCode = 'TEST123'
      
      socketService.getQuestionSetInfo(lobbyCode)
      
      expect(mockSocket.emit).toHaveBeenCalledWith('get-question-set-info', { lobbyCode })
    })
  })

  describe('Utility Methods', () => {
    it('should return correct connection status when connected', () => {
      mockSocket.connected = true
      socketService.connect()
      
      expect(socketService.isConnected()).toBe(true)
      expect(socketService.getConnectionStatus()).toBe('connected')
    })

    it('should return correct connection status when connecting', () => {
      ;(socketService as any).isConnecting = true
      
      expect(socketService.getConnectionStatus()).toBe('connecting')
    })

    it('should return correct connection status when disconnected', () => {
      expect(socketService.getConnectionStatus()).toBe('disconnected')
    })

    it('should emit events when connected', () => {
      mockSocket.connected = true
      socketService.connect()
      
      socketService.emit('test:event', { data: 'test' })
      
      expect(mockSocket.emit).toHaveBeenCalledWith('test:event', { data: 'test' })
    })

    it('should not emit events when disconnected', () => {
      socketService.emit('test:event', { data: 'test' })
      
      expect(mockSocket.emit).not.toHaveBeenCalled()
    })
  })

  describe('Event Registration', () => {
    it('should register event listeners', () => {
      socketService.connect()
      
      const callback = jest.fn()
      socketService.on('connect', callback)
      
      expect(mockSocket.on).toHaveBeenCalledWith('connect', callback)
    })

    it('should remove event listeners', () => {
      socketService.connect()
      
      const callback = jest.fn()
      socketService.off('connect', callback)
      
      expect(mockSocket.off).toHaveBeenCalledWith('connect', callback)
    })

    it('should remove all event listeners when no callback provided', () => {
      socketService.connect()
      
      socketService.off('connect')
      
      expect(mockSocket.off).toHaveBeenCalledWith('connect')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error')
      mockApiService.joinLobby.mockRejectedValue(error)
      
      await expect(socketService.joinLobby('TEST123')).rejects.toThrow('Network error')
      expect(mockGameStore.setError).toHaveBeenCalledWith('Network error')
    })

    it('should handle socket errors gracefully', () => {
      socketService.connect()
      
      const errorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1]
      
      const error = new Error('Socket error')
      errorCallback(error)
      
      expect(mockGameStore.setError).toHaveBeenCalledWith('Connection failed. Retrying...')
    })
  })
}) 