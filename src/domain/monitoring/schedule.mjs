// Schedule arithmetic for MANUAL REHEARSALS only, never an exchange-calendar authority.
export const SCHEDULE_VERSION = 'manual-schedule-1';
export const MONITORING_BLOCKERS = Object.freeze([
  'CALENDAR_UNVERIFIED', 'BILLING_UNVERIFIED', 'RAW_SOURCE_UNVERIFIED',
  'PRICE_UNITS_AND_TIMES_UNVERIFIED', 'NATIVE_DISPATCH_UNVERIFIED',
  'INCLUDED_USAGE_CONTROLS_UNVERIFIED', 'NOTIFICATION_RECEIPT_UNVERIFIED',
]);
export const REHEARSAL_WINDOW_SECONDS = 300;
export function validSessionDate(value) {
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) throw new Error('SESSION_DATE_INVALID');
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('SESSION_DATE_INVALID');
  return value;
}
export function validateScenario(body) {
  const keys = ['sessionDate', 'sessionStatus', 'regularClose', 'sourceNote', 'expectedVersion', 'acknowledgedRehearsal'];
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== keys.length
      || keys.some(k => !Object.hasOwn(body, k))) throw new Error('SCENARIO_INPUT_INVALID');
  validSessionDate(body.sessionDate);
  if (!['OPEN', 'CLOSED'].includes(body.sessionStatus)
      || (body.sessionStatus === 'CLOSED' ? body.regularClose !== null : !['13:00', '16:00'].includes(body.regularClose))
      || typeof body.sourceNote !== 'string' || !body.sourceNote.trim() || body.sourceNote.length > 250
      || /[\u0000-\u001f\u007f]/.test(body.sourceNote)
      || !Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 0
      || body.acknowledgedRehearsal !== true) throw new Error('SCENARIO_INPUT_INVALID');
  return body;
}
function parts(instant, zone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {timeZone: zone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'});
  const value = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(p => [p.type, p.value]));
  return [value.year, value.month, value.day, value.hour, value.minute, value.second].map(Number);
}
function localInstant(date, time, zone) {
  const [year, month, day] = date.split('-').map(Number), [hour, minute] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  for (let i = 0; i < 4; i++) {
    const [y, m, d, h, min, sec] = parts(guess, zone);
    const delta = target - Date.UTC(y, m - 1, d, h, min, sec);
    if (!delta) return guess;
    guess += delta;
  }
  throw new Error('TIMEZONE_CONVERSION_FAILED');
}
export function scenarioSchedule(body) {
  validateScenario(body);
  if (body.sessionStatus === 'CLOSED') return [];
  return [
    ['JERUSALEM_2240', localInstant(body.sessionDate, '22:40', 'Asia/Jerusalem')],
    ['AFTER_CLOSE', localInstant(body.sessionDate, body.regularClose, 'America/New_York') + 900000],
  ].map(([reason, due]) => ({reason, dueAt: new Date(due).toISOString(),
    deadlineAt: new Date(due + REHEARSAL_WINDOW_SECONDS * 1000).toISOString(),
    scope: 'MANUAL_REHEARSAL', liveEligible: false})).sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.reason.localeCompare(b.reason));
}
export function rehearsalTiming(run, now = new Date()) {
  const clock = now instanceof Date ? now.getTime() : NaN;
  if (!Number.isFinite(clock)) throw new Error('MONITORING_CLOCK_INVALID');
  const due = Date.parse(run.dueAt), deadline = Date.parse(run.deadlineAt);
  if (!Number.isFinite(due) || !Number.isFinite(deadline) || deadline <= due) throw new Error('REHEARSAL_TIME_INVALID');
  return clock < due ? 'UPCOMING' : clock >= deadline ? 'EXPIRED' : 'DUE';
}
