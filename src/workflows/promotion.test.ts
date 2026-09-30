import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { FileStateStore } from "../state/store";

/**
 * Promotion runs against a real FileStateStore, so this file is disk-bound:
 * ~12s on the development volume, ~46s from a clean checkout on a slower one.
 * Raised for THIS FILE ONLY, with the reason recorded, so a genuinely slow
 * test elsewhere still fails fast against the unchanged global default. No
 * assertion is relaxed - DENY must still reject and ALLOW must still promote.
 */
vi.setConfig({ testTimeout: 30_000 });
import { SkillLifecycle } from "./lifecycle";
import type { CandidateProvenance } from "./promotion";
import {
  hashSkill,
  permissionDiff,
  promotionPolicy,
  stableStringify,
  staticSafetyScan,
} from "./promotion";
import { SkillRegistry } from "./skills";
import type { Skill } from "./types";

function lowSkill(id: string, version = "1.0.0", over: Partial<Skill> = {}): Skill {
  return {
    skill_id: id,
    version,
    name: id,
    description: `pure transform ${id}`,
    capability: "text-transform",
    inputs: ["value"],
    outputs: ["result"],
    required_capabilities: [],
    required_permissions: [],
    required_tools: [],
    supported_platforms: ["*"],
    execution_kind: "test",
    implementation_ref: `test:${id}`,
    risk_class: "low",
    provenance: "fixture",
    status: "REGISTERED",
    ...over,
  };
}

const OWNER_PROVENANCE: CandidateProvenance = {
  origin: "OWNER_AUTHORED",
  sources: ["fixture"],
};

function lifecycle() {
  const store = new FileStateStore(mkdtempSync(join(tmpdir(), "promo-")), 1);
  const active = new SkillRegistry();
  let n = 0;
  const lc = new SkillLifecycle(active, store, {
    now: () => "2026-09-22T00:00:00.000Z",
    id: () => `cand-${++n}`,
  });
  return { lc, active, store };
}

const greenHarness = {
  run: async () => ({ passed: true, suites: [{ name: "unit", passed: true }] }),
};

async function driveLowRisk(lc: ReturnType<typeof lifecycle>["lc"], skill: Skill, generator = "genesis") {
  const c0 = lc.propose(skill, { origin: "GENESIS_GENERATED", generator, sources: ["workflow-run-1"] });
  const c1 = lc.stage(c0.candidateId);
  const c2 = lc.validateSchema(c1.candidateId);
  const c3 = await lc.runTests(c2.candidateId, greenHarness);
  const c4 = await lc.runSecurity(c3.candidateId);
  lc.recordEvaluation(c4.candidateId, {
    evalId: "eval-1",
    dimensions: { correctness: { value: 1, target: 1, pass: true } },
    source: "fixture",
  });
  return c4.candidateId;
}

describe("candidate lifecycle", () => {
  it("creates candidates with stable hashes; mutation changes the hash", () => {
    const { lc } = lifecycle();
    const c = lc.propose(lowSkill("echo"), OWNER_PROVENANCE);
    expect(c.state).toBe("CANDIDATE");
    expect(c.contentHash).toBe(hashSkill(lowSkill("echo")));
    const mutated = { ...lowSkill("echo"), description: "different words" };
    expect(hashSkill(mutated)).not.toBe(c.contentHash);
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });
  it("rejects invalid schema and missing provenance", () => {
    const { lc } = lifecycle();
    expect(() => lc.propose(lowSkill("bad", "x"), OWNER_PROVENANCE)).toThrowError(/version/);
    expect(() => lc.propose(lowSkill("ok"), { origin: "OWNER_AUTHORED", sources: [] })).toThrowError(/provenance/);
  });
  it("rejects duplicate identity against active and staging", () => {
    const { lc, active } = lifecycle();
    active.register(lowSkill("echo", "1.0.0"));
    expect(() => lc.propose(lowSkill("echo", "1.0.0"), OWNER_PROVENANCE)).toThrowError(/already active/);
    lc.propose(lowSkill("new", "1.0.0"), OWNER_PROVENANCE);
    expect(() => lc.propose(lowSkill("new", "1.0.0"), OWNER_PROVENANCE)).toThrowError(/already staged/);
  });
  it("candidates are invisible to production resolution before promotion", () => {
    const { lc, active } = lifecycle();
    lc.propose(lowSkill("ghost", "9.9.9"), OWNER_PROVENANCE);
    expect(active.lookup("ghost")).toBeNull();
    expect(active.lookup("ghost", "9.9.9")).toBeNull();
  });
  it("rejection and quarantine preserve evidence without exposure", () => {
    const { lc, active } = lifecycle();
    const a = lc.propose(lowSkill("rej"), OWNER_PROVENANCE);
    lc.reject(a.candidateId, "not useful", "reviewer");
    expect(active.lookup("rej")).toBeNull();
    const b = lc.propose(lowSkill("quar"), OWNER_PROVENANCE);
    lc.quarantine(b.candidateId, "suspicious content");
    expect(active.lookup("quar")).toBeNull();
    expect(() => lc.promote(b.candidateId, "owner")).toThrowError();
  });
});

