import CourseIcon from "./CourseIcon.jsx";

function metric(value, singular, plural = `${singular}s`) {
  return `${value ?? 0} ${(value ?? 0) === 1 ? singular : plural}`;
}

function CourseCard({ course, onView, index }) {
  const term = [course.semester, course.academicYear].filter(Boolean).join(" • ");
  return (
    <article className="course-card" style={{ "--course-color": course.color, "--card-index": index }}>
      <div className="course-card__identity">
        <CourseIcon icon={course.icon} />
        <div>
          <p className="course-card__code">{course.code}</p>
          <h2>{course.name}</h2>
        </div>
        {course.archivedAt && <span className="course-status">Archived</span>}
      </div>
      <div className="course-card__metadata">
        <p><span aria-hidden="true">●</span>{course.instructor || "Instructor not set"}</p>
        {(course.room || course.credits != null) && (
          <p>{[course.room && `Room ${course.room}`, course.credits != null && `${course.credits} ${course.credits === 1 ? "credit" : "credits"}`].filter(Boolean).join(" • ")}</p>
        )}
        {term && <p>{term}</p>}
      </div>
      <div className="course-card__metrics" aria-label="Course activity">
        <span><strong>{course.counts?.assignments ?? 0}</strong> Assignments</span>
        <span><strong>{course.counts?.exams ?? 0}</strong> Exams</span>
        <span className="sr-only">{metric(course.counts?.schedules, "class")}</span>
      </div>
      <button className="course-card__action" type="button" onClick={() => onView(course)}>
        View course <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}
export default CourseCard;
