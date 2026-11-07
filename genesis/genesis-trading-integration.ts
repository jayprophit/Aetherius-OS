/** Genesis — Trading Bot Integration Layer
 * The trading bot is one of Genesis's functions; this exposes it to Genesis management.
 */
import { tradingService } from "../../apps/Multi-Cross-Platform-Trading-Bot/src/interface.ts";
import { durableTradingRepo } from "../../apps/Multi-Cross-Platform-Trading-Bot/src/persistence.ts";

export interface GenesisTradingFunction {
  name: string;
  description: string;
  getPaperState(): any;
  submitPaperOrder(o: any): string;
  getKillSwitch(): boolean;
  setKillSwitch(v: boolean): void;
  getBacktests(): any[];
  getAudit(): any[];
  accessDurableRepo(): typeof durableTradingRepo;
}

export const genesisTrading: GenesisTradingFunction = {
  name: "Genesis-Trading-Bot",
  description: "Genesis layer for paper trading, backtests, risk limits, kill switch, audit. Capital/build tool within Aetherius OS.",
  getPaperState() { return tradingService.getState(); },
  submitPaperOrder(o: any): string { return tradingService.submitPaperOrder(o); },
  getKillSwitch() { return tradingService.getKillSwitch(); },
  setKillSwitch(v: boolean): void { tradingService.setKillSwitch(v); },
  getBacktests() { return durableTradingRepo.getBacktests(); },
  getAudit() { return durableTradingRepo.getAudit(); },
  accessDurableRepo() { return durableTradingRepo; },
};
