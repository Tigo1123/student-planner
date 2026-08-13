import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getScheduleById, getSchedules, patchSchedule, postSchedule, removeSchedule } from "./schedule.controller.js";

export const scheduleRouter = Router();
scheduleRouter.use(requireAuth);
scheduleRouter.get("/", getSchedules);
scheduleRouter.post("/", postSchedule);
scheduleRouter.get("/:id", getScheduleById);
scheduleRouter.patch("/:id", patchSchedule);
scheduleRouter.delete("/:id", removeSchedule);
