import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface SyncRecord {
  id: string;
  deviceId: string;
  lastSync: string;
  status: "ok" | "conflict" | "error";
}

export interface SyncOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class SyncService {
  private readonly records = new Map<string, SyncRecord>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: SyncOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  register(deviceId: string): SyncRecord {
    const record: SyncRecord = {
      id: newId("sync"),
      deviceId,
      lastSync: nowIso(this.clock),
      status: "ok",
    };
    this.records.set(record.id, record);
    this.ledger.append({ type: "sync.registered", actor: "sync", subject: record.id });
    return record;
  }

  getByDevice(deviceId: string): SyncRecord[] {
    return Array.from(this.records.values()).filter((r) => r.deviceId === deviceId);
  }
}
