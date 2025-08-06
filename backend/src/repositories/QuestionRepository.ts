import { BaseRepository } from './BaseRepository.js';

export interface LocalizedText {
  en: string;
  de: string;
}

export interface Answer {
  text: LocalizedText;
  correct: boolean;
}

export interface Question {
  id: number;
  question_set_id: number;
  question_text: LocalizedText;
  answers: Answer[];
  explanation?: LocalizedText;
  difficulty: number;
  created_at: Date;
}

export interface QuestionSet {
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
}

export interface CreateQuestionData {
  question_set_id: number;
  question_text: LocalizedText;
  answers: Answer[];
  explanation?: LocalizedText;
  difficulty?: number;
}

export interface CreateQuestionSetData {
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

export interface QuestionSetPermission {
  id: number;
  question_set_id: number;
  user_id: number;
  permission_type: 'read' | 'write' | 'admin';
  granted_at: Date;
  granted_by?: number;
}

export interface CreateQuestionSetPermissionData {
  question_set_id: number;
  user_id: number;
  permission_type: 'read' | 'write' | 'admin';
  granted_by?: number;
}

export interface QuestionSetVersion {
  id: number;
  question_set_id: number;
  version_number: number;
  changes: Record<string, any>;
  created_by?: number;
  created_at: Date;
}

export interface CreateQuestionSetVersionData {
  question_set_id: number;
  version_number: number;
  changes: Record<string, any>;
  created_by?: number;
}

export class QuestionRepository extends BaseRepository {
  private readonly questionsTable = 'questions';
  private readonly questionSetsTable = 'question_sets';

  // Question Set Methods
  async findQuestionSetById(id: number): Promise<QuestionSet | null> {
    return super.findById<QuestionSet>(this.questionSetsTable, id);
  }

  async findAllQuestionSets(activeOnly: boolean = true, publicOnly: boolean = false): Promise<QuestionSet[]> {
    let query = 'SELECT * FROM question_sets WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (activeOnly) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(true);
      paramIndex++;
    }

    if (publicOnly) {
      query += ` AND is_public = $${paramIndex}`;
      params.push(true);
    }

    query += ' ORDER BY is_featured DESC, name';

    const result = await this.db.query<QuestionSet>(query, params);
    return result.rows;
  }

  async createQuestionSet(data: CreateQuestionSetData): Promise<QuestionSet> {
    const questionSetData = {
      ...data,
      difficulty: data.difficulty || 'medium',
      is_active: data.is_active !== undefined ? data.is_active : true,
      is_public: data.is_public !== undefined ? data.is_public : true,
      is_featured: data.is_featured !== undefined ? data.is_featured : false,
      tags: data.tags || [],
      metadata: data.metadata || {}
    };

    return super.create<QuestionSet>(this.questionSetsTable, questionSetData);
  }

  async updateQuestionSet(id: number, data: Partial<CreateQuestionSetData>): Promise<QuestionSet | null> {
    return super.update<QuestionSet>(this.questionSetsTable, id, data);
  }

  async deleteQuestionSet(id: number): Promise<boolean> {
    return super.delete(this.questionSetsTable, id);
  }

  async findQuestionSetsByCategory(category: string): Promise<QuestionSet[]> {
    const result = await this.db.query<QuestionSet>(
      'SELECT * FROM question_sets WHERE category = $1 AND is_active = true ORDER BY name',
      [category]
    );
    return result.rows;
  }

  // Question Methods
  async findQuestionById(id: number): Promise<Question | null> {
    return super.findById<Question>(this.questionsTable, id);
  }

  async findQuestionsBySetId(questionSetId: number): Promise<Question[]> {
    const result = await this.db.query<Question>(
      'SELECT * FROM questions WHERE question_set_id = $1 ORDER BY id',
      [questionSetId]
    );
    return result.rows;
  }

  async createQuestion(data: CreateQuestionData): Promise<Question> {
    const questionData = {
      ...data,
      difficulty: data.difficulty || 1
    };

    return super.create<Question>(this.questionsTable, questionData);
  }

  async updateQuestion(id: number, data: Partial<CreateQuestionData>): Promise<Question | null> {
    return super.update<Question>(this.questionsTable, id, data);
  }

