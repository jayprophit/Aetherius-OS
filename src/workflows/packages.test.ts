import { describe, expect, it } from "vitest";
import { buildPackage, resolveArtifact, verifyPackage } from "./packages";
import type { Skill } from "./types";

function skill(over: Partial<Skill> = {}): Skill {
  return {
    skill_id: "review", version: "1.0.0", name: "Review", description: "review", capability: "code-review",
    inputs: [], outputs: [], required_capabilities: ["read"], required_permissions: ["fs.read"],
    required_tools: [], supported_platforms: ["*"], execution_kind: "test",
    implementation_ref: "test:review", risk_class: "medium", provenance: "fixture-team",
    status: "REGISTERED", ...over,
  };
}

const enc = (s: string): Uint8Array => new TextEncoder().encode(s);
const bundle = (): Map<string, Uint8Array> =>
  new Map([["SKILL.md", enc("# Review\nDo review.")], ["run.js", enc("console.log(1)")]]);

describe("skill packages", () => {
  it("builds a manifest with computed hashes and carried trust", () => {
    const manifest = buildPackage(skill(), bundle(), { now: () => "2026-09-23T00:00:00.000Z" });
    expect(manifest.format).toBe("aetherius-skill-package/1");
    expect(manifest.skillId).toBe("review");
    expect(manifest.artifacts).toHaveLength(2);
    expect(manifest.manifestSha256).toHaveLength(64);
    expect(manifest.trust).toMatchObject({
      provenance: "fixture-team",
      riskClass: "medium",
      status: "REGISTERED",
      family: "code-review",
    });
    expect(manifest.trust.requiredPermissions).toEqual(["fs.read"]);
    expect(verifyPackage(manifest, bundle())).toEqual([]);
  });

  it("is deterministic across builds", () => {
    const now = () => "2026-09-23T00:00:00.000Z";
    const a = buildPackage(skill(), bundle(), { now });
    const reordered = new Map([["run.js", enc("console.log(1)")], ["SKILL.md", enc("# Review\nDo review.")]]);
    const b = buildPackage(skill(), reordered, { now });
    expect(a).toEqual(b);
  });

  it("detects tampered, missing and extra artifacts", () => {
    const manifest = buildPackage(skill(), bundle(), { now: () => "2026-09-23T00:00:00.000Z" });
    const tampered = new Map(bundle());
    tampered.set("run.js", enc("console.log(2)"));
    const problems = verifyPackage(manifest, tampered);
    expect(problems).toEqual([{ artifact: "run.js", reason: "artifact bytes do not match manifest hash" }]);

    const missing = new Map(bundle());
    missing.delete("SKILL.md");
    expect(verifyPackage(manifest, missing)).toEqual([
      { artifact: "SKILL.md", reason: "artifact missing from bundle" },
    ]);

    const extra = new Map(bundle());
    extra.set("evil.sh", enc("x"));
    expect(verifyPackage(manifest, extra)).toEqual([
      { artifact: "evil.sh", reason: "artifact not listed in manifest" },
    ]);
  });

  it("detects manifest alteration", () => {
    const manifest = buildPackage(skill(), bundle());
    const altered = { ...manifest, trust: { ...manifest.trust, riskClass: "low" as const } };
    expect(verifyPackage(altered, bundle())).toEqual([
      { reason: "manifest integrity mismatch: manifest was altered after build" },
    ]);
    expect(() => verifyPackage({ ...manifest, format: "other" } as never, bundle())).toThrowError(/not an aetherius/);
  });

  it("resolves artifacts exactly by content hash", () => {
    const manifest = buildPackage(skill(), bundle());
    const store = new Map<string, Uint8Array>();
    for (const entry of manifest.artifacts) {
      store.set(entry.sha256, bundle().get(entry.name)!);
    }
    const bytes = resolveArtifact(manifest, "SKILL.md", store);
    expect(new TextDecoder().decode(bytes)).toContain("# Review");

    expect(() => resolveArtifact(manifest, "nope.md", store)).toThrowError(/not listed/);
    const without = new Map(store);
    without.delete(manifest.artifacts[0]!.sha256);
    expect(() => resolveArtifact(manifest, manifest.artifacts[0]!.name, without)).toThrowError(/absent from store/);
    const poisoned = new Map(store);
    poisoned.set(manifest.artifacts[0]!.sha256, enc("different bytes same key"));
    expect(() => resolveArtifact(manifest, manifest.artifacts[0]!.name, poisoned)).toThrowError(/does not match/);
  });

  it("refuses invalid skills and empty or hostile bundles", () => {
    expect(() => buildPackage(skill({ skill_id: " " }), bundle())).toThrowError(/invalid skill/);
    expect(() => buildPackage(skill(), new Map())).toThrowError(/at least one artifact/);
    expect(() => buildPackage(skill(), new Map([["../escape", enc("x")]]))).toThrowError(/invalid artifact name/);
  });
});
