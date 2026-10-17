# Executive Summary — local Codex subscription edition

Revision2, updated17 October2026. v0.8 implements the independent Phase8 local-readiness subset: read-only doctor, actual DB diagnostics, strict separate/private test config and incident/update runbooks. Cloud build/regression passes; full acceptance remains pending. No new migration/dependency/service, model/provider/native task or public exposure. Native market/data/billing/usage/dispatch, actual Windows/browser/device and user-deferred backup/restore gates remain open. PHASE8_DELIVERY/PHASE8_WINDOWS/LOCAL_RUNBOOK are current. Next milestone: Windows acceptance and existing-gate resolution; zero later numbered phases remain, with Phase8/release still incompletely accepted.

## What changes from the original plan

Replace hosted database/auth/storage/hosting, paid AI APIs and a separate EOD provider with local Next.js/Node, local PostgreSQL, private files and native Codex + plugins. A maintained local authentication integration protects journal access. Trading history retains atomic commands, owner validation/RLS, immutable approved versions, FIFO allocation, mandatory BUY emotion, partial exits and auditable corrections. Encrypted backups go to an existing separate location with a restore test.

The six existing role agents provide analysis/review through the same subscription allowance; they are not six independent usage pools. The website creates queued requests for Codex rather than silently calling a metered AI API. Native plugin access and a narrow local bridge must be tested before promising unattended button-driven analysis. No hidden credential extraction, GUI scraping, auto credits or paid fallback is included.

## Live data and22:40

The current user-provided IBKR screen shows fee-waived US real-time NON_CONSOLIDATED quotes, totalUSD0 and API access enabled. Prior read-only AAPL/JPM observations reported REALTIME with recent trade timestamps. That establishes limited current live access, not complete market coverage or future request billing. Nonconsolidated prices/volume are not full-market NBBO/consolidated totals. [IBKR pricing/coverage](https://www.interactivebrokers.com/en/pricing/market-data-pricing.php).

We observed a serious AAPL discrepancy: raw last≈3.43 against bid/ask≈343. Its cause is unresolved. The revised plan adds source/contract/units/per-field timestamp/freshness/coverage/session guards, independent reference checks, bad-price fixtures and fail-closed signal behavior. Never multiply100 without documented adapter semantics. Bid/ask observation timestamps missing from the sample must also be resolved before those fields are used for live triggers.

Both schedules remain fixed22:40 Jerusalem and official regular-session close+15minute probe. When the session is still open, valid live-compatible conditions can be evaluated; finalized daily-close conditions must wait for completed history. Post-close/weekly review needs validated historical data and finality from the existing plugin; missing history/universe blocks dependent features honestly. No paid entitlement is added to fill a gap.

## Notifications and host availability

First release delivers a persistent local inbox and a tested native Codex/OS desktop notification path. Price failures produce operational warnings without entry recommendations. Acceptance requires actual desktop display with the website closed, correct links/acknowledgment, duplicate suppression, permission failure and restart recovery. No existing notification test has passed because the app/bridge is not implemented.

Your computer must stay awake, online, in the relevant user session, with Codex and database/server/worker running and IBKR authorization/subscription usage available. Closing the website is supported; powering off/sleeping the machine is not. Native scheduling precision/raw-evidence dispatch must pass an unattended test. Quota/auth/offline failures queue/stop work and show missed/blocked status; no charges are automatically enabled. [Native scheduled tasks](https://developers.openai.com/codex/app/automations), [included plan usage](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

The desired iPhone PWA/push is a later conditional zero-fee milestone: private reachability, device-trusted HTTPS, install, explicit permission and physical-device delivery tests. Local LAN alone does not provide away-from-home web access. No paid domain/tunnel/cloud provider is assumed. If this cannot be proven using existing resources, mark it blocked and keep desktop/inbox working. [WebKit prerequisites](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

## Development and review boundary

Gate0 now prioritizes native Codex/local bridge, free connector request mode, AAPL units/timestamps, calendars/scheduling and notifications. The eight phases still cover foundation, complete ledger, data/price guards, AI, monitoring, notification/mobile, insights and local release reliability. The first real journal cannot defer authorization, transaction safety, arithmetic or backup restoration.

Current status: manual-core development delivered for Windows acceptance, not complete V1 or verified recovery/uptime/native operation. WINDOWS_TODO consolidates merge, prerequisites, isolated tests, personal setup and later market/notification/spending/schedule/device gates. Existing Windows Phase 0 evidence is preserved.
