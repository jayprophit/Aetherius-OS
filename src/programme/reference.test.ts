import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ingestCandidate } from "./ingest";
import { buildMatrix, validateReferenceAudit, type ReferenceAudit } from "./reference";
import type { ProgrammeBundle, Requirement } from "./types";

function loadReal(): { bundle: ProgrammeBundle; requirements: Requirement[]; audit: ReferenceAudit } {
  const registryRoot = new URL("../../registry/", import.meta.url);
  const here = new URL("./", import.meta.url);
  const programme = JSON.parse(readFileSync(new URL("programme.json", registryRoot), "utf-8")) as ProgrammeBundle["programme"];
  const depgraph = JSON.parse(readFileSync(new URL("depgraph.json", registryRoot), "utf-8")) as ProgrammeBundle["depgraph"];
  const systems = JSON.parse(
    readFileSync(new URL("reference-systems.json", registryRoot), "utf-8"),
  ) as { systems: ReferenceAudit["systems"] };
  const capabilities = JSON.parse(
    readFileSync(new URL("reference-capabilities.json", registryRoot), "utf-8"),
  ) as { capabilities: ReferenceAudit["capabilities"] };
  const requirements = (
    JSON.parse(readFileSync(new URL("requirements.json", here), "utf-8")) as { requirements: Requirement[] }
  ).requirements;
  return {
    bundle: { programme, depgraph, requirements },
    requirements,
    audit: { systems: systems.systems, capabilities: capabilities.capabilities },
  };
}

function emptyAudit(): ReferenceAudit {
  return { systems: [], capabilities: [] };
}

describe("reference audit negatives", () => {
  it("rejects unknown system, duplicate ids and bad vocabularies", () => {
    const { bundle } = loadReal();
    const audit = loadReal().audit;
    const bad = {
      systems: [...audit.systems, ...audit.systems.filter((s) => s.id === "openclaw")],
      capabilities: audit.capabilities,
    };
    expect(validateReferenceAudit(bad, bundle).some((i) => i.code === "duplicate-system-id")).toBe(true);
    const badCap = {
      systems: audit.systems,
      capabilities: [
        ...audit.capabilities,
        {
          id: "openclaw.gateway",
          system: "openclaw",
          name: "dup",
          description: "dup",
          category: "x",
          security_notes: "y",
          our_status: "MISSING",
          reuse: "REFERENCE_ONLY",
          rationale: "z",
          evidence_refs: ["e"],
          requirement_ids: [],
          conflicts: [],
        },
      ],
    };
    expect(
      validateReferenceAudit(badCap as ReferenceAudit, bundle).some((i) => i.code === "duplicate-capability-id"),
    ).toBe(true);
    expect(
      validateReferenceAudit(
        { systems: [], capabilities: [{ ...audit.capabilities[0], system: "ghost" }] },
        bundle,
      ).some((i) => i.code === "unknown-system"),
    ).toBe(true);
  });
  it("rejects bad phase/project/reuse/status/requirement/conflict links", () => {
    const { bundle, audit } = loadReal();
    const base = audit.capabilities[0];
    const mutate = (over: Partial<typeof base>): ReferenceAudit => ({
      systems: audit.systems,
      capabilities: [{ ...base, id: "probe", ...over }],
    });
    expect(validateReferenceAudit(mutate({ owner_phase: "P99" }), bundle).some((i) => i.code === "unknown-phase")).toBe(true);
    expect(
      validateReferenceAudit(mutate({ owner_project: "ghost" }), bundle).some((i) => i.code === "unknown-project-owner"),
    ).toBe(true);
    expect(
      validateReferenceAudit(mutate({ reuse: "STEAL" as never }), bundle).some((i) => i.code === "invalid-reuse-class"),
    ).toBe(true);
    expect(
      validateReferenceAudit(mutate({ our_status: "DONE" as never }), bundle).some((i) => i.code === "invalid-implementation-status"),
    ).toBe(true);
    expect(
      validateReferenceAudit(mutate({ requirement_ids: ["GHOST"] }), bundle).some((i) => i.code === "dangling-requirement"),
    ).toBe(true);
    expect(
      validateReferenceAudit(mutate({ conflicts: ["probe"] }), bundle).some((i) => i.code === "self-conflict"),
    ).toBe(true);
    expect(
      validateReferenceAudit(mutate({ conflicts: ["GHOST"] }), bundle).some((i) => i.code === "dangling-conflict"),
    ).toBe(true);
    expect(
      validateReferenceAudit(mutate({ description: " ", rationale: " ", evidence_refs: [] }), bundle).some(
        (i) => i.code === "missing-source",
      ),
    ).toBe(true);
  });
  it("rejects unclear licences paired with strong reuse", () => {
    const { bundle, audit } = loadReal();
    const bad: ReferenceAudit = {
      systems: [{ ...audit.systems[0], license: "UNKNOWN", system_reuse: "DEPENDENCY" }],
      capabilities: [],
    };
    expect(validateReferenceAudit(bad, bundle).some((i) => i.code === "licence-not-cleared")).toBe(true);
    const ok: ReferenceAudit = {
      systems: [{ ...audit.systems[0], license: "UNKNOWN", system_reuse: "STUDY_ONLY" }],
      capabilities: [],
    };
    expect(validateReferenceAudit(ok, bundle).some((i) => i.code === "licence-not-cleared")).toBe(false);
  });
  it("accepts an empty audit without crashing", () => {
    const { bundle } = loadReal();
    expect(validateReferenceAudit(emptyAudit(), bundle)).toEqual([]);
  });
});

