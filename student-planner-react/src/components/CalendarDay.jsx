import { getDateDisplay } from "../utils/dateUtils.js";

function CalendarDay({ day, dateKey, today = false, selected = false, markers = [], onSelect }) {
  const dateDisplay = getDateDisplay(dateKey);
  const classNames = [
    "calendar-day",
    today ? "calendar-day--today" : "",
    selected ? "calendar-day--selected" : "",
  ].filter(Boolean).join(" ");
  const stateDescription = [
    today ? "today" : "",
    selected ? "selected" : "",
    ...markers.map((marker) => `${marker.count} ${marker.label}`),
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
      {markers.length > 0 && <span className="calendar-markers" aria-hidden="true">{markers.slice(0,3).map((marker)=><i className={`calendar-marker calendar-marker--${marker.type.toLowerCase()}`} key={marker.type}/>)}{markers.length>3&&<b>+{markers.length-3}</b>}</span>}
    </button>
  );
}

export default CalendarDay;
