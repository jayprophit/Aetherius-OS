import { describe, expect, it } from "vitest";
import {
  ARTIFACT_DOMAINS,
  DIGEST_ALGORITHM,
  addRecord,
  coverageByDomain,
  createRegistry,
  recordArtifact,
} from "./attestation";
import type { RecordArtifactInput } from "./attestation";

const AT = "2026-09-27T12:00:00.000Z";
const BYTES = new TextEncoder().encode("artifact-bytes-v1");

/** Dimension-specific fixtures: every record declares its own fields. */
function input(over: Partial<RecordArtifactInput> = {}): RecordArtifactInput {
  return {
    artifactId: "artifact:mat-query-1.0.0",
    domain: "apps",
    name: "mat-query-service",
    version: "1.0.0",
    bytes: BYTES,
    sbom: [
      { name: "runtime-lib", version: "2.4.0", origin: "external-package", licence: "MIT" },
    ],
    sbomGaps: [],
    signature: {
      algorithm: "ed25519",
      keyRef: "keys:release-2026",
      value: "c2lnbmF0dXJlLXZvci10ZXN0aW5nLW9ubHk=",
    },
    provenance: {
      sourceRevision: "9f3c2ab1d4e5f60718293a4b5c6d7e8f90a1b2c3d",
      builder: { tool: "vite-6.2.0", host: "build-host-03", actor: "ci:release-pipeline" },
      toolchainRefs: ["tool:node-22"],
      artifactDigest: "COMPUTED",
      testEvidenceRefs: ["evidence:full-suite-1246"],
    },
    recordedAt: AT,
    ...over,
  };
}

/** Fill the provenance digest with the digest the module itself computes. */
function withBoundProvenance(over: Partial<RecordArtifactInput> = {}): RecordArtifactInput {
  const base = input(over);
  const digest = recordArtifact({ ...base, provenance: undefined }).digest;
  return {
    ...base,
    provenance: { ...(base.provenance as Record<string, unknown>), artifactDigest: digest },
  };
}

describe("supply chain: registered vocabulary", () => {
  it("declares the six artifact domains and the sha256 algorithm", () => {
    expect([...ARTIFACT_DOMAINS]).toEqual(["apps", "models", "skills", "plugins", "workflows", "datasets"]);
    expect(DIGEST_ALGORITHM).toBe("sha256");
  });
});

describe("supply chain: artifact identity and digests", () => {
  it("computes the digest from the exact bytes with the approved algorithm", () => {
    const record = recordArtifact(withBoundProvenance());
    expect(record.digest).toMatch(/^[0-9a-f]{64}$/);
    expect(record.digestAlgorithm).toBe("sha256");
    expect(record.byteLength).toBe(BYTES.byteLength);
    expect(record.provenanceClass).toBe("DIGEST_BOUND");
  });

  it("changes the digest when the bytes change", () => {
    const a = recordArtifact(withBoundProvenance({ bytes: new TextEncoder().encode("v1") }));
    const b = recordArtifact(withBoundProvenance({ bytes: new TextEncoder().encode("v2") }));
    expect(a.digest).not.toBe(b.digest);
  });

  it("keeps name and version distinct from the digest", () => {
    const record = recordArtifact(withBoundProvenance());
    expect(record.name).toBe("mat-query-service");
    expect(record.version).toBe("1.0.0");
    expect(record.digest).not.toContain("mat-query");
  });

  it("rejects empty bytes, empty identity, and unknown domains", () => {
    expect(() => recordArtifact(input({ bytes: new Uint8Array(0) }))).toThrowError(
      expect.objectContaining({ code: "SUPPLY_INVALID_INPUT" }),
    );
    expect(() => recordArtifact(input({ artifactId: "" }))).toThrowError(
      expect.objectContaining({ code: "SUPPLY_INVALID_INPUT" }),
    );
    expect(() => recordArtifact(input({ domain: "firmware" as never }))).toThrowError(
      expect.objectContaining({ code: "SUPPLY_INVALID_INPUT" }),
    );
  });

  it("rejects malformed provenance digests", () => {
    expect(() =>
      recordArtifact(input({ provenance: { ...(input().provenance as Record<string, unknown>), artifactDigest: "abc" } })),
    ).toThrowError(expect.objectContaining({ code: "SUPPLY_BAD_DIGEST" }));
  });
});

