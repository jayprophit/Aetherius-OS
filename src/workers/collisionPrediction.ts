import type { SyncConflictPolicy } from "../runners/sync";
import type { ChangeImpactGraph } from "../programme/changeImpact";
import type { TouchEstimate } from "./touch";

/**
 * REQ-p20-collision-predictor: worker collision prediction.
 *
 * The registered requirement is the scope authority:
 *
 *   "Forecast cross-worker collisions from touch sets, branches and merge
 *    order before execution; reactive serialization already exists,
 *    prediction does not."
 *
 * The clause "reactive serialization already exists" is the governing
 * constraint. `applySync` / `SyncConflictPolicy` in `src/runners/sync.ts`
 * already detects a conflict WHEN a sync actually happens, and that remains
 * the oracle. This unit does not reimplement, wrap or replace it; it only
 * forecasts, BEFORE execution, from the three inputs the requirement names:
 * touch sets, branches and merge order.
 *
 * A FORECAST IS NOT A PREVENTION AND NOT A PROOF. Predicted overlap is a
 * structural observation about plans, not evidence that a collision will
 * occur and not evidence that one will not. Only the reactive sync conflict
 * is an actual observation:
 *
 *   PREDICTION        != PREVENTION
 *   PREDICTED COLLISION != OBSERVED COLLISION
 *   NO PREDICTION     != NO COLLISION
 *   TOUCH PREDICTION  != CODE DEPENDENCY
 *
 * NO PROBABILITY, NO SCORE. Two plans either share a predicted path or they
 * do not, and that is decidable. A collision "probability" here would be an
 * invented number, so none is produced.
 */

/** How two workers' plans relate, structurally. */
export const COLLISION_KINDS = ["SHARED_WRITE", "DEPENDENT_WRITE"] as const;
export type CollisionKind = (typeof COLLISION_KINDS)[number];

/**
 * `UNPREDICTABLE` is a real outcome: a plan whose touch set could not be
 * estimated cannot be cleared of collisions.
 */
export type PlanCertainty = "PREDICTED" | "UNPREDICTABLE";

export interface PlannedWorker {
  workerId: string;
  /** Branch the worker is expected to modify. */
  branch: string;
  /** Position in the merge order; lower merges earlier. */
  mergeOrder: number;
  /** The worker's predicted touch set. Consumed, never re-estimated. */
  touch: TouchEstimate;
}

export interface CollisionPair {
  kind: CollisionKind;
  /** Deterministic pair key: the two worker ids in sorted order. */
  workers: [string, string];
  /** The predicted paths both plans touch, sorted. */
  paths: string[];
  /** One of the workers' branches, named for the reviewer. */
  viaBranch: string;
}

export interface CollisionForecast {
  collisions: CollisionPair[];
  /**
   * Workers whose touch set could not be estimated, with the estimator's own
   * reasons. An unpredicted worker is NOT cleared of collisions.
   */
  unpredictable: { workerId: string; reasons: string[] }[];
  /** Merge-order conflicts: two branches at the same position. */
  mergeOrderClashes: { branches: [string, string]; mergeOrder: number }[];
  /** The reactive policy that remains the actual oracle. */
  reactiveOracle: SyncConflictPolicy;
  /** Always true: no probability, score, ranking or verdict. */
  noProbability: true;
  provenance: string;
}

export type CollisionProblem =
  | "workers"
  | "worker-id"
  | "branch"
  | "merge-order"
  | "touch"
  | "duplicate-worker"
  | "graph"
  | "policy"
  | "unknown-field";

const FORECAST_PROVENANCE = "p20-collision-predictor";
const POLICIES: readonly SyncConflictPolicy[] = ["error", "incoming-wins", "existing-wins"];
const ALLOWED_KEYS: ReadonlySet<string> = new Set([
  "workers",
  "graph",
  "reactiveOracle",
  "provenance",
]);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Real comparator (never a factory): a factory passed to sort yields NaN. */
function compareCollisions(a: CollisionPair, b: CollisionPair): number {
  return (
    compareStrings(a.workers[0], b.workers[0]) ||
    compareStrings(a.workers[1], b.workers[1]) ||
    compareStrings(a.kind, b.kind)
  );
}

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Forecast collisions between planned workers BEFORE execution.
 *
 * `graph` is optional. When supplied, a shared write to a path another
 * worker DEPENDS ON is reported as `DEPENDENT_WRITE`, which is structurally
 * more than two plans editing the same file. When it is absent, only
 * `SHARED_WRITE` can be predicted, and that limitation is the honest result
 * rather than a guess at dependency structure.
 */
