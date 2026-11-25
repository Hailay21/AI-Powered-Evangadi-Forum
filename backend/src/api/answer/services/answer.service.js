import { safeExecute } from '../../../../db/config.js';
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from '../../../utils/errors/index.js';

const mapAnswer = row => ({
  id: row.id,
  questionId: row.questionId,
  content: row.content,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  author: {
    id: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
  },
});

const getQuestionOwner = async questionId => {
  const rows = await safeExecute(
    'SELECT question_id, user_id FROM questions WHERE question_id = ? LIMIT 1',
    [questionId],
  );
  if (rows.length === 0) throw new NotFoundError('Question not found');
  return rows[0];
};

export const createAnswerService = async ({ questionId, userId, content }) => {
  const question = await getQuestionOwner(questionId);
  if (Number(question.user_id) === Number(userId)) {
    throw new BadRequestError('You cannot answer your own question');
  }

  const result = await safeExecute(
    'INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)',
    [questionId, userId, content],
  );
  return getSingleAnswerService(result.insertId);
};

export const getAnswersService = async ({ questionId, sortBy = 'newest' }) => {
  await getQuestionOwner(questionId);
  const orderBy =
    sortBy === 'oldest' ? 'a.created_at ASC' : 'a.created_at DESC';
  const rows = await safeExecute(
    `SELECT
       a.answer_id AS id,
       a.question_id AS questionId,
       a.content,
       a.created_at AS createdAt,
       a.updated_at AS updatedAt,
       u.user_id AS userId,
       u.first_name AS firstName,
       u.last_name AS lastName
     FROM answers a
     JOIN users u ON u.user_id = a.user_id
     WHERE a.question_id = ?
     ORDER BY ${orderBy}
     LIMIT 100`,
    [questionId],
  );
  return {
    data: rows.map(mapAnswer),
    meta: { limit: 100, total: rows.length, sortBy },
  };
};

export const getSingleAnswerService = async answerId => {
  const rows = await safeExecute(
    `SELECT
       a.answer_id AS id,
       a.question_id AS questionId,
       a.content,
       a.created_at AS createdAt,
       a.updated_at AS updatedAt,
       u.user_id AS userId,
       u.first_name AS firstName,
       u.last_name AS lastName
     FROM answers a
     JOIN users u ON u.user_id = a.user_id
     WHERE a.answer_id = ?
     LIMIT 1`,
    [answerId],
  );
  if (rows.length === 0) throw new NotFoundError('Answer not found');
  return mapAnswer(rows[0]);
};

const getAnswerOwner = async answerId => {
  const rows = await safeExecute(
    'SELECT answer_id, user_id FROM answers WHERE answer_id = ? LIMIT 1',
    [answerId],
  );
  if (rows.length === 0) throw new NotFoundError('Answer not found');
  return rows[0];
};

export const updateAnswerService = async ({ answerId, userId, content }) => {
  const answer = await getAnswerOwner(answerId);
  if (Number(answer.user_id) !== Number(userId)) {
    throw new UnauthenticatedError('You are not authorized to update this answer');
  }
  await safeExecute(
    'UPDATE answers SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE answer_id = ?',
    [content, answerId],
  );
  return getSingleAnswerService(answerId);
};

export const deleteAnswerService = async ({ answerId, userId }) => {
  const answer = await getAnswerOwner(answerId);
  if (Number(answer.user_id) !== Number(userId)) {
    throw new UnauthenticatedError('You are not authorized to delete this answer');
  }
  await safeExecute('DELETE FROM answers WHERE answer_id = ?', [answerId]);
  return { id: Number(answerId) };
};
