import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { createAnswerValidation } from "../validations/answer.validation.js";
import { createAnswerController } from "../controller/answer.controller.js";

const router = express.Router();

/**
 * @route POST /api/answers
 * @desc Post an answer to a community question
 * @access Private
 */
router.post(
  "/",
  authenticateUser,
  createAnswerValidation,
  createAnswerController,
);

export default router;
