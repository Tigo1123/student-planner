import { prisma } from "../../config/database.js";
import { parseDateKey } from "../../utils/date.js";
import { notFound } from "../../utils/apiValidation.js";
import { requireOwnedCourse } from "../courses/courses.service.js";

const include = { course: true };

function synchronize(input, existing) {
  const data = { ...input, ...(input.dueDate ? { dueDate: parseDateKey(input.dueDate) } : {}) };
  if (input.status === "COMPLETED" || input.completed === true) {
    data.status = "COMPLETED";
    data.completed = true;
  } else if (input.completed === false && (existing?.completed || existing?.status === "COMPLETED")) {
    data.completed = false;
    data.status = input.status && input.status !== "COMPLETED" ? input.status : "NOT_STARTED";
  } else if (input.status && input.status !== "COMPLETED") {
    data.completed = false;
  }
  return data;
}

export async function listAssignments(userId, query) {
  if (query.courseId) await requireOwnedCourse(userId, query.courseId);
  const where = {
    userId,
    ...(query.courseId ? { courseId: query.courseId } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.completed !== undefined ? { completed: query.completed } : {}),
    ...(query.from || query.to ? { dueDate: {
      ...(query.from ? { gte: parseDateKey(query.from) } : {}),
      ...(query.to ? { lte: parseDateKey(query.to) } : {}),
    } } : {}),
  };
  const orderBy = query.sort === "due_desc" ? { dueDate: "desc" }
    : query.sort === "created_desc" ? { createdAt: "desc" }
      : query.sort === "title_asc" ? { title: "asc" }
        : query.sort === "priority_desc" ? [{ priority: "desc" }, { dueDate: "asc" }]
          : { dueDate: "asc" };
  return prisma.assignment.findMany({ where, include, orderBy, take: query.limit, skip: query.offset });
}

export async function getAssignment(userId, id) {
  const record = await prisma.assignment.findFirst({ where: { id, userId }, include });
  if (!record) throw notFound("Assignment");
  return record;
}

export async function createAssignment(userId, input) {
  await requireOwnedCourse(userId, input.courseId);
  return prisma.assignment.create({ data: { ...synchronize(input), userId }, include });
}

export async function updateAssignment(userId, id, input) {
  const existing = await getAssignment(userId, id);
  if (input.courseId && input.courseId !== existing.courseId) await requireOwnedCourse(userId, input.courseId);
  return prisma.assignment.update({ where: { id }, data: synchronize(input, existing), include });
}

export async function deleteAssignment(userId, id) {
  await getAssignment(userId, id);
  await prisma.$transaction([
    prisma.reminder.deleteMany({ where: { userId, entityType: "ASSIGNMENT", entityId: id } }),
    prisma.assignment.delete({ where: { id } }),
  ]);
}
