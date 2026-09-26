import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ingestCandidate, type RequirementCandidate } from "./ingest";
import { formatSelection, selectNextTask } from "./select";
import type { ProgrammeBundle, Requirement } from "./types";
import { validateProgramme } from "./validate";

function req(over: Partial<Requirement> & { id: string }): Requirement {
  return {
    title: `title ${over.id}`,
    description: `description ${over.id}`,
    source: { class: "BUILD_TODO", ref: "test" },
    owner: "aetherius-os",
    phase: "P16",
    status: "RESEARCH",
    priority: 3,
    depends_on: [],
    blockers: [],
    evidence: ["test-evidence"],
    provenance: "synthetic fixture",
    owner_gate: false,
    work_state: "READY",
    ...over,
  };
}

function bundle(reqs: Requirement[], patch?: Partial<ProgrammeBundle>): ProgrammeBundle {
  const ids = ["P0","P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12","P13","P14","P15",
    "P16","P17","P18","P19","P20","P21","P22","P23","P24","P25","P26","P27","P28","P29","P30","P31"];
  return {
    programme: {
      phases: ids.map((id) => ({ id, name: id, status: "x" })),
      projects: [
        { id: "aetherius-os", path: "Aetherius-OS", role: "os" },
        { id: "agent-bridge", path: "Agent-Bridge", role: "bridge" },
      ],
      placements: { RefA: ["P16"] },
    },
    depgraph: {
      nodes: [{ id: "aetherius-os" }, { id: "agent-bridge" }, { id: "external:ollama" }],
      edges: [{ from: "agent-bridge", to: "aetherius-os", type: "integration", evidence: "t" }],
    },
    requirements: reqs,
    ...patch,
  };
}

describe("validator negatives", () => {
  it("flags duplicate requirement ids", () => {
    const issues = validateProgramme(bundle([req({ id: "A" }), req({ id: "A" })]));
    expect(issues.some((i) => i.code === "duplicate-requirement-id")).toBe(true);
  });
  it("flags unknown phase", () => {
    const issues = validateProgramme(bundle([req({ id: "A", phase: "P99" })]));
    expect(issues.some((i) => i.code === "unknown-phase")).toBe(true);
  });
  it("flags unknown project owner", () => {
    const issues = validateProgramme(bundle([req({ id: "A", owner: "nope" })]));
    expect(issues.some((i) => i.code === "unknown-project-owner")).toBe(true);
  });
  it("flags external runtime ownership", () => {
    const issues = validateProgramme(bundle([req({ id: "A", owner: "external:ollama" })]));
    expect(issues.some((i) => i.code === "external-owner")).toBe(true);
  });
  it("flags unknown + self dependencies", () => {
    const issues = validateProgramme(
      bundle([req({ id: "A", depends_on: ["GHOST"] }), req({ id: "B", depends_on: ["B"] })]),
    );
    expect(issues.some((i) => i.code === "unknown-dependency")).toBe(true);
    expect(issues.some((i) => i.code === "self-dependency")).toBe(true);
  });
  it("flags dependency cycles", () => {
    const issues = validateProgramme(
      bundle([req({ id: "A", depends_on: ["B"] }), req({ id: "B", depends_on: ["A"] })]),
    );
    expect(issues.some((i) => i.code === "dependency-cycle")).toBe(true);
  });
  it("flags invalid status/priority/work_state", () => {
    const bad = req({ id: "A" });
    (bad as unknown as Record<string, unknown>).status = "DONE";
    (bad as unknown as Record<string, unknown>).priority = 9;
    (bad as unknown as Record<string, unknown>).work_state = "WAITING";
    const issues = validateProgramme(bundle([bad]));
    expect(issues.some((i) => i.code === "invalid-status")).toBe(true);
    expect(issues.some((i) => i.code === "invalid-priority")).toBe(true);
    expect(issues.some((i) => i.code === "invalid-work-state")).toBe(true);
  });
  it("flags orphan placement + bad supersedes + malformed evidence", () => {
    const bad = req({ id: "A", supersedes: ["GHOST"], evidence: [""] });
    const b = bundle([bad], {
      programme: {
        phases: [{ id: "P16", name: "x", status: "y" }],
        projects: [{ id: "aetherius-os", path: "x", role: "y" }],
        placements: { RefA: ["P99"] },
      },
    });
    const issues = validateProgramme(b);
    for (const code of ["orphan-placement", "invalid-supersedes-reference", "malformed-evidence", "missing-phase"]) {
      expect(issues.some((i) => i.code === code)).toBe(true);
    }
  });
  it("flags duplicate phases, self-loop and unknown dep nodes", () => {
    const b = bundle([req({ id: "A" })], {
      programme: {
        phases: [{ id: "P0", name: "x", status: "y" }, { id: "P0", name: "x", status: "y" }],
        projects: [{ id: "aetherius-os", path: "x", role: "y" }],
        placements: {},
      },
      depgraph: {
        nodes: [{ id: "aetherius-os" }],
        edges: [
          { from: "aetherius-os", to: "aetherius-os", type: "t" },
          { from: "aetherius-os", to: "ghost", type: "t" },
        ],
      },
    });
    const issues = validateProgramme(b);
    for (const code of ["duplicate-phase-id", "self-loop", "unknown-dependency"]) {
      expect(issues.some((i) => i.code === code)).toBe(true);
    }
  });
  it("passes a clean synthetic bundle", () => {
    expect(validateProgramme(bundle([req({ id: "A" }), req({ id: "B", depends_on: ["A"] })]))).toEqual([]);
  });
});

