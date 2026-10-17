# Phase 0 feasibility — first execution report

14 October 2026. **PARTIAL: cloud/offline pass completed; Windows operating-model gates remain pending.** The user requested starting the first necessary phase, then confirmed Windows and a 64 GB drive. Existing subscription is ChatGPT **Plus**, not Pro. This authorizes Phase 0 diagnostics/prototypes; it does not buy services, approve brokerage actions or turn later phases into completed work.

## Findings and evidence

| Check | Actual result | Limit |
| --- | --- | --- |
| Execution environment | Connected managed cloud, Debian 13 Linux x86_64; Node v24.19.0, npm 11.9.0, Python 3.12.14, Codex CLI 0.159.2 | Not the user's Windows computer. No target OS state can be inferred. |
| Local tools | `psql`, `pg_dump`, `notify-send`, `osascript`, `powershell`, `pwsh` unavailable here; both IANA zones available | PostgreSQL presence on Windows unknown; no physical notification test possible here. |
| Cloud connectivity | Restricted network, package/source hosts allowed; no configured VPN/TCP destinations in inspected policy; environment reports connected | No route to the Windows host established. No network configuration was changed. |
| IBKR connection | Two successful read-only `search_contracts` calls for AAPL and JPM | No private holdings/account data requested; no fresh quote/history request or charge test. |
| Instrument identity | Exact AAPL/US/NASDAQ/STK resolves to 265598; exact JPM/US/NYSE/STK resolves to 1520593 | Ticker-only matching would include foreign listings and related instruments. Currency not supplied by these listing results. |
| Tool availability | Snapshot and OHLCV/history tools exposed; history schema includes corporate-action option | Availability/schema does not establish entitlement, field correctness, complete history, source timestamps or cost. |
| Raw response preservation | Exact returned listing envelopes saved through tool orchestration under ignored `reports/phase0/` | Local file hashes prove integrity of captured serialization only. Not authenticated native bridge/job/source-event ingestion. |
| Supported integration research | Official MCP docs describe local STDIO/Streamable HTTP and host-shared configuration; scheduled-task docs describe local projects with machine/app running | Documented support is not an observed Windows integration. Web/cloud tasks cannot directly work in a local Windows folder. No model inference subprocess or native task created. |
| IBKR billing research | Public pricing distinguishes complimentary nonconsolidated streaming and chargeable snapshots | Exposed snapshot schema has no free-mode selector/billing guarantee. Prior user $0 fee screen is limited evidence. Automatic quote/history acquisition remains blocked. |
| Calendar prototype | Explicit UTC expectations pass DST mismatch windows, regular/early-close order, holidays, year change and missing dates | Reviewed sample dates only, no production calendar feed or scheduled dispatch. |
| Price prototype | Known last3.43/bid342.98/ask343.01 regression blocked without mutation; stale/future/missing/naive/epoch time, invalid/crossed prices, interval and coverage cases rejected | Synthetic normalized fixture, not a fresh quote or a source-unit repair. Every sample returns `live_eligible: false`. |
| Target/backup | USER_REPORTED Windows and 64 GB drive | Physical separation, capacity/free space, encryption and restore pending. No drive accessed/formatted. |
| Plus allowance | USER_REPORTED subscription tier recorded | Remaining capacity, purchased credit balance and native no-overage controls unavailable here; no monthly sufficiency claim. |

## Runnable deliverables and verification

No third-party packages installed; no API key, database, subscription, paid call mode, notification or automation created. New runnable artifacts:

- `scripts/phase0/preflight.ps1`: Windows read-only inventory. **UNRUN on Windows**; PowerShell is not installed in this cloud environment.
- `scripts/phase0/preflight.py`: portable developer inventory; run successfully with `--environment cloud`.
- `scripts/phase0/probes.py` and reviewed `calendar_samples.json`: offline sample-only diagnostics.
- `tests/phase0/test_probes.py`: **11 tests passed**, with subcases for the sample dates and invalid prices. Actual command: `python3 -m unittest discover -s tests/phase0 -v`.
- `python3 scripts/phase0/probes.py schedule --date 2026-11-27`: AFTER_CLOSE 18:15 UTC / 20:15 Jerusalem and JERUSALEM_2240 20:40 UTC / 22:40 Jerusalem, separate ordered identities, `creates_jobs: false`.
- `python3 scripts/phase0/probes.py bad-price`: `UNIT_SCALE_UNRESOLVED`, `live_eligible: false`.

Captured artifacts (ignored, potentially ephemeral across cloud replacement):

| Path under `reports/phase0/` | SHA-256 |
| --- | --- |
| `aapl-contract-tool-result.json` | `5020e9f5f91b20117c12035041b980bd3da439868785ac3eb11163275ff98fe5` |
| `jpm-contract-tool-result.json` | `418294bba84e7b4d7d56ac48da38f68d01f84b14c5e65ee2d92aa228a4e9806e` |

The lookup values above are observations from the current authorized tool call, not model-created trade records. Raw envelopes are unnecessary for normal Git history; the observation summary and test fixtures are versionable. No original provider source-event ID was exposed/captured by this pass.

## Gate decisions and next work

| Gate | Status after this pass | Next action |
| --- | --- | --- |
| G0-L1 native bridge/allowance | PARTIAL_RESEARCH; TARGET_UNRUN | Windows native smoke with narrow read-only tool, original tool-event transfer and actual account spending controls. |
| G0-L2 IBKR billing/coverage | PARTIAL_OBSERVED; BILLING_BLOCKED | Resolve exact connector request charging before price/history requests; then bounded coverage proof. |
| G0-L3 price truth | FAILED_PRIOR_OBSERVATION; OFFLINE_REGRESSION_PASSED | Diagnose original scale/timestamps with documented source semantics and compatible authorized evidence after billing gate. |
| G0-L4 scheduling/runtime | OFFLINE_TIME_TESTS_PASSED; NATIVE_UNRUN | Test actual Windows/local-project dispatch for both reasons, quota/auth/offline/sleep recovery. |
| G0-L5 desktop | TARGET_UNRUN | Actual labeled Windows notice with tabs closed, visible receipt and denied-permission behavior. |
| G0-L6 phone | CONDITIONAL_UNRUN | Later private HTTPS/device/network feasibility; no cloud/tunnel purchase. |
| G0 host/backup | USER_REPORTED; TARGET_UNRUN | Run Windows inventory; confirm separate 64 GB medium and sample encrypted restore. |

The automatic workflow cannot be declared feasible yet. The manual journal remains architecturally independent of these live/AI integrations. This execution stops at the authorized Phase 0 boundary, with [Windows handoff](../PHASE0_WINDOWS.md) ready for local execution; it does not mark later phases started or any native gate passed.

## Official sources consulted

- [MCP transports and local host configuration](https://developers.openai.com/codex/mcp).
- [Native scheduled tasks and local-project prerequisites](https://developers.openai.com/codex/app/automations).
- [IBKR complimentary vs chargeable market data](https://www.interactivebrokers.com/en/pricing/market-data-pricing.php).
- [NYSE holiday/regular/early-close calendar](https://www.nyse.com/trade/hours-calendars); 27 November and 24 December 2026 close at 13:00 Eastern, core regular session ends 16:00 Eastern.
