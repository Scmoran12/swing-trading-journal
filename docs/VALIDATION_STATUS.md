# Validation status — local subscription-only revision

Updated17 October2026. v0.8 local readiness/hardening passed cloud production build/TypeScript,65 unit,82 PostgreSQL,15 production HTTP and11 preserved Python offline cases (Node parents included). Synthetic disposable loopback fixtures only. No new actual Windows/native/data/account/model/notification/schedule/restore proof. Latest supplied Windows report remains automatedv0.2. PHASE8_DELIVERY/PHASE8_WINDOWS/LOCAL_RUNBOOK are current; backups deferred. Next milestone Windows acceptance and existing gates; zero later numbered phases remain, full release still ACCEPTANCE_PENDING.

| Item | Status | Evidence / next requirement |
| --- | --- | --- |
| Existing IBKR connection | OBSERVED | Authorized exact US listings and quote requests succeeded. |
| Current live entitlement for tested symbols | OBSERVED_LIMITED | AAPL/JPM top-status REALTIME with recent trade timestamps; not proof of every symbol/consolidated coverage. |
| Current subscription bill | USER_REPORTED | Pasted Client Portal shows fee-waived nonconsolidated quotes, totalUSD0, API enabled, displayed snapshot costUSD0; counters update nightly. |
| AAPL price-unit consistency | FAILED_OBSERVATION | Last≈3.43 vs bid/ask≈343. No correction applied; live alerts blocked pending diagnosis. |
| Bid/ask source timestamps | UNVERIFIED | Observed payload did not expose independent quote timestamps; receipt time cannot substitute. |
| Automated quote request billing mode | UNVERIFIED | Prove existing free connector mode; no new entitlement/regulatory snapshot. |
| Historical bars/volume/universe/corporate actions | UNRUN | Test available existing-plugin coverage and timestamps; partial/unsupported facts remain blocked. |
| Local app/database/files/login | CLOUD_TESTED; WINDOWS_AUTOMATED_USER_REPORTED | Windows Node/PostgreSQL/test setup/build/auth suites and ACL checks passed per report; interactive browser/personal setup pending. |
| Native Codex → local bridge/raw source capture | USER_REPORTED_BASIC_SMOKE | User reports local MCP access + unchanged listing capture + 2 bridge tests passed. Does not establish quote ingress, full job scope/auth or unattended native dispatch. Preserve original Windows evidence. |
|22:40 and AFTER_CLOSE schedules | UNRUN_CRITICAL | Native trigger precision, local due jobs, holidays/DST, closed page and missed-run recovery. |
| Subscription usage limit handling | UNRUN | Stop/queue and no credit/API fallback; inspect plan settings at authorized setup. |
| Desktop notification display | UNRUN_CRITICAL | Native/OS actual display with closed website and permission failure/recovery. |
| Local inbox/dedup/ack | IMPLEMENTED_CLOUD_TESTED | Atomic command/audit/inbox transaction, idempotent retries, owner read/ack. No actual desktop receipt claimed. |
| iPhone trusted HTTPS/PWA/push | UNRUN_CONDITIONAL | Physical-device zero-fee routing/trust/permission and locked-device receipt. |
| Financial ledger/RLS/restore | LEDGER_CLOUD_TESTED; RESTORE_DEFERRED | SQL numeric FIFO/cash/corrections/ownership golden/concurrency cases passed. No backup/restore test performed. |
| Current IBKR instrument lookup | OBSERVED_CURRENT | 14 October: two successful read-only tool calls. Exact US STK: AAPL/NASDAQ 265598 and JPM/NYSE 1520593. No new quote/history request. |
| Cloud developer inventory | PASSED_CLOUD_ONLY | Node v24.19.0, Python 3.12.14, Codex CLI 0.159.2. PostgreSQL tools and desktop senders unavailable. Not Windows evidence. |
| Offline calendar and price diagnostics | PASSED_OFFLINE_ONLY | 11 unittest tests: explicit DST/early-close/holiday/year-change UTC expectations; unknown calendar dates blocked; synthetic bad prices/times rejected. Every sample denies live eligibility. |
| Windows host inventory | USER_REPORTED_PASSED | Latest report: Node24.15/npm11.12, PostgreSQL18.6 loopback, private test setup/ACLs. Original logs not inspected here. Earlier absent-PG report superseded. |
| Subscription tier | USER_REPORTED_PLUS | User corrected Pro to Plus. Actual allowance, existing credits and spending controls unavailable here; no sufficiency guarantee. |
| Proposed backup medium | DEFERRED_UNVERIFIED | User reports 64 GB drive and explicitly deferred backup checks; no drive writes/restore tests performed or currently requested. |
| Windows offline scheduling/recovery | USER_REPORTED_PASSED | User reports 30 offline assertions; not actual native dispatch/recovery. |
| Phase 1 build/typecheck | PASSED_CLOUD_ONLY | Next 16.4 production build and TypeScript passed; not Windows installation. |
| Initial foundation schema/RLS | PASSED_CLOUD_ONLY | Eight real isolated PostgreSQL tests (parent + seven subtests); auth session/private-data workflow not implemented. |
| Foundation HTTP/config checks | PASSED_CLOUD_ONLY | Nine pages, dark/RTL initial HTML, headers/redirect/unknown routes and capability API; one local-only DB URL unit test. Browser/keyboard/physical QA unrun. |
| Manual-core final automated checks | PASSED_CLOUD_ONLY | 10 unit/security/risk; 8 foundation + 19 lifecycle PostgreSQL; 9 production HTTP; production build/typecheck. No real trade data used. |
| Local setup wizard | PASSED_LINUX_FIXTURE; WINDOWS_USER_REPORTED_PASSED | Windows separate test setup and current-user-only ACLs passed per report; personal setup not started. |
| Source provenance | MANUAL_ONLY | Manual references/marks/fee assumptions; missing original stop has null R. No new provider verification or market quote request. |
| Production dependency audit | OBSERVED_ZERO_KNOWN | Updated sharp to 0.35.5; audit zero known issues at check. Not a permanent security guarantee. |

