import { apiRequest } from "./apiClient.js";

export function getTasks() {
  return apiRequest("/api/tasks");
}

export function createTask(task) {
  return apiRequest("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export function updateTask(taskId, updates) {
  return apiRequest(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function deleteTask(taskId) {
  return apiRequest(`/api/tasks/${taskId}`, { method: "DELETE" });
}

export function getEvents() {
  return apiRequest("/api/events");
}

export function createEvent(event) {
  return apiRequest("/api/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export function updateEvent(eventId, updates) {
  return apiRequest(`/api/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function deleteEvent(eventId) {
  return apiRequest(`/api/events/${eventId}`, { method: "DELETE" });
}

export function importLegacyPlannerData(data) {
  return apiRequest("/api/planner/import", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
