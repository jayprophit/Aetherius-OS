import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface UpdateManifest {
  id: string;
  version: string;
  sizeBytes: number;
  releasedAt: string;
}

export interface UpdatesOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class UpdatesService {
  private readonly manifests = new Map<string, UpdateManifest>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: UpdatesOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  register(manifest: Omit<UpdateManifest, "id">): UpdateManifest {
    const m: UpdateManifest = { ...manifest, id: newId("update") };
    this.manifests.set(m.id, m);
    this.ledger.append({ type: "updates.registered", actor: "updates", subject: m.id });
    return m;
  }

  list(): UpdateManifest[] {
    return Array.from(this.manifests.values());
  }
}