Independent Phase 4 manual reviews are now user-authorized; this does not pass native integration gates. All native/live/data/spending/device gates retain their recorded limitations. Backup checks remain deferred. No fees, orders, public deployment, disk formatting or recurring monitoring activation authorized by a passing code test.

## 17 October continuation evidence

| Item | Status | Evidence / next requirement |
| --- | --- | --- |
| Windows automated manual-core acceptance | USER_REPORTED_PASSED | Units8/skip2; PG8+19; HTTP9; Phase0Node12; build/typecheck; ACLs. reviews/WINDOWS_ACCEPTANCE_REPORTED preserves exact scope. |
| Windows interactive/personal acceptance | PENDING | Test site3001 is running per report; fictional workflow/visual/keyboard login remain pending; personal setup not started. |
| Windows Git metadata | USER_REPORTED_ABSENT | Extracted project has no .git; do not claim ZIP carries Git history. |
| v0.3 quote diagnostics | PASSED_CLOUD_ONLY | 23 unit/security/risk/market cases (13 new), production build/typecheck, 10 production HTTP cases. No new migration or financial storage path. |
| Native source/market/notification/scheduling/spending gates | STILL_UNVERIFIED | User explicitly reports no new tests; human receipt remains unconfirmed. Diagnostics cannot override this. |

## Phase 4 manual review evidence — 17 October

| Item | Status | Evidence / limitation |
| --- | --- | --- |
| Durable manual request/packet/import | PASSED_CLOUD_ONLY | New owner-scoped schema/RLS, exact schema/hash/known references, fresh connections, dedup and queue bounds. No native run or authenticated model origin proved. |
| Staleness/pauses/financial isolation | PASSED_CLOUD_ONLY | Changes in plan/policy/journal command count stale a packet; late response quarantine; manual pause/resume/cancel; financial facts/approvals unchanged. |
| Forward migration0004 | PASSED_CLOUD_ONLY | Populated old schema upgraded without altering existing facts; replay passes, delivered0001–0003 unchanged. |
| Latest application checks | PASSED_CLOUD_ONLY | Build/typecheck,29 unit; PG8+19+12; HTTP11. Node counts include parents. All temporary data synthetic. |
| External/native usage controls | UNVERIFIED | No external invocation in this delivery. Pauses are user-reported, not actual account enforcement; no included-allowance guarantee. |
| Windows v0.3/v0.4 and browser/personal acceptance | NOT_REPORTED | Latest supplied Windows report is v0.2 automated acceptance only. Follow PHASE4_WINDOWS. |

