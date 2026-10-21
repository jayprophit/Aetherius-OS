import { parse as parseYaml } from "yaml";

/**
 * Owner source registry: the complete, checkable inventory of the
 * hand-authored material behind the programme.
 *
 * The owner's instruction was to record everything: old data, prompts,
 * requests, current data and new data, so that nothing is lost and
 * everything is traceable. A hand-maintained list cannot do that
 * honestly, because it drifts. So the list is generated from the disk,
 * and this module plus its test check that the generated list still
 * matches reality.
 *
 * Two properties matter:
 *
 *  1. COVERAGE. Every document inside the declared scope appears in the
 *     registry. A document that appeared since the registry was generated
 *     is a finding, not a silent omission.
 *  2. INTEGRITY. Every registered document still exists, and its content
 *     digest still matches. A document that changed underneath the
 *     registry is a finding, because the registry's description of it is
 *     now stale.
 *
 * Read-only. This module never edits a source document and never edits
 * the registry.
 */

export const SOURCE_KINDS = [
  "handoff",
  "build_record",
  "master_prompt",
  "requirements",
  "process",
  "document",
  "prompt_or_brief",
] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

export interface SourceScope {
  name: string;
  /** Absolute path of the scope root on this machine. */
  root: string;
  /** How many documents the registry holds for this scope. */
  documents: number;
}

export interface SourceEntry {
  /** Path relative to the user's home directory, with forward slashes. */
  path: string;
  scope: string;
  kind: SourceKind;
  title: string;
  bytes: number;
  lines: number;
  /** ISO date the file was last modified. */
  modified: string;
  /** "sha256:<hex>" - the content digest at the time of registration. */
  digest: string;
}

export interface SourceRegistryDoc {
  schema_version?: string;
  source_date?: string;
  scopes?: SourceScope[];
  totals?: Record<string, number>;
  sources?: SourceEntry[];
}

export interface SourceRegistry {
  schema_version: string;
  source_date: string;
  scopes: SourceScope[];
  totals: Record<string, number>;
  sources: SourceEntry[];
}

export type SourceProblem =
  | "source-path"
  | "source-scope"
  | "source-kind"
  | "source-title"
  | "source-bytes"
  | "source-lines"
  | "source-modified"
  | "source-digest";

export type SourceRegistryProblem =
  | "registry-schema-version"
  | "registry-source-date"
  | "registry-scopes"
  | "registry-sources"
  | "registry-duplicate-path"
  | "registry-unknown-scope"
  | "registry-missing-document"
  | "registry-unregistered-document"
  | "registry-digest-mismatch"
  | "registry-count-mismatch";

export function loadSourceRegistry(yamlText: string): SourceRegistry {
  const doc = parseYaml(yamlText) as SourceRegistryDoc;
  return {
    schema_version: doc.schema_version ?? "",
    source_date: doc.source_date ?? "",
    scopes: doc.scopes ?? [],
    totals: doc.totals ?? {},
    sources: doc.sources ?? [],
  };
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Validate one source entry. Never mutates the input. */
export function validateSourceEntry(entry: SourceEntry): SourceProblem[] {
  const problems: SourceProblem[] = [];
  if (!nonEmpty(entry.path)) problems.push("source-path");
  if (!nonEmpty(entry.scope)) problems.push("source-scope");
  if (!SOURCE_KINDS.includes(entry.kind)) problems.push("source-kind");
  if (!nonEmpty(entry.title)) problems.push("source-title");
  if (typeof entry.bytes !== "number" || entry.bytes < 0) problems.push("source-bytes");
  if (typeof entry.lines !== "number" || entry.lines < 0) problems.push("source-lines");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.modified)) problems.push("source-modified");
  if (!/^sha256:[0-9a-f]{64}$/.test(entry.digest)) problems.push("source-digest");
  return [...new Set(problems)].sort() as SourceProblem[];
}

/**
 * A document as it exists on disk right now, for comparison against the
 * registry. The caller supplies the digest so this module stays pure.
 */
export interface ObservedDocument {
  /** Path relative to the user's home directory. */
  path: string;
  exists: boolean;
  /** "sha256:<hex>", or null when the file could not be read. */
  digest: string | null;
  scope: string;
}

export interface SourceRegistryValidationOptions {
  /**
   * The documents currently on disk, in the declared scope.
   *
   * It is optional because the scope is the OWNER'S local material:
   * their Documents, their Downloads, their own project folders. A
   * machine that does not have that material cannot observe it, and an
   * empty observation set would say every registered document has been
   * deleted, which is false. So when the observations are unknown, the
   * checks that need them are skipped and the rest still run.
   */
  observed?: readonly ObservedDocument[];
  /**
   * Whether a digest difference is a finding. It always is, but a caller
   * that regenerates the registry in the same run can set this false to
   * avoid reporting the change it just made.
   */
  checkDigests?: boolean;
}

export interface SourceRegistryValidationIssue {
  code: SourceRegistryProblem;
  path: string;
  detail: string;
}

