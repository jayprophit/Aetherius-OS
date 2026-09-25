import type { IsolationNetwork } from "./types";

/**
 * REQ-p20-execution-target-profile: typed schedulable execution-target
 * description.
 *
 * WHAT CAN THIS TARGET PROVIDE, under what execution constraints — so
 * scheduler/placement logic can compare TASK REQUIREMENTS against TARGET
 * CAPABILITIES without provisioning anything here.
 *
 * Boundary discipline (see docs/execution-target-profile.md):
 * profile != instance, decision, worker, pool, hardware profile,
 * provisioner, security proof, or secrets store. Joins existing
 * contracts: RunnerKind/Isolation (runners), PlacementRequest bounds
 * (placement), WorkerPool leases (genesis), compute signals
 * (providers), HardwareProfile evidence (providers), SECRET_REFERENCE
 * discipline (state), P25 authorization, P30 decisions.
 */

export type ExecutionTargetType =
  | "local-directory"
  | "wsl"
  | "docker"
  | "vm-b"
  | "ssh"
  | "container";

export const TARGET_TYPES: readonly ExecutionTargetType[] = [
  "local-directory",
  "wsl",
  "docker",
  "vm-b",
  "ssh",
  "container",
];

/** Explicit lifetime; container != ephemeral and VM != persistent by fiat. */
export type TargetPersistence = "ephemeral" | "session" | "persistent";

export type CostBasis = "fixed-task" | "hourly" | "per-second" | "internal-weight" | "unknown";

export interface TargetCost {
  amount?: number;
  currency?: string;
  basis: CostBasis;
}

export type TargetProvenance =
  | "LOCAL_MEASURED"
  | "CONFIGURED"
  | "PLACEMENT_METADATA"
  | "PROVIDER_DECLARED"
  | "UNVERIFIED";

const PROVENANCES: readonly TargetProvenance[] = [
  "LOCAL_MEASURED",
  "CONFIGURED",
  "PLACEMENT_METADATA",
  "PROVIDER_DECLARED",
  "UNVERIFIED",
];

export interface SecretCapability {
  /** Required secret classes (names only). Never values. */
  classes: string[];
  injectionAvailable: boolean;
}

export interface ExecutionTargetProfile {
  /** Profile definition id — never a machine/worker/pool/hardware id. */
  targetProfileId: string;
  targetType: ExecutionTargetType;
  persistence: TargetPersistence;
  /** Minimum logical CPUs. */
  minCores?: number;
  /** Minimum RAM in bytes. */
  minRamBytes?: number;
  gpuRequired: boolean;
  /** Optional reference to a measured HardwareProfile (id only). */
  hardwareProfileRef?: string;
  /** Minimum storage in bytes + class. */
  minStorageBytes?: number;
  storagePersistent?: boolean;
  network: IsolationNetwork;
  secrets?: SecretCapability;
  /** Maximum working-space bytes for one scheduled unit (not host storage). */
  workspaceQuotaBytes?: number;
  cost?: TargetCost;
  poolRef?: string;
  provenance: TargetProvenance;
}

export type TargetProblem =
  | "profile-id"
  | "target-type"
  | "persistence"
  | "cpu"
  | "ram"
  | "gpu"
  | "storage"
  | "network"
  | "secrets"
  | "workspace-quota"
  | "cost"
  | "provenance";

