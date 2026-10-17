# SwingPilot AI — deterministic risk and accounting specification

Revision 2, 13 October 2026: proposed local design for approval. This is a specification and independent numerical oracle, not an implementation or a reported backtest. Every production calculation runs deterministically on the user's computer, outside native Codex reasoning, and preserves input/event/snapshot/settings versions. [LOCAL_WORKFLOW.md](LOCAL_WORKFLOW.md) defines the existing-subscription/$0-additional-service baseline; [PRICE_VALIDATION.md](PRICE_VALIDATION.md) owns source quality policies.

## Scope, arithmetic and sources of truth

V1 supports long US stocks, USD accounting, whole-share BUY/SELL executions, cash portfolios and manual brokerage execution. No shorting, margin, leverage, derivatives, currency conversion or automated order submission. Suggested levels and quantities are planning outputs; recorded execution prices, quantities, fees and timestamps are facts. A stop price is a planning level, not a guaranteed execution price.

Use exact decimal arithmetic for financial values and integers for ordinary fill quantities. Reject NaN, infinity, negative fees/prices, zero quantities and unsupported currency. Calculate before rounding: display money at currency precision, but retain enough decimal precision for prorated fees and weighted averages. An allocation algorithm must conserve the recorded order fee exactly; assign any smallest-unit rounding remainder to the last deterministic allocation. Never round shares up to satisfy a minimum position size.

Financial sources are the local append-only execution ledger, confirmed cash adjustments, immutable approved plans, explicit management events and exact dated valuation marks in local PostgreSQL. Owner-private `portfolio_valuations`/`valuation_marks` carry `MANUAL` self-reported marks, quality-gated `LIVE` observations or supported final-session `EOD` marks, with explicit field/as-of/coverage/source evidence. Keep these classes distinct and label mixed-source totals. IBKR is a read-only market source through the existing native plugin; it does not execute orders or silently replace the user's ledger. Derived lots, balances and analytics are rebuildable projections. Broker statements remain an external reconciliation source. Record fee/slippage assumptions explicitly. Native AI can write validated drafts/analysis only; it cannot change balances, fills, stops, approvals or R denominators.

Proposed initial rules: one active long trade per instrument per portfolio; subsequent buys become explicit ADD batches. This makes FIFO attribution unambiguous without preventing multiple closed historical trades. Reserve a separate field for the actual exchange timestamp and the time recorded by the user; order replay by effective timestamp plus a stable sequence, not insertion time.

## Inputs and notation

| Symbol | Meaning |
| --- | --- |
| `E` | Portfolio equity at a complete, dated valuation snapshot: settled journal cash plus marked open holdings |
| `C` | Journal cash after recorded fills/fees and cash adjustments |
| `r` | Configured maximum risk fraction per proposed purchase, e.g. 0.005 means 0.5% |
| `e`, `s` | Conservative proposed entry (normally zone upper bound) and approved initial stop, in compatible current USD price units |
| `q` | Proposed whole-share quantity, integer ≥1 |
| `F_b(q,e)`, `F_s(q,p)` | Configured estimated buy/sell fees, including any modeled minimum/per-share components |
| `delta` | Configured adverse stop slippage allowance per share, nonnegative; may instead be a versioned percentage converted to dollars |
| `Rsv` | V1 configured fixed USD `cash_buffer`; a percentage-based reserve is a separately versioned future policy |
| `K` | V1 is zero: no pending-reservation entity. A future explicit reservation feature may subtract committed cash once |
| `M`, `M_sector` | Current marked total/sector open-position notionals at the same valuation snapshot |
| `x_max`, `z_max` | Maximum gross portfolio exposure and sector exposure fractions |
| `P_i`, `Q_i` | Dated market mark and open quantity of instrument `i` |

Portfolio capital configuration sets initial funded cash/equity through an auditable capital event. It is not an arbitrary editable number that retroactively changes past P&L. Editing risk settings creates a new version; past previews and approvals keep the version used. Unrealized values and exposure always show the mark/session, provenance and coverage. A complete, dated manual valuation supports an explicitly acknowledged journal-only sizing/approval preview in the first journaling release; it does not count as provider-verified research or generate entry signals. Incomplete or undated manual marks cannot supply a complete equity denominator. Cash is derived from the ledger and may not equal broker buying power when transfers, pending settlement or unrecorded activity exist. V1 labels it “journal available cash,” requires reconciliation and does not assume an immediate broker settlement entitlement.

