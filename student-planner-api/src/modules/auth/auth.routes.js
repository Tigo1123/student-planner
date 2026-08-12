import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { login, logout, me, register } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimit, register);
authRouter.post("/login", authRateLimit, login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
