import { checkEvidenceGate } from "../workflows/evidenceGate";
import type { EvidenceProvided, EvidenceRequirement, GateResult } from "../workflows/evidenceGate";
import { validateEdge } from "./evidenceGraph";
import type { EvidenceEdge } from "./evidenceGraph";
import { bindArtifactToEnvelope } from "../state/artifacts";
import type { ArtifactDescriptor } from "../state/artifacts";
import { sha256Hex } from "../state/store";
import type { OwnedStore, SaveOptions } from "../state/store";
import { StateError, type SensitivityClass, type StateEnvelope } from "../state/types";
import { PACKAGE_FORMAT, verifyPackage } from "../workflows/packages";
import type { SkillPackageManifest } from "../workflows/packages";

/**
 * REQ-p17-verification-continuity: one canonical verification artefact that can
 * move across execution environments without being reinvented in each one.
 *
 * Existing per-environment proofs were the gap: local, sandbox, CI,
 * pre-release, scheduled and production runs each had evidence, but no shared
 * record joined the same baseline, package, envelopes, evidence graph and
 * per-environment results. This unit is only that missing join.
 *
 * It borrows authority from the units it composes and creates none:
 * package bytes are proven by P19 packages, state records are proven by the
 * P17 store, required evidence is judged by the P19 evidence gate, graph
 * edges are validated by the P16 evidence graph, and every source artifact is
 * classified by the P17 taxonomy. A capsule is therefore a set of checked
 * pointers with one deterministic digest, not a second package format, a
 * second store, a second evidence graph, or a verdict by itself.
 */

export const VERIFICATION_RECORD_FORMAT = "aetherius-verification-record/1" as const;
export const VERIFICATION_RECORD_KIND = "verification.record" as const;
export const VERIFICATION_RECORD_SCHEMA_VERSION = 1;

export const VERIFICATION_ENVIRONMENTS = [
  "local",
  "sandbox",
  "ci",
  "pre-release",
  "scheduled",
  "production",
] as const;
export type VerificationEnvironment = (typeof VERIFICATION_ENVIRONMENTS)[number];

export interface VerificationSource {
  repository: string;
  ref: string;
  commit: string;
  baselineDigest: string;
  capturedAt: string;
}

export interface VerificationPackageReference {
  format: typeof PACKAGE_FORMAT;
  skillId: string;
  version: string;
  manifestSha256: string;
  artifactCount: number;
}

export interface EnvironmentEvidence {
  environment: VerificationEnvironment;
  evidence: EvidenceProvided;
}

export interface CleanEnvironmentClaim {
  claimed: boolean;
  proofRef?: string;
  reason?: string;
}

export interface VerificationArtifactSource {
  /**
   * A descriptor already composed by the completed P17 taxonomy. This module
   * does not recompose it: the taxonomy remains responsible for descriptor
   * semantics, and continuity only proves that the descriptor still matches
   * the live envelope named below.
   */
  descriptor: ArtifactDescriptor;
  envelope: StateEnvelope<unknown>;
}

export interface ComposeVerificationInput {
  recordId: string;
  createdAt: string;
  provenance: string;
  sensitivity?: SensitivityClass;
  source: VerificationSource;
  environments: readonly VerificationEnvironment[];
  packageManifests: readonly SkillPackageManifest[];
  artifactSources: readonly VerificationArtifactSource[];
  graph: readonly EvidenceEdge[];
  requiredEvidence: readonly EvidenceRequirement[];
  evidence: readonly EnvironmentEvidence[];
  cleanEnvironment: CleanEnvironmentClaim;
}

export interface VerificationRecordBody {
  format: typeof VERIFICATION_RECORD_FORMAT;
  recordId: string;
  createdAt: string;
  provenance: string;
  sensitivity: SensitivityClass;
  source: VerificationSource;
  environments: VerificationEnvironment[];
  packages: VerificationPackageReference[];
  artifacts: ArtifactDescriptor[];
  graph: EvidenceEdge[];
  requiredEvidence: EvidenceRequirement[];
  evidence: EnvironmentEvidence[];
  cleanEnvironment: CleanEnvironmentClaim;
}

