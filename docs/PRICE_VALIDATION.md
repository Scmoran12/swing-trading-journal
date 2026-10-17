# Price validation and live-data acceptance plan

Revision 2,13 October 2026. These are future implementation/test requirements, not a claim that prices have been fixed. Primary evidence is [LIVE_DATA_VERIFICATION.md](reviews/LIVE_DATA_VERIFICATION.md): AAPL and JPM tool results reported REALTIME; AAPL last/bid/ask scaling contradicted. The user's current fee screen reports US real-time nonconsolidated quotes fee-waived and totalUSD0; it does not name a consolidated feed or guarantee every request billing mode.

## Implemented diagnostic subset — 17 October 2026

v0.3 implements strict normalized quote diagnostics in `src/domain/market/diagnostic.mjs`, an owner-only `/research` screen and `POST /api/market-data/diagnose` (JSON, ≤16KiB, same-Origin/Host/session enforced, no retention). See PHASE3_DELIVERY for actual scope/tests. These are **manual input consistency checks**, not authoritative quality assessments. Source/cost/instrument/calendar/actions gates always remain blocked, even for a consistent example. No SQL evidence table, broker request, alert or market valuation is produced. Unknown/client-set trust flags are rejected. Thresholds below are the implemented fixed diagnostic starting policy, not proven market eligibility.

The input requires exactly `schemaVersion:1`, `expectedInstrument`, `instrument`, `source`, `quote`, `request`; nested allowlists match the synthetic examples in `src/domain/market/sample.mjs`. Missing field values/unit/timestamps are represented by null and become findings. Prices are positive decimal strings ≤1e12 with at most12 fractional places; no exponents/binary floats. Source times are valid RFC3339 offsets in2000–2099 with millisecond precision at most. Instrument identity includes contractId string, primary MIC XNAS/XNYS, symbol, USD, STK; comparison is exact and does not authenticate manually entered expected identity. Unknown schemas/extra fields reject the request.

The response separates sample hazards from unresolved integration blockers, returns unmodified valid prices/field times and server-clock ages, and always reports `liveEligible:false`, `eodEligible:false`, `canRequestMarketData:false`. Submitted-byte SHA-256 is not authenticity. Do not submit account IDs, tokens or full private tool transcripts. Future verified ingress must map raw units/time/MIC semantics through documented adapters and preserve exact original evidence separately.

## Typed observation contract

Keep immutable raw source envelope plus allowed normalized values: owner/job/request IDs, stable instrument/contract/exchange/currency, plugin/tool name and version if available, source tool event or transcript ID, request/receipt timestamps, timestamp/units for each last/bid/ask/bar field, `REALTIME/DELAYED/UNKNOWN`, regular/extended/session scope, nonconsolidated/consolidated/unknown coverage, completeness, halted/close-only flags, entitlement provenance, payload hash and validator version. Restrict raw payload retention to necessary nonsecret data; never log IBKR OAuth tokens/account identities. Capture exact tool output through a proven supported bridge rather than accepting a model's narrated market number. Authenticity and arithmetic validation are separate.

## Evaluation gates in order

| Gate | Check | Failure outcome |
| --- | --- | --- |
| Identity | Exact US primary instrument/contract, stock type, USD, approved plan instrument; no ticker substring or foreign duplicate | CONTRACT_MISMATCH; no setup signal |
| Provenance | Exact original tool event envelope, authorized source, bounded well-formed payload and job binding | SOURCE_UNVERIFIED; manual-source workflow only |
| Entitlement/cost | Existing authorized free request mode, no regulatory paid snapshot/new subscription; safe per-run request ceiling | ENTITLEMENT_UNVERIFIED or ENTITLEMENT_UNVERIFIED; bulk checks blocked |
| Units | Documented last/bid/ask/volume/bar units, finite positive price, decimal parsing and expected currency | UNIT_SCALE_UNRESOLVED |
| Source time | Independent source observation timestamps, valid epoch units, source time not in future beyond clock tolerance | OBSERVATION_TIME_MISSING/INVALID; a recent fetch time alone cannot pass |
| Freshness | Session/calendar-compatible observation age and the field actually used for the rule | PRICE_STALE; no live-ready signal |
| Price consistency | Bid≤ask when known compatible quotes; sensible configured spread; last-vs-mid/history discrepancy beyond policy | QUOTE_CONFLICT/REVIEW_REQUIRED; do not choose the convenient field |
| Session/market status | Relevant regular session open for live rule, no detected halt, no closing/previous-session quote reused as intraday | SESSION_INCOMPATIBLE (halted/close-only detail) |
| Coverage | Rule data requirements met by actual nonconsolidated feed/dated history | COVERAGE_UNSUPPORTED; no NBBO/consolidated volume inference |
| Rule interval | Live observation only for allowlisted live-price rules; finalized session bars for daily-close/indicator rules | INTERVAL_UNSUPPORTED/WAITING_DATA |
| Current plan/risk | Active approval not paused/expired/entered, current account revision, exact units and no unresolved corporate action | PLAN_CHANGED/RISK_BLOCKED/REVIEW_REQUIRED |

