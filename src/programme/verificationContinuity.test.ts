import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileStateStore } from "../state/store";
import { composeArtifact } from "../state/artifacts";
import type { StateEnvelope } from "../state/types";
import { buildPackage } from "../workflows/packages";
import type { Skill } from "../workflows/types";
import {
  VERIFICATION_ENVIRONMENTS,
  VerificationContinuityError,
  assessVerificationContinuity,
  composeVerificationRecord,
  parseVerificationRecord,
  persistVerificationRecord,
  readVerificationRecord,
  serializeVerificationRecord,
} from "./verificationContinuity";
import type { ComposeVerificationInput } from "./verificationContinuity";

const CAUSE = { actor: "continuity-fixture", source: "verificationContinuity.test" };
const NOW = "2026-09-23T00:00:00.000Z";
const COMMIT = "bd29438";
const BASELINE = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function skill(): Skill {
  return {
    skill_id: "continuity",
    version: "1.0.0",
    name: "Continuity",
    description: "continuity",
    capability: "verification",
    inputs: [],
    outputs: [],
    required_capabilities: ["read"],
    required_permissions: ["fs.read"],
    required_tools: [],
    supported_platforms: ["*"],
    execution_kind: "test",
    implementation_ref: "test:continuity",
    risk_class: "low",
    provenance: "fixture",
    status: "REGISTERED",
  };
}

function bundle(): Map<string, Uint8Array> {
  return new Map([["CAPSULE.md", new TextEncoder().encode("# continuity")]]);
}

const REQUIRED = [
  { key: "regression-tests", description: "regression suite results" },
  { key: "concurrency-results", description: "concurrency results under contention" },
  { key: "negative-control", description: "mutation or negative-control evidence" },
];

function providedEvidence(environment: (typeof VERIFICATION_ENVIRONMENTS)[number], key: string, ref = `suite:${environment}:${key}`) {
  return { environment, evidence: { key, kind: "test-report" as const, passed: true, ref } };
}

let firstRoot = "";
let secondRoot = "";

beforeEach(() => {
  firstRoot = mkdtempSync(join(tmpdir(), "verification-first-"));
  secondRoot = mkdtempSync(join(tmpdir(), "verification-second-"));
});

afterEach(() => {
  rmSync(firstRoot, { recursive: true, force: true });
  rmSync(secondRoot, { recursive: true, force: true });
});

function sourceEnvelope(store: FileStateStore, id = "evidence-source") {
  return store.save(
    {
      id,
      kind: "evidence.record",
      schemaVersion: 1,
      recordVersion: 1,
      createdAt: NOW,
      updatedAt: NOW,
      owner: "aetherius-os",
      provenance: "continuity-fixture",
      sensitivity: "SYSTEM",
      integrity: "",
      payload: { subject: "regression evidence" },
    },
    { causedBy: CAUSE, now: () => NOW },
  );
}

function sourceDescriptor(envelope: StateEnvelope<unknown>) {
  return composeArtifact({
    artifactId: "evidence-source-envelope-1.0.0",
    artifactClass: "evidence",
    content: { bytes: new TextEncoder().encode("source envelope bytes") },
    provenance: "continuity-fixture",
    version: "1.0.0",
    verificationState: "UNVERIFIED",
    securityClassification: "SYSTEM",
    envelope: {
      envelopeId: envelope.id,
      kind: envelope.kind,
      schemaVersion: envelope.schemaVersion,
      recordVersion: envelope.recordVersion,
      integrity: envelope.integrity,
      sensitivity: envelope.sensitivity,
    },
  });
}

