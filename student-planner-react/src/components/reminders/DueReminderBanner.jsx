import { useReminders } from "../../reminders/reminderContext.js";

function DueReminderBanner() {
  const { due, setPanelOpen } = useReminders();
  if (!due.length) return null;

  return (
    <div className="due-reminder-banner" role="status">
      <svg
        className="due-reminder-banner__icon"
        viewBox="0 0 24 24"
        width="20"
        height="20"
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
      <p>
        <strong>
          {due.length} {due.length === 1 ? "reminder needs" : "reminders need"} your attention
        </strong>
        <small>Review what is due without leaving your planner.</small>
      </p>
      <button type="button" onClick={() => setPanelOpen(true)}>
        View reminders
      </button>
    </div>
  );
}

export default DueReminderBanner;
