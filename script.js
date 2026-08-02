console.log("Student Planner Loaded 🚀");

// ---------- Element refs ----------
const daysContainer = document.querySelector(".days");
const monthYearLabel = document.querySelector("#monthYearLabel");
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");

const selectedDateElement = document.querySelector("#selectedDate");

const taskInput = document.querySelector("#taskInput");
const addTaskBtn = document.querySelector("#addTaskBtn");
const taskList = document.querySelector("#taskList");

const eventinput = document.querySelector("#eventinput");
const eventadd = document.querySelector("#Addevent");
const eventlist = document.querySelector("#eventlist");

const todaysummary = document.querySelector("#todaySummary");
const jumptoday = document.querySelector("#jumpToTodayBtn");

const totalTasksCount = document.querySelector("#totalTasksCount");
const completedTasksCount = document.querySelector("#completedTasksCount");
const pendingTasksCount = document.querySelector("#pendingTasksCount");
const dashboardTodayTasks = document.querySelector("#dashboardTodayTasks");
const dashboardUpcomingEvents = document.querySelector(
  "#dashboardUpcomingEvents",
);
const taskCategorySelect = document.querySelector("#taskCategory");
const customCategoryFields = document.querySelector("#customCategoryFields");
const customCategoryName = document.querySelector("#customCategoryName");
const customCategoryColor = document.querySelector("#customCategoryColor");

const presetCategoryColors = {
  Homework: "#4f46e5",
  Exam: "#ef4444",
  Personal: "#10b981",
  Class: "#f59e0b",
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ---------- State ----------
let selectedDate = null;

const today = new Date();
let year = today.getFullYear();
let month = today.getMonth();

// Load saved tasks/events from localStorage (or start empty)
let tasks = JSON.parse(localStorage.getItem("planner_tasks")) || [];
let events = JSON.parse(localStorage.getItem("planner_events")) || [];

// ---------- Persistence helpers ----------
// function saveTasks() {
//   localStorage.setItem("planner_tasks", JSON.stringify(tasks));
// }
// function saveEvents() {
//   localStorage.setItem("planner_events", JSON.stringify(events));
// }

function saveTasks() {
  localStorage.setItem("planner_tasks", JSON.stringify(tasks));
  renderTodaySummary();
  renderDashboard();
}
function saveEvents() {
  localStorage.setItem("planner_events", JSON.stringify(events));
  renderTodaySummary();
  renderDashboard();
}

function hasItemsOnDate(dateObj) {
  const dateString = dateObj.toDateString();
  const hasTask = tasks.some((t) => t.date === dateString);
  const hasEvent = events.some((e) => e.date === dateString);
  return hasTask || hasEvent;
}
// Give every task/event a stable unique id so delete/toggle
// work correctly no matter which date is currently filtered.
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Calendar rendering ----------
function renderCalendar(y, m) {
  daysContainer.innerHTML = "";
  monthYearLabel.textContent = `${monthNames[m]} ${y}`;

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstDayIndex = new Date(y, m, 1).getDay();

  // empty cells before day 1
  for (let i = 0; i < firstDayIndex; i++) {
    daysContainer.appendChild(document.createElement("div"));
  }

  const isCurrentMonth = today.getFullYear() === y && today.getMonth() === m;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEl = document.createElement("div");
    dayEl.classList.add("day");
    dayEl.textContent = day;

    if (isCurrentMonth && day === today.getDate()) {
      dayEl.classList.add("today");
    }

    if (
      selectedDate &&
      selectedDate.getFullYear() === y &&
      selectedDate.getMonth() === m &&
      selectedDate.getDate() === day
    ) {
      dayEl.classList.add("selected");
    }

    dayEl.addEventListener("click", () => {
      selectedDate = new Date(y, m, day);
      selectedDateElement.textContent = selectedDate.toDateString();
      renderCalendar(year, month);
      renderTodaySummary();
      renderDashboard();
      // refresh to show "selected" highlight
      renderTasks();
      renderEvents();
    });

    daysContainer.appendChild(dayEl);
    if (hasItemsOnDate(new Date(y, m, day))) {
      const dot = document.createElement("span");
      dot.classList.add("day-dot");
      dayEl.appendChild(dot);
    }
  }
}

prevBtn.addEventListener("click", () => {
  month--;
  if (month < 0) {
    month = 11;
    year--;
  }
  renderCalendar(year, month);
});

