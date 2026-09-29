/**
 * REQ-p31-release-packaging: public installer/packaging with first-run
 * setup, update/migration/rollback and uninstall for the defined release
 * scope; developer checkout is not an installer. SBOM/signing compose with
 * supply-chain attestation, not duplicated.
 *
 * This module models release packaging as validated RECORDS — a package
 * manifest plus install, update, rollback, and uninstall PLANS — never as
 * execution. There is no downloader, installer runner, migration executor,
 * or uninstaller here, because no controlled execution substrate for those
 * operations exists in this repository and inventing one would create a new
 * privileged surface:
 *
 *   PACKAGE RECORD != INSTALLER EXECUTION
 *   UPDATE PLAN != UPDATE EXECUTION
 *   ROLLBACK PLAN != ROLLBACK EXECUTION
 *   UNINSTALL PLAN != FILE DELETION
 *   DEVELOPER CHECKOUT != INSTALLER (hence this module exists at all)
 *
 * SCOPE COMES FROM OUTSIDE, NEVER FROM HERE. Release scope is OWNER_GATED
 * (REQ-p31-release-scope), so a package carries a scopeRef naming the
 *决定 scope decision and this module never chooses, widens, or narrows it:
 *
 *   SCOPE REFERENCE != SCOPE DECISION
 *   PACKAGE WITHOUT SCOPE REF IS REFUSED (a scope-less release asserts scope)
 *
 * VERSIONS ARE HONEST. A public release package must name its release with
 * real semantic versioning. 0.0.0 names nothing — it is the development
 * placeholder this very repository still carries — so it is refused as a
 * release version with an explicit reason, not silently accepted:
 *
 *   0.0.0 != A RELEASE
 *   VERSION DECLARED != VERSION SHIPPED
 *
 * SBOM AND SIGNING COMPOSE, NEVER DUPLICATE. Artifacts reference
 * supply-chain attestation records by id; where the caller supplies an
 * attestation lookup, artifact digests are VERIFIED against it, otherwise
 * recorded as caller-asserted and marked accordingly:
 *
 *   ATTESTATION REF != ATTESTATION COPY
 *   VERIFIED DIGEST != ASSERTED DIGEST (the difference is always visible)
 *   SIGNATURE CLAIM != VERIFIED SIGNATURE (inherited from attestation)
 *
 * ROLLBACK POINTS BACKWARD, NEVER FORWARD. A rollback plan names a strictly
 * older released version known to the caller's version history; rolling
 * "back" to the current or a newer version is refused. Migration steps
 * reference P17 schema migrations by id — never reimplemented, never
 * executed here:
 *
 *   ROLLBACK TARGET < CURRENT VERSION (by semver, checked here)
 *   MIGRATION REF != MIGRATION EXECUTION (P17 owns execution)
 *
 * UNINSTALL STATES WHAT IT KEEPS. An uninstall plan lists declared removal
 * steps plus explicitly preserved user-data refs. Nothing is deleted by
 * this module; the plan only states the boundary:
 *
 *   REMOVAL PLAN != DELETION
 *   PRESERVED DATA IS NAMED, NEVER ASSUMED
 *
 * WHAT THIS IS NOT: no approval, no grant, no release-scope decision, no
 * signing, no placement, no scheduling, no network. A package record is
 * evidence for promotion/eval runners and human release decisions — never
 * a verdict, never permission:
 *
 *   PACKAGE RECORD != RELEASE APPROVAL
 *   COMPLETE PLANS != RELEASE READY
 *
 * Timestamps are caller-supplied with identity preserved. Everything is
 * pure and deterministic: canonical ordering, scrambled-input equality, no
 * caller mutation, no clock, no network.
 */

export type PackagingProblemCode =
  | "PACKAGING_INVALID_INPUT"
  | "PACKAGING_UNKNOWN_FIELD"
  | "PACKAGING_AUTHORITY_REJECTED"
  | "PACKAGING_SECRET_REJECTED"
  | "PACKAGING_PERSONALITY_REJECTED"
  | "PACKAGING_BAD_VERSION"
  | "PACKAGING_UNVERSIONED_RELEASE"
  | "PACKAGING_SCOPE_REQUIRED"
  | "PACKAGING_DUPLICATE_ID"
  | "PACKAGING_CONFLICT"
  | "PACKAGING_DIGEST_MISMATCH"
  | "PACKAGING_UNKNOWN_ARTIFACT"
  | "PACKAGING_ROLLBACK_NOT_OLDER";

