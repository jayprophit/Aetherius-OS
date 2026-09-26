import { assertSafePath } from "../runners/sync";
import { sha256Hex } from "../state/store";
import type { OwnedStore } from "../state/store";
import type { StateEnvelope } from "../state/types";

/**
 * REQ-p20-execution-checkpoints: typed execution checkpoint envelope.
 *
 * The registered requirement is the scope authority:
 *
 *   "Typed checkpoint envelope (task/workflow/workspace-hash/branch/artifacts/
 *    worker/backend/pending-irreversible/evidence) over P17 envelopes;
 *    fragments tested, join missing."
 *
 * So this unit is a TYPED ENVELOPE plus the JOIN that was missing. The
 * per-system fragments already exist and are already tested: workflow
 * lifecycle, runner records, steward reports and cohort reviews each persist
 * their own typed `StateEnvelope`. What did not exist was a single typed
 * record that joins those fragment references into one bounded, restart-safe
 * description of an execution. That join is what this module adds:
 *
 *   PER-SYSTEM FRAGMENT != EXECUTION CHECKPOINT
 *   JOIN EXISTS         != RECOVERY PROVEN
 *   SERIALIZES          != RESUMES
 *
 * The envelope is carried in a P17 `StateEnvelope` (kind
 * "execution.checkpoint"), so it inherits P17's integrity hash, record
 * version, sensitivity and provenance discipline rather than inventing a
 * second persistence discipline.
 *
 * WHAT THIS IS NOT. A checkpoint preserves enough bounded execution state
 * for an authorized execution to *potentially* continue. It is not:
 *
 *   CHECKPOINT        != RECOVERY PROOF
 *   CHECKPOINT        != RESUME AUTHORIZATION
 *   CHECKPOINT        != TASK COMPLETION
 *   CHECKPOINT        != PROJECT / GENESIS MEMORY
 *   CHECKPOINT        != ARTIFACT LIBRARY
 *   CHECKPOINT        != EXECUTION TARGET PROFILE / PLACEMENT DECISION
 *   CHECKPOINT        != LEASE / HEARTBEAT / LIVENESS
 *   WORKER PROFILE    != WORKER INSTANCE
 *   CHECKPOINT ID     != TASK ID != WORKER ID
 *
 * No resume, restart or recovery execution lives here. This module writes
 * and reads a record and reports replay risk; it never continues work.
 */

/** Envelope kind used for every persisted execution checkpoint. */
export const CHECKPOINT_KIND = "execution.checkpoint";

/** Bump when the checkpoint payload shape changes incompatibly. */
export const CHECKPOINT_SCHEMA_VERSION = 1;

/**
 * Completion state of an action whose external effect cannot be undone by
 * re-running it (payment sent, email sent, file uploaded, external mutation).
 *
 * `CLAIMED_UNVERIFIED` is the honest state whenever an action may have taken
 * effect but no external verification exists. It must never be rounded down to
 * "not done" and never rounded up to "done".
 */
export type IrreversibleActionState =
  | "NOT_STARTED"
  | "CLAIMED_UNVERIFIED"
  | "VERIFIED_COMPLETE";

export interface IrreversibleActionRef {
  /** Id of the action within the task, not a checkpoint or worker id. */
  actionId: string;
  state: IrreversibleActionState;
  /**
   * Ref to external verification evidence. Absent means unknown, never
   * assumed good: a checkpoint claim is not world state.
   */
  verificationRef?: string;
}

/** Workspace is referenced and hashed, never copied. */
export interface WorkspaceRef {
  /** Repo-relative, traversal-free. */
  root: string;
  /** Hex sha256 the executor observed for the working tree at capture time. */
  hash: string;
  /** VCS ref name, e.g. "main". Recorded, never resolved or acted on here. */
  branch: string;
}

export interface CheckpointArtifactRef {
  artifactId: string;
  /** Pointer to the stored artifact, never the artifact bytes. */
  ref: string;
}