## Local source-quality and interval prerequisites

All automated source inputs require accepted owner-scoped raw-tool capture, a passing `market_quality_assessments` result and documented instrument/contract/currency/units. Model-retyped prices and model-written “raw” payloads are not provider evidence; a checksum alone cannot prove source authenticity. G0-L1 must prove a supported native tool-event → local bridge path. Without it, automation is BLOCKED; explicit user-reviewed imports/manual marks retain their honest provenance and do not become a live feed. Gate G0-L2 proves connector calls use existing verified included entitlements, with no paid regulatory snapshot, API model fallback, credit purchase or new subscription.

Current IBKR coverage is US REALTIME NON_CONSOLIDATED in limited prior observations, not established full-market NBBO, consolidated volume or universal historical coverage. Each LAST/BID/ASK input retains its own verified observed time, receive time, field kind, units, contract, venue/session and raw source path. Receipt time never fills a missing market timestamp. Do not silently use bid/ask as last, claim a nonconsolidated ask is the market's best available offer, or treat last trade as a guaranteed fill. AAPL's previously observed last around 3.43 versus bid/ask around 343 remains a blocked scaling/serialization issue; no heuristic ×100, plausible substitute field or model confidence can repair it. Any documented source-specific normalization requires raw/normalized values and a versioned independent quality review.

`LIVE_ENTRY_READY` requires verified fresh regular-session evidence, a LIVE-compatible approved predicate, current portfolio revision and every risk/quality gate; `EOD_SETUP_REVIEW` requires supported licensed finalized history for the intended completed exchange session. Freshness/time-spread thresholds come from PRICE_VALIDATION and are versioned inputs. A current intraday quote cannot satisfy a finalized daily close/SMA/ATR rule. Missing history or unsupported consolidated-volume coverage leaves dependent indicators/rules unknown; never fabricate or infer them from a snapshot.

Local sizing, FIFO and realized analytics continue without native usage. When Codex quotas, IBKR auth, bridge access or scheduling fail, dependent quote/AI jobs visibly pause/block; do not change financial records, purchase credits or reuse an expired ready signal. Native requests have no guaranteed response time. The computer must be awake, connected and running Codex plus the local server/database/worker for unattended checks. A closed browser page is different from an unavailable computer.

## Prospective long trade calculations

### Risk, stops and targets

Raw planned risk per share is `d = e - s`. Require `0 < s < entry_zone_lower <= e`. The long stop must be below every permitted entry price; a zone touching/crossing the stop is invalid. A user may record an actual fill outside the zone, but it becomes a documented deviation. Each target `T_j` must exceed the zone upper bound and targets must increase strictly. Explicit proposed target share allocation is positive, sums to at most 100%, and specifies how any remainder is managed; do not imply shares have already been sold.

Maximum loss budget is `B = E * r`. Conservative modeled stop loss is:

`L(q) = q * (e - s + delta) + F_b(q,e) + F_s(q,max(s-delta,0))`.

Reject impossible/negative modeled exit prices rather than silently normalizing them. This loss includes buy and stop-exit fees and the configured slippage reserve; it is not a guaranteed worst case. Gaps, trading halts and unmodeled fees can exceed it. Version the fee schedule; unknown fees require an explicit estimate/assumption and later reconciliation rather than an invented zero.

Gross reward-to-risk for a single target is `(T-e)/(e-s)`. Estimated net reward for full liquidation at target is `G(q,T) = q*(T-e) - F_b(q,e) - F_s(q,T)`; net reward-to-modeled-stop-risk is `G(q,T)/L(q)`. Display the distinction. Partial-target net reward uses explicit share quantities, fee assumptions for each exit order and the planned residual-exit assumption; without a residual assumption report per-target values, not a fictitious blended realized payoff. Estimates never become journal P&L.

### Cash, exposure and maximum size

