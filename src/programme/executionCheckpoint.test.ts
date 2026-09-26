import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileStateStore } from "../state/store";
import {
  CHECKPOINT_KIND,
  CHECKPOINT_SCHEMA_VERSION,
  CheckpointError,
  assertCheckpointShape,
  assessReplayRisk,
  canonicalizeCheckpoint,
  checkpointContentDigest,
  composeExecutionCheckpoint,
  persistExecutionCheckpoint,
  readExecutionCheckpoint,
} from "./executionCheckpoint";
import type { ExecutionCheckpointPayload, ExecutionFragments } from "./executionCheckpoint";

/**
 * Every fixture declares its own fields explicitly, so a partial override can
 * never silently inherit a default that changes meaning.
 */
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fragments(over: Partial<ExecutionFragments> = {}): ExecutionFragments {
  return {
    taskId: "task-alpha",
    workflowId: "workflow-delivery",
    workspace: { root: "src", hash: HASH_A, branch: "main" },
    artifacts: [{ artifactId: "artifact-report", ref: "artifacts/report.json" }],
    worker: { instanceId: "worker-instance-7", profileId: "worker-profile-default" },
    backend: { backendId: "backend-local", targetInstanceId: "target-instance-2" },
    pendingIrreversible: [],
    evidenceRefs: ["evidence-1"],
    provenance: "workflow:checkpoint-capture",
    ...over,
  };
}

function compose(
  fragmentOver: Partial<ExecutionFragments> = {},
  optionOver: Partial<Parameters<typeof composeExecutionCheckpoint>[1]> = {},
): ExecutionCheckpointPayload {
  return composeExecutionCheckpoint(fragments(fragmentOver), {
    checkpointId: "ckpt-task-alpha-1",
    sequence: 1,
    capturedAt: "2026-09-26T10:00:00.000Z",
    ...optionOver,
  });
}

describe("execution checkpoint: typed envelope over P17 envelopes", () => {
  it("joins every registered fragment field into one typed record", () => {
    const payload = compose();
    expect(payload.taskId).toBe("task-alpha");
    expect(payload.workflowId).toBe("workflow-delivery");
    expect(payload.workspace).toEqual({ root: "src", hash: HASH_A, branch: "main" });
    expect(payload.artifacts).toHaveLength(1);
    expect(payload.worker.profileId).toBe("worker-profile-default");
    expect(payload.backend.backendId).toBe("backend-local");
    expect(payload.pendingIrreversible).toEqual([]);
    expect(payload.evidenceRefs).toEqual(["evidence-1"]);
  });

  it("accepts a minimal valid checkpoint and an empty fragment set", () => {
    const payload = compose({}, { predecessorCheckpointId: undefined });
    expect(() => assertCheckpointShape(payload)).not.toThrow();
    const bare = composeExecutionCheckpoint(
      fragments({ artifacts: [], pendingIrreversible: [], evidenceRefs: [] }),
      { checkpointId: "ckpt-bare", sequence: 1, capturedAt: "2026-09-26T10:00:00Z" },
    );
    expect(bare.artifacts).toEqual([]);
    expect(bare.evidenceRefs).toEqual([]);
  });

  it("keeps checkpoint id distinct from task id and workflow id", () => {
    expect(compose().checkpointId).not.toBe(compose().taskId);
    expect(() =>
      assertCheckpointShape({ ...compose(), checkpointId: compose().taskId }),
    ).toThrowError(expect.objectContaining({ code: "CHECKPOINT_MALFORMED_ID" }));
    expect(() => assertCheckpointShape({ ...compose(), taskId: "workflow-delivery" })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_MALFORMED_ID" }),
    );
  });

  it("keeps worker profile distinct from worker instance", () => {
    const payload = compose();
    expect(payload.worker.instanceId).not.toBe(payload.worker.profileId);
    const collapsed = assertCheckpointShape({
      ...payload,
      worker: { instanceId: payload.worker.profileId, profileId: payload.worker.profileId },
    });
    // Equal strings are permitted; the type keeps the two roles separate so a
    // caller cannot mistake one for the other.
    expect(collapsed.worker.instanceId).toBe(collapsed.worker.profileId);
    expect(() => assertCheckpointShape({ ...payload, worker: { instanceId: "w" } })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_MALFORMED_ID" }),
    );
  });
});

