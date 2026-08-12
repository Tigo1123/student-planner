import TaskForm from "./TaskForm.jsx";
import TaskList from "./TaskList.jsx";
import { getDateDisplay } from "../utils/dateUtils.js";

function DetailsPanel({
  selectedDate,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
}) {
  const dateDisplay = getDateDisplay(selectedDate);
  const taskLabel = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;

  return (
    <aside className="panel details-panel" id="tasks" aria-labelledby="selected-date-title">
      <div className={`selected-date-card${dateDisplay ? "" : " selected-date-card--empty"}`}>
        <p className="eyebrow">Selected date</p>
        {dateDisplay ? (
          <div className="selected-date-card__date">
            <strong>{dateDisplay.day}</strong>
            <div>
              <h2 id="selected-date-title">{dateDisplay.weekday}</h2>
              <span>{dateDisplay.monthYear}</span>
            </div>
          </div>
        ) : (
          <div className="selected-date-empty">
            <span className="selected-date-empty__icon" aria-hidden="true">○</span>
            <div>
              <h2 id="selected-date-title">No date selected</h2>
              <span>Choose a day from the calendar</span>
            </div>
          </div>
        )}
      </div>

      <div className="section-heading section-heading--compact">
        <div>
          <p className="eyebrow">Your priorities</p>
          <h2>Tasks</h2>
        </div>
        <span className="count-pill">{taskLabel}</span>
      </div>
      <TaskForm selectedDate={selectedDate} onAddTask={onAddTask} />
      <TaskList
        selectedDate={selectedDate}
        tasks={tasks}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onEditTask={onEditTask}
      />
    </aside>
  );
}

export default DetailsPanel;
