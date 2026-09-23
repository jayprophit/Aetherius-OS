import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { transition } from "./lifecycle";
import { assertSafePath, diffManifests, manifestOf } from "./sync";
import { RunnerError } from "./types";
import type {
  Isolation,
  Runner,
  RunnerCapabilities,
  RunRecord,
  RunSpec,
  WorkspaceSpec,
} from "./types";

const SIM_ISOLATION: Isolation = { network: "none", filesystem: "temp-only", label: "owner-workstation-sim" };

function stamp(now: () => string, record: RunRecord, event: Omit<RunRecord["events"][number], "at">): RunRecord {
  return { ...record, events: [...record.events, { ...event, at: now() }] };
}

/**
 * Honest-sim local runner: proves the runner contract (provision → sync →
 * run → teardown with isolation labels) without claiming real container or
 * remote execution. Every record is labeled simulated:true; outputs are
 * replayed only from spec.simulatedResult (declared, never invented). No
 * child processes are spawned. Warmed workspaces live in memory plus a
 * temp dir marker; temp-only isolation is enforced on every run.
 */
export class LocalDirectoryRunner implements Runner {
  readonly runnerId = "local-sim";
  private readonly now: () => string;
  private readonly warmed = new Map<string, Map<string, Uint8Array>>();
  private seq = 0;

  constructor(options: { now?: () => string } = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  capabilities(): RunnerCapabilities {
    return {
      kind: "local-directory",
      simulated: true,
      available: true,
      maxTimeoutMs: 60_000,
      allowedFilesystem: ["temp-only"],
    };
  }

  async provision(workspace: WorkspaceSpec): Promise<RunRecord> {
    this.seq += 1;
    const runId = `sim-${this.seq}`;
    this.warmed.set(runId, new Map());
    // Temp dir proves a workspace slot exists; files stay in memory.
    mkdtempSync(join(tmpdir(), `aetherius-run-${this.seq}-`));
    let record: RunRecord = {
      runId,
      runnerId: this.runnerId,
      kind: "local-directory",
      simulated: true,
      workspace,
      spec: { argv: [], env: {}, timeoutMs: 0, isolation: SIM_ISOLATION },
      state: "DEFINED",
      events: [],
      tornDown: false,
    };
    record = transition(record, "PROVISIONING");
    record = stamp(this.now, record, { kind: "provisioned", detail: `warmed workspace ${workspace.workspaceId} (simulated)` });
    return transition(record, "READY");
  }

  async sync(workspaceId: string, files: ReadonlyMap<string, Uint8Array>): Promise<{ added: string[]; modified: string[]; deleted: string[] }> {
    void workspaceId;
    // Honest-sim: sync targets the most recently provisioned live run.
    const runId = [...this.warmed.keys()].pop();
    if (!runId) throw new RunnerError("RUNNER_UNKNOWN", "no provisioned run to sync into");
    for (const path of files.keys()) assertSafePath(path);
    const warmed = this.warmed.get(runId)!;
    const before = manifestOf(warmed);
    warmed.clear();
    for (const [path, bytes] of files) warmed.set(path, bytes);
    return diffManifests(before, manifestOf(warmed));
  }

  async run(record: RunRecord, spec: RunSpec): Promise<RunRecord> {
    if (record.state !== "READY") {
      throw new RunnerError("INVALID_TRANSITION", `run ${record.runId}: ${record.state} is not READY`);
    }
    if (!Array.isArray(spec.argv) || spec.argv.length === 0) {
      throw new RunnerError("WORKSPACE_MISMATCH", "run spec requires a non-empty argv");
    }
    if (!Number.isInteger(spec.timeoutMs) || spec.timeoutMs < 1 || spec.timeoutMs > 60_000) {
      throw new RunnerError("RUN_TIMEOUT", "timeout must be 1..60000 ms for the sim runner");
    }
    if (spec.isolation.filesystem !== "temp-only") {
      throw new RunnerError("WORKSPACE_MISMATCH", "sim runner enforces temp-only filesystem isolation");
    }
    if (!spec.simulatedResult) {
      throw new RunnerError("WORKSPACE_MISMATCH", "sim runner requires declared spec.simulatedResult (outputs are declared, never invented)");
    }
    let next: RunRecord = { ...record, spec };
    next = transition(next, "RUNNING");
    const { exitCode, stdout, stderr } = spec.simulatedResult;
    if (stdout) next = stamp(this.now, next, { kind: "stream", stream: "stdout", chunk: stdout });
    if (stderr) next = stamp(this.now, next, { kind: "stream", stream: "stderr", chunk: stderr });
    next = stamp(this.now, next, { kind: "exited", exitCode, detail: "simulated replay of declared result" });
    next = { ...next, exitCode };
    return transition(next, exitCode === 0 ? "SUCCEEDED" : "FAILED");
  }

  async teardown(record: RunRecord): Promise<RunRecord> {
    if (record.state !== "SUCCEEDED" && record.state !== "FAILED" && record.state !== "TIMED_OUT" && record.state !== "READY") {
      throw new RunnerError("INVALID_TRANSITION", `run ${record.runId}: nothing to tear down from ${record.state}`);
    }
    let next = transition(record, "TEARDOWN");
    this.warmed.delete(record.runId);
    next = stamp(this.now, next, { kind: "teardown", detail: "warmed workspace released (simulated)" });
    return transition(next, "TORN_DOWN");
  }
}

/**
 * Declared-but-unavailable backends. SSH and container runners exist as
 * interfaces with honest unavailability (no backend registered; container
 * engine down on this workstation). They throw RUNNER_UNAVAILABLE on every
 * op instead of pretending. Real backends arrive as owner-authorized
 * runtime work, not silent simulation.
 */
abstract class UnavailableRunner implements Runner {
  abstract readonly runnerId: string;
  abstract readonly kind: "ssh" | "container";
  abstract readonly unavailableReason: string;

  capabilities(): RunnerCapabilities {
    return {
      kind: this.kind,
      simulated: false,
      available: false,
      unavailableReason: this.unavailableReason,
      maxTimeoutMs: 0,
      allowedFilesystem: [],
    };
  }

  private fail(): never {
    throw new RunnerError("RUNNER_UNAVAILABLE", `${this.runnerId}: ${this.unavailableReason}`);
  }

  async provision(_workspace: WorkspaceSpec): Promise<RunRecord> {
    this.fail();
  }

  async sync(): Promise<{ added: string[]; modified: string[]; deleted: string[] }> {
    this.fail();
  }

  async run(_record: RunRecord, _spec: RunSpec): Promise<RunRecord> {
    this.fail();
  }

  async teardown(_record: RunRecord): Promise<RunRecord> {
    this.fail();
  }
}

export class SshRunner extends UnavailableRunner {
  readonly runnerId = "ssh";
  readonly kind = "ssh" as const;
  readonly unavailableReason = "no SSH backend registered (owner-authorized runtime work)";
}

export class ContainerRunner extends UnavailableRunner {
  readonly runnerId = "container";
  readonly kind = "container" as const;
  readonly unavailableReason = "container engine unreachable on this workstation (Docker Desktop closed)";
}
