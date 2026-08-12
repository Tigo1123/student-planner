import { env } from "../config/env.js";

export const AUTH_COOKIE_NAME = "student_planner_session";
export const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function baseCookieOptions() {
  const isProduction = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
  };
}

export function setAuthCookie(response, token) {
  response.cookie(AUTH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: AUTH_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookie(response) {
  response.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions());
}
