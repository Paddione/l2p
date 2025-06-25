import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import apiClient from '../services/api';
import type { LobbyState, Question, GameResults } from '../types/api';
import type { GameState, GamePhase, TimerState } from '../types/game';

interface GameStoreState {
  // Lobby state
  currentLobby: LobbyState | null;
  joinedLobbies: string[];
  
  // Game state
  gameState: GameState | null;
  currentQuestion: Question | null;
  questionNumber: number;
  totalQuestions: number;
  
  // Timer state
  timer: TimerState;
  
  // Player state
  hasAnswered: boolean;
  selectedAnswer: number | null;
  playerScore: number;
  playerMultiplier: number;
  
  // Results
  gameResults: GameResults | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // WebSocket state
  isConnected: boolean;
  reconnectAttempts: number;
}

interface GameStoreActions {
  // Lobby actions
  createLobby: (questionSet: string, maxPlayers?: number) => Promise<LobbyState>;
  joinLobby: (code: string, player: { username: string; character: string }) => Promise<LobbyState>;
  leaveLobby: (code: string, username: string) => Promise<void>;
  updateLobby: (lobbyState: LobbyState) => void;
  
  // Game actions
  startGame: (lobbyCode: string) => Promise<void>;
  submitAnswer: (answer: number) => Promise<void>;
  nextQuestion: () => void;
  endGame: () => Promise<void>;
  
  // Timer actions
  startTimer: (duration: number) => void;
  stopTimer: () => void;
  updateTimer: (timeRemaining: number) => void;
  
  // Player actions
  setAnswer: (answer: number) => void;
  clearAnswer: () => void;
  updateScore: (score: number) => void;
  updateMultiplier: (multiplier: number) => void;
  
  // Utility actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
  
  // WebSocket actions
  setConnected: (connected: boolean) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
}

type GameStore = GameStoreState & GameStoreActions;