export interface VerificationRecord extends VerificationRecordBody {
  recordDigest: string;
}

export type VerificationProblemCode =
  | "VERIFICATION_ID_INVALID"
  | "VERIFICATION_SOURCE_INVALID"
  | "VERIFICATION_ENVIRONMENT_UNKNOWN"
  | "VERIFICATION_PACKAGE_REFERENCE_INVALID"
  | "VERIFICATION_ARTIFACT_INVALID"
  | "VERIFICATION_GRAPH_EDGE_INVALID"
  | "VERIFICATION_EVIDENCE_INVALID"
  | "VERIFICATION_CLEAN_ENVIRONMENT_INVALID"
  | "VERIFICATION_SECRET_REJECTED"
  | "VERIFICATION_RECORD_DIGEST_MISMATCH"
  | "VERIFICATION_RECORD_CONFLICT"
  | "VERIFICATION_RECORD_UNSUPPORTED_SCHEMA";

export class VerificationContinuityError extends Error {
  readonly code: VerificationProblemCode;
  constructor(code: VerificationProblemCode, message: string) {
    super(message);
    this.name = "VerificationContinuityError";
    this.code = code;
  }
}

const RECORD_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const REPOSITORY = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/;
const REF = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/;
const COMMIT = /^[0-9a-f]{7,64}$/;
const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const SECRET_FIELD = /^(?:password|passwd|pwd|secret|secrets|token|tokens|api[_-]?key|private[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)$/i;
const SECRET_ASSIGNMENT =
  /(password|passwd|pwd|secret|secrets|token|tokens|api[_-]?key|private[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)\s*[:=]\s*\S+/i;
const PRIVATE_KEY_BLOCK = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;
const ENVIRONMENT_ORDER = new Map<VerificationEnvironment, number>(
  VERIFICATION_ENVIRONMENTS.map((environment, index) => [environment, index]),
);
const SENSITIVITIES: readonly SensitivityClass[] = [
  "PUBLIC",
  "USER",
  "PRIVATE",
  "SYSTEM",
  "SECURITY_SENSITIVE",
  "SECRET_REFERENCE",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInstant(value: unknown): value is string {
  return typeof value === "string" && INSTANT.test(value) && Number.isFinite(Date.parse(value));
}

function assertNoSecrets(value: unknown, path: string): void {
  if (typeof value === "string") {
    if (PRIVATE_KEY_BLOCK.test(value) || SECRET_ASSIGNMENT.test(value)) {
      throw new VerificationContinuityError(
        "VERIFICATION_SECRET_REJECTED",
        `secret-shaped value rejected at ${path}`,
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoSecrets(entry, `${path}[${index}]`));
    return;
  }
  if (isRecord(value)) {
    for (const [key, entry] of Object.entries(value)) {
      const location = `${path}.${key}`;
      if (SECRET_FIELD.test(key) && typeof entry === "string" && entry.trim().length > 0) {
        throw new VerificationContinuityError(
          "VERIFICATION_SECRET_REJECTED",
          `secret-shaped field rejected at ${location}`,
        );
      }
      assertNoSecrets(entry, location);
    }
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isRecord(value)) {
    const body = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",");
    return `{${body}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function edgeKey(edge: EvidenceEdge): string {
  return [
    edge.from.kind,
    edge.from.id,
    edge.relation,
    edge.to.kind,
    edge.to.id,
    edge.provenance,
  ].join("|");
}

function evidenceKey(entry: EnvironmentEvidence): string {
  return [
    ENVIRONMENT_ORDER.get(entry.environment) ?? Number.MAX_SAFE_INTEGER,
    entry.environment,
    entry.evidence.key,
    entry.evidence.kind,
    entry.evidence.passed ? "pass" : "fail",
    entry.evidence.ref,
  ].join("|");
}

function assertEnvironments(environments: readonly VerificationEnvironment[]): VerificationEnvironment[] {
  if (environments.length === 0) {
    throw new VerificationContinuityError(
      "VERIFICATION_ENVIRONMENT_UNKNOWN",
      "at least one execution environment is required",
    );
  }
  const unique = new Set<VerificationEnvironment>();
  for (const environment of environments) {
    if (!ENVIRONMENT_ORDER.has(environment)) {
      throw new VerificationContinuityError(
        "VERIFICATION_ENVIRONMENT_UNKNOWN",
        `unknown execution environment ${String(environment)}`,
      );
    }
    if (unique.has(environment)) {
      throw new VerificationContinuityError(
        "VERIFICATION_ENVIRONMENT_UNKNOWN",
        `duplicate execution environment ${environment}`,
      );
    }
    unique.add(environment);
  }
  return [...unique].sort((a, b) => ENVIRONMENT_ORDER.get(a)! - ENVIRONMENT_ORDER.get(b)!);
}

function assertSource(source: VerificationSource): VerificationSource {
  if (
    !isRecord(source) ||
    !REPOSITORY.test(source.repository ?? "") ||
    !REF.test(source.ref ?? "") ||
    !COMMIT.test(source.commit ?? "") ||
    !HEX64.test(source.baselineDigest ?? "") ||
    !isInstant(source.capturedAt)
  ) {
    throw new VerificationContinuityError(
      "VERIFICATION_SOURCE_INVALID",
      "source must name a repository, ref, lowercase commit, baseline digest and real timestamp",
    );
  }
  return {
    repository: source.repository,
    ref: source.ref,
    commit: source.commit,
    baselineDigest: source.baselineDigest,
    capturedAt: source.capturedAt,
  };
}

function packageReference(manifest: SkillPackageManifest): VerificationPackageReference {
  if (!isRecord(manifest) || manifest.format !== PACKAGE_FORMAT) {
    throw new VerificationContinuityError(
      "VERIFICATION_PACKAGE_REFERENCE_INVALID",
      "only an existing Aetherius skill-package manifest may be enclosed",
    );
  }
  if (typeof manifest.skillId !== "string" || !RECORD_ID.test(manifest.skillId)) {
    throw new VerificationContinuityError(
      "VERIFICATION_PACKAGE_REFERENCE_INVALID",
      "package skillId is malformed",
    );
  }
  if (typeof manifest.version !== "string" || !VERSION.test(manifest.version.trim())) {
    throw new VerificationContinuityError(
      "VERIFICATION_PACKAGE_REFERENCE_INVALID",
      `invalid package version ${String(manifest.version)}`,
    );
  }
  if (typeof manifest.manifestSha256 !== "string" || !HEX64.test(manifest.manifestSha256)) {
    throw new VerificationContinuityError(
      "VERIFICATION_PACKAGE_REFERENCE_INVALID",
      "package manifest digest is malformed",
    );
  }
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    throw new VerificationContinuityError(
      "VERIFICATION_PACKAGE_REFERENCE_INVALID",
      "package manifest names no artifacts",
    );
  }
  try {
    // No bytes are supplied here because the capsule points at the existing
    // package rather than republishing it. An altered manifest must still be
    // caught before it can be enclosed.
    const problems = verifyPackage(manifest, new Map());
    if (problems.some((problem) => problem.reason.includes("manifest integrity"))) {
      throw new Error(problems.map((problem) => problem.reason).join("; "));
    }
  } catch (error) {
    throw new VerificationContinuityError(
      "VERIFICATION_PACKAGE_REFERENCE_INVALID",
      `package manifest is not intact: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return {
    format: PACKAGE_FORMAT,
    skillId: manifest.skillId,
    version: manifest.version.trim(),
    manifestSha256: manifest.manifestSha256,
    artifactCount: manifest.artifacts.length,
  };
}

function artifactDescriptor(source: VerificationArtifactSource): ArtifactDescriptor {
  try {
    if (!isRecord(source) || !isRecord(source.descriptor)) {
      throw new Error("artifact source requires a taxonomy descriptor");
    }
    if (!isRecord(source.envelope)) {
      throw new Error("artifact source requires a P17 envelope");
    }
    return bindArtifactToEnvelope(
      source.descriptor as ArtifactDescriptor,
      source.envelope as StateEnvelope<unknown>,
    );
  } catch (error) {
    if (error instanceof VerificationContinuityError) throw error;
    throw new VerificationContinuityError(
      "VERIFICATION_ARTIFACT_INVALID",
      error instanceof Error ? error.message : String(error),
    );
  }
}

function assertGraph(graph: readonly EvidenceEdge[]): EvidenceEdge[] {
  if (graph.length === 0) {
    throw new VerificationContinuityError(
      "VERIFICATION_GRAPH_EDGE_INVALID",
      "at least one validated evidence-graph edge is required",
    );
  }
  const seen = new Set<string>();
  return [...graph]
    .map((edge) => {
      if (!isRecord(edge)) {
        throw new VerificationContinuityError(
          "VERIFICATION_GRAPH_EDGE_INVALID",
          "evidence-graph edge must be an object",
        );
      }
      const problems = validateEdge(edge);
      if (problems.length > 0) {
        throw new VerificationContinuityError(
          "VERIFICATION_GRAPH_EDGE_INVALID",
          `invalid evidence-graph edge: ${problems.join(",")}`,
        );
      }
      const key = edgeKey(edge);
      if (seen.has(key)) {
        throw new VerificationContinuityError(
          "VERIFICATION_GRAPH_EDGE_INVALID",
          `duplicate evidence-graph edge ${key}`,
        );
      }
      seen.add(key);
      return {
        from: { ...edge.from },
        to: { ...edge.to },
        relation: edge.relation,
        provenance: edge.provenance,
      };
    })
    .sort((a, b) => (edgeKey(a) < edgeKey(b) ? -1 : 1));
}

function assertEvidence(
  requiredEvidence: readonly EvidenceRequirement[],
  evidence: readonly EnvironmentEvidence[],
  environments: readonly VerificationEnvironment[],
): { requiredEvidence: EvidenceRequirement[]; evidence: EnvironmentEvidence[] } {
  if (requiredEvidence.length === 0) {
    throw new VerificationContinuityError(
      "VERIFICATION_EVIDENCE_INVALID",
      "required evidence must not be empty: vacuous coverage is not continuity",
    );
  }
  const seenRequired = new Set<string>();
  const required = requiredEvidence.map((requirement) => {
    if (!isRecord(requirement) || typeof requirement.key !== "string" || requirement.key.trim().length === 0) {
      throw new VerificationContinuityError("VERIFICATION_EVIDENCE_INVALID", "evidence requirement needs a key");
    }
    if (typeof requirement.description !== "string" || requirement.description.trim().length === 0) {
      throw new VerificationContinuityError(
        "VERIFICATION_EVIDENCE_INVALID",
        `evidence requirement ${requirement.key} needs a description`,
      );
    }
    if (seenRequired.has(requirement.key)) {
      throw new VerificationContinuityError(
        "VERIFICATION_EVIDENCE_INVALID",
        `duplicate evidence requirement ${requirement.key}`,
      );
    }
    seenRequired.add(requirement.key);
    return { key: requirement.key, description: requirement.description };
  });
  const seenEntries = new Set<string>();
  const provided = evidence.map((entry) => {
    if (!isRecord(entry) || !ENVIRONMENT_ORDER.has(entry.environment as VerificationEnvironment)) {
      throw new VerificationContinuityError(
        "VERIFICATION_EVIDENCE_INVALID",
        `evidence entry has an unknown environment ${String((entry as { environment?: unknown })?.environment)}`,
      );
    }
    if ((entry as { evidence?: unknown }).evidence === undefined) {
      throw new VerificationContinuityError("VERIFICATION_EVIDENCE_INVALID", "evidence entry needs evidence");
    }
    const key = evidenceKey(entry as EnvironmentEvidence);
    if (seenEntries.has(key)) {
      throw new VerificationContinuityError(
        "VERIFICATION_EVIDENCE_INVALID",
        `duplicate evidence entry ${key}`,
      );
    }
    seenEntries.add(key);
    return {
      environment: entry.environment,
      evidence: { ...(entry as EnvironmentEvidence).evidence },
    } as EnvironmentEvidence;
  });
  for (const environment of environments) {
    const selected = provided.filter((entry) => entry.environment === environment).map((entry) => entry.evidence);
    // checkEvidenceGate owns the pass/fail semantics; this unit only asks it the
    // same question once for every declared execution environment.
    checkEvidenceGate(required, selected);
  }
  return {
    requiredEvidence: [...required].sort((a, b) => (a.key < b.key ? -1 : 1)),
    evidence: [...provided].sort((a, b) => (evidenceKey(a) < evidenceKey(b) ? -1 : 1)),
  };
}

function assertCleanEnvironment(
  cleanEnvironment: CleanEnvironmentClaim,
  evidence: readonly EnvironmentEvidence[],
): CleanEnvironmentClaim {
  if (!isRecord(cleanEnvironment) || typeof cleanEnvironment.claimed !== "boolean") {
    throw new VerificationContinuityError(
      "VERIFICATION_CLEAN_ENVIRONMENT_INVALID",
      "clean-environment status must be an explicit boolean",
    );
  }
  if (!cleanEnvironment.claimed) {
    return { claimed: false };
  }
  if (typeof cleanEnvironment.proofRef !== "string" || cleanEnvironment.proofRef.trim().length === 0) {
    throw new VerificationContinuityError(
      "VERIFICATION_CLEAN_ENVIRONMENT_INVALID",
      "a claimed clean environment requires an explicit proof reference",
    );
  }
  const proof = evidence.find(
    (entry) =>
      entry.evidence.key === "clean-environment-proof" &&
      entry.evidence.kind === "verification" &&
      entry.evidence.passed &&
      entry.evidence.ref === cleanEnvironment.proofRef,
  );
  if (!proof) {
    throw new VerificationContinuityError(
      "VERIFICATION_CLEAN_ENVIRONMENT_INVALID",
      "clean-environment proof must be supplied, passed and matched exactly",
    );
  }
  return { claimed: true, proofRef: cleanEnvironment.proofRef };
}

function canonicalizeRecord(body: VerificationRecordBody): VerificationRecordBody {
  return {
    format: body.format,
    recordId: body.recordId,
    createdAt: body.createdAt,
    provenance: body.provenance,
    sensitivity: body.sensitivity,
    source: { ...body.source },
    environments: assertEnvironments(body.environments),
    packages: [...body.packages].sort((a, b) =>
      `${a.skillId}@${a.version}` < `${b.skillId}@${b.version}` ? -1 : 1,
    ),
    artifacts: [...body.artifacts].sort((a, b) => (a.artifactId < b.artifactId ? -1 : 1)),
    graph: assertGraph(body.graph),
    requiredEvidence: [...body.requiredEvidence].sort((a, b) => (a.key < b.key ? -1 : 1)),
    evidence: [...body.evidence].sort((a, b) => (evidenceKey(a) < evidenceKey(b) ? -1 : 1)),
    cleanEnvironment: { ...body.cleanEnvironment },
  };
}

function assertRecordBody(value: unknown): VerificationRecordBody {
  if (!isRecord(value)) {
    throw new VerificationContinuityError("VERIFICATION_ID_INVALID", "verification record must be an object");
  }
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (
      ![
        "format",
        "recordId",
        "createdAt",
        "provenance",
        "sensitivity",
        "source",
        "environments",
        "packages",
        "artifacts",
        "graph",
        "requiredEvidence",
        "evidence",
        "cleanEnvironment",
      ].includes(key)
    ) {
      throw new VerificationContinuityError(
        "VERIFICATION_ID_INVALID",
        `unknown verification record field ${key}`,
      );
    }
  }
  if (body.format !== VERIFICATION_RECORD_FORMAT) {
    throw new VerificationContinuityError(
      "VERIFICATION_ID_INVALID",
      `not a ${VERIFICATION_RECORD_FORMAT} record`,
    );
  }
  if (typeof body.recordId !== "string" || !RECORD_ID.test(body.recordId)) {
    throw new VerificationContinuityError("VERIFICATION_ID_INVALID", "recordId is malformed");
  }
  if (!isInstant(body.createdAt)) {
    throw new VerificationContinuityError("VERIFICATION_ID_INVALID", "createdAt must be a real timestamp");
  }
  if (typeof body.provenance !== "string" || body.provenance.trim().length === 0) {
    throw new VerificationContinuityError("VERIFICATION_ID_INVALID", "provenance is required");
  }
  if (!SENSITIVITIES.includes(body.sensitivity as SensitivityClass)) {
    throw new VerificationContinuityError("VERIFICATION_ID_INVALID", "sensitivity is unknown");
  }
  assertNoSecrets(body, "$");
  return body as unknown as VerificationRecordBody;
}

/**
 * Full records carry their own digest beside the canonical body. Consumers
 * strip that wrapper before validation so validating a complete record does
 * not mistake its own integrity field for an unknown payload field.
 */
function recordBody(record: VerificationRecord | VerificationRecordBody): VerificationRecordBody {
  if (!isRecord(record)) {
    throw new VerificationContinuityError("VERIFICATION_ID_INVALID", "verification record must be an object");
  }
  const { recordDigest: _recordDigest, ...body } = record as Record<string, unknown> & {
    recordDigest?: unknown;
  };
  return assertRecordBody(body);
}

/** Digest of the canonical body; byte-identical inputs have byte-identical digests. */
export function verificationRecordDigest(body: VerificationRecordBody): string {
  const canonical = canonicalizeRecord(assertRecordBody(body));
  return sha256Hex(canonicalJson(canonical));
}

/**
 * Compose one portable record from already-proven parts. This validates the
 * join, not the underlying package, envelope, graph or evidence semantics:
 * those units remain responsible for the facts the capsule merely carries.
 */
export function composeVerificationRecord(input: ComposeVerificationInput): VerificationRecord {
  if (!isRecord(input)) {
    throw new VerificationContinuityError("VERIFICATION_ID_INVALID", "verification input must be an object");
  }
  const body: VerificationRecordBody = {
    format: VERIFICATION_RECORD_FORMAT,
    recordId: input.recordId,
    createdAt: input.createdAt,
    provenance: input.provenance,
    sensitivity: input.sensitivity ?? "SYSTEM",
    source: assertSource(input.source),
    environments: assertEnvironments(input.environments),
    packages: input.packageManifests.map(packageReference),
    artifacts: input.artifactSources.map(artifactDescriptor),
    graph: assertGraph(input.graph),
    requiredEvidence: [],
    evidence: [],
    cleanEnvironment: { claimed: false },
  };
  if (body.packages.length === 0 || body.artifacts.length === 0) {
    throw new VerificationContinuityError(
      "VERIFICATION_ID_INVALID",
      "a verification record must enclose at least one package and one P17-bound artifact",
    );
  }
  const checkedEvidence = assertEvidence(input.requiredEvidence, input.evidence, body.environments);
  body.requiredEvidence = checkedEvidence.requiredEvidence;
  body.evidence = checkedEvidence.evidence;
  body.cleanEnvironment = assertCleanEnvironment(input.cleanEnvironment, body.evidence);
  const canonical = canonicalizeRecord(assertRecordBody(body));
  return { ...canonical, recordDigest: sha256Hex(canonicalJson(canonical)) };
}

/** Deterministic serialization: equal records serialize to equal bytes. */
export function serializeVerificationRecord(record: VerificationRecord): string {
  const canonical = canonicalizeRecord(recordBody(record));
  const digest = sha256Hex(canonicalJson(canonical));
  if (digest !== record.recordDigest) {
    throw new VerificationContinuityError(
      "VERIFICATION_RECORD_DIGEST_MISMATCH",
      "record digest does not match its canonical body",
    );
  }
  return canonicalJson({ ...canonical, recordDigest: digest });
}

/** Parse bytes another environment produced and prove they survived intact. */
export function parseVerificationRecord(serialized: string): VerificationRecord {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    throw new VerificationContinuityError("VERIFICATION_ID_INVALID", "verification record is not JSON");
  }
  if (!isRecord(parsed) || typeof parsed.recordDigest !== "string") {
    throw new VerificationContinuityError("VERIFICATION_ID_INVALID", "verification record needs a digest");
  }
  const { recordDigest, ...body } = parsed;
  const canonical = canonicalizeRecord(assertRecordBody(body));
  const digest = sha256Hex(canonicalJson(canonical));
  if (digest !== recordDigest) {
    throw new VerificationContinuityError(
      "VERIFICATION_RECORD_DIGEST_MISMATCH",
      "verification bytes were altered after their digest was computed",
    );
  }
  return { ...canonical, recordDigest: digest };
}

export type VerificationCoverage = "COMPLETE" | "INCOMPLETE";
export type CleanEnvironmentAssessment = "UNCLAIMED" | "PROVEN" | "REJECTED";

export interface EnvironmentCoverage {
  environment: VerificationEnvironment;
  gate: GateResult;
}

export interface VerificationContinuityAssessment {
  recordId: string;
  recordDigest: string;
  coverage: VerificationCoverage;
  completeEnvironments: VerificationEnvironment[];
  incompleteEnvironments: EnvironmentCoverage[];
  cleanEnvironment: CleanEnvironmentAssessment;
}

/**
 * Assess whether the joined record actually covers every environment it names.
 * Coverage is a fact about the supplied evidence, not a verdict about the
 * underlying work: an INCOMPLETE assessment says which requirement is missing
 * where, not that the work failed.
 */
export function assessVerificationContinuity(record: VerificationRecord): VerificationContinuityAssessment {
  const canonical = canonicalizeRecord(recordBody(record));
  if (sha256Hex(canonicalJson(canonical)) !== record.recordDigest) {
    throw new VerificationContinuityError(
      "VERIFICATION_RECORD_DIGEST_MISMATCH",
      "cannot assess a record whose digest does not match",
    );
  }
  const completeEnvironments: VerificationEnvironment[] = [];
  const incompleteEnvironments: EnvironmentCoverage[] = [];
  for (const environment of canonical.environments) {
    const selected = canonical.evidence
      .filter((entry) => entry.environment === environment)
      .map((entry) => entry.evidence);
    const gate = checkEvidenceGate(canonical.requiredEvidence, selected);
    if (gate.verdict === "COMPLETE") completeEnvironments.push(environment);
    else incompleteEnvironments.push({ environment, gate });
  }
  let cleanEnvironment: CleanEnvironmentAssessment = "UNCLAIMED";
  if (canonical.cleanEnvironment.claimed) {
    const proof = canonical.evidence.find(
      (entry) =>
        entry.evidence.key === "clean-environment-proof" &&
        entry.evidence.kind === "verification" &&
        entry.evidence.passed &&
        entry.evidence.ref === canonical.cleanEnvironment.proofRef,
    );
    cleanEnvironment = proof ? "PROVEN" : "REJECTED";
  }
  return {
    recordId: canonical.recordId,
    recordDigest: record.recordDigest,
    coverage: incompleteEnvironments.length === 0 ? "COMPLETE" : "INCOMPLETE",
    completeEnvironments,
    incompleteEnvironments,
    cleanEnvironment,
  };
}

export interface PersistVerificationOptions {
  expectedRecordVersion?: number;
  causedBy?: { actor: string; source: string };
  now: string;
}

/**
 * Persist the portable record through P17 owned state. The portable record is
 * not the P17 record: the envelope remains the persistence authority, with its
 * own integrity, version and concurrency discipline.
 */
export function persistVerificationRecord(
  store: OwnedStore,
  record: VerificationRecord,
  options: PersistVerificationOptions,
): StateEnvelope<VerificationRecordBody> {
  const canonical = canonicalizeRecord(recordBody(record));
  const digest = sha256Hex(canonicalJson(canonical));
  if (digest !== record.recordDigest) {
    throw new VerificationContinuityError(
      "VERIFICATION_RECORD_DIGEST_MISMATCH",
      "cannot persist a record whose digest does not match",
    );
  }
  if (typeof options.now !== "string" || !isInstant(options.now)) {
    throw new StateError(
      "STATE_VALIDATION_FAILED",
      "persisting a verification record requires a caller-supplied real timestamp",
    );
  }
  if (store.exists(canonical.recordId)) {
    const existing = store.load<VerificationRecordBody>(canonical.recordId);
    if (existing.kind !== VERIFICATION_RECORD_KIND) {
      throw new VerificationContinuityError(
        "VERIFICATION_RECORD_CONFLICT",
        `id ${canonical.recordId} already holds a ${existing.kind} record`,
      );
    }
    if (existing.schemaVersion > VERIFICATION_RECORD_SCHEMA_VERSION) {
      throw new VerificationContinuityError(
        "VERIFICATION_RECORD_UNSUPPORTED_SCHEMA",
        `stored verification schema ${existing.schemaVersion} is newer than supported`,
      );
    }
    const existingDigest = verificationRecordDigest(existing.payload);
    if (existingDigest === digest) return existing;
    if (options.expectedRecordVersion === undefined) {
      throw new VerificationContinuityError(
        "VERIFICATION_RECORD_CONFLICT",
        "verification id is already occupied by different content; supply expectedRecordVersion to replace it deliberately",
      );
    }
  }
  const previous = store.exists(canonical.recordId)
    ? store.load<VerificationRecordBody>(canonical.recordId)
    : null;
  return store.save<VerificationRecordBody>(
    {
      id: canonical.recordId,
      kind: VERIFICATION_RECORD_KIND,
      schemaVersion: VERIFICATION_RECORD_SCHEMA_VERSION,
      recordVersion: previous ? previous.recordVersion + 1 : 1,
      createdAt: previous ? previous.createdAt : canonical.createdAt,
      updatedAt: options.now,
      owner: "aetherius-os",
      provenance: canonical.provenance,
      sensitivity: canonical.sensitivity,
      integrity: sha256Hex(canonicalJson(canonical)),
      causedBy: options.causedBy,
      payload: canonical,
    },
    { ...options, now: () => options.now },
  );
}

/** Read a stored verification record back and prove its digest survived. */
export function readVerificationRecord(
  envelope: StateEnvelope<VerificationRecordBody>,
): VerificationRecord {
  if (!isRecord(envelope) || envelope.kind !== VERIFICATION_RECORD_KIND) {
    throw new VerificationContinuityError(
      "VERIFICATION_ID_INVALID",
      `record kind ${String((envelope as { kind?: unknown })?.kind)} is not a verification record`,
    );
  }
  if (envelope.schemaVersion > VERIFICATION_RECORD_SCHEMA_VERSION) {
    throw new VerificationContinuityError(
      "VERIFICATION_RECORD_UNSUPPORTED_SCHEMA",
      `verification schema ${envelope.schemaVersion} is newer than supported`,
    );
  }
  const canonical = canonicalizeRecord(assertRecordBody(envelope.payload));
  return { ...canonical, recordDigest: sha256Hex(canonicalJson(canonical)) };
}
