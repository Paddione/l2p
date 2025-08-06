import { io, Socket } from 'socket.io-client'
import { useGameStore } from '../stores/gameStore'
import { performanceOptimizer } from './performanceOptimizer'
import { navigationService } from './navigationService'
import { apiService } from './apiService'

export interface SocketEvents {
  // Connection events
  connect: () => void
  disconnect: (reason: string) => void
  connect_error: (error: Error) => void
  
  // Lobby events
  'lobby:joined': (data: { lobby: any; players: any[] }) => void
  'lobby:player_joined': (data: { player: any }) => void
  'lobby:player_left': (data: { playerId: string }) => void
  'lobby:player_ready': (data: { playerId: string; isReady: boolean }) => void
  'lobby:game_started': (data: { gameData: any }) => void
  
  // Question set events
  'question-sets-updated': (data: { lobby: any; updatedBy: string }) => void
  'question-sets-update-success': (data: { message: string; lobby: any }) => void
  'question-sets-update-error': (data: { type: string; message: string }) => void
  'question-set-info': (data: { questionSetInfo: any }) => void
  'question-set-info-error': (data: { type: string; message: string }) => void
  
  // Game events
  'question-started': (data: { question: any; questionIndex: number; totalQuestions: number; timeRemaining: number }) => void
  'answer-received': (data: { playerId: string; hasAnswered: boolean; timeElapsed: number }) => void
  'question-ended': (data: { results: any[]; correctAnswer: string; questionIndex: number; totalQuestions: number }) => void
  'time-update': (data: { timeRemaining: number }) => void
  'game-ended': (data: { results: any[]; gameSessionId: number; questionSetIds: number[] }) => void
  'player-level-up': (data: { playerId: string; username: string; character: string; oldLevel: number; newLevel: number; experienceAwarded: number }) => void
  
  // Error events
  'error': (data: { message: string }) => void
}

