import type { WorkerProfile } from "./profiles";

/**
 * REQ-p20-spine-branch: canonical spine state with branch worker isolates and
 * typed structured-output merge-back.
 *
 * The registered requirement is the scope authority:
 *
 *   "Canonical mutable spine state with branch worker isolates and typed
 *    structured-output merge-back; no naive VM-state merge; branch workers stay
 *    temporary."
 *
 * So this unit has exactly three parts, and the two clauses after the
 * semicolon are constraints on how the third part works:
 *
 *   1. a CANONICAL, MUTABLE spine state,
 *   2. BRANCH WORKER ISOLATES that work without touching it,
 *   3. TYPED STRUCTURED-OUTPUT MERGE-BACK, which is explicitly NOT a naive
 *      VM-state merge.
 *
 * THE NAIVE MERGE IS WHAT THIS REFUSES. Dumping a worker's process or VM state
 * back over the spine would silently overwrite whatever happened on the spine
 * while the branch ran, would carry unserialisable runtime handles, and would
 * make the spine's history unreproducible. So a branch may only hand back a
 * DECLARED, TYPED, STRUCTURED output. Anything else is rejected:
 *
 *   BRANCH OUTPUT != VM STATE
 *   BRANCH OUTPUT != PROCESS MEMORY DUMP
 *   STRUCTURED OUTPUT != NAIVE STATE MERGE
 *   LAST WRITE WINS != MERGE-BACK
 *
 * CONFLICT IS REPORTED, NOT RESOLVED BY OVERWRITING. A branch is opened
 * against a spine revision. If the spine moved on, a merge whose target slice
 * changed underneath it is reported as a conflict with both sides named, and
 * the spine is left alone. MERGE-BACK IS NOT LAST-WRITE-WINS.
 *
 * BRANCH WORKERS STAY TEMPORARY. A branch is an execution, not an identity. It
 * is opened, may produce output once, and is then closed; closing leaves no
 * resident worker, no handle and no standing authority, and the spine keeps
 * only a bounded typed merge record:
 *
 *   BRANCH != WORKER IDENTITY
 *   BRANCH != WORKER PROFILE
 *   CLOSED BRANCH != RESIDENT WORKER
 *   TEMPORARY BRANCH != PERMANENT WORKER
 *
 * The branch records the `WorkerProfile` it was spawned from as a PROFILE
 * reference, and a caller-supplied instance ref for the run. Neither is a
 * permanent identity, and the profile is never copied into the branch.
 *
 * WHAT THIS IS NOT. A merge-back is not task completion, not merge authority,
 * not recovery and not a checkpoint:
 *
 *   MERGE-BACK != TASK COMPLETION
 *   MERGE-BACK != MERGE AUTHORITY / DEPLOY AUTHORITY
 *   MERGE-BACK != RECOVERY
 *   MERGE-BACK != EXECUTION CHECKPOINT
 *
 * `src/workers/collisionPrediction.ts` remains the pre-execution forecast and
 * `src/runners/sync.ts` `applySync` remains the reactive serialization oracle.
 * Neither is reimplemented, wrapped or replaced here; a collision forecast is
 * still a forecast, and this unit merges typed output rather than predicting or
 * serializing files.
 *
 * INPUTS ARE CALLER-SUPPLIED. No clock, no filesystem, no network.
 */

/** The declared, typed slice kinds a branch may write back. */
export const SPINE_SLICE_KINDS = ["NOTES", "ARTIFACT_REFS", "TASK_QUEUE"] as const;
export type SpineSliceKind = (typeof SPINE_SLICE_KINDS)[number];

/** Merge outcomes. There is no OVERWRITE and no SILENT_DROP. */
export const MERGE_OUTCOMES = ["MERGED", "CONFLICT", "REJECTED"] as const;
export type MergeOutcome = (typeof MERGE_OUTCOMES)[number];

