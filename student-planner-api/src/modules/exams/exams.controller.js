import { requireId, requireInput } from "../../utils/apiValidation.js";
import { createExam, deleteExam, getExam, listExams, updateExam } from "./exams.service.js";
import { serializeExam } from "./exams.serializers.js";
import { createExamSchema, examQuerySchema, updateExamSchema } from "./exams.validation.js";

export async function getExams(request, response) {
  const query = requireInput(examQuerySchema, request.query);
  const exams = await listExams(request.auth.userId, query);
  response.json({ exams: exams.map(serializeExam), pagination: { limit: query.limit, offset: query.offset } });
}
export async function getExamById(request, response) {
  response.json({ exam: serializeExam(await getExam(request.auth.userId, requireId(request.params.id, "Exam"))) });
}
export async function postExam(request, response) {
  const exam = await createExam(request.auth.userId, requireInput(createExamSchema, request.body));
  response.status(201).json({ exam: serializeExam(exam) });
}
export async function patchExam(request, response) {
  const exam = await updateExam(request.auth.userId, requireId(request.params.id, "Exam"), requireInput(updateExamSchema, request.body));
  response.json({ exam: serializeExam(exam) });
}
export async function removeExam(request, response) {
  await deleteExam(request.auth.userId, requireId(request.params.id, "Exam"));
  response.status(204).end();
}
