import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { AuthMiddleware } from '../middleware/auth.js';
import { GeminiService, QuestionGenerationRequest } from '../services/GeminiService.js';
import { ChromaService } from '../services/ChromaService.js';
import { QuestionService } from '../services/QuestionService.js';

const router = express.Router();
const authMiddleware = new AuthMiddleware();

// Initialize services
const geminiService = new GeminiService();
const chromaService = new ChromaService();
const questionService = new QuestionService();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all question sets
router.get('/question-sets', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM question_sets ORDER BY name'
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching question sets:', error);
    return res.status(500).json({ error: 'Failed to fetch question sets' });
  }
});

// Get question set details with questions
router.get('/question-sets/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get question set
    const setResult = await pool.query('SELECT * FROM question_sets WHERE id = $1', [id]);
    if (setResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question set not found' });
    }
    
    // Get questions
    const questionsResult = await pool.query('SELECT * FROM questions WHERE question_set_id = $1 ORDER BY id', [id]);
    
    const questionSet = setResult.rows[0];
    questionSet.questions = questionsResult.rows;
    
    return res.json(questionSet);
  } catch (error) {
    console.error('Error fetching question set details:', error);
    return res.status(500).json({ error: 'Failed to fetch question set details' });
  }
});

// Get questions by set ID
router.get('/question-sets/:id/questions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM questions WHERE question_set_id = $1 ORDER BY id',
      [id]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Create new question set
router.post('/question-sets', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const { name, description, category, difficulty } = req.body;
    
    const result = await pool.query(
      'INSERT INTO question_sets (name, description, category, difficulty) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, category, difficulty]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating question set:', error);
    return res.status(500).json({ error: 'Failed to create question set' });
  }
});

// Add question to set
router.post('/question-sets/:id/questions', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question_text, answers, explanation, difficulty } = req.body;
    
    const result = await pool.query(
      'INSERT INTO questions (question_set_id, question_text, answers, explanation, difficulty) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, JSON.stringify(question_text), JSON.stringify(answers), JSON.stringify(explanation), difficulty]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding question:', error);
    return res.status(500).json({ error: 'Failed to add question' });
  }
});

// Update question set
router.put('/question-sets/:id', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, difficulty, is_active } = req.body;
    
    const result = await pool.query(
      'UPDATE question_sets SET name = $1, description = $2, category = $3, difficulty = $4, is_active = $5 WHERE id = $6 RETURNING *',
      [name, description, category, difficulty, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question set not found' });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating question set:', error);
    return res.status(500).json({ error: 'Failed to update question set' });
  }
});

// Update question
router.put('/questions/:id', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question_text, answers, explanation, difficulty } = req.body;
    
    const result = await pool.query(
      'UPDATE questions SET question_text = $1, answers = $2, explanation = $3, difficulty = $4 WHERE id = $5 RETURNING *',
      [JSON.stringify(question_text), JSON.stringify(answers), JSON.stringify(explanation), difficulty, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question set
router.delete('/question-sets/:id', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Delete questions first (due to foreign key constraint)
    await pool.query('DELETE FROM questions WHERE question_set_id = $1', [id]);
    
    const result = await pool.query('DELETE FROM question_sets WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question set not found' });
    }
    
    return res.json({ message: 'Question set deleted successfully' });
  } catch (error) {
    console.error('Error deleting question set:', error);
    return res.status(500).json({ error: 'Failed to delete question set' });
  }
});

