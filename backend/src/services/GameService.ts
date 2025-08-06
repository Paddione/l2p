import { Server } from 'socket.io';
import { GameSessionRepository, CreateGameSessionData } from '../repositories/GameSessionRepository.js';
import { LobbyService } from './LobbyService.js';
import { QuestionService } from './QuestionService.js';
import { ScoringService } from './ScoringService.js';
import { CharacterService } from './CharacterService.js';
import { RequestLogger } from '../middleware/logging.js';

export interface GameState {
  lobbyCode: string;
  gameSessionId: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  isActive: boolean;
  players: GamePlayer[];
  currentQuestion?: QuestionData | undefined;
  questionStartTime?: number | undefined;
  selectedQuestionSetIds: number[];
  questions: QuestionData[];
}

export interface GamePlayer {
  id: string;
  username: string;
  character: string;
  characterLevel?: number;
  isHost: boolean;
  score: number;
  multiplier: number;
  correctAnswers: number;
  hasAnsweredCurrentQuestion: boolean;
  currentAnswer?: string | undefined;
  answerTime?: number | undefined;
  isConnected: boolean;
}

export interface QuestionData {
  id: number;
  question: string;
  answers: string[];
  correctAnswer: string;
  questionSetId: number;
  language: string;
  explanation?: string | undefined;
}

