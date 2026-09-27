import { describe, expect, it } from "vitest";
import {
  candidatesFromLayers,
  compileContext,
} from "./compiler";
import type { CompileCandidate, CompileInput } from "./compiler";

/** Deterministic test-double runtime, labeled as such. Not a real tokenizer. */
const TEST_RUNTIME = {
  runtimeId: "test-double-char-counter",
  count: (text: string): number => text.length,
};

function candidate(over: Partial<CompileCandidate> = {}): CompileCandidate {
  return {
    id: "c1",
    layer: "L6",
    kind: "reference",
    text: '{"docId":"d1"}',
    provenance: "test",
    required: false,
    priority: 0,
    ...over,
  };
}

function input(over: Partial<CompileInput> = {}): CompileInput {
  return {
    taskId: "task-1",
    candidates: [candidate()],
    budget: { advertisedLimit: 100000, tokenizer: TEST_RUNTIME },
    provenance: "test",
    ...over,
  };
}

describe("compiler: minimal compilation and layer order", () => {
  it("assembles one candidate into one skill-ready unit", () => {
    const report = compileContext(input());
    expect(report.status).toBe("COMPILED");
    expect(report.taskId).toBe("task-1");
    expect(report.units).toHaveLength(1);
    expect(report.units[0]).toMatchObject({ unitId: "c1", layer: "L6", kind: "reference", attachedRules: [] });
    expect(report.omitted).toEqual([]);
    expect(report.unresolvedRequired).toEqual([]);
  });

  it("orders units L0 before L7 regardless of input order", () => {
    const report = compileContext(
      input({
        candidates: [
          candidate({ id: "late", layer: "L7", text: "archive" }),
          candidate({ id: "early", layer: "L0", text: "identity" }),
        ],
      }),
    );
    expect(report.units.map((u) => u.unitId)).toEqual(["early", "late"]);
  });

  it("is deterministic from scrambled input", () => {
    const candidates = [
      candidate({ id: "a", layer: "L5", priority: 2 }),
      candidate({ id: "b", layer: "L3", kind: "skill", priority: 5 }),
      candidate({ id: "c", layer: "L5", priority: 2 }),
    ];
    const forward = compileContext(input({ candidates }));
    const reversed = compileContext(input({ candidates: [...candidates].reverse() }));
    expect(JSON.stringify(forward)).toBe(JSON.stringify(reversed));
  });

  it("does not mutate caller candidates", () => {
    const candidates = [candidate({ id: "a" }), candidate({ id: "b" })];
    const snapshot = JSON.stringify(candidates);
    compileContext(input({ candidates }));
    expect(JSON.stringify(candidates)).toBe(snapshot);
  });
});

describe("compiler: rules into skills, explicitly", () => {
  it("attaches a rule with an explicit skillRef beneath its skill", () => {
    const report = compileContext(
      input({
        candidates: [
          candidate({ id: "skill-1", layer: "L3", kind: "skill", text: "skill body" }),
          candidate({ id: "rule-1", layer: "L1", kind: "rule", text: "follow the task", skillRef: "skill-1" }),
        ],
      }),
    );
    const skill = report.units.find((u) => u.unitId === "skill-1")!;
    expect(skill.attachedRules.map((r) => r.unitId)).toEqual(["rule-1"]);
    expect(report.units.some((u) => u.unitId === "rule-1")).toBe(false);
  });

  it("leaves a rule without skillRef in canonical flow", () => {
    const report = compileContext(
      input({
        candidates: [
          candidate({ id: "skill-1", layer: "L3", kind: "skill" }),
          candidate({ id: "rule-9", layer: "L1", kind: "rule", text: "floating rule" }),
        ],
      }),
    );
    expect(report.units.map((u) => u.unitId).sort()).toEqual(["rule-9", "skill-1"]);
  });

  it("leaves a rule naming an absent skill in flow rather than dropping it", () => {
    const report = compileContext(
      input({
        candidates: [candidate({ id: "rule-9", layer: "L1", kind: "rule", skillRef: "skill-ghost" })],
      }),
    );
    expect(report.units.map((u) => u.unitId)).toEqual(["rule-9"]);
  });
});

describe("compiler: dedup by identity, never by similarity", () => {
  it("collapses same sourceRef to one unit and records the duplicate", () => {
    const report = compileContext(
      input({
        candidates: [
          candidate({ id: "a", sourceRef: "doc:d1", priority: 1 }),
          candidate({ id: "b", sourceRef: "doc:d1", priority: 9 }),
        ],
      }),
    );
    expect(report.units.map((u) => u.unitId)).toEqual(["b"]);
    expect(report.omitted).toEqual([{ id: "a", reason: "DUPLICATE" }]);
  });

  it("keeps same text from different sources as two units", () => {
    const report = compileContext(
      input({
        candidates: [
          candidate({ id: "a", text: "same words", sourceRef: "doc:d1" }),
          candidate({ id: "b", text: "same words", sourceRef: "doc:d2" }),
        ],
      }),
    );
    expect(report.units).toHaveLength(2);
  });

  it("collapses identical text without sourceRefs", () => {
    const report = compileContext(
      input({
        candidates: [
          candidate({ id: "a", text: "same words" }),
          candidate({ id: "b", text: "same words" }),
        ],
      }),
    );
    expect(report.units).toHaveLength(1);
    expect(report.omitted).toEqual([{ id: "b", reason: "DUPLICATE" }]);
  });
});

