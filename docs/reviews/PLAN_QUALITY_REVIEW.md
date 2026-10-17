# Planning quality review — local subscription-only revision

Revision 2, 13 October 2026. Scope: the updated planning documents and latest user direction to validate prices/notifications, run locally, and use the existing Codex subscription without additional service fees. This replaces the revision-1 review. It does not authorize implementation, local installation, live requests, notifications, scheduled tasks, purchases or deployment.

## Review conclusion

Final reread found no remaining high-consequence disagreement in the active source contracts within this review's scope. The written plan consistently requires local Next.js/Node, PostgreSQL, own login/private files, existing native Codex/IBKR, included usage only and fail-closed market-data validation. Unsupported automatic or mobile capabilities remain explicit blockers.

This is document consistency, not a working application or a passed price/notification test. The AAPL discrepancy remains unresolved, and the native integration, scheduling, desktop, phone and recovery gates remain unrun. The final monitoring contract evaluates individual captures promptly and rechecks observation age before signal commit and notification send, suppressing or freshly reevaluating expired live results.

## Reconciled contract findings

| Finding during the revision | Verified written resolution | Source evidence |
| --- | --- | --- |
| Old hosted database/staging/Edge and metered-inference assumptions could reintroduce service costs. | Active design, test environments and task prompts use local runtime/database/files/native included usage. Unknown billing or exhausted quota blocks/queues dependent work. No model API, credit purchase, paid quote mode or hosted fallback. Historical vendor research is explicitly SUPERSEDED. | [LOCAL_WORKFLOW](../LOCAL_WORKFLOW.md), [ARCHITECTURE](../ARCHITECTURE.md), [COSTS](../COSTS.md), [TEST_PLAN](../TEST_PLAN.md), [TASKS](../TASKS.md), [DECISIONS](../DECISIONS.md), [historical review](ARCHITECTURE_COST_REVIEW.md) |
| Earlier API text reserved live review for a future paid adapter despite the revised existing-IBKR design. | LIVE_ENTRY_READY requires purpose-specific accepted raw evidence, independent field timestamps/units/coverage, LIVE-compatible predicates and current risk. EOD_SETUP_REVIEW requires supported finalized session history. A pre-close quote cannot satisfy a finalized daily-close rule. | [PRICE_VALIDATION](../PRICE_VALIDATION.md), [API_DESIGN](../API_DESIGN.md), [AI_SYSTEM](../AI_SYSTEM.md), [RISK_ENGINE](../RISK_ENGINE.md), [MONITORING](../MONITORING.md) |
| Cloud upload/auth and unrestricted native access assumptions were incompatible with the local trust boundary. | Local authenticated content routes replace cloud upload tokens. App-owned users, maintained Auth.js/Argon2id integration, session revocation and trusted transaction-local RLS context replace hosted auth. Bridge capabilities are owner/job/lease-scoped and cannot approve plans, mutate a ledger/stop, expose credentials or execute arbitrary SQL/files. | [DATABASE](../DATABASE.md), [API_DESIGN](../API_DESIGN.md), [ARCHITECTURE](../ARCHITECTURE.md), [UX_PLAN](../UX_PLAN.md) |
| A model-submitted quote/hash could otherwise impersonate authoritative provider evidence. | Only a proven original native tool-event capture may be classified verified. Body/model declarations cannot set verified provenance or quality PASS. Raw LAST/BID/ASK values, independent observation times, units and coverage are preserved; reviewed imports keep their actual origin and do not prove automation. | DATABASE source captures/observations/quality assessments; API narrow bridge contracts; PRICE_VALIDATION provenance and field gates |
| Push-only contracts did not substantiate the required closed-page desktop behavior. | API now defines desktop test, delivery evidence/history and explicit acknowledgment. Native/OS acceptance, actual display and reading remain separate. Inbox/outbox persist atomically; expired/price-blocked data cannot create an entry recommendation. Phone delivery and private reachability require a separate zero-fee gate. | [NOTIFICATIONS](../NOTIFICATIONS.md), API notification contracts, DATABASE notification deliveries, UX notification/settings/install screens, ROADMAP release gates |

