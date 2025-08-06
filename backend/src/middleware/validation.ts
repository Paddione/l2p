import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler.js';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}

export class ValidationMiddleware {
  /**
   * Validate request data against Joi schemas
   */
  static validate = (schema: ValidationSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const errors: string[] = [];

      // Validate request body
      if (schema.body) {
        const { error } = schema.body.validate(req.body);
        if (error) {
          errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
        }
      }

      // Validate request parameters
      if (schema.params) {
        const { error } = schema.params.validate(req.params);
        if (error) {
          errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
        }
      }

      // Validate query parameters
      if (schema.query) {
        const { error } = schema.query.validate(req.query);
        if (error) {
          errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
        }
      }

      // Validate headers
      if (schema.headers) {
        const { error } = schema.headers.validate(req.headers);
        if (error) {
          errors.push(`Headers: ${error.details.map(d => d.message).join(', ')}`);
        }
      }

      if (errors.length > 0) {
        throw new ValidationError('Request validation failed', {
          errors,
          receivedData: {
            body: req.body,
            params: req.params,
            query: req.query
          }
        });
      }

      next();
    };
  };

  /**
   * Common validation schemas
   */
  static schemas = {
    // User registration validation
    userRegistration: {
      body: Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).max(128).required()
      })
    },

    // User login validation
    userLogin: {
      body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
      })
    },

    // Lobby creation validation
    lobbyCreation: {
      body: Joi.object({
        questionCount: Joi.number().integer().min(1).max(100).default(10),
        questionSetIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
        settings: Joi.object({
          timeLimit: Joi.number().integer().min(10).max(300).default(60),
          allowReplay: Joi.boolean().default(true)
        }).default({})
      })
    },

    // Lobby join validation
    lobbyJoin: {
      body: Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        character: Joi.string().min(1).max(50).required()
      }),
      params: Joi.object({
        code: Joi.string().length(6).alphanum().required()
      })
    },

    // Answer submission validation
    answerSubmission: {
      body: Joi.object({
        questionId: Joi.number().integer().positive().required(),
        selectedAnswer: Joi.string().required(),
        timeElapsed: Joi.number().min(0).max(60).required()
      })
    },

    // Hall of Fame submission validation
    hallOfFameSubmission: {
      body: Joi.object({
        username: Joi.string().min(3).max(30).required(),
        character: Joi.string().min(1).max(50).required(),
        score: Joi.number().integer().min(0).required(),
        accuracy: Joi.number().min(0).max(100).required(),
        maxMultiplier: Joi.number().integer().min(1).max(5).required(),
        questionSetId: Joi.number().integer().positive().required()
      })
    },

    // Generic ID parameter validation
    idParam: {
      params: Joi.object({
        id: Joi.number().integer().positive().required()
      })
    },

    // Lobby code parameter validation
    lobbyCodeParam: {
      params: Joi.object({
        code: Joi.string().length(6).alphanum().required()
      })
    },

    // Pagination query validation
    pagination: {
      query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string().valid('created_at', 'score', 'username').default('created_at'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
      })
    },

    // Question set query validation
    questionSetQuery: {
      query: Joi.object({
        category: Joi.string().max(50),
        difficulty: Joi.string().valid('easy', 'medium', 'hard'),
        isActive: Joi.boolean().default(true)
      })
    },

    // Create question set validation
    createQuestionSet: {
      body: Joi.object({
        name: Joi.string().min(1).max(100).required(),
        description: Joi.string().max(500),
        category: Joi.string().max(50),
        difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
        is_active: Joi.boolean().default(true)
      })
    },

    // Update question set validation
    updateQuestionSet: {
      body: Joi.object({
        name: Joi.string().min(1).max(100),
        description: Joi.string().max(500),
        category: Joi.string().max(50),
        difficulty: Joi.string().valid('easy', 'medium', 'hard'),
        is_active: Joi.boolean()
      })
    },

    // Create question validation
    createQuestion: {
      body: Joi.object({
        question_set_id: Joi.number().integer().positive().required(),
        question_text: Joi.object({
          en: Joi.string().min(1).required(),
          de: Joi.string().min(1).required()
        }).required(),
        answers: Joi.array().items(
          Joi.object({
            text: Joi.object({
              en: Joi.string().min(1).required(),
              de: Joi.string().min(1).required()
            }).required(),
            correct: Joi.boolean().required()
          })
        ).min(2).required(),
        explanation: Joi.object({
          en: Joi.string(),
          de: Joi.string()
        }),
        difficulty: Joi.number().integer().min(1).max(5).default(1)
      })
    },

    // Update question validation
    updateQuestion: {
      body: Joi.object({
        question_set_id: Joi.number().integer().positive(),
        question_text: Joi.object({
          en: Joi.string().min(1),
          de: Joi.string().min(1)
        }),
        answers: Joi.array().items(
          Joi.object({
            text: Joi.object({
              en: Joi.string().min(1),
              de: Joi.string().min(1)
            }),
            correct: Joi.boolean()
          })
        ).min(2),
        explanation: Joi.object({
          en: Joi.string(),
          de: Joi.string()
        }),
        difficulty: Joi.number().integer().min(1).max(5)
      })
    },

    // Get random questions validation
    getRandomQuestions: {
      body: Joi.object({
        questionSetIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
        count: Joi.number().integer().min(1).max(100).required(),
        difficulty: Joi.number().integer().min(1).max(5),
        excludeIds: Joi.array().items(Joi.number().integer().positive())
      })
    }
  };

  /**
   * Sanitize input data to prevent XSS and injection attacks
   */
  static sanitize = (req: Request, res: Response, next: NextFunction): void => {
    // Sanitize string values in body
    if (req.body && typeof req.body === 'object') {
      req.body = ValidationMiddleware.sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = ValidationMiddleware.sanitizeObject(req.query);
    }

    next();
  };

  /**
   * Recursively sanitize object properties
   */
  private static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return obj
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    }

    if (Array.isArray(obj)) {
      return obj.map(item => ValidationMiddleware.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = ValidationMiddleware.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Rate limiting validation for specific endpoints
   */
  static rateLimitValidation = (maxRequests: number, windowMs: number) => {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const clientId = req.ip || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      for (const [key, value] of requests.entries()) {
        if (value.resetTime < windowStart) {
          requests.delete(key);
        }
      }

      // Get or create client entry
      let clientData = requests.get(clientId);
      if (!clientData || clientData.resetTime < windowStart) {
        clientData = { count: 0, resetTime: now + windowMs };
        requests.set(clientId, clientData);
      }

      // Check rate limit
      if (clientData.count >= maxRequests) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
        return;
      }

      // Increment counter
      clientData.count++;

      next();
    };
  };
}

// Export convenience functions
export const validate = ValidationMiddleware.validate;
export const sanitize = ValidationMiddleware.sanitize;
export const rateLimitValidation = ValidationMiddleware.rateLimitValidation;
export const validationSchemas = ValidationMiddleware.schemas;