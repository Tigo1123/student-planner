import { useCallback, useEffect, useState } from "react";
import {
  deleteReminder as deleteApi,
  dismissReminder as dismissApi,
  getDueReminders,
  getReminders,
} from "../api/remindersApi.js";
import { useAuth } from "../auth/authContext.js";
import { ReminderContext } from "./reminderContext.js";

export function ReminderProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [due, setDue] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [dueResponse, upcomingResponse] = await Promise.all([
        getDueReminders(),
        getReminders("upcoming"),
      ]);
      setDue(dueResponse.reminders);
      setUpcoming(upcomingResponse.reminders);
      setError("");
    } catch (nextError) {
      setError(nextError.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const initialRefresh = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, 60000);
    const handleFocus = () => refresh();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated, refresh]);

  async function dismiss(id) {
    await dismissApi(id);
    await refresh();
  }
  async function remove(id) {
    await deleteApi(id);
    await refresh();
  }

  const value = {
    due: isAuthenticated ? due : [],
    upcoming: isAuthenticated ? upcoming : [],
    error,
    panelOpen,
    setPanelOpen,
    refresh,
    dismiss,
    remove,
  };
  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}
