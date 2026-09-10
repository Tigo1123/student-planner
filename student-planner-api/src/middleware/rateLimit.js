import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { rateLimit } from "express-rate-limit";

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts. Please try again later.",
    },
  },
});

export const forgotPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many reset requests. Please try again later." } },
});
export const resetPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many reset attempts. Please try again later." } },
});

// Count all submitted addresses equally, without retaining plaintext email keys.
export const forgotPasswordEmailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 3, standardHeaders: false, legacyHeaders: false,
  keyGenerator: req => createHash("sha256").update(req.body.email.trim().toLowerCase()).digest("hex"),
  handler: async (_req, res) => {
    await delay(5000);
    res.set("Cache-Control", "no-store").json({ message: "If an account exists for this email, a password reset link has been sent." });
  },
});