export interface WorkerFragmentRef {
  /** This specific running worker. */
  instanceId: string;
  /** The profile it was started from. A profile is not an instance. */
  profileId: string;
}

export interface BackendFragmentRef {
  backendId: string;
  /**
   * Target instance the backend actually ran on, when the architecture
   * exposes one. Recorded as a reference only: P30 owns placement, and a
   * target ref is not a placement decision.
   */
  targetInstanceId?: string;
}

/**
 * The joined checkpoint payload. Every field is a reference or a bounded
 * scalar: no logs, no workspace contents, no credentials, no process handles,
 * no model internals, no autobiographical memory.
 */
export interface ExecutionCheckpointPayload {
  /** Distinct identity for the checkpoint itself. */
  checkpointId: string;
  /** The task this checkpoint describes. Not the checkpoint id. */
  taskId: string;
  /** The workflow the task is moving through. */
  workflowId: string;
  workspace: WorkspaceRef;
  artifacts: CheckpointArtifactRef[];
  worker: WorkerFragmentRef;
  backend: BackendFragmentRef;
  /**
   * Irreversible actions that are not verified complete. This is what stops a
   * future resume from blindly replaying an external effect.
   */
  pendingIrreversible: IrreversibleActionRef[];
  /** Refs into the existing EvidenceGraph. Not a second evidence graph. */
  evidenceRefs: string[];
  /**
   * Sequence of this checkpoint within the task. Ordering is explicit so a
   * later checkpoint cannot silently displace an earlier one.
   */
  sequence: number;
  /** Previous checkpoint for the same task, when one exists. */
  predecessorCheckpointId?: string;
  /** Caller-supplied capture time. Defaults are never invented here. */
  capturedAt: string;
  /** How this record came to exist, e.g. "workflow:checkpoint-capture". */
  provenance: string;
}

/** The per-system fragments the join consumes. */
export interface ExecutionFragments {
  taskId: string;
  workflowId: string;
  workspace: WorkspaceRef;
  artifacts: CheckpointArtifactRef[];
  worker: WorkerFragmentRef;
  backend: BackendFragmentRef;
  pendingIrreversible: IrreversibleActionRef[];
  evidenceRefs: string[];
  provenance: string;
}

export type CheckpointValidationCode =
  | "CHECKPOINT_SHAPE_INVALID"
  | "CHECKPOINT_UNKNOWN_FIELD"
  | "CHECKPOINT_AUTHORITY_CLAIM_REJECTED"
  | "CHECKPOINT_SECRET_VALUE_REJECTED"
  | "CHECKPOINT_UNSAFE_PATH"
  | "CHECKPOINT_MALFORMED_ID"
  | "CHECKPOINT_MALFORMED_HASH"
  | "CHECKPOINT_MALFORMED_SEQUENCE"
  | "CHECKPOINT_MALFORMED_TIMESTAMP"
  | "CHECKPOINT_DUPLICATE_ENTRY"
  | "CHECKPOINT_CONFLICT"
  | "CHECKPOINT_UNSUPPORTED_SCHEMA";

export class CheckpointError extends Error {
  readonly code: CheckpointValidationCode;
  constructor(code: CheckpointValidationCode, message: string) {
    super(message);
    this.name = "CheckpointError";
    this.code = code;
  }
}

const ID_GRAMMAR = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const HEX256 = /^[0-9a-f]{64}$/;
const ISO_8601 =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/;

/**
 * A well-formed pattern is not a real instant. `2026-13-45T99:99:99Z` matches
 * the ISO shape but names no moment, so the components are checked against the
 * calendar and the value must survive a real parse.
 */
function isRealInstant(value: string): boolean {
  const match = ISO_8601.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = match;
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12) return false;
  if (dayNumber < 1 || dayNumber > 31) return false;
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 60) return false;
  if (offsetHour !== undefined && (Number(offsetHour) > 23 || Number(offsetMinute) > 59)) return false;
  if (dayNumber > daysInMonth(Number(year), monthNumber)) return false;
  return Number.isFinite(Date.parse(value));
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const BRANCH_GRAMMAR = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/** A record that grants authority has no business inside a checkpoint. */
const BANNED_AUTHORITY_FIELDS = [
  "authorized",
  "canExecute",
  "policyBypass",
  "ownerOverride",
  "merge_authority",
  "resumeAuthorized",
  "approval",
];

