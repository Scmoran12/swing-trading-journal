# Windows steps for the manual Codex-review update

17 October 2026. Use the cumulative **swingpilot-phase4-reviews-update.zip**. It contains Phase 3 diagnostics plus Phase 4 reviews and supports your previously delivered manual v0.2 or diagnostic v0.3 application source. No PostgreSQL reinstall, password recovery or owner recreation is required.

## 1. Merge in the existing local Windows chat

Extract separately, then paste into the local Windows Codex chat:

> Merge the extracted Phase 4 reviews update into this existing swingpilot-phase0 project. Read UPDATE_MANIFEST.json, docs/PHASE4_DELIVERY.md and docs/PHASE4_WINDOWS.md. Compare current file hashes with acceptedPreviousSha256 values; review any collision. Preserve my native bridge, agents, Phase 0 tests, configuration/data and newer local WINDOWS_ACCEPTANCE/TASKS/VALIDATION_STATUS. Do not assume Git history exists in the extracted folder. My separate test setup already works; do not repeat setup or password recovery. Stop the test server, apply only the new forward migration to the test configuration, then run the documented checks. No paid services, automatic AI/provider requests, monitoring, public exposure or deferred backup checks. Update actual results and remaining blockers without secrets.

A new path may already exist in your local work; review it before replacing. The manifest accepts known v0.2/v0.3 predecessors and leaves unrelated work untouched. Existing migrations0001–0003 must remain byte-identical. Merge handoff evidence into newer local status files rather than replacing them.

## 2. Migrate the separate test database and check

Stop the running test server with **Ctrl+C**, then run sequentially in the existing project:

```powershell
npm.cmd run db:migrate -- --test
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:database
npm.cmd run test:http
npm.cmd run local:test:start
```

`--test` selects the existing `%LOCALAPPDATA%\SwingPilot-test` configuration. The migration adds review tables/functions and preserves financial facts. Test suites use fresh disposable `swingpilot_test_*` databases. Port3310 must be free; the test UI uses **http://127.0.0.1:3001**. Dependency versions did not change; run `npm.cmd ci` only if packages are missing. Record actual Windows skips and failures. Do not run competing builds/servers.

## 3. Test the new page with fictional data

- Sign in to the existing test journal. Create a fictional manual plan with a future expiry if needed. Open **סקירות Codex** (`/reviews`).
- Inspect the sharing preview, acknowledge it and save a request. Confirm the page says it is waiting for manual Codex work. No external call should occur.
- Open the packet. Verify it contains only the selected manual plan, not cash, trades, emotions, images, credentials or account identifiers. The original manual text is included, so check it for accidental private information.
- Close/reopen the browser page and confirm the request persists. Test a usage pause, verify the packet is unavailable, then resume. These are manual state controls and do not inspect billing.
- For an **offline fixture-only acceptance**, use the packet's JSON output example with its exact job ID/hash, set modelLabel to `OFFLINE_FIXTURE_NOT_CODEX`, set findings to an empty array and limitations to `['Offline fixture only; no model or market evidence.']`. Import it and confirm that the result remains visibly unverified and the plan/financial records do not change. This is not native AI proof.
- Create another request, open its packet, then edit the plan or record a fictional cash movement. Confirm the packet is no longer exportable and a late copied response is stored as stale. Test cancellation and review history. Never edit SQL directly to fabricate acceptance.
- Check keyboard navigation, readable Hebrew/RTL and narrow-window layout. Complete the remaining manual journal/browser goldens from WINDOWS_TODO if still pending; Phase 3 diagnostics can be tested using PHASE3_WINDOWS.

## 4. Optional actual native review acceptance, after usage controls are checked

Inspect the native Plus account's included-only usage/credit controls manually first. The website **cannot** enforce billing in a separate Codex chat or guarantee unused allowance. Do not buy/enable credits, API usage or overages. If included usage is unavailable, leave the job paused.

With included-only controls confirmed, manually copy one fictional packet into the existing native Codex chat, using your selected available coding model with **High** thinking effort. The packet instructs Codex to use no tools, plugins, quote/history calls or API fallback. Paste its JSON response back and record the actual result locally. The app validates structure/references, not factual correctness or model identity; read all commentary yourself.

This acceptance is optional for local storage/UI checks, and no native run has been performed by this cloud chat. There is no automatic dispatch to activate.

## 5. Personal setup and remaining gates

If personal setup has **not** started, complete fictional browser acceptance first, then follow WINDOWS_TODO section6 with passwords entered only in the local terminal. New setup applies all four migrations. If the personal journal already exists, stop it and run `npm.cmd run db:migrate` using its existing private configuration before restarting; do not recreate the owner or import fictional test data.

Free broker quote/history billing, exact raw capture, AAPL scale reconciliation, source timestamps/coverage, real schedules and human notification receipt remain unresolved unless newer local evidence proves them. Keep monitoring and market-backed intelligence blocked. Backups and the 64GB drive remain deferred and untouched. No public/LAN exposure or purchases.

Send the actual local summary and sanitized errors back to the cloud chat. Code-only rollback can use the previous application source while leaving the new unused DB tables intact; do not attempt a destructive database downgrade or claim backup restoration was tested.