describe("compiler: prioritization and required guarantees", () => {
  it("keeps higher priority first within a layer", () => {
    const report = compileContext(
      input({
        candidates: [
          candidate({ id: "low", priority: 1, text: "low text" }),
          candidate({ id: "high", priority: 99, text: "high text" }),
        ],
      }),
    );
    expect(report.units.map((u) => u.unitId)).toEqual(["high", "low"]);
  });

  it("breaks priority ties by id, never by insertion order", () => {
    const forward = compileContext(
      input({ candidates: [candidate({ id: "b", text: "b text" }), candidate({ id: "a", text: "a text" })] }),
    );
    expect(forward.units.map((u) => u.unitId)).toEqual(["a", "b"]);
  });

  it("rejects duplicate candidate ids", () => {
    expect(() => compileContext(input({ candidates: [candidate({ id: "x" }), candidate({ id: "x" })] }))).toThrowError(
      expect.objectContaining({ code: "COMPILER_DUPLICATE_ID" }),
    );
  });

  it("rejects non-finite priorities", () => {
    for (const priority of [Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => compileContext(input({ candidates: [candidate({ priority })] }))).toThrowError(
        expect.objectContaining({ code: "COMPILER_BAD_PRIORITY" }),
      );
    }
  });
});

describe("compiler: budget enforcement with a real runtime", () => {
  it("drops the lowest-priority optional unit to fit", () => {
    // Serialization overhead dominates: the keep-unit alone serializes to
    // ~150 chars, so the limit must clear that but not both units (~390).
    const big = "x".repeat(90);
    const report = compileContext(
      input({
        candidates: [
          candidate({ id: "keep", text: "tiny", priority: 10 }),
          candidate({ id: "drop", text: big, priority: 1 }),
        ],
        budget: { advertisedLimit: 300, tokenizer: TEST_RUNTIME },
      }),
    );
    expect(report.status).toBe("COMPILED");
    expect(report.units.map((u) => u.unitId)).toEqual(["keep"]);
    expect(report.omitted).toEqual([{ id: "drop", reason: "OVER_BUDGET" }]);
    expect(report.budget.status).toBe("FITS");
  });

  it("never displaces a required unit for an optional one", () => {
    const big = "x".repeat(90);
    const report = compileContext(
      input({
        candidates: [
          candidate({ id: "req", text: "tiny", required: true, priority: 0 }),
          candidate({ id: "opt", text: big, required: false, priority: 100 }),
        ],
        budget: { advertisedLimit: 100, tokenizer: TEST_RUNTIME },
      }),
    );
    expect(report.units.map((u) => u.unitId)).toEqual(["req"]);
    expect(report.omitted).toEqual([{ id: "opt", reason: "OVER_BUDGET" }]);
  });

  it("reports OVER_BUDGET with unresolved required ids when required alone exceeds", () => {
    const report = compileContext(
      input({
        candidates: [candidate({ id: "req-big", text: "x".repeat(200), required: true })],
        budget: { advertisedLimit: 50, tokenizer: TEST_RUNTIME },
      }),
    );
    expect(report.status).toBe("OVER_BUDGET");
    expect(report.unresolvedRequired).toEqual(["req-big"]);
  });

  it("respects the output reserve in enforcement", () => {
    const report = compileContext(
      input({
        candidates: [candidate({ text: "x".repeat(80), required: true })],
        budget: { advertisedLimit: 100, outputReserve: 30, tokenizer: TEST_RUNTIME },
      }),
    );
    expect(report.status).toBe("OVER_BUDGET");
    expect(report.unresolvedRequired).toEqual(["c1"]);
  });

  it("dropping every optional still counts as compiled, with omissions listed", () => {
    const report = compileContext(
      input({
        candidates: [candidate({ text: "x".repeat(80) })],
        budget: { advertisedLimit: 100, outputReserve: 30, tokenizer: TEST_RUNTIME },
      }),
    );
    expect(report.status).toBe("COMPILED");
    expect(report.units).toEqual([]);
    expect(report.omitted).toEqual([{ id: "c1", reason: "OVER_BUDGET" }]);
  });
});

describe("compiler: unknown token cost is unavailable, never zero", () => {
  it("compiles without a tokenizer but marks budget UNAVAILABLE", () => {
    const report = compileContext(input({ budget: { advertisedLimit: 100000, tokenizer: null } }));
    expect(report.status).toBe("COMPILED");
    expect(report.units).toHaveLength(1);
    expect(report.budget.status).toBe("UNAVAILABLE");
  });

  it("does not assert zero token counts when measurement is absent", () => {
    const report = compileContext(input({ budget: { advertisedLimit: 100000 } }));
    expect(report.budget.rawLayerTotal).toBe(0);
    expect(report.budget.layers).toEqual([]);
    expect(report.budget.reasons.join(" ")).toContain("UNAVAILABLE");
  });
});

