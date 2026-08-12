import { useState } from "react";
import { getDateDisplay } from "../utils/dateUtils.js";

function Header({ todayKey, user, onLogout }) {
  const todayDisplay = getDateDisplay(todayKey);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
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
      <a className="brand" href="#dashboard" aria-label="Student Planner home">
        <span className="brand-mark" aria-hidden="true">S</span>
        <span>Student Planner</span>
      </a>

      <div className="header-message">
        <p className="eyebrow">{todayDisplay.accessibleLabel}</p>
        <p>Make today count, one task at a time.</p>
      </div>

      <div className="user-menu">
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
    </header>
  );
}

export default Header;
