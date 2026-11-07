import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface PrintJob {
  id: string;
  title: string;
  pages: number;
  status: "queued" | "printing" | "done" | "error";
}

export interface PrintOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class PrintService {
  private readonly jobs = new Map<string, PrintJob>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: PrintOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  submit(title: string, pages: number): PrintJob {
    const job: PrintJob = { id: newId("print"), title, pages, status: "queued" };
    this.jobs.set(job.id, job);
    this.ledger.append({ type: "print.submitted", actor: "print", subject: job.id });
    return job;
  }

  list(): PrintJob[] {
    return Array.from(this.jobs.values());
  }
}
