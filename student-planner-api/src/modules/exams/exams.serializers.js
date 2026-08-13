import { toDateKey } from "../../utils/date.js";
import { serializeCourse } from "../courses/courses.serializers.js";

export function serializeExam(exam) {
  return {
    id: exam.id,
    courseId: exam.courseId,
    title: exam.title,
    examDate: toDateKey(exam.examDate),
    startTime: exam.startTime,
    endTime: exam.endTime,
    room: exam.room,
    topics: exam.topics,
    notes: exam.notes,
    ...(exam.course ? { course: serializeCourse(exam.course) } : {}),
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
  };
}
