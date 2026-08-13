import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getExamById, getExams, patchExam, postExam, removeExam } from "./exams.controller.js";

export const examsRouter = Router();
examsRouter.use(requireAuth);
examsRouter.get("/", getExams);
examsRouter.post("/", postExam);
examsRouter.get("/:id", getExamById);
examsRouter.patch("/:id", patchExam);
examsRouter.delete("/:id", removeExam);
