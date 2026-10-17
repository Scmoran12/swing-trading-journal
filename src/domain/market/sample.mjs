// Entirely fictional samples. No provider request or captured market evidence.
export function diagnosticSample(kind = 'consistent', now = new Date()) {
  const instrument = {symbol: 'AAPL', contractId: '265598', exchange: 'XNAS', currency: 'USD', securityType: 'STK'};
  const time = now.toISOString();
  const values = kind === 'scale' ? ['3.43', '342.98', '343.01'] : ['100', '99.99', '100.01'];
  return {
    schemaVersion: 1, expectedInstrument: {...instrument}, instrument,
    source: {provider: 'IBKR', tool: 'SYNTHETIC_SAMPLE', eventId: 'NOT_A_REAL_TOOL_EVENT',
      receivedAt: time, feedStatus: 'REALTIME', coverage: 'NON_CONSOLIDATED'},
    quote: {...Object.fromEntries(['last', 'bid', 'ask'].map((name, i) => [name, {
      value: values[i], unit: 'USD_PER_SHARE', observedAt: time,
    }])), session: 'REGULAR_OPEN', marketStatus: 'TRADING'},
    request: {interval: 'LIVE_PRICE', requiredCoverage: 'NON_CONSOLIDATED'},
  };
}
