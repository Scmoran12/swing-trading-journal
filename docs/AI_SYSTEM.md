# SwingPilot AI — AI and quantitative intelligence design

Revision2, updated17 October2026. Implementedv0.7 AI-related behavior is durable manual-copy plan/weekly review requests and bounded, unverified commentary imports. No model/API/bridge dispatch or account spending enforcement runs in the website. Native bridge/generation/market/automatic modules below remain design targets requiring independent capability/no-charge proof. Local interface/PostgreSQL/files/calculations run on the Windows computer; this cloud workspace cannot verify that PC. Existing included Codex usage only; no credit/paid-data fallback. PHASE7_DELIVERY gives actual scope and limitations.

## Boundaries and common contracts

All modules accept locally authenticated, owner-scoped inputs. Internal jobs carry a narrowly scoped identity and explicit portfolio/user IDs. A local tool/MCP bridge exposes permitted jobs, minimal journal bundles, authorized screenshots, draft/analysis submission and evidence references. Native Codex is not assumed callable from Next.js or able to export its private plugin authorization to the server. The bridge supplies neither database credentials nor arbitrary SQL, account-password/cookie extraction, unrestricted filesystem access, approval commands or execution tools. Native IBKR calls are limited to verified read-only market/reference tools. OCR text, files and journal text are untrusted data, including text that resembles instructions. There is no brokerage execution in V1.

A website request persists an `AWAITING_CODEX` job. An explicit native Codex invocation, or a separately proven supported scheduled invocation, claims a bounded bridge lease, reads the authorized input, obtains permitted evidence and submits serialized results. The server validates owner/job/version hashes and saves an AI draft or analysis; only the owner approves plans or records actual fills. If the bridge is unavailable, expose `BRIDGE_UNAVAILABLE` and an explicit reviewed import/manual workflow. Fully automatic monitoring remains BLOCKED until G0-L1/G0-L4 prove the supported native dispatch and raw evidence path. A website button is not a synchronous hosted AI endpoint.

Use included subscription usage only. `USAGE_LIMIT_REACHED`, `AUTH_REQUIRED`, entitlement uncertainty or unavailable native access pauses/queues affected jobs. Never automatically buy credits, enable overage, switch to an API key, add paid entitlements or retry endlessly. A queued job becomes visibly late/stale; resuming does not turn an old quote into a fresh one. Deterministic local journal/calculation features continue while native AI/plugin jobs are unavailable.

The backend distinguishes four data types throughout the UI and saved results:

| Type | Meaning | Example |
| --- | --- | --- |
| Observed | Exact value from a provider or recorded user event | Dated regular-session close; recorded BUY fill |
| Calculated | Reproducible result of a versioned calculation | ATR, sizing, realized P&L |
| Proposed | A suggested future level or user decision | Suggested stop; revised target |
| Interpreted | AI explanation grounded in referenced evidence | A possible concentration concern |

An evidence item carries owner, `source_id`, instrument/contract ID (`conId` when available), provider/tool/dataset, exact raw-envelope reference/hash, capture mechanism, fetch time, field-specific observed time, units/currency, exchange session, feed coverage, adjustment policy and quality state. Hashes detect changes; they do not prove that model-written JSON came from a broker. G0-L1 must prove a supported tool-event/raw-result transport into the bridge. A model's retyped price, copied prose or fabricated “raw envelope” is not trusted automated ingress. User-reviewed imports remain explicitly user-imported, source-referenced evidence; they do not establish an automatic real-time feed or unblock unattended monitoring.

Current primary coverage is IBKR US `REALTIME` `NON_CONSOLIDATED` as observed in limited prior quotes and user-reported current settings. This does not establish consolidated NBBO, consolidated volume, every instrument, history/corporate actions or free billing for all connector request types. G0-L2 must verify allowed no-additional-fee tools before bulk acquisition; do not request paid regulatory snapshots or change subscriptions. Missing history disables dependent indicators and screens; missing metadata/events remains unavailable. Prices, indicators and history are never invented.

AAPL's previously observed raw last around 3.43 versus bid/ask around 343 is an unresolved scale/serialization defect. Do not multiply by 100, choose the convenient field or declare it repaired from plausibility. Exact raw envelopes, documented units, verified observation times, contract identity and compatible broker/reference evidence must pass PRICE_VALIDATION. Until then, affected prices cannot enter sizing, AI numeric market claims, valuations or live setup signals. Last, bid and ask are distinct observations; no field inherits another field's timestamp or is silently relabeled NBBO.