Review prose/model labels are manual unverified imports; known references and matching hashes are structural binding, not factual authenticity. Semantic hallucinations remain possible and cannot change authoritative financial records through this workflow.

## Phase5 inactive rehearsal evidence — 17 October

| Item | Status | Evidence / limitation |
| --- | --- | --- |
| IANA schedule arithmetic | PASSED_CLOUD_ONLY | Eight explicit UTC unit goldens; four SQL/JS/golden comparisons; US/Israel DST, early closes, year change. Manual scenario dates only, not provider calendar proof. |
| Persisted due/blocked/expired/cancelled rehearsal | PASSED_CLOUD_ONLY | Fresh connections, idempotency, immutable correction history, concurrent cancellation, owner/direct-write denial. Explicit reconciliation only; no worker/native task. |
| Recovery | SYNTHETIC_ONLY | Disposable DB-clock fixtures prove expired work suppression; no actual Windows sleep/restart/closed-page dispatch test. |
| Migration0005 | PASSED_CLOUD_ONLY | Populated v0.4 upgraded with financial/manual-review state unchanged;0001–0004 unchanged. |
| Final v0.5 checks | PASSED_CLOUD_ONLY | Build/TypeScript;43 unit; PG8+19+9+12; HTTP12. Node counts include parents; all records synthetic. |
| Real monitoring eligibility | BLOCKED | Automatic=false, last scheduled execution=null, no market/AI/notify capability. Client activation/trust/time fields reject. |
| Windows new updates/browser/personal/native gates | NOT_REPORTED/UNVERIFIED | Follow PHASE5_WINDOWS. No user report supersedes the earlier manual-v0.2 summary. |

## Phase6 desktop-test evidence — 17 October

| Item | Status | Evidence / limitation |
| --- | --- | --- |
| Default-off test outbox/preferences | PASSED_CLOUD_ONLY | Owner request/consent, dedup, ten-minute expiry, leased attempt fencing/revoke, known-failure explicit retry cap and UNKNOWN suppression. |
| One-shot Windows PowerShell/WinRT | IMPLEMENTED_UNRUN_WINDOWS | Mocked process tests only; script not executed/parsed on Windows here. Existing registered AppID and interactive session required. |
| Human receipt challenge/history | PASSED_SYNTHETIC_ONLY | Separate accepted/code-match states, hashes/no private DTO token, five wrong-attempt lock and explicit website-context report. No real human/OS receipt proof. |
| Final v0.6 verification | PASSED_CLOUD_ONLY | Build/TypeScript,49 unit; PG9+8+19+9+12; HTTP13. Counts include Node parents. All records disposable/synthetic. |
| Native display/closed tabs/locked/sleep | UNRUN | Use PHASE6_WINDOWS; old historical Windows display-event evidence still not human receipt. |
| iPhone/PWA/private HTTPS/push | BLOCKED/NOT_IMPLEMENTED | No device/routing/trust proof or public deployment. |

Actual desktop receipt remains UNVERIFIED until owner reports an actual Windows notice/code in the local acceptance record. Test sender acceptance/SQL fixtures cannot change live eligibility or prove automated trading notifications.

## Phase7 analytics and manual weekly review evidence — 17 October

