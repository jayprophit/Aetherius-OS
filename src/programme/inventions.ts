import { createHash } from "node:crypto";

/**
 * REQ-p16-invention-disclosure: invention disclosure registry/record
 * under P16 provenance.
 *
 * Preserves potentially novel Aetherius mechanisms plus associated
 * prior-art research WITHOUT claiming anything is patented or
 * patentable. No patent engine, no patentability classifier, no legal
 * advice, no second provenance store: records compose with the existing
 * programme registry (requirement ids, evidence refs, source
 * attribution).
 *
 * Rules enforced here:
 * - Deterministic ids: inv-<slug>-<hash8> over title+mechanism. Same
 *   content always yields the same id; same id with different content
 *   is a conflict, never a silent overwrite.
 * - No legal conclusions: the status vocabulary contains no
 *   PATENTABLE/NOVEL/NON_OBVIOUS state, and free-text legal claims are
 *   rejected by validation.
 * - External mechanisms stay attributed: records derived from external
 *   work must name the external attribution.
 * - History is append-only: registration never mutates other records.
 */

export type InventionStatus =
  | "CANDIDATE"
  | "PRIOR_ART_REVIEW_PENDING"
  | "UNDER_REVIEW"
  | "DISCLOSED"
  | "ARCHIVED";

export const INVENTION_STATUSES: readonly InventionStatus[] = [
  "CANDIDATE",
  "PRIOR_ART_REVIEW_PENDING",
  "UNDER_REVIEW",
  "DISCLOSED",
  "ARCHIVED",
];

export interface PriorArtRef {
  ref: string;
  relation: string;
}

export interface InventionInput {
  title: string;
  inventors: readonly string[];
  dateConceived: string;
  problem: string;
  priorApproaches: string;
  mechanism: string;
  effect: string;
  projects: readonly string[];
  sources: readonly string[];
  prototypeEvidence: readonly string[];
  priorArt: readonly PriorArtRef[];
  publicDisclosureDate?: string;
  status: InventionStatus;
  evidenceRefs: readonly string[];
  provenance: string;
  relatedRequirements?: readonly string[];
  derivedFromExternal?: boolean;
  externalAttribution?: string;
}

export interface InventionRecord extends Omit<InventionInput, "inventors" | "projects" | "sources" | "prototypeEvidence" | "evidenceRefs" | "priorArt" | "relatedRequirements"> {
  inventionId: string;
  inventors: string[];
  projects: string[];
  sources: string[];
  prototypeEvidence: string[];
  priorArt: PriorArtRef[];
  evidenceRefs: string[];
  relatedRequirements: string[];
  registeredAt: string;
}

export type InventionProblem =
  | "title-required"
  | "inventors-required"
  | "date-invalid"
  | "problem-required"
  | "mechanism-required"
  | "effect-required"
  | "projects-required"
  | "provenance-required"
  | "status-invalid"
  | "legal-conclusion"
  | "attribution-required"
  | "prior-art-invalid"
  | "disclosure-date-invalid";

const LEGAL_CLAIMS = [
  "patentable",
  "patent pending",
  "non-obvious",
  "nonobvious",
  "novel invention",
  "claims novelty",
  "claim novelty",
];