describe("execution checkpoint: sequence and predecessor", () => {
  it("requires an explicit positive sequence", () => {
    expect(() => assertCheckpointShape({ ...compose(), sequence: 0 })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_MALFORMED_SEQUENCE" }),
    );
    expect(() => assertCheckpointShape({ ...compose(), sequence: 1.5 })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_MALFORMED_SEQUENCE" }),
    );
    expect(() => assertCheckpointShape({ ...compose(), sequence: "1" })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_MALFORMED_SEQUENCE" }),
    );
  });

  it("records an explicit predecessor chain", () => {
    const second = compose({}, { checkpointId: "ckpt-task-alpha-2", sequence: 2, predecessorCheckpointId: "ckpt-task-alpha-1" });
    expect(second.predecessorCheckpointId).toBe("ckpt-task-alpha-1");
  });

  it("rejects a checkpoint that names itself as predecessor", () => {
    expect(() =>
      assertCheckpointShape({ ...compose(), predecessorCheckpointId: compose().checkpointId }),
    ).toThrowError(expect.objectContaining({ code: "CHECKPOINT_MALFORMED_ID" }));
  });
});

describe("execution checkpoint: strict input validation", () => {
  it("rejects unknown fields instead of silently discarding them", () => {
    for (const key of ["extra", "notes", "chainOfThought", "state"]) {
      expect(() => assertCheckpointShape({ ...compose(), [key]: "x" })).toThrowError(
        expect.objectContaining({ code: "CHECKPOINT_UNKNOWN_FIELD" }),
      );
    }
  });

  it("rejects unknown nested fields", () => {
    expect(() => assertCheckpointShape({ ...compose(), workspace: { ...compose().workspace, dirty: true } })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_UNKNOWN_FIELD" }),
    );
    expect(() => assertCheckpointShape({ ...compose(), worker: { instanceId: "w1", profileId: "p1", cpu: 8 } })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_UNKNOWN_FIELD" }),
    );
  });

  it("rejects a non-object payload", () => {
    for (const bad of [null, undefined, 7, "ckpt", []]) {
      expect(() => assertCheckpointShape(bad)).toThrowError(CheckpointError);
    }
  });

  it("requires every registered field", () => {
    for (const key of ["checkpointId", "taskId", "workflowId", "workspace", "artifacts", "worker", "backend", "pendingIrreversible", "evidenceRefs", "sequence", "capturedAt", "provenance"]) {
      const partial: Record<string, unknown> = { ...compose() };
      delete partial[key];
      expect(() => assertCheckpointShape(partial)).toThrowError(
        expect.objectContaining({ code: "CHECKPOINT_SHAPE_INVALID" }),
      );
    }
  });
});

describe("execution checkpoint: authority boundary", () => {
  it("rejects embedded authority claims rather than storing them", () => {
    for (const key of ["authorized", "canExecute", "policyBypass", "ownerOverride", "merge_authority", "resumeAuthorized"]) {
      expect(() => assertCheckpointShape({ ...compose(), [key]: true })).toThrowError(
        expect.objectContaining({ code: "CHECKPOINT_AUTHORITY_CLAIM_REJECTED" }),
      );
    }
  });

  it("rejects authority claims nested inside fragments", () => {
    expect(() => assertCheckpointShape({ ...compose(), worker: { instanceId: "w1", profileId: "p1", ownerOverride: true } })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_AUTHORITY_CLAIM_REJECTED" }),
    );
  });

  it("never reports a checkpoint as resume authorization", () => {
    const report = assessReplayRisk(compose());
    expect(report.resumeAuthorized).toBe(false);
    expect(assessReplayRisk(compose({ pendingIrreversible: [{ actionId: "pay-1", state: "CLAIMED_UNVERIFIED" }] })).resumeAuthorized).toBe(
      false,
    );
  });
});

describe("execution checkpoint: secret handling", () => {
  it("rejects raw credential fields at the top level and inside fragments", () => {
    for (const key of ["password", "apiKey", "token", "privateKey", "secret", "credential", "credentials"]) {
      expect(() => assertCheckpointShape({ ...compose(), [key]: "sk-live-123" })).toThrowError(
        expect.objectContaining({ code: "CHECKPOINT_SECRET_VALUE_REJECTED" }),
      );
    }
    expect(() =>
      assertCheckpointShape({
        ...compose(),
        backend: { backendId: "backend-local", token: "sk-live-123" },
      }),
    ).toThrowError(expect.objectContaining({ code: "CHECKPOINT_SECRET_VALUE_REJECTED" }));
  });

  it("stores only a reference when a secret matters", () => {
    const payload = compose({
      artifacts: [{ artifactId: "artifact-report", ref: "artifacts/report.json" }],
      backend: { backendId: "backend-local", targetInstanceId: "target-instance-2" },
    });
    // Scan for credential-shaped VALUES, not credential-shaped words: a plain
    // substring search for "sk-" also matches the "sk-" inside "task-alpha".
    const values: string[] = [];
    const collect = (node: unknown): void => {
      if (typeof node === "string") values.push(node);
      else if (Array.isArray(node)) node.forEach(collect);
      else if (isPlainRecord(node)) Object.values(node).forEach(collect);
    };
    collect(payload);
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value).not.toMatch(/^(?:sk|pk|ghp|gho|glpat|api|key|token|bearer)[-_]/i);
      expect(value).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
    }
    expect(Object.keys(payload)).not.toContain("credentials");
  });
});

