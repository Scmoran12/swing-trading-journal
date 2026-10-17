# SwingPilot AI — Local UX and screen plan

Revision2, updated17 October2026. v0.8 adds protected dark Hebrew RTL Local readiness with actual DB check results and clearly separate pending native/device/deferred-backup gates. Source version matches package/health/footer/CLI. Previous manual journal/analytics/reviews/test notifications persist. No browser action activates or accepts integrations. Real Windows/keyboard/visual acceptance is unrun. PHASE8_DELIVERY/PHASE8_WINDOWS/LOCAL_RUNBOOK are current. Next milestone Windows acceptance/existing gates; zero later numbered phases, full acceptance still pending.

## 1. Information architecture and shared interaction rules

Desktop has a Hebrew RTL sidebar: dashboard, weekly scanner, research, plans, waiting for entry, active trades, journal, analytics and settings. Contextual trade details, notification center, login/recovery, onboarding and install/help complete the experience. Mobile layout has a compact header and dashboard/waiting/active/journal/More navigation; actual phone access requires the private-network/trusted-HTTPS gate.

Dark mode is the default from the first render on desktop and mobile, including login and onboarding, regardless of the operating system’s light/dark preference. Keep the initial page, loading states, dialogs and charts dark to prevent a light-theme flash on first visit or reload.

Use dark neutral surfaces, semantic tokens, readable Hebrew fonts, visible keyboard focus, clear status icons/text and 44×44 CSS px touch actions. Profit/loss includes a sign/label, never color alone. Aim for WCAG 2.2 AA critical journeys, 4.5:1 ordinary text contrast and 3:1 meaningful graphical controls. Set Hebrew language/RTL; isolate ticker/price/currency/formula fragments LTR, retain chart chronological time direction, use logical CSS. USD, exchange-session date, observation time and local display timezone are explicit. Charts expose accessible tables/units/time range/source.

**Local availability:** the top status strip shows local services, last successful check, next due check and machine/native Codex/plugin availability when known. Closing tabs is supported while the computer remains awake/online with required sessions/services running. Sleep/shutdown/offline/included-usage exhaustion causes visible missed/delayed/blocked jobs. Resume performs fresh reevaluation and suppresses obsolete entry messages; it never claims the machine was monitoring while asleep.

**AI request behavior:** request controls create a durable job awaiting Codex. UI shows queued/awaiting Codex/awaiting authorization/usage unavailable/running/waiting data/blocked/completed/failed, according to canonical job states. Instructions identify a supported explicit native Codex pickup action or validated scheduled workflow; no web button implies direct plugin/model API invocation or guaranteed instant completion. Native bridge routes are privileged tools, not browser endpoints. Stop/queue on included-usage limits with no credit purchase/fallback.

**Price/source behavior:** last/bid/ask each have verified observation timestamp, units, contract/session/source and NON_CONSOLIDATED coverage. Never label that source NBBO/full-market volume. The unresolved AAPL approximately 3.43 vs approximately 343 mismatch is shown as price verification needed; dependent financial/research/readiness features block, with no automatic ×100. MANUAL mark, validated live quote, completed EOD evidence, missing field and unknown price are distinct. Fetch time alone is not fresh observation time. A daily-close rule cannot be satisfied by a pre-close quote.

**Common states:** first loading/skeleton, refresh, empty, filtered-empty, stale/partial coverage, session expiry, forbidden, conflict and retry. Retain real holdings/history when data/AI fails; unknown numbers are unavailable rather than zero. Forms preserve unsaved inputs and show accessible errors. Idempotency/expected-version protects double taps and concurrent edits. Financial success appears only after committed server acknowledgment, never offline queued optimism.

**Notifications:** local inbox is authoritative; desktop sender accepted, observed OS display and user acknowledgment are separate states. Browser notifications alone do not promise delivery when all tabs close. Data/price/quota/failure notices contain no entry recommendation. LIVE_ENTRY_READY is advisory only after complete compatible data/risk gates; EOD_SETUP_REVIEW says review a completed-session setup for next session. Lock-screen/desktop payloads omit sensitive quantities/emotions by default. Desired iPhone private links may be unreachable off LAN; disclose network requirements even when push can arrive.

