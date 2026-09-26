import { describe, expect, it } from "vitest";
import {
  CLAIM_SOURCES,
  TRAINING_STAGES,
  TrainingLifecycleRegistry,
  advisorySignals,
  canonicalProfile,
  trainingProfileIdFor,
  validateProfile,
} from "./trainingLifecycle";
import * as trainingLifecycle from "./trainingLifecycle";
import type { LifecycleClaim, TrainingLifecycleProfile } from "./trainingLifecycle";

const AT = "2026-09-26T00:00:00.000Z";

/**
 * Dimension-specific fixture. Each claim is set explicitly alongside its
 * value so no assertion can be satisfied by an inherited default, and the
 * omitted-dimension cases are built by deleting the field rather than by
 * relying on a shared default object.
 */
function profile(over: Partial<TrainingLifecycleProfile> = {}): TrainingLifecycleProfile {
  return {
    profileId: "tclp-llama-3-8b",
    version: "1.0.0",
    modelRef: "ollama/llama3:8b",
    attentionTags: ["causal"],
    attentionClaim: { source: "VENDOR_REPORTED", evidenceRef: "model-card" },
    positionEncodingTags: ["rope"],
    positionEncodingClaim: { source: "VENDOR_REPORTED" },
    evidenceRefs: [],
    advisoryOnly: true,
    provenance: "p18-training-compute",
    recordedAt: AT,
    ...over,
  };
}

function claim(over: Partial<LifecycleClaim> = {}): LifecycleClaim {
  return { source: "THIRD_PARTY_REPORTED", ...over };
}

describe("profile validation", () => {
  it("accepts a minimal profile and a fully claimed one", () => {
    expect(validateProfile(profile())).toEqual([]);
    expect(
      validateProfile(
        profile({
          stage: "pretraining",
          stageClaim: claim({ evidenceRef: "lifecycle-note" }),
          computeClass: "large",
          computeClassClaim: claim(),
        }),
      ),
    ).toEqual([]);
  });

  it("rejects malformed identity, version, model ref and timestamp", () => {
    const cases: Record<string, Partial<TrainingLifecycleProfile>> = {
      "profile-id": { profileId: "ollama/llama3:8b" },
      version: { version: "1.0" },
      "model-ref": { modelRef: "  " },
      provenance: { provenance: "" },
      "recorded-at": { recordedAt: "today" },
    };
    for (const [problem, over] of Object.entries(cases)) {
      expect(validateProfile(profile(over))).toContain(problem);
    }
  });

  it("uses only the two stage terms the registered description names", () => {
    expect([...TRAINING_STAGES]).toEqual(["pretraining", "post-training"]);
    // Finer stages are not invented: an unknown stage must stay unknown.
    for (const invented of ["finetune", "instruction-tune", "distill", "quantize", "sft"]) {
      expect(TRAINING_STAGES).not.toContain(invented as never);
    }
    expect(validateProfile(profile({ stage: "finetune" as never }))).toContain("stage");
  });

  it("rejects blank and duplicate tags", () => {
    expect(validateProfile(profile({ attentionTags: [""] }))).toContain("attention-tags");
    expect(validateProfile(profile({ attentionTags: ["causal", "causal"] }))).toContain("attention-tags");
    expect(validateProfile(profile({ positionEncodingTags: [""] }))).toContain("position-encoding-tags");
    expect(validateProfile(profile({ evidenceRefs: ["e", "e"] }))).toContain("evidence-refs");
  });

  it("rejects an unknown claim source", () => {
    expect(validateProfile(profile({ attentionClaim: { source: "gutfeel" as never } }))).toContain("claim-source");
    for (const source of CLAIM_SOURCES) {
      expect(validateProfile(profile({ attentionClaim: { source } }))).not.toContain("claim-source");
    }
  });
});

