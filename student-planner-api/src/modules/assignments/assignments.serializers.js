import { toDateKey } from "../../utils/date.js";
import { serializeCourse } from "../courses/courses.serializers.js";

export function serializeAssignment(assignment) {
  return {
    id: assignment.id,
    courseId: assignment.courseId,
    title: assignment.title,
    description: assignment.description,
    dueDate: toDateKey(assignment.dueDate),
    priority: assignment.priority,
    status: assignment.status,
    completed: assignment.completed,
    ...(assignment.course ? { course: serializeCourse(assignment.course) } : {}),
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  };
}
