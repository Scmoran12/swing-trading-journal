# Windows steps for v0.5 monitoring rehearsals

17 October2026. Download **swingpilot-phase5-monitoring-update.zip** and extract separately. This cumulative update includes the diagnostics and manual-review source; it supports the delivered manual-v0.2 or v0.3/v0.4 application source. Do not reinstall PostgreSQL, recover passwords or recreate existing owners.

## 1. Merge with local Windows Codex

Paste into your existing local Windows Codex chat:

> Merge the extracted Phase5 monitoring update into this existing swingpilot-phase0 project. Read UPDATE_MANIFEST.json, docs/PHASE5_DELIVERY.md and docs/PHASE5_WINDOWS.md. Review accepted predecessor hashes/collisions; preserve native bridge, agents, Phase0 tests, private configuration/data and newer local WINDOWS_ACCEPTANCE/TASKS/VALIDATION_STATUS. My separate test setup already works. Stop the test server, migrate its existing configuration with forward additions only, and run the documented checks. No automatic monitoring/AI/provider requests, purchases, public exposure or deferred backup work. Do not assume the extracted folder has Git history. Record actual results and remaining blockers without secrets.

Compare each current file with `acceptedPreviousSha256`; if it has local changes or is an existing new path, review before merging. The incoming migration0005 is new. Migration0004 may also be new on your PC if you skipped the review update; the normal runner applies missing migrations in order. Existing0001–0004 must remain unchanged once delivered/applied. No blanket replacement of newer Windows evidence.

## 2. Migrate and verify the existing separate test journal

Stop the running site with **Ctrl+C**, then run sequentially:

```powershell
npm.cmd run db:migrate -- --test
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:database
npm.cmd run test:http
npm.cmd run local:test:start
```

`--test` loads the existing `%LOCALAPPDATA%\SwingPilot-test` configuration. Tests create/remove only their own disposable databases. Port3310 must be free; test UI is **http://127.0.0.1:3001**. Dependencies have not changed; use `npm.cmd ci` only if installed packages are missing. Record real Windows skips/failures rather than substituting cloud results. No setup wizard/password recovery is needed for an existing working test environment.

## 3. Fictional browser acceptance

- Sign in and open **מועדי בדיקה וניטור** (`/monitoring`). Verify that automatic monitoring is explicitly inactive, missing evidence is listed, and no successful market check is claimed.
- Enter a manual OPEN rehearsal for **2026-11-27**, close13:00 New York, with a clearly fictional source note and acknowledgment. Preview/save. Expected AFTER_CLOSE **18:15 UTC /20:15 Jerusalem**, plus a separate22:40 Jerusalem run (**20:40 UTC**). Both must remain visible.
- Enter **2026-10-13**, close16:00. Expected22:40 Jerusalem **19:40 UTC**, AFTER_CLOSE **20:15 UTC /23:15 Jerusalem**. This tests reversed ordering of the two checks; it is not fresh market data.
- Declare a CLOSED date with no close. It must create no probes. Unknown dates must never acquire inferred weekday runs.
- Edit an existing scenario after loading it. Verify a new version appears, old pending/blocked runs become superseded, and the original note/times remain in history. Reopen the page and check that saved state persists.
- Click **בדיקת מועדי התרגול עכשיו** for a past scenario such as2026-03-09. Past windows must become expired/suppressed without entry alerts, notifications or Codex/broker activity. Upcoming dates stay pending. This is an explicit manual DB-clock rehearsal, not an actual scheduler or OS sleep test.
- Test cancellation, readable Hebrew/RTL, keyboard focus and a narrow browser window. No automatic refresh/polling is promised; click Refresh to update the displayed server assessment time.

Do not edit production SQL clocks/timestamps to manufacture acceptance. The automated recovery tests use only disposable synthetic records. Complete earlier fictional journal/review/diagnostic browser checks if still pending; see WINDOWS_TODO, PHASE3_WINDOWS and PHASE4_WINDOWS for their separate workflow steps, not old merge instructions.

## 4. Personal journal and gates that remain

If personal setup is still unstarted, finish fictional browser acceptance first, then follow WINDOWS_TODO section6; choose passwords only in the local terminal. New setup applies all five migrations. If the personal journal already exists, stop it, run `npm.cmd run db:migrate` with its existing private configuration, then restart. Do not recreate the owner or copy fictional test data into the personal journal.

Keep recurring monitoring inactive. Real operation still requires verified free connector request mode/history, exact raw-source capture, AAPL unit reconciliation and independent field times, verified calendar, included-only usage controls, supported native two-time dispatch/recovery and human notification receipt. The new page cannot mark those gates passed or activate a task. A manual source note is not authoritative calendar proof.

No Windows scheduled task, native Codex automation, OS notification or public/LAN exposure should be installed by this update. Do not buy subscriptions/credits/data or touch the deferred64GB backup drive. Backup readiness remains unverified. Send the actual local summary and sanitized errors back to the cloud chat; it cannot inspect your PC automatically.