An AI run envelope contains `run_id`, owner/job/lease, `execution_mode=NATIVE_CODEX`, module, input/evidence hashes, prompt/schema versions, observable native client/model identifiers (unknown if unavailable), engine/screening versions, start/end times, status, quality flags and accepted output. Record job counts, wall time and visible quota/reset state where available; no API token prices or invented subscription usage telemetry. Results persist locally in `ai_runs`/`ai_run_inputs`; immutable versions reference them. Cache only against identical authorized input/version hashes with a freshness policy. New evidence creates a new run. Quote acquisition and language-model interpretation remain separately auditable.

Native Codex submits serialized output to a strict local JSON Schema: required fields, bounded lengths/lists, enums, nullable missing values and no additional properties. Do not presume an API structured-output facility: serialization is a task contract, and the local validator rejects malformed output. Every result passes owner/job/lease/version checks, schema validation, authorized evidence/value checks and deterministic domain validation. Observed numerics refer to an exact field path in accepted source evidence; locally calculated fields refer to engine inputs/results. JSON structure alone is not financial or provenance proof. At most one bounded repair may be requested within included usage; otherwise preserve the prior valid draft and expose an error/paused job. AI submission permissions write drafts/analysis history only and cannot approve a plan, record a BUY/SELL, change a stop or alter capital.

## Implemented Phase 4 manual review slice — v0.4

The owner-only `/reviews` workflow stores a manual request for an existing plan, not the market-backed generator/advisor modules below. GET/POST `/api/reviews` and GET `/api/reviews/{id}/packet` use the owner's web session, not a native bridge token. Requests are durable; owner manually copies a limited plan packet into native Codex and imports a response. The site does not run models/tools or enforce billing in another chat. No cash/trades/emotions/images/credentials are included in the packet; manually entered text needs owner privacy review. Prompts treat embedded instructions as untrusted data. Strict local response schemas bind exact job/hash/fact IDs and reject extra price/order/approval fields, but **do not prove prose truth or model origin**. Findings remain unverified commentary and cannot write plans/approvals/ledger/stops. There are no automatic market requests or confidence-derived readiness states.

States: AWAITING_CODEX, owner-reported PAUSED_USAGE/PAUSED_AUTH/PAUSED_BRIDGE, REVIEW_READY, STALE_RESULT, CANCELLED. Eight pending/500 retained jobs per owner; immutable original input and response, append-only events and idempotent state commands. Plan, policy, expiry and journal-command revision changes stale the request; export fails closed, late responses remain historical. Paused requests cannot export/import until explicitly resumed; terminal responses/cancellations cannot be rewritten. Actual included-only account controls/native review effectiveness remain Windows gates. See PHASE4_DELIVERY and PHASE4_WINDOWS. Full modules below remain proposed unless separately evidenced.

## Eight modules

Resource figures below are proposed local workload limits, not measured performance, free-unlimited promises or token-billed prices. Native AI jobs run on explicit requests or an accepted opt-in schedule and consume included Codex capacity. Screening arithmetic and rule evaluation run locally without AI; acquiring IBKR evidence through native plugins may still depend on native availability/usage. Current tool billing, request limits, supported history and exact bridge capture must be proven before automated data acquisition.

| Module | Primary responsibility | AI usage | Authoritative output |
| --- | --- | --- | --- |
| Screenshot Analyzer | Extract candidate symbols and evidence locations | Vision/OCR extraction | User-confirmable candidates, never automatic instrument identity |
| Market Research Engine | Assemble observed bars, metadata and calculated indicators | Optional explanation | Versioned evidence snapshot |
| Stock Discovery Engine | Rank an eligible stock universe deterministically | Optional explanation of selected candidates | Reproducible ranked screening result |
| Trade Plan Generator | Propose a structured draft | Structured generation | Validated, unapproved plan version |
| Entry Monitoring Engine | Evaluate approved predicates and current risk | No AI reasoning; native plugin evidence acquisition may need Codex | Quality-gated LIVE_ENTRY_READY or completed-history EOD_SETUP_REVIEW |
| Active Trade Advisor | Explain position choices from current evidence | Structured analysis | User-reviewable HOLD/REDUCE/EXIT/ADD/REVIEW_REQUIRED proposal |
| Trading Psychology Analyzer | Describe recorded behavior and emotions | Opt-in aggregate interpretation | Nonclinical, uncertainty-labeled observations |
| Performance Analyzer | Summarize deterministic journal metrics | Optional explanation | Reproducible metrics and hypothesis list |

### 1. Screenshot Analyzer

