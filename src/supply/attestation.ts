import { sha256HexBytes } from "../workflows/packages";

/**
 * REQ-p25-supply-chain: per-artifact supply-chain attestation coverage.
 *
 * The registered requirement is the scope authority:
 *
 *   "Per-artifact SBOM/licence/hash/signature/provenance (SLSA/Sigstore
 *    patterns) across apps/models/skills/plugins/workflows/datasets; package
 *    hashes + licence gates exist, SBOM/signatures/coverage do not."
 *
 * The requirement itself splits the world in two, and this unit respects the
 * split exactly. What EXISTS is reused, never duplicated:
 *
 *   package hashes  -> src/workflows/packages.ts (sha256 over artifact bytes,
 *                      manifest integrity; the hash helper is imported, and
 *                      the digest algorithm stays sha256 because that is the
 *                      approved algorithm already in use)
 *   licence gates   -> src/programme/reference.ts (licence-not-cleared rule;
 *                      UNKNOWN stays UNKNOWN there, and it stays UNKNOWN here)
 *
 * What DOES NOT EXIST is what this unit adds: SBOM records, signature
 * records, and per-artifact coverage across the six registered domains
 * (apps, models, skills, plugins, workflows, datasets):
 *
 *   SBOM/SIGNATURES/COVERAGE != PACKAGE HASHES (different owners, kept apart)
 *
 * A DIGEST IS NOT A SIGNATURE. Recording a sha256 over artifact bytes proves
 * integrity of those bytes and nothing else. A signature claim records an
 * algorithm, a key reference, and a value — and stays a CLAIM, because no
 * signing or verification backend exists in this repository:
 *
 *   DIGEST != DIGITAL SIGNATURE
 *   HASH PRESENT != SIGNATURE PRESENT
 *   SIGNATURE CLAIM != VERIFIED SIGNATURE
 *   SIGNATURE STRING != VERIFIED SIGNATURE
 *
 * Nothing here generates keys, invents a signer, or performs hash-plus-label
 * fakery. Verification is UNAVAILABLE and says so; signing is recorded, never
 * performed.
 *
 * SLSA-LIKE FIELDS != SLSA CONFORMANCE. The provenance shape follows SLSA-
 * style field patterns (source, builder, materials, environment) because the
 * registered requirement names those patterns — but no level is claimed and
 * no conformance is asserted:
 *
 *   NO SLSA LEVEL CLAIMED, NO CONFORMANCE ASSERTED
 *
 * A PROVENANCE RECORD IS NOT A GUARANTEE, NOT REPRODUCIBILITY PROOF, AND NOT
 * CLEAN-ROOM PROOF. It states what evidence supports and nothing more:
 *
 *   PROVENANCE RECORD != GUARANTEE OF TRUSTWORTHINESS
 *   REPRODUCIBLE INPUTS RECORDED != REPRODUCIBLE BUILD PROVEN
 *   BUILD PROVENANCE != CLEAN-ROOM EXECUTION
 *   DECLARED LINK != CRYPTOGRAPHIC BINDING (unless the module itself checks
 *     the digest equality, which it does for artifact↔provenance binding)
 *
 * SUPPLY-CHAIN EVIDENCE IS NOT RELEASE. Nothing here decides release scope
 * (OWNER_GATED), approves a release, builds an installer, deploys anything,
 * or grants anything:
 *
 *   SBOM EXISTS != RELEASE READY
 *   SIGNATURE EXISTS != RELEASE APPROVED
 *   PROVENANCE EXISTS != RELEASE SCOPE DEFINED
 *   SIGNED ARTIFACT != AUTHORIZED ARTIFACT
 *   VERIFIED ARTIFACT != DEPLOYED ARTIFACT
 *   SUPPLY-CHAIN PASS != DEPLOY PERMISSION
 *
 * PROVENANCE IMMUTABILITY follows the established store conventions: same
 * identity plus identical content is idempotent; same identity plus changed
 * content is a conflict; a new build is a new record.
 *
 * ARTIFACT NAME != ARTIFACT HASH. Identity is the digest (plus domain and
 * version); filenames are labels. SAME PACKAGE NAME != SAME PACKAGE VERSION.
 * Unknown licences stay UNKNOWN (PACKAGE EXISTS != LICENCE KNOWN); missing
 * signers stay UNAVAILABLE; incomplete SBOMs stay PARTIAL with named gaps.
 * Timestamps keep their identity (source/build/artifact/signing times never
 * merged, caller-supplied, never invented).
 *
 * This module RECORDS and VERIFIES facts; it never builds, installs,
 * downloads, signs, deploys, or rolls back:
 *
 *   BUILD EVIDENCE != BUILD EXECUTION
 *   ROLLBACK REFERENCE != ROLLBACK EXECUTION
 */