  async deleteQuestion(id: number): Promise<boolean> {
    return super.delete(this.questionsTable, id);
  }

  async getRandomQuestions(questionSetIds: number[], count: number): Promise<Question[]> {
    const placeholders = questionSetIds.map((_, index) => `$${index + 2}`).join(', ');
    
    const result = await this.db.query<Question>(
      `SELECT * FROM questions 
       WHERE question_set_id IN (${placeholders})
       ORDER BY RANDOM() 
       LIMIT $1`,
      [count, ...questionSetIds]
    );
    return result.rows;
  }

  async getQuestionsByDifficulty(questionSetId: number, difficulty: number): Promise<Question[]> {
    const result = await this.db.query<Question>(
      'SELECT * FROM questions WHERE question_set_id = $1 AND difficulty = $2 ORDER BY id',
      [questionSetId, difficulty]
    );
    return result.rows;
  }

  async getQuestionCount(questionSetId?: number): Promise<number> {
    if (questionSetId) {
      return super.count(this.questionsTable, 'question_set_id = $1', [questionSetId]);
    }
    return super.count(this.questionsTable);
  }

  async getQuestionSetCount(activeOnly: boolean = true): Promise<number> {
    if (activeOnly) {
      return super.count(this.questionSetsTable, 'is_active = $1', [true]);
    }
    return super.count(this.questionSetsTable);
  }

  async searchQuestions(searchTerm: string, questionSetId?: number): Promise<Question[]> {
    let query = `
      SELECT * FROM questions 
      WHERE (question_text->>'en' ILIKE $1 OR question_text->>'de' ILIKE $1)
    `;
    const params: any[] = [`%${searchTerm}%`];

    if (questionSetId) {
      query += ' AND question_set_id = $2';
      params.push(questionSetId);
    }

    query += ' ORDER BY id LIMIT 50';

    const result = await this.db.query<Question>(query, params);
    return result.rows;
  }

  async getQuestionsWithAnswerCount(): Promise<Array<Question & { answer_count: number }>> {
    const result = await this.db.query<Question & { answer_count: number }>(
      `SELECT *, 
       jsonb_array_length(answers) as answer_count 
       FROM questions 
       ORDER BY question_set_id, id`
    );
    return result.rows;
  }

  async validateQuestionStructure(questionId: number): Promise<boolean> {
    const question = await this.findQuestionById(questionId);
    if (!question) return false;

    // Check if question has required localized text
    if (!question.question_text.en || !question.question_text.de) {
      return false;
    }

    // Check if answers array exists and has at least 2 answers
    if (!question.answers || question.answers.length < 2) {
      return false;
    }

    // Check if at least one answer is correct
    const hasCorrectAnswer = question.answers.some(answer => answer.correct);
    if (!hasCorrectAnswer) {
      return false;
    }

    // Check if all answers have localized text
    const allAnswersHaveText = question.answers.every(answer => 
      answer.text && answer.text.en && answer.text.de
    );
    if (!allAnswersHaveText) {
      return false;
    }

    return true;
  }

  // Question Set Permissions Methods
  async findQuestionSetPermissions(questionSetId: number): Promise<QuestionSetPermission[]> {
    const result = await this.db.query<QuestionSetPermission>(
      'SELECT * FROM question_set_permissions WHERE question_set_id = $1 ORDER BY granted_at DESC',
      [questionSetId]
    );
    return result.rows;
  }

  async findUserQuestionSetPermissions(userId: number): Promise<QuestionSetPermission[]> {
    const result = await this.db.query<QuestionSetPermission>(
      'SELECT * FROM question_set_permissions WHERE user_id = $1 ORDER BY granted_at DESC',
      [userId]
    );
    return result.rows;
  }

  async createQuestionSetPermission(data: CreateQuestionSetPermissionData): Promise<QuestionSetPermission> {
    return super.create<QuestionSetPermission>('question_set_permissions', data);
  }

  async updateQuestionSetPermission(id: number, data: Partial<CreateQuestionSetPermissionData>): Promise<QuestionSetPermission | null> {
    return super.update<QuestionSetPermission>('question_set_permissions', id, data);
  }