nextBtn.addEventListener("click", () => {
  month++;
  if (month > 11) {
    month = 0;
    year++;
  }
  renderCalendar(year, month);
});
jumpToTodayBtn.addEventListener("click", () => {
  year = today.getFullYear();
  month = today.getMonth();
  selectedDate = new Date(today);

  selectedDateElement.textContent = selectedDate.toDateString();

  renderCalendar(year, month);
  renderTodaySummary();
  renderDashboard();
  renderTasks();
  renderEvents();
});

renderCalendar(year, month);
renderTodaySummary();

// ---------- Shared: inline edit ----------
// Swaps a label span for a text input, lets the user edit in place,
// and commits the change on Enter or blur (Escape cancels).
function enableEdit(labelEl, item, saveFn, rerenderFn) {
  const input = document.createElement("input");
  input.type = "text";
  input.classList.add("edit-input");
  input.value = item.text;

  labelEl.replaceWith(input);
  input.focus();
  input.select();

  let committed = false;

  function commit() {
    if (committed) return;
    committed = true;
    const newText = input.value.trim();
    if (newText !== "") {
      item.text = newText;
      saveFn();
    }
    rerenderFn();
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      committed = true; // skip saving
      rerenderFn();
    }
  });

  input.addEventListener("blur", commit);
}

