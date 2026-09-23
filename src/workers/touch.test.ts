import { describe, expect, it } from "vitest";
import { SkillRegistry } from "../workflows/skills";
import { buildPackage } from "../workflows/packages";
import type { Skill } from "../workflows/types";
import { estimateTouchSet } from "./touch";

const enc = (s: string): Uint8Array => new TextEncoder().encode(s);

function skill(id: string): Skill {
  return {
    skill_id: id, version: "1.0.0", name: id, description: id, capability: "c",
    inputs: [], outputs: [], required_capabilities: [], required_permissions: [],
    required_tools: [], supported_platforms: ["*"], execution_kind: "test",
    implementation_ref: `test:${id}`, risk_class: "low", provenance: "fixture", status: "REGISTERED",
  };
}

describe("expected touch sets", () => {
  it("unions evidenced sources with provenance, sorted and deduped", () => {
    const result = estimateTouchSet({
      declaredFiles: ["src/a.ts", "src/b.ts", "src/a.ts"],
      workflowFiles: ["src/b.ts", "tests/a.test.ts"],
      taskType: "review",
      history: new Map([["review", ["docs/note.md", "src/a.ts"]]]),
    });
    expect(result.paths).toEqual(["docs/note.md", "src/a.ts", "src/b.ts", "tests/a.test.ts"]);
    expect(result.sources.find((s) => s.path === "src/a.ts")!.source).toBe("declared");
    expect(result.sources.find((s) => s.path === "docs/note.md")!.source).toBe("history:review");
    expect(result.unknown).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it("expands skill refs through registry and package manifests", () => {
    const skills = new SkillRegistry();
    skills.register(skill("review"));
    const manifest = buildPackage(skills.lookup("review")!, new Map([["SKILL.md", enc("# r")]]));
    const result = estimateTouchSet({
      skills,
      skillRefs: ["skill:review@1.0.0"],
      packages: new Map([["review@1.0.0", manifest]]),
    });
    expect(result.paths).toEqual(["SKILL.md"]);
    expect(result.sources).toEqual([{ path: "SKILL.md", source: "package:review@1.0.0" }]);
  });

  it("reports unknowns instead of guessing", () => {
    const skills = new SkillRegistry();
    const result = estimateTouchSet({
      skills,
      skillRefs: ["skill:ghost@1.0.0", "not a ref!!!"],
      taskType: "novel",
      history: new Map(),
    });
    expect(result.paths).toEqual([]);
    expect(result.unknown).toEqual(
      expect.arrayContaining([
        expect.stringContaining("unresolvable skill"),
        expect.stringContaining("unparseable skill ref"),
        expect.stringContaining("no history for task type novel"),
      ]),
    );
    const noRegistry = estimateTouchSet({ skillRefs: ["review"] });
    expect(noRegistry.unknown).toEqual(expect.arrayContaining([expect.stringContaining("no registry")]));
    skills.register(skill("review"));
    const noManifest = estimateTouchSet({ skills, skillRefs: ["review"] });
    expect(noManifest.unknown).toEqual(expect.arrayContaining([expect.stringContaining("no package manifest")]));
  });

  it("excludes unsafe paths and reports them", () => {
    const result = estimateTouchSet({
      declaredFiles: ["../escape", "/abs", "ok/file.txt", "  "],
    });
    expect(result.paths).toEqual(["ok/file.txt"]);
    expect(result.invalid).toHaveLength(3);
    expect(result.invalid.join("\n")).toContain("unsafe or empty path");
  });

  it("empty input estimates nothing honestly", () => {
    expect(estimateTouchSet({})).toEqual({ paths: [], sources: [], unknown: [], invalid: [] });
  });
});
