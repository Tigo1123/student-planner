import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { getDateDisplay } from "../utils/dateUtils.js";
import ReminderBell from "./reminders/ReminderBell.jsx";
import ReminderPanel from "./reminders/ReminderPanel.jsx";
import DueReminderBanner from "./reminders/DueReminderBanner.jsx";
import { useReminders } from "../reminders/reminderContext.js";

function Header({ todayKey, user, onLogout }) {
  const todayDisplay = getDateDisplay(todayKey);
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const { panelOpen } = useReminders();
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await onLogout();
    } catch {
      setLogoutError("Could not contact the server. You have been signed out locally.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="app-header">
      <Link className="brand" to="/app" aria-label="Student Planner home">
        <span className="brand-mark" aria-hidden="true">S</span>
        <span>Student Planner</span>
      </Link>

      <div className="header-center">
        <nav className="desktop-app-navigation" aria-label="Primary navigation">
          <Link to="/app#dashboard" aria-current={location.pathname === "/app" && location.hash !== "#calendar" ? "page" : undefined}>Dashboard</Link>
          <Link to="/app#calendar" aria-current={location.pathname === "/app" && location.hash === "#calendar" ? "page" : undefined}>Calendar</Link>
          <NavLink to="/app/courses">Courses</NavLink>
          <NavLink to="/app/assignments">Assignments</NavLink>
          <NavLink to="/app/exams">Exams</NavLink>
          <NavLink to="/app/timetable">Timetable</NavLink>
          <NavLink to="/app/deadlines">Deadlines</NavLink>
        </nav>
        <div className="header-message"><p className="eyebrow">{todayDisplay.accessibleLabel}</p><p>Make today count, one task at a time.</p></div>
      </div>

      <div className="user-menu">
        <ReminderBell />
        <div className="profile-badge" aria-label={`Signed in as ${user.name}`}>
          <span className="profile-avatar" aria-hidden="true">{initials || "S"}</span>
          <span className="profile-copy">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
        </div>
        <button className="logout-button" type="button" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? "Signing out…" : "Logout"}
        </button>
        {logoutError && <span className="sr-only" role="alert">{logoutError}</span>}
      </div>
      <DueReminderBanner />
      {panelOpen && <ReminderPanel />}
    </header>
  );
}

export default Header;
