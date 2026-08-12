import { normalizeLocalDateKey } from "./dateUtils.js";
import { createId } from "./idUtils.js";

const DEFAULT_COLOR = "#64748b";
const VALID_COLOR = /^#[0-9a-f]{6}$/i;

export function parseStoredValue(serializedValue, fallbackValue, normalize) {
  try {
    const parsedValue = serializedValue === null
      ? fallbackValue
      : JSON.parse(serializedValue);
    return normalize(parsedValue);
  } catch {
    return normalize(fallbackValue);
  }
}

function normalizeId(value, prefix, usedIds) {
  const existingId = typeof value === "string" ? value.trim() : "";
  if (existingId && !usedIds.has(existingId)) {
    usedIds.add(existingId);
    return existingId;
  }

  let generatedId = createId(prefix);
  while (usedIds.has(generatedId)) generatedId = createId(prefix);
  usedIds.add(generatedId);
  return generatedId;
}

function normalizeSharedRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;

  const text = typeof record.text === "string" ? record.text.trim() : "";
  const date = normalizeLocalDateKey(record.date);
  if (!text || !date) return null;

  return {
    text,
    date,
    completed: record.completed === true,
  };
}

export function normalizeTasks(value) {
  if (!Array.isArray(value)) return [];

  const usedIds = new Set();
  return value.flatMap((record) => {
    const shared = normalizeSharedRecord(record);
    if (!shared) return [];

    const category = typeof record.category === "string" && record.category.trim()
      ? record.category.trim()
      : "General";
    const color = typeof record.color === "string" && VALID_COLOR.test(record.color)
      ? record.color
      : DEFAULT_COLOR;

    return [{
      id: normalizeId(record.id, "task", usedIds),
      ...shared,
      category,
      color,
    }];
  });
}

export function normalizeEvents(value) {
  if (!Array.isArray(value)) return [];

  const usedIds = new Set();
  return value.flatMap((record) => {
    const shared = normalizeSharedRecord(record);
    if (!shared) return [];

    return [{
      id: normalizeId(record.id, "event", usedIds),
      ...shared,
    }];
  });
}