Available cash is `A = max(0, C - Rsv - K)`, with `Rsv` the fixed USD cash buffer and `K=0` in V1. Unexecuted watchlist plans do not deduct cash. An optional future reservation workflow must create/expire explicit records and avoid double-counting amounts already deducted by recorded purchases; it is not a V1 schema dependency. The risk budget uses dated equity; a stale/incomplete equity snapshot cannot silently become current buying power.

Before a proposed purchase, require `q*e + F_b(q,e) <= A`. Existing positions are already absent from `C`; do not subtract `M` again. The projected equity at an immediate mark equal to the entry is `E'(q) = E - F_b(q,e)`; market exposure excludes fees. Projected gross exposure is `(M + q*e)/E'(q)` and projected sector exposure is `(M_sector + q*e)/E'(q)`. Reject nonpositive projected equity. With another explicit mark assumption, recompute projected equity and notionals consistently; never combine entry-valued numerators with an unrelated denominator silently.

Define the feasible share set exactly:

`Q = { q in positive integers : L(q) <= B; q*e+F_b(q,e) <= A; (M+q*e)/E'(q) <= x_max; (M_sector+q*e)/E'(q) <= z_max; all other configured position/open-risk caps pass }`.

Maximum quantity is `max(Q)`; if `Q` is empty, return zero plus constraint reasons and no approved actionable size. Start with a safe bounded cash/quantity upper bound; evaluate integer candidates with the fee function. Monotonic fees allow a bounded binary search; nonmonotonic fee schedules require explicit supported handling. An oversimplified `floor(B/(e-s))` is insufficient when fees, slippage, cash or concentration bind.

For proposed linear/flat fees, the risk-only bound is `floor((B - fixed_roundtrip_fees)/(e-s+delta+variable_roundtrip_fee_per_share))`. If the numerator is negative, size is zero. Final size is still checked against every other constraint and the original exact equations.

Missing sector is explicit `UNKNOWN`, not “diversified.” Default blocks new prospective sizing that cannot validate a configured sector cap; an explicit user override with unknown-sector warning may be permitted as a product setting, separately audited. Existing unknown-sector holdings remain visible in total exposure and a separate unknown bucket. Instrument eligibility and liquidity checks do not replace risk/cash checks.

### Current exposure and open stop risk

Gross long exposure is `sum(Q_i*P_i)/E`. Sector exposure is the same sum restricted to that sector divided by `E`; per-instrument exposure consolidates all its remaining lots. Cash proportion is `C/E`. Values are null if equity is nonpositive or required marks are missing. EOD marks share the requested completed session; LIVE totals require all used fields to pass the configured per-field age/time-spread and compatible-session policies and the portfolio revision to remain current. A single fresh candidate price cannot repair stale existing-holding marks or an incomplete equity denominator. Manual/mixed/stale/provisional totals show their provenance and limitations; they cannot pass a provider-verified live signal gate.

Forward mark-to-stop risk is `sum[Q_i * max(P_i - S_i + delta_i, 0) + estimated_remaining_exit_fee_i]`, with a known current stop for each position. It measures possible equity giveback from the valuation mark under the stated stop/slippage assumptions. It is different from historical entry-to-stop risk and includes profit that could be surrendered. Show either missing-stop risk as unknown or a conservative configured stress case; never treat it as zero. Optional portfolio open-stop-risk cap is this value divided by equity. Correlated-sector exposure caps are simple controls, not a claim that cross-sector risks are independent.

Changing a stop upward can reduce forward modeled risk; lowering it increases risk and requires explicit acknowledgement of any configured breach. It never resets initial R or backdates a decision. Proposed ADD uses the entire post-add portfolio/exposure/open-risk picture, not only the new shares in isolation.

## Recording reality and immutable accounting

Before plan approval, hard strategy gates require correct, explicitly dated inputs and a passing prospective preview; a self-reported manual valuation requires a visible journal-only acknowledgement. LIVE readiness additionally requires verified native source transport and independently fresh compatible quote fields; EOD readiness requires expected-session finalized history. Neither accepts manual marks, unverified scale or unsupported feed coverage as a market signal. Before recording an already executed fill, hard integrity gates require ownership, valid quantities/currency, chronologically valid inventory, nonnegative fees, BUY emotion response and idempotency. An actual risky or out-of-zone trade remains recordable with a breach reason and explicit acknowledgement; otherwise the journal would conceal what happened. A negative cash balance caused by a genuine manually recorded fill is preserved as a reconciliation/risk alert, not silently overwritten with an invented deposit or deleted fill.

