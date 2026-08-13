import { getDateDisplay, parseDateKey } from "./dateUtils.js";

function ordinal(dateKey) {
  const date = parseDateKey(dateKey);
  return date ? Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000 : null;
}

export function getAssignmentTiming(dueDate, todayKey, completed = false) {
  const due = ordinal(dueDate);
  const today = ordinal(todayKey);
  if (due == null || today == null) return { days: null, label: "Date unavailable", tone: "normal", overdue: false };
  const days = due - today;
  if (completed) return { days, label: "Completed", tone: "complete", overdue: false };
  if (days < 0) return { days, label: `Overdue by ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"}`, tone: "overdue", overdue: true };
  if (days === 0) return { days, label: "Due Today", tone: "today", overdue: false };
  if (days === 1) return { days, label: "Due Tomorrow", tone: "soon", overdue: false };
  if (days <= 3) return { days, label: `${days} days left`, tone: "soon", overdue: false };
  if (days <= 7) return { days, label: "This Week", tone: "normal", overdue: false };
  return { days, label: "Later", tone: "normal", overdue: false };
}

export function formatAssignmentDate(dateKey) {
  return getDateDisplay(dateKey)?.accessibleLabel || dateKey;
}
