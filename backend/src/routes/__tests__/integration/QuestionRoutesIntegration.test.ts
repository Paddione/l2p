import request from 'supertest';
import { app } from '../../server';
import { DatabaseService } from '../../services/DatabaseService';
import { QuestionService } from '../../services/QuestionService';
import { AuthService } from '../../services/AuthService';

describe('Question Routes Integration Tests', () => {
  let dbService: DatabaseService;
  let questionService: QuestionService;
  let authService: AuthService;
  let authToken: string;
  let testQuestionSetId: number;
  let testQuestionId: number;

  beforeAll(async () => {
    dbService = DatabaseService.getInstance();
    
    questionService = new QuestionService();
    authService = new AuthService();
  });

  afterAll(async () => {
    await dbService.close();
  });

  beforeEach(async () => {
    // Clean up test data
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

    // Create test question set
    const questionSetData = {
      name: 'Test Question Set',
      description: 'A test question set for integration testing',
      category: 'Test Category',
      difficulty: 'medium',
      is_active: true
    };

    const questionSetResponse = await request(app)
      .post('/api/questions/sets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(questionSetData);

    testQuestionSetId = questionSetResponse.body.data.id;

    // Create test question
    const questionData = {
      question_set_id: testQuestionSetId,
      question_text: {
        en: 'What is 2 + 2?',
        de: 'Was ist 2 + 2?'
      },
      answers: [
        {
          text: { en: '3', de: '3' },
          correct: false
        },
        {
          text: { en: '4', de: '4' },
          correct: true
        },
        {
          text: { en: '5', de: '5' },
          correct: false
        }
      ],
      explanation: {
        en: 'Basic addition',
        de: 'Einfache Addition'
      },
      difficulty: 1
    };

    const questionResponse = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${authToken}`)
      .send(questionData);

    testQuestionId = questionResponse.body.data.id;
  });

  describe('GET /api/questions/stats', () => {
    it('should get question statistics successfully', async () => {
      const response = await request(app)
        .get('/api/questions/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalQuestionSets');
      expect(response.body.data).toHaveProperty('totalQuestions');
      expect(response.body.data).toHaveProperty('categories');
      expect(typeof response.body.data.totalQuestionSets).toBe('number');
      expect(typeof response.body.data.totalQuestions).toBe('number');
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });
  });

  describe('GET /api/questions/categories', () => {
    it('should get available categories successfully', async () => {
      const response = await request(app)
        .get('/api/questions/categories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toContain('Test Category');
    });
  });

  describe('GET /api/questions/sets', () => {
    it('should get all question sets successfully', async () => {
      const response = await request(app)
        .get('/api/questions/sets')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('category');
    });

    it('should filter question sets by active status', async () => {
      const response = await request(app)
        .get('/api/questions/sets?active=false')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should include question statistics in response', async () => {
      const response = await request(app)
        .get('/api/questions/sets')
        .expect(200);

      expect(response.body.data[0]).toHaveProperty('questionCount');
      expect(response.body.data[0]).toHaveProperty('averageDifficulty');
      expect(typeof response.body.data[0].questionCount).toBe('number');
    });
  });

  describe('GET /api/questions/sets/:id', () => {
    it('should get question set by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/questions/sets/${testQuestionSetId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', testQuestionSetId);
      expect(response.body.data).toHaveProperty('name', 'Test Question Set');
      expect(response.body.data).toHaveProperty('category', 'Test Category');
      expect(response.body.data).toHaveProperty('difficulty', 'medium');
      expect(response.body.data).toHaveProperty('is_active', true);
    });

    it('should return 404 for non-existent question set', async () => {
      const response = await request(app)
        .get('/api/questions/sets/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Question set not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/questions/sets/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/questions/sets/category/:category', () => {
    it('should get question sets by category successfully', async () => {
      const response = await request(app)
        .get('/api/questions/sets/category/Test Category')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('category', 'Test Category');
    });

    it('should return empty array for non-existent category', async () => {
      const response = await request(app)
        .get('/api/questions/sets/category/NonExistentCategory')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('POST /api/questions/sets', () => {
    it('should create question set successfully', async () => {
      const questionSetData = {
        name: 'New Question Set',
        description: 'A new question set for testing',
        category: 'New Category',
        difficulty: 'easy',
        is_active: true
      };

      const response = await request(app)
        .post('/api/questions/sets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(questionSetData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', questionSetData.name);
      expect(response.body.data).toHaveProperty('category', questionSetData.category);
      expect(response.body.data).toHaveProperty('difficulty', questionSetData.difficulty);

      // Verify question set was created in database
      const questionSet = await dbService.query(
        'SELECT * FROM question_sets WHERE id = $1',
        [response.body.data.id]
      );
      expect(questionSet.rows[0]).toBeDefined();
      expect(questionSet.rows[0].name).toBe(questionSetData.name);
    });

    it('should return 400 for invalid question set data', async () => {
      const invalidData = {
        name: '', // empty name
        description: 'A test description',
        category: 'Test Category',
        difficulty: 'invalid_difficulty' // invalid difficulty
      };

      const response = await request(app)
        .post('/api/questions/sets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should use default values when not provided', async () => {
      const questionSetData = {
        name: 'Default Question Set',
        description: 'A question set with defaults'
      };

      const response = await request(app)
        .post('/api/questions/sets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(questionSetData)
        .expect(201);

      expect(response.body.data).toHaveProperty('difficulty', 'medium');
      expect(response.body.data).toHaveProperty('is_active', true);
    });
  });

  describe('PUT /api/questions/sets/:id', () => {
    it('should update question set successfully', async () => {
      const updateData = {
        name: 'Updated Question Set',
        description: 'Updated description',
        difficulty: 'hard',
        is_active: false
      };

      const response = await request(app)
        .put(`/api/questions/sets/${testQuestionSetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', updateData.name);
      expect(response.body.data).toHaveProperty('description', updateData.description);
      expect(response.body.data).toHaveProperty('difficulty', updateData.difficulty);
      expect(response.body.data).toHaveProperty('is_active', updateData.is_active);

      // Verify question set was updated in database
      const questionSet = await dbService.query(
        'SELECT * FROM question_sets WHERE id = $1',
        [testQuestionSetId]
      );
      expect(questionSet.rows[0].name).toBe(updateData.name);
      expect(questionSet.rows[0].difficulty).toBe(updateData.difficulty);
    });

    it('should return 404 for non-existent question set', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/questions/sets/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Question set not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        difficulty: 'invalid_difficulty'
      };

      const response = await request(app)
        .put(`/api/questions/sets/${testQuestionSetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/questions/sets/:id', () => {
    it('should delete question set successfully', async () => {
      const response = await request(app)
        .delete(`/api/questions/sets/${testQuestionSetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted successfully');

      // Verify question set was deleted from database
      const questionSet = await dbService.query(
        'SELECT * FROM question_sets WHERE id = $1',
        [testQuestionSetId]
      );
      expect(questionSet.rows.length).toBe(0);
    });

    it('should return 404 for non-existent question set', async () => {
      const response = await request(app)
        .delete('/api/questions/sets/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Question set not found');
    });
  });

  describe('GET /api/questions/sets/:id/questions', () => {
    it('should get questions for question set successfully', async () => {
      const response = await request(app)
        .get(`/api/questions/sets/${testQuestionSetId}/questions`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('question_text');
      expect(response.body.data[0]).toHaveProperty('answers');
      expect(response.body.data[0]).toHaveProperty('explanation');
    });

    it('should return 404 for non-existent question set', async () => {
      const response = await request(app)
        .get('/api/questions/sets/99999/questions')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Question set not found');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/questions/sets/${testQuestionSetId}/questions?page=1&limit=5`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });
  });

  describe('POST /api/questions/random', () => {
    it('should get random questions successfully', async () => {
      const requestData = {
        questionSetIds: [testQuestionSetId],
        count: 1,
        difficulty: 1,
        excludeIds: []
      };

      const response = await request(app)
        .post('/api/questions/random')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('question_text');
      expect(response.body.data[0]).toHaveProperty('answers');
    });

    it('should return 400 for invalid request data', async () => {
      const invalidData = {
        questionSetIds: [], // empty array
        count: 0 // invalid count
      };

      const response = await request(app)
        .post('/api/questions/random')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should exclude specified question IDs', async () => {
      const requestData = {
        questionSetIds: [testQuestionSetId],
        count: 1,
        excludeIds: [testQuestionId]
      };

      const response = await request(app)
        .post('/api/questions/random')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Should not return the excluded question
      const returnedIds = response.body.data.map((q: any) => q.id);
      expect(returnedIds).not.toContain(testQuestionId);
    });
  });

  describe('GET /api/questions/search', () => {
    it('should search questions successfully', async () => {
      const response = await request(app)
        .get('/api/questions/search?q=addition')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/questions/search?q=test&category=Test Category')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/questions/search?q=test&page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });
  });

  describe('GET /api/questions/:id', () => {
    it('should get question by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', testQuestionId);
      expect(response.body.data).toHaveProperty('question_text');
      expect(response.body.data).toHaveProperty('answers');
      expect(response.body.data).toHaveProperty('explanation');
      expect(response.body.data).toHaveProperty('difficulty');
    });

    it('should return 404 for non-existent question', async () => {
      const response = await request(app)
        .get('/api/questions/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Question not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/questions/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/questions', () => {
    it('should create question successfully', async () => {
      const questionData = {
        question_set_id: testQuestionSetId,
        question_text: {
          en: 'What is the capital of France?',
          de: 'Was ist die Hauptstadt von Frankreich?'
        },
        answers: [
          {
            text: { en: 'London', de: 'London' },
            correct: false
          },
          {
            text: { en: 'Paris', de: 'Paris' },
            correct: true
          },
          {
            text: { en: 'Berlin', de: 'Berlin' },
            correct: false
          }
        ],
        explanation: {
          en: 'Paris is the capital of France',
          de: 'Paris ist die Hauptstadt von Frankreich'
        },
        difficulty: 2
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(questionData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('question_set_id', testQuestionSetId);
      expect(response.body.data).toHaveProperty('question_text');
      expect(response.body.data).toHaveProperty('answers');
      expect(response.body.data).toHaveProperty('explanation');
      expect(response.body.data).toHaveProperty('difficulty', 2);

      // Verify question was created in database
      const question = await dbService.query(
        'SELECT * FROM questions WHERE id = $1',
        [response.body.data.id]
      );
      expect(question.rows[0]).toBeDefined();
      expect(question.rows[0].question_set_id).toBe(testQuestionSetId);
    });

    it('should return 400 for invalid question data', async () => {
      const invalidData = {
        question_set_id: testQuestionSetId,
        question_text: {
          en: '', // empty question
          de: 'Was ist die Hauptstadt von Frankreich?'
        },
        answers: [
          {
            text: { en: 'Paris', de: 'Paris' },
            correct: true
          }
          // Missing required second answer
        ]
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate answer structure', async () => {
      const invalidData = {
        question_set_id: testQuestionSetId,
        question_text: {
          en: 'What is the capital of France?',
          de: 'Was ist die Hauptstadt von Frankreich?'
        },
        answers: [
          {
            text: { en: 'Paris' }, // missing German translation
            correct: true
          },
          {
            text: { en: 'London', de: 'London' },
            correct: false
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/questions/:id', () => {
    it('should update question successfully', async () => {
      const updateData = {
        question_text: {
          en: 'What is 3 + 3?',
          de: 'Was ist 3 + 3?'
        },
        answers: [
          {
            text: { en: '5', de: '5' },
            correct: false
          },
          {
            text: { en: '6', de: '6' },
            correct: true
          },
          {
            text: { en: '7', de: '7' },
            correct: false
          }
        ],
        explanation: {
          en: 'Basic addition: 3 + 3 = 6',
          de: 'Einfache Addition: 3 + 3 = 6'
        },
        difficulty: 2
      };

      const response = await request(app)
        .put(`/api/questions/${testQuestionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', testQuestionId);
      expect(response.body.data).toHaveProperty('question_text');
      expect(response.body.data).toHaveProperty('answers');
      expect(response.body.data).toHaveProperty('explanation');
      expect(response.body.data).toHaveProperty('difficulty', 2);

      // Verify question was updated in database
      const question = await dbService.query(
        'SELECT * FROM questions WHERE id = $1',
        [testQuestionId]
      );
      expect(question.rows[0].difficulty).toBe(2);
    });

    it('should return 404 for non-existent question', async () => {
      const updateData = {
        question_text: {
          en: 'Updated question',
          de: 'Aktualisierte Frage'
        }
      };

      const response = await request(app)
        .put('/api/questions/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Question not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        difficulty: 10 // invalid difficulty (should be 1-5)
      };

      const response = await request(app)
        .put(`/api/questions/${testQuestionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/questions/:id', () => {
    it('should delete question successfully', async () => {
      const response = await request(app)
        .delete(`/api/questions/${testQuestionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted successfully');

      // Verify question was deleted from database
      const question = await dbService.query(
        'SELECT * FROM questions WHERE id = $1',
        [testQuestionId]
      );
      expect(question.rows.length).toBe(0);
    });

    it('should return 404 for non-existent question', async () => {
      const response = await request(app)
        .delete('/api/questions/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Question not found');
    });
  });

  describe('Localization and Translation Features', () => {
    it('should return questions with both English and German translations', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestionId}`)
        .expect(200);

      expect(response.body.data.question_text).toHaveProperty('en');
      expect(response.body.data.question_text).toHaveProperty('de');
      expect(response.body.data.answers[0].text).toHaveProperty('en');
      expect(response.body.data.answers[0].text).toHaveProperty('de');
      expect(response.body.data.explanation).toHaveProperty('en');
      expect(response.body.data.explanation).toHaveProperty('de');
    });

    it('should validate translation completeness', async () => {
      const incompleteData = {
        question_set_id: testQuestionSetId,
        question_text: {
          en: 'What is the capital of France?'
          // missing German translation
        },
        answers: [
          {
            text: { en: 'Paris', de: 'Paris' },
            correct: true
          },
          {
            text: { en: 'London', de: 'London' },
            correct: false
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('AI Question Generation Integration', () => {
    it('should support AI-generated question validation', async () => {
      const aiGeneratedData = {
        question_set_id: testQuestionSetId,
        question_text: {
          en: 'AI Generated: What is the square root of 16?',
          de: 'KI-generiert: Was ist die Quadratwurzel von 16?'
        },
        answers: [
          {
            text: { en: '3', de: '3' },
            correct: false
          },
          {
            text: { en: '4', de: '4' },
            correct: true
          },
          {
            text: { en: '5', de: '5' },
            correct: false
          }
        ],
        explanation: {
          en: 'The square root of 16 is 4 because 4 × 4 = 16',
          de: 'Die Quadratwurzel von 16 ist 4, weil 4 × 4 = 16'
        },
        difficulty: 2,
        source: 'ai_generated'
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(aiGeneratedData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('source', 'ai_generated');
    });
  });

  describe('Import/Export Functionality with File Processing', () => {
    it('should export question set successfully', async () => {
      const response = await request(app)
        .get(`/api/questions/question-sets/${testQuestionSetId}/export`)
        .expect(200);

      expect(response.body).toHaveProperty('questionSet');
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questionSet).toHaveProperty('id', testQuestionSetId);
      expect(response.body.questionSet).toHaveProperty('name', 'Test Question Set');
      expect(Array.isArray(response.body.questions)).toBe(true);
      expect(response.body.questions.length).toBeGreaterThan(0);
      
      // Verify exported data structure
      const question = response.body.questions[0];
      expect(question).toHaveProperty('question_text');
      expect(question).toHaveProperty('answers');
      expect(question).toHaveProperty('explanation');
      expect(question).toHaveProperty('difficulty');
    });

    it('should import question set successfully', async () => {
      const importData = {
        questionSet: {
          name: 'Imported Question Set',
          description: 'A question set imported from file',
          category: 'Imported Category',
          difficulty: 'hard'
        },
        questions: [
          {
            question_text: {
              en: 'What is the capital of Japan?',
              de: 'Was ist die Hauptstadt von Japan?'
            },
            answers: [
              {
                text: { en: 'Tokyo', de: 'Tokio' },
                correct: true
              },
              {
                text: { en: 'Kyoto', de: 'Kyoto' },
                correct: false
              },
              {
                text: { en: 'Osaka', de: 'Osaka' },
                correct: false
              }
            ],
            explanation: {
              en: 'Tokyo is the capital and largest city of Japan',
              de: 'Tokio ist die Hauptstadt und größte Stadt Japans'
            },
            difficulty: 1
          },
          {
            question_text: {
              en: 'What is the largest planet in our solar system?',
              de: 'Was ist der größte Planet in unserem Sonnensystem?'
            },
            answers: [
              {
                text: { en: 'Earth', de: 'Erde' },
                correct: false
              },
              {
                text: { en: 'Jupiter', de: 'Jupiter' },
                correct: true
              },
              {
                text: { en: 'Saturn', de: 'Saturn' },
                correct: false
              }
            ],
            explanation: {
              en: 'Jupiter is the largest planet in our solar system',
              de: 'Jupiter ist der größte Planet in unserem Sonnensystem'
            },
            difficulty: 2
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions/question-sets/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(importData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Question set imported successfully');
      expect(response.body).toHaveProperty('questionSetId');
      expect(response.body).toHaveProperty('questionsImported', 2);

      // Verify imported data in database
      const importedSetId = response.body.questionSetId;
      const setResult = await dbService.query(
        'SELECT * FROM question_sets WHERE id = $1',
        [importedSetId]
      );
      expect(setResult.rows[0]).toHaveProperty('name', 'Imported Question Set');

      const questionsResult = await dbService.query(
        'SELECT * FROM questions WHERE question_set_id = $1',
        [importedSetId]
      );
      expect(questionsResult.rows.length).toBe(2);
    });

    it('should handle import validation errors', async () => {
      const invalidImportData = {
        questionSet: {
          name: '', // Invalid: empty name
          description: 'A question set with invalid data',
          category: 'Test Category',
          difficulty: 'invalid_difficulty' // Invalid difficulty
        },
        questions: [
          {
            question_text: {
              en: 'What is 2 + 2?'
              // Missing German translation
            },
            answers: [
              {
                text: { en: '4', de: '4' },
                correct: true
              }
            ],
            explanation: {
              en: '2 + 2 = 4',
              de: '2 + 2 = 4'
            },
            difficulty: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions/question-sets/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidImportData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle large question set imports', async () => {
      const largeImportData = {
        questionSet: {
          name: 'Large Question Set',
          description: 'A large question set for testing import performance',
          category: 'Performance Test',
          difficulty: 'medium'
        },
        questions: Array.from({ length: 50 }, (_, i) => ({
          question_text: {
            en: `Question ${i + 1}: What is ${i + 1} + ${i + 1}?`,
            de: `Frage ${i + 1}: Was ist ${i + 1} + ${i + 1}?`
          },
          answers: [
            {
              text: { en: `${i + 1}`, de: `${i + 1}` },
              correct: false
            },
            {
              text: { en: `${(i + 1) * 2}`, de: `${(i + 1) * 2}` },
              correct: true
            },
            {
              text: { en: `${(i + 1) * 3}`, de: `${(i + 1) * 3}` },
              correct: false
            }
          ],
          explanation: {
            en: `${i + 1} + ${i + 1} = ${(i + 1) * 2}`,
            de: `${i + 1} + ${i + 1} = ${(i + 1) * 2}`
          },
          difficulty: (i % 3) + 1
        }))
      };

      const response = await request(app)
        .post('/api/questions/question-sets/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeImportData)
        .expect(201);

      expect(response.body).toHaveProperty('questionsImported', 50);
      expect(response.body).toHaveProperty('questionSetId');

      // Verify all questions were imported
      const questionsResult = await dbService.query(
        'SELECT COUNT(*) as count FROM questions WHERE question_set_id = $1',
        [response.body.questionSetId]
      );
      expect(parseInt(questionsResult.rows[0].count)).toBe(50);
    });

    it('should handle export of empty question set', async () => {
      // Create an empty question set
      const emptySetData = {
        name: 'Empty Question Set',
        description: 'A question set with no questions',
        category: 'Test Category',
        difficulty: 'easy',
        is_active: true
      };

      const emptySetResponse = await request(app)
        .post('/api/questions/sets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(emptySetData);

      const emptySetId = emptySetResponse.body.data.id;

      const response = await request(app)
        .get(`/api/questions/question-sets/${emptySetId}/export`)
        .expect(200);

      expect(response.body).toHaveProperty('questionSet');
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questionSet).toHaveProperty('id', emptySetId);
      expect(response.body.questions).toEqual([]);
    });
  });

  describe('Pagination and Filtering', () => {
    beforeEach(async () => {
      // Create additional test questions for pagination testing
      for (let i = 0; i < 5; i++) {
        const questionData = {
          question_set_id: testQuestionSetId,
          question_text: {
            en: `Test question ${i + 1}`,
            de: `Testfrage ${i + 1}`
          },
          answers: [
            {
              text: { en: 'Answer A', de: 'Antwort A' },
              correct: false
            },
            {
              text: { en: 'Answer B', de: 'Antwort B' },
              correct: true
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
    });

    it('should support pagination for question sets', async () => {
      const response = await request(app)
        .get('/api/questions/sets?page=1&limit=2')
        .expect(200);

      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 2);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
    });

    it('should filter questions by difficulty', async () => {
      const response = await request(app)
        .get(`/api/questions/sets/${testQuestionSetId}/questions?difficulty=1`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All returned questions should have difficulty 1
      response.body.data.forEach((question: any) => {
        expect(question.difficulty).toBe(1);
      });
    });

    it('should sort questions by difficulty', async () => {
      const response = await request(app)
        .get(`/api/questions/sets/${testQuestionSetId}/questions?sortBy=difficulty&sortOrder=asc`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Questions should be sorted by difficulty in ascending order
      for (let i = 1; i < response.body.data.length; i++) {
        expect(response.body.data[i].difficulty).toBeGreaterThanOrEqual(response.body.data[i - 1].difficulty);
      }
    });
  });
}); 