import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getCourseById, getCourses, patchCourse, postArchiveCourse, postCourse, removeCourse } from "./courses.controller.js";

export const coursesRouter = Router();
coursesRouter.use(requireAuth);
coursesRouter.get("/", getCourses);
coursesRouter.post("/", postCourse);
coursesRouter.get("/:id", getCourseById);
coursesRouter.patch("/:id", patchCourse);
coursesRouter.delete("/:id", removeCourse);
coursesRouter.post("/:id/archive", postArchiveCourse);
