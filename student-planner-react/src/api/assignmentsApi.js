import { apiRequest } from "./apiClient.js";

export function getAssignments() {
  return apiRequest("/api/assignments?limit=100&sort=due_asc");
}
export function getAssignment(assignmentId) {
  return apiRequest(`/api/assignments/${assignmentId}`);
}
export function createAssignment(assignment) {
  return apiRequest("/api/assignments", { method: "POST", body: JSON.stringify(assignment) });
}
export function updateAssignment(assignmentId, updates) {
  return apiRequest(`/api/assignments/${assignmentId}`, { method: "PATCH", body: JSON.stringify(updates) });
}
export function deleteAssignment(assignmentId) {
  return apiRequest(`/api/assignments/${assignmentId}`, { method: "DELETE" });
}
