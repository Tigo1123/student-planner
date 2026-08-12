import useInlineEdit from "../hooks/useInlineEdit.js";

function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const checkboxId = `task-checkbox-${task.id}`;
  const editErrorId = `task-edit-error-${task.id}`;
  const {
    isEditing,
    draftText,
    draftDate,
    error,
    inputRef,
    setDraftText,
    setDraftDate,
    startEditing,
    handleKeyDown,
    handleEditorBlur,
  } = useInlineEdit(task, (updates) => onEdit(task.id, updates));

  return (
    <article className="schedule-item">
      <span
        className="category-line"
        style={{ backgroundColor: task.color }}
        aria-hidden="true"
      />
      <input
        id={checkboxId}
        type="checkbox"
        checked={task.completed}
        aria-label={`Mark ${task.text} ${task.completed ? "incomplete" : "complete"}`}
        onChange={() => onToggle(task.id)}
      />
      <div className="schedule-item__content">
        {isEditing ? (
          <div
            className="inline-edit-fields"
            onKeyDown={handleKeyDown}
            onBlur={handleEditorBlur}
          >
            <input
              ref={inputRef}
              className="inline-edit-input"
              type="text"
              value={draftText}
              aria-label={`Edit task text: ${task.text}`}
              aria-describedby={error ? editErrorId : undefined}
              onChange={(event) => setDraftText(event.target.value)}
            />
            <input
              className="inline-edit-date"
              type="date"
              value={draftDate}
              aria-label={`Reassign date for task: ${task.text}`}
              aria-describedby={error ? editErrorId : undefined}
              aria-invalid={Boolean(error)}
              onChange={(event) => setDraftDate(event.target.value)}
            />
            {error && (
              <span className="inline-edit-error" id={editErrorId} role="alert">{error}</span>
            )}
          </div>
        ) : (
          <label htmlFor={checkboxId} className={task.completed ? "is-completed" : ""}>
            {task.text}
          </label>
        )}
        <span>{task.category}</span>
      </div>
      <div className="item-actions">
        <button type="button" aria-label={`Edit task: ${task.text}`} onClick={startEditing}>✎</button>
        <button type="button" aria-label={`Delete task: ${task.text}`} onClick={() => onDelete(task.id)}>×</button>
      </div>
    </article>
  );
}

export default TaskItem;
