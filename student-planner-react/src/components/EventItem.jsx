import useInlineEdit from "../hooks/useInlineEdit.js";
import { getDateDisplay, parseDateKey } from "../utils/dateUtils.js";

function EventItem({ event, onToggle, onDelete, onEdit }) {
  const checkboxId = `event-checkbox-${event.id}`;
  const editErrorId = `event-edit-error-${event.id}`;
  const dateDisplay = getDateDisplay(event.date);
  const date = parseDateKey(event.date);
  const shortMonth = new Intl.DateTimeFormat(undefined, { month: "short" }).format(date);
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
  } = useInlineEdit(event, (updates) => onEdit(event.id, updates));

  return (
    <article className="event-card">
      <div className="event-date" aria-label={dateDisplay.accessibleLabel}>
        <span>{shortMonth}</span>
        <strong>{dateDisplay.day}</strong>
      </div>
      <input
        id={checkboxId}
        className="event-checkbox"
        type="checkbox"
        checked={event.completed}
        aria-label={`Mark ${event.text} ${event.completed ? "incomplete" : "complete"}`}
        onChange={() => onToggle(event.id)}
      />
      <div className="event-card__content">
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
              aria-label={`Edit event text: ${event.text}`}
              aria-describedby={error ? editErrorId : undefined}
              onChange={(changeEvent) => setDraftText(changeEvent.target.value)}
            />
            <input
              className="inline-edit-date"
              type="date"
              value={draftDate}
              aria-label={`Reassign date for event: ${event.text}`}
              aria-describedby={error ? editErrorId : undefined}
              aria-invalid={Boolean(error)}
              onChange={(changeEvent) => setDraftDate(changeEvent.target.value)}
            />
            {error && (
              <span className="inline-edit-error" id={editErrorId} role="alert">{error}</span>
            )}
          </div>
        ) : (
          <label htmlFor={checkboxId} className={event.completed ? "is-completed" : ""}>
            {event.text}
          </label>
        )}
        <span>School event</span>
      </div>
      <div className="item-actions">
        <button type="button" aria-label={`Edit event: ${event.text}`} onClick={startEditing}>✎</button>
        <button type="button" aria-label={`Delete event: ${event.text}`} onClick={() => onDelete(event.id)}>×</button>
      </div>
    </article>
  );
}

export default EventItem;
