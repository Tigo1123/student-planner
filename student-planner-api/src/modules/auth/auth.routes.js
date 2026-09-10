import { requireInput } from "../../utils/apiValidation.js";
import { forgotPasswordSchema } from "./auth.validation.js";
import { forgotPassword, completePasswordReset } from "./passwordRecovery.controller.js";
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimit, forgotPasswordRateLimit, forgotPasswordEmailRateLimit, resetPasswordRateLimit } from "../../middleware/rateLimit.js";
import { login, logout, me, register } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimit, register);
authRouter.post("/login", authRateLimit, login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);

authRouter.post("/forgot-password", forgotPasswordRateLimit, (req, _res, next) => { req.body = requireInput(forgotPasswordSchema, req.body); next(); }, forgotPasswordEmailRateLimit, forgotPassword);
authRouter.post("/reset-password", resetPasswordRateLimit, completePasswordReset);
