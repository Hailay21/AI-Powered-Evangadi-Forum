import express from 'express';
import {

  createQuestionController, searchQuestionsSemanticController,
} from '../controller/question.controller.js';
import {
  createQuestionValidation,searchQuestionsSemanticValidation,
} from '../validations/question.validation.js';

  createQuestionController,
  getQuestionsController,
  getSingleQuestionController,
} from "../controller/question.controller.js";
import {
  createQuestionValidation,
  getQuestionsValidation,
  getSingleQuestionValidation,
} from "../validations/question.validation.js";

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

// T-10: Get all Question
router.get(
  "/",
  authenticateUser,
  getQuestionsValidation,
  getQuestionsController,
);

//T-10: Get Single Question
router.get(
  "/:questionHash",
  authenticateUser,
  getSingleQuestionValidation,
  getSingleQuestionController,
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
