import type { Requirement, SourceRef } from "./types";

export type IngestRelation =
  | "EXACT_DUPLICATE"
  | "LIKELY_DUPLICATE"
  | "RELATED"
  | "CONFLICTING"
  | "SUPERSEDED"
  | "INDEPENDENT";

export interface RequirementCandidate {
  title: string;
  description: string;
  source: SourceRef;
  owner: string;
  module?: string;
  phase: string;
  priority: number;
  depends_on?: string[];
  blockers?: string[];
  evidence?: string[];
  provenance: string;
  status?: Requirement["status"];
  work_state?: Requirement["work_state"];
  owner_gate?: boolean;
  supersedes?: string[];
  notes?: string;
}

export interface IngestOutcome {
  requirement: Requirement;
  relation: IngestRelation;
  merged_into: string | null;
  diagnostics: string[];
}

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function slugify(title: string): string {
  const slug = normalizeText(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "requirement";
}

function sameSource(a: SourceRef, b: SourceRef): boolean {
  return (
    a.class === b.class &&
    normalizeText(a.ref).toLowerCase() === normalizeText(b.ref).toLowerCase()
  );
}

/**
 * Ingest one structured candidate into an existing requirement set.
 * Pure + deterministic: same inputs always yield the same outcome.
 * Never deletes history: merges link sources, conflicts are preserved.
 */
export function ingestCandidate(
  existing: Requirement[],
  candidate: RequirementCandidate,
  idPrefix = "REQ",
): IngestOutcome {
  const diagnostics: string[] = [];
  const title = normalizeText(candidate.title);
  const description = normalizeText(candidate.description);
  if (!title) {
    return {
      requirement: undefined as unknown as Requirement,
      relation: "INDEPENDENT",
      merged_into: null,
      diagnostics: ["candidate title is empty after normalization"],
    };
  }

  const titleKey = title.toLowerCase();
  const descKey = description.toLowerCase();

  // 1. Exact id/title+description duplicate.
  const exact = existing.find(
    (r) =>
      normalizeText(r.title).toLowerCase() === titleKey &&
      normalizeText(r.description).toLowerCase() === descKey,
  );
  if (exact) {
    const merged: Requirement = {
      ...exact,
      also_from: [...(exact.also_from ?? []), candidate.source].filter(
        (s, i, arr) => arr.findIndex((o) => sameSource(o, s)) === i,
      ),
    };
    if (!requirementIncludesSource(exact, candidate.source)) {
      diagnostics.push(`linked additional source to ${exact.id}`);
    }
    return { requirement: merged, relation: "EXACT_DUPLICATE", merged_into: exact.id, diagnostics };
  }

  // 2. Likely semantic duplicate: same normalized title, same owner.
  const likely = existing.find(
    (r) =>
      normalizeText(r.title).toLowerCase() === titleKey &&
      r.owner === candidate.owner,
  );
  if (likely) {
    diagnostics.push(
      `likely duplicate of ${likely.id}: same title+owner with different description; kept separate, linked`,
    );
    const requirement = buildRequirement(candidate, idPrefix, existing.length);
    requirement.duplicates = [...(requirement.duplicates ?? []), likely.id];
    return { requirement, relation: "LIKELY_DUPLICATE", merged_into: null, diagnostics };
  }

  // 3. Superseded: candidate supersedes listed ids that exist.
  const superseded = (candidate.supersedes ?? []).filter((id) =>
    existing.some((r) => r.id === id),
  );
  const requirement = buildRequirement(candidate, idPrefix, existing.length);
  if (superseded.length > 0) {
    requirement.supersedes = superseded;
    return {
      requirement,
      relation: "SUPERSEDED",
      merged_into: null,
      diagnostics: [`supersedes ${superseded.join(", ")}`],
    };
  }

  // 4. Related: same owner+phase.
  const related = existing.find(
    (r) => r.owner === candidate.owner && r.phase === candidate.phase,
  );
  return {
    requirement,
    relation: related ? "RELATED" : "INDEPENDENT",
    merged_into: null,
    diagnostics: related ? [`shares owner+phase with ${related.id}`] : ["no similar requirement found"],
  };
}

function buildRequirement(
  candidate: RequirementCandidate,
  idPrefix: string,
  index: number,
): Requirement {
  const id = `${idPrefix}-${slugify(candidate.title)}-${String(index + 1).padStart(3, "0")}`;
  return {
    id,
    title: normalizeText(candidate.title),
    description: normalizeText(candidate.description),
    source: candidate.source,
    owner: candidate.owner,
    module: candidate.module,
    phase: candidate.phase,
    status: candidate.status ?? "RESEARCH",
    priority: candidate.priority,
    depends_on: [...(candidate.depends_on ?? [])].sort(),
    blockers: [...(candidate.blockers ?? [])],
    evidence: [...(candidate.evidence ?? [])],
    provenance: candidate.provenance,
    supersedes: candidate.supersedes ? [...candidate.supersedes].sort() : undefined,
    owner_gate: candidate.owner_gate ?? false,
    work_state: candidate.work_state ?? "READY",
    notes: candidate.notes,
  };
}

export function requirementIncludesSource(r: Requirement, s: SourceRef): boolean {
  if (sameSource(r.source, s)) return true;
  return (r.also_from ?? []).some((o) => sameSource(o, s));
}
