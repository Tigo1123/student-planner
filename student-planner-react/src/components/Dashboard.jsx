import { getDateDisplay } from "../utils/dateUtils.js";

function Dashboard({ taskStats, todayTasks, upcomingEvents, onSelectUpcomingEvent }) {
  const statCards = [
    { value: taskStats.total, label: "Total tasks", tone: "teal" },
    { value: taskStats.completed, label: "Completed", tone: "orange" },
    { value: taskStats.pending, label: "Pending", tone: "cream" },
  ];
  const progressMessage = taskStats.total === 0
    ? "Add your first task to begin tracking your progress."
    : taskStats.percentage === 100
      ? "All tasks complete. Excellent work!"
      : "Keep moving forward, one task at a time.";

  return (
    <aside className="dashboard-column" id="dashboard" aria-labelledby="dashboard-title">
      <section className="productivity-card">
        <div className="productivity-card__top">
          <div>
            <p className="eyebrow eyebrow--light">Overall progress</p>
            <h1 id="dashboard-title">
              {taskStats.total === 0 ? "Ready to plan?" : "Good progress!"}
            </h1>
          </div>
          <span className="progress-value">{taskStats.percentage}%</span>
        </div>
        <p className="productivity-copy">{progressMessage}</p>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Task completion"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={taskStats.percentage}
          aria-valuetext={`${taskStats.percentage}% of tasks completed`}
        >
          <span style={{ width: `${taskStats.percentage}%` }} />
        </div>
        <a className="accent-button" href="#today-title">View today&apos;s plan</a>
      </section>

      <section className="panel stats-panel" aria-labelledby="stats-title">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Overview</p>
            <h2 id="stats-title">My Tasks</h2>
          </div>
        </div>
        <div className="stats-grid">
          {statCards.map((stat) => (
            <article className={`stat-card stat-card--${stat.tone}`} key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>

        <section className="dashboard-data-section" aria-labelledby="today-tasks-title">
          <h3 id="today-tasks-title">Today&apos;s Tasks</h3>
          {todayTasks.length === 0 ? (
            <p className="dashboard-empty">No tasks scheduled for today</p>
          ) : (
            <div className="dashboard-list">
              {todayTasks.map((task) => (
                <article className="mini-schedule" key={task.id}>
                  <span
                    className="dashboard-task-indicator"
                    style={{ backgroundColor: task.color }}
                    aria-hidden="true"
                  />
                  <div>
                    <strong className={task.completed ? "is-completed" : ""}>{task.text}</strong>
                    <p>{task.category}</p>
                  </div>
                  <span className={`status-text${task.completed ? " status-text--complete" : ""}`}>
                    {task.completed ? "Done" : "Pending"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-data-section" aria-labelledby="upcoming-events-title">
          <h3 id="upcoming-events-title">Upcoming Events</h3>
          {upcomingEvents.length === 0 ? (
            <p className="dashboard-empty">No upcoming school events</p>
          ) : (
            <div className="dashboard-list">
              {upcomingEvents.map((event) => {
                const dateDisplay = getDateDisplay(event.date);
                return (
                  <button
                    className="upcoming-event-button"
                    type="button"
                    key={event.id}
                    onClick={() => onSelectUpcomingEvent(event.date)}
                    aria-label={`Open ${event.text} on ${dateDisplay.accessibleLabel}${event.completed ? ", completed" : ""}`}
                  >
                    <span className="upcoming-event-button__date">
                      <strong>{dateDisplay.day}</strong>
                      {dateDisplay.monthYear}
                    </span>
                    <span className={event.completed ? "is-completed" : ""}>{event.text}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </aside>
  );
}

export default Dashboard;