BUY and SELL events append rather than update history. Atomic corrections append a reversal linked to the original and replacement facts, then validate/replay the effective ledger. Deleting or reversing a BUY that has subsequent sales requires complete chronological reconciliation in the same correction; do not publish impossible negative inventory or half a correction. Projection generations retain original immutable event/allocation records and identify superseded projections. Concurrent SELL transactions lock/version the trade inventory and prevent overselling. Idempotency keys prevent a retried form from recording the same fill twice.

BUY input includes quantity, actual fill price, actual fee, executed time, plan/version link and mandatory `execution_emotions` record. An explicit user-chosen `UNKNOWN` with unavailable/cannot-recall reason or `DECLINED` (“prefer not to describe”) is allowed; neither is an automatic default. The app does not infer or invent an emotion. One submission transaction creates the execution and emotion, updates the projection and records any breach acknowledgement. Batch records support multiple partial fills from one manually executed purchase; their buy fees sum to the actual batch fee without duplicating a single order commission.

FIFO matches each SELL to the oldest effective BUY lot in the same instrument/portfolio, consistent with the single-open-trade V1 rule. Lots carry remaining shares and allocated acquisition fees. For an allocation of `a` shares from a buy lot with original quantity `Q_b`, price `p_b` and original total fee `f_b`:

`allocated_buy_fee = f_b * a/Q_b` and `allocated_sell_fee = f_s * a/Q_s` where `Q_s` is the whole SELL execution quantity.

`realized_PnL_allocation = a*(p_s-p_b) - allocated_buy_fee - allocated_sell_fee`.

Sum allocations for execution/trade/period realized P&L. The SELL net cash inflow is `Q_s*p_s-f_s`; cash outflow for BUY is `Q_b*p_b+f_b`. Fee allocation affects realized/unrealized classification, not cash twice. Broker commissions and cash are recorded at execution level and allocated exactly once.

Remaining carrying basis is `sum[remaining_quantity*buy_price + unallocated_buy_fee]`. At a dated mark, unrealized carrying P&L is `remaining_market_value - remaining_carrying_basis`. It includes acquisition fees not already realized, excludes future estimated liquidation fees, and is distinct from an optional liquidation-P&L preview subtracting estimated SELL fees. For a complete valued account without dividends/taxes/other charges, realized P&L plus carrying unrealized P&L reconciles to equity change after neutralizing external cash flows. Do not mix gross and net metrics.

Stop changes, plan deviations and ADD decisions are append-only management events. Daily OHLC alone cannot determine the order of an intraday stop and target touch or prove an executed fill; never invent an exit from a candle. Actual SELL facts close shares, even when price gaps past a planned stop. Trade closes only when effective remaining quantity becomes zero; reopening is a new trade unless the original closure itself is corrected.

## Frozen initial R and partial exits

The baseline `initialRiskUsd` is the first completed BUY batch's actual price-to-initial-approved-stop risk:

`R0 = sum(first_batch_fill_quantity * (actual_fill_price - S0))`.

It excludes fees and slippage so the R baseline remains a transparent entry-to-stop convention. The larger fee/slippage-inclusive modeled sizing risk is stored separately. `S0` is the original approved stop frozen on that purchase batch. Every first-batch fill must be above `S0` for a valid positive R baseline. If a historical/imported trade has no initial stop or nonpositive baseline, preserve its cash/P&L but report R as null with reason; never invent a stop.

After the first purchase batch is finalized, partial exits, current stops, portfolio capital changes and later ADD batches do not change `R0`. Batch completion must be explicit before freezing a multi-fill first purchase; a late correction recomputes the historical baseline through an audited projection/version, not an untracked overwrite. Record incremental ADD risk at its own fill/then-approved-stop separately. The trade's total return in initial R includes all its BUY/SELL fees and ADD outcomes; this convention means comparisons should segment ADD trades and show total committed risk as supplemental context.