function nonEmpty(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasLegalConclusion(text: string): boolean {
  const lower = text.toLowerCase();
  return LEGAL_CLAIMS.some((claim) => lower.includes(claim));
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

export function inventionIdFor(title: string, mechanism: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "invention";
  const hash = createHash("sha256").update(`${title.trim()}\n${mechanism.trim()}`, "utf8").digest("hex").slice(0, 8);
  return `inv-${slug}-${hash}`;
}

/** Validate an invention input. Empty problems = registrable. */
export function validateInvention(input: InventionInput): InventionProblem[] {
  const problems: InventionProblem[] = [];
  if (!nonEmpty(input.title)) problems.push("title-required");
  if (!Array.isArray(input.inventors) || input.inventors.length === 0 || !input.inventors.every(nonEmpty)) {
    problems.push("inventors-required");
  }
  if (!nonEmpty(input.dateConceived) || !isIsoDate(input.dateConceived)) problems.push("date-invalid");
  if (!nonEmpty(input.problem)) problems.push("problem-required");
  if (!nonEmpty(input.mechanism)) problems.push("mechanism-required");
  if (!nonEmpty(input.effect)) problems.push("effect-required");
  if (!Array.isArray(input.projects) || input.projects.length === 0 || !input.projects.every(nonEmpty)) {
    problems.push("projects-required");
  }
  if (!nonEmpty(input.provenance)) problems.push("provenance-required");
  if (!INVENTION_STATUSES.includes(input.status)) problems.push("status-invalid");
  for (const text of [input.title, input.problem, input.priorApproaches, input.mechanism, input.effect]) {
    if (typeof text === "string" && hasLegalConclusion(text)) {
      problems.push("legal-conclusion");
      break;
    }
  }
  if (input.derivedFromExternal === true && !nonEmpty(input.externalAttribution ?? "")) {
    problems.push("attribution-required");
  }
  for (const art of input.priorArt ?? []) {
    if (!nonEmpty(art?.ref) || !nonEmpty(art?.relation)) {
      problems.push("prior-art-invalid");
      break;
    }
  }
  if (input.publicDisclosureDate !== undefined && !isIsoDate(input.publicDisclosureDate)) {
    problems.push("disclosure-date-invalid");
  }
  return [...new Set(problems)].sort() as InventionProblem[];
}

export type RegisterOutcome =
  | { status: "registered"; record: InventionRecord }
  | { status: "identical"; record: InventionRecord }
  | { status: "conflict"; inventionId: string; reason: string };

/**
 * Register an invention into an existing record list. Pure: returns the
 * new list alongside the outcome; never mutates inputs. Same content is
 * idempotent; same id with different content is a conflict.
 */
export function registerInvention(
  records: readonly InventionRecord[],
  input: InventionInput,
  knownRequirements: readonly string[] = [],
  now: () => string = () => new Date().toISOString(),
): { records: InventionRecord[]; outcome: RegisterOutcome } {
  const problems = validateInvention(input);
  if (problems.length > 0) {
    return {
      records: [...records],
      outcome: { status: "conflict", inventionId: "", reason: `invalid invention: ${problems.join(",")}` },
    };
  }
  const related = [...(input.relatedRequirements ?? [])];
  const unknown = related.filter((id) => !knownRequirements.includes(id));
  if (knownRequirements.length > 0 && unknown.length > 0) {
    return {
      records: [...records],
      outcome: { status: "conflict", inventionId: "", reason: `unknown related requirements: ${unknown.join(",")}` },
    };
  }
  const inventionId = inventionIdFor(input.title, input.mechanism);
  const record: InventionRecord = {
    inventionId,
    title: input.title.trim(),
    inventors: input.inventors.map((s) => s.trim()),
    dateConceived: input.dateConceived,
    problem: input.problem.trim(),
    priorApproaches: input.priorApproaches.trim(),
    mechanism: input.mechanism.trim(),
    effect: input.effect.trim(),
    projects: input.projects.map((s) => s.trim()),
    sources: [...input.sources],
    prototypeEvidence: [...input.prototypeEvidence],
    priorArt: input.priorArt.map((a) => ({ ref: a.ref.trim(), relation: a.relation.trim() })),
    ...(input.publicDisclosureDate !== undefined ? { publicDisclosureDate: input.publicDisclosureDate } : {}),
    status: input.status,
    evidenceRefs: [...input.evidenceRefs],
    provenance: input.provenance.trim(),
    relatedRequirements: [...related].sort(),
    ...(input.derivedFromExternal !== undefined ? { derivedFromExternal: input.derivedFromExternal } : {}),
    ...(input.externalAttribution !== undefined ? { externalAttribution: input.externalAttribution!.trim() } : {}),
    registeredAt: now(),
  };
  const existing = records.find((r) => r.inventionId === inventionId);
  if (existing) {
    const { registeredAt: _a, ...restExisting } = existing;
    const { registeredAt: _b, ...restRecord } = record;
    if (JSON.stringify(restExisting) === JSON.stringify(restRecord)) {
      return { records: [...records], outcome: { status: "identical", record: existing } };
    }
    return {
      records: [...records],
      outcome: { status: "conflict", inventionId, reason: "invention id collision with different content; records are immutable" },
    };
  }
  return { records: [...records, record], outcome: { status: "registered", record } };
}

/** Deterministic canonical serialization for hashing/comparison. */
export function canonicalInvention(record: InventionRecord): string {
  return JSON.stringify(record);
}
