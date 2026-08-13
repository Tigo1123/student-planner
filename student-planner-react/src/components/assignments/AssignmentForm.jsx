import { useState } from "react";
import { parseDateKey } from "../../utils/dateUtils.js";
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "./assignmentOptions.js";

function initialValues(assignment, courseId, defaultDate) {
  return assignment ? { courseId: assignment.courseId, title: assignment.title, description: assignment.description || "", dueDate: assignment.dueDate, priority: assignment.priority, status: assignment.status }
    : { courseId: courseId || "", title: "", description: "", dueDate: defaultDate || "", priority: "MEDIUM", status: "NOT_STARTED" };
}
function validate(values) {
  const errors = {};
  if (!values.courseId) errors.courseId = "Choose a course.";
  if (!values.title.trim()) errors.title = "Assignment title is required.";
  if (!parseDateKey(values.dueDate)) errors.dueDate = "Choose a valid due date.";
  if (values.description.length > 5000) errors.description = "Description must be 5,000 characters or fewer.";
  return errors;
}

function AssignmentForm({ assignment, courses, defaultCourseId, defaultDate, onSubmit, onCancel, submitting, apiError }) {
  const [values, setValues] = useState(() => initialValues(assignment, defaultCourseId, defaultDate));
  const [errors, setErrors] = useState({});
  function update(field, value) { setValues((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: "" })); }
  async function submit(event) {
    event.preventDefault(); const nextErrors = validate(values); setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    await onSubmit({ ...values, title: values.title.trim(), description: values.description.trim() || null, completed: values.status === "COMPLETED" });
  }
  function fieldError(id) { return errors[id] ? <p className="form-error" id={`assignment-${id}-error`}>{errors[id]}</p> : null; }
  return (
    <form className="assignment-form" onSubmit={submit} noValidate>
      <div className="assignment-form__grid">
        <div className="assignment-field"><label htmlFor="assignment-course">Course *</label><select id="assignment-course" value={values.courseId} onChange={(e) => update("courseId", e.target.value)} aria-invalid={Boolean(errors.courseId)} aria-describedby={errors.courseId ? "assignment-courseId-error" : undefined} autoFocus><option value="">Select a course</option>{courses.map((course) => <option value={course.id} key={course.id}>{course.code} — {course.name}</option>)}</select>{fieldError("courseId")}</div>
        <div className="assignment-field"><label htmlFor="assignment-title">Title *</label><input id="assignment-title" value={values.title} onChange={(e) => update("title", e.target.value)} maxLength="200" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "assignment-title-error" : undefined} placeholder="Database project" />{fieldError("title")}</div>
        <div className="assignment-field"><label htmlFor="assignment-date">Due Date *</label><input id="assignment-date" type="date" value={values.dueDate} onChange={(e) => update("dueDate", e.target.value)} aria-invalid={Boolean(errors.dueDate)} aria-describedby={errors.dueDate ? "assignment-dueDate-error" : undefined} />{fieldError("dueDate")}</div>
        <div className="assignment-field"><label htmlFor="assignment-priority">Priority</label><select id="assignment-priority" value={values.priority} onChange={(e) => update("priority", e.target.value)}>{PRIORITIES.map((value) => <option value={value} key={value}>{PRIORITY_LABELS[value]}</option>)}</select></div>
        <div className="assignment-field"><label htmlFor="assignment-status">Status</label><select id="assignment-status" value={values.status} onChange={(e) => update("status", e.target.value)}>{STATUSES.map((value) => <option value={value} key={value}>{STATUS_LABELS[value]}</option>)}</select></div>
        <div className="assignment-field assignment-field--wide"><label htmlFor="assignment-description">Description</label><textarea id="assignment-description" value={values.description} onChange={(e) => update("description", e.target.value)} maxLength="5000" rows="5" aria-invalid={Boolean(errors.description)} aria-describedby="assignment-description-hint" /><p className="form-hint" id="assignment-description-hint">Optional · {values.description.length}/5,000 characters</p>{fieldError("description")}</div>
      </div>
      {courses.length === 0 && <p className="assignment-form__notice">Create an active course before adding an assignment.</p>}
      {apiError && <p className="course-form__api-error" role="alert">{apiError}</p>}
      <div className="course-dialog__actions"><button className="outline-button" type="button" onClick={onCancel} disabled={submitting}>Cancel</button><button className="primary-button" type="submit" disabled={submitting || courses.length === 0}>{submitting ? "Saving…" : assignment ? "Save changes" : "Add assignment"}</button></div>
    </form>
  );
}
export default AssignmentForm;
