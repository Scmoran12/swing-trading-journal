# Windows steps after the market-diagnostics update

17 October 2026. Your reported automated v0.2 checks passed. **Do not reinstall PostgreSQL, repeat password recovery, recreate the test owner or replace existing setup/configuration.** Interactive browser acceptance and personal setup are still pending.

## 1. Merge the incremental source update

Download `swingpilot-phase3-diagnostics-update.zip` and extract separately. In your existing **local Windows Codex chat**, paste:

> Merge the extracted Phase 3 diagnostics update into this existing swingpilot-phase0 project. Read UPDATE_MANIFEST.json, docs/PHASE3_DELIVERY.md and docs/PHASE3_WINDOWS.md. Compare each expectedPreviousSha256 with the current local file before replacing it; review any collision, and never replace local changes blindly. Preserve the native MCP bridge, agents, Phase 0 tests, private configuration/data and local WINDOWS_ACCEPTANCE/TASKS/VALIDATION_STATUS. My test setup already works; do not repeat setup or password recovery. Stop the test server before building. Run build, typecheck, application tests and production HTTP tests against the existing separate test configuration. Do not request market data, enable monitoring, buy services, expose ports or run deferred backup checks. Record actual results and remaining blockers without secrets. The Windows extracted folder previously had no Git metadata; do not invent transferred history or overwrite another repository.

The update is a **delta from the manual v0.2 ZIP** you already merged. It includes predecessor hashes for changed existing files. A null predecessor hash means a new path: review if that path already exists locally. New handoff documents describe cloud/report evidence; append applicable results to newer Windows status files rather than replacing them.

## 2. Run the new checks

Stop the running test site with **Ctrl+C** in its terminal. In the project folder:

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:http
npm.cmd run local:test:start
```

No dependency version or migration changed; package/lock metadata and the test command changed. Existing installed dependencies and test configuration are sufficient. If dependencies are missing, run `npm.cmd ci`. Keep port 3310 free for HTTP tests and run checks sequentially. Record Windows skips rather than turning them into passes.

## 3. Finish interactive acceptance using fictional data

Open **http://127.0.0.1:3001**, sign in with the existing test owner, then open **Research / מחקר מניות** (`/research`).

- Click **דוגמה עקבית**, then **בדיקת הנתונים** promptly. Expect no sample hazards and a visible statement that live/end-of-day use remains blocked.
- Click **דוגמה לפער פי 100**, then check. Expect `UNIT_SCALE_UNRESOLVED`; last remains **3.43**, never silently multiplied.
- Set bid `observedAt` to `null`, then check. Expect a missing-source-time finding despite a recent receipt time. Refresh the fictional example if it has aged over 60 seconds.
- Check keyboard focus, narrow-window layout and readable Hebrew/RTL. Sign out and confirm `/research` cannot show private diagnostic content without login.
- Complete the remaining fictional-data journal acceptance in **WINDOWS_TODO sections 5–6**, including the FIFO/cash/R goldens, corrections and private attachment. Those older manual steps remain applicable. Personal setup starts **after** that acceptance; enter passwords directly in the local terminal.

The diagnostic screen sends data only to the local app and retains no observation. Use only small sanitized normalized samples; do not paste account IDs, tokens or full private tool transcripts. It cannot establish authenticity or authorize a broker request.

## 4. Evidence needed before the next live integration slice

- In the native account/provider UI, manually inspect the existing connector's free quote/history request mode and Plus included-only usage/spending controls. Save sanitized conclusions in the local evidence document. Do not change subscriptions or purchase data/credits. Unknown billing remains blocked; do not test it by making speculative requests.
- After the no-additional-charge mode is documented, local Codex can plan a small read-only native raw-capture test. It must retain exact tool evidence, identity, field units and independent source times; no model-retyped authoritative numbers or 100× guesses. That test is not activated by this update.
- Human notification receipt, both actual schedules and unattended recovery remain later gates. A sender success or inbox record is insufficient; leave recurring monitoring off.
- Backups and the proposed 64 GB drive remain untouched and deferred.

Send the local result summary and any sanitized errors back to this cloud chat. The cloud cannot read your Windows project automatically.
