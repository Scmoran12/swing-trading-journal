# Notification validation and local delivery plan

Revision2 with v0.6 desktop-test implementation,17 October2026. Cloud tests validate only the owner-requested synthetic queue, mocked Windows adapter and code-receipt structure. No real notice/display/human receipt was observed here. No recurring task or trading alert activated. PHASE6_DELIVERY/PHASE6_WINDOWS specify current scope. Full production/mobile contract below remains proposed/gated.

## Implemented opt-in validation path

GET/POST /api/desktop-tests and protected /desktop-tests provide default-off preference, QUEUE/RECONCILE/RETRY/CANCEL/ACK only. One fixed synthetic notice lives ten minutes; one active queued/leased/accepted test per owner,20 per rolling24h/200 retained. Internal CLI-only CLAIM/FINISH use60-second token leases and attempt history; the browser cannot call them. Known pre-send failure supports explicit retry up to3 attempts; timeouts/lost leases are UNKNOWN and never auto-resend. Disabled preference fences completion and cancels pending work, but cannot recall an accepted/in-flight OS notice.

The one-shot sender reads existing private local settings and restricted roles, strips the migration connection and processes at most one test after owner invocation. Built-in Windows PowerShell/WinRT uses an explicitly chosen registered host AppID. No module/registry/execution-policy/permission changes, background daemon, arbitrary content, action link or network call. The fixed payload is a test title, code and local-page instruction, never journal content. Its challenge is stdin/in-memory only and hashed in DB; web DTO/stdout omit code/tokens.

Owner enters the code only after actual receipt and explicitly reports website closed/open/unknown. Five wrong attempts lock the challenge. Matching code records human-reported receipt, not independent device telemetry, model truth or proof against a privileged/dishonest owner. Cloud tests simulate accepted senders/receipts; actual WinRT runtime/display still must be proven on Windows. Existing inbox remains unchanged; this test outbox does not consume market signals or enable automatic desktop/iPhone delivery. No exactly-once physical display promise.

## Delivery contract and channels

Local DB transaction commits validated signal/review event + one durable in-app notification + channel-specific outbox intent. The local worker claims a lease, rechecks current validity, sends, and records attempts/results. Unique owner/event/channel keys deduplicate logical events. At-least-once transport can duplicate an OS notification after a crash; tags/IDs mitigate it, without claiming exactly-once device delivery.

| Channel | Release role | Prerequisites | Evidence of success |
| --- | --- | --- | --- |
| Local in-app inbox | Mandatory source of truth | Local server/database available; owner login | Record persists across restart, read/acknowledgment correctly owned |
| Native Codex notifications | Preferred first desktop path if supported | Desktop app running; OS permissions; a native scheduled task report | Visible OS notification during website-closed run plus stored result link |
| Local OS notification bridge | Alternative first desktop path | Tested OS-specific maintained integration and logged-in session | Actual display seen/acknowledged; not just a sender function return |
| Browser notification | Optional while page/service worker supported | Browser permission and appropriate lifecycle | Must be tested; a tab-only sender is insufficient when page closed |
| iPhone Web Push | Conditional later zero-fee feature | Trusted HTTPS, installed Home Screen PWA, direct-action consent, reachable push service, VAPID/local sender | Physical locked-phone receipt, safe authenticated deep link and record acknowledgment |

Native Codex may generate a task-completion notification independently of the local outbox. Gate0 must prove the native notification behavior and result linking; it is not an arbitrary notification API available to Next.js. If it cannot provide a suitable channel, use a tested local OS bridge. Neither can send while the host is off. If desktop permission is denied or sender fails, keep the inbox and visible delivery error; do not mark 'delivered' from mere queueing.

## Price/notification sequence

A trade setup notification can follow only a passing [PRICE_VALIDATION.md](PRICE_VALIDATION.md) and deterministic plan/risk evaluation. Failed prices create an operational review message ('data could not be validated'), never a BUY/ENTRY label. Differentiate observed price time, check time and send time; expire overdue setups on send, and read current state when the user opens a link. A received notice is advisory; it never creates a buy/exit.

Keep lock-screen text minimal: symbol/context only if explicitly permitted, no holdings, money balances, emotions, private notes or raw source payload. Use authenticated relative app links. Native/local notifications should link to a stable inbox/event reference or show a safe instruction if deep-link launch is unavailable. Quiet hours and relevant calendar dates apply. Weekly task completion may notify; background health remains quiet when unchanged and nonactionable, with deduplicated meaningful failure/recovery notices only.

## Concrete staged validation procedure

1. **Inbox:** commit one synthetic marked-test event in an isolated local database; restart server/worker/browser and verify one durable record. A test event never masquerades as a real trade setup.
2. **Permissions:** explicit enable action, allow/deny/revoke states, privacy-safe preview and a test action. Never silently change system permissions.
3. **Desktop display:** with actual OS permissions, close the website, keep host/Codex/services running, trigger a supported test native task/OS notification, and record actual receipt. Check locked screen, app minimized, notifications disabled/Do Not Disturb and sender failure. Distinguish accepted/displayed/read states.
4. **Recovery:** crash before send, crash after send before ack, expired lease, duplicate wake and disabled permission; retain one logical inbox entry and bounded retry/dead letter. Reboot/sleep/offline tests must report missed/delayed checks; expired entry notices are suppressed after recovery.
5. **Real schedule:** perform read-only due runs at22:40 and calendar close+15min, using actual verified plugin data and separately synthetic stale/scale-conflict failures. Keep browser closed. Verify both run reasons, no duplicate setup notice, price-blocked operational message and journal unchanged.
6. **iPhone conditional:** first prove device-trusted local HTTPS and owner authentication on LAN; install PWA, enable Web Push on direct user action, send a synthetic test to locked phone, tap to current authenticated state, deny/revoke/reinstall, check away-from-LAN link behavior. If no workable zero-fee trusted HTTPS/network solution, leave this gate BLOCKED, do not buy a tunnel/domain or claim phone delivery.

Before any automatic real setup alert, desktop/inbox and data-quality gates must pass together. An iPhone test cannot be substituted by a Playwright browser permission mock. Native ChatGPT/Codex mobile notifications, if available on the user's account, are evaluated as an optional existing channel, not assumed to equal custom SwingPilot Web Push or to be guaranteed.

## Host availability and zero-cost limitations

The local notification process cannot report its own total shutdown at that time. On restart show missed runs and recovered backlog. An external uptime service would be another dependency and is not included. Private LAN-only links work at home; push transport may reach the phone elsewhere but does not make the local website remotely reachable. Do not expose journal/database directly to the public internet. Store local keys with restricted OS permissions, redact endpoint credentials and expire disabled subscriptions.

## Acceptance and status

Pass requires actual desktop display with page closed, durable read/ack history, invalid-price suppression, expired-signal suppression, permission failure visibility, and safe recovery/deduplication. Phone push remains a separate gated milestone. All these checks are currently PLANNED/UNRUN; the documentation revision does not validate an implemented notification system.

[iPhone Web Push requirements](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/); [native scheduled tasks](https://developers.openai.com/codex/app/automations).