describe("compiler: provenance and epistemic status survive", () => {
  it("carries sourceRef, provenance, and epistemic status through", () => {
    const report = compileContext(
      input({
        candidates: [
          candidate({ sourceRef: "claim:CLM-x", provenance: "mat-claims", epistemicStatus: "HYPOTHESIS" }),
        ],
      }),
    );
    expect(report.units[0]).toMatchObject({
      sourceRef: "claim:CLM-x",
      provenance: "mat-claims",
      epistemicStatus: "HYPOTHESIS",
    });
  });
});

describe("compiler: adapter from resolved layers", () => {
  it("projects skill hits as skill candidates with skill refs", () => {
    const candidates = candidatesFromLayers([
      { layer: "L3", name: "skill", status: "LOADED", items: [{ skillId: "sk-1", version: "1.0.0", score: 9 }], truncated: false, reason: "r" },
    ]);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ layer: "L3", kind: "skill", sourceRef: "skill:sk-1", provenance: "context-layers:L3" });
  });

  it("projects docs, files, and tasks with explicit source refs", () => {
    const candidates = candidatesFromLayers([
      { layer: "L6", name: "doc", status: "LOADED", items: [{ docId: "d1", title: "t", preview: "p" }], truncated: false, reason: "r" },
      { layer: "L5", name: "file", status: "LOADED", items: [{ path: "a.ts", preview: "p" }], truncated: false, reason: "r" },
    ]);
    expect(candidates.map((c) => c.sourceRef).sort()).toEqual(["doc:d1", "file:a.ts"]);
  });

  it("skips empty layers and rejects unknown layers and malformed items", () => {
    expect(candidatesFromLayers([])).toEqual([]);
    expect(() => candidatesFromLayers([{ layer: "L9", items: [] } as never])).toThrowError(
      expect.objectContaining({ code: "COMPILER_UNKNOWN_LAYER" }),
    );
    expect(() =>
      candidatesFromLayers([{ layer: "L6", name: "doc", status: "LOADED", items: [42], truncated: false, reason: "r" }]),
    ).toThrowError(expect.objectContaining({ code: "COMPILER_INVALID_INPUT" }));
  });
});

describe("compiler: strict validation with security precedence", () => {
  it("rejects authority, secret, and persona keys with their own codes", () => {
    expect(() => compileContext({ ...input(), authorized: true } as never)).toThrowError(
      expect.objectContaining({ code: "COMPILER_AUTHORITY_REJECTED" }),
    );
    expect(() => compileContext(input({ candidates: [{ ...candidate(), token: "t" } as never] }))).toThrowError(
      expect.objectContaining({ code: "COMPILER_SECRET_REJECTED" }),
    );
    expect(() => compileContext(input({ candidates: [{ ...candidate(), persona: "p" } as never] }))).toThrowError(
      expect.objectContaining({ code: "COMPILER_PERSONALITY_REJECTED" }),
    );
  });

  it("rejects unknown fields and bad layers", () => {
    expect(() => compileContext({ ...input(), urgency: 1 } as never)).toThrowError(
      expect.objectContaining({ code: "COMPILER_UNKNOWN_FIELD" }),
    );
    expect(() => compileContext(input({ candidates: [candidate({ layer: "L9" as never })] }))).toThrowError(
      expect.objectContaining({ code: "COMPILER_UNKNOWN_LAYER" }),
    );
    expect(() => compileContext(input({ candidates: [candidate({ required: "yes" as never })] }))).toThrowError(
      expect.objectContaining({ code: "COMPILER_INVALID_INPUT" }),
    );
  });

  it("rejects empty taskId and provenance", () => {
    expect(() => compileContext(input({ taskId: "" }))).toThrowError(
      expect.objectContaining({ code: "COMPILER_INVALID_INPUT" }),
    );
    expect(() => compileContext(input({ provenance: "" }))).toThrowError(
      expect.objectContaining({ code: "COMPILER_INVALID_INPUT" }),
    );
  });
});

describe("compiler: what it does not do", () => {
  it("exposes no model, retrieval, memory, or execution surface", async () => {
    const module = await import("./compiler");
    const names = Object.keys(module);
    expect(names.sort()).toEqual(
      ["CompilerError", "candidatesFromLayers", "compileContext"].sort(),
    );
    for (const banned of ["invoke", "model", "retrie", "search", "embed", "memory", "store", "spawn", "execut", "fetch", "http", "tokeniz"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("emits no verdict, score, rank, or completeness flag", () => {
    const report = compileContext(input()) as unknown as Record<string, unknown>;
    for (const banned of ["verdict", "score", "rank", "complete", "winner", "approved"]) {
      expect(Object.keys(report)).not.toContain(banned);
    }
  });
});