| Contract | Design |
| --- | --- |
| Input | Owner-scoped local upload IDs, checksums, scan batch and optional notes. Validate raster type, decode/pixel/size limits and strip unnecessary metadata before the bridge exposes the image. |
| Output | Extracted text, candidate symbol, image/bounding-box reference, confidence/ambiguity and resolved instrument/contract ID or unresolved status. User confirms identity beside the screenshot crop. |
| External data | Native Codex image access through the authorized bridge; IBKR contract/reference tools only if no-fee access and raw capture are proven. OCR is not proof of eligibility or current price. |
| Model role | Use included native vision capabilities to extract plausible symbols with uncertainty. Do not infer missing prices or silently resolve ambiguous tickers. |
| Deterministic work | Normalize/deduplicate symbols; validate NYSE/Nasdaq stock identity and contract mapping; separate OCR candidates from owner-confirmed/provider-validated identities. |
| Trigger | Website upload/scan creates an AWAITING_CODEX job; explicit native invocation or proven scheduled dispatch processes it. Confirmation/edit needs no new native run. |
| Database | Local uploads, scan_batches, scan_candidates, instruments, ai_runs and ai_run_inputs; local private files outside repository/webroot. Keep extraction and confirmations separately auditable. |
| Estimated usage | Proposed maximum 5 images and 50 candidates per user scan, 2 MB per processed image, one bounded native job per supported batch. Native capability/limits are a gate, not an API subscription. |
| Failure | Bridge/vision unavailable, quota/auth pause, unreadable files, ambiguity and unresolved contracts show explicit states. Manual symbol entry remains usable; no paid fallback or unconfirmed analysis advancement. |
| Tests | Labeled screenshots with Hebrew text, dense tables, class symbols, duplicates, injection and poor images; separate extraction precision/recall from identity accuracy. Target ≥95% accepted-symbol precision and zero silent known ambiguity on an agreed corpus; test local owner/file isolation and quota pauses. |

### 2. Market Research Engine

| Contract | Design |
| --- | --- |
| Input | Confirmed instrument/contract, requested LIVE_QUOTE or REGULAR_SESSION_EOD scope, as-of session and evidence policy. |
| Output | Immutable accepted raw quote/history references, typed observations, locally calculated available indicators, field timestamps/coverage and optional cited explanation. Unavailable inputs remain null. |
| External data | Primary existing IBKR REALTIME NON_CONSOLIDATED quotes via native plugin; licensed regular-session history, sector/contract metadata, calendar and corporate actions only after coverage/no-fee/raw-capture gates. No presumed news/fundamental service. |
| Model role | Request permitted read-only native tools and optionally explain accepted evidence. It neither fixes raw scaling nor manufactures a captured envelope/history/indicator. |
| Deterministic work | Local PRICE_VALIDATION, contract/units/timestamp/session/coverage checks, raw-envelope normalization, history completeness and indicators. NON_CONSOLIDATED quotes are not NBBO or finalized daily candles. |
| Trigger | User research/enrichment/advice request queues native evidence acquisition. Local cache reuse is allowed only for its declared timeframe; refresh requires a new genuine captured result. |
| Database | Owner-scoped provider_fetches, live_market_observations, market_quality_assessments, market_bars/snapshots/items, instruments, exchange_sessions/corporate_actions and optional ai_runs. |
| Estimated usage | Bounded quote requests for owned watchlist/research set, deduplicated per source/timeframe. Proposed daily history target 260 completed bars per instrument only if supported within existing entitlements; no bulk all-market promise. |
| Failure | AUTH_REQUIRED, USAGE_LIMIT_REACHED, BRIDGE_UNAVAILABLE, ENTITLEMENT_UNVERIFIED, PRICE_VALIDATION_FAILED and missing history pause/block dependent features. Preserve raw failures; no heuristic ×100 or paid secondary provider. |
| Tests | Exact raw-event transport; model-retyped payload rejection; AAPL scale discrepancy; independent last/bid/ask times; contract mismatch; stale/partial feed; unsupported history/volume; OHLC/corporate-action/indicator goldens and no-fee connector smoke test as future gates. |

Indicator proposals for V1 are versioned and not claims of predictive benefit: SMA20/SMA50/SMA200 use the trailing completed-session arithmetic mean; EMA uses `alpha = 2/(n+1)` with a documented SMA seed; true range is `max(H-L, abs(H-prevClose), abs(L-prevClose))`, ATR14 uses a 14-period SMA seed and Wilder recursion; RSI14 uses Wilder-smoothed gains/losses, returns 100 for positive average gain with zero average loss, 50 for both zero. Twenty-session average dollar volume is `mean(rawClose * rawVolume)` over completed sessions with independently verified volume coverage. A NON_CONSOLIDATED partial-volume quote cannot satisfy a consolidated-liquidity predicate. All indicator periods require supported licensed history and sufficient warm-up; unavailable indicators cannot pass a screening rule. Pin these conventions rather than rely on a library name.