describe("execution checkpoint: safe paths and workspace hashing", () => {
  it("rejects traversal in the workspace root", () => {
    for (const root of ["../outside", "src/../../etc", "/abs/path"]) {
      expect(() => assertCheckpointShape({ ...compose(), workspace: { root, hash: HASH_A, branch: "main" } })).toThrowError(
        expect.objectContaining({ code: "CHECKPOINT_UNSAFE_PATH" }),
      );
    }
  });

  it("rejects a malformed workspace hash", () => {
    for (const hash of ["", "abc", HASH_A.toUpperCase(), `${HASH_A}00`]) {
      expect(() => assertCheckpointShape({ ...compose(), workspace: { root: "src", hash, branch: "main" } })).toThrowError(
        expect.objectContaining({ code: "CHECKPOINT_MALFORMED_HASH" }),
      );
    }
  });

  it("rejects a malformed branch ref", () => {
    for (const branch of ["", "main;rm -rf", ".."]) {
      expect(() => assertCheckpointShape({ ...compose(), workspace: { root: "src", hash: HASH_A, branch } })).toThrowError(
        expect.objectContaining({ code: "CHECKPOINT_SHAPE_INVALID" }),
      );
    }
  });
});

describe("execution checkpoint: timestamps are caller supplied", () => {
  it("rejects a malformed or invented-default timestamp", () => {
    for (const capturedAt of ["", "now", "0", "2026-09-26", "2026-13-45T99:99:99Z"]) {
      expect(() => assertCheckpointShape({ ...compose(), capturedAt })).toThrowError(
        expect.objectContaining({ code: "CHECKPOINT_MALFORMED_TIMESTAMP" }),
      );
    }
  });

  it("accepts supplied ISO-8601 offsets", () => {
    expect(() => assertCheckpointShape({ ...compose(), capturedAt: "2026-09-26T12:30:00+02:00" })).not.toThrow();
  });
});

