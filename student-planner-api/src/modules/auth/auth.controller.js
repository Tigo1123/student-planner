import { clearAuthCookie, setAuthCookie } from "../../utils/cookies.js";
import { HttpError } from "../../utils/httpError.js";
import { findSafeUserById } from "../users/user.service.js";
import { authenticateUser, createAuthToken, registerUser } from "./auth.service.js";
import { loginSchema, registerSchema, validateBody } from "./auth.validation.js";

function requireValidBody(schema, body) {
  const result = validateBody(schema, body);
  if (result.validationError) {
    throw new HttpError(400, "VALIDATION_ERROR", "Please correct the highlighted fields.", result.validationError);
  }
  return result;
}

export async function register(request, response) {
  const input = requireValidBody(registerSchema, request.body);
  const user = await registerUser(input);
  setAuthCookie(response, createAuthToken(user.id));
  response.status(201).json({ user });
}

export async function login(request, response) {
  const input = requireValidBody(loginSchema, request.body);
  const { user, sessionVersion } = await authenticateUser(input);
  setAuthCookie(response, createAuthToken(user.id, sessionVersion));
  response.json({ user });
}

export function logout(_request, response) {
  clearAuthCookie(response);
  response.status(204).end();
}

export async function me(request, response) {
  const user = await findSafeUserById(request.auth.userId);
  if (!user) {
    clearAuthCookie(response);
    throw new HttpError(401, "UNAUTHENTICATED", "Authentication is required.");
  }
  response.json({ user });
}