export type SpineProblemCode =
  | "SPINE_INVALID_STATE"
  | "SPINE_UNKNOWN_SLICE"
  | "SPINE_DUPLICATE_SLICE"
  | "BRANCH_INVALID_OUTPUT"
  | "BRANCH_UNKNOWN_FIELD"
  | "BRANCH_VM_STATE_REJECTED"
  | "BRANCH_NOT_OPEN"
  | "BRANCH_ALREADY_MERGED"
  | "BRANCH_INSTANCE_REUSED"
  | "MERGE_STALE_BASE"
  | "MERGE_TARGET_CHANGED";

export class SpineError extends Error {
  readonly code: SpineProblemCode;
  constructor(code: SpineProblemCode, message: string) {
    super(message);
    this.name = "SpineError";
    this.code = code;
  }
}

export interface SpineState {
  /** Monotonic. Advances on every accepted mutation, never on a conflict. */
  revision: number;
  /** Per-slice revision, so a conflict can be scoped to what actually moved. */
  sliceRevisions: Record<string, number>;
  slices: Record<string, string[]>;
}

export function emptySpine(): SpineState {
  return { revision: 0, sliceRevisions: {}, slices: {} };
}

export interface BranchOutputWrite {
  slice: SpineSliceKind;
  /** Appended entries. A branch never truncates or rewrites a slice. */
  entries: string[];
}

export interface BranchOutput {
  /** Declared writes. This is the ONLY thing a branch may hand back. */
  writes: BranchOutputWrite[];
  /** Caller-supplied reason for the merge attempt. */
  reason: string;
}

export interface BranchHandle {
  branchId: string;
  /** The profile the branch was spawned from. A reference, never a copy. */
  profileRef: string;
  /** This run only. Not a permanent worker identity. */
  instanceRef: string;
  /** Spine revision the branch was opened against. */
  baseRevision: number;
  /** Slice revisions the branch actually observed when it opened. */
  baseSliceRevisions: Record<string, number>;
  open: true;
}

/** Bounded record the spine keeps. It is not a worker registry. */
export interface MergeRecord {
  branchId: string;
  instanceRef: string;
  profileRef: string;
  baseRevision: number;
  mergedAtRevision: number;
  outcome: MergeOutcome;
  /** Typed reasons, one per rejected or conflicting slice. Never dropped. */
  notes: string[];
}

export interface MergeResult {
  outcome: MergeOutcome;
  spine: SpineState;
  /** Slices this merge actually appended to. */
  appliedSlices: SpineSliceKind[];
  conflicts: Array<{ slice: SpineSliceKind; baseSliceRevision: number; currentSliceRevision: number }>;
  notes: string[];
  record: MergeRecord;
  /** Set only when the output was rejected, naming which rule refused it. */
  rejectionCode?: SpineProblemCode;
}

const SPINE_FIELDS = ["revision", "sliceRevisions", "slices"] as const;
const BRANCH_OUTPUT_FIELDS = ["writes", "reason"] as const;
const WRITE_FIELDS = ["slice", "entries"] as const;

/**
 * Fields that would mean a branch handed back runtime state instead of a typed
 * result. Rejected explicitly, because silently ignoring them would let a naive
 * VM-state merge through the back door.
 */
