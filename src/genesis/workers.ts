import { relateWorker, type GenesisIdentityRef } from "./identity";

/**
 * REQ-parallel-temp-workers (P20): parallel agents as temporary supervised
 * workers under one Genesis, never permanent personalities.
 *
 * Builds on the P22 worker-separation contract (`relateWorker`: distinct
 * id, supervised-by Genesis, task scope). This pool adds supervision:
 * bounded parallelism, task binding, terminal retirement, and lease
 * expiry. Retirement is terminal — a retired worker id is never
 * reactivated; a new task spawns a new worker. That is what makes them
 * temporary rather than personalities.
 *
 * Reference: Saraev parallel/sub-agent patterns (STUDY_ONLY).
 */

export type TempWorkerState = "ACTIVE" | "RETIRED" | "EXPIRED";

export interface TempWorker {
  workerId: string;
  genesisId: string;
  taskId: string;
  capabilityScope: string[];
  state: TempWorkerState;
  spawnedAt: string;
  expiresAt?: string;
  retiredAt?: string;
  retireReason?: string;
}

export interface WorkerPoolOptions {
  maxActive: number;
  now?: () => string;
  nowMs?: () => number;
  id?: () => string;
}

function nonEmpty(value: string, field: string): string {
  if (!value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

/**
 * Supervised pool of temporary workers for one Genesis. Bounded (maxActive
 * parallel ACTIVE workers), task-bound (every worker carries its task),
 * terminal retirement, optional lease expiry via reap().
 */
export class WorkerPool {
  private readonly root: GenesisIdentityRef;
  private readonly maxActive: number;
  private readonly now: () => string;
  private readonly nowMs: () => number;
  private readonly allocateId: () => string;
  private readonly workers = new Map<string, TempWorker>();

  constructor(root: GenesisIdentityRef, options: WorkerPoolOptions) {
    if (!Number.isInteger(options.maxActive) || options.maxActive < 1) {
      throw new Error("maxActive must be a positive integer");
    }
    this.root = root;
    this.maxActive = options.maxActive;
    this.now = options.now ?? (() => new Date().toISOString());
    this.nowMs = options.nowMs ?? (() => Date.now());
    let seq = 0;
    this.allocateId = options.id ?? (() => `worker-${++seq}`);
  }

  active(): TempWorker[] {
    return [...this.workers.values()].filter((w) => w.state === "ACTIVE");
  }

  get(workerId: string): TempWorker | null {
    return this.workers.get(workerId) ?? null;
  }

  spawn(taskId: string, capabilityScope: string[] = [], ttlMs?: number): TempWorker {
    nonEmpty(taskId, "taskId");
    for (const cap of capabilityScope) {
      if (typeof cap !== "string" || !cap.trim()) {
        throw new Error("capability scope entries must be non-empty strings");
      }
    }
    if (ttlMs !== undefined && (!Number.isInteger(ttlMs) || ttlMs < 1)) {
      throw new Error("ttlMs must be a positive integer when given");
    }
    if (this.active().length >= this.maxActive) {
      throw new Error(`worker bound reached: ${this.maxActive} active workers under ${this.root.genesisId}`);
    }
    const workerId = this.allocateId();
    // Separation contract enforced at spawn: distinct id, supervised by Genesis.
    const relationship = relateWorker(this.root, workerId, taskId.trim(), [...capabilityScope]);
    const worker: TempWorker = Object.freeze({
      workerId: relationship.workerId,
      genesisId: this.root.genesisId,
      taskId: taskId.trim(),
      capabilityScope: [...capabilityScope],
      state: "ACTIVE" as const,
      spawnedAt: this.now(),
      ...(ttlMs !== undefined ? { expiresAt: new Date(this.nowMs() + ttlMs).toISOString() } : {}),
    });
    if (this.workers.has(worker.workerId)) {
      throw new Error(`worker id collision: ${worker.workerId}`);
    }
    this.workers.set(worker.workerId, worker);
    return worker;
  }

  /** Terminal retirement: the id can never come back. */
  retire(workerId: string, reason: string): TempWorker {
    nonEmpty(reason, "reason");
    const worker = this.workers.get(workerId);
    if (!worker) throw new Error(`unknown worker ${workerId}`);
    if (worker.state !== "ACTIVE") {
      throw new Error(`worker ${workerId} is already ${worker.state}: retirement is terminal`);
    }
    const retired: TempWorker = Object.freeze({
      ...worker,
      state: "RETIRED" as const,
      retiredAt: this.now(),
      retireReason: reason.trim(),
    });
    this.workers.set(workerId, retired);
    return retired;
  }

  /** Expire ACTIVE workers past their lease. Returns what expired. */
  reap(nowMs?: number): TempWorker[] {
    const at = nowMs ?? this.nowMs();
    const expired: TempWorker[] = [];
    for (const worker of this.workers.values()) {
      if (worker.state !== "ACTIVE" || !worker.expiresAt) continue;
      if (Date.parse(worker.expiresAt) <= at) {
        const done: TempWorker = Object.freeze({
          ...worker,
          state: "EXPIRED" as const,
          retiredAt: this.now(),
          retireReason: "lease expired",
        });
        this.workers.set(worker.workerId, done);
        expired.push(done);
      }
    }
    return expired.sort((a, b) => (a.workerId < b.workerId ? -1 : 1));
  }
}
