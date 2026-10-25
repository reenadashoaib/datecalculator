import * as D from './dates.js';

const $ = (sel) => document.querySelector(sel);
const num = (n) => n.toLocaleString('en-US');
const plural = (n, word) => `${num(n)} ${word}${Math.abs(n) === 1 ? '' : 's'}`;
const longDate = (p) => `${D.WEEKDAYS[D.weekday(p)]}, ${D.MONTHS[p.m - 1]} ${p.d}, ${p.y}`;
const now = D.today();

function ymd({ years, months, days }) {
  const parts = [];
  if (years) parts.push(plural(years, 'year'));
  if (months) parts.push(plural(months, 'month'));
  if (days || !parts.length) parts.push(plural(days, 'day'));
  return parts.join(', ');
}

function fromToday(p) {
  const n = D.daysBetween(now, p);
  if (n === 0) return 'Today';
  return n > 0 ? `In ${plural(n, 'day')}` : `${plural(-n, 'day')} ago`;
}

function renderLeaf(fig, p) {
  if (!fig) return;
  const changed = fig.dataset.iso !== D.toISO(p);
  fig.dataset.iso = D.toISO(p);
  fig.dataset.weekend = D.isWeekend(p);
  fig.dataset.today = D.compare(p, now) === 0;
  fig.querySelector('.leaf__month').textContent = `${D.MONTHS[p.m - 1]} ${p.y}`;
  fig.querySelector('.leaf__day').textContent = p.d;
  fig.querySelector('.leaf__weekday').textContent = D.WEEKDAYS[D.weekday(p)];
  if (changed && fig.dataset.ready) {
    fig.classList.remove('is-turning');
    void fig.offsetWidth; // restart the animation
    fig.classList.add('is-turning');
  }
  fig.dataset.ready = '1';
}

function renderFacts(list) {
  const dl = $('#facts');
  dl.replaceChildren(...list.map(([term, value]) => {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = term;
    dd.textContent = value;
    row.append(dt, dd);
    return row;
  }));
}

function renderSpan(value, unit) {
  $('#span-value').textContent = value;
  $('#span-unit').textContent = unit;
}

function showResult(ok, message) {
  $('#result-body').hidden = !ok;
  const empty = $('#result-empty');
  empty.hidden = ok;
  if (!ok) empty.textContent = message;
}

// ---- URL state, so every result has a link that can be shared ----

const params = new URLSearchParams(location.search);

function bindDate(id, fallback) {
  const input = $(`#${id}`);
  const fromUrl = D.parseISO(params.get(id));
  input.value = D.toISO(fromUrl || fallback);
  return input;
}

function readDate(input) {
  const p = D.parseISO(input.value);
  input.setAttribute('aria-invalid', input.value && !p ? 'true' : 'false');
  return p;
}

function saveState(values) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== '' && value !== false && value !== 0 && value != null) q.set(key, value === true ? '1' : value);
  }
  history.replaceState(null, '', `${location.pathname}?${q}`);
}

function wireCommon(update) {
  document.querySelectorAll('[data-today]').forEach((btn) => {
    btn.addEventListener('click', () => {
      $(`#${btn.dataset.today}`).value = D.toISO(now);
      update();
    });
  });
  const copy = $('#copy-link');
  if (copy) {
    copy.addEventListener('click', async () => {
      const status = $('#copy-status');
      try {
        await navigator.clipboard.writeText(location.href);
        status.textContent = 'Link copied';
      } catch (e) {
        status.textContent = 'Copy the address from your browser bar to share this result';
      }
    });
  }
  $('#calc').addEventListener('input', update);
  $('#calc').addEventListener('change', update);
  $('#calc').addEventListener('submit', (e) => { e.preventDefault(); update(); });
  update();
}

// ---- Tools ----