const VM_STATE_FIELDS = [
  "vmsState",
  "vmState",
  "memory",
  "heap",
  "stack",
  "registers",
  "processState",
  "serializedVm",
  "snapshot",
  "coreDump",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNoVmState(value: Record<string, unknown>, where: string): void {
  for (const key of Object.keys(value)) {
    if (VM_STATE_FIELDS.includes(key)) {
      throw new SpineError(
        "BRANCH_VM_STATE_REJECTED",
        `${where} carries ${key}: a branch returns typed structured output, never VM or process state`,
      );
    }
  }
}

function assertSpineShape(spine: SpineState): void {
  if (!isPlainObject(spine)) {
    throw new SpineError("SPINE_INVALID_STATE", "spine must be an object");
  }
  for (const key of Object.keys(spine)) {
    if (!(SPINE_FIELDS as readonly string[]).includes(key)) {
      throw new SpineError("SPINE_INVALID_STATE", `unknown spine field ${key}`);
    }
  }
  if (!Number.isInteger(spine.revision) || spine.revision < 0) {
    throw new SpineError("SPINE_INVALID_STATE", "spine revision must be a non-negative integer");
  }
  if (!isPlainObject(spine.slices) || !isPlainObject(spine.sliceRevisions)) {
    throw new SpineError("SPINE_INVALID_STATE", "spine slices and sliceRevisions must be objects");
  }
  for (const [slice, entries] of Object.entries(spine.slices)) {
    if (!SPINE_SLICE_KINDS.includes(slice as SpineSliceKind)) {
      throw new SpineError("SPINE_UNKNOWN_SLICE", `unknown spine slice ${slice}`);
    }
    if (!Array.isArray(entries) || entries.some((entry) => typeof entry !== "string")) {
      throw new SpineError("SPINE_INVALID_STATE", `spine slice ${slice} must be an array of strings`);
    }
  }
}

/**
 * Open a branch isolate against the current spine revision.
 *
 * The branch does not receive the spine. It receives a revision to merge
 * against, so it can be told its view is stale instead of quietly overwriting.
 */
export function openBranch(input: {
  spine: SpineState;
  branchId: string;
  profile: WorkerProfile;
  instanceRef: string;
}): BranchHandle {
  const { spine, branchId, profile, instanceRef } = input;
  assertSpineShape(spine);
  if (typeof branchId !== "string" || branchId.length === 0) {
    throw new SpineError("SPINE_INVALID_STATE", "branchId must be a non-empty string");
  }
  if (typeof instanceRef !== "string" || instanceRef.length === 0) {
    throw new SpineError("SPINE_INVALID_STATE", "instanceRef must be a non-empty string");
  }
  if (!isPlainObject(profile) || typeof profile.id !== "string") {
    throw new SpineError("SPINE_INVALID_STATE", "a branch must name the WorkerProfile it was spawned from");
  }
  return {
    branchId,
    // The profile is referenced by id, never copied into the branch.
    profileRef: profile.id,
    instanceRef,
    baseRevision: spine.revision,
    baseSliceRevisions: { ...spine.sliceRevisions },
    open: true,
  };
}

/**
 * Validate a branch's structured output.
 *
 * Unknown keys are rejected rather than discarded: a silently dropped field is
 * a silently changed meaning, and that is exactly how a naive merge sneaks in.
 */
export function assertBranchOutput(value: unknown): BranchOutput {
  if (!isPlainObject(value)) {
    throw new SpineError("BRANCH_INVALID_OUTPUT", "branch output must be an object");
  }
  assertNoVmState(value, "branch output");
  for (const key of Object.keys(value)) {
    if (!(BRANCH_OUTPUT_FIELDS as readonly string[]).includes(key)) {
      throw new SpineError("BRANCH_UNKNOWN_FIELD", `unknown branch output field ${key}`);
    }
  }
  if (!Array.isArray(value.writes)) {
    throw new SpineError("BRANCH_INVALID_OUTPUT", "branch output writes must be an array");
  }
  if (typeof value.reason !== "string" || value.reason.length === 0) {
    throw new SpineError("BRANCH_INVALID_OUTPUT", "branch output requires a non-empty reason");
  }
  const writes: BranchOutputWrite[] = value.writes.map((entry) => {
    if (!isPlainObject(entry)) {
      throw new SpineError("BRANCH_INVALID_OUTPUT", "each write must be an object");
    }
    assertNoVmState(entry, "branch write");
    for (const key of Object.keys(entry)) {
      if (!(WRITE_FIELDS as readonly string[]).includes(key)) {
        throw new SpineError("BRANCH_UNKNOWN_FIELD", `unknown branch write field ${key}`);
      }
    }
    if (!SPINE_SLICE_KINDS.includes(entry.slice as SpineSliceKind)) {
      throw new SpineError("SPINE_UNKNOWN_SLICE", `branch wrote unknown slice ${String(entry.slice)}`);
    }
    if (!Array.isArray(entry.entries) || entry.entries.some((item) => typeof item !== "string")) {
      throw new SpineError("BRANCH_INVALID_OUTPUT", "branch write entries must be an array of strings");
    }
    return { slice: entry.slice as SpineSliceKind, entries: entry.entries as string[] };
  });
  return { writes, reason: value.reason };
}

function cloneSpine(spine: SpineState): SpineState {
  return {
    revision: spine.revision,
    sliceRevisions: { ...spine.sliceRevisions },
    slices: Object.fromEntries(Object.entries(spine.slices).map(([slice, entries]) => [slice, [...entries]])),
  };
}

export interface MergeInput {
  spine: SpineState;
  handle: BranchHandle;
  output: unknown;
  /** Caller-supplied merge time. No clock is read here. */
  mergedAt: string;
  /** Branch ids already merged against this spine, to refuse a second merge. */
  alreadyMerged?: string[];
}

/**
 * Merge a branch's typed output back into the spine.
 *
 * A conflict leaves the spine byte-for-byte unchanged, revision included. The
 * caller decides what a conflict means; this function never picks a winner.
 */
export function mergeBranch(input: MergeInput): MergeResult {
  const { spine, handle, mergedAt, alreadyMerged = [] } = input;
  assertSpineShape(spine);
  if (!isPlainObject(handle) || handle.open !== true) {
    throw new SpineError("BRANCH_NOT_OPEN", "only an open branch can be merged back");
  }
  if (alreadyMerged.includes(handle.branchId)) {
    throw new SpineError("BRANCH_ALREADY_MERGED", `branch ${handle.branchId} was already merged`);
  }
  if (typeof mergedAt !== "string" || mergedAt.length === 0) {
    throw new SpineError("SPINE_INVALID_STATE", "mergedAt must be supplied by the caller");
  }

  let output: BranchOutput;
  try {
    output = assertBranchOutput(input.output);
  } catch (error) {
    const code: SpineProblemCode = error instanceof SpineError ? error.code : "BRANCH_INVALID_OUTPUT";
    const message = error instanceof Error ? error.message : String(error);
    return {
      outcome: "REJECTED",
      spine: cloneSpine(spine),
      appliedSlices: [],
      conflicts: [],
      notes: [message],
      rejectionCode: code,
      record: {
        branchId: handle.branchId,
        instanceRef: handle.instanceRef,
        profileRef: handle.profileRef,
        baseRevision: handle.baseRevision,
        mergedAtRevision: spine.revision,
        outcome: "REJECTED",
        notes: [message],
      },
    };
  }

  // A branch that writes nothing is a no-op, not a silent success with a bump.
  if (output.writes.length === 0) {
    const notes = ["branch produced no typed writes; spine unchanged"];
    return {
      outcome: "MERGED",
      spine: cloneSpine(spine),
      appliedSlices: [],
      conflicts: [],
      notes,
      record: {
        branchId: handle.branchId,
        instanceRef: handle.instanceRef,
        profileRef: handle.profileRef,
        baseRevision: handle.baseRevision,
        mergedAtRevision: spine.revision,
        outcome: "MERGED",
        notes,
      },
    };
  }

  // Whole-branch staleness: the spine moved at all since the branch opened.
  if (handle.baseRevision !== spine.revision) {
    const notes = [
      `branch ${handle.branchId} opened at spine revision ${handle.baseRevision} but the spine is at ${spine.revision}`,
    ];
    return {
      outcome: "CONFLICT",
      spine: cloneSpine(spine),
      appliedSlices: [],
      conflicts: [],
      notes,
      record: {
        branchId: handle.branchId,
        instanceRef: handle.instanceRef,
        profileRef: handle.profileRef,
        baseRevision: handle.baseRevision,
        mergedAtRevision: spine.revision,
        outcome: "CONFLICT",
        notes,
      },
    };
  }

  const conflicts: MergeResult["conflicts"] = [];
  const notes: string[] = [];
  // Canonical slice order, so scrambled input yields an identical result.
  // INSERTION ORDER != CANONICAL ORDER.
  const orderedWrites = [...output.writes].sort((a, b) => (a.slice < b.slice ? -1 : a.slice > b.slice ? 1 : 0));
  for (const write of orderedWrites) {
    const baseSliceRevision = handle.baseSliceRevisions[write.slice] ?? 0;
    const currentSliceRevision = spine.sliceRevisions[write.slice] ?? 0;
    if (baseSliceRevision !== currentSliceRevision) {
      conflicts.push({ slice: write.slice, baseSliceRevision, currentSliceRevision });
    }
  }
  if (conflicts.length > 0) {
    for (const conflict of conflicts) {
      notes.push(
        `slice ${conflict.slice} changed under this branch (base ${conflict.baseSliceRevision}, current ${conflict.currentSliceRevision})`,
      );
    }
    return {
      outcome: "CONFLICT",
      spine: cloneSpine(spine),
      appliedSlices: [],
      conflicts,
      notes,
      record: {
        branchId: handle.branchId,
        instanceRef: handle.instanceRef,
        profileRef: handle.profileRef,
        baseRevision: handle.baseRevision,
        mergedAtRevision: spine.revision,
        outcome: "CONFLICT",
        notes,
      },
    };
  }

  const next = cloneSpine(spine);
  const appliedSlices: SpineSliceKind[] = [];
  for (const write of orderedWrites) {
    if (write.entries.length === 0) continue;
    const existing = next.slices[write.slice] ?? [];
    // A branch APPENDS. It never truncates and never rewrites a slice, so a
    // branch cannot delete spine history by omission.
    next.slices[write.slice] = [...existing, ...write.entries];
    next.sliceRevisions[write.slice] = (next.sliceRevisions[write.slice] ?? 0) + 1;
    appliedSlices.push(write.slice);
  }
  if (appliedSlices.length === 0) {
    const noopNotes = ["every typed write was empty; spine unchanged"];
    return {
      outcome: "MERGED",
      spine: cloneSpine(spine),
      appliedSlices: [],
      conflicts: [],
      notes: noopNotes,
      record: {
        branchId: handle.branchId,
        instanceRef: handle.instanceRef,
        profileRef: handle.profileRef,
        baseRevision: handle.baseRevision,
        mergedAtRevision: spine.revision,
        outcome: "MERGED",
        notes: noopNotes,
      },
    };
  }

  next.revision = spine.revision + 1;
  notes.push(`merged ${appliedSlices.length} slice(s) at spine revision ${next.revision}`);

  return {
    outcome: "MERGED",
    spine: next,
    appliedSlices,
    conflicts: [],
    notes,
    record: {
      branchId: handle.branchId,
      instanceRef: handle.instanceRef,
      profileRef: handle.profileRef,
      baseRevision: handle.baseRevision,
      mergedAtRevision: next.revision,
      outcome: "MERGED",
      notes,
    },
  };
}

/**
 * Close a branch. This is what keeps branch workers TEMPORARY.
 *
 * Closing returns no resident worker, no handle and no authority. The spine
 * keeps only the bounded typed merge record; nothing here is a permanent
 * worker identity or a standing grant.
 */
export function closeBranch(handle: BranchHandle): { branchId: string; instanceRef: string; residentWorker: false; authority: "NONE" } {
  if (!isPlainObject(handle) || typeof handle.branchId !== "string") {
    throw new SpineError("BRANCH_NOT_OPEN", "cannot close a branch that was never opened");
  }
  return {
    branchId: handle.branchId,
    instanceRef: handle.instanceRef,
    residentWorker: false,
    authority: "NONE",
  };
}
