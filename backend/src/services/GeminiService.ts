import { GoogleGenerativeAI } from '@google/generative-ai';
import { CreateQuestionData, CreateQuestionSetData } from '../repositories/QuestionRepository.js';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  projectId?: string;
  serviceAccountEmail?: string;
}

export interface QuestionGenerationRequest {
  topic: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  language: 'en' | 'de';
  contextSource?: 'manual' | 'none';
  manualContext?: string; // Manual context provided by user
}

export interface GeneratedQuestion {
  questionText: {
    en: string;
    de: string;
  };
  answers: Array<{
    text: {
      en: string;
      de: string;
    };
    correct: boolean;
  }>;
  explanation?: {
    en: string;
    de: string;
  };
  difficulty: number;
}

export interface QuestionGenerationResult {
  success: boolean;
  questions: GeneratedQuestion[];
  metadata: {
    topic: string;
    category: string;
    difficulty: string;
    generatedAt: Date;
    contextUsed: string[];
  };
  error?: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: GeminiConfig;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    
    // Check if API key is provided and valid
    if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
      console.warn('⚠️  GEMINI_API_KEY not configured. AI question generation will be disabled.');
      this.config = {
        apiKey: '',
        model: 'gemini-1.5-flash',
        maxTokens: 4096,
        temperature: 0.7,
        projectId: projectId || 'gen-lang-client-0899352753',
        serviceAccountEmail: serviceAccountEmail || 'tts-google@gen-lang-client-0899352753.iam.gserviceaccount.com'
      };
      this.genAI = null as any;
      this.model = null as any;
    } else {
      this.config = {
        apiKey,
        model: 'gemini-1.5-flash',
        maxTokens: 4096,
        temperature: 0.7,
        projectId: projectId || 'gen-lang-client-0899352753',
        serviceAccountEmail: serviceAccountEmail || 'tts-google@gen-lang-client-0899352753.iam.gserviceaccount.com'
      };

      console.log(`🔧 Gemini configured with project: ${this.config.projectId}`);
      console.log(`🔧 Gemini configured with service account: ${this.config.serviceAccountEmail}`);

      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }
      });
    }
  }

  /**
   * Generate questions using Gemini AI without RAG
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
    try {
      if (!this.model) {
        return {
          success: false,
          questions: [],
          metadata: {
            topic: request.topic,
            category: request.category,
            difficulty: request.difficulty,
            generatedAt: new Date(),
            contextUsed: []
          },
          error: 'Gemini API not configured. Please set a valid GEMINI_API_KEY in your environment variables.'
        };
      }

      // Get context based on request
      let context: string[] = [];
      let contextSources: string[] = [];

      if (request.contextSource === 'manual' && request.manualContext) {
        context = [request.manualContext];
        contextSources = ['manual-context'];
      }
      
      // Create enhanced prompt with context
      const prompt = this.createQuestionGenerationPrompt(request, context);
      
      // Generate questions with Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the generated questions
      const questions = this.parseGeneratedQuestions(text, request.language);
      
      return {
        success: true,
        questions,
        metadata: {
          topic: request.topic,
          category: request.category,
          difficulty: request.difficulty,
          generatedAt: new Date(),
          contextUsed: contextSources
        }
      };
    } catch (error) {
      console.error('Error generating questions with Gemini:', error);
      return {
        success: false,
        questions: [],
        metadata: {
          topic: request.topic,
          category: request.category,
          difficulty: request.difficulty,
          generatedAt: new Date(),
          contextUsed: []
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create enhanced prompt for question generation
   */
  private createQuestionGenerationPrompt(request: QuestionGenerationRequest, context: string[]): string {
    const contextText = context.length > 0 
      ? `\n\nRelevant context:\n${context.join('\n\n')}`
      : '';

    const difficultyInstructions = {
      easy: 'Create simple, straightforward questions suitable for beginners',
      medium: 'Create moderately challenging questions that require some knowledge',
      hard: 'Create complex, detailed questions that require deep understanding'
    };

    return `You are an expert educational content creator. Generate ${request.questionCount} multiple-choice questions about "${request.topic}" in the category "${request.category}".

${difficultyInstructions[request.difficulty]}. Each question should have exactly 4 answer options with only one correct answer.

Requirements:
- Questions must be educational and accurate
- Include explanations for correct answers
- Questions should be engaging and thought-provoking
- Difficulty level: ${request.difficulty}
- Category: ${request.category}

${contextText}

Please format your response as a JSON array with the following structure:
[
  {
    "questionText": {
      "en": "English question text",
      "de": "German question text"
    },
    "answers": [
      {
        "text": {
          "en": "English answer text",
          "de": "German answer text"
        },
        "correct": true
      },
      {
        "text": {
          "en": "English answer text", 
          "de": "German answer text"
        },
        "correct": false
      }
    ],
    "explanation": {
      "en": "English explanation",
      "de": "German explanation"
    },
    "difficulty": 1-5
  }
]

Generate exactly ${request.questionCount} questions. Ensure the JSON is valid and complete.`;
  }

  /**
   * Parse generated questions from Gemini response
   */
  private parseGeneratedQuestions(text: string, language: 'en' | 'de'): GeneratedQuestion[] {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      
      // Validate and transform questions
      return questions.map((q: any, index: number) => {
        if (!q.questionText || !q.answers || q.answers.length !== 4) {
          throw new Error(`Invalid question structure at index ${index}`);
        }

        const correctAnswers = q.answers.filter((a: any) => a.correct);
        if (correctAnswers.length !== 1) {
          throw new Error(`Question ${index + 1} must have exactly one correct answer`);
        }

        return {
          questionText: {
            en: q.questionText.en || q.questionText,
            de: q.questionText.de || q.questionText
          },
          answers: q.answers.map((a: any) => ({
            text: {
              en: a.text.en || a.text,
              de: a.text.de || a.text
            },
            correct: a.correct
          })),
          explanation: q.explanation ? {
            en: q.explanation.en || q.explanation,
            de: q.explanation.de || q.explanation
          } : undefined,
          difficulty: q.difficulty || 3
        };
      });
    } catch (error) {
      console.error('Error parsing generated questions:', error);
      throw new Error(`Failed to parse generated questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert generated questions to database format
   */
  convertToQuestionData(generatedQuestions: GeneratedQuestion[], questionSetId: number): CreateQuestionData[] {
    return generatedQuestions.map(q => ({
      question_set_id: questionSetId,
      question_text: q.questionText,
      answers: q.answers,
      ...(q.explanation && { explanation: q.explanation }),
      difficulty: q.difficulty
    }));
  }

  /**
   * Create question set data from generation request
   */
  createQuestionSetData(request: QuestionGenerationRequest, generatedQuestions: GeneratedQuestion[]): CreateQuestionSetData {
    return {
      name: `${request.topic} - ${request.category}`,
      description: `AI-generated questions about ${request.topic} in the ${request.category} category`,
      category: request.category,
      difficulty: request.difficulty,
      is_active: true
    };
  }

  /**
   * Validate question generation request
   */
  validateGenerationRequest(request: QuestionGenerationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.topic || request.topic.trim().length === 0) {
      errors.push('Topic is required');
    }

    if (!request.category || request.category.trim().length === 0) {
      errors.push('Category is required');
    }

    if (!['easy', 'medium', 'hard'].includes(request.difficulty)) {
      errors.push('Difficulty must be one of: easy, medium, hard');
    }

    if (!request.questionCount || request.questionCount < 1 || request.questionCount > 50) {
      errors.push('Question count must be between 1 and 50');
    }

    if (!['en', 'de'].includes(request.language)) {
      errors.push('Language must be either "en" or "de"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Test Gemini API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.model) {
        return {
          success: false,
          error: 'Gemini API not configured. Please set a valid GEMINI_API_KEY in your environment variables.'
        };
      }
      
      const result = await this.model.generateContent('Hello, this is a test message.');
      await result.response;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 