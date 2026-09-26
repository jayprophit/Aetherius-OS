import { StateError } from "../state/types";
import type { OwnedStore } from "../state/store";
import type { StateEnvelope } from "../state/types";

/**
 * REQ-p16-governance-proposals: governance proposal fabric.
 *
 * A proposal is a REQUESTED GOVERNANCE CHANGE, or a request for
 * governance consideration. The registered requirement describes the
 * chain "proposal to review to vote to funding to milestones to evidence
 * to staged release". This module owns the first link only: a proposed
 * change, its review, and a decision recorded BY REFERENCE.
 *
 * The skill promotion lifecycle is the TEMPLATE for the shape of a governed
 * lifecycle (see src/workflows/promotion.ts). It is deliberately NOT reused:
 * a skill candidate is promoted by a promotion policy, whereas a
 * governance proposal is only ever recorded. Nothing here is promoted,
 * applied, merged or deployed.
 *
 * Boundaries this module exists to hold:
 *
 *   PROPOSAL        != GOVERNANCE DECISION
 *   DECISION        != AUTHORIZATION       (P25 authorizes, not a proposal)
 *   APPROVAL        != EXECUTION
 *   PROPOSER ROLE   != AUTHORITY
 *   PROPOSAL RECORD != SIDE EFFECT
 *   GOVERNANCE      != AUTONOMOUS AUTHORITY
 *   ABSENCE OF A DECISION != APPROVAL
 *
 * There is no tally, no quorum, no voter set, no delegation, no staking
 * and no consensus engine here. "VOTE" names a stage at which some
 * responsible mechanism recorded a decision; this module stores that
 * mechanism's reference and nothing more. Funding and rewards belong to
 * REQ-p25-reward-treasury (DEFERRED); staged release belongs to
 * REQ-p31-release-scope (OWNER_GATED); evidence joins live in
 * REQ-p16-evidence-graph. None of those are reachable from here.
 */

const KIND = "governance.proposal";
const SCHEMA = 1;
const PROPOSAL_PROVENANCE = "p16-governance-proposals";

/**
 * Stage names are taken from the registered requirement's own chain, not
 * invented: PROPOSED and REVIEW are its first two links, VOTE is its
 * third. The requirement's later links (FUNDING, MILESTONES, EVIDENCE,
 * STAGED_RELEASE) are named by the requirement but are NOT implemented and
 * are deliberately unreachable states on this record.
 *
 * Note what is absent: there is no APPROVED, AUTHORIZED, APPLIED or
 * PROMOTED state. A proposal cannot reach a state that implies it changed
 * anything.
 */
export const PROPOSAL_STAGES = ["PROPOSED", "REVIEW", "VOTE", "WITHDRAWN", "SUPERSEDED"] as const;
export type ProposalStage = (typeof PROPOSAL_STAGES)[number];

/** Stages at which a recorded decision is required / permitted. */
const DECIDED_STAGE: ProposalStage = "VOTE";

/**
 * Protected categories are risk METADATA for triage. Recording that a
 * proposal touches credentials says nothing about whether it may.
 */
export const PROTECTED_CATEGORIES = [
  "NONE",
  "CREDENTIAL",
  "SECURITY_POLICY",
  "FINANCE",
  "DESTRUCTIVE",
  "DEVICE",
  "PUBLICATION",
] as const;
export type ProtectedCategory = (typeof PROTECTED_CATEGORIES)[number];

/**
 * Decision outcomes. SUPPORTED means a mechanism recorded support for the
 * proposal. It is NOT approval, NOT authorization, and NOT permission to
 * act: the responsible mechanism's own gate still applies.
 */
export type DecisionOutcome = "SUPPORTED" | "OPPOSED" | "ABSTAINED";

const DECISION_OUTCOMES: readonly DecisionOutcome[] = ["SUPPORTED", "OPPOSED", "ABSTAINED"];