/** A secret VALUE has no business inside a checkpoint; a ref does. */
const BANNED_SECRET_FIELDS = [
  "password",
  "apiKey",
  "token",
  "privateKey",
  "secret",
  "credential",
  "credentials",
];

const PAYLOAD_FIELDS: ReadonlyArray<keyof ExecutionCheckpointPayload> = [
  "checkpointId",
  "taskId",
  "workflowId",
  "workspace",
  "artifacts",
  "worker",
  "backend",
  "pendingIrreversible",
  "evidenceRefs",
  "sequence",
  "predecessorCheckpointId",
  "capturedAt",
  "provenance",
];

const REQUIRED_PAYLOAD_FIELDS: ReadonlyArray<keyof ExecutionCheckpointPayload> = [
  "checkpointId",
  "taskId",
  "workflowId",
  "workspace",
  "artifacts",
  "worker",
  "backend",
  "pendingIrreversible",
  "evidenceRefs",
  "sequence",
  "capturedAt",
  "provenance",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertId(value: unknown, field: string): string {
  if (typeof value !== "string" || !ID_GRAMMAR.test(value)) {
    throw new CheckpointError("CHECKPOINT_MALFORMED_ID", `${field} is not a valid checkpoint identifier`);
  }
  return value;
}

function assertNoBannedFields(value: Record<string, unknown>, where: string): void {
  for (const key of Object.keys(value)) {
    if (BANNED_AUTHORITY_FIELDS.includes(key)) {
      throw new CheckpointError(
        "CHECKPOINT_AUTHORITY_CLAIM_REJECTED",
        `${where} must not embed authority field ${key}; reference an external authorization decision instead`,
      );
    }
    if (BANNED_SECRET_FIELDS.includes(key)) {
      throw new CheckpointError(
        "CHECKPOINT_SECRET_VALUE_REJECTED",
        `${where} must not embed secret field ${key}; store a reference only`,
      );
    }
  }
}

/**
 * Strict validation. Unknown keys are rejected rather than discarded: silently
 * dropping a field that could change meaning is silent repair of invalid input.
 */
export function assertCheckpointShape(value: unknown): ExecutionCheckpointPayload {
  if (!isPlainObject(value)) {
    throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "checkpoint payload must be an object");
  }
  const payload = value as Record<string, unknown>;

  // Banned-field detection outranks the unknown-field check: an authority claim
  // or a raw secret is a rejection in its own right, not merely an extra key.
  assertNoBannedFields(payload, "checkpoint payload");
  for (const key of Object.keys(payload)) {
    if (!(PAYLOAD_FIELDS as readonly string[]).includes(key)) {
      throw new CheckpointError("CHECKPOINT_UNKNOWN_FIELD", `unknown checkpoint field ${key}`);
    }
  }
  for (const key of REQUIRED_PAYLOAD_FIELDS) {
    if (payload[key] === undefined) {
      throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", `checkpoint field ${key} is required`);
    }
  }
  assertId(payload.checkpointId, "checkpointId");  assertId(payload.taskId, "taskId");
  assertId(payload.workflowId, "workflowId");

  if (payload.checkpointId === payload.taskId) {
    throw new CheckpointError(
      "CHECKPOINT_MALFORMED_ID",
      "checkpointId must be distinct from taskId: CHECKPOINT ID != TASK ID",
    );
  }
  if (payload.taskId === payload.workflowId) {
    throw new CheckpointError(
      "CHECKPOINT_MALFORMED_ID",
      "taskId must be distinct from workflowId: a task runs through a workflow",
    );
  }

  const sequence = payload.sequence;
  if (typeof sequence !== "number" || !Number.isInteger(sequence) || sequence < 1) {
    throw new CheckpointError(
      "CHECKPOINT_MALFORMED_SEQUENCE",
      "sequence must be a positive integer so checkpoint ordering stays explicit",
    );
  }

  const capturedAt = payload.capturedAt;
  if (typeof capturedAt !== "string" || !isRealInstant(capturedAt)) {
    throw new CheckpointError(
      "CHECKPOINT_MALFORMED_TIMESTAMP",
      "capturedAt must be a caller-supplied ISO-8601 timestamp; defaults are not invented",
    );
  }

  if (payload.provenance !== undefined && (typeof payload.provenance !== "string" || payload.provenance.length === 0)) {
    throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "provenance must be a non-empty string");
  }
  if (payload.predecessorCheckpointId !== undefined) {
    const predecessor = assertId(payload.predecessorCheckpointId, "predecessorCheckpointId");
    if (predecessor === payload.checkpointId) {
      throw new CheckpointError(
        "CHECKPOINT_MALFORMED_ID",
        "predecessorCheckpointId must not be the checkpoint itself",
      );
    }
  }

  assertWorkspace(payload.workspace);
  assertWorker(payload.worker);
  assertBackend(payload.backend);
  const artifacts = assertArtifacts(payload.artifacts);
  const pending = assertPendingIrreversible(payload.pendingIrreversible);
  const evidenceRefs = assertRefList(payload.evidenceRefs, "evidenceRefs");

  for (const list of [artifacts, evidenceRefs]) {
    const seen = new Set<string>();
    for (const entry of list) {
      const key = (entry as { artifactId?: string; ref?: string }).artifactId ?? (entry as string);
      if (seen.has(key)) {
        throw new CheckpointError("CHECKPOINT_DUPLICATE_ENTRY", `duplicate checkpoint entry ${key}`);
      }
      seen.add(key);
    }
  }

  return {
    checkpointId: payload.checkpointId as string,
    taskId: payload.taskId as string,
    workflowId: payload.workflowId as string,
    workspace: payload.workspace as WorkspaceRef,
    artifacts,
    worker: payload.worker as WorkerFragmentRef,
    backend: payload.backend as BackendFragmentRef,
    pendingIrreversible: pending,
    evidenceRefs,
    sequence,
    predecessorCheckpointId: payload.predecessorCheckpointId as string | undefined,
    capturedAt: capturedAt as string,
    provenance: payload.provenance as string,
  };
}