export type SupplyProblemCode =
  | "SUPPLY_INVALID_INPUT"
  | "SUPPLY_UNKNOWN_FIELD"
  | "SUPPLY_AUTHORITY_REJECTED"
  | "SUPPLY_SECRET_REJECTED"
  | "SUPPLY_PERSONALITY_REJECTED"
  | "SUPPLY_BAD_DIGEST"
  | "SUPPLY_DUPLICATE_ID"
  | "SUPPLY_VERSION_COLLAPSED"
  | "SUPPLY_CONFLICT"
  | "SUPPLY_UNKNOWN_ARTIFACT"
  | "SUPPLY_DIGEST_MISMATCH";

export class SupplyError extends Error {
  readonly code: SupplyProblemCode;
  constructor(code: SupplyProblemCode, message: string) {
    super(message);
    this.name = "SupplyError";
    this.code = code;
  }
}

/** The six registered artifact domains. */
export const ARTIFACT_DOMAINS = [
  "apps",
  "models",
  "skills",
  "plugins",
  "workflows",
  "datasets",
] as const;
export type ArtifactDomain = (typeof ARTIFACT_DOMAINS)[number];

/** Component origin classes. No attribution is invented. */
export const COMPONENT_ORIGINS = [
  "first-party",
  "external-package",
  "fork",
  "adapted",
  "reference-only",
] as const;
export type ComponentOrigin = (typeof COMPONENT_ORIGINS)[number];

/** The digest algorithm. Recorded explicitly; the only one this module uses. */
export const DIGEST_ALGORITHM = "sha256" as const;

const HEX64 = /^[0-9a-f]{64}$/;

export interface SbomComponent {
  name: string;
  version: string;
  origin: ComponentOrigin;
  /** SPDX-style identifier or UNKNOWN. Never inferred, never defaulted. */
  licence: string;
  /** Empty means the whole record is the evidence (self-contained). */
  sourceRef?: string;
}

export interface ArtifactRecord {
  artifactId: string;
  domain: ArtifactDomain;
  name: string;
  version: string;
  /** sha256 over the exact artifact bytes, computed here, never asserted. */
  digest: string;
  digestAlgorithm: typeof DIGEST_ALGORITHM;
  byteLength: number;
  sbom: SbomComponent[];
  /** COMPLETE only when every component is fully described; else PARTIAL. */
  sbomCompleteness: "COMPLETE" | "PARTIAL" | "UNAVAILABLE";
  /** Named gaps when PARTIAL or UNAVAILABLE. Never an empty excuse. */
  sbomGaps: string[];
  /** A signature CLAIM: algorithm + key ref + value. Never verified here. */
  signature: {
    algorithm: string;
    keyRef: string;
    value: string;
  } | null;
  /** Always false here: no verification backend exists. Stated, not hidden. */
  signatureVerified: false;
  signatureStatus: "ABSENT" | "CLAIMED_UNVERIFIED" | "UNAVAILABLE";
  provenance: ProvenanceRecord | null;
  provenanceClass: "NONE" | "DECLARED" | "DIGEST_BOUND";
  recordedAt: string;
}

export interface ProvenanceRecord {
  /** Observed source revision. Never invented, never a branch name. */
  sourceRevision: string;
  /** Builder identity as reported: tool, host, and actor stay distinct. */
  builder: { tool: string; host: string; actor: string };
  toolchainRefs: string[];
  buildConfigRef?: string;
  /** Must equal the artifact digest when both are present: the module itself
   * checks this equality, which is the only cryptographic binding it claims. */
  artifactDigest: string;
  testEvidenceRefs: string[];
  environmentRef?: string;
}

const ARTIFACT_FIELDS = [
  "artifactId", "domain", "name", "version", "bytes",
  "sbom", "sbomCompleteness", "sbomGaps",
  "signature", "provenance", "recordedAt",
] as const;

const COMPONENT_FIELDS = ["name", "version", "origin", "licence", "sourceRef"] as const;
const SIGNATURE_FIELDS = ["algorithm", "keyRef", "value"] as const;
const PROVENANCE_FIELDS = [
  "sourceRevision", "builder", "toolchainRefs", "buildConfigRef",
  "artifactDigest", "testEvidenceRefs", "environmentRef",
] as const;

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "canDeploy", "permission",
  "permissionGranted", "grantApproved", "policyBypass", "ownerOverride",
  "mergeAuthority", "releaseApproved", "releaseScope", "deployApproved",
];

