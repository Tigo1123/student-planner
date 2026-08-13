import { z } from "zod";
import { dateKey } from "../../utils/academicValidation.js";

export const deadlineQuerySchema = z.object({
  today: dateKey.optional(),
  includeCompleted: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  limitPerType: z.coerce.number().int().min(1).max(200).default(100),
}).strict();
