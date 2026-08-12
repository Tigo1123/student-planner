import { z } from "zod";
import { parseDateKey } from "../../utils/date.js";

const dateKey = z.string().refine((value) => Boolean(parseDateKey(value)), {
  message: "Date must be a valid YYYY-MM-DD calendar date.",
});
const text = z.string().trim().min(1, "Text is required.").max(500, "Text is too long.");
const category = z.string().trim().min(1).max(60);
const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Color must be a six-digit hex value.");

export const createTaskSchema = z.object({
  text,
  date: dateKey,
  completed: z.boolean().default(false),
  category: category.default("General"),
  color: color.default("#64748b"),
}).strict();

export const updateTaskSchema = z.object({
  text: text.optional(),
  date: dateKey.optional(),
  completed: z.boolean().optional(),
  category: category.optional(),
  color: color.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one task field must be provided.",
});

export const createEventSchema = z.object({
  text,
  date: dateKey,
  completed: z.boolean().default(false),
}).strict();

export const updateEventSchema = z.object({
  text: text.optional(),
  date: dateKey.optional(),
  completed: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one event field must be provided.",
});

export const importPlannerSchema = z.object({
  tasks: z.array(createTaskSchema).max(500).default([]),
  events: z.array(createEventSchema).max(500).default([]),
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
