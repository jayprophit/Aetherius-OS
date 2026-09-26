import type { EventEnvelope } from "../events/envelope";

/**
 * REQ-p19-online-eval: online trace-correlation evaluation.
 *
 * The registered requirement is the scope authority:
 *
 *   "Full request-to-artifact trace correlation (reflex/context/model/skill/
 *    workflow/worker/policy/approval/action/verification) with token/cost
 *    accounting and an eval runner; vendor-neutral, no external
 *    observability dependency."
 *
 * The registered evidence says it plainly: "per-leg traces exist, no joined
 * evaluation". So the gap is the JOIN plus the accounting and the runner, not
 * the individual legs.
 *
 * VENDOR-NEUTRAL BY CONSTRUCTION. Correlation here is built on this
 * repository's own `EventEnvelope` (`correlationId`, `causationId`,
 * `occurredAt`), not on OpenTelemetry, Jaeger, Datadog or any external
 * observability dependency. There is no such dependency in package.json and
 * none is added.
 *
 * Distinctions this module exists to hold:
 *
 *   CORRELATION      != CAUSATION
 *   EVENT OCCURRED   != EVENT EVIDENCE PASSED
 *   LEG UNRECORDED   != LEG DID NOT RUN
 *   LEG UNRECORDED   != LEG PASSED
 *   NO TOKENIZER     != ZERO TOKENS
 *   NO COST SOURCE   != ZERO COST
 *   OBSERVED COST    != INVOICED COST
 *   TRACE PRESENT    != TRACE COMPLETE
 *   ONLINE EVAL      != TRAINING
 *   ONLINE EVAL      != AUTOMATIC SELF-MODIFICATION
 *   CORRELATION      != CAUSATION-BACKED PERFORMANCE CLAIM
 */

/**
 * The ten legs the registered requirement names. These are TRACE LEGS, not
 * `EventDomain` values: `EventDomain` has exactly five members
 * (scheduler/realtime/workflow/steward/bridge) and is NOT widened here.
 */
export const TRACE_LEGS = [
  "reflex",
  "context",
  "model",
  "skill",
  "workflow",
  "worker",
  "policy",
  "approval",
  "action",
  "verification",
] as const;
export type TraceLeg = (typeof TRACE_LEGS)[number];

/** How a leg was accounted for in a joined trace. */
export const LEG_STATES = ["OBSERVED", "UNRECORDED"] as const;
export type LegState = (typeof LEG_STATES)[number];

export interface LegCoverage {
  leg: TraceLeg;
  state: LegState;
  /** Envelopes attributed to this leg. Empty when UNRECORDED. */
  eventIds: string[];
  /** Required when UNRECORDED: the leg was not seen, which is not a verdict. */
  reason?: string;
}

export type AccountingState = "OBSERVED" | "UNAVAILABLE";

export interface TokenCostAccounting {
  tokens: number | null;
  tokensState: AccountingState;
  tokensSource?: string;
  cost: number | null;
  costState: AccountingState;
  costSource?: string;
  /**
   * Required when either is UNAVAILABLE. There is NO tokenizer runtime in
   * this repository, so an exact token count cannot be derived here, and an
   * absent cost source is not a zero cost.
   */
  reason?: string;
}

export interface TraceCorrelation {
  correlationId: string;
  legs: LegCoverage[];
  /** Envelopes in the trace, ordered by occurredAt then eventId. */
  eventIds: string[];
  /**
   * Direct causation edges, taken from `causationId` ONLY. A correlation
   * group is not a causal chain: most traces have no complete causal path.
   */
  causationEdges: { from: string; to: string }[];
  /** True when at least one leg was not recorded. */
  incomplete: boolean;
  accounting: TokenCostAccounting;
  provenance: string;
}

export type TraceProblem =
  | "correlation-id"
  | "envelope"
  | "event-id"
  | "leg"
  | "tokens"
  | "cost"
  | "accounting"
  | "provenance"
  | "unknown-field";

const TRACE_PROVENANCE = "p19-online-eval";
const ALLOWED_INPUT_KEYS: ReadonlySet<string> = new Set([
  "correlationId",
  "envelopes",
  "accounting",
  "provenance",
]);
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Real comparator (never a factory): a factory passed to sort yields NaN. */
function compareEnvelopes(a: EventEnvelope, b: EventEnvelope): number {
  return a.occurredAt - b.occurredAt || compareStrings(a.eventId, b.eventId);
}

/**
 * How a trace domain maps onto the requirement's legs.
 *
 * `EventDomain` cannot express all ten legs, so an explicit, visible mapping
 * is used rather than pretending the five domains cover ten legs. A `null`
 * entry means the leg has NO envelope source today and is therefore
 * UNRECORDED, never silently absent.
 */
