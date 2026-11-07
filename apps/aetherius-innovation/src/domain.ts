import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Patent {
  id: string;
  title: string;
  jurisdiction: string;
  status: "filed" | "granted" | "rejected";
}

export interface InnovationOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Innovation {
  private readonly patents = new Map<string, Patent>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: InnovationOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  file(title: string, jurisdiction: string): Patent {
    const patent: Patent = { id: newId("patent"), title, jurisdiction, status: "filed" };
    this.patents.set(patent.id, patent);
    this.ledger.append({ type: "innovation.filed", actor: "innovation", subject: patent.id });
    return patent;
  }

  list(): Patent[] {
    return Array.from(this.patents.values());
  }
}