const NETWORKS: readonly IsolationNetwork[] = ["none", "restricted", "open"];

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function positiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/** Validate a profile. Empty problems = registrable. Sparse allowed; malformed rejected. */
export function validateTargetProfile(profile: ExecutionTargetProfile): TargetProblem[] {
  const problems: TargetProblem[] = [];
  if (!nonEmpty(profile.targetProfileId)) problems.push("profile-id");
  if (!TARGET_TYPES.includes(profile.targetType)) problems.push("target-type");
  const persistences: TargetPersistence[] = ["ephemeral", "session", "persistent"];
  if (!persistences.includes(profile.persistence)) problems.push("persistence");
  if (profile.minCores !== undefined && !positiveInt(profile.minCores)) problems.push("cpu");
  if (profile.minRamBytes !== undefined && !positiveInt(profile.minRamBytes)) problems.push("ram");
  if (typeof profile.gpuRequired !== "boolean") problems.push("gpu");
  if (profile.hardwareProfileRef !== undefined && !nonEmpty(profile.hardwareProfileRef)) problems.push("gpu");
  if (profile.minStorageBytes !== undefined && !positiveInt(profile.minStorageBytes)) problems.push("storage");
  if (profile.storagePersistent !== undefined && typeof profile.storagePersistent !== "boolean") problems.push("storage");
  if (!NETWORKS.includes(profile.network)) problems.push("network");
  if (profile.secrets !== undefined) {
    if (!Array.isArray(profile.secrets.classes) || profile.secrets.classes.some((c) => !nonEmpty(c))) {
      problems.push("secrets");
    }
    if (typeof profile.secrets.injectionAvailable !== "boolean") problems.push("secrets");
  }
  if (profile.workspaceQuotaBytes !== undefined && !positiveInt(profile.workspaceQuotaBytes)) {
    problems.push("workspace-quota");
  }
  if (profile.cost !== undefined) {
    const bases: CostBasis[] = ["fixed-task", "hourly", "per-second", "internal-weight", "unknown"];
    if (!bases.includes(profile.cost.basis)) {
      problems.push("cost");
    } else if (profile.cost.basis === "unknown") {
      if (profile.cost.amount !== undefined || profile.cost.currency !== undefined) problems.push("cost");
    } else if (profile.cost.basis === "internal-weight") {
      if (profile.cost.currency !== undefined) problems.push("cost");
      if (profile.cost.amount !== undefined &&
          (typeof profile.cost.amount !== "number" || !Number.isFinite(profile.cost.amount) || profile.cost.amount < 0)) {
        problems.push("cost");
      }
    } else {
      const { amount, currency } = profile.cost;
      if (amount === undefined || currency === undefined || !nonEmpty(currency) ||
          typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
        problems.push("cost");
      }
    }
  }
  if (!PROVENANCES.includes(profile.provenance)) problems.push("provenance");
  return [...new Set(problems)].sort() as TargetProblem[];
}

export class ExecutionTargetRegistry {
  private readonly profiles = new Map<string, ExecutionTargetProfile>();

  register(profile: ExecutionTargetProfile): ExecutionTargetProfile {
    const problems = validateTargetProfile(profile);
    if (problems.length > 0) throw new Error(`invalid execution target profile: ${problems.join(",")}`);
    if (this.profiles.has(profile.targetProfileId)) {
      throw new Error(`duplicate execution target profile ${profile.targetProfileId}`);
    }
    const stored: ExecutionTargetProfile = JSON.parse(JSON.stringify(profile)) as ExecutionTargetProfile;
    this.profiles.set(profile.targetProfileId, stored);
    return stored;
  }

  lookup(targetProfileId: string): ExecutionTargetProfile | null {
    return this.profiles.get(targetProfileId) ?? null;
  }

  list(): ExecutionTargetProfile[] {
    return [...this.profiles.values()].sort((a, b) => (a.targetProfileId < b.targetProfileId ? -1 : 1));
  }
}

/** Task-side requirements compared against target capabilities. */
export interface TaskRequirements {
  minCores?: number;
  minRamBytes?: number;
  gpuRequired?: boolean;
  /** Required precision label; needs a hardware-profile resolver to verify. */
  precision?: string;
  minStorageBytes?: number;
  storagePersistent?: boolean;
  workspaceBytes?: number;
  network?: IsolationNetwork;
  secretClasses?: string[];
  persistence?: TargetPersistence;
  maxCost?: { amount: number; currency: string; basis: CostBasis };
}

export interface HardwareEvidence {
  profileId: string;
  precisions: { precision: string; support: string }[];
}

export interface CompatibilityInput {
  requirements: TaskRequirements;
  resolveHardware?: (ref: string) => HardwareEvidence | null;
}

export interface CompatibleTarget {
  profile: ExecutionTargetProfile;
}

export interface IncompatibleTarget {
  profile: string;
  reasons: string[];
}

export interface CompatibilityResult {
  compatible: CompatibleTarget[];
  incompatible: IncompatibleTarget[];
}

const NETWORK_ORDER: Record<IsolationNetwork, number> = { none: 0, restricted: 1, open: 2 };

