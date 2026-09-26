import { describe, expect, it } from "vitest";
import {
  COORDINATION_LANES,
  CoordinationError,
  LANE_OWNERS,
  LINK_STATES,
  assemble,
  createCoordinationState,
  linkLane,
} from "./orchestrator";
import type { CoordinationLane, CoordinationState, LinkInput } from "./orchestrator";

/** Dimension-specific fixtures: each declares its own fields explicitly. */
function link(lane: CoordinationLane, over: Partial<LinkInput> = {}): LinkInput {
  return { lane, ref: `ref:${lane.toLowerCase()}`, provenance: "genesis planning session 2026-09-26", ...over };
}

function state(...links: LinkInput[]): CoordinationState {
  return links.reduce((acc, input) => linkLane(acc, input), createCoordinationState());
}

describe("orchestrator: registered lanes and owners", () => {
  it("declares exactly the registered coordination elements", () => {
    expect([...COORDINATION_LANES]).toEqual([
      "GOALS",
      "REQUIREMENT_GRAPH",
      "TASK_GRAPH",
      "WORKER_REGISTRY",
      "WORKTREE_REGISTRY",
      "TOUCH_SETS",
      "BUDGETS",
      "ATTENTION",
      "INTEGRATION_GRAPH",
      "ARTIFACT_GRAPH",
      "EVIDENCE_GRAPH",
      "PROJECT_MEMORY",
      "RECOVERY",
    ]);
  });

  it("declares a canonical owner for every lane", () => {
    for (const lane of COORDINATION_LANES) {
      expect(typeof LANE_OWNERS[lane]).toBe("string");
      expect(LANE_OWNERS[lane].length).toBeGreaterThan(0);
    }
  });

  it("declares a lane with no established owner as UNASSIGNED rather than guessing one", () => {
    expect(LANE_OWNERS.ATTENTION).toBe("UNASSIGNED");
  });

  it("points the task graph at Bridge task_dag, which is not in this repository", () => {
    expect(LANE_OWNERS.TASK_GRAPH).toBe("agent-bridge:task_dag");
  });

  it("records the owner-gated memory boundary as its project's owner", () => {
    expect(LANE_OWNERS.PROJECT_MEMORY).toContain("OWNER_GATED");
  });

  it("declares the three link states", () => {
    expect([...LINK_STATES]).toEqual(["LINKED", "GATED", "UNLINKED"]);
  });
});

describe("orchestrator: composition of references", () => {
  it("links a lane to its declared owner", () => {
    const linked = state(link("EVIDENCE_GRAPH"));
    expect(linked.links).toHaveLength(1);
    expect(linked.links[0]!.owner).toBe("src/programme/evidenceGraph.ts");
    expect(linked.links[0]!.state).toBe("LINKED");
  });

  it("stores a reference rather than any content", () => {
    const linked = state(link("TOUCH_SETS"));
    expect(Object.keys(linked.links[0]!).sort()).toEqual(["lane", "owner", "provenance", "ref", "state"]);
  });

  it("refuses a ref that is embedded content rather than a reference", () => {
    for (const ref of ['{"paths":["a.ts"]}', "[1,2,3]", "{malformed"]) {
      expect(() => state(link("TOUCH_SETS", { ref }))).toThrowError(
        expect.objectContaining({ code: "COORDINATION_ENGINE_SURFACE_REJECTED" }),
      );
    }
  });

  it("refuses a lane with neither a ref nor a gate", () => {
    expect(() => state(link("GOALS", { ref: undefined }))).toThrowError(
      expect.objectContaining({ code: "COORDINATION_REF_REQUIRED" }),
    );
  });

  it("refuses a re-pointed owner", () => {
    expect(() => state(link("EVIDENCE_GRAPH", { owner: "src/programme/changeImpact.ts" }))).toThrowError(
      expect.objectContaining({ code: "COORDINATION_OWNER_REPOINTED" }),
    );
  });

  it("accepts a redundant owner that matches the declared one", () => {
    expect(() => state(link("EVIDENCE_GRAPH", { owner: "src/programme/evidenceGraph.ts" }))).not.toThrow();
  });

  it("refuses a duplicate lane link", () => {
    const linked = state(link("GOALS"));
    expect(() => linkLane(linked, link("GOALS"))).toThrowError(
      expect.objectContaining({ code: "COORDINATION_DUPLICATE_LINK" }),
    );
  });

  it("requires provenance on every link", () => {
    expect(() => state(link("GOALS", { provenance: "" }))).toThrowError(
      expect.objectContaining({ code: "COORDINATION_INVALID_INPUT" }),
    );
  });

  it("rejects unknown lanes, unknown fields and unknown state fields", () => {
    expect(() => state(link("VIBES" as CoordinationLane))).toThrowError(
      expect.objectContaining({ code: "COORDINATION_UNKNOWN_LANE" }),
    );
    expect(() => state({ ...link("GOALS"), priority: 1 } as never)).toThrowError(
      expect.objectContaining({ code: "COORDINATION_UNKNOWN_FIELD" }),
    );
    expect(() => linkLane({ links: [], cache: true } as never, link("GOALS"))).toThrowError(
      expect.objectContaining({ code: "COORDINATION_UNKNOWN_FIELD" }),
    );
  });
});

