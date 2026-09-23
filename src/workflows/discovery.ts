import type { SkillRegistry } from "./skills";
import type { RiskClass, Skill, SkillStatus } from "./types";

/**
 * REQ-p19-skill-discovery: first-party discovery over the skill registry.
 *
 * Token-scored keyword retrieval with moderation-aware ranking. The scoring
 * is deterministic and evidence-bearing: every hit reports what matched and
 * why it ranks where it does. Registry mechanics stay first-party — this
 * reads SkillRegistry only.
 *
 * Honest scope: keyword/token retrieval now. Dense-embedding retrieval is
 * explicitly deferred (no local embedding runtime on this workstation; P18
 * live-model work is owner-gated) and is recorded as future work, not
 * claimed here.
 */

export interface DiscoveryOptions {
  /** Max hits returned. Default 10. */
  limit?: number;
  /** Include DEPRECATED skills, ranked last and flagged. Default false. */
  includeDeprecated?: boolean;
  /** Search every registered version, not just latest per skill. Default false. */
  includeAllVersions?: boolean;
}

export interface SkillHit {
  skill: Skill;
  score: number;
  matchedOn: string[];
  /** Moderation notes affecting rank, e.g. deprecated, risk class. */
  moderation: string[];
  deprecated: boolean;
}

const STATUS_ORDER: Record<SkillStatus, number> = {
  VERIFIED: 0,
  REGISTERED: 1,
  DEPRECATED: 2,
};

const RISK_PENALTY: Record<RiskClass, number> = {
  low: 0,
  medium: 1,
  high: 3,
  critical: 6,
};

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

function fieldTokens(skill: Skill): { name: string[]; capability: string[]; description: string[]; id: string[] } {
  return {
    name: tokens(skill.name),
    capability: tokens(skill.capability),
    description: tokens(skill.description),
    id: tokens(skill.skill_id),
  };
}

/**
 * Deterministic discovery: token overlap scored by field weight, then
 * moderation-adjusted (status order, risk penalty), then skill_id
 * tie-break. Empty queries return nothing rather than the whole registry.
 */
export function discoverSkills(
  registry: SkillRegistry,
  query: string,
  options: DiscoveryOptions = {},
): SkillHit[] {
  const limit = options.limit ?? 10;
  if (!Number.isInteger(limit) || limit < 1) return [];
  const q = tokens(query);
  if (q.length === 0) return [];

  const candidates = options.includeAllVersions
    ? registry.list()
    : latestPerSkill(registry);
  const hits: SkillHit[] = [];

  for (const skill of candidates) {
    if (skill.status === "DEPRECATED" && !options.includeDeprecated) continue;
    const fields = fieldTokens(skill);
    const matchedOn: string[] = [];
    let score = 0;
    for (const token of q) {
      if (fields.name.includes(token)) {
        score += 3;
        matchedOn.push(`name:${token}`);
      }
      if (fields.id.includes(token)) {
        score += 2;
        matchedOn.push(`id:${token}`);
      }
      if (fields.capability.includes(token)) {
        score += 2;
        matchedOn.push(`capability:${token}`);
      }
      if (fields.description.includes(token)) {
        score += 1;
        matchedOn.push(`description:${token}`);
      }
    }
    if (score === 0) continue;
    const moderation: string[] = [];
    if (skill.status === "DEPRECATED") moderation.push("deprecated: ranked last");
    if (skill.risk_class !== "low") moderation.push(`risk:${skill.risk_class}`);
    if (skill.status === "REGISTERED") moderation.push("unverified: ranks below VERIFIED");
    score -= RISK_PENALTY[skill.risk_class];
    hits.push({ skill, score, matchedOn: [...new Set(matchedOn)], moderation, deprecated: skill.status === "DEPRECATED" });
  }

  hits.sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.skill.status] - STATUS_ORDER[b.skill.status];
    if (statusDiff !== 0) return statusDiff;
    if (b.score !== a.score) return b.score - a.score;
    if (a.skill.skill_id !== b.skill.skill_id) return a.skill.skill_id < b.skill.skill_id ? -1 : 1;
    return a.skill.version < b.skill.version ? -1 : 1;
  });
  return hits.slice(0, limit);
}

function latestPerSkill(registry: SkillRegistry): Skill[] {
  const latest = new Map<string, Skill>();
  for (const skill of registry.list()) {
    const current = latest.get(skill.skill_id);
    if (!current || compareVersions(skill.version, current.version) > 0) {
      latest.set(skill.skill_id, skill);
    }
  }
  return [...latest.values()];
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}
