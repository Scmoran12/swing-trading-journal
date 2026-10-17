# Everything to do on your Windows computer

This is the current checklist for the **manual journal v0.2**, superseding the earlier foundation-only launch instructions. Cloud tests do not establish Windows installation, visible notifications or native scheduling. Backup checks remain deferred as requested.

## Current handoff — local readiness v0.8

Follow [PHASE8_WINDOWS.md](PHASE8_WINDOWS.md) and [LOCAL_RUNBOOK.md](LOCAL_RUNBOOK.md), including the cumulative manifest merge, existing test migrations, read-only doctor, tests and outstanding browser/native/device acceptance. Preserve private setup/evidence and deferred backups. Next milestone Windows acceptance/existing gates; zero later numbered phases, full release still pending. Earlier handoffs below are historical; do not recreate setup or treat passing diagnostics as acceptance.

## Historical handoff — desktop tests v0.6

Use [PHASE6_WINDOWS.md](PHASE6_WINDOWS.md) and the cumulativev0.6 bundle. Preserve existing setup/evidence; forward-migrate the separate test configuration without recreating owners. Actual desktop send occurs only after you enable/queue a test and invoke the one-shot command on Windows. No monitoring/trading alerts or mobile push. Next planned phase7; two later phases7–8 remain plus outstanding validation.

## Historical handoff — inactive monitoring rehearsals v0.5

Use [PHASE5_WINDOWS.md](PHASE5_WINDOWS.md) and the cumulative v0.5 bundle. It includes diagnostics/reviews, so earlier incremental ZIPs are unnecessary. Migrate the existing separate test configuration forward, preserving owners/private setup/newer Windows evidence. Do not activate tasks/monitoring or repeat password recovery. The older manual sections below still cover browser/personal acceptance pending in the latest supplied report.

## Historical handoff — manual reviews v0.4

Use [PHASE4_WINDOWS.md](PHASE4_WINDOWS.md) for the cumulative v0.2/v0.3-to-v0.4 merge and new test-only migration. It includes diagnostics, so the separate Phase 3 ZIP is unnecessary. Preserve existing setup/owners and newer Windows evidence. The older sections below retain manual browser acceptance/personal setup steps, which were still pending in your latest report. No new Windows acceptance is assumed.

## Current continuation — 17 October 2026

Your automated Windows manual-v0.2 checks are reported passed, including PostgreSQL/test setup and current-user ACLs. Do not repeat recovery/setup. Interactive fictional-data acceptance and personal setup remain pending. For the new **v0.3 Phase 3 diagnostic delta**, follow [PHASE3_WINDOWS.md](PHASE3_WINDOWS.md). The sections below retain the original manual checklist; sections5–6 still cover remaining browser/personal acceptance. No new billing/market/notification/schedule proof was reported. The existing extracted Windows folder had no Git metadata. Preserve newer local evidence.

## 1. Merge the latest update into your existing project

- Download the **manual-journal update ZIP** and extract it into a separate temporary folder.
- Open your existing SwingPilot project in a **local Windows Codex chat**. Keep its native MCP bridge, Phase 0 tests, Git history and newer local status documents.
- Ask Codex to merge the incoming files after reviewing collisions. The bundle is cumulative for the application: you do not need to apply the earlier foundation update first.
- Read `UPDATE_MANIFEST.json`: three old, unprotected page paths must be removed or moved before building. Delete them automatically only when their hashes match the known foundation originals; review local modifications instead. The replacements are under `src/app/(protected)/`.
- Add missing `.gitignore` entries without replacing existing rules: `node_modules/`, `.next/`, `*.tsbuildinfo`, `.env`, `.env.*`, `!.env.example`, `reports/`.
- Merge the new delivery results into local TASKS/VALIDATION_STATUS; do not replace those newer Windows documents with older cloud copies.

Suggested prompt for the local chat:

> Merge the extracted manual-journal update into this existing Windows project. Read UPDATE_MANIFEST.json, docs/PHASE2_DELIVERY.md and docs/WINDOWS_TODO.md. Preserve my native bridge, Phase 0 tests, .codex agents, Git history, credentials and local evidence. Review collisions and remove legacy unprotected pages only when their hashes match the manifest. Continue the Windows setup/checks below using local-only services. Do not request paid quotes, activate monitoring, buy services, expose ports or run deferred backup checks. Ask me to enter passwords directly in the local setup terminal; never print or request them in chat. Update actual test results and remaining blockers.