Verified written resolution means the relevant final source documents were reread. No runtime behavior was verified.

## Unresolved evidence and implementation gates

| Item | Honest current status and required proof |
| --- | --- |
| Existing IBKR access | Prior read-only AAPL/JPM observations reported REALTIME with recent trade timestamps. This is limited source evidence, not full-symbol/feed/history/billing or application-pipeline proof. |
| Current fees | USER_REPORTED fee-waived nonconsolidated access, total USD 0, API enabled and displayed snapshot cost 0. Nightly counters and exact connector request mode must be checked before repeated acquisition. No assumption that every tool named snapshot is free. |
| AAPL units | FAILED_OBSERVATION: raw last approximately 3.43 versus bid/ask approximately 343. No heuristic ×100 repair or convenient substitute field is accepted. Documented source units and compatible timestamped broker/reference evidence are still required. |
| Per-field time and coverage | Missing bid/ask observation times remain UNVERIFIED. Receipt time cannot establish their age. Nonconsolidated prices are not NBBO; partial volume cannot satisfy consolidated-volume rules. Unsupported history, adjustment, action, sector or universe data blocks dependent calculations. |
| Native bridge and automatic dispatch | UNRUN_CRITICAL. Supported native plugin-to-local raw capture and invocation must be demonstrated without GUI scraping, hidden-token extraction or paid fallback. The two calendar-dependent run reasons are preserved; exact native wakeup capability is not presumed. |
| Local availability | Actual local installation/autostart/own login/PostgreSQL/files are NOT_IMPLEMENTED. Closed tabs can be supported only with the computer awake, connected and relevant services/native session available. Sleep/shutdown/quota/auth failures must record missed/blocked work and recover using fresh evidence. |
| Desktop/inbox | NOT_IMPLEMENTED/UNRUN_CRITICAL. A sender return or task completion is not observed OS display. Actual closed-tabs display, permission failure, acknowledgment, privacy, expiry and retry/dedup recovery must be tested. |
| iPhone | UNRUN_CONDITIONAL. Device-trusted private HTTPS, install/permission, physical locked-phone receipt and link reachability must be proven using existing resources. LAN does not provide away-from-home access; a received push can have an unreachable private link. No free always-on cloud, paid tunnel/domain or successful device route is promised. |
| Financial security and recovery | NOT_IMPLEMENTED. Independent decimal/FIFO/R fixtures, atomic commands, two-owner local RLS/context-pool tests, scoped bridge denial and encrypted DB/files restore on a separate existing medium remain release requirements. Same-computer copies are not disaster protection. |

[VALIDATION_STATUS](../VALIDATION_STATUS.md) is the evidence ledger. These gates are not resolved by writing specifications, mocks or a cost target. Automatic/full-mobile V1 cannot be reported complete until the relevant proof exists or the user explicitly approves a revised scope.

## Verification scope and limits

Read the project/QA-role instructions, revision-2 baseline, product, architecture, database, API, AI, risk, UX, monitoring, price and notification validation, roadmap, test plan, tasks, decisions, costs, executive summary, requirements coverage, validation status, README and archived vendor/live-observation records. Reviewed the draft compilation boundary; the coordinator must rebuild the complete plan from the final sources after this review.

All eight phases retain A–K, and all 14 screen categories retain the requested purpose/UI/data/actions/API/entities/loading/errors/mobile contracts. Financial history/version/BUY-emotion/partial-exit/correction invariants remain explicit. Planned tests cover local auth/RLS/files, independent accounting, source authenticity/units/time/coverage, both timezone/calendar schedules, quota/reconnect recovery, actual desktop delivery and conditional physical-iPhone tests.

This review only read documents and updated this review file. No application code, migrations, tests, Git commands, live plugin calls, account changes, installations, automations or notifications were performed. Every application/integration/device/restore check remains unrun. The existing limited quote observations and user-provided fee settings are separately classified evidence, not new validations performed by this reviewer.
