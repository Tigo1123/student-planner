import { apiRequest } from "./apiClient.js";
export const getSchedule = () => apiRequest("/api/schedule?limit=100");
export const getScheduleItem = (id) => apiRequest(`/api/schedule/${id}`);
export const createSchedule = (item) => apiRequest("/api/schedule", { method: "POST", body: JSON.stringify(item) });
export const updateSchedule = (id, item) => apiRequest(`/api/schedule/${id}`, { method: "PATCH", body: JSON.stringify(item) });
export const deleteSchedule = (id) => apiRequest(`/api/schedule/${id}`, { method: "DELETE" });
