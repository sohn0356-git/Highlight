/**
 * Centralized Korea timezone date utilities.
 * ALL date calculations in the app MUST go through this module.
 * Timezone: Asia/Seoul (KST = UTC+9)
 */

const TZ = "Asia/Seoul";

/** Current date string in Korea time (YYYY-MM-DD) */
export function koreaDate(d?: Date): string {
  return fmt(d ?? now());
}

/** Current datetime in Korea time */
export function now(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
}

/** Parse a YYYY-MM-DD string to a Date at midnight KST */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date as YYYY-MM-DD in Korea time */
export function fmt(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  return parts; // Already YYYY-MM-DD
}

/** Start of day in Korea time (00:00:00.000) */
export function startOfDay(dateStr?: string): Date {
  const d = parseDate(dateStr ?? koreaDate());
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** End of day in Korea time (23:59:59.999) */
export function endOfDay(dateStr?: string): Date {
  const d = parseDate(dateStr ?? koreaDate());
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Get the Sunday (주일) for a given date.
 * Sunday = day 0. If the date IS Sunday, return it.
 * If Monday-Saturday, return the NEXT Sunday.
 */
export function getSunday(d: Date): Date {
  const day = d.getDay();
  if (day === 0) return new Date(d);
  const result = new Date(d);
  result.setDate(result.getDate() + (7 - day));
  return result;
}

/** Get the Monday of the current week (ISO week) */
export function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday=1, Sunday goes back 6
  const result = new Date(d);
  result.setDate(result.getDate() + diff);
  return result;
}

/** Start of the week (Monday 00:00) in Korea time */
export function startOfWeek(dateStr?: string): Date {
  return startOfDay(fmt(getMonday(parseDate(dateStr ?? koreaDate()))));
}

/** End of the week (Sunday 23:59:59.999) */
export function endOfWeek(dateStr?: string): Date {
  return endOfDay(fmt(getSunday(parseDate(dateStr ?? koreaDate()))));
}

/** Start of month */
export function startOfMonth(dateStr?: string): Date {
  const d = parseDate(dateStr ?? koreaDate());
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** End of month */
export function endOfMonth(dateStr?: string): Date {
  const d = parseDate(dateStr ?? koreaDate());
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** ISO week number */
export function getWeekNumber(dateStr?: string): number {
  const d = parseDate(dateStr ?? koreaDate());
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
  const jan1Day = jan1.getDay();
  return Math.ceil((dayOfYear + jan1Day + 1) / 7);
}

/** Is the given date today in Korea time? */
export function isToday(dateStr: string): boolean {
  return dateStr === koreaDate();
}

/** Add days to a date string */
export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return fmt(d);
}

/** Add weeks to a date string */
export function addWeeks(dateStr: string, weeks: number): string {
  return addDays(dateStr, weeks * 7);
}

/** Is date A after date B? (exclusive) */
export function isAfter(a: string, b: string): boolean {
  return a > b;
}

/** Is date A before date B? (exclusive) */
export function isBefore(a: string, b: string): boolean {
  return a < b;
}

/** Is date A between start and end (inclusive)? */
export function isBetween(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}

/** Format for display: "9월 2일 (화)" */
export function displayDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TZ,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(d);
}

/** Format range: "9월 1일 ~ 9월 7일" */
export function displayDateRange(start: string, end: string): string {
  const s = parseDate(start);
  const e = parseDate(end);
  const sm = s.getMonth() + 1, sd = s.getDate();
  const em = e.getMonth() + 1, ed = e.getDate();
  if (sm === em) return `${sm}월 ${sd}일 ~ ${ed}일`;
  return `${sm}월 ${sd}일 ~ ${em}월 ${ed}일`;
}