describe("real reference audit", () => {
  it("all eight systems present with pinned sources and licences", () => {
    const { audit } = loadReal();
    const ids = audit.systems.map((s) => s.id).sort();
    expect(ids).toEqual([
      "clawhub", "clawsweeper", "clickclack", "crabbox", "crabfleet", "lobster", "octopool", "openclaw",
    ]);
    for (const system of audit.systems) {
      expect(system.repo).toContain("github.com/openclaw/");
      expect(system.branch).toBe("main");
      expect(system.license).toBe("MIT");
      expect(system.system_reuse).toBe("STUDY_ONLY");
    }
  });
  it("validates clean against programme truth", () => {
    const { bundle, audit } = loadReal();
    const issues = validateReferenceAudit(audit, bundle);
    expect(issues).toEqual([]);
  });
  it("matrix is deterministic and honest", () => {
    const { audit } = loadReal();
    const first = JSON.stringify(buildMatrix(audit));
    const second = JSON.stringify(buildMatrix(audit));
    expect(first).toBe(second);
    const rows = buildMatrix(audit);
    expect(rows.length).toBe(audit.capabilities.length);
    // Spot-check grounded verdicts.
    const byId = new Map(rows.map((r) => [r.capability, r]));
    expect(byId.get("lobster.approval-gates")?.aetherius).toBe("SUPPORTED");
    expect(byId.get("crabfleet.remote-desktop")?.aetherius).toBe("NOT_PRESENT");
    expect(byId.get("crabfleet.remote-desktop")?.owner).toBe("agent-bridge/P21");
    expect(byId.get("octopool.relay-cache")?.owner).toBe("aetherius-os/P30");
  });
  it("ingestion interplay: equivalent discoveries merge, new ones create", () => {
    const { requirements } = loadReal();
    const dup = ingestCandidate(requirements, {
      title: "Governed remote-desktop adapter",
      description: "VNC-class remote desktop reach with authenticated transport, scoped clipboard/file transfer and saved-endpoint registry using vault references.",
      source: { class: "OPEN_SOURCE_REF", ref: "https://github.com/openclaw/crabfleet" },
      owner: "agent-bridge",
      phase: "P21",
      priority: 2,
      provenance: "probe",
    });
    expect(["EXACT_DUPLICATE", "LIKELY_DUPLICATE", "RELATED"].includes(dup.relation)).toBe(true);
    const fresh = ingestCandidate(requirements, {
      title: "Quantum entanglement bus for instantaneous sync",
      description: "Entirely novel fictional transport with no programme counterpart.",
      source: { class: "RESEARCH_NOTE", ref: "probe" },
      owner: "aetherius-os",
      phase: "P30",
      priority: 1,
      provenance: "probe",
    });
    // No merge into an unrelated requirement, whatever the adjacency call.
    expect(fresh.merged_into).toBeNull();
  });
});
