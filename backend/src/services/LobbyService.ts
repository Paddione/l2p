import { LobbyRepository, Lobby, CreateLobbyData, UpdateLobbyData } from '../repositories/LobbyRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { QuestionService } from './QuestionService.js';

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
  joinedAt: Date;
}

export interface CreateLobbyRequest {
  hostId: number;
  questionCount?: number;
  questionSetIds?: number[];
  settings?: Record<string, any>;
}

export interface LobbySettings {
  questionSetIds: number[];
  questionCount: number;
  timeLimit: number;
  allowReplay: boolean;
  maxQuestionCount?: number; // Maximum available questions in selected sets
}

export interface JoinLobbyRequest {
  lobbyCode: string;
  player: Omit<Player, 'isHost' | 'score' | 'multiplier' | 'correctAnswers' | 'joinedAt'>;
}

export interface LobbyWithPlayers extends Omit<Lobby, 'players'> {
  players: Player[];
}

export class LobbyService {
  private lobbyRepository: LobbyRepository;
  private userRepository: UserRepository;
  private questionService: QuestionService;

  constructor() {
    this.lobbyRepository = new LobbyRepository();
    this.userRepository = new UserRepository();
    this.questionService = new QuestionService();
  }

  /**
   * Generate a unique 6-character lobby code
   */
  private async generateUniqueCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Check if code already exists
      const exists = await this.lobbyRepository.codeExists(code);
      if (!exists) {
        return code;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique lobby code after maximum attempts');
  }

  /**
   * Create a new lobby
   */
  async createLobby(request: CreateLobbyRequest): Promise<LobbyWithPlayers> {
    // Validate host exists
    const host = await this.userRepository.findUserById(request.hostId);
    if (!host) {
      throw new Error('Host user not found');
    }

    // Generate unique code
    const code = await this.generateUniqueCode();

    // Prepare lobby data
    const lobbyData: CreateLobbyData = {
      code,
      host_id: request.hostId,
      question_count: request.questionCount || 10,
      settings: {
        questionSetIds: request.questionSetIds || [],
        timeLimit: 60,
        allowReplay: true,
        ...request.settings
      }
    };

    // Create lobby
    const lobby = await this.lobbyRepository.createLobby(lobbyData);

    // Add host as first player
    const hostPlayer: Player = {
      id: `user_${request.hostId}`,
      username: host.username,
      character: host.selected_character || 'student', // Use user's selected character
      characterLevel: host.character_level,
      isReady: false,
      isHost: true,
      score: 0,
      multiplier: 1,
      correctAnswers: 0,
      isConnected: true,
      joinedAt: new Date()
    };

    // Update lobby with host player
    const updatedLobby = await this.lobbyRepository.updateLobby(lobby.id, {
      players: [hostPlayer]
    });

    if (!updatedLobby) {
      throw new Error('Failed to add host to lobby');
    }

    return this.formatLobbyResponse(updatedLobby);
  }

  /**
   * Join an existing lobby
   */
  async joinLobby(request: JoinLobbyRequest): Promise<LobbyWithPlayers> {
    // Find lobby by code
    const lobby = await this.lobbyRepository.findByCode(request.lobbyCode);
    if (!lobby) {
      throw new Error('Lobby not found');
    }

    // Check lobby status
    if (lobby.status !== 'waiting') {
      throw new Error('Lobby is not accepting new players');
    }

    // Check if lobby is full (max 8 players)
    const currentPlayers = Array.isArray(lobby.players) ? lobby.players : [];
    if (currentPlayers.length >= 8) {
      throw new Error('Lobby is full');
    }

    // Check if player is already in lobby
    const existingPlayer = currentPlayers.find((p: any) => p.id === request.player.id);
    if (existingPlayer) {
      // Update existing player as reconnected
      const updatedPlayer = {
        ...existingPlayer,
        isConnected: true,
        character: request.player.character, // Allow character change on rejoin
        characterLevel: request.player.characterLevel // Update character level
      };

      const updatedPlayers = currentPlayers.map((p: any) => 
        p.id === request.player.id ? updatedPlayer : p
      );

      const updatedLobby = await this.lobbyRepository.updateLobby(lobby.id, {
        players: updatedPlayers
      });

      if (!updatedLobby) {
        throw new Error('Failed to update player in lobby');
      }

      return this.formatLobbyResponse(updatedLobby);
    }

    // Add new player
    const newPlayer: Player = {
      ...request.player,
      isHost: false,
      score: 0,
      multiplier: 1,
      correctAnswers: 0,
      joinedAt: new Date()
    };

    const updatedPlayers = [...currentPlayers, newPlayer];
    const updatedLobby = await this.lobbyRepository.updateLobby(lobby.id, {
      players: updatedPlayers
    });

    if (!updatedLobby) {
      throw new Error('Failed to add player to lobby');
    }

    return this.formatLobbyResponse(updatedLobby);
  }

