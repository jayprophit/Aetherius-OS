import { describe, expect, it } from "vitest";
import {
  MERGE_OUTCOMES,
  SPINE_SLICE_KINDS,
  SpineError,
  assertBranchOutput,
  closeBranch,
  emptySpine,
  mergeBranch,
  openBranch,
} from "./spineBranch";
import type { BranchHandle, MergeResult, SpineState } from "./spineBranch";
import type { WorkerProfile } from "./profiles";

/**
 * Dimension-specific fixtures: each declares its own fields, nothing inherited.
 * Only `id` is read by this unit - the profile is referenced, never copied - so
 * the fixture is cast rather than expanded into a full profile contract.
 */
const PROFILE = { id: "worker-profile-indexer", role: "indexing" } as unknown as WorkerProfile;

function spine(): SpineState {
  return emptySpine();
}

function output(writes: Array<{ slice: string; entries: string[] }>, reason = "branch finished") {
  return { writes, reason };
}

function merged(base: SpineState, handle: BranchHandle, out: unknown, alreadyMerged: string[] = []): MergeResult {
  return mergeBranch({ spine: base, handle, output: out, mergedAt: "2026-09-26T12:00:00.000Z", alreadyMerged });
}

describe("spine-branch: registered vocabulary", () => {
  it("declares the three slice kinds and three merge outcomes, with no overwrite", () => {
    expect([...SPINE_SLICE_KINDS]).toEqual(["NOTES", "ARTIFACT_REFS", "TASK_QUEUE"]);
    expect([...MERGE_OUTCOMES]).toEqual(["MERGED", "CONFLICT", "REJECTED"]);
    expect([...MERGE_OUTCOMES]).not.toContain("OVERWRITE");
    expect([...MERGE_OUTCOMES]).not.toContain("LAST_WRITE_WINS");
  });
});

describe("spine-branch: canonical mutable spine", () => {
  it("starts empty at revision zero", () => {
    const base = spine();
    expect(base.revision).toBe(0);
    expect(base.slices).toEqual({});
  });

  it("advances the revision only on an accepted merge", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const result = merged(base, handle, output([{ slice: "NOTES", entries: ["found a leak"] }]));
    expect(result.outcome).toBe("MERGED");
    expect(result.spine.revision).toBe(1);
    expect(result.spine.slices.NOTES).toEqual(["found a leak"]);
  });

  it("keeps a per-slice revision so a conflict can be scoped", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const result = merged(base, handle, output([{ slice: "NOTES", entries: ["a"] }, { slice: "TASK_QUEUE", entries: ["t"] }]));
    expect(result.spine.sliceRevisions.NOTES).toBe(1);
    expect(result.spine.sliceRevisions.TASK_QUEUE).toBe(1);
  });

  it("appends rather than replacing, so a branch cannot delete spine history", () => {
    let base = spine();
    const first = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    base = merged(base, first, output([{ slice: "NOTES", entries: ["first"] }])).spine;
    const second = openBranch({ spine: base, branchId: "b2", profile: PROFILE, instanceRef: "run-2" });
    base = merged(base, second, output([{ slice: "NOTES", entries: ["second"] }])).spine;
    expect(base.slices.NOTES).toEqual(["first", "second"]);
  });

  it("never mutates the spine the caller passed in", () => {
    const base = spine();
    const snapshot = JSON.stringify(base);
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    merged(base, handle, output([{ slice: "NOTES", entries: ["a"] }]));
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  it("rejects an unknown slice and an unknown spine field", () => {
    expect(() => assertBranchOutput(output([{ slice: "SECRETS", entries: ["x"] }]))).toThrowError(
      expect.objectContaining({ code: "SPINE_UNKNOWN_SLICE" }),
    );
    expect(() => assertBranchOutput({ ...output([]), vmHandle: "0xdeadbeef" })).toThrowError(SpineError);
  });
});

