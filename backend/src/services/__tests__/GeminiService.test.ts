import { GeminiService, QuestionGenerationRequest, GeneratedQuestion, QuestionGenerationResult } from '../GeminiService';
import { ChromaService } from '../ChromaService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the dependencies
jest.mock('../ChromaService');
jest.mock('@google/generative-ai');

describe('GeminiService', () => {
  let geminiService: GeminiService;
  let mockChromaService: jest.Mocked<ChromaService>;
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
    contextSource: 'both',
    fileContext: ['file1', 'file2']
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

  const mockContextResults = [
    {
      content: 'JavaScript closures are functions that have access to outer scope',
      metadata: { source: 'file1' }
    },
    {
      content: 'Programming fundamentals include understanding scope and closures',
      metadata: { source: 'file2' }
    }
  ];

  const mockFileContextResults = [
    {
      pageContent: 'File content about JavaScript closures',
      metadata: { source: 'file1' }
    }
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Setup environment variables
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.GOOGLE_CLOUD_PROJECT_ID = 'test-project';
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'test@test.com';

    // Setup mocks
    mockChromaService = new ChromaService() as jest.Mocked<ChromaService>;
    mockGoogleGenerativeAI = new GoogleGenerativeAI('test-key') as jest.Mocked<GoogleGenerativeAI>;
    
    // Setup model mocks
    mockResponse = {
      text: jest.fn().mockReturnValue(mockValidJsonResponse)
    };
    
    mockResult = {
      response: mockResponse
    };
    
    mockModel = {
      generateContent: jest.fn().mockResolvedValue(mockResult)
    };

    mockGoogleGenerativeAI.getGenerativeModel = jest.fn().mockReturnValue(mockModel);

    // Setup ChromaService mocks
    mockChromaService.search = jest.fn().mockResolvedValue(mockContextResults);
    mockChromaService.getDocumentsByFileId = jest.fn().mockResolvedValue(mockFileContextResults);
    mockChromaService.testConnection = jest.fn().mockResolvedValue(undefined);

    // Create service instance
    geminiService = new GeminiService();
    
    // Replace the private instances with our mocks
    (geminiService as any).chromaService = mockChromaService;
    (geminiService as any).genAI = mockGoogleGenerativeAI;
    (geminiService as any).model = mockModel;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_CLOUD_PROJECT_ID;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

    // Restore console methods
    jest.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with valid API key', () => {
      // The constructor is called in beforeEach, so we need to create a new instance to test
      const testService = new GeminiService();
      
      // Check that the GoogleGenerativeAI constructor was called
      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key');
    });

    it('should handle missing API key gracefully', () => {
      delete process.env.GEMINI_API_KEY;
      
      const serviceWithoutKey = new GeminiService();
      const config = (serviceWithoutKey as any).config;
      
      expect(config.apiKey).toBe('');
      expect((serviceWithoutKey as any).genAI).toBeNull();
      expect((serviceWithoutKey as any).model).toBeNull();
    });

    it('should handle placeholder API key', () => {
      process.env.GEMINI_API_KEY = 'your_google_gemini_api_key_here';
      
      const serviceWithPlaceholder = new GeminiService();
      const config = (serviceWithPlaceholder as any).config;
      
      expect(config.apiKey).toBe('');
      expect((serviceWithPlaceholder as any).genAI).toBeNull();
      expect((serviceWithPlaceholder as any).model).toBeNull();
    });

    it('should use default configuration values', () => {
      const config = (geminiService as any).config;
      
      expect(config.model).toBe('gemini-1.5-flash');
      expect(config.maxTokens).toBe(4096);
      expect(config.temperature).toBe(0.7);
      expect(config.projectId).toBe('test-project');
      expect(config.serviceAccountEmail).toBe('test@test.com');
    });
  });

  describe('Question Generation', () => {
    describe('generateQuestions', () => {
      it('should generate questions successfully with RAG context', async () => {
        const result = await geminiService.generateQuestions(mockQuestionGenerationRequest);

        expect(mockChromaService.getDocumentsByFileId).toHaveBeenCalledWith('file1');
        expect(mockChromaService.getDocumentsByFileId).toHaveBeenCalledWith('file2');
        expect(mockChromaService.search).toHaveBeenCalledWith('JavaScript Fundamentals', 3);
        expect(mockModel.generateContent).toHaveBeenCalledWith(expect.stringContaining('JavaScript Fundamentals'));
        expect(mockModel.generateContent).toHaveBeenCalledWith(expect.stringContaining('Programming'));
        expect(mockModel.generateContent).toHaveBeenCalledWith(expect.stringContaining('medium'));
        
        expect(result.success).toBe(true);
        expect(result.questions).toHaveLength(1);
        expect(result.questions[0]).toEqual(mockGeneratedQuestions[0]);
        expect(result.metadata.topic).toBe('JavaScript Fundamentals');
        expect(result.metadata.category).toBe('Programming');
        expect(result.metadata.difficulty).toBe('medium');
        expect(result.metadata.contextUsed).toContain('file:file1');
        expect(result.metadata.contextUsed).toContain('topic-search');
      });

      it('should generate questions with file context only', async () => {
        const requestWithFileContext = {
          ...mockQuestionGenerationRequest,
          contextSource: 'files' as const
        };

        await geminiService.generateQuestions(requestWithFileContext);

        expect(mockChromaService.getDocumentsByFileId).toHaveBeenCalledTimes(2);
        expect(mockChromaService.search).not.toHaveBeenCalled();
      });

      it('should generate questions with manual context only', async () => {
        const requestWithManualContext: QuestionGenerationRequest = {
          ...mockQuestionGenerationRequest,
          contextSource: 'manual' as const
        };
        delete (requestWithManualContext as any).fileContext;

        await geminiService.generateQuestions(requestWithManualContext);

        expect(mockChromaService.search).toHaveBeenCalledWith('JavaScript Fundamentals', 3);
        expect(mockChromaService.getDocumentsByFileId).not.toHaveBeenCalled();
      });

      it('should generate questions without context', async () => {
        const requestWithoutContext: QuestionGenerationRequest = {
          topic: mockQuestionGenerationRequest.topic,
          category: mockQuestionGenerationRequest.category,
          difficulty: mockQuestionGenerationRequest.difficulty,
          questionCount: mockQuestionGenerationRequest.questionCount,
          language: mockQuestionGenerationRequest.language
        };

        await geminiService.generateQuestions(requestWithoutContext);

        expect(mockChromaService.search).not.toHaveBeenCalled();
        expect(mockChromaService.getDocumentsByFileId).not.toHaveBeenCalled();
        expect(mockModel.generateContent).toHaveBeenCalledWith(expect.not.stringContaining('Relevant context:'));
      });

      it('should handle API not configured', async () => {
        const serviceWithoutAPI = new GeminiService();
        (serviceWithoutAPI as any).model = null;

        const result = await serviceWithoutAPI.generateQuestions(mockQuestionGenerationRequest);

        expect(result.success).toBe(false);
        expect(result.questions).toHaveLength(0);
        expect(result.error).toContain('Gemini API not configured');
      });

      it('should handle Gemini API errors', async () => {
        const apiError = new Error('API rate limit exceeded');
        mockModel.generateContent.mockRejectedValue(apiError);

        const result = await geminiService.generateQuestions(mockQuestionGenerationRequest);

        expect(result.success).toBe(false);
        expect(result.questions).toHaveLength(0);
        expect(result.error).toBe('API rate limit exceeded');
      });

      it('should handle ChromaService failures gracefully', async () => {
        mockChromaService.search.mockRejectedValue(new Error('ChromaDB connection failed'));
        mockChromaService.getDocumentsByFileId.mockRejectedValue(new Error('File not found'));

        const result = await geminiService.generateQuestions(mockQuestionGenerationRequest);

        expect(result.success).toBe(true); // Should continue without context
        expect(mockModel.generateContent).toHaveBeenCalled();
      });

      it('should handle different difficulty levels', async () => {
        const easyRequest = { ...mockQuestionGenerationRequest, difficulty: 'easy' as const };
        const hardRequest = { ...mockQuestionGenerationRequest, difficulty: 'hard' as const };

        await geminiService.generateQuestions(easyRequest);
        expect(mockModel.generateContent).toHaveBeenCalledWith(expect.stringContaining('simple, straightforward questions'));

        await geminiService.generateQuestions(hardRequest);
        expect(mockModel.generateContent).toHaveBeenCalledWith(expect.stringContaining('complex, detailed questions'));
      });

      it('should handle different question counts', async () => {
        const multipleQuestionsRequest = { ...mockQuestionGenerationRequest, questionCount: 5 };

        await geminiService.generateQuestions(multipleQuestionsRequest);

        expect(mockModel.generateContent).toHaveBeenCalledWith(expect.stringContaining('Generate 5 multiple-choice'));
        expect(mockModel.generateContent).toHaveBeenCalledWith(expect.stringContaining('exactly 5 questions'));
      });
    });
  });

  describe('Response Parsing', () => {
    describe('parseGeneratedQuestions', () => {
      it('should parse valid JSON response correctly', () => {
        const parseMethod = (geminiService as any).parseGeneratedQuestions.bind(geminiService);
        const result = parseMethod(mockValidJsonResponse, 'en');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockGeneratedQuestions[0]);
      });

      it('should handle response with JSON wrapped in text', () => {
        const wrappedResponse = `Here are the questions:\n${mockValidJsonResponse}\nThese are good questions.`;
        const parseMethod = (geminiService as any).parseGeneratedQuestions.bind(geminiService);
        
        const result = parseMethod(wrappedResponse, 'en');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockGeneratedQuestions[0]);
      });

      it('should throw error for invalid JSON', () => {
        const invalidJsonResponse = 'This is not JSON';
        const parseMethod = (geminiService as any).parseGeneratedQuestions.bind(geminiService);

        expect(() => {
          parseMethod(invalidJsonResponse, 'en');
        }).toThrow('No valid JSON found in response');
      });

      it('should throw error for malformed question structure', () => {
        const malformedQuestions = JSON.stringify([
          {
            questionText: 'Missing answers array',
            // answers array is missing
            difficulty: 3
          }
        ]);
        const parseMethod = (geminiService as any).parseGeneratedQuestions.bind(geminiService);

        expect(() => {
          parseMethod(malformedQuestions, 'en');
        }).toThrow('Invalid question structure at index 0');
      });

      it('should throw error for incorrect number of answers', () => {
        const incorrectAnswers = JSON.stringify([
          {
            questionText: { en: 'Test question', de: 'Test Frage' },
            answers: [
              { text: { en: 'Answer 1', de: 'Antwort 1' }, correct: true },
              { text: { en: 'Answer 2', de: 'Antwort 2' }, correct: false }
              // Only 2 answers instead of 4
            ],
            difficulty: 3
          }
        ]);
        const parseMethod = (geminiService as any).parseGeneratedQuestions.bind(geminiService);

        expect(() => {
          parseMethod(incorrectAnswers, 'en');
        }).toThrow('Invalid question structure at index 0');
      });

      it('should throw error for multiple correct answers', () => {
        const multipleCorrect = JSON.stringify([
          {
            questionText: { en: 'Test question', de: 'Test Frage' },
            answers: [
              { text: { en: 'Answer 1', de: 'Antwort 1' }, correct: true },
              { text: { en: 'Answer 2', de: 'Antwort 2' }, correct: true }, // Two correct answers
              { text: { en: 'Answer 3', de: 'Antwort 3' }, correct: false },
              { text: { en: 'Answer 4', de: 'Antwort 4' }, correct: false }
            ],
            difficulty: 3
          }
        ]);
        const parseMethod = (geminiService as any).parseGeneratedQuestions.bind(geminiService);

        expect(() => {
          parseMethod(multipleCorrect, 'en');
        }).toThrow('Question 1 must have exactly one correct answer');
      });

      it('should throw error for no correct answers', () => {
        const noCorrect = JSON.stringify([
          {
            questionText: { en: 'Test question', de: 'Test Frage' },
            answers: [
              { text: { en: 'Answer 1', de: 'Antwort 1' }, correct: false },
              { text: { en: 'Answer 2', de: 'Antwort 2' }, correct: false },
              { text: { en: 'Answer 3', de: 'Antwort 3' }, correct: false },
              { text: { en: 'Answer 4', de: 'Antwort 4' }, correct: false }
            ],
            difficulty: 3
          }
        ]);
        const parseMethod = (geminiService as any).parseGeneratedQuestions.bind(geminiService);

        expect(() => {
          parseMethod(noCorrect, 'en');
        }).toThrow('Question 1 must have exactly one correct answer');
      });

      it('should handle questions without explanations', () => {
        const questionsWithoutExplanation = JSON.stringify([
          {
            questionText: { en: 'Test question', de: 'Test Frage' },
            answers: [
              { text: { en: 'Answer 1', de: 'Antwort 1' }, correct: true },
              { text: { en: 'Answer 2', de: 'Antwort 2' }, correct: false },
              { text: { en: 'Answer 3', de: 'Antwort 3' }, correct: false },
              { text: { en: 'Answer 4', de: 'Antwort 4' }, correct: false }
            ],
            difficulty: 3
            // No explanation field
          }
        ]);
        const parseMethod = (geminiService as any).parseGeneratedQuestions.bind(geminiService);

        const result = parseMethod(questionsWithoutExplanation, 'en');

        expect(result[0].explanation).toBeUndefined();
      });

      it('should handle legacy single-language format', () => {
        const legacyFormat = JSON.stringify([
          {
            questionText: 'What is JavaScript?', // String instead of object
            answers: [
              { text: 'A programming language', correct: true },
              { text: 'A markup language', correct: false },
              { text: 'A database', correct: false },
              { text: 'An operating system', correct: false }
            ],
            explanation: 'JavaScript is a programming language',
            difficulty: 2
          }
        ]);
        const parseMethod = (geminiService as any).parseGeneratedQuestions.bind(geminiService);

        const result = parseMethod(legacyFormat, 'en');

        expect(result[0].questionText.en).toBe('What is JavaScript?');
        expect(result[0].questionText.de).toBe('What is JavaScript?');
        expect(result[0].answers[0].text.en).toBe('A programming language');
        expect(result[0].answers[0].text.de).toBe('A programming language');
      });
    });
  });

  describe('Context Retrieval', () => {
    describe('getRelevantContext', () => {
      it('should retrieve context from ChromaDB successfully', async () => {
        const getRelevantContextMethod = (geminiService as any).getRelevantContext.bind(geminiService);
        
        const result = await getRelevantContextMethod('JavaScript');

        expect(mockChromaService.search).toHaveBeenCalledWith('JavaScript', 3);
        expect(result).toEqual(['JavaScript closures are functions that have access to outer scope', 'Programming fundamentals include understanding scope and closures']);
      });

      it('should handle ChromaDB search failures', async () => {
        mockChromaService.search.mockRejectedValue(new Error('ChromaDB error'));
        const getRelevantContextMethod = (geminiService as any).getRelevantContext.bind(geminiService);

        const result = await getRelevantContextMethod('JavaScript');

        expect(result).toEqual([]);
      });
    });

    describe('getFileContext', () => {
      it('should retrieve file context successfully', async () => {
        const getFileContextMethod = (geminiService as any).getFileContext.bind(geminiService);
        
        const result = await getFileContextMethod(['file1', 'file2']);

        expect(mockChromaService.getDocumentsByFileId).toHaveBeenCalledWith('file1');
        expect(mockChromaService.getDocumentsByFileId).toHaveBeenCalledWith('file2');
        expect(result.context).toEqual([mockFileContextResults[0], mockFileContextResults[0]]);
        expect(result.sources).toEqual(['file:file1', 'file:file2']);
      });

      it('should handle missing files gracefully', async () => {
        mockChromaService.getDocumentsByFileId.mockResolvedValue([]);
        const getFileContextMethod = (geminiService as any).getFileContext.bind(geminiService);

        const result = await getFileContextMethod(['nonexistent-file']);

        expect(result.context).toEqual([]);
        expect(result.sources).toEqual([]);
      });

      it('should handle ChromaDB file retrieval failures', async () => {
        mockChromaService.getDocumentsByFileId.mockRejectedValue(new Error('File access error'));
        const getFileContextMethod = (geminiService as any).getFileContext.bind(geminiService);

        const result = await getFileContextMethod(['file1']);

        expect(result.context).toEqual([]);
        expect(result.sources).toEqual([]);
      });
    });
  });

  describe('Prompt Generation', () => {
    describe('createQuestionGenerationPrompt', () => {
      it('should create prompt with context', () => {
        const context = ['Context about JavaScript', 'More context about programming'];
        const createPromptMethod = (geminiService as any).createQuestionGenerationPrompt.bind(geminiService);
        
        const prompt = createPromptMethod(mockQuestionGenerationRequest, context);

        expect(prompt).toContain('JavaScript Fundamentals');
        expect(prompt).toContain('Programming');
        expect(prompt).toContain('medium');
        expect(prompt).toContain('2');
        expect(prompt).toContain('Relevant context:');
        expect(prompt).toContain('Context about JavaScript');
        expect(prompt).toContain('More context about programming');
        expect(prompt).toContain('moderately challenging questions');
      });

      it('should create prompt without context', () => {
        const createPromptMethod = (geminiService as any).createQuestionGenerationPrompt.bind(geminiService);
        
        const prompt = createPromptMethod(mockQuestionGenerationRequest, []);

        expect(prompt).toContain('JavaScript Fundamentals');
        expect(prompt).toContain('Programming');
        expect(prompt).not.toContain('Relevant context:');
      });

      it('should include correct difficulty instructions', () => {
        const createPromptMethod = (geminiService as any).createQuestionGenerationPrompt.bind(geminiService);
        
        const easyPrompt = createPromptMethod({ ...mockQuestionGenerationRequest, difficulty: 'easy' }, []);
        const hardPrompt = createPromptMethod({ ...mockQuestionGenerationRequest, difficulty: 'hard' }, []);

        expect(easyPrompt).toContain('simple, straightforward questions suitable for beginners');
        expect(hardPrompt).toContain('complex, detailed questions that require deep understanding');
      });

      it('should include JSON format requirements', () => {
        const createPromptMethod = (geminiService as any).createQuestionGenerationPrompt.bind(geminiService);
        
        const prompt = createPromptMethod(mockQuestionGenerationRequest, []);

        expect(prompt).toContain('JSON array');
        expect(prompt).toContain('"questionText"');
        expect(prompt).toContain('"answers"');
        expect(prompt).toContain('"correct"');
        expect(prompt).toContain('"explanation"');
        expect(prompt).toContain('"difficulty"');
      });
    });
  });

  describe('Validation', () => {
    describe('validateGenerationRequest', () => {
      it('should validate correct request', () => {
        const result = geminiService.validateGenerationRequest(mockQuestionGenerationRequest);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject empty topic', () => {
        const invalidRequest = { ...mockQuestionGenerationRequest, topic: '' };
        
        const result = geminiService.validateGenerationRequest(invalidRequest);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Topic is required');
      });

      it('should reject empty category', () => {
        const invalidRequest = { ...mockQuestionGenerationRequest, category: '' };
        
        const result = geminiService.validateGenerationRequest(invalidRequest);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Category is required');
      });

      it('should reject invalid difficulty', () => {
        const invalidRequest = { ...mockQuestionGenerationRequest, difficulty: 'invalid' as any };
        
        const result = geminiService.validateGenerationRequest(invalidRequest);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Difficulty must be one of: easy, medium, hard');
      });

      it('should reject invalid question count', () => {
        const invalidRequest1 = { ...mockQuestionGenerationRequest, questionCount: 0 };
        const invalidRequest2 = { ...mockQuestionGenerationRequest, questionCount: 51 };
        
        const result1 = geminiService.validateGenerationRequest(invalidRequest1);
        const result2 = geminiService.validateGenerationRequest(invalidRequest2);

        expect(result1.isValid).toBe(false);
        expect(result1.errors).toContain('Question count must be between 1 and 50');
        expect(result2.isValid).toBe(false);
        expect(result2.errors).toContain('Question count must be between 1 and 50');
      });

      it('should reject invalid language', () => {
        const invalidRequest = { ...mockQuestionGenerationRequest, language: 'fr' as any };
        
        const result = geminiService.validateGenerationRequest(invalidRequest);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Language must be either "en" or "de"');
      });

      it('should collect multiple validation errors', () => {
        const invalidRequest = {
          ...mockQuestionGenerationRequest,
          topic: '',
          category: '',
          difficulty: 'invalid' as any,
          questionCount: 0,
          language: 'fr' as any
        };
        
        const result = geminiService.validateGenerationRequest(invalidRequest);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(5);
      });
    });
  });

  describe('Data Conversion', () => {
    describe('convertToQuestionData', () => {
      it('should convert generated questions to database format', () => {
        const questionSetId = 123;
        
        const result = geminiService.convertToQuestionData(mockGeneratedQuestions, questionSetId);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          question_set_id: 123,
          question_text: mockGeneratedQuestions[0]!.questionText,
          answers: mockGeneratedQuestions[0]!.answers,
          explanation: mockGeneratedQuestions[0]!.explanation,
          difficulty: mockGeneratedQuestions[0]!.difficulty
        });
      });

      it('should handle questions without explanations', () => {
        const questionsWithoutExplanation: GeneratedQuestion[] = [{
          questionText: mockGeneratedQuestions[0]!.questionText,
          answers: mockGeneratedQuestions[0]!.answers,
          difficulty: mockGeneratedQuestions[0]!.difficulty
        }];
        
        const result = geminiService.convertToQuestionData(questionsWithoutExplanation, 123);

        expect(result[0]).not.toHaveProperty('explanation');
      });
    });

    describe('createQuestionSetData', () => {
      it('should create question set data from request', () => {
        const result = geminiService.createQuestionSetData(mockQuestionGenerationRequest, mockGeneratedQuestions);

        expect(result).toEqual({
          name: 'JavaScript Fundamentals - Programming',
          description: 'AI-generated questions about JavaScript Fundamentals in the Programming category',
          category: 'Programming',
          difficulty: 'medium',
          is_active: true
        });
      });
    });
  });

  describe('Connection Testing', () => {
    describe('testConnection', () => {
      it('should test Gemini API connection successfully', async () => {
        const result = await geminiService.testConnection();

        expect(mockModel.generateContent).toHaveBeenCalledWith('Hello, this is a test message.');
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should handle API connection failure', async () => {
        mockModel.generateContent.mockRejectedValue(new Error('API connection failed'));

        const result = await geminiService.testConnection();

        expect(result.success).toBe(false);
        expect(result.error).toBe('API connection failed');
      });

      it('should handle unconfigured API', async () => {
        const serviceWithoutAPI = new GeminiService();
        (serviceWithoutAPI as any).model = null;

        const result = await serviceWithoutAPI.testConnection();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Gemini API not configured');
      });
    });

    describe('testChromaConnection', () => {
      it('should test ChromaDB connection successfully', async () => {
        const result = await geminiService.testChromaConnection();

        expect(mockChromaService.testConnection).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should handle ChromaDB connection failure', async () => {
        mockChromaService.testConnection.mockRejectedValue(new Error('ChromaDB connection failed'));

        const result = await geminiService.testChromaConnection();

        expect(result.success).toBe(false);
        expect(result.error).toBe('ChromaDB connection failed');
      });
    });
  });

  describe('Error Handling and Rate Limiting', () => {
    it('should handle API rate limiting errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      mockModel.generateContent.mockRejectedValue(rateLimitError);

      const result = await geminiService.generateQuestions(mockQuestionGenerationRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should handle API timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockModel.generateContent.mockRejectedValue(timeoutError);

      const result = await geminiService.generateQuestions(mockQuestionGenerationRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
    });

    it('should handle malformed API responses', async () => {
      mockResponse.text.mockReturnValue('This is not valid JSON');

      const result = await geminiService.generateQuestions(mockQuestionGenerationRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse generated questions');
    });

    it('should handle API response parsing errors', async () => {
      mockResult.response = Promise.reject(new Error('Failed to read response'));

      const result = await geminiService.generateQuestions(mockQuestionGenerationRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to read response');
    });

    it('should handle unknown errors gracefully', async () => {
      mockModel.generateContent.mockRejectedValue('String error instead of Error object');

      const result = await geminiService.generateQuestions(mockQuestionGenerationRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });
  });

  describe('RAG Integration', () => {
    it('should integrate context from multiple sources', async () => {
      const result = await geminiService.generateQuestions(mockQuestionGenerationRequest);

      expect(mockChromaService.getDocumentsByFileId).toHaveBeenCalledTimes(2);
      expect(mockChromaService.search).toHaveBeenCalledTimes(1);
      expect(result.metadata.contextUsed).toContain('file:file1');
      expect(result.metadata.contextUsed).toContain('file:file2');
      expect(result.metadata.contextUsed).toContain('topic-search');
    });

    it('should handle partial context retrieval failures', async () => {
      // Mock the first file to succeed and second to return empty (simulating file not found)
      mockChromaService.getDocumentsByFileId
        .mockResolvedValueOnce(mockFileContextResults)
        .mockResolvedValueOnce([]); // Empty array simulates file not found

      const result = await geminiService.generateQuestions(mockQuestionGenerationRequest);

      expect(result.success).toBe(true);
      expect(result.metadata.contextUsed).toContain('file:file1');
      expect(result.metadata.contextUsed).toContain('topic-search');
      // file2 should not be in the context due to empty result
      expect(result.metadata.contextUsed.filter(source => source === 'file:file2')).toHaveLength(0);
    });

    it('should continue without context when all retrieval fails', async () => {
      mockChromaService.search.mockRejectedValue(new Error('Search failed'));
      mockChromaService.getDocumentsByFileId.mockRejectedValue(new Error('File access failed'));

      const result = await geminiService.generateQuestions(mockQuestionGenerationRequest);

      expect(result.success).toBe(true);
      expect(result.metadata.contextUsed).toHaveLength(0);
      expect(mockModel.generateContent).toHaveBeenCalledWith(expect.not.stringContaining('Relevant context:'));
    });
  });
});