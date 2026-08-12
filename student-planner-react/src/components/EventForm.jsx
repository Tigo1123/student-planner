import { useRef, useState } from "react";

function EventForm({ selectedDate, onAddEvent }) {
  const [eventText, setEventText] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const eventInputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedText = eventText.trim();

    if (!selectedDate) {
      setError("Select a calendar date before adding an event.");
      return;
    }

    if (!trimmedText) {
      setError("Enter an event before adding it.");
      return;
    }

    setIsSubmitting(true);
    try {
      const wasAdded = await onAddEvent({ text: trimmedText });
      if (!wasAdded) {
        setError("Select a calendar date before adding an event.");
        return;
      }

      setEventText("");
      setError("");
      eventInputRef.current?.focus();
    } catch (requestError) {
      setError(requestError.message || "The event could not be added. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const visibleError = selectedDate && error.startsWith("Select a calendar") ? "" : error;

  return (
    <form className="event-form" onSubmit={handleSubmit} noValidate>
      <label className="sr-only" htmlFor="event-text">New school event</label>
      <input
        id="event-text"
        ref={eventInputRef}
        type="text"
        value={eventText}
        placeholder="Add a school event..."
        aria-describedby={visibleError ? "event-form-error" : undefined}
        aria-invalid={Boolean(visibleError)}
        onChange={(event) => {
          setEventText(event.target.value);
          if (error) setError("");
        }}
      />
      <button className="primary-button" type="submit" disabled={!selectedDate || isSubmitting}>
        {isSubmitting ? "Adding…" : "Add event"}
      </button>
      {!selectedDate && !visibleError && (
        <p className="form-hint event-form__message">Select a date to add events.</p>
      )}
      {visibleError && (
        <p className="form-error event-form__message" id="event-form-error" role="alert">
          {visibleError}
        </p>
      )}
    </form>
  );
}

export default EventForm;