export class PackagingError extends Error {
  readonly code: PackagingProblemCode;
  constructor(code: PackagingProblemCode, message: string) {
    super(message);
    this.name = "PackagingError";
    this.code = code;
  }
}

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

/** Strict X.Y.Z with optional -tag. No ranges, no wildcards, no "latest". */
export function parseSemver(value: unknown): SemVer {
  if (typeof value !== "string") {
    throw new PackagingError("PACKAGING_BAD_VERSION", "version must be a string");
  }
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(value.trim());
  if (match === null || match[1] === undefined || match[2] === undefined || match[3] === undefined) {
    throw new PackagingError("PACKAGING_BAD_VERSION", `version ${value} is not strict X.Y.Z semver: no ranges, no wildcards, no "latest"`);
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  const prerelease = match[4];
  return {
    major,
    minor,
    patch,
    ...(prerelease === undefined ? {} : { prerelease }),
  };
}

/** Standard semver precedence: numeric parts, then release-tag rules. */
export function compareSemver(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === undefined) return 1;
  if (b.prerelease === undefined) return -1;
  return a.prerelease < b.prerelease ? -1 : 1;
}

export function semverToString(version: SemVer): string {
  return `${version.major}.${version.minor}.${version.patch}${version.prerelease === undefined ? "" : `-${version.prerelease}`}`;
}

export interface PackageArtifact {
  /** Supply-chain attestation record id. Referenced, never copied. */
  attestationRef: string;
  /** Role in this package (e.g. "binary", "installer", "sbom"). */
  role: string;
  /** Digest as recorded here. VERIFIED only when checked against attestation. */
  digest: string;
  digestStatus: "VERIFIED" | "ASSERTED";
}

export interface PlanStep {
  stepId: string;
  description: string;
}

export interface InstallPlan {
  steps: PlanStep[];
}

export interface UpdatePlan {
  fromVersion: string;
  toVersion: string;
  /** P17 schema-migration ids. Referenced, never executed here. */
  migrationRefs: string[];
  /** Must name a strictly older released version (checked against history). */
  rollbackToVersion: string;
}

export interface RollbackPlan {
  /** Strictly older than the package version, known in version history. */
  rollbackToVersion: string;
  reason: string;
}

export interface UninstallPlan {
  steps: PlanStep[];
  /** User-data refs explicitly preserved. Named, never assumed. */
  preservesDataRefs: string[];
}

export interface ReleasePackage {
  packageId: string;
  name: string;
  version: string;
  /** The owner-gated scope decision, cited by id only. Never chosen here. */
  scopeRef: string;
  artifacts: PackageArtifact[];
  installPlan: InstallPlan;
  updatePlan?: UpdatePlan;
  rollbackPlan?: RollbackPlan;
  uninstallPlan: UninstallPlan;
  recordedAt: string;
  provenance: string;
}

export interface AttestationLookup {
  digestFor(artifactRef: string): string | null;
}

const PACKAGE_FIELDS = [
  "packageId", "name", "version", "scopeRef", "artifacts",
  "installPlan", "updatePlan", "rollbackPlan", "uninstallPlan",
  "recordedAt", "provenance",
] as const;

const ARTIFACT_FIELDS = ["attestationRef", "role", "digest"] as const;
const STEP_FIELDS = ["stepId", "description"] as const;

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "canDeploy", "permission",
  "permissionGranted", "grantApproved", "policyBypass", "ownerOverride",
  "mergeAuthority", "releaseApproved", "releaseScope", "deployApproved",
  "score", "grade", "rating", "verdict",
];

const SECRET_KEYS = ["apiKey", "secret", "token", "password", "privateKey", "credential"];

const PERSONALITY_KEYS = [
  "personality", "persona", "traits", "backstory", "biography",
  "autobiography", "identity", "dna", "soul", "selfModel",
];