`realized_R_to_date = realized_trade_PnL_to_date / R0`.

`marked_total_R = (realized_PnL + carrying_unrealized_PnL)/R0` at the dated mark; `closed_trade_R = total_net_trade_PnL/R0` on complete closure. A partial exit does not divide by only the exited shares' stop risk, and the remaining initial-risk denominator does not shrink. Realized losses can be below -1 R because gaps, fees and ADDs are real.

## Performance metrics, denominator rules and chronological valuation

| Metric | Definition and missing-data behavior |
| --- | --- |
| Win rate | Closed trades with total net P&L >0 divided by all closed trades. Exactly zero P&L is breakeven and remains in the denominator. Open trades are excluded. |
| Mean net P&L | Sum total net P&L of closed trades divided by closed-trade count. Report currency and count. |
| Expectancy in R | Arithmetic mean of valid `closed_trade_R` values. Report both included n and excluded trades missing R. Equivalently `p_win*mean_positive_R + p_loss*mean_negative_R`, with probabilities using the same R-eligible count and zeros included. |
| Profit factor | Sum positive closed-trade net P&L / absolute sum negative closed-trade net P&L. No losses gives an undefined/no-loss-sample label; no false zero or evidence of certain profitability. |
| Holding duration | Last effective SELL time minus first effective BUY time for a closed trade; open trade uses dated snapshot time. Show calendar days and separately exchange sessions whose session date lies between first BUY session and final SELL/as-of session inclusive. No calendar-day count relabeled as trading days. |
| Plan adherence | Explicit recorded/derived measurable violations divided by eligible decisions, with the eligibility/coverage rule. A model's interpretation is not an automatic violation. |
| Maximum drawdown | Chronological unitized-equity peak-to-subsequent-trough decline over complete, consistently valued snapshots; never order trades by return or use only the sequence of closed-trade profits. |

Closed-trade reporting buckets by final effective SELL timestamp/session by default; period realized-P&L reporting buckets individual SELL allocations by their effective times. These are different reports. A trade opened earlier and closed this month contributes its whole net trade result to closed-trade metrics, whereas only this month's SELL allocations contribute to this month's realized ledger P&L.

For a valuation series with no external flows, `H_t = max(E_0,...,E_t)`, `DD_t=(H_t-E_t)/H_t`, and `MDD=max(DD_t)`. With deposits/withdrawals, use unitized portfolio NAV: initialize units `U_0=E_0/100`; an external flow `f` at a fully valued instant adds/removes `f/NAV_before_flow` units, leaving NAV unchanged by the flow; later `NAV_t=E_t/U_t`. Compute drawdown on NAV. Record flows at exact valued boundaries or split the period around them; do not apply an unspecified monthly adjustment formula. Zero/negative units or NAV is invalid for this method and requires an explicit insolvency/inception treatment.

Cash deposits and withdrawals are external flows; BUY/SELL proceeds, commissions and documented dividends/fees are internal economic events. V1 price-trade P&L excludes separately recorded dividend income/taxes unless an explicit metric version allocates them. Portfolio equity/return includes any actually recorded internal dividend/fee events, labeled so reconciliation explains the difference. Unrecorded transfers/dividends make broker reconciliation incomplete rather than becoming imaginary P&L.

Use independently available, licensed regular-session history from one expected completed exchange session for provider-confirmed daily snapshots. This history is not established merely because IBKR live quotes work. A separate quality-gated LIVE valuation series retains field-level times/coverage and a declared interval; never splice live intraday values into a daily-close series without labeling and a versioned policy. The journal-only release can calculate a separate self-reported series from complete dated manual marks; label it accordingly. Explicitly mark source transitions/mixed-source series. Missing or rejected marks remain unavailable rather than zero or fresh carry-forward. A labeled provisional chart may carry a prior dated mark, but complete return/drawdown coverage has a gap and true drawdown inside it is unknown. EOD freshness uses the expected completed session/publication state, not a 24-hour heuristic. Even a valid live NON_CONSOLIDATED observation is a dated venue-limited fact, not a fill/broker buying-power guarantee; a valid EOD close is historical. Manual marks never generate entry signals.

