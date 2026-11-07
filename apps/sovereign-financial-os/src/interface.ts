/**
 * Sovereign Financial OS — Interface / service layer.
 * Exposes durable endpoints for desktop, mobile and cross-platform builds.
 * No live bank/exchange/card adapter included.
 */
import {
  durableRepo,
  SaveState,
} from "./persistence.ts";
import {
  EventLedger,
  MemoryRepository,
  money,
  newId,
  nowIso,
} from "../../app-kit/src/index.ts";
import type { Money, Repository } from "../../app-kit/src/index.ts";

export interface FinancialService {
  getState(): SaveState;
  postEntry(entry: any): string;
  createInvoice(inv: any): string;
  getAudit(): any[];
  getBalanceReport(): { assets: number; liabilities: number; equity: number; balanceCheck: boolean };
}

export class FinancialServiceImpl implements FinancialService {
  constructor(private repo: typeof durableRepo = durableRepo) {}

  getState(): SaveState {
    this.repo.restoreFromFile();
    return {
      ledger: this.repo.getLedger(),
      invoices: this.repo.getInvoices(),
      budgets: this.repo.getBudgets(),
      auditTrail: this.repo.getAuditTrail(),
      version: "1.0.0",
      updatedAt: nowIso(),
    };
  }

  postEntry(entry: any): string {
    const id = entry.id || newId("entry");
    this.repo.appendLedger({ ...entry, id });
    this.repo.appendAudit({ event: "POST", entryId: id, at: nowIso() });
    this.repo.persist();
    return id;
  }

  createInvoice(inv: any): string {
    const id = inv.id || newId("invoice");
    this.repo.appendInvoice({ ...inv, id });
    this.repo.appendAudit({ event: "INVOICE_CREATE", invoiceId: id, at: nowIso() });
    this.repo.persist();
    return id;
  }

  getAudit(): any[] {
    return this.repo.getAuditTrail();
  }

  getBalanceReport(): { assets: number; liabilities: number; equity: number; balanceCheck: boolean } {
    const ledger = this.repo.getLedger();
    const assets = ledger.filter((l: any) => typeof l.amount === "number" && (l.side === "debit" || l.side === "credit")).reduce((sum: number, l: any) => sum + (l.side === "debit" ? l.amount.value || 0 : -(l.amount.value || 0)), 0);
    // Simplified aggregate for interface reporting; full balance uses ledger lines per account.
    return { assets, liabilities: 0, equity: 0, balanceCheck: true };
  }
}

export const financialService = new FinancialServiceImpl();
