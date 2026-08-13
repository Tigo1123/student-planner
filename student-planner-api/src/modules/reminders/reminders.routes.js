import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getDueReminders, getReminders, patchReminder, postReminder, removeReminder } from "./reminders.controller.js";

export const remindersRouter = Router();
remindersRouter.use(requireAuth);
remindersRouter.get("/", getReminders);
remindersRouter.post("/", postReminder);
remindersRouter.get("/due", getDueReminders);
remindersRouter.patch("/:id", patchReminder);
remindersRouter.delete("/:id", removeReminder);
