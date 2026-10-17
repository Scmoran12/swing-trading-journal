# Test plan — local Codex subscription revision

Revision2, updated17 October2026. v0.8 actual cloud evidence: production build/TypeScript,65 units, PostgreSQL82(15 analytics+9 desktop+8 foundation+19 lifecycle+9 monitoring+10 readiness+12 reviews), productionHTTP15, preservedPython11; all passed (Node parents included). Read-only CLI/catalog fault detection, private/test isolation, healthy/bad grants/RLS/schema/source-version and unchanged financial facts tested. No actual Windows ACL/browser/native/device/model/data/billing/scheduler/backup evidence. Follow PHASE8_WINDOWS; release acceptance remains pending.

## Environments

| Environment | Services/data | Boundary |
| --- | --- | --- |
| Unit/CI | Synthetic prices/history, stub Codex/plugin, injected clock | No paid calls or real journal data; exact deterministic oracles. |
| Local integration | Actual local PostgreSQL, local sessions/files, bridge protocol fixtures | Verify RLS/transactions/leases/source provenance; do not replace Postgres with SQLite. |
| Native desktop staging | Separate local DB/file root, actual authorized Codex + existing IBKR plugin | Explicitly bounded included-usage and verified-free data smoke after approval; no orders/subscription changes. |
| Personal local release | Real owner login/journal, supervised services | Read-only monitoring soak, backup/restore into an isolated target, actual OS notification display. |
| iPhone conditional | Physical installed PWA on device-trusted private HTTPS | Network/trust/permission/locked-phone tests; no paid tunnel/domain/cloud fallback. |

Every evidence record names commit/version, environment, command/procedure, fixture/tool ID, execution time, result, scope and blockers. Synthetic markers never enter real holdings. Redact authentication tokens, broker identities, private screenshots/emotions and push endpoints. A function return or mocked browser does not prove native/phone delivery.

## Critical verification matrix

| Area | Independent checks | Phase |
| --- | --- | --- |
| Host capability | OS/runtime/disk/RAM, local autostart, user session, sleep/lock, Node/Postgres availability, firewall | G0/1/8 |
| Included Codex use | Native sign-in uses existing plan; quota reached/auth revoked/task approval blocked; no API-key/credits/payment fallback; agents share allowance | G0/4/5 |
| Native bridge | Native plugin available during task, local scoped tool access, exact provider tool event capture, authenticity versus model-retyped number; no arbitrary shell/SQL/path access or ledger/approval tools | G0/4/5 |
| Existing-free IBKR path | Read-only supported request mode/entitlement, no regulatory-snapshot/new-subscription request; before/after nightly counter check if authorized; history/metadata/universe coverage | G0/3 |
| Price normalization | Explicit numeric units/epoch scales/USD/instrument; AAPL3.43vs343 rejected; stale/missing/future timestamps; last/bid/ask timing and source mismatch | G0/3/5 |
| Freshness and field coverage | Source observed time separate from receipt; proposed60s last age/future5s tolerance tested; timestamp separation; bid/ask timestamp absence cannot pass fresh quote guard |3/5 |
| Nonconsolidated semantics | No full NBBO claim; partial-volume input cannot satisfy consolidated-volume predicates; unknown historic feed/adjustment/finality blocks indicators |3/4/5 |
| Financial risk | Independent whole-share sizing, stop/target order, fees/slippage, capital/reserve/exposure/sector constraints, undefined R; manual/LIVE/EOD mark basis |1/2/3 |
| Ledger truth | BUY+emotion atomically; partial/final SELL, ADD, stop history; actual breach flags; initial entry batch R frozen; correction first-entry lineage and full chronological replay |2 |
| Concurrency | Two simultaneous sells cannot oversell; fixed portfolio/trade lock order; active instrument uniqueness; reopened trade correction conflict; idempotent request/ETag412+428 |2 |
| Ownership/local auth | Two local test owners; forged owner/FK/RLS context/client SQL not accessible; maintained session/password setup; CSRF/origin expiry/logout; controlled OS-owner recovery |1/2/8 |
| Local file privacy | Private directory outside repo/webroot, MIME/pixel limits, path traversal/symlink checks, owner download, bridge only claimedjob inputs, sanitized exports |1/4/8 |
| Plan integrity | Immutable approvals/targets; draft edits retain visible old approval; reapprove/pause/expiry/firstbuy prevents old signals; held trade survives planarchive |2/5 |
| API/bridge contracts | Strict enums/decimals/owner binding, limited arrays, safe errors/pagination, native async awaiting/paused/review states, dedup claim, no provider credentials or model-createdquoteauthority |Each phase |
| Indicators/history | Independent SMA/EMA/ATR/RSI goldens, source scope/final candles, warm-up and missing history, splits/renames/corporate-action review |3 |
| Discovery | Supported bounded universe (proposed40 candidate universe,30watchlist), declared history-covered counts, tie-break/exclusions, return0–5 qualified extras, no hidden fullmarketscreener |3/4 |
| AI | OCR ambiguity/prompt injection, strict locallyvalidatedschema, fabricatedfact/evidenceID rejection, Hebrewquality, staleaccountcontext, modeltask interruption/refusal; no directfinancialwrites |4/7 |
| Scheduling | Exact22:40 zone conversion and officialclose+15; native dispatch capability/latency, two reasons despite earlycloseorder, holidays/DST/yearchange |G0/5 |
| Interval compatibility | Live comparisons/between only for allowlisted livefields; preclose cannot satisfy dailyclose; livecrossing unsupported until ordered observation semantics tested; finalhistory EOD separately |3/5 |
| Recovery | Pageclosed versus appsclosed; sleep/offline/reboot/locked screen; auth/approval/quota paused; missed run freshrecheck; no old alertflood; lease fencing/dedup/deadletter |5/8 |
| Notification sequence | Passing price guard precedes signals; invalidprice only operationalmessage; signalexpired at send suppressed; uniqueinbox/outbox; senderaccept/display/read distinction |2/5/6 |
| Desktop delivery | Actual native/OS receipt with website closed, permissionsdeny/revoke/DoNotDisturb/lockedhost; safe link; recoveryafter crashaftersend |G0/6 |
| PWA/phone | Device-trusted HTTPS, installedHomeScreen/direct consent, lockedphoneactualWebPush, endpoint410/429, awayLANlink explanation, staticcacheonly/logout |Conditional6 |
| Performance/psychology | FIFO/netfees/Rdenominators/drawdowncashflow, validmarkseries source/asof, UNKNOWN/DECLINED exclusion, smalln/consent/privacy/nonclinical language |7 |
| Security | Secret/path/key scanning, bridgeSSRFlimits, XSS/SQLinjection, origin, localTLS/firewall, role escalation, dependencychecks; no servicepublicport accidentally |1 onward/8 |
| Backup/release | EncryptedDB+files separatemedium, permissionrestrictedkeys, restoreledgerhashes/emotions/sourceaudit, migrationbootstrap/recovery, diskfull and sourcecompatibility |Before real use/8 |

