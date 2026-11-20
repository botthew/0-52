export const WEEKS_PER_YEAR = 52;

export function weekLabel(week: number) {
  return String(week).padStart(2, "0");
}

export function clampWeek(week: number) {
  if (Number.isNaN(week)) return 1;
  return Math.min(WEEKS_PER_YEAR, Math.max(1, Math.trunc(week)));
}

/**
 * Get the date range for a given ISO week number in a year.
 * Returns start (Monday) and end (Sunday) dates.
 */
export function getWeekDateRange(year: number, week: number): { start: Date; end: Date } {
  // Jan 4 is always in week 1 (ISO 8601)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // Convert Sunday (0) to 7
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1); // Go to Monday of week 1
  
  // Add weeks
  const start = new Date(monday);
  start.setUTCDate(monday.getUTCDate() + (week - 1) * 7);
  
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  
  return { start, end };
}

export function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  const startStr = start.toLocaleDateString("en-US", opts);
  const endStr = end.toLocaleDateString("en-US", { ...opts, year: "numeric" });
  return `${startStr} – ${endStr}`;
}
