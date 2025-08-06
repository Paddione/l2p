import { Server, Socket } from 'socket.io';
import { LobbyService } from './LobbyService.js';
import { GameService } from './GameService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { RequestLogger } from '../middleware/logging.js';

export interface SocketUser {
  id: string;
  username: string;
  character: string;
  isHost: boolean;
  lobbyCode?: string;
}

export interface SocketLobbyEvent {
  type: 'join' | 'leave' | 'ready' | 'unready' | 'start' | 'update';
  lobbyCode: string;
  player: SocketUser;
  data?: any;
}

export class SocketService {
  private io: Server;
  private lobbyService: LobbyService;
  private gameService: GameService;
  private userRepository: UserRepository;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.lobbyService = new LobbyService();
    this.gameService = new GameService(io);
    this.userRepository = new UserRepository();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
      
      // Lobby management events
      socket.on('join-lobby', (data: { lobbyCode: string; player: SocketUser }) => {
        this.handleJoinLobby(socket, data);
      });
      
      socket.on('leave-lobby', (data: { lobbyCode: string; playerId: string }) => {
        this.handleLeaveLobby(socket, data);
      });
      
      socket.on('player-ready', (data: { lobbyCode: string; playerId: string; isReady: boolean }) => {
        this.handlePlayerReady(socket, data);
      });
      
      socket.on('start-game', (data: { lobbyCode: string; hostId: string }) => {
        this.handleStartGame(socket, data);
      });
      
      // Question set management events
      socket.on('update-question-sets', (data: { lobbyCode: string; hostId: string; questionSetIds: number[]; questionCount: number }) => {
        this.handleUpdateQuestionSets(socket, data);
      });
      
      socket.on('get-question-set-info', (data: { lobbyCode: string }) => {
        this.handleGetQuestionSetInfo(socket, data);
      });
      
