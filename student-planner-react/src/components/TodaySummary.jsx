import { getDateDisplay } from "../utils/dateUtils.js";

function TodaySummary({ todayKey, items, stats, onJumpToToday }) {
  const todayDisplay = getDateDisplay(todayKey);

  return (
    <section className="panel today-panel" aria-labelledby="today-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{todayDisplay.accessibleLabel}</p>
          <h2 id="today-title">Today&apos;s Schedule</h2>
        </div>
        <button className="outline-button" type="button" onClick={onJumpToToday}>
          Jump to Today
        </button>
      </div>

      <div className="today-stats" aria-label="Today summary">
        <span><strong>{stats.total}</strong> total</span>
        <span><strong>{stats.completed}</strong> completed</span>
        <span><strong>{stats.pending}</strong> pending</span>
      </div>

      {items.length === 0 ? (
        <p className="empty-state">Nothing scheduled for today. Enjoy the open space!</p>
      ) : (
        <div className="timeline" aria-label="Tasks and school events scheduled today">
          {items.map((item) => (
            <article className="timeline-item" key={item.id}>
              <span className="summary-kind">{item.type}</span>
              <span
                className={`timeline-node${item.type === "School Event" ? " timeline-node--orange" : ""}`}
                style={item.type === "Task" ? { backgroundColor: item.color } : undefined}
                aria-hidden="true"
              />
              <div>
                <span className="metadata-label">
                  {item.type} · {item.metadata} · {item.completed ? "Completed" : "Pending"}
                </span>
                <strong className={item.completed ? "is-completed" : ""}>{item.text}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default TodaySummary;
