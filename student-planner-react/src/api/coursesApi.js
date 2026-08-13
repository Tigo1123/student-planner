import { apiRequest } from "./apiClient.js";

export function getCourses(archived = "exclude") {
  return apiRequest(`/api/courses?archived=${archived}&limit=100&withCounts=true`);
}
export function getCourse(courseId) {
  return apiRequest(`/api/courses/${courseId}`);
}
export function createCourse(course) {
  return apiRequest("/api/courses", { method: "POST", body: JSON.stringify(course) });
}
export function updateCourse(courseId, updates) {
  return apiRequest(`/api/courses/${courseId}`, { method: "PATCH", body: JSON.stringify(updates) });
}
export function archiveCourse(courseId) {
  return apiRequest(`/api/courses/${courseId}/archive`, { method: "POST", body: JSON.stringify({}) });
}
export function deleteCourse(courseId) {
  return apiRequest(`/api/courses/${courseId}`, { method: "DELETE" });
}
