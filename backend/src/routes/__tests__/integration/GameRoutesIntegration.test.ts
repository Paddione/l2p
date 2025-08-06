import request from 'supertest';
import { app } from '../../server';
import { DatabaseService } from '../../services/DatabaseService';
import { ScoringService } from '../../services/ScoringService';
import { HallOfFameService } from '../../services/HallOfFameService';
import { AuthService } from '../../services/AuthService';

describe('Game Routes Integration Tests', () => {
  let dbService: DatabaseService;
  let scoringService: ScoringService;
  let hallOfFameService: HallOfFameService;
  let authService: AuthService;
  let authToken: string;
  let testQuestionSetId: number;
  let testGameSessionId: number;
  let testUserId: number;

  beforeAll(async () => {
    dbService = new DatabaseService();
    await dbService.initialize();
    
    scoringService = new ScoringService();
    hallOfFameService = new HallOfFameService();
    authService = new AuthService();
  });

  afterAll(async () => {
    await dbService.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await dbService.query('DELETE FROM hall_of_fame_entries');
    await dbService.query('DELETE FROM game_sessions');
    await dbService.query('DELETE FROM questions');
    await dbService.query('DELETE FROM question_sets');
    await dbService.query('DELETE FROM users');

    // Create test user
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!'
    };

    // Register and verify user
    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const verificationToken = await dbService.query(
      'SELECT * FROM email_verification_tokens WHERE email = $1',
      [userData.email]
    );
    await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verificationToken.rows[0].token });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: userData.username,
        password: userData.password
      });

    authToken = loginResponse.body.token;
    testUserId = loginResponse.body.user.id;

    // Create test question set
    const questionSetData = {
      name: 'Test Question Set',
      description: 'A test question set for game testing',
      category: 'Test Category',
      difficulty: 'medium',
      is_active: true
    };

    const questionSetResponse = await request(app)
      .post('/api/questions/sets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(questionSetData);

    testQuestionSetId = questionSetResponse.body.data.id;

    // Create test questions
    for (let i = 0; i < 5; i++) {
      const questionData = {
        question_set_id: testQuestionSetId,
        question_text: {
          en: `Test question ${i + 1}?`,
          de: `Testfrage ${i + 1}?`
        },
        answers: [
          {
            text: { en: 'Answer A', de: 'Antwort A' },
            correct: false
          },
          {
            text: { en: 'Answer B', de: 'Antwort B' },
            correct: true
          },
          {
            text: { en: 'Answer C', de: 'Antwort C' },
            correct: false
          }
        ],
        explanation: {
          en: `Explanation ${i + 1}`,
          de: `Erklärung ${i + 1}`
        },
        difficulty: 1
      };

      await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(questionData);
    }

    // Create test game session
    const gameSessionData = {
      lobby_code: 'TEST12',
      question_set_id: testQuestionSetId,
      host_id: testUserId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      settings: {
        timeLimit: 60,
        allowReplay: true
      }
    };

    const gameSessionResponse = await dbService.query(
      'INSERT INTO game_sessions (lobby_code, question_set_id, host_id, status, started_at, settings) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [
        gameSessionData.lobby_code,
        gameSessionData.question_set_id,
        gameSessionData.host_id,
        gameSessionData.status,
        gameSessionData.started_at,
        JSON.stringify(gameSessionData.settings)
      ]
    );

    testGameSessionId = gameSessionResponse.rows[0].id;
  });

  describe('Scoring Routes Integration', () => {
    describe('GET /api/scoring/leaderboard', () => {
      beforeEach(async () => {
        // Create some test Hall of Fame entries
        const entries = [
          {
            session_id: testGameSessionId,
            username: 'player1',
            character_name: 'Warrior',
            score: 1000,
            accuracy: 85.5,
            max_multiplier: 3,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date().toISOString()
          },
          {
            session_id: testGameSessionId,
            username: 'player2',
            character_name: 'Mage',
            score: 1200,
            accuracy: 90.0,
            max_multiplier: 4,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date().toISOString()
          },
          {
            session_id: testGameSessionId,
            username: 'player3',
            character_name: 'Archer',
            score: 800,
            accuracy: 75.0,
            max_multiplier: 2,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date().toISOString()
          }
        ];

        for (const entry of entries) {
          await dbService.query(
            'INSERT INTO hall_of_fame_entries (session_id, username, character_name, score, accuracy, max_multiplier, question_set_id, question_set_name, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
              entry.session_id,
              entry.username,
              entry.character_name,
              entry.score,
              entry.accuracy,
              entry.max_multiplier,
              entry.question_set_id,
              entry.question_set_name,
              entry.completed_at
            ]
          );
        }
      });

      it('should get leaderboard for question set successfully', async () => {
        const response = await request(app)
          .get('/api/scoring/leaderboard')
          .query({
            questionSetId: testQuestionSetId,
            limit: 10
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(3);
        
        // Should be sorted by score in descending order
        expect(response.body.data[0].score).toBe(1200);
        expect(response.body.data[1].score).toBe(1000);
        expect(response.body.data[2].score).toBe(800);
      });

      it('should limit leaderboard results', async () => {
        const response = await request(app)
          .get('/api/scoring/leaderboard')
          .query({
            questionSetId: testQuestionSetId,
            limit: 2
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);
      });

      it('should return 400 for missing questionSetId', async () => {
        const response = await request(app)
          .get('/api/scoring/leaderboard')
          .query({
            limit: 10
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should return 400 for invalid questionSetId', async () => {
        const response = await request(app)
          .get('/api/scoring/leaderboard')
          .query({
            questionSetId: 'invalid',
            limit: 10
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/scoring/statistics/:userId', () => {
      beforeEach(async () => {
        // Create test game sessions for the user
        const sessions = [
          {
            lobby_code: 'TEST12',
            question_set_id: testQuestionSetId,
            host_id: testUserId,
            status: 'completed',
            started_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            completed_at: new Date().toISOString(),
            settings: JSON.stringify({ timeLimit: 60 }),
            total_score: 1000,
            total_questions: 10,
            correct_answers: 8
          },
          {
            lobby_code: 'TEST13',
            question_set_id: testQuestionSetId,
            host_id: testUserId,
            status: 'completed',
            started_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            completed_at: new Date(Date.now() - 86400000).toISOString(),
            settings: JSON.stringify({ timeLimit: 60 }),
            total_score: 1200,
            total_questions: 10,
            correct_answers: 9
          }
        ];

        for (const session of sessions) {
          await dbService.query(
            'INSERT INTO game_sessions (lobby_code, question_set_id, host_id, status, started_at, completed_at, settings, total_score, total_questions, correct_answers) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [
              session.lobby_code,
              session.question_set_id,
              session.host_id,
              session.status,
              session.started_at,
              session.completed_at,
              session.settings,
              session.total_score,
              session.total_questions,
              session.correct_answers
            ]
          );
        }
      });

      it('should get player statistics successfully', async () => {
        const response = await request(app)
          .get(`/api/scoring/statistics/${testUserId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('totalGames');
        expect(response.body.data).toHaveProperty('totalScore');
        expect(response.body.data).toHaveProperty('averageScore');
        expect(response.body.data).toHaveProperty('totalQuestions');
        expect(response.body.data).toHaveProperty('correctAnswers');
        expect(response.body.data).toHaveProperty('accuracy');
        expect(response.body.data).toHaveProperty('bestScore');
        expect(response.body.data).toHaveProperty('averageAccuracy');
      });

      it('should return 401 for unauthenticated request', async () => {
        const response = await request(app)
          .get(`/api/scoring/statistics/${testUserId}`)
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });

      it('should return 400 for invalid userId', async () => {
        const response = await request(app)
          .get('/api/scoring/statistics/invalid')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/scoring/validate-hall-of-fame', () => {
      it('should validate Hall of Fame eligibility successfully', async () => {
        const validationData = {
          gameSessionId: testGameSessionId,
          totalQuestions: 10,
          completedQuestions: 10
        };

        const response = await request(app)
          .post('/api/scoring/validate-hall-of-fame')
          .send(validationData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('isEligible');
        expect(response.body.data).toHaveProperty('completionRate');
        expect(response.body.data.completionRate).toBe(100);
      });

      it('should return false for incomplete game session', async () => {
        const validationData = {
          gameSessionId: testGameSessionId,
          totalQuestions: 10,
          completedQuestions: 5
        };

        const response = await request(app)
          .post('/api/scoring/validate-hall-of-fame')
          .send(validationData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('isEligible');
        expect(response.body.data).toHaveProperty('completionRate');
        expect(response.body.data.completionRate).toBe(50);
      });

      it('should return 400 for invalid request data', async () => {
        const invalidData = {
          gameSessionId: 'invalid',
          totalQuestions: -1,
          completedQuestions: 5
        };

        const response = await request(app)
          .post('/api/scoring/validate-hall-of-fame')
          .send(invalidData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/scoring/performance-rating', () => {
      it('should calculate performance rating successfully', async () => {
        const response = await request(app)
          .get('/api/scoring/performance-rating')
          .query({
            score: 1000,
            accuracy: 85,
            maxMultiplier: 3
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('rating');
        expect(typeof response.body.data.rating).toBe('string');
      });

      it('should return 400 for invalid parameters', async () => {
        const response = await request(app)
          .get('/api/scoring/performance-rating')
          .query({
            score: -1,
            accuracy: 150,
            maxMultiplier: 10
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Hall of Fame Routes Integration', () => {
    describe('POST /api/hall-of-fame/submit', () => {
      it('should submit score to Hall of Fame successfully', async () => {
        const submissionData = {
          sessionId: testGameSessionId,
          username: 'testuser',
          characterName: 'Warrior',
          score: 1000,
          accuracy: 85.5,
          maxMultiplier: 3,
          questionSetId: testQuestionSetId,
          questionSetName: 'Test Question Set'
        };

        const response = await request(app)
          .post('/api/hall-of-fame/submit')
          .send(submissionData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('successfully submitted');

        // Verify entry was created in database
        const entry = await dbService.query(
          'SELECT * FROM hall_of_fame_entries WHERE session_id = $1 AND username = $2',
          [testGameSessionId, 'testuser']
        );
        expect(entry.rows[0]).toBeDefined();
        expect(entry.rows[0].score).toBe(1000);
        expect(entry.rows[0].accuracy).toBe(85.5);
      });

      it('should return 400 for invalid submission data', async () => {
        const invalidData = {
          sessionId: testGameSessionId,
          username: '', // empty username
          score: -1, // negative score
          accuracy: 150, // invalid accuracy
          maxMultiplier: 10, // invalid multiplier
          questionSetId: testQuestionSetId,
          questionSetName: 'Test Question Set'
        };

        const response = await request(app)
          .post('/api/hall-of-fame/submit')
          .send(invalidData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should handle duplicate submissions gracefully', async () => {
        const submissionData = {
          sessionId: testGameSessionId,
          username: 'testuser',
          characterName: 'Warrior',
          score: 1000,
          accuracy: 85.5,
          maxMultiplier: 3,
          questionSetId: testQuestionSetId,
          questionSetName: 'Test Question Set'
        };

        // Submit first time
        await request(app)
          .post('/api/hall-of-fame/submit')
          .send(submissionData)
          .expect(200);

        // Try to submit again
        const response = await request(app)
          .post('/api/hall-of-fame/submit')
          .send(submissionData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/hall-of-fame/leaderboard/:questionSetId', () => {
      beforeEach(async () => {
        // Create test Hall of Fame entries
        const entries = [
          {
            session_id: testGameSessionId,
            username: 'player1',
            character_name: 'Warrior',
            score: 1000,
            accuracy: 85.5,
            max_multiplier: 3,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date().toISOString()
          },
          {
            session_id: testGameSessionId,
            username: 'player2',
            character_name: 'Mage',
            score: 1200,
            accuracy: 90.0,
            max_multiplier: 4,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date().toISOString()
          }
        ];

        for (const entry of entries) {
          await dbService.query(
            'INSERT INTO hall_of_fame_entries (session_id, username, character_name, score, accuracy, max_multiplier, question_set_id, question_set_name, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
              entry.session_id,
              entry.username,
              entry.character_name,
              entry.score,
              entry.accuracy,
              entry.max_multiplier,
              entry.question_set_id,
              entry.question_set_name,
              entry.completed_at
            ]
          );
        }
      });

      it('should get leaderboard for specific question set', async () => {
        const response = await request(app)
          .get(`/api/hall-of-fame/leaderboard/${testQuestionSetId}`)
          .query({ limit: 10 })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);
        
        // Should be sorted by score in descending order
        expect(response.body.data[0].score).toBe(1200);
        expect(response.body.data[1].score).toBe(1000);
      });

      it('should limit leaderboard results', async () => {
        const response = await request(app)
          .get(`/api/hall-of-fame/leaderboard/${testQuestionSetId}`)
          .query({ limit: 1 })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
      });

      it('should return 400 for invalid questionSetId', async () => {
        const response = await request(app)
          .get('/api/hall-of-fame/leaderboard/invalid')
          .query({ limit: 10 })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/hall-of-fame/leaderboards', () => {
      it('should get all leaderboards successfully', async () => {
        const response = await request(app)
          .get('/api/hall-of-fame/leaderboards')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('GET /api/hall-of-fame/user/:username/best-scores', () => {
      beforeEach(async () => {
        // Create test entries for the user
        const entries = [
          {
            session_id: testGameSessionId,
            username: 'testuser',
            character_name: 'Warrior',
            score: 1000,
            accuracy: 85.5,
            max_multiplier: 3,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date().toISOString()
          }
        ];

        for (const entry of entries) {
          await dbService.query(
            'INSERT INTO hall_of_fame_entries (session_id, username, character_name, score, accuracy, max_multiplier, question_set_id, question_set_name, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
              entry.session_id,
              entry.username,
              entry.character_name,
              entry.score,
              entry.accuracy,
              entry.max_multiplier,
              entry.question_set_id,
              entry.question_set_name,
              entry.completed_at
            ]
          );
        }
      });

      it('should get user best scores successfully', async () => {
        const response = await request(app)
          .get('/api/hall-of-fame/user/testuser/best-scores')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should return 400 for invalid username', async () => {
        const response = await request(app)
          .get('/api/hall-of-fame/user//best-scores')
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/hall-of-fame/user/:username/rank/:questionSetId', () => {
      beforeEach(async () => {
        // Create test entries for ranking
        const entries = [
          {
            session_id: testGameSessionId,
            username: 'player1',
            character_name: 'Warrior',
            score: 1000,
            accuracy: 85.5,
            max_multiplier: 3,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date().toISOString()
          },
          {
            session_id: testGameSessionId,
            username: 'player2',
            character_name: 'Mage',
            score: 1200,
            accuracy: 90.0,
            max_multiplier: 4,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date().toISOString()
          },
          {
            session_id: testGameSessionId,
            username: 'testuser',
            character_name: 'Archer',
            score: 800,
            accuracy: 75.0,
            max_multiplier: 2,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date().toISOString()
          }
        ];

        for (const entry of entries) {
          await dbService.query(
            'INSERT INTO hall_of_fame_entries (session_id, username, character_name, score, accuracy, max_multiplier, question_set_id, question_set_name, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
              entry.session_id,
              entry.username,
              entry.character_name,
              entry.score,
              entry.accuracy,
              entry.max_multiplier,
              entry.question_set_id,
              entry.question_set_name,
              entry.completed_at
            ]
          );
        }
      });

      it('should get user rank in question set successfully', async () => {
        const response = await request(app)
          .get(`/api/hall-of-fame/user/testuser/rank/${testQuestionSetId}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('rank');
        expect(typeof response.body.data.rank).toBe('number');
        expect(response.body.data.rank).toBe(3); // Should be 3rd place
      });

      it('should return 400 for invalid parameters', async () => {
        const response = await request(app)
          .get('/api/hall-of-fame/user//rank/invalid')
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/hall-of-fame/recent', () => {
      beforeEach(async () => {
        // Create recent test entries
        const entries = [
          {
            session_id: testGameSessionId,
            username: 'player1',
            character_name: 'Warrior',
            score: 1000,
            accuracy: 85.5,
            max_multiplier: 3,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date().toISOString()
          },
          {
            session_id: testGameSessionId,
            username: 'player2',
            character_name: 'Mage',
            score: 1200,
            accuracy: 90.0,
            max_multiplier: 4,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
          }
        ];

        for (const entry of entries) {
          await dbService.query(
            'INSERT INTO hall_of_fame_entries (session_id, username, character_name, score, accuracy, max_multiplier, question_set_id, question_set_name, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
              entry.session_id,
              entry.username,
              entry.character_name,
              entry.score,
              entry.accuracy,
              entry.max_multiplier,
              entry.question_set_id,
              entry.question_set_name,
              entry.completed_at
            ]
          );
        }
      });

      it('should get recent entries successfully', async () => {
        const response = await request(app)
          .get('/api/hall-of-fame/recent')
          .query({ limit: 10 })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);
      });

      it('should limit recent entries', async () => {
        const response = await request(app)
          .get('/api/hall-of-fame/recent')
          .query({ limit: 1 })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
      });
    });

    describe('GET /api/hall-of-fame/statistics', () => {
      it('should get Hall of Fame statistics successfully', async () => {
        const response = await request(app)
          .get('/api/hall-of-fame/statistics')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('totalEntries');
        expect(response.body.data).toHaveProperty('totalUsers');
        expect(response.body.data).toHaveProperty('totalQuestionSets');
        expect(response.body.data).toHaveProperty('averageScore');
        expect(response.body.data).toHaveProperty('highestScore');
      });
    });

    describe('GET /api/hall-of-fame/search', () => {
      beforeEach(async () => {
        // Create test entries for search
        const entries = [
          {
            session_id: testGameSessionId,
            username: 'testuser',
            character_name: 'Warrior',
            score: 1000,
            accuracy: 85.5,
            max_multiplier: 3,
            question_set_id: testQuestionSetId,
            question_set_name: 'Test Question Set',
            completed_at: new Date().toISOString()
          }
        ];

        for (const entry of entries) {
          await dbService.query(
            'INSERT INTO hall_of_fame_entries (session_id, username, character_name, score, accuracy, max_multiplier, question_set_id, question_set_name, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
              entry.session_id,
              entry.username,
              entry.character_name,
              entry.score,
              entry.accuracy,
              entry.max_multiplier,
              entry.question_set_id,
              entry.question_set_name,
              entry.completed_at
            ]
          );
        }
      });

      it('should search Hall of Fame entries successfully', async () => {
        const response = await request(app)
          .get('/api/hall-of-fame/search')
          .query({
            q: 'testuser',
            limit: 10
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should return 400 for missing search term', async () => {
        const response = await request(app)
          .get('/api/hall-of-fame/search')
          .query({ limit: 10 })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/hall-of-fame/validate-eligibility', () => {
      it('should validate Hall of Fame eligibility successfully', async () => {
        const validationData = {
          sessionId: testGameSessionId
        };

        const response = await request(app)
          .post('/api/hall-of-fame/validate-eligibility')
          .send(validationData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('isEligible');
        expect(response.body.data).toHaveProperty('requirements');
      });

      it('should return 400 for invalid sessionId', async () => {
        const validationData = {
          sessionId: 'invalid'
        };

        const response = await request(app)
          .post('/api/hall-of-fame/validate-eligibility')
          .send(validationData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Multiplayer Game Flow Integration', () => {
    it('should handle complete game session flow', async () => {
      // Step 1: Create a lobby
      const lobbyData = {
        questionCount: 5,
        questionSetIds: [testQuestionSetId],
        settings: {
          timeLimit: 60,
          allowReplay: true
        }
      };

      const lobbyResponse = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(lobbyData)
        .expect(201);

      const lobbyCode = lobbyResponse.body.lobby.code;

      // Step 2: Start the game
      const startResponse = await request(app)
        .post(`/api/lobbies/${lobbyCode}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(startResponse.body).toHaveProperty('gameSession');
      const gameSessionId = startResponse.body.gameSession.id;

      // Step 3: Submit answers and calculate score
      const answers = [
        { questionId: 1, selectedAnswer: 'B', timeElapsed: 30 },
        { questionId: 2, selectedAnswer: 'B', timeElapsed: 25 },
        { questionId: 3, selectedAnswer: 'B', timeElapsed: 20 },
        { questionId: 4, selectedAnswer: 'B', timeElapsed: 15 },
        { questionId: 5, selectedAnswer: 'B', timeElapsed: 10 }
      ];

      let totalScore = 0;
      let correctAnswers = 0;

      for (const answer of answers) {
        const score = (60 - answer.timeElapsed) * (correctAnswers + 1); // Simple scoring
        totalScore += score;
        correctAnswers++;
      }

      // Step 4: Submit to Hall of Fame
      const hallOfFameData = {
        sessionId: gameSessionId,
        username: 'testuser',
        characterName: 'Warrior',
        score: totalScore,
        accuracy: (correctAnswers / answers.length) * 100,
        maxMultiplier: correctAnswers,
        questionSetId: testQuestionSetId,
        questionSetName: 'Test Question Set'
      };

      const hallOfFameResponse = await request(app)
        .post('/api/hall-of-fame/submit')
        .send(hallOfFameData)
        .expect(200);

      expect(hallOfFameResponse.body).toHaveProperty('success', true);

      // Step 5: Verify leaderboard entry
      const leaderboardResponse = await request(app)
        .get(`/api/hall-of-fame/leaderboard/${testQuestionSetId}`)
        .query({ limit: 10 })
        .expect(200);

      expect(leaderboardResponse.body.data).toContainEqual(
        expect.objectContaining({
          username: 'testuser',
          score: totalScore
        })
      );
    });
  });

  describe('Real-time Game State Synchronization', () => {
    it('should handle concurrent score submissions', async () => {
      // Create multiple game sessions
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const sessionData = {
          lobby_code: `TEST${i + 1}`,
          question_set_id: testQuestionSetId,
          host_id: testUserId,
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          settings: JSON.stringify({ timeLimit: 60 }),
          total_score: 1000 + (i * 100),
          total_questions: 10,
          correct_answers: 8 + i
        };

        const sessionResponse = await dbService.query(
          'INSERT INTO game_sessions (lobby_code, question_set_id, host_id, status, started_at, completed_at, settings, total_score, total_questions, correct_answers) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
          [
            sessionData.lobby_code,
            sessionData.question_set_id,
            sessionData.host_id,
            sessionData.status,
            sessionData.started_at,
            sessionData.completed_at,
            sessionData.settings,
            sessionData.total_score,
            sessionData.total_questions,
            sessionData.correct_answers
          ]
        );

        sessions.push(sessionResponse.rows[0].id);
      }

      // Submit scores concurrently
      const submissionPromises = sessions.map((sessionId, index) => {
        const submissionData = {
          sessionId: sessionId,
          username: `player${index + 1}`,
          characterName: 'Warrior',
          score: 1000 + (index * 100),
          accuracy: 80 + (index * 5),
          maxMultiplier: 3,
          questionSetId: testQuestionSetId,
          questionSetName: 'Test Question Set'
        };

        return request(app)
          .post('/api/hall-of-fame/submit')
          .send(submissionData);
      });

      const responses = await Promise.all(submissionPromises);

      // All submissions should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      });

      // Verify all entries were created
      const entries = await dbService.query(
        'SELECT COUNT(*) as count FROM hall_of_fame_entries WHERE question_set_id = $1',
        [testQuestionSetId]
      );
      expect(parseInt(entries.rows[0].count)).toBe(3);
    });
  });
}); 