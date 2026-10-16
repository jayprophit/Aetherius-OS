import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ARTIFACT_CLASSES,
  ArtifactError,
  bindArtifactToEnvelope,
  composeArtifact,
  inferArtifactClass,
} from "./artifacts";
import type { ArtifactDescriptor, ComposeArtifactInput } from "./artifacts";
import type { StateEnvelope } from "./types";

const envelope = {
  id: "report-1",
  kind: "evidence.record",
  schemaVersion: 1,
  recordVersion: 3,
  createdAt: "2026-09-23T00:00:00.000Z",
  updatedAt: "2026-09-23T00:00:00.000Z",
  owner: "aetherius-os",
  provenance: "fixture",
  sensitivity: "SYSTEM",
  integrity: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  payload: { name: "fixture" },
} as StateEnvelope<{ name: string }>;

function input(over: Record<string, unknown> = {}): ComposeArtifactInput {
  const base: ComposeArtifactInput = {
    artifactId: "evidence-report-1-1.0.0",
    artifactClass: "evidence",
    content: { bytes: new TextEncoder().encode("important bytes") },
    provenance: "fixture-suite",
    version: "1.0.0",
    verificationState: "UNVERIFIED",
    securityClassification: "SYSTEM",
    envelope: {
      envelopeId: "report-1",
      kind: "evidence.record",
      schemaVersion: 1,
      recordVersion: 3,
      integrity: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      sensitivity: "SYSTEM",
    },
  };
  return { ...base, ...over } as ComposeArtifactInput;
}

function expectedBytesHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("project artifact taxonomy", () => {
  it("contains exactly the taxonomy named by the requirement", () => {
    expect([...ARTIFACT_CLASSES]).toEqual([
      "source",
      "docs",
      "media",
      "cad",
      "datasets",
      "tests",
      "benchmarks",
      "logs",
      "evidence",
      "diffs",
      "build-outputs",
      "mat-refs",
      "worker-outputs",
      "decisions",
    ]);
  });

  it("hashes supplied bytes instead of asserting a digest", () => {
    const bytes = new TextEncoder().encode("important bytes");
    const descriptor = composeArtifact(input({ content: { bytes } }));
    expect(descriptor.contentHash).toBe(expectedBytesHash(bytes));
    expect(descriptor.byteLength).toBe(bytes.byteLength);
    expect(descriptor).not.toHaveProperty("bytes");
  });

  it("accepts a separately computed digest without rehashing other evidence", () => {
    const descriptor = composeArtifact(
      input({
        content: { contentHash: expectedBytesHash(new TextEncoder().encode("important bytes")), byteLength: 15 },
      }),
    );
    expect(descriptor.contentHash).toHaveLength(64);
    expect(descriptor.byteLength).toBe(15);
  });

  it("rejects every invalid shape with the precise taxonomy failure", () => {
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ artifactId: " has spaces " }, "ARTIFACT_ID_INVALID"],
      [{ artifactClass: "mystery" }, "ARTIFACT_CLASS_UNKNOWN"],
      [{ content: { contentHash: "not-a-hash", byteLength: 1 } }, "ARTIFACT_HASH_INVALID"],
      [{ content: { contentHash: "0".repeat(64), byteLength: 1.5 } }, "ARTIFACT_LENGTH_INVALID"],
      [{ provenance: "   " }, "ARTIFACT_PROVENANCE_INVALID"],
      [{ version: "1.0" }, "ARTIFACT_VERSION_INVALID"],
      [{ verificationState: "MAYBE" }, "ARTIFACT_VERIFICATION_STATE_UNKNOWN"],
      [{ securityClassification: "TOP-SECRET" }, "ARTIFACT_ENVELOPE_INVALID"],
      [{ envelope: { ...input().envelope, integrity: "short" } }, "ARTIFACT_ENVELOPE_INVALID"],
    ];
    for (const [over, code] of cases) {
      try {
        composeArtifact(input(over));
        throw new Error(`invalid input was accepted: ${JSON.stringify(over)}`);
      } catch (error) {
        expect(error).toBeInstanceOf(ArtifactError);
        expect((error as ArtifactError).code).toBe(code);
      }
    }
  });

  it("binds a descriptor only to the envelope it actually describes", () => {
    const descriptor: ArtifactDescriptor = composeArtifact(input());
    expect(bindArtifactToEnvelope(descriptor, envelope)).toEqual(descriptor);
    try {
      bindArtifactToEnvelope(descriptor, { ...envelope, recordVersion: 4 });
      throw new Error("mismatched envelope was accepted");
    } catch (error) {
      expect(error).toBeInstanceOf(ArtifactError);
      expect((error as ArtifactError).code).toBe("ARTIFACT_ENVELOPE_MISMATCH");
    }
    expect(() =>
      bindArtifactToEnvelope(descriptor, { ...envelope, sensitivity: "PUBLIC" as const }),
    ).toThrowError(/does not describe envelope/);
  });
});

describe("conservative artifact classification", () => {
  it("prefers location to file extension when they disagree", () => {
    expect(inferArtifactClass("tests/report.csv")).toBe("tests");
    expect(inferArtifactClass("src/programme/evidenceTrace.ts")).toBe("source");
    expect(inferArtifactClass("benchmarks/latency.json")).toBe("benchmarks");
  });

  it("recognizes taxonomy extensions and project paths", () => {
    expect(inferArtifactClass("design.stl")).toBe("cad");
    expect(inferArtifactClass("dist/app.js")).toBe("build-outputs");
    expect(inferArtifactClass("decisions/release.md")).toBe("decisions");
    expect(inferArtifactClass("runs/worker-7/output.json")).toBe("worker-outputs");
    expect(inferArtifactClass("data/hydrogen.mat")).toBe("mat-refs");
  });

  it("returns null instead of inventing a classification", () => {
    expect(inferArtifactClass("")).toBeNull();
    expect(inferArtifactClass("mystery")).toBeNull();
    expect(inferArtifactClass("archive.tar.gz")).toBeNull();
    expect(inferArtifactClass("../escape.md")).toBeNull();
  });
});
