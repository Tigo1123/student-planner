import { useEffect, useRef } from "react";
import { useReminders } from "../../reminders/reminderContext.js";

const formatTime = (value) => new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

function ReminderItem({ item, due, onDismiss, onDelete }) {
  const title = item.entity?.title || "Unavailable record";
  return (
    <article className="reminder-item">
      <span className={`deadline-type deadline-type--${item.entityType.toLowerCase()}`}>{item.entityType}</span>
      <div>
        <strong>{title}</strong>
        {item.entity?.course && <small>{item.entity.course.code} · {item.entity.course.name}</small>}
        <time dateTime={item.remindAt}>{formatTime(item.remindAt)}</time>
      </div>
      <div>
        {due && <button onClick={() => onDismiss(item.id)} aria-label={`Dismiss reminder for ${title}`}>Dismiss</button>}
        <button onClick={() => onDelete(item.id)} aria-label={`Delete reminder for ${title}`}>Delete</button>
      </div>
    </article>
  );
}

function ReminderPanel() {
  const { due, upcoming, error, setPanelOpen, dismiss, remove } = useReminders();
  const panelRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    previousFocus.current = document.activeElement;
    panelRef.current?.focus();
    function handleKey(event) {
      if (event.key === "Escape") setPanelOpen(false);
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])")];
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previousFocus.current?.focus?.();
    };
  }, [setPanelOpen]);

  return (
    <div className="reminder-panel-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanelOpen(false); }}>
      <section ref={panelRef} tabIndex="-1" className="reminder-panel" role="dialog" aria-modal="true" aria-labelledby="reminder-panel-title">
        <header><div><p className="eyebrow">In-app reminders</p><h2 id="reminder-panel-title">Reminders</h2></div><button onClick={() => setPanelOpen(false)} aria-label="Close reminders">×</button></header>
        {error && <p className="form-error" role="alert">{error}</p>}
        <section><h3>Due Now <span>{due.length}</span></h3>{due.length ? <div>{due.map((item) => <ReminderItem key={item.id} item={item} due onDismiss={dismiss} onDelete={remove} />)}</div> : <p className="reminder-empty">Nothing needs your attention right now.</p>}</section>
        <section><h3>Upcoming <span>{upcoming.length}</span></h3>{upcoming.length ? <div>{upcoming.map((item) => <ReminderItem key={item.id} item={item} onDelete={remove} />)}</div> : <p className="reminder-empty">No upcoming reminders.</p>}</section>
      </section>
    </div>
  );
}
export default ReminderPanel;
