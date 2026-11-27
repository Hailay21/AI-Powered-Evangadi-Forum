import express from "express";
import {
  searchQuestionsSemanticValidation,
  getSimilarQuestionsValidation,
  createQuestionValidation,
  getQuestionsValidation,
  getSingleQuestionValidation,
  generateQuestionDraftCoachValidation,
  assessAnswerAgainstQuestionValidation,
  createAnswerValidation,
} from "../validations/question.validation.js";
import {
  createQuestionController,
  getQuestionsController,
  getSingleQuestionController,
  generateQuestionDraftCoachController,
  searchQuestionsSemanticController,
  getSimilarQuestionsController,
  assessAnswerAgainstQuestionController,
  createAnswerController,
} from "../controller/question.controller.js";
import { authenticateUser } from "../../../middleware/authentication.js";

const router = express.Router();

router.get(
  "/",
  authenticateUser,
  getQuestionsValidation,
  getQuestionsController,
);

router.get(
  "/search",
  authenticateUser,
  searchQuestionsSemanticValidation,
  searchQuestionsSemanticController,
);

router.post(
  "/",
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);

router.post(
  "/draft-coach",
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

router.get(
  "/:questionHash/similar",
  authenticateUser,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

router.post(
  "/:questionHash/answer-fit",
  authenticateUser,
  assessAnswerAgainstQuestionValidation,
  assessAnswerAgainstQuestionController,
);

router.post(
  "/:questionHash/answers",
  authenticateUser,
  createAnswerValidation,
  createAnswerController,
);

router.get(
  "/:questionHash",
  authenticateUser,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

export default router;
