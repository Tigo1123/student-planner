import { useEffect, useState } from "react";
import { parseStoredValue } from "../utils/storageUtils.js";

const initializationCache = new Map();

function getInitialValue(key, fallbackValue, normalize) {
  if (initializationCache.has(key)) return initializationCache.get(key);

  let initialValue;
  try {
    const storedValue = window.localStorage.getItem(key);
    initialValue = parseStoredValue(storedValue, fallbackValue, normalize);
  } catch {
    initialValue = normalize(fallbackValue);
  }

  initializationCache.set(key, initialValue);
  return initialValue;
}

function useLocalStorage(key, fallbackValue, normalize = (value) => value) {
  const [value, setValue] = useState(() => (
    getInitialValue(key, fallbackValue, normalize)
  ));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      initializationCache.set(key, value);
    } catch {
      // State remains usable in memory when storage is unavailable or full.
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
