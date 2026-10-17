# Phase 8 — all tasks on the Windows computer

Use the cumulative `swingpilot-phase8-readiness-update.zip` for your existing extracted project. It supports knownv0.2–v0.7 predecessors, includes all prior manual application features, and changes no previously delivered migration. Existing private/test/native setup stays in place. The latest GitHub source is also available after the authorized push; use the manifest bundle for a reviewed merge into an existing folder with local bridge/evidence.

## 1. Merge without replacing your private setup

Stop running SwingPilot web servers with Ctrl+C. Extract the new archive into a **separate folder**. Open the existing project in Windows Codex, then paste:

> Merge the separately extracted SwingPilotv0.8 cumulative source update into this existing project. Read incoming UPDATE_MANIFEST.json, docs/PHASE8_DELIVERY.md, PHASE8_WINDOWS.md and LOCAL_RUNBOOK.md plus existing AGENTS.md. Verify incoming SHA-256 values and compare existing files against acceptedPreviousSha256 before merging. Review local changes/collisions rather than overwriting blindly. Preserve private config/data, local MCP bridge, Phase0 scripts/tests, six agents, unrelated files, local TASKS/VALIDATION_STATUS and newer Windows evidence. Do not reset/recreate Git metadata, owners, passwords or databases. Use the existing separate test configuration for migration/doctor/tests. No model/market/native tool requests, purchases, recurring task or public/LAN exposure. Backup/restore/drive checks remain deferred. Run the relevant automated/browser acceptance below and append sanitized evidence. Do not call the release accepted from passing cloud or database checks. At the end name the next milestone and say zero later numbered development phases remain, keeping unfinished acceptance explicit.

Keep configuration and data outside the repository and OneDrive. Project source itself can remain in the existing folder. No secret belongs in chat/Git/project.env. The stricter loader requires all three DB URLs to identify exactly the same loopback hostname/port/database, with separate migration/runtime/auth usernames. If it reports a mismatch or permission failure, local Codex should inspect the private configuration and PostgreSQL roles without printing credentials. Do not bypass it by reusing admin credentials or rerunning owner recovery.

## 2. Forward-migrate and verify the existing test setup

Run sequentially from the project directory:

```powershell
npm.cmd run db:migrate -- --test
npm.cmd run local:doctor -- --test
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:database
npm.cmd run test:http
npm.cmd run local:test:start
```

v0.8 adds **no migration**; if previous updates were skipped,0004–0007 apply in order. Delivered0001–0007 must stay byte-identical, and a second migration run must do nothing. Existing `%LOCALAPPDATA%\SwingPilot-test` settings are reused. Do not rerun `local:test:setup`/password recovery unless an independently diagnosed setup issue requires it. Dependencies did not change; `npm.cmd ci` is needed only when packages are absent. HTTP port3310 must be free; the test site is **http://127.0.0.1:3001**.

Doctor is read-only and prints JSON without URLs/passwords/paths/role names. Exit1 means a failure; inspect the safe check code locally. Exit2 on Windows means **manual ACL verification remains required**, even when all DB checks pass. It does not change ACLs/permissions, migrate, back up, restore or contact a model/provider. The web readiness screen checks DB metadata only, so a green web result cannot substitute for doctor/ACL/browser acceptance. Preserve actual Windows skips/failures; Linux-only fixtures are not Windows proof.

## 3. Verify Windows ACLs and browser behavior

- Ask local Codex to inspect the existing `%LOCALAPPDATA%\SwingPilot-test\config` and `data` ACLs and settings-file ownership using supported **read-only local** Windows tools. Record who has access in local evidence without sharing private names/paths publicly. Confirm the current-user-only setup reported earlier is still true. Doctor currently labels Windows ACLs manual; never change that status to independent OS proof merely because it ran. Review any concrete ACL repair locally before changing permissions; avoid broad Everyone grants.
- Login to the test site and open **תקינות מקומית / Local readiness**. It should displayv0.8.0, actual database permission checks, an acceptance-pending message and separate native/device/deferred-backup statuses. Refreshing it must not change financial records or enable anything.
- Verify keyboard access/visible focus, dark default, Hebrew RTL, narrow-window text/tables, login/logout and earlier fictional journal workflows. Complete PHASE7_WINDOWS's analytics/correction/weekly snapshot acceptance if still unverified. No real trading records are needed.
- If the doctor finds schema missing/changed/newer, stop and compare the source package and installed migration history. Do not edit applied SQL, delete migration rows, use a down migration or run setup/recovery to make it pass. LOCAL_RUNBOOK describes safe forward-fix handling. A versioned DB export from the site is not a full backup.

## 4. Finish only the authorized remaining acceptance

Actual Windows desktop notification acceptance remains in **PHASE6_WINDOWS.md**: explicitly enable/queue a synthetic test, inspect the existing registered AppID, close tabs, invoke the one-shot sender, then honestly report actual receipt/code/context. Sender accepted or a synthetic imported receipt is insufficient. No notification has been sent by this cloud update.

Native free request billing/history, field times/coverage, AAPL mismatch, subscription spending controls and actual native scheduling/sleep recovery remain open. Do not request quotes/history without an established no-charge mode. Keep monitoring off. No PWA/mobile/network exposure is enabled. Follow the existing Phase0 feasibility notes for evidence gathering rather than buying subscriptions or forcing a scale correction. Report unsupported capability as blocked.

Personal setup remains unstarted in the latest report unless newer local evidence says otherwise. Do not copy fictional test data into a personal journal. If a personal configuration already exists, stop its server and use its existing config with `npm.cmd run db:migrate` and `npm.cmd run local:doctor`; it stays separate from `--test`. No new personal setup or backup/restore action is performed by this checklist. Backups and the64GB drive remain deferred and untouched; recoverable production acceptance is unverified.

## 5. Return the results

Send a sanitized summary: merged package/source version, manifest collisions/resolution, migration result, doctor codes/exit, actual build/unit/DB/HTTP/Python counts/skips, manual Windows ACL result, browser/analytics/review outcomes, actual notification receipt if tested, and all still-open gates. Keep passwords, DB URLs, private exports/account IDs and personal files out of the message/GitHub. Local evidence stays authoritative; the cloud cannot inspect your PC automatically.

**Next milestone: Windows acceptance and existing-gate resolution. Zero later numbered development phases remain. The overall release is still awaiting acceptance, including deferred recovery.**
