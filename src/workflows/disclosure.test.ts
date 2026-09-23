import { describe, expect, it } from "vitest";
import { SkillRegistry } from "./skills";
import { buildPackage } from "./packages";
import type { SkillPackageManifest } from "./packages";
import type { Skill } from "./types";
import { discloseSkill } from "./disclosure";

function skill(over: Partial<Skill> = {}): Skill {
  return {
    skill_id: "review", version: "2.0.0", name: "Review", description: "Review pull requests",
    capability: "code-review", inputs: ["diff"], outputs: ["report_id"],
    required_capabilities: ["read"], required_permissions: ["fs.read"], required_tools: ["git"],
    supported_platforms: ["*"], execution_kind: "test", implementation_ref: "test:review",
    risk_class: "medium", provenance: "fixture", status: "REGISTERED", ...over,
  };
}

function registry(): SkillRegistry {
  const r = new SkillRegistry();
  r.register(skill());
  r.register(skill({ version: "1.0.0" }));
  r.register(skill({ skill_id: "old", name: "Old", status: "DEPRECATED" }));
  return r;
}

function packages(reg: SkillRegistry): Map<string, SkillPackageManifest> {
  const found = reg.lookup("review", "2.0.0")!;
  const manifest = buildPackage(found, new Map([["SKILL.md", new TextEncoder().encode("# Review")]]));
  return new Map([["review@2.0.0", manifest]]);
}

describe("progressive disclosure", () => {
  it("L0 discloses identity only, with status always visible", () => {
    const l0 = discloseSkill(registry(), "skill:review@2.0.0", 0);
    expect(l0).toEqual({ level: 0, skillId: "review", version: "2.0.0", name: "Review", status: "REGISTERED" });
    const old = discloseSkill(registry(), "old", 0);
    expect(old.status).toBe("DEPRECATED");
    expect("capability" in old).toBe(false);
    expect("description" in old).toBe(false);
  });

  it("levels nest: L1 adds capability, L2 adds instructions", () => {
    const reg = registry();
    const l1 = discloseSkill(reg, "review", 1);
    expect(l1.level).toBe(1);
    expect(l1).toMatchObject({ capability: "code-review", riskClass: "medium", status: "REGISTERED" });
    expect("description" in l1).toBe(false);
    const l2 = discloseSkill(reg, "review", 2);
    expect(l2.level).toBe(2);
    expect(l2).toMatchObject({
      description: "Review pull requests",
      inputs: ["diff"],
      outputs: ["report_id"],
      requiredCapabilities: ["read"],
      requiredTools: ["git"],
      requiredPermissions: ["fs.read"],
      provenance: "fixture",
    });
  });

  it("bare refs resolve latest; pinned refs resolve exactly", () => {
    const reg = registry();
    expect(discloseSkill(reg, "review", 0).version).toBe("2.0.0");
    expect(discloseSkill(reg, "skill:review@1.0.0", 0).version).toBe("1.0.0");
  });

  it("L3 lists package artifacts without inlining bytes", () => {
    const reg = registry();
    const l3 = discloseSkill(reg, "review", 3, packages(reg));
    expect(l3.level).toBe(3);
    if (l3.level !== 3) throw new Error("expected L3");
    expect(l3).toMatchObject({ packageFormat: "aetherius-skill-package/1" });
    expect(l3.artifacts).toHaveLength(1);
    expect(l3.artifacts[0]!.name).toBe("SKILL.md");
    expect(l3.artifacts[0]!.sha256).toHaveLength(64);
    expect(JSON.stringify(l3)).not.toContain("# Review");
  });

  it("L3 without an explicit package fails honestly", () => {
    expect(() => discloseSkill(registry(), "review", 3)).toThrowError(/no package manifest/);
  });

  it("unknown levels, bad refs and missing skills fail honestly", () => {
    const reg = registry();
    expect(() => discloseSkill(reg, "review", 9 as never)).toThrowError(/unknown disclosure level/);
    expect(() => discloseSkill(reg, "not a ref!!!", 0)).toThrowError(/not a skill reference/);
    expect(() => discloseSkill(reg, "ghost", 0)).toThrowError(/missing skill ghost/);
    expect(() => discloseSkill(reg, "skill:review@9.9.9", 0)).toThrowError(/missing skill review@9\.9\.9/);
  });
});
