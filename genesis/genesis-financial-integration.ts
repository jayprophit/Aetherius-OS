/** Genesis — Sovereign Financial Integration Layer
 * Trading-bot is a Genesis function; this connects the financial core to Genesis.
 * Part of Aetherius OS architecture: Genesis accesses this layer for capital/assets.
 */
import { financialService } from "../../apps/sovereign-financial-os/src/interface.ts";
import { durableRepo } from "../../apps/sovereign-financial-os/src/persistence.ts";

export interface GenesisFinancialFunction {
  name: string;
  description: string;
  getBalanceSummary(): any;
  getAuditTrail(): any[];
  getInvoices(): any[];
  createInvoice(inv: any): string;
  postEntry(entry: any): string;
  accessDurableRepo(): typeof durableRepo;
}

export const genesisFinancial: GenesisFinancialFunction = {
  name: "Genesis-Sovereign-Finance",
  description: "Genesis layer for capital, assets, ledger, audit, budgets. Used by Aetherius OS to manage capital and assets.",
  getBalanceSummary() { return financialService.getBalanceReport(); },
  getAuditTrail() { return financialService.getAudit(); },
  getInvoices() { return durableRepo.getInvoices(); },
  createInvoice(inv: any): string { return financialService.createInvoice(inv); },
  postEntry(entry: any): string { return financialService.postEntry(entry); },
  accessDurableRepo() { return durableRepo; },
};