export function forecastCollisions(input: {
  workers: readonly PlannedWorker[];
  graph?: ChangeImpactGraph;
  reactiveOracle?: SyncConflictPolicy;
  provenance?: string;
}): CollisionForecast {
  const problems: CollisionProblem[] = [];
  for (const key of Object.keys(input ?? {})) {
    if (!ALLOWED_KEYS.has(key)) problems.push("unknown-field");
  }
  if (!Array.isArray(input?.workers) || input.workers.length === 0) problems.push("workers");
  else {
    for (const worker of input.workers) {
      if (!nonEmpty(worker?.workerId)) problems.push("worker-id");
      if (!nonEmpty(worker?.branch)) problems.push("branch");
      if (!Number.isInteger(worker?.mergeOrder) || (worker?.mergeOrder as number) < 0) problems.push("merge-order");
      if (!Array.isArray(worker?.touch?.paths)) problems.push("touch");
    }
    const ids = input.workers.map((w) => w.workerId);
    if (new Set(ids).size !== ids.length) problems.push("duplicate-worker");
  }
  const oracle = input?.reactiveOracle ?? "error";
  if (!POLICIES.includes(oracle)) problems.push("policy");
  if (problems.length > 0) {
    throw new Error(`invalid collision forecast: ${[...new Set(problems)].sort().join(",")}`);
  }

  // A worker whose touch set could not be estimated is NOT cleared. Its
  // estimator reasons are carried through rather than discarded.
  const predictable = input.workers.filter((w) => w.touch.unknown.length === 0);
  const unpredictable = input.workers
    .filter((w) => w.touch.unknown.length > 0)
    .map((w) => ({
      workerId: w.workerId,
      reasons: [...w.touch.unknown].sort(compareStrings),
    }))
    .sort((a, b) => compareStrings(a.workerId, b.workerId));

  // Which worker predicted a write to each path.
  const writersOf = new Map<string, string[]>();
  // Reverse dependency index over the graph: for each path, the FILES that
  // import it. Those are paths, not workers — the hop to a worker happens
  // below through each worker's own predicted touch set.
  const importingFilesOf = new Map<string, string[]>();
  for (const edge of input.graph?.edges ?? []) {
    const importers = importingFilesOf.get(edge.to);
    if (importers === undefined) importingFilesOf.set(edge.to, [edge.from]);
    else importers.push(edge.from);
  }
  for (const worker of predictable) {
    for (const path of worker.touch.paths) {
      const writers = writersOf.get(path);
      if (writers === undefined) writersOf.set(path, [worker.workerId]);
      else writers.push(worker.workerId);
    }
  }
  // Which files each worker predicts it will touch, for the dependent hop.
  const filesOfWorker = new Map<string, string[]>();
  for (const worker of predictable) {
    filesOfWorker.set(worker.workerId, [...new Set(worker.touch.paths)].sort(compareStrings));
  }

  const byPair = new Map<string, CollisionPair>();
  const add = (kind: CollisionKind, left: string, right: string, path: string, branchOwner: string): void => {
    const pair = pairKey(left, right);
    const key = `${pair[0]}|${pair[1]}|${kind}`;
    const existing = byPair.get(key);
    if (existing === undefined) {
      byPair.set(key, { kind, workers: pair, paths: [path], viaBranch: branchOwner });
    } else if (!existing.paths.includes(path)) {
      existing.paths.push(path);
    }
  };

  for (const path of [...writersOf.keys()].sort(compareStrings)) {
    const writers = [...new Set(writersOf.get(path)!)].sort(compareStrings);
    // Every pair of workers predicting the same path is a shared write.
    for (let i = 0; i < writers.length; i++) {
      for (let j = i + 1; j < writers.length; j++) {
        add("SHARED_WRITE", writers[i]!, writers[j]!, path, byId(input.workers, writers[i]!).branch);
      }
    }
    // A worker whose own predicted files import this path is affected by the
    // write even without writing it: a two-hop join through the graph.
    const importers = [...new Set(importingFilesOf.get(path) ?? [])].sort(compareStrings);
    for (const importer of importers) {
      for (const candidate of predictable) {
        if (!filesOfWorker.get(candidate.workerId)!.includes(importer)) continue;
        for (const writer of writers) {
          if (writer === candidate.workerId) continue;
          add("DEPENDENT_WRITE", candidate.workerId, writer, path, byId(input.workers, writer).branch);
        }
      }
    }
  }

  // Two branches claiming the same merge position is a clash a scheduler
  // must resolve; it is reported, not silently reordered.
  const byPosition = new Map<number, string[]>();
  for (const worker of input.workers) {
    const branches = byPosition.get(worker.mergeOrder);
    if (branches === undefined) byPosition.set(worker.mergeOrder, [worker.branch]);
    else if (!branches.includes(worker.branch)) branches.push(worker.branch);
  }
  const mergeOrderClashes: { branches: [string, string]; mergeOrder: number }[] = [];
  for (const mergeOrder of [...byPosition.keys()].sort((a, b) => a - b)) {
    const branches = [...new Set(byPosition.get(mergeOrder)!)].sort(compareStrings);
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        mergeOrderClashes.push({ branches: [branches[i]!, branches[j]!], mergeOrder });
      }
    }
  }

  return {
    collisions: [...byPair.values()]
      .map((c) => ({ ...c, paths: [...c.paths].sort(compareStrings) }))
      .sort(compareCollisions),
    unpredictable,
    mergeOrderClashes,
    // The reactive policy is named so a reader knows the actual oracle.
    reactiveOracle: oracle,
    noProbability: true,
    provenance: input.provenance ?? FORECAST_PROVENANCE,
  };
}

function byId(workers: readonly PlannedWorker[], id: string): PlannedWorker {
  const found = workers.find((w) => w.workerId === id);
  if (found === undefined) {
    throw new Error(`collision forecast references unknown worker ${id}`);
  }
  return found;
}
