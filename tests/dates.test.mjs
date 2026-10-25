import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../public/assets/js/dates.js';

const p = D.parseISO;

test('parseISO rejects impossible dates', () => {
  assert.deepEqual(p('2024-02-29'), { y: 2024, m: 2, d: 29 });
  assert.equal(p('2023-02-29'), null);
  assert.equal(p('2024-13-01'), null);
  assert.equal(p('24-01-01'), null);
  assert.equal(p(''), null);
});

test('years below 100 are not shifted to the 1900s', () => {
  assert.equal(D.toISO(D.addDays(p('0050-01-01'), 1)), '0050-01-02');
  assert.equal(D.daysBetween(p('0099-12-31'), p('0100-01-01')), 1);
});

test('daysBetween ignores daylight saving and handles leap years', () => {
  assert.equal(D.daysBetween(p('2026-03-01'), p('2026-04-01')), 31);
  assert.equal(D.daysBetween(p('2024-01-01'), p('2025-01-01')), 366);
  assert.equal(D.daysBetween(p('2025-01-01'), p('2024-01-01')), -366);
});

test('addMonths clamps to the end of shorter months', () => {
  assert.equal(D.toISO(D.addMonths(p('2026-01-31'), 1)), '2026-02-28');
  assert.equal(D.toISO(D.addMonths(p('2024-01-31'), 1)), '2024-02-29');
  assert.equal(D.toISO(D.addMonths(p('2026-03-31'), -1)), '2026-02-28');
  assert.equal(D.toISO(D.addYears(p('2024-02-29'), 1)), '2025-02-28');
  assert.equal(D.toISO(D.addMonths(p('2026-11-15'), 3)), '2027-02-15');
});

test('difference breaks a span into years, months and days', () => {
  assert.deepEqual(
    (({ years, months, days, totalDays }) => ({ years, months, days, totalDays }))(D.difference(p('2000-01-15'), p('2026-10-25'))),
    { years: 26, months: 9, days: 10, totalDays: 9780 },
  );
  const jan31 = D.difference(p('2026-01-31'), p('2026-03-01'));
  assert.deepEqual([jan31.years, jan31.months, jan31.days], [0, 1, 1]);
  const back = D.difference(p('2026-03-01'), p('2026-01-01'));
  assert.equal(back.sign, -1);
  assert.deepEqual([back.months, back.days], [2, 0]);
  const same = D.difference(p('2026-05-05'), p('2026-05-05'));
  assert.deepEqual([same.years, same.months, same.days, same.totalDays], [0, 0, 0, 0]);
});

test('business days count weekdays only', () => {
  // Mon 2026-10-19 to Mon 2026-10-26: Mon-Fri counted, end excluded.
  assert.equal(D.businessDaysBetween(p('2026-10-19'), p('2026-10-26')), 5);
  assert.equal(D.businessDaysBetween(p('2026-10-19'), p('2026-10-26'), true), 6);
  assert.equal(D.businessDaysBetween(p('2026-10-24'), p('2026-10-26')), 0);
  assert.equal(D.businessDaysBetween(p('2026-10-26'), p('2026-10-19')), -5);
  assert.equal(D.businessDaysBetween(p('2026-01-01'), p('2027-01-01')), 261);
});

test('addBusinessDays skips weekends', () => {
  assert.equal(D.toISO(D.addBusinessDays(p('2026-10-23'), 1)), '2026-10-26'); // Fri -> Mon
  assert.equal(D.toISO(D.addBusinessDays(p('2026-10-24'), 5)), '2026-10-30'); // Sat -> Fri
  assert.equal(D.toISO(D.addBusinessDays(p('2026-10-26'), -1)), '2026-10-23'); // Mon -> Fri
  assert.equal(D.toISO(D.addBusinessDays(p('2026-10-21'), 0)), '2026-10-21');
});

test('ISO week numbers match the standard edge cases', () => {
  assert.deepEqual(D.isoWeek(p('2021-01-03')), { year: 2020, week: 53 });
  assert.deepEqual(D.isoWeek(p('2024-12-30')), { year: 2025, week: 1 });
  assert.deepEqual(D.isoWeek(p('2026-10-25')), { year: 2026, week: 43 });
  assert.equal(D.WEEKDAYS[D.weekday(p('2026-10-25'))], 'Sunday');
  assert.equal(D.dayOfYear(p('2024-12-31')), 366);
});

test('age handles birthdays and Feb 29', () => {
  const a = D.age(p('1990-10-26'), p('2026-10-25'));
  assert.deepEqual([a.years, a.months, a.days, a.daysToBirthday, a.turning], [35, 11, 29, 1, 36]);
  const birthday = D.age(p('1990-10-25'), p('2026-10-25'));
  assert.deepEqual([birthday.years, birthday.daysToBirthday, birthday.turning], [36, 0, 36]);
  const leap = D.age(p('2000-02-29'), p('2026-03-01'));
  assert.equal(D.toISO(leap.nextBirthday), '2027-02-28');
  assert.equal(D.age(p('2030-01-01'), p('2026-01-01')), null);
});
