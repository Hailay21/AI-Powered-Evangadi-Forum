import { apiClient } from '../core/api.client.js';

/**
 * Fetch community questions. `mine` limits results to the authenticated user.
 * The API wraps results in { success, data, meta }.
 */
export async function getQuestions({ search, mine } = {}) {
  const params = {};
  if (search?.trim()) params.search = search.trim();
  if (mine) params.mine = true;
  const response = await apiClient.get('/api/questions', { params });
  return response.data?.data ?? response.data ?? [];
}

/** Run vector-based semantic search against the question collection. */
export async function searchQuestionsSemantic(query) {
  const response = await apiClient.get('/api/questions/search', {
    params: { query: query.trim() },
  });
  return response.data?.data ?? response.data ?? [];
}

export const questionService = { getQuestions, searchQuestionsSemantic };
