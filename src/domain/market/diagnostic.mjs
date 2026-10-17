import Decimal from 'decimal.js';

const D = Decimal.clone({precision: 40});
export const DIAGNOSTIC_VERSION = 'quote-diagnostic-1';
export const INTEGRATION_BLOCKERS = Object.freeze([
  'SOURCE_UNVERIFIED', 'ENTITLEMENT_UNVERIFIED', 'INSTRUMENT_UNVERIFIED',
  'SESSION_CALENDAR_UNVERIFIED', 'CORPORATE_ACTIONS_UNVERIFIED',
]);
const fields = ['last', 'bid', 'ask'];
const identityKeys = ['symbol', 'contractId', 'exchange', 'currency', 'securityType'];

function shape(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).length !== keys.length
      || keys.some(key => !Object.hasOwn(value, key))) throw new Error('MARKET_INPUT_INVALID');
}
function choice(value, choices) {
  if (!choices.includes(value)) throw new Error('MARKET_INPUT_INVALID');
}
function shortText(value, max = 100) {
  if (typeof value !== 'string' || !value.trim() || value.length > max
      || /[\u0000-\u001f\u007f]/.test(value)) throw new Error('MARKET_INPUT_INVALID');
}
function identity(value) {
  shape(value, identityKeys);
  if (typeof value.symbol !== 'string' || !/^[A-Z][A-Z0-9.-]{0,9}$/.test(value.symbol)
      || typeof value.contractId !== 'string' || !/^[1-9][0-9]{0,17}$/.test(value.contractId)) {
    throw new Error('MARKET_INPUT_INVALID');
  }
  for (const key of ['exchange', 'currency', 'securityType']) shortText(value[key], 20);
}

// Require explicit RFC3339 offsets. Reject rolled-over dates, epoch numbers,
// local wall-clock strings and timezone offsets outside +/-14:00.
export function sourceTimestamp(value) {
  if (typeof value !== 'string') return null;
  const m = /^(20\d{2})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!m) return null;
  const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number);
  const offsetHour = Number(m[10] ?? 0), offsetMinute = Number(m[11] ?? 0);
  if (month < 1 || month > 12 || day < 1
      || day > new Date(Date.UTC(year, month, 0)).getUTCDate()
      || hour > 23 || minute > 59 || second > 59
      || offsetHour > 14 || offsetMinute > 59 || (offsetHour === 14 && offsetMinute !== 0)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function price(value) {
  // Do not accept a binary float, exponent, inferred decimal scale or currency conversion.
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,12})(\.[0-9]{1,12})?$/.test(value)) return null;
  const amount = new D(value);
  return amount.gt(0) && amount.lte('1000000000000') ? amount : null;
}

export function validateDiagnosticInput(input) {
  shape(input, ['schemaVersion', 'expectedInstrument', 'instrument', 'source', 'quote', 'request']);
  if (input.schemaVersion !== 1) throw new Error('MARKET_INPUT_INVALID');
  identity(input.instrument); identity(input.expectedInstrument);
  shape(input.source, ['provider', 'tool', 'eventId', 'receivedAt', 'feedStatus', 'coverage']);
  shortText(input.source.provider, 40); shortText(input.source.tool); shortText(input.source.eventId);
  choice(input.source.feedStatus, ['REALTIME', 'DELAYED', 'UNKNOWN']);
  choice(input.source.coverage, ['NON_CONSOLIDATED', 'CONSOLIDATED', 'UNKNOWN']);
  if (input.source.receivedAt !== null) shortText(input.source.receivedAt, 40);
  shape(input.quote, [...fields, 'session', 'marketStatus']);
  choice(input.quote.session, ['REGULAR_OPEN', 'REGULAR_CLOSED', 'EXTENDED', 'UNKNOWN']);
  choice(input.quote.marketStatus, ['TRADING', 'HALTED', 'CLOSE_ONLY', 'UNKNOWN']);
  for (const name of fields) {
    shape(input.quote[name], ['value', 'unit', 'observedAt']);
    const field = input.quote[name];
    for (const [key, max] of [['value', 64], ['unit', 40], ['observedAt', 40]]) {
      if (field[key] !== null && (typeof field[key] !== 'string' || field[key].length > max)) {
        throw new Error('MARKET_INPUT_INVALID');
      }
    }
  }
  shape(input.request, ['interval', 'requiredCoverage']);
  choice(input.request.interval, ['LIVE_PRICE', 'REGULAR_SESSION_EOD']);
  choice(input.request.requiredCoverage, ['NON_CONSOLIDATED', 'CONSOLIDATED', 'CONSOLIDATED_VOLUME', 'UNKNOWN']);
  return input;
}

