# Local operation, updates and incident handling — v0.8

This runbook applies to the local manual journal. It does not activate a scheduler/native bridge/data source, change service subscriptions, publish a website or verify backups. Private settings/data stay outside the project/OneDrive. Use the existing Windows test installation; preserve local bridge/agent/evidence files. Full release status remains ACCEPTANCE_PENDING.

## Start and stop

For the existing fictional test installation, run `npm.cmd run local:doctor -- --test`, review any failed/manual ACL checks, then `npm.cmd run local:test:start` after a successful build. Test UI: http://127.0.0.1:3001. For an existing personal installation use `npm.cmd run local:doctor` then `npm.cmd run start`; origin comes from that private configuration, normally127.0.0.1:3000. Use only loopback; do not add hostname0.0.0.0, firewall rules, tunnels or forwarded ports.

Stop with Ctrl+C in the launching terminal. PostgreSQL is managed separately by the existing Windows installation; stopping a browser tab does not stop the server/database. Do not kill unrelated Node/PostgreSQL processes. A stale port means identify the process owning that specific port and its configuration before stopping it. Background workers/tasks are not installed by SwingPilotv0.8.

`/api/health` reports source version/configuration-only status; it does not prove DB health. The authenticated `/readiness` page/API inspect current DB metadata. `local:doctor` adds private-path/mode/migration checks; it uses no HTTP/native/model request. Capture safe code/status output locally. A passed check is a dated observation, not ongoing monitoring, Windows receipt, actual account entitlement or restore proof.

## Source update and migration

1. Stop the relevant web server. Review the incoming manifest/source version against the installed version, preserving local edits/native bridge/status evidence/configuration/data. Use an isolated checkout/extraction for source review. Do not replace the entire existing folder or copy settings into the project.
2. Check target host/port/database and separated roles locally without printing secrets. Test flags must select the existing `swingpilot_test_*` setup; absent test settings must fail. Do not change the test flag to bypass a failure against a personal DB.
3. Run `db:migrate -- --test` for the separate test setup and `local:doctor -- --test`. New updates must be forward-compatible, applied migration hashes immutable. Forv0.7→v0.8 there are no DB changes. A newer DB schema than source is a stop condition, not permission to delete migration history.
4. Build/typecheck/unit/database/HTTP-test in the test setup, then browser acceptance. Disposable integration DBs are created/dropped by the test runner only; they never stand in for personal restore tests.
5. Apply missing forward migrations to an existing personal config only after the corresponding local source/test review, then run its doctor and restart. Do not recreate owners or merge fictional records. Backups are user-deferred; no recoverability claim or automatic backup/restore is made. The pending recovery gate remains visible.

Package-generation scripts require their historical local ZIP inputs in ignored `reports/`; they are handoff tooling, not prerequisites for building/running a fresh source checkout. GitHub source does not contain dependencies/builds/private data or ignored generated archives. A source ZIP is not a database/files backup.

## Code recovery and rollback limits

Never run down SQL, delete financial/command/migration rows, rewrite delivered migrations or restore a database without a separately authorized, tested recovery procedure. Prefer a reviewed forward fix. Keep the failing configuration/data intact and stop writes while investigating an integrity problem.

Thev0.8 andv0.7 source use exactly the same0001–0007 schema. If this update alone causes a regression, a reviewed code-only fallback to an intactv0.7 source copy may be tested in the isolated test setup: stop server, confirm identical migration manifest and unchanged private data/config paths, build/test that source, then review the result before using it personally. No automated downgrade tool is provided; earlier source versions and recovery after subsequent migrations are not verified. Do not downgrade to evade a permission/isolation failure. A safe code fallback never establishes backup/restore capability.

## Incidents and safe next actions

| Symptom / safe code | Next action |
| --- | --- |
| LOCAL_CONFIGURATION_ERROR / role/target mismatch | Stop launch; locally inspect existing private settings for matching literal loopback host/port/database and separate migration/runtime/auth logins. Keep secrets out of logs/chat. No setup/recovery reset or admin credential fallback. |
| Doctor CONFIG/DATA path or mode failure | Verify existing path and resolved location outside project/OneDrive; inspect symlink/junction/ownership/ACL locally. Doctor changes nothing. Fix the concrete location/permission issue without moving/deleting data blindly. |
| MANUAL_ACL_REQUIRED / doctor exit2 | Perform read-only Windows ACL acceptance and preserve evidence. Doctor never treats Unix modes as Windows ACL proof. |
| SCHEMA_COMPLETE / SCHEMA_HASHES / SCHEMA_NOT_NEWER_THAN_SOURCE failure | Compare exact source/installed migration names and trusted delivered hashes. Missing forward migrations use the reviewed matching package; changed/newer schemas require investigation. No editing history or down migration. |
| RESTRICTED_ROLES / ROLE_MEMBERSHIP / AUTHORITY_SEPARATION failure | Stop personal writes and inspect exact role grants locally. Do not grant broader access to clear the error. Use the existing setup's restricted roles; test any scoped correction separately. |
| FORCED_OWNER_RLS / public table/definer-grant failure | Treat as a local access-boundary failure; stop serving personal data, inspect the specific catalog grants/policies and restore only the reviewed expected configuration. Test with isolated fixtures. |
| PostgreSQL unavailable | Check its existing Windows service, loopback listener and configuration. Preserve data; do not initialize/drop the database, weaken authentication or print the connection URL. |
| Login expired/locked | Login normally after applicable throttle window. Owner recovery is an explicit local password-reset/session-revocation action only when actually needed, never a routine update step. |
| Price/history/entitlement/auth/quota unavailable | Keep market/native jobs blocked or manually paused. Do not buy credits, enable overage, substitute an API key, guess price scale or replay stale entry notices. |
| Desktop sender ACCEPTED / UNKNOWN | Acceptance is not display. Use test history/honest human receipt; UNKNOWN never auto-retries. FollowPHASE6_WINDOWS for explicit fresh tests and actual OS evidence. |
| Fixed journal/image/job caps reached or disk low | Stop adding affected work, inspect local usage and choose a future reviewed retention/export policy. No automatic deletion/archival exists, and JSON journal export omits auxiliary histories/files. |
| Power/sleep/restart/data loss | Startup and current records must be reconciled locally; no native automatic catch-up or recoverable production guarantee. Backups/restore remain deferred; no drive action is authorized by this runbook. |

The local site can operate its deterministic manual features without Codex usage. Manual external reviews consume included Codex allowance only when the owner invokes that chat. Actual account spending controls/data pricing and unsupported native features are not enforced or verified by the diagnostic page.

**Next milestone: actual Windows acceptance and resolution of existing gates. Zero later numbered phases remain; incomplete Phase8/release acceptance remains explicit.**