| Check | Actual status | Evidence / limit |
| --- | --- | --- |
| Exact metrics and source cohorts | PASSED_CLOUD_ONLY | Independent50%/0.5R/2.5 profitfactor oracle; fee-inclusive SQL156.50/3.13R ADD case; correction186.50; no open/period/fee/R conflation. |
| Coverage/approval/emotion | PASSED_CLOUD_ONLY | Pinned approval survives new draft; mixed first-batch dedup, missingR and estimated fees; no causal or portfolio return inference. |
| Persistence/ownership/concurrency | PASSED_CLOUD_ONLY | Populated0006→0007 upgrade/replay, forcedRLS/direct-write denial, immutable snapshots, journal revisions except inbox reads, stale quarantine, row fencing,8pending cap. |
| Complete bounded cohort | PASSED_CLOUD_ONLY |501 source rows included beyond manual UI limit;10001 rejects without truncation. |
| Manual AI privacy/import | PASSED_CLOUD_ONLY | Aggregate packet with no symbols/IDs/trades, optional emotion references only; consent/binding/schema/pause tested. Not genuine model or semantic proof. |
| Final regression | PASSED_CLOUD_ONLY | Production build/TypeScript;58 units; PG15+9+8+19+9+12=72; productionHTTP14. Node parents included; synthetic disposable loopback data only. |
| Windows/UI/native acceptance | UNRUN | FollowPHASE7_WINDOWS; v0.3–v0.7 merge/visual/keyboard acceptance unreported. Previousv0.2 Windows report preserved. |
| Historical valuation/AI/market/device/recovery | BLOCKED/UNVERIFIED/DEFERRED | No complete valuation for drawdown/TWR/MWR; no actual native/model/market/notification/schedule test; backups/drive untouched. |

Initial analytics integration attempt stopped on malformed synthetic fee'.3'; fixture corrected to'0.3' and all15 analytics cases passed. Final metric-version guard rejects unsupported historical calculations. Final full regression has no failed/skipped cloud cases. Temporary DB/server stopped/deleted. No dependency/service changes or fresh audit; no Git commit/push/PR/public deployment.

## Phase8 local diagnostics/hardening evidence — 17 October

| Check | Actual status | Evidence / limitation |
| --- | --- | --- |
| Read-only local doctor | PASSED_CLOUD_ONLY | Actual CLI, safe JSON and unchanged config/financial workspace; private path/project-env checks precede DB; schema/roles inspected in READ ONLY transactions. |
| Real catalog fault detection | PASSED_CLOUD_ONLY | Missing/changed/newer migration, excessive login privileges after SET ROLE, public table/definer grants, direct financial writes and missing forcedRLS detected without doctor repairs. |
| Configuration/storage boundaries | PASSED_CLOUD_ONLY | Matched literal loopback targets/separate users; test config never personal fallback; resolved ancestor storage/root modes; OneDrive/project rejection. Windows ACL/junction proof pending. |
| Protected readiness/version | PASSED_CLOUD_ONLY | Owner/no-store/DB checks/sanitized output/darkRTL and source-version metadata; always ACCEPTANCE_PENDING regardless of local PASS. |
| Regression | PASSED_CLOUD_ONLY | Production build/TypeScript;65 units; PG15+9+8+19+9+10+12=82; HTTP15; preservedPython11. No skipped/failed cloud cases. Node parents included. |
| Actual Windows/native/recovery | UNRUN/BLOCKED/DEFERRED | No new OS/browser/ACL/model/data/billing/scheduling/receipt/phone evidence; backup/drive untouched. |
| GitHub latest source | PUBLISHED_VERIFIED | main application commit41d7e90, exact remote tree213b3c2120c693abe302d375198a0cd92625775b fetched and compared. Prior history/agents preserved, no forced update or public website deployment. |

Full Phase8/overall release stays incompletely accepted. Zero later numbered development phases remain; next milestone actual Windows acceptance and resolution of earlier gates. Source-version/build tracing issue fixed; no dependency/migration changes or new audit claim.

Verified application source commit: [41d7e90ef09537be3dbd5eac48f9efe412b8989a](https://github.com/Scmoran12/swing-trading-journal/commit/41d7e90ef09537be3dbd5eac48f9efe412b8989a). The connected GitHub account published through a non-forced, expected-head branch update because the local CLI credential was unusable. Subsequent documentation-only publication evidence does not change tested application code. Working source/private artifact checks passed; six agent definitions remain unchanged.
