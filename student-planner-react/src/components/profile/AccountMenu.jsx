import CourseDialog from "../courses/CourseDialog.jsx";
import UserAvatar from "./UserAvatar.jsx";

function AccountMenu({ user, onEdit, onLogout, loggingOut, logoutError, onClose }) {
  return <CourseDialog sectionLabel="Student Planner" title="Account" description="Your supported account actions in one place." onClose={onClose}>
    <div className="account-menu">
      <div className="account-menu__identity"><UserAvatar user={user} size="medium" decorative /><div><strong>{user.name}</strong><span>{user.email}</span></div></div>
      <button className="mobile-link-action" type="button" onClick={onEdit}>✎ <span>Edit Profile</span></button>
      {logoutError && <p className="course-form__api-error" role="alert">{logoutError}</p>}
      <button className="danger-button" type="button" onClick={onLogout} disabled={loggingOut}>{loggingOut ? "Signing out…" : "Logout"}</button>
    </div>
  </CourseDialog>;
}
export default AccountMenu;