## 2. Complete screen specifications

### 1. Dashboard — `/dashboard`

- **Purpose:** show actual exposure, next action and local operating health.
- **UI:** ledger summary, active/waiting cards, dated valuations/source coverage, recent notices, last/next/missed check, Codex awaiting-job count and manual plan/buy shortcuts.
- **Data:** exact recorded quantity/cash/realized results; explicitly dated unrealized estimates; source/price-quality/coverage and local session/runtime status. No synthetic live portfolio values.
- **Actions:** open plan/position/notice, create manual plan, enter a dated manual valuation, inspect blocked/missed job, refresh local summaries.
- **APIs:** `GET /api/dashboard`, `GET /api/capabilities`, `GET /api/positions`, `GET /api/watchlist`, `GET /api/notifications`, `POST /api/portfolios/{id}/valuations`.
- **Entities:** profiles, portfolios, trades, trade_executions, portfolio_valuations/valuation_marks, watchlist_entries, jobs, monitoring_runs, entry_signals, notifications.
- **Loading/errors:** summary skeleton; real positions remain on quote failure; price mismatch/unknown mark is explicit; asleep gap and stale/expired Codex/IBKR auth display corrective action; empty journal prompts first manual record.
- **Mobile:** stacked summary/health cards, readable amounts and top actions; if private access unconfigured, install/help explains gated network route.

### 2. Weekly AI Scanner — `/scanner`

- **Purpose:** upload private stock screenshots and create an explicit Codex-backed candidate review.
- **UI:** local image picker/preview, bounded upload rules, awaiting-Codex progress, extracted editable chips/confidence, confirm/reject symbols, original/additional candidate sections and supported-universe coverage.
- **Data:** local upload metadata, extraction/proposal origin, validated identities, confirmed candidates, genuine screen scores/source/session and shortfall reasons.
- **Actions:** upload/cancel, request extraction, follow supported native pickup, edit/reject/confirm tickers, request bounded discovery and open research/plan.
- **APIs:** `POST /api/uploads`, `PUT /api/uploads/{id}/content`, authenticated `GET /api/uploads/{id}/content`, `POST /api/uploads/{id}/complete`, `POST /api/scans`, `GET /api/scans/{id}`, `POST /api/scans/{id}/confirm-tickers`, `POST /api/instruments/validate`, `GET /api/jobs/{id}`.
- **Entities:** uploads/private local files, scan_batches/candidates, instruments, jobs, ai_runs/inputs, provider_fetches and market_snapshots/evidence.
- **Loading/errors:** separate upload/awaiting Codex/extraction/confirmation/screening; unsupported file, ambiguous symbol, missing raw source/history, expired plugin auth and quota states; unsupported universe returns fewer candidates honestly.
- **Mobile:** native picker and stacked chips; sticky confirmation; local file access stays authenticated. Phone upload requires proven private HTTPS/access, never implied external hosting.

### 3. Stock Research — `/research/[symbol]`

- **Purpose:** examine exact source evidence and data quality before a plan.
- **UI:** listing/contract header, separate last/bid/ask with times, NON_CONSOLIDATED badge, price-quality panel, charts/OHLC table only when supported, indicators/sector/liquidity/history coverage, source references and manual/generate actions.
- **Data:** exact raw field provenance/units/session/time; documented history adjustment/corporate-action status; deterministic supported indicators; explicit missing sector/universe/volume information.
- **Actions:** inspect evidence/quality reason, request verified no-charge refresh, review manual source import, create manual plan or persist plan-generation job; no paid snapshot/subscription action.
- **APIs:** `GET /api/instruments`, `GET /api/instruments/{instrumentId}`, `GET /api/research/{instrumentId}`, `POST /api/research/{instrumentId}/refresh`, `POST /api/market-data/imports`, `GET /api/market-data/quality/{assessmentId}`, `POST /api/plans`, `POST /api/plans/{id}/generate`.
- **Entities:** instruments, provider_fetches/raw-source and price-quality records, market_bars, market_snapshots/items, corporate_actions, jobs, ai_runs and trade_plans.
- **Loading/errors:** awaiting Codex/source state; unresolved AAPL mismatch blocks derived values/readiness; absent timestamp/history/actions hides affected indicators; source/charge uncertainty blocks request; factual panels remain when narrative fails.
- **Mobile:** full-width optional chart, readable quote rows, source/quality bottom sheet and accessible table; no hover-only evidence.

