export function serializeCourse(course) {
  const result = {
    id: course.id,
    name: course.name,
    code: course.code,
    instructor: course.instructor,
    room: course.room,
    credits: course.credits,
    semester: course.semester,
    academicYear: course.academicYear,
    color: course.color,
    icon: course.icon,
    archivedAt: course.archivedAt,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
  if (course._count) {
    result.counts = {
      assignments: course._count.assignments,
      exams: course._count.exams,
      schedules: course._count.classSchedules,
    };
  }
  if (typeof course.incompleteAssignmentCount === "number") {
    result.counts = { ...result.counts, incompleteAssignments: course.incompleteAssignmentCount };
  }
  if (typeof course.upcomingExamCount === "number") {
    result.counts = { ...result.counts, upcomingExams: course.upcomingExamCount };
  }
  return result;
}
