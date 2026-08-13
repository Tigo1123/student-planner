import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import BottomNavigation from "../components/BottomNavigation.jsx";
import AssignmentCard from "../components/assignments/AssignmentCard.jsx";
import AssignmentDetails from "../components/assignments/AssignmentDetails.jsx";
import AssignmentForm from "../components/assignments/AssignmentForm.jsx";
import CourseDialog from "../components/courses/CourseDialog.jsx";
import emptyAssignments from "../assets/illustrations/empty-assignments.svg";
import { createAssignment, deleteAssignment, getAssignment, getAssignments, updateAssignment } from "../api/assignmentsApi.js";
import { getCourses } from "../api/coursesApi.js";
import { useAuth } from "../auth/authContext.js";
import useTodayKey from "../hooks/useTodayKey.js";
import useQuickAddIntent from "../hooks/useQuickAddIntent.js";
import { formatAssignmentDate, getAssignmentTiming } from "../utils/assignmentDateUtils.js";
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "../components/assignments/assignmentOptions.js";

const priorityRank = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
function AssignmentSkeleton() { return <div className="assignments-grid" aria-label="Loading assignments" aria-busy="true">{[0, 1, 2, 3].map((key) => <div className="assignment-card assignment-card--skeleton" key={key}><span /><span /><span /><span /></div>)}</div>; }

function AssignmentsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const todayKey = useTodayKey();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sort, setSort] = useState("due_asc");
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mutationId, setMutationId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [quickAddDate, setQuickAddDate] = useState("");

  useQuickAddIntent("assignment", ({ date }) => {
    setSelected(null);
    setQuickAddDate(date || "");
    setActionError("");
    setDialog("create");
  });

  useEffect(() => {
    let active = true;
    Promise.all([getAssignments(), getCourses("exclude")])
      .then(([assignmentResponse, courseResponse]) => { if (active) { setAssignments(assignmentResponse.assignments); setCourses(courseResponse.courses); } })
      .catch((nextError) => { if (active) setError(nextError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const stats = useMemo(() => assignments.reduce((result, assignment) => {
    const timing = getAssignmentTiming(assignment.dueDate, todayKey, assignment.completed);
    if (!assignment.completed) result.active += 1;
    if (timing.overdue) result.overdue += 1;
    if (!assignment.completed && timing.days === 0) result.today += 1;
    if (!assignment.completed && timing.days >= 0 && timing.days <= 7) result.week += 1;
    if (assignment.completed) result.completed += 1;
    return result;
  }, { active: 0, overdue: 0, today: 0, week: 0, completed: 0 }), [assignments, todayKey]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = assignments.filter((assignment) => {
      const timing = getAssignmentTiming(assignment.dueDate, todayKey, assignment.completed);
      const textMatch = !term || [assignment.title, assignment.description, assignment.course?.name, assignment.course?.code].some((value) => value?.toLowerCase().includes(term));
      const dateMatch = dateFilter === "all" || (dateFilter === "overdue" && timing.overdue) || (dateFilter === "today" && !assignment.completed && timing.days === 0) || (dateFilter === "week" && !assignment.completed && timing.days >= 0 && timing.days <= 7);
      return textMatch && (courseFilter === "all" || assignment.courseId === courseFilter) && (priorityFilter === "all" || assignment.priority === priorityFilter) && (statusFilter === "all" || assignment.status === statusFilter) && dateMatch;
    });
    return result.sort((a, b) => {
      if (sort === "due_desc") return b.dueDate.localeCompare(a.dueDate) || a.title.localeCompare(b.title);
      if (sort === "priority") return priorityRank[b.priority] - priorityRank[a.priority] || a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title);
      if (sort === "course") return (a.course?.name || "").localeCompare(b.course?.name || "") || a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title);
      if (sort === "title") return a.title.localeCompare(b.title) || a.dueDate.localeCompare(b.dueDate);
      return a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title);
    });
  }, [assignments, todayKey, search, courseFilter, priorityFilter, statusFilter, dateFilter, sort]);

  async function handleLogout() { await logout(); navigate("/login", { replace: true }); }
  function retry() { setLoading(true); setError(""); setAttempt((value) => value + 1); }
  function closeDialog() { if (!submitting) { setDialog(null); setActionError(""); setQuickAddDate(""); } }
  async function openDetails(assignment) {
    setSelected(assignment); setDialog("details"); setActionError("");
    try { const response = await getAssignment(assignment.id); setSelected(response.assignment); }
    catch (nextError) { setActionError(nextError.message); }
  }
  async function save(values) {
    setSubmitting(true); setActionError("");
    try {
      const response = dialog === "edit" ? await updateAssignment(selected.id, values) : await createAssignment(values);
      setAssignments((current) => dialog === "edit" ? current.map((item) => item.id === response.assignment.id ? response.assignment : item) : [response.assignment, ...current]);
      setAnnouncement(dialog === "edit" ? `${response.assignment.title} updated.` : `${response.assignment.title} added.`); setQuickAddDate(""); setDialog(null);
    } catch (nextError) { setActionError(nextError.message); }
    finally { setSubmitting(false); }
  }
  async function toggle(assignment) {
    setMutationId(assignment.id); setActionError("");
    try {
      const response = await updateAssignment(assignment.id, { completed: !assignment.completed });
      setAssignments((current) => current.map((item) => item.id === assignment.id ? response.assignment : item));
      setSelected((current) => current?.id === assignment.id ? response.assignment : current);
      setAnnouncement(response.assignment.completed ? `${response.assignment.title} completed.` : `${response.assignment.title} reopened.`);
    } catch (nextError) { setActionError(nextError.message); }
    finally { setMutationId(null); }
  }
  async function remove() {
    setSubmitting(true); setActionError("");
    try { await deleteAssignment(selected.id); setAssignments((current) => current.filter((item) => item.id !== selected.id)); setAnnouncement(`${selected.title} deleted.`); setDialog(null); }
    catch (nextError) { setActionError(nextError.message); }
    finally { setSubmitting(false); }
  }
  function clearFilters() { setSearch(""); setCourseFilter("all"); setPriorityFilter("all"); setStatusFilter("all"); setDateFilter("all"); setSort("due_asc"); }
  const formCourses = dialog === "edit" && selected?.course && !courses.some((course) => course.id === selected.courseId)
    ? [selected.course, ...courses]
    : courses;

  return (
    <div className="app-shell assignments-shell">
      <Header todayKey={todayKey} user={user} onLogout={handleLogout} />
      <main className="assignments-page">
        <section className="assignments-hero" aria-labelledby="assignments-title"><div><p className="eyebrow">Academic workflow</p><h1 id="assignments-title">Assignments</h1><p>See what needs attention, protect your deadlines, and move every course forward.</p></div><div className="assignments-hero__actions"><div><span><strong>{stats.active}</strong> active</span><span className={stats.overdue ? "has-overdue" : ""}><strong>{stats.overdue}</strong> overdue</span></div><button className="primary-button" type="button" onClick={() => { setSelected(null); setQuickAddDate(""); setDialog("create"); }}>＋ Add Assignment</button></div></section>
        <section className="assignment-stats" aria-label="Assignment overview"><article><span>Due Today</span><strong>{stats.today}</strong></article><article><span>Due This Week</span><strong>{stats.week}</strong></article><article className={stats.overdue ? "is-alert" : ""}><span>Overdue</span><strong>{stats.overdue}</strong></article><article><span>Completed</span><strong>{stats.completed}</strong></article></section>
        {actionError && !dialog && <div className="planner-error-banner" role="alert"><span>{actionError}</span><button type="button" onClick={() => setActionError("")}>Dismiss</button></div>}
        {!loading && !error && assignments.length > 0 && <section className="assignment-filters" aria-label="Assignment filters">
          <label className="assignment-search"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, description, or course" /></label>
          <label><span>Course</span><select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}><option value="all">All courses</option>{[...new Map(assignments.map((item) => [item.courseId, item.course])).entries()].map(([id, course]) => <option value={id} key={id}>{course?.code} — {course?.name}</option>)}</select></label>
          <label><span>Priority</span><select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}><option value="all">All priorities</option>{PRIORITIES.map((value) => <option value={value} key={value}>{PRIORITY_LABELS[value]}</option>)}</select></label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{STATUSES.map((value) => <option value={value} key={value}>{STATUS_LABELS[value]}</option>)}</select></label>
          <label><span>Due</span><select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}><option value="all">Any date</option><option value="today">Due today</option><option value="week">Next 7 days</option><option value="overdue">Overdue</option></select></label>
          <label><span>Sort</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="due_asc">Due date — soonest</option><option value="due_desc">Due date — latest</option><option value="priority">Priority</option><option value="course">Course</option><option value="title">Title</option></select></label>
        </section>}
        {loading ? <AssignmentSkeleton /> : error ? <section className="assignments-message" role="alert"><p className="eyebrow">Connection issue</p><h2>Assignments could not be loaded.</h2><p>{error}</p><button className="primary-button" onClick={retry} type="button">Try again</button></section>
          : assignments.length === 0 ? <section className="assignments-empty"><img src={emptyAssignments} alt="" aria-hidden="true" /><p className="eyebrow">Clear work, clear mind</p><h2>Add your first assignment</h2><p>Turn every brief, paper, and project into a clear next step.</p>{courses.length ? <button className="primary-button" type="button" onClick={() => setDialog("create")}>Add Assignment</button> : <Link className="primary-button" to="/app/courses">Create a course first</Link>}</section>
            : visible.length === 0 ? <section className="assignments-message"><h2>{dateFilter === "overdue" ? "No overdue work" : "No matching assignments"}</h2><p>{dateFilter === "overdue" ? "You’re caught up. Keep the momentum going." : "Try changing your search or filters."}</p><button className="outline-button" type="button" onClick={clearFilters}>Clear filters</button></section>
              : <div className="assignments-grid">{visible.map((assignment, index) => <AssignmentCard key={assignment.id} assignment={assignment} todayKey={todayKey} index={index} onView={openDetails} onToggle={toggle} mutationId={mutationId} />)}</div>}
      </main>
      <BottomNavigation />
      <div className="sr-only" aria-live="polite">{announcement}</div>
      {(dialog === "create" || dialog === "edit") && <CourseDialog sectionLabel="Assignments" title={dialog === "edit" ? "Edit assignment" : "Add assignment"} description={dialog === "edit" ? "Update the course, deadline, or progress for this assignment." : "Capture the work now so the deadline never surprises you."} onClose={closeDialog}><AssignmentForm assignment={dialog === "edit" ? selected : null} defaultDate={dialog === "create" ? quickAddDate : ""} courses={formCourses} onSubmit={save} onCancel={closeDialog} submitting={submitting} apiError={actionError} /></CourseDialog>}
      {dialog === "details" && selected && <CourseDialog sectionLabel="Assignments" title="Assignment details" onClose={closeDialog}><AssignmentDetails assignment={selected} todayKey={todayKey} mutating={mutationId === selected.id} onEdit={() => setDialog("edit")} onToggle={toggle} onDelete={() => setDialog("delete")} />{actionError && <p className="course-form__api-error" role="alert">{actionError}</p>}</CourseDialog>}
      {dialog === "delete" && selected && <CourseDialog sectionLabel="Assignments" tone="danger" title={`Delete ${selected.title}?`} description="This assignment will be permanently removed." onClose={closeDialog}><div className="assignment-delete"><div><strong>{selected.course?.code} · {selected.course?.name}</strong><span>{formatAssignmentDate(selected.dueDate)}</span></div><p>Only this assignment will be deleted. Other assignments with the same title will remain.</p>{actionError && <p className="course-form__api-error" role="alert">{actionError}</p>}<div className="course-dialog__actions"><button className="outline-button" type="button" onClick={() => setDialog("details")} disabled={submitting}>Cancel</button><button className="danger-button" type="button" onClick={remove} disabled={submitting}>{submitting ? "Deleting…" : "Delete assignment"}</button></div></div></CourseDialog>}
    </div>
  );
}
export default AssignmentsPage;
