import { describe, expect, it } from "vitest";
import { SkillRegistry } from "./skills";
import type { Skill } from "./types";
import { discoverSkills } from "./discovery";

function skill(id: string, over: Partial<Skill> = {}): Skill {
  return {
    skill_id: id, version: "1.0.0", name: id, description: `${id} helper`, capability: "general",
    inputs: [], outputs: [], required_capabilities: [], required_permissions: [],
    required_tools: [], supported_platforms: ["*"], execution_kind: "test",
    implementation_ref: `test:${id}`, risk_class: "low", provenance: "fixture",
    status: "REGISTERED", ...over,
  };
}

function registry(): SkillRegistry {
  const r = new SkillRegistry();
  r.register(skill("code-review", { name: "Code Review", capability: "review pull requests", status: "VERIFIED" }));
  r.register(skill("quick-review", { name: "Quick Review", capability: "skim changes", description: "fast review pass" }));
  r.register(skill("deployer", { name: "Deployer", capability: "ship releases", risk_class: "high" }));
  r.register(skill("old-review", { name: "Old Review", capability: "review", status: "DEPRECATED" }));
  r.register(skill("review", { name: "Review", capability: "review", version: "1.0.0" }));
  r.register(skill("review", { name: "Review", capability: "review code deeply", version: "2.0.0" }));
  return r;
}

describe("skill discovery", () => {
  it("ranks field-weighted matches with evidence", () => {
    const hits = discoverSkills(registry(), "review");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.skill.skill_id).toBe("code-review");
    expect(hits[0]!.matchedOn).toEqual(expect.arrayContaining(["name:review", "capability:review"]));
    expect(hits.every((h) => h.score > 0)).toBe(true);
  });

  it("prefers VERIFIED over REGISTERED and penalizes risk", () => {
    const hits = discoverSkills(registry(), "review");
    const ids = hits.map((h) => h.skill.skill_id);
    expect(ids.indexOf("code-review")).toBeLessThan(ids.indexOf("quick-review"));
    const deployer = discoverSkills(registry(), "ship");
    expect(deployer[0]!.skill.skill_id).toBe("deployer");
    expect(deployer[0]!.moderation).toContain("risk:high");
  });

  it("excludes DEPRECATED by default; includes last and flagged on request", () => {
    const clean = discoverSkills(registry(), "review");
    expect(clean.some((h) => h.skill.skill_id === "old-review")).toBe(false);
    const withOld = discoverSkills(registry(), "review", { includeDeprecated: true });
    const last = withOld[withOld.length - 1]!;
    expect(last.skill.skill_id).toBe("old-review");
    expect(last.deprecated).toBe(true);
    expect(last.moderation).toContain("deprecated: ranked last");
  });

  it("searches the latest version by default", () => {
    const hits = discoverSkills(registry(), "deeply");
    expect(hits).toHaveLength(1);
    expect(hits[0]!.skill.version).toBe("2.0.0");
    const all = discoverSkills(registry(), "review", { includeAllVersions: true });
    expect(all.filter((h) => h.skill.skill_id === "review")).toHaveLength(2);
  });

  it("returns nothing for empty queries and honors limits", () => {
    expect(discoverSkills(registry(), "   ")).toEqual([]);
    expect(discoverSkills(registry(), "a")).toEqual([]);
    const limited = discoverSkills(registry(), "review", { limit: 1 });
    expect(limited).toHaveLength(1);
    expect(discoverSkills(registry(), "review", { limit: 0 })).toEqual([]);
  });

  it("is deterministic on ties", () => {
    const r = new SkillRegistry();
    r.register(skill("bbb", { name: "Same", capability: "same thing" }));
    r.register(skill("aaa", { name: "Same", capability: "same thing" }));
    const first = discoverSkills(r, "same").map((h) => h.skill.skill_id);
    const second = discoverSkills(r, "same").map((h) => h.skill.skill_id);
    expect(first).toEqual(["aaa", "bbb"]);
    expect(second).toEqual(first);
  });

  it("finds nothing silently when nothing matches", () => {
    expect(discoverSkills(registry(), "quantum-banana")).toEqual([]);
  });
});
