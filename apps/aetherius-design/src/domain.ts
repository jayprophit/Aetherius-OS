import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface DesignProject {
  id: string;
  name: string;
  components: string[];
}

export interface DesignOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Design {
  private readonly designs = new Map<string, DesignProject>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: DesignOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(name: string, components: string[]): DesignProject {
    const design: DesignProject = { id: newId("design"), name, components };
    this.designs.set(design.id, design);
    this.ledger.append({ type: "design.created", actor: "design", subject: design.id });
    return design;
  }

  list(): DesignProject[] {
    return Array.from(this.designs.values());
  }
}