describe("execution checkpoint: duplicate entries", () => {
  it("rejects duplicate artifact, evidence and action references", () => {
    expect(() =>
      assertCheckpointShape({
        ...compose(),
        artifacts: [
          { artifactId: "a1", ref: "r1" },
          { artifactId: "a1", ref: "r2" },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "CHECKPOINT_DUPLICATE_ENTRY" }));
    expect(() => assertCheckpointShape({ ...compose(), evidenceRefs: ["e1", "e1"] })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_DUPLICATE_ENTRY" }),
    );
    expect(() =>
      assertCheckpointShape({
        ...compose(),
        pendingIrreversible: [
          { actionId: "pay-1", state: "NOT_STARTED" },
          { actionId: "pay-1", state: "VERIFIED_COMPLETE", verificationRef: "e1" },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "CHECKPOINT_DUPLICATE_ENTRY" }));
  });
});

describe("execution checkpoint: irreversible action state", () => {
  it("requires verification evidence before claiming an action completed", () => {
    expect(() =>
      assertCheckpointShape({
        ...compose(),
        pendingIrreversible: [{ actionId: "email-1", state: "VERIFIED_COMPLETE" }],
      }),
    ).toThrowError(expect.objectContaining({ code: "CHECKPOINT_SHAPE_INVALID" }));
  });

  it("rejects an unknown action state instead of defaulting it", () => {
    expect(() =>
      assertCheckpointShape({
        ...compose(),
        pendingIrreversible: [{ actionId: "email-1", state: "DONE" }],
      }),
    ).toThrowError(expect.objectContaining({ code: "CHECKPOINT_SHAPE_INVALID" }));
  });

  it("keeps an unverified action unknown rather than rounding it either way", () => {
    const payload = compose({
      pendingIrreversible: [{ actionId: "upload-9", state: "CLAIMED_UNVERIFIED" }],
    });
    const action = payload.pendingIrreversible[0]!;
    expect(action.state).toBe("CLAIMED_UNVERIFIED");
    expect(action.verificationRef).toBeUndefined();
  });

  it("blocks replay consideration when an irreversible action is unverified", () => {
    const report = assessReplayRisk(
      compose({
        pendingIrreversible: [
          { actionId: "pay-2", state: "CLAIMED_UNVERIFIED" },
          { actionId: "mail-1", state: "NOT_STARTED" },
        ],
      }),
    );
    expect(report.assessment).toBe("BLOCKED_UNVERIFIED_IRREVERSIBLE_ACTION");
    expect(report.unverifiedActionIds).toEqual(["pay-2"]);
  });

  it("never treats a checkpoint as recovery proof", () => {
    const report = assessReplayRisk(compose());
    expect(report.assessment).toBe("SAFE_TO_CONSIDER_RESUMING");
    expect(report.resumeAuthorized).toBe(false);
  });
});

describe("execution checkpoint: deterministic serialization", () => {
  it("canonicalizes scrambled reference order to identical content", () => {
    const scrambled = compose({
      artifacts: [
        { artifactId: "artifact-z", ref: "z" },
        { artifactId: "artifact-a", ref: "a" },
      ],
      evidenceRefs: ["evidence-9", "evidence-2"],
      pendingIrreversible: [
        { actionId: "act-b", state: "NOT_STARTED" },
        { actionId: "act-a", state: "NOT_STARTED" },
      ],
    });
    const sorted = compose({
      artifacts: [
        { artifactId: "artifact-a", ref: "a" },
        { artifactId: "artifact-z", ref: "z" },
      ],
      evidenceRefs: ["evidence-2", "evidence-9"],
      pendingIrreversible: [
        { actionId: "act-a", state: "NOT_STARTED" },
        { actionId: "act-b", state: "NOT_STARTED" },
      ],
    });
    expect(checkpointContentDigest(scrambled)).toBe(checkpointContentDigest(sorted));
    expect(JSON.stringify(canonicalizeCheckpoint(scrambled))).toBe(JSON.stringify(canonicalizeCheckpoint(sorted)));
  });

  it("does not let a scrambled array mutate the caller's input", () => {
    const artifacts = [
      { artifactId: "b", ref: "b" },
      { artifactId: "a", ref: "a" },
    ];
    const payload = compose({ artifacts });
    canonicalizeCheckpoint(payload);
    expect(artifacts.map((a) => a.artifactId)).toEqual(["b", "a"]);
  });

  it("produces a different digest when content differs", () => {
    expect(checkpointContentDigest(compose())).not.toBe(checkpointContentDigest(compose({}, { sequence: 2 })));
    expect(checkpointContentDigest(compose())).not.toBe(
      checkpointContentDigest(compose({ workspace: { root: "src", hash: HASH_B, branch: "main" } })),
    );
  });
});

describe("execution checkpoint: persistence over the P17 owned-state store", () => {
  let root: string;
  let store: FileStateStore;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "aetherius-ckpt-"));
    store = new FileStateStore(root, CHECKPOINT_SCHEMA_VERSION);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("persists the joined record and reads it back intact", () => {
    const payload = compose();
    const saved = persistExecutionCheckpoint(store, payload, { now: "2026-09-26T10:05:00.000Z" });
    expect(saved.kind).toBe(CHECKPOINT_KIND);
    expect(saved.schemaVersion).toBe(CHECKPOINT_SCHEMA_VERSION);
    expect(saved.recordVersion).toBe(1);
    expect(saved.createdAt).toBe("2026-09-26T10:05:00.000Z");

    const read = readExecutionCheckpoint(store.load<ExecutionCheckpointPayload>(payload.checkpointId));
    expect(read).toEqual(payload);
  });

  it("inherits the P17 integrity discipline", () => {
    const payload = compose();
    persistExecutionCheckpoint(store, payload, { now: "2026-09-26T10:05:00.000Z" });
    const file = store.load<ExecutionCheckpointPayload>(payload.checkpointId);
    expect(file.integrity).toMatch(/^[0-9a-f]{64}$/);
    expect(() => store.load<ExecutionCheckpointPayload>(payload.checkpointId)).not.toThrow();
  });

  it("is idempotent for identical content at the same sequence", () => {
    const payload = compose();
    const first = persistExecutionCheckpoint(store, payload, { now: "2026-09-26T10:05:00.000Z" });
    const second = persistExecutionCheckpoint(store, payload, { now: "2026-09-26T11:00:00.000Z" });
    expect(second.recordVersion).toBe(first.recordVersion);
    expect(second.updatedAt).toBe(first.updatedAt);
  });

  it("refuses to silently overwrite a sequence with different content", () => {
    const payload = compose();
    persistExecutionCheckpoint(store, payload, { now: "2026-09-26T10:05:00.000Z" });
    const conflicting = compose({ workspace: { root: "src", hash: HASH_B, branch: "main" } });
    expect(() => persistExecutionCheckpoint(store, conflicting, { now: "2026-09-26T10:06:00.000Z" })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_CONFLICT" }),
    );
  });

  it("refuses to replace a newer sequence with an older one", () => {
    const newer = compose({}, { sequence: 5 });
    persistExecutionCheckpoint(store, newer, { now: "2026-09-26T10:05:00.000Z" });
    expect(() => persistExecutionCheckpoint(store, compose({}, { sequence: 2 }), { now: "2026-09-26T10:06:00.000Z" })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_CONFLICT" }),
    );
  });

  it("advances the record version when a later sequence is captured", () => {
    persistExecutionCheckpoint(store, compose({}, { sequence: 1 }), { now: "2026-09-26T10:05:00.000Z" });
    const next = persistExecutionCheckpoint(
      store,
      compose({}, { checkpointId: "ckpt-task-alpha-1", sequence: 2, predecessorCheckpointId: undefined }),
      { now: "2026-09-26T10:10:00.000Z" },
    );
    expect(next.recordVersion).toBe(2);
    expect(next.payload.sequence).toBe(2);
  });

  it("does not reuse an id that already holds a different record kind", () => {
    store.save<{ hello: string }>({
      id: "ckpt-task-alpha-1",
      kind: "workflow.lifecycle",
      schemaVersion: CHECKPOINT_SCHEMA_VERSION,
      recordVersion: 1,
      createdAt: "2026-09-26T09:00:00.000Z",
      updatedAt: "2026-09-26T09:00:00.000Z",
      owner: "task-alpha",
      provenance: "workflow:lifecycle",
      sensitivity: "SYSTEM",
      integrity: "0".repeat(64),
      payload: { hello: "world" },
    });
    expect(() => persistExecutionCheckpoint(store, compose(), { now: "2026-09-26T10:05:00.000Z" })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_CONFLICT" }),
    );
  });

  it("rejects a record whose kind is not a checkpoint", () => {
    const payload = compose();
    persistExecutionCheckpoint(store, payload, { now: "2026-09-26T10:05:00.000Z" });
    const stored = store.load<ExecutionCheckpointPayload>(payload.checkpointId);
    expect(() => readExecutionCheckpoint({ ...stored, kind: "workflow.lifecycle" })).toThrowError(CheckpointError);
  });

  it("rejects a record written by a newer schema rather than guessing", () => {
    const payload = compose();
    persistExecutionCheckpoint(store, payload, { now: "2026-09-26T10:05:00.000Z" });
    const stored = store.load<ExecutionCheckpointPayload>(payload.checkpointId);
    expect(() => readExecutionCheckpoint({ ...stored, schemaVersion: CHECKPOINT_SCHEMA_VERSION + 1 })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_UNSUPPORTED_SCHEMA" }),
    );
  });
});

