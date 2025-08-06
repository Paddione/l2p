import { GeminiService, QuestionGenerationRequest, GeneratedQuestion, QuestionGenerationResult } from '../GeminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the dependencies
jest.mock('@google/generative-ai');

describe('GeminiService', () => {
  let geminiService: GeminiService;
  let mockGoogleGenerativeAI: jest.Mocked<GoogleGenerativeAI>;
  let mockModel: any;
  let mockResult: any;
  let mockResponse: any;

  // Test data
  const mockQuestionGenerationRequest: QuestionGenerationRequest = {
    topic: 'JavaScript Fundamentals',
    category: 'Programming',
    difficulty: 'medium',
    questionCount: 2,
    language: 'en',
    contextSource: 'manual',
    manualContext: 'JavaScript closures and programming fundamentals'
  };

  const mockGeneratedQuestions: GeneratedQuestion[] = [
    {
      questionText: {
        en: 'What is a closure in JavaScript?',
        de: 'Was ist eine Closure in JavaScript?'
      },
      answers: [
        {
          text: {
            en: 'A function that has access to outer scope variables',
            de: 'Eine Funktion, die Zugriff auf äußere Bereichsvariablen hat'
          },
          correct: true
        },
        {
          text: {
            en: 'A way to close browser windows',
            de: 'Eine Möglichkeit, Browserfenster zu schließen'
          },
          correct: false
        },
        {
          text: {
            en: 'A type of loop',
            de: 'Eine Art von Schleife'
          },
          correct: false
        },
        {
          text: {
            en: 'A CSS property',
            de: 'Eine CSS-Eigenschaft'
          },
          correct: false
        }
      ],
      explanation: {
        en: 'A closure is a function that has access to variables in its outer scope',
        de: 'Eine Closure ist eine Funktion, die Zugriff auf Variablen in ihrem äußeren Bereich hat'
      },
      difficulty: 3
    }
  ];

  const mockValidJsonResponse = JSON.stringify(mockGeneratedQuestions);

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Setup GoogleGenerativeAI mock
    mockGoogleGenerativeAI = new GoogleGenerativeAI('test-api-key') as jest.Mocked<GoogleGenerativeAI>;
    mockModel = {
      generateContent: jest.fn()
    };
    mockResult = {
      response: Promise.resolve(mockResponse)
    };
    mockResponse = {
      text: jest.fn().mockReturnValue(mockValidJsonResponse)
    };

    mockGoogleGenerativeAI.getGenerativeModel = jest.fn().mockReturnValue(mockModel);
    mockModel.generateContent = jest.fn().mockReturnValue(mockResult);

    // Create GeminiService instance
    geminiService = new GeminiService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateQuestions', () => {
    it('should generate questions successfully with manual context', async () => {
      // Arrange
      const request: QuestionGenerationRequest = {
        ...mockQuestionGenerationRequest,
        contextSource: 'manual',
        manualContext: 'JavaScript programming fundamentals'
      };

      // Act
      const result = await geminiService.generateQuestions(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].questionText.en).toBe('What is a closure in JavaScript?');
      expect(result.questions[0].answers).toHaveLength(4);
      expect(result.questions[0].answers.filter(a => a.correct)).toHaveLength(1);
      expect(result.metadata.topic).toBe('JavaScript Fundamentals');
      expect(result.metadata.category).toBe('Programming');
      expect(result.metadata.difficulty).toBe('medium');
      expect(result.metadata.contextUsed).toEqual(['manual-context']);
    });

    it('should generate questions successfully without context', async () => {
      // Arrange
      const request: QuestionGenerationRequest = {
        ...mockQuestionGenerationRequest,
        contextSource: 'none'
      };

      // Act
      const result = await geminiService.generateQuestions(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(1);
      expect(result.metadata.contextUsed).toEqual([]);
    });

    it('should handle invalid JSON response', async () => {
      // Arrange
      mockResponse.text = jest.fn().mockReturnValue('Invalid JSON response');
      const request: QuestionGenerationRequest = {
        ...mockQuestionGenerationRequest,
        contextSource: 'none'
      };

      // Act & Assert
      await expect(geminiService.generateQuestions(request)).rejects.toThrow('No valid JSON found in response');
    });

    it('should handle missing API key', async () => {
      // Arrange
      const geminiServiceWithoutKey = new GeminiService();
      const request: QuestionGenerationRequest = {
        ...mockQuestionGenerationRequest,
        contextSource: 'none'
      };

      // Act
      const result = await geminiServiceWithoutKey.generateQuestions(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('GEMINI_API_KEY not configured');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      mockModel.generateContent = jest.fn().mockRejectedValue(new Error('API Error'));
      const request: QuestionGenerationRequest = {
        ...mockQuestionGenerationRequest,
        contextSource: 'none'
      };

      // Act
      const result = await geminiService.generateQuestions(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });

  describe('validateGenerationRequest', () => {
    it('should validate a valid request', () => {
      // Act
      const result = geminiService.validateGenerationRequest(mockQuestionGenerationRequest);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject request without topic', () => {
      // Arrange
      const invalidRequest = { ...mockQuestionGenerationRequest, topic: '' };

      // Act
      const result = geminiService.validateGenerationRequest(invalidRequest);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Topic is required');
    });

    it('should reject request without category', () => {
      // Arrange
      const invalidRequest = { ...mockQuestionGenerationRequest, category: '' };

      // Act
      const result = geminiService.validateGenerationRequest(invalidRequest);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Category is required');
    });

    it('should reject invalid difficulty', () => {
      // Arrange
      const invalidRequest = { ...mockQuestionGenerationRequest, difficulty: 'invalid' as any };

      // Act
      const result = geminiService.validateGenerationRequest(invalidRequest);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Difficulty must be one of: easy, medium, hard');
    });

    it('should reject invalid question count', () => {
      // Arrange
      const invalidRequest = { ...mockQuestionGenerationRequest, questionCount: 0 };

      // Act
      const result = geminiService.validateGenerationRequest(invalidRequest);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question count must be between 1 and 50');
    });

    it('should reject invalid language', () => {
      // Arrange
      const invalidRequest = { ...mockQuestionGenerationRequest, language: 'fr' as any };

      // Act
      const result = geminiService.validateGenerationRequest(invalidRequest);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Language must be either "en" or "de"');
    });
  });

  describe('convertToQuestionData', () => {
    it('should convert generated questions to database format', () => {
      // Arrange
      const questionSetId = 1;

      // Act
      const result = geminiService.convertToQuestionData(mockGeneratedQuestions, questionSetId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].question_set_id).toBe(questionSetId);
      expect(result[0].question_text).toEqual(mockGeneratedQuestions[0].questionText);
      expect(result[0].answers).toEqual(mockGeneratedQuestions[0].answers);
      expect(result[0].explanation).toEqual(mockGeneratedQuestions[0].explanation);
      expect(result[0].difficulty).toBe(3);
    });
  });

  describe('createQuestionSetData', () => {
    it('should create question set data from generation request', () => {
      // Act
      const result = geminiService.createQuestionSetData(mockQuestionGenerationRequest, mockGeneratedQuestions);

      // Assert
      expect(result.name).toBe('JavaScript Fundamentals - Programming');
      expect(result.description).toBe('AI-generated questions about JavaScript Fundamentals in the Programming category');
      expect(result.category).toBe('Programming');
      expect(result.difficulty).toBe('medium');
      expect(result.is_active).toBe(true);
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      // Act
      const result = await geminiService.testConnection();

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle connection failure', async () => {
      // Arrange
      mockModel.generateContent = jest.fn().mockRejectedValue(new Error('Connection failed'));

      // Act
      const result = await geminiService.testConnection();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should handle missing API key', async () => {
      // Arrange
      const geminiServiceWithoutKey = new GeminiService();

      // Act
      const result = await geminiServiceWithoutKey.testConnection();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('GEMINI_API_KEY not configured');
    });
  });
});