### 4. Trade Plan Editor — `/plans/[id]`

- **Purpose:** author/review one exact plan version with deterministic validation and explicit mode.
- **UI:** entry/condition/zone, stop/invalidation/targets, thesis/risks/horizon, risk preview/coverage, JOURNAL_ONLY vs eligible LIVE/EOD conditions, source inputs, editable-vs-active approval labels, save/approve/generate progress.
- **Data:** immutable versions, manual/validated observation basis, fee/capital settings snapshot, errors/risk constraints and active monitored approval. Draft edits do not silently replace active approval.
- **Actions:** edit/save/diff, request Codex proposal, review merged result, update manual marks, validate/approve exact version, pause monitoring or archive.
- **APIs:** `GET /api/plans/{id}`, `GET /api/plans/{id}/versions`, `POST /api/plans`, `PATCH /api/plans/{id}`, `POST /api/plans/{id}/validate`, `POST /api/plans/{id}/approve`, `POST /api/plans/{id}/archive`, `POST /api/plans/{id}/generate`, `POST /api/portfolios/{id}/valuations`.
- **Entities:** trade_plans, plan_versions/targets/approvals, portfolios, portfolio_valuations/marks, instruments, jobs/ai_runs, raw market evidence and watchlist_entries.
- **Loading/errors:** saving distinct from awaiting Codex; field errors; quote scale/time/coverage failures block dependent monitored approvals; manual marks only JOURNAL_ONLY; concurrent result remains a reviewable proposal; unsaved input retained after conflict/failure.
- **Mobile:** grouped accordion, numeric keyboard, sticky save/review action, complete risk/mode review before approval; no tiny target grid.

### 5. Waiting for Entry — `/watchlist`

- **Purpose:** review approved setups and trustworthy monitoring/exception states.
- **UI:** status filters, approval version, condition mode, source/quality/as-of, last/next/due/missed/blocked check, expiry/invalidation reason, history, pause/resume/reapprove/record-purchase actions.
- **Data:** WAITING/PAUSED/INVALIDATED/EXPIRED/ENTERED; independent job/price-data/authorization/quota status; LIVE readiness only after all compatible gates, EOD review only after completed history.
- **Actions:** pause/resume valid approval, inspect source/run, request supported manual review, reapprove, record actual broker fill including explicit deviation acknowledgment on expired/paused/invalidated plan.
- **APIs:** `GET /api/watchlist`, `GET /api/watchlist/{id}/evaluations`, `PATCH /api/watchlist/{id}`, `GET /api/monitoring/status`, `POST /api/monitoring/reviews`, `POST /api/watchlist/{id}/purchases`, `POST /api/plans/{id}/approve`.
- **Entities:** watchlist_entries, plan_approvals/versions, jobs, monitoring_runs/evaluations, entry_signals, raw market evidence, trades, execution_batches/executions/emotions.
- **Loading/errors:** refresh retains prior state; data/price/charge/native-dispatch failures never become entry alerts; missed sleep check and fresh reevaluation status visible; JOURNAL_ONLY clearly unmonitored; no stale messages replay after wake.
- **Mobile:** stacked cards, filters, large evidence/purchase action, full-screen purchase form; desired private notification deep links remain gated.

### 6. Active Trades — `/positions`

