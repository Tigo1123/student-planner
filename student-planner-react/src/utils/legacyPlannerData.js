import { normalizeEvents, normalizeTasks, parseStoredValue } from "./storageUtils.js";

const TASKS_KEY = "planner_tasks";
const EVENTS_KEY = "planner_events";

function decisionKey(userId) {
  return `planner_legacy_decision_${userId}`;
}

export function readLegacyPlannerData(userId) {
  try {
    if (!userId || localStorage.getItem(decisionKey(userId))) return null;

    const tasks = parseStoredValue(localStorage.getItem(TASKS_KEY), [], normalizeTasks)
      .map(({ text, date, completed, category, color }) => ({
        text,
        date,
        completed,
        category,
        color,
      }));
    const events = parseStoredValue(localStorage.getItem(EVENTS_KEY), [], normalizeEvents)
      .map(({ text, date, completed }) => ({ text, date, completed }));

    return tasks.length || events.length ? { tasks, events } : null;
  } catch {
    return null;
  }
}

export function finishLegacyPlannerDecision(userId, decision) {
  localStorage.setItem(decisionKey(userId), decision);
  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem(EVENTS_KEY);
}