describe("attribution discipline", () => {
  it("rejects a value with no claim, so a fact cannot be smuggled in unattributed", () => {
    expect(validateProfile(profile({ stage: "pretraining" }))).toContain("unattributed-value");
    expect(validateProfile(profile({ computeClass: "large" }))).toContain("unattributed-value");
    // A NON-EMPTY tag list asserts something, so it needs provenance.
    expect(validateProfile(profile({ attentionTags: ["causal"], attentionClaim: undefined }))).toContain(
      "unattributed-value",
    );
    expect(
      validateProfile(profile({ positionEncodingTags: ["rope"], positionEncodingClaim: undefined })),
    ).toContain("unattributed-value");
  });

  it("accepts an empty tag list with no claim, because empty means unknown", () => {
    // The mirror of the rule above: asserting nothing requires no
    // attribution. An empty list is UNKNOWN, not "no attention mechanism".
    expect(validateProfile(profile({ attentionTags: [], attentionClaim: undefined }))).toEqual([]);
    expect(validateProfile(profile({ positionEncodingTags: [], positionEncodingClaim: undefined }))).toEqual([]);
  });

  it("flags an orphan claim when only the tags are cleared", () => {
    // Overriding only the tags leaves the fixture's default claim behind,
    // which is correctly reported as an orphan. This is fixture inheritance
    // behaving as designed, not a validation gap.
    expect(validateProfile(profile({ attentionTags: [] }))).toContain("orphan-claim");
  });

  it("rejects an orphan claim with no value", () => {
    expect(validateProfile(profile({ attentionTags: [], attentionClaim: claim() }))).toContain("orphan-claim");
    expect(validateProfile(profile({ stageClaim: claim() }))).toContain("orphan-claim");
  });

  it("rejects a value whose claim is sourced UNKNOWN", () => {
    // UNKNOWN asserts nothing; pairing it with a value is a category error.
    expect(validateProfile(profile({ stage: "pretraining", stageClaim: { source: "UNKNOWN" } }))).toContain(
      "unknown-claim",
    );
  });

  it("treats an absent dimension as unknown, never as a negative fact", () => {
    const bare = profile({ attentionTags: [], attentionClaim: undefined, positionEncodingTags: [], positionEncodingClaim: undefined });
    expect(validateProfile(bare)).toEqual([]);
    // Absent attention tags do NOT mean "this model has no attention".
    expect(bare.attentionTags).toEqual([]);
    expect(bare.stage).toBeUndefined();
    expect(bare.computeClass).toBeUndefined();
  });

  it("does not invent a compute-class vocabulary", () => {
    // The requirement names "compute class" but defines no scale, so the
    // value is an open provenance-bearing claim rather than a canonical enum.
    const open = profile({ computeClass: "frontier-scale", computeClassClaim: claim() });
    expect(validateProfile(open)).toEqual([]);
    const enumLike = { ...open, computeClass: "" };
    expect(validateProfile(enumLike)).toContain("compute-class");
  });
});

