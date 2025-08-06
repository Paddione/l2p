// Shared TypeScript types and interfaces

export interface Player {
  id: string;
  username: string;
  character: string;
  characterLevel?: number;
  isReady: boolean;
  isHost: boolean;
  score: number;
  multiplier: number;
  correctAnswers: number;
  isConnected: boolean;
}

export interface Lobby {
  id: number;
  code: string;
  hostId: string;
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  players: Player[];
  questionCount: number;
  currentQuestion: number;
  settings: {
    questionSetIds: number[];
    timeLimit: number;
    allowReplay: boolean;
  };
}

export interface LocalizedText {
  en: string;
  de: string;
}

export interface Answer {
  id: string;
  text: LocalizedText;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  questionText: LocalizedText;
  answers: Answer[];
  explanation?: LocalizedText;
  difficulty: number;
}