export function diagnoseQuote(input, now = new Date()) {
  validateDiagnosticInput(input);
  const nowMs = now instanceof Date ? now.getTime() : NaN;
  if (!Number.isFinite(nowMs)) throw new Error('DIAGNOSTIC_CLOCK_INVALID');
  const findings = [];
  const add = (code, field = null) => findings.push({code, field});
  const {instrument, expectedInstrument, source, quote, request} = input;
  if (identityKeys.some(key => instrument[key] !== expectedInstrument[key])) add('CONTRACT_MISMATCH');
  if (![instrument, expectedInstrument].every(i => i.currency === 'USD'
      && i.securityType === 'STK' && ['XNAS', 'XNYS'].includes(i.exchange))) add('INSTRUMENT_UNSUPPORTED');
  if (source.provider !== 'IBKR') add('PROVIDER_UNSUPPORTED');
  if (source.feedStatus !== 'REALTIME') add('FEED_NOT_REALTIME');
  if (source.coverage === 'UNKNOWN') add('COVERAGE_UNVERIFIED');
  if (request.requiredCoverage === 'UNKNOWN'
      || request.requiredCoverage === 'CONSOLIDATED_VOLUME'
      || source.coverage !== request.requiredCoverage) add('COVERAGE_UNSUPPORTED');
  if (request.interval !== 'LIVE_PRICE') add('INTERVAL_UNSUPPORTED');
  if (quote.session !== 'REGULAR_OPEN') add('SESSION_INCOMPATIBLE');
  if (quote.marketStatus !== 'TRADING') add(quote.marketStatus === 'HALTED' ? 'MARKET_HALTED' : 'MARKET_STATUS_UNVERIFIED');

  const received = sourceTimestamp(source.receivedAt);
  if (received === null) add('RECEIPT_TIME_INVALID');
  else if (received > nowMs + 5000) add('RECEIPT_TIME_FUTURE');
  const prices = {}, times = [];
  const fieldChecks = fields.map(name => {
    const field = quote[name], value = price(field.value), observed = sourceTimestamp(field.observedAt);
    if (value === null) add('PRICE_INVALID', name);
    else prices[name] = value;
    if (field.unit !== 'USD_PER_SHARE') add('UNIT_SCALE_UNRESOLVED', name);
    const ageMs = observed === null ? null : nowMs - observed;
    if (observed === null) add('OBSERVATION_TIME_MISSING_OR_INVALID', name);
    else {
      times.push(observed);
      if (ageMs < -5000) add('OBSERVATION_TIME_FUTURE', name);
      if (ageMs > 60000) add('PRICE_STALE', name);
      if (received !== null && observed > received + 5000) add('SOURCE_AFTER_RECEIPT', name);
    }
    return {field: name, value: value === null ? null : field.value,
      observedAt: observed === null ? null : field.observedAt,
      ageSeconds: ageMs === null ? null : ageMs / 1000};
  });
  if (times.length === 3 && Math.max(...times) - Math.min(...times) > 10000) add('FIELD_TIME_SEPARATION');
  let spreadFraction = null, lastMidRatio = null;
  if (prices.bid && prices.ask) {
    if (prices.bid.gt(prices.ask)) add('QUOTE_CROSSED');
    else {
      const mid = prices.bid.plus(prices.ask).div(2);
      const spread = prices.ask.minus(prices.bid).div(mid);
      spreadFraction = spread.toString();
      if (spread.gt('0.05')) add('SPREAD_REVIEW_REQUIRED');
      if (prices.last) {
        const ratio = prices.last.div(mid);
        lastMidRatio = ratio.toString();
        if (ratio.lte('0.02') || ratio.gte('50')) add('UNIT_SCALE_UNRESOLVED');
        else if (ratio.minus(1).abs().gt('0.05')) add('QUOTE_CONFLICT');
      }
    }
  }
  return {
    validatorVersion: DIAGNOSTIC_VERSION, assessedAt: now.toISOString(),
    scope: 'MANUAL_DIAGNOSTIC_ONLY', sampleOutcome: findings.length ? 'HAZARDS_FOUND' : 'NO_HAZARDS_IN_SAMPLE',
    liveEligible: false, eodEligible: false, canRequestMarketData: false,
    integrationBlockers: [...INTEGRATION_BLOCKERS], findings, fieldChecks,
    calculations: {spreadFraction, lastMidRatio},
    policy: {maxAgeSeconds: 60, futureToleranceSeconds: 5, maxFieldSeparationSeconds: 10,
      maxSpreadFraction: '0.05', maxLastMidDeviationFraction: '0.05'},
  };
}
