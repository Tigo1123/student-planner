import { Link } from "react-router-dom";
import CourseDialog from "./courses/CourseDialog.jsx";

const options = [
  ["task", "Task", "Quick personal planner task", "/app#tasks"],
  ["assignment", "Assignment", "Course deadline", "/app/assignments"],
  ["exam", "Exam", "Upcoming assessment", "/app/exams"],
  ["event", "Event", "School event", "/app#events"],
  ["course", "Course", "University subject", "/app/courses"],
  ["class", "Class", "Recurring weekly class", "/app/timetable"],
];

function QuickAddDialog({ selectedDate, onClose }) {
  return <CourseDialog sectionLabel="Quick Add" title="What do you want to add?" description={selectedDate ? `Selected date: ${selectedDate}` : "Choose an academic or planner item."} onClose={onClose}>
    <div className="quick-add-grid">
      {options.map(([type, label, copy, to]) => <Link key={type} to={to} state={{ quickAdd: type, ...(selectedDate ? { date: selectedDate } : {}) }} onClick={onClose}>
        <span aria-hidden="true">{label[0]}</span><strong>{label}</strong><small>{copy}</small>
      </Link>)}
    </div>
  </CourseDialog>;
}
export default QuickAddDialog;
