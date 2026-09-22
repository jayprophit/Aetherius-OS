import type { ProgrammeBundle, Requirement, SelectionResult } from "./types";

function dependentsCount(r: Requirement, byId: Map<string, Requirement>): number {
  let n = 0;
  for (const other of byId.values()) {
    if (other.depends_on.includes(r.id)) n += 1;
  }
  return n;
}

function phaseRank(phase: string): number {
  const m = /^P(\d+)$/.exec(phase);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

function isExecutable(r: Requirement, byId: Map<string, Requirement>): { ok: boolean; reason: string } {
  if (r.work_state === "COMPLETE") return { ok: false, reason: "already COMPLETE" };
  if (r.work_state === "DEFERRED") return { ok: false, reason: "DEFERRED" };
  if (r.work_state === "IN_PROGRESS") return { ok: false, reason: "already IN_PROGRESS" };
  if (r.work_state === "BLOCKED") {
    return { ok: false, reason: `BLOCKED: ${r.blockers.join("; ") || "blocker recorded"}` };
  }
  if (r.work_state === "OWNER_GATED" || r.owner_gate) {
    return { ok: false, reason: "OWNER_GATED: owner action required" };
  }
  for (const dep of [...r.depends_on].sort()) {
    const d = byId.get(dep);
    if (!d || d.work_state !== "COMPLETE") {
      return { ok: false, reason: `waiting on dependency ${dep}` };
    }
  }
  if (r.blockers.length > 0) {
    return { ok: false, reason: `BLOCKED: ${r.blockers.join("; ")}` };
  }
  return { ok: true, reason: "READY" };
}

function compareCandidates(
  a: Requirement,
  b: Requirement,
  byId: Map<string, Requirement>,
): number {
  // 1. Explicit owner/programme priority wins (higher number = more urgent).
  if (a.priority !== b.priority) return b.priority - a.priority;
  // 2. Dependency-unblocking value: unlocks more downstream work first.
  const ua = dependentsCount(a, byId);
  const ub = dependentsCount(b, byId);
  if (ua !== ub) return ub - ua;
  // 3. Earlier required phase.
  const pa = phaseRank(a.phase);
  const pb = phaseRank(b.phase);
  if (pa !== pb) return pa - pb;
  // 4. Stable requirement id (total, deterministic).
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Deterministically select the next highest-priority executable task.
 * Pure: same registry state always yields the same selection.
 * Never invents tasks, never uses time/randomness/enumeration order.
 */
export function selectNextTask(bundle: ProgrammeBundle): SelectionResult {
  const reqs = bundle.requirements;
  const byId = new Map(reqs.map((r) => [r.id, r]));
  const projectIds = new Set(bundle.programme.projects.map((p) => p.id));

  const executable: Requirement[] = [];
  for (const r of reqs) {
    if (!projectIds.has(r.owner) && !r.owner.startsWith("external:")) continue;
    const check = isExecutable(r, byId);
    if (check.ok) executable.push(r);
  }

  if (executable.length === 0) {
    const blocked = reqs.filter((r) => r.work_state === "BLOCKED" || r.blockers.length > 0).length;
    const gated = reqs.filter((r) => r.work_state === "OWNER_GATED" || r.owner_gate).length;
    const done = reqs.filter((r) => r.work_state === "COMPLETE").length;
    return {
      selected_task: null,
      phase: null,
      project: null,
      reason:
        reqs.length === 0
          ? "registry contains no requirements"
          : `no executable task: ${done} COMPLETE, ${blocked} BLOCKED, ${gated} OWNER_GATED, remainder waiting on dependencies`,
      priority: null,
      dependencies_satisfied: false,
      blockers: [],
      owner_gate: false,
      evidence: [],
    };
  }

  const ranked = [...executable].sort((a, b) => compareCandidates(a, b, byId));
  const winner = ranked[0];
  const unblocking = dependentsCount(winner, byId);
  return {
    selected_task: winner.id,
    phase: winner.phase,
    project: winner.owner,
    reason:
      `highest-priority READY task (priority ${winner.priority}); ` +
      `all hard dependencies COMPLETE; no owner gate; ` +
      `unblocks ${unblocking} downstream requirement${unblocking === 1 ? "" : "s"}; ` +
      `tie-break phase ${winner.phase} / id ${winner.id}`,
    priority: winner.priority,
    dependencies_satisfied: true,
    blockers: [],
    owner_gate: false,
    evidence: [...winner.evidence].sort(),
  };
}

export function formatSelection(result: SelectionResult): string {
  if (!result.selected_task) {
    return `NEXT_EXECUTABLE_TODO: none\nWHY: ${result.reason}`;
  }
  return (
    `NEXT_EXECUTABLE_TODO: ${result.selected_task}\n` +
    `PHASE: ${result.phase}\n` +
    `PROJECT: ${result.project}\n` +
    `WHY: ${result.reason}`
  );
}
