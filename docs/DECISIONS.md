# Decisions, conversation changes and approval boundary — revision 2

Updated 17 October 2026. User explicitly authorized continuing to the next phase and requested all Windows tasks at the end. Phase 2 manual-core development and its security prerequisites are implemented/cloud-tested; this is not verified Windows/production readiness. Backup checks remain explicitly deferred. No paid services, market acquisition, recurring monitoring activation, public deployment or brokerage operations performed.

| ID | Status | Revised decision | Consequence |
| --- | --- | --- | --- |
| D001 | User-confirmed | US NYSE/Nasdaq long stocks, manual brokerage execution, whole shares | No order submission/IBKR trading integration. Read-only IBKR data now permitted. |
| D002 | User-confirmed desired | Hebrew RTL UI with dark mode as the default, responsive, iPhone PWA/push | Desktop first; mobile gated by zero-fee HTTPS/device/routing feasibility. |
| D003 | User-confirmed |22:40 Jerusalem + calendar post-close check | Two distinct job reasons; no silent hourly approximation. |
| D004 | Revised | Live versus EOD depends on actual verified fields/intervals | Valid live quotes may support live-compatible review; pre-close quotes never establish a daily close. |
| D005 | User-directed | Interface/database/files on user's computer | Local Next.js, PostgreSQL, private files; hosted stack superseded. |
| D006 | User evidence / limited observed | Existing IBKR nonconsolidated quotes, current screen totalUSD0, API enabled | AAPL/JPM REALTIME observations; not proof of full NBBO/volume/history/bulk billing. |
| D007 | Revised proposal | Local durable worker + supported native Codex schedules/bridge | Host awake + app/services online; exact dispatch/raw capture must be proven. |
| D008 | Retained proposal | Separate plan approval/watchlist/position states | Signals never buy, expiry never deletes held shares. |
| D009 | Retained proposal | FIFO USD ledger and frozen initial BUY-batch R | Exact arithmetic, atomic corrections, fee conservation and audit remain mandatory. |
| D010 | Retained proposal | Record actual risk-violating fills with explicit flags | Prevent journal hiding actual exposure. |
| D011 | Revised proposal | Secure manual local journal first; all automated AI/live capabilities gated | Not a claim full scope is complete when desktop/manual milestone ships. |
| D012 | Revised proposal | Local owner login + mature session/password libraries, private DB/file access | No public registration, hosted Auth/SMTP fees or browser DB connection. |
| D013 | User-directed |$0 additional service subscriptions | No paid cloud/data/API/monitoring/notification fallback or automatic credit purchase. |
| D014 | User-directed | Existing native Codex subscription handles AI | Six agents share one allowance; stop/queue on limits; no assumed API credits. |
| D015 | Retained proposal | Bounded condition DSL, strict local output validators | AI cannot approve, execute or mutate ledger management without explicit owner command. |
| D016 | Retained proposal | Up to five genuinely qualified extra candidates | Bounded validated universe; disclose gaps/shortages, no fabricated names. |
| D017 | Retained proposal | No private PWA cache; minimum AI emotion/image sharing | Owner-only data, explicit consent and encrypted backups. |
| D018 | Updated by user | Phase 0 diagnostics/prototypes authorized on 14 October 2026 | Cloud/offline checks executed; subsequent independent Phase 1 authorization is recorded in D028. |
| D019 | New observed blocker | AAPL last≈3.43 versus bid/ask≈343 | No heuristic100× fix; diagnose source units and fail closed. |
| D020 | New proposal | Raw tool evidence provenance and per-field timestamps required | No model-retyped price authoritative; receipt time cannot invent quote age. |
| D021 | New proposal | Durable inbox + tested native/OS desktop notice first | Closed-page test; phone push separate conditional gate. |
| D022 | New limitation | Local machine off/sleep/auth/usage failures affect availability | Show blocked/missed/late, fresh recovery; no assumed cloud uptime. |
| D023 | User-confirmed | Existing subscription is ChatGPT Plus, not Pro | Shared included allowance; previous Pro capacity assumptions do not establish Plus sufficiency. Actual usage/spending controls remain unverified. |
| D024 | User-confirmed / pending proof | Target Windows; user has a 64 GB drive | Separate-medium status, free space and encrypted restore must be checked on Windows; do not format or overwrite it. |
| D025 | Observed limited | Phase 0 cloud listing lookup and 11 offline tests passed | No fresh quote/history request, native bridge, desktop display, real schedule or Windows backup gate passed. See PHASE0_FEASIBILITY. |
| D026 | User-reported Windows evidence | Windows preflight/native local MCP/listing capture, 11 Python + 2 bridge + 30 offline assertions passed in the local chat | Original Windows files unavailable here; preserve them. Native dispatch/receipt/spending and price/billing gates remain pending. |
| D027 | User-directed | Backup checks deferred | Keep DEFERRED_UNVERIFIED; no restore tests, drive writes or claim of readiness. |
| D028 | User-directed continuation | Proceed with independent Phase 1 foundation while live integration is blocked | Read-only RTL/dark shell, local runtime and initial schema can progress without quotes/AI/native schedules. |
| D029 | Implemented/tested subset | Local shell and initial schema pass cloud build/HTTP and isolated PostgreSQL ownership checks | Not a full Phase 1 release: Windows DB/login/private files/inbox/supervision and physical QA remain pending. |
| D030 | User-authorized / implemented | Next-phase manual trading core plus security prerequisites | See PHASE2_DELIVERY; Windows acceptance remains pending, no automatic data/AI/monitoring activation. |
| D031 | Implemented | Owner-protected configuration/data under local OS application-data paths, outside OneDrive/project; separate test setup | No project .env secrets; wizard/launcher tested in cloud. Actual Windows ACL/native installation remains unrun here. |
| D032 | Implemented API slice | Owner-authenticated POST /api/commands with bounded actions plus workspace/export/uploads reads | Preserves transactional SQL financial authority. Earlier REST contract remains a proposed wrapper/target, not implemented endpoints. No MCP ledger-write capability. |
| D033 | Explicit provenance | Manual instrument references, dates/marks, fees and JOURNAL_ONLY approvals only | No provider verification claim. Historical missing original stop leaves R null; estimated fees remain marked. |
| D034 | Tested dependency choice | Auth.js Credentials/JWT using next-auth 5.0.0-beta.32 + Argon2id and DB revocation/throttling | Prerelease library pinned and production HTTP flows tested; review library status on upgrades. No custom signing/crypto/reset web service. |
| D035 | Release boundary | Manual functionality developed; backups deferred, operational/native gates remain unresolved | Comprehensive WINDOWS_TODO is the current handoff; do not replace newer local bridge/status files or call full V1 complete. |

