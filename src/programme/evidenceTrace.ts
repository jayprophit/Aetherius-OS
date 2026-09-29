/**
 * REQ-p16-evidence-traceability: machine-checkable evidence traceability
 * for the requirement registry.
 *
 * The gap this closes: `validateProgramme` checks only that `evidence` is a
 * non-empty array of non-blank strings. Prose satisfies that. A requirement
 * can therefore be marked COMPLETE while every path it names points at
 * nothing, and the registry cannot tell the two cases apart. The
 * `test_refs` / `implementation_refs` fields exist in the Requirement type
 * precisely to carry machine-checkable evidence, and before this module
 * 0 of 107 requirements populated either of them.
 *
 * Boundaries, held deliberately:
 * - READ-ONLY AUDIT. It never edits a requirement and never proposes a
 *   work_state change. A dangling citation is reported, not repaired.
 * - NO AUTHORITY, NO SCORE. `traceClass` is a recorded structural fact about
 *   the shape of a claim, never a judgement of whether the work was done or
 *   is good enough. Nothing here promotes, closes, or ranks a requirement.
 * - NO FILESYSTEM ACCESS. Path resolution is injected by the caller, so
 *   this stays pure and deterministic and testable without a disk.
 * - PROSE IS NOT A PATH. A citation is only treated as a path when it is
 *   actually path-shaped; ordinary evidence sentences that mention a test
 *   count are reported as prose, not as broken links.
 */

import type { Requirement } from "./types";

/** How a requirement's evidence is structurally traceable to something checkable. */
export type TraceClass =
  /** At least one machine-ref field populated; the explicit path. */
  | "MACHINE_REFS"
  /** Evidence names at least one path that resolves on disk. */
  | "CITED_PATHS"
  /** Prose only, no path-shaped citation and no machine refs. */
  | "PROSE_ONLY"
  /** Evidence names a path that does not resolve anywhere searched. */
  | "DANGLING_CITATION"
  /** No usable evidence at all (empty or blank-only). */
  | "NO_EVIDENCE";

export interface CitationResolution {
  /** The citation exactly as it appeared, unnormalised. */
  citation: string;
  /** The path as interpreted, after stripping a leading "./". */
  path: string;
  /** Where it resolved, e.g. "aetherius-os" or "poietek". */
  resolvedIn: string;
  /** Which search prefix matched: "" for repo-root-relative, "src/" for src-relative. */
  matchedPrefix: string;
  /** The candidate path that actually exists, i.e. prefix + path. */
  resolvedPath: string;
}

export interface DanglingCitation {
  citation: string;
  path: string;
  /** Which roots were searched for this citation, sorted. */
  searchedRoots: string[];
  /** Which prefixes were tried under each root, sorted. */
  searchedPrefixes: string[];
}

/** Default prefixes: repo-root-relative and src-relative shorthand. */
export const DEFAULT_SEARCH_PREFIXES: readonly string[] = ["", "src/"];

export interface EvidenceTrace {
  id: string;
  owner: string;
  work_state: Requirement["work_state"];
  traceClass: TraceClass;
  /** Populated machine refs, sorted; empty when the fields are unused. */
  implementationRefs: string[];
  testRefs: string[];
  /** Resolved path citations found in evidence/notes/implementation_refs/test_refs. */
  resolved: CitationResolution[];
  dangling: DanglingCitation[];
  /** True when at least one resolved or declared ref looks like a test file. */
  hasTestCitation: boolean;
  /** True when the requirement claims COMPLETE. */
  claimsComplete: boolean;
  /**
   * A COMPLETE claim with nothing checkable behind it. Reported, never
   * acted on: this is the honest shape of the current registry, not a
   * verdict on the underlying work.
   */
  untraceableComplete: boolean;
}

/** Resolves a root-relative path for one named root. Caller supplies the disk. */
export type PathResolver = (root: string, path: string) => boolean;

/** Roots searched per owner, e.g. { "poietek": ["aetherius-os", "poietek"] }. */
export type OwnerRoots = Readonly<Record<string, readonly string[]>>;

const PATH_LIKE = String.raw`(?:[A-Za-z0-9_.-]+/)+[A-Za-z0-9_.-]+\.[A-Za-z0-9]+`;
/**
 * Test-file shapes actually used across this programme's repositories:
 * dot-style everywhere (foo.test.ts / foo.test.mjs / foo.test.js), and
 * Python's prefix style, which is how Agent-Bridge names every one of its
 * suites. Recognising only the dot style made six correctly-cited
 * Agent-Bridge requirements read as untraceable - the audit was blind to a
 * whole repository's convention.
 */
const TEST_FILE =
  /(?:\.(?:test|spec)\.[A-Za-z0-9]+$)|(?:(?:^|\/)test_[A-Za-z0-9_]+\.(?:py|mjs|js|ts|tsx)$)|(?:(?:^|\/)tests?\/[A-Za-z0-9_.-]+$)/;

/**
 * Pull path-shaped tokens out of free text. A token must contain a separator
 * and an extension, so a sentence like "19 tests in packaging" yields
 * nothing while "src/release/packaging.ts" does.
 */
export function extractPathCitations(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(new RegExp(PATH_LIKE, "g"))) {
    const token = m[0].replace(/^\.\//, "");
    // Trailing punctuation from a sentence must not become part of the path.
    const cleaned = token.replace(/[),.;:]+$/, "");
    if (cleaned.includes("/") && /\.[A-Za-z0-9]+$/.test(cleaned)) out.add(cleaned);
  }
  return [...out].sort();
}

