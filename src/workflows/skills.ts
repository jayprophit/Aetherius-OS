import type { Skill } from "./types";

function versionParts(version: string): number[] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function validateSkill(def: Skill): string | null {
  if (!def.skill_id.trim()) return "skill_id is required";
  if (!versionParts(def.version)) return `invalid version ${def.version} (x.y.z required)`;
  if (!def.name.trim()) return "name is required";
  if (!def.capability.trim()) return "capability is required";
  if (!def.implementation_ref.trim()) return "implementation_ref is required";
  if (!def.provenance.trim()) return "provenance is required";
  if (!["REGISTERED", "VERIFIED", "DEPRECATED"].includes(def.status)) {
    return `invalid status ${def.status}`;
  }
  if (!["low", "medium", "high", "critical"].includes(def.risk_class)) {
    return `invalid risk_class ${def.risk_class}`;
  }
  return null;
}

/**
 * First-party skill registry. Registration validates and versions;
 * it NEVER grants capabilities — required_permissions are retained
 * metadata for later Agent Bridge authorization.
 */
export class SkillRegistry {
  private readonly skills = new Map<string, Map<string, Skill>>();

  register(def: Skill): Skill {
    const problem = validateSkill(def);
    if (problem) throw new Error(`invalid skill: ${problem}`);
    let versions = this.skills.get(def.skill_id);
    if (!versions) {
      versions = new Map();
      this.skills.set(def.skill_id, versions);
    }
    if (versions.has(def.version)) {
      throw new Error(`duplicate skill version: ${def.skill_id}@${def.version}`);
    }
    const stored: Skill = JSON.parse(JSON.stringify(def)) as Skill;
    versions.set(def.version, stored);
    return stored;
  }

  lookup(skillId: string, version?: string): Skill | null {
    const versions = this.skills.get(skillId);
    if (!versions || versions.size === 0) return null;
    if (version) return versions.get(version) ?? null;
    // Latest = highest x.y.z, deterministic.
    const sorted = [...versions.keys()].sort((a, b) => {
      const pa = versionParts(a) ?? [0, 0, 0];
      const pb = versionParts(b) ?? [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        if (pa[i] !== pb[i]) return pb[i] - pa[i];
      }
      return a < b ? -1 : 1;
    });
    return versions.get(sorted[0]) ?? null;
  }

  list(): Skill[] {
    const out: Skill[] = [];
    for (const id of [...this.skills.keys()].sort()) {
      for (const version of [...(this.skills.get(id)?.keys() ?? [])].sort()) {
        const skill = this.skills.get(id)?.get(version);
        if (skill) out.push(skill);
      }
    }
    return out;
  }

  /** Compatibility: platform supported and execution kind known. */
  compatible(skill: Skill, platform: string, knownKinds: string[]): string | null {
    if (!skill.supported_platforms.includes(platform) && !skill.supported_platforms.includes("*")) {
      return `platform ${platform} not in ${skill.supported_platforms.join(",")}`;
    }
    if (!knownKinds.includes(skill.execution_kind)) {
      return `unknown execution kind ${skill.execution_kind}`;
    }
    return null;
  }
}

export function parseSkillRef(ref: string): { skillId: string; version?: string } | null {
  const match = /^skill:([A-Za-z0-9_.-]+)(?:@(\d+\.\d+\.\d+))?$/.exec(ref.trim());
  if (!match) return null;
  return { skillId: match[1], version: match[2] };
}
