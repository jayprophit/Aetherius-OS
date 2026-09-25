import { checkCompatibility } from "../runners/targets";
import type { ExecutionTargetProfile, TaskRequirements } from "../runners/targets";
import { parseSkillRef, type SkillRegistry } from "../workflows/skills";
import type { EvidenceRequirement } from "../workflows/evidenceGate";

/**
 * REQ-p20-worker-profiles: versioned worker profiles as spawn templates
 * for the P20 pool.
 *
 * A WorkerProfile is HOW TO SPAWN A TEMPORARY SPECIALIST — never who a
 * second AI person is. Profiles reference skills/tools/grants/targets/
 * evidence contracts; they never embed their definitions, never carry
 * identity/memory/secrets, and never authorize anything (P25 decides at
 * spawn). WorkerPool (genesis/workers.ts) remains the only spawner;
 * profiles project into its spawn inputs.
 *
 * Permanent: ONE GENESIS + TEMPORARY WORKERS. Profile version is
 * immutable (same id+version + different content = conflict); worker
 * lease identity is separate from profile version.
 */

export type TerminationCondition =
  | "task-complete"
  | "task-failed"
  | "timeout"
  | "budget-exhausted"
  | "policy-revoked"
  | "owner-cancelled"
  | "lease-expired"
  | "unrecoverable-error";

export const TERMINATION_CONDITIONS: readonly TerminationCondition[] = [
  "task-complete",
  "task-failed",
  "timeout",
  "budget-exhausted",
  "policy-revoked",
  "owner-cancelled",
  "lease-expired",
  "unrecoverable-error",
];

export interface ModelRequirements {
  modalities?: string[];
  minContext?: number;
  reasoning?: boolean;
  coding?: boolean;
  localOnly?: boolean;
  precision?: string;
}

export interface ProfileBudget {
  maxMs?: number;
  maxTokens?: number;
  maxCostAmount?: number;
  maxCostCurrency?: string;
  maxToolCalls?: number;
  maxRetries?: number;
}

export interface ProfileWorkspace {
  workspaceClass?: string;
  /** Symbolic writable scopes (workspace-relative). Never absolute paths. */
  writableScope?: string[];
  projectRootRequired?: boolean;
}

export interface WorkerProfile {
  workerProfileId: string;
  version: string;
  /** Functional specialization (coding/research/testing/review/…). Never authority. */
  role: string;
  /** Requested capabilities (refs). REQUESTED != AVAILABLE != AUTHORIZED. */
  capabilities: string[];
  modelRequirements?: ModelRequirements;
  /** Skill refs (resolved at spawn, never embedded). */
  skillRefs: string[];
  /** Tool/capability identifiers (requested, never permitted by listing). */
  toolRefs: string[];
  /** Required grant refs. Required != approved. */
  grantRefs: string[];
  /** Touch hints (workspace-relative safe paths). Hint != actual touch set. */
  touchHints?: string[];
  budget?: ProfileBudget;
  workspace?: ProfileWorkspace;
  evidenceContract?: EvidenceRequirement[];
  targetRequirements?: TaskRequirements;
  termination: { on: TerminationCondition[]; maxLeaseMs?: number };
  provenance: string;
}

export type ProfileProblem =
  | "profile-id"
  | "version"
  | "role"
  | "capabilities"
  | "model-requirements"
  | "skill-refs"
  | "tool-refs"
  | "grant-refs"
  | "touch-hints"
  | "budget"
  | "workspace"
  | "evidence-contract"
  | "termination"
  | "provenance";

const VERSION_RE = /^\d+\.\d+\.\d+$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function positiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function nonEmptyList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(nonEmpty);
}

function isSafeRelative(path: string): boolean {
  if (!nonEmpty(path)) return false;
  const p = path.trim();
  if (p.startsWith("/") || p.startsWith("\\")) return false;
  if (p.split(/[\\/]/).includes("..")) return false;
  return true;
}

