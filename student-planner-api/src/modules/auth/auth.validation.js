import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email address.")
  .transform((email) => email.toLowerCase());

export const passwordSchema = z.string().min(8, "Password must contain at least 8 characters.").max(128, "Password must contain at most 128 characters.");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name is too long."),
  email: emailSchema,
  password: passwordSchema,
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

export const forgotPasswordSchema = z.object({ email: emailSchema }).strict();
export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "This reset link is invalid or has expired. Request a new link."),
  password: passwordSchema,
  confirmPassword: z.string().max(128),
}).strict().refine(value => value.password === value.confirmPassword, {
  path: ["confirmPassword"], message: "Passwords do not match.",
});
