import { prisma } from "../../config/database.js";
import { notFound } from "../../utils/apiValidation.js";

const delegates = {
  TASK: "task",
  EVENT: "event",
  ASSIGNMENT: "assignment",
  EXAM: "exam",
};

export async function requireOwnedReminderEntity(userId, entityType, entityId) {
  const record = await prisma[delegates[entityType]].findFirst({ where: { id: entityId, userId }, select: { id: true } });
  if (!record) throw notFound("Referenced record");
  return record;
}

export function listReminders(userId, query, now = new Date()) {
  const timeFilter = query.state === "due" ? { lte: now } : query.state === "upcoming" ? { gt: now } : undefined;
  const dismissed = query.dismissed ?? (query.state === "all" ? undefined : false);
  return prisma.reminder.findMany({
    where: {
      userId,
      ...(dismissed !== undefined ? { dismissed } : {}),
      ...(timeFilter ? { remindAt: timeFilter } : {}),
    },
    orderBy: [{ remindAt: "asc" }, { createdAt: "asc" }],
    take: query.limit,
    skip: query.offset,
  });
}
export async function enrichReminders(userId, reminders) {
  const byType = Object.fromEntries(Object.keys(delegates).map((type) => [type, reminders.filter((item) => item.entityType === type).map((item) => item.entityId)]));
  const [tasks, events, assignments, exams] = await Promise.all([
    prisma.task.findMany({ where: { userId, id: { in: byType.TASK } }, include: { course: true } }),
    prisma.event.findMany({ where: { userId, id: { in: byType.EVENT } }, include: { course: true } }),
    prisma.assignment.findMany({ where: { userId, id: { in: byType.ASSIGNMENT } }, include: { course: true } }),
    prisma.exam.findMany({ where: { userId, id: { in: byType.EXAM } }, include: { course: true } }),
  ]);
  const records = new Map([...tasks, ...events, ...assignments, ...exams].map((record) => [record.id, record]));
  return reminders.map((reminder) => ({ ...reminder, entity: records.get(reminder.entityId) || null }));
}
export async function getReminder(userId, id) {
  const reminder = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!reminder) throw notFound("Reminder");
  return reminder;
}
export async function createReminder(userId, input) {
  await requireOwnedReminderEntity(userId, input.entityType, input.entityId);
  return prisma.reminder.create({ data: { ...input, userId } });
}
export async function updateReminder(userId, id, input) {
  await getReminder(userId, id);
  return prisma.reminder.update({ where: { id }, data: input });
}
export async function deleteReminder(userId, id) {
  await getReminder(userId, id);
  await prisma.reminder.delete({ where: { id } });
}
