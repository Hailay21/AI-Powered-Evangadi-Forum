import { apiClient } from "../core/api.client.js";

/**
 * Posts a new answer to a question.
 * @param {number|string} questionId - Numeric question id
 * @param {string} content - Answer body (min 20 chars)
 */
export async function postAnswer(questionId, content) {
  const response = await apiClient.post("/api/answers", {
    questionId,
    content,
  });
  return response.data;
}

export const answerService = {
  postAnswer,
};
