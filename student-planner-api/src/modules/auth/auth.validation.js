import { z } from "zod";

const emailSchema = z.string().trim().email("Enter a valid email address.")
  .transform((email) => email.toLowerCase());

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name is too long."),
  email: emailSchema,
  password: z.string().min(8, "Password must contain at least 8 characters.").max(128),
}).strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(128),
}).strict();

export function validateBody(schema, body) {
  const result = schema.safeParse(body);
  if (result.success) return result.data;

  return {
    validationError: result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}