export class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private connectionId: string = ''

  constructor() {
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    // Connection event handlers
    this.on('connect', () => {
      console.log('Connected to server')
      this.reconnectAttempts = 0
      this.isConnecting = false
      useGameStore.getState().setError(null)
    })

    this.on('disconnect', (reason: string) => {
      console.log('Disconnected from server:', reason)
      this.isConnecting = false
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return
      }
      
      this.attemptReconnect()
    })

    this.on('connect_error', (error: Error) => {
      console.error('Connection error:', error)
      this.isConnecting = false
      useGameStore.getState().setError('Connection failed. Retrying...')
      this.attemptReconnect()
    })

    // Lobby event handlers
    this.on('lobby:joined', (data) => {
      console.log('Joined lobby:', data)
      const { setPlayers, setLobbyCode } = useGameStore.getState()
      setPlayers(data.players)
      setLobbyCode(data.lobby.code)
    })

    this.on('lobby:player_joined', (data) => {
      console.log('Player joined:', data)
      const { addPlayer } = useGameStore.getState()
      addPlayer(data.player)
    })

    this.on('lobby:player_left', (data) => {
      console.log('Player left:', data)
      const { removePlayer } = useGameStore.getState()
      removePlayer(data.playerId)
    })

    this.on('lobby:player_ready', (data) => {
      console.log('Player ready:', data)
      const { updatePlayer } = useGameStore.getState()
      updatePlayer(data.playerId, { isReady: data.isReady })
    })

    this.on('lobby:game_started', (data) => {
      console.log('Game started:', data)
      const { setGameStarted, setCurrentQuestion, setTimeRemaining, lobbyCode } = useGameStore.getState()
      setGameStarted(true)
      setCurrentQuestion(data.gameData.question)
      setTimeRemaining(data.gameData.timeRemaining)
      
      // Navigate to game page
      if (lobbyCode) {
        navigationService.navigateToGame(lobbyCode)
      }
    })

    // Question set event handlers
    this.on('question-sets-updated', (data) => {
      console.log('Question sets updated:', data)
      const { setPlayers, setQuestionSetInfo } = useGameStore.getState()
      setPlayers(data.lobby.players)
      // Update question set info if available
      if (data.lobby.settings?.questionSetIds) {
        // This will be handled by the QuestionSetSelector component
      }
    })

    this.on('question-sets-update-success', (data) => {
      console.log('Question sets update success:', data)
      // Success notification could be shown here
    })

    this.on('question-sets-update-error', (data) => {
      console.error('Question sets update error:', data)
      useGameStore.getState().setError(data.message)
    })

    this.on('question-set-info', (data) => {
      console.log('Question set info received:', data)
      const { setQuestionSetInfo } = useGameStore.getState()
      setQuestionSetInfo(data.questionSetInfo)
    })

    this.on('question-set-info-error', (data) => {
      console.error('Question set info error:', data)
      useGameStore.getState().setError(data.message)
    })

    // Game event handlers
    this.on('question-started', (data) => {
      console.log('New question started:', data)
      const { setCurrentQuestion, setQuestionIndex, setTotalQuestions, setTimeRemaining } = useGameStore.getState()
      setCurrentQuestion(data.question)
      setQuestionIndex(data.questionIndex)
      setTotalQuestions(data.totalQuestions)
      setTimeRemaining(data.timeRemaining)
    })

    this.on('answer-received', (data) => {
      console.log('Answer received:', data)
      // Handle answer feedback - could show visual indicator
    })

    this.on('question-ended', (data) => {
      console.log('Question ended:', data)
      // Handle question results display
      // Could show correct answer and player results
    })

    this.on('time-update', (data) => {
      console.log('Time update:', data)
      const { setTimeRemaining } = useGameStore.getState()
      setTimeRemaining(data.timeRemaining)
    })

    this.on('game-ended', (data) => {
      console.log('Game ended:', data)
      const { setGameEnded, setGameResults, lobbyCode } = useGameStore.getState()
      setGameEnded(true)
      setGameResults(data.results)
      
      // Navigate to results page
      if (lobbyCode) {
        navigationService.navigateToResults(lobbyCode)
      }
    })

    this.on('player-level-up', (data) => {
      console.log('Player level up:', data)
      const { addLevelUpNotification } = useGameStore.getState()
      addLevelUpNotification({
        playerId: data.playerId,
        username: data.username,
        character: data.character,
        oldLevel: data.oldLevel,
        newLevel: data.newLevel,
        experienceAwarded: data.experienceAwarded
      })
    })

    // Error event handler
    this.on('error', (data) => {
      console.error('Server error:', data)
      useGameStore.getState().setError(data.message)
    })
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      useGameStore.getState().setError('Connection lost. Please refresh the page.')
      return
    }

    if (this.isConnecting) return

    this.reconnectAttempts++
    this.isConnecting = true
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.connect()
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  connect(url?: string) {
    if (this.socket?.connected) {
      console.log('Already connected')
      return
    }

    // Check if we can create a new connection
    this.connectionId = `socket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    if (!performanceOptimizer.canCreateConnection(this.connectionId)) {
      console.warn('Maximum WebSocket connections reached')
      return
    }

    // Handle both Vite and Jest environments
    let envUrl: string | undefined;
    
    // Check if we're in a Vite environment (import.meta available)
    if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SOCKET_URL) {
      envUrl = import.meta.env.VITE_SOCKET_URL;
    } else if (typeof process !== 'undefined' && process.env?.VITE_SOCKET_URL) {
      // Fallback to process.env for Jest/Node environment
      envUrl = process.env.VITE_SOCKET_URL;
    }
    const serverUrl = url || envUrl || 'http://localhost:3001'
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: false, // We handle reconnection manually
    })

    // Register the connection
    performanceOptimizer.registerConnection(this.connectionId)

    this.setupEventHandlers()
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    // Unregister the connection
    if (this.connectionId) {
      performanceOptimizer.unregisterConnection(this.connectionId)
      this.connectionId = ''
    }
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit:', event)
    }
  }

  on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]) {
    if (this.socket) {
      this.socket.on(event, callback as any)
    }
  }

  off<T extends keyof SocketEvents>(event: T, callback?: SocketEvents[T]) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback as any)
      } else {
        this.socket.off(event)
      }
    }
  }

  // Lobby methods
  async joinLobby(lobbyCode: string) {
    try {
      // First try API call
      const response = await apiService.joinLobby({
        lobbyCode
      })
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to join lobby')
      }
      
      // Then emit socket event for real-time updates
      this.emit('lobby:join', { lobbyCode })
      
      return response
    } catch (error) {
      console.error('Failed to join lobby:', error)
      useGameStore.getState().setError(error instanceof Error ? error.message : 'Failed to join lobby')
      throw error
    }
  }

  async createLobby(settings: { questionCount: number }) {
    try {
      // First try API call
      const response = await apiService.createLobby({
        questionCount: settings.questionCount,
      })
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create lobby')
      }
      
      // Then emit socket event for real-time updates
      this.emit('lobby:create', { settings })
      
      return response
    } catch (error) {
      console.error('Failed to create lobby:', error)
      useGameStore.getState().setError(error instanceof Error ? error.message : 'Failed to create lobby')
      throw error
    }
  }

  setReady(isReady: boolean) {
    this.emit('lobby:ready', { isReady })
  }

  startGame() {
    this.emit('lobby:start_game')
  }

  // Game methods
  submitAnswer(answerIndex: number) {
    this.emit('game:answer', { answerIndex })
  }

  // Question set management methods
  updateQuestionSets(lobbyCode: string, hostId: string, questionSetIds: number[], questionCount: number) {
    this.emit('update-question-sets', {
      lobbyCode,
      hostId,
      questionSetIds,
      questionCount
    })
  }

  getQuestionSetInfo(lobbyCode: string) {
    this.emit('get-question-set-info', { lobbyCode })
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.socket?.connected) return 'connected'
    if (this.isConnecting) return 'connecting'
    return 'disconnected'
  }
}

// Export singleton instance
export const socketService = new SocketService() 