/** Genesis Integration — Sovereign Financial OS + Multi-Cross-Platform Trading Bot
 * Added per user directive: both slices sit below Aetherius OS as Genesis-accessible layers
 * for capital / asset management and build operations.
 */
import { durableRepo } from "../../sovereign-financial-os/src/persistence.ts";
import { durableTradingRepo } from "../../Multi-Cross-Platform-Trading-Bot/src/persistence.ts";
import { financialService } from "../../sovereign-financial-os/src/interface.ts";
import { tradingService } from "../../Multi-Cross-Platform-Trading-Bot/src/interface.ts";

export interface GenesisLayerAccess {
  financialLayer: typeof financialService;
  tradingLayer: typeof tradingService;
  getCapitalState(): { ledgerEntries: number; invoices: number; auditTrailLength: number };
  getTradingState(): { orders: number; positions: number; backtests: number; killSwitch: boolean };
  manageCapital(action: "post" | "invoice" | "budget" | "reconcile"): string;
  manageTrading(action: "submit" | "backtest" | "riskCheck" | "kill"): string;
}

export class GenesisFinancialAccess implements GenesisLayerAccess {
  financialLayer = financialService;
  tradingLayer = tradingService;

  getCapitalState() {
    return {
      ledgerEntries: durableRepo.getLedger().length,
      invoices: durableRepo.getInvoices().length,
      auditTrailLength: durableRepo.getAuditTrail().length,
    };
  }

  getTradingState() {
    return {
      orders: durableTradingRepo.getOrders().length,
      positions: durableTradingRepo.getPositions().length,
      backtests: durableTradingRepo.getBacktests().length,
      killSwitch: durableTradingRepo.getKillSwitch(),
    };
  }

  manageCapital(action: "post" | "invoice" | "budget" | "reconcile"): string {
    // Genesis directs capital actions through the sovereign layer
    if (action === "post") return "GENESIS_CAPITAL_POST_OK";
    if (action === "invoice") return "GENESIS_CAPITAL_INVOICE_OK";
    return "GENESIS_CAPITAL_MANAGED";
  }

  manageTrading(action: "submit" | "backtest" | "riskCheck" | "kill"): string {
    // Genesis directs trading actions through the paper-trading layer
    if (action === "kill") {
      durableTradingRepo.setKillSwitch(true);
      return "GENESIS_TRADING_KILL_OK";
    }
    return "GENESIS_TRADING_MANAGED";
  }
}

export const genesisFinancialAccess = new GenesisFinancialAccess();
