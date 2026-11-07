import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Task Manager domain core.
 *
 * A registry of processes with resource usage and lifecycle control. Real
 * process enumeration is a host adapter concern; this layer models what
 * has been observed and what was ended.
 */

export type ProcessState = "running" | "sleeping" | "zombie";

export interface ProcessEntry {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMb: number;
  state: ProcessState;
  user: string;
  startedAt: string;
  endedAt: string | null;
}

export interface TaskManagerOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const STATES: ProcessState[] = ["running", "sleeping", "zombie"];

let nextPid = 1000;

export class TaskManager {
  private readonly processes = new Map<number, ProcessEntry>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: TaskManagerOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  observe(input: { name: string; cpuPercent: number; memoryMb: number; state?: string; user?: string }): ProcessEntry {
    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      throw new Error("a process needs a name");
    }
    if (!Number.isFinite(input.cpuPercent) || input.cpuPercent < 0 || input.cpuPercent > 100) {
      throw new Error("cpuPercent must be between 0 and 100");
    }
    if (!Number.isFinite(input.memoryMb) || input.memoryMb < 0) {
      throw new Error("memoryMb must be a non-negative number");
    }
    const state = (input.state ?? "running") as ProcessState;
    if (!STATES.includes(state)) throw new Error(`state must be one of: ${STATES.join(", ")}`);
    nextPid += 1;
    const entry: ProcessEntry = {
      pid: nextPid,
      name: input.name.trim(),
      cpuPercent: input.cpuPercent,
      memoryMb: input.memoryMb,
      state,
      user: (input.user ?? "user").trim() || "user",
      startedAt: nowIso(this.clock),
      endedAt: null,
    };
    this.processes.set(entry.pid, entry);
    return structuredClone(entry);
  }

  updateUsage(pid: number, cpuPercent: number, memoryMb: number): ProcessEntry {
    const entry = this.require(pid);
    if (!Number.isFinite(cpuPercent) || cpuPercent < 0 || cpuPercent > 100) {
      throw new Error("cpuPercent must be between 0 and 100");
    }
    if (!Number.isFinite(memoryMb) || memoryMb < 0) {
      throw new Error("memoryMb must be a non-negative number");
    }
    entry.cpuPercent = cpuPercent;
    entry.memoryMb = memoryMb;
    this.processes.set(pid, entry);
    return structuredClone(entry);
  }

  end(pid: number): ProcessEntry {
    const entry = this.require(pid);
    if (entry.endedAt !== null) throw new Error("the process has already ended");
    entry.endedAt = nowIso(this.clock);
    entry.state = "zombie";
    this.processes.set(pid, entry);
    this.ledger.append({ type: "task.ended", actor: "tasks", subject: String(pid), data: { name: entry.name } });
    return structuredClone(entry);
  }

  get(pid: number): ProcessEntry | undefined {
    const found = this.processes.get(pid);
    return found ? structuredClone(found) : undefined;
  }

  list(includeEnded = false): ProcessEntry[] {
    return [...this.processes.values()]
      .filter((entry) => includeEnded || entry.endedAt === null)
      .sort((a, b) => b.cpuPercent - a.cpuPercent || a.pid - b.pid)
      .map((entry) => structuredClone(entry));
  }

  totals(): { processes: number; cpuPercent: number; memoryMb: number } {
    const live = [...this.processes.values()].filter((entry) => entry.endedAt === null);
    return {
      processes: live.length,
      cpuPercent: live.reduce((sum, entry) => sum + entry.cpuPercent, 0),
      memoryMb: live.reduce((sum, entry) => sum + entry.memoryMb, 0),
    };
  }

  private require(pid: number): ProcessEntry {
    const found = this.processes.get(pid);
    if (!found) throw new Error(`no process: ${pid}`);
    return structuredClone(found);
  }
}
