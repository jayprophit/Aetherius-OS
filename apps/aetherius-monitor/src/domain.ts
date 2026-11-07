import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface ProcessSnapshot {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryBytes: number;
}

export interface MonitorOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class SystemMonitor {
  private readonly processes = new Map<number, ProcessSnapshot>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: MonitorOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  register(proc: Omit<ProcessSnapshot, "pid"> & { pid?: number }): ProcessSnapshot {
    const pid = proc.pid ?? Math.floor(Math.random() * 100000);
    const snapshot: ProcessSnapshot = { ...proc, pid };
    this.processes.set(pid, snapshot);
    this.ledger.append({ type: "monitor.registered", actor: "monitor", subject: String(pid) });
    return snapshot;
  }

  snapshot(): ProcessSnapshot[] {
    return Array.from(this.processes.values());
  }
}
