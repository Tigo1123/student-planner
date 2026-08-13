import { z } from "zod";
import { parseDateKey } from "./date.js";

export const dateKey = z.string().refine((value) => Boolean(parseDateKey(value)), {
  message: "Date must be a valid YYYY-MM-DD calendar date.",
});
export const uuid = z.string().uuid("Must be a valid identifier.");
export const shortText = (label, maximum = 120) => z.string().trim().min(1, `${label} is required.`).max(maximum, `${label} is too long.`);
export const optionalText = (maximum = 5000) => z.string().trim().max(maximum).nullable().optional()
  .transform((value) => value || null);
export const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use 24-hour HH:mm format.");
export const color = z.string().trim().toLowerCase().regex(/^#[0-9a-f]{6}$/, "Color must be a six-digit hex value.");
export const booleanQuery = z.enum(["true", "false"]).transform((value) => value === "true");

export function emptyUpdate(schema) {
  return schema.strict().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });
}
