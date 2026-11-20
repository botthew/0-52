// The current week does not break a streak until it is over.
export function calculateStreak(weeks: number[], currentWeek: number): number {
  if (weeks.length === 0) return 0;

  const weekSet = new Set(weeks);
  let start = currentWeek;
  if (!weekSet.has(currentWeek) && currentWeek > 1) start = currentWeek - 1;

  let streak = 0;
  for (let w = start; w >= 1; w--) {
    if (!weekSet.has(w)) break;
    streak++;
  }
  return streak;
}