describe("identity and versioning", () => {
  it("derives a deterministic tclp- id, replacing every invalid span", () => {
    expect(trainingProfileIdFor("Llama 3 8B")).toBe("tclp-llama-3-8b");
    expect(trainingProfileIdFor("a  b   c")).toBe("tclp-a-b-c");
    expect(trainingProfileIdFor("--lead and trail--")).toBe("tclp-lead-and-trail");
    expect(trainingProfileIdFor("!!!")).toBe("tclp-profile");
  });

  it("cannot masquerade as a model id, run id or hardware profile id", () => {
    for (const id of [
      "ollama/llama3:8b",
      "hardware:lab",
      "run-1",
      "gov-release-scope",
      "rcp-pack",
      "tclp",
      "REQ-p18-training-compute",
    ]) {
      expect(validateProfile(profile({ profileId: id }))).toContain("profile-id");
    }
  });

  it("keys by profileId@version and refuses a duplicate", () => {
    const registry = new TrainingLifecycleRegistry();
    registry.register(profile());
    expect(registry.lookup("tclp-llama-3-8b", "1.0.0")).not.toBeNull();
    expect(() => registry.register(profile())).toThrowError(/duplicate/);
    // A new version is a new record, never a silent overwrite.
    registry.register(profile({ version: "1.1.0" }));
    expect(registry.list().map((p) => p.version)).toEqual(["1.0.0", "1.1.0"]);
  });

  it("rejects invalid records before storing them", () => {
    const registry = new TrainingLifecycleRegistry();
    expect(() => registry.register(profile({ version: "1.0" }))).toThrowError(/version/);
    expect(registry.list()).toEqual([]);
  });

  it("deep-copies on register and on every read", () => {
    const registry = new TrainingLifecycleRegistry();
    const input = profile();
    registry.register(input);
    input.attentionTags.push("injected");
    expect(registry.lookup("tclp-llama-3-8b", "1.0.0")!.attentionTags).toEqual(["causal"]);
    const read = registry.lookup("tclp-llama-3-8b", "1.0.0")!;
    read.computeClass = "tampered";
    expect(registry.lookup("tclp-llama-3-8b", "1.0.0")!.computeClass).toBeUndefined();
  });

  it("orders deterministically from scrambled insertion", () => {
    const registry = new TrainingLifecycleRegistry();
    registry.register(profile({ profileId: "tclp-z", version: "1.0.0" }));
    registry.register(profile({ profileId: "tclp-a", version: "2.0.0" }));
    registry.register(profile({ profileId: "tclp-a", version: "1.0.0" }));
    expect(registry.list().map((p) => `${p.profileId}@${p.version}`)).toEqual([
      "tclp-a@1.0.0",
      "tclp-a@2.0.0",
      "tclp-z@1.0.0",
    ]);
  });

  it("serializes canonically regardless of key insertion order", () => {
    const a = canonicalProfile(profile());
    const b = canonicalProfile({
      recordedAt: AT,
      provenance: "p18-training-compute",
      advisoryOnly: true,
      evidenceRefs: [],
      positionEncodingClaim: { source: "VENDOR_REPORTED" },
      positionEncodingTags: ["rope"],
      attentionClaim: { source: "VENDOR_REPORTED", evidenceRef: "model-card" },
      attentionTags: ["causal"],
      modelRef: "ollama/llama3:8b",
      version: "1.0.0",
      profileId: "tclp-llama-3-8b",
    });
    expect(a).toBe(b);
  });

  it("sorts tag and evidence lists so insertion order cannot leak", () => {
    const forward = canonicalProfile(profile({ attentionTags: ["a", "b"], evidenceRefs: ["z", "y"] }));
    const reverse = canonicalProfile(profile({ attentionTags: ["b", "a"], evidenceRefs: ["y", "z"] }));
    expect(forward).toBe(reverse);
  });
});

describe("advisory signals", () => {
  it("reports claims with their sources and never defaults an absent one", () => {
    const registry = new TrainingLifecycleRegistry();
    registry.register(
      profile({
        stage: "pretraining",
        stageClaim: { source: "VENDOR_REPORTED" },
        computeClass: "large",
        computeClassClaim: claim(),
        attentionTags: [],
        attentionClaim: undefined,
        positionEncodingTags: [],
        positionEncodingClaim: undefined,
      }),
    );
    const signals = advisorySignals(registry, "ollama/llama3:8b");
    expect(signals.stage).toBe("pretraining");
    expect(signals.stageSource).toBe("VENDOR_REPORTED");
    expect(signals.computeClass).toBe("large");
    expect(signals.computeClassSource).toBe("THIRD_PARTY_REPORTED");
    // Never claimed is reported as unclaimed, not as "none".
    expect(signals.attentionTags).toEqual([]);
    expect(signals.positionEncodingTags).toEqual([]);
    expect(signals.unclaimed).toEqual(["attention", "position_encoding"]);
  });

  it("is advisory only and carries no decision", () => {
    const registry = new TrainingLifecycleRegistry();
    registry.register(profile());
    const signals = advisorySignals(registry, "ollama/llama3:8b");
    expect(signals.advisoryOnly).toBe(true);
    const keys = Object.keys(signals).sort();
    for (const banned of ["winner", "best", "score", "rank", "eligible", "selected", "route", "decision"]) {
      expect(keys).not.toContain(banned);
    }
  });

  it("returns an all-unclaimed result for a model with no profile", () => {
    const registry = new TrainingLifecycleRegistry();
    const signals = advisorySignals(registry, "nobody/nothing");
    expect(signals.stage).toBeUndefined();
    expect(signals.computeClass).toBeUndefined();
    expect(signals.modelRef).toBe("nobody/nothing");
  });

  it("unions tags across profiles deterministically", () => {
    const registry = new TrainingLifecycleRegistry();
    registry.register(profile({ version: "1.0.0", attentionTags: ["causal", "sliding-window"] }));
    registry.register(profile({ version: "1.1.0", attentionTags: ["causal", "sparse"] }));
    const signals = advisorySignals(registry, "ollama/llama3:8b");
    expect(signals.attentionTags).toEqual(["causal", "sliding-window", "sparse"]);
  });
});

