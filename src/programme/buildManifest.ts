import { parse as parseYaml } from "yaml";

/**
 * Build Manifest Registry: how every project in the workspace is built,
 * tested and verified — and what is still broken.
 *
 * This exists because the workspace had no machine-readable answer to
 * "how do I build this project?" and no single list of what is still
 * unfinished. The answers were scattered across per-project READMEs, several
 * competing BUILD-TODO documents, an Aetherius-OS programme registry that
 * tracked requirements but not builds, and a set of stale build directories
 * that failed with a path error before compiling anything.
 *
 * Design, following the established `capabilityRegistry.ts` pattern in this
 * same directory:
 *
 *  - YAML is the source of truth. Each project owns a `build.yaml` at its
 *    root; `docs/BUILD-MANIFEST-REGISTRY.yaml` is the index that says which
 *    project owns which manifest and how the projects depend on each other.
 *  - The generated Markdown report is derived output and must never be
 *    hand-edited to change meaning. A sync test enforces byte-equality.
 *  - Read-only audit. This module never writes a manifest, never fixes an
 *    issue, and never promotes a status. It reports what is true.
 *
 * Boundaries held deliberately:
 *  - NO AUTHORITY. A `status.state` is the recorded build state, not a
 *    judgement about whether the underlying work is good.
 *  - A missing manifest is a REPORTED FINDING, not a crash. A clean clone of
 *    Aetherius-OS alone has no sibling projects, and the registry must still
 *    load and say so honestly rather than failing for the wrong reason.
 *  - Commands are recorded verbatim. This module does not execute them.
 */

export const BUILD_MANIFEST_SCHEMA_VERSION = "1.0.0";

/**
 * Build state of a project.
 *
 * VERIFIED     - the recorded verify command completed successfully.
 * PARTIAL      - it builds, but some commands or tests fail.
 * BROKEN       - it does not build at all in the recorded configuration.
 * NOT_STARTED  - no buildable content yet.
 * RESEARCH     - study material, not a build target.
 */
export const BUILD_STATES = [
  "VERIFIED",
  "PARTIAL",
  "BROKEN",
  "NOT_STARTED",
  "RESEARCH",
] as const;

export type BuildState = (typeof BUILD_STATES)[number];

export const PROJECT_KINDS = [
  "application",
  "library",
  "tool",
  "service",
  "dataset",
  "research",
  "configuration",
  "monorepo",
] as const;

export type ProjectKind = (typeof PROJECT_KINDS)[number];

export const ISSUE_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];

