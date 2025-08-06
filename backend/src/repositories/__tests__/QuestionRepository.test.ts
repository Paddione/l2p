import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { QueryResult, QueryResultRow } from 'pg';
import { QuestionRepository } from '../QuestionRepository';
import { DatabaseService } from '../../services/DatabaseService';
import { BaseRepository } from '../BaseRepository';

// Define types for test data
interface LocalizedText {
  en: string;
  de: string;
}

interface Answer {
  text: LocalizedText;
  correct: boolean;
}

interface Question {
  id: number;
  question_set_id: number;
  question_text: LocalizedText;
  answers: Answer[];
  explanation?: LocalizedText;
  difficulty: number;
  created_at: Date;
}

interface QuestionSet {
  id: number;
  name: string;
  description?: string;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  is_active: boolean;
  owner_id?: number;
  is_public: boolean;
  is_featured: boolean;
  tags: string[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
}

// Mock the DatabaseService
export const mockQuery = jest.fn<Promise<QueryResult<QueryResultRow>>, any[]>();

// Mock the BaseRepository to avoid actual database calls
export const mockBaseRepository = {
  findById: jest.fn<Promise<any>, [number]>(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  count: jest.fn()
};

jest.mock('../BaseRepository', () => ({
  BaseRepository: jest.fn().mockImplementation(() => mockBaseRepository)
}));

// Mock the DatabaseService
export const mockDatabaseService = {
  query: mockQuery,
  getInstance: jest.fn()
};

jest.mock('../../services/DatabaseService', () => ({
  DatabaseService: jest.fn().mockImplementation(() => mockDatabaseService)
}));

// Helper function to create mock query results
const createMockQueryResult = <T extends QueryResultRow>(rows: T[]): QueryResult<T> => ({
  rows,
  rowCount: rows.length,
  command: 'SELECT',
  oid: 0,
  fields: []
});

// Helper function to create localized text
const createLocalizedText = (en: string, de: string): LocalizedText => ({
  en,
  de
});

// Define DTO types for creation/update
interface CreateQuestionSetData {
  name: string;
  description?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  is_active?: boolean;
  owner_id?: number;
  is_public?: boolean;
  is_featured?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface CreateQuestionData {
  question_set_id: number;
  question_text: LocalizedText;
  answers: Answer[];
  explanation?: LocalizedText;
  difficulty?: number;
}

interface CreateAnswerData {
  text: LocalizedText;
  correct: boolean;
}

interface CreateQuestionSetPermissionData {
  question_set_id: number;
  user_id: number;
  permission_type: 'read' | 'write' | 'admin';
  granted_by?: number;
}

interface CreateQuestionSetVersionData {
  question_set_id: number;
  version_number: number;
  changes: Record<string, any>;
  created_by?: number;
}

// Define additional types for test data
interface QuestionSetPermission {
  id: number;
  question_set_id: number;
  user_id: number;
  permission_type: 'read' | 'write' | 'admin';
  granted_at: Date;
  granted_by?: number;
}

interface QuestionSetVersion {
  id: number;
  question_set_id: number;
  version_number: number;
  changes: Record<string, any>;
  created_by?: number;
  created_at: Date;
}

// Mock data
export const mockQuestionSet: QuestionSet = {
  id: 1,
  name: 'Test Question Set',
  description: 'Test Description',
  category: 'Math',
  difficulty: 'easy',
  is_active: true,
  is_public: true,
  is_featured: false,
  tags: ['math', 'basic'],
  metadata: {},
  created_at: new Date(),
  updated_at: new Date(),
  created_by: 1
};

export const mockAnswer: Answer = {
  text: createLocalizedText('4', 'Vier'),
  correct: true
};

export const mockQuestion: Question = {
  id: 1,
  question_set_id: 1,
  question_text: createLocalizedText('What is 2+2?', 'Was ist 2+2?'),
  answers: [mockAnswer],
  explanation: createLocalizedText('Basic addition', 'Einfache Addition'),
  difficulty: 1,
  created_at: new Date()
};

// Extended mock data with relationships
interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

interface QuestionSetWithQuestions extends QuestionSet {
  questions: QuestionWithAnswers[];
}

export const mockQuestionWithAnswers: QuestionWithAnswers = {
  ...mockQuestion,
  answers: [mockAnswer]
};

export const mockQuestionSetWithQuestions: QuestionSetWithQuestions = {
  ...mockQuestionSet,
  questions: [mockQuestionWithAnswers]
};

export const mockQuestionSetPermission: QuestionSetPermission = {
  id: 1,
  question_set_id: 1,
  user_id: 1,
  permission_type: 'read',
  granted_at: new Date(),
  granted_by: 1
};

export const mockQuestionSetVersion: QuestionSetVersion = {
  id: 1,
  question_set_id: 1,
  version_number: 1,
  changes: { description: 'Initial version' },
  created_at: new Date(),
  created_by: 1
};

// Mock data for creation
export const mockCreateQuestionSetData: CreateQuestionSetData = {
  name: createLocalizedText('New Question Set', 'Neuer Fragensatz'),
  description: createLocalizedText('New Description', 'Neue Beschreibung'),
  created_by: 1,
  is_public: true
};

export const mockCreateQuestionData: CreateQuestionData = {
  question_set_id: 1,
  question_text: createLocalizedText('New Question', 'Neue Frage'),
  answers: [{
    text: createLocalizedText('Answer', 'Antwort'),
    correct: true
  }],
  explanation: createLocalizedText('Explanation', 'Erklärung'),
  difficulty: 1
};

export const mockCreateAnswerData: CreateAnswerData = {
  text: createLocalizedText('New Answer', 'Neue Antwort'),
  correct: true
};

export const mockCreateQuestionSetPermissionData: CreateQuestionSetPermissionData = {
  question_set_id: 1,
  user_id: 2,
  permission_type: 'read',
  granted_by: 1
};

export const mockCreateQuestionSetVersionData: CreateQuestionSetVersionData = {
  question_set_id: 1,
  version_number: 1,
  changes: { description: 'Initial version' },
  created_by: 1
};

describe('QuestionRepository', () => {
  let questionRepository: QuestionRepository;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of the repository for each test
    questionRepository = new QuestionRepository();
    
    // Setup default mock implementations with proper typing
    mockBaseRepository.findById.mockImplementation(async (id: number) => 
      id === mockQuestionSetWithQuestions.id ? mockQuestionSetWithQuestions : null
    );
    
    mockBaseRepository.create.mockImplementation(async <T>(data: T) => 
      ({ ...data, id: 1 } as any)
    );
    
    mockBaseRepository.update.mockImplementation(async (id: number, data: any) => 
      ({ ...mockQuestionSetWithQuestions, ...data })
    );
    
    mockBaseRepository.delete.mockResolvedValue(true);
    mockBaseRepository.exists.mockResolvedValue(true);
    mockBaseRepository.count.mockResolvedValue(1);
    
    // Setup default query mock with proper typing
    mockQuery.mockImplementation(async (): Promise<QueryResult<QueryResultRow>> => ({
      rows: [mockQuestionSetWithQuestions as unknown as QueryResultRow],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    }));
  });

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
  });