- **Purpose:** manage actual recorded exposure even when plans, native sessions or prices fail.
- **UI:** quantity, FIFO remaining basis, dated mark, realized/unrealized source coverage, original/current risk/stop, review flags and latest advice job/status.
- **Data:** ledger-derived positive net shares, frozen first-entry/plan/risk, fees/results, current stop and verified/manual mark provenance; position persists through plan expiry/archive/AI EXIT.
- **Actions:** open detail, ADD plus emotion, partial/final exit, stop event, request Codex advice, add note or reconcile missing fill.
- **APIs:** `GET /api/positions`, `POST /api/positions/{id}/buys`, `POST /api/positions/{id}/exits`, `POST /api/positions/{id}/stop-changes`, `POST /api/positions/{id}/recommendations`.
- **Entities:** trades, trade_executions, execution_batches/allocations/emotions, trade_management_events, plan_approvals, portfolio_valuations/marks, jobs/ai_runs and raw evidence.
- **Loading/errors:** known inventory remains while quote/native source fails; invalid mark is unavailable P&L; advice awaits Codex/authorization/quota; oversell/conflict preserves form; REVIEW_REQUIRED highlights uncertainty without hiding actual holding.
- **Mobile:** cards prioritizing quantity/stop/exposure, expandable basis/source, accessible management sheet with explicit record labels.

### 7. Individual Trade Details — `/positions/[id]`

- **Purpose:** preserve traceable execution, emotion and management history.
- **UI:** ACTIVE/CLOSED plus reconciliation flag, plan/risk reference, fill/fee/FIFO ledger, emotions/notes, stop/adherence timeline, advice history, optional dated chart, buy/exit/correction review.
- **Data:** append-only original/reversal/replacement events, net quantity/basis/P&L, frozen original R, actual time vs recorded time, source/ledger revision used for advice; unknown marks/R explicit.
- **Actions:** record actual fills/exits/stop/note, choose emotion, acknowledge actual risk breach, inspect source and recommendation freshness, correct with reason/preview, export trade.
- **APIs:** `GET /api/positions/{id}`, `GET /api/positions/{id}/executions`, `GET /api/positions/{id}/management-events`, `POST /api/positions/{id}/preflight`, buy/exit/stop/recommendation routes, `POST /api/executions/{id}/corrections`, `POST /api/positions/{id}/notes`.
- **Entities:** trades, trade_executions, execution_batches/allocations/emotions, trade_management_events/notes, plan_versions/approvals, jobs/ai_runs and valuation/market evidence.
- **Loading/errors:** independent panels remain usable; actual fill writes independent of Codex/IBKR health; invalid chronological inventory/correction blocks commit; advice from older ledger marked stale; final close only after committed zero quantity.
- **Mobile:** timeline/labeled ledger rows, optional chart collapse, full-screen transaction review; mandatory explicit emotion on every BUY/ADD.

### 8. Trading Journal — `/journal`

- **Purpose:** find actual trading decisions/results and self-reported context.
- **UI:** date/status/symbol/emotion/adherence filters, history/cards/notes, corrections, explicit UNKNOWN/DECLINED coverage, weekly review job and export controls.
- **Data:** actual effective fills/fees/results, user emotions/notes, frozen plan comparison, included/excluded records and Codex review source/revision.
- **Actions:** filter/open trade, append or amend note with history, request weekly review awaiting Codex, export owned data; commentary never edits executions.
- **APIs:** `GET /api/journal`, `POST /api/positions/{id}/notes`, `POST /api/analytics/reviews`, `POST /api/account/export`, `GET /api/exports`, `GET /api/jobs/{id}`.
- **Entities:** trade_notes, execution_emotions, trades/executions/allocations, plan_approvals, trade_management_events, jobs/ai_runs and export manifests/files.
- **Loading/errors:** empty/filtered-empty; insufficient sample; unknown/declined excluded from directional patterns; pending/quota/native-session review stays visible; failed export retains records and retry information.
- **Mobile:** readable cards and filter sheet, large note editor, local unsaved draft clearly labeled; financial commands require explicit commit.

### 9. Performance Analytics — `/analytics`

