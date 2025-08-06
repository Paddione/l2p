import { SocketEvents } from '../socketService'
import { Player, Lobby, Question } from '../../types'

interface MockEventHandler {
  event: keyof SocketEvents
  handler: (...args: any[]) => void
}

class MockSocketService {
  private handlers: MockEventHandler[] = []
  private isConnected = false
  private connectionDelay = 100
  private shouldFailConnection = false

  // Control mock behavior for testing
  setShouldFailConnection(fail: boolean) {
    this.shouldFailConnection = fail
  }

  setConnectionDelay(delay: number) {
    this.connectionDelay = delay
  }

  // Connection methods
  async connect(_token?: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.connectionDelay))
    
    if (this.shouldFailConnection) {
      this.emit('connect_error', new Error('Mock connection failed'))
      return
    }

    this.isConnected = true
    this.emit('connect')
  }

  disconnect(): void {
    this.isConnected = false
    this.emit('disconnect', 'Client initiated disconnect')
  }

  isConnectedToServer(): boolean {
    return this.isConnected
  }

  // Event handling
  on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]): void {
    this.handlers.push({ event, handler })
  }

  off<K extends keyof SocketEvents>(event: K, handler?: SocketEvents[K]): void {
    if (handler) {
      this.handlers = this.handlers.filter(h => h.event !== event || h.handler !== handler)
    } else {
      this.handlers = this.handlers.filter(h => h.event !== event)
    }
  }

  emit<K extends keyof SocketEvents>(event: K, ...args: any[]): void {
    this.handlers
      .filter(h => h.event === event)
      .forEach(h => {
        try {
          h.handler(...args)
        } catch (error) {
          console.error(`Error in mock socket handler for ${event}:`, error)
        }
      })
  }

  // Lobby methods
  async joinLobby(lobbyCode: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const mockLobby: Lobby = {
      id: 1,
      code: lobbyCode,
      hostId: 'mock-host',
      status: 'waiting',
      players: [{
        id: 'mock-player-1',
        username: 'TestPlayer',
        character: 'wizard',
        isReady: false,
        isHost: true,
        score: 0,
        multiplier: 1,
        correctAnswers: 0,
        isConnected: true,
      }],
      questionCount: 10,
      currentQuestion: 0,
      settings: {
        questionSetIds: [1],
        timeLimit: 60,
        allowReplay: true,
      },
    }

    this.emit('lobby:joined', { lobby: mockLobby, players: mockLobby.players })
  }

  async leaveLobby(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50))
    this.emit('lobby:player_left', { playerId: 'mock-player-1' })
  }

  async setReady(isReady: boolean): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50))
    this.emit('lobby:player_ready', { playerId: 'mock-player-1', isReady })
  }

  async startGame(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const gameData = {
      questionCount: 10,
      timeLimit: 60,
      currentQuestion: 1,
    }
    
    this.emit('lobby:game_started', { gameData })
  }

  // Game methods
  async submitAnswer(answerIndex: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const isCorrect = answerIndex === 0 // First answer is always correct in mock
    
    this.emit('answer-received', {
      playerId: 'mock-player-1',
      hasAnswered: true,
      timeElapsed: 30,
    })

    if (isCorrect) {
      this.emit('time-update', {
        timeRemaining: 30,
      })
    }
  }

  // Test utility methods to simulate server events
  simulatePlayerJoined(player: Player): void {
    this.emit('lobby:player_joined', { player })
  }

  simulatePlayerLeft(playerId: string): void {
    this.emit('lobby:player_left', { playerId })
  }

  simulatePlayerReady(playerId: string, isReady: boolean): void {
    this.emit('lobby:player_ready', { playerId, isReady })
  }

  simulateGameStarted(gameData: any): void {
    this.emit('lobby:game_started', { gameData })
  }

  simulateQuestion(question: Question, timeRemaining: number = 60): void {
    this.emit('question-started', { question, questionIndex: 1, totalQuestions: 10, timeRemaining })
  }

  simulateTimeUp(): void {
    this.emit('time-update', { timeRemaining: 0 })
  }

  simulateQuestionResult(results: any[]): void {
    this.emit('question-ended', { results, correctAnswer: 'A', questionIndex: 1, totalQuestions: 10 })
  }

  simulateScoreUpdate(playerId: string, score: number, multiplier: number): void {
    this.emit('time-update', { timeRemaining: 30 })
  }

  simulateGameEnded(finalResults: any[]): void {
    this.emit('game-ended', { results: finalResults, gameSessionId: 1, questionSetIds: [1] })
  }

  simulateError(message: string): void {
    this.emit('error', { message })
  }

  simulateConnectionError(): void {
    this.emit('connect_error', new Error('Mock connection error'))
  }

  simulateDisconnect(reason: string = 'Server disconnect'): void {
    this.isConnected = false
    this.emit('disconnect', reason)
  }

  // Cleanup for tests
  clearAllHandlers(): void {
    this.handlers = []
  }

  reset(): void {
    this.clearAllHandlers()
    this.isConnected = false
    this.shouldFailConnection = false
    this.connectionDelay = 100
  }
}

export const mockSocketService = new MockSocketService()
export default mockSocketService 