import { prisma } from "../../config/database.js";
import { HttpError } from "../../utils/httpError.js";
import { parseDateKey } from "../../utils/date.js";

function taskData(input) {
  return {
    ...input,
    ...(input.date ? { date: parseDateKey(input.date) } : {}),
  };
}

function eventData(input) {
  return {
    ...input,
    ...(input.date ? { date: parseDateKey(input.date) } : {}),
  };
}

export function listTasks(userId) {
  return prisma.task.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
}

export function createTask(userId, input) {
  return prisma.task.create({ data: { ...taskData(input), userId } });
}

export async function updateTask(userId, taskId, input) {
  const updated = await prisma.task.updateMany({
    where: { id: taskId, userId },
    data: taskData(input),
  });
  if (updated.count === 0) throw new HttpError(404, "NOT_FOUND", "Task was not found.");
  return prisma.task.findFirst({ where: { id: taskId, userId } });
}

export async function deleteTask(userId, taskId) {
  const deleted = await prisma.task.deleteMany({ where: { id: taskId, userId } });
  if (deleted.count === 0) throw new HttpError(404, "NOT_FOUND", "Task was not found.");
}

export function listEvents(userId) {
  return prisma.event.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
}

export function createEvent(userId, input) {
  return prisma.event.create({ data: { ...eventData(input), userId } });
}

export async function updateEvent(userId, eventId, input) {
  const updated = await prisma.event.updateMany({
    where: { id: eventId, userId },
    data: eventData(input),
  });
  if (updated.count === 0) throw new HttpError(404, "NOT_FOUND", "Event was not found.");
  return prisma.event.findFirst({ where: { id: eventId, userId } });
}

export async function deleteEvent(userId, eventId) {
  const deleted = await prisma.event.deleteMany({ where: { id: eventId, userId } });
  if (deleted.count === 0) throw new HttpError(404, "NOT_FOUND", "Event was not found.");
}

export async function importLegacyPlanner(userId, input) {
  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.user.updateMany({
      where: { id: userId, legacyImportedAt: null },
      data: { legacyImportedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new HttpError(409, "LEGACY_IMPORT_COMPLETED", "Legacy planner data was already imported.");
    }

    await transaction.task.createMany({
      data: input.tasks.map((task) => ({ ...taskData(task), userId })),
    });
    await transaction.event.createMany({
      data: input.events.map((event) => ({ ...eventData(event), userId })),
    });

    const [tasks, events] = await Promise.all([
      transaction.task.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      transaction.event.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    ]);
    return { tasks, events };
  });
}
