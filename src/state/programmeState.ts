import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateProgramme } from "../programme/validate";
import { selectNextTask } from "../programme/select";
import type { ProgrammeBundle, Requirement, SelectionResult, ValidationIssue } from "../programme/types";

function asPath(root: string | URL): string {
  return typeof root === "string" ? root : fileURLToPath(root);
}

/**
 * P16 registries through the P17 state layer (read path).
 *
 * The canonical JSON files stay human-inspectable and Git-diffable.
 * This loader adds: parse checks, hash integrity is enforced by the
 * registry validator itself, and programme invariants stay authoritative.
 */
export interface ProgrammeState {
  bundle: ProgrammeBundle;
}

export function loadProgrammeState(registryRoot: string | URL): ProgrammeState {
  const base = asPath(registryRoot).replace(/\\/g, "/").replace(/\/$/, "");
  const read = (name: string): unknown => {
    const full = `${base}/${name}`;
    let text: string;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      throw new Error(`programme registry file missing: ${name}`);
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error(`programme registry file malformed: ${name}`);
    }
  };
  const programme = read("programme.json") as ProgrammeBundle["programme"];
  const depgraph = read("depgraph.json") as ProgrammeBundle["depgraph"];
  const bundle: ProgrammeBundle = { programme, depgraph, requirements: [] };
  const issues: ValidationIssue[] = validateProgramme(bundle);
  if (issues.length > 0) {
    throw new Error(`programme registry invalid: ${issues[0].code}: ${issues[0].message}`);
  }
  return { bundle };
}

export function selectFromState(state: ProgrammeState): SelectionResult {
  return selectNextTask(state.bundle);
}

/** Load the real seed requirement registry through the same checked path. */
export function loadSeedRequirements(requirementsFile: string | URL): Requirement[] {
  const path = asPath(requirementsFile);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch {
    throw new Error(`requirement registry malformed: ${path}`);
  }
  const list = (parsed as { requirements?: Requirement[] }).requirements;
  if (!Array.isArray(list)) {
    throw new Error(`requirement registry missing requirements array: ${requirementsFile}`);
  }
  return list;
}
