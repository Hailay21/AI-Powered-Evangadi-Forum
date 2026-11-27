import { StatusCodes } from "http-status-codes";
import { createAnswerService } from "../service/answer.service.js";

/**
 * Handles creating a new answer.
 */
export const createAnswerController = async (req, res, next) => {
  try {
    const data = await createAnswerService({
      questionId: req.body.questionId,
      userId: req.user?.id,
      content: req.body.content,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Answer posted successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};