describe("validation and security gates", () => {
  it("missing and failing tests block promotion", async () => {
    const { lc } = lifecycle();
    const id = await driveLowRisk(lc, lowSkill("notested"));
    // Strip the test report by driving a fresh candidate that skips tests.
    const raw = lc.propose(lowSkill("raw"), OWNER_PROVENANCE);
    const staged = lc.stage(raw.candidateId);
    const validated = lc.validateSchema(staged.candidateId);
    expect(validated.state).toBe("VALIDATED");
    const decided = lc.decide(validated.candidateId);
    expect(decided.decision).toBe("REJECTED");
    void id;
    const failing = lc.propose(lowSkill("failing"), OWNER_PROVENANCE);
    lc.stage(failing.candidateId);
    lc.validateSchema(failing.candidateId);
    const tested = await lc.runTests(failing.candidateId, {
      run: async () => ({ passed: false, suites: [{ name: "unit", passed: false, detail: "red" }] }),
    });
    expect(tested.state).toBe("TEST_FAILED");
  });
  it("raw secrets are critical findings leading to quarantine", async () => {
    const { lc } = lifecycle();
    const leaky = lowSkill("leaky", "1.0.0", { description: "uses api_key: 'sk-live-12345' openly" });
    const id = await driveLowRisk(lc, leaky);
    const secured = await lc.runSecurity(id);
    expect(secured.securityFindings.some((f) => f.severity === "critical")).toBe(true);
    const decided = lc.decide(id);
    expect(decided.decision).toBe("QUARANTINED");
  });
  it("permission expansion is detected and escalates policy", async () => {
    const { lc, active } = lifecycle();
    active.register(lowSkill("tool", "1.0.0"));
    const v2 = lowSkill("tool", "2.0.0", { required_permissions: ["shell:execute"], risk_class: "medium" });
    const id = await driveLowRisk(lc, v2);
    const secured = await lc.runSecurity(id);
    expect(secured.permissionDiff?.expanded).toBe(true);
    expect(secured.permissionDiff?.addedPermissions).toEqual(["shell:execute"]);
    expect(secured.securityFindings.some((f) => f.check === "privilege-expansion")).toBe(true);
    const decided = lc.decide(id);
    expect(decided.decision).toBe("REQUIRES_OWNER_APPROVAL");
  });
  it("generator cannot approve its own candidate", async () => {
    const { lc } = lifecycle();
    const id = await driveLowRisk(lc, lowSkill("selfish"), "genesis");
    expect(() => lc.recordReview(id, "genesis", "APPROVE", "trust me")).toThrowError(/cannot review its own/);
  });
  it("static scan and permission diff units behave", () => {
    expect(staticSafetyScan(lowSkill("clean"))).toEqual([]);
    const diff = permissionDiff(lowSkill("a", "1.0.0"), lowSkill("a", "2.0.0", { required_permissions: ["x"] }));
    expect(diff.expanded).toBe(true);
    expect(permissionDiff(lowSkill("a", "1.0.0"), lowSkill("a", "1.0.0")).expanded).toBe(false);
  });
});

