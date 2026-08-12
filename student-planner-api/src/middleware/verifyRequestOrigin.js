import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function verifyRequestOrigin(request, _response, next) {
  if (SAFE_METHODS.has(request.method) || env.NODE_ENV !== "production") {
    next();
    return;
  }

  if (request.get("origin") !== env.FRONTEND_ORIGIN) {
    next(new HttpError(403, "INVALID_ORIGIN", "The request origin is not allowed."));
    return;
  }

  next();
}