export interface ProposalDecision {
  /** Opaque reference to the decision record held by the deciding mechanism. */
  decisionRef: string;
  /** Reference to WHO decided (owner, P25, a council record). A reference, never authority. */
  decidedByRef: string;
  /** ISO timestamp supplied by the caller. Never generated here. */
  decidedAt: string;
  outcome: DecisionOutcome;
}

export interface ProposalRisk {
  category: ProtectedCategory;
  note: string;
}

export interface ProposalRecord {
  /** Deterministic id, "gov-<slug>". Structurally cannot be a requirement/decision/vote/execution id. */
  proposalId: string;
  /** Monotonic version. An amendment is a new version of the same id, never a silent overwrite. */
  version: number;
  title: string;
  rationale: string;
  scope: string;
  /** Reference to a proposer. Identity only: proposer identity is never authority. */
  proposerRef: string;
  stage: ProposalStage;
  /** Previous version ref, "<proposalId>@<version>". */
  supersedesRef?: string;
  targetRefs: string[];
  requirementRefs: string[];
  evidenceRefs: string[];
  decision?: ProposalDecision;
  risk: ProposalRisk;
  /** ISO timestamp supplied by the caller. Never generated here. */
  createdAt: string;
  provenance: string;
}

export type ProposalProblem =
  | "proposal-id"
  | "version"
  | "title"
  | "rationale"
  | "scope"
  | "proposer-ref"
  | "stage"
  | "supersedes"
  | "refs"
  | "requirement-refs"
  | "decision"
  | "decision-temporal"
  | "risk-category"
  | "authority-field"
  | "raw-secret"
  | "created-at"
  | "provenance";

/**
 * Fields a proposal record must never carry. A proposal that can express
 * its own authority is a proposal that can grant it.
 */
const BANNED_AUTHORITY_KEYS = [
  "authorized",
  "authorize",
  "execute",
  "executed",
  "merge_authority",
  "canMerge",
  "canDeploy",
  "grantApproved",
  "policyBypass",
  "ownerOverride",
  "approvalGranted",
  "applied",
];

/**
 * Credential-bearing keys, mirroring the banned list in
 * assertSecretReferenceShape (src/state/types.ts). Governance records
 * reference secrets; they never carry them.
 */
const BANNED_CREDENTIAL_KEYS = ["value", "secret", "token", "password", "apiKey", "privateKey"];

/**
 * Minimal credential-assignment guard, mirroring staticSafetyScan's intent
 * in src/workflows/promotion.ts. That module's patterns are private to the
 * completed P19 promotion requirement, so they are not imported or edited
 * here; this is a deliberately small local subset.
 */
const SECRET_VALUE_PATTERNS: readonly RegExp[] = [
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
  /bearer\s+[A-Za-z0-9._-]+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /password\s*[:=]\s*['"][^'"]+['"]/i,
];

const PROPOSAL_ID_RE = /^gov-[a-z0-9][a-z0-9-]*$/;
const SLUG_RE = /[^a-z0-9]+/g;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export type RegisterProposalOutcome =
  | { status: "registered"; record: ProposalRecord }
  | { status: "identical"; record: ProposalRecord }
  | { status: "conflict"; proposalId: string; reason: string }
  | { status: "rejected"; proposalId: string; reason: string };

/** Deterministic proposal id from a title slug. */
export function proposalIdFor(title: string): string {
  const slug = title.toLowerCase().replace(SLUG_RE, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return `gov-${slug.length > 0 ? slug : "proposal"}`;
}

/** Deterministic reference to a specific version of a proposal. */
export function proposalVersionRef(proposalId: string, version: number): string {
  return `${proposalId}@${version}`;
}

/** Durable state id for a specific proposal version, e.g. "gov-release-scope-v2". */
export function proposalStateId(proposalId: string, version: number): string {
  return `${proposalId}-v${version}`;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isoTimestamp(value: unknown): value is string {
  return typeof value === "string" && ISO_RE.test(value) && !Number.isNaN(Date.parse(value));
}

function refList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(nonEmpty) &&
    new Set(value).size === value.length
  );
}

