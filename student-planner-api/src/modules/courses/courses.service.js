import { prisma } from "../../config/database.js";
import { notFound } from "../../utils/apiValidation.js";

const counts = { select: { assignments: true, exams: true, classSchedules: true } };

export async function requireOwnedCourse(userId, courseId) {
  const course = await prisma.course.findFirst({ where: { id: courseId, userId } });
  if (!course) throw notFound("Course");
  return course;
}

export function listCourses(userId, query) {
  const archivedAt = query.archived === "only" ? { not: null } : query.archived === "exclude" ? null : undefined;
  return prisma.course.findMany({
    where: { userId, ...(archivedAt !== undefined ? { archivedAt } : {}) },
    include: query.withCounts ? { _count: counts } : undefined,
    orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
    take: query.limit,
    skip: query.offset,
  });
}

export async function getCourse(userId, id) {
  const course = await prisma.course.findFirst({ where: { id, userId }, include: { _count: counts } });
  if (!course) throw notFound("Course");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [incompleteAssignmentCount, upcomingExamCount] = await Promise.all([
    prisma.assignment.count({ where: { userId, courseId: id, completed: false } }),
    prisma.exam.count({ where: { userId, courseId: id, examDate: { gte: today } } }),
  ]);
  return { ...course, incompleteAssignmentCount, upcomingExamCount };
}

export function createCourse(userId, input, database = prisma) {
  return database.course.create({ data: { ...input, userId }, include: { _count: counts } });
}

export async function updateCourse(userId, id, input) {
  await requireOwnedCourse(userId, id);
  return prisma.course.update({ where: { id }, data: input, include: { _count: counts } });
}

export async function archiveCourse(userId, id) {
  await requireOwnedCourse(userId, id);
  return prisma.course.update({ where: { id }, data: { archivedAt: new Date() }, include: { _count: counts } });
}

export async function deleteCourse(userId, id) {
  await requireOwnedCourse(userId, id);
  await prisma.$transaction(async (transaction) => {
    const entities = await Promise.all([
      transaction.assignment.findMany({ where: { userId, courseId: id }, select: { id: true } }),
      transaction.exam.findMany({ where: { userId, courseId: id }, select: { id: true } }),
    ]);
    const ids = entities.flat().map((item) => item.id);
    if (ids.length) await transaction.reminder.deleteMany({ where: { userId, entityId: { in: ids } } });
    await transaction.course.delete({ where: { id } });
  });
}
