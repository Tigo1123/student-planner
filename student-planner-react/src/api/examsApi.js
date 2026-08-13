import { apiRequest } from "./apiClient.js";

export const getExams = () => apiRequest("/api/exams?limit=100");
export const getExam = (id) => apiRequest(`/api/exams/${id}`);
export const createExam = (exam) => apiRequest("/api/exams", { method: "POST", body: JSON.stringify(exam) });
export const updateExam = (id, updates) => apiRequest(`/api/exams/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
export const deleteExam = (id) => apiRequest(`/api/exams/${id}`, { method: "DELETE" });