describe("spine-branch: branch isolates do not touch the spine", () => {
  it("hands the branch a revision rather than the spine itself", () => {
    const base: SpineState = { revision: 4, sliceRevisions: { NOTES: 2 }, slices: { NOTES: ["a"] } };
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    expect(handle.baseRevision).toBe(4);
    expect(handle.baseSliceRevisions).toEqual({ NOTES: 2 });
    expect(Object.keys(handle)).not.toContain("spine");
    expect(Object.keys(handle)).not.toContain("slices");
  });

  it("does not expose the live slice arrays to the branch", () => {
    const base: SpineState = { revision: 1, sliceRevisions: { NOTES: 1 }, slices: { NOTES: ["a"] } };
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    handle.baseSliceRevisions.NOTES = 99;
    expect(base.sliceRevisions.NOTES).toBe(1);
  });

  it("requires a named worker profile and references it without copying", () => {
    const handle = openBranch({ spine: spine(), branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    expect(handle.profileRef).toBe("worker-profile-indexer");
    expect(handle).not.toHaveProperty("role");
  });

  it("rejects a branch with no profile or no instance ref", () => {
    expect(() => openBranch({ spine: spine(), branchId: "b1", profile: undefined as never, instanceRef: "run-1" })).toThrowError(
      expect.objectContaining({ code: "SPINE_INVALID_STATE" }),
    );
    expect(() => openBranch({ spine: spine(), branchId: "b1", profile: PROFILE, instanceRef: "" })).toThrowError(
      expect.objectContaining({ code: "SPINE_INVALID_STATE" }),
    );
  });
});

describe("spine-branch: no naive VM-state merge", () => {
  it("rejects a VM state dump instead of merging it", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    for (const key of ["vmsState", "vmState", "memory", "heap", "stack", "registers", "processState", "coreDump"]) {
      const result = merged(base, handle, { ...output([]), [key]: { blobs: ["..."] } });
      expect(result.outcome).toBe("REJECTED");
      expect(result.rejectionCode).toBe("BRANCH_VM_STATE_REJECTED");
    }
  });

  it("rejects VM state nested inside a typed write", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const result = merged(base, handle, { writes: [{ slice: "NOTES", entries: ["a"], registers: ["r0"] }], reason: "x" });
    expect(result.outcome).toBe("REJECTED");
    // A VM-state field is reported as itself, not as a generic unknown key.
    expect(result.rejectionCode).toBe("BRANCH_VM_STATE_REJECTED");
  });

  it("rejects unknown output fields rather than silently discarding them", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    for (const key of ["finalState", "diff", "patch", "authority", "approved"]) {
      const result = merged(base, handle, { ...output([]), [key]: "x" });
      expect(result.outcome).toBe("REJECTED");
      expect(result.rejectionCode).toBe("BRANCH_UNKNOWN_FIELD");
    }
  });

  it("leaves the spine completely untouched when output is rejected", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const result = merged(base, handle, { ...output([{ slice: "NOTES", entries: ["a"] }]), heap: "0x1" });
    expect(result.spine).toEqual(base);
    expect(result.spine.revision).toBe(0);
  });

  it("rejects a non-object output and a missing reason", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    expect(merged(base, handle, "done").outcome).toBe("REJECTED");
    expect(merged(base, handle, { writes: [] }).outcome).toBe("REJECTED");
    expect(merged(base, handle, { writes: [], reason: "" }).outcome).toBe("REJECTED");
  });

  it("rejects non-string entries rather than coercing them", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    expect(merged(base, handle, output([{ slice: "NOTES", entries: [42 as never] }])).outcome).toBe("REJECTED");
  });
});

describe("spine-branch: merge-back is not last-write-wins", () => {
  it("reports a conflict when the spine moved after the branch opened", () => {
    const base = spine();
    const first = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const advanced = merged(base, first, output([{ slice: "NOTES", entries: ["from b1"] }])).spine;
    const stale = openBranch({ spine: base, branchId: "b2", profile: PROFILE, instanceRef: "run-2" });
    expect(stale.baseRevision).toBe(0);

    const result = merged(advanced, stale, output([{ slice: "TASK_QUEUE", entries: ["from b2"] }]));
    expect(result.outcome).toBe("CONFLICT");
    expect(result.spine).toEqual(advanced);
    expect(result.notes.join(" ")).toContain("opened at spine revision 0");
  });

  it("scopes a slice-level conflict to the slice that actually moved", () => {
    let base = spine();
    const anchor = openBranch({ spine: base, branchId: "anchor", profile: PROFILE, instanceRef: "run-0" });
    const stale = openBranch({ spine: base, branchId: "stale", profile: PROFILE, instanceRef: "run-1" });

    const mover = openBranch({ spine: base, branchId: "mover", profile: PROFILE, instanceRef: "run-2" });
    base = merged(base, mover, output([{ slice: "NOTES", entries: ["a"] }])).spine;
    // Re-anchor the stale branch's base revision so only the slice differs.
    const rescoped: BranchHandle = { ...stale, baseRevision: base.revision, baseSliceRevisions: { ...base.sliceRevisions, NOTES: 0 } };

    const result = merged(base, rescoped, output([{ slice: "NOTES", entries: ["b"] }]));
    expect(result.outcome).toBe("CONFLICT");
    expect(result.conflicts).toEqual([{ slice: "NOTES", baseSliceRevision: 0, currentSliceRevision: 1 }]);
    expect(result.spine.slices.NOTES).toEqual(["a"]);
    expect(anchor.baseRevision).toBe(0);
  });

  it("never picks a winner between two branches", () => {
    let base = spine();
    const a = openBranch({ spine: base, branchId: "a", profile: PROFILE, instanceRef: "run-a" });
    base = merged(base, a, output([{ slice: "NOTES", entries: ["a"] }])).spine;
    const b = openBranch({ spine: base, branchId: "b", profile: PROFILE, instanceRef: "run-b" });
    const result = merged(base, b, output([{ slice: "NOTES", entries: ["b"] }]));
    // b opened after a merged, so this is a legitimate append, not a conflict.
    expect(result.outcome).toBe("MERGED");
    expect(result.spine.slices.NOTES).toEqual(["a", "b"]);
  });

  it("treats an empty write set as a no-op rather than a silent revision bump", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const result = merged(base, handle, output([]));
    expect(result.outcome).toBe("MERGED");
    expect(result.appliedSlices).toEqual([]);
    expect(result.spine.revision).toBe(0);
    expect(result.notes.join(" ")).toContain("no typed writes");
  });

  it("treats an all-empty-entry write set as a no-op too", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const result = merged(base, handle, output([{ slice: "NOTES", entries: [] }]));
    expect(result.spine.revision).toBe(0);
    expect(result.notes.join(" ")).toContain("empty");
  });
});

