import { LAYERS, type LayerId, type LayerResult } from "./layers";
import { budgetContext, type TokenBudgetReport, type TokenizerRuntime } from "./budget";

/**
 * REQ-p26-context-compiler: context compiler over L0–L7.
 *
 * The registered requirement is the scope authority:
 *
 *   "Assemble/collapse resolved L0-L7 layers under budget into skill-ready
 *    context (rules into skills, dedup, prioritization); retrieval policy
 *    exists, compilation does not."
 *
 * The input is RESOLVED layers — `resolveLayers()` output — which selects but
 * never compiles. This module is the missing compilation step, and only that:
 *
 *   RESOLVED LAYERS (layers.ts) + BUDGET (budget.ts) -> COMPILED CONTEXT (here)
 *   CONTEXT LAYERS != CONTEXT COMPILER
 *   BUDGET CALCULATION != CONTEXT COMPILATION
 *
 * Nothing here re-resolves layers, recomputes budgets, or duplicates either
 * owner. `budgetContext()` is CALLED for measurement and enforcement — never
 * reimplemented — and `resolveLayers()` output is consumed through a
 * mechanical adapter, never re-derived:
 *
 *   NO ContextLayer2, NO TokenBudget2, NO ReviewContextPack2, NO EvidenceGraph2
 *
 * ASSEMBLE means: flatten resolved layer items into typed units in canonical
 * layer order (L0→L7), each carrying its provenance and source identity.
 * COLLAPSE means: deduplicate by canonical identity and fit under budget by
 * dropping the lowest-priority optional units first. REQUIRED items are never
 * displaced by optional ones:
 *
 *   MORE CONTEXT != BETTER CONTEXT
 *   REQUIRED CONTEXT DOES NOT FIT != SUCCESSFUL COMPILATION
 *
 * RULES INTO SKILLS is explicit, never inferred. A candidate carrying an
 * explicit `skillRef` naming a present skill unit is attached beneath it; a
 * candidate without one stays in layer flow. No relevance is guessed:
 *
 *   EXPLICIT skillRef != INFERRED RELEVANCE
 *
 * DEDUP keys on canonical identity (sourceRef) or exact text — never on
 * similarity. Same text from different sources stays as two units
 * (SAME TEXT != SAME SOURCE); contradictions are never merged
 * (DUPLICATE != CONTRADICTION).
 *
 * SKILL-READY means the output is ordered units a skill consumer can walk:
 * skill units first within their layer position... no — skill-ready means
 * each unit declares its kind, layer, provenance, and source, with skill
 * units carrying their attached rules. Order stays canonical layer order;
 * position games are not played (CONTEXT POSITION != CONTENT VALUE — the
 * benchmark measures, this module does not set policy).
 *
 * BUDGET is enforced only with a real tokenizer runtime, via budgetContext.
 * Without one, compilation still happens (ordering and dedupe are real) but
 * budget accounting reports UNAVAILABLE — never an estimate, never zero:
 *
 *   UNKNOWN TOKEN COST != ZERO, NO TOKENIZER != DEFAULT TOKENIZER
 *   TOKENIZER PROFILE != TOKENIZER RUNTIME (a profile is refused as a runtime
 *     by budgetContext itself; this module passes tokenizer through untouched)
 *
 * OVER_BUDGET is reported honestly: omitted optionals are listed, required
 * items that cannot fit are listed as unresolvedRequired, and no success is
 * manufactured. Truncation, where it happens, is item-boundary with the
 * omission recorded: TRUNCATED != COMPLETE.
 *
 * PROVENANCE SURVIVES: every unit keeps its source identity and provenance;
 * epistemic status on MAT-sourced items rides through untouched
 * (RETRIEVED != ENDORSED, INCLUDED != VERIFIED TRUE). Compressed content is
 * never sourceless — and this compiler performs no lossy summarization at
 * all (COMPRESSION != HALLUCINATED SUMMARY is satisfied by absence: units
 * carry source text verbatim).
 *
 * WHAT THIS IS NOT: no model invocation, no tool execution, no retrieval
 * side effects (COMPILATION != RETRIEVAL SIDE EFFECT; offline-first), no
 * memory writes (CONTEXT OUTPUT != MEMORY WRITE — the
 * REQ-memory-integrity-boundary gate is never approached), no authorization
 * decisions (RELEVANT != AUTHORIZED; retrieved instruction text stays DATA,
 * never policy), no escalation decisions, no P25 duplication.
 *
 * MAT items arrive as caller-provided records/refs. Nothing here imports MAT
 * internals or copies MAT stores.
 *
 * Deterministic throughout: canonical ordering, explicit id tie-breaks,
 * scrambled-input equality, no caller mutation, no clock, no network.
 */