  /**
   * Leave a lobby
   */
  async leaveLobby(lobbyCode: string, playerId: string): Promise<LobbyWithPlayers | null> {
    const lobby = await this.lobbyRepository.findByCode(lobbyCode);
    if (!lobby) {
      throw new Error('Lobby not found');
    }

    const currentPlayers = Array.isArray(lobby.players) ? lobby.players : [];
    const playerToRemove = currentPlayers.find((p: any) => p.id === playerId);
    
    if (!playerToRemove) {
      throw new Error('Player not found in lobby');
    }

    // If host is leaving, transfer host to another player or delete lobby
    if (playerToRemove.isHost) {
      const remainingPlayers = currentPlayers.filter((p: any) => p.id !== playerId);
      
      if (remainingPlayers.length === 0) {
        // Delete empty lobby
        await this.lobbyRepository.deleteLobby(lobby.id);
        return null;
      } else {
        // Transfer host to first remaining player
        const newHost = { ...remainingPlayers[0], isHost: true };
        const updatedPlayers = [newHost, ...remainingPlayers.slice(1)];
        
        const updatedLobby = await this.lobbyRepository.updateLobby(lobby.id, {
          host_id: parseInt(newHost.id.replace('user_', '')), // Extract user ID
          players: updatedPlayers
        });

        return updatedLobby ? this.formatLobbyResponse(updatedLobby) : null;
      }
    } else {
      // Remove non-host player
      const updatedPlayers = currentPlayers.filter((p: any) => p.id !== playerId);
      const updatedLobby = await this.lobbyRepository.updateLobby(lobby.id, {
        players: updatedPlayers
      });

      return updatedLobby ? this.formatLobbyResponse(updatedLobby) : null;
    }
  }

  /**
   * Update player ready status
   */
  async updatePlayerReady(lobbyCode: string, playerId: string, isReady: boolean): Promise<LobbyWithPlayers> {
    const lobby = await this.lobbyRepository.findByCode(lobbyCode);
    if (!lobby) {
      throw new Error('Lobby not found');
    }

    const currentPlayers = Array.isArray(lobby.players) ? lobby.players : [];
    const updatedPlayers = currentPlayers.map((p: any) => 
      p.id === playerId ? { ...p, isReady } : p
    );

    const updatedLobby = await this.lobbyRepository.updateLobby(lobby.id, {
      players: updatedPlayers
    });

    if (!updatedLobby) {
      throw new Error('Failed to update player ready status');
    }

    return this.formatLobbyResponse(updatedLobby);
  }

  /**
   * Update player connection status
   */
  async updatePlayerConnection(lobbyCode: string, playerId: string, isConnected: boolean): Promise<LobbyWithPlayers> {
    const lobby = await this.lobbyRepository.findByCode(lobbyCode);
    if (!lobby) {
      throw new Error('Lobby not found');
    }

    const currentPlayers = Array.isArray(lobby.players) ? lobby.players : [];
    const updatedPlayers = currentPlayers.map((p: any) => 
      p.id === playerId ? { ...p, isConnected } : p
    );

    const updatedLobby = await this.lobbyRepository.updateLobby(lobby.id, {
      players: updatedPlayers
    });

    if (!updatedLobby) {
      throw new Error('Failed to update player connection status');
    }

    return this.formatLobbyResponse(updatedLobby);
  }

  /**
   * Get lobby by code
   */
  async getLobbyByCode(code: string): Promise<LobbyWithPlayers | null> {
    const lobby = await this.lobbyRepository.findByCode(code);
    return lobby ? this.formatLobbyResponse(lobby) : null;
  }

  /**
   * Get lobby by ID
   */
  async getLobbyById(id: number): Promise<LobbyWithPlayers | null> {
    const lobby = await this.lobbyRepository.findLobbyById(id);
    return lobby ? this.formatLobbyResponse(lobby) : null;
  }

  /**
   * Get active lobbies (waiting or starting)
   */
  async getActiveLobbies(limit?: number): Promise<LobbyWithPlayers[]> {
    const lobbies = await this.lobbyRepository.findActiveLobbies(limit);
    return lobbies.map(lobby => this.formatLobbyResponse(lobby));
  }