- **Purpose:** inspect reproducible results and cautious evidence-linked behavior insights.
- **UI:** date/cohort filters, closed/partial/open basis, fees-inclusive metrics, valid R/drawdown charts, source/sample/exclusion panel, separate Codex review card and drill-through.
- **Data:** effective ledger results, capital-flow semantics, complete dated manual/validated marks where needed, original-risk validity, emotion/adherence counts and minimal review manifest.
- **Actions:** choose cohort, inspect definitions/source trades, request performance/psychology/weekly job, review earlier results, export deterministic numbers and provenance.
- **APIs:** `GET /api/analytics/performance`, `GET /api/analytics/psychology`, `POST /api/analytics/reviews`, `GET /api/analytics/reviews`, `GET /api/ai-runs/{id}`, `POST /api/account/export`.
- **Entities:** trade_executions/allocations, trades, capital_adjustments, portfolio_valuations/marks, execution_emotions, trade_notes/management_events, plan_approvals, jobs/ai_runs.
- **Loading/errors:** true zero vs no history, unknown R/valuation and insufficient sample; no cash-only curve disguised as equity; native queue/quota state; no invented narrative or assumption that a click invokes a model instantly.
- **Mobile:** one chart/row, labeled metrics with explanations, accessible table and source drilldown without hover.

### 10. Settings — `/settings`

- **Purpose:** configure future risk, own login, availability, data ownership and local operating preferences.
- **UI:** risk/cash/valuation forms, locale/timezone, local service/startup/backup health, Codex/plugin capabilities, feed/charge/coverage summary, inbox/desktop preferences, conditional phone setup, exports/recovery help.
- **Data:** policy/version/effective date, journal cash/source, last backup/restore proof, next/last check, supported native capabilities and usage state when available, current verified entitlement; never native credentials/account IDs.
- **Actions:** save future preferences, record auditable cash event/manual mark, enable permitted desktop categories/test, export, rotate own password/recover via verified local OS-owner process, inspect blocked capabilities; phone subscribe only after gate.
- **APIs:** `GET/PATCH /api/settings`, `GET /api/capabilities`, `GET /api/portfolios/{id}`, `POST /api/portfolios/{id}/capital-adjustments`, `POST /api/portfolios/{id}/valuations`, `POST /api/desktop/test`, `POST /api/account/export`, `GET /api/exports`; conditional `/api/push/*`; maintained `/api/auth/*`.
- **Entities:** profiles/local identity sessions, portfolios/capital_adjustments/valuations/marks, jobs, audit_events, notification_outbox/notifications and conditional push_subscriptions.
- **Loading/errors:** invalid policy/cash/mark, conflicts, failed backup/no separate medium, local service unavailable, expired native auth/quota, desktop denied, phone gate blocked. No "buy credits"/paid upgrade or hidden credential import; preference edits never rewrite historical risk/cash.
- **Mobile:** stacked labeled sections and numeric keyboard; manual data edit remains gated by verified local access/auth.

### 11. Own login and local recovery — `/login`, `/recovery`

- **Purpose:** protect the local ledger and provide a verified OS-owner recovery procedure.
- **UI:** single-owner sign-in, session status and rate-limit errors, local recovery instructions; no open signup, paid email/magic-link reset or native Codex cookie sharing.
- **Data:** app session only before login; no portfolio/native credentials. App identity is distinct from existing Codex/IBKR sign-in.
- **Actions:** authenticate, sign out, follow verified local OS-owner password recovery/rotation, return to a validated internal route.
- **APIs:** maintained Auth.js `/api/auth/*`, `GET /api/me`; recovery uses the documented local owner procedure with server verification, not an unauthenticated financial-data reset endpoint.
- **Entities:** app-owned user/password hash/session records, profiles, audit/security events; Argon2id and standard session integration, no homemade cryptography.
- **Loading/errors:** submission, generic failure, rate limit, expired session and unavailable local server; recovery cannot bypass ownership or disclose stored values; accessible error/focus and return path.
- **Mobile:** autofill/zoom/touch-safe form over proven trusted private HTTPS; unsafe/unconfigured LAN access is blocked rather than accepted.

