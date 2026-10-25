// Calendar-date math. Dates are plain {y, m, d} objects (m is 1-12) and all
// arithmetic happens in UTC, so daylight-saving changes never shift a count.

const DAY_MS = 86400000;

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y, m) {
  return m === 2 ? (isLeapYear(y) ? 29 : 28) : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

export function parseISO(s) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!match) return null;
  const y = +match[1], m = +match[2], d = +match[3];
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

export function toISO({ y, m, d }) {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Date.UTC maps years 0-99 to 1900-1999, so set the full year explicitly.
function toMs({ y, m, d }) {
  const t = new Date(0);
  t.setUTCFullYear(y, m - 1, d);
  return t.getTime();
}

function fromMs(ms) {
  const t = new Date(ms);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

export function today() {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

export function compare(a, b) {
  return Math.sign(toMs(a) - toMs(b));
}

export function weekday(p) {
  return new Date(toMs(p)).getUTCDay();
}

export function isWeekend(p) {
  const w = weekday(p);
  return w === 0 || w === 6;
}

export function daysBetween(a, b) {
  return Math.round((toMs(b) - toMs(a)) / DAY_MS);
}

export function addDays(p, n) {
  return fromMs(toMs(p) + n * DAY_MS);
}

// Adding months keeps the day of month, clamped to the target month's length
// (Jan 31 + 1 month = Feb 28 or 29).
export function addMonths(p, n) {
  const index = p.y * 12 + (p.m - 1) + n;
  const y = Math.floor(index / 12);
  const m = index - y * 12 + 1;
  return { y, m, d: Math.min(p.d, daysInMonth(y, m)) };
}

export function addYears(p, n) {
  return addMonths(p, n * 12);
}

// Whole years, months and days from a to b. The result is always positive;
// `sign` is -1 when b comes before a.
export function difference(a, b) {
  let sign = 1;
  if (compare(a, b) > 0) {
    [a, b] = [b, a];
    sign = -1;
  }
  let totalMonths = (b.y - a.y) * 12 + (b.m - a.m);
  if (compare(addMonths(a, totalMonths), b) > 0) totalMonths--;
  const days = daysBetween(addMonths(a, totalMonths), b);
  return {
    sign,
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days,
    totalMonths,
    totalDays: daysBetween(a, b),
  };
}

// Monday-Friday days in a run of `count` consecutive days starting at p.
function weekdaysInRun(p, count) {
  const start = weekday(p);
  let total = Math.floor(count / 7) * 5;
  for (let i = 0; i < count % 7; i++) {
    const w = (start + i) % 7;
    if (w !== 0 && w !== 6) total++;
  }
  return total;
}

// Weekdays from a up to b. The start date counts; the end date counts only
// when includeEnd is set, matching how daysBetween counts.
export function businessDaysBetween(a, b, includeEnd = false) {
  let sign = 1;
  if (compare(a, b) > 0) {
    [a, b] = [b, a];
    sign = -1;
  }
  const count = daysBetween(a, b) + (includeEnd ? 1 : 0);
  return sign * weekdaysInRun(a, count);
}

// Steps n weekdays forward (or back when n is negative), skipping Saturdays
// and Sundays. The start date itself is never counted.
export function addBusinessDays(p, n) {
  const step = n < 0 ? -1 : 1;
  let remaining = Math.abs(n);
  let current = p;
  while (remaining > 0) {
    current = addDays(current, step);
    if (!isWeekend(current)) remaining--;
  }
  return current;
}

export function dayOfYear(p) {
  return daysBetween({ y: p.y, m: 1, d: 1 }, p) + 1;
}

export function daysInYear(y) {
  return isLeapYear(y) ? 366 : 365;
}

// ISO 8601 week: weeks start on Monday and week 1 holds the year's first Thursday.
export function isoWeek(p) {
  const thursday = addDays(p, 3 - ((weekday(p) + 6) % 7));
  return { year: thursday.y, week: Math.floor((dayOfYear(thursday) - 1) / 7) + 1 };
}

// A Feb 29 birthday falls on Feb 28 in common years.
function birthdayIn(birth, y) {
  return { y, m: birth.m, d: Math.min(birth.d, daysInMonth(y, birth.m)) };
}

export function age(birth, on) {
  if (compare(birth, on) > 0) return null;
  const span = difference(birth, on);
  let next = birthdayIn(birth, on.y);
  if (compare(next, on) < 0) next = birthdayIn(birth, on.y + 1);
  return {
    ...span,
    nextBirthday: next,
    daysToBirthday: daysBetween(on, next),
    turning: next.y - birth.y,
  };
}