export const ISSUE_STATUSES = ["OPEN", "FIXED", "ACCEPTED", "WONT_FIX"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

/** Standard command names. Other names are allowed; these are the expected set. */
export const STANDARD_COMMANDS = [
  "install",
  "build",
  "test",
  "verify",
  "lint",
  "clean",
  "dev",
] as const;

export interface ToolRequirement {
  /** Tool name, e.g. "node", "cmake", "python". */
  name: string;
  /** Version constraint as written, e.g. ">=18", "3.24". Not enforced here. */
  version?: string;
  /**
   * False means the project degrades gracefully without it. Absent means
   * true: a tool that is listed is a tool the project expects.
   */
  required?: boolean;
  /** What the tool is needed for. */
  purpose?: string;
}

export interface BuildCommand {
  /** Command name. Standard names are install/build/test/verify/lint/clean/dev. */
  name: string;
  /** The command exactly as it should be run, in the project's shell. */
  command: string;
  /** Working directory relative to the project root. Defaults to the root. */
  working_directory?: string;
  /** Wall-clock budget in minutes. Advisory; recorded so a hang is visible. */
  timeout_minutes?: number;
  /** Other command names that should pass before this one. */
  requires?: string[];
}

export interface KnownIssue {
  /** Stable id, unique within the manifest. */
  id: string;
  severity: IssueSeverity;
  /** One-line statement of the problem. */
  summary: string;
  /** Where the problem was observed: a command, a file, a log. */
  evidence: string;
  status: IssueStatus;
  /** Id of the matching entry in docs/PROJECT-TODOS.yaml, when there is one. */
  todo_ref?: string;
}

export interface BuildManifest {
  schema_version: string;
  project: {
    id: string;
    name: string;
    kind: ProjectKind;
    /** Capability domain, matching the Aetherius-OS capability registry. */
    domain: string;
    description: string;
    repository: boolean;
    branch?: string;
    languages: string[];
  };
  toolchain: {
    /** e.g. "npm/vite", "cmake/ninja", "python/pytest". */
    build_system: string;
    package_manager?: string;
    requirements: ToolRequirement[];
  };
  commands: BuildCommand[];
  dependencies: {
    /** Sibling project ids this project depends on. */
    projects: string[];
    /** External packages/registries this project depends on. */
    external: string[];
  };
  status: {
    state: BuildState;
    /** ISO date of the last recorded verification. */
    last_verified: string;
    /** Plain statement of what was observed. */
    summary: string;
    /** Commands that were actually run, and what they did. */
    evidence: string[];
  };
  known_issues: KnownIssue[];
  notes?: string[];
}

export interface BuildRegistryEntry {
  /** Project id. Must match the manifest's project.id. */
  id: string;
  name: string;
  /** Path to the owning project's build.yaml, relative to the Projects root. */
  manifest: string;
  /** One-line role description. */
  role: string;
  status: BuildState;
  /** Sibling project ids this project depends on. */
  depends_on: string[];
  notes?: string;
}

export interface BuildRegistry {
  schema_version: string;
  source_date: string;
  /** Folder that holds the project directories, relative to this repository. */
  projects_root: string;
  projects: BuildRegistryEntry[];
}

// -- parsing ---------------------------------------------------------------

export type ManifestProblem =
  | "schema-version"
  | "project-id"
  | "project-name"
  | "project-kind"
  | "project-domain"
  | "project-description"
  | "project-languages"
  | "toolchain-build-system"
  | "toolchain-requirement"
  | "command-name"
  | "command-command"
  | "command-requires-unknown"
  | "dependency-projects"
  | "status-state"
  | "status-last-verified"
  | "status-summary"
  | "status-evidence"
  | "issue-id"
  | "issue-duplicate-id"
  | "issue-severity"
  | "issue-summary"
  | "issue-evidence"
  | "issue-status";

export type RegistryProblem =
  | "registry-schema-version"
  | "registry-projects-root"
  | "registry-project-id"
  | "registry-project-name"
  | "registry-manifest"
  | "registry-role"
  | "registry-status"
  | "registry-duplicate-id"
  | "registry-unknown-dependency"
  | "registry-dependency-cycle"
  | "registry-manifest-missing"
  | "registry-manifest-unreadable"
  | "registry-manifest-id-mismatch"
  | "registry-manifest-invalid";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value: unknown): boolean {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Parse a build manifest from YAML text.
 * Throws on malformed YAML: that is a genuine authoring error, not a
 * finding to be reported. Structural problems are returned by
 * `validateBuildManifest` instead.
 */
export function loadBuildManifest(yamlText: string): BuildManifest {
  return parseYaml(yamlText) as BuildManifest;
}

/** Parse the registry index from YAML text. */
export function loadBuildRegistry(yamlText: string): BuildRegistry {
  return parseYaml(yamlText) as BuildRegistry;
}

/**
 * Validate one manifest. Returns the problems found; an empty array means
 * the manifest is well-formed. Never mutates the input.
 */
export function validateBuildManifest(manifest: BuildManifest): ManifestProblem[] {
  const problems: ManifestProblem[] = [];
  if (!manifest || typeof manifest !== "object") return ["schema-version"];

  if (manifest.schema_version !== BUILD_MANIFEST_SCHEMA_VERSION) {
    problems.push("schema-version");
  }

  const p = manifest.project;
  if (!p || !nonEmpty(p.id)) problems.push("project-id");
  if (!p || !nonEmpty(p.name)) problems.push("project-name");
  if (!p || !PROJECT_KINDS.includes(p.kind)) problems.push("project-kind");
  if (!p || !nonEmpty(p.domain)) problems.push("project-domain");
  if (!p || !nonEmpty(p.description)) problems.push("project-description");
  // A placeholder project genuinely has no languages yet. Every project
  // that claims a build state other than NOT_STARTED has to name the
  // languages it is written in.
  if (!p || !Array.isArray(p.languages)) {
    problems.push("project-languages");
  } else if (
    p.languages.length === 0 &&
    (manifest.status?.state ?? "NOT_STARTED") !== "NOT_STARTED"
  ) {
    problems.push("project-languages");
  }

  const t = manifest.toolchain;
  if (!t || !nonEmpty(t.build_system)) problems.push("toolchain-build-system");
  if (t && Array.isArray(t.requirements)) {
    for (const r of t.requirements) {
      if (!r || !nonEmpty(r.name)) {
        problems.push("toolchain-requirement");
        break;
      }
    }
  } else if (t) {
    problems.push("toolchain-requirement");
  }

  const commandNames = new Set<string>();
  if (!Array.isArray(manifest.commands)) {
    problems.push("command-command");
  } else {
    for (const c of manifest.commands) {
      if (!c || !nonEmpty(c.name)) {
        problems.push("command-name");
        continue;
      }
      if (!nonEmpty(c.command)) problems.push("command-command");
      commandNames.add(c.name);
    }
    // A project that is not merely "not started" has to say how it is
    // built. An empty command list is honest for a placeholder project and
    // a gap everywhere else.
    if (manifest.commands.length === 0 && (manifest.status?.state ?? "NOT_STARTED") !== "NOT_STARTED") {
      problems.push("command-command");
    }
  }
  for (const c of manifest.commands ?? []) {
    for (const r of c?.requires ?? []) {
      if (!commandNames.has(r)) {
        problems.push("command-requires-unknown");
        break;
      }
    }
  }

  if (!manifest.dependencies || !Array.isArray(manifest.dependencies.projects)) {
    problems.push("dependency-projects");
  }

  const s = manifest.status;
  if (!s || !BUILD_STATES.includes(s.state)) problems.push("status-state");
  if (!s || !isIsoDate(s.last_verified)) problems.push("status-last-verified");
  if (!s || !nonEmpty(s.summary)) problems.push("status-summary");
  if (!s || !Array.isArray(s.evidence) || s.evidence.length === 0) {
    problems.push("status-evidence");
  }

  const seen = new Set<string>();
  for (const issue of manifest.known_issues ?? []) {
    if (!issue || !nonEmpty(issue.id)) {
      problems.push("issue-id");
      continue;
    }
    if (seen.has(issue.id)) problems.push("issue-duplicate-id");
    seen.add(issue.id);
    if (!ISSUE_SEVERITIES.includes(issue.severity)) problems.push("issue-severity");
    if (!nonEmpty(issue.summary)) problems.push("issue-summary");
    if (!nonEmpty(issue.evidence)) problems.push("issue-evidence");
    if (!ISSUE_STATUSES.includes(issue.status)) problems.push("issue-status");
  }

  return [...new Set(problems)].sort() as ManifestProblem[];
}

/** Resolves whether a manifest file exists. Injected so this stays testable. */
export type ManifestReader = (manifestPath: string) => string | null;

export interface RegistryValidationOptions {
  /** Reads a manifest by its registry-relative path, or null if absent. */
  readManifest: ManifestReader;
  /**
   * Decides whether the project folder exists on disk. When a folder is
   * absent, its manifest cannot be checked and the entry is reported as
   * unavailable rather than broken.
   */
  projectExists?: (projectId: string) => boolean;
}

export interface RegistryValidationIssue {
  code: RegistryProblem;
  id: string;
  detail: string;
}

/**
 * Validate the registry index and, where the owning project is present on
 * disk, the manifest it points at.
 *
 * A project folder that is absent is reported as `registry-manifest-missing`
 * with the detail saying the project is not present — a clean clone must not
 * accuse every sibling project of a broken manifest.
 */
export function validateBuildRegistry(
  registry: BuildRegistry,
  options: RegistryValidationOptions,
): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  if (!registry || typeof registry !== "object") {
    return [{ code: "registry-schema-version", id: "(registry)", detail: "registry is not an object" }];
  }
  if (registry.schema_version !== BUILD_MANIFEST_SCHEMA_VERSION) {
    issues.push({
      code: "registry-schema-version",
      id: "(registry)",
      detail: `expected ${BUILD_MANIFEST_SCHEMA_VERSION}, found ${String(registry.schema_version)}`,
    });
  }
  if (!nonEmpty(registry.projects_root)) {
    issues.push({ code: "registry-projects-root", id: "(registry)", detail: "projects_root is empty" });
  }
  if (!Array.isArray(registry.projects) || registry.projects.length === 0) {
    issues.push({ code: "registry-project-id", id: "(registry)", detail: "no projects listed" });
    return issues;
  }

  const projectExists = options.projectExists ?? (() => true);
  const seen = new Map<string, number>();
  for (const p of registry.projects) {
    seen.set(p.id, (seen.get(p.id) ?? 0) + 1);
  }
  for (const [id, count] of seen) {
    if (count > 1) {
      issues.push({ code: "registry-duplicate-id", id, detail: `appears ${count}x` });
    }
  }

  const ids = new Set(registry.projects.map((p) => p.id));
  for (const p of registry.projects) {
    if (!nonEmpty(p.id)) {
      issues.push({ code: "registry-project-id", id: "(unnamed)", detail: "project id is empty" });
      continue;
    }
    if (!nonEmpty(p.name)) {
      issues.push({ code: "registry-project-name", id: p.id, detail: "name is empty" });
    }
    if (!nonEmpty(p.manifest)) {
      issues.push({ code: "registry-manifest", id: p.id, detail: "manifest path is empty" });
    }
    if (!nonEmpty(p.role)) {
      issues.push({ code: "registry-role", id: p.id, detail: "role is empty" });
    }
    if (!BUILD_STATES.includes(p.status)) {
      issues.push({
        code: "registry-status",
        id: p.id,
        detail: `unknown status ${String(p.status)}`,
      });
    }
    for (const d of p.depends_on ?? []) {
      if (!ids.has(d)) {
        issues.push({
          code: "registry-unknown-dependency",
          id: p.id,
          detail: `depends_on ${d} is not registered`,
        });
      }
      if (d === p.id) {
        issues.push({ code: "registry-dependency-cycle", id: p.id, detail: "depends on itself" });
      }
    }
  }

  // Cycle detection over depends_on.
  const byId = new Map(registry.projects.map((p) => [p.id, p]));
  const state = new Map<string, number>();
  const visit = (id: string, trail: string[]): string[] | null => {
    const st = state.get(id) ?? 0;
    if (st === 1) return [...trail, id];
    if (st === 2) return null;
    state.set(id, 1);
    for (const d of byId.get(id)?.depends_on ?? []) {
      if (!byId.has(d)) continue;
      const found = visit(d, [...trail, id]);
      if (found) return found;
    }
    state.set(id, 2);
    return null;
  };
  for (const p of registry.projects) {
    const cycle = visit(p.id, []);
    if (cycle) {
      issues.push({
        code: "registry-dependency-cycle",
        id: p.id,
        detail: `cycle: ${cycle.join(" -> ")}`,
      });
      break;
    }
  }

  // Manifest checks, only where the owning project is actually present.
  for (const p of registry.projects) {
    if (!nonEmpty(p.manifest)) continue;
    if (!projectExists(p.id)) {
      issues.push({
        code: "registry-manifest-missing",
        id: p.id,
        detail: `project folder for ${p.id} is not present; manifest ${p.manifest} not checked`,
      });
      continue;
    }
    const text = options.readManifest(p.manifest);
    if (text === null) {
      issues.push({
        code: "registry-manifest-missing",
        id: p.id,
        detail: `manifest not found at ${p.manifest}`,
      });
      continue;
    }
    let manifest: BuildManifest;
    try {
      manifest = loadBuildManifest(text);
    } catch (err) {
      issues.push({
        code: "registry-manifest-unreadable",
        id: p.id,
        detail: `manifest at ${p.manifest} is not valid YAML: ${(err as Error).message}`,
      });
      continue;
    }
    const problems = validateBuildManifest(manifest);
    if (problems.length > 0) {
      issues.push({
        code: "registry-manifest-invalid",
        id: p.id,
        detail: `${p.manifest}: ${problems.join(", ")}`,
      });
    }
    if (manifest?.project?.id !== p.id) {
      issues.push({
        code: "registry-manifest-id-mismatch",
        id: p.id,
        detail: `manifest declares project.id ${String(manifest?.project?.id)}`,
      });
    }
  }

  return issues;
}