function input(store: FileStateStore, over: Partial<ComposeVerificationInput> = {}): ComposeVerificationInput {
  const envelope = sourceEnvelope(store);
  const manifest = buildPackage(skill(), bundle(), { now: () => NOW });
  const evidence = VERIFICATION_ENVIRONMENTS.flatMap((environment) =>
    REQUIRED.map((requirement) => providedEvidence(environment, requirement.key)),
  );
  const record: ComposeVerificationInput = {
    recordId: "verify-regression-1",
    createdAt: NOW,
    provenance: "continuity-fixture",
    sensitivity: "SYSTEM",
    source: {
      repository: "aetherius-os",
      ref: "main",
      commit: COMMIT,
      baselineDigest: BASELINE,
      capturedAt: NOW,
    },
    environments: [...VERIFICATION_ENVIRONMENTS],
    packageManifests: [manifest],
    artifactSources: [
      { descriptor: sourceDescriptor(envelope), envelope: envelope as StateEnvelope<unknown> },
    ],
    graph: [
      {
        from: { kind: "commit", id: COMMIT },
        to: { kind: "verification", id: "verify-regression-1" },
        relation: "EVIDENCE_FOR",
        provenance: "continuity-fixture",
      },
      {
        from: { kind: "artifact", id: "evidence-source-envelope-1.0.0" },
        to: { kind: "verification", id: "verify-regression-1" },
        relation: "EVIDENCE_FOR",
        provenance: "continuity-fixture",
      },
    ],
    requiredEvidence: REQUIRED,
    evidence,
    cleanEnvironment: { claimed: false },
  };
  return { ...record, ...over };
}

function expectContinuityError(fn: () => unknown, code: string) {
  try {
    fn();
    throw new Error("invalid verification input was accepted");
  } catch (error) {
    expect(error).toBeInstanceOf(VerificationContinuityError);
    expect((error as VerificationContinuityError).code).toBe(code);
  }
}