Corporate actions require an explicit confirmed event. Splits change quantities/unit prices and stops to consistent units while preserving total economic basis; pending/unconfirmed transformations suspend affected signals and mark analytics incomplete. Ordinary BUY/SELL forms remain whole shares. Any split/reverse-split producing fractional entitlements needs a supported corporate-action/cash-in-lieu workflow before complete reconciliation; it cannot be faked as an ordinary manual SELL. A symbol rename keeps stable instrument identity. Provider dividend-adjusted chart prices do not rewrite historical fills or current tradable stops.

## Independent synthetic numerical oracle

All values below are deliberately synthetic. They are expectations for independent tests, not actual market observations or claimed trading performance. Tests should parse the specification's literals and derive expected fractions independently of the production helper functions.

### A. Fee-aware size, reserve and exposure

Initial portfolio: equity/cash $20,000; no positions or reservations; risk 0.5%; reserve $2,000; gross exposure cap 20%; sector cap 15%; entry $50; stop $48; stop slippage $0.10/share; BUY fee $1 and SELL fee $1 per order. Thus `B=100`, `A=18,000`, `d=2`, `L(q)=2.10q+2`, `E'(q)=19,999`.

| Check | Maximum admissible quantity / exact result |
| --- | --- |
| Risk only | `floor((100-2)/2.10)=46`; `L(46)=98.60`; `L(47)=100.70`, therefore 47 fails |
| Cash only | `50q+1<=18,000`, so q≤359 |
| Gross exposure only | `50q/19,999<=0.20`, so q≤79 |
| Sector exposure only | `50q/19,999<=0.15`, so q≤59 |
| Combined recommended size | 46 shares; notional $2,300; actual BUY cash outflow $2,301 |
| Immediate after BUY | Cash $17,699; market value $2,300; equity $19,999; exposure `2300/19999 ≈11.500575%` |
| Frozen initial R | `46*(50-48)=$92`, separately from modeled $98.60 stop loss |
| Full-position target $56 | Gross reward $276; net reward $274; gross R/R=3; net/model R/R=`274/98.6 ≈2.7789047` |
| Exact stop fill $48, no slippage | Sale proceeds $2,207; net trade loss $94; closed R=`-94/92 ≈-1.02173913` |

Buying one less/more must recompute actual fee function and projected denominator rather than copy rounded previews. A price-gap fixture with actual SELL $47 would lose `$140 = 46*(50-47)+2`, despite modeled loss $98.60; the recorded event is valid and visibly exceeds the forecast.

### B. FIFO partial exits, ADD and fee conservation

This is a separate branch from the same $20,000 opening account; do not apply the target/stop sale in fixture A. Initial BUY batch is 46 shares at $50, fee $1, initial stop $48, `R0=$92`. Then record SELL 20 at $55, fee $1; ADD BUY 10 at $52, fee $1; value at $54; finally SELL all 36 at $47, fee $1. The ADD and final stop gap may violate configured limits; the actual recorded ledger remains truthful with acknowledgements.

| Step | Expected result |
| --- | --- |
| Initial BUY | Cash $17,699; lot 46 @ $50 with $1 acquisition fee |
| Partial SELL 20 @ $55 | Cash +$1,099 → $18,798; allocated initial BUY fee `20/46=10/23`; realized net P&L `$100-$1-10/23 = 2267/23 ≈$98.5652173913`; remaining 26-share original lot retains `13/23` of BUY fee |
| ADD BUY 10 @ $52 | Cash -$521 → $18,277; original 26-share lot unchanged, new 10-share lot with $1 acquisition fee; `R0` remains $92 |
| Dated mark $54 | Remaining market value `36*54=$1,944`; raw purchase basis `$1,820`; remaining acquisition fees `13/23+1=36/23`; carrying unrealized P&L `124-36/23=2816/23 ≈$122.4347826087`; equity `$18,277+$1,944=$20,221` |
| P&L identity at mark | Realized `2267/23` + unrealized `2816/23` = `$221`, exactly matching equity less original cash; no fee double counting |
| Final SELL 36 @ $47 | Cash +$1,691 → $19,968; FIFO consumes original 26 then ADD 10; net P&L for this SELL `-$128-(13/23+1)-$1 = -3003/23 ≈-$130.5652173913` |
| Final net result | Gross sales `$2,792` minus raw BUY cost `$2,820` = -$28; four order fees total $4; total net P&L -$32; all shares zero; final equity/cash $19,968 |
| Initial-R result | First partial realized R `(2267/23)/92 ≈1.0713610586`; final closed R `-32/92=-8/23 ≈-0.3478260870`; do not reset denominator after ADD or partial exit |