const DOMAIN_TO_LEGS: Readonly<Record<string, readonly TraceLeg[]>> = {
  workflow: ["workflow", "approval", "verification"],
  steward: ["policy", "action"],
  scheduler: ["worker"],
  realtime: ["context"],
  bridge: ["model"],
};

/** The leg kind is carried in the eventType, since EventDomain is too coarse. */
const EVENT_TYPE_TO_LEG: ReadonlyArray<readonly [RegExp, TraceLeg]> = [
  [/^reflex:/, "reflex"],
  [/^context:/, "context"],
  [/^model:/, "model"],
  [/^skill:/, "skill"],
  [/^workflow:/, "workflow"],
  [/^worker:/, "worker"],
  [/^policy:/, "policy"],
  [/^approval:/, "approval"],
  [/^action:/, "action"],
  [/^verification:/, "verification"],
];

/**
 * Derive the trace legs an envelope belongs to. The eventType prefix is
 * authoritative when it names a leg; otherwise the domain mapping applies.
 * An envelope that maps to nothing is reported as such rather than being
 * assigned a default leg.
 */
export function legsForEnvelope(envelope: EventEnvelope): TraceLeg[] {
  for (const [pattern, leg] of EVENT_TYPE_TO_LEG) {
    if (pattern.test(envelope.eventType)) return [leg];
  }
  return [...(DOMAIN_TO_LEGS[envelope.domain] ?? [])];
}

export interface AccountingInput {
  tokens?: number | null;
  tokensSource?: string;
  cost?: number | null;
  costSource?: string;
  reason?: string;
}

/**
 * Normalise token/cost accounting. Both are OBSERVED only when a value AND a
 * source are supplied: an un-sourced number is not an observation.
 *
 * There is no tokenizer runtime anywhere in this repository (the only
 * executable-tokenizer seam is the `TokenizerRuntime` interface in
 * src/context/budget.ts, which nothing implements), so an exact token count
 * can only come from the caller. NO TOKENIZER != ZERO TOKENS.
 */
export function normalizeAccounting(input: AccountingInput | undefined): TokenCostAccounting {
  const tokens = input?.tokens ?? null;
  const cost = input?.cost ?? null;
  // A number without a source is not an observation, so validity requires
  // BOTH a finite non-negative value AND a named source.
  const tokensSourced = typeof tokens === "number" && Number.isFinite(tokens) && tokens >= 0 && nonEmpty(input?.tokensSource);
  const costSourced = typeof cost === "number" && Number.isFinite(cost) && cost >= 0 && nonEmpty(input?.costSource);
  const reasons: string[] = [];
  if (tokens === null) {
    reasons.push(
      "token count is UNAVAILABLE: no tokenizer runtime exists in this repository, so counts are caller-supplied or absent, never estimated from a model name",
    );
  } else if (!tokensSourced) {
    reasons.push("token count was supplied without a source; an un-sourced number is not an observation");
  }
  if (cost === null) {
    reasons.push("cost is UNAVAILABLE: no invoice or rate source was supplied, and an absent source is not a zero cost");
  } else if (!costSourced) {
    reasons.push("cost was supplied without a source; an un-sourced amount is not an observation");
  }
  return {
    tokens: tokensSourced ? tokens : null,
    tokensState: tokensSourced ? "OBSERVED" : "UNAVAILABLE",
    ...(tokensSourced ? { tokensSource: input!.tokensSource! } : {}),
    cost: costSourced ? cost : null,
    costState: costSourced ? "OBSERVED" : "UNAVAILABLE",
    ...(costSourced ? { costSource: input!.costSource! } : {}),
    ...(reasons.length > 0 ? { reason: reasons.sort(compareStrings).join("; ") } : {}),
  };
}

function validate(input: {
  correlationId: string;
  envelopes: readonly EventEnvelope[];
  accounting?: AccountingInput;
  provenance?: string;
}): TraceProblem[] {
  const problems: TraceProblem[] = [];
  for (const key of Object.keys(input ?? {})) {
    if (!ALLOWED_INPUT_KEYS.has(key)) problems.push("unknown-field");
  }
  if (!nonEmpty(input?.correlationId)) problems.push("correlation-id");
  if (!Array.isArray(input?.envelopes)) problems.push("envelope");
  else {
    const ids = input.envelopes.map((e) => e?.eventId);
    if (ids.some((id) => !nonEmpty(id))) problems.push("event-id");
    if (new Set(ids).size !== ids.length) problems.push("event-id");
  }
  if (!nonEmpty(input?.provenance ?? TRACE_PROVENANCE)) problems.push("provenance");
  return [...new Set(problems)].sort() as TraceProblem[];
}

/**
 * Join a correlation group into one trace.
 *
 * Only envelopes carrying the SAME `correlationId` are joined. Envelopes are
 * never assigned to a group they do not name, and a `correlationId` is
 * never invented for an envelope that lacks one.
 */