function assertWorkspace(value: unknown): void {
  if (!isPlainObject(value)) {
    throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "workspace must be an object");
  }
  const workspace = value as Record<string, unknown>;
  assertNoBannedFields(workspace, "workspace");
  for (const key of Object.keys(workspace)) {
    if (!["root", "hash", "branch"].includes(key)) {
      throw new CheckpointError("CHECKPOINT_UNKNOWN_FIELD", `unknown workspace field ${key}`);
    }
  }
  if (typeof workspace.root !== "string") {
    throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "workspace.root must be a string");
  }
  try {
    assertSafePath(workspace.root);
  } catch {
    throw new CheckpointError("CHECKPOINT_UNSAFE_PATH", `workspace.root ${workspace.root} is not a safe path`);
  }
  if (typeof workspace.hash !== "string" || !HEX256.test(workspace.hash)) {
    throw new CheckpointError("CHECKPOINT_MALFORMED_HASH", "workspace.hash must be a hex sha256 of the working tree");
  }
  if (typeof workspace.branch !== "string" || !BRANCH_GRAMMAR.test(workspace.branch)) {
    throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "workspace.branch must be a ref name");
  }
}

function assertWorker(value: unknown): void {
  if (!isPlainObject(value)) {
    throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "worker must be an object");
  }
  const worker = value as Record<string, unknown>;
  assertNoBannedFields(worker, "worker");
  for (const key of Object.keys(worker)) {
    if (!["instanceId", "profileId"].includes(key)) {
      throw new CheckpointError("CHECKPOINT_UNKNOWN_FIELD", `unknown worker field ${key}`);
    }
  }
  assertId(worker.instanceId, "worker.instanceId");
  assertId(worker.profileId, "worker.profileId");
}