describe("ingestion", () => {
  const cand = (title: string): RequirementCandidate => ({
    title, description: "does a thing", source: { class: "HANDOFF", ref: "h" },
    owner: "aetherius-os", phase: "P16", priority: 3, provenance: "t",
  });
  it("merges exact duplicates and links sources", () => {
    const base = [req({ id: "A", title: "Do a thing", description: "does a thing" })];
    const out = ingestCandidate(base, { ...cand("Do   a thing"), source: { class: "CHAT_HISTORY", ref: "c" } });
    expect(out.relation).toBe("EXACT_DUPLICATE");
    expect(out.merged_into).toBe("A");
    expect(out.requirement.also_from?.length).toBe(1);
  });
  it("flags likely duplicates without merging", () => {
    const base = [req({ id: "A", title: "Do a thing", description: "different words here" })];
    const out = ingestCandidate(base, cand("Do a thing"));
    expect(out.relation).toBe("LIKELY_DUPLICATE");
    expect(out.requirement.duplicates).toContain("A");
  });
  it("creates independent requirements with deterministic ids", () => {
    const a = ingestCandidate([], cand("Fresh idea"));
    const b = ingestCandidate([], cand("Fresh idea"));
    expect(a.relation).toBe("INDEPENDENT");
    expect(a.requirement.id).toBe(b.requirement.id);
    expect(a.requirement.id).toMatch(/^REQ-fresh-idea-001$/);
  });
  it("records supersedes links", () => {
    const base = [req({ id: "OLD" })];
    const out = ingestCandidate(base, { ...cand("New approach"), supersedes: ["OLD"] });
    expect(out.relation).toBe("SUPERSEDED");
    expect(out.requirement.supersedes).toEqual(["OLD"]);
  });
  it("rejects empty titles", () => {
    const out = ingestCandidate([], cand("   "));
    expect(out.diagnostics.length).toBeGreaterThan(0);
  });
});

