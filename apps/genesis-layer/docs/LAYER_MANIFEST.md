/** Genesis Layer Manifest — Sovereign Financial OS + Trading Bot are Genesis functions,
 * not standalone consumer apps. Added to close architecture/ownership gap. */

export const layerManifest = {
  layerId: "genesis-capital-trading",
  description: "Genesis-accessible capital and asset management layer within Aetherius OS",
  components: [
    { id: "sovereign-financial-os", role: "capital_ledger_invoices_budget_reconciliation", genesisFunction: true },
    { id: "Multi-Cross-Platform-Trading-Bot", role: "paper_trading_risk_kill_backtest", genesisFunction: true },
  ],
  accessModel: "Genesis reads/writes through durable interfaces (financialService / tradingService); UI routes are platform-level, not layer-level.",
  scopeLimits: ["No live bank/exchange adapter", "No regulatory filing claim", "Paper-only trading"],
  integrationPoint: "apps/genesis-layer/src/financial-trading-layer.ts",
};
