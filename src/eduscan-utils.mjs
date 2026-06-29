// EduScan PH — pure utility functions
//
// These helpers are extracted verbatim from the inline application logic in
// index.html so they can be unit-tested and benchmarked in isolation. They are
// pure (no DOM, IndexedDB, or network access) which makes them deterministic
// and ideal targets for CodSpeed's CPU simulation instrument.

// ── STRING / HTML HELPERS ─────────────────────────────────────────────────
export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

export function escapeAttr(value) {
  return escapeHTML(value);
}

// ── DATE HELPERS (Philippine time — UTC+8) ────────────────────────────────
export function sameDay(isoTimestamp, dateStr) {
  const d  = new Date(isoTimestamp);
  const ph = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const phStr = ph.getFullYear() + '-' +
    String(ph.getMonth() + 1).padStart(2, '0') + '-' +
    String(ph.getDate()).padStart(2, '0');
  return phStr === dateStr;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Universal log-date helper: prefer the stored localDate, otherwise derive it
// from the timestamp pinned to Asia/Manila.
export function getLogDate(l) {
  if (l.localDate) return l.localDate;
  const d = new Date(l.timestamp);
  const ph = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  return ph.getFullYear() + '-' + String(ph.getMonth() + 1).padStart(2, '0') + '-' + String(ph.getDate()).padStart(2, '0');
}

export function getLogMonth(l) {
  const dateStr = getLogDate(l); // 'YYYY-MM-DD'
  return parseInt(dateStr.split('-')[1], 10);
}

// Convert a Philippine-local wall-clock time to an ISO string (UTC+8, no DST).
export function phLocalToISOString(y, mo, d, h, mi) {
  const utcMillis = Date.UTC(y, mo - 1, d, h, mi, 0) - (8 * 60 * 60 * 1000);
  return new Date(utcMillis).toISOString();
}

// ── SF2 NAME / RECORD HELPERS ─────────────────────────────────────────────
// Official SF2 format: LASTNAME, Firstname Middlename
export function buildStudentName(lastName, firstName, middleName) {
  const ln = (lastName || '').trim().toUpperCase();
  const fn = (firstName || '').trim();
  const mn = (middleName || '').trim();
  let n = ln;
  if (fn) n += (ln ? ', ' : '') + fn;
  if (mn) n += ' ' + mn;
  return n;
}

export function isSystemName(name) {
  return typeof name === 'string' && name.trim().startsWith('_');
}

export function isValidTimestampValue(value) {
  return !!value && !isNaN(new Date(value).getTime());
}

// ── SYNC HELPERS ──────────────────────────────────────────────────────────
export function deriveSyncSecret(url) {
  const chars = String(url || '').replace(/[^a-zA-Z0-9]/g, '');
  return chars.length >= 20 ? 'eduscan_' + chars.slice(-20) : '';
}

export function logMergeKey(l) {
  return [
    l.timestamp || '',
    l.studentLrn || l.studentName || l.studentId || '',
    l.type || 'arrival'
  ].join('|');
}

// ── TERM CALENDAR HELPERS ─────────────────────────────────────────────────
export function defaultTermsForYear(startYear) {
  return [
    { num: 1, label: 'Term 1', startDate: `${startYear}-06-01`,     endDate: `${startYear}-10-01`,     range: 'Jun – Sep' },
    { num: 2, label: 'Term 2', startDate: `${startYear}-10-01`,     endDate: `${startYear + 1}-01-01`, range: 'Oct – Dec' },
    { num: 3, label: 'Term 3', startDate: `${startYear + 1}-01-01`, endDate: `${startYear + 1}-04-01`, range: 'Jan – Mar' },
  ];
}

// Builds a 3-term calendar from an explicit "first day of classes" date using
// the same ~4/3/3-month DepEd split as the default.
export function computeTermsFromStartDate(startDateStr) {
  const monthName = m => new Date(2000, m - 1, 1).toLocaleDateString([], { month: 'short' });
  const addMonths = (dateStr, months) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const totalMonths = (m - 1) + months;
    const newYear  = y + Math.floor(totalMonths / 12);
    const newMonth = (totalMonths % 12) + 1;
    return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };
  const startMonthNum = parseInt(startDateStr.split('-')[1], 10);
  const wrap = m => ((m - 1) % 12) + 1;

  const t1Start = startDateStr,        t1End = addMonths(startDateStr, 4);
  const t2Start = t1End,                t2End = addMonths(startDateStr, 7);
  const t3Start = t2End,                t3End = addMonths(startDateStr, 10);

  const labelFor = (offset, span) => {
    const first = wrap(startMonthNum + offset);
    const last  = wrap(startMonthNum + offset + span - 1);
    return `${monthName(first)} – ${monthName(last)}`;
  };

  return [
    { num: 1, label: 'Term 1', startDate: t1Start, endDate: t1End, range: labelFor(0, 4) },
    { num: 2, label: 'Term 2', startDate: t2Start, endDate: t2End, range: labelFor(4, 3) },
    { num: 3, label: 'Term 3', startDate: t3Start, endDate: t3End, range: labelFor(7, 3) },
  ];
}
