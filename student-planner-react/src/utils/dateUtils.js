const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LEGACY_DATE_PATTERN = /^(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{4})$/;
const LEGACY_MONTHS = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

export function toLocalDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey) {
  if (typeof dateKey !== "string") return null;

  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);
  const date = new Date(year, monthIndex, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function normalizeLocalDateKey(value) {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  const currentDate = parseDateKey(trimmedValue);
  if (currentDate) return toLocalDateKey(currentDate);

  const legacyMatch = LEGACY_DATE_PATTERN.exec(trimmedValue);
  if (!legacyMatch) return null;

  const [, monthName, dayText, yearText] = legacyMatch;
  const year = Number(yearText);
  const monthIndex = LEGACY_MONTHS[monthName];
  const day = Number(dayText);
  const legacyDate = new Date(year, monthIndex, day);

  if (
    legacyDate.getFullYear() !== year ||
    legacyDate.getMonth() !== monthIndex ||
    legacyDate.getDate() !== day
  ) {
    return null;
  }

  return toLocalDateKey(legacyDate);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getTodayKey() {
  return toLocalDateKey(new Date());
}

export function millisecondsUntilNextDay(now = new Date()) {
  const nextDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    100,
  );
  return Math.max(100, nextDay.getTime() - now.getTime());
}

export function isSameDateKey(firstKey, secondKey) {
  return Boolean(firstKey && secondKey && firstKey === secondKey);
}

export function getMonthLabel(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getMonthGrid(currentMonth) {
  const year = currentMonth.getFullYear();
  const monthIndex = currentMonth.getMonth();
  const leadingEmptyCells = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const emptyCells = Array.from({ length: leadingEmptyCells }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, monthIndex, index + 1);
    return {
      day: date.getDate(),
      dateKey: toLocalDateKey(date),
    };
  });

  return [...emptyCells, ...days];
}

export function getDateDisplay(dateKey) {
  const date = parseDateKey(dateKey);
  if (!date) return null;

  return {
    day: date.getDate(),
    weekday: new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date),
    monthYear: getMonthLabel(date),
    accessibleLabel: new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date),
  };
}
