import TaskItem from "./TaskItem.jsx";

function TaskList({ selectedDate, tasks, onToggleTask, onDeleteTask, onEditTask }) {
  if (!selectedDate) {
    return <p className="empty-state">Select a date to see tasks</p>;
  }

  if (tasks.length === 0) {
    return <p className="empty-state">No tasks for this date yet</p>;
  }

  return (
    <div className="schedule-list" aria-label="Tasks for selected date" aria-live="polite">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onEdit={onEditTask}
        />
      ))}
    </div>
  );
}

export default TaskList;
