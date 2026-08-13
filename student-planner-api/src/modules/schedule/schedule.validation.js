import { z } from "zod";
import { emptyUpdate, optionalText, time, uuid } from "../../utils/academicValidation.js";

const day = z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);
const fields = { courseId: uuid, dayOfWeek: day, startTime: time, endTime: time, room: optionalText(80) };
const validRange = (value) => !value.startTime || !value.endTime || value.endTime > value.startTime;
export const createScheduleSchema = z.object(fields).strict().refine(validRange, {
  path: ["endTime"], message: "End time must be later than start time.",
});
export const updateScheduleSchema = emptyUpdate(z.object(Object.fromEntries(
  Object.entries(fields).map(([key, value]) => [key, value.optional()]),
))).refine(validRange, { path: ["endTime"], message: "End time must be later than start time." });
export const scheduleQuerySchema = z.object({
  courseId: uuid.optional(),
  dayOfWeek: day.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
}).strict();