describe("supply chain: SBOM completeness is derived", () => {
  it("marks a fully described SBOM COMPLETE", () => {
    expect(recordArtifact(withBoundProvenance()).sbomCompleteness).toBe("COMPLETE");
  });

  it("marks an UNKNOWN licence PARTIAL, never complete", () => {
    const record = recordArtifact(
      withBoundProvenance({
        sbom: [{ name: "mystery-lib", version: "0.3.0", origin: "external-package", licence: "UNKNOWN" }],
        sbomGaps: ["licence unknown for mystery-lib 0.3.0"],
      }),
    );
    expect(record.sbomCompleteness).toBe("PARTIAL");
  });

  it("requires named gaps for PARTIAL and UNAVAILABLE records", () => {
    expect(() =>
      recordArtifact(
        input({
          sbom: [{ name: "mystery-lib", version: "0.3.0", origin: "external-package", licence: "UNKNOWN" }],
          sbomGaps: [],
          provenance: undefined,
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "SUPPLY_INVALID_INPUT" }));
  });

  it("rejects an asserted COMPLETE that contradicts the evidence", () => {
    expect(() =>
      recordArtifact(
        input({
          sbom: [{ name: "mystery-lib", version: "0.3.0", origin: "external-package", licence: "UNKNOWN" }],
          sbomCompleteness: "COMPLETE",
          sbomGaps: [],
          provenance: undefined,
        } as never),
      ),
    ).toThrowError(expect.objectContaining({ code: "SUPPLY_INVALID_INPUT" }));
  });

  it("rejects invented origins and unattributed components", () => {
    expect(() =>
      recordArtifact(
        input({
          sbom: [{ name: "x", version: "1", origin: "trusted-vendor", licence: "MIT" }],
          sbomGaps: [],
          provenance: undefined,
        } as never),
      ),
    ).toThrowError(expect.objectContaining({ code: "SUPPLY_INVALID_INPUT" }));
  });

  it("sorts components canonically and keeps versions distinct", () => {
    const record = recordArtifact(
      withBoundProvenance({
        sbom: [
          { name: "zeta", version: "1.0.0", origin: "external-package", licence: "MIT" },
          { name: "alpha", version: "2.0.0", origin: "external-package", licence: "MIT" },
          { name: "alpha", version: "1.0.0", origin: "external-package", licence: "MIT" },
        ],
      }),
    );
    expect(record.sbom.map((c) => `${c.name}@${c.version}`)).toEqual([
      "alpha@1.0.0",
      "alpha@2.0.0",
      "zeta@1.0.0",
    ]);
  });
});

describe("supply chain: signatures are claims, never verifications", () => {
  it("records a signature claim as CLAIMED_UNVERIFIED", () => {
    const record = recordArtifact(withBoundProvenance());
    expect(record.signature).toMatchObject({ algorithm: "ed25519", keyRef: "keys:release-2026" });
    expect(record.signatureVerified).toBe(false);
    expect(record.signatureStatus).toBe("CLAIMED_UNVERIFIED");
  });

  it("records absence as ABSENT, not as a negative verdict", () => {
    const record = recordArtifact({ ...withBoundProvenance(), signature: null });
    expect(record.signature).toBeNull();
    expect(record.signatureStatus).toBe("ABSENT");
  });

  it("rejects partial signature claims", () => {
    expect(() =>
      recordArtifact(input({ signature: { algorithm: "ed25519" }, provenance: undefined } as never)),
    ).toThrowError(expect.objectContaining({ code: "SUPPLY_INVALID_INPUT" }));
  });

  it("rejects raw signing keys and credentials before shape errors", () => {
    expect(() => recordArtifact(input({ signature: { algorithm: "x", keyRef: "k", value: "v", privateKey: "sk" } } as never))).toThrowError(
      expect.objectContaining({ code: "SUPPLY_SECRET_REJECTED" }),
    );
    expect(() =>
      recordArtifact(input({ provenance: { ...(input().provenance as Record<string, unknown>), signingKey: "sk" } } as never)),
    ).toThrowError(expect.objectContaining({ code: "SUPPLY_SECRET_REJECTED" }));
  });
});

describe("supply chain: provenance binds digests or fails", () => {
  it("rejects a provenance digest that does not equal the artifact digest", () => {
    expect(() =>
      recordArtifact(
        input({
          provenance: {
            ...(input().provenance as Record<string, unknown>),
            artifactDigest: "0".repeat(64),
          },
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "SUPPLY_DIGEST_MISMATCH" }));
  });

  it("requires distinct builder tool, host, and actor", () => {
    const base = input().provenance as Record<string, unknown>;
    expect(() =>
      recordArtifact(input({ provenance: { ...base, builder: { tool: "vite", host: "h" } } } as never)),
    ).toThrowError(expect.objectContaining({ code: "SUPPLY_INVALID_INPUT" }));
  });

  it("requires an observed source revision, never a branch name shortcut", () => {
    const base = input().provenance as Record<string, unknown>;
    expect(() => recordArtifact(input({ provenance: { ...base, sourceRevision: "" } }))).toThrowError(
      expect.objectContaining({ code: "SUPPLY_INVALID_INPUT" }),
    );
  });

  it("keeps toolchain, config, test, and environment facts as references", () => {
    const record = recordArtifact(withBoundProvenance());
    expect(record.provenance!.toolchainRefs).toEqual(["tool:node-22"]);
    expect(record.provenance!.testEvidenceRefs).toEqual(["evidence:full-suite-1246"]);
  });
});

describe("supply chain: registry conventions and coverage", () => {
  it("is idempotent for identical content and conflicts on changed content", () => {
    const registry = addRecord(createRegistry(), recordArtifact(withBoundProvenance()));
    expect(addRecord(registry, recordArtifact(withBoundProvenance())).records).toHaveLength(1);
    expect(() =>
      addRecord(registry, recordArtifact(withBoundProvenance({ bytes: new TextEncoder().encode("changed") }))),
    ).toThrowError(expect.objectContaining({ code: "SUPPLY_CONFLICT" }));
  });

  it("keeps same-name different-version artifacts distinct", () => {
    let registry = createRegistry();
    registry = addRecord(registry, recordArtifact(withBoundProvenance({ version: "1.0.0" })));
    registry = addRecord(
      registry,
      recordArtifact(withBoundProvenance({ artifactId: "artifact:mat-query-1.0.0", version: "2.0.0", bytes: new TextEncoder().encode("v2") })),
    );
    expect(registry.records).toHaveLength(2);
  });

  it("reports per-domain coverage with no verdicts", () => {
    let registry = createRegistry();
    registry = addRecord(registry, recordArtifact(withBoundProvenance()));
    registry = addRecord(
      registry,
      recordArtifact(
        input({
          artifactId: "artifact:policy-engine-3.1.0",
          domain: "models",
          name: "policy-engine",
          version: "3.1.0",
          bytes: new TextEncoder().encode("model-bytes"),
          sbom: [{ name: "weights", version: "3.1.0", origin: "first-party", licence: "UNKNOWN" }],
          sbomGaps: ["licence unknown for weights 3.1.0"],
          signature: null,
          provenance: undefined,
        }),
      ),
    );
    const coverage = coverageByDomain(registry);
    expect(coverage).toHaveLength(6);
    expect(coverage.find((c) => c.domain === "apps")).toMatchObject({
      artifacts: 1, withSbomComplete: 1, withLicenceKnown: 1, withHash: 1, withSignatureClaim: 1, withProvenance: 1,
    });
    expect(coverage.find((c) => c.domain === "models")).toMatchObject({
      artifacts: 1, withSbomComplete: 0, withLicenceKnown: 0, withHash: 1, withSignatureClaim: 0, withProvenance: 0,
    });
    expect(coverage.find((c) => c.domain === "datasets")).toMatchObject({
      artifacts: 0, withSbomComplete: 0, withLicenceKnown: 0, withHash: 0, withSignatureClaim: 0, withProvenance: 0,
    });
  });

  it("emits no release, deploy, or authorization surface", () => {
    const body = JSON.stringify(coverageByDomain(addRecord(createRegistry(), recordArtifact(withBoundProvenance()))));
    for (const banned of ["release", "deploy", "approv", "authoriz", "permission", "verdict", "pass", "score"]) {
      expect(body.toLowerCase()).not.toContain(banned);
    }
  });

  it("rejects authority, secrets, and persona with their own codes", () => {
    expect(() => recordArtifact({ ...input(), releaseApproved: true } as never)).toThrowError(
      expect.objectContaining({ code: "SUPPLY_AUTHORITY_REJECTED" }),
    );
    expect(() => recordArtifact({ ...input(), token: "t" } as never)).toThrowError(
      expect.objectContaining({ code: "SUPPLY_SECRET_REJECTED" }),
    );
    expect(() => recordArtifact({ ...input(), persona: "p" } as never)).toThrowError(
      expect.objectContaining({ code: "SUPPLY_PERSONALITY_REJECTED" }),
    );
  });

  it("rejects unknown fields and non-object input", () => {
    expect(() => recordArtifact({ ...input(), installer: "setup.exe" } as never)).toThrowError(
      expect.objectContaining({ code: "SUPPLY_UNKNOWN_FIELD" }),
    );
    expect(() => recordArtifact("artifact")).toThrowError(
      expect.objectContaining({ code: "SUPPLY_INVALID_INPUT" }),
    );
  });

  it("is deterministic from scrambled input", () => {
    const a = recordArtifact(withBoundProvenance());
    const b = recordArtifact(
      withBoundProvenance({
        sbom: [{ name: "runtime-lib", version: "2.4.0", origin: "external-package", licence: "MIT" }],
      }),
    );
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
