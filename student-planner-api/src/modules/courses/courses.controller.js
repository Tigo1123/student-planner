import { requireId, requireInput } from "../../utils/apiValidation.js";
import { archiveCourse, createCourse, deleteCourse, getCourse, listCourses, updateCourse } from "./courses.service.js";
import { serializeCourse } from "./courses.serializers.js";
import { courseQuerySchema, createCourseSchema, updateCourseSchema } from "./courses.validation.js";

export async function getCourses(request, response) {
  const query = requireInput(courseQuerySchema, request.query);
  const courses = await listCourses(request.auth.userId, query);
  response.json({ courses: courses.map(serializeCourse), pagination: { limit: query.limit, offset: query.offset } });
}
export async function getCourseById(request, response) {
  response.json({ course: serializeCourse(await getCourse(request.auth.userId, requireId(request.params.id, "Course"))) });
}
export async function postCourse(request, response) {
  const course = await createCourse(request.auth.userId, requireInput(createCourseSchema, request.body));
  response.status(201).json({ course: serializeCourse(course) });
}
export async function patchCourse(request, response) {
  const course = await updateCourse(request.auth.userId, requireId(request.params.id, "Course"), requireInput(updateCourseSchema, request.body));
  response.json({ course: serializeCourse(course) });
}
export async function postArchiveCourse(request, response) {
  const course = await archiveCourse(request.auth.userId, requireId(request.params.id, "Course"));
  response.json({ course: serializeCourse(course) });
}
export async function removeCourse(request, response) {
  await deleteCourse(request.auth.userId, requireId(request.params.id, "Course"));
  response.status(204).end();
}
