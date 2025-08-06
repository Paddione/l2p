import { GameSessionRepository, GameSession, PlayerResult, CreateGameSessionData, CreatePlayerResultData } from '../GameSessionRepository.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { QueryResult } from 'pg';

// Mock DatabaseService
jest.mock('../../services/DatabaseService.js');

const mockDatabaseService = DatabaseService.getInstance() as jest.Mocked<DatabaseService>;

describe('GameSessionRepository', () => {
  let repository: GameSessionRepository;

  beforeEach(() => {
    repository = new GameSessionRepository();
    jest.clearAllMocks();
  });

  describe('findGameSessionById', () => {
    it('should find game session by id successfully', async () => {
      const mockGameSession: GameSession = {
        id: 1,
        lobby_id: 123,
        question_set_id: 456,
        started_at: new Date(),
        ended_at: new Date(),
        total_questions: 10,
        session_data: { difficulty: 'medium', timeLimit: 60 }
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockGameSession],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.findGameSessionById(1);

      expect(result).toEqual(mockGameSession);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM game_sessions WHERE id = $1',
        [1]
      );
    });

    it('should return null when game session not found', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.findGameSessionById(999);

      expect(result).toBeNull();
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM game_sessions WHERE id = $1',
        [999]
      );
    });
  });

  describe('findGameSessionsByLobby', () => {
    it('should find game sessions by lobby id successfully', async () => {
      const mockGameSessions: GameSession[] = [
        {
          id: 1,
          lobby_id: 123,
          question_set_id: 456,
          started_at: new Date(),
          ended_at: new Date(),
          total_questions: 10,
          session_data: { difficulty: 'medium', timeLimit: 60 }
        },
        {
          id: 2,
          lobby_id: 123,
          question_set_id: 456,
          started_at: new Date(),
          ended_at: new Date(),
          total_questions: 15,
          session_data: { difficulty: 'hard', timeLimit: 90 }
        }
      ];

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: mockGameSessions,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.findGameSessionsByLobby(123);

      expect(result).toEqual(mockGameSessions);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM game_sessions WHERE lobby_id = $1 ORDER BY started_at DESC',
        [123]
      );
    });

    it('should return empty array when no game sessions found', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.findGameSessionsByLobby(999);

      expect(result).toEqual([]);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM game_sessions WHERE lobby_id = $1 ORDER BY started_at DESC',
        [999]
      );
    });
  });

  describe('findActiveGameSessions', () => {
    it('should find active game sessions successfully', async () => {
      const mockGameSessions: GameSession[] = [
        {
          id: 1,
          lobby_id: 123,
          question_set_id: 456,
          started_at: new Date(),
          total_questions: 10,
          session_data: { difficulty: 'medium', timeLimit: 60 }
        },
        {
          id: 2,
          lobby_id: 124,
          question_set_id: 457,
          started_at: new Date(),
          total_questions: 15,
          session_data: { difficulty: 'hard', timeLimit: 90 }
        }
      ];

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: mockGameSessions,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.findActiveGameSessions();

      expect(result).toEqual(mockGameSessions);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM game_sessions WHERE ended_at IS NULL ORDER BY started_at DESC'
      );
    });
  });

  describe('createGameSession', () => {
    it('should create game session successfully', async () => {
      const createData: CreateGameSessionData = {
        lobby_id: 123,
        question_set_id: 456,
        total_questions: 10,
        session_data: { difficulty: 'medium', timeLimit: 60 }
      };

      const createdGameSession: GameSession = {
        id: 1,
        ...createData,
        session_data: createData.session_data || {},
        started_at: new Date()
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [createdGameSession],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.createGameSession(createData);

      expect(result).toEqual(createdGameSession);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO game_sessions'),
        expect.arrayContaining([
          123,
          456,
          10,
          '{"difficulty":"medium","timeLimit":60}'
        ])
      );
    });

    it('should create game session with default session_data when not provided', async () => {
      const createData: CreateGameSessionData = {
        lobby_id: 123,
        question_set_id: 456,
        total_questions: 10
      };

      const createdGameSession: GameSession = {
        id: 1,
        ...createData,
        session_data: {},
        started_at: new Date()
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [createdGameSession],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.createGameSession(createData);

      expect(result).toEqual(createdGameSession);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO game_sessions'),
        expect.arrayContaining([
          123,
          456,
          10,
          '{}'
        ])
      );
    });
  });

  describe('updateGameSession', () => {
    it('should update game session successfully', async () => {
      const updateData = {
        total_questions: 15,
        session_data: { difficulty: 'hard', timeLimit: 90 }
      };

      const updatedGameSession: GameSession = {
        id: 1,
        lobby_id: 123,
        question_set_id: 456,
        started_at: new Date(),
        ended_at: new Date(),
        total_questions: 15,
        session_data: { difficulty: 'hard', timeLimit: 90 }
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [updatedGameSession],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.updateGameSession(1, updateData);

      expect(result).toEqual(updatedGameSession);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE game_sessions'),
        expect.arrayContaining([15, '{"difficulty":"hard","timeLimit":90}', 1])
      );
    });

    it('should return null when game session not found for update', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.updateGameSession(999, { total_questions: 15 });

      expect(result).toBeNull();
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE game_sessions'),
        expect.arrayContaining([15, 999])
      );
    });
  });

  describe('endGameSession', () => {
    it('should end game session with current timestamp', async () => {
      const endedSession: GameSession = {
        id: 1,
        lobby_id: 123,
        question_set_id: 456,
        started_at: new Date(),
        ended_at: new Date(),
        total_questions: 10,
        session_data: { difficulty: 'medium', timeLimit: 60 }
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [endedSession],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.endGameSession(1);

      expect(result).toEqual(endedSession);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE game_sessions'),
        expect.arrayContaining([expect.any(Date), 1])
      );
    });

    it('should end game session with additional session data', async () => {
      const sessionData = { finalScore: 1000, winner: 'player1' };
      const endedSession: GameSession = {
        id: 1,
        lobby_id: 123,
        question_set_id: 456,
        started_at: new Date(),
        ended_at: new Date(),
        total_questions: 10,
        session_data: { difficulty: 'medium', timeLimit: 60, ...sessionData }
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [endedSession],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.endGameSession(1, sessionData);

      expect(result).toEqual(endedSession);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE game_sessions'),
        expect.arrayContaining([expect.any(Date), '{"finalScore":1000,"winner":"player1"}', 1])
      );
    });
  });

  describe('findPlayerResultById', () => {
    it('should find player result by id successfully', async () => {
      const mockPlayerResult: PlayerResult = {
        id: 1,
        session_id: 1,
        user_id: 123,
        username: 'testuser',
        character_name: 'Warrior',
        final_score: 1500,
        correct_answers: 8,
        total_questions: 10,
        max_multiplier: 5,
        completion_time: 180,
        answer_details: [
          {
            questionId: 1,
            selectedAnswer: 'A',
            isCorrect: true,
            timeElapsed: 45,
            pointsEarned: 15,
            multiplierUsed: 1
          }
        ]
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockPlayerResult],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.findPlayerResultById(1);

      expect(result).toEqual(mockPlayerResult);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM player_results WHERE id = $1',
        [1]
      );
    });

    it('should return null when player result not found', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.findPlayerResultById(999);

      expect(result).toBeNull();
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM player_results WHERE id = $1',
        [999]
      );
    });
  });

  describe('createPlayerResult', () => {
    it('should create player result successfully', async () => {
      const createData: CreatePlayerResultData = {
        session_id: 1,
        user_id: 123,
        username: 'testuser',
        character_name: 'Warrior',
        final_score: 1500,
        correct_answers: 8,
        total_questions: 10,
        max_multiplier: 5,
        completion_time: 180,
        answer_details: [
          {
            questionId: 1,
            selectedAnswer: 'A',
            isCorrect: true,
            timeElapsed: 45,
            pointsEarned: 15,
            multiplierUsed: 1
          }
        ]
      };

      const createdPlayerResult: PlayerResult = {
        id: 1,
        ...createData
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [createdPlayerResult],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.createPlayerResult(createData);

      expect(result).toEqual(createdPlayerResult);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO player_results'),
        expect.arrayContaining([
          1,
          123,
          'testuser',
          'Warrior',
          1500,
          8,
          10,
          5,
          180,
          '[{"questionId":1,"selectedAnswer":"A","isCorrect":true,"timeElapsed":45,"pointsEarned":15,"multiplierUsed":1}]'
        ])
      );
    });
  });

  describe('updatePlayerResult', () => {
    it('should update player result successfully', async () => {
      const updateData = {
        final_score: 1800,
        correct_answers: 9
      };

      const updatedPlayerResult: PlayerResult = {
        id: 1,
        session_id: 1,
        user_id: 123,
        username: 'testuser',
        character_name: 'Warrior',
        final_score: 1800,
        correct_answers: 9,
        total_questions: 10,
        max_multiplier: 5,
        completion_time: 180,
        answer_details: []
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [updatedPlayerResult],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.updatePlayerResult(1, updateData);

      expect(result).toEqual(updatedPlayerResult);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE player_results'),
        expect.arrayContaining([1800, 9, 1])
      );
    });

    it('should return null when player result not found for update', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.updatePlayerResult(999, { final_score: 1800 });

      expect(result).toBeNull();
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE player_results'),
        expect.arrayContaining([1800, 999])
      );
    });
  });

  describe('deletePlayerResult', () => {
    it('should delete player result successfully', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'DELETE',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.deletePlayerResult(1);

      expect(result).toBe(true);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'DELETE FROM player_results WHERE id = $1',
        [1]
      );
    });

    it('should return false when player result not found for deletion', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'DELETE',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.deletePlayerResult(999);

      expect(result).toBe(false);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'DELETE FROM player_results WHERE id = $1',
        [999]
      );
    });
  });

  describe('deleteGameSession', () => {
    it('should delete game session successfully', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'DELETE',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.deleteGameSession(1);

      expect(result).toBe(true);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'DELETE FROM game_sessions WHERE id = $1',
        [1]
      );
    });

    it('should return false when game session not found for deletion', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'DELETE',
        oid: 0,
        fields: []
      } as QueryResult);

      const result = await repository.deleteGameSession(999);

      expect(result).toBe(false);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        'DELETE FROM game_sessions WHERE id = $1',
        [999]
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors in findGameSessionById', async () => {
      mockDatabaseService.query.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(repository.findGameSessionById(1)).rejects.toThrow('Connection failed');
    });

    it('should handle database errors in createGameSession', async () => {
      mockDatabaseService.query.mockRejectedValueOnce(new Error('Query execution failed'));

      await expect(repository.createGameSession({
        lobby_id: 123,
        question_set_id: 456,
        total_questions: 10,
        session_data: { difficulty: 'medium', timeLimit: 60 }
      })).rejects.toThrow('Query execution failed');
    });

    it('should handle database errors in createPlayerResult', async () => {
      mockDatabaseService.query.mockRejectedValueOnce(new Error('Invalid data'));

      await expect(repository.createPlayerResult({
        session_id: 1,
        user_id: 123,
        username: 'testuser',
        character_name: 'Warrior',
        final_score: 1500,
        correct_answers: 8,
        total_questions: 10,
        max_multiplier: 5,
        completion_time: 180,
        answer_details: []
      })).rejects.toThrow('Invalid data');
    });
  });
}); 