import { StatusCodes } from 'http-status-codes';
import {
  createAnswerService,
  deleteAnswerService,
  getAnswersService,
  getSingleAnswerService,
  updateAnswerService,
} from '../services/answer.service.js';

export const createAnswerController = async (req, res, next) => {
  try {
    const { questionId, content } = req.body;
    const answer = await createAnswerService({
      questionId,
      content,
      userId: req.user.id,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Answer posted successfully.',
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnswersController = async (req, res, next) => {
  try {
    const result = await getAnswersService({
      questionId: req.query.questionId,
      sortBy: req.query.sortBy,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answers fetched successfully.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleAnswerController = async (req, res, next) => {
  try {
    const answer = await getSingleAnswerService(req.params.answerId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answer fetched successfully.',
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAnswerController = async (req, res, next) => {
  try {
    const answer = await updateAnswerService({
      answerId: req.params.answerId,
      content: req.body.content,
      userId: req.user.id,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answer updated successfully.',
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnswerController = async (req, res, next) => {
  try {
    const result = await deleteAnswerService({
      answerId: req.params.answerId,
      userId: req.user.id,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answer deleted successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