describe("portable verification records", () => {
  it("covers every named execution environment with the same deterministic bytes", () => {
    const store = new FileStateStore(firstRoot, 1);
    const record = composeVerificationRecord(input(store));
    expect(record.environments).toEqual([...VERIFICATION_ENVIRONMENTS]);
    expect(assessVerificationContinuity(record).coverage).toBe("COMPLETE");
    const reordered = composeVerificationRecord(
      input(store, {
        environments: [...VERIFICATION_ENVIRONMENTS].reverse(),
        requiredEvidence: [...REQUIRED].reverse(),
        evidence: [...input(store).evidence].reverse(),
      }),
    );
    expect(serializeVerificationRecord(reordered)).toBe(serializeVerificationRecord(record));
  });

  it("survives export, separate persistence and reload without changing identity", () => {
    const first = new FileStateStore(firstRoot, 1);
    const second = new FileStateStore(secondRoot, 1);
    const record = composeVerificationRecord(input(first));
    const stored = persistVerificationRecord(first, record, { now: NOW, causedBy: CAUSE });
    const exported = JSON.stringify(first.load(stored.id));
    const imported = JSON.parse(exported) as StateEnvelope<never>;
    const restored = second.save(
      { ...imported, updatedAt: NOW },
      { causedBy: { actor: "recovery", source: "imported verification record" }, now: () => NOW },
    );
    expect(readVerificationRecord(restored).recordDigest).toBe(record.recordDigest);
    expect(parseVerificationRecord(serializeVerificationRecord(record))).toEqual(record);
  });

  it("refuses altered bytes after the digest was computed", () => {
    const store = new FileStateStore(firstRoot, 1);
    const record = composeVerificationRecord(input(store));
    const serialized = serializeVerificationRecord(record).replace(COMMIT, "c000000");
    expectContinuityError(() => parseVerificationRecord(serialized), "VERIFICATION_RECORD_DIGEST_MISMATCH");
  });

  it("refuses an unknown execution environment", () => {
    const store = new FileStateStore(firstRoot, 1);
    expectContinuityError(
      () => composeVerificationRecord(input(store, { environments: ["staging"] as never })),
      "VERIFICATION_ENVIRONMENT_UNKNOWN",
    );
  });

  it("reports the environment whose required evidence is missing", () => {
    const store = new FileStateStore(firstRoot, 1);
    const complete = input(store);
    const record = composeVerificationRecord({
      ...complete,
      evidence: complete.evidence.filter(
        (entry) => !(entry.environment === "ci" && entry.evidence.key === "negative-control"),
      ),
    });
    const assessment = assessVerificationContinuity(record);
    expect(assessment.coverage).toBe("INCOMPLETE");
    expect(assessment.completeEnvironments).toHaveLength(VERIFICATION_ENVIRONMENTS.length - 1);
    expect(assessment.incompleteEnvironments.map((entry) => entry.environment)).toEqual(["ci"]);
    expect(assessment.incompleteEnvironments[0]!.gate.missing).toEqual(["negative-control"]);
  });

  it("rejects an altered package rather than enclosing it", () => {
    const store = new FileStateStore(firstRoot, 1);
    const manifest = buildPackage(skill(), bundle(), { now: () => NOW });
    const altered = { ...manifest, manifestSha256: "0".repeat(64) };
    expectContinuityError(
      () => composeVerificationRecord(input(store, { packageManifests: [altered] })),
      "VERIFICATION_PACKAGE_REFERENCE_INVALID",
    );
  });

  it("rejects an artifact that does not describe its live envelope", () => {
    const store = new FileStateStore(firstRoot, 1);
    const envelope = sourceEnvelope(store);
    const complete = input(store);
    const source = complete.artifactSources[0]!;
    const alteredSource = {
      ...source,
      envelope: { ...envelope, recordVersion: envelope.recordVersion + 1 },
    };
    expectContinuityError(
      () => composeVerificationRecord(input(store, { artifactSources: [alteredSource] })),
      "VERIFICATION_ARTIFACT_INVALID",
    );
  });

  it("validates evidence-graph linkage instead of copying another graph", () => {
    const store = new FileStateStore(firstRoot, 1);
    expectContinuityError(
      () =>
        composeVerificationRecord(
          input(store, {
            graph: [
              {
                from: { kind: "commit", id: COMMIT },
                to: { kind: "commit", id: COMMIT },
                relation: "EVIDENCE_FOR",
                provenance: "continuity-fixture",
              },
            ],
          }),
        ),
      "VERIFICATION_GRAPH_EDGE_INVALID",
    );
  });

  it("rejects secret-shaped fields and values", () => {
    const store = new FileStateStore(firstRoot, 1);
    expectContinuityError(
      () =>
        composeVerificationRecord(
          input(store, {
            evidence: [
              providedEvidence("local", "regression-tests", "api-key=sk-live-123"),
              ...REQUIRED.filter((requirement) => requirement.key !== "regression-tests").flatMap(
                (requirement) => VERIFICATION_ENVIRONMENTS.map((environment) => providedEvidence(environment, requirement.key)),
              ),
              ...VERIFICATION_ENVIRONMENTS.filter((environment) => environment !== "local").map((environment) =>
                providedEvidence(environment, "regression-tests"),
              ),
            ],
          }),
        ),
      "VERIFICATION_SECRET_REJECTED",
    );
  });

  it("leaves clean-environment status unclaimed unless explicitly proven", () => {
    const store = new FileStateStore(firstRoot, 1);
    expect(assessVerificationContinuity(composeVerificationRecord(input(store))).cleanEnvironment).toBe("UNCLAIMED");
    expectContinuityError(
      () => composeVerificationRecord(input(store, { cleanEnvironment: { claimed: true } })),
      "VERIFICATION_CLEAN_ENVIRONMENT_INVALID",
    );
  });

  it("accepts an explicit clean-environment proof without treating it as a gate verdict", () => {
    const store = new FileStateStore(firstRoot, 1);
    const proof = {
      environment: "local" as const,
      evidence: { key: "clean-environment-proof", kind: "verification" as const, passed: true, ref: "clean-room-run-7" },
    };
    const record = composeVerificationRecord(
      input(store, {
        evidence: [...input(store).evidence, proof],
        cleanEnvironment: { claimed: true, proofRef: "clean-room-run-7" },
      }),
    );
    const assessment = assessVerificationContinuity(record);
    expect(assessment.cleanEnvironment).toBe("PROVEN");
    expect(assessment.coverage).toBe("COMPLETE");
  });

  it("refuses to overwrite an occupied verification id silently", () => {
    const store = new FileStateStore(firstRoot, 1);
    const record = composeVerificationRecord(input(store));
    persistVerificationRecord(store, record, { now: NOW, causedBy: CAUSE });
    const altered = composeVerificationRecord(input(store, { provenance: "different provenance" }));
    expectContinuityError(
      () => persistVerificationRecord(store, altered, { now: NOW, causedBy: CAUSE }),
      "VERIFICATION_RECORD_CONFLICT",
    );
  });
});
