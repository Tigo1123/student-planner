import { apiRequest } from "../api/apiClient.js";

export function registerUser(credentials) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function loginUser(credentials) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function logoutUser() {
  return apiRequest("/api/auth/logout", { method: "POST" });
}

export function getCurrentUser() {
  return apiRequest("/api/auth/me");
}