Use split-adjusted OHLC and corresponding split-adjusted volume for comparable historical trend/ATR calculations. Do not use dividend-adjusted total-return levels as tradable entry/stop prices. Current entry/stop comparisons use executable price units aligned with the current raw bar; record the conversion/adjustment factors and reject mismatches. Preserve the exact historical snapshot used by a plan or screen, including any point-in-time limitation. Historical signal research must use information available at that time; an adjustment revised later must not rewrite recorded monitoring evaluations.

### 3. Stock Discovery Engine

| Contract | Design |
| --- | --- |
| Input | Confirmed uploaded instruments, explicitly documented supported universe, evidence session, screening version, exclusions and feature coverage. |
| Output | Up to five distinct additional qualified candidates with evidence/rank components, exclusion reasons, tested-universe/coverage counts, requested_count=5, returned_count and shortage_reason. |
| External data | Only symbols/reference/history available through verified included IBKR tools or separately labeled reviewed imports. Free exhaustive universe/grouped data, consolidated daily volume, sectors and history are unproven. |
| Model role | Optional included-native explanation of final deterministic candidates; cannot create a universe, fill missing features or select rejected names to reach five. |
| Deterministic work | Eligibility, deduplication, full-history trend/volatility checks and ranking locally. Proposed price≥$5, close>SMA50>SMA200, ATR/close 1–8%; 20-session dollar-liquidity≥$10m only with proven appropriate volume coverage. Unsupported configured features block qualification rather than pass. |
| Trigger | Weekly owner scan after ticker confirmation; queue bounded native evidence enrichment only for verified no-fee endpoints. No automatic broad market sweep while billing/coverage is unknown. |
| Database | scan_batches/candidates, owner-scoped source manifests, quality assessments and native ai_runs for optional explanations. Store universe/config version, history/feature counts, exclusions and each candidate provenance. |
| Estimated usage | Proposed bounded supported research universe/enrichment budget of 40 instruments, configurable downward for native quotas and connector limits. Local work scales with tested instruments×bars; one optional shortlist explanation job. |
| Failure | Return zero to four if valid history, quality, volume, metadata, exclusions or usage limits leave fewer eligible names. Show shortage/blocked dependencies; no invented candidates, screenshot duplicates or silent filter relaxation. |
| Tests | Stable rankings/ties, bounded-universe labeling, missing SMA200/benchmark/consolidated volume, quote-scale failures, paused enrichment and fewer-than-five cases. Historical strategy research requires point-in-time universe/chronological evidence; otherwise disclose survivorship limits. |

There is no presumed free all-market/grouped endpoint in this revision. Start with a documented, owner-reviewed supported universe (proposed maximum 40 researched instruments), excluding screenshot names, current holdings/watchlist and unsupported contracts. Obtain no-fee evidence only after connector billing/raw-capture gates. Record universe size, contract coverage, validated quote count, history requested/complete and qualified feature count. Rank only the eligible history-tested set and label that set; the supported universe can omit opportunities. Full-exchange research remains BLOCKED until a documented no-additional-fee universe/history path exists.

The proposed dollar-volume filter/rank is enabled only when its required consolidated or explicitly compatible historical volume coverage is proven. Do not substitute partial nonconsolidated quote volume, remove the filter silently or replace missing SMA200 with model commentary. A separately user-approved feature policy can use different evidenced criteria and must receive its own version/limitations. Benchmark/sector/history gaps remain explicit shortages.

Proposed transparent rank: average four within-evaluated-set percentile ranks for 20-session relative strength versus a supported broad-market benchmark, dollar-volume liquidity, proximity to the 20-session high, and lower ATR/close within the eligible band. Define relative strength as `(C/C[-20]-1) - (B/B[-20]-1)`; proximity is `C/max(H[-19..0])`; calculate percentile ranks from the same session and use instrument ID as a stable tie breaker. Missing benchmark or sector data is a disclosed coverage failure, not a fabricated value. Keep all filter/rank components in the stored screen result. Evaluate parameter sensitivity and chronological out-of-sample behavior before asserting a useful strategy. No performance claims are justified by a ranking demonstration.

“Five additional opportunities” means five distinct eligible instruments beyond all confirmed screenshot instruments. It is an ambition subject to evidence and coverage. Default excludes instruments already in the user's active/watchlist set and includes that exclusion in the manifest. Historical screens remain reproducible even when a listing or ticker later changes.

### 4. Trade Plan Generator

