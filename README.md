# SwingPilot AI

Personal Hebrew RTL swing-trading journal, dark by default. **v0.8 adds local readiness diagnostics, a read-only doctor command and stricter private/test configuration guards.** Manual ledger, analytics, manual Codex reviews, inactive schedule rehearsals and opt-in desktop tests remain available. Actual Windows/native/device/billing/recovery acceptance is incomplete; this is not an accepted monitored trading release. Start with [Phase8 delivery](docs/PHASE8_DELIVERY.md), [Windows checklist](docs/PHASE8_WINDOWS.md) and [local runbook](docs/LOCAL_RUNBOOK.md). Next milestone: Windows acceptance and existing-gate resolution; zero later numbered development phases remain.

Implemented: local owner login/recovery, protected storage, plans/approvals, whole-share buys/ADDs/exits, exact SQL FIFO/cash/P&L, audited corrections, manual marks, private screenshots, inbox and JSON export. It records actions already executed at your broker and never submits orders.

Use the [current Windows checklist](docs/PHASE8_WINDOWS.md) and [local operation runbook](docs/LOCAL_RUNBOOK.md); earlier manual browser tasks remain in WINDOWS_TODO. Configuration/data live outside the repository and OneDrive. Existing Plus is sufficient to develop/test within its allowance; ordinary journal operation uses no AI allowance. Native market/AI automation, billing/price/spending controls and actual notification/schedule evidence remain separate gates. Backup checks remain **DEFERRED_UNVERIFIED** at the user's request.

## Existing Windows installation

Do not repeat initial setup/password recovery for an update. Merge reviewed source with the current manifest, preserve the private config/data/native bridge/evidence, and use:

```powershell
npm.cmd run db:migrate -- --test
npm.cmd run local:doctor -- --test
```

Doctor is read-only. Windows ACLs require manual evidence(exit2); passed DB checks do not complete release acceptance. Source/version and existing-gate status are visible at `/readiness` after login. Existing test UI is http://127.0.0.1:3001.

## Fresh installation only

Requires Node 22+ (24 LTS recommended), local PostgreSQL 16+ (17/18 recommended), and loopback-only PostgreSQL listening.

```powershell
npm.cmd ci
npm.cmd run local:test:setup
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:database
npm.cmd run test:http
npm.cmd run local:test:start
```

Test UI: http://127.0.0.1:3001. Use fictional data only. After acceptance, stop it and run:

```powershell
npm.cmd run local:setup
npm.cmd run start
```

Personal UI: http://127.0.0.1:3000. Enter passwords directly in the local interactive terminal, never chat or project .env files. The setup wizard creates local databases/accounts; no paid API key, hosting or data subscription is required. See the checklist for safe merging, legacy page removal, PostgreSQL configuration, permissions, recovery and remaining integration gates.

[Six project roles](AGENTS_ROLES.md) remain in `.codex/`; they share included Codex allowance. [Full plan](docs/IMPLEMENTATION_PLAN.md), [decisions](docs/DECISIONS.md), [tasks](docs/TASKS.md) and [evidence](docs/VALIDATION_STATUS.md) distinguish planned, implemented, observed, reported and unverified behavior. The earlier Phase 0/foundation handoffs are historical; use the latest checklist.
