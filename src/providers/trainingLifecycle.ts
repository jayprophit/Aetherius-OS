import type { BenchmarkSource } from "./benchmarks";

/**
 * REQ-p18-training-compute: model training-compute LIFECYCLE PROFILE.
 *
 * The registered requirement is the scope authority, and it reads:
 *
 *   "Model lifecycle metadata (pretraining/post-training stage, compute
 *    class, attention/position-encoding tags) as advisory routing evidence;
 *    host inference signals are a different domain."
 *
 * So this is a LIFECYCLE METADATA PROFILE, not a training-run record. The
 * four facts it carries are exactly the four the requirement names:
 * lifecycle stage, compute class, attention tags, position-encoding tags.
 *
 * WHAT THIS DELIBERATELY DOES NOT CONTAIN, AND WHY. The requirement asks for
 * no measured training compute, so this record has NO numeric measurement
 * fields at all — no FLOPs, no wall time, no memory usage, no energy, no
 * cost, no utilization, no token counts, no step/epoch counts. Adding them
 * would mean inventing numbers the requirement never requested and that this
 * repository cannot measure: the only hardware measurement here is
 * src/providers/hardwareProbe.ts, an FP32 matmul latency probe with no energy
 * sensor, no allocator/RSS probe and no training telemetry backend. A record
 * of training compute that carried no compute would be theatre.
 *
 *   TRAINING COMPUTE PROFILE != TRAINING RUNTIME
 *   TRAINING METADATA     != MODEL TRAINING
 *   TRAINING PLAN         != TRAINING EXECUTION
 *   MODEL LIFECYCLE STAGE != HOST INFERENCE SIGNAL
 *
 * The last line is the requirement's own boundary: host inference signals
 * (src/providers/hardware.ts, src/runners/targets.ts, src/placement) are a
 * DIFFERENT DOMAIN and are not referenced, merged or inferred here.
 *
 * ADVISORY ONLY. This is evidence a caller MAY consult. It is deliberately
 * NOT wired into routeCapabilityRequest (src/providers/capabilities.ts) or
 * routeWithLiveState (src/providers/live.ts): turning advisory lifecycle
 * metadata into a hard routing requirement would change production routing
 * behaviour, which no advisory record is entitled to do.
 *
 *   ADVISORY EVIDENCE != ROUTING DECISION
 *   MORE TRAINING COMPUTE != BETTER MODEL
 *   PARAMETER COUNT != TRAINING COMPUTE
 */

/**
 * Lifecycle stage vocabulary. These two terms are taken from the registered
 * description itself ("pretraining/post-training stage"). Finer stages
 * (continue-pretrain, finetune, instruction-tune, preference-tune, distill,
 * quantize) are deliberately NOT invented: the requirement does not define
 * them, and an unknown stage must stay unknown rather than be guessed into a
 * finer bucket.
 */
export const TRAINING_STAGES = ["pretraining", "post-training"] as const;
export type TrainingStage = (typeof TRAINING_STAGES)[number];

/**
 * Where a claim came from. This REUSES the canonical vocabulary already
 * established in src/providers/benchmarks.ts (BenchmarkSource) rather than
 * inventing a fourth provenance dialect in this repository. The question is
 * identical in both places: is this claim locally established, reported by a
 * vendor, reported by a third party, historical, or simply unknown?
 */
export type ClaimSource = BenchmarkSource;

export const CLAIM_SOURCES: readonly ClaimSource[] = [
  "LOCAL_MEASURED",
  "INTERNAL_TEST",
  "VENDOR_REPORTED",
  "THIRD_PARTY_REPORTED",
  "HISTORICAL",
  "UNKNOWN",
];

/**
 * Provenance for one asserted fact. A value may not be asserted without
 * saying where it came from: `validateProfile` REJECTS an orphan claim, so a
 * fabricated tag cannot be smuggled in unattributed.
 */
export interface LifecycleClaim {
  source: ClaimSource;
  /** Opaque reference (doc, card, run, evidence node). Never raw credentials. */
  evidenceRef?: string;
}

export interface TrainingLifecycleProfile {
  /** "tclp-<slug>". Structurally distinct from model ids and run ids. */
  profileId: string;
  /** Strict x.y.z, matching the Dataset/Scorer registry convention. */
  version: string;
  /** Opaque reference to the model this describes. ModelCard is NOT modified. */
  modelRef: string;
  /** Absent means UNKNOWN — never guessed, and never "no special stage". */
  stage?: TrainingStage;
  stageClaim?: LifecycleClaim;
  /**
   * Open, provenance-bearing claim. The requirement names "compute class"
   * but defines no vocabulary, so no canonical scale is invented here.
   * Absent means UNCLASSIFIED, not "small".
   */
  computeClass?: string;
  computeClassClaim?: LifecycleClaim;
  /** Open vocabulary. EMPTY means UNKNOWN, not "no attention mechanism". */
  attentionTags: string[];
  attentionClaim?: LifecycleClaim;
  /** Open vocabulary. EMPTY means UNKNOWN, not "no position encoding". */
  positionEncodingTags: string[];
  positionEncodingClaim?: LifecycleClaim;
  /** Opaque EvidenceGraph-style references. No training evidence store. */
  evidenceRefs: string[];
  /** Always true. Advisory evidence never becomes a routing requirement. */
  advisoryOnly: true;
  provenance: string;
  /** ISO timestamp supplied by the caller. Never generated here. */
  recordedAt: string;
}