| Contract | Design |
| --- | --- |
| Input | Confirmed instrument, accepted evidence manifest, requested rule timeframe, local portfolio/settings snapshot and owner preferences. |
| Output | Unapproved structured draft with entry zone, typed bounded entry/invalidation conditions, stop, targets, evidence/indicators if available, holding interval, thesis, risks and uncertainty. Local engine supplies risk/quantity/RR. |
| External data | Previously accepted source evidence only. Live quotes do not stand in for daily indicators/history; manual journal-only drafts remain explicitly labeled and cannot produce entry signals. |
| Model role | Propose measurable strategies and cited explanations via included native Codex. Suggested levels are proposals; existing prices are exact evidence references, never retyped inventions. |
| Deterministic work | Local serialized-schema/DSL/evidence/owner/version validation, price quality and timeframe compatibility, stop/target ordering, fees, whole shares, cash/exposure, expiry and allocation checks. |
| Trigger | Website request queues one native generation job. Edits produce immutable new versions; owner approval is a separate local authenticated command with fresh validation. |
| Database | trade_plans, plan_versions/targets/approvals, ai_runs/inputs. Approved versions store accepted source/quality/engine/settings hashes; draft writer cannot approve. |
| Estimated usage | One bounded native job per explicitly requested plan, limited evidence/history summaries and bounded schema output. Cache unchanged evidence; no automatic regeneration each quote or purchased credit fallback. |
| Failure | Quota/bridge/auth pause, unsupported conditions/history/timeframe, failed quality or invalid arithmetic leaves a rejected/incomplete draft. One bounded repair within included usage; owner can manually edit. No autonomous approval. |
| Tests | Malformed native JSON, stale leases/settings, unsupported DSL, invented evidence, numeric disagreement, raw scale defects, daily-close rules with live-only inputs, injection and invalid levels/allocations; independent financial goldens. |

#### Structured plan contract and approval

Required fields: `instrument_id`/verified contract, `currency=USD`, `direction=LONG`, declared `basis=LIVE_QUOTE` or `REGULAR_SESSION_EOD`, exact evidence/quality/session IDs, feed/adjustment convention, entry-zone lower/upper, initial stop, entry condition tree, invalidation tree, target levels with allocation basis, estimated holding minimum/maximum sessions, expiry session, thesis, risk list and source references. Store calculator-produced `risk_per_share`, `quantity`, fees, risk budget, risk/reward and rejection reasons in a separate derived preview with its engine/settings versions. The AI cannot overwrite that preview.

V1 proposes buy-at-review plans rather than automated stop/limit orders. A zone represents a planning range. Conservative sizing uses its upper bound, an explicit stop-slippage allowance and fees; the actual manually executed fill is later recorded as fact. Approval freezes predicates/levels and provenance. Editing approved conditions creates a new draft while monitoring continues to use the previously approved immutable version; show “draft” and “actively approved” version identities prominently. The user can pause monitoring separately. Explicit reapproval atomically replaces the governing approval and invalidates old-version actionable signals. Later market data refreshes can generate a review warning without mutating the approved strategy. Corporate-action changes require explicit normalization and reapproval.

#### Bounded condition DSL

Use a finite, declarative tree with a mandatory timeframe/feed scope. LIVE_QUOTE rules use only accepted, observed-time-verified `last`, `bid` or `ask` operands explicitly marked NON_CONSOLIDATED; they cannot imply NBBO or daily-close/volume coverage. REGULAR_SESSION_EOD rules use finalized licensed daily history. Do not allow an undeclared mixed-timeframe condition tree. Any later supported multi-timeframe policy must scope both evidence sets independently and make the combination explicit; a live quote does not finalize a daily rule. Proposed EOD operators: `all`, `any`, `compare`, `between`, `crosses_above` and `crosses_below`; initial LIVE_QUOTE supports only `all`, `any`, `compare` and `between`. Live crossing detection needs separately specified ordered samples/interval coverage and is deferred. Reject `not` in V1 to avoid accidental truth from unknown data. Operands are allowlisted typed fields or a typed literal; EOD fields include `close`, `high`, `low`, qualified `volume`, supported indicators and previous-session values. LIVE_QUOTE operands carry per-field timestamp/units/contract/feed requirements. Unsupported/insufficient-coverage operands are unknown. Indicators include only named supported periods and adjustment conventions. No scripts, SQL, regular expressions, arbitrary formulas, natural-language execution rules or expressions evaluated with `eval`.

Example contract data, not implementation code:

```json
{
  "dsl_version": "1",
  "basis": "REGULAR_SESSION_EOD",
  "condition": {
    "op": "all",
    "children": [
      {"op": "between", "field": "close", "lower": 50, "upper": 51},
      {"op": "compare", "left": {"field": "close"}, "comparator": "gt", "right": {"indicator": "SMA", "period": 50}},
      {"op": "crosses_above", "left": {"field": "close"}, "right": {"literal": 50}}
    ]
  }
}
```