Proposed initial freshness policy for liquid stocks: field age≤60seconds, future clock tolerance≤5seconds, required-fields timestamp separation≤10seconds. These are conservative starting values to benchmark; market illiquidity/old last trades fail safely rather than fabricating an update. Bid/ask timestamps missing from the observed plugin payload are a present blocker for bid/ask-based live triggers unless documented source-time semantics or a new exposed source timestamp is proven. Do not use HTTP receipt time to invent bid/ask age. Last may legitimately differ from current bid/ask because trades/quotes are asynchronous; define a tunable discrepancy band using documented tick size/spread and timestamp separation. Any approximately100× disagreement is always quarantined. Do not equate these proposed thresholds with a guaranteed executable price or broker fill.

## Resolve the observed AAPL defect before live automation

1. Use a current liquid-stock observation during a regular session, read-only. Resolve primary listing and log raw tool envelope/field timestamps with no account identifiers.
2. Compare the plugin's exact last/bid/ask units with documented provider serialization. Check compatible timestamped IBKR UI/authorized history values; a screenshot is human evidence, not an automated replacement feed. Do not fetch a new paid quote service.
3. Identify whether the error originates in the provider, connector or normalization layer. If a documented conversion exists, apply it only in a versioned source/field-specific adapter and retain raw/normalized values. Otherwise leave it blocked, request provider clarification and support journal/research without live signals.
4. Require repeatable AAPL and NYSE/Nasdaq control-symbol observations with consistent units/timestamps, plus known bad synthetic fixtures rejected. One good quote is not a systemic fix.
5. Verify free-mode semantics for bulk scheduled plugin calls; displayed snapshot counters refresh nightly. Compare before/after the actual billing window without assuming tool name 'snapshot' denotes a chargeable regulatory snapshot. Any paid-only mode remains disabled.

No rule may multiply suspicious prices by100 merely to make them agree. A model explanation cannot override a failed gate. Keep a visible blocked reason and emit at most a deduplicated operational warning, not an entry recommendation.

## Live, EOD and nonconsolidated policy

`LIVE_ENTRY_READY` is an advisory review of an approved live-compatible condition against validated fresh evidence; actual execution stays manual and the broker price must be checked again. `EOD_SETUP_REVIEW` means completed-session conditions matched, review for a future session. At22:40 before close, an intraday price is available only if validated; that price cannot satisfy a rule specifically requiring today's closing candle. AFTER_CLOSE may await completed history publication, even with a live quote connection.

Free nonconsolidated data reflects some trading venues. Never describe its best bid/ask as full-market NBBO or compute consolidated market-volume breakouts from partial counts. Technical indicators need compatible historical OHLCV, adjustment and session semantics. IBKR history entitlement and corporate-action details must pass separate source tests; unavailable facts stay null. Screens/alerts identify source, session, age, field basis and coverage. AI discovery operates on a validated bounded universe, not an assumed free market-wide screener.

## Test fixtures and acceptance

Use exact synthetic golden cases for last3.43/bid342.98/ask343.01 (UNIT_SCALE_UNRESOLVED); stale trade120s; missing bid timestamp; future timestamp; invalid epoch milliseconds parsed as seconds; reversed/crossed quotes; negative/NaN price; wrong listing; delayed flag; halted quote; nonconsolidated volume requested for full-volume rule; pre-close quote used for daily close; expired approval; account revision race. Independent tests assert blocked evidence creates no live/EOD signal/outbox entry recommendation.

Live qualification requires validated raw ingress, unit diagnosis, supported coverage/timestamp semantics, a repeated regular-session control run, delayed/stale/conflict failures, and the unattended22:40/after-close test. Track blocked/pass reasons and source versions in DB, not an LLM's confidence. These gates are UNRUN; original AAPL discrepancy remains unresolved.
