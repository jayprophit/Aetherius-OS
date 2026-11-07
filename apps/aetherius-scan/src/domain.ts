import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface ScanCapture {
  id: string;
  target: string;
  resolution: string;
  format: "obj" | "fbx" | "ply";
}

export interface ScanOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Scan {
  private readonly scans = new Map<string, ScanCapture>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ScanOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  capture(target: string, resolution: string, format: ScanCapture["format"]): ScanCapture {
    const scan: ScanCapture = { id: newId("scan"), target, resolution, format };
    this.scans.set(scan.id, scan);
    this.ledger.append({ type: "scan.captured", actor: "scan", subject: scan.id });
    return scan;
  }

  list(): ScanCapture[] {
    return Array.from(this.scans.values());
  }
}