const SECRET_KEYS = [
  "apiKey", "secret", "signingKey", "privateKey", "privateSigningKey",
  "token", "password", "credential",
];

const PERSONALITY_KEYS = [
  "personality", "persona", "traits", "backstory", "biography",
  "autobiography", "identity", "dna", "soul", "selfModel",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertDigest(value: unknown, path: string): string {
  if (typeof value !== "string" || !HEX64.test(value)) {
    throw new SupplyError("SUPPLY_BAD_DIGEST", `${path} must be a 64-character lowercase hex sha256: malformed hashes are rejected, never repaired`);
  }
  return value;
}

/**
 * Security-significant violations are diagnosed BEFORE generic shape errors,
 * so a smuggled key value is reported as itself and never disappears into an
 * unknown-field complaint.
 */
function assertNoViolations(value: unknown, path: string, seen: Set<unknown>): void {
  if (seen.has(value) || typeof value !== "object" || value === null) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoViolations(item, `${path}[${index}]`, seen));
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (AUTHORITY_KEYS.includes(key)) {
      throw new SupplyError("SUPPLY_AUTHORITY_REJECTED", `${path}.${key}: supply-chain evidence never carries authorization or release approval`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new SupplyError("SUPPLY_SECRET_REJECTED", `${path}.${key}: key references only — SIGNING KEY REF != SIGNING KEY VALUE`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new SupplyError("SUPPLY_PERSONALITY_REJECTED", `${path}.${key}: an attestation record carries no stored person`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

function assertComponent(value: unknown, index: number): SbomComponent {
  if (!isPlainObject(value)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", `sbom[${index}] must be an object`);
  }
  for (const key of Object.keys(value)) {
    if (!(COMPONENT_FIELDS as readonly string[]).includes(key)) {
      throw new SupplyError("SUPPLY_UNKNOWN_FIELD", `unknown sbom component field ${key}`);
    }
  }
  if (!nonEmpty(value.name) || !nonEmpty(value.version)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", `sbom[${index}] needs a non-empty name and version: SAME PACKAGE NAME != SAME PACKAGE VERSION`);
  }
  if (!COMPONENT_ORIGINS.includes(value.origin as ComponentOrigin)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", `sbom[${index}] origin must be one of ${COMPONENT_ORIGINS.join(", ")}: attribution is declared, never invented`);
  }
  if (!nonEmpty(value.licence)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", `sbom[${index}] licence must be a non-empty identifier or UNKNOWN: PACKAGE EXISTS != LICENCE KNOWN`);
  }
  if (value.sourceRef !== undefined && !nonEmpty(value.sourceRef)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", `sbom[${index}] sourceRef must be non-empty when present`);
  }
  return {
    name: value.name,
    version: value.version,
    origin: value.origin as ComponentOrigin,
    licence: value.licence,
    ...(value.sourceRef === undefined ? {} : { sourceRef: value.sourceRef as string }),
  };
}

function assertSignature(value: unknown): ArtifactRecord["signature"] {
  if (value === null || value === undefined) return null;
  if (!isPlainObject(value)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "signature must be an object or null");
  }
  for (const key of Object.keys(value)) {
    if (!(SIGNATURE_FIELDS as readonly string[]).includes(key)) {
      throw new SupplyError("SUPPLY_UNKNOWN_FIELD", `unknown signature field ${key}`);
    }
  }
  if (!nonEmpty(value.algorithm) || !nonEmpty(value.keyRef) || !nonEmpty(value.value)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "a signature claim needs a non-empty algorithm, keyRef, and value");
  }
  return { algorithm: value.algorithm, keyRef: value.keyRef, value: value.value };
}

function assertProvenance(value: unknown, artifactDigest: string): ProvenanceRecord {
  if (!isPlainObject(value)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "provenance must be an object");
  }
  for (const key of Object.keys(value)) {
    if (!(PROVENANCE_FIELDS as readonly string[]).includes(key)) {
      throw new SupplyError("SUPPLY_UNKNOWN_FIELD", `unknown provenance field ${key}`);
    }
  }
  if (!nonEmpty(value.sourceRevision)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "sourceRevision must be an observed revision: BRANCH NAME != SOURCE COMMIT, and nothing is invented");
  }
  const builder = value.builder;
  if (!isPlainObject(builder) || !nonEmpty(builder.tool) || !nonEmpty(builder.host) || !nonEmpty(builder.actor)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "builder needs non-empty tool, host, and actor: build tool, host, and actor stay distinct");
  }
  for (const key of Object.keys(builder)) {
    if (!["tool", "host", "actor"].includes(key)) {
      throw new SupplyError("SUPPLY_UNKNOWN_FIELD", `unknown builder field ${key}`);
    }
  }
  if (!Array.isArray(value.toolchainRefs) || value.toolchainRefs.some((r) => !nonEmpty(r))) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "toolchainRefs must be an array of non-empty toolchain references");
  }
  if (value.buildConfigRef !== undefined && !nonEmpty(value.buildConfigRef)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "buildConfigRef must be non-empty when present");
  }
  // The one cryptographic binding this module claims: the provenance's
  // artifact digest must equal the artifact's own digest, checked here.
  const digest = assertDigest(value.artifactDigest, "provenance.artifactDigest");
  if (digest !== artifactDigest) {
    throw new SupplyError("SUPPLY_DIGEST_MISMATCH", "provenance artifactDigest does not equal the artifact digest: DECLARED LINK != CRYPTOGRAPHIC BINDING, and this link failed the binding check");
  }
  if (!Array.isArray(value.testEvidenceRefs) || value.testEvidenceRefs.some((r) => !nonEmpty(r))) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "testEvidenceRefs must be an array of non-empty evidence references");
  }
  if (value.environmentRef !== undefined && !nonEmpty(value.environmentRef)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "environmentRef must be non-empty when present");
  }
  return {
    sourceRevision: value.sourceRevision,
    builder: { tool: builder.tool as string, host: builder.host as string, actor: builder.actor as string },
    toolchainRefs: [...(value.toolchainRefs as string[])].sort(),
    ...(value.buildConfigRef === undefined ? {} : { buildConfigRef: value.buildConfigRef as string }),
    artifactDigest: digest,
    testEvidenceRefs: [...(value.testEvidenceRefs as string[])].sort(),
    ...(value.environmentRef === undefined ? {} : { environmentRef: value.environmentRef as string }),
  };
}

