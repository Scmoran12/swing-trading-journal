# Local monitoring, scheduling and recovery — revision 2

Revision2 with v0.5 inactive implementation,17 October2026. No scheduled/native/OS task or worker has been created. The implemented owner-only /monitoring screen stores manual rehearsal dates/two-probe times and reconciles blocked/expired state on explicit owner action. It never fetches prices, invokes Codex, evaluates market conditions, emits signals/inbox or sends notices. Full automatic architecture below remains proposed; see PHASE5_DELIVERY/PHASE5_WINDOWS and VALIDATION_STATUS for actual scope.

## Current inactive implementation

Migration0005 stores owner-scoped monitoring_scenarios, monitoring_rehearsal_runs/events/commands. Forced RLS and bounded commands preserve owner/idempotency/version boundaries; no direct runtime mutation. GET/POST /api/monitoring supports PREVIEW/SAVE_SCENARIO/RECONCILE/CANCEL_RUN only. Manual dates cannot be marked verified and no ACTIVATE action exists. JavaScript preview and PostgreSQL compute independent UTC instants using the same IANA zone contract; explicit goldens test them separately.

Manual OPEN scenarios create both JERUSALEM_2240 and declared close+15min probes; explicit CLOSED dates have none. Corrections append immutable versions and supersede old pending/blocked runs. Unknown dates have no inferred weekday schedule. Reconciliation samples the DB clock once: upcoming remains PENDING, due before the five-minute rehearsal deadline becomes BLOCKED_GATES, at/after deadline becomes EXPIRED_SUPPRESSED. Repeated unchanged events deduplicate; cancellation is revision checked. Terminal/current timing are distinct and shown as of the server assessment. Even consistent/manual scenarios always retain calendar/billing/raw-source/price/native/usage/receipt blockers; automatic monitoring, data, AI and notification capabilities are false.

These are persisted rehearsals, not an activated leased dispatcher. There are no worker claims/heartbeats/native execution timestamps or real data evaluations to report. Recovery fixtures move only disposable synthetic DB times, not the user's clock or OS. Later automatic integration must implement/test all source, dispatch, freshness, approved-rule, lease/fencing/outbox and physical receipt requirements below. The fixed rehearsal window does not approve a production catch-up/retry policy.

## Exchange session and time model