function checkCost(profile: ExecutionTargetProfile, maxCost: NonNullable<TaskRequirements["maxCost"]>): string | null {
  const cost = profile.cost;
  if (!cost || cost.basis === "unknown" || cost.amount === undefined || cost.currency === undefined) {
    return `cost unknown on ${profile.targetProfileId} (UNKNOWN != affordable)`;
  }
  if (cost.basis !== maxCost.basis || cost.currency !== maxCost.currency) {
    return `cost ${cost.basis}/${cost.currency} not comparable to budget ${maxCost.basis}/${maxCost.currency}`;
  }
  if (cost.amount > maxCost.amount) {
    return `cost ${cost.amount} exceeds budget ${maxCost.amount} ${maxCost.currency}`;
  }
  return null;
}

/**
 * Compatibility filtering with explicit exclusion reasons (never bare
 * true/false). Profiles describe capability; this function never
 * provisions, authorizes secrets, or decides placement.
 */
export function checkCompatibility(
  profiles: readonly ExecutionTargetProfile[],
  input: CompatibilityInput,
): CompatibilityResult {
  const req = input.requirements;
  const compatible: CompatibleTarget[] = [];
  const incompatible: IncompatibleTarget[] = [];
  for (const profile of [...profiles].sort((a, b) => (a.targetProfileId < b.targetProfileId ? -1 : 1))) {
    const reasons: string[] = [];
    if (req.minCores !== undefined && (profile.minCores === undefined || profile.minCores < req.minCores)) {
      reasons.push(`CPU ${profile.minCores ?? "unknown"} < required ${req.minCores}`);
    }
    if (req.minRamBytes !== undefined && (profile.minRamBytes === undefined || profile.minRamBytes < req.minRamBytes)) {
      reasons.push(`RAM ${profile.minRamBytes ?? "unknown"} < required ${req.minRamBytes}`);
    }
    if (req.gpuRequired === true && !profile.gpuRequired) {
      reasons.push("GPU required but target declares none");
    }
    if (req.precision !== undefined) {
      if (!profile.hardwareProfileRef || !input.resolveHardware) {
        reasons.push(`precision ${req.precision} unverifiable: no hardware evidence linked`);
      } else {
        const evidence = input.resolveHardware(profile.hardwareProfileRef);
        const entry = evidence?.precisions.find((p) => p.precision === req.precision);
        if (!entry) {
          reasons.push(`precision ${req.precision} absent from hardware evidence ${profile.hardwareProfileRef}`);
        } else if (entry.support !== "MEASURED") {
          reasons.push(`precision ${req.precision} is ${entry.support}, not MEASURED`);
        }
      }
    }
    if (req.minStorageBytes !== undefined &&
        (profile.minStorageBytes === undefined || profile.minStorageBytes < req.minStorageBytes)) {
      reasons.push(`storage ${profile.minStorageBytes ?? "unknown"} < required ${req.minStorageBytes}`);
    }
    if (req.storagePersistent === true && profile.storagePersistent !== true) {
      reasons.push("persistent storage required but target is scratch-only");
    }
    if (req.workspaceBytes !== undefined &&
        (profile.workspaceQuotaBytes === undefined || profile.workspaceQuotaBytes < req.workspaceBytes)) {
      reasons.push(`workspace quota ${profile.workspaceQuotaBytes ?? "unknown"} < required ${req.workspaceBytes}`);
    }
    if (req.network !== undefined && NETWORK_ORDER[profile.network] < NETWORK_ORDER[req.network]) {
      reasons.push(`network ${profile.network} narrower than required ${req.network}`);
    }
    for (const cls of req.secretClasses ?? []) {
      if (!profile.secrets || !profile.secrets.classes.includes(cls) || !profile.secrets.injectionAvailable) {
        reasons.push(`secret class ${cls} not injectable on target`);
      }
    }
    if (req.persistence !== undefined && profile.persistence !== req.persistence) {
      reasons.push(`persistence ${profile.persistence} != required ${req.persistence}`);
    }
    if (req.maxCost !== undefined) {
      const costProblem = checkCost(profile, req.maxCost);
      if (costProblem) reasons.push(costProblem);
    }
    if (reasons.length === 0) compatible.push({ profile });
    else incompatible.push({ profile: profile.targetProfileId, reasons });
  }
  return { compatible, incompatible };
}