function assertBackend(value: unknown): void {
  if (!isPlainObject(value)) {
    throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "backend must be an object");
  }
  const backend = value as Record<string, unknown>;
  assertNoBannedFields(backend, "backend");
  for (const key of Object.keys(backend)) {
    if (!["backendId", "targetInstanceId"].includes(key)) {
      throw new CheckpointError("CHECKPOINT_UNKNOWN_FIELD", `unknown backend field ${key}`);
    }
  }
  assertId(backend.backendId, "backend.backendId");
  if (backend.targetInstanceId !== undefined) {
    assertId(backend.targetInstanceId, "backend.targetInstanceId");
  }
}

function assertArtifacts(value: unknown): CheckpointArtifactRef[] {
  if (!Array.isArray(value)) {
    throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "artifacts must be an array of references");
  }
  const seen = new Set<string>();
  return value.map((entry) => {
    if (!isPlainObject(entry)) {
      throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "artifact entry must be an object");
    }
    assertNoBannedFields(entry, "artifact entry");
    for (const key of Object.keys(entry)) {
      if (!["artifactId", "ref"].includes(key)) {
        throw new CheckpointError("CHECKPOINT_UNKNOWN_FIELD", `unknown artifact field ${key}`);
      }
    }
    assertNoBannedFields(entry, "artifact entry");
    const artifactId = assertId(entry.artifactId, "artifact.artifactId");    if (typeof entry.ref !== "string" || entry.ref.length === 0) {
      throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "artifact.ref must be a non-empty pointer");
    }
    if (seen.has(artifactId)) {
      throw new CheckpointError("CHECKPOINT_DUPLICATE_ENTRY", `duplicate artifact ref ${artifactId}`);
    }
    seen.add(artifactId);
    return { artifactId, ref: entry.ref };
  });
}

function assertPendingIrreversible(value: unknown): IrreversibleActionRef[] {
  if (!Array.isArray(value)) {
    throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "pendingIrreversible must be an array");
  }
  const seen = new Set<string>();
  return value.map((entry) => {
    if (!isPlainObject(entry)) {
      throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", "irreversible action entry must be an object");
    }
    for (const key of Object.keys(entry)) {
      if (!["actionId", "state", "verificationRef"].includes(key)) {
        throw new CheckpointError("CHECKPOINT_UNKNOWN_FIELD", `unknown irreversible action field ${key}`);
      }
    }
    assertNoBannedFields(entry, "irreversible action entry");
    const actionId = assertId(entry.actionId, "action.actionId");
    if (!["NOT_STARTED", "CLAIMED_UNVERIFIED", "VERIFIED_COMPLETE"].includes(entry.state as string)) {
      throw new CheckpointError(
        "CHECKPOINT_SHAPE_INVALID",
        `unknown irreversible action state ${String(entry.state)}`,
      );
    }
    if (entry.state === "VERIFIED_COMPLETE" && typeof entry.verificationRef !== "string") {
      throw new CheckpointError(
        "CHECKPOINT_SHAPE_INVALID",
        "VERIFIED_COMPLETE requires a verificationRef: a checkpoint claim is not world state",
      );
    }
    if (seen.has(actionId)) {
      throw new CheckpointError("CHECKPOINT_DUPLICATE_ENTRY", `duplicate irreversible action ${actionId}`);
    }
    seen.add(actionId);
    return {
      actionId,
      state: entry.state as IrreversibleActionState,
      verificationRef: entry.verificationRef as string | undefined,
    };
  });
}

function assertRefList(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", `${field} must be an array of references`);
  }
  return value.map((entry) => {
    if (typeof entry !== "string" || entry.length === 0) {
      throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", `${field} entries must be non-empty strings`);
    }
    return entry;
  });
}

