import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Player } from '../types'
import { performanceOptimizer } from '../services/performanceOptimizer'

export interface Question {
  id: string
  text: string
  answers: string[]
  correctAnswer: number
  timeLimit: number
}

export interface QuestionSetInfo {
  selectedSets: Array<{ id: number; name: string; questionCount: number }>
  totalQuestions: number
  selectedQuestionCount: number
  maxQuestionCount: number
}

export interface GameResult {
  id: string
  username: string
  character: string
  characterLevel?: number
  finalScore: number
  correctAnswers: number
  multiplier: number
  experienceAwarded: number
  levelUp: boolean
  newLevel: number
  oldLevel: number
}

export interface LevelUpNotification {
  playerId: string
  username: string
  character: string
  oldLevel: number
  newLevel: number
  experienceAwarded: number
}

export interface GameState {
  // Lobby state
  lobbyCode: string | null
  isHost: boolean
  players: Player[]
  maxPlayers: number
  questionSetInfo: QuestionSetInfo | null
  
  // Game session state
  gameStarted: boolean
  currentQuestion: Question | null
  questionIndex: number
  totalQuestions: number
  timeRemaining: number
  gameEnded: boolean
  
  // Game results and experience
  gameResults: GameResult[]
  levelUpNotifications: LevelUpNotification[]
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions
  setLobbyCode: (code: string | null) => void
  setIsHost: (isHost: boolean) => void
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  updatePlayer: (playerId: string, updates: Partial<Player>) => void
  setQuestionSetInfo: (info: QuestionSetInfo | null) => void
  setGameStarted: (started: boolean) => void
  setCurrentQuestion: (question: Question | null) => void
  setQuestionIndex: (index: number) => void
  setTotalQuestions: (total: number) => void
  setTimeRemaining: (time: number) => void
  setGameEnded: (ended: boolean) => void
  setGameResults: (results: GameResult[]) => void
  addLevelUpNotification: (notification: LevelUpNotification) => void
  removeLevelUpNotification: (index: number) => void
  clearLevelUpNotifications: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetGame: () => void
}

const initialState = {
  lobbyCode: null,
  isHost: false,
  players: [],
  maxPlayers: 8,
  questionSetInfo: null,
  gameStarted: false,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  timeRemaining: 60,
  gameEnded: false,
  gameResults: [],
  levelUpNotifications: [],
  isLoading: false,
  error: null,
}

export const useGameStore = create<GameState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setLobbyCode: (code) => set({ lobbyCode: code }),
      setIsHost: (isHost) => set({ isHost }),
      setPlayers: (players) => set({ players }),
      addPlayer: (player) => set((state) => ({ 
        players: [...state.players, player] 
      })),
      removePlayer: (playerId) => set((state) => ({ 
        players: state.players.filter(p => p.id !== playerId) 
      })),
      updatePlayer: (playerId, updates) => set((state) => ({
        players: state.players.map(p => 
          p.id === playerId ? { ...p, ...updates } : p
        )
      })),
      setQuestionSetInfo: (info) => set({ questionSetInfo: info }),
      setGameStarted: (started) => set({ gameStarted: started }),
      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      setQuestionIndex: (index) => set({ questionIndex: index }),
      setTotalQuestions: (total) => set({ totalQuestions: total }),
      setTimeRemaining: (time) => {
        // Throttle time updates to prevent excessive re-renders
        const throttledUpdate = performanceOptimizer.throttle('time-remaining-update', () => {
          set({ timeRemaining: time })
        }, 100) // Update every 100ms max
        throttledUpdate()
      },
      setGameEnded: (ended) => set({ gameEnded: ended }),
      setGameResults: (results) => set({ gameResults: results }),
      addLevelUpNotification: (notification) => set((state) => ({
        levelUpNotifications: [...state.levelUpNotifications, notification]
      })),
      removeLevelUpNotification: (index) => set((state) => ({
        levelUpNotifications: state.levelUpNotifications.filter((_, i) => i !== index)
      })),
      clearLevelUpNotifications: () => set({ levelUpNotifications: [] }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      resetGame: () => set(initialState),
    }),
    {
      name: 'game-store',
    }
  )
) 