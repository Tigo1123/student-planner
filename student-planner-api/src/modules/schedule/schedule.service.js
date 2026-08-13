import { prisma } from "../../config/database.js";
import { notFound } from "../../utils/apiValidation.js";
import { HttpError } from "../../utils/httpError.js";
import { requireOwnedCourse } from "../courses/courses.service.js";

const include = { course: true };

async function ensureNoOverlap(database, userId, input, excludeId) {
  const overlap = await database.classSchedule.findFirst({
    where: {
      userId,
      dayOfWeek: input.dayOfWeek,
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (overlap) throw new HttpError(409, "SCHEDULE_CONFLICT", "Class overlaps with another scheduled class.");
}

function scheduleConflict(error) {
  if (error instanceof HttpError) throw error;
  if (error?.code === "P2034") throw new HttpError(409, "SCHEDULE_CONFLICT", "Class schedule changed concurrently. Please try again.");
  throw error;
}

export async function listSchedules(userId, query) {
  if (query.courseId) await requireOwnedCourse(userId, query.courseId);
  return prisma.classSchedule.findMany({
    where: { userId, ...(query.courseId ? { courseId: query.courseId } : {}), ...(query.dayOfWeek ? { dayOfWeek: query.dayOfWeek } : {}) },
    include,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    take: query.limit,
    skip: query.offset,
  });
}
export async function getSchedule(userId, id) {
  const schedule = await prisma.classSchedule.findFirst({ where: { id, userId }, include });
  if (!schedule) throw notFound("Class schedule");
  return schedule;
}
export async function createSchedule(userId, input) {
  await requireOwnedCourse(userId, input.courseId);
  try {
    return await prisma.$transaction(async (transaction) => {
      await ensureNoOverlap(transaction, userId, input);
      return transaction.classSchedule.create({ data: { ...input, userId }, include });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    return scheduleConflict(error);
  }
}
export async function updateSchedule(userId, id, input) {
  const existing = await getSchedule(userId, id);
  if (input.courseId && input.courseId !== existing.courseId) await requireOwnedCourse(userId, input.courseId);
  const next = { ...existing, ...input };
  if (next.endTime <= next.startTime) {
    throw new HttpError(400, "VALIDATION_ERROR", "Please correct the submitted data.", [{ field: "endTime", message: "End time must be later than start time." }]);
  }
  try {
    return await prisma.$transaction(async (transaction) => {
      await ensureNoOverlap(transaction, userId, next, id);
      return transaction.classSchedule.update({ where: { id }, data: input, include });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    return scheduleConflict(error);
  }
}
export async function deleteSchedule(userId, id) {
  await getSchedule(userId, id);
  await prisma.classSchedule.delete({ where: { id } });
}