Example numbers above are synthetic contract fixtures. Comparisons support `gt`, `gte`, `lt`, `lte`, `eq` with exact decimal semantics and explicit units. `between` is inclusive. A cross above requires previous-left ≤ previous-right and current-left > current-right across adjacent valid exchange sessions; a repeated above-threshold close is not a new crossing. Node count ≤32, nesting depth ≤3, bounded literals/periods and identical currency/price adjustment units are enforced. `all` returns false if any child is false, true if all are true, otherwise unknown; `any` returns true if any child is true, false if all are false, otherwise unknown. Insufficient data is unknown, never false-by-default or a passing predicate.

An approved plan may require several consecutive completed sessions, but only through a separately supported bounded `consecutive_sessions` parameter (proposed limit 1–5) and explicit testing; omit that feature until supported by both editor and evaluator. A prose condition such as “buy when momentum looks strong” can remain thesis text and cannot qualify a monitored setup. Invalidations take precedence over entries; unknown invalidation results suppress entry and request data review.

### 5. Entry Monitoring Engine

| Contract | Design |
| --- | --- |
| Input | Exact approved version, due-job/calendar trigger, validated typed LIVE quote or final EOD history, latest local portfolio/settings snapshot. |
| Output | Persisted predicate/quality/risk trace with WAITING_DATA, BLOCKED, INVALIDATED, RISK_BLOCKED, NOT_READY or ready state. LIVE_ENTRY_READY requires live-compatible rules and all price gates; EOD_SETUP_REVIEW requires finalized licensed session history. |
| External data | IBKR source observations through proven native raw transport and calendar evidence. Live last/bid/ask field time and feed coverage must be verified; history availability is a separate gate. |
| Model role | No interpretation or arithmetic in signal truth. Native Codex/plugin may obtain read-only evidence; local evaluator alone determines readiness and notification payload. |
| Deterministic work | Calendar/session/timeframe checks, PRICE_VALIDATION, bounded DSL, risk preview, corporate-action compatibility, idempotency, semantic signal deduplication and expiry. |
| Trigger | Durable local dispatcher: 22:40 Asia/Jerusalem on trading days and close+15-minute probe. Supported native invocation must pass G0-L1/G0-L4; exact-time tasks/closed-page behavior are not presumed. |
| Database | jobs, monitoring_runs/evaluations, source observations/quality snapshots, approved plans/watchlist, entry_signals and local notification_outbox/inbox. Keep acquisition, evaluation and delivery outcomes separate. |
| Estimated usage | Two required independent due checks plus bounded retries; local rule evaluation uses no AI reasoning. Acquisition can require native capacity; obey verified no-fee per-tool limits and pause on quota/auth/billing uncertainty. |
| Failure | Sleeping/offline PC, unavailable Codex/plugin, missed/late jobs, raw scale/time problems or unsupported history yield no entry recommendation. Recover visibly; obsolete live alerts are discarded and require fresh evaluation. |
| Tests | Native dispatch/raw capture gates, both calendar times/DST/early closes, tab-closed persistence, sleeping-machine recovery, quota/auth pauses, daily/live timeframe separation, nonconsolidated volume misuse, risk changes and concurrent/deduplicated outbox writes. |

At 22:40 Jerusalem the US session can still be open. If G0 gates pass, a fresh valid live quote may support a LIVE-compatible review, but cannot satisfy a finalized daily-close condition. EOD plans record WAITING_DATA (UI DATA_PENDING) until the expected session's licensed final history exists. The close+15-minute job is a probe, not proof history has published. Closed-market live fields cannot be described as a present regular-session opportunity. On early closes, use the official session boundary rather than normal clock assumptions.

LIVE_ENTRY_READY carries its actual field observation times, NON_CONSOLIDATED coverage, short expiry, accepted quality assessment and local risk-check age; it remains advisory for manual verification/execution. EOD_SETUP_REVIEW states its completed session and that it is an end-of-day setup review, with no assertion that the condition is true now. Quotes failing scaling/timestamp/contract/coverage gates produce only diagnostic/failure notices without an entry recommendation. The in-app inbox is authoritative; tested native/OS desktop display, user acknowledgment and later zero-fee iPhone feasibility are separate NOTIFICATIONS gates. Web tab closure is supported only while the computer, Codex, local server/database/worker and required session/network remain available. A missed run cannot send a stale ready signal on recovery.

### 6. Active Trade Advisor

