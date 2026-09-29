import { describe, expect, it } from "vitest";
import {
  addRecord,
  createRegistry,
  recordArtifact,
} from "../supply/attestation";
import type { ArtifactRecord } from "../supply/attestation";
import { recordPackage } from "./packaging";
import type { AttestationLookup } from "./packaging";

/**
 * COMPLETION MODE integration evidence: the supply-chain attestation
 * registry and the release packaging module were designed to compose
 * through a caller-supplied attestation lookup, with neither module
 * importing the other. This suite proves that seam with real records on
 * both sides — not mocks of the seam itself.
 *
 * What it proves:
 * - an attested artifact digest verifies inside a release package
 *   (VERIFIED, not ASSERTED);
 * - a tampered package digest fails against attestation (DIGEST_MISMATCH);
 * - an unattested artifact records ASSERTED explicitly (no silent upgrade);
 * - SBOM completeness derived in attestation survives the package boundary
 *   as referenced evidence, never recomputed.
 */

const AT = "2026-09-29T12:00:00.000Z";

function attestedArtifact(): { record: ArtifactRecord; bytes: Uint8Array } {
  const bytes = new TextEncoder().encode("release-binary-v1");
  const record = recordArtifact({
    artifactId: "artifact:core-2.0.0",
    domain: "apps",
    name: "core-service",
    version: "2.0.0",
    bytes,
    sbom: [{ name: "runtime", version: "9.1.0", origin: "external-package", licence: "MIT" }],
    sbomGaps: [],
    signature: null,
    provenance: undefined,
    recordedAt: AT,
  });
  return { record, bytes };
}

function lookupOver(records: ArtifactRecord[]): AttestationLookup {
  const byId = new Map(records.map((r) => [r.artifactId, r.digest]));
  return { digestFor: (ref: string) => byId.get(ref) ?? null };
}

function packageInput(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    packageId: "pkg-core-2.0.0",
    name: "core-service",
    version: "2.0.0",
    scopeRef: "p31-scope-decision-3",
    artifacts: [{ attestationRef: "artifact:core-2.0.0", role: "binary", digest: "0".repeat(64) }],
    installPlan: { steps: [{ stepId: "setup", description: "first-run setup" }] },
    uninstallPlan: { steps: [{ stepId: "remove", description: "remove files" }], preservesDataRefs: ["user:data"] },
    recordedAt: AT,
    provenance: "integration-test",
    ...over,
  };
}

describe("integration: attestation registry composes with release packaging", () => {
  it("an attested digest verifies inside the package", () => {
    const { record } = attestedArtifact();
    const registry = addRecord(createRegistry(), record);
    const input = packageInput();
    (input.artifacts as Array<Record<string, string>>)[0]!.digest = record.digest;
    const pkg = recordPackage({ ...input, attestationLookup: lookupOver(registry.records) });
    expect(pkg.artifacts[0]!.digestStatus).toBe("VERIFIED");
    expect(pkg.artifacts[0]!.digest).toBe(record.digest);
  });

  it("a tampered package digest fails against attestation", () => {
    const { record } = attestedArtifact();
    const registry = addRecord(createRegistry(), record);
    const tampered = "f".repeat(64);
    expect(tampered).not.toBe(record.digest);
    expect(() =>
      recordPackage({
        ...packageInput({
          artifacts: [{ attestationRef: "artifact:core-2.0.0", role: "binary", digest: tampered }],
        }),
        attestationLookup: lookupOver(registry.records),
      }),
    ).toThrowError(expect.objectContaining({ code: "PACKAGING_DIGEST_MISMATCH" }));
  });

  it("an unattested artifact records ASSERTED explicitly, never upgraded", () => {
    const { record } = attestedArtifact();
    const pkg = recordPackage(packageInput({
      artifacts: [{ attestationRef: "artifact:core-2.0.0", role: "binary", digest: record.digest }],
    }));
    expect(pkg.artifacts[0]!.digestStatus).toBe("ASSERTED");
  });

  it("SBOM completeness derived in attestation is referenced, never recomputed", () => {
    const { record } = attestedArtifact();
    expect(record.sbomCompleteness).toBe("COMPLETE");
    const registry = addRecord(createRegistry(), record);
    const input = packageInput();
    (input.artifacts as Array<Record<string, string>>)[0]!.digest = record.digest;
    const pkg = recordPackage({ ...input, attestationLookup: lookupOver(registry.records) });
    expect(pkg.artifacts[0]!.attestationRef).toBe("artifact:core-2.0.0");
    expect(JSON.stringify(pkg)).not.toContain("sbomCompleteness");
  });

  it("unknown attestation refs stay unknown through the seam", () => {
    const { record } = attestedArtifact();
    const registry = addRecord(createRegistry(), record);
    const input = packageInput();
    (input.artifacts as Array<Record<string, string>>)[0]!.digest = record.digest;
    const altered = {
      ...input,
      artifacts: [{ attestationRef: "artifact:ghost-9.9.9", role: "binary", digest: record.digest }],
    };
    const pkg = recordPackage({ ...altered, attestationLookup: lookupOver(registry.records) });
    expect(pkg.artifacts[0]!.digestStatus).toBe("ASSERTED");
  });
});