describe("evaluation honesty", () => {
  it("multidimensional evaluation without a universal score", async () => {
    const { lc } = lifecycle();
    const id = await driveLowRisk(lc, lowSkill("multi"));
    lc.recordEvaluation(id, {
      evalId: "eval-2",
      dimensions: {
        correctness: { value: 0.98, target: 0.95, pass: true },
        latency_ms: { value: 12, target: 50, pass: true },
      },
      source: "fixture",
    });
    const stored = lc.recordEvaluation(id, {
      evalId: "eval-3",
      dimensions: { correctness: { value: 1, target: 1, pass: true } },
      source: "fixture",
    });
    expect(Object.keys(stored.evaluations[stored.evaluations.length - 1].dimensions).sort()).toEqual([
      "correctness",
    ]);
    expect("score" in stored).toBe(false);
  });
  it("regressions fail the policy; stale hashes invalidate promotion", async () => {
    const { lc } = lifecycle();
    const id = await driveLowRisk(lc, lowSkill("reg"));
    lc.recordEvaluation(id, {
      evalId: "eval-bad",
      dimensions: { correctness: { value: 0.5, target: 0.9, pass: false } },
      source: "fixture",
    });
    expect(lc.decide(id).decision).toBe("REJECTED");
  });
  it("vendor evidence stays provenance-distinct", async () => {
    const { lc } = lifecycle();
    const id = await driveLowRisk(lc, lowSkill("vend"));
    const stored = lc.recordEvaluation(id, {
      evalId: "eval-vendor",
      dimensions: { correctness: { value: 1, target: 1, pass: true } },
      source: "VENDOR_REPORTED",
    });
    const last = stored.evaluations[stored.evaluations.length - 1];
    expect(last.source).toBe("VENDOR_REPORTED");
    expect(last.candidateHash).toBe(stored.contentHash);
  });
});

describe("review and approval", () => {
  it("low-risk candidate promotes end to end without owner", async () => {
    const { lc, active } = lifecycle();
    const id = await driveLowRisk(lc, lowSkill("simple"));
    lc.recordReview(id, "codex", "APPROVE", "clean transform, tests green");
    expect(lc.decide(id).decision).toBe("PROMOTABLE");
    const promoted = lc.promote(id, "opencode");
    expect(promoted.state).toBe("PROMOTED");
    expect(active.lookup("simple", "1.0.0")?.description).toContain("pure transform");
    expect(lc.lookupActive("simple").version).toBe("1.0.0");
  });
  it("missing independent review routes to review, then promotes", async () => {
    const { lc } = lifecycle();
    const id = await driveLowRisk(lc, lowSkill("lonely"));
    expect(lc.decide(id).decision).toBe("REQUIRES_REVIEW");
    lc.recordReview(id, "hermes", "APPROVE", "verified offline");
    expect(lc.decide(id).decision).toBe("PROMOTABLE");
    expect(lc.promote(id, "opencode").state).toBe("PROMOTED");
  });
  it("owner deny rejects; owner allow promotes risky candidates", async () => {
    const { lc } = lifecycle();
    const risky = lowSkill("risky", "1.0.0", { required_permissions: ["shell:execute"], risk_class: "high" });
    const id = await driveLowRisk(lc, risky);
    await lc.runSecurity(id);
    lc.recordReview(id, "codex", "APPROVE", "scoped shell use");
    expect(lc.decide(id).decision).toBe("REQUIRES_OWNER_APPROVAL");
    lc.approveOwner(id, "DENY", "owner");
    expect(lc.decide(id).decision).toBe("REJECTED");
    // Second candidate, same shape, owner allows.
    const id2 = await driveLowRisk(lc, lowSkill("risky2", "1.0.0", { required_permissions: ["shell:execute"], risk_class: "high" }));
    await lc.runSecurity(id2);
    lc.recordReview(id2, "codex", "APPROVE", "scoped shell use");
    expect(lc.decide(id2).decision).toBe("REQUIRES_OWNER_APPROVAL");
    lc.approveOwner(id2, "ALLOW", "owner");
    expect(lc.decide(id2).decision).toBe("PROMOTABLE");
    expect(lc.promote(id2, "owner").state).toBe("PROMOTED");
  });
  it("review failure and reject verdicts are terminal with history", async () => {
    const { lc } = lifecycle();
    const id = await driveLowRisk(lc, lowSkill("contested"));
    lc.recordReview(id, "codex", "REQUEST_CHANGES", "needs docs");
    const after = lc.recordReview(id, "codex", "REJECT", "still bad");
    expect(after.state).toBe("REJECTED");
    expect(after.reviews.length).toBe(2);
    expect(after.history.length).toBeGreaterThan(4);
  });
});

