import express from 'express';
import {
  createQuestionController
} from '../controller/question.controller.js';
import {
  createQuestionValidation
} from '../validations/question.validation.js';
import { authenticateUser } from '../../../middleware/authentication.js';

const router = express.Router();

/**
 * @route POST /api/questions
 * @desc Post a new question
 * @access Protected
 */
router.post(
  '/',
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);
// Register protected endpoint for AI coaching
/**
 * @route POST /api/questions/draft-coach
 * @desc AI suggestions for a question draft (title + body)
 * @access Private
 */
router.post(
  "/draft-coach",
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);











export default router;
