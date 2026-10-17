# Phase 4 — durable manual Codex reviews

17 October 2026. The user authorized continuing. This delivery implements the independent manual plan-review workflow in Phase 4. **Full market-backed intelligence and unattended native integration remain blocked.** The latest actual Windows report still concerns manual v0.2 automated checks; v0.3/v0.4 merge/browser acceptance has not been reported here. Personal setup remains pending according to that report.

## What works

The new owner-only **Codex reviews** page (`/reviews`) stores a request for a current manual plan. After reviewing the sharing scope, the owner can open a bounded text packet and copy it into an existing native Codex chat. The site never sends that packet externally, starts Codex, acquires market data or invokes a model API. A packet being saved/exported is not evidence that any model processed it.

Packets contain only the pinned manual plan: symbol/exchange/sector, entry/stop/target, fee/slippage assumptions, expiry, thesis/invalidation and pseudonymous plan/job/version references. Cash balances, trades, emotions, screenshots, account identifiers and credentials are excluded. The owner must inspect the text for private information embedded in their own thesis before sharing. No image-sharing consent is inferred.

Requests persist in PostgreSQL and survive fresh application connections. They support manual usage/auth/bridge pauses, resume/cancel, idempotent commands, bounded queue (eight pending; 500 retained per owner), original-input display and append-only event history. Pauses are owner-reported states, not detected subscription/auth conditions. No automatic retry, scheduler, hidden worker or credit fallback exists.

The owner pastes the response back and acknowledges reading it. Strict server validation checks schema, job ID/input hash, allowlisted categories and references, and text/count bounds. Unknown order/approval/price/quantity/live-confidence fields reject. Findings are **unverified imported commentary**, even when structurally valid. Model labels are self-reported; a matching hash does not authenticate a model or prove factual truth. Prompts explicitly treat embedded plan instructions as untrusted data, but structural validation cannot eliminate semantic hallucination. Human review remains necessary.

Plan, policy and journal-command revisions are pinned atomically under the existing owner lock. Cash/trade/plan changes, expiry or archival block packet export and mark late responses stale. Completed reviews also show staleness after later changes. Notification-read acknowledgments alone do not invalidate a packet. Responses never create/edit/approve a plan, change a stop, record a fill or modify cash. All ordinary journal actions remain separate.

## Technical delivery

- Forward-only `0004_manual_codex_reviews.sql`: owner-scoped jobs, command deduplication and events; forced RLS, owner-safe FKs, bounded security-definer command; runtime has no direct job mutation or new financial-table privileges. Existing migrations 0001–0003 are unchanged.
- `GET/POST /api/reviews` and `GET /api/reviews/{id}/packet`: existing server-checked owner session, exact Host and mutation Origin controls; JSON command bodies ≤16KiB, safe error codes and no-store output. The native workflow has no direct bridge credential or access to these owner-session routes.
- `/reviews`: Hebrew/dark/RTL, explicit sharing preview/acknowledgment, manual packet/result transfer, pauses, original-input/result/history display and stale state. Up to100 latest jobs/200 latest events are shown; this is a documented bounded view.
- Existing dependencies unchanged; application/lock version is0.4.0. Ordinary journal/review storage and validation use no model allowance. Manually running a packet in native Codex consumes the existing shared allowance.

## Verification

Final cloud checks: production build/typecheck; **29 unit/security/risk/market/AI tests**, **eight foundation PostgreSQL**, **19 lifecycle/auth PostgreSQL**, **12 review PostgreSQL** and **11 production HTTP** cases passed. Node counts include parent tests where reported. Tests use synthetic records and disposable localhost PostgreSQL only. The migration upgrade was applied over a populated v0.2/v0.3 schema, preserving existing financial facts and rejecting changed delivered migrations. Review tests cover fresh connections, deduplication, pauses, identity/hash/reference rejection, stale edits/cash revisions, owner/disabled-user isolation, direct-mutation denial, queue caps and concurrent state changes. HTTP verifies real auth, minimal packet, response import and unchanged financial state alongside earlier journal/security checks.

Initial integration failures exposed a missing journal-revision check and Date objects rendered directly in JSX. Those were fixed and the affected checks rerun. No real native model run, Windows review UI/browser/keyboard acceptance, quota account inspection, broker billing/price diagnosis, schedule, notification receipt or backup check was performed here. No fresh dependency audit claimed; dependency versions are unchanged.

## Boundaries and next work

This is a **manual review** slice, not the full trade-plan generator, active position advisor, screenshot scanner, verified scoped native bridge or automatic quota enforcement. It deliberately reviews existing manually supplied text rather than manufacturing market-backed prices or candidates. Authoritative market research still needs the unresolved Phase 3 billing/raw-source/unit/time/history/calendar gates. Actual native response usefulness and included-only controls require a user-driven Windows acceptance run after controls are inspected; a fabricated fixture response is never evidence of a working native integration.

The cumulative Windows update includes Phase 3 diagnostics and can be merged over the delivered manual v0.2 or diagnostic v0.3 source using predecessor hashes. Follow [PHASE4_WINDOWS.md](PHASE4_WINDOWS.md). Do not rewrite earlier migrations or replace newer Windows bridge/test/status files. Existing JSON journal export does **not** include these review jobs/events or screenshot files and is not a full backup; this limitation is unchanged as a release constraint. Review history remains in the local DB. Backup/restore work is explicitly deferred, and no recoverable-production claim is made.
