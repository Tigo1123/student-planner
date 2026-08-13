export const COURSE_COLORS = [
  { name: "Teal", value: "#174f5c" },
  { name: "Blue", value: "#2563eb" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Green", value: "#16835b" },
  { name: "Orange", value: "#d97706" },
  { name: "Pink", value: "#db2777" },
  { name: "Red", value: "#dc3f45" },
];

export const COURSE_ICONS = [
  ["book", "General", "▤"], ["code", "Code", "</>"], ["database", "Database", "▱"],
  ["network", "Network", "⌘"], ["math", "Math", "∑"], ["science", "Science", "⚗"],
  ["business", "Business", "▥"], ["design", "Design", "◇"], ["research", "Research", "⌕"],
  ["language", "Language", "Aa"],
].map(([key, label, symbol]) => ({ key, label, symbol }));

export function getCourseIcon(key) {
  return COURSE_ICONS.find((icon) => icon.key === key) || COURSE_ICONS[0];
}
