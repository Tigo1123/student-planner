import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext.js";
import CourseDialog from "./courses/CourseDialog.jsx";
import UserAvatar from "./profile/UserAvatar.jsx";

const academicLinks = [["Courses", "/app/courses"], ["Assignments", "/app/assignments"], ["Exams", "/app/exams"], ["Timetable", "/app/timetable"]];
const addLinks = [
  ["task", "Task", "/app#tasks"],
  ["assignment", "Assignment", "/app/assignments"],
  ["exam", "Exam", "/app/exams"],
  ["event", "Event", "/app#events"],
  ["course", "Course", "/app/courses"],
  ["class", "Class", "/app/timetable"],
];

function BottomNavigation({ onQuickAdd }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("You have been signed out locally.");
    } finally {
      setLoggingOut(false);
    }
  }

  return <>
    <nav className="bottom-navigation" aria-label="Mobile navigation">
      <Link to="/app#dashboard"><span aria-hidden="true">⌂</span>Dashboard</Link>
      <Link to="/app#calendar"><span aria-hidden="true">□</span>Calendar</Link>
      <button className="floating-add" type="button" onClick={() => onQuickAdd ? onQuickAdd() : setSheet("add")} aria-label="Quick Add">+</button>
      <button type="button" onClick={() => setSheet("academics")}><span aria-hidden="true">▤</span>Academics</button>
      <button type="button" onClick={() => setSheet("more")}><span aria-hidden="true">•••</span>More</button>
    </nav>
    {sheet && <CourseDialog sectionLabel="Navigation" title={sheet === "academics" ? "Academics" : sheet === "add" ? "Quick Add" : "More"} onClose={() => setSheet(null)}>
      {sheet === "more" ? <div className="mobile-more-sheet">
        <nav className="mobile-link-sheet" aria-label="More navigation"><Link to="/app/deadlines" onClick={() => setSheet(null)}>Deadlines</Link><Link to="/app#dashboard" onClick={() => setSheet(null)}>Planner / Home</Link></nav>
        <div className="mobile-account"><UserAvatar user={user} size="small" decorative /><span>Signed in as</span><strong>{user.name}</strong><small>{user.email}</small></div>
        {logoutError && <p className="form-error" role="alert">{logoutError}</p>}
        <button className="danger-button" type="button" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? "Signing out…" : "Logout"}</button>
      </div> : <nav className="mobile-link-sheet" aria-label={sheet === "academics" ? "Academic navigation" : "Quick Add options"}>
        {sheet === "academics" ? academicLinks.map(([label, to]) => <Link key={label} to={to} onClick={() => setSheet(null)}>{label}</Link>) : addLinks.map(([type, label, to]) => <Link key={type} to={to} state={{ quickAdd: type }} onClick={() => setSheet(null)}>{label}</Link>)}
      </nav>}
    </CourseDialog>}
  </>;
}

export default BottomNavigation;