const HEX64 = /^[0-9a-f]{64}$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Security-significant violations are diagnosed BEFORE generic shape errors,
 * so a smuggled approval is reported as itself and never disappears into an
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
      throw new PackagingError("PACKAGING_AUTHORITY_REJECTED", `${path}.${key}: a package record never carries authorization, approval, or scores`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new PackagingError("PACKAGING_SECRET_REJECTED", `${path}.${key}: SECRET REF != SECRET VALUE`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new PackagingError("PACKAGING_PERSONALITY_REJECTED", `${path}.${key}: a package record carries no stored person`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

function assertSteps(value: unknown, path: string): PlanStep[] {
  if (!Array.isArray(value)) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", `${path} must be an array`);
  }
  const ids = new Set<string>();
  return value.map((raw, index) => {
    if (!isPlainObject(raw)) {
      throw new PackagingError("PACKAGING_INVALID_INPUT", `${path}[${index}] must be an object`);
    }
    for (const key of Object.keys(raw)) {
      if (!(STEP_FIELDS as readonly string[]).includes(key)) {
        throw new PackagingError("PACKAGING_UNKNOWN_FIELD", `unknown plan step field ${key}`);
      }
    }
    if (!nonEmpty(raw.stepId) || !nonEmpty(raw.description)) {
      throw new PackagingError("PACKAGING_INVALID_INPUT", `${path}[${index}] needs a non-empty stepId and description`);
    }
    if (ids.has(raw.stepId as string)) {
      throw new PackagingError("PACKAGING_DUPLICATE_ID", `${path} step ${raw.stepId} declared twice`);
    }
    ids.add(raw.stepId as string);
    return { stepId: raw.stepId as string, description: raw.description as string };
  });
}

function assertStringList(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((id) => !nonEmpty(id))) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", `${path} must be an array of non-empty strings`);
  }
  return [...new Set(value as string[])].sort();
}

export interface RecordPackageInput {
  packageId: string;
  name: string;
  version: string;
  scopeRef: string;
  artifacts: Array<{ attestationRef: string; role: string; digest: string }>;
  installPlan: { steps: Array<{ stepId: string; description: string }> };
  updatePlan?: {
    fromVersion: string;
    toVersion: string;
    migrationRefs: string[];
    rollbackToVersion: string;
  };
  rollbackPlan?: { rollbackToVersion: string; reason: string };
  uninstallPlan: {
    steps: Array<{ stepId: string; description: string }>;
    preservesDataRefs: string[];
  };
  /** Released versions known to the caller, for rollback-target checks. */
  versionHistory?: string[];
  /** Optional attestation lookup: enables VERIFIED digests. Without it,
   * digests are recorded ASSERTED — and say so. */
  attestationLookup?: AttestationLookup;
  recordedAt: string;
  provenance: string;
}

/**
 * Record one release package with its lifecycle plans. Pure + deterministic:
 * same input always yields the same record. Plans are validated records,
 * never executions. Scope arrives by reference; versions are honest semver;
 * digests are verified only against a caller-supplied attestation lookup.
 */
