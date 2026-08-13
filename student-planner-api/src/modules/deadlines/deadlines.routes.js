import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getDeadlineCenter } from "./deadlines.controller.js";

export const deadlinesRouter = Router();
deadlinesRouter.use(requireAuth);
deadlinesRouter.get("/", getDeadlineCenter);