// -- queries ---------------------------------------------------------------

/** Look up one registry entry. */
export function entryFor(registry: BuildRegistry, id: string): BuildRegistryEntry | null {
  return registry.projects.find((p) => p.id === id) ?? null;
}

/** Projects that depend on the given project, directly. */
export function dependentsOf(registry: BuildRegistry, id: string): string[] {
  return registry.projects
    .filter((p) => (p.depends_on ?? []).includes(id))
    .map((p) => p.id)
    .sort();
}

/** Direct dependencies of a project. */
export function dependenciesOf(registry: BuildRegistry, id: string): string[] {
  return [...new Set(entryFor(registry, id)?.depends_on ?? [])].sort();
}

/** Roll-up of the workspace build state. */
export interface BuildStateSummary {
  total: number;
  byState: Record<BuildState, number>;
  broken: string[];
  partial: string[];
  verified: string[];
}

export function summariseBuildStates(registry: BuildRegistry): BuildStateSummary {
  const byState: Record<BuildState, number> = {
    VERIFIED: 0,
    PARTIAL: 0,
    BROKEN: 0,
    NOT_STARTED: 0,
    RESEARCH: 0,
  };
  for (const p of registry.projects) {
    if (p.status in byState) byState[p.status] += 1;
  }
  return {
    total: registry.projects.length,
    byState,
    broken: registry.projects.filter((p) => p.status === "BROKEN").map((p) => p.id).sort(),
    partial: registry.projects.filter((p) => p.status === "PARTIAL").map((p) => p.id).sort(),
    verified: registry.projects.filter((p) => p.status === "VERIFIED").map((p) => p.id).sort(),
  };
}

/**
 * Topological order over depends_on. Projects with unmet dependencies come
 * first. A cycle is not fatal: the remaining projects are appended in id
 * order so the report is still complete, and the cycle is reported by
 * `validateBuildRegistry`.
 */
export function buildOrder(registry: BuildRegistry): string[] {
  const byId = new Map(registry.projects.map((p) => [p.id, p]));
  const out: string[] = [];
  const placed = new Set<string>();
  const visiting = new Set<string>();
  const place = (id: string): void => {
    if (placed.has(id) || visiting.has(id)) return;
    visiting.add(id);
    for (const d of byId.get(id)?.depends_on ?? []) {
      if (byId.has(d)) place(d);
    }
    visiting.delete(id);
    if (!placed.has(id)) {
      placed.add(id);
      out.push(id);
    }
  };
  for (const p of [...registry.projects].sort((a, b) => a.id.localeCompare(b.id))) {
    place(p.id);
  }
  return out;
}
