import CourseIcon from "./CourseIcon.jsx";

function Detail({ label, value }) {
  return <div><dt>{label}</dt><dd>{value || "Not set"}</dd></div>;
}
function CourseDetails({ course, loading, error, onRetry, onEdit, onArchive, onDelete }) {
  if (loading) return <div className="course-details-loading" aria-live="polite"><span /><span /><span /></div>;
  if (error) return <div className="course-details-error" role="alert"><p>{error}</p><button className="outline-button" type="button" onClick={onRetry}>Try again</button></div>;
  if (!course) return null;
  const counts = course.counts || {};
  return (
    <div className="course-details">
      <section className="course-details__hero" style={{ "--course-color": course.color }}>
        <CourseIcon icon={course.icon} />
        <div><p>{course.code}</p><h3>{course.name}</h3>{course.archivedAt && <span className="course-status">Archived</span>}</div>
      </section>
      <dl className="course-details__metadata">
        <Detail label="Instructor" value={course.instructor} />
        <Detail label="Room" value={course.room} />
        <Detail label="Credits" value={course.credits == null ? null : String(course.credits)} />
        <Detail label="Semester" value={course.semester} />
        <Detail label="Academic year" value={course.academicYear} />
      </dl>
      <section className="course-details__summary" aria-labelledby="course-summary-title">
        <h3 id="course-summary-title">Academic summary</h3>
        <div>
          <article><strong>{counts.assignments ?? 0}</strong><span>Assignments</span></article>
          <article><strong>{counts.incompleteAssignments ?? 0}</strong><span>Incomplete</span></article>
          <article><strong>{counts.upcomingExams ?? 0}</strong><span>Upcoming exams</span></article>
          <article><strong>{counts.schedules ?? 0}</strong><span>Class schedules</span></article>
        </div>
      </section>
      <div className="course-details__actions">
        <button className="primary-button" type="button" onClick={onEdit}>Edit course</button>
        {!course.archivedAt && <button className="outline-button" type="button" onClick={onArchive}>Archive</button>}
        <button className="danger-button" type="button" onClick={onDelete}>Delete permanently</button>
      </div>
    </div>
  );
}
export default CourseDetails;
