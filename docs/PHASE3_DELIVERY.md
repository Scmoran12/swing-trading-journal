# Phase 3 — market diagnostics, first delivery

17 October 2026. The user requested continuing after the Windows setup. The detailed Windows report confirms automated acceptance as **user-reported**; interactive browser acceptance and personal setup remain pending. This delivery implements the independent price-diagnostic slice of Phase 3, **not the complete market-data phase**.

## Implemented

- An owner-authenticated Hebrew/RTL/dark `/research` screen replaces the research placeholder. It accepts a small manually entered normalized observation and offers clearly fictional consistent/scale-conflict examples. Findings identify the affected field, source timestamp, age and uncorrected decimal price.
- A strict provider-neutral version-1 quote contract: expected and supplied exact stock identity, contract ID, MIC exchange, currency, tool/event claims, receipt time, per-field last/bid/ask values, units/timestamps, feed/coverage/session/status and requested interval. IBKR primary-listing names must be explicitly mapped to `XNAS` or `XNYS` by a future documented adapter; no substring matching.
- Decimal arithmetic detects crossed/wide quotes, last/mid disagreement and extreme scale conflicts. Prices remain strings; no inferred cents, binary financial math, currency conversion or heuristic 100× correction. The original AAPL discrepancy is a regression fixture, not new provider evidence.
- Source times require explicit RFC3339 offsets and valid calendar dates. Receipt time cannot fill a missing field time. Server-clock checks use age ≤60 seconds, future tolerance ≤5 seconds and field separation ≤10 seconds. Quotes cannot prove finalized daily bars or consolidated market volume.
- `POST /api/market-data/diagnose` uses existing owner/session, exact Host and same-Origin protections, JSON-only bodies ≤16 KiB and strict nested allowlists. Errors do not echo input. No URLs are fetched; there is no broker/AI invocation or financial command path.
- Diagnostics are **transient**: no new database table/migration, raw-file storage, inbox message or ledger mutation. SHA-256 describes only submitted bytes. Client-submitted authenticity/billing/policy flags are rejected. All results retain source, entitlement, instrument, session-calendar and corporate-action integration blockers; `liveEligible`, `eodEligible` and `canRequestMarketData` are always false.

## Actual cloud verification

- Production build and TypeScript passed.
- **23 unit/security/risk/market tests passed**, including 13 new market tests.
- **10 production HTTP tests passed**, including real authentication and the new diagnostic route's anonymous rejection, same-Origin enforcement, body/type bounds, false-trust rejection, exact submitted-byte hash, dark/RTL research HTML and unchanged journal state.
- HTTP tests used a new disposable loopback PostgreSQL cluster under `/tmp`, removed afterward. No real records/credentials or market requests used. No database migration changed; earlier PostgreSQL suites were not rerun for this schema-free slice.

The sandbox initially prevented child-worker execution; the genuine build/test runs succeeded with the required execution permissions. Merely seeing a file-level test wrapper was not counted as individual test proof. Browser visual/keyboard tests and the new screen's actual Windows acceptance remain unrun here. Dependency versions are unchanged from v0.2; the earlier audit result is historical, not a fresh audit.

## Still blocked or later in Phase 3

Verified raw tool ingress, free quote/history request billing, documented AAPL source-unit reconciliation, independent source field times, authoritative calendar/market-status/corporate-action facts, licensed historical bars/indicators/charts, bounded screening universe, private evidence persistence/cache and market-backed valuations. A manually pasted event ID/hash or consistent sample cannot resolve those gates. The website does not invoke installed Codex plugins directly.

No recurring monitoring, automatic AI, desktop notification activation, broker action, paid fallback, public exposure or backup work. Follow [PHASE3_WINDOWS.md](PHASE3_WINDOWS.md) to merge the incremental update while preserving the newer Windows bridge/tests/evidence. The manual journal remains usable separately after its browser acceptance.