function citationText(r: Requirement): string {
  return [...r.evidence, r.notes ?? "", ...(r.implementation_refs ?? []), ...(r.test_refs ?? [])].join("\n");
}

function looksLikeTest(path: string): boolean {
  return TEST_FILE.test(path);
}

/** Roots outer, prefixes inner: the first hit wins and is reported. */
function findFirst(
  path: string,
  searchedRoots: readonly string[],
  prefixes: readonly string[],
  resolve: PathResolver,
): CitationResolution | null {
  for (const root of searchedRoots) {
    for (const prefix of prefixes) {
      const candidate = `${prefix}${path}`;
      if (resolve(root, candidate)) {
        return {
          citation: path,
          path,
          resolvedIn: root,
          matchedPrefix: prefix,
          resolvedPath: candidate,
        };
      }
    }
  }
  return null;
}

export interface EvidenceTraceOptions {
  /**
   * Path prefixes tried under each root, in order. The registry uses two
   * real conventions: repo-root-relative ("src/release/packaging.ts") and
   * src-relative shorthand ("runners/sync.ts"). Both are declared here
   * rather than guessed, and the prefix that matched is recorded, so a
   * reader can always tell which convention a citation used. Nothing else is
   * tried: an undeclared convention is reported, never inferred.
   */
  prefixes?: readonly string[];
}

/**
 * Audit evidence traceability for every requirement. Pure: never mutates
 * input, never touches disk (resolution arrives through `resolve`), and
 * deterministic — output is sorted by requirement id, then by citation.
 */
export function auditEvidenceTrace(
  requirements: readonly Requirement[],
  roots: OwnerRoots,
  resolve: PathResolver,
  options: EvidenceTraceOptions = {},
): EvidenceTrace[] {
  const prefixes = options.prefixes ?? DEFAULT_SEARCH_PREFIXES;
  const traces = requirements.map((r): EvidenceTrace => {
    const owner = r.owner;
    const searchedRoots = [...new Set(roots[owner] ?? [owner])].sort();
    const declared = [
      ...(r.implementation_refs ?? []).map((p) => ({ path: p.replace(/^\.\//, ""), root: owner })),
      ...(r.test_refs ?? []).map((p) => ({ path: p.replace(/^\.\//, ""), root: owner })),
    ];
    const extracted = extractPathCitations(citationText(r)).map((p) => ({ path: p, root: owner }));

    const resolved = new Map<string, CitationResolution>();
    const dangling = new Map<string, DanglingCitation>();
    for (const c of [...declared, ...extracted]) {
      const hit = findFirst(c.path, searchedRoots, prefixes, resolve);
      if (hit !== null) {
        if (!resolved.has(c.path)) resolved.set(c.path, hit);
      } else if (!resolved.has(c.path)) {
        dangling.set(c.path, {
          citation: c.path,
          path: c.path,
          searchedRoots,
          searchedPrefixes: [...prefixes].sort(),
        });
      }
    }

    const implementationRefs = [...new Set(r.implementation_refs ?? [])].sort();
    const testRefs = [...new Set(r.test_refs ?? [])].sort();
    const claimsComplete = r.work_state === "COMPLETE";
    // Traceability counts only citations that actually resolve. A declared
    // test_ref that names a missing file is a dangling citation, never a
    // satisfied one: declaring a path does not make it exist.
    const hasTestCitation = [...resolved.keys()].some(looksLikeTest);

    let traceClass: TraceClass;
    if (r.evidence.length === 0 || r.evidence.every((e) => !e.trim())) traceClass = "NO_EVIDENCE";
    else if (dangling.size > 0) traceClass = "DANGLING_CITATION";
    else if (implementationRefs.length > 0 || testRefs.length > 0) traceClass = "MACHINE_REFS";
    else if (resolved.size > 0) traceClass = "CITED_PATHS";
    else traceClass = "PROSE_ONLY";

    return {
      id: r.id,
      owner,
      work_state: r.work_state,
      traceClass,
      implementationRefs,
      testRefs,
      resolved: [...resolved.values()].sort((a, b) => a.path.localeCompare(b.path)),
      dangling: [...dangling.values()].sort((a, b) => a.path.localeCompare(b.path)),
      hasTestCitation,
      claimsComplete,
      untraceableComplete: claimsComplete && !hasTestCitation,
    };
  });

  return traces.sort((a, b) => a.id.localeCompare(b.id));
}

export interface TraceSummary {
  total: number;
  byClass: Record<TraceClass, number>;
  complete: number;
  untraceableComplete: number;
  requirementsWithMachineRefs: number;
  danglingCitations: number;
}

export function summariseEvidenceTrace(traces: readonly EvidenceTrace[]): TraceSummary {
  const byClass: Record<TraceClass, number> = {
    MACHINE_REFS: 0,
    CITED_PATHS: 0,
    PROSE_ONLY: 0,
    DANGLING_CITATION: 0,
    NO_EVIDENCE: 0,
  };
  let complete = 0;
  let untraceableComplete = 0;
  let requirementsWithMachineRefs = 0;
  let danglingCitations = 0;
  for (const t of traces) {
    byClass[t.traceClass] += 1;
    if (t.claimsComplete) complete += 1;
    if (t.untraceableComplete) untraceableComplete += 1;
    if (t.implementationRefs.length > 0 || t.testRefs.length > 0) requirementsWithMachineRefs += 1;
    danglingCitations += t.dangling.length;
  }
  return {
    total: traces.length,
    byClass,
    complete,
    untraceableComplete,
    requirementsWithMachineRefs,
    danglingCitations,
  };
}
