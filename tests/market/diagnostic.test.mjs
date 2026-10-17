import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseQuote, sourceTimestamp, INTEGRATION_BLOCKERS} from '../../src/domain/market/diagnostic.mjs';
import {diagnosticSample} from '../../src/domain/market/sample.mjs';

const now = new Date('2026-10-14T15:00:30Z');
const sample = () => diagnosticSample('consistent', now);
function codes(input) { return diagnoseQuote(input, now).findings.map(f => f.code); }
function at(seconds) { return new Date(now.getTime() + seconds * 1000).toISOString(); }

test('consistent manual evidence can never qualify a market signal or provider request', () => {
  const input = sample(), original = JSON.stringify(input), result = diagnoseQuote(input, now);
  assert.equal(result.sampleOutcome, 'NO_HAZARDS_IN_SAMPLE');
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.integrationBlockers, INTEGRATION_BLOCKERS);
  assert.equal(result.liveEligible, false); assert.equal(result.eodEligible, false);
  assert.equal(result.canRequestMarketData, false);
  assert.equal(result.calculations.spreadFraction, '0.0002');
  assert.equal(result.calculations.lastMidRatio, '1');
  assert.equal(JSON.stringify(input), original, 'diagnostics must never change the supplied evidence');
});
test('the AAPL scale regression is quarantined without multiplication or replacement', () => {
  const input = diagnosticSample('scale', now), result = diagnoseQuote(input, now);
  assert.ok(result.findings.some(f => f.code === 'UNIT_SCALE_UNRESOLVED'));
  assert.equal(input.quote.last.value, '3.43'); assert.equal(result.fieldChecks[0].value, '3.43');
  assert.equal(result.liveEligible, false);
});
test('contract IDs, primary listing, symbol, currency and asset type must all agree', () => {
  for (const [field, value] of Object.entries({contractId: '1520593', symbol: 'JPM', exchange: 'XNYS', currency: 'EUR', securityType: 'OPT'})) {
    const input = sample(); input.instrument[field] = value;
    assert.ok(codes(input).includes('CONTRACT_MISMATCH'), field);
  }
  const input = sample(); input.instrument.currency = input.expectedInstrument.currency = 'EUR';
  assert.ok(codes(input).includes('INSTRUMENT_UNSUPPORTED'));
});
test('missing source times cannot be replaced by a recent receipt time', () => {
  const input = sample(); input.quote.bid.observedAt = null;
  const result = diagnoseQuote(input, now);
  assert.ok(result.findings.some(f => f.code === 'OBSERVATION_TIME_MISSING_OR_INVALID' && f.field === 'bid'));
  assert.equal(result.fieldChecks[1].ageSeconds, null);
});
test('strict timestamp parsing rejects epochs, impossible dates and ambiguous local time', () => {
  for (const value of [Date.now(), '1791986400000', '2026-02-30T10:00:00Z', '2026-13-01T10:00:00Z',
    '2026-01-00T10:00:00Z', '2026-10-14T24:00:00Z', '2026-10-14T15:00:60Z',
    '2026-10-14T15:00:00', '2026-10-14T15:00:00+14:01', '2026-10-14T15:00:00+02:61']) {
    assert.equal(sourceTimestamp(value), null, String(value));
  }
  assert.equal(sourceTimestamp('2026-10-14T18:00:30+03:00'), now.getTime());
  assert.notEqual(sourceTimestamp('2028-02-29T10:00:00Z'), null);
});
test('freshness is evaluated against the server clock with inclusive thresholds', () => {
  for (const seconds of [-60, 5]) {
    const input = sample(); for (const field of ['last', 'bid', 'ask']) input.quote[field].observedAt = at(seconds);
    assert.deepEqual(codes(input), [], 'boundary ' + seconds);
  }
  for (const [seconds, code] of [[-60.001, 'PRICE_STALE'], [5.001, 'OBSERVATION_TIME_FUTURE']]) {
    const input = sample(); input.quote.last.observedAt = at(seconds); assert.ok(codes(input).includes(code));
  }
  assert.throws(() => diagnoseQuote(sample(), new Date('invalid')), /DIAGNOSTIC_CLOCK_INVALID/);
});
test('receipt, source sequence and independent field separation all fail closed', () => {
  const input = sample(); input.source.receivedAt = at(-6); assert.ok(codes(input).includes('SOURCE_AFTER_RECEIPT'));
  input.source.receivedAt = at(5.001); assert.ok(codes(input).includes('RECEIPT_TIME_FUTURE'));
  input.source.receivedAt = null; assert.ok(codes(input).includes('RECEIPT_TIME_INVALID'));
  const separated = sample(); separated.quote.bid.observedAt = at(-10.001);
  assert.ok(codes(separated).includes('FIELD_TIME_SEPARATION'));
  separated.quote.bid.observedAt = at(-10); assert.deepEqual(codes(separated), []);
});
test('decimal prices reject binary numbers, negatives, infinities, exponents and scale guesses', () => {
  for (const value of ['0', '-1', 'NaN', 'Infinity', '1e2', ' 100', '01', '1.0000000000001', '1000000000001', null]) {
    const input = sample(); input.quote.last.value = value; assert.ok(codes(input).includes('PRICE_INVALID'), String(value));
  }
  const input = sample(); input.quote.last.value = 100;
  assert.throws(() => diagnoseQuote(input, now), /MARKET_INPUT_INVALID/);
  input.quote.last.value = '100'; input.quote.last.unit = 'USD_CENTS';
  assert.ok(codes(input).includes('UNIT_SCALE_UNRESOLVED'));
});
test('crossed, wide and conflicting quotes cannot pass the arithmetic checks', () => {
  const crossed = sample(); crossed.quote.bid.value = '101'; assert.ok(codes(crossed).includes('QUOTE_CROSSED'));
  const wide = sample(); wide.quote.bid.value = '90'; wide.quote.ask.value = '110';
  assert.ok(codes(wide).includes('SPREAD_REVIEW_REQUIRED'));
  const conflict = sample(); conflict.quote.last.value = '106'; assert.ok(codes(conflict).includes('QUOTE_CONFLICT'));
  conflict.quote.last.value = '105'; assert.deepEqual(codes(conflict), [], '5% is an inclusive starting threshold');
  for (const value of ['2', '5000']) { conflict.quote.last.value = value; assert.ok(codes(conflict).includes('UNIT_SCALE_UNRESOLVED')); }
});
test('delayed status, closed sessions, halts and unknown market state stay blocked', () => {
  const input = sample(); input.source.feedStatus = 'DELAYED'; assert.ok(codes(input).includes('FEED_NOT_REALTIME'));
  input.quote.session = 'EXTENDED'; assert.ok(codes(input).includes('SESSION_INCOMPATIBLE'));
  input.quote.marketStatus = 'HALTED'; assert.ok(codes(input).includes('MARKET_HALTED'));
  input.quote.marketStatus = 'CLOSE_ONLY'; assert.ok(codes(input).includes('MARKET_STATUS_UNVERIFIED'));
});
test('nonconsolidated quotes cannot prove NBBO, volume or finalized daily candles', () => {
  for (const coverage of ['CONSOLIDATED', 'CONSOLIDATED_VOLUME', 'UNKNOWN']) {
    const input = sample(); input.request.requiredCoverage = coverage;
    assert.ok(codes(input).includes('COVERAGE_UNSUPPORTED'));
  }
  const input = sample(); input.source.coverage = 'UNKNOWN'; assert.ok(codes(input).includes('COVERAGE_UNVERIFIED'));
  input.request.interval = 'REGULAR_SESSION_EOD'; assert.ok(codes(input).includes('INTERVAL_UNSUPPORTED'));
});
test('client-supplied trust, billing, server clocks, owner IDs and unknown keys are rejected', () => {
  for (const key of ['liveEligible', 'sourceVerified', 'billingVerified', 'ownerId', 'now', 'policy']) {
    const input = sample(); input[key] = true; assert.throws(() => diagnoseQuote(input, now), /MARKET_INPUT_INVALID/);
  }
  const input = sample(); input.source.verified = true;
  assert.throws(() => diagnoseQuote(input, now), /MARKET_INPUT_INVALID/);
  for (const value of [null, [], {}, Object.assign(sample(), {schemaVersion: 2})]) {
    assert.throws(() => diagnoseQuote(value, now), /MARKET_INPUT_INVALID/);
  }
});
test('source event claims and plausible identity never remove integration blockers', () => {
  const input = sample(); input.source.tool = 'official_live_connector'; input.source.eventId = 'plausible-but-unverified';
  const result = diagnoseQuote(input, now);
  assert.equal(result.sampleOutcome, 'NO_HAZARDS_IN_SAMPLE');
  assert.deepEqual(result.integrationBlockers, INTEGRATION_BLOCKERS);
  assert.ok(!JSON.stringify(result).includes(input.source.eventId), 'unnecessary source text must not be echoed');
});
