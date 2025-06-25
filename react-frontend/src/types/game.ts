// Game Constants
export const GAME_PHASES = {
  WAITING: 'waiting',
  STARTING: 'starting',
  QUESTION: 'question',
  RESULTS: 'results',
  FINISHED: 'finished'
} as const;

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false'
} as const;

export type GamePhase = typeof GAME_PHASES[keyof typeof GAME_PHASES];
export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES];

// Game State Types
export interface GameState {
  lobbyCode: string;
  phase: GamePhase;
  currentQuestion: number;
  scores: Record<string, number>;
  playerMultipliers: Record<string, number>;
  playerAnswers: Record<string, number>;
  hasAnswered: boolean;
  questionStartTime: Date | null;
  questionEndTime: Date | null;
  playerStreaks: Record<string, number>;
  playerCorrectAnswers: Record<string, number>;
  totalQuestions: number;
  timeRemaining?: number;
}

// Audio Types
export interface AudioSettings {
  masterVolume: number;
  soundEffectsVolume: number;
  backgroundMusicVolume: number;
  enabled: boolean;
}

export interface AudioManager {
  playCorrectAnswer(): Promise<void>;
  playIncorrectAnswer(): Promise<void>;
  playGameStart(): Promise<void>;
  playGameEnd(): Promise<void>;
  playCountdown(): Promise<void>;
  playButtonClick(): Promise<void>;
  playNotification(): Promise<void>;
  setVolume(volume: number): void;
  setMasterVolume(volume: number): void;
  setSoundEffectsVolume(volume: number): void;
  setBackgroundMusicVolume(volume: number): void;
  mute(): void;
  unmute(): void;
  isMuted(): boolean;
}

// Score System Types
export interface ScoreCalculation {
  baseScore: number;
  timeBonus: number;
  multiplierBonus: number;
  totalScore: number;
  multiplierUsed: number;
  timeElapsed: number;
}

export interface MultiplierState {
  current: number;
  streak: number;
  lastCorrect: boolean;
}

// Timer Types
export interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  totalTime: number;
  startTime: Date | null;
  endTime: Date | null;
}

// UI State Types
export interface UIState {
  currentScreen: string;
  isLoading: boolean;
  showModal: boolean;
  modalType: string | null;
  modalData: any;
  notifications: Notification[];
  theme: 'light' | 'dark';
  language: 'en' | 'de';
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: Date;
  dismissible?: boolean;
}

// Animation Types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface AnimationState {
  isAnimating: boolean;
  currentAnimation: string | null;
  queue: string[];
}

// Storage Types
export interface UserSettings {
  theme: 'light' | 'dark';
  language: 'en' | 'de';
  audio: AudioSettings;
  notifications: {
    enabled: boolean;
    sound: boolean;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  };
  gameplay: {
    autoSubmit: boolean;
    confirmAnswers: boolean;
    showHints: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  lobbyCode?: string;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  reconnectAttempts: number;
}

// Game Events
export interface GameEvent {
  type: string;
  data: any;
  timestamp: Date;
  source: 'client' | 'server' | 'websocket';
}

// Performance Types
export interface PerformanceMetrics {
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  fps: number;
}

// Error Types
export interface GameError {
  code: string;
  message: string;
  context: string;
  timestamp: Date;
  stack?: string;
  userAgent?: string;
  url?: string;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface GameComponentProps extends BaseComponentProps {
  gameState: GameState;
  onAction?: (action: string, data?: any) => void;
}

export interface PlayerComponentProps extends BaseComponentProps {
  player: import('./api').Player;
  isCurrentUser?: boolean;
  showActions?: boolean;
}

// Form Types
export interface FormField<T = string> {
  value: T;
  error: string | null;
  touched: boolean;
  valid: boolean;
}

export interface LoginFormData {
  username: FormField<string>;
  password: FormField<string>;
}

export interface RegisterFormData {
  username: FormField<string>;
  password: FormField<string>;
  confirmPassword: FormField<string>;
  character: FormField<string>;
}

// Route Types
export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  protected?: boolean;
  roles?: string[];
  title?: string;
}

// Theme Types
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    background: {
      primary: string;
      secondary: string;
      paper: string;
    };
    border: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
} 