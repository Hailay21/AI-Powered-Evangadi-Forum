import { apiClient } from "./core/api.client";

/**
 * Get AI feedback and tips for a question draft.
 * POST /api/questions/draft-coach
 */
export const generateQuestionDraftCoach = async ({ title, content }) => {
  const response = await apiClient.post("/api/questions/draft-coach", {
    title,
    content,
  });
  return response.data;
};

/**
 * Create a new question.
 * POST /api/questions
 */
export const createQuestion = async ({ title, content }) => {
  const response = await apiClient.post("/api/questions", {
    title,
    content,
  });
  return response.data;
};