export interface RecordArtifactInput {
  artifactId: string;
  domain: ArtifactDomain;
  name: string;
  version: string;
  /** Exact artifact bytes. Hashed here with the approved algorithm. */
  bytes: Uint8Array;
  sbom: unknown[];
  /** Optional cross-check: when present it must equal the derived value. */
  sbomCompleteness?: "COMPLETE" | "PARTIAL" | "UNAVAILABLE";
  sbomGaps?: string[];
  signature?: unknown;
  provenance?: unknown;
  /** Caller-supplied record time. Never invented. */
  recordedAt: string;
}

/**
 * Record one artifact with its SBOM, signature claim, and provenance.
 * Digests are computed from the supplied bytes; completeness and signature
 * status are derived from the evidence, never asserted.
 */
export function recordArtifact(input: unknown): ArtifactRecord {
  if (!isPlainObject(input)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "artifact input must be an object");
  }
  assertNoViolations(input, "artifact", new Set());
  for (const key of Object.keys(input)) {
    if (!(ARTIFACT_FIELDS as readonly string[]).includes(key)) {
      throw new SupplyError("SUPPLY_UNKNOWN_FIELD", `unknown artifact field ${key}`);
    }
  }
  if (!nonEmpty(input.artifactId)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "artifactId must be a non-empty stable id");
  }
  if (!ARTIFACT_DOMAINS.includes(input.domain as ArtifactDomain)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", `domain must be one of ${ARTIFACT_DOMAINS.join(", ")}`);
  }
  if (!nonEmpty(input.name) || !nonEmpty(input.version)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "name and version must be non-empty: ARTIFACT NAME != ARTIFACT HASH, and neither is optional");
  }
  if (!(input.bytes instanceof Uint8Array) || input.bytes.byteLength === 0) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "bytes must be the non-empty exact artifact bytes: digests are computed, never asserted");
  }
  if (!Array.isArray(input.sbom)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "sbom must be an array (possibly empty, with gaps named)");
  }
  const sbom = (input.sbom as unknown[]).map(assertComponent);
  // COMPLETE means every component is fully described AND at least one
  // component exists: an empty SBOM is not a complete SBOM.
  const fullyDescribed = sbom.every((c) => c.licence !== "UNKNOWN" && c.origin !== "reference-only");
  const derivedCompleteness = sbom.length === 0 ? "UNAVAILABLE" : fullyDescribed ? "COMPLETE" : "PARTIAL";
  if (input.sbomCompleteness !== undefined && input.sbomCompleteness !== derivedCompleteness) {
    throw new SupplyError(
      "SUPPLY_INVALID_INPUT",
      `sbomCompleteness ${input.sbomCompleteness} contradicts the evidence (${derivedCompleteness}): completeness is derived, never asserted; an UNKNOWN licence or reference-only origin keeps a record PARTIAL`,
    );
  }
  const gaps = input.sbomGaps === undefined ? [] : input.sbomGaps;
  if (!Array.isArray(gaps) || gaps.some((g) => !nonEmpty(g))) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "sbomGaps must be an array of non-empty strings when present");
  }
  if (derivedCompleteness !== "COMPLETE" && gaps.length === 0) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "a PARTIAL or UNAVAILABLE SBOM must name its gaps: never an empty excuse");
  }
  if (!nonEmpty(input.recordedAt)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "recordedAt must be a caller-supplied non-empty timestamp");
  }
  const digest = sha256HexBytes(input.bytes as Uint8Array);
  const signature = assertSignature(input.signature);
  const provenance = input.provenance === undefined || input.provenance === null
    ? null
    : assertProvenance(input.provenance, digest);
  const signatureStatus = signature === null ? "ABSENT" : "CLAIMED_UNVERIFIED";
  return {
    artifactId: input.artifactId,
    domain: input.domain as ArtifactDomain,
    name: input.name,
    version: input.version,
    digest,
    digestAlgorithm: DIGEST_ALGORITHM,
    byteLength: (input.bytes as Uint8Array).byteLength,
    sbom: [...sbom].sort((a, b) => (a.name === b.name ? (a.version < b.version ? -1 : 1) : a.name < b.name ? -1 : 1)),
    sbomCompleteness: derivedCompleteness,
    sbomGaps: [...(gaps as string[])].sort(),
    signature,
    signatureVerified: false,
    signatureStatus,
    provenance,
    provenanceClass: provenance === null ? "NONE" : "DIGEST_BOUND",
    recordedAt: input.recordedAt,
  };
}