      // Game events
      socket.on('submit-answer', (data: { lobbyCode: string; playerId: string; answer: string; timeElapsed: number }) => {
        this.handleSubmitAnswer(socket, data);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
      
      // Connection testing
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }

  private handleConnection(socket: Socket): void {
    console.log('User connected:', socket.id);
    RequestLogger.logSocketConnection(socket.id, 'connect');
    
    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      timestamp: Date.now()
    });
  }

  private async handleJoinLobby(socket: Socket, data: { lobbyCode: string; player: SocketUser }): Promise<void> {
    try {
      const { lobbyCode, player } = data;
      
      RequestLogger.logSocketEvent(socket.id, 'join-lobby', { lobbyCode, playerId: player.id });
      
      // Validate lobby code format
      if (!LobbyService.isValidLobbyCode(lobbyCode)) {
        socket.emit('join-error', {
          type: 'INVALID_CODE',
          message: 'Invalid lobby code format'
        });
        return;
      }
      
      // Join the lobby
      const lobby = await this.lobbyService.joinLobby({
        lobbyCode,
        player: {
          id: player.id,
          username: player.username,
          character: player.character,
          isReady: false,
          isConnected: true
        }
      });
      
      if (!lobby) {
        socket.emit('join-error', {
          type: 'LOBBY_NOT_FOUND',
          message: 'Lobby not found or is full'
        });
        return;
      }
      
      // Join socket room
      socket.join(lobbyCode);
      
      // Store user information
      this.connectedUsers.set(socket.id, {
        ...player,
        lobbyCode
      });
      
      // Broadcast to all players in the lobby
      this.io.to(lobbyCode).emit('lobby-updated', {
        lobby,
        event: 'player-joined',
        player: {
          id: player.id,
          username: player.username,
          character: player.character,
          isReady: false,
          isHost: false,
          score: 0,
          multiplier: 1,
          correctAnswers: 0,
          isConnected: true
        }
      });
      
      // Send confirmation to joining player
      socket.emit('join-success', {
        lobby,
        message: 'Successfully joined lobby'
      });
      
    } catch (error) {
      console.error('Error joining lobby:', error);
      socket.emit('join-error', {
        type: 'SERVER_ERROR',
        message: 'Failed to join lobby'
      });
    }
  }

  private async handleLeaveLobby(socket: Socket, data: { lobbyCode: string; playerId: string }): Promise<void> {
    try {
      const { lobbyCode, playerId } = data;
      
      RequestLogger.logSocketEvent(socket.id, 'leave-lobby', { lobbyCode, playerId });
      
      // Leave the lobby
      const updatedLobby = await this.lobbyService.leaveLobby(lobbyCode, playerId);
      
      // Leave socket room
      socket.leave(lobbyCode);
      
      // Remove from connected users
      this.connectedUsers.delete(socket.id);
      
      if (updatedLobby) {
        // Broadcast to remaining players
        this.io.to(lobbyCode).emit('lobby-updated', {
          lobby: updatedLobby,
          event: 'player-left',
          playerId
        });
      }
      
      // Send confirmation to leaving player
      socket.emit('leave-success', {
        message: 'Successfully left lobby'
      });
      
    } catch (error) {
      console.error('Error leaving lobby:', error);
      socket.emit('leave-error', {
        type: 'SERVER_ERROR',
        message: 'Failed to leave lobby'
      });
    }
  }

  private async handlePlayerReady(socket: Socket, data: { lobbyCode: string; playerId: string; isReady: boolean }): Promise<void> {
    try {
      const { lobbyCode, playerId, isReady } = data;
      
      RequestLogger.logSocketEvent(socket.id, 'player-ready', { lobbyCode, playerId, isReady });
      
      // Update player ready state
      const updatedLobby = await this.lobbyService.updatePlayerReady(lobbyCode, playerId, isReady);
      
      if (updatedLobby) {
        // Broadcast to all players in the lobby
        this.io.to(lobbyCode).emit('lobby-updated', {
          lobby: updatedLobby,
          event: 'player-ready-changed',
          playerId,
          isReady
        });
      }
      
    } catch (error) {
      console.error('Error updating player ready state:', error);
      socket.emit('ready-error', {
        type: 'SERVER_ERROR',
        message: 'Failed to update ready state'
      });
    }
  }

  private async handleStartGame(socket: Socket, data: { lobbyCode: string; hostId: string }): Promise<void> {
    try {
      const { lobbyCode, hostId } = data;
      
      RequestLogger.logSocketEvent(socket.id, 'start-game', { lobbyCode, hostId });
      
      // Start the game session using GameService
      const gameState = await this.gameService.startGameSession(lobbyCode, parseInt(hostId));
      
      // Broadcast game start to all players
      this.io.to(lobbyCode).emit('game-started', {
        gameState,
        message: 'Game is starting...'
      });
      
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('start-game-error', {
        type: 'SERVER_ERROR',
        message: 'Failed to start game'
      });
    }
  }

  private async handleSubmitAnswer(socket: Socket, data: { lobbyCode: string; playerId: string; answer: string; timeElapsed: number }): Promise<void> {
    try {
      const { lobbyCode, playerId, answer, timeElapsed } = data;
      
      RequestLogger.logSocketEvent(socket.id, 'submit-answer', { lobbyCode, playerId, answer, timeElapsed });
      
      // Submit answer using GameService
      await this.gameService.submitAnswer(lobbyCode, playerId, answer);
      
      // The GameService will handle broadcasting the answer events
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      socket.emit('answer-error', {
        type: 'SERVER_ERROR',
        message: 'Failed to submit answer'
      });
    }
  }

  private async handleUpdateQuestionSets(socket: Socket, data: { lobbyCode: string; hostId: string; questionSetIds: number[]; questionCount: number }): Promise<void> {
    try {
      const { lobbyCode, hostId, questionSetIds, questionCount } = data;
      
      RequestLogger.logSocketEvent(socket.id, 'update-question-sets', { lobbyCode, hostId, questionSetIds, questionCount });
      
      // Update question set settings
      const updatedLobby = await this.lobbyService.updateLobbyQuestionSets(
        lobbyCode,
        parseInt(hostId),
        questionSetIds,
        questionCount
      );
      
      // Broadcast update to all players in lobby
      this.broadcastToLobby(lobbyCode, 'question-sets-updated', {
        lobby: updatedLobby,
        updatedBy: hostId
      });
      
      // Send confirmation to host
      socket.emit('question-sets-update-success', {
        message: 'Question set settings updated successfully',
        lobby: updatedLobby
      });
      
    } catch (error) {
      console.error('Update question sets error:', error);
      socket.emit('question-sets-update-error', {
        type: 'UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update question set settings'
      });
    }
  }

  private async handleGetQuestionSetInfo(socket: Socket, data: { lobbyCode: string }): Promise<void> {
    try {
      const { lobbyCode } = data;
      
      RequestLogger.logSocketEvent(socket.id, 'get-question-set-info', { lobbyCode });
      
      // Get question set information
      const questionSetInfo = await this.lobbyService.getLobbyQuestionSetInfo(lobbyCode);
      
      if (!questionSetInfo) {
        socket.emit('question-set-info-error', {
          type: 'LOBBY_NOT_FOUND',
          message: 'Lobby not found'
        });
        return;
      }
      
      // Send question set info to requesting user
      socket.emit('question-set-info', {
        questionSetInfo
      });
      
    } catch (error) {
      console.error('Get question set info error:', error);
      socket.emit('question-set-info-error', {
        type: 'FETCH_FAILED',
        message: 'Failed to retrieve question set information'
      });
    }
  }

  private handleDisconnect(socket: Socket): void {
    console.log('User disconnected:', socket.id);
    RequestLogger.logSocketConnection(socket.id, 'disconnect');
    
    // Get user info
    const user = this.connectedUsers.get(socket.id);
    
    if (user && user.lobbyCode) {
      // Update player connection status in lobby
      this.lobbyService.updatePlayerConnection(user.lobbyCode, user.id, false)
        .then(updatedLobby => {
          if (updatedLobby) {
            // Broadcast to remaining players
            this.io.to(user.lobbyCode!).emit('lobby-updated', {
              lobby: updatedLobby,
              event: 'player-disconnected',
              playerId: user.id
            });
          }
        })
        .catch(error => {
          console.error('Error updating player connection status:', error);
        });
      
      // Handle game disconnection if game is active
      if (this.gameService.isGameActive(user.lobbyCode)) {
        this.gameService.handlePlayerDisconnect(user.lobbyCode, user.id)
          .catch(error => {
            console.error('Error handling game disconnection:', error);
          });
      }
    }
    
    // Remove from connected users
    this.connectedUsers.delete(socket.id);
  }

  // Public methods for external use
  public getConnectedUsers(): Map<string, SocketUser> {
    return new Map(this.connectedUsers);
  }

  public getUserBySocketId(socketId: string): SocketUser | undefined {
    return this.connectedUsers.get(socketId);
  }

  public broadcastToLobby(lobbyCode: string, event: string, data: any): void {
    this.io.to(lobbyCode).emit(event, data);
  }

  public emitToUser(socketId: string, event: string, data: any): void {
    this.io.to(socketId).emit(event, data);
  }
} 