export type CandidateKind = "skill" | "rule" | "reference" | "text";

export interface CompileCandidate {
  id: string;
  layer: LayerId;
  kind: CandidateKind;
  text: string;
  provenance: string;
  /** Canonical identity for dedupe. Absent means the exact text is the key. */
  sourceRef?: string;
  /** Explicit attribution to a skill unit. Never inferred. */
  skillRef?: string;
  /** Required units are never displaced by optional ones. */
  required: boolean;
  /** Higher keeps first. Finite number; ties break by id. */
  priority: number;
  /** Carried through untouched when present (e.g. MAT epistemic status). */
  epistemicStatus?: string;
}

export interface CompileBudget {
  advertisedLimit: number;
  outputReserve?: number;
  fixedOverhead?: number;
  /** Executable runtime or null. Profiles are not runtimes; absence is honest. */
  tokenizer?: TokenizerRuntime | null;
}

export interface CompileInput {
  taskId: string;
  candidates: CompileCandidate[];
  budget: CompileBudget;
  provenance: string;
}

export interface CompiledUnit {
  unitId: string;
  layer: LayerId;
  kind: CandidateKind;
  text: string;
  provenance: string;
  sourceRef?: string;
  required: boolean;
  priority: number;
  epistemicStatus?: string;
  /** Rules explicitly attributed to this skill unit, in canonical order. */
  attachedRules: CompiledUnit[];
}

export interface OmittedUnit {
  id: string;
  reason: "DUPLICATE" | "OVER_BUDGET";
}

export type CompileStatus = "COMPILED" | "OVER_BUDGET";

export interface CompileReport {
  taskId: string;
  status: CompileStatus;
  units: CompiledUnit[];
  omitted: OmittedUnit[];
  /** Required ids that could not fit. Empty means every required unit fit. */
  unresolvedRequired: string[];
  /** The budget module's own report over the compiled text. */
  budget: TokenBudgetReport;
  provenance: string;
}

export type CompilerProblemCode =
  | "COMPILER_INVALID_INPUT"
  | "COMPILER_UNKNOWN_FIELD"
  | "COMPILER_AUTHORITY_REJECTED"
  | "COMPILER_SECRET_REJECTED"
  | "COMPILER_PERSONALITY_REJECTED"
  | "COMPILER_DUPLICATE_ID"
  | "COMPILER_UNKNOWN_LAYER"
  | "COMPILER_BAD_PRIORITY";

export class CompilerError extends Error {
  readonly code: CompilerProblemCode;
  constructor(code: CompilerProblemCode, message: string) {
    super(message);
    this.name = "CompilerError";
    this.code = code;
  }
}

const CANDIDATE_FIELDS = [
  "id", "layer", "kind", "text", "provenance", "sourceRef",
  "skillRef", "required", "priority", "epistemicStatus",
] as const;

const INPUT_FIELDS = ["taskId", "candidates", "budget", "provenance"] as const;
const BUDGET_FIELDS = ["advertisedLimit", "outputReserve", "fixedOverhead", "tokenizer"] as const;
const KINDS: readonly CandidateKind[] = ["skill", "rule", "reference", "text"];

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "canDeploy", "permission",
  "permissionGranted", "grantApproved", "policyBypass", "ownerOverride",
  "mergeAuthority", "grant", "clearance",
];

const SECRET_KEYS = ["apiKey", "secret", "token", "password", "privateKey", "credential"];

