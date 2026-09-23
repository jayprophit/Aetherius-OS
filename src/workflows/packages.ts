import { createHash } from "node:crypto";
import { validateSkill } from "./skills";
import type { Skill } from "./types";

/**
 * REQ-p19-skill-packages: versioned skill/plugin package format with trust
 * metadata. A package is a publishable manifest plus content-hash-addressed
 * artifacts. Hashes are always computed, never asserted; trust metadata is
 * carried from the skill record, never invented. Resolution is exact: a
 * missing or mismatched artifact fails honestly instead of substituting.
 *
 * Composes with P19/5 promotion (candidates, hashes, pinning) without
 * duplicating it: promotion governs lifecycle, packages govern the
 * publishable bundle format. Reference: ClawHub package catalog (MIT,
 * STUDY_ONLY) — capability scope only.
 */

export const PACKAGE_FORMAT = "aetherius-skill-package/1" as const;

export interface PackageArtifactEntry {
  name: string;
  /** Hex sha256 over the exact artifact bytes. */
  sha256: string;
  byteLength: number;
}

export interface PackageTrust {
  provenance: string;
  riskClass: Skill["risk_class"];
  status: Skill["status"];
  requiredPermissions: string[];
  family: string;
  capabilities: string[];
}

export interface SkillPackageManifest {
  format: typeof PACKAGE_FORMAT;
  skillId: string;
  version: string;
  artifacts: PackageArtifactEntry[];
  /** Manifest integrity: sha256 over the canonical manifest body. */
  manifestSha256: string;
  trust: PackageTrust;
  builtAt: string;
}

export interface PackageProblem {
  artifact?: string;
  reason: string;
}

export function sha256HexBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function manifestBody(manifest: Omit<SkillPackageManifest, "manifestSha256">): string {
  return canonicalJson({ ...manifest, artifacts: [...manifest.artifacts].sort((a, b) => (a.name < b.name ? -1 : 1)) });
}

/**
 * Build a publishable package manifest for a registered skill. Artifact
 * bytes are hashed, never stored here; trust fields are copied from the
 * validated skill record. Family/capabilities come from the skill; the
 * caller supplies the artifact bundle explicitly.
 */
export function buildPackage(
  skill: Skill,
  artifacts: ReadonlyMap<string, Uint8Array>,
  options: { now?: () => string } = {},
): SkillPackageManifest {
  const problem = validateSkill(skill);
  if (problem) throw new Error(`invalid skill: ${problem}`);
  if (artifacts.size === 0) throw new Error("package requires at least one artifact");
  const entries: PackageArtifactEntry[] = [];
  for (const [name, bytes] of [...artifacts.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (!name.trim() || name.includes("..")) throw new Error(`invalid artifact name ${name}`);
    entries.push({ name, sha256: sha256HexBytes(bytes), byteLength: bytes.byteLength });
  }
  const body: Omit<SkillPackageManifest, "manifestSha256"> = {
    format: PACKAGE_FORMAT,
    skillId: skill.skill_id,
    version: skill.version,
    artifacts: entries,
    trust: {
      provenance: skill.provenance,
      riskClass: skill.risk_class,
      status: skill.status,
      requiredPermissions: [...skill.required_permissions].sort(),
      family: skill.capability,
      capabilities: [...skill.required_capabilities].sort(),
    },
    builtAt: (options.now ?? (() => new Date().toISOString()))(),
  };
  return { ...body, manifestSha256: sha256HexBytes(new TextEncoder().encode(manifestBody(body))) };
}

/**
 * Verify a manifest against candidate artifact bytes: manifest integrity
 * first, then every listed artifact present with exact bytes. Returns
 * problems (never throws on content issues); throws only on malformed
 * manifest shape.
 */
export function verifyPackage(
  manifest: SkillPackageManifest,
  artifacts: ReadonlyMap<string, Uint8Array>,
): PackageProblem[] {
  if (!manifest || manifest.format !== PACKAGE_FORMAT) {
    throw new Error("not an aetherius skill package manifest");
  }
  const { manifestSha256, ...body } = manifest;
  const recomputed = sha256HexBytes(new TextEncoder().encode(manifestBody(body)));
  if (recomputed !== manifestSha256) {
    return [{ reason: "manifest integrity mismatch: manifest was altered after build" }];
  }
  const problems: PackageProblem[] = [];
  for (const entry of manifest.artifacts) {
    const bytes = artifacts.get(entry.name);
    if (!bytes) {
      problems.push({ artifact: entry.name, reason: "artifact missing from bundle" });
      continue;
    }
    if (bytes.byteLength !== entry.byteLength) {
      problems.push({ artifact: entry.name, reason: `byte length ${bytes.byteLength} != manifest ${entry.byteLength}` });
      continue;
    }
    if (sha256HexBytes(bytes) !== entry.sha256) {
      problems.push({ artifact: entry.name, reason: "artifact bytes do not match manifest hash" });
    }
  }
  for (const name of artifacts.keys()) {
    if (!manifest.artifacts.some((e) => e.name === name)) {
      problems.push({ artifact: name, reason: "artifact not listed in manifest" });
    }
  }
  return problems;
}

/**
 * Exact artifact resolution from a content-addressed store (sha256 ->
 * bytes). The manifest names the expected hash; anything else — missing
 * entry, wrong bytes — fails honestly. No fuzzy matching, no substitution.
 */
export function resolveArtifact(
  manifest: SkillPackageManifest,
  name: string,
  store: ReadonlyMap<string, Uint8Array>,
): Uint8Array {
  const entry = manifest.artifacts.find((e) => e.name === name);
  if (!entry) throw new Error(`artifact ${name} not listed in package ${manifest.skillId}@${manifest.version}`);
  const bytes = store.get(entry.sha256);
  if (!bytes) throw new Error(`artifact ${name} (sha256 ${entry.sha256.slice(0, 12)}…) absent from store`);
  if (sha256HexBytes(bytes) !== entry.sha256) {
    throw new Error(`artifact ${name} in store does not match manifest hash`);
  }
  return bytes;
}
