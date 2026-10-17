# Windows steps — desktop notification tests v0.6

17 October2026. Use the cumulative **swingpilot-phase6-desktop-update.zip**. It includes earlier diagnostics/manual reviews/rehearsals and supports known delivered v0.2/v0.3/v0.4/v0.5 application source. Existing test setup works; do not reinstall PostgreSQL, recover passwords or recreate owners.

## 1. Merge and verify

Extract separately. In your existing local Windows Codex chat, paste:

> Merge this Phase6 desktop-test update using UPDATE_MANIFEST.json, docs/PHASE6_DELIVERY.md and docs/PHASE6_WINDOWS.md. Review accepted predecessor hashes/collisions. Preserve my bridge, agents, Phase0 tests, private configuration/data and newer local acceptance/TASKS/VALIDATION_STATUS. Stop the running test site, apply missing forward migrations only to the existing separate test setup, and run the documented checks. Do not repeat setup/password recovery or assume Git metadata exists. No paid services, real market/AI requests, recurring monitoring, public exposure or deferred backup work. Prepare the one-shot Windows test; send it only after I enable and queue it in the site. Record actual evidence without secrets. At the end state the next planned phase and count remaining, keeping unfinished acceptance separate.

Run sequentially in the project:

```powershell
npm.cmd run db:migrate -- --test
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:database
npm.cmd run test:http
npm.cmd run local:test:start
```

Migration0006 is new; skipped earlier additions apply in order. Delivered0001–0005 must remain unchanged. Tests create/remove only disposable test DBs; HTTP port3310 must be free. The existing private test config is under `%LOCALAPPDATA%\SwingPilot-test`; UI is **http://127.0.0.1:3001**. Dependency versions did not change; `npm.cmd ci` is needed only if packages are missing. Keep actual Windows skips/failures recorded. No secret belongs in chat or project `.env`.

## 2. Inspect the Windows sender before queueing

Ask local Codex to read `scripts/windows/desktop-test-toast.ps1` and `scripts/local/desktop-test.mjs`. The cloud could not execute Windows/WinRT. The adapter requires an existing registered AppID and a logged-in interactive Windows desktop; availability is a gate, not guaranteed by a passing Linux test.

In local PowerShell, inspect existing PowerShell host registrations:

```powershell
Get-StartApps | Where-Object { $_.Name -match 'PowerShell' } | Select-Object Name, AppID
```

Choose an actual returned AppID, preferably the existing Windows PowerShell host. Do not invent one or install/register a replacement automatically. The OS notice will be labeled with that chosen host's app name, while its body says SwingPilot TEST ONLY. Keep notification settings/Focus Assist under your control. The sender does not change them. If no suitable ID or WinRT support exists, record BLOCKED with the returned safe error; no paid fallback or broad policy change.

The Node sender passes the reviewed fixed script text to PowerShell and the synthetic payload through stdin; it does not change execution policy or put the receipt code in shell arguments/output. Local security policy may still block it; record/fix only the specific supported issue in the local chat, without disabling general protection.

## 3. Send one fictional owner-requested test

- Open **Notifications → desktop test**, or `/desktop-tests`, in the test site. Confirm tests are initially off and the existing inbox still works.
- Check the manual-test preference and save it. Queue one test. It expires after **ten minutes**. No send should happen from queueing alone.
- Close all SwingPilot browser tabs. Leave PostgreSQL, your Windows user session and the local terminal available. The web server may stay running; it is not the sender.
- In the project terminal, replace the placeholder with the **actual registered AppID** you inspected, then run once:

```powershell
npm.cmd run desktop:test -- --test --app-id REGISTERED_APP_ID
```

This reads the existing test config and attempts at most one queued synthetic notice. It starts no service/task, calls no model/data provider, and prints only safe outcome text. The receipt code appears only in the Windows notice. A SENDER_ACCEPTED result does **not** establish display.

- If you actually see it, note the six-digit code. Reopen the site, refresh delivery history, enter the code and honestly select whether all website tabs were closed. Confirm you saw the notice and submit. The UI must preserve separate sender acceptance and human-reported receipt.
- If nothing appears, leave receipt unconfirmed. Inspect the returned safe outcome and Windows settings locally. Never paste fake receipt evidence or mark a sender success as displayed. Test data must remain clearly synthetic.

## 4. Failure/privacy checks and remaining work

- Confirm the notice contains only the test title/code/instruction, and the website/CLI do not reveal the code before you read it. No journal money, emotion, screenshots or account data should appear.
- Use a wrong code on a fresh test to verify a failed attempt is recorded. Do not exhaust a real test accidentally; five wrong attempts lock it.
- Disable the preference and verify pending work is cancelled. A notice already delivered to Windows cannot be recalled; a send in progress may still appear.
- A known pre-send failure can be explicitly retried up to three attempts. UNKNOWN/expired outcomes are not automatically resent. Fix a concrete issue before creating a new test; duplicate physical notices after ambiguity remain possible.
- Test ordinary browser keyboard/RTL/narrow layout. Locked screen, Focus Assist/disabled notifications, actual sleep/restart and any native scheduler delivery require separately recorded real-device evidence. Synthetic SQL/mock outcomes do not prove those behaviors.
- iPhone private HTTPS/PWA/push remains blocked/unimplemented; do not expose the journal publicly or install a paid tunnel/domain. Automatic market monitoring/alerts remain off even if this synthetic desktop test succeeds.
- Personal setup/browser acceptance remains pending unless newer local evidence says otherwise. If a personal journal already exists, stop it and migrate with its existing config using `npm.cmd run db:migrate`; do not recreate the owner or copy fictional test data. Personal one-shot tests use the same command **without `--test`**, only after explicitly enabling/queueing there.
- Backups/64GB drive remain deferred and untouched. Preserve all newer local evidence and send a sanitized result summary back here. The cloud cannot inspect your PC automatically.

Next planned development is **Phase7: advanced journal/analytics**. **Two later numbered phases remain (7 and8)**, plus the outstanding Windows/native/market/mobile/backup acceptance gates. Phase6 is not fully accepted until actual device evidence is recorded.
