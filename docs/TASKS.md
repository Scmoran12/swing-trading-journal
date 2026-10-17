# Revised backlog and AI coding workflow

Revision2, updated17 October2026. User authorized Phase8 continuation and GitHub latest-source push. v0.8 read-only local diagnostics, configuration/storage guards and runbooks are implemented/cloud-tested. PHASE8_DELIVERY/PHASE8_WINDOWS/LOCAL_RUNBOOK are current. Next milestone: Windows acceptance and existing-gate resolution. Zero later numbered phases remain; Phase8/full release still incompletely accepted. No native/market/task/public activation or backup/drive work.

## Current Phase8 local-readiness subset

| Task | Actual status | Evidence / limitation |
| --- | --- | --- |
| P8-M1 read-only doctor | IMPLEMENTED_CLOUD_TESTED | Config/path/test isolation, READ ONLY role/catalog/migration checks, safe JSON; no corrections/writes. Windows ACLs manual. |
| P8-M2 protected readiness | IMPLEMENTED_HTTP_TESTED | Actual DB metadata plus conservative separate pending gates; no acceptance toggle/native activation. |
| P8-M3 local hardening | IMPLEMENTED_CLOUD_TESTED | Role/host/port/name separation, no missing-test fallback, resolved private storage root, consistent version and source ignores. |
| P8-M4 runbooks/update artifact | IMPLEMENTED | PHASE8_WINDOWS/LOCAL_RUNBOOK; no data downgrade, backup or automatic retention action. |
| P8-M5 GitHub publication | PUBLISHED_VERIFIED | main application commit41d7e90; fetched remote tree exactly matches verified source. Prior main history/six agents preserved; no forced update. |
| Actual Windows/browser/native/device | PENDING/BLOCKED | Latest Windows report is automatedv0.2 only. No new entitlement/price/usage/schedule/receipt proof. |
| Backup/restore/64GB drive | DEFERRED_UNVERIFIED | Explicit user deferral remains; untouched and not a passing release gate. |
| Full Phase8/release | ACCEPTANCE_PENDING | Zero later numbered phases; remaining work is actual acceptance/existing-gate resolution. |

