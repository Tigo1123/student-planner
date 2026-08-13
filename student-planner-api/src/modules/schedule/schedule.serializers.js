import { serializeCourse } from "../courses/courses.serializers.js";

export function serializeSchedule(schedule) {
  return {
    id: schedule.id,
    courseId: schedule.courseId,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    room: schedule.room,
    ...(schedule.course ? { course: serializeCourse(schedule.course) } : {}),
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  };
}
