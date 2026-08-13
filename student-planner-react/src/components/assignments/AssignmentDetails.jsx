import CourseIcon from "../courses/CourseIcon.jsx";
import { formatAssignmentDate, getAssignmentTiming } from "../../utils/assignmentDateUtils.js";
import { PRIORITY_LABELS, STATUS_LABELS } from "./assignmentOptions.js";

function AssignmentDetails({ assignment, todayKey, onEdit, onToggle, onDelete, mutating }) {
  const timing = getAssignmentTiming(assignment.dueDate, todayKey, assignment.completed);
  return (
    <div className="assignment-details">
      <section className="assignment-details__course" style={{ "--course-color": assignment.course?.color || "#174f5c" }}>
        <CourseIcon icon={assignment.course?.icon} /><div><p>{assignment.course?.code}</p><strong>{assignment.course?.name}</strong></div>
      </section>
      <section className="assignment-details__identity">
        <span className={`deadline-label deadline-label--${timing.tone}`}>{timing.label}</span>
        <h3>{assignment.title}</h3>
        <p>{assignment.description || "No description added."}</p>
      </section>
      <dl className="assignment-details__facts">
        <div><dt>Due date</dt><dd>{formatAssignmentDate(assignment.dueDate)}</dd></div>
        <div><dt>Priority</dt><dd><span className={`priority-badge priority-badge--${assignment.priority.toLowerCase()}`}>{PRIORITY_LABELS[assignment.priority]}</span></dd></div>
        <div><dt>Status</dt><dd>{STATUS_LABELS[assignment.status]}</dd></div>
        <div><dt>Completion</dt><dd>{assignment.completed ? "Complete" : "Not complete"}</dd></div>
      </dl>
      <p className="assignment-details__updated">Last updated {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(assignment.updatedAt))}</p>
      <div className="course-details__actions">
        <button className="primary-button" type="button" onClick={() => onToggle(assignment)} disabled={mutating}>{assignment.completed ? "Reopen assignment" : "Mark complete"}</button>
        <button className="outline-button" type="button" onClick={onEdit} disabled={mutating}>Edit</button>
        <button className="danger-button" type="button" onClick={onDelete} disabled={mutating}>Delete</button>
      </div>
    </div>
  );
}
export default AssignmentDetails;
