import { useReminders } from "../../reminders/reminderContext.js";

function ReminderBell() {
  const { due, setPanelOpen } = useReminders();

  return (
    <button
      className="reminder-bell"
      type="button"
      onClick={() => setPanelOpen(true)}
      aria-label={
        due.length
          ? `${due.length} reminders due`
          : "No reminders due. Open reminders"
      }
    >
      <svg
        className="reminder-bell__icon"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {due.length > 0 && (
        <b>{due.length > 99 ? "99+" : due.length}</b>
      )}
    </button>
  );
}

export default ReminderBell;