## 2. Install/check the free local prerequisites

- **Node.js 22+**, preferably Node 24 LTS, from [nodejs.org](https://nodejs.org/en/download). Verify `node --version` in a new PowerShell window.
- **PostgreSQL 16+**, preferably 17 or 18, from the [official Windows download page](https://www.postgresql.org/download/windows/). Remember its administrative username/password locally. Additional paid database services/add-ons are unnecessary.
- Start the local PostgreSQL Windows service. Keep its port local, normally **5432**.
- Verify `listen_addresses` in PostgreSQL is `localhost`, `127.0.0.1`, `::1`, or a combination of those. The setup wizard refuses `*` or other interfaces. If necessary, have local Codex review `postgresql.conf` and `pg_hba.conf` and restart only the selected local PostgreSQL service. Keep password authentication and do not expose the DB to LAN/internet. Existing unrelated database use must be preserved.
- You do not need `psql` on PATH, Docker, a hosted database, an OpenAI API key or a new IBKR subscription to run this journal.

## 3. Install packages and configure a separate test journal

From the existing project folder in PowerShell:

```powershell
npm.cmd ci
npm.cmd run local:test:setup
```

Enter these **directly in the local terminal**:

- Database name: accept `swingpilot_test_acceptance`.
- Local PostgreSQL administrative username, port and password.
- A test login name and a test password of 12–128 characters. Use a disposable test password, not your personal app password.

The wizard creates the database, applies migrations, creates restricted runtime accounts and creates the test owner. It stores configuration and images outside the repository/OneDrive, under:

```text
%LOCALAPPDATA%\SwingPilot-test\config\settings.json
%LOCALAPPDATA%\SwingPilot-test\data\
```

Do not copy secret values into chat. The Windows ACL setup needs verification on the actual computer: inspect that folder/file permissions restrict access to your Windows account. The cloud tested the Linux equivalent, not Windows ACL behavior.

If you previously created a project `.env.local` from the old template, have local Codex preserve anything still needed privately and remove **only SwingPilot application secrets** from project `.env` files. Preserve unrelated bridge variables. The new app refuses to load app secrets from synced project `.env` files. Do not put the new settings file into OneDrive or Git.

## 4. Run the local checks

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:database
npm.cmd run test:http
```

The last two commands use the **separate test configuration**, create randomly named temporary `swingpilot_test_*` databases, run the suites and drop only those created databases. The personal database is not selected. HTTP tests temporarily use port **3310**; it must be free. Do not run competing builds/servers during those checks. Missing test setup/build is reported as a failure rather than a fake pass. Windows-specific skipped Unix tests must remain recorded as skipped.

Ask local Codex to fix genuine Windows failures while preserving the no-paid-service and backup-deferral constraints. Share error summaries here if needed, with credentials omitted.

## 5. Check the actual website in the test environment

```powershell
npm.cmd run local:test:start
```

Open **http://127.0.0.1:3001** and sign in with the test owner. Keep the terminal open. The page must clearly say it is a separate test environment.

Check these with **fictional data only**:

- Login, logout, reopen a protected page, and confirm it returns to login. Password recovery is available from a local terminal through `owner:recover` for the personal account; the automated tests already check recovery/session invalidation with isolated fixtures. Do not reset real credentials just to test.
- Hebrew, RTL, dark first render, keyboard navigation, small-window layout and readable errors. Browser visual/physical QA was not available in the cloud.
- Create a test portfolio with **$10,000 opening cash**, a date before all test executions, 1% trade risk, 20% position limit, 80% total limit, 40% sector limit and zero cash buffer.
- Create a manual plan: entry 100, stop 95, target 120, estimated buy fee 1, sell fee 1, slippage 0. Confirm the manual identity/fee assumptions and choose a future expiry. Approval should allow **19 shares** in this fixture.
- Record a completed BUY of **10 at 100, fee 1**, with an explicit emotion. Record an ADD of **5 at 110, fee 1**, acknowledging its deviation. Use increasing execution times.
- Sell **12 at 120, fee 1.20**. Expected remaining quantity **3**, remaining carrying basis **$330.60**, realized P&L **$217.40**, cash **$9,886.80** and initial R baseline **$50**.
- Enter a dated manual mark of 120 after the last execution. Expected journal equity **$10,246.80**. The page must identify it as a dated manual observation.
- Sell the final **3 at 90, fee 0.30**. Expected closed quantity **0**, total net P&L **$156.50**, cash **$10,156.50**, closed result **3.13 initial R**.
- Try a correction that would create a historical oversell: it must fail without altering the original record. Try a valid correction and verify the original/reversal/replacement history remains visible.
- Check cash deposits/withdrawals and an audited cash correction, an inbox acknowledgment, a private PNG/JPEG/WebP attachment, and JSON export. A JSON export is **not** a full database/files backup.
- For historical trades without a known original stop, leave it unknown and check R is unavailable. Estimated fees must be explicitly marked and shown as estimates.

Stop the test server with **Ctrl+C** before switching to the personal journal. Cookies are not separated by port; test and personal secrets differ, so switching can require signing in again.

## 6. Configure and start the personal journal

After the test environment passes:

```powershell
npm.cmd run local:setup
npm.cmd run start
```

Accept the personal database name `swingpilot`, enter the local PostgreSQL credentials, and choose your personal login/password directly in the terminal. Open **http://127.0.0.1:3000**.

Personal configuration/data are separate:

```text
%LOCALAPPDATA%\SwingPilot\config\settings.json
%LOCALAPPDATA%\SwingPilot\data\
```

- Create the personal portfolio using real, dated opening **cash**, not an invented equity balance. Record deposits/withdrawals separately. Do not import the test journal.
- Keep PostgreSQL and the Node terminal running while using the site. You can later double-click `scripts\windows\Start-SwingPilot.cmd` to launch the existing production build. Closing the browser does not stop that server; closing its terminal does.
- The manual journal does not need Codex running and does not consume AI allowance for ordinary local use. It records broker actions you already executed; it never submits an order.
- Future code updates: stop the Node server, review/merge updates, `npm.cmd ci`, `npm.cmd run db:migrate`, `npm.cmd run build`, then `npm.cmd run start`. Never edit an applied migration or delete the database to bypass a migration error.
- If your personal app password is forgotten, run `npm.cmd run owner:recover` in the same Windows account. This changes the local password and revokes sessions. Keep secrets out of chat.

## 7. Pending market/AI checks — not needed for the manual journal

These remain acceptance gates for later phases:

- **IBKR billing:** obtain documentation/account-specific confirmation of the connector's free request mode before quote/history requests. Your $0 subscription screen does not establish that every snapshot call is free. Do not buy entitlements or loop requests to discover the charge.
- **Prices:** after billing is established, resolve the original AAPL last≈3.43 versus bid/ask≈343 inconsistency using documented units and compatible timestamped evidence. Never apply an assumed ×100 fix. Verify per-field observation times, nonconsolidated coverage and historical-bar availability.
- **Plus spending:** manually inspect Codex/ChatGPT Usage & Billing, included allowance, purchased credit balance and auto-reload. Auto-reload off alone does not prevent an existing balance being consumed. Included-only unattended behavior remains unverified. ChatGPT desktop billing UI inspection must be manual; no GUI automation is required here.
- **Native integration:** preserve the already reported Windows MCP/listing capture tests. Original quote-event provenance and owner/job-scoped production bridge integration still need proof.

## 8. Pending notification/schedule/device checks — keep monitoring inactive

- Send a clearly labeled non-trading test through the existing native/OS path, with website tabs closed. **You must confirm seeing it.** A sender return or a local inbox entry is not proof of desktop receipt.
- After data/spending gates are resolved, test actual native due execution, sleep/wake, offline recovery, authorization expiry and limits. Preserve **22:40 Asia/Jerusalem** and **regular US market close +15 minutes**, including DST, holidays and early closes. Offline assertions do not prove real scheduled execution.
- Do not activate recurring monitoring until those prerequisites pass. Automatic startup/supervision and long-run reliability are not installed by this update.
- iPhone access/push remains a later conditional task requiring trusted private HTTPS, routing, explicit device permission and actual receipt. Do not expose the journal or PostgreSQL publicly or buy a tunnel/domain to make this pass.

## 9. Deferred — do not perform now

Backup checks, formatting or use of the proposed 64 GB drive, encrypted backup and restoration remain **DEFERRED_UNVERIFIED**, as you requested. Do not mark them complete. The current development result is not a verified recoverable production release.

## 10. What to send back

Paste the local Codex summary with: Node/PostgreSQL versions, build/typecheck/unit/database/HTTP outcomes, manual browser checks, any failed Windows ACL/setup step, and unresolved blockers. State notification receipt explicitly if actually observed. Do not send passwords, settings.json contents, cookies or account identifiers. Backup status should still say deferred.
