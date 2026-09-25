import { describe, expect, it } from "vitest";
import { SkillRegistry } from "../workflows/skills";
import type { Skill } from "../workflows/types";
import { WorkerProfileRegistry, profileSchedulability, projectSpawnTemplate } from "./profiles";
import type { WorkerProfile } from "./profiles";

function skill(id: string): Skill {
  return {
    skill_id: id, version: "1.0.0", name: id, description: id, capability: "review",
    inputs: [], outputs: [], required_capabilities: [], required_permissions: [],
    required_tools: [], supported_platforms: ["*"], execution_kind: "test",
    implementation_ref: `test:${id}`, risk_class: "low", provenance: "fixture", status: "REGISTERED",
  };
}

function skillsWith(): { has(skillId: string, version?: string): boolean } {
  const registry = new SkillRegistry();
  registry.register(skill("review"));
  return { has: (id, version) => registry.lookup(id, version) !== null };
}

function profile(over: Partial<WorkerProfile> = {}): WorkerProfile {
  return {
    workerProfileId: "code-reviewer",
    version: "1.0.0",
    role: "review",
    capabilities: ["filesystem:read", "review:comment"],
    modelRequirements: { modalities: ["text"], minContext: 8000, localOnly: true },
    skillRefs: ["skill:review@1.0.0"],
    toolRefs: ["filesystem", "git"],
    grantRefs: ["grant:repo-read"],
    touchHints: ["src/"],
    budget: { maxMs: 600000, maxToolCalls: 50 },
    workspace: { workspaceClass: "sandbox", writableScope: ["work/"], projectRootRequired: true },
    evidenceContract: [{ key: "unit-tests", description: "unit tests pass" }],
    targetRequirements: { minCores: 2 },
    termination: { on: ["task-complete", "task-failed", "lease-expired"], maxLeaseMs: 3600000 },
    provenance: "first-party",
    ...over,
  };
}

