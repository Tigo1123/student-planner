import { prisma } from "../config/database.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AUTH_COOKIE_NAME, clearAuthCookie } from "../utils/cookies.js";
import { HttpError } from "../utils/httpError.js";

export async function requireAuth(request, response, next) {
  const token = request.cookies[AUTH_COOKIE_NAME];
  if (!token) {
    next(new HttpError(401, "UNAUTHENTICATED", "Authentication is required."));
    return;
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: "student-planner-api",
      audience: "student-planner-web",
    });
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      throw new Error("Invalid token subject.");
    }

  } catch {
    clearAuthCookie(response);
    next(new HttpError(401, "UNAUTHENTICATED", "Authentication is required."));
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { sessionVersion: true } });
    if (!user || (payload.ver ?? 0) !== user.sessionVersion) {
      clearAuthCookie(response);
      return next(new HttpError(401, "UNAUTHENTICATED", "Authentication is required."));
    }
    request.auth = { userId: payload.sub };
    next();
  } catch (error) { next(error); }
}
