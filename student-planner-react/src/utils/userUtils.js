export function getUserInitials(name) {
  const parts = typeof name === "string" ? name.trim().split(/\s+/).filter(Boolean) : [];
  if (!parts.length) return "S";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase();
}
