import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface HealthRecord {
  id: string;
  type: "steps" | "heartRate" | "sleep" | "weight";
  value: number;
  unit: string;
  recordedAt: string;
}

export interface HealthOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class HealthService {
  private readonly records: HealthRecord[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: HealthOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  record(type: HealthRecord["type"], value: number, unit: string): HealthRecord {
    const record: HealthRecord = {
      id: newId("health"),
      type,
      value,
      unit,
      recordedAt: nowIso(this.clock),
    };
    this.records.push(record);
    this.ledger.append({ type: "health.recorded", actor: "health", subject: record.id });
    return record;
  }

  getByType(type: HealthRecord["type"]): HealthRecord[] {
    return this.records.filter((r) => r.type === type);
  }
}
