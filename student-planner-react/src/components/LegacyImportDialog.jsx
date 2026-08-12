import { useEffect, useRef } from "react";

function LegacyImportDialog({ data, error, isImporting, onImport, onStartFresh }) {
  const itemCount = data.tasks.length + data.events.length;
  const importButtonRef = useRef(null);

  useEffect(() => {
    importButtonRef.current?.focus();
  }, []);

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="legacy-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legacy-dialog-title"
        aria-describedby="legacy-dialog-description"
      >
        <p className="eyebrow">Saved on this device</p>
        <h2 id="legacy-dialog-title">Import your existing planner data?</h2>
        <p id="legacy-dialog-description">
          We found {itemCount} {itemCount === 1 ? "item" : "items"} saved in this
          browser. Import them into this account, or start fresh and remove the local copy.
        </p>
        <ul className="legacy-dialog__summary" aria-label="Local planner data found">
          <li>{data.tasks.length} {data.tasks.length === 1 ? "task" : "tasks"}</li>
          <li>{data.events.length} {data.events.length === 1 ? "event" : "events"}</li>
        </ul>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="legacy-dialog__actions">
          <button
            ref={importButtonRef}
            className="primary-button"
            type="button"
            disabled={isImporting}
            onClick={onImport}
          >
            {isImporting ? "Importing…" : "Import data"}
          </button>
          <button
            className="outline-button"
            type="button"
            disabled={isImporting}
            onClick={onStartFresh}
          >
            Start fresh
          </button>
        </div>
      </section>
    </div>
  );
}

export default LegacyImportDialog;