describe("execution checkpoint: scope boundaries", () => {
  it("references artifacts without becoming an artifact library", () => {
    const payload = compose({
      artifacts: [
        { artifactId: "artifact-a", ref: "a.json" },
        { artifactId: "artifact-b", ref: "b.json" },
      ],
    });
    expect(payload.artifacts.every((a) => typeof a.ref === "string")).toBe(true);
    expect(Object.keys(payload).sort()).toEqual(
      [
        "artifacts",
        "backend",
        "capturedAt",
        "checkpointId",
        "evidenceRefs",
        "pendingIrreversible",
        "predecessorCheckpointId",
        "provenance",
        "sequence",
        "taskId",
        "worker",
        "workflowId",
        "workspace",
      ].sort(),
    );
  });

  it("references an execution target without making a placement decision", () => {
    const payload = compose();
    expect(payload.backend.targetInstanceId).toBe("target-instance-2");
    expect(() => assertCheckpointShape({ ...compose(), backend: { backendId: "b1", placement: "node-3" } })).toThrowError(
      expect.objectContaining({ code: "CHECKPOINT_UNKNOWN_FIELD" }),
    );
  });

  it("carries no lease, heartbeat or liveness claim", () => {
    const payload = compose();
    const keys = Object.keys(payload).map((k) => k.toLowerCase());
    for (const banned of ["lease", "heartbeat", "ttl", "liveness", "alive", "lock"]) {
      expect(keys).not.toContain(banned);
    }
  });

  it("carries no completion or verdict claim", () => {
    const payload = compose();
    const keys = Object.keys(payload).map((k) => k.toLowerCase());
    for (const banned of ["complete", "completed", "verdict", "pass", "success", "done"]) {
      expect(keys).not.toContain(banned);
    }
  });
});
