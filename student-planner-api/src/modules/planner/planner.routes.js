import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  getEvents,
  getTasks,
  importPlanner,
  patchEvent,
  patchTask,
  postEvent,
  postTask,
  removeEvent,
  removeTask,
} from "./planner.controller.js";

export const plannerRouter = Router();

plannerRouter.use(requireAuth);
plannerRouter.get("/tasks", getTasks);
plannerRouter.post("/tasks", postTask);
plannerRouter.patch("/tasks/:id", patchTask);
plannerRouter.delete("/tasks/:id", removeTask);
plannerRouter.get("/events", getEvents);
plannerRouter.post("/events", postEvent);
plannerRouter.patch("/events/:id", patchEvent);
plannerRouter.delete("/events/:id", removeEvent);
plannerRouter.post("/planner/import", importPlanner);