// Delete question
router.delete('/questions/:id', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    return res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Export question set
router.get('/question-sets/:id/export', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get question set
    const setResult = await pool.query('SELECT * FROM question_sets WHERE id = $1', [id]);
    if (setResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question set not found' });
    }
    
    // Get questions
    const questionsResult = await pool.query('SELECT * FROM questions WHERE question_set_id = $1 ORDER BY id', [id]);
    
    const exportData = {
      questionSet: setResult.rows[0],
      questions: questionsResult.rows
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="question-set-${id}.json"`);
    return res.json(exportData);
  } catch (error) {
    console.error('Error exporting question set:', error);
    return res.status(500).json({ error: 'Failed to export question set' });
  }
});

// Import question set
router.post('/question-sets/import', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const { questionSet, questions } = req.body;
    
    // Create question set
    const setResult = await pool.query(
      'INSERT INTO question_sets (name, description, category, difficulty) VALUES ($1, $2, $3, $4) RETURNING *',
      [questionSet.name, questionSet.description, questionSet.category, questionSet.difficulty]
    );
    
    const setId = setResult.rows[0].id;
    
    // Import questions
    for (const question of questions) {
      await pool.query(
        'INSERT INTO questions (question_set_id, question_text, answers, explanation, difficulty) VALUES ($1, $2, $3, $4, $5)',
        [setId, JSON.stringify(question.question_text), JSON.stringify(question.answers), JSON.stringify(question.explanation), question.difficulty]
      );
    }
    
    return res.status(201).json({
      message: 'Question set imported successfully',
      questionSetId: setId,
      questionsImported: questions.length
    });
  } catch (error) {
    console.error('Error importing question set:', error);
    return res.status(500).json({ error: 'Failed to import question set' });
  }
});

// Get question statistics
router.get('/question-sets/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_questions,
        AVG(difficulty) as avg_difficulty,
        MIN(difficulty) as min_difficulty,
        MAX(difficulty) as max_difficulty
      FROM questions 
      WHERE question_set_id = $1
    `, [id]);
    
    return res.json(statsResult.rows[0]);
  } catch (error) {
    console.error('Error fetching question statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch question statistics' });
  }
});

// AI Question Generation Endpoints

// Generate questions using Gemini AI
router.post('/question-sets/generate', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const request: QuestionGenerationRequest = req.body;
    
    // Validate request
    const validation = geminiService.validateGenerationRequest(request);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: validation.errors 
      });
    }
    
    // Generate questions
    const result = await geminiService.generateQuestions(request);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to generate questions', 
        details: result.error 
      });
    }
    
    // Create question set
    const questionSetData = geminiService.createQuestionSetData(request, result.questions);
    const questionSet = await questionService.createQuestionSet(questionSetData);
    
    // Add questions to the set
    const questionData = geminiService.convertToQuestionData(result.questions, questionSet.id);
    const createdQuestions = [];
    
    for (const qData of questionData) {
      const question = await questionService.createQuestion(qData);
      createdQuestions.push(question);
    }
    
    return res.status(201).json({
      success: true,
      questionSet,
      questions: createdQuestions,
      metadata: result.metadata,
      message: `Successfully generated ${createdQuestions.length} questions`
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    return res.status(500).json({ 
      error: 'Failed to generate questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test Gemini API connection
router.get('/ai/test-gemini', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const result = await geminiService.testConnection();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Test ChromaDB connection
router.get('/ai/test-chroma', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const result = await chromaService.testConnection();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get ChromaDB statistics
router.get('/ai/chroma-stats', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const stats = await chromaService.getCollectionStats();
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to get ChromaDB statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add documents to ChromaDB
router.post('/ai/add-documents', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const { content, metadata } = req.body;
    
    if (!content || !metadata) {
      return res.status(400).json({ 
        error: 'Content and metadata are required' 
      });
    }
    
    const document = chromaService.createDocument(content, metadata);
    const result = await chromaService.addDocuments([document], metadata);
    
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to add documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search ChromaDB for context
router.post('/ai/search-context', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const { query, nResults = 5, subject } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }
    
    let results;
    if (subject) {
      results = await chromaService.searchBySubject(subject, query, nResults);
    } else {
      results = await chromaService.search(query, nResults);
    }
    
    return res.json({
      success: true,
      results,
      count: results.length
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to search context',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available sources and subjects
router.get('/ai/available-data', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const [sources, subjects] = await Promise.all([
      chromaService.getAvailableSources(),
      chromaService.getAvailableSubjects()
    ]);
    
    return res.json({
      sources,
      subjects
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to get available data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 