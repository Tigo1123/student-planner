import CalendarDay from "./CalendarDay.jsx";
import {
  getMonthGrid,
  getMonthLabel,
  isSameDateKey,
} from "../utils/dateUtils.js";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Calendar({
  currentMonth,
  selectedDate,
  todayKey,
  markedDates,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onJumpToToday,
}) {
  const monthLabel = getMonthLabel(currentMonth);
  const monthGrid = getMonthGrid(currentMonth);

  return (
    <section className="panel calendar-panel" id="calendar" aria-labelledby="calendar-title">
      <div className="calendar-header">
        <div>
          <p className="eyebrow">Study calendar</p>
          <h2 id="calendar-title">{monthLabel}</h2>
        </div>
        <div className="calendar-controls" aria-label="Calendar navigation">
          <button
            className="icon-button icon-button--small"
            type="button"
            aria-label="Previous month"
            onClick={onPreviousMonth}
          >
            ←
          </button>
          <button className="today-button" type="button" onClick={onJumpToToday}>
            Today
          </button>
          <button
            className="icon-button icon-button--small"
            type="button"
            aria-label="Next month"
            onClick={onNextMonth}
          >
            →
          </button>
        </div>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className="calendar-grid" aria-label={`${monthLabel} calendar`}>
        {monthGrid.map((date, index) => date ? (
          <CalendarDay
            key={date.dateKey}
            day={date.day}
            dateKey={date.dateKey}
            today={isSameDateKey(date.dateKey, todayKey)}
            selected={isSameDateKey(date.dateKey, selectedDate)}
            marked={markedDates.has(date.dateKey)}
            onSelect={onSelectDate}
          />
        ) : (
          <span className="calendar-day-placeholder" aria-hidden="true" key={`empty-${index}`} />
        ))}
      </div>
      <div className="calendar-legend">
        <span><i className="legend-dot legend-dot--today" />Today</span>
        <span><i className="legend-dot" />Tasks or events</span>
      </div>
    </section>
  );
}

export default Calendar;
