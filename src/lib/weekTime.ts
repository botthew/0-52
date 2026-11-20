const ET_TZ = "America/New_York";

function nowPartsInEt(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: ET_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

export function nowInEt(): Date {
  const p = nowPartsInEt();
  // Create a Date that represents the ET wall-clock time (in UTC).
  // We only use it for week math (day boundaries) so this is fine.
  return new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second));
}

// ISO week number (Monday-based). Returns 1..53.
export function isoWeekNumber(dateUtcLike: Date): { year: number; week: number } {
  const d = new Date(dateUtcLike.getTime());
  d.setUTCHours(0, 0, 0, 0);

  // Thursday in current week decides the year.
  const day = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  d.setUTCDate(d.getUTCDate() - day + 3);

  const weekYear = d.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);

  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return { year: weekYear, week };
}

export function activeWeekEt(options?: { graceMondayNoon?: boolean }) {
  const graceMondayNoon = options?.graceMondayNoon ?? true;
  const et = nowInEt();
  const day = et.getUTCDay(); // 0 Sun ... 6 Sat (remember: this Date is ET wall-clock encoded in UTC)
  const hour = et.getUTCHours();

  // If it's Monday before 12:00 ET, treat as previous week (grace period).
  if (graceMondayNoon && day === 1 && hour < 12) {
    const prev = new Date(et.getTime() - 24 * 60 * 60 * 1000);
    return isoWeekNumber(prev);
  }
  return isoWeekNumber(et);
}

/** Week shown in the wordmark and used for uploads, including Monday-morning grace. */
export function currentSlotEt(): { year: number; week: number } {
  const { year, week } = activeWeekEt({ graceMondayNoon: true });
  return { year, week: Math.min(52, Math.max(1, week)) };
}
