import { HttpError } from "./httpError.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireInput(schema, input, message = "Please correct the submitted data.") {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw new HttpError(400, "VALIDATION_ERROR", message, result.error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  })));
}

export function requireId(value, resource = "Record") {
  if (!UUID_PATTERN.test(value)) throw new HttpError(404, "NOT_FOUND", `${resource} was not found.`);
  return value;
}

export function notFound(resource) {
  return new HttpError(404, "NOT_FOUND", `${resource} was not found.`);
}
