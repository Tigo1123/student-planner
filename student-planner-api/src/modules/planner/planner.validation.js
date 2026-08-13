import { z } from "zod";
import { parseDateKey } from "../../utils/date.js";

const dateKey = z.string().refine((value) => Boolean(parseDateKey(value)), {
  message: "Date must be a valid YYYY-MM-DD calendar date.",
});
const text = z.string().trim().min(1, "Text is required.").max(500, "Text is too long.");
const category = z.string().trim().min(1).max(60);
const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Color must be a six-digit hex value.");
const courseId = z.string().uuid("Course must be a valid identifier.").nullable().optional();

export const createTaskSchema = z.object({
  text,
  date: dateKey,
  completed: z.boolean().default(false),
  category: category.default("General"),
  color: color.default("#64748b"),
  courseId,
}).strict();

export const updateTaskSchema = z.object({
  text: text.optional(),
  date: dateKey.optional(),
  completed: z.boolean().optional(),
  category: category.optional(),
  color: color.optional(),
  courseId,
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one task field must be provided.",
});

export const createEventSchema = z.object({
  text,
  date: dateKey,
  completed: z.boolean().default(false),
  courseId,
}).strict();

export const updateEventSchema = z.object({
  text: text.optional(),
  date: dateKey.optional(),
  completed: z.boolean().optional(),
  courseId,
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one event field must be provided.",
});

const legacyTaskSchema = createTaskSchema.omit({ courseId: true });
const legacyEventSchema = createEventSchema.omit({ courseId: true });

export const importPlannerSchema = z.object({
  tasks: z.array(legacyTaskSchema).max(500).default([]),
  events: z.array(legacyEventSchema).max(500).default([]),
}).strict().refine((value) => value.tasks.length + value.events.length > 0, {
  message: "At least one task or event is required for import.",
});

export function parsePlannerInput(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  return {
    validationError: result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}
