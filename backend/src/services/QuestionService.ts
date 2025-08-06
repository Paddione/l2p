import { QuestionRepository, Question, QuestionSet, CreateQuestionData, CreateQuestionSetData, LocalizedText } from '../repositories/QuestionRepository.js';

export interface QuestionSelectionOptions {
  questionSetIds: number[];
  count: number;
  difficulty?: number;
  excludeIds?: number[];
}

export interface LocalizedQuestion {
  id: number;
  questionText: string;
  answers: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string | undefined;
  difficulty: number;
}

export interface QuestionSetWithStats extends QuestionSet {
  questionCount: number;
  averageDifficulty: number;
}

export class QuestionService {
  private questionRepository: QuestionRepository;

  constructor() {
    this.questionRepository = new QuestionRepository();
  }

  async getQuestionSetById(id: number): Promise<QuestionSet | null> {
    return this.questionRepository.findQuestionSetById(id);
  }

  async getAllQuestionSets(activeOnly: boolean = true): Promise<QuestionSet[]> {
    return this.questionRepository.findAllQuestionSets(activeOnly);
  }

  async getQuestionSetsByCategory(category: string): Promise<QuestionSet[]> {
    return this.questionRepository.findQuestionSetsByCategory(category);
  }

  async createQuestionSet(data: CreateQuestionSetData): Promise<QuestionSet> {
    return this.questionRepository.createQuestionSet(data);
  }

  async updateQuestionSet(id: number, data: Partial<CreateQuestionSetData>): Promise<QuestionSet | null> {
    return this.questionRepository.updateQuestionSet(id, data);
  }

  async deleteQuestionSet(id: number): Promise<boolean> {
    return this.questionRepository.deleteQuestionSet(id);
  }

  async getQuestionById(id: number): Promise<Question | null> {
    return this.questionRepository.findQuestionById(id);
  }

  async getQuestionsBySetId(questionSetId: number): Promise<Question[]> {
    return this.questionRepository.findQuestionsBySetId(questionSetId);
  }

  async createQuestion(data: CreateQuestionData): Promise<Question> {
    return this.questionRepository.createQuestion(data);
  }

  async updateQuestion(id: number, data: Partial<CreateQuestionData>): Promise<Question | null> {
    return this.questionRepository.updateQuestion(id, data);
  }

  async deleteQuestion(id: number): Promise<boolean> {
    return this.questionRepository.deleteQuestion(id);
  }

  async getRandomQuestions(options: QuestionSelectionOptions): Promise<Question[]> {
    return this.questionRepository.getRandomQuestions(options.questionSetIds, options.count);
  }

  async getQuestionsByDifficulty(questionSetId: number, difficulty: number): Promise<Question[]> {
    return this.questionRepository.getQuestionsByDifficulty(questionSetId, difficulty);
  }

  async getQuestionCount(questionSetId?: number): Promise<number> {
    return this.questionRepository.getQuestionCount(questionSetId);
  }

  async getQuestionSetCount(activeOnly: boolean = true): Promise<number> {
    return this.questionRepository.getQuestionSetCount(activeOnly);
  }

  async searchQuestions(searchTerm: string, questionSetId?: number): Promise<Question[]> {
    return this.questionRepository.searchQuestions(searchTerm, questionSetId);
  }

  async validateQuestionStructure(questionId: number): Promise<boolean> {
    return this.questionRepository.validateQuestionStructure(questionId);
  }

  // Localization methods
  getLocalizedQuestion(question: Question, language: 'en' | 'de'): LocalizedQuestion {
    const fallbackLanguage = 'en';
    
    return {
      id: question.id,
      questionText: question.question_text[language] || question.question_text[fallbackLanguage],
      answers: question.answers.map((answer, index) => ({
        id: String.fromCharCode(65 + index), // A, B, C, D...
        text: answer.text[language] || answer.text[fallbackLanguage],
        isCorrect: answer.correct
      })),
      explanation: question.explanation ? 
        (question.explanation[language] || question.explanation[fallbackLanguage]) : 
        undefined,
      difficulty: question.difficulty
    };
  }

  async getLocalizedQuestions(questions: Question[], language: 'en' | 'de'): Promise<LocalizedQuestion[]> {
    return questions.map(question => this.getLocalizedQuestion(question, language));
  }

  // Question set statistics
  async getQuestionSetWithStats(id: number): Promise<QuestionSetWithStats | null> {
    const questionSet = await this.getQuestionSetById(id);
    if (!questionSet) return null;

    const questions = await this.getQuestionsBySetId(id);
    const questionCount = questions.length;
    const averageDifficulty = questions.length > 0 ? 
      questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length : 0;

    return {
      ...questionSet,
      questionCount,
      averageDifficulty: Math.round(averageDifficulty * 10) / 10
    };
  }

  async getAllQuestionSetsWithStats(activeOnly: boolean = true): Promise<QuestionSetWithStats[]> {
    const questionSets = await this.getAllQuestionSets(activeOnly);
    const questionSetsWithStats: QuestionSetWithStats[] = [];

    for (const questionSet of questionSets) {
      const stats = await this.getQuestionSetWithStats(questionSet.id);
      if (stats) {
        questionSetsWithStats.push(stats);
      }
    }

    return questionSetsWithStats;
  }

  // Validation methods
  validateQuestionData(data: CreateQuestionData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate question text
    if (!data.question_text?.en || !data.question_text?.de) {
      errors.push('Question text must be provided in both English and German');
    }

    // Validate answers
    if (!data.answers || data.answers.length < 2) {
      errors.push('At least 2 answers must be provided');
    } else {
      const hasCorrectAnswer = data.answers.some(answer => answer.correct);
      if (!hasCorrectAnswer) {
        errors.push('At least one answer must be marked as correct');
      }

      // Validate answer text
      for (let i = 0; i < data.answers.length; i++) {
        const answer = data.answers[i];
        if (!answer?.text?.en || !answer?.text?.de) {
          errors.push(`Answer ${i + 1} must have text in both English and German`);
        }
      }
    }

    // Validate difficulty
    if (data.difficulty && (data.difficulty < 1 || data.difficulty > 5)) {
      errors.push('Difficulty must be between 1 and 5');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateQuestionSetData(data: CreateQuestionSetData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Question set name is required');
    }

    if (data.name && data.name.length > 100) {
      errors.push('Question set name must be 100 characters or less');
    }

    if (data.difficulty && !['easy', 'medium', 'hard'].includes(data.difficulty)) {
      errors.push('Difficulty must be one of: easy, medium, hard');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Utility methods
  async getAvailableCategories(): Promise<string[]> {
    const questionSets = await this.getAllQuestionSets(true);
    const categories = new Set<string>();
    
    questionSets.forEach(qs => {
      if (qs.category) {
        categories.add(qs.category);
      }
    });

    return Array.from(categories).sort();
  }

  async getQuestionSetStats(): Promise<{
    totalSets: number;
    activeSets: number;
    totalQuestions: number;
    averageQuestionsPerSet: number;
    categories: string[];
  }> {
    const totalSets = await this.getQuestionSetCount(false);
    const activeSets = await this.getQuestionSetCount(true);
    const totalQuestions = await this.getQuestionCount();
    const categories = await this.getAvailableCategories();

    return {
      totalSets,
      activeSets,
      totalQuestions,
      averageQuestionsPerSet: totalSets > 0 ? Math.round((totalQuestions / totalSets) * 10) / 10 : 0,
      categories
    };
  }
} 