Use versioned NYSE/Nasdaq cash-equity calendars, UTC instants and IANA zones America/New_York/Asia/Jerusalem. US calendar date D identifies the trading session. Never implement weekday-only checks or fixed UTC offsets. Maintain vetted official calendar fixtures, update future years and reconcile unusual closures; a calendar gap blocks signals. Regular close is16:00 Eastern, or the published13:00 early close, rather than end of after-hours. [Official calendar](https://www.nyse.com/trade/hours-calendars).

For eligible D record two independent run identities:

- `JERUSALEM_2240`: D22:40 Asia/Jerusalem converted to UTC.
- `AFTER_CLOSE`: regular-session official close(D)+15minutes, an initial completed-data probe rather than guaranteed history publication.

Both runs exist even when AFTER_CLOSE occurs earlier than22:40. A calendar having no eligible session is a skip; do not require market currently open for AFTER_CLOSE. Live price checks require open applicable session; a completed-session review deliberately happens after it closes. Store expected/due/actual start times separately and report late runs honestly.

| Example2026 date | Regular close in Jerusalem |22:40 interpretation |
| --- | --- | --- |
|9 March |22:00 |After close during DST mismatch |
|27 March /13 October |23:00 |Before close; only compatible live rules can evaluate |
|26 October |22:00 |After close during DST mismatch |
|2 November |23:00 |Before close |
|27 November, early close |20:00 |Later than after-close probe |

Conversions were independently calculated with IANA zoneinfo in the original planning review; the official calendar supplies early-close dates. Final code must test both DST mismatch windows, holidays, early-close ordering and year changes. Timestamps in UI include source session and Jerusalem display time.

## Native Codex and local worker responsibility

1. Local worker generates durable due jobs from the calendar and polls cheaply while running. OS startup/supervisor keeps database/server/worker healthy after login and handles restart, without buying a scheduler service.
2. Native Codex handles its authorized IBKR plugin and AI. A supported native task must read due jobs through the local bridge and capture exact market tool event evidence. Next.js/local worker cannot assume it owns native plugins or can launch a desktop turn through an undocumented API. G0-L1/L4 must prove that path and compatible schedules.
3. Native scheduled tasks at the required independent times are the preferred wake mechanism when supported. One task/cadence is not assumed to handle variable early closes/DST perfectly. Respect documented scheduling/frequency limits; do not bypass them with high-frequency tasks or synthetic GUI clicks. Gate0 may choose a supported task pattern, but any inability to cover both exact reasons remains a blocker. Do not silently replace22:40 with hourly monitoring.
4. The durable local worker claims leases, validates received evidence, computes price/risk/rules, writes per-plan evaluations and commits notification intent. Heavy CPU can be chunked for responsiveness; no Supabase Edge duration/CPU limit exists in this revised local design.
5. Native Codex tasks use included plan allowance only. A missing connection, required user approval, expired auth, unavailable usage or suspended task produces AUTH_REQUIRED, CONNECTION_REQUIRED, APPROVAL_REQUIRED or USAGE_LIMIT_REACHED, preserves journal service, and requests the needed user action. No paid API, automatic credits, private-token copying or alternative data purchase.
6. If bridge/raw-result capture/native dispatch cannot be proven, use a user-triggered native workflow and explicit reviewed source import for research. Fully automated monitoring remains BLOCKED; manual results are not labeled scheduled successes.

[Native project scheduled-task prerequisites and plugins](https://developers.openai.com/codex/app/automations), [Codex plan usage](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Jobs, idempotency and rate limits

Use unique `(owner, exchange_session, schedule_kind)` due keys, attempts/leases with fencing token, input/approval/account revision, available-at, deadline, progress, raw evidence IDs, errors and result. Claim under short transactions/skip-locked semantics; stale lease completion cannot overwrite a newer attempt. Idempotent bridge submissions and completion keys survive response-cache cleanup. Exact schedule records are never overwritten by retry timestamps.

IBKR plugin throughput/history/universe caps are unknown until tested; do not transplant Massive's five-per-minute limit. Initial proposal: one market capture at a time, bounded watchlist/shortlist, shared account request budget and capped retries; benchmark and document actual supported limits. Retry transient network errors with jitter/Retry-After; authentication, billing-mode, price-unit and unsupported-source errors are blocked, not aggressive retries. Validate and evaluate each instrument as its exact source capture arrives rather than waiting for a complete30-symbol batch to age the earliest quote. Recheck observation age before signal commit and notification send; an expired live result is suppressed or freshly reevaluated. Preserve completed independent symbols as partial results; one invalid quote does not fabricate a total successful run.

Catch-up window is explicit. On sleep/reboot/network recovery mark missed due work; request new evidence for still-valid live conditions, suppress old entry alerts, and allow dated EOD review only for completed expected sessions. After reauthentication resume safe outstanding work, never repeat an already finalized AI task or purchase. Exactly-once model usage/physical notification delivery is not promised after an ambiguous crash; idempotent result commits and capped retries control damage.

## Data selection and evaluation

Read exact active approvals and watchlist eligibility. Capture approved condition interval, policy/account revision, instrument/corporate-action state and requested data capabilities. Data comes from the user's existing authorized IBKR plugin; observed free feed is NON_CONSOLIDATED. Original source payload, raw values and source timestamps are pinned before normalization. A fresh retrieval or REALTIME flag cannot cure unit conflicts, missing timestamps or incompatible volume coverage.

**At22:40:** when the regular session is still open, a passing live source can support an allowlisted last-price setup review. All [PRICE_VALIDATION](PRICE_VALIDATION.md) gates must pass. AAPL scale conflict and missing bid/ask observation timestamps remain blockers for dependent fields. Today's finalized daily candle is not available yet, so daily-close predicates stay WAITING_DATA even if a live price exists. If the session already closed due DST/early close, run as the appropriate completed-session review; no fresh intraday execution claim.

**After close:** obtain validated completed regular-session history only if existing plugin rights/capabilities provide it. Verify expected session, finality, OHLCV coverage and adjustment basis; a current after-hours quote cannot substitute. Retry publication delays with a bounded proposed15/30/60/120minute local policy and later next-morning review, subject to supported native dispatch and subscription usage. If unsupported, store WAITING_DATA/HISTORY_UNAVAILABLE and explain missing coverage. No EOD-provider subscription is silently introduced.

**Weekly review:** typically after the final week's completed session has published (weekend convenient). Review all recorded executions through explicit cutoff and latest supported completed prices/history. Analyze only available validated universe/historical bars; report coverage and five-or-fewer new candidates. Existing free quote access does not prove affordable/exhaustive market-wide historical screening. Screenshot timestamps are extraction context, not live prices.

## Signals and notifications

V1 may emit `LIVE_ENTRY_READY` only after a separately passed live evidence/rule gate, or `EOD_SETUP_REVIEW` from completed history. Both are advisory manual review, not broker orders or guaranteed fills. Keep source, coverage, observation age, rule interval, plan version and risk snapshot in each result. Partial feed best bid/ask is not NBBO; partial counts cannot trigger consolidated-volume rules. Invalidations precede entries; unknown invalidation/quality/risk suppresses setup readiness.

Before committing, recheck approval/watchlist status and account revision under appropriate locks: draft edits retain the old visible approval, reapproval/pause/expiry/first BUY retires obsolete eligibility. Signals/outbox are unique by owner/approval/session/condition type; repeated true conditions and both schedules using one evidence snapshot yield one logical alert. A live-capable condition may be evaluated after repeated events without creating repeated unchanged notices. Corrected provider data appends revised evidence and an explicit correction notice when material; it never silently rewrites a previous decision.

Price failure produces one deduplicated operational warning and inbox record, never an entry signal. A notification worker checks current signal expiry/validity and channel permission, sends through native/OS desktop path, tracks accepted/displayed/read separately where measurable, and preserves inbox on failure. Desktop is required first; optional iPhone Web Push follows separate zero-fee HTTPS/device gate. No unsolicited email or paid notification channel is included.

## Always-on local prerequisites and recovery

Website tabs can be closed. Computer must stay awake, internet connected, OS user session available, native Codex + local DB/server/worker running, plugins connected and included usage available. Test locked-screen behavior on the actual OS; power alone is insufficient. Local processes cannot notify from a powered-off host; show missed work after restart, avoid invented remote-uptime guarantees and document optional existing independent check without purchasing a service.

Health screen: next due time, expected/actual last check, data freshness/coverage, last successful complete/partial run, blocked reasons, oldest job, quota/connection status, delivery outcomes, disk/backup status. Worker heartbeat absent while app active triggers a local operational warning; total host failure is detected only on recovery or by an independently available observer. Cleanup completed jobs/logs on bounded policies while retaining immutable trading and decision evidence. Provide manual recheck/retry with audit and normal data guards.

## Release proof

G0-L1 raw bridge/native dispatch, G0-L2 zero-fee connector mode/history coverage, G0-L3 valid price units/timestamps, G0-L4 actual two closed page scheduled runs and failure recovery, G0-L5 desktop delivery must all pass before automatic live review is enabled. At least a representative regular-session run plus simulated DST/early-close/holiday/stale/conflict/quota/offline cases is required; proposed five-session soak before reliance. iPhone remote/push is separately conditional. All operational integration checks remain UNRUN. See [VALIDATION_STATUS.md](VALIDATION_STATUS.md).