/**
 * Canonical ordering. Insertion order is not canonical order: two checkpoints
 * holding the same facts must serialize identically so the P17 integrity hash
 * means something and identical writes are recognisably identical.
 */
export function canonicalizeCheckpoint(payload: ExecutionCheckpointPayload): ExecutionCheckpointPayload {
  const byArtifactId = (a: CheckpointArtifactRef, b: CheckpointArtifactRef): number =>
    a.artifactId < b.artifactId ? -1 : a.artifactId > b.artifactId ? 1 : 0;
  const byActionId = (a: IrreversibleActionRef, b: IrreversibleActionRef): number =>
    a.actionId < b.actionId ? -1 : a.actionId > b.actionId ? 1 : 0;
  return {
    ...payload,
    artifacts: [...payload.artifacts].sort(byArtifactId),
    evidenceRefs: [...payload.evidenceRefs].sort(),
    pendingIrreversible: [...payload.pendingIrreversible].sort(byActionId),
  };
}

export interface ComposeOptions {
  checkpointId: string;
  sequence: number;
  capturedAt: string;
  predecessorCheckpointId?: string;
}

/**
 * THE MISSING JOIN. Takes the already-persisted per-system fragments and
 * produces one bounded, deterministically ordered checkpoint payload.
 *
 * The join only REFERENCES fragment data. It does not re-read, re-derive or
 * re-validate any fragment's own semantics, and it does not authorize
 * anything.
 */
export function composeExecutionCheckpoint(
  fragments: ExecutionFragments,
  options: ComposeOptions,
): ExecutionCheckpointPayload {
  return canonicalizeCheckpoint(
    assertCheckpointShape({
      checkpointId: options.checkpointId,
      taskId: fragments.taskId,
      workflowId: fragments.workflowId,
      workspace: fragments.workspace,
      artifacts: fragments.artifacts,
      worker: fragments.worker,
      backend: fragments.backend,
      pendingIrreversible: fragments.pendingIrreversible,
      evidenceRefs: fragments.evidenceRefs,
      sequence: options.sequence,
      predecessorCheckpointId: options.predecessorCheckpointId,
      capturedAt: options.capturedAt,
      provenance: fragments.provenance,
    }),
  );
}

/** Digest of the canonical payload; equal digests mean equal content. */
export function checkpointContentDigest(payload: ExecutionCheckpointPayload): string {
  return sha256Hex(JSON.stringify(canonicalizeCheckpoint(assertCheckpointShape(payload))));
}

export interface PersistOptions {
  /** Caller-supplied capture time. No wall clock is read here. */
  now: string;
  /** Optimistic concurrency: refuse to displace a newer record. */
  expectedRecordVersion?: number;
}

/**
 * Write the joined checkpoint into a P17 owned-state store, inheriting P17's
 * integrity hash, record version and provenance discipline.
 *
 * IDEMPOTENCE. Re-capturing identical content at the same sequence is a
 * no-op, not a second record. The same identity and sequence with DIFFERENT
 * content is a conflict and is rejected: a checkpoint slot is not a mutable
 * cell that silently accepts the newest claim.
 *
 * This persists a record and nothing else. It performs no resume.
 */
