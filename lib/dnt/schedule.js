// lib/dnt/schedule.js

// Anchor: the day your daily cycle starts.
// Change once (e.g., when you launched this feature). Today (Nov 9, 2025) would be day 40 from Oct 1, 2025.
export const TIPS_ANCHOR_ISO = '2025-10-01';

// Local-day helpers (avoid timezone off-by-one)
function dateOnlyLocal(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysBetweenLocal(a, b) {
  const A = dateOnlyLocal(a).getTime();
  const B = dateOnlyLocal(b).getTime();
  const DAY = 24 * 60 * 60 * 1000;
  return Math.round((B - A) / DAY);
}

// 0-based day index since anchor (local)
export function dayIndexFromAnchor(date) {
  const anchor = dateOnlyLocal(new Date(TIPS_ANCHOR_ISO));
  const target = dateOnlyLocal(date);
  return daysBetweenLocal(anchor, target); // 0 for Oct 1, 1 for Oct 2, ...
}

// Map a date to manifest index (cyclic across any length)
export function tipIndexForDate(date, manifestLength) {
  if (!manifestLength) return 0;
  const idx = dayIndexFromAnchor(date);
  return ((idx % manifestLength) + manifestLength) % manifestLength;
}

// Get calendar date for a 0-based day index since anchor (local)
export function dateForDayIndex(dayIdx) {
  const anchor = dateOnlyLocal(new Date(TIPS_ANCHOR_ISO));
  const d = new Date(anchor);
  d.setDate(anchor.getDate() + dayIdx);
  return d;
}

// Count of days from anchor up to & including "today" (local)
// Example: Oct 1 → Nov 9 = 40 (31 in Oct + 9 in Nov)
export function inclusiveCountUpToToday(today = new Date()) {
  return dayIndexFromAnchor(today) + 1;
}
