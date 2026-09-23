import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { bootstrapReference } from "../genesis/identity";
import { FileStateStore } from "../state/store";
import type { StateEnvelope } from "../state/types";
import { SkillRegistry } from "../workflows/skills";
import type { Skill } from "../workflows/types";
import { LAYER_SPECS, resolveLayers } from "./layers";

function skill(id: string): Skill {
  return {
    skill_id: id, version: "1.0.0", name: id, description: `${id} helper`, capability: "review code",
    inputs: [], outputs: [], required_capabilities: [], required_permissions: [],
    required_tools: [], supported_platforms: ["*"], execution_kind: "test",
    implementation_ref: `test:${id}`, risk_class: "low", provenance: "fixture", status: "REGISTERED",
  };
}

const enc = (s: string): Uint8Array => new TextEncoder().encode(s);

describe("context layers", () => {
  it("declares eight layers over existing stores, memory unbound", () => {
    expect(LAYER_SPECS.map((s) => s.layer)).toEqual(["L0", "L1", "L2", "L3", "L4", "L5", "L6", "L7"]);
    expect(LAYER_SPECS.filter((s) => s.backing === "UNBOUND").map((s) => s.layer)).toEqual(["L4"]);
  });

  it("loads bound layers from provided stores", () => {
    const skills = new SkillRegistry();
    skills.register(skill("review"));
    const results = resolveLayers(
      { include: ["L0", "L1", "L2", "L3", "L5", "L6"] },
      {
        identity: bootstrapReference("genesis-prime", "fixture"),
        task: { taskId: "t1", state: "RUNNING" },
        project: { projectId: "p1", policy: "AUTO_SAFE" },
        skills,
        skillQuery: "review",
        files: new Map([["a.txt", enc("hello")]]),
        docs: [{ docId: "d1", title: "Guide", text: "read me" }],
      },
    );
    expect(results.every((r) => r.status === "LOADED")).toBe(true);
    expect(results.find((r) => r.layer === "L0")!.items).toEqual([{ genesisId: "genesis-prime" }]);
    expect(results.find((r) => r.layer === "L1")!.items).toEqual([{ taskId: "t1", state: "RUNNING" }]);
    expect(results.find((r) => r.layer === "L3")!.items[0]).toMatchObject({ skillId: "review" });
    expect(results.find((r) => r.layer === "L5")!.items).toEqual([{ path: "a.txt", preview: "hello" }]);
  });

  it("skips layers without backing data instead of fabricating", () => {
    const results = resolveLayers({ include: ["L0", "L1", "L2", "L3", "L5", "L6", "L7"] }, {});
    expect(results.every((r) => r.status === "SKIPPED" && r.items.length === 0)).toBe(true);
    const memory = resolveLayers({ include: ["L4"] }, {});
    expect(memory[0]!.status).toBe("UNBOUND");
    expect(memory[0]!.reason).toContain("Agent Bridge memory");
  });

  it("withholds secret payloads in the archive layer", () => {
    const root = mkdtempSync(join(tmpdir(), "ctx-"));
    const store = new FileStateStore(root, 1);
    const publicEnv: StateEnvelope<{ v: number }> = {
      id: "report-1", kind: "report", schemaVersion: 1, recordVersion: 1,
      createdAt: "2026-09-23T00:00:00.000Z", updatedAt: "2026-09-23T00:00:00.000Z",
      owner: "aetherius-os", provenance: "fixture", sensitivity: "USER",
      integrity: "", payload: { v: 1 },
    };
    const secretEnv: StateEnvelope<{ ref: string }> = {
      ...publicEnv, id: "cred-1", kind: "credential", sensitivity: "SECRET_REFERENCE", payload: { ref: "vault://x" },
    };
    store.save(publicEnv);
    store.save(secretEnv);
    const [result] = resolveLayers({ include: ["L7"] }, { state: store });
    expect(result!.status).toBe("LOADED");
    expect(result!.items).toContainEqual({ id: "report-1", kind: "report", owner: "aetherius-os" });
    expect(result!.items).toContainEqual({
      id: "cred-1", kind: "credential", owner: "aetherius-os", payload: "[withheld: secret reference]",
    });
    expect(JSON.stringify(result)).not.toContain("vault://x");
  });

  it("enforces budgets with explicit truncation flags", () => {
    const files = new Map([["b.txt", enc("2")], ["a.txt", enc("1")], ["c.txt", enc("3")]]);
    const [result] = resolveLayers({ include: ["L5"], maxItemsPerLayer: 2 }, { files });
    expect(result!.items.map((i) => (i as { path: string }).path)).toEqual(["a.txt", "b.txt"]);
    expect(result!.truncated).toBe(true);
    const [full] = resolveLayers({ include: ["L5"] }, { files });
    expect(full!.truncated).toBe(false);
  });

  it("rejects unknown, duplicate and unbounded requests", () => {
    expect(() => resolveLayers({ include: ["L9" as never] }, {})).toThrowError(/unknown context layer/);
    expect(() => resolveLayers({ include: ["L0", "L0"] }, {})).toThrowError(/duplicate/);
    expect(() => resolveLayers({ include: ["L0"], maxItemsPerLayer: 0 }, {})).toThrowError(/positive integer/);
  });
});