export function persistExecutionCheckpoint(
  store: OwnedStore,
  payload: ExecutionCheckpointPayload,
  options: PersistOptions,
): StateEnvelope<ExecutionCheckpointPayload> {
  const canonical = canonicalizeCheckpoint(assertCheckpointShape(payload));
  if (typeof options.now !== "string" || !isRealInstant(options.now)) {
    throw new CheckpointError(
      "CHECKPOINT_MALFORMED_TIMESTAMP",
      "now must be a caller-supplied ISO-8601 timestamp; defaults are not invented",
    );
  }
  if (store.exists(canonical.checkpointId)) {
    const existing = store.load<ExecutionCheckpointPayload>(canonical.checkpointId);
    if (existing.kind !== CHECKPOINT_KIND) {
      throw new CheckpointError(
        "CHECKPOINT_CONFLICT",
        `id ${canonical.checkpointId} already holds a ${existing.kind} record`,
      );
    }
    if (existing.payload.sequence === canonical.sequence) {
      if (checkpointContentDigest(existing.payload) !== checkpointContentDigest(canonical)) {
        throw new CheckpointError(
          "CHECKPOINT_CONFLICT",
          `checkpoint ${canonical.checkpointId} sequence ${canonical.sequence} already recorded with different content`,
        );
      }
      return existing;
    }
    if (existing.payload.sequence > canonical.sequence) {
      throw new CheckpointError(
        "CHECKPOINT_CONFLICT",
        `checkpoint ${canonical.checkpointId} sequence ${canonical.sequence} is older than stored ${existing.payload.sequence}`,
      );
    }
  }

  return store.save<ExecutionCheckpointPayload>(
    {
      id: canonical.checkpointId,
      kind: CHECKPOINT_KIND,
      schemaVersion: CHECKPOINT_SCHEMA_VERSION,
      recordVersion: store.exists(canonical.checkpointId)
        ? store.load<ExecutionCheckpointPayload>(canonical.checkpointId).recordVersion + 1
        : 1,
      createdAt: options.now,
      updatedAt: options.now,
      owner: canonical.taskId,
      provenance: canonical.provenance,
      sensitivity: "SYSTEM",
      integrity: sha256Hex(JSON.stringify(canonical)),
      payload: canonical,
    },
    { expectedRecordVersion: options.expectedRecordVersion, causedBy: { actor: "execution-checkpoint", source: canonical.provenance }, now: () => options.now },
  );
}

/** Read a stored checkpoint back, enforcing the schema version. */
export function readExecutionCheckpoint<T extends { payload: unknown }>(
  envelope: StateEnvelope<ExecutionCheckpointPayload>,
  supportedSchemaVersion: number = CHECKPOINT_SCHEMA_VERSION,
): ExecutionCheckpointPayload {
  if (envelope.kind !== CHECKPOINT_KIND) {
    throw new CheckpointError("CHECKPOINT_SHAPE_INVALID", `record kind ${envelope.kind} is not a checkpoint`);
  }
  if (envelope.schemaVersion > supportedSchemaVersion) {
    throw new CheckpointError(
      "CHECKPOINT_UNSUPPORTED_SCHEMA",
      `checkpoint schema ${envelope.schemaVersion} is newer than supported ${supportedSchemaVersion}`,
    );
  }
  return canonicalizeCheckpoint(assertCheckpointShape(envelope.payload));
}

export type ReplayAssessment = "SAFE_TO_CONSIDER_RESUMING" | "BLOCKED_UNVERIFIED_IRREVERSIBLE_ACTION";

export interface ReplayAssessmentReport {
  assessment: ReplayAssessment;
  /** Actions that may already have taken effect and are not verified. */
  unverifiedActionIds: string[];
  /**
   * Always false here. This module can observe replay risk and can persist a
   * record; it cannot authorize a resume, and it never continues execution.
   */
  resumeAuthorized: false;
}

/**
 * READ-ONLY replay-risk read over a stored checkpoint.
 *
 * A checkpoint exists so an authorized execution can *potentially* continue.
 * Continuing still requires current authorization, which this module neither
 * holds nor grants, so the report always reports `resumeAuthorized: false`.
 */
export function assessReplayRisk(payload: ExecutionCheckpointPayload): ReplayAssessmentReport {
  const canonical = assertCheckpointShape(payload);
  const unverifiedActionIds = canonical.pendingIrreversible
    .filter((action) => action.state === "CLAIMED_UNVERIFIED")
    .map((action) => action.actionId)
    .sort();
  return {
    assessment:
      unverifiedActionIds.length > 0 ? "BLOCKED_UNVERIFIED_IRREVERSIBLE_ACTION" : "SAFE_TO_CONSIDER_RESUMING",
    unverifiedActionIds,
    resumeAuthorized: false,
  };
}