  async deleteQuestionSetPermission(id: number): Promise<boolean> {
    return super.delete('question_set_permissions', id);
  }

  async checkUserPermission(questionSetId: number, userId: number, permissionType: 'read' | 'write' | 'admin'): Promise<boolean> {
    const result = await this.db.query<QuestionSetPermission>(
      'SELECT * FROM question_set_permissions WHERE question_set_id = $1 AND user_id = $2 AND permission_type = $3',
      [questionSetId, userId, permissionType]
    );
    return result.rows.length > 0;
  }

  async findAccessibleQuestionSets(userId: number): Promise<QuestionSet[]> {
    const result = await this.db.query<QuestionSet>(
      `SELECT DISTINCT qs.* FROM question_sets qs
       LEFT JOIN question_set_permissions qsp ON qs.id = qsp.question_set_id
       WHERE qs.is_public = true 
          OR qs.owner_id = $1 
          OR qsp.user_id = $1
       ORDER BY qs.name`,
      [userId]
    );
    return result.rows;
  }

  // Question Set Versioning Methods
  async findQuestionSetVersions(questionSetId: number): Promise<QuestionSetVersion[]> {
    const result = await this.db.query<QuestionSetVersion>(
      'SELECT * FROM question_set_versions WHERE question_set_id = $1 ORDER BY version_number DESC',
      [questionSetId]
    );
    return result.rows;
  }

  async findQuestionSetVersion(questionSetId: number, versionNumber: number): Promise<QuestionSetVersion | null> {
    const result = await this.db.query<QuestionSetVersion>(
      'SELECT * FROM question_set_versions WHERE question_set_id = $1 AND version_number = $2',
      [questionSetId, versionNumber]
    );
    return result.rows[0] || null;
  }

  async createQuestionSetVersion(data: CreateQuestionSetVersionData): Promise<QuestionSetVersion> {
    return super.create<QuestionSetVersion>('question_set_versions', data);
  }

  async getNextVersionNumber(questionSetId: number): Promise<number> {
    const result = await this.db.query<{ max_version: number }>(
      'SELECT COALESCE(MAX(version_number), 0) + 1 as max_version FROM question_set_versions WHERE question_set_id = $1',
      [questionSetId]
    );
    return result.rows[0]?.max_version || 1;
  }

  // Enhanced Question Set Methods
  async findQuestionSetsByOwner(ownerId: number): Promise<QuestionSet[]> {
    const result = await this.db.query<QuestionSet>(
      'SELECT * FROM question_sets WHERE owner_id = $1 ORDER BY updated_at DESC',
      [ownerId]
    );
    return result.rows;
  }

  async findPublicQuestionSets(): Promise<QuestionSet[]> {
    const result = await this.db.query<QuestionSet>(
      'SELECT * FROM question_sets WHERE is_public = true AND is_active = true ORDER BY is_featured DESC, name',
      []
    );
    return result.rows;
  }

  async findFeaturedQuestionSets(): Promise<QuestionSet[]> {
    const result = await this.db.query<QuestionSet>(
      'SELECT * FROM question_sets WHERE is_featured = true AND is_active = true ORDER BY name',
      []
    );
    return result.rows;
  }

  async searchQuestionSets(searchTerm: string, userId?: number): Promise<QuestionSet[]> {
    let query = `
      SELECT DISTINCT qs.* FROM question_sets qs
      LEFT JOIN question_set_permissions qsp ON qs.id = qsp.question_set_id
      WHERE (qs.name ILIKE $1 OR qs.description ILIKE $1 OR qs.category ILIKE $1)
    `;
    const params: any[] = [`%${searchTerm}%`];

    if (userId) {
      query += ` AND (qs.is_public = true OR qs.owner_id = $2 OR qsp.user_id = $2)`;
      params.push(userId);
    } else {
      query += ' AND qs.is_public = true';
    }

    query += ' AND qs.is_active = true ORDER BY qs.is_featured DESC, qs.name LIMIT 50';

    const result = await this.db.query<QuestionSet>(query, params);
    return result.rows;
  }
}