const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function getAuthToken() {
  return (
    localStorage.getItem("token") || localStorage.getItem("authToken") || ""
  );
}

async function request(endpoint, payload) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function generateQuestionDraftCoach({ title, content }) {
  return request("/api/questions/draft-coach", {
    title: title.trim(),
    content: content.trim(),
  });
}

export async function createQuestion({ title, content }) {
  return request("/api/questions", {
    title: title.trim(),
    content: content.trim(),
  });
}
