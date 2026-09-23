import type { GenesisIdentityRef } from "./identity";

/**
 * REQ-p22-reflex-fabric: Genesis Reflex/System-1 typed decision fabric
 * (contracts + S0 deterministic layer).
 *
 * Layering (canonical):
 * - S0 deterministic reflex: exact rules, schemas, capability lookup,
 *   known algorithms, hard invariants. Never guesses; unresolved inputs
 *   return UNRESOLVED, never a fabricated decision.
 * - S1 reflex backends (probabilistic models, encoders, optional
 *   providers): plug into the ReflexBackend seam. GENESIS REFLEX != JEV;
 *   backends are replaceable, declared by id+version.
 *
 * Terminology discipline: outputs are SCHEMA-BOUNDED (a valid envelope
 * never claims semantic correctness). Confidence is data, never
 * authority: P25 remains the only authorizer.
 *
 * Reference: System-1/agentic-pattern research (STUDY_ONLY).
 */

export type DecisionKind =
  | "categorical"
  | "binary"
  | "ordinal"
  | "multilabel"
  | "rank"
  | "abstaining";

export interface CategoricalBody {
  kind: "categorical";
  labels: string[];
  selected: string;
  probabilities: number[];
}

export interface BinaryBody {
  kind: "binary";
  labels: [string, string];
  selected: string;
  probabilities: [number, number];
}

export interface OrdinalBody {
  kind: "ordinal";
  labels: string[];
  selectedIndex: number;
}

export interface MultiLabelBody {
  kind: "multilabel";
  labels: string[];
  selected: string[];
  probabilities: number[];
}

export interface RankBody {
  kind: "rank";
  ranking: string[];
}

export interface AbstainingBody {
  kind: "abstaining";
  abstainProbability: number;
  fallback: string;
}

export type DecisionBody =
  | CategoricalBody
  | BinaryBody
  | OrdinalBody
  | MultiLabelBody
  | RankBody
  | AbstainingBody;

export interface DecisionEnvelope {
  schemaVersion: "1";
  decisionId: string;
  taskType: string;
  inputFingerprint: string;
  body: DecisionBody;
  /** 0..1; high values mean the reflex declines to decide. Advisory only. */
  abstainProbability: number;
  calibrationId?: string;
  backend: string;
  backendVersion: string;
  latencyMs?: number;
  evidenceRefs: string[];
  provenance: string;
}

export type DecisionProblem =
  | "envelope-shape"
  | "probability-distribution"
  | "selection-consistency"
  | "abstain-range"
  | "labels-invalid";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validLabels(labels: unknown): labels is string[] {
  return (
    Array.isArray(labels) &&
    labels.length >= 2 &&
    labels.every(isNonEmptyString) &&
    new Set(labels.map((l) => (l as string).trim())).size === labels.length
  );
}

function validDistribution(probs: unknown, n: number): probs is number[] {
  if (!Array.isArray(probs) || probs.length !== n) return false;
  if (!probs.every((p) => typeof p === "number" && Number.isFinite(p) && p >= 0 && p <= 1)) return false;
  const sum = (probs as number[]).reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1) <= 1e-6;
}

/**
 * Validate a decision envelope structurally. Returns problems (empty =
 * schema-bounded). Semantic correctness is NEVER claimed here.
 */
export function validateDecisionEnvelope(envelope: DecisionEnvelope): DecisionProblem[] {
  const problems: DecisionProblem[] = [];
  if (!envelope || typeof envelope !== "object") return ["envelope-shape"];
  if (envelope.schemaVersion !== "1") problems.push("envelope-shape");
  for (const field of ["decisionId", "taskType", "inputFingerprint", "backend", "backendVersion", "provenance"] as const) {
    if (!isNonEmptyString(envelope[field])) problems.push("envelope-shape");
  }
  if (typeof envelope.abstainProbability !== "number" || !(envelope.abstainProbability >= 0 && envelope.abstainProbability <= 1)) {
    problems.push("abstain-range");
  }
  if (!Array.isArray(envelope.evidenceRefs)) problems.push("envelope-shape");
  const body = envelope.body as DecisionBody;
  if (!body || typeof body !== "object") {
    problems.push("envelope-shape");
    return [...new Set(problems)].sort() as DecisionProblem[];
  }
  switch (body.kind) {
    case "categorical": {
      if (!validLabels(body.labels)) problems.push("labels-invalid");
      else {
        if (!validDistribution(body.probabilities, body.labels.length)) problems.push("probability-distribution");
        if (!body.labels.includes(body.selected)) problems.push("selection-consistency");
      }
      break;
    }
    case "binary": {
      if (!validLabels([...body.labels])) problems.push("labels-invalid");
      else {
        if (!validDistribution([...body.probabilities], 2)) problems.push("probability-distribution");
        if (!body.labels.includes(body.selected)) problems.push("selection-consistency");
      }
      break;
    }
    case "ordinal": {
      if (!validLabels(body.labels)) problems.push("labels-invalid");
      else if (!Number.isInteger(body.selectedIndex) || body.selectedIndex < 0 || body.selectedIndex >= body.labels.length) {
        problems.push("selection-consistency");
      }
      break;
    }
    case "multilabel": {
      if (!validLabels(body.labels)) problems.push("labels-invalid");
      else {
        if (!validDistribution(body.probabilities, body.labels.length)) problems.push("probability-distribution");
        if (!body.selected.every((s) => body.labels.includes(s))) problems.push("selection-consistency");
      }
      break;
    }
    case "rank": {
      if (!validLabels(body.ranking)) problems.push("labels-invalid");
      break;
    }
    case "abstaining": {
      if (typeof body.abstainProbability !== "number" || !(body.abstainProbability >= 0 && body.abstainProbability <= 1)) {
        problems.push("abstain-range");
      }
      if (!isNonEmptyString(body.fallback)) problems.push("selection-consistency");
      break;
    }
    default:
      problems.push("envelope-shape");
  }
  return [...new Set(problems)].sort() as DecisionProblem[];
}

