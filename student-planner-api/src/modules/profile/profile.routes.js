import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAuth } from "../../middleware/auth.js";
import { deleteCurrentAvatar, getCurrentProfile, patchCurrentProfile, postAvatar } from "./profile.controller.js";
import { parseAvatar } from "./profile.upload.js";

const uploadRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false, message: { error: { code: "RATE_LIMITED", message: "Too many photo uploads. Please try again later." } } });
export const profileRouter = Router();
profileRouter.use(requireAuth);
profileRouter.get("/me", getCurrentProfile);
profileRouter.patch("/me", patchCurrentProfile);
profileRouter.post("/me/avatar", uploadRateLimit, parseAvatar, postAvatar);
profileRouter.delete("/me/avatar", deleteCurrentAvatar);