function carriesBannedField(record: Record<string, unknown>): boolean {
  for (const key of [...BANNED_AUTHORITY_KEYS, ...BANNED_CREDENTIAL_KEYS]) {
    if (Object.prototype.hasOwnProperty.call(record, key)) return true;
  }
  return false;
}

function carriesSecretValue(text: string): boolean {
  return SECRET_VALUE_PATTERNS.some((p) => p.test(text));
}

export interface ProposalInput {
  proposalId: string;
  version: number;
  title: string;
  rationale: string;
  scope: string;
  proposerRef: string;
  stage: ProposalStage;
  supersedesRef?: string;
  targetRefs?: string[];
  requirementRefs?: string[];
  evidenceRefs?: string[];
  decision?: ProposalDecision;
  risk?: { category: ProtectedCategory; note?: string };
  createdAt: string;
  provenance?: string;
}

/** Normalize an input into a full record without inventing any field. */
export function buildProposal(input: ProposalInput): ProposalRecord {
  return {
    proposalId: input.proposalId,
    version: input.version,
    title: input.title,
    rationale: input.rationale,
    scope: input.scope,
    proposerRef: input.proposerRef,
    stage: input.stage,
    ...(input.supersedesRef === undefined ? {} : { supersedesRef: input.supersedesRef }),
    targetRefs: [...(input.targetRefs ?? [])],
    requirementRefs: [...(input.requirementRefs ?? [])],
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    ...(input.decision === undefined ? {} : { decision: input.decision }),
    risk: { category: input.risk?.category ?? "NONE", note: input.risk?.note ?? "" },
    createdAt: input.createdAt,
    provenance: input.provenance ?? PROPOSAL_PROVENANCE,
  };
}

/**
 * Validate a proposal. Malformed input is rejected, never repaired.
 *
 * `knownRequirements` is only consulted when non-empty: an unchecked
 * dimension stays silent rather than reporting a false negative.
 */
export function validateProposal(input: ProposalInput, knownRequirements: readonly string[] = []): ProposalProblem[] {
  const problems: ProposalProblem[] = [];
  if (!nonEmpty(input.proposalId) || !PROPOSAL_ID_RE.test(input.proposalId)) {
    problems.push("proposal-id");
  }
  if (!Number.isInteger(input.version) || input.version < 1) {
    problems.push("version");
  }
  if (!nonEmpty(input.title)) problems.push("title");
  if (!nonEmpty(input.rationale)) problems.push("rationale");
  if (!nonEmpty(input.scope)) problems.push("scope");
  if (!nonEmpty(input.proposerRef)) problems.push("proposer-ref");
  if (!PROPOSAL_STAGES.includes(input.stage)) problems.push("stage");
  if (!nonEmpty(input.provenance ?? PROPOSAL_PROVENANCE)) problems.push("provenance");
  if (!isoTimestamp(input.createdAt)) problems.push("created-at");

  if (input.supersedesRef !== undefined) {
    if (!nonEmpty(input.supersedesRef) || input.supersedesRef === proposalVersionRef(input.proposalId, input.version)) {
      problems.push("supersedes");
    }
  }

  for (const refs of [input.targetRefs, input.requirementRefs, input.evidenceRefs]) {
    if (refs !== undefined && !refList(refs)) problems.push("refs");
  }
  if (knownRequirements.length > 0) {
    const unknown = [...new Set((input.requirementRefs ?? []).filter((r) => !knownRequirements.includes(r)))].sort();
    if (unknown.length > 0) problems.push("requirement-refs");
  }

  const category = input.risk?.category ?? "NONE";
  if (!PROTECTED_CATEGORIES.includes(category)) problems.push("risk-category");

  // A decision is required at the VOTE stage and forbidden everywhere else:
  // a recorded outcome is a fact about one stage, not a floating field.
  if (input.stage === DECIDED_STAGE) {
    const d = input.decision;
    if (!d || !nonEmpty(d.decisionRef) || !nonEmpty(d.decidedByRef) || !nonEmpty(d.outcome as unknown as string)) {
      problems.push("decision");
    } else {
      if (!DECISION_OUTCOMES.includes(d.outcome)) problems.push("decision");
      if (!isoTimestamp(d.decidedAt)) {
        problems.push("decision");
      } else if (isoTimestamp(input.createdAt) && Date.parse(d.decidedAt) < Date.parse(input.createdAt)) {
        // Decided before it existed: a temporal conflict, not a fact.
        problems.push("decision-temporal");
      }
    }
  } else if (input.decision !== undefined) {
    problems.push("decision");
  }

  const asRecord = input as unknown as Record<string, unknown>;
  if (carriesBannedField(asRecord)) problems.push("authority-field");
  for (const text of [input.title, input.rationale, input.scope, input.proposerRef, input.decision?.decisionRef, input.decision?.decidedByRef]) {
    if (typeof text === "string" && carriesSecretValue(text)) problems.push("raw-secret");
  }

  return [...new Set(problems)].sort() as ProposalProblem[];
}