export interface ReflexInput {
  taskType: string;
  fingerprint: string;
  fields?: Record<string, string>;
}

export type DecisionOutcome =
  | { status: "decided"; envelope: DecisionEnvelope }
  | { status: "unresolved"; reason: string };

/**
 * Replaceable backend seam. S0 implements exact rules; future S1
 * backends (encoders, routers, small models, optional providers)
 * implement the same interface. Callers never depend on a backend kind.
 */
export interface ReflexBackend {
  readonly id: string;
  readonly version: string;
  decide(input: ReflexInput): DecisionOutcome;
}

export interface S0Rule {
  ruleId: string;
  taskType: string;
  /** Exact fingerprint match. */
  fingerprint?: string;
  /** Exact field equalities (all must hold). */
  fields?: Record<string, string>;
  decision: DecisionBody;
  evidenceRefs?: string[];
}

/**
 * S0 deterministic reflex: first matching rule wins; no match returns
 * UNRESOLVED with the reason (never a guess). Rule order is the priority.
 */
export class S0RulesBackend implements ReflexBackend {
  readonly id = "deterministic-rules";
  readonly version = "1.0.0";
  private readonly rules: S0Rule[];
  private seq = 0;

  constructor(rules: S0Rule[]) {
    const ids = new Set<string>();
    for (const rule of rules) {
      if (!rule.ruleId.trim() || !rule.taskType.trim()) {
        throw new Error("S0 rules require ruleId and taskType");
      }
      if (ids.has(rule.ruleId)) throw new Error(`duplicate S0 rule ${rule.ruleId}`);
      ids.add(rule.ruleId);
      const problems = validateDecisionEnvelope({
        schemaVersion: "1",
        decisionId: "rule-check",
        taskType: rule.taskType,
        inputFingerprint: "rule-check",
        body: rule.decision,
        abstainProbability: 0,
        backend: this.id,
        backendVersion: this.version,
        evidenceRefs: [],
        provenance: "s0-rule-check",
      });
      if (problems.length > 0) {
        throw new Error(`S0 rule ${rule.ruleId} carries an invalid decision: ${problems.join(",")}`);
      }
    }
    this.rules = [...rules];
  }

  decide(input: ReflexInput): DecisionOutcome {
    if (!input.taskType.trim() || !input.fingerprint.trim()) {
      return { status: "unresolved", reason: "taskType and fingerprint are required" };
    }
    for (const rule of this.rules) {
      if (rule.taskType !== input.taskType) continue;
      if (rule.fingerprint !== undefined && rule.fingerprint !== input.fingerprint) continue;
      if (rule.fields !== undefined) {
        const fields = input.fields ?? {};
        let match = true;
        for (const [key, value] of Object.entries(rule.fields)) {
          if (fields[key] !== value) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }
      this.seq += 1;
      return {
        status: "decided",
        envelope: {
          schemaVersion: "1",
          decisionId: `${rule.ruleId}#${this.seq}`,
          taskType: input.taskType,
          inputFingerprint: input.fingerprint,
          body: rule.decision,
          abstainProbability: 0,
          backend: this.id,
          backendVersion: this.version,
          evidenceRefs: [...(rule.evidenceRefs ?? [])],
          provenance: `s0:${rule.ruleId}`,
        },
      };
    }
    return { status: "unresolved", reason: `no S0 rule matches ${input.taskType}/${input.fingerprint}` };
  }
}

/** Genesis binding note: reflex outputs reference the one Genesis, never mint identity. */
export function reflexGenesis(genesis: GenesisIdentityRef): string {
  return genesis.genesisId;
}
