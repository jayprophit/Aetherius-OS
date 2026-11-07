import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Print Manager domain core.
 *
 * Print queues, print jobs and their lifecycle. Driver interaction is a
 * host adapter concern; this layer models what was queued and where it
 * stands.
 */

export type JobStatus = "queued" | "printing" | "paused" | "completed" | "failed" | "cancelled";

export interface Printer {
  id: string;
  name: string;
  driver: string;
  defaultPaper: string;
  duplex: boolean;
  online: boolean;
}

export interface PrintJob {
  id: string;
  printerId: string;
  title: string;
  pages: number;
  copies: number;
  status: JobStatus;
  submittedAt: string;
  finishedAt: string | null;
  error: string | null;
}

export interface PrintManagerOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class PrintManager {
  private readonly printers = new Map<string, Printer>();
  private readonly jobs = new Map<string, PrintJob>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: PrintManagerOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addPrinter(input: { name: string; driver?: string; defaultPaper?: string; duplex?: boolean }): Printer {
    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      throw new Error("a printer needs a name");
    }
    const printer: Printer = {
      id: newId("printer"),
      name: input.name.trim(),
      driver: (input.driver ?? "generic").trim() || "generic",
      defaultPaper: (input.defaultPaper ?? "A4").trim() || "A4",
      duplex: input.duplex === true,
      online: true,
    };
    this.printers.set(printer.id, printer);
    this.ledger.append({ type: "print.printer_added", actor: "print", subject: printer.id, data: { name: printer.name } });
    return structuredClone(printer);
  }

  setPrinterOnline(printerId: string, online: boolean): Printer {
    const printer = this.requirePrinter(printerId);
    printer.online = online === true;
    this.printers.set(printerId, printer);
    return structuredClone(printer);
  }

  submit(printerId: string, input: { title: string; pages: number; copies?: number }): PrintJob {
    const printer = this.requirePrinter(printerId);
    if (!printer.online) throw new Error(`printer is offline: ${printer.name}`);
    if (typeof input.title !== "string" || input.title.trim().length === 0) {
      throw new Error("a job needs a title");
    }
    if (!Number.isInteger(input.pages) || input.pages <= 0) throw new Error("pages must be a positive integer");
    const copies = input.copies ?? 1;
    if (!Number.isInteger(copies) || copies < 1 || copies > 99) throw new Error("copies must be between 1 and 99");
    const job: PrintJob = {
      id: newId("job"),
      printerId,
      title: input.title.trim(),
      pages: input.pages,
      copies,
      status: "queued",
      submittedAt: nowIso(this.clock),
      finishedAt: null,
      error: null,
    };
    this.jobs.set(job.id, job);
    this.ledger.append({ type: "print.job_submitted", actor: "print", subject: job.id, data: { printer: printer.name, pages: input.pages } });
    return structuredClone(job);
  }

  start(jobId: string): PrintJob {
    const job = this.requireJob(jobId);
    if (job.status !== "queued" && job.status !== "paused") throw new Error(`job is ${job.status}`);
    job.status = "printing";
    this.jobs.set(jobId, job);
    return structuredClone(job);
  }

  pause(jobId: string): PrintJob {
    const job = this.requireJob(jobId);
    if (job.status !== "printing") throw new Error("only a printing job can be paused");
    job.status = "paused";
    this.jobs.set(jobId, job);
    return structuredClone(job);
  }

  finish(jobId: string, success: boolean, error?: string): PrintJob {
    const job = this.requireJob(jobId);
    if (job.status !== "printing" && job.status !== "queued") throw new Error(`job is ${job.status}`);
    job.status = success ? "completed" : "failed";
    job.finishedAt = nowIso(this.clock);
    job.error = success ? null : (error ?? "unknown error").trim() || "unknown error";
    this.jobs.set(jobId, job);
    this.ledger.append({ type: "print.job_finished", actor: "print", subject: jobId, data: { success } });
    return structuredClone(job);
  }

  cancel(jobId: string): PrintJob {
    const job = this.requireJob(jobId);
    if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
      throw new Error(`job is already ${job.status}`);
    }
    job.status = "cancelled";
    job.finishedAt = nowIso(this.clock);
    this.jobs.set(jobId, job);
    return structuredClone(job);
  }

  jobsFor(printerId: string): PrintJob[] {
    this.requirePrinter(printerId);
    return [...this.jobs.values()]
      .filter((job) => job.printerId === printerId)
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
      .map((job) => structuredClone(job));
  }

  printersList(): Printer[] {
    return [...this.printers.values()].sort((a, b) => a.name.localeCompare(b.name)).map((p) => structuredClone(p));
  }

  private requirePrinter(printerId: string): Printer {
    const found = this.printers.get(printerId);
    if (!found) throw new Error(`no printer: ${printerId}`);
    return structuredClone(found);
  }

  private requireJob(jobId: string): PrintJob {
    const found = this.jobs.get(jobId);
    if (!found) throw new Error(`no job: ${jobId}`);
    return structuredClone(found);
  }
}