  describe('Question Set Methods', () => {
    describe('findQuestionSetById', () => {
      it('should return a question set with questions and answers', async () => {
        // Mock the base repository to return the test question set
        mockBaseRepository.findById.mockResolvedValueOnce(mockQuestionSetWithQuestions);

        const result = await questionRepository.findQuestionSetById(1);

        expect(result).toEqual(mockQuestionSetWithQuestions);
        expect(mockBaseRepository.findById).toHaveBeenCalledWith(1);
      });

      it('should return null if no question set is found', async () => {
        // Mock the base repository to return null
        mockBaseRepository.findById.mockResolvedValueOnce(null);

        const result = await questionRepository.findQuestionSetById(999);

        expect(result).toBeNull();
        expect(mockBaseRepository.findById).toHaveBeenCalledWith(999);
      });

      it('should handle database errors', async () => {
        // Mock the base repository to throw an error
        const testError = new Error('Database error');
        mockBaseRepository.findById.mockRejectedValueOnce(testError);

        await expect(questionRepository.findQuestionSetById(1)).rejects.toThrow(testError);
      });

      it('should return null when question set not found', async () => {
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(null);

        const result = await questionRepository.findQuestionSetById(999);

        expect(mockFindById).toHaveBeenCalledWith('question_sets', 999);
        expect(result).toBeNull();
      });
    });

    describe('findAllQuestionSets', () => {
      it('should find all active question sets by default', async () => {
        const mockQuestionSets = [mockQuestionSet];
        mockDb.query.mockResolvedValue({ rows: mockQuestionSets });

        const result = await questionRepository.findAllQuestionSets();

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_sets WHERE 1=1 AND is_active = $1 ORDER BY is_featured DESC, name',
          [true]
        );
        expect(result).toEqual(mockQuestionSets);
      });

      it('should find all question sets including inactive when activeOnly is false', async () => {
        const mockQuestionSets = [mockQuestionSet];
        mockDb.query.mockResolvedValue({ rows: mockQuestionSets });

        const result = await questionRepository.findAllQuestionSets(false);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_sets WHERE 1=1 ORDER BY is_featured DESC, name',
          []
        );
        expect(result).toEqual(mockQuestionSets);
      });

      it('should find only public question sets when publicOnly is true', async () => {
        const mockQuestionSets = [mockQuestionSet];
        mockDb.query.mockResolvedValue({ rows: mockQuestionSets });

        const result = await questionRepository.findAllQuestionSets(true, true);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_sets WHERE 1=1 AND is_active = $1 AND is_public = $2 ORDER BY is_featured DESC, name',
          [true, true]
        );
        expect(result).toEqual(mockQuestionSets);
      });
    });

    describe('createQuestionSet', () => {
      it('should create question set with provided data', async () => {
        const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
        mockCreate.mockResolvedValue(mockQuestionSet);

        const result = await questionRepository.createQuestionSet(mockCreateQuestionSetData);

        expect(mockCreate).toHaveBeenCalledWith('question_sets', {
          ...mockCreateQuestionSetData,
          difficulty: 'easy',
          is_active: true,
          is_public: true,
          is_featured: false,
          tags: ['math', 'basic'],
          metadata: { level: 'beginner' }
        });
        expect(result).toEqual(mockQuestionSet);
      });

      it('should create question set with default values when optional fields are missing', async () => {
        const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
        mockCreate.mockResolvedValue(mockQuestionSet);

        const minimalData = { name: 'Test Quiz' };
        await questionRepository.createQuestionSet(minimalData);

        expect(mockCreate).toHaveBeenCalledWith('question_sets', {
          name: 'Test Quiz',
          difficulty: 'medium',
          is_active: true,
          is_public: true,
          is_featured: false,
          tags: [],
          metadata: {}
        });
      });
    });

    describe('updateQuestionSet', () => {
      it('should update question set successfully', async () => {
        const mockUpdate = jest.spyOn(BaseRepository.prototype, 'update');
        mockUpdate.mockResolvedValue(mockQuestionSet);

        const updateData = { name: 'Updated Quiz' };
        const result = await questionRepository.updateQuestionSet(1, updateData);

        expect(mockUpdate).toHaveBeenCalledWith('question_sets', 1, updateData);
        expect(result).toEqual(mockQuestionSet);
      });

      it('should return null when question set to update not found', async () => {
        const mockUpdate = jest.spyOn(BaseRepository.prototype, 'update');
        mockUpdate.mockResolvedValue(null);

        const result = await questionRepository.updateQuestionSet(999, { name: 'Updated Quiz' });

        expect(mockUpdate).toHaveBeenCalledWith('question_sets', 999, { name: 'Updated Quiz' });
        expect(result).toBeNull();
      });
    });

    describe('deleteQuestionSet', () => {
      it('should delete question set successfully', async () => {
        const mockDelete = jest.spyOn(BaseRepository.prototype, 'delete');
        mockDelete.mockResolvedValue(true);

        const result = await questionRepository.deleteQuestionSet(1);

        expect(mockDelete).toHaveBeenCalledWith('question_sets', 1);
        expect(result).toBe(true);
      });

      it('should return false when question set to delete not found', async () => {
        const mockDelete = jest.spyOn(BaseRepository.prototype, 'delete');
        mockDelete.mockResolvedValue(false);

        const result = await questionRepository.deleteQuestionSet(999);

        expect(mockDelete).toHaveBeenCalledWith('question_sets', 999);
        expect(result).toBe(false);
      });
    });

    describe('findQuestionSetsByCategory', () => {
      it('should find question sets by category', async () => {
        const mockQuestionSets = [mockQuestionSet];
        mockDb.query.mockResolvedValue({ rows: mockQuestionSets });

        const result = await questionRepository.findQuestionSetsByCategory('geography');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_sets WHERE category = $1 AND is_active = true ORDER BY name',
          ['geography']
        );
        expect(result).toEqual(mockQuestionSets);
      });

      it('should return empty array when no question sets found for category', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await questionRepository.findQuestionSetsByCategory('nonexistent');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_sets WHERE category = $1 AND is_active = true ORDER BY name',
          ['nonexistent']
        );
        expect(result).toEqual([]);
      });
    });

    describe('findQuestionSetsByOwner', () => {
      it('should find question sets by owner id', async () => {
        const mockQuestionSets = [mockQuestionSet];
        mockDb.query.mockResolvedValue({ rows: mockQuestionSets });

        const result = await questionRepository.findQuestionSetsByOwner(1);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_sets WHERE owner_id = $1 ORDER BY updated_at DESC',
          [1]
        );
        expect(result).toEqual(mockQuestionSets);
      });
    });

    describe('findPublicQuestionSets', () => {
      it('should find all public and active question sets', async () => {
        const mockQuestionSets = [mockQuestionSet];
        mockDb.query.mockResolvedValue({ rows: mockQuestionSets });

        const result = await questionRepository.findPublicQuestionSets();

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_sets WHERE is_public = true AND is_active = true ORDER BY is_featured DESC, name',
          []
        );
        expect(result).toEqual(mockQuestionSets);
      });
    });

    describe('findFeaturedQuestionSets', () => {
      it('should find all featured and active question sets', async () => {
        const mockQuestionSets = [mockQuestionSet];
        mockDb.query.mockResolvedValue({ rows: mockQuestionSets });

        const result = await questionRepository.findFeaturedQuestionSets();

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_sets WHERE is_featured = true AND is_active = true ORDER BY name',
          []
        );
        expect(result).toEqual(mockQuestionSets);
      });
    });

    describe('searchQuestionSets', () => {
      it('should search question sets by term for public access', async () => {
        const mockQuestionSets = [mockQuestionSet];
        mockDb.query.mockResolvedValue({ rows: mockQuestionSets });

        const result = await questionRepository.searchQuestionSets('geography');

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('WHERE (qs.name ILIKE $1 OR qs.description ILIKE $1 OR qs.category ILIKE $1)'),
          ['%geography%']
        );
        expect(result).toEqual(mockQuestionSets);
      });

      it('should search question sets by term with user access', async () => {
        const mockQuestionSets = [mockQuestionSet];
        mockDb.query.mockResolvedValue({ rows: mockQuestionSets });

        const result = await questionRepository.searchQuestionSets('geography', 1);

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('AND (qs.is_public = true OR qs.owner_id = $2 OR qsp.user_id = $2)'),
          ['%geography%', 1]
        );
        expect(result).toEqual(mockQuestionSets);
      });
    });
  });

  describe('Question Methods', () => {
    describe('findQuestionById', () => {
      it('should find question by id successfully', async () => {
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(mockQuestion);

        const result = await questionRepository.findQuestionById(1);

        expect(mockFindById).toHaveBeenCalledWith('questions', 1);
        expect(result).toEqual(mockQuestion);
      });

      it('should return null when question not found', async () => {
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(null);

        const result = await questionRepository.findQuestionById(999);

        expect(mockFindById).toHaveBeenCalledWith('questions', 999);
        expect(result).toBeNull();
      });
    });

    describe('findQuestionsBySetId', () => {
      it('should find questions by question set id', async () => {
        const mockQuestions = [mockQuestion];
        mockDb.query.mockResolvedValue({ rows: mockQuestions });

        const result = await questionRepository.findQuestionsBySetId(1);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM questions WHERE question_set_id = $1 ORDER BY id',
          [1]
        );
        expect(result).toEqual(mockQuestions);
      });

      it('should return empty array when no questions found for set', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await questionRepository.findQuestionsBySetId(999);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM questions WHERE question_set_id = $1 ORDER BY id',
          [999]
        );
        expect(result).toEqual([]);
      });
    });

    describe('createQuestion', () => {
      it('should create question with provided data', async () => {
        const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
        mockCreate.mockResolvedValue(mockQuestion);

        const result = await questionRepository.createQuestion(mockCreateQuestionData);

        expect(mockCreate).toHaveBeenCalledWith('questions', {
          ...mockCreateQuestionData,
          difficulty: 1
        });
        expect(result).toEqual(mockQuestion);
      });

      it('should create question with default difficulty when not provided', async () => {
        const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
        mockCreate.mockResolvedValue(mockQuestion);

        const dataWithoutDifficulty = {
          question_set_id: 1,
          question_text: { en: 'Test', de: 'Test' },
          answers: []
        };

        await questionRepository.createQuestion(dataWithoutDifficulty);

        expect(mockCreate).toHaveBeenCalledWith('questions', {
          ...dataWithoutDifficulty,
          difficulty: 1
        });
      });
    });

    describe('updateQuestion', () => {
      it('should update question successfully', async () => {
        const mockUpdate = jest.spyOn(BaseRepository.prototype, 'update');
        mockUpdate.mockResolvedValue(mockQuestion);

        const updateData = { difficulty: 2 };
        const result = await questionRepository.updateQuestion(1, updateData);

        expect(mockUpdate).toHaveBeenCalledWith('questions', 1, updateData);
        expect(result).toEqual(mockQuestion);
      });

      it('should return null when question to update not found', async () => {
        const mockUpdate = jest.spyOn(BaseRepository.prototype, 'update');
        mockUpdate.mockResolvedValue(null);

        const result = await questionRepository.updateQuestion(999, { difficulty: 2 });

        expect(mockUpdate).toHaveBeenCalledWith('questions', 999, { difficulty: 2 });
        expect(result).toBeNull();
      });
    });

    describe('deleteQuestion', () => {
      it('should delete question successfully', async () => {
        const mockDelete = jest.spyOn(BaseRepository.prototype, 'delete');
        mockDelete.mockResolvedValue(true);

        const result = await questionRepository.deleteQuestion(1);

        expect(mockDelete).toHaveBeenCalledWith('questions', 1);
        expect(result).toBe(true);
      });

      it('should return false when question to delete not found', async () => {
        const mockDelete = jest.spyOn(BaseRepository.prototype, 'delete');
        mockDelete.mockResolvedValue(false);

        const result = await questionRepository.deleteQuestion(999);

        expect(mockDelete).toHaveBeenCalledWith('questions', 999);
        expect(result).toBe(false);
      });
    });

    describe('getRandomQuestions', () => {
      it('should get random questions from multiple question sets', async () => {
        const mockQuestions = [mockQuestion];
        mockDb.query.mockResolvedValue({ rows: mockQuestions });

        const result = await questionRepository.getRandomQuestions([1, 2, 3], 5);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM questions \n       WHERE question_set_id IN ($2, $3, $4)\n       ORDER BY RANDOM() \n       LIMIT $1',
          [5, 1, 2, 3]
        );
        expect(result).toEqual(mockQuestions);
      });

      it('should get random questions from single question set', async () => {
        const mockQuestions = [mockQuestion];
        mockDb.query.mockResolvedValue({ rows: mockQuestions });

        const result = await questionRepository.getRandomQuestions([1], 3);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM questions \n       WHERE question_set_id IN ($2)\n       ORDER BY RANDOM() \n       LIMIT $1',
          [3, 1]
        );
        expect(result).toEqual(mockQuestions);
      });
    });

    describe('getQuestionsByDifficulty', () => {
      it('should get questions by difficulty level', async () => {
        const mockQuestions = [mockQuestion];
        mockDb.query.mockResolvedValue({ rows: mockQuestions });

        const result = await questionRepository.getQuestionsByDifficulty(1, 2);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM questions WHERE question_set_id = $1 AND difficulty = $2 ORDER BY id',
          [1, 2]
        );
        expect(result).toEqual(mockQuestions);
      });
    });

    describe('getQuestionCount', () => {
      it('should get total question count for specific question set', async () => {
        const mockCount = jest.spyOn(BaseRepository.prototype, 'count');
        mockCount.mockResolvedValue(10);

        const result = await questionRepository.getQuestionCount(1);

        expect(mockCount).toHaveBeenCalledWith('questions', 'question_set_id = $1', [1]);
        expect(result).toBe(10);
      });

      it('should get total question count for all question sets', async () => {
        const mockCount = jest.spyOn(BaseRepository.prototype, 'count');
        mockCount.mockResolvedValue(50);

        const result = await questionRepository.getQuestionCount();

        expect(mockCount).toHaveBeenCalledWith('questions');
        expect(result).toBe(50);
      });
    });

    describe('getQuestionSetCount', () => {
      it('should get count of active question sets by default', async () => {
        const mockCount = jest.spyOn(BaseRepository.prototype, 'count');
        mockCount.mockResolvedValue(5);

        const result = await questionRepository.getQuestionSetCount();

        expect(mockCount).toHaveBeenCalledWith('question_sets', 'is_active = $1', [true]);
        expect(result).toBe(5);
      });

      it('should get count of all question sets when activeOnly is false', async () => {
        const mockCount = jest.spyOn(BaseRepository.prototype, 'count');
        mockCount.mockResolvedValue(8);

        const result = await questionRepository.getQuestionSetCount(false);

        expect(mockCount).toHaveBeenCalledWith('question_sets');
        expect(result).toBe(8);
      });
    });

    describe('searchQuestions', () => {
      it('should search questions by term in both languages', async () => {
        const mockQuestions = [mockQuestion];
        mockDb.query.mockResolvedValue({ rows: mockQuestions });

        const result = await questionRepository.searchQuestions('capital');

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining("WHERE (question_text->>'en' ILIKE $1 OR question_text->>'de' ILIKE $1)"),
          ['%capital%']
        );
        expect(result).toEqual(mockQuestions);
      });

      it('should search questions by term within specific question set', async () => {
        const mockQuestions = [mockQuestion];
        mockDb.query.mockResolvedValue({ rows: mockQuestions });

        const result = await questionRepository.searchQuestions('capital', 1);

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('AND question_set_id = $2'),
          ['%capital%', 1]
        );
        expect(result).toEqual(mockQuestions);
      });
    });

    describe('getQuestionsWithAnswerCount', () => {
      it('should get questions with their answer counts', async () => {
        const mockQuestionsWithCount = [{ ...mockQuestion, answer_count: 4 }];
        mockDb.query.mockResolvedValue({ rows: mockQuestionsWithCount });

        const result = await questionRepository.getQuestionsWithAnswerCount();

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('jsonb_array_length(answers) as answer_count')
        );
        expect(result).toEqual(mockQuestionsWithCount);
      });
    });

    describe('validateQuestionStructure', () => {
      it('should validate correct question structure', async () => {
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(mockQuestion);

        const result = await questionRepository.validateQuestionStructure(1);

        expect(mockFindById).toHaveBeenCalledWith('questions', 1);
        expect(result).toBe(true);
      });

      it('should return false when question not found', async () => {
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(null);

        const result = await questionRepository.validateQuestionStructure(999);

        expect(result).toBe(false);
      });

      it('should return false when question text is missing English translation', async () => {
        const invalidQuestion = {
          ...mockQuestion,
          question_text: { en: '', de: 'German text' }
        };
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(invalidQuestion);

        const result = await questionRepository.validateQuestionStructure(1);

        expect(result).toBe(false);
      });

      it('should return false when question text is missing German translation', async () => {
        const invalidQuestion = {
          ...mockQuestion,
          question_text: { en: 'English text', de: '' }
        };
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(invalidQuestion);

        const result = await questionRepository.validateQuestionStructure(1);

        expect(result).toBe(false);
      });

      it('should return false when question has less than 2 answers', async () => {
        const invalidQuestion = {
          ...mockQuestion,
          answers: [{ text: { en: 'Only answer', de: 'Einzige Antwort' }, correct: true }]
        };
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(invalidQuestion);

        const result = await questionRepository.validateQuestionStructure(1);

        expect(result).toBe(false);
      });

      it('should return false when no correct answer exists', async () => {
        const invalidQuestion = {
          ...mockQuestion,
          answers: [
            { text: { en: 'Wrong 1', de: 'Falsch 1' }, correct: false },
            { text: { en: 'Wrong 2', de: 'Falsch 2' }, correct: false }
          ]
        };
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(invalidQuestion);

        const result = await questionRepository.validateQuestionStructure(1);

        expect(result).toBe(false);
      });

      it('should return false when answer is missing localized text', async () => {
        const invalidQuestion = {
          ...mockQuestion,
          answers: [
            { text: { en: 'Good answer', de: 'Gute Antwort' }, correct: true },
            { text: { en: '', de: 'Missing English' }, correct: false }
          ]
        };
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(invalidQuestion);

        const result = await questionRepository.validateQuestionStructure(1);

        expect(result).toBe(false);
      });
    });
  });

  describe('Question Set Permissions Methods', () => {
    describe('findQuestionSetPermissions', () => {
      it('should find permissions for a question set', async () => {
        const mockPermissions = [mockQuestionSetPermission];
        mockDb.query.mockResolvedValue({ rows: mockPermissions });

        const result = await questionRepository.findQuestionSetPermissions(1);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_set_permissions WHERE question_set_id = $1 ORDER BY granted_at DESC',
          [1]
        );
        expect(result).toEqual(mockPermissions);
      });
    });

    describe('findUserQuestionSetPermissions', () => {
      it('should find permissions for a user', async () => {
        const mockPermissions = [mockQuestionSetPermission];
        mockDb.query.mockResolvedValue({ rows: mockPermissions });

        const result = await questionRepository.findUserQuestionSetPermissions(2);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_set_permissions WHERE user_id = $1 ORDER BY granted_at DESC',
          [2]
        );
        expect(result).toEqual(mockPermissions);
      });
    });

    describe('createQuestionSetPermission', () => {
      it('should create question set permission', async () => {
        const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
        mockCreate.mockResolvedValue(mockQuestionSetPermission);

        const result = await questionRepository.createQuestionSetPermission(mockCreateQuestionSetPermissionData);

        expect(mockCreate).toHaveBeenCalledWith('question_set_permissions', mockCreateQuestionSetPermissionData);
        expect(result).toEqual(mockQuestionSetPermission);
      });
    });

    describe('updateQuestionSetPermission', () => {
      it('should update question set permission', async () => {
        const mockUpdate = jest.spyOn(BaseRepository.prototype, 'update');
        mockUpdate.mockResolvedValue(mockQuestionSetPermission);

        const updateData = { permission_type: 'write' as const };
        const result = await questionRepository.updateQuestionSetPermission(1, updateData);

        expect(mockUpdate).toHaveBeenCalledWith('question_set_permissions', 1, updateData);
        expect(result).toEqual(mockQuestionSetPermission);
      });
    });

    describe('deleteQuestionSetPermission', () => {
      it('should delete question set permission', async () => {
        const mockDelete = jest.spyOn(BaseRepository.prototype, 'delete');
        mockDelete.mockResolvedValue(true);

        const result = await questionRepository.deleteQuestionSetPermission(1);

        expect(mockDelete).toHaveBeenCalledWith('question_set_permissions', 1);
        expect(result).toBe(true);
      });
    });

    describe('checkUserPermission', () => {
      it('should return true when user has required permission', async () => {
        mockDb.query.mockResolvedValue({ rows: [mockQuestionSetPermission] });

        const result = await questionRepository.checkUserPermission(1, 2, 'read');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_set_permissions WHERE question_set_id = $1 AND user_id = $2 AND permission_type = $3',
          [1, 2, 'read']
        );
        expect(result).toBe(true);
      });

      it('should return false when user does not have required permission', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await questionRepository.checkUserPermission(1, 2, 'admin');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_set_permissions WHERE question_set_id = $1 AND user_id = $2 AND permission_type = $3',
          [1, 2, 'admin']
        );
        expect(result).toBe(false);
      });
    });

    describe('findAccessibleQuestionSets', () => {
      it('should find question sets accessible to user', async () => {
        const mockQuestionSets = [mockQuestionSet];
        mockDb.query.mockResolvedValue({ rows: mockQuestionSets });

        const result = await questionRepository.findAccessibleQuestionSets(1);

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('WHERE qs.is_public = true'),
          [1]
        );
        expect(result).toEqual(mockQuestionSets);
      });
    });
  });

  describe('Question Set Versioning Methods', () => {
    describe('findQuestionSetVersions', () => {
      it('should find all versions for a question set', async () => {
        const mockVersions = [mockQuestionSetVersion];
        mockDb.query.mockResolvedValue({ rows: mockVersions });

        const result = await questionRepository.findQuestionSetVersions(1);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_set_versions WHERE question_set_id = $1 ORDER BY version_number DESC',
          [1]
        );
        expect(result).toEqual(mockVersions);
      });
    });

    describe('findQuestionSetVersion', () => {
      it('should find specific version of question set', async () => {
        mockDb.query.mockResolvedValue({ rows: [mockQuestionSetVersion] });

        const result = await questionRepository.findQuestionSetVersion(1, 1);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM question_set_versions WHERE question_set_id = $1 AND version_number = $2',
          [1, 1]
        );
        expect(result).toEqual(mockQuestionSetVersion);
      });

      it('should return null when version not found', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await questionRepository.findQuestionSetVersion(1, 999);

        expect(result).toBeNull();
      });
    });

    describe('createQuestionSetVersion', () => {
      it('should create new question set version', async () => {
        const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
        mockCreate.mockResolvedValue(mockQuestionSetVersion);

        const result = await questionRepository.createQuestionSetVersion(mockCreateQuestionSetVersionData);

        expect(mockCreate).toHaveBeenCalledWith('question_set_versions', mockCreateQuestionSetVersionData);
        expect(result).toEqual(mockQuestionSetVersion);
      });
    });

    describe('getNextVersionNumber', () => {
      it('should get next version number for question set', async () => {
        mockDb.query.mockResolvedValue({ rows: [{ max_version: 3 }] });

        const result = await questionRepository.getNextVersionNumber(1);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT COALESCE(MAX(version_number), 0) + 1 as max_version FROM question_set_versions WHERE question_set_id = $1',
          [1]
        );
        expect(result).toBe(3);
      });

      it('should return 1 when no versions exist', async () => {
        mockDb.query.mockResolvedValue({ rows: [{ max_version: null }] });

        const result = await questionRepository.getNextVersionNumber(1);

        expect(result).toBe(1);
      });

      it('should return 1 when query returns undefined result', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await questionRepository.getNextVersionNumber(1);

        expect(result).toBe(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(questionRepository.findAllQuestionSets()).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid query parameters', async () => {
      mockDb.query.mockRejectedValue(new Error('Invalid query parameters'));

      await expect(questionRepository.searchQuestions('')).rejects.toThrow('Invalid query parameters');
    });

    it('should handle malformed data in create operations', async () => {
      const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
      mockCreate.mockRejectedValue(new Error('Invalid data format'));

      await expect(questionRepository.createQuestionSet({} as any)).rejects.toThrow('Invalid data format');
    });
  });

  describe('Integration with BaseRepository', () => {
    it('should call inherited findById method correctly', async () => {
      const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
      mockFindById.mockResolvedValue(mockQuestion);

      await questionRepository.findQuestionById(1);

      expect(mockFindById).toHaveBeenCalledWith('questions', 1);
    });

    it('should call inherited create method correctly', async () => {
      const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
      mockCreate.mockResolvedValue(mockQuestionSet);

      await questionRepository.createQuestionSet(mockCreateQuestionSetData);

      expect(mockCreate).toHaveBeenCalledWith('question_sets', expect.any(Object));
    });

    it('should call inherited update method correctly', async () => {
      const mockUpdate = jest.spyOn(BaseRepository.prototype, 'update');
      mockUpdate.mockResolvedValue(mockQuestion);

      await questionRepository.updateQuestion(1, { difficulty: 2 });

      expect(mockUpdate).toHaveBeenCalledWith('questions', 1, { difficulty: 2 });
    });

    it('should call inherited delete method correctly', async () => {
      const mockDelete = jest.spyOn(BaseRepository.prototype, 'delete');
      mockDelete.mockResolvedValue(true);

      await questionRepository.deleteQuestion(1);

      expect(mockDelete).toHaveBeenCalledWith('questions', 1);
    });

    it('should call inherited count method correctly', async () => {
      const mockCount = jest.spyOn(BaseRepository.prototype, 'count');
      mockCount.mockResolvedValue(10);

      await questionRepository.getQuestionCount(1);

      expect(mockCount).toHaveBeenCalledWith('questions', 'question_set_id = $1', [1]);
    });
  });
}); 