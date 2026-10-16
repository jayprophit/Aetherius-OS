import { sha256HexBytes } from "../workflows/packages";
import type { VerificationState } from "../workflows/deliverable";
import type { SensitivityClass, StateEnvelope } from "./types";
import { StateError } from "./types";

/**
 * REQ-p17-artifact-library: unified project-artifact taxonomy over P17 envelopes.
 *
 * Hash-addressed storage already exists; what was missing was the controlled
 * vocabulary and descriptor discipline that says what each address means. This
 * unit is that missing leaf. It does not store artifact bytes, replace package
 * resolution, duplicate P19 deliverable verification, or turn a checkpoint
 * reference into library membership.
 *
 * A descriptor binds:
 *   1. caller-supplied identity and taxonomy;
 *   2. a content digest that must have been computed, not asserted, when bytes
 *      are supplied;
 *   3. the live P17 envelope that actually holds the metadata being described.
 */

export const ARTIFACT_SCHEMA_VERSION = 1;

/** Every project-artifact class named by REQ-p17-artifact-library. */
export const ARTIFACT_CLASSES = [
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
] as const;
export type ArtifactClass = (typeof ARTIFACT_CLASSES)[number];

export type ArtifactProblemCode =
  | "ARTIFACT_ID_INVALID"
  | "ARTIFACT_CLASS_UNKNOWN"
  | "ARTIFACT_HASH_INVALID"
  | "ARTIFACT_LENGTH_INVALID"
  | "ARTIFACT_PROVENANCE_INVALID"
  | "ARTIFACT_VERSION_INVALID"
  | "ARTIFACT_VERIFICATION_STATE_UNKNOWN"
  | "ARTIFACT_ENVELOPE_INVALID"
  | "ARTIFACT_ENVELOPE_MISMATCH";

export class ArtifactError extends Error {
  readonly code: ArtifactProblemCode;
  constructor(code: ArtifactProblemCode, message: string) {
    super(message);
    this.name = "ArtifactError";
    this.code = code;
  }
}

export interface ArtifactEnvelopeBinding {
  envelopeId: string;
  kind: string;
  schemaVersion: number;
  recordVersion: number;
  integrity: string;
  sensitivity: SensitivityClass;
}

export interface ArtifactDescriptor {
  artifactId: string;
  artifactClass: ArtifactClass;
  contentHash: string;
  byteLength: number;
  provenance: string;
  version: string;
  verificationState: VerificationState;
  securityClassification: SensitivityClass;
  envelope: ArtifactEnvelopeBinding;
}

export interface ArtifactContentBytes {
  bytes: Uint8Array;
}
export interface ArtifactContentDigest {
  contentHash: string;
  byteLength: number;
}

export interface ComposeArtifactInput {
  artifactId: string;
  artifactClass: ArtifactClass;
  content: ArtifactContentBytes | ArtifactContentDigest;
  provenance: string;
  version: string;
  verificationState: VerificationState;
  securityClassification: SensitivityClass;
  envelope: ArtifactEnvelopeBinding;
}

const ARTIFACT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const HEX256 = /^[0-9a-f]{64}$/;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const VERIFICATION_STATES: readonly VerificationState[] = ["UNVERIFIED", "EVIDENCE_COMPLETE", "VERIFIED", "FAILED"];
const SENSITIVITIES: readonly SensitivityClass[] = [
  "PUBLIC",
  "USER",
  "PRIVATE",
  "SYSTEM",
  "SECURITY_SENSITIVE",
  "SECRET_REFERENCE",
];

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isArtifactClass(value: unknown): value is ArtifactClass {
  return typeof value === "string" && (ARTIFACT_CLASSES as readonly string[]).includes(value);
}

function isDigestContent(content: ArtifactContentBytes | ArtifactContentDigest): content is ArtifactContentDigest {
  return !("bytes" in content);
}

function assertArtifactShape(input: ComposeArtifactInput): asserts input is ComposeArtifactInput {
  if (!nonEmpty(input.artifactId) || !ARTIFACT_ID.test(input.artifactId)) {
    throw new ArtifactError("ARTIFACT_ID_INVALID", `artifactId must match ${ARTIFACT_ID.source}`);
  }
  if (!isArtifactClass(input.artifactClass)) {
    throw new ArtifactError("ARTIFACT_CLASS_UNKNOWN", `unknown artifact class ${String(input.artifactClass)}`);
  }
  if (isDigestContent(input.content)) {
    if (!HEX256.test(input.content.contentHash)) {
      throw new ArtifactError("ARTIFACT_HASH_INVALID", "contentHash must be 64 lowercase hex characters");
    }
    if (!Number.isInteger(input.content.byteLength) || input.content.byteLength < 0) {
      throw new ArtifactError("ARTIFACT_LENGTH_INVALID", "byteLength must be a non-negative integer");
    }
  }
  if (!nonEmpty(input.provenance)) {
    throw new ArtifactError("ARTIFACT_PROVENANCE_INVALID", "provenance is required");
  }
  if (!SEMVER.test(input.version.trim())) {
    throw new ArtifactError("ARTIFACT_VERSION_INVALID", `invalid version ${input.version} (x.y.z required)`);
  }
  if (!VERIFICATION_STATES.includes(input.verificationState)) {
    throw new ArtifactError(
      "ARTIFACT_VERIFICATION_STATE_UNKNOWN",
      `unknown verification state ${String(input.verificationState)}`,
    );
  }
  if (!SENSITIVITIES.includes(input.securityClassification)) {
    throw new ArtifactError(
      "ARTIFACT_ENVELOPE_INVALID",
      `unknown security classification ${String(input.securityClassification)}`,
    );
  }
  const envelope = input.envelope;
  if (
    !envelope ||
    !nonEmpty(envelope.envelopeId) ||
    !nonEmpty(envelope.kind) ||
    !Number.isInteger(envelope.schemaVersion) ||
    envelope.schemaVersion < 1 ||
    !Number.isInteger(envelope.recordVersion) ||
    envelope.recordVersion < 1 ||
    !HEX256.test(envelope.integrity) ||
    !SENSITIVITIES.includes(envelope.sensitivity)
  ) {
    throw new ArtifactError("ARTIFACT_ENVELOPE_INVALID", "envelope binding is incomplete or malformed");
  }
}