/**
 * Check the registry against the documents actually on disk.
 *
 * Both directions are checked. A registered document that has vanished is
 * a finding, and a document on disk that is not registered is also a
 * finding. A registry that only checks one direction is a registry that
 * can quietly lose half its value.
 */
export function validateSourceRegistry(
  registry: SourceRegistry,
  options: SourceRegistryValidationOptions,
): SourceRegistryValidationIssue[] {
  const issues: SourceRegistryValidationIssue[] = [];
  if (!nonEmpty(registry.schema_version)) {
    issues.push({ code: "registry-schema-version", path: "(registry)", detail: "schema_version is empty" });
  }
  if (!nonEmpty(registry.source_date)) {
    issues.push({ code: "registry-source-date", path: "(registry)", detail: "source_date is empty" });
  }
  if (registry.scopes.length === 0) {
    issues.push({ code: "registry-scopes", path: "(registry)", detail: "no scopes declared" });
  }
  if (registry.sources.length === 0) {
    issues.push({ code: "registry-sources", path: "(registry)", detail: "no sources listed" });
    return issues;
  }

  const scopeNames = new Set(registry.scopes.map((s) => s.name));
  const registered = new Map<string, SourceEntry>();
  for (const entry of registry.sources) {
    const problems = validateSourceEntry(entry);
    if (problems.length > 0) {
      issues.push({
        code: "registry-count-mismatch",
        path: entry.path,
        detail: problems.join(", "),
      });
    }
    if (registered.has(entry.path)) {
      issues.push({
        code: "registry-duplicate-path",
        path: entry.path,
        detail: "appears more than once",
      });
      continue;
    }
    registered.set(entry.path, entry);
    if (!scopeNames.has(entry.scope)) {
      issues.push({
        code: "registry-unknown-scope",
        path: entry.path,
        detail: `scope ${entry.scope} is not declared`,
      });
    }
  }

  const onDisk = new Map<string, ObservedDocument>();
  for (const doc of options.observed ?? []) onDisk.set(doc.path, doc);

  /* The checks that compare the register to what is on disk. They need
   * observations, and an observation set that is empty because the
   * material is not here is not the same as an observation set that is
   * empty because the material was deleted. When the observations are
   * unknown, these are skipped rather than reported, and the register
   * is not accused of describing a machine that does not exist. */
  if (options.observed) {
    // Registered but gone.
    for (const [path, entry] of registered) {
      const observed = onDisk.get(path);
      if (!observed || !observed.exists) {
        issues.push({
          code: "registry-missing-document",
          path,
          detail: "registered but not on disk",
        });
        continue;
      }
      if (options.checkDigests !== false && observed.digest && observed.digest !== entry.digest) {
        issues.push({
          code: "registry-digest-mismatch",
          path,
          detail: `registry says ${entry.digest.slice(0, 19)}..., disk has ${observed.digest.slice(0, 19)}...`,
        });
      }
    }

    // On disk but not registered.
    for (const doc of options.observed) {
      if (!doc.exists) continue;
      if (!registered.has(doc.path)) {
        issues.push({
          code: "registry-unregistered-document",
          path: doc.path,
          detail: "on disk but not in the registry",
        });
      }
    }
  }

  // The declared counts must match what is actually listed.
  for (const scope of registry.scopes) {
    const actual = registry.sources.filter((s) => s.scope === scope.name).length;
    if (actual !== scope.documents) {
      issues.push({
        code: "registry-count-mismatch",
        path: scope.name,
        detail: `scope declares ${scope.documents} documents, ${actual} are listed`,
      });
    }
  }

  return issues;
}

// -- queries ---------------------------------------------------------------

export interface SourceSummary {
  total: number;
  bytes: number;
  byKind: Record<string, number>;
  byScope: Record<string, number>;
}

export function summariseSources(registry: SourceRegistry): SourceSummary {
  const byKind: Record<string, number> = {};
  const byScope: Record<string, number> = {};
  let bytes = 0;
  for (const s of registry.sources) {
    byKind[s.kind] = (byKind[s.kind] ?? 0) + 1;
    byScope[s.scope] = (byScope[s.scope] ?? 0) + 1;
    bytes += s.bytes;
  }
  return { total: registry.sources.length, bytes, byKind, byScope };
}

/** The documents of one kind, for a reader who wants one category. */
export function sourcesOfKind(registry: SourceRegistry, kind: SourceKind): SourceEntry[] {
  return registry.sources.filter((s) => s.kind === kind);
}

/** Find an entry by its path, matching case-insensitively on the tail. */
export function findSource(registry: SourceRegistry, pathFragment: string): SourceEntry | null {
  const needle = pathFragment.toLowerCase();
  return (
    registry.sources.find((s) => s.path.toLowerCase() === needle) ??
    registry.sources.find((s) => s.path.toLowerCase().endsWith(needle)) ??
    registry.sources.find((s) => s.title.toLowerCase().includes(needle)) ??
    null
  );
}