export function recordPackage(input: unknown): ReleasePackage {
  if (!isPlainObject(input)) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", "package input must be an object");
  }
  assertNoViolations(input, "input", new Set());
  const allowed = [
    "packageId", "name", "version", "scopeRef", "artifacts",
    "installPlan", "updatePlan", "rollbackPlan", "uninstallPlan",
    "versionHistory", "attestationLookup", "recordedAt", "provenance",
  ] as const;
  for (const key of Object.keys(input)) {
    if (!(allowed as readonly string[]).includes(key)) {
      throw new PackagingError("PACKAGING_UNKNOWN_FIELD", `unknown package field ${key}`);
    }
  }
  if (!nonEmpty(input.packageId)) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", "packageId must be a non-empty stable id");
  }
  if (!nonEmpty(input.name)) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", "name must be a non-empty string");
  }
  const version = parseSemver(input.version);
  if (version.major === 0 && version.minor === 0 && version.patch === 0) {
    throw new PackagingError("PACKAGING_UNVERSIONED_RELEASE", "version 0.0.0 names no release: a public package must name its release with real semantic versioning");
  }
  if (!nonEmpty(input.scopeRef)) {
    throw new PackagingError("PACKAGING_SCOPE_REQUIRED", "scopeRef must cite the owner-gated scope decision: a scope-less release asserts scope, and scope is not this module's to assert");
  }
  if (!Array.isArray(input.artifacts) || input.artifacts.length === 0) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", "artifacts must be a non-empty array: a package with nothing in it packages nothing");
  }
  const lookup = input.attestationLookup as AttestationLookup | undefined;
  if (lookup !== undefined && (typeof lookup !== "object" || lookup === null || typeof (lookup as AttestationLookup).digestFor !== "function")) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", "attestationLookup must expose digestFor(ref) when present");
  }
  const artifacts: PackageArtifact[] = (input.artifacts as unknown[]).map((raw, index) => {
    if (!isPlainObject(raw)) {
      throw new PackagingError("PACKAGING_INVALID_INPUT", `artifacts[${index}] must be an object`);
    }
    for (const key of Object.keys(raw)) {
      if (!(ARTIFACT_FIELDS as readonly string[]).includes(key)) {
        throw new PackagingError("PACKAGING_UNKNOWN_FIELD", `unknown artifact field ${key}`);
      }
    }
    if (!nonEmpty(raw.attestationRef) || !nonEmpty(raw.role)) {
      throw new PackagingError("PACKAGING_INVALID_INPUT", `artifacts[${index}] needs a non-empty attestationRef and role`);
    }
    if (typeof raw.digest !== "string" || !HEX64.test(raw.digest)) {
      throw new PackagingError("PACKAGING_INVALID_INPUT", `artifacts[${index}].digest must be a 64-character lowercase hex sha256: malformed hashes are rejected, never repaired`);
    }
    const canonical = lookup?.digestFor(raw.attestationRef as string) ?? null;
    if (canonical !== null && canonical !== raw.digest) {
      throw new PackagingError("PACKAGING_DIGEST_MISMATCH", `artifacts[${index}] digest does not equal the attested digest for ${raw.attestationRef}`);
    }
    return {
      attestationRef: raw.attestationRef as string,
      role: raw.role as string,
      digest: raw.digest as string,
      digestStatus: (canonical === null ? "ASSERTED" : "VERIFIED") as "ASSERTED" | "VERIFIED",
    };
  });
  const attestationRefs = artifacts.map((a) => a.attestationRef);
  if (new Set(attestationRefs).size !== attestationRefs.length) {
    throw new PackagingError("PACKAGING_DUPLICATE_ID", "the same attestation record listed twice inflates the package: DUPLICATE REFERENCE != ADDITIONAL EVIDENCE");
  }
  if (!isPlainObject(input.installPlan)) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", "installPlan must be an object");
  }
  for (const key of Object.keys(input.installPlan as Record<string, unknown>)) {
    if (key !== "steps") {
      throw new PackagingError("PACKAGING_UNKNOWN_FIELD", `unknown installPlan field ${key}`);
    }
  }
  const installSteps = assertSteps((input.installPlan as Record<string, unknown>).steps, "installPlan.steps");
  if (installSteps.length === 0) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", "installPlan needs at least one declared first-run step: an installer with no setup plan is not first-run setup");
  }
  let updatePlan: ReleasePackage["updatePlan"];
  if (input.updatePlan !== undefined) {
    if (!isPlainObject(input.updatePlan)) {
      throw new PackagingError("PACKAGING_INVALID_INPUT", "updatePlan must be an object");
    }
    for (const key of Object.keys(input.updatePlan as Record<string, unknown>)) {
      if (!["fromVersion", "toVersion", "migrationRefs", "rollbackToVersion"].includes(key)) {
        throw new PackagingError("PACKAGING_UNKNOWN_FIELD", `unknown updatePlan field ${key}`);
      }
    }
    const plan = input.updatePlan as Record<string, unknown>;
    const fromVersion = parseSemver(plan.fromVersion);
    const toVersion = parseSemver(plan.toVersion);
    if (compareSemver(toVersion, fromVersion) <= 0) {
      throw new PackagingError("PACKAGING_INVALID_INPUT", "updatePlan.toVersion must be strictly newer than fromVersion: an update that goes nowhere updates nothing");
    }
    const rollbackToVersion = parseSemver(plan.rollbackToVersion);
    if (compareSemver(rollbackToVersion, toVersion) >= 0) {
      throw new PackagingError("PACKAGING_ROLLBACK_NOT_OLDER", "updatePlan.rollbackToVersion must be strictly older than toVersion: ROLLBACK POINTS BACKWARD, NEVER FORWARD (rolling back to fromVersion itself is the normal case)");
    }
    updatePlan = {
      fromVersion: semverToString(fromVersion),
      toVersion: semverToString(toVersion),
      migrationRefs: assertStringList(plan.migrationRefs, "updatePlan.migrationRefs"),
      rollbackToVersion: semverToString(rollbackToVersion),
    };
  }
  let rollbackPlan: ReleasePackage["rollbackPlan"];
  if (input.rollbackPlan !== undefined) {
    if (!isPlainObject(input.rollbackPlan)) {
      throw new PackagingError("PACKAGING_INVALID_INPUT", "rollbackPlan must be an object");
    }
    for (const key of Object.keys(input.rollbackPlan as Record<string, unknown>)) {
      if (!["rollbackToVersion", "reason"].includes(key)) {
        throw new PackagingError("PACKAGING_UNKNOWN_FIELD", `unknown rollbackPlan field ${key}`);
      }
    }
    const plan = input.rollbackPlan as Record<string, unknown>;
    const target = parseSemver(plan.rollbackToVersion);
    if (compareSemver(target, version) >= 0) {
      throw new PackagingError("PACKAGING_ROLLBACK_NOT_OLDER", "rollbackPlan.rollbackToVersion must be strictly older than the package version");
    }
    if (input.versionHistory !== undefined) {
      if (!Array.isArray(input.versionHistory)) {
        throw new PackagingError("PACKAGING_INVALID_INPUT", "versionHistory must be an array of version strings when present");
      }
      const known = (input.versionHistory as unknown[]).map((v) => {
        if (typeof v !== "string") {
          throw new PackagingError("PACKAGING_INVALID_INPUT", "versionHistory entries must be version strings");
        }
        return semverToString(parseSemver(v));
      });
      if (!known.includes(semverToString(target))) {
        throw new PackagingError("PACKAGING_UNKNOWN_ARTIFACT", `rollback target ${semverToString(target)} is not in the known version history: rollback points at released versions, never imagined ones`);
      }
    }
    if (!nonEmpty(plan.reason)) {
      throw new PackagingError("PACKAGING_INVALID_INPUT", "rollbackPlan.reason must be non-empty");
    }
    rollbackPlan = { rollbackToVersion: semverToString(target), reason: plan.reason as string };
  }
  if (!isPlainObject(input.uninstallPlan)) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", "uninstallPlan must be an object");
  }
  for (const key of Object.keys(input.uninstallPlan as Record<string, unknown>)) {
    if (!["steps", "preservesDataRefs"].includes(key)) {
      throw new PackagingError("PACKAGING_UNKNOWN_FIELD", `unknown uninstallPlan field ${key}`);
    }
  }
  const uninstall = input.uninstallPlan as Record<string, unknown>;
  const uninstallSteps = assertSteps(uninstall.steps, "uninstallPlan.steps");
  if (uninstallSteps.length === 0) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", "uninstallPlan needs at least one declared step");
  }
  if (!nonEmpty(input.recordedAt) || !nonEmpty(input.provenance)) {
    throw new PackagingError("PACKAGING_INVALID_INPUT", "recordedAt and provenance are required: timestamps are caller-supplied, never invented");
  }
  return {
    packageId: input.packageId as string,
    name: input.name as string,
    version: semverToString(version),
    scopeRef: input.scopeRef as string,
    artifacts: [...artifacts].sort((a, b) => (a.attestationRef < b.attestationRef ? -1 : 1)),
    installPlan: { steps: installSteps },
    ...(updatePlan === undefined ? {} : { updatePlan }),
    ...(rollbackPlan === undefined ? {} : { rollbackPlan }),
    uninstallPlan: { steps: uninstallSteps, preservesDataRefs: assertStringList(uninstall.preservesDataRefs, "uninstallPlan.preservesDataRefs") },
    recordedAt: input.recordedAt as string,
    provenance: input.provenance as string,
  };
}
