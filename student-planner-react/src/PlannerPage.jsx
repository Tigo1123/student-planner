import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Calendar from "./components/Calendar.jsx";
import DetailsPanel from "./components/DetailsPanel.jsx";
import TodaySummary from "./components/TodaySummary.jsx";
import EventList from "./components/EventList.jsx";
import BottomNavigation from "./components/BottomNavigation.jsx";
import LegacyImportDialog from "./components/LegacyImportDialog.jsx";
import {
  addMonths,
  parseDateKey,
  startOfMonth,
} from "./utils/dateUtils.js";
import useTodayKey from "./hooks/useTodayKey.js";
import {
  getMarkedDates,
  getTaskStats,
  getTodayOverview,
  getUpcomingEvents,
} from "./utils/plannerDataUtils.js";
import { useAuth } from "./auth/authContext.js";
import {
  createEvent,
  createTask,
  deleteEvent,
  deleteTask,
  getEvents,
  getTasks,
  importLegacyPlannerData,
  updateEvent,
  updateTask,
} from "./api/plannerApi.js";
import {
  finishLegacyPlannerDecision,
  readLegacyPlannerData,
} from "./utils/legacyPlannerData.js";

const DEFAULT_TASK_COLOR = "#64748b";

function PlannerPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [isPlannerLoading, setIsPlannerLoading] = useState(true);
  const [hasPlannerData, setHasPlannerData] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [plannerError, setPlannerError] = useState("");
  const [legacyData, setLegacyData] = useState(null);
  const [legacyError, setLegacyError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const todayKey = useTodayKey();

  useEffect(() => {
    let isCurrent = true;

    async function loadPlanner() {
      setTasks([]);
      setEvents([]);
      setPlannerError("");
      setHasPlannerData(false);
      setIsPlannerLoading(true);
      try {
        const [taskResponse, eventResponse] = await Promise.all([getTasks(), getEvents()]);
        if (!isCurrent) return;
        setTasks(taskResponse.tasks);
        setEvents(eventResponse.events);
        setHasPlannerData(true);
        setLegacyData(readLegacyPlannerData(user.id));
      } catch (error) {
        if (isCurrent) setPlannerError(error.message);
      } finally {
        if (isCurrent) setIsPlannerLoading(false);
      }
    }

    loadPlanner();
    return () => {
      isCurrent = false;
    };
  }, [user.id, loadAttempt]);

  const selectedTasks = useMemo(
    () => tasks.filter((task) => task.date === selectedDate),
    [tasks, selectedDate],
  );
  const selectedEvents = useMemo(
    () => events.filter((event) => event.date === selectedDate),
    [events, selectedDate],
  );
  const markedDates = useMemo(
    () => getMarkedDates(tasks, events),
    [tasks, events],
  );
  const taskStats = getTaskStats(tasks);
  const todayOverview = getTodayOverview(tasks, events, todayKey);
  const upcomingEvents = getUpcomingEvents(events, todayKey);

  function changeMonth(amount) {
    setCurrentMonth((month) => addMonths(month, amount));
    setSelectedDate(null);
  }

  function jumpToToday() {
    const today = parseDateKey(todayKey);
    if (!today) return;

    setCurrentMonth(startOfMonth(today));
    setSelectedDate(todayKey);
  }

  function navigateToDate(dateKey) {
    const date = parseDateKey(dateKey);
    if (!date) return;

    setCurrentMonth(startOfMonth(date));
    setSelectedDate(dateKey);
  }

  async function handleLogout() {
    setTasks([]);
    setEvents([]);
    await logout();
    navigate("/login", { replace: true });
  }

  async function handleAddTask(taskData) {
    if (!selectedDate) return false;
    const response = await createTask({
      text: taskData.text,
      date: selectedDate,
      completed: false,
      category: taskData.category || "General",
      color: taskData.color || DEFAULT_TASK_COLOR,
    });
    setTasks((previousTasks) => [...previousTasks, response.task]);
    return response.task;
  }

  async function handleToggleTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    try {
      const response = await updateTask(taskId, { completed: !task.completed });
      setTasks((previousTasks) => previousTasks.map((item) => (
        item.id === taskId ? response.task : item
      )));
    } catch (error) {
      setPlannerError(error.message);
    }
  }

  async function handleDeleteTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || !window.confirm(`Delete "${task.text}"?`)) return;
    try {
      await deleteTask(taskId);
      setTasks((previousTasks) => previousTasks.filter((item) => item.id !== taskId));
    } catch (error) {
      setPlannerError(error.message);
    }
  }

  async function handleEditTask(taskId, updates) {
    if (!updates.text.trim() || !parseDateKey(updates.date)) return false;
    const response = await updateTask(taskId, {
      text: updates.text.trim(),
      date: updates.date,
    });
    setTasks((previousTasks) => previousTasks.map((item) => (
      item.id === taskId ? response.task : item
    )));
    return true;
  }

  async function handleAddEvent(eventData) {
    if (!selectedDate) return false;
    const response = await createEvent({
      text: eventData.text,
      date: selectedDate,
      completed: false,
    });
    setEvents((previousEvents) => [...previousEvents, response.event]);
    return response.event;
  }

  async function handleToggleEvent(eventId) {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    try {
      const response = await updateEvent(eventId, { completed: !event.completed });
      setEvents((previousEvents) => previousEvents.map((item) => (
        item.id === eventId ? response.event : item
      )));
    } catch (error) {
      setPlannerError(error.message);
    }
  }

  async function handleDeleteEvent(eventId) {
    const event = events.find((item) => item.id === eventId);
    if (!event || !window.confirm(`Delete "${event.text}"?`)) return;
    try {
      await deleteEvent(eventId);
      setEvents((previousEvents) => previousEvents.filter((item) => item.id !== eventId));
    } catch (error) {
      setPlannerError(error.message);
    }
  }

  async function handleEditEvent(eventId, updates) {
    if (!updates.text.trim() || !parseDateKey(updates.date)) return false;
    const response = await updateEvent(eventId, {
      text: updates.text.trim(),
      date: updates.date,
    });
    setEvents((previousEvents) => previousEvents.map((item) => (
      item.id === eventId ? response.event : item
    )));
    return true;
  }

  async function handleLegacyImport() {
    if (!legacyData) return;
    setIsImporting(true);
    setLegacyError("");
    try {
      const response = await importLegacyPlannerData(legacyData);
      setTasks(response.tasks);
      setEvents(response.events);
      setLegacyData(null);
      try {
        finishLegacyPlannerDecision(user.id, "imported");
      } catch {
        setPlannerError("Your data was imported, but the old browser copy could not be cleared.");
      }
    } catch (error) {
      setLegacyError(error.message);
    } finally {
      setIsImporting(false);
    }
  }

  function handleStartFresh() {
    try {
      finishLegacyPlannerDecision(user.id, "discarded");
      setLegacyData(null);
      setLegacyError("");
    } catch {
      setLegacyError("The local planner data could not be cleared. It has been left intact.");
    }
  }

  return (
    <div className="app-shell">
      <Header todayKey={todayKey} user={user} onLogout={handleLogout} />

      {plannerError && (
        <div className="planner-error-banner" role="alert">
          <span>{plannerError}</span>
          <button type="button" onClick={() => setPlannerError("")}>Dismiss</button>
        </div>
      )}

      {isPlannerLoading ? (
        <main className="planner-loading" aria-live="polite">
          <div className="panel">
            <p className="eyebrow">Your planner</p>
            <h1>Loading your tasks and events…</h1>
          </div>
        </main>
      ) : !hasPlannerData ? (
        <main className="planner-loading">
          <div className="panel">
            <p className="eyebrow">Connection issue</p>
            <h1>Your planner data could not be loaded.</h1>
            <button
              className="primary-button planner-retry-button"
              type="button"
              onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            >
              Try again
            </button>
          </div>
        </main>
      ) : (
        <>

      <main className="planner-layout">
        <Dashboard
          taskStats={taskStats}
          todayTasks={todayOverview.tasks}
          upcomingEvents={upcomingEvents}
          onSelectUpcomingEvent={navigateToDate}
        />
        <Calendar
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          todayKey={todayKey}
          markedDates={markedDates}
          onSelectDate={setSelectedDate}
          onPreviousMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
          onJumpToToday={jumpToToday}
        />
        <DetailsPanel
          selectedDate={selectedDate}
          tasks={selectedTasks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
      </main>

      <section className="lower-grid" aria-label="Daily planner overview">
        <TodaySummary
          todayKey={todayKey}
          items={todayOverview.items}
          stats={todayOverview.stats}
          onJumpToToday={jumpToToday}
        />

        <section className="panel events-panel" id="events" aria-labelledby="events-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Selected date</p>
              <h2 id="events-title">School Events</h2>
            </div>
            <span className="count-pill">
              {selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}
            </span>
          </div>
          <EventList
            selectedDate={selectedDate}
            events={selectedEvents}
            onAddEvent={handleAddEvent}
            onToggleEvent={handleToggleEvent}
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={handleEditEvent}
          />
        </section>
      </section>

      <BottomNavigation />
        </>
      )}

      {legacyData && (
        <LegacyImportDialog
          data={legacyData}
          error={legacyError}
          isImporting={isImporting}
          onImport={handleLegacyImport}
          onStartFresh={handleStartFresh}
        />
      )}
    </div>
  );
}

export default PlannerPage;
