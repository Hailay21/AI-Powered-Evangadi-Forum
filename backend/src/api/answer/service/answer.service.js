import { safeExecute } from "../../../../db/config.js";
import {
  BadRequestError,
  NotFoundError,
} from "../../../utils/errors/index.js";

/**
 * Creates an answer for an existing question.
 * Users cannot answer their own questions.
 */
export const createAnswerService = async ({ questionId, userId, content }) => {
  const questionRows = await safeExecute(
    "SELECT question_id AS id, user_id AS userId FROM questions WHERE question_id = ? LIMIT 1",
    [questionId],
  );

  if (questionRows.length === 0) {
    throw new NotFoundError("Question not found");
  }

  const question = questionRows[0];
  if (String(question.userId) === String(userId)) {
    throw new BadRequestError("You cannot answer your own question.");
  }

  let insertResult;
  try {
    insertResult = await safeExecute(
      "INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)",
      [questionId, userId, content],
    );
  } catch (error) {
    if (error?.code === "ER_NO_REFERENCED_ROW_2") {
      throw new BadRequestError("User or question does not exist.");
    }
    throw error;
  }

  const answerRows = await safeExecute(
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
    [insertResult.insertId],
  );

  const answer = answerRows[0];
  return {
    id: answer.id,
    questionId: answer.questionId,
    content: answer.content,
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
    author: {
      id: answer.userId,
      firstName: answer.firstName,
      lastName: answer.lastName,
    },
  };
};