const PERSONALITY_KEYS = [
  "personality", "persona", "traits", "backstory", "biography",
  "autobiography", "identity", "dna", "soul", "selfModel",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Security-significant violations are diagnosed BEFORE generic shape errors,
 * so a smuggled grant is reported as itself and never disappears into an
 * unknown-field complaint.
 */
function assertNoViolations(value: unknown, path: string, seen: Set<unknown>): void {
  if (seen.has(value) || typeof value !== "object" || value === null) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoViolations(item, `${path}[${index}]`, seen));
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (AUTHORITY_KEYS.includes(key)) {
      throw new CompilerError("COMPILER_AUTHORITY_REJECTED", `${path}.${key}: compilation never carries authority`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new CompilerError("COMPILER_SECRET_REJECTED", `${path}.${key}: SECRET REF != SECRET VALUE`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new CompilerError("COMPILER_PERSONALITY_REJECTED", `${path}.${key}: a context candidate carries no stored person`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

function assertCandidate(value: unknown, index: number): CompileCandidate {
  if (!isPlainObject(value)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", `candidates[${index}] must be an object`);
  }
  assertNoViolations(value, `candidates[${index}]`, new Set());
  for (const key of Object.keys(value)) {
    if (!(CANDIDATE_FIELDS as readonly string[]).includes(key)) {
      throw new CompilerError("COMPILER_UNKNOWN_FIELD", `unknown candidate field ${key}`);
    }
  }
  if (!nonEmpty(value.id)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", `candidates[${index}] needs a non-empty id`);
  }
  if (!LAYERS.includes(value.layer as LayerId)) {
    throw new CompilerError("COMPILER_UNKNOWN_LAYER", `candidates[${index}] names unknown layer ${String(value.layer)}`);
  }
  if (!KINDS.includes(value.kind as CandidateKind)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", `candidates[${index}] kind must be one of ${KINDS.join(", ")}`);
  }
  if (typeof value.text !== "string" || value.text.length === 0) {
    throw new CompilerError("COMPILER_INVALID_INPUT", `candidates[${index}] text must be a non-empty string`);
  }
  if (!nonEmpty(value.provenance)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", `candidates[${index}] provenance must be a non-empty string`);
  }
  if (value.sourceRef !== undefined && !nonEmpty(value.sourceRef)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", `candidates[${index}] sourceRef must be non-empty when present`);
  }
  if (value.skillRef !== undefined && !nonEmpty(value.skillRef)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", `candidates[${index}] skillRef must be non-empty when present`);
  }
  if (typeof value.required !== "boolean") {
    throw new CompilerError("COMPILER_INVALID_INPUT", `candidates[${index}] required must be an explicit boolean`);
  }
  if (typeof value.priority !== "number" || !Number.isFinite(value.priority)) {
    throw new CompilerError("COMPILER_BAD_PRIORITY", `candidates[${index}] priority must be a finite number`);
  }
  if (value.epistemicStatus !== undefined && !nonEmpty(value.epistemicStatus)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", `candidates[${index}] epistemicStatus must be non-empty when present`);
  }
  return {
    id: value.id,
    layer: value.layer as LayerId,
    kind: value.kind as CandidateKind,
    text: value.text,
    provenance: value.provenance,
    ...(value.sourceRef === undefined ? {} : { sourceRef: value.sourceRef as string }),
    ...(value.skillRef === undefined ? {} : { skillRef: value.skillRef as string }),
    required: value.required,
    priority: value.priority,
    ...(value.epistemicStatus === undefined ? {} : { epistemicStatus: value.epistemicStatus as string }),
  };
}

/** Canonical rank: required first, then priority desc, then id asc. */
function rankCandidates(candidates: CompileCandidate[]): CompileCandidate[] {
  return [...candidates].sort((a, b) =>
    a.required !== b.required
      ? (a.required ? -1 : 1)
      : b.priority !== a.priority
        ? b.priority - a.priority
        : a.id < b.id ? -1 : 1,
  );
}

/** Dedupe key: canonical source identity, else the exact text. */
function dedupeKey(candidate: CompileCandidate): string {
  return candidate.sourceRef ?? `text:${candidate.text}`;
}

function toUnit(candidate: CompileCandidate): CompiledUnit {
  return {
    unitId: candidate.id,
    layer: candidate.layer,
    kind: candidate.kind,
    text: candidate.text,
    provenance: candidate.provenance,
    ...(candidate.sourceRef === undefined ? {} : { sourceRef: candidate.sourceRef }),
    required: candidate.required,
    priority: candidate.priority,
    ...(candidate.epistemicStatus === undefined ? {} : { epistemicStatus: candidate.epistemicStatus }),
    attachedRules: [],
  };
}

function serializeUnits(units: CompiledUnit[]): string {
  return JSON.stringify(units);
}

/**
 * Compile resolved-layer candidates into skill-ready context under budget.
 * Pure + deterministic: same task, candidates, and budget always yield the
 * same report. No clock, no network, no model calls, no memory writes.
 */
export function compileContext(input: unknown): CompileReport {
  if (!isPlainObject(input)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", "compile input must be an object");
  }
  assertNoViolations(input, "input", new Set());
  for (const key of Object.keys(input)) {
    if (!(INPUT_FIELDS as readonly string[]).includes(key)) {
      throw new CompilerError("COMPILER_UNKNOWN_FIELD", `unknown compile field ${key}`);
    }
  }
  if (!nonEmpty(input.taskId)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", "taskId must be a non-empty string");
  }
  if (!nonEmpty(input.provenance)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", "provenance must be a non-empty string");
  }
  if (!Array.isArray(input.candidates)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", "candidates must be an array");
  }
  const candidates = (input.candidates as unknown[]).map(assertCandidate);
  const ids = candidates.map((c) => c.id);
  if (new Set(ids).size !== ids.length) {
    throw new CompilerError("COMPILER_DUPLICATE_ID", "candidate ids must be unique within one compilation");
  }
  if (!isPlainObject(input.budget)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", "budget must be an object");
  }
  assertNoViolations(input.budget, "budget", new Set());
  for (const key of Object.keys(input.budget)) {
    if (!(BUDGET_FIELDS as readonly string[]).includes(key)) {
      throw new CompilerError("COMPILER_UNKNOWN_FIELD", `unknown budget field ${key}`);
    }
  }
  const budget = input.budget as Record<string, unknown>;
  if (typeof budget.advertisedLimit !== "number" || !Number.isInteger(budget.advertisedLimit) || budget.advertisedLimit < 1) {
    throw new CompilerError("COMPILER_INVALID_INPUT", "budget.advertisedLimit must be a positive integer");
  }
  for (const key of ["outputReserve", "fixedOverhead"] as const) {
    const value = budget[key];
    if (value !== undefined && (typeof value !== "number" || !Number.isInteger(value) || value < 0)) {
      throw new CompilerError("COMPILER_INVALID_INPUT", `budget.${key} must be a non-negative integer when present`);
    }
  }
  const tokenizer = budget.tokenizer === undefined || budget.tokenizer === null ? undefined : budget.tokenizer;
  const budgetBase = {
    advertisedLimit: budget.advertisedLimit as number,
    ...(budget.outputReserve === undefined ? {} : { outputReserve: budget.outputReserve as number }),
    ...(budget.fixedOverhead === undefined ? {} : { fixedOverhead: budget.fixedOverhead as number }),
  };

  // Dedupe in canonical rank order: the kept copy is deterministic, and every
  // dropped duplicate is recorded rather than silently vanishing.
  const omitted: OmittedUnit[] = [];
  const seenKeys = new Set<string>();
  const unique: CompileCandidate[] = [];
  for (const candidate of rankCandidates(candidates)) {
    const key = dedupeKey(candidate);
    if (seenKeys.has(key)) {
      omitted.push({ id: candidate.id, reason: "DUPLICATE" });
      continue;
    }
    seenKeys.add(key);
    unique.push(candidate);
  }

  // Rules into skills: explicit skillRef attribution only. A rule naming a
  // skill unit present in this compilation nests beneath it; anything else
  // stays in canonical flow. Nothing is inferred.
  const skillIds = new Set(unique.filter((c) => c.kind === "skill").map((c) => c.id));
  const attached = new Map<string, CompileCandidate[]>();
  const topLevel: CompileCandidate[] = [];
  for (const candidate of unique) {
    if (candidate.kind === "rule" && candidate.skillRef !== undefined && skillIds.has(candidate.skillRef)) {
      const list = attached.get(candidate.skillRef) ?? [];
      list.push(candidate);
      attached.set(candidate.skillRef, list);
    } else {
      topLevel.push(candidate);
    }
  }

  // Canonical flow order: layer order first (L0→L7), then rank within a layer.
  const layerIndex = (layer: LayerId): number => LAYERS.indexOf(layer);
  const ordered = [...topLevel].sort((a, b) =>
    layerIndex(a.layer) !== layerIndex(b.layer)
      ? layerIndex(a.layer) - layerIndex(b.layer)
      : a.required !== b.required
        ? (a.required ? -1 : 1)
        : b.priority !== a.priority
          ? b.priority - a.priority
          : a.id < b.id ? -1 : 1,
  );
  let units = ordered.map(toUnit);
  for (const unit of units) {
    const rules = attached.get(unit.unitId);
    if (unit.kind === "skill" && rules !== undefined) {
      unit.attachedRules = rankCandidates(rules).map(toUnit);
    }
  }

  const measure = (list: CompiledUnit[]): TokenBudgetReport =>
    budgetContext({
      ...budgetBase,
      layers: [],
      compiledText: serializeUnits(list),
      ...(tokenizer === undefined ? {} : { tokenizer: tokenizer as TokenizerRuntime }),
    });

  let report = measure(units);
  // Collapse under budget: drop the lowest-priority OPTIONAL units first.
  // Required units are never displaced; if they alone exceed, the compilation
  // reports OVER_BUDGET with the unresolved required ids named.
  if (tokenizer !== undefined && report.status === "EXCEEDS") {
    const droppable = (list: CompiledUnit[]): CompiledUnit[] =>
      [...list].sort((a, b) =>
        a.required !== b.required
          ? (a.required ? 1 : -1)
          : a.priority !== b.priority
            ? a.priority - b.priority
            : a.unitId > b.unitId ? -1 : 1,
      ).filter((u) => !u.required);
    let current = units;
    let dropped = droppable(current);
    while (dropped.length > 0 && report.status === "EXCEEDS") {
      const victim = dropped[0]!;
      omitted.push({ id: victim.unitId, reason: "OVER_BUDGET" });
      current = current.filter((u) => u.unitId !== victim.unitId);
      report = measure(current);
      dropped = droppable(current);
    }
    units = current;
  }

  const unresolvedRequired =
    tokenizer === undefined || report.status !== "EXCEEDS"
      ? []
      : units.filter((u) => u.required).map((u) => u.unitId).sort();
  return {
    taskId: input.taskId as string,
    status: unresolvedRequired.length === 0 ? "COMPILED" : "OVER_BUDGET",
    units,
    omitted: [...omitted].sort((a, b) => (a.id < b.id ? -1 : 1)),
    unresolvedRequired,
    budget: report,
    provenance: input.provenance as string,
  };
}

/**
 * Mechanical adapter: project resolveLayers() results into compile
 * candidates. Layer-appropriate kinds, source identity from explicit id
 * fields only, provenance naming the layer. No relevance judgment, no
 * rewriting — a projection, not a decision.
 */
export function candidatesFromLayers(results: LayerResult[]): CompileCandidate[] {
  if (!Array.isArray(results)) {
    throw new CompilerError("COMPILER_INVALID_INPUT", "layer results must be an array");
  }
  const candidates: CompileCandidate[] = [];
  for (const result of results) {
    if (!isPlainObject(result) || !LAYERS.includes((result as { layer?: LayerId }).layer as LayerId)) {
      throw new CompilerError("COMPILER_UNKNOWN_LAYER", "layer result names an unknown layer");
    }
    const layer = (result as { layer: LayerId }).layer;
    const items = Array.isArray((result as { items?: unknown }).items) ? (result as { items: unknown[] }).items : [];
    items.forEach((item, index) => {
      if (!isPlainObject(item)) {
        throw new CompilerError("COMPILER_INVALID_INPUT", `layer ${layer} item ${index} must be an object`);
      }
      const record = item as Record<string, unknown>;
      const sourceRef =
        typeof record.skillId === "string" && record.skillId.trim().length > 0 ? `skill:${record.skillId.trim()}`
        : typeof record.docId === "string" && record.docId.trim().length > 0 ? `doc:${record.docId.trim()}`
        : typeof record.path === "string" && record.path.trim().length > 0 ? `file:${record.path.trim()}`
        : typeof record.id === "string" && record.id.trim().length > 0 ? `record:${record.id.trim()}`
        : typeof record.taskId === "string" && record.taskId.trim().length > 0 ? `task:${record.taskId.trim()}`
        : typeof record.genesisId === "string" && record.genesisId.trim().length > 0 ? `identity:${record.genesisId.trim()}`
        : typeof record.projectId === "string" && record.projectId.trim().length > 0 ? `project:${record.projectId.trim()}`
        : undefined;
      candidates.push({
        id: `${layer}-${index}`,
        layer,
        kind: layer === "L3" ? "skill" : "reference",
        text: JSON.stringify(record),
        provenance: `context-layers:${layer}`,
        ...(sourceRef === undefined ? {} : { sourceRef }),
        required: false,
        priority: 0,
      });
    });
  }
  return candidates;
}