export function correlateTrace(input: {
  correlationId: string;
  envelopes: readonly EventEnvelope[];
  accounting?: AccountingInput;
  provenance?: string;
}): TraceCorrelation {
  const problems = validate(input);
  if (problems.length > 0) {
    throw new Error(`invalid trace ${String(input?.correlationId)}: ${problems.join(",")}`);
  }
  const members = input.envelopes
    .filter((e) => e.correlationId === input.correlationId)
    .sort(compareEnvelopes);

  const byLeg = new Map<TraceLeg, string[]>(TRACE_LEGS.map((l) => [l, []]));
  for (const envelope of members) {
    for (const leg of legsForEnvelope(envelope)) byLeg.get(leg)!.push(envelope.eventId);
  }
  const legs: LegCoverage[] = TRACE_LEGS.map((leg) => {
    const eventIds = [...(byLeg.get(leg) ?? [])].sort(compareStrings);
    return eventIds.length > 0
      ? { leg, state: "OBSERVED" as const, eventIds }
      : {
          leg,
          state: "UNRECORDED" as const,
          eventIds,
          reason: "no envelope in this correlation group names this leg; unrecorded is not evidence that the leg did not run",
        };
  });

  // Causation comes from causationId ONLY. A correlation group is not a
  // causal chain, so this list is usually short or empty.
  const present = new Set(members.map((e) => e.eventId));
  const causationEdges = members
    .filter((e) => e.causationId !== undefined && present.has(e.causationId))
    .map((e) => ({ from: e.causationId!, to: e.eventId }))
    .sort((a, b) => compareStrings(a.from, b.from) || compareStrings(a.to, b.to));

  return {
    correlationId: input.correlationId,
    legs,
    eventIds: members.map((e) => e.eventId),
    causationEdges,
    incomplete: legs.some((l) => l.state === "UNRECORDED"),
    accounting: normalizeAccounting(input.accounting),
    provenance: input.provenance ?? TRACE_PROVENANCE,
  };
}

export interface TraceEvaluation {
  /** Sorted by correlationId, so evaluation order is deterministic. */
  traces: TraceCorrelation[];
  /** Per-leg coverage across all traces. Absence is counted, not hidden. */
  legCoverage: { leg: TraceLeg; observed: number; unrecorded: number }[];
  /** Traces where at least one leg was unrecorded. */
  incompleteTraces: string[];
  /**
   * Totals are reported ONLY for dimensions every trace observed. A dimension
   * observed in some traces and absent in others is UNAVAILABLE in aggregate,
   * because summing over a subset would understate it silently.
   */
  totals: { tokens: number | null; cost: number | null; traces: number };
  /** Always true. No composite performance figure is produced. */
  noCompositeScore: true;
  provenance: string;
}

/**
 * The eval runner: join, account for, and report coverage over a set of
 * traces. It produces NO score, NO ranking and NO causal performance claim —
 * ONLINE EVAL != TRAINING, and CORRELATION != CAUSATION.
 */
export function runTraceEvaluation(input: {
  traces: readonly TraceCorrelation[];
  provenance?: string;
}): TraceEvaluation {
  if (!Array.isArray(input?.traces)) {
    throw new Error("invalid trace evaluation: traces");
  }
  const traces = [...input.traces].sort((a, b) => compareStrings(a.correlationId, b.correlationId));
  const legCoverage = TRACE_LEGS.map((leg) => {
    let observed = 0;
    let unrecorded = 0;
    for (const trace of traces) {
      const coverage = trace.legs.find((l) => l.leg === leg)!;
      if (coverage.state === "OBSERVED") observed++;
      else unrecorded++;
    }
    return { leg, observed, unrecorded };
  });

  const everyTraceObservedTokens = traces.length > 0 && traces.every((t) => t.accounting.tokensState === "OBSERVED");
  const everyTraceObservedCost = traces.length > 0 && traces.every((t) => t.accounting.costState === "OBSERVED");
  return {
    traces,
    legCoverage,
    incompleteTraces: traces.filter((t) => t.incomplete).map((t) => t.correlationId),
    totals: {
      // Summing only over the traces that observed a dimension would silently
      // understate it, so a partial dimension is UNAVAILABLE, not a subtotal.
      tokens: everyTraceObservedTokens
        ? traces.reduce((sum, t) => sum + (t.accounting.tokens ?? 0), 0)
        : null,
      cost: everyTraceObservedCost ? traces.reduce((sum, t) => sum + (t.accounting.cost ?? 0), 0) : null,
      traces: traces.length,
    },
    noCompositeScore: true,
    provenance: input.provenance ?? TRACE_PROVENANCE,
  };
}

/** Re-exported for callers that build envelopes; the type is the source's. */
export type { EventEnvelope };
export { ISO_RE as TRACE_EVAL_ISO_RE };