Final SELL fee allocations are `26/36=13/18` to the original lot and `10/36=5/18` to the ADD lot. The initial BUY's `10/23+13/23=1` allocated fees reconcile exactly. Portfolio cash, carrying basis and closed-trade net P&L must remain identical regardless of report grouping or UI display rounding.

At the $54 mark with a maintained $48 stop, gross mark-to-stop giveback is `36*(54-48)=$216`, whereas remaining entry-to-stop price risk is `26*(50-48)+10*(52-48)=$92`; neither is the frozen initial R by coincidence/general rule. Do not use one as a substitute for the other.

### C. Initial batch partial fills and immutable R

If the first purchase batch instead consists of 30 shares @ $50 and 16 @ $51, initial stop $48, then weighted entry is `2316/46 ≈$50.3478260870` and `R0=30*2+16*3=$108`. A $100 risk plan was exceeded by actual fills before fees; record a breach. Fees do not change `R0`. Later raising stop to $50 or selling shares does not rewrite $108. Correcting an erroneously recorded first fill requires an audited ledger replay and a new projection with the corrected baseline.

### D. Chronological drawdown and external cash

For an ordered, complete no-flow equity series `$20,000; $21,000; $20,500; $22,000; $19,800; $21,400`, peaks are `$20,000; $21,000; $21,000; $22,000; $22,000; $22,000`. Drawdowns are `0; 0; 500/21000; 0; 2200/22000; 600/22000`. Maximum drawdown is exactly 10%, from the fourth to fifth observation. Sorting the equity values or using final net profit would produce the wrong answer.

Separate flow fixture: start equity $20,000, NAV 100, units 200. Deposit $5,000 at NAV 100 creates 50 units, so equity $25,000 and units 250 leave NAV 100. A later complete equity mark of $24,000 implies NAV 96 and 4% drawdown. The deposit is not a +25% return. With missing marked holdings at the later date, do not produce that 4% as a confirmed result.

### E. Metric denominators

Four closed eligible trades have net P&Ls `[100,-50,0,25]` and initial risks `[50,50,50,25]`. Their R values are `[2,-1,0,1]`: win rate 2/4=50%; mean net P&L $18.75; expectancy `(2-1+0+1)/4=0.5 R`; profit factor `(100+25)/50=2.5`. An open +$500 marked trade affects unrealized portfolio metrics, not these closed-trade denominators. If a fifth closed trade has no initial stop, include it in net-P&L/win-rate counts but exclude it from R expectancy with an explicit missing-R count.

## Rejection, warning and reconciliation matrix

| Condition | Prospective behavior | Actual executed fact / analytics behavior |
| --- | --- | --- |
| Stop ≥ any entry, invalid target/DSL, negative/unknown required inputs | Reject preview/approval with reasons | Preserve independently valid fill; missing/invalid original stop gives unavailable R |
| Size zero, risk/cash/exposure breach | No ready entry; show binding constraint | Record real fill with breach acknowledgement and reconciliation flag |
| Stale or mixed-session marks | No current eligibility claim; EOD-only review remains dated | Preserve actual fill; P&L cash is valid, current mark analytics provisional/unavailable |
| Unverified raw transport, ~100× price conflict, missing field time or incompatible contract/units | PRICE_VALIDATION_FAILED/BLOCKED; no live-ready recommendation or quote-based preview | Actual user fills remain recordable; rejected quotes cannot contaminate marks, indicators or historical realized P&L |
| NON_CONSOLIDATED data requested for NBBO/consolidated-volume or unsupported history | Unsupported dependent rule; disclose coverage and candidate shortage | Retain valid field facts with feed limitations; never invent a volume/history value |
| Native quota/auth/bridge failure or sleeping/offline PC | Pause/block due acquisition; discard obsolete live readiness and reevaluate after recovery | Local ledger arithmetic remains available; no credit purchase or API fallback |
| Oversell, duplicate fill, wrong owner, invalid fee/quantity | Reject | Reject because inventory/security integrity would be corrupted |
| Missing mandatory BUY emotion | Require explicit user response | Explicit UNKNOWN with reason or DECLINED is valid; never synthesize an emotion |
| Missing current stop, corporate-action conflict, incomplete valuation | Review required; suppress risk eligibility | Preserve ledger, disclose incomplete risk/analytics and reconcile |
| Provider revision/corrected execution | Recompute preview against a new version | Preserve original provenance and atomically rebuild a new validated projection |