  /**
   * Get lobbies by host
   */
  async getLobbiesByHost(hostId: number): Promise<LobbyWithPlayers[]> {
    const lobbies = await this.lobbyRepository.findLobbiesByHost(hostId);
    return lobbies.map(lobby => this.formatLobbyResponse(lobby));
  }

  /**
   * Update lobby settings
   */
  async updateLobbySettings(lobbyCode: string, hostId: number, settings: Record<string, any>): Promise<LobbyWithPlayers> {
    const lobby = await this.lobbyRepository.findByCode(lobbyCode);
    if (!lobby) {
      throw new Error('Lobby not found');
    }

    // Verify host permission
    if (lobby.host_id !== hostId) {
      throw new Error('Only the host can update lobby settings');
    }

    // Verify lobby is in waiting state
    if (lobby.status !== 'waiting') {
      throw new Error('Cannot update settings after game has started');
    }

    const updatedSettings = {
      ...lobby.settings,
      ...settings
    };

    const updatedLobby = await this.lobbyRepository.updateLobby(lobby.id, {
      settings: updatedSettings,
      question_count: settings.questionCount || lobby.question_count
    });

    if (!updatedLobby) {
      throw new Error('Failed to update lobby settings');
    }

    return this.formatLobbyResponse(updatedLobby);
  }

  /**
   * Start a game (update lobby status to starting)
   */
  async startGame(lobbyCode: string, hostId: number): Promise<LobbyWithPlayers> {
    const lobby = await this.lobbyRepository.findByCode(lobbyCode);
    if (!lobby) {
      throw new Error('Lobby not found');
    }

    // Verify host permission
    if (lobby.host_id !== hostId) {
      throw new Error('Only the host can start the game');
    }

    // Verify lobby is in waiting state
    if (lobby.status !== 'waiting') {
      throw new Error('Game has already been started or ended');
    }

    // Check if all players are ready
    const currentPlayers = Array.isArray(lobby.players) ? lobby.players : [];
    const allReady = currentPlayers.every((p: any) => p.isReady);
    
    if (!allReady) {
      throw new Error('All players must be ready before starting the game');
    }

    // Check minimum players (at least 1 player including host)
    if (currentPlayers.length < 1) {
      throw new Error('At least one player is required to start the game');
    }

    const updatedLobby = await this.lobbyRepository.updateLobbyStatus(lobby.id, 'starting');
    if (!updatedLobby) {
      throw new Error('Failed to start game');
    }

    return this.formatLobbyResponse(updatedLobby);
  }

  /**
   * Clean up old lobbies
   */
  async cleanupOldLobbies(hoursOld: number = 24): Promise<number> {
    return await this.lobbyRepository.cleanupOldLobbies(hoursOld);
  }

  /**
   * Get lobby statistics
   */
  async getLobbyStats(): Promise<{
    totalLobbies: number;
    activeLobbies: number;
    averagePlayersPerLobby: number;
  }> {
    const totalLobbies = await this.lobbyRepository.getLobbyCount();
    const activeLobbies = await this.lobbyRepository.getActiveLobbyCount();
    
    // Calculate average players per active lobby
    const activeLobbiesList = await this.lobbyRepository.findActiveLobbies();
    const totalPlayers = activeLobbiesList.reduce((sum, lobby) => {
      const players = Array.isArray(lobby.players) ? lobby.players : [];
      return sum + players.length;
    }, 0);
    
    const averagePlayersPerLobby = activeLobbies > 0 ? totalPlayers / activeLobbies : 0;

    return {
      totalLobbies,
      activeLobbies,
      averagePlayersPerLobby: Math.round(averagePlayersPerLobby * 100) / 100
    };
  }

  /**
   * Format lobby response with proper player typing
   */
  private formatLobbyResponse(lobby: Lobby): LobbyWithPlayers {
    const players = Array.isArray(lobby.players) ? lobby.players as Player[] : [];
    
    return {
      ...lobby,
      players: players.map(player => ({
        ...player,
        joinedAt: player.joinedAt ? new Date(player.joinedAt) : new Date()
      }))
    };
  }

  /**
   * Validate lobby code format
   */
  static isValidLobbyCode(code: string): boolean {
    return /^[A-Z0-9]{6}$/.test(code);
  }

