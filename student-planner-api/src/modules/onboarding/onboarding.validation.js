import { z } from "zod";
import { createCourseSchema } from "../courses/courses.validation.js";
import { createScheduleSchema } from "../schedule/schedule.validation.js";

export const goals = ["Stay organized", "Never miss deadlines", "Improve productivity", "Track academic progress", "Manage my weekly schedule"];
export const draftSchema = z.object({
  step: z.number().int().min(0).max(4),
  semester: z.string().trim().max(60),
  academicYear: z.string().trim().max(20),
  program: z.string().trim().max(120),
  yearOfStudy: z.string().trim().max(30),
  courses: z.array(createCourseSchema.extend({ id: z.string().uuid() })).max(20),
  classes: z.array(createScheduleSchema).max(60),
  goals: z.array(z.enum(goals)).max(5).refine(v => new Set(v).size === v.length),
}).strict().superRefine((draft, ctx) => {
  const ids = new Set(draft.courses.map(c => c.id));
  if (ids.size !== draft.courses.length || new Set(draft.courses.map(c => c.code)).size !== draft.courses.length)
    ctx.addIssue({ code: "custom", path: ["courses"], message: "Each course must have a different code." });
  draft.classes.forEach((item, index) => {
    if (!ids.has(item.courseId)) ctx.addIssue({ code: "custom", path: ["classes", index], message: "Choose a course from this setup." });
    if (draft.classes.slice(0, index).some(other => other.dayOfWeek === item.dayOfWeek && other.startTime < item.endTime && other.endTime > item.startTime))
      ctx.addIssue({ code: "custom", path: ["classes", index], message: "Classes cannot overlap." });
  });
});
export const saveSchema = z.object({ revision: z.number().int().nonnegative(), draft: draftSchema }).strict();
export const completeSchema = z.object({ revision: z.number().int().nonnegative() }).strict();
