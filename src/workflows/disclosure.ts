import { parseSkillRef, type SkillRegistry } from "./skills";
import type { SkillPackageManifest } from "./packages";
import type { Skill } from "./types";

/**
 * REQ-progressive-disclosure: progressive skill disclosure levels L0–L3.
 *
 * Load the cheapest identifying fields first and expand on demand, so
 * callers (P19 scheduler, workflows, Genesis orchestration) never pay full
 * skill content for a listing decision. Levels nest: each level includes
 * everything below it.
 *
 * - L0 identity: skill_id, version, name.
 * - L1 capability: + capability, status (so DEPRECATED is visible before
 *   anyone pays for instructions), risk class.
 * - L2 instructions: + description, inputs, outputs, required
 *   capabilities/tools/permissions, provenance.
 * - L3 artifacts: + package artifact listing (names, hashes, sizes) from
 *   an explicit package manifest. Bytes stay behind `resolveArtifact`;
 *   disclosure never inlines them.
 *
 * Unknown levels, unparseable refs and missing skills fail honestly.
 * DEPRECATED status is surfaced at every level, never hidden.
 * Reference: Saraev agentic-workflows research (STUDY_ONLY).
 */

export type DisclosureLevel = 0 | 1 | 2 | 3;

export interface DisclosureL0 {
  level: 0;
  skillId: string;
  version: string;
  name: string;
  status: Skill["status"];
}

export interface DisclosureL1 extends Omit<DisclosureL0, "level"> {
  level: 1;
  capability: string;
  riskClass: Skill["risk_class"];
}

export interface DisclosureL2 extends Omit<DisclosureL1, "level"> {
  level: 2;
  description: string;
  inputs: string[];
  outputs: string[];
  requiredCapabilities: string[];
  requiredTools: string[];
  requiredPermissions: string[];
  provenance: string;
}

export interface DisclosureL3 extends Omit<DisclosureL2, "level"> {
  level: 3;
  packageFormat: string;
  packageManifestSha256: string;
  artifacts: { name: string; sha256: string; byteLength: number }[];
}

export type SkillDisclosure = DisclosureL0 | DisclosureL1 | DisclosureL2 | DisclosureL3;

export function discloseSkill(
  registry: SkillRegistry,
  ref: string,
  level: DisclosureLevel,
  packages: ReadonlyMap<string, SkillPackageManifest> = new Map(),
): SkillDisclosure {
  if (level !== 0 && level !== 1 && level !== 2 && level !== 3) {
    throw new Error(`unknown disclosure level ${String(level)} (expected 0-3)`);
  }
  const parsed = parseSkillRef(ref.trim()) ?? (/^[A-Za-z0-9_.-]+$/.test(ref.trim()) ? { skillId: ref.trim() } : null);
  if (!parsed) throw new Error(`not a skill reference: ${ref}`);
  const skill = registry.lookup(parsed.skillId, parsed.version);
  if (!skill) {
    throw new Error(
      parsed.version ? `missing skill ${parsed.skillId}@${parsed.version}` : `missing skill ${parsed.skillId}`,
    );
  }
  const l0: DisclosureL0 = {
    level: 0,
    skillId: skill.skill_id,
    version: skill.version,
    name: skill.name,
    status: skill.status,
  };
  if (level === 0) return l0;
  const l1: DisclosureL1 = { ...l0, level: 1, capability: skill.capability, riskClass: skill.risk_class };
  if (level === 1) return l1;
  const l2: DisclosureL2 = {
    ...l1,
    level: 2,
    description: skill.description,
    inputs: [...skill.inputs],
    outputs: [...skill.outputs],
    requiredCapabilities: [...skill.required_capabilities].sort(),
    requiredTools: [...skill.required_tools].sort(),
    requiredPermissions: [...skill.required_permissions].sort(),
    provenance: skill.provenance,
  };
  if (level === 2) return l2;
  const key = `${skill.skill_id}@${skill.version}`;
  const manifest = packages.get(key);
  if (!manifest) {
    throw new Error(`no package manifest for ${key}: L3 requires an explicit package`);
  }
  if (manifest.skillId !== skill.skill_id || manifest.version !== skill.version) {
    throw new Error(`package manifest mismatch for ${key}`);
  }
  const l3: DisclosureL3 = {
    ...l2,
    level: 3,
    packageFormat: manifest.format,
    packageManifestSha256: manifest.manifestSha256,
    artifacts: manifest.artifacts.map((a) => ({ name: a.name, sha256: a.sha256, byteLength: a.byteLength })),
  };
  return l3;
}