/** Validate a profile. Empty problems = registrable. Sparse allowed; malformed rejected. */
export function validateWorkerProfile(profile: WorkerProfile): ProfileProblem[] {
  const problems: ProfileProblem[] = [];
  if (!nonEmpty(profile.workerProfileId)) problems.push("profile-id");
  if (!nonEmpty(profile.version) || !VERSION_RE.test(profile.version.trim())) problems.push("version");
  if (!nonEmpty(profile.role)) problems.push("role");
  if (!nonEmptyList(profile.capabilities)) problems.push("capabilities");
  const mr = profile.modelRequirements;
  if (mr !== undefined) {
    if (mr.modalities !== undefined && !mr.modalities.every(nonEmpty)) problems.push("model-requirements");
    if (mr.minContext !== undefined && !positiveInt(mr.minContext)) problems.push("model-requirements");
    if (mr.precision !== undefined && !nonEmpty(mr.precision)) problems.push("model-requirements");
    for (const flag of [mr.reasoning, mr.coding, mr.localOnly] as const) {
      if (flag !== undefined && typeof flag !== "boolean") problems.push("model-requirements");
    }
  }
  if (!Array.isArray(profile.skillRefs) || profile.skillRefs.some((r) => !nonEmpty(r))) problems.push("skill-refs");
  if (!Array.isArray(profile.toolRefs) || profile.toolRefs.some((r) => !nonEmpty(r))) problems.push("tool-refs");
  if (!Array.isArray(profile.grantRefs) || profile.grantRefs.some((r) => !nonEmpty(r))) problems.push("grant-refs");
  if (profile.touchHints !== undefined && profile.touchHints.some((p) => !isSafeRelative(p))) {
    problems.push("touch-hints");
  }
  const budget = profile.budget;
  if (budget !== undefined) {
    const numbers = [budget.maxMs, budget.maxTokens, budget.maxCostAmount, budget.maxToolCalls, budget.maxRetries];
    if (numbers.some((n) => n !== undefined && (!Number.isFinite(n) || (n as number) < 0))) problems.push("budget");
    if (budget.maxCostCurrency !== undefined && !nonEmpty(budget.maxCostCurrency)) problems.push("budget");
    if (budget.maxCostAmount !== undefined && budget.maxCostCurrency === undefined) problems.push("budget");
  }
  const workspace = profile.workspace;
  if (workspace !== undefined) {
    if (workspace.workspaceClass !== undefined && !nonEmpty(workspace.workspaceClass)) problems.push("workspace");
    if (workspace.writableScope !== undefined && workspace.writableScope.some((p) => !isSafeRelative(p))) {
      problems.push("workspace");
    }
    if (workspace.projectRootRequired !== undefined && typeof workspace.projectRootRequired !== "boolean") {
      problems.push("workspace");
    }
  }
  if (profile.evidenceContract !== undefined) {
    const keys = new Set<string>();
    for (const req of profile.evidenceContract) {
      if (!nonEmpty(req?.key) || !nonEmpty(req?.description) || keys.has(req.key.trim())) {
        problems.push("evidence-contract");
        break;
      }
      keys.add(req.key.trim());
    }
  }
  if (!Array.isArray(profile.termination?.on) || profile.termination.on.length === 0 ||
      profile.termination.on.some((c) => !TERMINATION_CONDITIONS.includes(c))) {
    problems.push("termination");
  }
  if (profile.termination?.maxLeaseMs !== undefined && !positiveInt(profile.termination.maxLeaseMs)) {
    problems.push("termination");
  }
  if (!nonEmpty(profile.provenance)) problems.push("provenance");
  return [...new Set(problems)].sort() as ProfileProblem[];
}

export class WorkerProfileRegistry {
  private readonly profiles = new Map<string, WorkerProfile>();

  private key(profileId: string, version: string): string {
    return `${profileId}@${version}`;
  }

  register(profile: WorkerProfile): WorkerProfile {
    const problems = validateWorkerProfile(profile);
    if (problems.length > 0) throw new Error(`invalid worker profile: ${problems.join(",")}`);
    const key = this.key(profile.workerProfileId.trim(), profile.version.trim());
    const stored: WorkerProfile = JSON.parse(JSON.stringify(profile)) as WorkerProfile;
    const existing = this.profiles.get(key);
    if (existing) {
      if (JSON.stringify(existing) === JSON.stringify(stored)) return existing;
      throw new Error(`conflicting worker profile ${key}: versions are immutable`);
    }
    this.profiles.set(key, stored);
    return stored;
  }