### 12. First-use onboarding — `/onboarding`

- **Purpose:** establish local operating prerequisites and usable financial defaults.
- **UI:** short steps for own-account/local availability, USD funding/risk, source modes/included usage, backup medium/recovery and desktop notice test; phone help is optional/conditional.
- **Data:** capital/policy/timezone, current capability and gate status, separate backup location/last restore, explicit runtime limits; no fictitious successful native integration.
- **Actions:** set validated initial funding/preferences, perform permitted desktop test, review backup requirement and manual first plan, finish/resume. No forced push or paid subscription.
- **APIs:** `GET /api/me`, `GET /api/capabilities`, `GET/PATCH /api/settings`, `POST /api/desktop/test`; first funding follows portfolio/capital contracts.
- **Entities:** profiles, portfolios/capital events, audit_events, capability/gate status, jobs, notification_outbox/notifications.
- **Loading/errors:** retain step on failure; no hidden defaults for risk/availability; missing backup/Desktop proof flagged before release; native/phone blockers allow honest manual scope but never fake success.
- **Mobile:** one concise step/viewport, accessible progress and navigation; actual device access remains private HTTPS-gated.

### 13. Notification center — `/notifications`

- **Purpose:** retrieve durable alerts and delivery evidence regardless of desktop/phone transport.
- **UI:** unread/category/time filters, setup/source/as-of and condition-mode labels, failure/price/quota/sleep notices, accepted/displayed/read badges, protected link and preferences.
- **Data:** logical event/signal/session/version, raw evidence age/quality, outbox attempts, desktop display where verifiable and user acknowledgment. Live review and EOD next-session review are visibly distinct.
- **Actions:** inspect evidence/current validity, mark read/acknowledge observed delivery, manage desktop categories, open position; never place a broker order or auto-record a fill.
- **APIs:** `GET /api/notifications`, `PATCH /api/notifications/{id}`, `GET /api/notifications/{id}/deliveries`, `POST /api/notifications/{id}/acknowledge`, `GET/PATCH /api/settings`, linked watchlist/position APIs.
- **Entities:** notifications, notification_outbox/delivery records, entry_signals, monitoring_runs/evaluations, jobs, profiles and conditional push_subscriptions.
- **Loading/errors:** unread-empty/failed fetch; sender accepted without observed OS display is not delivered-to-user; obsolete alert shown expired with no action prompt; private phone link off network has clear reachability guidance.
- **Mobile:** concise timestamped cards/minimal payload and touch target; no implication remote access persists off LAN or while computer sleeps.

### 14. Desktop notification and conditional iPhone setup — `/install`

- **Purpose:** explain desktop closed-tabs behavior and evaluate desired private phone install/push honestly.
- **UI:** tested OS mechanism/status, desktop test action, supported capabilities, private-network/trusted-HTTPS checklist, iPhone Home Screen/permission steps only if supported, blocked-state reason/troubleshooting.
- **Data:** local runtime/channel capability, observed desktop test status, actual phone trust/permission/network state, conditional masked device subscriptions. Native acceptance and observed device display remain distinct.
- **Actions:** run an authorized non-trading desktop test, acknowledge display, follow supported private setup/install, explicitly permit/register/unsubscribe phone and send one test only after zero-fee gate.
- **APIs:** `GET /api/capabilities`, `POST /api/desktop/test`; conditional `GET /api/push/config`, `POST /api/push/subscriptions`, `DELETE /api/push/subscriptions/{id}`, `POST /api/push/test`; manifest/service-worker assets only when enabled.
- **Entities:** notifications/outbox/delivery records, jobs, profiles/preferences, capability/validation records, conditional push_subscriptions; install detection partly device-local.
- **Loading/errors:** desktop/session unavailable; not installed, denied permission, untrusted HTTPS, unsupported iOS, off-LAN link, blocked no-fee route and expired subscription; no paid tunnel/domain/Apple membership suggestion as implicit prerequisite.
- **Mobile:** large tailored installation steps after capability check; trust/network requirements explicit; push arrival cannot promise private link reachable away from home or monitoring while computer sleeps.

