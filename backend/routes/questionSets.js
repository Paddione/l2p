const express = require('express');
const multer = require('multer');
const router = express.Router();
const QuestionSet = require('../models/QuestionSet');
const { authenticateToken, authenticateOptionalToken } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory as Buffer
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        console.log('Multer fileFilter called with:', {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });
        
        // Only allow JSON files
        if (file.mimetype === 'application/json' || 
            file.originalname.endsWith('.json') ||
            file.mimetype === 'text/plain') { // Sometimes JSON is sent as text/plain
            cb(null, true);
        } else {
            console.log('File rejected by filter:', file.mimetype, file.originalname);
            cb(new Error('Only JSON files are allowed'), false);
        }
    }
});

// Get all available question sets (public + user's own)
router.get('/', authenticateOptionalToken, async (req, res) => {
    try {
        // If user is authenticated, get public + their own sets
        // If not authenticated, get only public sets
        const username = req.user ? req.user.username : null;
        const questionSets = await QuestionSet.findAvailable(username);
        res.json(questionSets.map(qs => qs.getSummary()));
    } catch (error) {
        console.error('Get question sets error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve question sets',
            code: 'QUESTION_SETS_RETRIEVAL_FAILED'
        });
    }
});

// Get user's own question sets
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const questionSets = await QuestionSet.findByCreator(req.user.username);
        res.json(questionSets.map(qs => qs.getSummary()));
    } catch (error) {
        console.error('Get user question sets error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve your question sets',
            code: 'USER_QUESTION_SETS_RETRIEVAL_FAILED'
        });
    }
});

// Get specific question set by ID
router.get('/:id', authenticateOptionalToken, async (req, res) => {
    try {
        const { id } = req.params;
        const questionSet = await QuestionSet.findById(parseInt(id));
        
        if (!questionSet) {
            return res.status(404).json({ 
                error: 'Question set not found',
                code: 'QUESTION_SET_NOT_FOUND'
            });
        }

        // Check if user has access (public or owns it)
        if (!questionSet.is_public && (!req.user || questionSet.created_by !== req.user.username)) {
            return res.status(403).json({ 
                error: 'Access denied',
                code: 'ACCESS_DENIED'
            });
        }

        res.json(questionSet.toJSON());
    } catch (error) {
        console.error('Get question set error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve question set',
            code: 'QUESTION_SET_RETRIEVAL_FAILED'
        });
    }
});

// Create new question set
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, questions, is_public = true } = req.body;

        // Validate required fields
        if (!name || !questions) {
            return res.status(400).json({ 
                error: 'Name and questions are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Check if name already exists
        const existing = await QuestionSet.findByName(name);
        if (existing) {
            return res.status(409).json({ 
                error: 'Question set with this name already exists',
                code: 'DUPLICATE_NAME'
            });
        }

        const questionSet = await QuestionSet.create({
            name,
            description,
            created_by: req.user.username,
            questions,
            is_public
        });

        res.status(201).json(questionSet.toJSON());
    } catch (error) {
        console.error('Create question set error:', error);
        
        if (error.message.includes('Invalid question format') || 
            error.message.includes('Questions must be a non-empty array')) {
            return res.status(400).json({ 
                error: error.message,
                code: 'INVALID_QUESTION_FORMAT'
            });
        }

        res.status(500).json({ 
            error: 'Failed to create question set',
            code: 'QUESTION_SET_CREATION_FAILED'
        });
    }
});

// Upload and create question set from JSON file
router.post('/upload', authenticateToken, (req, res, next) => {
    console.log('=== UPLOAD REQUEST DEBUG ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    console.log('Raw body available:', !!req.body);
    console.log('=== END DEBUG ===');
    next();
}, (req, res, next) => {
    // Handle multer upload with error handling
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ 
                        error: 'File too large. Maximum size is 5MB.',
                        code: 'FILE_TOO_LARGE'
                    });
                } else if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({ 
                        error: 'Too many files. Only one file allowed.',
                        code: 'TOO_MANY_FILES'
                    });
                } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({ 
                        error: 'Unexpected field name. Use "file" as the field name.',
                        code: 'UNEXPECTED_FIELD'
                    });
                }
                return res.status(400).json({ 
                    error: `Upload error: ${err.message}`,
                    code: 'MULTER_ERROR'
                });
            } else {
                return res.status(400).json({ 
                    error: err.message,
                    code: 'UPLOAD_ERROR'
                });
            }
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('Upload route hit');
        console.log('req.file:', req.file);
        console.log('req.body:', req.body);
        console.log('req.headers:', req.headers);
        
        if (!req.file) {
            console.log('No file found in request');
            return res.status(400).json({ 
                error: 'No file uploaded',
                code: 'NO_FILE_UPLOADED'
            });
        }

        console.log('File received:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
        });

        // Parse JSON file
        let fileData;
        try {
            fileData = JSON.parse(req.file.buffer.toString());
        } catch (parseError) {
            console.log('JSON parse error:', parseError);
            return res.status(400).json({ 
                error: 'Invalid JSON file format',
                code: 'INVALID_JSON_FORMAT'
            });
        }

        const { name, description, questions, is_public = true } = fileData;

        // Validate required fields
        if (!name || !questions) {
            return res.status(400).json({ 
                error: 'JSON file must contain "name" and "questions" fields',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Check if name already exists
        const existing = await QuestionSet.findByName(name);
        if (existing) {
            return res.status(409).json({ 
                error: 'Question set with this name already exists',
                code: 'DUPLICATE_NAME'
            });
        }

        const questionSet = await QuestionSet.create({
            name,
            description,
            created_by: req.user.username,
            questions,
            is_public
        });

        res.status(201).json(questionSet.toJSON());
    } catch (error) {
        console.error('Upload question set error:', error);
        
        if (error.message.includes('Invalid question format') || 
            error.message.includes('Questions must be a non-empty array')) {
            return res.status(400).json({ 
                error: error.message,
                code: 'INVALID_QUESTION_FORMAT'
            });
        }

        if (error.message === 'Only JSON files are allowed') {
            return res.status(400).json({ 
                error: 'Only JSON files are allowed',
                code: 'INVALID_FILE_TYPE'
            });
        }

        res.status(500).json({ 
            error: 'Failed to upload question set',
            code: 'QUESTION_SET_UPLOAD_FAILED'
        });
    }
});

// Update question set
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const questionSet = await QuestionSet.update(parseInt(id), updates, req.user.username);
        
        if (!questionSet) {
            return res.status(404).json({ 
                error: 'Question set not found or access denied',
                code: 'QUESTION_SET_NOT_FOUND_OR_ACCESS_DENIED'
            });
        }

        res.json(questionSet.toJSON());
    } catch (error) {
        console.error('Update question set error:', error);
        
        if (error.message.includes('Invalid question format')) {
            return res.status(400).json({ 
                error: error.message,
                code: 'INVALID_QUESTION_FORMAT'
            });
        }

        res.status(500).json({ 
            error: 'Failed to update question set',
            code: 'QUESTION_SET_UPDATE_FAILED'
        });
    }
});

// Delete question set
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const success = await QuestionSet.delete(parseInt(id), req.user.username);
        
        if (!success) {
            return res.status(404).json({ 
                error: 'Question set not found or access denied',
                code: 'QUESTION_SET_NOT_FOUND_OR_ACCESS_DENIED'
            });
        }

        res.json({ message: 'Question set deleted successfully' });
    } catch (error) {
        console.error('Delete question set error:', error);
        res.status(500).json({ 
            error: 'Failed to delete question set',
            code: 'QUESTION_SET_DELETION_FAILED'
        });
    }
});

module.exports = router; 