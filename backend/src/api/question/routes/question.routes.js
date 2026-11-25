import express from 'express';
import {
  createQuestionController, searchQuestionsSemanticController,
} from '../controller/question.controller.js';
import {
  createQuestionValidation,searchQuestionsSemanticValidation,
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


/**
 * @route GET /api/questions/search
 * @desc Semantic search for question using vector embeddings based on a text query
 * @access private
 */

router.get(
  '/search',
  authenticateUser,
  searchQuestionsSemanticValidation,
  searchQuestionsSemanticController,
);









export default router;
