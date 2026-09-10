import { Router } from "express";
import { prisma } from "../../config/database.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireInput } from "../../utils/apiValidation.js";
import { HttpError } from "../../utils/httpError.js";
import { findSafeUserById } from "../users/user.service.js";
import { createCourse } from "../courses/courses.service.js";
import { ensureNoOverlap } from "../schedule/schedule.service.js";
import { saveSchema, completeSchema, draftSchema } from "./onboarding.validation.js";

export const onboardingRouter = Router();
onboardingRouter.use(requireAuth, (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
const conflict = () => new HttpError(409, "ONBOARDING_CONFLICT", "Your setup changed in another tab. Reload to continue with the saved version.");
onboardingRouter.get("/", async (req, res) => {
  const state = await prisma.user.findUniqueOrThrow({ where: { id: req.auth.userId }, select: { onboardingDraft: true, onboardingRevision: true, onboardingCompleted: true } });
  res.json(state);
});
onboardingRouter.patch("/", async (req, res) => {
  const { revision, draft } = requireInput(saveSchema, req.body);
  const result = await prisma.user.updateMany({ where: { id: req.auth.userId, onboardingCompleted: false, onboardingRevision: revision }, data: { onboardingDraft: draft, onboardingRevision: { increment: 1 } } });
  if (!result.count) throw conflict();
  res.json({ revision: revision + 1 });
});
onboardingRouter.post("/complete", async (req, res) => {
  const { revision } = requireInput(completeSchema, req.body);
  const userId = req.auth.userId;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.$transaction(async tx => {
        // Row lock serializes completion and draft saves, including concurrent retries.
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        if (user.onboardingCompleted) return;
        if (user.onboardingRevision !== revision) throw conflict();
        const draft = requireInput(draftSchema, user.onboardingDraft);
        const courseIds = new Map();
        for (const { id, ...course } of draft.courses) {
          const saved = await createCourse(userId, { ...course, semester: draft.semester || null, academicYear: draft.academicYear || null }, tx);
          courseIds.set(id, saved.id);
        }
        for (const item of draft.classes) {
          const input = { ...item, courseId: courseIds.get(item.courseId) };
          await ensureNoOverlap(tx, userId, input);
          await tx.classSchedule.create({ data: { ...input, userId } });
        }
        await tx.user.update({ where: { id: userId }, data: {
          onboardingCompleted: true, onboardingCompletedAt: new Date(), onboardingDraft: {},
          academicProfile: { semester: draft.semester, academicYear: draft.academicYear, program: draft.program, yearOfStudy: draft.yearOfStudy, goals: draft.goals },
        } });
      }, { timeout: 15000, isolationLevel: "Serializable" });
      break;
    } catch (error) {
      const retryable = error?.code === "P2034" || (error?.code === "P2010" && ["40001", "40P01"].includes(error.meta?.code));
      if (!retryable) throw error;
      if (attempt === 2) throw conflict();
    }
  }
  res.json({ user: await findSafeUserById(userId) });
});