| Contract | Design |
| --- | --- |
| Input | Owned open trade, exact ledger/lots/approved plan, management events, latest accepted price/timeframe/portfolio quality evidence and user question. Selected notes require consent. |
| Output | HOLD, REDUCE, EXIT, ADD or REVIEW_REQUIRED proposal with cited rationale, conflicts, as-of/expiry and optional proposed levels/quantity. Suggestions remain user-reviewable. |
| External data | Verified existing IBKR quote and separately supported history/calendar/events. No inferred fills, consolidated pricing or manufactured indicators. |
| Model role | Included native analysis compares recorded plan and accepted evidence, explains alternatives and uncertainty. It cannot “repair” prices or turn unvalidated live feed into advice. |
| Deterministic work | Local P&L, whole-share limits, initial R, stop distance, full post-ADD cash/exposure/open-risk preview and data quality/timeframe gates. |
| Trigger | Explicit queued user request or separately enabled native weekly review. New evidence/executions/settings invalidate cached currency of advice. |
| Database | Read owned trades/executions/allocations/lots, plan versions, management events and accepted snapshots/settings; write only ai_runs and linked recommendation history. |
| Estimated usage | One bounded native job per request, compact authorized input and short serialized assessment. Included quota only; no continuous LLM advice after each quote. |
| Failure | Bad scale, unverifiable timestamps, stale/missing evidence, corporate-action conflicts or quota/auth/bridge failures produce REVIEW_REQUIRED/paused job. Date the last valid assessment; no current ADD/EXIT claim from stale input. |
| Tests | Five enums, partial sells/ADDs, stop changes/closed trades, invalid quantities, source disagreement, nonexistent fills, NON_CONSOLIDATED disclosure and proof that advice changes no executions/stops/approvals/cash. |

Recommendations never autonomously change the approved plan, stop, recorded position, journal or portfolio settings. Accepting a suggestion opens a prefilled form for an explicit user action and full deterministic validation. A user-recorded execution may deviate from the recommendation; preserve what occurred and label the deviation rather than rewriting history.

### 7. Trading Psychology Analyzer

| Contract | Design |
| --- | --- |
| Input | Opted-in owned period, actual BUY emotion responses, measurable adherence and local closed-trade aggregates. Free text excluded from native prompts by default; selected-note sharing requires separate consent. |
| Output | Nonclinical descriptive associations/questions, distinct-trade sample/coverage and missingness. No diagnosis, causal conclusion, invented feelings or guaranteed improvement. |
| External data | None. Native Codex remains external processing even though the source database is local; disclose and minimize what leaves the computer. |
| Model role | Included native interpretation of minimal aggregates with sensitivity/uncertainty. Self-reported feelings remain distinct from AI hypotheses. |
| Deterministic work | Local group counts, net outcomes/adherence, distinct-trade deduplication, coverage, small-sample gates and chronology. Repeated BUY fills are not independent psychological observations. |
| Trigger | Explicit opted-in request or accepted weekly native task; disable future bridge access/submissions when consent is removed. |
| Database | execution_emotions, executions/plans/events and authorized notes; local opt-in settings/ai_runs. No raw sensitive emotions in ordinary logs, push text or desktop notices. |
| Estimated usage | One bounded aggregate-only native review job; no whole-history replay on dashboard visits. Queue/pause on included usage limits, without paid model fallback. |
| Failure | Consent/bridge/quota failure, insufficient records or low coverage yields paused/insufficient-data result plus deterministic facts. No synthesized emotion entry. |
| Tests | UNKNOWN/DECLINED, tiny groups, repeat fills, opt-out/deletion, owner separation, external-sharing consent, clinical wording, injected notes and native job scope. |

Proposed conservative product gate: before 20 completed trades, show only recorded facts and prompts, not generalized emotional patterns; require at least 5 distinct trades in a displayed comparison group and show each group's n. These are UX safeguards, not statistical proof. Even beyond those counts, disclose selection bias, multiple comparisons, strategy changes and confounding; do not call a difference statistically established without an appropriate prespecified analysis. A self-reported emotion is sensitive personal data. Keep it owner-only, minimize retention/external transmission and support export/deletion according to the database policy. Push text must not disclose it. Required BUY recording allows an explicit user-selected `UNKNOWN` with an unavailable/cannot-recall reason or `DECLINED` (“prefer not to describe”); neither is an automatic default or a directional emotion claim.

### 8. Performance Analyzer

