import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Disk Utility domain core.
 *
 * Volumes with capacity accounting, encryption state, a repair queue and
 * benchmark records. Actual formatting/encryption is a host adapter
 * concern; this layer models what the volumes are and what has been done
 * to them.
 */

export type VolumeKind = "internal" | "external" | "network" | "ramdisk";
export type EncryptionState = "unencrypted" | "encrypted" | "locked";

export interface Volume {
  id: string;
  name: string;
  path: string;
  kind: VolumeKind;
  totalBytes: number;
  usedBytes: number;
  encrypted: EncryptionState;
  healthy: boolean;
}

export interface RepairJob {
  id: string;
  volumeId: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string | null;
  finishedAt: string | null;
  notes: string;
}

export interface Benchmark {
  id: string;
  volumeId: string;
  readMbPerSec: number;
  writeMbPerSec: number;
  at: string;
}

export interface DiskUtilityOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const KINDS: VolumeKind[] = ["internal", "external", "network", "ramdisk"];

export class DiskUtility {
  private readonly volumes = new Map<string, Volume>();
  private readonly repairs = new Map<string, RepairJob>();
  private readonly benchmarks: Benchmark[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: DiskUtilityOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addVolume(input: { name: string; path: string; kind: VolumeKind; totalBytes: number; usedBytes?: number; encrypted?: EncryptionState }): Volume {
    const { name, path } = input;
    if (typeof name !== "string" || name.trim().length === 0) throw new Error("a volume needs a name");
    if (typeof path !== "string" || path.trim().length === 0) throw new Error("a volume needs a path");
    if (!KINDS.includes(input.kind)) throw new Error(`kind must be one of: ${KINDS.join(", ")}`);
    if (!Number.isInteger(input.totalBytes) || input.totalBytes <= 0) {
      throw new Error("totalBytes must be a positive integer");
    }
    const used = input.usedBytes ?? 0;
    if (!Number.isInteger(used) || used < 0 || used > input.totalBytes) {
      throw new Error("usedBytes must be between 0 and totalBytes");
    }
    const volume: Volume = {
      id: newId("vol"),
      name: name.trim(),
      path: path.trim(),
      kind: input.kind,
      totalBytes: input.totalBytes,
      usedBytes: used,
      encrypted: input.encrypted ?? "unencrypted",
      healthy: true,
    };
    this.volumes.set(volume.id, volume);
    this.ledger.append({ type: "disk.volume_added", actor: "disk", subject: volume.id, data: { kind: volume.kind } });
    return structuredClone(volume);
  }

  updateUsage(volumeId: string, usedBytes: number): Volume {
    const volume = this.requireVolume(volumeId);
    if (!Number.isInteger(usedBytes) || usedBytes < 0 || usedBytes > volume.totalBytes) {
      throw new Error("usedBytes must be between 0 and totalBytes");
    }
    volume.usedBytes = usedBytes;
    this.volumes.set(volumeId, volume);
    return structuredClone(volume);
  }

  setEncryption(volumeId: string, state: EncryptionState): Volume {
    const volume = this.requireVolume(volumeId);
    if (!["unencrypted", "encrypted", "locked"].includes(state)) {
      throw new Error("state must be unencrypted, encrypted or locked");
    }
    volume.encrypted = state;
    this.volumes.set(volumeId, volume);
    this.ledger.append({ type: "disk.encryption_changed", actor: "disk", subject: volumeId, data: { state } });
    return structuredClone(volume);
  }

  freeBytes(volumeId: string): number {
    const volume = this.requireVolume(volumeId);
    return volume.totalBytes - volume.usedBytes;
  }

  queueRepair(volumeId: string): RepairJob {
    const volume = this.requireVolume(volumeId);
    if (!volume.healthy) {
      // A volume that needs repair is queued, not repaired inline.
    }
    const job: RepairJob = {
      id: newId("rep"),
      volumeId,
      status: "queued",
      startedAt: null,
      finishedAt: null,
      notes: "queued for repair",
    };
    this.repairs.set(job.id, job);
    this.ledger.append({ type: "disk.repair_queued", actor: "disk", subject: job.id, data: { volumeId } });
    return structuredClone(job);
  }

  runRepair(jobId: string, success: boolean): RepairJob {
    const job = this.repairs.get(jobId);
    if (!job) throw new Error(`no repair job: ${jobId}`);
    if (job.status !== "queued") throw new Error(`repair job is ${job.status}`);
    const now = nowIso(this.clock);
    job.status = success ? "completed" : "failed";
    job.startedAt = now;
    job.finishedAt = now;
    job.notes = success ? "repair completed" : "repair failed; volume remains unhealthy";
    if (success) {
      const volume = this.requireVolume(job.volumeId);
      volume.healthy = true;
      this.volumes.set(volume.id, volume);
    }
    this.repairs.set(jobId, job);
    this.ledger.append({ type: "disk.repair_finished", actor: "disk", subject: jobId, data: { success } });
    return structuredClone(job);
  }

  markUnhealthy(volumeId: string): Volume {
    const volume = this.requireVolume(volumeId);
    volume.healthy = false;
    this.volumes.set(volumeId, volume);
    this.recordAudit("disk.volume_unhealthy", volumeId);
    return structuredClone(volume);
  }

  recordBenchmark(volumeId: string, readMbPerSec: number, writeMbPerSec: number): Benchmark {
    this.requireVolume(volumeId);
    if (!Number.isFinite(readMbPerSec) || readMbPerSec <= 0) throw new Error("readMbPerSec must be positive");
    if (!Number.isFinite(writeMbPerSec) || writeMbPerSec <= 0) throw new Error("writeMbPerSec must be positive");
    const benchmark: Benchmark = {
      id: newId("bench"),
      volumeId,
      readMbPerSec,
      writeMbPerSec,
      at: nowIso(this.clock),
    };
    this.benchmarks.push(benchmark);
    this.ledger.append({ type: "disk.benchmark_recorded", actor: "disk", subject: benchmark.id, data: {} });
    return structuredClone(benchmark);
  }

  listVolumes(kind?: VolumeKind): Volume[] {
    return [...this.volumes.values()]
      .filter((volume) => kind === undefined || volume.kind === kind)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((volume) => structuredClone(volume));
  }

  repairJobs(volumeId?: string): RepairJob[] {
    return [...this.repairs.values()]
      .filter((job) => volumeId === undefined || job.volumeId === volumeId)
      .map((job) => structuredClone(job));
  }

  benchmarksFor(volumeId: string): Benchmark[] {
    this.requireVolume(volumeId);
    return this.benchmarks.filter((b) => b.volumeId === volumeId).map((b) => structuredClone(b));
  }

  private requireVolume(volumeId: string): Volume {
    const found = this.volumes.get(volumeId);
    if (!found) throw new Error(`no volume: ${volumeId}`);
    return structuredClone(found);
  }

  private recordAudit(type: string, subject: string): void {
    this.ledger.append({ type, actor: "disk", subject, data: {} });
  }
}
