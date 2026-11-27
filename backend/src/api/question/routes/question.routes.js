import express from "express";
import {
  searchQuestionsSemanticValidation,
  getSimilarQuestionsValidation,
  createQuestionValidation,
  getQuestionsValidation,
  getSingleQuestionValidation,
  generateQuestionDraftCoachValidation,
  assessAnswerAgainstQuestionValidation,
} from "../validations/question.validation.js";
import {
  createQuestionController,
  getQuestionsController,
  getSingleQuestionController,
  generateQuestionDraftCoachController,
  searchQuestionsSemanticController,
  getSimilarQuestionsController,
  assessAnswerAgainstQuestionController,
} from "../controller/question.controller.js";
import { authenticateUser } from "../../../middleware/authentication.js";

const router = express.Router();

// T-10: Get all Question
router.get(
  "/",
  authenticateUser,
  getQuestionsValidation,
  getQuestionsController,
);

/**
 * @route GET /api/questions/search
 * @desc Semantic search for question using vector embeddings based on a text query
 * @access private
 */

router.get(
  "/search",
  authenticateUser,
  searchQuestionsSemanticValidation,
  searchQuestionsSemanticController,
);

/**
 * @route GET /api/questions/:questionHash/similar
 * @desc Get similar questions based on vector embeddings
 * @access Private
 */
router.get(
  "/:questionHash/similar",
  authenticateUser,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

//T-10: Get Single Question
router.get(
  "/:questionHash",
  authenticateUser,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

/**
 * @route POST /api/questions
 * @desc Post a new question
 * @access Protected
 */
router.post(
  "/",
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

// Register protected endpoint//T-18 start here
/**
 * @route POST /api/questions/:questionHash/answer-fit
 * @desc AI relevance check for an answer draft vs the question
 * @access Private
 */
router.post(
  "/:questionHash/answer-fit",
  authenticateUser,
  assessAnswerAgainstQuestionValidation,
  assessAnswerAgainstQuestionController,
);
// T-18 end here

export default router;
