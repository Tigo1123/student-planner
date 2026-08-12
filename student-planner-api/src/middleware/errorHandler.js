import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export function notFound(request, _response, next) {
  next(new HttpError(404, "NOT_FOUND", `Route ${request.method} ${request.path} was not found.`));
}

export function errorHandler(error, request, response, _next) {
  const isKnownError = error instanceof HttpError;
  const status = isKnownError ? error.status : 500;
  const payload = {
    error: {
      code: isKnownError ? error.code : "INTERNAL_ERROR",
      message: isKnownError ? error.message : "An unexpected error occurred.",
    },
  };

  if (isKnownError && error.details) payload.error.details = error.details;
  if (!isKnownError) {
    if (env.NODE_ENV === "production") {
      console.error("Unhandled request error.", {
        method: request.method,
        path: request.path,
        name: error?.name || "Error",
      });
    } else {
      console.error(error);
    }
  }

  response.status(status).json(payload);
}
