import { apiRequest } from "./apiClient.js";

export function getProfile() { return apiRequest("/api/users/me"); }
export function updateProfile(name) { return apiRequest("/api/users/me", { method: "PATCH", body: JSON.stringify({ name }) }); }
export function uploadAvatar(file) {
  const body = new FormData();
  body.append("avatar", file);
  return apiRequest("/api/users/me/avatar", { method: "POST", body });
}
export function removeAvatar() { return apiRequest("/api/users/me/avatar", { method: "DELETE" }); }