export type LifecycleProblem =
  | "profile-id"
  | "version"
  | "model-ref"
  | "stage"
  | "compute-class"
  | "attention-tags"
  | "position-encoding-tags"
  | "claim-source"
  | "orphan-claim"
  | "unattributed-value"
  | "unknown-claim"
  | "evidence-refs"
  | "provenance"
  | "recorded-at";

const PROFILE_ID_RE = /^tclp-[a-z0-9][a-z0-9-]*$/;
const SLUG_RE = /[^a-z0-9]+/g;
const VERSION_RE = /^\d+\.\d+\.\d+$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const LIFECYCLE_PROVENANCE = "p18-training-compute";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isoTimestamp(value: unknown): value is string {
  return typeof value === "string" && ISO_RE.test(value) && !Number.isNaN(Date.parse(value));
}

function tagList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(nonEmpty) && new Set(value).size === value.length;
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Real comparator (never a factory): a factory passed to sort yields NaN. */
function compareProfiles(a: TrainingLifecycleProfile, b: TrainingLifecycleProfile): number {
  return compareStrings(a.profileId, b.profileId) || compareStrings(a.version, b.version);
}

function compareTags(a: string, b: string): number {
  return compareStrings(a, b);
}

/** Deterministic profile id from a slug. */
export function trainingProfileIdFor(slug: string): string {
  const normalized = slug
    .toLowerCase()
    .replace(SLUG_RE, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `tclp-${normalized.length > 0 ? normalized : "profile"}`;
}

function validClaim(claim: LifecycleClaim | undefined): boolean {
  if (claim === undefined) return true;
  if (!CLAIM_SOURCES.includes(claim.source)) return false;
  return claim.evidenceRef === undefined || nonEmpty(claim.evidenceRef);
}

/**
 * Validate a lifecycle profile.
 *
 * The load-bearing rules are the attribution pair: a value requires a claim,
 * and a claim requires a value. That makes an unattributed claim impossible
 * to record, which is the only thing standing between a research note and a
 * fabricated model fact.
 */
export function validateProfile(profile: TrainingLifecycleProfile): LifecycleProblem[] {
  const problems: LifecycleProblem[] = [];
  if (!nonEmpty(profile?.profileId) || !PROFILE_ID_RE.test(profile.profileId)) problems.push("profile-id");
  if (!nonEmpty(profile?.version) || !VERSION_RE.test(profile.version)) problems.push("version");
  if (!nonEmpty(profile?.modelRef)) problems.push("model-ref");
  if (!nonEmpty(profile?.provenance)) problems.push("provenance");
  if (!isoTimestamp(profile?.recordedAt)) problems.push("recorded-at");

  if (profile?.stage !== undefined && !TRAINING_STAGES.includes(profile.stage)) problems.push("stage");
  if (profile?.computeClass !== undefined && !nonEmpty(profile.computeClass)) problems.push("compute-class");
  if (!tagList(profile?.attentionTags)) problems.push("attention-tags");
  if (!tagList(profile?.positionEncodingTags)) problems.push("position-encoding-tags");
  if (!tagList(profile?.evidenceRefs)) problems.push("evidence-refs");

  const claims: Array<[LifecycleClaim | undefined, boolean]> = [
    [profile?.stageClaim, profile?.stage !== undefined],
    [profile?.computeClassClaim, profile?.computeClass !== undefined],
    [profile?.attentionClaim, (profile?.attentionTags?.length ?? 0) > 0],
    [profile?.positionEncodingClaim, (profile?.positionEncodingTags?.length ?? 0) > 0],
  ];
  for (const [claim, hasValue] of claims) {
    if (claim !== undefined && !validClaim(claim)) problems.push("claim-source");
    if (claim === undefined && hasValue) problems.push("unattributed-value");
    if (claim !== undefined && !hasValue) problems.push("orphan-claim");
    // A claim sourced UNKNOWN asserts nothing; recording it is a category error.
    if (claim?.source === "UNKNOWN" && hasValue) problems.push("unknown-claim");
  }

  return [...new Set(problems)].sort() as LifecycleProblem[];
}

function clone(profile: TrainingLifecycleProfile): TrainingLifecycleProfile {
  return JSON.parse(JSON.stringify(profile)) as TrainingLifecycleProfile;
}

function normalize(profile: TrainingLifecycleProfile): TrainingLifecycleProfile {
  return {
    ...profile,
    attentionTags: [...profile.attentionTags].sort(compareTags),
    positionEncodingTags: [...profile.positionEncodingTags].sort(compareTags),
    evidenceRefs: [...profile.evidenceRefs].sort(compareTags),
  };
}

/** Canonical serialization: key-sorted, so insertion order cannot leak. */
export function canonicalProfile(profile: TrainingLifecycleProfile): string {
  const ordered = Object.fromEntries(
    Object.entries(normalize(profile)).sort(([a], [b]) => compareStrings(a, b)),
  );
  return JSON.stringify(ordered);
}

/**
 * Versioned advisory profile registry, following the repository's existing
 * versioned-registry convention (DatasetRegistry / ScorerRegistry): key is
 * `<profileId>@<version>`, version must be strict x.y.z, registration
 * validates and refuses a duplicate key, and every stored record is a deep
 * copy. Read-only queries return deep copies and are deterministically
 * ordered.
 */
export class TrainingLifecycleRegistry {
  private readonly profiles = new Map<string, TrainingLifecycleProfile>();

  private key(profileId: string, version: string): string {
    return `${profileId}@${version}`;
  }

  register(profile: TrainingLifecycleProfile): TrainingLifecycleProfile {
    const normalized = normalize(profile);
    const problems = validateProfile(normalized);
    if (problems.length > 0) {
      throw new Error(`invalid training lifecycle profile ${String(profile?.profileId)}: ${problems.join(",")}`);
    }
    const key = this.key(normalized.profileId, normalized.version);
    if (this.profiles.has(key)) {
      throw new Error(`duplicate training lifecycle profile ${key}`);
    }
    this.profiles.set(key, clone(normalized));
    return clone(normalized);
  }

  lookup(profileId: string, version: string): TrainingLifecycleProfile | null {
    const found = this.profiles.get(this.key(profileId, version));
    return found ? clone(found) : null;
  }

  list(): TrainingLifecycleProfile[] {
    return [...this.profiles.values()].sort(compareProfiles).map(clone);
  }

  /** Advisory signals for a model, newest declared stage first is NOT applied: order is by id. */
  forModel(modelRef: string): TrainingLifecycleProfile[] {
    return this.list().filter((p) => p.modelRef === modelRef);
  }
}

export interface AdvisorySignals {
  modelRef: string;
  /** Absent means the stage was never claimed. UNKNOWN, not a default. */
  stage?: TrainingStage;
  stageSource?: ClaimSource;
  computeClass?: string;
  computeClassSource?: ClaimSource;
  attentionTags: string[];
  positionEncodingTags: string[];
  /** Dimensions with no claim at all. Explicit, so absence is visible. */
  unclaimed: string[];
  /** Always true. This is evidence, not a decision. */
  advisoryOnly: true;
}

/**
 * Collect advisory lifecycle signals for a model.
 *
 * Deliberately NOT called by any routing path. It reports what was claimed
 * and, just as importantly, WHICH dimensions were never claimed — because an
 * absent claim is unknown, and unknown must be visible rather than defaulted.
 */
export function advisorySignals(registry: TrainingLifecycleRegistry, modelRef: string): AdvisorySignals {
  const profiles = registry.forModel(modelRef);
  const unclaimed: string[] = [];
  let stage: TrainingStage | undefined;
  let stageSource: ClaimSource | undefined;
  let computeClass: string | undefined;
  let computeClassSource: ClaimSource | undefined;
  const attentionTags = new Set<string>();
  const positionEncodingTags = new Set<string>();
  for (const profile of profiles) {
    if (profile.stage !== undefined) {
      stage = profile.stage;
      stageSource = profile.stageClaim?.source;
    } else if (stage === undefined) {
      unclaimed.push("stage");
    }
    if (profile.computeClass !== undefined) {
      computeClass = profile.computeClass;
      computeClassSource = profile.computeClassClaim?.source;
    } else if (computeClass === undefined) {
      unclaimed.push("compute_class");
    }
    for (const tag of profile.attentionTags) attentionTags.add(tag);
    if (profile.attentionTags.length === 0 && attentionTags.size === 0) unclaimed.push("attention");
    for (const tag of profile.positionEncodingTags) positionEncodingTags.add(tag);
    if (profile.positionEncodingTags.length === 0 && positionEncodingTags.size === 0) unclaimed.push("position_encoding");
  }
  return {
    modelRef,
    ...(stage === undefined ? {} : { stage, ...(stageSource === undefined ? {} : { stageSource }) }),
    ...(computeClass === undefined ? {} : { computeClass, ...(computeClassSource === undefined ? {} : { computeClassSource }) }),
    attentionTags: [...attentionTags].sort(compareTags),
    positionEncodingTags: [...positionEncodingTags].sort(compareTags),
    unclaimed: [...new Set(unclaimed)].sort(compareTags),
    advisoryOnly: true,
  };
}
