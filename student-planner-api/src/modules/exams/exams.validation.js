import { z } from "zod";
import { dateKey, emptyUpdate, optionalText, shortText, time, uuid } from "../../utils/academicValidation.js";

const topics = z.array(z.string().trim().min(1, "Topics cannot be empty.").max(200, "Topic is too long."))
  .max(50, "An exam can have at most 50 topics.").default([]);
const fields = {
  courseId: uuid,
  title: shortText("Exam title", 200),
  examDate: dateKey,
  startTime: time,
  endTime: time.nullable().optional(),
  room: optionalText(80),
  topics,
  notes: optionalText(10000),
};
function validRange(value) {
  return !value.endTime || !value.startTime || value.endTime > value.startTime;
}
export const createExamSchema = z.object(fields).strict().refine(validRange, {
  path: ["endTime"], message: "End time must be later than start time.",
});
export const updateExamSchema = emptyUpdate(z.object(Object.fromEntries(
  Object.entries(fields).map(([key, value]) => [key, value.optional()]),
))).refine(validRange, { path: ["endTime"], message: "End time must be later than start time." });
export const examQuerySchema = z.object({
  courseId: uuid.optional(),
  from: dateKey.optional(),
  to: dateKey.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  path: ["to"], message: "To date must not be before from date.",
});