taskCategorySelect.addEventListener("change", () => {
  customCategoryFields.style.display =
    taskCategorySelect.value === "Other" ? "flex" : "none";
});
// ---------- Tasks ----------
function renderTasks() {
  taskList.innerHTML = "";

  if (!selectedDate) {
    taskList.innerHTML =
      '<p class="empty-state">Select a date to see tasks</p>';
    return;
  }

  const tasksForDate = tasks.filter(
    (t) => t.date === selectedDate.toDateString(),
  );

  if (tasksForDate.length === 0) {
    taskList.innerHTML =
      '<p class="empty-state">No tasks for this date yet</p>';
    return;
  }

  for (const task of tasksForDate) {
    const taskItem = document.createElement("div");
    taskItem.classList.add("task-item");

    const categoryTag = document.createElement("span");
    categoryTag.classList.add("category-tag");
    categoryTag.textContent = task.category || "General";
    categoryTag.style.backgroundColor = task.color || "#64748b";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;

    const taskLabel = document.createElement("span");
    taskLabel.textContent = task.text;
    if (task.completed) taskLabel.classList.add("completed");

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.classList.add("edit-btn");

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      taskLabel.classList.toggle("completed", task.completed);
      saveTasks();
    });

    editBtn.addEventListener("click", () => {
      enableEdit(taskLabel, task, saveTasks, renderTasks);
    });

    deleteBtn.addEventListener("click", () => {
      const confirmed = confirm(`Delete "${task.text}"?`);
      if (!confirmed) return;

      tasks = tasks.filter((t) => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    taskItem.appendChild(categoryTag);
    taskItem.appendChild(checkbox);
    taskItem.appendChild(taskLabel);
    taskItem.appendChild(editBtn);
    taskItem.appendChild(deleteBtn);
    taskList.appendChild(taskItem);
  }
}

addTaskBtn.addEventListener("click", () => {
  const taskText = taskInput.value.trim();

  if (taskText === "") {
    alert("Please enter a task.");
    return;
  }
  if (!selectedDate) {
    alert("Please select a date first.");
    return;
  }
  let category, color;

  if (taskCategorySelect.value === "Other") {
    category = customCategoryName.value.trim() || "Other";
    color = customCategoryColor.value;
  } else {
    category = taskCategorySelect.value;
    color = presetCategoryColors[category];
  }
  tasks.push({
    id: makeId(),
    text: taskText,
    completed: false,
    date: selectedDate.toDateString(),
    category,
    color,
  });
  customCategoryName.value = "";

  saveTasks();
  renderTasks();

  taskInput.value = "";
  taskInput.focus();
});

// ---------- Events ----------
function renderEvents() {
  eventlist.innerHTML = "";
  if (!selectedDate) return;

  for (const evt of events) {
    if (evt.date !== selectedDate.toDateString()) continue;

    const eventItem = document.createElement("div");
    eventItem.classList.add("event-item");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = evt.completed;

    const eventLabel = document.createElement("span");
    eventLabel.textContent = evt.text;
    if (evt.completed) eventLabel.classList.add("completed");

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.classList.add("edit-btn");

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";

    checkbox.addEventListener("change", () => {
      evt.completed = checkbox.checked;
      eventLabel.classList.toggle("completed", evt.completed);
      saveEvents();
    });

    editBtn.addEventListener("click", () => {
      enableEdit(eventLabel, evt, saveEvents, renderEvents);
    });

    deleteBtn.addEventListener("click", () => {
      const confirmed = confirm(`Delete "${evt.text}"?`);
      if (!confirmed) return;
      events = events.filter((e) => e.id !== evt.id);
      saveEvents();
      renderEvents();
    });

    eventItem.appendChild(checkbox);
    eventItem.appendChild(eventLabel);
    eventItem.appendChild(editBtn);
    eventItem.appendChild(deleteBtn);
    eventlist.appendChild(eventItem);
  }
}

eventadd.addEventListener("click", () => {
  const eventText = eventinput.value.trim();

  if (eventText === "") {
    alert("Please add an event.");
    return;
  }
  if (!selectedDate) {
    alert("Please select a date first.");
    return;
  }

  events.push({
    id: makeId(),
    text: eventText,
    completed: false,
    date: selectedDate.toDateString(),
  });

  saveEvents();
  renderEvents();

  eventinput.value = "";
  eventinput.focus();
});
function renderTodaySummary() {
  todaySummary.innerHTML = "";

  const todayString = today.toDateString();

  const todaysTasks = tasks.filter((t) => t.date === todayString);
  const todaysEvents = events.filter((e) => e.date === todayString);

  if (todaysTasks.length === 0 && todaysEvents.length === 0) {
    const empty = document.createElement("p");
    empty.classList.add("today-summary-empty");
    empty.textContent = "Nothing scheduled for today 🎉";
    todaySummary.appendChild(empty);
    return;
  }

  for (const t of todaysTasks) {
    const item = document.createElement("div");
    item.classList.add("today-summary-item");

    const tag = document.createElement("span");
    tag.classList.add("today-summary-tag");
    tag.textContent = "Task";

    const label = document.createElement("span");
    label.textContent = t.text;
    if (t.completed) label.classList.add("completed");

    item.appendChild(tag);
    item.appendChild(label);
    todaySummary.appendChild(item);
  }

  for (const e of todaysEvents) {
    const item = document.createElement("div");
    item.classList.add("today-summary-item");

    const tag = document.createElement("span");
    tag.classList.add("today-summary-tag");
    tag.textContent = "Event";

    const label = document.createElement("span");
    label.textContent = e.text;
    if (e.completed) label.classList.add("completed");

    item.appendChild(tag);
    item.appendChild(label);
    todaySummary.appendChild(item);
  }
}

function renderDashboard() {
  // --- Stats ---
  const completed = tasks.filter((t) => t.completed).length;
  totalTasksCount.textContent = tasks.length;
  completedTasksCount.textContent = completed;
  pendingTasksCount.textContent = tasks.length - completed;

  // --- Today's tasks ---
  const todayString = today.toDateString();
  const todaysTasks = tasks.filter((t) => t.date === todayString);

  dashboardTodayTasks.innerHTML = "";
  if (todaysTasks.length === 0) {
    dashboardTodayTasks.innerHTML =
      '<p class="dashboard-empty">No tasks today</p>';
  } else {
    for (const t of todaysTasks) {
      const item = document.createElement("div");
      item.classList.add("dashboard-item");
      if (t.completed) item.classList.add("completed");
      item.textContent = t.text;
      dashboardTodayTasks.appendChild(item);
    }
  }

  // --- Upcoming events (future dates, soonest first, max 5) ---
  const upcoming = events
    .filter((e) => new Date(e.date) > today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  dashboardUpcomingEvents.innerHTML = "";
  if (upcoming.length === 0) {
    dashboardUpcomingEvents.innerHTML =
      '<p class="dashboard-empty">No upcoming events</p>';
  } else {
    for (const e of upcoming) {
      const item = document.createElement("div");
      item.classList.add("dashboard-item");
      item.textContent = `${e.text} — ${e.date}`;
      dashboardUpcomingEvents.appendChild(item);
    }
  }
}