/**
 * Compose a descriptor. Supplied bytes are hashed here; supplied digests are
 * checked, never recomputed from other evidence. The bound envelope is not
 * loaded or re-verified here because the store that returns it is the
 * authority for its current integrity and version. This function verifies the
 * descriptor, not the envelope.
 */
export function composeArtifact(input: ComposeArtifactInput): ArtifactDescriptor {
  assertArtifactShape(input);
  const content = isDigestContent(input.content)
    ? { contentHash: input.content.contentHash, byteLength: input.content.byteLength }
    : { contentHash: sha256HexBytes(input.content.bytes), byteLength: input.content.bytes.byteLength };
  return {
    artifactId: input.artifactId,
    artifactClass: input.artifactClass,
    contentHash: content.contentHash,
    byteLength: content.byteLength,
    provenance: input.provenance,
    version: input.version.trim(),
    verificationState: input.verificationState,
    securityClassification: input.securityClassification,
    envelope: { ...input.envelope },
  };
}

/**
 * Attach a descriptor to a live P17 envelope. The descriptor must describe the
 * same record that is being attached: same ID, version, integrity and
 * sensitivity. Sensitivity equality matters because classification does not
 * travel independently from the record being classified.
 */
export function bindArtifactToEnvelope<T>(
  descriptor: ArtifactDescriptor,
  envelope: StateEnvelope<T>,
): ArtifactDescriptor {
  if (!envelope || typeof envelope !== "object") {
    throw new StateError("STATE_MALFORMED", "artifact requires a P17 envelope");
  }
  const binding = descriptor.envelope;
  if (
    binding.envelopeId !== envelope.id ||
    binding.recordVersion !== envelope.recordVersion ||
    binding.integrity !== envelope.integrity ||
    binding.sensitivity !== envelope.sensitivity
  ) {
    throw new ArtifactError(
      "ARTIFACT_ENVELOPE_MISMATCH",
      `descriptor ${descriptor.artifactId} does not describe envelope ${envelope.id}@${envelope.recordVersion}`,
    );
  }
  return { ...descriptor, envelope: { ...binding } };
}

const EXTENSION_CLASS: Readonly<Record<string, ArtifactClass>> = {
  ts: "source",
  tsx: "source",
  js: "source",
  jsx: "source",
  py: "source",
  cpp: "source",
  hpp: "source",
  c: "source",
  h: "source",
  rs: "source",
  go: "source",
  java: "source",
  md: "docs",
  mdx: "docs",
  png: "media",
  jpg: "media",
  jpeg: "media",
  gif: "media",
  webp: "media",
  svg: "media",
  mp3: "media",
  wav: "media",
  mp4: "media",
  step: "cad",
  stl: "cad",
  dwg: "cad",
  dxf: "cad",
  obj: "cad",
  csv: "datasets",
  tsv: "datasets",
  jsonl: "datasets",
  parquet: "datasets",
  h5: "datasets",
  log: "logs",
  diff: "diffs",
  patch: "diffs",
};

const PATH_CLASS: ReadonlyArray<{ test: RegExp; artifactClass: ArtifactClass }> = [
  { test: /(^|\/)(test|tests|__tests__|testing)($|\/)/, artifactClass: "tests" },
  { test: /\.test\.[A-Za-z0-9]+$/, artifactClass: "tests" },
  { test: /(^|\/)(bench|benchmark|benchmarks)($|\/)/, artifactClass: "benchmarks" },
  { test: /\.(bench|benchmark|perf)\.[A-Za-z0-9]+$/, artifactClass: "benchmarks" },
  { test: /(^|\/)(dist|build|out|target|bin)($|\/)/, artifactClass: "build-outputs" },
  { test: /\.(exe|dll|so|dylib|wasm|map)$/, artifactClass: "build-outputs" },
  { test: /(^|\/)(evidence|proof|proofs|attestation|receipts?)($|\/)/, artifactClass: "evidence" },
  { test: /(^|\/)mat($|\/)|\.(mat|h5)$/, artifactClass: "mat-refs" },
  { test: /(^|\/)(decision|decisions|approval|approvals|adr|adrs)($|\/)/, artifactClass: "decisions" },
  {
    test: /(^|\/)(workers?([-_][A-Za-z0-9]+)?|agent-outputs?|run-output)($|\/)/,
    artifactClass: "worker-outputs",
  },
];

/**
 * Conservative name-based classifier. Path rules win over extensions because
 * where a file lives usually says more than its suffix; genuinely ambiguous or
 * unrecognized names return null rather than guessing. Classification is a
 * hint for the caller, never a substitute for the descriptor's validated
 * class.
 */
export function inferArtifactClass(name: string): ArtifactClass | null {
  if (!nonEmpty(name)) return null;
  const normalized = name.replace(/\\/g, "/").toLowerCase();
  if (normalized.includes("..")) return null;
  for (const rule of PATH_CLASS) {
    if (rule.test.test(normalized)) return rule.artifactClass;
  }
  const extension = normalized.split("/").pop()?.split(".").pop() ?? "";
  return EXTENSION_CLASS[extension] ?? null;
}