| D036 | User-authorized continuation | Start Phase 3 after Windows setup report | Implement independent diagnostic contract/quote guards while native source/billing gates stay blocked; no market acquisition or activation. |
| D037 | User-reported Windows acceptance | Automated checks and current-user-only test ACLs passed; interactive acceptance/personal setup pending | Preserve local WINDOWS_ACCEPTANCE/TASKS/VALIDATION_STATUS. Extracted Windows project has no Git metadata; do not claim transferred history. |
| D038 | Implemented/tested v0.3 boundary | Manual normalized quote diagnostics are transient and always ineligible for LIVE/EOD | Strict owner-only 16KiB JSON; no raw evidence retention, provider verification, ledger/inbox mutation or client-controlled trust/cost overrides. |

| D039 | User-authorized next-phase continuation | Implement independent Phase 4 manual plan-review workflow | Durable local requests/packets/imports may progress without pretending full Phase 3/raw native prerequisites passed. |
| D040 | Implemented/manual transport | Website stores jobs; owner copies a limited packet into native Codex and pastes an unverified response | No automatic bridge/AI invocation; sharing scope excludes balances/trades/emotions/images/credentials; external included-only controls remain user-verified. |
| D041 | Implemented isolation | Strict job/hash/reference schema, immutable inputs and plan/policy/journal-command revisions | Changes quarantine stale results; text truth/model identity remain unproven. Reviews cannot approve plans, mutate facts or create broker actions. |

| D042 | User-authorized next-phase continuation | Implement the independent inactive Phase5 scheduling/recovery foundation | No gate bypass: no native/OS task, actual monitoring, source request, signal or notification activation. |
| D043 | Implemented explicit provenance | Manual session/date/close scenarios never become an authoritative calendar | Both times are calculated with IANA zones; CLOSED has no probes; gaps remain unknown; corrections preserve versions. |
| D044 | Implemented rehearsal recovery | Manual DB-clock reconciliation blocks due work and suppresses expired work | Five-minute rehearsal policy is not production SLA; no actual sleep/native recovery proof. No financial/inbox mutation or alert replay. |

