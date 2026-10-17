// Actual application capabilities, distinct from user-reported native smoke tests.
export const capabilities = Object.freeze({
  interface: "MANUAL_JOURNAL",
  authentication: "LOCAL_SETUP_REQUIRED",
  database: "LOCAL_SETUP_REQUIRED",
  marketData: "BLOCKED_PENDING_BILLING_AND_PRICE_VALIDATION",
  monitoring: "NOT_ACTIVATED",
  notifications: "RECEIPT_UNVERIFIED",
  backups: "DEFERRED_UNVERIFIED",
  privateDataWorkflowsImplemented: true,
  canStorePrivateData: false,
  canRequestMarketData: false,
  canRunAi: false,
  canSubmitOrders: false,
});