| Contract | Design |
| --- | --- |
| Input | Owned portfolio/period, effective ledger, exact allocated fees, frozen initial R, source-typed dated complete valuations and classified cash flows. |
| Output | Local metrics/formulas/denominators/coverage and optional native narrative with explicitly labeled improvement hypotheses. Historical realized outcomes do not need live quotes. |
| External data | Supported final-session history for EOD valuation, separately quality-gated LIVE_QUOTE snapshots or labeled manual marks; do not mix these into an unlabeled daily series. |
| Model role | Included native Codex explains already calculated metrics/limits. It cannot recompute arithmetic, invent returns/backtests or infer an edge from a small sample. |
| Deterministic work | Local realized/unrealized P&L, closed-trade win rate/expectancy/profit factor, initial R, holding periods, chronological flow-neutral drawdown and adherence. RISK_ENGINE.md defines conventions. |
| Trigger | Dashboard/journal metrics execute locally, including offline ledger metrics. An optional narrative request/accepted weekly review queues a native job. |
| Database | Local ledger/allocations/lots, capital events, valuation/source manifests and owner-scoped metric caches; ai_runs only for interpretation. Corrections/marks/settings invalidate corresponding caches. |
| Estimated usage | Routine calculations consume local CPU/database only; one optional bounded native narrative per week with aggregate inputs. No subscription overage or per-token API budget. |
| Failure | No closed trades, missing initial stop/valuation or invalid quotes yields nullable/provisional metrics with provenance. Native quota/bridge failure affects explanation, not correct ledger arithmetic. |
| Tests | Independent risk fixtures, corrected/reversed events, partial exits/ADDs, zero-loss samples, chronological flows, source transitions, invalid live price exclusion and narrative/metric agreement. |

## Evaluation, security and operational gates

Plan a versioned evaluation corpus of synthetic and consented/redacted cases. Label synthetic prices and histories as fixtures in developer/test views, never as live production research. Each corpus case includes the correct evidence IDs, expected safety outcome and a reviewer rubric. Numerical source agreement and ownership/isolation gates require 100% success on the release corpus; a single fabricated fact or cross-user exposure blocks release. Qualitative thesis quality and extraction precision have separately reported scores and sample sizes. No evaluation results have been claimed or run in this planning stage.

Evaluation changes with prompt/schema/native-client/model changes that can be observed. Run deterministic regressions plus the bounded included-usage corpus before promotion; record run counts, wall time, visible quota states and unavailable metadata honestly. Use bounded per-module jobs, concurrency, input/output size, leases and deadlines. Completion time includes native availability/user invocation; no fixed hosted-API latency SLA is promised. Quota/auth/bridge failures pause rather than trigger paid fallback. Exact tool-result transport and serialized local output rejection are required integration tests.

Before native AI use: verify native Codex/connected-tool processing and retention terms, supported image/tool access, local bridge compatibility and user consent. Local storage does not make native inference offline or imply zero retention. Do not copy hidden auth files, session tokens, plugin cookies or IBKR authorization into the web application. Redact secrets, personal account identifiers, sensitive journal text and raw private envelopes from ordinary logs. Keep source evidence in authenticated owner-scoped local storage with retention/export/deletion rules.

G0-L1 must prove native tool-event evidence reaches the bridge exactly; otherwise manual reviewed import is the honest fallback and unattended quote acquisition remains BLOCKED. G0-L2 proves existing-entitlement/no-additional-fee tools and history/coverage; unknown billing blocks bulk calls. G0-L3 proves source units/timestamps/identity/coverage, including the unresolved AAPL discrepancy. G0-L4 proves both due schedules, closed-page persistence and quota/reconnect recovery. G0-L5 separately proves desktop display/acknowledgment. None of these application gates has run in this planning stage. Limited prior native quote observations and the user's current fee screen are not end-to-end evidence or a guarantee of future billing.

Release permits LIVE_ENTRY_READY only after live transport/price/feed/rule/risk gates pass, EOD_SETUP_REVIEW only from independently available valid finalized history, and quantified discovery only for the explicitly supported universe. History-dependent modules remain incomplete when history is unavailable. Journal correctness/manual lifecycle remains usable locally while blocked intelligence gates are visible. Hardware, electricity, internet and the existing Codex subscription are outside the target of $0 additional recurring services; no new paid provider is introduced by this design.

## Implemented Phase7 manual weekly/performance review — v0.7

Separate durable weekly jobs bind versioned deterministic aggregates to immutable local source cohorts/journal revision. Creation does not dispatch. Owner manually copies minimal packet to native included Codex, then imports plain JSON. Emotions default off; opted-in groups are aggregate/descriptive only. Packets exclude individual trades/symbols/emotions/notes/balances/images/credentials and prohibit tools, paid fallback, recommendations and diagnoses. Snapshot exports are richer private local records, explicitly labeled separately.

Imported facts are structurally bound to job/hash/known aggregate IDs; prose/model label remain self-reported and unverified. Sparse groups(<20), unknown/declined/mixed coverage, no causality and missing historical valuation are explicit. Every journal/planning command except READ_NOTIFICATION stales pending/completed reviews. Paused imports/transfer reject; late responses quarantine. No financial mutation, model API/bridge call, native usage enforcement or automatic weekly schedule. See PHASE7_DELIVERY for current implementation rather than assuming proposed native modules below exist.
