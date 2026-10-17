# Phase 0 — Windows host handoff

Historical handoff: superseded by WINDOWS_TODO.md and PHASE2_DELIVERY.md. Preserve original evidence; do not follow obsolete backup or project-.env instructions.

User-authorized start: 14 October 2026. Target: Windows, existing ChatGPT **Plus**, existing IBKR plugin, no additional service subscriptions. The user reports a 64 GB drive; external/separate-medium status, free space, health, filesystem and encrypted restore have not been verified. These checks do not require buying anything. The web application has not been built.

## What is ready

- `scripts/phase0/preflight.ps1`: read-only Windows inventory, no downloads, provider calls, secret reads, account changes, schedules or notifications. It reports tool presence and anonymous disk capacity/free space; it does not export usernames, hostnames, drive labels or credentials. A removable/local disk classification does not prove physical separation.
- `scripts/phase0/preflight.py`: read-only developer/host inventory using Python 3.11+; reports versions without launching model inference. No subscription or desktop receipt is inferred from tool presence.
- `scripts/phase0/probes.py`: offline time-conversion and price-hazard experiments. Not an application runtime, scheduler, market adapter or notification service. The sample calendar covers only explicitly listed dates and rejects all others.
- `tests/phase0/test_probes.py`: DST windows, early closes, holidays, year change, missing calendar dates and invalid-price/timestamp/coverage cases. Every sample denies live eligibility even when numerically consistent.

## Run the Windows inventory

Open a **local Windows Codex chat** with the repository folder as its project. A cloud chat cannot inspect Windows drives or show a Windows toast. From the project root in PowerShell:

```powershell
.\scripts\phase0\preflight.ps1
```

If local script policy prevents execution, keep the restriction and run the reviewed script contents in an interactive PowerShell window, or use the Python inventory if Python is already installed. Do not disable policy globally or run an installer to get an optimistic pass.

Optional Python diagnostics, if Python 3.11+ and IANA timezone data are already available:

```powershell
py -3 scripts/phase0/preflight.py --environment desktop
py -3 -m unittest discover -s tests/phase0 -v
py -3 scripts/phase0/probes.py schedule --date 2026-11-27
py -3 scripts/phase0/probes.py bad-price
```

Python diagnostics are developer tooling, not a new production Python service. Windows Python may need the open-source `tzdata` package for IANA zones; the inventory reports missing zones. Do not label skipped diagnostics passed. Generated host/raw evidence belongs under ignored `reports/`, not in Git.

## Next bounded checks on the actual Windows host

1. Confirm Node/runtime compatibility, disk space and the installed Codex client. Check actual Plus allowance and any existing purchased credit balance in Usage & Billing. Confirm auto-reload is disabled. The application cannot guarantee overriding native account spending; existing credits can be used after included limits. Avoid automatic native runs until included-only behavior can be enforced or verified. Never copy native sign-in tokens into application configuration.
2. Prove one read-only local MCP tool through the supported client configuration. Official docs describe STDIO/Streamable HTTP and shared host configuration. Installing a local bridge does not give Node access to hosted IBKR plugins. Production job/owner/lease controls remain later work. Do not change the existing six role definitions for a smoke test.
3. Prove exact original IBKR tool-result capture to the bridge with source event/job identity. A model-authored JSON body, content hash alone, or manually copied value is insufficient. This cloud chat could preserve returned listing envelopes but does not prove target-host bridge ingestion.
4. Establish the connector's request billing semantics before price/history calls or loops. The exposed snapshot tool has no documented free-mode selector. IBKR publicly distinguishes complimentary nonconsolidated streaming from chargeable consolidated snapshots. The user's $0 subscription screen does not resolve this ambiguity. Do not bulk fetch, subscribe, or spend credits to test it.
5. After the billing gate, repeat the AAPL/NYSE control checks with documented units and independent per-field source times. Resolve the prior approximately 100x discrepancy using compatible broker/provider evidence. Keep alerts blocked until resolved; the synthetic regression is not a repair.
6. Test a clearly labeled non-trading desktop notification, with the website closed and local services/native client running. Record actual visible receipt, not only a sender return. Then test denied permission, sleep/wake and offline recovery on the real device.
7. Test native scheduling against both calendar run reasons using the local project. Web/cloud automations cannot work directly in a Windows project folder. Check native task availability on this Plus account and measure actual dispatch. No recurring task was created by this cloud pass.
8. Verify the proposed 64 GB drive is a separate backup medium, has enough free space for DB/files plus retention, and supports the chosen encrypted archive method. Restore an isolated sample and later real DB/files before claiming backup success. Do not format the drive, overwrite existing files or store the only encryption key with the backup.

## Resume instruction for the local chat

> Continue only the authorized Phase 0 feasibility work. Read AGENTS.md, docs/LOCAL_WORKFLOW.md, docs/DECISIONS.md, docs/TASKS.md, docs/VALIDATION_STATUS.md, docs/reviews/PHASE0_FEASIBILITY.md and this Windows handoff. Target Windows and existing ChatGPT Plus. Run the read-only host inventory and complete supported native bridge, free IBKR billing, price provenance, closed-tabs notification, schedule and separate-medium restore checks as capabilities permit. Preserve unrelated changes. No paid API/credits/data/hosting, hidden credential extraction, brokerage execution or destructive disk actions. Record exact outcomes and blockers; cloud/offline tests cannot pass desktop gates.

Sources reviewed: [Codex MCP](https://developers.openai.com/codex/mcp), [native scheduled tasks](https://developers.openai.com/codex/app/automations), [IBKR pricing](https://www.interactivebrokers.com/en/pricing/market-data-pricing.php), [NYSE calendar](https://www.nyse.com/trade/hours-calendars).
