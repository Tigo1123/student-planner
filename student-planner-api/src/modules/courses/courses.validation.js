import { z } from "zod";
import { booleanQuery, color, emptyUpdate, optionalText, shortText } from "../../utils/academicValidation.js";

const fields = {
  name: shortText("Course name", 120),
  code: shortText("Course code", 40).transform((value) => value.toUpperCase()),
  instructor: optionalText(120),
  room: optionalText(80),
  credits: z.number().int().min(0).max(60).nullable().optional(),
  semester: optionalText(60),
  academicYear: optionalText(20),
  color: color.default("#64748b"),
  icon: shortText("Icon", 40).default("book"),
};

export const createCourseSchema = z.object(fields).strict();
export const updateCourseSchema = emptyUpdate(z.object(Object.fromEntries(
  Object.entries(fields).map(([key, value]) => [key, value.optional()]),
)));
export const courseQuerySchema = z.object({
  archived: z.enum(["exclude", "include", "only"]).default("exclude"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
  withCounts: booleanQuery.default("true"),
}).strict();