describe("spine-branch: one merge per branch", () => {
  it("refuses a second merge of the same branch", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const first = merged(base, handle, output([{ slice: "NOTES", entries: ["a"] }]));
    expect(() =>
      mergeBranch({
        spine: first.spine,
        handle,
        output: output([{ slice: "NOTES", entries: ["again"] }]),
        mergedAt: "2026-09-26T12:05:00.000Z",
        alreadyMerged: ["b1"],
      }),
    ).toThrowError(expect.objectContaining({ code: "BRANCH_ALREADY_MERGED" }));
  });

  it("refuses to merge a branch that is not open", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    expect(() => merged(base, { ...handle, open: false as never }, output([]))).toThrowError(
      expect.objectContaining({ code: "BRANCH_NOT_OPEN" }),
    );
  });

  it("requires the caller to supply the merge time", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    expect(() => mergeBranch({ spine: base, handle, output: output([]), mergedAt: "" })).toThrowError(
      expect.objectContaining({ code: "SPINE_INVALID_STATE" }),
    );
  });
});

describe("spine-branch: branch workers stay temporary", () => {
  it("closing leaves no resident worker and no authority", () => {
    const handle = openBranch({ spine: spine(), branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const closed = closeBranch(handle);
    expect(closed.residentWorker).toBe(false);
    expect(closed.authority).toBe("NONE");
  });

  it("a closed branch grants no merge, deploy or approval surface", () => {
    const closed = closeBranch(openBranch({ spine: spine(), branchId: "b1", profile: PROFILE, instanceRef: "run-1" }));
    for (const banned of ["merge", "deploy", "approve", "authorize", "grant", "token", "credentials"]) {
      expect(Object.keys(closed)).not.toContain(banned);
    }
  });

  it("keeps a branch id distinct from a worker identity and a profile id", () => {
    const handle = openBranch({ spine: spine(), branchId: "branch-7", profile: PROFILE, instanceRef: "run-7" });
    expect(handle.branchId).not.toBe(handle.instanceRef);
    expect(handle.branchId).not.toBe(handle.profileRef);
  });

  it("refuses to close a branch that was never opened", () => {
    expect(() => closeBranch({} as never)).toThrowError(expect.objectContaining({ code: "BRANCH_NOT_OPEN" }));
  });

  it("the merge record is bounded and typed, not a worker registry", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const result = merged(base, handle, output([{ slice: "NOTES", entries: ["a"] }]));
    expect(Object.keys(result.record).sort()).toEqual(
      ["baseRevision", "branchId", "instanceRef", "mergedAtRevision", "notes", "outcome", "profileRef"].sort(),
    );
  });
});

describe("spine-branch: boundaries", () => {
  it("exposes no completion, authority or recovery verdict on a merge", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const result = merged(base, handle, output([{ slice: "NOTES", entries: ["a"] }]));
    const keys = [...Object.keys(result), ...Object.keys(result.record)].map((key) => key.toLowerCase());
    for (const banned of ["complete", "completed", "verdict", "approved", "authorized", "recovered", "pass", "success"]) {
      expect(keys).not.toContain(banned);
    }
  });

  it("reads no clock, filesystem or network: the same inputs give the same result", () => {
    const run = () => {
      const base = spine();
      const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
      return merged(base, handle, output([{ slice: "ARTIFACT_REFS", entries: ["a.json"] }]));
    };
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });

  it("produces deterministic applied-slice ordering from scrambled writes", () => {
    const base = spine();
    const forward = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const reversed = openBranch({ spine: base, branchId: "b2", profile: PROFILE, instanceRef: "run-2" });
    const a = merged(base, forward, output([{ slice: "NOTES", entries: ["n"] }, { slice: "TASK_QUEUE", entries: ["t"] }]));
    const b = merged(base, reversed, output([{ slice: "TASK_QUEUE", entries: ["t"] }, { slice: "NOTES", entries: ["n"] }]));
    expect(a.appliedSlices).toEqual(b.appliedSlices);
    expect(Object.keys(a.spine.slices).sort()).toEqual(Object.keys(b.spine.slices).sort());
  });

  it("does not reimplement the collision forecast or the sync oracle", () => {
    const base = spine();
    const handle = openBranch({ spine: base, branchId: "b1", profile: PROFILE, instanceRef: "run-1" });
    const result = merged(base, handle, output([{ slice: "NOTES", entries: ["a"] }]));
    expect(Object.keys(result).sort()).toEqual(
      ["appliedSlices", "conflicts", "notes", "outcome", "record", "rejectionCode", "spine"].filter((key) => key in result).sort(),
    );
  });
});
