import { toDateKey } from "../../utils/date.js";

export function serializeTask(task) {
  return {
    id: task.id,
    text: task.text,
    date: toDateKey(task.date),
    completed: task.completed,
    category: task.category,
    color: task.color,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function serializeEvent(event) {
  return {
    id: event.id,
    text: event.text,
    date: toDateKey(event.date),
    completed: event.completed,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}
