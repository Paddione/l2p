import request from 'supertest';
import { app } from '../../server';
import { DatabaseService } from '../../services/DatabaseService';
import { LobbyService } from '../../services/LobbyService';
import { AuthService } from '../../services/AuthService';

describe('Lobby Routes Integration Tests', () => {
  let dbService: DatabaseService;
  let lobbyService: LobbyService;
  let authService: AuthService;
  let hostToken: string;
  let playerToken: string;
  let testLobbyCode: string;

  beforeAll(async () => {
    dbService = DatabaseService.getInstance();
    
    lobbyService = new LobbyService();
    authService = new AuthService();
  });

  afterAll(async () => {
    await dbService.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await dbService.query('DELETE FROM lobby_players');
    await dbService.query('DELETE FROM lobbies');
    await dbService.query('DELETE FROM users');

    // Create test users
    const hostData = {
      username: 'hostuser',
      email: 'host@example.com',
      password: 'TestPass123!'
    };

    const playerData = {
      username: 'playeruser',
      email: 'player@example.com',
      password: 'TestPass123!'
    };

    // Register and verify host
    await request(app)
      .post('/api/auth/register')
      .send(hostData);

    const hostVerificationToken = await dbService.query(
      'SELECT * FROM email_verification_tokens WHERE email = $1',
      [hostData.email]
    );
    await request(app)
      .post('/api/auth/verify-email')
      .send({ token: hostVerificationToken.rows[0].token });

    // Register and verify player
    await request(app)
      .post('/api/auth/register')
      .send(playerData);

    const playerVerificationToken = await dbService.query(
      'SELECT * FROM email_verification_tokens WHERE email = $1',
      [playerData.email]
    );
    await request(app)
      .post('/api/auth/verify-email')
      .send({ token: playerVerificationToken.rows[0].token });

    // Login to get tokens
    const hostLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: hostData.username,
        password: hostData.password
      });

    const playerLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: playerData.username,
        password: playerData.password
      });

    hostToken = hostLoginResponse.body.token;
    playerToken = playerLoginResponse.body.token;
  });

  describe('POST /api/lobbies', () => {
    it('should create a new lobby successfully', async () => {
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2],
        settings: {
          timeLimit: 60,
          allowReplay: true
        }
      };

      const response = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('lobby');
      expect(response.body.lobby).toHaveProperty('code');
      expect(response.body.lobby).toHaveProperty('hostId');
      expect(response.body.lobby.questionCount).toBe(10);
      expect(response.body.lobby.settings.timeLimit).toBe(60);

      testLobbyCode = response.body.lobby.code;

      // Verify lobby was created in database
      const lobby = await dbService.query(
        'SELECT * FROM lobbies WHERE code = $1',
        [testLobbyCode]
      );
      expect(lobby.rows[0]).toBeDefined();
      expect(lobby.rows[0].question_count).toBe(10);
    });

    it('should return 401 for unauthenticated request', async () => {
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const response = await request(app)
        .post('/api/lobbies')
        .send(lobbyData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Authentication required');
    });

    it('should return 400 for invalid lobby data', async () => {
      const invalidData = {
        questionCount: 0, // invalid
        questionSetIds: 'not-an-array' // invalid
      };

      const response = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('should use default values when not provided', async () => {
      const response = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({})
        .expect(201);

      expect(response.body.lobby.questionCount).toBe(10);
      expect(response.body.lobby.settings.timeLimit).toBe(60);
      expect(response.body.lobby.settings.allowReplay).toBe(true);
    });
  });

  describe('POST /api/lobbies/join', () => {
    beforeEach(async () => {
      // Create a test lobby
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const createResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData);

      testLobbyCode = createResponse.body.lobby.code;
    });

    it('should join a lobby successfully', async () => {
      const joinData = {
        lobbyCode: testLobbyCode
      };

      const response = await request(app)
        .post('/api/lobbies/join')
        .set('Authorization', `Bearer ${playerToken}`)
        .send(joinData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('lobby');
      expect(response.body.lobby.code).toBe(testLobbyCode);

      // Verify player was added to lobby
      const player = await dbService.query(
        'SELECT * FROM lobby_players WHERE lobby_code = $1 AND user_id = (SELECT id FROM users WHERE email = $2)',
        [testLobbyCode, 'player@example.com']
      );
      expect(player.rows[0]).toBeDefined();
    });

    it('should return 404 for non-existent lobby', async () => {
      const joinData = {
        lobbyCode: 'INVALID'
      };

      const response = await request(app)
        .post('/api/lobbies/join')
        .set('Authorization', `Bearer ${playerToken}`)
        .send(joinData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Lobby not found');
    });

    it('should return 409 if player already in lobby', async () => {
      const joinData = {
        lobbyCode: testLobbyCode
      };

      // Join first time
      await request(app)
        .post('/api/lobbies/join')
        .set('Authorization', `Bearer ${playerToken}`)
        .send(joinData)
        .expect(200);

      // Try to join again
      const response = await request(app)
        .post('/api/lobbies/join')
        .set('Authorization', `Bearer ${playerToken}`)
        .send(joinData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already in lobby');
    });

    it('should return 400 for invalid lobby code format', async () => {
      const joinData = {
        lobbyCode: 'invalid' // wrong format
      };

      const response = await request(app)
        .post('/api/lobbies/join')
        .set('Authorization', `Bearer ${playerToken}`)
        .send(joinData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/lobbies/:code', () => {
    beforeEach(async () => {
      // Create a test lobby
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const createResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData);

      testLobbyCode = createResponse.body.lobby.code;
    });

    it('should get lobby details successfully', async () => {
      const response = await request(app)
        .get(`/api/lobbies/${testLobbyCode}`)
        .expect(200);

      expect(response.body).toHaveProperty('lobby');
      expect(response.body.lobby).toHaveProperty('code', testLobbyCode);
      expect(response.body.lobby).toHaveProperty('hostId');
      expect(response.body.lobby).toHaveProperty('players');
      expect(response.body.lobby).toHaveProperty('settings');
    });

    it('should return 404 for non-existent lobby', async () => {
      const response = await request(app)
        .get('/api/lobbies/INVALID')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Lobby not found');
    });
  });

  describe('DELETE /api/lobbies/:code/leave', () => {
    beforeEach(async () => {
      // Create a test lobby and join it
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const createResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData);

      testLobbyCode = createResponse.body.lobby.code;

      await request(app)
        .post('/api/lobbies/join')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ lobbyCode: testLobbyCode });
    });

    it('should leave lobby successfully', async () => {
      const response = await request(app)
        .delete(`/api/lobbies/${testLobbyCode}/leave`)
        .set('Authorization', `Bearer ${playerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('left lobby');

      // Verify player was removed from lobby
      const player = await dbService.query(
        'SELECT * FROM lobby_players WHERE lobby_code = $1 AND user_id = (SELECT id FROM users WHERE email = $2)',
        [testLobbyCode, 'player@example.com']
      );
      expect(player.rows.length).toBe(0);
    });

    it('should return 404 if player not in lobby', async () => {
      // Leave lobby first
      await request(app)
        .delete(`/api/lobbies/${testLobbyCode}/leave`)
        .set('Authorization', `Bearer ${playerToken}`);

      // Try to leave again
      const response = await request(app)
        .delete(`/api/lobbies/${testLobbyCode}/leave`)
        .set('Authorization', `Bearer ${playerToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not in lobby');
    });
  });

  describe('PUT /api/lobbies/:code/players/:playerId', () => {
    let playerId: number;

    beforeEach(async () => {
      // Create a test lobby and join it
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const createResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData);

      testLobbyCode = createResponse.body.lobby.code;

      await request(app)
        .post('/api/lobbies/join')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ lobbyCode: testLobbyCode });

      // Get player ID
      const player = await dbService.query(
        'SELECT user_id FROM lobby_players WHERE lobby_code = $1 AND user_id = (SELECT id FROM users WHERE email = $2)',
        [testLobbyCode, 'player@example.com']
      );
      playerId = player.rows[0].user_id;
    });

    it('should update player status successfully', async () => {
      const updateData = {
        isReady: true,
        isConnected: true,
        character: 'warrior'
      };

      const response = await request(app)
        .put(`/api/lobbies/${testLobbyCode}/players/${playerId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('player');

      // Verify player was updated in database
      const player = await dbService.query(
        'SELECT * FROM lobby_players WHERE lobby_code = $1 AND user_id = $2',
        [testLobbyCode, playerId]
      );
      expect(player.rows[0].is_ready).toBe(true);
      expect(player.rows[0].is_connected).toBe(true);
      expect(player.rows[0].character).toBe('warrior');
    });

    it('should return 404 for non-existent player', async () => {
      const updateData = {
        isReady: true
      };

      const response = await request(app)
        .put(`/api/lobbies/${testLobbyCode}/players/99999`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Player not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        isReady: 'not-a-boolean'
      };

      const response = await request(app)
        .put(`/api/lobbies/${testLobbyCode}/players/${playerId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/lobbies/:code/settings', () => {
    beforeEach(async () => {
      // Create a test lobby
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const createResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData);

      testLobbyCode = createResponse.body.lobby.code;
    });

    it('should update lobby settings successfully', async () => {
      const settingsData = {
        questionCount: 15,
        timeLimit: 90,
        allowReplay: false
      };

      const response = await request(app)
        .put(`/api/lobbies/${testLobbyCode}/settings`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(settingsData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('lobby');
      expect(response.body.lobby.questionCount).toBe(15);
      expect(response.body.lobby.settings.timeLimit).toBe(90);
      expect(response.body.lobby.settings.allowReplay).toBe(false);

      // Verify settings were updated in database
      const lobby = await dbService.query(
        'SELECT * FROM lobbies WHERE code = $1',
        [testLobbyCode]
      );
      expect(lobby.rows[0].question_count).toBe(15);
      expect(lobby.rows[0].settings.timeLimit).toBe(90);
      expect(lobby.rows[0].settings.allowReplay).toBe(false);
    });

    it('should return 403 for non-host user', async () => {
      const settingsData = {
        questionCount: 15
      };

      const response = await request(app)
        .put(`/api/lobbies/${testLobbyCode}/settings`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send(settingsData)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Only host can update settings');
    });

    it('should return 400 for invalid settings data', async () => {
      const invalidData = {
        questionCount: 0, // invalid
        timeLimit: 5 // too low
      };

      const response = await request(app)
        .put(`/api/lobbies/${testLobbyCode}/settings`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/lobbies/:code/start', () => {
    beforeEach(async () => {
      // Create a test lobby and add players
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const createResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData);

      testLobbyCode = createResponse.body.lobby.code;

      await request(app)
        .post('/api/lobbies/join')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ lobbyCode: testLobbyCode });

      // Set players as ready
      const host = await dbService.query(
        'SELECT user_id FROM users WHERE email = $1',
        ['host@example.com']
      );
      const player = await dbService.query(
        'SELECT user_id FROM users WHERE email = $1',
        ['player@example.com']
      );

      await dbService.query(
        'UPDATE lobby_players SET is_ready = true WHERE user_id IN ($1, $2)',
        [host.rows[0].user_id, player.rows[0].user_id]
      );
    });

    it('should start game successfully when all players are ready', async () => {
      const response = await request(app)
        .post(`/api/lobbies/${testLobbyCode}/start`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('gameSession');
      expect(response.body.gameSession).toHaveProperty('id');
      expect(response.body.gameSession).toHaveProperty('lobbyCode', testLobbyCode);

      // Verify lobby status was updated
      const lobby = await dbService.query(
        'SELECT * FROM lobbies WHERE code = $1',
        [testLobbyCode]
      );
      expect(lobby.rows[0].status).toBe('in_progress');
    });

    it('should return 403 for non-host user', async () => {
      const response = await request(app)
        .post(`/api/lobbies/${testLobbyCode}/start`)
        .set('Authorization', `Bearer ${playerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Only host can start game');
    });

    it('should return 400 when not all players are ready', async () => {
      // Set one player as not ready
      const player = await dbService.query(
        'SELECT user_id FROM users WHERE email = $1',
        ['player@example.com']
      );

      await dbService.query(
        'UPDATE lobby_players SET is_ready = false WHERE user_id = $1',
        [player.rows[0].user_id]
      );

      const response = await request(app)
        .post(`/api/lobbies/${testLobbyCode}/start`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Not all players are ready');
    });
  });

  describe('GET /api/lobbies', () => {
    beforeEach(async () => {
      // Create multiple test lobbies
      const lobbyData1 = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const lobbyData2 = {
        questionCount: 15,
        questionSetIds: [3, 4]
      };

      await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData1);

      await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData2);
    });

    it('should get all lobbies successfully', async () => {
      const response = await request(app)
        .get('/api/lobbies')
        .expect(200);

      expect(response.body).toHaveProperty('lobbies');
      expect(Array.isArray(response.body.lobbies)).toBe(true);
      expect(response.body.lobbies.length).toBeGreaterThan(0);
    });

    it('should filter lobbies by status', async () => {
      const response = await request(app)
        .get('/api/lobbies?status=waiting')
        .expect(200);

      expect(response.body).toHaveProperty('lobbies');
      expect(Array.isArray(response.body.lobbies)).toBe(true);
    });
  });

  describe('GET /api/lobbies/my', () => {
    beforeEach(async () => {
      // Create a test lobby
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const createResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData);

      testLobbyCode = createResponse.body.lobby.code;
    });

    it('should get user\'s lobbies successfully', async () => {
      const response = await request(app)
        .get('/api/lobbies/my')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('lobbies');
      expect(Array.isArray(response.body.lobbies)).toBe(true);
      expect(response.body.lobbies.length).toBeGreaterThan(0);
      expect(response.body.lobbies[0]).toHaveProperty('code', testLobbyCode);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/lobbies/my')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/lobbies/stats', () => {
    it('should get lobby statistics successfully', async () => {
      const response = await request(app)
        .get('/api/lobbies/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalLobbies');
      expect(response.body).toHaveProperty('activeLobbies');
      expect(response.body).toHaveProperty('totalPlayers');
      expect(typeof response.body.totalLobbies).toBe('number');
      expect(typeof response.body.activeLobbies).toBe('number');
      expect(typeof response.body.totalPlayers).toBe('number');
    });
  });

  describe('DELETE /api/lobbies/cleanup', () => {
    beforeEach(async () => {
      // Create a test lobby
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const createResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData);

      testLobbyCode = createResponse.body.lobby.code;
    });

    it('should cleanup expired lobbies successfully', async () => {
      const response = await request(app)
        .delete('/api/lobbies/cleanup')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('cleanedCount');
      expect(typeof response.body.cleanedCount).toBe('number');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/lobbies/cleanup')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/lobbies/question-sets/available', () => {
    it('should get available question sets successfully', async () => {
      const response = await request(app)
        .get('/api/lobbies/question-sets/available')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('questionSets');
      expect(Array.isArray(response.body.questionSets)).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/lobbies/question-sets/available')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/lobbies/:code/question-sets', () => {
    beforeEach(async () => {
      // Create a test lobby
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const createResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData);

      testLobbyCode = createResponse.body.lobby.code;
    });

    it('should update question sets successfully', async () => {
      const questionSetData = {
        questionSetIds: [3, 4, 5],
        questionCount: 20
      };

      const response = await request(app)
        .put(`/api/lobbies/${testLobbyCode}/question-sets`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(questionSetData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('lobby');
      expect(response.body.lobby.questionCount).toBe(20);

      // Verify question sets were updated in database
      const lobby = await dbService.query(
        'SELECT * FROM lobbies WHERE code = $1',
        [testLobbyCode]
      );
      expect(lobby.rows[0].question_count).toBe(20);
    });

    it('should return 403 for non-host user', async () => {
      const questionSetData = {
        questionSetIds: [3, 4, 5],
        questionCount: 20
      };

      const response = await request(app)
        .put(`/api/lobbies/${testLobbyCode}/question-sets`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send(questionSetData)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Only host can update question sets');
    });

    it('should return 400 for invalid question set data', async () => {
      const invalidData = {
        questionSetIds: [], // empty array
        questionCount: 3 // too low
      };

      const response = await request(app)
        .put(`/api/lobbies/${testLobbyCode}/question-sets`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/lobbies/:code/question-sets', () => {
    beforeEach(async () => {
      // Create a test lobby
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const createResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData);

      testLobbyCode = createResponse.body.lobby.code;
    });

    it('should get lobby question sets successfully', async () => {
      const response = await request(app)
        .get(`/api/lobbies/${testLobbyCode}/question-sets`)
        .expect(200);

      expect(response.body).toHaveProperty('questionSets');
      expect(Array.isArray(response.body.questionSets)).toBe(true);
    });

    it('should return 404 for non-existent lobby', async () => {
      const response = await request(app)
        .get('/api/lobbies/INVALID/question-sets')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Lobby not found');
    });
  });

  describe('Concurrent Access and Race Conditions', () => {
    beforeEach(async () => {
      // Create a test lobby
      const lobbyData = {
        questionCount: 10,
        questionSetIds: [1, 2]
      };

      const createResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(lobbyData);

      testLobbyCode = createResponse.body.lobby.code;
    });

    it('should handle concurrent join requests', async () => {
      // Create additional test users
      const userData1 = {
        username: 'user1',
        email: 'user1@example.com',
        password: 'TestPass123!'
      };

      const userData2 = {
        username: 'user2',
        email: 'user2@example.com',
        password: 'TestPass123!'
      };

      // Register and verify users
      await request(app)
        .post('/api/auth/register')
        .send(userData1);

      await request(app)
        .post('/api/auth/register')
        .send(userData2);

      const token1 = await dbService.query(
        'SELECT * FROM email_verification_tokens WHERE email = $1',
        [userData1.email]
      );
      const token2 = await dbService.query(
        'SELECT * FROM email_verification_tokens WHERE email = $1',
        [userData2.email]
      );

      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: token1.rows[0].token });

      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: token2.rows[0].token });

      // Login to get tokens
      const login1 = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData1.username,
          password: userData1.password
        });

      const login2 = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData2.username,
          password: userData2.password
        });

      // Make concurrent join requests
      const joinData = { lobbyCode: testLobbyCode };
      const promises = [
        request(app)
          .post('/api/lobbies/join')
          .set('Authorization', `Bearer ${login1.body.token}`)
          .send(joinData),
        request(app)
          .post('/api/lobbies/join')
          .set('Authorization', `Bearer ${login2.body.token}`)
          .send(joinData)
      ];

      const responses = await Promise.all(promises);

      // Both should succeed
      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);

      // Verify both players were added
      const players = await dbService.query(
        'SELECT COUNT(*) as count FROM lobby_players WHERE lobby_code = $1',
        [testLobbyCode]
      );
      expect(parseInt(players.rows[0].count)).toBe(3); // host + 2 players
    });

    it('should handle concurrent settings updates', async () => {
      const settingsData1 = { questionCount: 15 };
      const settingsData2 = { timeLimit: 90 };

      // Make concurrent settings update requests
      const promises = [
        request(app)
          .put(`/api/lobbies/${testLobbyCode}/settings`)
          .set('Authorization', `Bearer ${hostToken}`)
          .send(settingsData1),
        request(app)
          .put(`/api/lobbies/${testLobbyCode}/settings`)
          .set('Authorization', `Bearer ${hostToken}`)
          .send(settingsData2)
      ];

      const responses = await Promise.all(promises);

      // Both should succeed
      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);

      // Verify final state
      const lobby = await dbService.query(
        'SELECT * FROM lobbies WHERE code = $1',
        [testLobbyCode]
      );
      expect(lobby.rows[0].question_count).toBe(15);
      expect(lobby.rows[0].settings.timeLimit).toBe(90);
    });
  });
}); 