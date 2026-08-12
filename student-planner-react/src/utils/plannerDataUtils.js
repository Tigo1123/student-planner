const EVENT_ACCENT_COLOR = "#f5a63f";

export function getTaskStats(tasks) {
  const completed = tasks.filter((task) => task.completed).length;
  return {
    total: tasks.length,
    completed,
    pending: tasks.length - completed,
    percentage: tasks.length === 0
      ? 0
      : Math.round((completed / tasks.length) * 100),
  };
}

export function getTodayOverview(tasks, events, todayKey) {
  const tasksToday = tasks.filter((task) => task.date === todayKey);
  const eventsToday = events.filter((event) => event.date === todayKey);
  const items = [
    ...tasksToday.map((task) => ({
      id: `task-${task.id}`,
      text: task.text,
      completed: task.completed,
      type: "Task",
      metadata: task.category,
      color: task.color,
    })),
    ...eventsToday.map((event) => ({
      id: `event-${event.id}`,
      text: event.text,
      completed: event.completed,
      type: "School Event",
      metadata: "School event",
      color: EVENT_ACCENT_COLOR,
    })),
  ];
  const completed = items.filter((item) => item.completed).length;

  return {
    tasks: tasksToday,
    events: eventsToday,
    items,
    stats: {
      total: items.length,
      completed,
      pending: items.length - completed,
    },
  };
}

export function getUpcomingEvents(events, todayKey, limit = 5) {
  return events
    .map((event, originalIndex) => ({ event, originalIndex }))
    .filter(({ event }) => event.date > todayKey)
    .sort((first, second) => (
      first.event.date.localeCompare(second.event.date)
      || first.originalIndex - second.originalIndex
    ))
    .slice(0, limit)
    .map(({ event }) => event);
}

export function getMarkedDates(tasks, events) {
  return new Set([
    ...tasks.map((task) => task.date),
    ...events.map((event) => event.date),
  ]);
}
