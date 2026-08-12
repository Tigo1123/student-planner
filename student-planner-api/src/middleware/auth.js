import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AUTH_COOKIE_NAME, clearAuthCookie } from "../utils/cookies.js";
import { HttpError } from "../utils/httpError.js";

export function requireAuth(request, response, next) {
  const token = request.cookies[AUTH_COOKIE_NAME];
  if (!token) {
    next(new HttpError(401, "UNAUTHENTICATED", "Authentication is required."));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: "student-planner-api",
      audience: "student-planner-web",
    });
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      throw new Error("Invalid token subject.");
    }
    request.auth = { userId: payload.sub };
    next();
  } catch {
    clearAuthCookie(response);
    next(new HttpError(401, "UNAUTHENTICATED", "Authentication is required."));
  }
}
