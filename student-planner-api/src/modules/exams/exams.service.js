import { prisma } from "../../config/database.js";
import { notFound } from "../../utils/apiValidation.js";
import { HttpError } from "../../utils/httpError.js";
import { parseDateKey } from "../../utils/date.js";
import { requireOwnedCourse } from "../courses/courses.service.js";

const include = { course: true };
const data = (input) => ({ ...input, ...(input.examDate ? { examDate: parseDateKey(input.examDate) } : {}) });

export async function listExams(userId, query) {
  if (query.courseId) await requireOwnedCourse(userId, query.courseId);
  return prisma.exam.findMany({
    where: {
      userId,
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.from || query.to ? { examDate: {
        ...(query.from ? { gte: parseDateKey(query.from) } : {}),
        ...(query.to ? { lte: parseDateKey(query.to) } : {}),
      } } : {}),
    },
    include,
    orderBy: [{ examDate: "asc" }, { startTime: "asc" }, { title: "asc" }],
    take: query.limit,
    skip: query.offset,
  });
}
export async function getExam(userId, id) {
  const exam = await prisma.exam.findFirst({ where: { id, userId }, include });
  if (!exam) throw notFound("Exam");
  return exam;
}
export async function createExam(userId, input) {
  await requireOwnedCourse(userId, input.courseId);
  return prisma.exam.create({ data: { ...data(input), userId }, include });
}
export async function updateExam(userId, id, input) {
  const existing = await getExam(userId, id);
  if (input.courseId && input.courseId !== existing.courseId) await requireOwnedCourse(userId, input.courseId);
  const nextStart = input.startTime ?? existing.startTime;
  const nextEnd = input.endTime === undefined ? existing.endTime : input.endTime;
  if (nextEnd && nextEnd <= nextStart) {
    throw new HttpError(400, "VALIDATION_ERROR", "Please correct the submitted data.", [{ field: "endTime", message: "End time must be later than start time." }]);
  }
  return prisma.exam.update({ where: { id }, data: data(input), include });
}
export async function deleteExam(userId, id) {
  await getExam(userId, id);
  await prisma.$transaction([
    prisma.reminder.deleteMany({ where: { userId, entityType: "EXAM", entityId: id } }),
    prisma.exam.delete({ where: { id } }),
  ]);
}
