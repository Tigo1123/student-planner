import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import BottomNavigation from "../components/BottomNavigation.jsx";
import CourseCard from "../components/courses/CourseCard.jsx";
import CourseDetails from "../components/courses/CourseDetails.jsx";
import CourseDialog from "../components/courses/CourseDialog.jsx";
import CourseForm from "../components/courses/CourseForm.jsx";
import emptyCoursesIllustration from "../assets/illustrations/empty-courses.svg";
import { archiveCourse, createCourse, deleteCourse, getCourse, getCourses, updateCourse } from "../api/coursesApi.js";
import { useAuth } from "../auth/authContext.js";
import useTodayKey from "../hooks/useTodayKey.js";
import useQuickAddIntent from "../hooks/useQuickAddIntent.js";

function CoursesSkeleton() {
  return <div className="courses-grid" aria-label="Loading courses" aria-busy="true">{[0, 1, 2].map((item) => <div className="course-card course-card--skeleton" key={item}><span /><span /><span /><span /></div>)}</div>;
}

function CoursesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const todayKey = useTodayKey();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [dialog, setDialog] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [deleteCode, setDeleteCode] = useState("");

  useQuickAddIntent("course", () => {
    setSelectedCourse(null);
    setActionError("");
    setDialog("create");
  });

  useEffect(() => {
    let active = true;
    getCourses("include").then((response) => { if (active) setCourses(response.courses); })
      .catch((nextError) => { if (active) setError(nextError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const semesters = useMemo(() => [...new Set(courses.map((course) => course.semester).filter(Boolean))].sort(), [courses]);
  const years = useMemo(() => [...new Set(courses.map((course) => course.academicYear).filter(Boolean))].sort().reverse(), [courses]);
  const visibleCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((course) => {
      const statusMatches = statusFilter === "all" || (statusFilter === "archived" ? course.archivedAt : !course.archivedAt);
      const searchMatches = !term || [course.name, course.code, course.instructor].some((value) => value?.toLowerCase().includes(term));
      return statusMatches && searchMatches && (semesterFilter === "all" || course.semester === semesterFilter) && (yearFilter === "all" || course.academicYear === yearFilter);
    });
  }, [courses, search, statusFilter, semesterFilter, yearFilter]);
  const activeCount = courses.filter((course) => !course.archivedAt).length;

  function retryCourses() {
    setLoading(true);
    setError("");
    setAttempt((value) => value + 1);
  }

  async function handleLogout() { await logout(); navigate("/login", { replace: true }); }
  function closeDialog() { if (!submitting) { setDialog(null); setActionError(""); setDeleteCode(""); } }
  async function openDetails(course) {
    setSelectedCourse(course); setDialog("details"); setDetailsLoading(true); setDetailsError("");
    try { const response = await getCourse(course.id); setSelectedCourse(response.course); }
    catch (nextError) { setDetailsError(nextError.message); }
    finally { setDetailsLoading(false); }
  }
  async function saveCourse(values) {
    setSubmitting(true); setActionError("");
    try {
      const response = dialog === "edit" ? await updateCourse(selectedCourse.id, values) : await createCourse(values);
      setCourses((current) => dialog === "edit" ? current.map((course) => course.id === response.course.id ? { ...course, ...response.course } : course) : [response.course, ...current]);
      setAnnouncement(dialog === "edit" ? `${response.course.name} updated.` : `${response.course.name} added.`);
      setDialog(null);
    } catch (nextError) { setActionError(nextError.message); }
    finally { setSubmitting(false); }
  }
  async function confirmArchive() {
    setSubmitting(true); setActionError("");
    try {
      const response = await archiveCourse(selectedCourse.id);
      setCourses((current) => current.map((course) => course.id === response.course.id ? { ...course, ...response.course } : course));
      setAnnouncement(`${response.course.name} archived.`); setDialog(null);
    } catch (nextError) { setActionError(nextError.message); }
    finally { setSubmitting(false); }
  }
  async function confirmDelete() {
    setSubmitting(true); setActionError("");
    try {
      await deleteCourse(selectedCourse.id);
      setCourses((current) => current.filter((course) => course.id !== selectedCourse.id));
      setAnnouncement(`${selectedCourse.name} permanently deleted.`); setDialog(null);
    } catch (nextError) { setActionError(nextError.message); }
    finally { setSubmitting(false); }
  }
  const counts = selectedCourse?.counts || {};

  return (
    <div className="app-shell courses-shell">
      <Header todayKey={todayKey} user={user} onLogout={handleLogout} />
      <main className="courses-page">
        <section className="courses-hero" aria-labelledby="courses-title">
          <div><p className="eyebrow">Academic workspace</p><h1 id="courses-title">My Courses</h1><p>Keep every subject, instructor, and academic detail organized in one place.</p></div>
          <div className="courses-hero__actions"><span><strong>{activeCount}</strong> active {activeCount === 1 ? "course" : "courses"}</span><button className="primary-button" type="button" onClick={() => { setSelectedCourse(null); setDialog("create"); }}>＋ Add Course</button></div>
        </section>

        {!loading && !error && courses.length > 0 && <section className="course-filters" aria-label="Course filters">
          <label className="course-search"><span className="sr-only">Search courses</span><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, code, or instructor" /></label>
          <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="active">Active</option><option value="archived">Archived</option><option value="all">All</option></select></label>
          <label><span>Semester</span><select value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)}><option value="all">All semesters</option>{semesters.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Academic year</span><select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}><option value="all">All years</option>{years.map((value) => <option key={value}>{value}</option>)}</select></label>
        </section>}

        {loading ? <CoursesSkeleton /> : error ? <section className="courses-error" role="alert"><p className="eyebrow">Connection issue</p><h2>Courses could not be loaded.</h2><p>{error}</p><button className="primary-button" type="button" onClick={retryCourses}>Try again</button></section>
          : courses.length === 0 ? <section className="courses-empty"><img src={emptyCoursesIllustration} alt="" aria-hidden="true" /><p className="eyebrow">Your academic home</p><h2>Add your first course</h2><p>Build a clear home for every subject, class detail, assignment, and exam.</p><button className="primary-button" type="button" onClick={() => setDialog("create")}>Add Course</button></section>
            : visibleCourses.length === 0 ? <section className="courses-no-results"><h2>No matching courses</h2><p>Try changing your search or filters.</p><button className="outline-button" type="button" onClick={() => { setSearch(""); setStatusFilter("active"); setSemesterFilter("all"); setYearFilter("all"); }}>Clear filters</button></section>
              : <div className="courses-grid">{visibleCourses.map((course, index) => <CourseCard key={course.id} course={course} index={index} onView={openDetails} />)}</div>}
      </main>
      <BottomNavigation />
      <div className="sr-only" aria-live="polite">{announcement}</div>

      {(dialog === "create" || dialog === "edit") && <CourseDialog title={dialog === "edit" ? "Edit course" : "Add a new course"} description={dialog === "edit" ? "Update the academic details for this course." : "Create a visual home for one of your university subjects."} onClose={closeDialog}>
        <CourseForm course={dialog === "edit" ? selectedCourse : null} onSubmit={saveCourse} onCancel={closeDialog} isSubmitting={submitting} apiError={actionError} />
      </CourseDialog>}
      {dialog === "details" && <CourseDialog title="Course details" onClose={closeDialog}>
        <CourseDetails course={selectedCourse} loading={detailsLoading} error={detailsError} onRetry={() => openDetails(selectedCourse)} onEdit={() => { setActionError(""); setDialog("edit"); }} onArchive={() => setDialog("archive")} onDelete={() => setDialog("delete")} />
      </CourseDialog>}
      {dialog === "archive" && <CourseDialog title={`Archive ${selectedCourse.name}?`} description="This course will leave your active list and course selectors. Its historical academic relationships will remain preserved." onClose={closeDialog} tone="warning">
        <div className="course-confirm"><p>Archiving is safer than permanent deletion. Archived courses remain available through the Archived filter.</p>{actionError && <p className="course-form__api-error" role="alert">{actionError}</p>}<div className="course-dialog__actions"><button className="outline-button" type="button" onClick={() => setDialog("details")} disabled={submitting}>Keep active</button><button className="archive-button" type="button" onClick={confirmArchive} disabled={submitting}>{submitting ? "Archiving…" : "Archive course"}</button></div></div>
      </CourseDialog>}
      {dialog === "delete" && <CourseDialog title={`Permanently delete ${selectedCourse.name}?`} description="Permanent deletion cannot be undone." onClose={closeDialog} tone="danger">
        <div className="course-confirm"><div className="course-impact"><p>This course contains:</p><ul><li>{counts.assignments ?? 0} assignments</li><li>{counts.upcomingExams ?? counts.exams ?? 0} upcoming exams</li><li>{counts.schedules ?? 0} class schedules</li></ul><p>Assignments, exams, and schedules will be permanently deleted. Linked tasks and events will remain but lose their course link.</p></div><label className="course-delete-code">Type <strong>{selectedCourse.code}</strong> to confirm<input value={deleteCode} onChange={(event) => setDeleteCode(event.target.value)} autoComplete="off" /></label>{actionError && <p className="course-form__api-error" role="alert">{actionError}</p>}<div className="course-dialog__actions"><button className="outline-button" type="button" onClick={() => setDialog("details")} disabled={submitting}>Cancel</button><button className="danger-button" type="button" onClick={confirmDelete} disabled={submitting || deleteCode.trim().toUpperCase() !== selectedCourse.code.toUpperCase()}>{submitting ? "Deleting…" : "Delete permanently"}</button></div></div>
      </CourseDialog>}
    </div>
  );
}
export default CoursesPage;
