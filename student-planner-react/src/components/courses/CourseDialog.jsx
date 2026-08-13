import { useEffect, useEffectEvent, useRef } from "react";

const FOCUSABLE = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

function CourseDialog({ title, description, children, onClose, tone = "default", sectionLabel = "Courses" }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const closeDialog = useEffectEvent(() => onClose());
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.querySelector(FOCUSABLE)?.focus();
    function keydown(event) {
      if (event.key === "Escape") closeDialog();
      if (event.key !== "Tab" || !dialog) return;
      const items = [...dialog.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, []);
  return (
    <div className="course-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className={`course-dialog course-dialog--${tone}`} role="dialog" aria-modal="true" aria-labelledby="course-dialog-title" aria-describedby={description ? "course-dialog-description" : undefined}>
        <header className="course-dialog__header">
          <div><p className="eyebrow">{sectionLabel}</p><h2 id="course-dialog-title">{title}</h2>{description && <p id="course-dialog-description">{description}</p>}</div>
          <button className="course-dialog__close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
        </header>
        {children}
      </section>
    </div>
  );
}
export default CourseDialog;