  lookup(workerProfileId: string, version: string): WorkerProfile | null {
    return this.profiles.get(this.key(workerProfileId, version)) ?? null;
  }

  list(): WorkerProfile[] {
    return [...this.profiles.values()].sort((a, b) =>
      a.workerProfileId === b.workerProfileId
        ? a.version < b.version ? -1 : 1
        : a.workerProfileId < b.workerProfileId ? -1 : 1,
    );
  }
}

export interface SpawnProjection {
  workerProfileId: string;
  version: string;
  /** Capability scope for WorkerPool.spawn. */
  capabilityScope: string[];
  /** Lease for WorkerPool.spawn (profile maxLeaseMs or pool default). */
  ttlMs?: number;
  touchHints: string[];
  skillRefs: string[];
  toolRefs: string[];
  grantRefs: string[];
  evidenceContract: EvidenceRequirement[];
  targetRequirements?: TaskRequirements;
}

export interface ProfileDeps {
  skills?: { has(skillId: string, version?: string): boolean };
}

/**
 * Project a profile into WorkerPool.spawn inputs without spawning.
 * Skill refs resolve (unresolvable refs fail); grants/tools/capabilities
 * pass through as requests (never approvals); touch hints pass through
 * as hints (never actuals). The pool still enforces bounds, leases,
 * task binding and P25 authorization at spawn.
 */
export function projectSpawnTemplate(
  profile: WorkerProfile,
  deps: ProfileDeps = {},
): SpawnProjection {
  const problems = validateWorkerProfile(profile);
  if (problems.length > 0) throw new Error(`invalid worker profile: ${problems.join(",")}`);
  const unresolved: string[] = [];
  if (profile.skillRefs.length > 0) {
    if (!deps.skills) {
      throw new Error("spawn projection needs a skill registry to resolve skillRefs");
    }
    for (const ref of profile.skillRefs) {
      const parsed = parseSkillRef(ref.trim()) ?? (/^[A-Za-z0-9_.-]+$/.test(ref.trim()) ? { skillId: ref.trim() } : null);
      if (!parsed || !deps.skills.has(parsed.skillId, parsed.version)) {
        unresolved.push(ref);
      }
    }
  }
  if (unresolved.length > 0) {
    throw new Error(`unresolvable skill refs: ${unresolved.sort().join(",")}`);
  }
  return {
    workerProfileId: profile.workerProfileId,
    version: profile.version,
    capabilityScope: [...profile.capabilities],
    ...(profile.termination.maxLeaseMs !== undefined ? { ttlMs: profile.termination.maxLeaseMs } : {}),
    touchHints: [...(profile.touchHints ?? [])],
    skillRefs: [...profile.skillRefs],
    toolRefs: [...profile.toolRefs],
    grantRefs: [...profile.grantRefs],
    evidenceContract: [...(profile.evidenceContract ?? [])],
    ...(profile.targetRequirements !== undefined ? { targetRequirements: profile.targetRequirements } : {}),
  };
}

export type Schedulability =
  | { status: "COMPATIBLE"; targets: string[] }
  | { status: "INCOMPATIBLE"; reasons: string[] }
  | { status: "UNDETERMINED"; reason: string };

/**
 * Profile-to-target schedulability: delegates resource compatibility to
 * the target-profile checkCompatibility (never duplicated). Profiles
 * without target requirements are UNDETERMINED (unspecified != denied).
 */
export function profileSchedulability(
  projection: SpawnProjection,
  targets: readonly ExecutionTargetProfile[],
  resolveHardware?: (ref: string) => { profileId: string; precisions: { precision: string; support: string }[] } | null,
): Schedulability {
  if (!projection.targetRequirements) {
    return { status: "UNDETERMINED", reason: "profile states no target requirements" };
  }
  const result = checkCompatibility(targets, { requirements: projection.targetRequirements, resolveHardware });
  if (result.compatible.length > 0) {
    return { status: "COMPATIBLE", targets: result.compatible.map((c) => c.profile.targetProfileId) };
  }
  return {
    status: "INCOMPATIBLE",
    reasons: result.incompatible.flatMap((i) => i.reasons.map((r) => `${i.profile}: ${r}`)).sort(),
  };
}
