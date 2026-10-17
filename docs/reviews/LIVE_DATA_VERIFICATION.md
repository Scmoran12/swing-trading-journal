# Connected IBKR live-data verification

Checked 13 October 2026, approximately20:55 Asia/Jerusalem (17:55 UTC). Read-only plugin requests; no orders, alerts, subscription purchases or application implementation.

## Observed evidence

The Interactive Brokers plugin connection was authorized and returned successful instrument searches and snapshots for exact US primary listings:

| Instrument | Listing | Snapshot entitlement status | Trade timestamp | Age at17:55:24UTC check |
| --- | --- | --- | --- | --- |
| AAPL | Nasdaq, contract265598 | REALTIME | 17:55:17UTC /20:55:17Jerusalem | About7seconds |
| JPM | NYSE, contract1520593 | REALTIME | 17:54:48UTC /20:54:48Jerusalem | About36seconds |

Both last-trade payloads indicated neither halted nor closing-price-only. Bid/ask fields were present. These results verify that this authorized plugin connection currently returns provider-labeled real-time snapshots for these two US stocks. They do not prove every stock/venue/feed entitlement, consolidated coverage, continuous availability, billing inclusion, unattended scheduling or access from a separately hosted website.

## Data-quality issue and required gate

Two AAPL snapshots returned last-trade prices around3.43 while contemporaneous bid/ask values were around343. This approximately100× discrepancy is unresolved; do not silently scale it or use that last-trade value as an entry signal. JPM last and bid/ask values were in the same price range. Before production use, verify the connector's numeric units/serialization with documented semantics and independent authorized observations. Reject or quarantine inconsistent last/bid/ask/units; a REALTIME flag alone is insufficient to establish valid prices. Bid/ask freshness must also have a verifiable observation timestamp if used for an entry rule.

## Effect on the proposal

A subscription-first Codex + connected-plugin workflow has demonstrated a potential live-data source for the requested22:40 review. The original EOD-only assumption no longer applies universally to that workflow. Preserve replaceable data adapters and per-response freshness/quality gates. The active architecture has since been revised for local Codex + plugins; see [LOCAL_WORKFLOW.md](../LOCAL_WORKFLOW.md). This limited evidence does not authorize application implementation or brokerage execution.

Next acceptance work: validate scaling, session semantics and coverage; run authorized read-only scheduled-plugin smoke; confirm quote/session timestamps at22:40; establish account entitlements/billing without assuming the data is free; validate how the journal backend receives evidence and results. No scheduler or live entry automation has been created or proven by this check.

## User-provided fee-screen evidence

The user subsequently supplied Client Portal text showing US Real-Time Non Consolidated Streaming Quotes fee-waived, totalUSD0, Market Data API access enabled and currently displayed snapshot costs/countersUSD0. Counters refresh nightly. No account number or login identity is retained here. This supports the current zero-additional-subscription baseline but does not identify the plugin request billing mode, consolidated coverage, future fees or unattended scheduling. Revision-2 price/notification/bridge gates remain unrun and the AAPL scale discrepancy remains unresolved.
