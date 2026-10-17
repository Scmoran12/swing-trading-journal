# Phase 1 — independent local foundation slice

Historical handoff: superseded by WINDOWS_TODO.md and PHASE2_DELIVERY.md. Preserve original evidence; do not follow obsolete backup or project-.env instructions.

14 October 2026. The user asked to continue with the next available work while Phase 0 integration blockers remain. Backup checks are explicitly deferred at the user's direction and remain unverified. This slice does not depend on price requests, AI usage or recurring monitoring.

## Delivered

- Local Next.js 16.4 / React 19.3 / TypeScript application with a pinned dependency lockfile; Node 22+ required, Node 24 LTS recommended. Default start/development commands bind **127.0.0.1**, not the LAN.
- Hebrew RTL shell with dark styling from the initial HTML render, responsive navigation, keyboard skip link, visible focus and dark loading/error states. No remote fonts/images or AI/data requests.
- Dashboard, settings and seven planned-workspace screens: scanner, research, plans, waiting, positions, journal and analytics. These are explicitly labeled foundation/under-construction screens, not implemented trading workflows. No fictional prices, cash balances, holdings or performance.
- Actual capability endpoint `/api/health` reports authentication/database unconfigured, data acquisition blocked, monitoring inactive, notification receipt unverified and backups deferred. It exposes no credentials, filesystem paths or private records.
- Transactional, SHA-256 checked local migration runner. Initial schema contains local owner credentials, profiles and portfolio/risk settings, a non-login runtime role, forced ownership RLS, fixed-decimal values and single-enabled-owner/active-portfolio constraints. Runtime role cannot read password hashes or delete records. No owner/account is created automatically.
- The web interface is not connected to the schema and cannot collect/store private data. Authentication, session revocation, safe private-file access, inbox, supervision and real Windows installation remain later Phase 1 work. This is not a usable journal release.

## Verification actually performed here

Environment: cloud Linux; branch `feat/local-foundation`. Remote main `627449d` was fetched and compared with local agent base `a54afa1`; `.codex/` and AGENTS_ROLES.md have identical trees. Existing unrelated planning edits preserved. No remote push or Windows file mutation.

- `npm run typecheck` passed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` passed. The first sandbox-limited attempt could not parse the compiler subprocess output; the normal network-enabled execution completed TypeScript and the production build without disabling checks.
- Foundation unit test rejects remote/host-redirect migration URLs and accepts loopback configuration.
- **8 real PostgreSQL tests passed** (parent + seven subtests), using an isolated, temporary loopback PostgreSQL 18 cluster and synthetic owners. Covered missing-owner denial, two-owner isolation, cross-owner writes, password-hash/DELETE denial, transaction-context reset, single enabled owner, dark default, exact decimals, portfolio isolation, migration replay and changed-migration rejection. The test-only `embedded-postgres` helper was installed under `/tmp`, not in the product dependencies. Its cluster was stopped/deleted; no Windows PostgreSQL was installed. Test credentials were generated in memory and not printed or committed.
- Production HTTP smoke passed for **9 pages**: status 200, initial `lang=he`, `dir=rtl`, dark theme, no-store/security headers, root redirect, unknown/prototype-like paths returning 404, truthful health capabilities and POST rejection.
- Production dependency audit reported **0 known vulnerabilities** at this check, not a permanent security guarantee.
- Browser visual/keyboard/physical-device QA was **not run**: this chat has no browser-control tool or supported forwarding to the user's Windows desktop. HTTP markup checks do not prove visual accessibility, mobile behavior or actual Windows operation.

## Windows: apply the incremental update safely

The Windows Phase 0 report shared in chat is newer than this cloud checkout. **Do not replace your repository with the old Phase 0 ZIP or overwrite its bridge/status files.** The new foundation bundle contains only application/schema/new-test files plus this handoff. It excludes `.codex/`, `scripts/phase0/`, existing tests, AGENTS, TASKS, VALIDATION_STATUS, original feasibility report, secrets, database data and Git history.

1. Extract the foundation bundle to a **separate temporary folder**.
2. Open the existing Windows project in local Codex. Ask it to compare incoming paths and merge them, preserving any locally changed file. No destructive reset or blanket overwrite.
3. Append missing ignore entries to the existing `.gitignore`: `node_modules/`, `.next/`, `*.tsbuildinfo`, `.env`, `.env.*`, `!.env.example`, `reports/`. Do not replace existing ignore rules.
4. Confirm Node 22+ (24 LTS recommended). From the merged project root in PowerShell:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run dev
```

Open **http://127.0.0.1:3000** on that Windows computer. These commands do not install PostgreSQL or enable trading/data/AI/monitoring. `npm ci` downloads the locked open-source packages; it does not purchase a service. No PowerShell execution-policy change is required. Default UI is dark regardless of OS theme.

### Database bootstrap is separate

After local PostgreSQL is available, create an empty local database through the normal installed PostgreSQL tools. Copy `.env.example` to ignored `.env.local` and set a local migration connection using a suitable administrative migration role. Never paste the URL/password into chat, Git or browser code. Run:

```powershell
npm.cmd run db:migrate
```

The migration requires role/schema creation permission and creates no real account or login. Do not run with personal records until local authentication and ownership checks are complete. Use a dedicated unprivileged runtime connection in later work, never the migration role in the web app. The `swingpilot.owner_id` transaction setting must come only from a verified server session; it is not an authentication mechanism.

Database tests require a **fresh isolated local database named `swingpilot_test_*`** and `SWINGPILOT_TEST_DATABASE_URL` set privately. `npm run test:database` explicitly skips without that variable. Skipped tests are not passes. They never target the real `swingpilot` database.

## Next independent work

Finish Phase 1 local PostgreSQL setup, supported Auth.js/Argon2id owner login/recovery/session revocation, authenticated private files and durable inbox. Continue with the read-only/manual path while market data and AI jobs remain gated. Backup/restore stays deferred and must remain a release limitation; do not claim first-release readiness without resolving or explicitly accepting it. No billing UI automation, quote/history calls, recurring tasks, paid fallbacks or brokerage actions are part of this slice.

Suggested local continuation:

> Merge the foundation update from its separate extracted directory into the existing Windows SwingPilot project. Preserve existing native bridge, Phase 0 tests, TASKS, VALIDATION_STATUS and feasibility evidence. Review every collision rather than overwrite. Read docs/PHASE1_FOUNDATION.md; run the locked install/build/typecheck/unit checks and open the loopback site. Record actual Windows results separately from the cloud results. Continue the independent Phase 1 database/authentication work using maintained libraries, leaving live-data, spending-control, native-schedule and notification-receipt gates unresolved. Backup checks remain deferred; no paid services, hidden credentials, destructive disk actions or brokerage execution.
