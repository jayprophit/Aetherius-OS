import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Credential {
  id: string;
  service: string;
  username: string;
  secret: string;
}

export interface VaultOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Vault {
  private readonly credentials = new Map<string, Credential>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: VaultOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  store(credential: Omit<Credential, "id">): Credential {
    const c: Credential = { ...credential, id: newId("cred") };
    this.credentials.set(c.id, c);
    this.ledger.append({ type: "vault.stored", actor: "vault", subject: c.id });
    return c;
  }

  retrieve(id: string): Credential | undefined {
    return this.credentials.get(id);
  }

  list(): Credential[] {
    return Array.from(this.credentials.values());
  }
}