Cloud checks: build/TypeScript,65 units, PostgreSQL82, HTTP15, Python11; Node parents included. No new migration/dependency/service or native/model/market/notification call. Verified application publication: [41d7e90](https://github.com/Scmoran12/swing-trading-journal/commit/41d7e90ef09537be3dbd5eac48f9efe412b8989a). Documentation-only publication evidence follows; application code remains identical.

## Previous Phase7 journal-only slice

| Task | Actual status | Evidence / limitation |
| --- | --- | --- |
| P7-M1 deterministic analytics | IMPLEMENTED_CLOUD_TESTED | CLOSED_TRADES_V1, authoritative SQL net/frozenR, full bounded cohort, explicit closure-period/missing-R/fee/ADD/emotion coverage. |
| P7-M2 source and entry comparisons | IMPLEMENTED_HTTP_TESTED | Dark RTL tables/source links and pinned approval entry/quantity comparisons; real browser/keyboard acceptance pending. |
| P7-M3 weekly snapshot/manual review | IMPLEMENTED_CLOUD_TESTED | Immutable input/revision/hash, manual minimal packets, default-off emotion sharing, schema-bound unverified imports, stale quarantine, persisted pause/cancel. |
| Historical portfolio return/drawdown | UNAVAILABLE | No complete historical valuation/flow boundaries; no fabricated curve. |
| Native AI weekly pickup/usage | BLOCKED | Manual copy only; no account quota/billing enforcement or bridge dispatch proof. |
| Windows v0.3–v0.7 acceptance | PENDING | Merge manifest, forward migrate existing test setup; run tests/browser checks and preserve newer evidence. |
| Next Phase8 | READY_FOR_INDEPENDENT_SUBSET | Local hardening/runbooks/regression can proceed; external/device/recovery gates cannot be waived. |

Final cloud checks: build/TypeScript;58 units; PostgreSQL72; HTTP14. Counts include parents. New0007 only, old migrations/dependencies unchanged. Backups remain DEFERRED_UNVERIFIED.

## Previous Phase6 desktop-test slice

| Task | Actual status | Evidence / limitation |
| --- | --- | --- |
| P6-M1 test preference/outbox/history | IMPLEMENTED_CLOUD_TESTED | Default-off, fixed synthetic payload, durable dedup/expiry, owner isolation, leased attempts/cancel/revoke and bounded explicit retries. |
| P6-M2 one-shot Windows adapter | IMPLEMENTED_WINDOWS_UNRUN | Built-in PowerShell/WinRT + owner-selected existing registered AppID; no service/module/permission/registry changes. Process mocked in cloud. |
| P6-M3 code-based human receipt | IMPLEMENTED_CLOUD_TESTED | Hash-bound challenge, no code/token in DTO/CLI, persistent five-attempt lock, website-context report. Synthetic acceptance is not OS proof. |
| P6-01/02 actual desktop acceptance | UNVERIFIED | Owner must observe real Windows notice with tabs closed, then report code/context. Sender acceptance alone never passes this gate. |
| P6-03/04/05 private mobile | BLOCKED/NOT_IMPLEMENTED | No verified HTTPS/private routing/device receipt. No PWA/push or public exposure enabled. |
| Production signal outbox/background delivery | BLOCKED | The new outbox is DESKTOP_TEST only; no native/market scheduler or trading notices. |

Actual checks: production build/TypeScript;49 unit; PG9 desktop+8 foundation+19 lifecycle+9 monitoring+12 reviews; HTTP13, all passed (Node parent counts included). No real notification was sent from cloud. New0006 migration preserves earlier data;0001–0005/dependencies unchanged. Next: merge cumulativev0.6, migrate existing test config, run Windows adapter/receipt acceptance. Next planned development phase is7; two later numbered phases remain(7 and8) plus outstanding earlier validation.

## Previous Phase5 inactive slice

| Task | Actual status | Evidence / limitation |
| --- | --- | --- |
| P5-M1 rehearsal schedules/provenance | IMPLEMENTED_CLOUD_TESTED | Explicit manual OPEN/CLOSED dates, two IANA-zone instants, preview/SQL goldens and immutable scenario versions. No authoritative production calendar. |
| P5-M2 persistence/recovery/cancellation | IMPLEMENTED_CLOUD_TESTED | Idempotent stored probes/events, owner/revision checks, manual reconciliation and expired suppression; no background worker, lease/native dispatch or OS recovery proof. |
| P5-M3 readiness/history page | IMPLEMENTED_HTTP_TESTED | Owner-only /monitoring with missing gates, server assessment time, always-inactive capabilities and original schedule history. Browser/Windows acceptance pending. |
| P5-01 production calendar/leased dispatcher | PARTIAL/BLOCKED | Rehearsal arithmetic/storage only. Actual vetted calendar, worker/leases/fencing/supervision unimplemented. |
| P5-02/03 native source and live/EOD rules | BLOCKED | Billing/raw source/units/time/coverage/native dispatch/current risk contracts not proven end-to-end. |
| P5-04 actual wake/recovery/quota | UNVERIFIED | Synthetic DB-clock recovery is not physical sleep/native dispatch; no automatic usage-control claim. |
| P5-05 signals/outbox | NOT_ACTIVATED | Rehearsals cannot write signals, financial facts, inbox or delivery requests. |

Cloud checks: production build/TypeScript,43 unit; PostgreSQL8 foundation+19 lifecycle+9 monitoring+12 reviews; HTTP12, all passed (Node counts include parents). New0005 upgrade preserves populated financial/review records; delivered0001–0004 unchanged. Historical next action: mergev0.5; cumulativev0.6 now includes it. Do not activate monitoring from a passing rehearsal.

## Previous Phase 4 manual slice

| Task | Actual status | Evidence / next action |
| --- | --- | --- |
| P4-M1 durable owner-only review queue | IMPLEMENTED_CLOUD_TESTED | New migration0004; requests survive fresh connections, dedup/caps, explicit manual transport, no native claims. |
| P4-M2 limited packet/response review | IMPLEMENTED_CLOUD_TESTED | Exact pinned manual plan facts only; explicit sharing scope, strict job/hash/reference schema, imported commentary remains unverified. |
| P4-M3 pause/stale/history | IMPLEMENTED_CLOUD_TESTED | Owner-reported pauses/cancel/resume, conservative plan/policy/journal revision checks, late response quarantine and append-only events. |
| P4-01 supported scoped native bridge | BLOCKED | Owner-session web APIs are not a native bridge; no automatic dispatch or bridge credentials implemented. |
| P4-02 screenshot candidate confirmation | NOT_STARTED | No image sharing enabled by review-packet consent. |
| P4-03/04 grounded generator/advisor | BLOCKED | Missing verified market evidence/native integration. Existing manual text review cannot replace these modules. |
| P4-05 automatic usage enforcement | UNVERIFIED | Manual pause states work; no account inspection or guarantee of external credit controls. |

Cloud checks: build/typecheck, 29 unit cases; PostgreSQL8 foundation +19 lifecycle +12 review; production HTTP11, all passed (Node counts include parents). New forward migration upgrade preserves existing financial facts; migrations0001–0003 unchanged. No real native model run, provider request, monitoring or backup work. Historical next action: merge v0.4; the cumulative v0.5 source now includes it. Optional native review still requires confirmed included-only controls.

## Previous Phase 3 diagnostic slice

| Task | Actual status | Evidence / next action |
| --- | --- | --- |
| P3-01 exact identity contract | PARTIAL, CLOUD_TESTED | Exact expected/supplied instrument comparison; expected identity remains manual. Authoritative listing/calendar registry unimplemented. |
| P3-02 native raw adapter/billing | BLOCKED | No new provider calls. Free request mode/raw ingress unverified; do not mistake normalized manual JSON for exact tool evidence. |
| P3-03 quote guards/diagnostic UI | IMPLEMENTED_CLOUD_TESTED subset | 13 new market cases; owner-authenticated transient /research + /api/market-data/diagnose. Source/cost/instrument/calendar/actions blockers always remain; no live/EOD eligibility. |
| P3-04 history/indicators/chart | BLOCKED | Licensed history/finality/adjustment/source-time coverage not proved. |
| P3-05 eligible universe/shortages | NOT_STARTED | No market-wide screening assumed from a quote entitlement. |
| Windows manual acceptance | USER_REPORTED_AUTOMATED_PASSED | Build/typecheck; units 8 pass/2 skip; PostgreSQL 8+19; HTTP 9; Phase 0 Node 12. Browser acceptance and personal setup pending. See reviews/WINDOWS_ACCEPTANCE_REPORTED. |

Current cloud checks: build/typecheck, 23 application unit cases and 10 production HTTP cases passed; no migrations/dependency versions changed. No provider request, monitoring, notification or backup work. Historical next action: merge v0.3 diagnostics. The cumulative v0.4 update now includes that source. Billing proof still precedes any native price experiment.

## Current Phase 2 delivery

| Work | Actual status | Remaining acceptance |
| --- | --- | --- |
| P1-03 owner/session/private storage | IMPLEMENTED_CLOUD_TESTED | Windows ACL/native module installation and browser checks; passwords entered only in local terminal. |
| P2-01/02 plans, versions, approvals, entered state | IMPLEMENTED_CLOUD_TESTED | Manual browser acceptance; identities/levels remain manual/JOURNAL_ONLY. |
| P2-03 BUY batches/emotions | IMPLEMENTED_CLOUD_TESTED | Real broker actions remain manually executed outside app; test in isolated journal first. |
| P2-04/05 SQL FIFO/cash/ADD/partial/final/stop | IMPLEMENTED_CLOUD_TESTED | Independent goldens, concurrency and fee-remainder tests passed; Windows own build pending. |
| P2-06 audited corrections/ownership | IMPLEMENTED_CLOUD_TESTED | Historical oversell atomic rollback, same-time ordering and reopened closure tested. |
| P2-07 manual marks/inbox/export | IMPLEMENTED_CLOUD_TESTED | Actual native desktop receipt still unverified; export excludes screenshot binaries and is not backup. |
| P1-01 OS startup/supervision | PARTIAL | Manual Windows launcher provided; no autostart/supervisor installed. |
| P1-06 backup/restore | DEFERRED_UNVERIFIED | No drive/restore work; remains release limitation. |

Checks: production build/typecheck; 10 unit/security/risk cases; 8 foundation + 19 lifecycle PostgreSQL cases; 9 production HTTP cases; interactive synthetic setup check; production audit zero known vulnerabilities after sharp 0.35.5 update. Browser visual/keyboard/physical Windows checks were not run here. Tests use isolated temporary DBs/config only. Cumulative bundle and UPDATE_MANIFEST preserve native Phase 0/agent/status files. Current branch feat/local-foundation; no remote push. Historical next action: Windows merge/test/personal setup. The Phase 3 slice above now records current progress.

The Phase 2 table above and following Phase 1 table record the earlier foundation slice; current authentication/manual behavior supersedes its NOT_STARTED entries.

## Current Phase 1 slice

| Task | Status | Evidence / next action |
| --- | --- | --- |
| P1-01 local runtime | IMPLEMENTED_CLOUD_TESTED, Windows pending | Locked Next/React/TypeScript app builds and serves on loopback. Autostart not implemented. |
| P1-02 foundation schema | IMPLEMENTED_CLOUD_TESTED, Windows pending | Initial owner/profile/portfolio migration; eight real PostgreSQL tests including ownership/credential denial. Windows PostgreSQL tools still absent per report. |
| P1-03 owner login/private files | NOT_STARTED | Next independent implementation; no private writes exposed in current interface. |
| P1-04 dark RTL shell | IMPLEMENTED_HTTP_CHECKED | Nine navigable foundation pages, default dark server HTML, responsive CSS. No trading workflows; browser visual/keyboard/physical QA unrun. |
| P1-05 financial engine/contracts | NOT_STARTED | No monetary calculations added; schema fixed-decimal storage only. |
| P1-06 backup/restore | DEFERRED_UNVERIFIED | User explicitly deferred; remains a release limitation. |

Actual delivery: PHASE1_FOUNDATION.md. Branch feat/local-foundation; remote agent tree compared before coding, prior changes preserved. One migration-config unit test, eight isolated PostgreSQL tests, production build/typecheck, nine-page HTTP smoke and production dependency audit passed. No Windows changes or remote push. Next work: merge the incremental foundation bundle into Windows preserving bridge/status files, verify local build, then continue database/authentication work. Never replace newer Windows files with the old full Phase 0 ZIP.

## Latest Windows Phase 0 report

USER_REPORTED_PASSED: Windows preflight, native local MCP access, unchanged listing capture, 11 Python tests, 2 bridge tests, 30 offline schedule/recovery assertions. Native dispatch/notification receipt/spending and billing/price proof still pending. See reviews/WINDOWS_PROGRESS_REPORTED.md. The following table retains historical cloud evidence, not a replacement for newer Windows records.

## Current Phase 0 task evidence

| Task | Status | Evidence / next action |
| --- | --- | --- |
| G0-ENV cloud inventory | VERIFIED_DONE (cloud scope only) | Python inventory ran; Node/Python/Codex CLI available, PostgreSQL tools/desktop senders absent. Windows state unknown. |
| G0-L1 native bridge/allowance | IN_PROGRESS; target gate UNRUN | Official MCP transports/configuration researched; no bridge/native capture proved. Check actual Plus usage/credit controls on Windows. |
| G0-L2 listing/billing/coverage | BLOCKED for acquisition | AAPL 265598 NASDAQ and JPM 1520593 NYSE exact US STK lookups succeeded; free-mode snapshot/history charging unresolved. No fresh quote/history requests. |
| G0-L3 price truth | BLOCKED; offline subset VERIFIED_DONE | Synthetic scale/timestamp/coverage regressions passed. Actual AAPL units and source times unresolved. |
| G0-L4 two schedules | IN_PROGRESS; offline subset VERIFIED_DONE | Explicit UTC fixtures passed DST/holiday/early-close/year-change checks; native Windows dispatch/recovery UNRUN. No tasks created. |
| G0-L5 desktop | BLOCKED_BY_ENVIRONMENT | Cloud has no Windows notification session. Actual visible receipt still required. |
| G0-L6 phone | NOT_STARTED, conditional | Depends on zero-fee device/private-network feasibility. |
| G0-WIN host/backup | IN_PROGRESS | User reports Windows + 64 GB drive; PowerShell inventory prepared, UNRUN. Separation/free space/restore pending. |

Historical Phase 0 artifacts remain under scripts/phase0 and tests/phase0; do not overwrite newer Windows versions. The original cloud pass ran 11 Python tests and lookup/inventory probes. Current continuation and next steps are in the Phase 1 slice above.

## Milestones and bounded task IDs

| Milestone | Tasks | Owner role | Evidence gate |
| --- | --- | --- | --- |
| G0 local feasibility | G0-L1 native Codex/localbridge/raw toolcapture; G0-L2 existingfreeIBKRmode/history/coverage; G0-L3 AAPLunits/sourcetimestamps; G0-L4 two schedules/closed page/usage/auth; G0-L5 desktopdisplay; G0-L6 conditionaliPhoneHTTPS | Architect/AI/analyst/QA | VALIDATION_STATUS |
| M1 localfoundation | P1-01 host/runtime/autostart; P1-02 local PostgreSQL/users/RLS; P1-03 localownerlogin/files; P1-04 RTLnavigationshell; P1-05 decimal/contracts; P1-06 encryptedbackuprestore/CI | Developer/UX/QA | ROADMAP1 |
| M2 completeledger | P2-01 immutableplans; P2-02 approve/watchlist; P2-03 BUYbatch+emotion; P2-04 FIFO/cash/internalevents; P2-05 ADD/partialexit/close/stop; P2-06 corrections/ownership; P2-07 manualvaluations/inbox/first release | Developer/analyst/QA | ROADMAP2/RISK_ENGINE |
| M3 validateddata | P3-01 instrument/calendar; P3-02 rawIBKRevidenceadapter; P3-03 timestamps/units/coverageguards; P3-04 history/indicators/chart; P3-05 boundedeligibleuniverse/shortages | Analyst/developer | PRICE_VALIDATION/ROADMAP3 |
| M4 nativeAI | P4-01 scopedbridgeclaims/outputs; P4-02 screenshots/confirmtickers; P4-03 quantshortlist/structuredplans; P4-04 activeadvisor; P4-05 includedusagepauses/evaluation | AI/analyst/QA | AI_SYSTEM/ROADMAP4 |
| M5 localschedules | P5-01 two calendarduejobs; P5-02 provennativetrigger; P5-03 live/eodpredicates; P5-04 leases/ratecap/recovery; P5-05 signal/inbox/outbox/health | Developer/QA | MONITORING/ROADMAP5 |
| M6 desktop/mobile | P6-01 native/OSdesktoppermission/display; P6-02 senddedup/ack/link; P6-03 conditionalprivateHTTPS/PWA; P6-04 conditionalWebPush; P6-05 physical device/failuretests | UX/developer/QA | NOTIFICATIONS/ROADMAP6 |
| M7 insights | P7-01 deterministicperformance/adherence; P7-02 consent/emotionaggregates; P7-03 nativeweeklyreview; P7-04 export/history/evaluation | Analyst/AI/product | ROADMAP7 |
| M8 localrelease | P8-01 security/regression; P8-02 hostquotalimits/freebillingmode; P8-03 restore/autostart/recovery; P8-04 runbooks/install/rollback; P8-05 finalscopeevidence | Developer/QA/product | TEST_PLAN/ROADMAP8 |

A task record contains ID/goal/scope/dependencies/files/owner/status/estimate/branch/commit/acceptance/tests/results/blocker/nextaction. Status: NOT_STARTED, IN_PROGRESS, BLOCKED, REVIEW, VERIFIED_DONE. An unproven free capability cannot become done through a mock. Six registered roles share the same subscription; bounded delegations do not multiply allowance. Architect/database/DevOps perspective belongs to developer, technicalprojectmanagement toproduct.

## Revised phase prompt

> Implement only the user-approved Gate0 or Phase[N] tasks in TASKS. Read AGENTS.md and revision 2 IMPLEMENTATION_PLAN, LOCAL_WORKFLOW, DECISIONS, DATABASE, API_DESIGN, AI_SYSTEM, PRICE_VALIDATION, NOTIFICATIONS, RISK_ENGINE, ROADMAP, TEST_PLAN and VALIDATION_STATUS. Check current branch/worktree and verified tasks. Build local-only using existingCodexsubscription and existingfee-waivedIBKR mode; no paid API/provider/credits/cloud hosting/tunnel/domain or hiddencredential extraction. Preserve ledger/ownership and sourcevalidation contracts. Prove native bridge/notification/scheduling gates rather than assuming desktopplugins are server APIs. Unsupportedfree capabilities become BLOCKED with evidence. Run appropriate actualchecks, update docs/taskstatus and stop at the approvedphase boundary. No brokerageexecution or automaticapproval/ledger mutation by AI.

The prompt applies to authorized Phase 0, independent Phase 1/manual Phase 2 the first Phase 3 diagnostic slice independent Phase 4 manual reviews inactive Phase 5 rehearsals and opt-in Phase6 desktop tests. Backup checks remain deferred; no automatic live-data/native gate bypass is permitted.

## Git/review/resume

Use boundedbranches e.g. `feat/p3-price-guard`; small cohesive commits; PRreviews for financial/auth/native bridge/source changes; attach createdPR artifacts inCodex. Preserve unrelated edits. Before coding compare remote/local agentcommit history; an earlier connectorpublication produced differentlocal/remote commits with identicalagenttree. Sync without destructive reset/forcepush.

Make migrations reviewed/reproducible against local real PostgreSQL. Independentfinancialgoldens and twoidentityadversarialchecks gate ledger/RLS changes. Preservepreviouslifecycle E2E and fail-closedprice regressions; model/nativeplugin changes rerun appropriatecorpus/hostsmoke. DefaultCI is local/fixture-only, no realjournal/secrets/paidcalls. Record unrun native/physical device/gates explicitly.

Every task updates the applicable contract and TASKS; materiallychanged source/coverage/schedule/cost policy adds DECISIONS evidence and refreshes compiledplan. Use taskIDs asdurablesource; optionalGitHubissues mirror them rather than become competingstatus. Backups/livequotes/notifications/capabilities haveactualevidence records, not optimisticcheckmarks.

A newCodex/ClaudeCode chat reads AGENTS + revisedsummary + TASKS/DECISIONS/VALIDATION_STATUS, checksbranch/worktree, verifies approvedscope and nextunblockedtask, and resumesexistingwork. It never assumes the cloudworkspace equals the user's always-on computer or that its authentication/plugins are transferable. NativeCodex access on targethost must be explicitlyverified. Handoff includes lastcommit, editedfiles, completedIDs, actualtestcommands, blockinggate, credentialnamesonly and nextboundedstep.

## Durable documentation

| File | Purpose |
| --- | --- |
| IMPLEMENTATION_PLAN.md | Compiled revised review and approvalboundary |
| LOCAL_WORKFLOW.md | Conversation-driven zeroadditionalfee/local/nativebaseline |
| PRODUCT_SPEC.md / UX_PLAN.md | Requirements/journey/14screens/release scope |
| ARCHITECTURE.md | Components, trustboundaries, localstructure |
| DATABASE.md / API_DESIGN.md | Localidentities/RLS/ledger/bridge/dataquality/deliverycontracts |
| ROADMAP.md / TASKS.md | Eightphases,dependencies/effort,taskevidence/handoff |
| AI_SYSTEM.md / RISK_ENGINE.md | NativeAImodules, deterministicfinance/provenance |
| MONITORING.md | Calendar/local due jobs/nativetrigger/livevsEOD/recovery |
| PRICE_VALIDATION.md / NOTIFICATIONS.md | Explicitsourceguardandactual desktop/phoneproof |
| TEST_PLAN.md / VALIDATION_STATUS.md | Plannedchecksversusobserved/failed/unrunstatus |
| COSTS.md / DECISIONS.md | No-paidfallback policy and reviseddecisions |
| reviews/LIVE_DATA_VERIFICATION.md | Original limitedquoteobservations/scaleblocker |
| reviews/ARCHITECTURE_COST_REVIEW.md | Supersededhostedvendorresearch, excludedfromactivebaseline |
| reviews/PLAN_QUALITY_REVIEW.md | Revised cross-documentreview, notapplicationtestsuccess |
