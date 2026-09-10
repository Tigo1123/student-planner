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

export function forgotPassword(email) {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST", body: JSON.stringify({ email }), signal: AbortSignal.timeout(15000),
  });
}
export function resetPassword(input) {
  return apiRequest("/api/auth/reset-password", {
    method: "POST", body: JSON.stringify(input), signal: AbortSignal.timeout(15000),
  });
}
