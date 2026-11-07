import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Pass {
  id: string;
  type: "boarding" | "coupon" | "loyalty" | "payment";
  issuer: string;
  balance?: number;
}

export interface WalletOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Wallet {
  private readonly passes = new Map<string, Pass>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: WalletOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addPass(pass: Omit<Pass, "id">): Pass {
    const p: Pass = { ...pass, id: newId("pass") };
    this.passes.set(p.id, p);
    this.ledger.append({ type: "wallet.pass.added", actor: "wallet", subject: p.id });
    return p;
  }

  getPass(id: string): Pass | undefined {
    return this.passes.get(id);
  }

  listPasses(): Pass[] {
    return Array.from(this.passes.values());
  }
}
