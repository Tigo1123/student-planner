import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().regex(
    /^postgres(?:ql)?:\/\//,
    "DATABASE_URL must be a PostgreSQL connection URL.",
  ),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters."),
  FRONTEND_ORIGIN: z.string()
    .url("FRONTEND_ORIGIN must be a valid URL.")
    .refine((value) => new URL(value).origin === value, {
      message: "FRONTEND_ORIGIN must be an exact origin without a path or trailing slash.",
    }),
  PORT: z.coerce.number().int().positive().default(4000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${message}`);
}

export const env = parsedEnv.data;
