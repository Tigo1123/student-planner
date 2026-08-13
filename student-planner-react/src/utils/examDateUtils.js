import { getDateDisplay, parseDateKey } from "./dateUtils.js";

function ordinal(key) {
  const date = parseDateKey(key);
  return date ? Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000 : null;
}
export function getExamTiming(examDate, todayKey) {
  const exam = ordinal(examDate); const today = ordinal(todayKey);
  if (exam == null || today == null) return { days: null, label: "Date unavailable", tone: "normal" };
  const days = exam - today;
  if (days < 0) return { days, label: "Past", tone: "past" };
  if (days === 0) return { days, label: "Today", tone: "today" };
  if (days === 1) return { days, label: "Tomorrow", tone: "tomorrow" };
  if (days <= 3) return { days, label: `${days} days left`, tone: "soon" };
  if (days <= 7) return { days, label: "This Week", tone: "week" };
  if (days <= 14) return { days, label: "Next Week", tone: "normal" };
  return { days, label: "Later", tone: "normal" };
}
export const formatExamDate = (key) => getDateDisplay(key)?.accessibleLabel || key;
export function formatExamTime(value) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value || "")) return value || "";
  const [hourText, minute] = value.split(":"); const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"}`;
}
export const formatExamTimeRange = (start, end) => end ? `${formatExamTime(start)} – ${formatExamTime(end)}` : formatExamTime(start);
