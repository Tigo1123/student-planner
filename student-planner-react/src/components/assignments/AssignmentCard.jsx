import CourseIcon from "../courses/CourseIcon.jsx";
import { formatAssignmentDate, getAssignmentTiming } from "../../utils/assignmentDateUtils.js";
import { PRIORITY_LABELS, STATUS_LABELS } from "./assignmentOptions.js";

function AssignmentCard({ assignment, todayKey, index, onView, onToggle, mutationId }) {
  const timing = getAssignmentTiming(assignment.dueDate, todayKey, assignment.completed);
  return (
    <article className={`assignment-card assignment-card--${timing.tone}${assignment.completed ? " assignment-card--completed" : ""}`} style={{ "--course-color": assignment.course?.color || "#174f5c", "--assignment-index": index }}>
      <div className="assignment-card__top">
        <div className="assignment-course"><CourseIcon icon={assignment.course?.icon} /><span><strong>{assignment.course?.code || "Course"}</strong>{assignment.course?.name || "Course unavailable"}</span></div>
        <span className={`priority-badge priority-badge--${assignment.priority.toLowerCase()}`}>{PRIORITY_LABELS[assignment.priority]} priority</span>
      </div>
      <div className="assignment-card__body">
        <h2 className={assignment.completed ? "is-completed" : ""}>{assignment.title}</h2>
        {assignment.description && <p>{assignment.description}</p>}
      </div>
      <div className="assignment-card__deadline">
        <span className={`deadline-label deadline-label--${timing.tone}`}>{timing.label}</span>
        <span>{formatAssignmentDate(assignment.dueDate)}</span>
      </div>
      <div className="assignment-card__footer">
        <button className={`assignment-complete${assignment.completed ? " is-done" : ""}`} type="button" onClick={() => onToggle(assignment)} disabled={mutationId === assignment.id} aria-label={assignment.completed ? `Reopen ${assignment.title}` : `Mark ${assignment.title} complete`}>
          <span aria-hidden="true">{assignment.completed ? "✓" : "○"}</span>{mutationId === assignment.id ? "Updating…" : assignment.completed ? "Completed" : "Mark complete"}
        </button>
        <span className="assignment-status">{STATUS_LABELS[assignment.status]}</span>
        <button className="assignment-view" type="button" onClick={() => onView(assignment)}>Details <span aria-hidden="true">→</span></button>
      </div>
    </article>
  );
}
export default AssignmentCard;