## 3. Financial transaction and advice interactions

Record purchase requires actual shares/price/time/fees, original approval/context and explicit per-BUY emotion. The user can honestly select UNKNOWN with required unavailable/cannot-recall reason or DECLINED; no silent neutral selection. Above-limit/out-of-zone actual fills show breach acknowledgment and persistent flag so real exposure is never hidden. Atomic ledger/emotion/position/watchlist/audit commit and idempotent replay prevent half saves/double taps. Financial writes work without native Codex/IBKR being online.

Exit form shows available shares and FIFO fees-inclusive estimate; actual partial sell leaves ACTIVE, final zero closes only after commit. Stop events preserve original R and never claim to update a broker order. ADD repeats emotion; already-held instrument routes to existing trade. Correction shows original, reversal/replacement, reason, chronological effects and before/after result; conflicting/impossible inventory cannot partially commit.

Advice card has enum, reason/fact IDs/source/time/coverage, pinned ledger revision, assumptions/missing data and proposed change. An older ledger or price-blocked input produces stale/review-required status. "Use proposal" opens an editable form; no advice writes trades/stops/approvals. Request progress remains awaiting Codex when native pickup/session/quota is not available. No billing upgrade/fallback is offered.

## 4. Accessibility and verification acceptance

Review all 14 screen categories for keyboard/focus/labels/contrast, Hebrew bidi/RTL, 360 px viewport, zoom and chart/table alternative. Run actual local login/financial/correction journeys. Test computer awake with every tab closed for desktop display, then sleep/wake/offline/native-auth/quota failures and fresh reevaluation. Include unresolved AAPL scale/missing time/partial volume/history, concurrent edits/double fills, advice awaiting/stale results and truthful private-network/iPhone denied/untrusted/off-LAN states.

Plans/tests are proposed and UNRUN. Mobile/automatic/native capabilities need actual Gate 0/phase evidence before success badges or promises. Product copy describes the practical next action in Hebrew; technical code/enums above are implementation contracts rather than text forced into the user's flow.

## Implemented Phase7 analytics and weekly interaction

`/analytics`: apply inclusive Jerusalem closure-date filters, inspect fee-inclusive count/net/win/mean/profitfactor/R coverage, ADD segments, narrow pinned-entry comparison and descriptive first-batch emotion tables. Source rows link to owned trade detail and name calendar duration/UTC timestamps. Missing historical portfolio valuation blocks return/drawdown charts; bars duplicate numeric source P&L only.

Create a durable weekly/performance review from the displayed range/revision with sharing acknowledgment. Emotion aggregates opt in separately. Open reduced packet, copy manually to included Codex only if available, and paste/review plain JSON; usage/auth/bridge pause/resume/cancel/history visible. All imported prose labeled unverified; stale snapshots exportable, current transfer blocked after changes. Local snapshot export explicitly includes private trade/emotion details; packet excludes those. Keyboard table overflow/captions/headers implemented; actual visual/keyboard/narrow-screen Windows checks pending. No native/model/market request is made by UI actions.

## Phase8 local readiness interaction

The new Local readiness navigation item opens a protected darkRTL server page showing actual DB permission/version/listener checks and observation time. Failed DB inspection becomes a safe status, not a credential-bearing error. External pending/native/device/conditional/deferred-backup gates are clearly separate static conservative states; no click enables or marks them accepted. The page links back to settings and the existing explicitly opt-in desktop test path.

Filesystem/migration-hash/WindowsACL steps are performed using localdoctor and PHASE8_WINDOWS, outside website financial flows. Source version is consistent with package/footer/health. Actual visual/keyboard/Windows acceptance is still pending. Zero later numbered phases; remaining work is actual acceptance/existing gates rather than a claim of integrated production completion.