| D045 | User-authorized continuation/preference | Build Phase6 desktop test path; finish each handoff with next phase/count | Current next Phase7, two later numbered phases(7–8); incomplete acceptance remains explicit. |
| D046 | Implemented test-only scope | Default-off queued synthetic notification and one-shot Windows sender | Existing registered AppID only; no recurring task/module/permission/registry change, arbitrary message or trading alert. |
| D047 | Implemented evidence separation | ACCEPTED differs from human-reported receipt by test-bound challenge/context | No code/token leakage; five wrong attempts lock; UNKNOWN never auto-retries; physical display/Windows runtime remains unrun. |

| D048 | User continuation | Implement independent Phase7 analytics and manual weekly review slice | No native/model/data requests or paid fallback; next plannedPhase8, one later numbered phase8 plus unfinished acceptance. |
| D049 | Financial correctness/privacy | Pin CLOSED_TRADES_V1 complete closure cohorts to SQL projections/revision; keep historical inputs immutable | No500-row truncation or fabricated drawdown/returns; pinned-entry-only adherence, descriptive emotion coverage and opt-in aggregate sharing. |
| D050 | Manual transport | Persist weekly jobs and schema/hash/reference-bound imported commentary | No semantics/provenance/quota guarantee; stale current/late results explicit; no financial mutation, native dispatch or automatic subscription claims. |

| D051 | User continuation/publication | Implement independent Phase8 local readiness and push latest project source to GitHub | Explicit GitHub publication authorized; preserve remote history/agents, no source secrets/public website or integration activation. |
| D052 | Read-only acceptance boundary | Diagnostic PASS cannot mark native/Windows/device/backup gates accepted | Doctor only inspects existing settings/files/catalogs; WindowsACL manual, actual release ACCEPTANCE_PENDING; no repair/data/backup action. |
| D053 | Configuration/storage hardening | Separate roles/matching loopback targets, strict test setup and real private-root isolation | Fail closed instead of inherited personal fallback/shared admin authority; no applied-migration/dependency changes. |
| D054 | Final numbered phase | Zero later numbered phases after Phase8 development subset | Next milestone is real Windows/existing-gate acceptance; full Phase8/release remains incomplete with deferred recovery. |

## Superseded earlier recommendations

Hosted Supabase/Vercel, Massive Basic as default, Edge/Cron worker limits, paid OpenAI API model/token budgets, production database subscriptions and independent paid uptime provider are retired from the active plan. Historical research remains labeled for context only. Local Postgres preserves the schema's integrity concepts while replacing managed-auth/storage assumptions. Do not implement the old stack accidentally from an archived review.

## Required acceptance gates, still unrun

Native Codex installed-plugin access to narrow local bridge + original tool event provenance; no extra-credit/API fallback; IBKR free connector mode/history/universe/coverage; exact field units/timestamps and AAPL diagnosis; both calendar schedules and closed page execution; actual native/OS desktop notification; separate-medium restore; optional private iPhone HTTPS/PWA/push. See [VALIDATION_STATUS.md](VALIDATION_STATUS.md).

Zero recurring service fees excludes already paid Codex, existing computer/internet, electricity and hardware replacement. No subscriptions are changed automatically. Unsupported free capability becomes BLOCKED or an explicit user-reviewed scope adjustment, not a paid workaround.

## Approval record

Approved: revised local/no-additional-service plan, Phase 0, independent Phase 1, next-phase manual-core development, Phase 3 continuation under D036 and independent Phase 4 manual reviews under D039 and inactive Phase5 rehearsals under D042 and opt-in Phase6 desktop tests under D045 and independent Phase7 analytics/manual weekly reviews under D048 and Phase8 diagnostics/hardening plus latest-source GitHub push under D051. Current implementation is described in PHASE2_DELIVERY. Continue appropriate fixes/Windows acceptance without re-requesting the same authorization. Backup verification remains deferred; no fees, destructive drive actions, public exposure, brokerage execution or unresolved native automation activation. PHASE8_WINDOWS is the current cumulative update checklist; WINDOWS_TODO retains the remaining manual acceptance steps.
