// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
  error?: {
    code: string;
    message: string;
    recovery?: string;
  };
  requestId?: string;
}

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  character: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

// User Types
export interface User {
  id?: number;
  username: string;
  character: string;
  score?: number;
  multiplier?: number;
  lastLogin?: string;
  created_at?: string;
  updated_at?: string;
}

// Hall of Fame Types
export interface HallOfFameEntry {
  id?: number;
  username: string;
  character: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  catalog_name: string;
  achieved_at: string;
  multiplier_bonus?: number;
  time_bonus?: number;
}

export interface HallOfFameResponse {
  entries: HallOfFameEntry[];
  total: number;
  catalog_name?: string;
}

export interface LeaderboardEntry {
  username: string;
  character: string;
  score: number;
  questionsCorrect?: number;
  totalQuestions?: number;
  achievedAt?: string;
}

export interface Leaderboard {
  questionSet: string;
  entries: LeaderboardEntry[];
  lastUpdated: string;
}

export interface Catalog {
  name: string;
  display_name: string;
  question_count: number;
  created_at: string;
}

// Lobby Types
export interface Player {
  username: string;
  character: string;
  score: number;
  multiplier: number;
  is_ready: boolean;
  is_host: boolean;
  connected: boolean;
  last_activity?: string;
}

export interface Question {
  id?: number;
  question: string;
  answers: string[];
  correct_answer: number;
  type: 'multiple_choice' | 'true_false';
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  time_limit?: number;
}

export interface GameTiming {
  questionStartTime: string;
  questionEndTime?: string;
  timeRemaining?: number;
  totalTime?: number;
}

export interface LobbyState {
  code: string;
  host: string;
  players: Player[];
  max_players: number;
  is_private: boolean;
  status: 'waiting' | 'playing' | 'finished';
  game_phase: 'waiting' | 'starting' | 'question' | 'results' | 'finished';
  current_question: number;
  questions: Question[];
  question_set: string;
  created_at: string;
  updated_at: string;
  timing?: GameTiming;
  settings?: GameSettings;
}

export interface GameSettings {
  question_time_limit: number;
  max_players: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  categories?: string[];
  shuffle_questions: boolean;
  shuffle_answers: boolean;
}

export interface CreateLobbyRequest {
  host: Player;
  question_set: string;
  max_players?: number;
  is_private?: boolean;
  settings?: Partial<GameSettings>;
}

export interface JoinLobbyRequest {
  username: string;
  character: string;
}

// Game Types
export interface GameAnswer {
  username: string;
  answer: number;
  time_taken: number;
  is_correct: boolean;
  points_earned: number;
  multiplier_used: number;
}

export interface QuestionResult {
  question: Question;
  correct_answer: number;
  player_answers: GameAnswer[];
  question_number: number;
  total_questions: number;
}

export interface GameResults {
  final_scores: Record<string, number>;
  winners: string[];
  question_results: QuestionResult[];
  game_duration: number;
  hall_of_fame_entries?: HallOfFameEntry[];
}

// Health Check Type
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version?: string;
  uptime?: number;
  database?: {
    status: 'connected' | 'disconnected';
    response_time?: number;
  };
}

// Generic API Error
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  recovery?: string;
  data?: any;
  requestId?: string;
  debug?: any;
} 