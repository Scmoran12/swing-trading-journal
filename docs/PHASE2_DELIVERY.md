# Phase 2 — manual journal development delivery

14 October 2026. User explicitly requested the next phase and a consolidated Windows task list. The next-phase manual workflow is implemented in the cloud checkout; **Windows installation/acceptance is pending**. Backup checks remain deferred. This does not claim full roadmap completion or verified production readiness.

## Implemented

- Auth.js Credentials + JWT session cookies, maintained Argon2id password hashing, DB-backed revocation/epoch checks, persistent login throttling, 30-minute inactivity and eight-hour absolute server-session limits. Local OS-account terminal setup/recovery only; no public signup/reset or broker/Codex credential sharing.
- Separate authentication and journal database logins with non-login group roles, owner-context RLS, protected API/page reads, same-origin mutation checks, hostile-Host rejection, parameterized commands and private no-store responses.
- Configuration and private PNG-normalized screenshots outside the repository/OneDrive; byte/pixel/quota limits, MIME verification, metadata stripping and path/symlink checks. Images are served through owner-authenticated endpoints. No AI image sharing.
- Separate test setup/data/database and launch commands; Windows production launcher binds loopback. No recurring monitoring, OS autostart or phone access is installed.
- One USD cash portfolio, risk policy versions, exact whole-share sizing with estimated entry/exit fees, slippage and cash/position/sector/total exposure limits, immutable plan versions/approvals and separate entered state. Editing a draft preserves an existing approval. All identities/levels/sector/marks remain explicitly self-reported `JOURNAL_ONLY`/manual references, never claimed market verified.
- Completed initial BUY batches, ADDs, partial/final SELLs, explicit BUY emotions, frozen gross initial R, fee-inclusive FIFO/P&L/cash, stop history, notes, private attachments, dated marks, audited reversal/replacement corrections and cash-flow corrections. Same-time corrections preserve their original ordering slot. Impossible historical oversells roll back the entire command. Actual risk deviations can be recorded only with acknowledgment.
- Historical reconciliation without an invented original stop: quantities/cash/P&L remain recordable while R is null. Estimated fees retain explicit provenance and labels until corrected.
- Portfolio-first/owner command serialization, revision conflicts, idempotent retry responses, append-only audit, atomic durable inbox entries and read acknowledgment, owner-only JSON journal export. This export does not contain credentials and is not a complete backup.

## Verification

Actual cloud evidence: production build/typecheck; 10 unit/security/risk tests; eight foundation PostgreSQL tests; 19 lifecycle/auth PostgreSQL tests; nine production HTTP tests. Counts include parent/subtests where Node reports them. An interactive terminal setup check also created a synthetic local owner and restricted DB accounts with private configuration. All databases/config/data used for these checks were isolated temporary fixtures, not real trades.

HTTP checks include real Auth.js sign-in, wrong/modified cookies, logout/recovery invalidation, anonymous/private-route denial, raw hostile Host and cross-origin mutation rejection, record creation, idempotent buy retry, attachment authorization and SVG rejection, and credential-free export. Next.js can return a streamed redirect with HTTP 200; tests verify that anonymous HTML redirects to login without rendering owner data.

Image dependency audit initially found advisories in the selected sharp release; it was upgraded to **0.35.5**. The resulting production dependency audit reported **0 known vulnerabilities**. Auth.js is pinned to `next-auth@5.0.0-beta.32` for the documented Next.js Credentials/JWT integration; the tested prerelease dependency should be reviewed on future upgrades. No checks were disabled to pass the build.

Actual Windows ACL behavior, native-module installation, browser visual/keyboard interaction, native desktop receipt, native schedule/recovery, market billing/prices and spending controls remain unverified here. Existing user-reported Windows Phase 0 evidence remains preserved separately; it is not replaced by these cloud tests. No backup/restore check was performed.

## Scope limits and remaining work

This is the manual core, with one entry level and primary target per version; it is not the full scanner/research/advanced-analytics system. Markets/AI/scheduling remain disabled. There is no automatic broker reconciliation, order execution, live performance claim or unattended uptime promise. Owner page views show up to 500 rows per type; JSON export includes full journal rows. Screenshot binaries are stored separately and excluded from JSON exports.

Windows acceptance and supervision/operational readiness remain Phase 1/2 release gates. Backup restoration remains an explicitly deferred release limitation. Private LAN/mobile and real notification integration require later acceptance. Do not call this a complete recoverable V1.

## Handoff

Use [WINDOWS_TODO.md](WINDOWS_TODO.md) for every current and pending computer task. The cumulative application bundle excludes existing `.codex`, native bridge, Phase 0 tests, real configuration/data, Git history and newer Windows TASKS/VALIDATION_STATUS. Its manifest names legacy unprotected page files and known predecessor hashes; review collisions, never blanket overwrite a newer local file.

Initial migration `0001_foundation.sql` is preserved for safe upgrades. New migrations `0002_auth_and_files.sql` and `0003_manual_journal.sql` are forward additions. Settings are no longer placed in project `.env.local`; use the local wizard. No purchases, paid APIs, paid data requests, recurring monitoring activation, public deployment or brokerage operations were performed.
