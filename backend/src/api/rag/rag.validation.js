import { body, param, query } from 'express-validator';
import { validationErrorHandler } from '../../middleware/validation-handler.js';

export const documentIdParamValidation = [
  param('documentId')
    .isInt({ min: 1 })
    .withMessage('Document id must be a positive integer')
    .toInt(),
  validationErrorHandler,
];

export const searchDocumentValidation = [
  ...documentIdParamValidation.slice(0, -1),
  query('query')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ max: 2000 })
    .withMessage('Search query must not exceed 2000 characters'),
  query('k')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('k must be between 1 and 20')
    .toInt(),
  validationErrorHandler,
];

export const queryDocumentValidation = [
  ...documentIdParamValidation.slice(0, -1),
  body('query')
    .trim()
    .notEmpty()
    .withMessage('Question is required')
    .isLength({ max: 2000 })
    .withMessage('Question must not exceed 2000 characters'),
  body('k')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('k must be between 1 and 20')
    .toInt(),
  validationErrorHandler,
];