describe("orchestrator: registries never store permanent worker personalities", () => {
  it("refuses personality-shaped content on a worker registry link", () => {
    for (const key of ["personality", "persona", "traits", "backstory", "identity", "quirks", "preferences"]) {
      expect(() => state({ ...link("WORKER_REGISTRY"), [key]: "a careful reviewer" } as never)).toThrowError(
        expect.objectContaining({ code: "COORDINATION_PERSONALITY_REJECTED" }),
      );
    }
  });

  it("refuses autobiographical content specifically", () => {
    for (const key of ["autobiography", "autobiographical", "selfModel", "consciousness", "dna"]) {
      expect(() => state({ ...link("WORKER_REGISTRY"), [key]: "since 2024" } as never)).toThrowError(
        expect.objectContaining({ code: "COORDINATION_PERSONALITY_REJECTED" }),
      );
    }
  });

  it("finds personality content nested inside a link, not only at the top level", () => {
    expect(() =>
      state({
        ...link("WORKER_REGISTRY"),
        metadata: { nested: { deeper: { personality: "meticulous" } } },
      } as never),
    ).toThrowError(expect.objectContaining({ code: "COORDINATION_PERSONALITY_REJECTED" }));
  });

  it("finds personality content inside an array element", () => {
    expect(() =>
      state({ ...link("WORKER_REGISTRY"), tags: [{ name: "x" }, { persona: "y" }] } as never),
    ).toThrowError(expect.objectContaining({ code: "COORDINATION_PERSONALITY_REJECTED" }));
  });

  it("allows an ordinary reference that merely mentions a role", () => {
    expect(() => state(link("WORKER_REGISTRY", { ref: "ref:worker-profile-indexer" }))).not.toThrow();
  });

  it("asserts in the report that no personality is stored", () => {
    expect(assemble(state(link("WORKER_REGISTRY"))).storesWorkerPersonalities).toBe(false);
  });
});

describe("orchestrator: project memory is an owner decision", () => {
  it("requires a gate while the memory boundary is owner-gated", () => {
    expect(() => state(link("PROJECT_MEMORY", { ref: "ref:genesis-memory" }))).toThrowError(
      expect.objectContaining({ code: "COORDINATION_GATE_REQUIRED" }),
    );
  });

  it("records the blocked lane as gated with its gate reference", () => {
    const report = assemble(state(link("PROJECT_MEMORY", { ref: undefined, gateRef: "REQ-memory-integrity-boundary" })));
    const lane = report.lanes.find((entry) => entry.lane === "PROJECT_MEMORY")!;
    expect(lane.state).toBe("GATED");
    expect(lane.gateRef).toBe("REQ-memory-integrity-boundary");
    expect(lane.hasReference).toBe(false);
  });

  it("refuses an empty gate reference", () => {
    expect(() => state(link("PROJECT_MEMORY", { ref: undefined, gateRef: "" }))).toThrowError(
      expect.objectContaining({ code: "COORDINATION_GATE_REQUIRED" }),
    );
  });
});

describe("orchestrator: it is not a workflow engine", () => {
  it("asserts in the report that it executes nothing and copies nothing", () => {
    const report = assemble(state());
    expect(report.executesWorkflows).toBe(false);
    expect(report.copiesFragmentContent).toBe(false);
  });

  it("exposes no run, execute, step, schedule or dispatch surface", () => {
    const banned = ["run", "execute", "exec", "step", "schedule", "dispatch", "retry", "queue", "engine", "runner"];
    const instance = createCoordinationState() as unknown as Record<string, unknown>;
    for (const name of banned) expect(instance[name]).toBeUndefined();
  });

  it("exposes no goal, task, budget or evidence content constructor", () => {
    const banned = ["defineGoal", "addTask", "setBudget", "recordEvidence", "touch", "estimateTouchSet", "queryChangeImpact"];
    const instance = createCoordinationState() as unknown as Record<string, unknown>;
    for (const name of banned) expect(instance[name]).toBeUndefined();
  });
});

describe("orchestrator: assembly report", () => {
  it("reports every registered lane whether or not it is linked", () => {
    const report = assemble(state());
    expect(report.lanes).toHaveLength(COORDINATION_LANES.length);
    expect(report.linked).toBe(0);
    expect(report.unlinked).toEqual([...COORDINATION_LANES]);
  });

  it("names the owner for an unlinked lane rather than omitting the lane", () => {
    const lane = assemble(state()).lanes.find((entry) => entry.lane === "RECOVERY")!;
    expect(lane.owner).toBe("src/workflows/lifecycle.ts");
    expect(lane.state).toBe("UNLINKED");
    expect(lane.hasReference).toBe(false);
  });

  it("counts linked, gated and unlinked separately", () => {
    const report = assemble(
      state(
        link("EVIDENCE_GRAPH"),
        link("TOUCH_SETS"),
        link("PROJECT_MEMORY", { ref: undefined, gateRef: "REQ-memory-integrity-boundary" }),
      ),
    );
    expect(report.linked).toBe(2);
    expect(report.gated).toBe(1);
    expect(report.unlinked).toHaveLength(COORDINATION_LANES.length - 3);
  });

  it("keeps lanes in registered order regardless of link order", () => {
    const forward = assemble(state(link("GOALS"), link("RECOVERY"), link("BUDGETS")));
    const reversed = assemble(state(link("BUDGETS"), link("RECOVERY"), link("GOALS")));
    expect(forward.lanes.map((entry) => entry.lane)).toEqual([...COORDINATION_LANES]);
    expect(reversed.lanes.map((entry) => entry.lane)).toEqual([...COORDINATION_LANES]);
  });

  it("does not mutate the state it was given", () => {
    const base = state(link("GOALS"));
    const snapshot = JSON.stringify(base);
    linkLane(base, link("RECOVERY"));
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  it("rejects a malformed state", () => {
    expect(() => assemble({} as never)).toThrowError(CoordinationError);
    expect(() => assemble({ links: "none" } as never)).toThrowError(CoordinationError);
  });
});