describe("selector", () => {
  it("selects the single ready task", () => {
    const r = selectNextTask(bundle([req({ id: "A" })]));
    expect(r.selected_task).toBe("A");
    expect(r.dependencies_satisfied).toBe(true);
  });
  it("prefers explicit priority over recency", () => {
    const r = selectNextTask(bundle([req({ id: "LOW", priority: 1 }), req({ id: "HIGH", priority: 5 })]));
    expect(r.selected_task).toBe("HIGH");
  });
  it("breaks equal-priority ties by unblocking value, phase, id", () => {
    const b = bundle([
      req({ id: "ZED", priority: 3, phase: "P18" }),
      req({ id: "ABC", priority: 3, phase: "P18" }),
      req({ id: "KID", priority: 3, phase: "P18", depends_on: ["ZED"], work_state: "BLOCKED", blockers: ["x"] }),
    ]);
    // ZED unblocks KID; ABC unblocks nothing → ZED wins despite later id.
    expect(selectNextTask(b).selected_task).toBe("ZED");
    const c = bundle([req({ id: "ZED", priority: 3, phase: "P18" }), req({ id: "ABC", priority: 3, phase: "P17" })]);
    expect(selectNextTask(c).selected_task).toBe("ABC");
  });
  it("skips blocked, owner-gated, complete and deferred tasks", () => {
    const r = selectNextTask(
      bundle([
        req({ id: "B", priority: 5, work_state: "BLOCKED", blockers: ["db down"] }),
        req({ id: "G", priority: 5, work_state: "OWNER_GATED", owner_gate: true }),
        req({ id: "C", priority: 5, work_state: "COMPLETE" }),
        req({ id: "D", priority: 5, work_state: "DEFERRED" }),
        req({ id: "P", priority: 5, work_state: "IN_PROGRESS" }),
        req({ id: "OK", priority: 1 }),
      ]),
    );
    expect(r.selected_task).toBe("OK");
  });
  it("waits on incomplete dependencies", () => {
    const r = selectNextTask(
      bundle([req({ id: "A", work_state: "READY" }), req({ id: "B", depends_on: ["A"], priority: 5 })]),
    );
    expect(r.selected_task).toBe("A");
  });
  it("reports null with reasons when nothing is executable", () => {
    const allDone = selectNextTask(bundle([req({ id: "A", work_state: "COMPLETE" })]));
    expect(allDone.selected_task).toBeNull();
    expect(allDone.reason).toContain("COMPLETE");
    const allBlocked = selectNextTask(bundle([req({ id: "A", work_state: "BLOCKED", blockers: ["x"] })]));
    expect(allBlocked.selected_task).toBeNull();
    expect(formatSelection(allBlocked)).toContain("none");
  });
  it("is repeatable: same state yields same task", () => {
    const b = bundle([
      req({ id: "M", priority: 3 }), req({ id: "N", priority: 3 }),
      req({ id: "O", priority: 4, depends_on: ["M"] }),
    ]);
    const first = selectNextTask(b).selected_task;
    for (let i = 0; i < 5; i++) expect(selectNextTask(b).selected_task).toBe(first);
  });
  it("formats human output", () => {
    const r = selectNextTask(bundle([req({ id: "A", phase: "P16" })]));
    const text = formatSelection(r);
    expect(text).toContain("NEXT_EXECUTABLE_TODO: A");
    expect(text).toContain("PHASE: P16");
  });
});

describe("real registries", () => {
  function loadReal(): ProgrammeBundle {
    const registryRoot = new URL("../../registry/", import.meta.url);
    const here = new URL("./", import.meta.url);
    const programme = JSON.parse(readFileSync(new URL("programme.json", registryRoot), "utf-8")) as ProgrammeBundle["programme"];
    const depgraph = JSON.parse(readFileSync(new URL("depgraph.json", registryRoot), "utf-8")) as ProgrammeBundle["depgraph"];
    const requirements = (
      JSON.parse(readFileSync(new URL("requirements.json", here), "utf-8")) as {
        requirements: Requirement[];
      }
    ).requirements;
    return { programme, depgraph, requirements };
  }
  it("real registries validate clean", () => {
    expect(validateProgramme(loadReal())).toEqual([]);
  });
  it("real registry advances: training compute lifecycle proven yields P19 benchmark contamination", () => {
    const real = loadReal();
    const r = selectNextTask(real);
    // Training-compute-lifecycle COMPLETE is skipped, and P18 has no further
    // executable work, so P19 becomes the earliest eligible phase.
    expect(r.selected_task).toBe("REQ-p19-benchmark-contamination");
    expect(r.phase).toBe("P19");
    expect(formatSelection(r)).toContain("NEXT_EXECUTABLE_TODO: REQ-p19-benchmark-contamination");
  });

});
