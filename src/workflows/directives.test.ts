import { describe, expect, it } from "vitest";
import { SkillRegistry } from "./skills";
import type { Skill, Workflow } from "./types";
import { assessDirective } from "./directives";
import type { DirectiveContext, DirectiveSpec } from "./directives";

function skill(id: string, over: Partial<Skill> = {}): Skill {
  return {
    skill_id: id, version: "1.0.0", name: id, description: id, capability: "review",
    inputs: [], outputs: [], required_capabilities: [], required_permissions: [],
    required_tools: [], supported_platforms: ["*"], execution_kind: "test",
    implementation_ref: `test:${id}`, risk_class: "low", provenance: "fixture",
    status: "REGISTERED", ...over,
  };
}

function context(): DirectiveContext {
  const skills = new SkillRegistry();
  skills.register(skill("review"));
  skills.register(skill("triage"));
  skills.register(skill("legacy", { status: "DEPRECATED" }));
  const workflows: Workflow[] = [
    {
      workflow_id: "nightly-review", version: "1.0.0", description: "nightly repo review",
      inputs: ["findings"],
      steps: [
        {
          id: "check", kind: "steward-review", ref: "steward:review", depends_on: [],
          inputs: { repo: "r", kind: "pull", number: "1", trigger: "scheduled", findings: "$input.findings" },
          outputs: ["report_id"], retry_safety: "safe",
        },
        {
          id: "gate", kind: "approval", ref: "owner-release", depends_on: ["check"],
          inputs: {}, outputs: [], approval: { approver: "owner", reason: "release check" },
          retry_safety: "unknown",
        },
      ],
    },
  ];
  return { skills, workflows, policies: ["AUTO_SAFE", "OWNER_GATED"] };
}

function coveredSpec(): DirectiveSpec {
  return {
    id: "nightly-stewardship",
    objective: "Keep the repository reviewed every night",
    constraints: ["policy:AUTO_SAFE", "approval:owner"],
    definitionOfDone: ["nightly-review:check.report_id", "nightly-review:gate#approval"],
    recommendedSkills: ["skill:review@1.0.0", "triage"],
  };
}

describe("directive assessment", () => {
  it("a fully expressible directive is COVERED with no new artifact", () => {
    const result = assessDirective(coveredSpec(), context());
    expect(result.verdict).toBe("COVERED");
    expect(result.gaps).toEqual([]);
    expect(result.decision).toContain("no new artifact");
    expect(result.decision).toContain("no second workflow engine");
    expect(result.fields.every((f) => f.status === "COVERED")).toBe(true);
  });

  it("unresolvable skills are gaps, not silent drops", () => {
    const result = assessDirective(
      { ...coveredSpec(), recommendedSkills: ["skill:missing@1.0.0", "legacy", "not a ref!!!"] },
      context(),
    );
    expect(result.verdict).toBe("GAP");
    expect(result.gaps.join("\n")).toContain("missing skill missing@1.0.0");
    expect(result.gaps.join("\n")).toContain("DEPRECATED");
    expect(result.gaps.join("\n")).toContain("not a skill reference");
    expect(result.decision).toContain("do not invent a parallel engine");
  });

  it("unverifiable completion conditions are gaps", () => {
    const result = assessDirective(
      {
        ...coveredSpec(),
        definitionOfDone: [
          "nightly-review:check.nope",
          "nightly-review:missing.report_id",
          "unknown:check.report_id",
          "nightly-review:check#approval",
          "looks good to me",
        ],
      },
      context(),
    );
    expect(result.verdict).toBe("GAP");
    expect(result.gaps).toHaveLength(5);
    expect(result.gaps.join("\n")).toContain("does not declare output nope");
    expect(result.gaps.join("\n")).toContain("unknown step");
    expect(result.gaps.join("\n")).toContain("unknown workflow unknown");
    expect(result.gaps.join("\n")).toContain("is not an approval gate");
    expect(result.gaps.join("\n")).toContain("unverifiable completion");
  });

  it("untyped constraints and empty objectives are gaps", () => {
    const result = assessDirective(
      {
        ...coveredSpec(),
        objective: "   ",
        constraints: ["be careful", "policy:WHATEVER", "approval:nobody"],
      },
      context(),
    );
    expect(result.verdict).toBe("GAP");
    expect(result.gaps.join("\n")).toContain("without an objective");
    expect(result.gaps.join("\n")).toContain("untyped constraint");
    expect(result.gaps.join("\n")).toContain("unknown routine policy WHATEVER");
    expect(result.gaps.join("\n")).toContain("no approval checkpoint by nobody");
  });

  it("the assessor itself creates no execution surface", () => {
    const result = assessDirective(coveredSpec(), context());
    expect(JSON.stringify(result)).not.toContain("merge");
    expect(Object.keys(result)).toEqual(
      expect.arrayContaining(["directiveId", "verdict", "fields", "gaps", "decision"]),
    );
  });
});