  /**
   * Validate question set selection and get available question count
   */
  async validateQuestionSetSelection(questionSetIds: number[]): Promise<{
    isValid: boolean;
    totalQuestions: number;
    questionSets: Array<{ id: number; name: string; questionCount: number }>;
    errors: string[];
  }> {
    const errors: string[] = [];
    const questionSets: Array<{ id: number; name: string; questionCount: number }> = [];
    let totalQuestions = 0;

    if (questionSetIds.length === 0) {
      errors.push('At least one question set must be selected');
      return { isValid: false, totalQuestions: 0, questionSets, errors };
    }

    for (const setId of questionSetIds) {
      const questionSet = await this.questionService.getQuestionSetById(setId);
      if (!questionSet) {
        errors.push(`Question set with ID ${setId} not found`);
        continue;
      }

      if (!questionSet.is_active) {
        errors.push(`Question set "${questionSet.name}" is not active`);
        continue;
      }

      const questions = await this.questionService.getQuestionsBySetId(setId);
      const questionCount = questions.length;

      if (questionCount === 0) {
        errors.push(`Question set "${questionSet.name}" has no questions`);
        continue;
      }

      questionSets.push({
        id: setId,
        name: questionSet.name,
        questionCount
      });

      totalQuestions += questionCount;
    }

    return {
      isValid: errors.length === 0,
      totalQuestions,
      questionSets,
      errors
    };
  }

  /**
   * Get available question sets for lobby creation
   */
  async getAvailableQuestionSets(): Promise<Array<{
    id: number;
    name: string;
    category: string;
    difficulty: string;
    questionCount: number;
    isActive: boolean;
  }>> {
    const questionSets = await this.questionService.getAllQuestionSetsWithStats(false);
    
    return questionSets.map(qs => ({
      id: qs.id,
      name: qs.name,
      category: qs.category || 'General',
      difficulty: qs.difficulty || 'medium',
      questionCount: qs.questionCount,
      isActive: qs.is_active
    }));
  }

  /**
   * Update lobby question set settings
   */
  async updateLobbyQuestionSets(
    lobbyCode: string, 
    hostId: number, 
    questionSetIds: number[], 
    questionCount: number
  ): Promise<LobbyWithPlayers> {
    const lobby = await this.lobbyRepository.findByCode(lobbyCode);
    if (!lobby) {
      throw new Error('Lobby not found');
    }

    // Verify host permission
    if (lobby.host_id !== hostId) {
      throw new Error('Only the host can update question set settings');
    }

    // Verify lobby is in waiting state
    if (lobby.status !== 'waiting') {
      throw new Error('Cannot update settings after game has started');
    }

    // Validate question set selection
    const validation = await this.validateQuestionSetSelection(questionSetIds);
    if (!validation.isValid) {
      throw new Error(`Invalid question set selection: ${validation.errors.join(', ')}`);
    }

    // Validate question count
    if (questionCount < 5) {
      throw new Error('Minimum 5 questions required');
    }

    if (questionCount > validation.totalQuestions) {
      throw new Error(`Maximum ${validation.totalQuestions} questions available in selected sets`);
    }

    // Update lobby settings
    const updatedSettings = {
      ...lobby.settings,
      questionSetIds,
      questionCount,
      maxQuestionCount: validation.totalQuestions
    };

    const updatedLobby = await this.lobbyRepository.updateLobby(lobby.id, {
      settings: updatedSettings,
      question_count: questionCount
    });

    if (!updatedLobby) {
      throw new Error('Failed to update lobby question set settings');
    }

    return this.formatLobbyResponse(updatedLobby);
  }

  /**
   * Get lobby question set information
   */
  async getLobbyQuestionSetInfo(lobbyCode: string): Promise<{
    selectedSets: Array<{ id: number; name: string; questionCount: number }>;
    totalQuestions: number;
    selectedQuestionCount: number;
    maxQuestionCount: number;
  } | null> {
    const lobby = await this.lobbyRepository.findByCode(lobbyCode);
    if (!lobby) {
      return null;
    }

    const settings = lobby.settings as LobbySettings;
    const questionSetIds = settings?.questionSetIds || [];
    const selectedQuestionCount = settings?.questionCount || lobby.question_count;
    const maxQuestionCount = settings?.maxQuestionCount || 0;

    if (questionSetIds.length === 0) {
      return {
        selectedSets: [],
        totalQuestions: 0,
        selectedQuestionCount,
        maxQuestionCount
      };
    }

    const validation = await this.validateQuestionSetSelection(questionSetIds);
    
    return {
      selectedSets: validation.questionSets,
      totalQuestions: validation.totalQuestions,
      selectedQuestionCount,
      maxQuestionCount: Math.max(maxQuestionCount, validation.totalQuestions)
    };
  }
}