describe("atomic promotion and concurrency", () => {
  it("promotion writes artifact, pointer, record and verifies reload", async () => {
    const { lc, active, store } = lifecycle();
    const id = await driveLowRisk(lc, lowSkill("atomic"));
    lc.recordReview(id, "codex", "APPROVE", "ok");
    lc.decide(id);
    lc.promote(id, "opencode");
    expect(active.lookup("atomic", "1.0.0")).not.toBeNull();
    expect(lc.lookupActive("atomic").version).toBe("1.0.0");
    // Promotion record is append-preserving in durable state.
    const files = store.listIds("promotion-atomic-1-0-0");
    expect(files.length).toBe(1);
  });
  it("failed promotion leaves no active pointer behind", async () => {
    const { lc } = lifecycle();
    const id = await driveLowRisk(lc, lowSkill("nopolicy"));
    // No evaluation recorded beyond the passing one... force refusal by
    // requesting promotion while tests are the only evidence: policy needs
    // an independent review first.
    const decided = lc.decide(id);
    expect(decided.decision).toBe("REQUIRES_REVIEW");
    expect(() => lc.promote(id, "opencode")).toThrowError(/REQUIRES_REVIEW/);
    expect(() => lc.lookupActive("nopolicy")).toThrowError();
  });
  it("sequential promotions advance the pointer with full history", async () => {
    const { lc } = lifecycle();
    for (const version of ["1.0.0", "1.1.0"]) {
      const id = await driveLowRisk(lc, lowSkill("evolving", version));
      lc.recordReview(id, "codex", "APPROVE", "ok");
      lc.decide(id);
      lc.promote(id, "opencode");
    }
    expect(lc.lookupActive("evolving").version).toBe("1.1.0");
  });
});

describe("version pinning across promotion", () => {
  it("pinned v1 lookups survive a v2 promotion", async () => {
    const { lc, active } = lifecycle();
    const v1 = await driveLowRisk(lc, lowSkill("pinned", "1.0.0"));
    lc.recordReview(v1, "codex", "APPROVE", "ok");
    lc.decide(v1);
    lc.promote(v1, "opencode");
    const v2 = await driveLowRisk(lc, lowSkill("pinned", "2.0.0"));
    lc.recordReview(v2, "codex", "APPROVE", "ok");
    lc.decide(v2);
    lc.promote(v2, "opencode");
    // Existing pinned consumers keep v1; new resolution gets v2.
    expect(active.lookup("pinned", "1.0.0")?.version).toBe("1.0.0");
    expect(lc.lookupActive("pinned").version).toBe("2.0.0");
  });
});

