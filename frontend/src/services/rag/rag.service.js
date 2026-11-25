import { apiClient } from "../core/api.client.js";

export const ragService = {
  async listDocuments() {
    const response = await apiClient.get("/api/rag/documents");
    return response.data;
  },
  async uploadPdf(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/api/rag/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 0,
    });
    return response.data;
  },
  async deleteDocument(documentId) {
    const response = await apiClient.delete(`/api/rag/documents/${documentId}`);
    return response.data;
  },
  async getDocument(documentId) {
    const response = await apiClient.get(`/api/rag/documents/${documentId}`);
    return response.data;
  },
  async searchInDocument(documentId, query) {
    const response = await apiClient.get(
      `/api/rag/documents/${documentId}/search`,
      { params: { query }, timeout: 120000 },
    );
    return response.data;
  },
  async queryDocument(documentId, query) {
    const response = await apiClient.post(
      `/api/rag/documents/${documentId}/query`,
      { query },
      { timeout: 120000 },
    );
    return response.data;
  },
  async fetchPdfObjectUrl(documentId) {
    const response = await apiClient.get(
      `/api/rag/documents/${documentId}/file`,
      { responseType: "blob" },
    );
    return URL.createObjectURL(response.data);
  },
};