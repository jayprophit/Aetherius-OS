import { describe, expect, it } from "vitest";
import {
  compareSemver,
  parseSemver,
  recordPackage,
  semverToString,
} from "./packaging";
import type { RecordPackageInput } from "./packaging";

const AT = "2026-09-29T11:00:00.000Z";
const DIGEST_A = "a".repeat(64);
const DIGEST_B = "b".repeat(64);

/** Dimension-specific fixtures: every package declares its own evidence. */
function input(over: Partial<RecordPackageInput> = {}): RecordPackageInput {
  return {
    packageId: "pkg-aetherius-1.4.0",
    name: "aetherius-os",
    version: "1.4.0",
    scopeRef: "p31-scope-decision-3",
    artifacts: [{ attestationRef: "attest:core-1.4.0", role: "binary", digest: DIGEST_A }],
    installPlan: { steps: [{ stepId: "welcome", description: "first-run setup wizard" }] },
    updatePlan: {
      fromVersion: "1.3.2",
      toVersion: "1.4.0",
      migrationRefs: ["state-migration-7"],
      rollbackToVersion: "1.3.2",
    },
    rollbackPlan: { rollbackToVersion: "1.3.2", reason: "revert path" },
    uninstallPlan: {
      steps: [{ stepId: "remove", description: "remove installed files" }],
      preservesDataRefs: ["user:workspace"],
    },
    versionHistory: ["1.3.2", "1.4.0"],
    recordedAt: AT,
    provenance: "test",
    ...over,
  };
}

describe("packaging: semver is strict and honest", () => {
  it("parses strict versions and compares canonically", () => {
    expect(semverToString(parseSemver("1.4.0"))).toBe("1.4.0");
    expect(semverToString(parseSemver("2.0.0-rc.1"))).toBe("2.0.0-rc.1");
    expect(compareSemver(parseSemver("1.3.2"), parseSemver("1.4.0"))).toBe(-1);
    expect(compareSemver(parseSemver("1.4.0"), parseSemver("1.4.0"))).toBe(0);
    expect(compareSemver(parseSemver("2.0.0-rc.1"), parseSemver("2.0.0"))).toBe(-1);
  });

  it("rejects ranges, wildcards, latest, and malformed versions", () => {
    for (const version of ["^1.4.0", "1.x", "latest", "1.4", "v1.4.0", "", "1.4.0.0"]) {
      expect(() => parseSemver(version)).toThrowError(
        expect.objectContaining({ code: "PACKAGING_BAD_VERSION" }),
      );
    }
  });

  it("refuses 0.0.0 as a release version", () => {
    expect(() => recordPackage(input({ version: "0.0.0" }))).toThrowError(
      expect.objectContaining({ code: "PACKAGING_UNVERSIONED_RELEASE" }),
    );
  });
});

describe("packaging: scope arrives by reference, never by decision", () => {
  it("records a package with all plans", () => {
    const record = recordPackage(input());
    expect(record.packageId).toBe("pkg-aetherius-1.4.0");
    expect(record.version).toBe("1.4.0");
    expect(record.scopeRef).toBe("p31-scope-decision-3");
    expect(record.artifacts).toHaveLength(1);
    expect(record.artifacts[0]!.digestStatus).toBe("ASSERTED");
  });

  it("refuses a scope-less package", () => {
    expect(() => recordPackage(input({ scopeRef: "" }))).toThrowError(
      expect.objectContaining({ code: "PACKAGING_SCOPE_REQUIRED" }),
    );
  });

  it("refuses empty artifact lists and empty install/uninstall plans", () => {
    expect(() => recordPackage(input({ artifacts: [] }))).toThrowError(
      expect.objectContaining({ code: "PACKAGING_INVALID_INPUT" }),
    );
    expect(() => recordPackage(input({ installPlan: { steps: [] } }))).toThrowError(
      expect.objectContaining({ code: "PACKAGING_INVALID_INPUT" }),
    );
    expect(() =>
      recordPackage(input({ uninstallPlan: { steps: [{ stepId: "r", description: "x" }], preservesDataRefs: [] } })),
    ).not.toThrow();
  });
});

