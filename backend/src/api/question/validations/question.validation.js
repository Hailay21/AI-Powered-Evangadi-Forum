import { body, param, query } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

export const createQuestionValidation = [
  body('title')
    .notEmpty()
    .withMessage('Question title is required')
    .isString()
    .withMessage('Question title must be a string')
    .isLength({ min: 5, max: 255 })
    .withMessage('Question title must be between 5 and 255 characters')
    .trim(),
  body('content')
    .notEmpty()
    .withMessage('Question content is required')
    .isString()
    .withMessage('Question content must be a string')
    .isLength({ min: 10 })
    .withMessage('Question content must be at least 10 characters')
    .trim(),
  validationErrorHandler,
];
// Validate title and content
export const generateQuestionDraftCoachValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage("Question title must be a string")
    .isLength({ max: 255 })
    .withMessage("Question title must not exceed 255 characters")
    .trim(),
  body("content")
    .notEmpty()
    .withMessage("Question content is required")
    .isString()
    .withMessage("Question content must be a string")
    .isLength({ min: 10 })
    .withMessage("Question content must be at least 10 characters")
    .trim(),
  validationErrorHandler,
];