export interface AttestationRegistry {
  records: ArtifactRecord[];
}

export function createRegistry(): AttestationRegistry {
  return { records: [] };
}

/**
 * Add a record, following the established store conventions: same identity
 * plus identical content is idempotent; same identity plus changed content
 * is a conflict; same name with a different version is a different artifact
 * (SAME PACKAGE NAME != SAME PACKAGE VERSION).
 */
export function addRecord(registry: AttestationRegistry, record: ArtifactRecord): AttestationRegistry {
  if (!isPlainObject(registry) || !Array.isArray(registry.records)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "registry must carry a records array");
  }
  for (const key of Object.keys(registry)) {
    if (key !== "records") {
      throw new SupplyError("SUPPLY_UNKNOWN_FIELD", `unknown registry field ${key}`);
    }
  }
  const sameId = registry.records.filter((r) => r.artifactId === record.artifactId);
  if (sameId.some((r) => r.version === record.version)) {
    const existing = sameId.find((r) => r.version === record.version)!;
    if (JSON.stringify(existing) === JSON.stringify(record)) return registry;
    throw new SupplyError("SUPPLY_CONFLICT", `artifact ${record.artifactId}@${record.version} already recorded with different content`);
  }
  return { records: [...registry.records, record].sort((a, b) => (a.artifactId === b.artifactId ? (a.version < b.version ? -1 : 1) : a.artifactId < b.artifactId ? -1 : 1)) };
}

export interface DomainCoverage {
  domain: ArtifactDomain;
  artifacts: number;
  withSbomComplete: number;
  withLicenceKnown: number;
  withHash: number;
  withSignatureClaim: number;
  withProvenance: number;
}

/**
 * Per-artifact, per-domain coverage. Counts only — no verdicts, no gates,
 * no release decisions. A domain with no artifacts reports zeros with the
 * domain named, never silence.
 */
export function coverageByDomain(registry: AttestationRegistry): DomainCoverage[] {
  if (!isPlainObject(registry) || !Array.isArray(registry.records)) {
    throw new SupplyError("SUPPLY_INVALID_INPUT", "registry must carry a records array");
  }
  return ARTIFACT_DOMAINS.map((domain) => {
    const records = registry.records.filter((r) => r.domain === domain);
    return {
      domain,
      artifacts: records.length,
      withSbomComplete: records.filter((r) => r.sbomCompleteness === "COMPLETE").length,
      withLicenceKnown: records.filter((r) => r.sbom.every((c) => c.licence !== "UNKNOWN")).length,
      withHash: records.filter((r) => r.digest.length === 64).length,
      withSignatureClaim: records.filter((r) => r.signature !== null).length,
      withProvenance: records.filter((r) => r.provenance !== null).length,
    };
  });
}