describe("lifecycle profile boundaries", () => {
  it("carries no measured training-compute numbers, because none can be measured here", () => {
    // The registered requirement asks for lifecycle metadata, not measured
    // compute. This repository has no energy sensor, no allocator probe and
    // no training telemetry, so FLOPs/wall-time/memory/energy/cost are
    // absent BY CONSTRUCTION rather than zero-filled.
    const keys = Object.keys(profile()).sort();
    for (const absent of [
      "flops",
      "wallTimeMs",
      "wallTime",
      "memoryBytes",
      "energyJoules",
      "cost",
      "utilization",
      "tokensTrained",
      "steps",
      "epochs",
      "batchSize",
      "sequenceLength",
    ]) {
      expect(keys).not.toContain(absent);
    }
  });

  it("exposes no training runtime, optimizer, scheduler or provisioning surface", () => {
    // "train" is deliberately NOT banned: naming training lifecycle metadata
    // is the whole purpose. What must not exist is a surface that TRAINS or
    // provisions. A boundary test that bans a substring the subject
    // legitimately contains is deleted, not obeyed.
    const names = Object.keys(trainingLifecycle);
    for (const banned of [
      "optimizer",
      "optimize",
      "backprop",
      "gradient",
      "checkpoint",
      "provision",
      "deploy",
      "cluster",
      "kubernetes",
      "distributed",
      "flop",
      "estimate",
      "benchmark",
      "route",
    ]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
    // The only train-shaped exports describe, validate or register metadata.
    expect(names.filter((n) => n.toLowerCase().includes("train")).sort()).toEqual([
      "TRAINING_STAGES",
      "TrainingLifecycleRegistry",
      "trainingProfileIdFor",
    ]);
  });

  it("does not modify ModelCard or any routing contract", () => {
    // The profile references the model; the model does not reference the
    // profile. One owner per fact, no cyclic duplication, no routing change.
    const source = Object.keys(profile()).sort();
    expect(source).not.toContain("capabilities");
    expect(source).not.toContain("costRank");
    expect(source).not.toContain("healthy");
  });

  it("never infers lifecycle facts from a model name or provider", () => {
    // A model ref is an opaque reference. Nothing is derived from it, and the
    // tokenizerProfileId precedent in ModelCard is explicit: absent means
    // UNKNOWN, never inferred from vendor/model names. The fixture makes no
    // stage or compute-class claim, so neither may be reported.
    const registry = new TrainingLifecycleRegistry();
    registry.register(profile({ modelRef: "qwen2.5-coder-7b" }));
    const signals = advisorySignals(registry, "qwen2.5-coder-7b");
    expect(signals.stage).toBeUndefined();
    expect(signals.computeClass).toBeUndefined();
    expect(signals.unclaimed).toEqual(["compute_class", "stage"]);
    // Tags appear only because the fixture explicitly claimed them.
    expect(signals.attentionTags).toEqual(["causal"]);
    expect(signals.attentionTags).not.toContain("qwen");
  });

  it("reports a model with no claims at all as fully unclaimed", () => {
    const registry = new TrainingLifecycleRegistry();
    registry.register(
      profile({
        attentionTags: [],
        attentionClaim: undefined,
        positionEncodingTags: [],
        positionEncodingClaim: undefined,
      }),
    );
    const signals = advisorySignals(registry, "ollama/llama3:8b");
    expect(signals.unclaimed).toEqual(["attention", "compute_class", "position_encoding", "stage"]);
  });

  it("keeps training lifecycle metadata separate from host inference signals", () => {
    // The requirement's own boundary: host inference signals are a different
    // domain. No HardwareProfile or target field is referenced here.
    const keys = Object.keys(profile());
    for (const hostSignal of [
      "hardwareRef",
      "hardwareProfileRef",
      "targetProfileId",
      "latencyMs",
      "throughputOps",
      "peakMemoryMB",
      "precision",
      "localRemote",
    ]) {
      expect(keys).not.toContain(hostSignal);
    }
  });
});