## Verification plan and release gates

Run these tests independently of any model/API:

1. Decimal unit tests for exact risk, stop/target ordering, fee schedules, slippage, whole-share rounding and every fixture above; verify one-share-over-bound rejection.
2. Property tests: final q passes every exact constraint; q never exceeds cash/risk caps; allocations sum to sold shares; allocated plus remaining acquisition fees equal original fees; BUY/SELL cash equations conserve ledger value; no negative effective inventory; repeat replay yields identical results.
3. Database integration tests for atomic BUY+emotion, concurrent SELL conflict, idempotent requests, immutable history, backdated correction/reversal, owner separation and FIFO projection generation.
4. Valuation/time tests for holidays, expected completed sessions, stale marks, mixed sessions, split conflicts, external-flow boundaries, open-position drawdown and gaps. Include separate LIVE/EOD/MANUAL policies, per-field timestamps, NON_CONSOLIDATED limits, unresolved AAPL-scale fixtures, model-retyped capture rejection and incomplete portfolio valuations. Compare signed decimals/ratios before display rounding.
5. UI/E2E tests for partial SELL, explicit ADD, stop change without initial-R reset, risk-breach recording, plan approval blocked by stale evidence and as-of labels in every analytics view.
6. Broker reconciliation with a small user-provided redacted statement in a test environment: beginning cash + deposits - withdrawals - BUY outflows + SELL inflows + explicitly recorded internal cash events = ending cash; compare remaining quantities and order fees. This is a future validation activity, not a claim of completed verification.

Release requires every deterministic golden result and conservation invariant to pass, all local accounting mutations to be atomic/owner-scoped, and previews to be reproducible by source/quality/input/version references. Native Codex output quality cannot compensate for a failed accounting/source test. G0 live gates remain unrun and the observed AAPL discrepancy unresolved; this plan does not claim live readiness. Unresolved fractional corporate actions, missing history/stops, quota/billing/bridge blockers and stale valuations remain visible. The unchanged synthetic fixtures do not validate native transport, actual quote quality, subscriptions, notifications or schedule behavior.

## Implemented Phase7 reporting policy — CLOSED_TRADES_V1

Current corrected SQL trade projections, captured under the financial owner lock, own all closed net P&L and original gross first-batch R. Cohort dates are final effective SELL dates in Asia/Jerusalem, inclusive; entire lifetime result goes to closure period. No period-SELL-allocation/portfolio-return claim. Decimal48/half-even aggregate arithmetic is separate from authoritative SQL replay; unknown metric versions reject. Breakeven stays in win-rate/expectancy denominators; missing/nonpositiveR excludes only R, fees remain recorded/estimated, ADD/no-ADD segments keep frozenR. No separate account dividend/tax allocation.

Entry comparisons are first-batch maximum fill above pinned approval entry ceiling, and summed first-batch quantity above approved quantity, with eligible/excluded counts. No overall adherence score/intent/management inference. Effective nonreversed fills only; mixed entry emotions are MULTIPLE, each trade once. UNKNOWN/DECLINED/MULTIPLE are coverage; all emotion groups descriptive, fewer than20 insufficient, no causality/diagnosis/ranking. Historical valuation is incomplete: drawdown/TWR/MWR and exchange-session duration unavailable. Calendar elapsed days may be shown.10,000-trade cap is an explicit report rejection, not a silent500-row window. Snapshots pin revision/version/time and remain historical after corrections; current reports rebucket corrected closure dates.