function canonical(record: ProposalRecord): string {
  return JSON.stringify(record);
}

/**
 * Register a proposal into an existing record list. Pure: returns the new
 * list alongside the outcome and never mutates its inputs.
 *
 * Registration semantics follow the P16 invention registry:
 *   - same id + same version + same content -> identical (idempotent)
 *   - same id + same version + different content -> conflict
 *   - same id + higher version -> registered as an amendment; the prior
 *     version is retained untouched (amendment is not silent overwrite)
 *
 * Nothing here applies, approves, authorizes or executes anything.
 */
export function registerProposal(
  records: readonly ProposalRecord[],
  input: ProposalInput,
  knownRequirements: readonly string[] = [],
): { records: ProposalRecord[]; outcome: RegisterProposalOutcome } {
  const record = buildProposal(input);
  const problems = validateProposal(input, knownRequirements);
  if (problems.length > 0) {
    return {
      records: [...records],
      outcome: { status: "rejected", proposalId: String(input.proposalId ?? ""), reason: `invalid proposal: ${problems.join(",")}` },
    };
  }
  const sameVersion = records.filter((r) => r.proposalId === record.proposalId && r.version === record.version);
  if (sameVersion.length > 0) {
    const existing = sameVersion[0]!;
    if (canonical(existing) === canonical(record)) {
      return { records: [...records], outcome: { status: "identical", record: existing } };
    }
    return {
      records: [...records],
      outcome: {
        status: "conflict",
        proposalId: record.proposalId,
        reason: `proposal ${proposalVersionRef(record.proposalId, record.version)} already recorded with different content; governance history is immutable`,
      },
    };
  }
  const higherVersion = records.some((r) => r.proposalId === record.proposalId && r.version > record.version);
  if (higherVersion) {
    return {
      records: [...records],
      outcome: {
        status: "conflict",
        proposalId: record.proposalId,
        reason: `proposal ${record.proposalId} already has a later version; an amendment may not move backwards`,
      },
    };
  }
  return { records: [...records, record], outcome: { status: "registered", record } };
}

/**
 * The recorded decision, or an honest "no decision recorded". Absence of a
 * decision is never read as approval.
 */
export function proposalDecision(record: ProposalRecord): ProposalDecision | "NO_DECISION_RECORDED" {
  return record.decision ?? "NO_DECISION_RECORDED";
}

function clone(record: ProposalRecord): ProposalRecord {
  return JSON.parse(JSON.stringify(record)) as ProposalRecord;
}

/** Deterministic total order: proposalId, then version. */
function compareProposals(a: ProposalRecord, b: ProposalRecord): number {
  if (a.proposalId !== b.proposalId) return a.proposalId < b.proposalId ? -1 : 1;
  return a.version - b.version;
}

/** All records, deterministic by proposalId then version, deep-copied. */
export function listProposals(records: readonly ProposalRecord[]): ProposalRecord[] {
  return [...records].sort(compareProposals).map(clone);
}