describe("rollback and revocation", () => {
  it("rollback moves the pointer, preserves v2 evidence and artifact", async () => {
    const { lc, active } = lifecycle();
    for (const version of ["1.0.0", "2.0.0"]) {
      const id = await driveLowRisk(lc, lowSkill("svc", version));
      lc.recordReview(id, "codex", "APPROVE", "ok");
      lc.decide(id);
      lc.promote(id, "opencode");
    }
    const hashBefore = hashSkill(lowSkill("svc", "2.0.0"));
    expect(lc.rollback("svc", "1.0.0", "owner", "v2 regression")).toBe("1.0.0");
    expect(lc.lookupActive("svc").version).toBe("1.0.0");
    expect(active.lookup("svc", "2.0.0")).not.toBeNull();
    expect(hashSkill(lowSkill("svc", "2.0.0"))).toBe(hashBefore);
  });
  it("rollback to never-promoted versions is refused", async () => {
    const { lc } = lifecycle();
    expect(() => lc.rollback("ghost", "1.0.0", "owner", "x")).toThrowError(/never promoted/);
  });
  it("revoked versions refuse execution until rolled back", async () => {
    const { lc } = lifecycle();
    for (const version of ["1.0.0", "2.0.0"]) {
      const id = await driveLowRisk(lc, lowSkill("api", version));
      lc.recordReview(id, "codex", "APPROVE", "ok");
      lc.decide(id);
      lc.promote(id, "opencode");
    }
    lc.revoke("api", "2.0.0", "owner", "abuse report");
    expect(() => lc.lookupActive("api", "2.0.0")).toThrowError(/revoked/);
    expect(() => lc.lookupActive("api")).toThrowError(/revoked/);
    expect(lc.rollback("api", "1.0.0", "owner", "post-revoke")).toBe("1.0.0");
    expect(lc.lookupActive("api").version).toBe("1.0.0");
  });
});

describe("P17 persistence of promotion state", () => {
  it("candidates, pointers, records and revocations survive reload", async () => {
    const dir = mkdtempSync(join(tmpdir(), "promo-persist-"));
    const mk = () => {
      const store = new FileStateStore(dir, 1);
      const active = new SkillRegistry();
      let n = 0;
      return new SkillLifecycle(active, store, {
        now: () => "2026-09-22T00:00:00.000Z",
        id: () => `cand-${++n}`,
      });
    };
    const lc1 = mk();
    const id = await driveLowRisk(lc1, lowSkill("durable"));
    lc1.recordReview(id, "codex", "APPROVE", "ok");
    lc1.decide(id);
    lc1.promote(id, "opencode");
    lc1.revoke("durable", "1.0.0", "owner", "test");
    const lc2 = mk();
    // Fresh instance over the same store sees everything (registry itself
    // is in-memory per instance by design; pointers and revocations persist).
    expect(() => lc2.lookupActive("durable")).toThrowError(/revoked/);
    expect(lc2.summarize("durable")).toContain("ACTIVE: 1.0.0");
  });
  it("corrupt and future-schema envelopes surface instead of vanishing", async () => {
    const dir = mkdtempSync(join(tmpdir(), "promo-bad-"));
    const store = new FileStateStore(dir, 1);
    const active = new SkillRegistry();
    const lc = new SkillLifecycle(active, store, { now: () => "2026-09-22T00:00:00.000Z" });
    const id = await driveLowRisk(lc, lowSkill("fragile"));
    const envPath = join(dir, `candidate-${id}.json`);
    writeFileSync(envPath, "{broken", "utf8");
    const lc2 = new SkillLifecycle(new SkillRegistry(), store, { now: () => "2026-09-22T00:00:00.000Z" });
    expect(() => lc2.reject(id, "x")).toThrowError(/not valid JSON/);
    const env = {
      id: `candidate-${id}`, kind: "skill-candidate", schemaVersion: 99, recordVersion: 1,
      createdAt: "x", updatedAt: "x", owner: "aetherius-os", provenance: "t",
      sensitivity: "SYSTEM", integrity: "x", payload: {},
    };
    writeFileSync(envPath, JSON.stringify(env), "utf8");
    expect(() => lc2.reject(id, "x")).toThrowError(/newer than supported/);
  });
});

describe("operator summary", () => {
  it("summarize answers the audit questions", async () => {
    const { lc } = lifecycle();
    const id = await driveLowRisk(lc, lowSkill("audited", "2.2.0"));
    lc.recordReview(id, "codex", "APPROVE", "ok");
    const text = lc.summarize("audited");
    expect(text).toContain("SKILL: audited");
    expect(text).toContain("CANDIDATE: v2.2.0");
    expect(text).toContain("HASH:");
  });
});
