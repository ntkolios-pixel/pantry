// Calendar-week helpers. Weeks run Sunday -> Saturday, matching the app's
// Sun-Thu weekday plan + Fri/Sat Shabbat structure. All dates are handled as
// local calendar days — never parse a "YYYY-MM-DD" string with `new Date()`
// directly, since that reads it as UTC midnight and can land on the wrong
// day depending on the device's timezone.

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** The most recent Sunday on/before `now`, as a "YYYY-MM-DD" local date. */
export function getCurrentWeekStart(now: Date = new Date()): string {
  return toIsoDate(addDays(now, -now.getDay()));
}

/** e.g. "week of Sep 14" */
export function formatWeekOf(weekStartIso: string): string {
  const date = parseIsoDate(weekStartIso);
  return `week of ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

const WEEKDAY_OFFSETS: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4 };
const SHABBAT_OFFSETS: Record<string, number> = { fri: 5, sat: 6 };

function formatWithOffset(weekStartIso: string, offset: number): string {
  const date = addDays(parseIsoDate(weekStartIso), offset);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "Sun, Sep 14" for a weekday_meals.day_key, or the original label if the week/key is unknown. */
export function formatWeekdayDate(weekStartIso: string | null | undefined, dayKey: string, fallbackLabel: string): string {
  const offset = WEEKDAY_OFFSETS[dayKey?.toLowerCase()];
  if (!weekStartIso || offset === undefined) return fallbackLabel;
  return formatWithOffset(weekStartIso, offset);
}

/** "Fri, Sep 19" for a shabbat_meals.meal_key, or the original label if the week/key is unknown. */
export function formatShabbatDate(weekStartIso: string | null | undefined, mealKey: string, fallbackLabel: string): string {
  const offset = SHABBAT_OFFSETS[mealKey?.toLowerCase()];
  if (!weekStartIso || offset === undefined) return fallbackLabel;
  return formatWithOffset(weekStartIso, offset);
}