describe("packaging: digests compose with attestation, never duplicate it", () => {
  it("marks digests VERIFIED only against a caller-supplied lookup", () => {
    const record = recordPackage({
      ...input(),
      attestationLookup: { digestFor: (ref: string) => (ref === "attest:core-1.4.0" ? DIGEST_A : null) },
    });
    expect(record.artifacts[0]!.digestStatus).toBe("VERIFIED");
  });

  it("rejects a digest that contradicts the attested one", () => {
    expect(() =>
      recordPackage({
        ...input(),
        artifacts: [{ attestationRef: "attest:core-1.4.0", role: "binary", digest: DIGEST_B }],
        attestationLookup: { digestFor: () => DIGEST_A },
      }),
    ).toThrowError(expect.objectContaining({ code: "PACKAGING_DIGEST_MISMATCH" }));
  });

  it("rejects malformed digests and duplicate attestation refs", () => {
    expect(() =>
      recordPackage({
        ...input(),
        artifacts: [{ attestationRef: "a", role: "binary", digest: "abc" }],
      }),
    ).toThrowError(expect.objectContaining({ code: "PACKAGING_INVALID_INPUT" }));
    expect(() =>
      recordPackage({
        ...input(),
        artifacts: [
          { attestationRef: "a", role: "binary", digest: DIGEST_A },
          { attestationRef: "a", role: "sbom", digest: DIGEST_A },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "PACKAGING_DUPLICATE_ID" }));
  });
});

describe("packaging: update and rollback point backward", () => {
  it("accepts a forward update with an older rollback target", () => {
    const record = recordPackage(input());
    expect(record.updatePlan).toMatchObject({ fromVersion: "1.3.2", toVersion: "1.4.0", rollbackToVersion: "1.3.2" });
  });

  it("rejects non-forward updates and forward rollbacks", () => {
    expect(() =>
      recordPackage({
        ...input(),
        updatePlan: { fromVersion: "1.4.0", toVersion: "1.4.0", migrationRefs: [], rollbackToVersion: "1.3.2" },
      }),
    ).toThrowError(expect.objectContaining({ code: "PACKAGING_INVALID_INPUT" }));
    expect(() =>
      recordPackage({
        ...input(),
        updatePlan: { fromVersion: "1.3.2", toVersion: "1.4.0", migrationRefs: [], rollbackToVersion: "1.4.0" },
      }),
    ).toThrowError(expect.objectContaining({ code: "PACKAGING_ROLLBACK_NOT_OLDER" }));
    expect(() =>
      recordPackage({
        ...input(),
        rollbackPlan: { rollbackToVersion: "1.4.0", reason: "x" },
        versionHistory: ["1.3.2", "1.4.0"],
      }),
    ).toThrowError(expect.objectContaining({ code: "PACKAGING_ROLLBACK_NOT_OLDER" }));
  });

  it("rejects rollback targets outside known version history", () => {
    expect(() =>
      recordPackage({
        ...input(),
        rollbackPlan: { rollbackToVersion: "1.2.0", reason: "x" },
        versionHistory: ["1.3.2", "1.4.0"],
      }),
    ).toThrowError(expect.objectContaining({ code: "PACKAGING_UNKNOWN_ARTIFACT" }));
  });

  it("treats migration refs as references, never executes them", () => {
    const record = recordPackage(input());
    expect(record.updatePlan!.migrationRefs).toEqual(["state-migration-7"]);
    expect(Object.keys(record.updatePlan!)).not.toContain("executed");
  });
});

describe("packaging: strict shapes with security precedence", () => {
  it("rejects authority, secret, and persona keys with their own codes", () => {
    expect(() => recordPackage({ ...input(), releaseApproved: true } as never)).toThrowError(
      expect.objectContaining({ code: "PACKAGING_AUTHORITY_REJECTED" }),
    );
    expect(() => recordPackage({ ...input(), deployApproved: true } as never)).toThrowError(
      expect.objectContaining({ code: "PACKAGING_AUTHORITY_REJECTED" }),
    );
    expect(() => recordPackage({ ...input(), token: "t" } as never)).toThrowError(
      expect.objectContaining({ code: "PACKAGING_SECRET_REJECTED" }),
    );
    expect(() => recordPackage({ ...input(), persona: "p" } as never)).toThrowError(
      expect.objectContaining({ code: "PACKAGING_PERSONALITY_REJECTED" }),
    );
  });

  it("rejects unknown package, artifact, and plan fields", () => {
    expect(() => recordPackage({ ...input(), installer: "setup.exe" } as never)).toThrowError(
      expect.objectContaining({ code: "PACKAGING_UNKNOWN_FIELD" }),
    );
    expect(() =>
      recordPackage({
        ...input(),
        artifacts: [{ attestationRef: "a", role: "b", digest: DIGEST_A, url: "x" } as never],
      }),
    ).toThrowError(expect.objectContaining({ code: "PACKAGING_UNKNOWN_FIELD" }));
    expect(() => recordPackage({ ...input(), installPlan: { steps: [], schedule: "now" } as never })).toThrowError(
      expect.objectContaining({ code: "PACKAGING_UNKNOWN_FIELD" }),
    );
  });

  it("rejects empty ids, missing timestamps, and non-objects", () => {
    expect(() => recordPackage(input({ packageId: "" }))).toThrowError(
      expect.objectContaining({ code: "PACKAGING_INVALID_INPUT" }),
    );
    expect(() => recordPackage(input({ recordedAt: "" }))).toThrowError(
      expect.objectContaining({ code: "PACKAGING_INVALID_INPUT" }),
    );
    expect(() => recordPackage("pkg")).toThrowError(
      expect.objectContaining({ code: "PACKAGING_INVALID_INPUT" }),
    );
  });

  it("emits no approval, grant, deploy, score, or release-scope surface", () => {
    const record = recordPackage(input()) as unknown as Record<string, unknown>;
    expect(Object.keys(record).sort()).toEqual(
      ["artifacts", "installPlan", "name", "packageId", "provenance", "recordedAt", "rollbackPlan", "scopeRef", "uninstallPlan", "updatePlan", "version"].sort(),
    );
    const body = JSON.stringify(record);
    for (const banned of ["approv", "grant", "deploy", "score", "verdict", "releaseScope", "download", "execut"]) {
      expect(body.toLowerCase().split('"').filter((w, i) => i % 2 === 1)).not.toContain(banned);
    }
  });
});

describe("packaging: determinism and purity", () => {
  it("is deterministic from scrambled artifact order", () => {
    const artifacts = [
      { attestationRef: "b", role: "sbom", digest: DIGEST_B },
      { attestationRef: "a", role: "binary", digest: DIGEST_A },
    ];
    const forward = recordPackage(input({ artifacts }));
    const reversed = recordPackage(input({ artifacts: [...artifacts].reverse() }));
    expect(JSON.stringify(forward)).toBe(JSON.stringify(reversed));
    expect(forward.artifacts.map((a) => a.attestationRef)).toEqual(["a", "b"]);
  });

  it("does not mutate caller input", () => {
    const given = input();
    const snapshot = JSON.stringify(given);
    recordPackage(given);
    expect(JSON.stringify(given)).toBe(snapshot);
  });
});
