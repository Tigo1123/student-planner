import { z } from "zod";
import { booleanQuery, dateKey, emptyUpdate, optionalText, shortText, uuid } from "../../utils/academicValidation.js";

const fields = {
  courseId: uuid,
  title: shortText("Assignment title", 200),
  description: optionalText(5000),
  dueDate: dateKey,
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  completed: z.boolean(),
};
export const createAssignmentSchema = z.object({
  ...fields,
  priority: fields.priority.default("MEDIUM"),
  status: fields.status.default("NOT_STARTED"),
  completed: fields.completed.default(false),
}).strict();
export const updateAssignmentSchema = emptyUpdate(z.object(Object.fromEntries(
  Object.entries(fields).map(([key, value]) => [key, value.optional()]),
)));
export const assignmentQuerySchema = z.object({
  courseId: uuid.optional(),
  priority: fields.priority.optional(),
  status: fields.status.optional(),
  completed: booleanQuery.optional(),
  from: dateKey.optional(),
  to: dateKey.optional(),
  sort: z.enum(["due_asc", "due_desc", "created_desc", "priority_desc", "title_asc"]).default("due_asc"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  path: ["to"], message: "To date must not be before from date.",
});
