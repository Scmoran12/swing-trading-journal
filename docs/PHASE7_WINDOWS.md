# Phase 7 — tasks on your Windows computer

Use the cumulative `swingpilot-phase7-analytics-update.zip`. It includes application changes from known0.2–0.6 predecessors plusv0.7. The cloud cannot inspect your PC; keep newer local acceptance results authoritative. This handoff does not require new subscriptions, model/API keys, market requests or permission changes.

## 1. Review and merge the source update

Download/extract the archive **separately**, then open your existing project in Windows Codex (previous path: `C:\Users\user\OneDrive\שולחן העבודה\swingpilot-phase0`). Stop any running SwingPilot test/personal web server with Ctrl+C first. Give local Codex this prompt:

> Merge the separately extracted SwingPilot v0.7 cumulative update into this existing project. Read AGENTS.md, UPDATE_MANIFEST.json and incoming docs/PHASE7_DELIVERY.md/PHASE7_WINDOWS.md. Verify every incoming file hash. Compare current files with acceptedPreviousSha256 for known0.2–0.6; review any collision or locally edited/new path instead of overwriting blindly. Preserve the native MCP bridge, Phase0 scripts/tests, agents, private configuration/data, unrelated files, historical local TASKS/VALIDATION_STATUS and newer Windows evidence. The extracted project previously had no Git metadata; do not recreate/reset history. Apply only missing forward migrations to the existing separate test setup. Run relevant tests and the fictional-data browser checks below. No market/model/provider calls, purchases, recurring tasks, public exposure, real financial records, backup work or drive writes. Append sanitized evidence; finish with the next planned phase and remaining count.

The manifest intentionally excludes private settings, dependencies/build output, Git/agents/Phase0 files and local status docs. Keep those files. No database/file copy to the cloud or project.env. All private configuration/data stay outside the repository/OneDrive under your existing OS-private setup.

## 2. Apply and verify in the existing test setup

From the project terminal, run sequentially:

```powershell
npm.cmd run db:migrate -- --test
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:database
npm.cmd run test:http
npm.cmd run local:test:start
```

Dependencies are unchanged; use `npm.cmd ci` only if dependencies are absent. **0007** is the new migration; any missing0004–0006 apply in order. Delivered0001–0006 must not be edited. Re-running migration must be a no-op. Use existing `%LOCALAPPDATA%\SwingPilot-test` private configuration; do not rerun setup/recovery or recreate owners to apply an update. Integration tests create/remove only disposable `swingpilot_test_*` databases. HTTP port3310 must be free. The test site is **http://127.0.0.1:3001**. Record actual Windows pass/skip/failure counts; Linux results do not prove Windows behavior.

## 3. Complete the browser checks using fictional data

1. Log into the test site and finish the earlier manual journal acceptance if still pending. Open **Analytics / ביצועים ותובנות** from navigation. Confirm dark default, Hebrew RTL, readable mobile-width tables, keyboard date fields/buttons, visible focus and no clipped content. Ordinary journal/analytics work should require no Codex invocation.
2. Select a period with no closures: show zero count, unavailable rates/means/R and explicit open/out-of-period exclusions. Select a known closed fictional trade and compare its fee-inclusive result with the source trade link. Open trades/partial realized gains must not enter the closed cohort. Test same-day, reversed and impossible date ranges.
3. On a disposable fictional portfolio, reproduce the independently tested FIFO case if practical: openingUSD10,000; approved entry100/stop95/target120, risk1%, position20%, exposure80%, sector40%, BUY/SELL fee estimates1 each, slippage0, no buffer. Approval should size19shares. First BUY10@100 fee1; ADD5@110 fee1; SELL12@120 fee1.2; final SELL3@90 fee0.3. Expected closed netUSD156.50; initial riskUSD50 and result3.13R. Record actual events honestly as fictional test records only, acknowledge test deviations where required. A later correction of final SELL to100 yields186.50 and3.73R; the original saved snapshot must retain156.50/3.13R.
4. A closure at2026-01-04 22:00Z belongs to **January5 in Jerusalem**, not January4. Dates are closure cohorts for the whole trade, not sums of sales inside the chosen range. Table timestamps are explicitly UTC. Verify source quantities/fees/R and ADD/entry-emotion coverage. Missing original stop keeps currency results but excludes only R; unknown/declined/mixed emotions remain separate. Deposits must not become profit or portfolio return.
5. Verify historical entry comparisons still use the pinned approval after a new plan draft. Do not interpret price/quantity differences as an overall discipline score. Drawdown, TWR, MWR and trading-session durations must remain unavailable; no invented equity curve.
6. Choose the period for a weekly review (seven days, or an explicitly different range). Keep emotion-sharing off initially. Read the sharing explanation, acknowledge, save and open the packet. It should include aggregates/coverage only, without symbols, trade IDs, individual emotions, notes, screenshots, balances or credentials. Saving/copying does not run Codex. Check opt-in emotion aggregates separately if desired. The **local snapshot export includes trade details/emotions** and stays private; do not confuse it with the minimal packet.
7. You may validate import offline using the packet's OUTPUT_SCHEMA_EXAMPLE with its exact jobId/hash, UNKNOWN model label and clearly fictional limitations. This is a **synthetic imported fixture**, not evidence of a real AI run. Check wrong hash/reference/extra approval fields reject. A valid import remains labeled unverified and changes no finances. Check pause/resume and reload persistence. Reading an inbox item must not stale the job; a journal correction or new plan/cash command must mark it stale. A late import should become STALE_RESULT; original export remains unchanged.
8. An actual optional Codex review should use only your existing native included-usage chat after you personally confirm included usage is available. Do not enable credits/API/paid fallback; pause the local job if quota/auth is unavailable. No real external AI run is required to verify the local import mechanics. Structural acceptance never proves commentary/model provenance.

## 4. Preserve remaining acceptance gates

Earlier v0.3–v0.6 diagnostics/reviews/rehearsals/desktop browser checks remain pending unless newer local evidence passes them. Actual Windows notification display with website tabs closed and honest human receipt is still governed by **PHASE6_WINDOWS.md**; use its explicit opt-in/queue/one-shot steps if ready. A simulated code or sender acceptance is not real human receipt. Do not activate a service/task, trading monitor, mobile push or provider connection from these analytics tests.

Free quote/history billing mode, exact timestamps/coverage and the unresolved AAPL scale discrepancy still need native evidence; do not issue data requests without established no-charge mode. Subscription spending controls, actual native scheduling/recovery and physical-device checks remain unverified. Keep loopback binding. Backups/restore/64GB drive remain deferred and untouched. Personal setup remains pending unless your local evidence says otherwise. If a personal configuration already exists, stop its server and apply missing migrations with `npm.cmd run db:migrate`; do not recreate its owner or import fictional data.

Send a sanitized summary of merge/migration results, actual test counts/skips, browser checks, snapshot/correction/import results and remaining blockers. Exclude passwords, connection strings and private trade exports.

**Next planned phase:8 — local production readiness. One later numbered phase remains(8), plus outstanding acceptance from earlier phases.**
