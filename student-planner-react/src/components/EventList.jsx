import EventForm from "./EventForm.jsx";
import EventItem from "./EventItem.jsx";

function EventList({
  selectedDate,
  events,
  onAddEvent,
  onToggleEvent,
  onDeleteEvent,
  onEditEvent,
}) {
  return (
    <div>
      <EventForm selectedDate={selectedDate} onAddEvent={onAddEvent} />

      {!selectedDate ? (
        <p className="empty-state">Select a date to see events</p>
      ) : events.length === 0 ? (
        <p className="empty-state">No events for this date yet</p>
      ) : (
        <div className="event-list" aria-label="Events for selected date" aria-live="polite">
          {events.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              onToggle={onToggleEvent}
              onDelete={onDeleteEvent}
              onEdit={onEditEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default EventList;
