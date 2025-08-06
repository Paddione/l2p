import express from 'express';
import { QuestionService } from '../services/QuestionService.js';
import { ValidationMiddleware } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../middleware/errorHandler.js';

const router = express.Router();
const questionService = new QuestionService();

// Get question statistics
router.get('/stats', asyncHandler(async (req: express.Request, res: express.Response) => {
  const stats = await questionService.getQuestionSetStats();
  
  res.json({
    success: true,
    data: stats
  });
}));

// Get available categories
router.get('/categories', asyncHandler(async (req: express.Request, res: express.Response) => {
  const categories = await questionService.getAvailableCategories();
  
  res.json({
    success: true,
    data: categories
  });
}));

// Get all question sets
router.get('/sets', asyncHandler(async (req: express.Request, res: express.Response) => {
  const activeOnly = req.query.active !== 'false';
  const questionSets = await questionService.getAllQuestionSetsWithStats(activeOnly);
  
  res.json({
    success: true,
    data: questionSets
  });
}));

// Get question set by ID
router.get('/sets/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id || '');
  if (isNaN(id)) {
    throw new ValidationError('Invalid question set ID');
  }
  
  const questionSet = await questionService.getQuestionSetWithStats(id);
  if (!questionSet) {
    res.status(404).json({
      success: false,
      error: 'Question set not found'
    });
    return;
  }
  
  res.json({
    success: true,
    data: questionSet
  });
}));

// Get question sets by category
router.get('/sets/category/:category', asyncHandler(async (req: express.Request, res: express.Response) => {
  const category = req.params.category || '';
  const questionSets = await questionService.getQuestionSetsByCategory(category);
  
  res.json({
    success: true,
    data: questionSets
  });
}));

// Create question set
router.post('/sets', ValidationMiddleware.validate({
  body: ValidationMiddleware.schemas.createQuestionSet.body
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const validation = questionService.validateQuestionSetData(req.body);
  if (!validation.isValid) {
    throw new ValidationError('Invalid question set data', validation.errors);
  }
  
  const questionSet = await questionService.createQuestionSet(req.body);
  
  res.status(201).json({
    success: true,
    data: questionSet
  });
}));

// Update question set
router.put('/sets/:id', ValidationMiddleware.validate({
  body: ValidationMiddleware.schemas.updateQuestionSet.body
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id || '');
  if (isNaN(id)) {
    throw new ValidationError('Invalid question set ID');
  }
  
  const questionSet = await questionService.updateQuestionSet(id, req.body);
  if (!questionSet) {
    res.status(404).json({
      success: false,
      error: 'Question set not found'
    });
    return;
  }
  
  res.json({
    success: true,
    data: questionSet
  });
}));

// Delete question set
router.delete('/sets/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id || '');
  if (isNaN(id)) {
    throw new ValidationError('Invalid question set ID');
  }
  
  const deleted = await questionService.deleteQuestionSet(id);
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Question set not found'
    });
    return;
  }
  
  res.json({
    success: true,
    message: 'Question set deleted successfully'
  });
}));

// Get questions by set ID
router.get('/sets/:id/questions', asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id || '');
  if (isNaN(id)) {
    throw new ValidationError('Invalid question set ID');
  }
  
  const language = (req.query.lang as 'en' | 'de') || 'en';
  const questions = await questionService.getQuestionsBySetId(id);
  const localizedQuestions = await questionService.getLocalizedQuestions(questions, language);
  
  res.json({
    success: true,
    data: localizedQuestions
  });
}));

// Get random questions
router.post('/random', ValidationMiddleware.validate({
  body: ValidationMiddleware.schemas.getRandomQuestions.body
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { questionSetIds, count, difficulty, excludeIds } = req.body;
  const language = (req.query.lang as 'en' | 'de') || 'en';
  
  const questions = await questionService.getRandomQuestions({
    questionSetIds,
    count,
    difficulty,
    excludeIds
  });
  
  const localizedQuestions = await questionService.getLocalizedQuestions(questions, language);
  
  res.json({
    success: true,
    data: localizedQuestions
  });
}));

// Search questions
router.get('/search', asyncHandler(async (req: express.Request, res: express.Response) => {
  const searchTerm = req.query.q as string;
  const questionSetId = req.query.setId ? parseInt(req.query.setId as string) : undefined;
  const language = (req.query.lang as 'en' | 'de') || 'en';
  
  if (!searchTerm) {
    throw new ValidationError('Search term is required');
  }
  
  const questions = await questionService.searchQuestions(searchTerm, questionSetId);
  const localizedQuestions = await questionService.getLocalizedQuestions(questions, language);
  
  res.json({
    success: true,
    data: localizedQuestions
  });
}));

// Get question by ID
router.get('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id || '');
  if (isNaN(id)) {
    throw new ValidationError('Invalid question ID');
  }
  
  const language = (req.query.lang as 'en' | 'de') || 'en';
  const question = await questionService.getQuestionById(id);
  
  if (!question) {
    res.status(404).json({
      success: false,
      error: 'Question not found'
    });
    return;
  }
  
  const localizedQuestion = questionService.getLocalizedQuestion(question, language);
  
  res.json({
    success: true,
    data: localizedQuestion
  });
}));

// Create question
router.post('/', ValidationMiddleware.validate({
  body: ValidationMiddleware.schemas.createQuestion.body
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const validation = questionService.validateQuestionData(req.body);
  if (!validation.isValid) {
    throw new ValidationError('Invalid question data', validation.errors);
  }
  
  const question = await questionService.createQuestion(req.body);
  
  res.status(201).json({
    success: true,
    data: question
  });
}));

// Update question
router.put('/:id', ValidationMiddleware.validate({
  body: ValidationMiddleware.schemas.updateQuestion.body
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id || '');
  if (isNaN(id)) {
    throw new ValidationError('Invalid question ID');
  }
  
  const question = await questionService.updateQuestion(id, req.body);
  if (!question) {
    res.status(404).json({
      success: false,
      error: 'Question not found'
    });
    return;
  }
  
  res.json({
    success: true,
    data: question
  });
}));

// Delete question
router.delete('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id || '');
  if (isNaN(id)) {
    throw new ValidationError('Invalid question ID');
  }
  
  const deleted = await questionService.deleteQuestion(id);
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Question not found'
    });
    return;
  }
  
  res.json({
    success: true,
    message: 'Question deleted successfully'
  });
}));

export default router; 