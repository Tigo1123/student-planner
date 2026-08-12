import { useEffect, useState } from "react";
import { getTodayKey, millisecondsUntilNextDay } from "../utils/dateUtils.js";

function useTodayKey() {
  const [todayKey, setTodayKey] = useState(getTodayKey);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setTodayKey(getTodayKey());
    }, millisecondsUntilNextDay());

    return () => window.clearTimeout(timeoutId);
  }, [todayKey]);

  return todayKey;
}

export default useTodayKey;
