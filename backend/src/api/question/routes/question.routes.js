import express from 'express';
import {
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











export default router;
