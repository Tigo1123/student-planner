import { getDateDisplay } from "../utils/dateUtils.js";

function CalendarDay({ day, dateKey, today = false, selected = false, marked = false, onSelect }) {
  const dateDisplay = getDateDisplay(dateKey);
  const classNames = [
    "calendar-day",
    today ? "calendar-day--today" : "",
    selected ? "calendar-day--selected" : "",
  ].filter(Boolean).join(" ");
  const stateDescription = [
    today ? "today" : "",
    selected ? "selected" : "",
    marked ? "has scheduled items" : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      className={classNames}
      type="button"
      aria-label={`${dateDisplay.accessibleLabel}${stateDescription ? `, ${stateDescription}` : ""}`}
      aria-current={today ? "date" : undefined}
      aria-pressed={selected}
      onClick={() => onSelect(dateKey)}
    >
      <span>{day}</span>
      {marked && <span className="calendar-marker" aria-hidden="true" />}
    </button>
  );
}

export default CalendarDay;