export function proposalsByStage(records: readonly ProposalRecord[], stage: ProposalStage): ProposalRecord[] {
  return listProposals(records).filter((r) => r.stage === stage);
}

export function proposalsByProposer(records: readonly ProposalRecord[], proposerRef: string): ProposalRecord[] {
  return listProposals(records).filter((r) => r.proposerRef === proposerRef);
}

export function proposalsByRequirement(records: readonly ProposalRecord[], requirementId: string): ProposalRecord[] {
  return listProposals(records).filter((r) => r.requirementRefs.includes(requirementId));
}

export function proposalsByTarget(records: readonly ProposalRecord[], targetRef: string): ProposalRecord[] {
  return listProposals(records).filter((r) => r.targetRefs.includes(targetRef));
}

export function proposalsByEvidence(records: readonly ProposalRecord[], evidenceRef: string): ProposalRecord[] {
  return listProposals(records).filter((r) => r.evidenceRefs.includes(evidenceRef));
}

export function proposalsByProtectedCategory(
  records: readonly ProposalRecord[],
  category: ProtectedCategory,
): ProposalRecord[] {
  return listProposals(records).filter((r) => r.risk.category === category);
}

/**
 * The amendment chain for a proposal, oldest version first. Prior
 * revisions are retained, never deleted: governance history is evidence.
 */
export function supersessionChain(records: readonly ProposalRecord[], proposalId: string): ProposalRecord[] {
  return listProposals(records).filter((r) => r.proposalId === proposalId);
}

/**
 * Durable governance proposals over the shared owned-state store. Same
 * discipline as StewardReportStore / CohortReviewStore: integrity hashes,
 * optimistic concurrency, createdAt preserved across revisions, and
 * id/version drift rejected on update. Rejected, withdrawn and superseded
 * proposals are never removed by this store.
 */
export class ProposalStore {
  private readonly store: OwnedStore;
  private readonly owner: string;

  constructor(store: OwnedStore, owner: string) {
    this.store = store;
    this.owner = owner;
  }

  save(record: ProposalRecord, options: { actor?: string; source?: string } = {}): ProposalRecord {
    const problems = validateProposal(record, []);
    if (problems.length > 0) {
      throw new StateError(
        "STATE_VALIDATION_FAILED",
        `invalid proposal ${record.proposalId}@${record.version}: ${problems.join(",")}`,
      );
    }
    const id = proposalStateId(record.proposalId, record.version);
    let recordVersion = 1;
    let createdAt = record.createdAt;
    if (this.store.exists(id)) {
      const current = this.store.load<ProposalRecord>(id);
      if (current.payload.proposalId !== record.proposalId || current.payload.version !== record.version) {
        throw new StateError(
          "STATE_VALIDATION_FAILED",
          `proposal ${id} identity mismatch on update`,
        );
      }
      recordVersion = current.recordVersion + 1;
      createdAt = current.createdAt;
    }
    const envelope: StateEnvelope<ProposalRecord> = {
      id,
      kind: KIND,
      schemaVersion: SCHEMA,
      recordVersion,
      createdAt,
      updatedAt: record.createdAt,
      owner: this.owner,
      provenance: PROPOSAL_PROVENANCE,
      sensitivity: "USER",
      integrity: "",
      payload: record,
    };
    this.store.save(envelope, {
      expectedRecordVersion: recordVersion === 1 ? undefined : recordVersion - 1,
      causedBy: { actor: options.actor ?? "governance", source: options.source ?? "governance.proposal-store" },
    });
    return record;
  }

  load(id: string): ProposalRecord {
    const envelope = this.store.load<ProposalRecord>(id);
    if (envelope.kind !== KIND) {
      throw new StateError("STATE_MALFORMED", `record ${id} is not a governance proposal`);
    }
    return envelope.payload;
  }

  listIds(prefix = "gov-"): string[] {
    const withList = this.store as OwnedStore & { listIds?: (p?: string) => string[] };
    if (typeof withList.listIds === "function") {
      return withList.listIds(prefix);
    }
    return [];
  }
}