const tools = {
  between() {
    const yearEnd = { y: now.y, m: 12, d: 31 };
    const from = bindDate('from', now);
    const to = bindDate('to', D.compare(now, yearEnd) === 0 ? { y: now.y + 1, m: 12, d: 31 } : yearEnd);
    const includeEnd = $('#include-end');
    includeEnd.checked = params.get('end') === '1';

    $('#swap').addEventListener('click', () => {
      [from.value, to.value] = [to.value, from.value];
      update();
    });

    function update() {
      const a = readDate(from), b = readDate(to);
      saveState({ from: from.value, to: to.value, end: includeEnd.checked });
      if (!a || !b) return showResult(false, 'Pick both dates to see how far apart they are.');
      showResult(true);

      const extra = includeEnd.checked ? 1 : 0;
      const diff = D.difference(a, b);
      const total = diff.totalDays + extra;
      const [first, last] = diff.sign < 0 ? [b, a] : [a, b];
      renderLeaf($('#leaf-a'), first);
      renderLeaf($('#leaf-b'), last);
      renderSpan(num(total), total === 1 ? 'day' : 'days');

      const lastCounted = extra ? D.addDays(last, 1) : last;
      $('#summary').textContent = diff.sign < 0
        ? `The end date is before the start date. They are ${plural(total, 'day')} apart, counting from ${longDate(first)} to ${longDate(last)}.`
        : `From ${longDate(first)} to ${longDate(last)} is ${plural(total, 'day')}${extra ? ', counting the end date' : ''}.`;

      const span = D.difference(first, lastCounted);
      renderFacts([
        ['Years, months, days', ymd(span)],
        ['Weeks', `${plural(Math.floor(total / 7), 'week')}${total % 7 ? `, ${plural(total % 7, 'day')}` : ''}`],
        ['In months', `${plural(span.totalMonths, 'month')}, ${plural(span.days, 'day')}`],
        ['Workdays (Mon–Fri)', num(D.businessDaysBetween(first, last, !!extra))],
        ['Hours', num(total * 24)],
        ['Minutes', num(total * 1440)],
      ]);
    }
    wireCommon(update);
  },

  add() {
    const start = bindDate('start', now);
    const fields = ['years', 'months', 'weeks', 'days'].map((id) => {
      const input = $(`#${id}`);
      input.value = parseInt(params.get(id), 10) || (id === 'days' && !params.has('start') ? 30 : 0);
      return input;
    });
    const op = params.get('op') === 'sub' ? 'sub' : 'add';
    $(`input[name="op"][value="${op}"]`).checked = true;
    const business = $('#business');
    business.checked = params.get('biz') === '1';

    function update() {
      const p = readDate(start);
      const sign = $('input[name="op"]:checked').value === 'sub' ? -1 : 1;
      const [years, months, weeks, days] = fields.map((f) => Math.max(0, Math.min(100000, parseInt(f.value, 10) || 0)));
      saveState({ start: start.value, op: sign < 0 ? 'sub' : '', years, months, weeks, days, biz: business.checked });
      if (!p) return showResult(false, 'Pick a start date to count from.');

      let result = D.addMonths(p, sign * (years * 12 + months));
      result = D.addDays(result, sign * weeks * 7);
      result = business.checked ? D.addBusinessDays(result, sign * days) : D.addDays(result, sign * days);
      if (result.y < 1 || result.y > 9999) return showResult(false, 'That lands outside the years 1 to 9999. Try a smaller amount.');
      showResult(true);

      renderLeaf($('#leaf-a'), p);
      renderLeaf($('#leaf-b'), result);
      const amount = [
        years && plural(years, 'year'), months && plural(months, 'month'),
        weeks && plural(weeks, 'week'), days && plural(days, business.checked ? 'workday' : 'day'),
      ].filter(Boolean).join(', ') || '0 days';
      renderSpan(`${sign < 0 ? '−' : '+'}${num(Math.abs(D.daysBetween(p, result)))}`, 'calendar days');
      $('#summary').textContent = `${longDate(p)} ${sign < 0 ? 'minus' : 'plus'} ${amount} is ${longDate(result)}.`;

      const week = D.isoWeek(result);
      renderFacts([
        ['Result', longDate(result)],
        ['Compared with today', fromToday(result)],
        ['Week number (ISO)', `Week ${week.week}, ${week.year}`],
        ['Day of the year', `${D.dayOfYear(result)} of ${D.daysInYear(result.y)}`],
      ]);
    }
    wireCommon(update);
  },

  age() {
    const birth = bindDate('birth', { y: now.y - 30, m: 1, d: 1 });
    const on = bindDate('on', now);

    function update() {
      const b = readDate(birth), o = readDate(on);
      saveState({ birth: birth.value, on: D.parseISO(on.value) && D.compare(D.parseISO(on.value), now) === 0 ? '' : on.value });
      if (!b || !o) return showResult(false, 'Enter a date of birth to see the age.');
      const a = D.age(b, o);
      if (!a) return showResult(false, 'The date of birth is after the "age on" date. Pick an earlier birth date or a later "age on" date.');
      showResult(true);

      renderLeaf($('#leaf-a'), b);
      renderLeaf($('#leaf-b'), o);
      renderSpan(num(a.years), a.years === 1 ? 'year old' : 'years old');
      $('#summary').textContent = `Someone born on ${longDate(b)} is ${ymd(a)} old on ${longDate(o)}.`;

      renderFacts([
        ['Exact age', ymd(a)],
        ['In months', `${plural(a.totalMonths, 'month')}, ${plural(a.days, 'day')}`],
        ['In weeks', `${plural(Math.floor(a.totalDays / 7), 'week')}, ${plural(a.totalDays % 7, 'day')}`],
        ['In days', num(a.totalDays)],
        ['Next birthday', `${longDate(a.nextBirthday)} (turns ${a.turning})`],
        ['Days to next birthday', a.daysToBirthday === 0 ? 'It’s today' : num(a.daysToBirthday)],
        ['Born on a', D.WEEKDAYS[D.weekday(b)]],
      ]);
    }
    wireCommon(update);
  },

  workdays() {
    const from = bindDate('from', now);
    const to = bindDate('to', D.addDays(now, 30));
    const includeEnd = $('#include-end');
    includeEnd.checked = params.get('end') === '1';

    $('#swap').addEventListener('click', () => {
      [from.value, to.value] = [to.value, from.value];
      update();
    });

    function update() {
      const a = readDate(from), b = readDate(to);
      saveState({ from: from.value, to: to.value, end: includeEnd.checked });
      if (!a || !b) return showResult(false, 'Pick both dates to count the workdays between them.');
      showResult(true);

      const [first, last] = D.compare(a, b) > 0 ? [b, a] : [a, b];
      const calendar = D.daysBetween(first, last) + (includeEnd.checked ? 1 : 0);
      const work = D.businessDaysBetween(first, last, includeEnd.checked);
      renderLeaf($('#leaf-a'), first);
      renderLeaf($('#leaf-b'), last);
      renderSpan(num(work), work === 1 ? 'workday' : 'workdays');
      $('#summary').textContent = `There ${work === 1 ? 'is' : 'are'} ${plural(work, 'workday')} (Monday to Friday) from ${longDate(first)} to ${longDate(last)}${includeEnd.checked ? ', counting the end date' : ''}.`;

      renderFacts([
        ['Workdays', num(work)],
        ['Weekend days', num(calendar - work)],
        ['Calendar days', num(calendar)],
        ['Work weeks', (work / 5).toLocaleString('en-US', { maximumFractionDigits: 1 })],
        ['Work hours at 8 a day', num(work * 8)],
      ]);
    }
    wireCommon(update);
  },

  weekday() {
    const date = bindDate('date', now);

    function update() {
      const p = readDate(date);
      saveState({ date: date.value });
      if (!p) return showResult(false, 'Pick a date to see which day of the week it falls on.');
      showResult(true);

      const w = D.WEEKDAYS[D.weekday(p)];
      const week = D.isoWeek(p);
      const doy = D.dayOfYear(p);
      const left = D.daysInYear(p.y) - doy;
      renderLeaf($('#leaf-a'), p);
      renderSpan(w, `Day ${doy} of ${p.y}`);
      $('#summary').textContent = `${D.MONTHS[p.m - 1]} ${p.d}, ${p.y} ${D.compare(p, now) < 0 ? 'was' : D.compare(p, now) > 0 ? 'will be' : 'is'} a ${w}.`;

      renderFacts([
        ['Week number (ISO)', `Week ${week.week}, ${week.year}`],
        ['Day of the year', `${doy} of ${D.daysInYear(p.y)}`],
        ['Days left in the year', num(left)],
        ['Quarter', `Q${Math.ceil(p.m / 3)}`],
        ['Leap year', D.isLeapYear(p.y) ? `Yes, ${p.y} has 366 days` : `No, ${p.y} has 365 days`],
        ['Compared with today', fromToday(p)],
      ]);
    }
    wireCommon(update);
  },
};

const tool = tools[document.body.dataset.tool];
if (tool) tool();