describe("worker profiles", () => {
  it("registers minimal and full profiles deterministically", () => {
    const registry = new WorkerProfileRegistry();
    const minimal = registry.register({
      workerProfileId: "minimal",
      version: "1.0.0",
      role: "research",
      capabilities: ["search:read"],
      skillRefs: [],
      toolRefs: [],
      grantRefs: [],
      termination: { on: ["task-complete"] },
      provenance: "first-party",
    });
    expect(minimal.budget).toBeUndefined();
    expect(registry.lookup("minimal", "1.0.0")!.role).toBe("research");
    registry.register(profile());
    expect(registry.list().map((p) => p.workerProfileId)).toEqual(["code-reviewer", "minimal"]);
  });

  it("treats identical re-registration as idempotent, conflicts as errors", () => {
    const registry = new WorkerProfileRegistry();
    registry.register(profile());
    expect(registry.register(profile()).version).toBe("1.0.0");
    expect(() => registry.register(profile({ role: "changed" }))).toThrowError(/conflicting worker profile/);
    registry.register(profile({ version: "1.1.0" }));
    expect(registry.lookup("code-reviewer", "1.1.0")!.role).toBe("review");
  });

  it("profile identity is distinct from worker/task/pool/target ids", () => {
    const registry = new WorkerProfileRegistry();
    const stored = registry.register(profile());
    expect(stored.workerProfileId).toBe("code-reviewer");
    expect(Object.keys(stored)).not.toContain("workerId");
    expect(Object.keys(stored)).not.toContain("taskId");
    expect(Object.keys(stored)).not.toContain("poolId");
    expect(Object.keys(stored)).not.toContain("genesisId");
  });

  it("rejects malformed profiles", () => {
    const registry = new WorkerProfileRegistry();
    expect(() => registry.register(profile({ workerProfileId: " " }))).toThrowError(/profile-id/);
    expect(() => registry.register(profile({ version: "v1" }))).toThrowError(/version/);
    expect(() => registry.register(profile({ role: "" }))).toThrowError(/role/);
    expect(() => registry.register(profile({ capabilities: [] }))).toThrowError(/capabilities/);
    expect(() => registry.register(profile({ skillRefs: [" "] }))).toThrowError(/skill-refs/);
    expect(() => registry.register(profile({ touchHints: ["../escape"] }))).toThrowError(/touch-hints/);
    expect(() => registry.register(profile({ touchHints: ["/abs"] }))).toThrowError(/touch-hints/);
    expect(() => registry.register(profile({ budget: { maxMs: NaN } }))).toThrowError(/budget/);
    expect(() => registry.register(profile({ budget: { maxCostAmount: 5 } }))).toThrowError(/budget/);
    expect(() => registry.register(profile({ termination: { on: [] } }))).toThrowError(/termination/);
    expect(() => registry.register(profile({ termination: { on: ["immortal" as never] } }))).toThrowError(/termination/);
    expect(() => registry.register(profile({ provenance: "" }))).toThrowError(/provenance/);
    expect(() => registry.register(profile({ workspace: { writableScope: ["/etc"] } }))).toThrowError(/workspace/);
    expect(
      () => registry.register(profile({ evidenceContract: [{ key: "a", description: "x" }, { key: "a", description: "y" }] })),
    ).toThrowError(/evidence-contract/);
  });

  it("carries no identity, memory, wallet or secret fields", () => {
    const stored = new WorkerProfileRegistry().register(profile());
    const json = JSON.stringify(stored);
    for (const banned of ["personaMemory", "permanentIdentity", "autonomousOwner", "personalWallet", "permanentBiography",
      "autobiographical", "apiKey", "password", "secretValue", "privateKey"]) {
      expect(json).not.toContain(banned);
    }
  });

  it("projects spawn templates resolving skills without spawning", () => {
    const projection = projectSpawnTemplate(profile(), { skills: skillsWith() });
    expect(projection).toMatchObject({
      workerProfileId: "code-reviewer",
      version: "1.0.0",
      capabilityScope: ["filesystem:read", "review:comment"],
      ttlMs: 3600000,
      skillRefs: ["skill:review@1.0.0"],
      grantRefs: ["grant:repo-read"],
    });
    expect(projection).not.toHaveProperty("workerId");
    expect(() => projectSpawnTemplate(profile({ skillRefs: ["skill:ghost@1.0.0"] }), { skills: skillsWith() })).toThrowError(
      /unresolvable skill refs: skill:ghost@1\.0\.0/,
    );
    expect(() => projectSpawnTemplate(profile(), {})).toThrowError(/needs a skill registry/);
  });

  it("grants stay requests: projection never approves", () => {
    const projection = projectSpawnTemplate(profile(), { skills: skillsWith() });
    expect(projection.grantRefs).toEqual(["grant:repo-read"]);
    expect(JSON.stringify(projection)).not.toContain("APPROVED");
    expect(JSON.stringify(projection)).not.toContain("approved");
  });

  it("touch hints stay hints: never actual touch sets", () => {
    const projection = projectSpawnTemplate(profile(), { skills: skillsWith() });
    expect(projection.touchHints).toEqual(["src/"]);
  });

  it("delegates schedulability to target compatibility", () => {
    const projection = projectSpawnTemplate(profile(), { skills: skillsWith() });
    const targets = [
      {
        targetProfileId: "big", targetType: "local-directory" as const, persistence: "session" as const,
        minCores: 8, gpuRequired: false, network: "restricted" as const, provenance: "CONFIGURED" as const,
      },
      {
        targetProfileId: "small", targetType: "local-directory" as const, persistence: "session" as const,
        minCores: 1, gpuRequired: false, network: "restricted" as const, provenance: "CONFIGURED" as const,
      },
    ];
    const ok = profileSchedulability(projection, targets);
    expect(ok).toEqual({ status: "COMPATIBLE", targets: ["big"] });
    const bare = profileSchedulability(projectSpawnTemplate(profile({ targetRequirements: undefined }), { skills: skillsWith() }), targets);
    expect(bare).toEqual({ status: "UNDETERMINED", reason: "profile states no target requirements" });
  });

  it("role never implies authority", () => {
    const stored = new WorkerProfileRegistry().register(profile({ role: "owner" }));
    expect(stored.role).toBe("owner");
    expect(Object.keys(stored)).not.toContain("grant");
    expect(Object.keys(stored)).not.toContain("authority");
  });
});