## Default appearance acceptance

Verify the first visit, login/onboarding, reload, loading states, dialogs and charts render in dark mode on desktop/mobile, including with an OS light-theme preference. No light-theme flash is acceptable. This is a planned UI acceptance check; no application test has run.

## Required failure fixtures

[PRICE_VALIDATION.md](PRICE_VALIDATION.md) lists exact guarded cases. At minimum AAPL synthetic last3.43/bid342.98/ask343.01 produces UNIT_SCALE_UNRESOLVED and no live alert; no provider source timestamp produces OBSERVATION_TIME_MISSING; an explicit delayed feed produces no live signal; currentquote before23:00 Jerusalem cannot pass finalizeddailyclose; partialvolume cannot pass fullmarket-volume breakout. A doc/model assertion of 'fixed' must never change these guard results.

Notifications test inbox durability, duplicate dispatch, permissions denial, failed price→operational warning only, expiredsignal suppression, statechangebetween send/open and nativeactualreceipt. PhysicaliPhone cannot be replaced by Playwrightemulation. Includedusage exhausted leaves financejournal usable and pendingAI jobs paused without costs.

Financial fixtures in [RISK_ENGINE.md](RISK_ENGINE.md) remain independent: q46 at entry50/stop48 with fee/slippage assumptions; initialR92; partialSELL+ADD realization/unrealized identity221; finalnetloss32; firstbatchpartialfills R108; unitizedNAV ignores deposits as returns. Verify DBnumeric allocations and TSprospective contracts against independentlyderived fixtures, conserving finalfee remainders.

## Release gates

Manuallocal journal: real local login/Postgres/files, corelifecycleE2E, roleisolation, decimalfixtures, lock/idempotency/correction evidence, nofixtureproduction, encryptedseparatemediumrestore, basicinbox and testdesktopnotice before claimingnotifications.

Automaticlive checks: G0-L1..L5 pass together, original AAPLdiagnosis resolved, raw toolprovenance/fieldunits/timestamps/coverage accepted, both nativescheduledruns with websiteclosed, quota/auth/restartfailures safe, stale/eod/live distinction correct and no paid mode. Proposed operational soakfive USsessions plus simulated DST/earlyclose/holiday cases. If unsupportednative bridge or freehistory, mark dependent scopeBLOCKED; no paidfallback.

iPhone: G0-L6 separately proves HTTPS/network/login, installpermission and actualpush; fails explicitly without blocking the alreadyaccepteddesktopjournal. FullV1 may be reported only with completed or explicitlyuser-revised conditional scope, never by pretendingphone/automation gatespassed.

## Regression and evidence workflow

Each implemented task runs relevant type/lint/unit/contract checks; financial/RLS/transaction changes run real PostgreSQL adversarial tests; UIcriticalflows use Playwright and keyboard/RTL sampling. Nativeplugin/model changes rerun a bounded versionedevaluation corpus and read-only supportedsmoke when authorized. No APIinvoice/tokenprice is used as includedCodexcapacity proof. Record unresolved gates, actuallyruncommands and actualcost/counter evidence separately. Planningdocument link/fence/phasechecks are the only verification run in this revision.
