import { parseSkillRef, type SkillRegistry } from "../workflows/skills";
import type { SkillPackageManifest } from "../workflows/packages";

/**
 * REQ-p20-expected-touch-set: pre-execution expected touch-set estimation.
 *
 * Estimates the files/resources a worker will likely modify BEFORE
 * execution — from declared lists (e.g. Bridge `writes_files`), skill
 * package manifests, workflow literal file bindings, and task-type
 * history. Feeds collision prediction and placement.
 *
 * Honesty rules: estimation is UNION of evidenced sources with
 * per-path provenance, never magic inference. Dynamic content
 * ($-bindings, unresolvable refs, missing history) is reported under
 * `unknown`, never guessed. Unsafe paths are excluded and reported
 * under `invalid`, never estimated. Deterministic: sorted, deduped.
 *
 * Reference: spine-branch/worker research (STUDY_ONLY).
 */

export interface TouchEstimateInput {
  /** Explicitly declared files (e.g. Bridge writes_files). */
  declaredFiles?: readonly string[];
  skills?: SkillRegistry;
  /** Skill refs to expand via registry + package manifests. */
  skillRefs?: readonly string[];
  packages?: ReadonlyMap<string, SkillPackageManifest>;
  /** Literal file bindings from a workflow definition. */
  workflowFiles?: readonly string[];
  taskType?: string;
  /** Past actual touch sets by task type. */
  history?: ReadonlyMap<string, readonly string[]>;
}

export interface TouchSource {
  path: string;
  source: string;
}

export interface TouchEstimate {
  paths: string[];
  sources: TouchSource[];
  /** What could not be estimated, with reasons (never guessed). */
  unknown: string[];
  /** Excluded unsafe paths, with reasons. */
  invalid: string[];
}

function isSafePath(path: string): boolean {
  if (!path || !path.trim()) return false;
  const p = path.trim();
  if (p.startsWith("/") || p.startsWith("\\")) return false;
  if (p.split(/[\\/]/).includes("..")) return false;
  return true;
}

export function estimateTouchSet(input: TouchEstimateInput): TouchEstimate {
  const seen = new Map<string, string>();
  const unknown: string[] = [];
  const invalid: string[] = [];

  const add = (rawPath: string, source: string): void => {
    const path = rawPath.trim();
    if (!isSafePath(path)) {
      invalid.push(`${path || "(empty)"} from ${source}: unsafe or empty path`);
      return;
    }
    if (!seen.has(path)) seen.set(path, source);
  };

  for (const file of input.declaredFiles ?? []) {
    add(file, "declared");
  }
  for (const file of input.workflowFiles ?? []) {
    add(file, "workflow");
  }

  if (input.skillRefs && input.skillRefs.length > 0) {
    if (!input.skills) {
      unknown.push(`${input.skillRefs.length} skill ref(s): no registry provided`);
    } else {
      for (const ref of input.skillRefs) {
        const parsed = parseSkillRef(ref.trim()) ?? (/^[A-Za-z0-9_.-]+$/.test(ref.trim()) ? { skillId: ref.trim() } : null);
        if (!parsed) {
          unknown.push(`unparseable skill ref ${ref}`);
          continue;
        }
        const skill = input.skills.lookup(parsed.skillId, parsed.version);
        if (!skill) {
          unknown.push(`unresolvable skill ${ref}`);
          continue;
        }
        const key = `${skill.skill_id}@${skill.version}`;
        const manifest = input.packages?.get(key);
        if (!manifest) {
          unknown.push(`no package manifest for ${key}: artifacts unknown`);
          continue;
        }
        for (const artifact of manifest.artifacts) {
          add(artifact.name, `package:${key}`);
        }
      }
    }
  }

  if (input.taskType !== undefined) {
    const past = input.history?.get(input.taskType);
    if (!past) {
      unknown.push(`no history for task type ${input.taskType}`);
    } else {
      for (const path of past) {
        add(path, `history:${input.taskType}`);
      }
    }
  }

  const paths = [...seen.keys()].sort();
  return {
    paths,
    sources: paths.map((path) => ({ path, source: seen.get(path)! })),
    unknown: [...unknown].sort(),
    invalid: [...invalid].sort(),
  };
}