export class GameService {
  private io: Server;
  private lobbyService: LobbyService;
  private questionService: QuestionService;
  private scoringService: ScoringService;
  private characterService: CharacterService;
  private gameSessionRepository: GameSessionRepository;
  private activeGames: Map<string, GameState> = new Map();
  private gameTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.lobbyService = new LobbyService();
    this.questionService = new QuestionService();
    this.scoringService = new ScoringService();
    this.characterService = new CharacterService();
    this.gameSessionRepository = new GameSessionRepository();
  }

  /**
   * Start a new game session
   */
  async startGameSession(lobbyCode: string, hostId: number): Promise<GameState> {
    try {
      // Get lobby information
      const lobby = await this.lobbyService.getLobbyByCode(lobbyCode);
      if (!lobby) {
        throw new Error('Lobby not found');
      }

      // Verify host permission
      if (lobby.host_id !== hostId) {
        throw new Error('Only the host can start the game');
      }

      // Check if game is already active
      if (this.activeGames.has(lobbyCode)) {
        throw new Error('Game is already in progress');
      }

      // Get question set information from lobby settings
      const questionSetInfo = await this.lobbyService.getLobbyQuestionSetInfo(lobbyCode);
      if (!questionSetInfo || questionSetInfo.selectedSets.length === 0) {
        throw new Error('No question sets selected for this lobby');
      }

      const selectedQuestionSetIds = questionSetInfo.selectedSets.map(set => set.id);
      const totalQuestions = questionSetInfo.selectedQuestionCount;

      // Load all questions for the selected sets
      let questions = await this.questionService.getRandomQuestions({
        questionSetIds: selectedQuestionSetIds,
        count: totalQuestions
      });

      // If no questions available in selected sets, try fallback
      if (!questions || questions.length === 0) {
        console.warn(`No questions available in selected sets: ${selectedQuestionSetIds.join(', ')}. Using fallback questions.`);
        questions = await this.questionService.getRandomQuestions({
          questionSetIds: [1], // Default fallback set
          count: totalQuestions
        });

        if (!questions || questions.length === 0) {
          // Create basic fallback questions
          const fallbackQuestions = await this.getFallbackQuestions(totalQuestions);
          questions = fallbackQuestions.map(q => ({
            id: q.id,
            question_text: { en: q.question, de: q.question },
            answers: q.answers.map((a, i) => ({
              text: { en: a, de: a },
              correct: a === q.correctAnswer
            })),
            question_set_id: q.questionSetId,
            ...(q.explanation && { explanation: { en: q.explanation, de: q.explanation } }),
            difficulty: 1,
            created_at: new Date()
          }));
        }
      }

      // Convert questions to localized format
      const localizedQuestions: QuestionData[] = questions.map(q => ({
        id: q.id,
        question: q.question_text.en, // Default to English, will be localized per player
        answers: q.answers.map(a => a.text.en),
        correctAnswer: q.answers.find(a => a.correct)?.text.en || '',
        questionSetId: q.question_set_id,
        language: 'en',
        explanation: q.explanation?.en || undefined
      }));

      // Create game session in database
      const gameSessionData: CreateGameSessionData = {
        lobby_id: lobby.id,
        total_questions: totalQuestions,
        session_data: {
          ...lobby.settings,
          selectedQuestionSetIds,
          questions: localizedQuestions.map(q => ({
            id: q.id,
            questionSetId: q.questionSetId
          }))
        }
      };

      // Add question_set_id if available
      if (selectedQuestionSetIds.length > 0) {
        (gameSessionData as any).question_set_id = selectedQuestionSetIds[0];
      }

      const gameSession = await this.gameSessionRepository.createGameSession(gameSessionData);

      // Initialize game state
      const gameState: GameState = {
        lobbyCode,
        gameSessionId: gameSession.id,
        currentQuestionIndex: 0,
        totalQuestions,
        timeRemaining: 60,
        isActive: true,
        selectedQuestionSetIds,
        questions: localizedQuestions,
        players: lobby.players.map(player => ({
          id: player.id,
          username: player.username,
          character: player.character,
          characterLevel: player.characterLevel || 1,
          isHost: player.isHost,
          score: 0,
          multiplier: 1,
          correctAnswers: 0,
          hasAnsweredCurrentQuestion: false,
          isConnected: player.isConnected
        }))
      };

      // Store active game
      this.activeGames.set(lobbyCode, gameState);

      // Start the first question
      await this.startNextQuestion(lobbyCode);

      RequestLogger.logGameEvent('game-started', lobbyCode, undefined, { 
        gameSessionId: gameSession.id,
        questionSetIds: selectedQuestionSetIds,
        totalQuestions
      });

      return gameState;
    } catch (error) {
      console.error('Error starting game session:', error);
      throw error;
    }
  }

  /**
   * Start the next question in the game
   */
  async startNextQuestion(lobbyCode: string): Promise<void> {
    const gameState = this.activeGames.get(lobbyCode);
    if (!gameState) {
      throw new Error('Game not found');
    }

    // Check if game is finished
    if (gameState.currentQuestionIndex >= gameState.totalQuestions) {
      await this.endGameSession(lobbyCode);
      return;
    }

    // Get question for current index
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (!currentQuestion) {
      throw new Error('No question available for current index');
    }

    // Update game state
    gameState.currentQuestion = currentQuestion;
    gameState.currentQuestionIndex++;
    gameState.timeRemaining = 60;
    gameState.questionStartTime = Date.now();

    // Reset player answer states
    gameState.players.forEach(player => {
      player.hasAnsweredCurrentQuestion = false;
      player.currentAnswer = undefined;
      player.answerTime = undefined;
    });

    // Broadcast question to all players
    this.io.to(lobbyCode).emit('question-started', {
      question: gameState.currentQuestion,
      questionIndex: gameState.currentQuestionIndex,
      totalQuestions: gameState.totalQuestions,
      timeRemaining: gameState.timeRemaining
    });

    // Start timer
    this.startQuestionTimer(lobbyCode);

    RequestLogger.logGameEvent('question-started', lobbyCode, undefined, {
      questionId: currentQuestion.id,
      questionIndex: gameState.currentQuestionIndex,
      questionSetId: currentQuestion.questionSetId
    });
  }

  /**
   * Start the 60-second timer for the current question
   */
  private startQuestionTimer(lobbyCode: string): void {
    // Clear existing timer
    const existingTimer = this.gameTimers.get(lobbyCode);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    const timer = setInterval(async () => {
      const gameState = this.activeGames.get(lobbyCode);
      if (!gameState || !gameState.isActive) {
        clearInterval(timer);
        return;
      }

      gameState.timeRemaining--;

      // Broadcast time update
      this.io.to(lobbyCode).emit('time-update', {
        timeRemaining: gameState.timeRemaining
      });

      // When time runs out
      if (gameState.timeRemaining <= 0) {
        clearInterval(timer);
        await this.endCurrentQuestion(lobbyCode);
      }
    }, 1000);

    this.gameTimers.set(lobbyCode, timer);
  }

  /**
   * Handle player answer submission
   */
  async submitAnswer(lobbyCode: string, playerId: string, answer: string): Promise<void> {
    const gameState = this.activeGames.get(lobbyCode);
    if (!gameState || !gameState.isActive) {
      throw new Error('Game not active');
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (player.hasAnsweredCurrentQuestion) {
      throw new Error('Player has already answered this question');
    }

    // Calculate time elapsed
    const timeElapsed = gameState.questionStartTime ? 
      Math.floor((Date.now() - gameState.questionStartTime) / 1000) : 0;

    // Record player's answer
    player.hasAnsweredCurrentQuestion = true;
    player.currentAnswer = answer;
    player.answerTime = timeElapsed;

    // Check if answer is correct
    const isCorrect = answer === gameState.currentQuestion?.correctAnswer;
    
    // Calculate score using ScoringService
    const scoreCalculation = this.scoringService.calculateScore(
      timeElapsed,
      player.multiplier,
      isCorrect,
      player.correctAnswers // Use correct answers as streak count
    );
    
    // Update player state
    player.score += scoreCalculation.pointsEarned;
    player.multiplier = scoreCalculation.newMultiplier;
    
    if (isCorrect) {
      player.correctAnswers++;
    }

    // Broadcast answer received (without revealing correctness)
    this.io.to(lobbyCode).emit('answer-received', {
      playerId,
      hasAnswered: true,
      timeElapsed
    });

    // Check if all players have answered
    const allAnswered = gameState.players.every(p => p.hasAnsweredCurrentQuestion);
    if (allAnswered) {
      // End question early if all players answered
      await this.endCurrentQuestion(lobbyCode);
    }

    RequestLogger.logGameEvent('answer-submitted', lobbyCode, undefined, {
      playerId,
      isCorrect,
      timeElapsed
    });
  }

  /**
   * End the current question and show results
   */
  async endCurrentQuestion(lobbyCode: string): Promise<void> {
    const gameState = this.activeGames.get(lobbyCode);
    if (!gameState || !gameState.isActive) {
      return;
    }

    // Clear timer
    const timer = this.gameTimers.get(lobbyCode);
    if (timer) {
      clearInterval(timer);
      this.gameTimers.delete(lobbyCode);
    }

    // Prepare results
    const results = gameState.players.map(player => ({
      id: player.id,
      username: player.username,
      character: player.character,
      answer: player.currentAnswer,
      isCorrect: player.currentAnswer === gameState.currentQuestion?.correctAnswer,
      score: player.score,
      multiplier: player.multiplier,
      timeElapsed: player.answerTime || 60
    }));

    // Broadcast question results
    this.io.to(lobbyCode).emit('question-ended', {
      results,
      correctAnswer: gameState.currentQuestion?.correctAnswer,
      questionIndex: gameState.currentQuestionIndex,
      totalQuestions: gameState.totalQuestions
    });

    // Wait 3 seconds before starting next question
    setTimeout(async () => {
      await this.startNextQuestion(lobbyCode);
    }, 3000);

    RequestLogger.logGameEvent('question-ended', lobbyCode, undefined, {
      questionIndex: gameState.currentQuestionIndex,
      results: results.map(r => ({ playerId: r.id, isCorrect: r.isCorrect }))
    });
  }

  /**
   * End the entire game session
   */
  async endGameSession(lobbyCode: string): Promise<void> {
    const gameState = this.activeGames.get(lobbyCode);
    if (!gameState) {
      return;
    }

    // Clear timer
    const timer = this.gameTimers.get(lobbyCode);
    if (timer) {
      clearInterval(timer);
      this.gameTimers.delete(lobbyCode);
    }

    // Update game session in database
    await this.gameSessionRepository.endGameSession(gameState.gameSessionId, {
      final_scores: gameState.players.map(p => ({
        playerId: p.id,
        username: p.username,
        finalScore: p.score,
        correctAnswers: p.correctAnswers
      }))
    });

    // Save player results to database and award experience
    const experienceResults: Array<{
      playerId: string;
      experienceAwarded: number;
      levelUp: boolean;
      newLevel: number;
      oldLevel: number;
      characterName: string;
    }> = [];

    for (const player of gameState.players) {
      try {
        // Get user ID if player is authenticated
        const userRepo = new (await import('../repositories/UserRepository.js')).UserRepository();
        const user = await userRepo.findByUsername(player.username);
        const userId = user?.id;

        const experienceResult = await this.scoringService.savePlayerResult(gameState.gameSessionId, {
          ...(userId && { userId }),
          username: player.username,
          characterName: player.character,
          finalScore: player.score,
          correctAnswers: player.correctAnswers,
          totalQuestions: gameState.totalQuestions,
          maxMultiplier: player.multiplier,
          answerDetails: [] // Will be populated with actual answer details
        });

        if (experienceResult) {
          experienceResults.push({
            playerId: player.id,
            characterName: player.character,
            ...experienceResult
          });
        }
      } catch (error) {
        console.error('Error saving player result:', error);
      }
    }

    // Prepare final results with experience information
    const finalResults = gameState.players
      .map(player => {
        const experienceResult = experienceResults.find(er => er.playerId === player.id);
        return {
          id: player.id,
          username: player.username,
          character: player.character,
          characterLevel: player.characterLevel,
          finalScore: player.score,
          correctAnswers: player.correctAnswers,
          multiplier: player.multiplier,
          experienceAwarded: experienceResult?.experienceAwarded || 0,
          levelUp: experienceResult?.levelUp || false,
          newLevel: experienceResult?.newLevel || player.characterLevel || 1,
          oldLevel: experienceResult?.oldLevel || player.characterLevel || 1
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    // Broadcast game end with experience and level-up information
    this.io.to(lobbyCode).emit('game-ended', {
      results: finalResults,
      gameSessionId: gameState.gameSessionId,
      questionSetIds: gameState.selectedQuestionSetIds
    });

    // Send individual level-up notifications
    for (const result of finalResults) {
      if (result.levelUp) {
        this.io.to(lobbyCode).emit('player-level-up', {
          playerId: result.id,
          username: result.username,
          character: result.character,
          oldLevel: result.oldLevel,
          newLevel: result.newLevel,
          experienceAwarded: result.experienceAwarded
        });
      }
    }

    // Remove from active games
    this.activeGames.delete(lobbyCode);

    // Update lobby status - use the repository directly
    const lobbyRepo = new (await import('../repositories/LobbyRepository.js')).LobbyRepository();
    const lobby = await this.lobbyService.getLobbyByCode(lobbyCode);
    if (lobby) {
      await lobbyRepo.updateLobbyStatus(lobby.id, 'ended');
    }

    RequestLogger.logGameEvent('game-ended', lobbyCode, undefined, {
      gameSessionId: gameState.gameSessionId,
      questionSetIds: gameState.selectedQuestionSetIds,
      finalResults: finalResults.map(r => ({ 
        playerId: r.id, 
        score: r.finalScore,
        experienceAwarded: r.experienceAwarded,
        levelUp: r.levelUp
      }))
    });
  }

  /**
   * Get current game state
   */
  getGameState(lobbyCode: string): GameState | undefined {
    return this.activeGames.get(lobbyCode);
  }

  /**
   * Check if a game is active for a lobby
   */
  isGameActive(lobbyCode: string): boolean {
    const gameState = this.activeGames.get(lobbyCode);
    return gameState?.isActive || false;
  }

  /**
   * Get all active games
   */
  getActiveGames(): Map<string, GameState> {
    return new Map(this.activeGames);
  }

  /**
   * Get localized question for a specific player
   */
  getLocalizedQuestion(question: QuestionData, language: 'en' | 'de'): QuestionData {
    // For now, return the question as-is since we're using English by default
    // In a full implementation, this would fetch the localized version from the database
    return question;
  }

  /**
   * Handle question set validation before game start
   */
  async validateQuestionSetsForGame(lobbyCode: string): Promise<{
    isValid: boolean;
    totalQuestions: number;
    questionSets: Array<{ id: number; name: string; questionCount: number }>;
    errors: string[];
  }> {
    const lobby = await this.lobbyService.getLobbyByCode(lobbyCode);
    if (!lobby) {
      return {
        isValid: false,
        totalQuestions: 0,
        questionSets: [],
        errors: ['Lobby not found']
      };
    }

    const settings = lobby.settings as any;
    const questionSetIds = settings?.questionSetIds || [];

    return await this.lobbyService.validateQuestionSetSelection(questionSetIds);
  }

  /**
   * Get fallback questions if selected sets are invalid
   */
  async getFallbackQuestions(count: number = 10): Promise<QuestionData[]> {
    try {
      // Get questions from default question set (ID 1) or any available set
      const questions = await this.questionService.getRandomQuestions({
        questionSetIds: [1], // Default fallback set
        count
      });

      if (!questions || questions.length === 0) {
        // If no questions available, create some basic fallback questions
        return this.createFallbackQuestions(count);
      }

      return questions.map(q => ({
        id: q.id,
        question: q.question_text.en,
        answers: q.answers.map(a => a.text.en),
        correctAnswer: q.answers.find(a => a.correct)?.text.en || '',
        questionSetId: q.question_set_id,
        language: 'en',
        explanation: q.explanation?.en || undefined
      }));
    } catch (error) {
      console.error('Error getting fallback questions:', error);
      return this.createFallbackQuestions(count);
    }
  }

  /**
   * Create basic fallback questions if database is unavailable
   */
  private createFallbackQuestions(count: number): QuestionData[] {
    const fallbackQuestions: QuestionData[] = [];
    
    for (let i = 1; i <= count; i++) {
      fallbackQuestions.push({
        id: -i, // Negative ID to indicate fallback question
        question: `Fallback Question ${i}`,
        answers: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
        correctAnswer: 'Answer A',
        questionSetId: 1,
        language: 'en',
        explanation: 'This is a fallback question'
      });
    }

    return fallbackQuestions;
  }

  /**
   * Clean up games for disconnected players
   */
  async handlePlayerDisconnect(lobbyCode: string, playerId: string): Promise<void> {
    const gameState = this.activeGames.get(lobbyCode);
    if (!gameState) {
      return;
    }

    // Mark player as disconnected
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
      // Update player connection status in lobby
      await this.lobbyService.updatePlayerConnection(lobbyCode, playerId, false);
    }

    // Check if all players are disconnected
    const allDisconnected = gameState.players.every(p => !p.isConnected);
    if (allDisconnected) {
      // End game if all players disconnected
      await this.endGameSession(lobbyCode);
    }
  }
} 