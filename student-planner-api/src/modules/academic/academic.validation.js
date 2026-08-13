import { z } from "zod";
import { dateKey } from "../../utils/academicValidation.js";
export const calendarQuerySchema=z.object({from:dateKey,to:dateKey}).strict().refine(v=>v.from<=v.to,{path:["to"],message:"To date must not be before from date."});
export const dashboardQuerySchema=z.object({today:dateKey}).strict();