const initialTimerState: TimerState = {
  isRunning: false,
  timeRemaining: 0,
  totalTime: 0,
  startTime: null,
  endTime: null,
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentLobby: null,
    joinedLobbies: [],
    gameState: null,
    currentQuestion: null,
    questionNumber: 0,
    totalQuestions: 0,
    timer: initialTimerState,
    hasAnswered: false,
    selectedAnswer: null,
    playerScore: 0,
    playerMultiplier: 1,
    gameResults: null,
    isLoading: false,
    error: null,
    isConnected: false,
    reconnectAttempts: 0,

    // Lobby actions
    createLobby: async (questionSet: string, maxPlayers = 8) => {
      set({ isLoading: true, error: null });
      
      try {
        // This would need to be implemented with proper user data
        const lobbyData = {
          host: {
            username: 'current-user', // This should come from auth store
            character: 'default',
            score: 0,
            multiplier: 1,
            is_ready: true,
            is_host: true,
            connected: true,
          },
          question_set: questionSet,
          max_players: maxPlayers,
          is_private: false,
        };
        
        const lobby = await apiClient.createLobby(lobbyData);
        
        set({
          currentLobby: lobby,
          joinedLobbies: [...get().joinedLobbies, lobby.code],
          isLoading: false,
        });
        
        return lobby;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create lobby';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    joinLobby: async (code: string, player: { username: string; character: string }) => {
      set({ isLoading: true, error: null });
      
      try {
        const lobby = await apiClient.joinLobby(code, player);
        
        set({
          currentLobby: lobby,
          joinedLobbies: [...get().joinedLobbies, code],
          isLoading: false,
        });
        
        return lobby;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to join lobby';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    leaveLobby: async (code: string, username: string) => {
      set({ isLoading: true, error: null });
      
      try {
        await apiClient.leaveLobby(code, username);
        
        set({
          currentLobby: null,
          joinedLobbies: get().joinedLobbies.filter(c => c !== code),
          isLoading: false,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to leave lobby';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    updateLobby: (lobbyState: LobbyState) => {
      set({ currentLobby: lobbyState });
    },

    // Game actions
    startGame: async (lobbyCode: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const lobby = await apiClient.getLobby(lobbyCode);
        
        if (lobby.questions && lobby.questions.length > 0) {
          const gameState: GameState = {
            lobbyCode,
            phase: 'starting' as GamePhase,
            currentQuestion: 0,
            scores: {},
            playerMultipliers: {},
            playerAnswers: {},
            hasAnswered: false,
            questionStartTime: null,
            questionEndTime: null,
            playerStreaks: {},
            playerCorrectAnswers: {},
            totalQuestions: lobby.questions.length,
          };
          
          // Initialize player data
          lobby.players.forEach(player => {
            gameState.scores[player.username] = player.score;
            gameState.playerMultipliers[player.username] = player.multiplier;
            gameState.playerStreaks[player.username] = 0;
            gameState.playerCorrectAnswers[player.username] = 0;
          });
          
          set({
            gameState,
            currentQuestion: lobby.questions[0],
            questionNumber: 1,
            totalQuestions: lobby.questions.length,
            hasAnswered: false,
            selectedAnswer: null,
            isLoading: false,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start game';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    submitAnswer: async (answer: number) => {
      const { currentLobby, currentQuestion } = get();
      
      if (!currentLobby || !currentQuestion) {
        throw new Error('No active game or question');
      }
      
      set({ hasAnswered: true, selectedAnswer: answer });
      
      // In a real implementation, this would submit to the server
      // For now, we'll just update local state
      console.log(`Submitted answer: ${answer} for question: ${currentQuestion.question}`);
    },

    nextQuestion: () => {
      const { gameState, currentLobby, questionNumber } = get();
      
      if (!gameState || !currentLobby) {
        return;
      }
      
      if (questionNumber < gameState.totalQuestions) {
        const nextQuestionIndex = questionNumber;
        const nextQuestion = currentLobby.questions[nextQuestionIndex];
        
        set({
          currentQuestion: nextQuestion,
          questionNumber: questionNumber + 1,
          hasAnswered: false,
          selectedAnswer: null,
          timer: initialTimerState,
        });
      } else {
        // Game finished
        set({
          gameState: { ...gameState, phase: 'finished' },
        });
      }
    },

    endGame: async () => {
      const { gameState } = get();
      
      if (!gameState) {
        return;
      }
      
      set({
        gameState: { ...gameState, phase: 'finished' },
        timer: initialTimerState,
      });
    },

    // Timer actions
    startTimer: (duration: number) => {
      const now = new Date();
      set({
        timer: {
          isRunning: true,
          timeRemaining: duration,
          totalTime: duration,
          startTime: now,
          endTime: new Date(now.getTime() + duration * 1000),
        },
      });
    },

    stopTimer: () => {
      set({
        timer: {
          ...get().timer,
          isRunning: false,
        },
      });
    },

    updateTimer: (timeRemaining: number) => {
      set({
        timer: {
          ...get().timer,
          timeRemaining: Math.max(0, timeRemaining),
        },
      });
    },

    // Player actions
    setAnswer: (answer: number) => {
      set({ selectedAnswer: answer });
    },

    clearAnswer: () => {
      set({ selectedAnswer: null, hasAnswered: false });
    },

    updateScore: (score: number) => {
      set({ playerScore: score });
    },

    updateMultiplier: (multiplier: number) => {
      set({ playerMultiplier: multiplier });
    },

    // Utility actions
    clearError: () => {
      set({ error: null });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    reset: () => {
      set({
        currentLobby: null,
        gameState: null,
        currentQuestion: null,
        questionNumber: 0,
        totalQuestions: 0,
        timer: initialTimerState,
        hasAnswered: false,
        selectedAnswer: null,
        playerScore: 0,
        playerMultiplier: 1,
        gameResults: null,
        error: null,
        isConnected: false,
        reconnectAttempts: 0,
      });
    },

    // WebSocket actions
    setConnected: (connected: boolean) => {
      set({ isConnected: connected });
      if (connected) {
        set({ reconnectAttempts: 0 });
      }
    },

    incrementReconnectAttempts: () => {
      set({ reconnectAttempts: get().reconnectAttempts + 1 });
    },

    resetReconnectAttempts: () => {
      set({ reconnectAttempts: 0 });
    },
  }))
); 