import { StatusCodes } from 'http-status-codes';
import {
  createQuestionWithVectorService,
  getQuestionsService,
  getSingleQuestionService,
} from "../services/question.service.js";

/**
 * Handles creating a new question.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const createQuestionController = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const result = await createQuestionWithVectorService({
      userId: req.user.id, // author id (authenticated user)
      title,
      content,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Question posted successfully.',
      data: result.question,
    });
  } catch (error) {
    next(error);
  }
};

//task-1 GET /api/questions

export const getQuestionsController = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      mine: req.query.mine,
      userId: req.user.id, // Pass the authenticated user's ID
    };

    const result = await getQuestionsService(filters);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Questions fetched successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

//task 2 GET /api/questions/:questionHash

export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const result = await getSingleQuestionService({
      questionHash,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Question fetched successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
