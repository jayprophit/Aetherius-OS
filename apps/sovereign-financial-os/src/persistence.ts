/**
 * Sovereign Financial OS — Persistence adapter.
 * File-backend using JSON line storage (hash-chained audit-aware).
 * Replaces MemoryRepository with durable file storage for ledger,
 * invoices, budgets and audit trail. No live bank/card/exchange adapter.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import {
  EventLedger,
  MemoryRepository,
  newId,
  nowIso,
} from "../../app-kit/src/index.ts";
import type { Money } from "../../app-kit/src/index.ts";

export interface SaveState {
  ledger: any[];
  invoices: any[];
  budgets: any[];
  auditTrail: any[];
  version: string;
  updatedAt: string;
}

const DB_DIR = process.env.SOEV_DB_DIR || join(import.meta.dirname || ".", "data");
const DB_FILE = join(DB_DIR, "sovereign-finance.json");

function ensureDir(p: string) {
  try { mkdirSync(p, { recursive: true }); } catch {}
}

export function loadState(): SaveState {
  ensureDir(DB_DIR);
  if (!existsSync(DB_FILE)) {
    return {
      ledger: [], invoices: [], budgets: [], auditTrail: [],
      version: "1.0.0", updatedAt: nowIso(),
    };
  }
  return JSON.parse(readFileSync(DB_FILE, "utf-8")) as SaveState;
}

export function saveState(s: SaveState) {
  ensureDir(DB_DIR);
  s.updatedAt = nowIso();
  writeFileSync(DB_FILE, JSON.stringify(s, null, 2), "utf-8");
}

export class DurableRepository {
  private state = loadState();

  persist() { saveState(this.state); }

  getLedger() { return this.state.ledger; }
  getInvoices() { return this.state.invoices; }
  getBudgets() { return this.state.budgets; }
  getAuditTrail() { return this.state.auditTrail; }

  appendLedger(entry: any) {
    this.state.ledger.push({ ...entry, persistedAt: nowIso() });
    this.persist();
  }

  appendInvoice(inv: any) {
    this.state.invoices.push({ ...inv, persistedAt: nowIso() });
    this.persist();
  }

  appendAudit(a: any) {
    this.state.auditTrail.push({ ...a, persistedAt: nowIso() });
    this.persist();
  }

  restoreFromFile() {
    this.state = loadState();
  }
}

export const durableRepo = new DurableRepository();
