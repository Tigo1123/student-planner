import { z } from "zod";
import { booleanQuery, emptyUpdate, uuid } from "../../utils/academicValidation.js";

const entityType = z.enum(["TASK", "EVENT", "ASSIGNMENT", "EXAM"]);
const remindAt = z.iso.datetime({ offset: true }).transform((value) => new Date(value));
export const createReminderSchema = z.object({ entityType, entityId: uuid, remindAt }).strict();
export const updateReminderSchema = emptyUpdate(z.object({ remindAt: remindAt.optional(), dismissed: z.boolean().optional() }));
export const reminderQuerySchema = z.object({
  dismissed: booleanQuery.optional(),
  state: z.enum(["all", "upcoming", "due"]).default("upcoming"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
}).strict();
