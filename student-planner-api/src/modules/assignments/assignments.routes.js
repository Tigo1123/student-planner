import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getAssignmentById, getAssignments, patchAssignment, postAssignment, removeAssignment } from "./assignments.controller.js";

export const assignmentsRouter = Router();
assignmentsRouter.use(requireAuth);
assignmentsRouter.get("/", getAssignments);
assignmentsRouter.post("/", postAssignment);
assignmentsRouter.get("/:id", getAssignmentById);
assignmentsRouter.patch("/:id", patchAssignment);
assignmentsRouter.delete("/:id", removeAssignment);
