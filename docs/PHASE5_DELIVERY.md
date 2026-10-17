# Phase 5 — inactive scheduling and recovery rehearsal

17 October 2026. The user requested the next phase. v0.5 implements the independent schedule/recovery foundation with an owner-only monitoring page. **Automatic market monitoring is not active or complete.** Unverified billing, raw source, prices, native dispatch, included-only controls and human notification receipt still prevent enabling it. No new Windows acceptance was supplied after the manual-v0.2 report.

## Delivered behavior

- `/monitoring` shows the missing evidence and states explicitly that no automatic check has run. The server's assessment time is displayed; refreshing is manual. There is no fabricated worker heartbeat, successful market check or next guaranteed execution.
- Owners may save a **manual rehearsal** for a specific US session date, declared OPEN with a hypothetical13:00/16:00 New York regular close, or CLOSED with no close. A source note and rehearsal acknowledgment are required. The note is unverified text, not calendar authentication; no URL is fetched. Unknown dates have no scenario, with no weekday-only inference. Even a hypothetical Saturday OPEN input cannot enable monitoring.
- An OPEN scenario creates two distinct persisted runs: `JERUSALEM_2240` at session date22:40 Asia/Jerusalem and `AFTER_CLOSE` at declared New York close+15minutes. IANA timezone conversion handles US/Israel DST differences; both identities remain even when AFTER_CLOSE comes first. The JavaScript preview and PostgreSQL schedule have independent explicit UTC goldens.
- Scenario edits create an immutable new version, retain old evidence, and supersede pending/blocked old runs. An explicit CLOSED scenario creates no runs. Identical resaves/idempotent retries cannot duplicate probes. Data survives fresh DB connections; no actual host restart or recovery was tested.
- **Manual reconciliation** samples the DB clock once. Upcoming runs stay pending; due runs inside a fixed five-minute rehearsal window become BLOCKED_GATES; runs at/after their deadline become EXPIRED_SUPPRESSED. Repeated reconciliations do not duplicate unchanged events. There is no entry-alert replay, market evaluation, financial mutation, AI invocation, inbox or desktop message. Cancellation is owner/revision checked; concurrent changes cannot both commit on one revision.
- The five-minute window is a fixed rehearsal policy, not a proven production SLA or approved EOD retry strategy. No clock can be supplied by the browser, and clients cannot set trust/activation/deadline flags.

## Implementation and limits

New forward migration `0005_monitoring_rehearsals.sql` adds scenarios, runs, events and idempotent command records with forced owner RLS, composite ownership FKs, immutable schedule timestamps and a bounded security-definer command. Runtime cannot directly edit/delete these tables. Existing migrations0001–0004 and dependency versions are unchanged. Scenario versions are capped at500 per owner; the page displays up to30 recent versions, reads up to500 scenarios/1000 runs/200 events. No automatic history cleanup or archival UI is added.

Owner-session `GET/POST /api/monitoring` uses exact Host/Origin controls, bounded JSON≤8KiB and no-store responses. Actions are PREVIEW, SAVE_SCENARIO, RECONCILE and CANCEL_RUN only. There is no ACTIVATE action, scheduler/automation registration, polling service, OS task, generic worker execution, native bridge credential, quote adapter or signal/outbox writer. The existing health capability remains NOT_ACTIVATED. The endpoint is not a broker connection or native task dispatcher.

This is not the complete Phase 5 deliverable: production calendar ingestion, leased/fenced native work, evidence acquisition, approved LIVE/EOD rules, notification outbox, actual sleeping/closed-page dispatch, quotas and OS supervision remain blocked or unimplemented. Pure rehearsal state changes do not prove any of those capabilities. Existing Plus is unused by local schedule arithmetic/storage; no inference/API/paid-data fallback exists.

## Actual verification

Cloud production build (including TypeScript) passed. **43 unit/security/risk/market/AI/schedule tests**, PostgreSQL **8 foundation +19 lifecycle +9 monitoring +12 manual review** cases, and **12 production HTTP** cases passed. Counts include Node parent tests where reported. Four independently specified SQL/JavaScript UTC comparisons plus eight unit goldens cover both DST mismatch windows, early closes and year changes; declared closures and invalid inputs are exercised separately.

The real PostgreSQL upgrade starts with populated v0.4 financial/review records, adds only0005, and proves those records unchanged. Tests verify fresh connections, two-probe deduplication, appended scenario corrections, blocked/expired state transitions, owner isolation, concurrent cancellation, direct-write denial and unchanged notifications/finances. Recovery tests move a disposable synthetic run around the DB clock; they are **not actual Windows sleep/native recovery evidence**. Production HTTP verifies authenticated preview/save/read/cancel, dark/RTL page rendering, anonymous/cross-Origin/oversized-input rejection and always-false market/AI/notification capabilities.

All records/configuration were synthetic and isolated; temporary database/server resources were stopped/removed. No new native model/provider request, recurring monitoring, OS notification or backup work. Windows visual/keyboard/device acceptance and real operational gates remain unrun here. No fresh dependency audit is claimed.

## Handoff

Use [PHASE5_WINDOWS.md](PHASE5_WINDOWS.md). The cumulative source update supports known v0.2/v0.3/v0.4 predecessor hashes and includes prior diagnostics/reviews; preserve newer Windows native bridge/tests/evidence and private setup. Never rewrite delivered migrations or run a destructive schema downgrade. Existing JSON journal export excludes review and monitoring history/screenshot files and is not a full backup. Backups/64GB drive remain explicitly deferred; this is not a recoverable-production release.
