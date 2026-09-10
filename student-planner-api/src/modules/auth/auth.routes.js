import { requireInput } from "../../utils/apiValidation.js";
import { forgotPasswordSchema } from "./auth.validation.js";
import { forgotPassword, completePasswordReset } from "./passwordRecovery.controller.js";
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimit, forgotPasswordRateLimit, forgotPasswordEmailRateLimit, resetPasswordRateLimit } from "../../middleware/rateLimit.js";
import { login, logout, me, register } from "./auth.controller.js";

export const authRouter = Router();

function validateForgotPassword(req, _res, next) {
  req.body = requireInput(forgotPasswordSchema, req.body);
  next();
}

// Recovery proves identity with the emailed reset token, never a JWT session.
authRouter.post("/forgot-password", forgotPasswordRateLimit, validateForgotPassword, forgotPasswordEmailRateLimit, forgotPassword);
authRouter.post("/reset-password", resetPasswordRateLimit, completePasswordReset);

authRouter.post("/register", authRateLimit, register);
authRouter.post("/login", authRateLimit, login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
