import type { LogEvent, Subscriber } from "../realtime/types";
import type { RealtimeTransport } from "../realtime/transport";

/**
 * REQ-p23-work-monitoring: work monitoring fabric.
 *
 * The registered requirement is the scope authority:
 *
 *   "Continuous monitoring composing summarize/inspect/observer over P27
 *    transport: subscribe, progress stream, alerts, thresholds; snapshots and
 *    append-only logs exist, streaming/alerting join absent."
 *
 * The gap is exactly the JOIN: subscribe + progress stream + alerts +
 * thresholds, composed from three things that already exist and are owned
 * elsewhere —
 *
 *   summarize  -> WorkflowRuntime.summarize(runId)   (workflows, P19)
 *   inspect    -> Scheduler.inspect(nowMs)            (scheduler)
 *   transport  -> RealtimeTransport over P27          (realtime)
 *
 * None of the three is reimplemented, wrapped, or shadowed here:
 *
 *   COMPOSE SUMMARIZE/INSPECT/OBSERVER; DUPLICATE NOTHING
 *   OBSERVE ORCHESTRATOR != BECOME ORCHESTRATOR
 *
 * THE FABRIC IS STATELESS. A subscription is a validated record the caller
 * holds; there is no subscription store, no daemon, no polling loop, no timer,
 * no watcher. Delivery flows through the transport's own handlers and backlog;
 * this module only pulls, projects, and evaluates:
 *
 *   MONITORING VIEW != CANONICAL STATE STORE
 *   NO SECOND REGISTRY, NO SECOND ORCHESTRATOR
 *   NO HIDDEN POLLING LOOP
 *
 * MONITORING OBSERVES; IT OWNS NOTHING. Statuses come from the projections and
 * are never inferred from silence. In particular:
 *
 *   MONITORING != EXECUTION / ORCHESTRATION / AUTHORIZATION / SCHEDULING
 *   MONITORING STATUS != COMPLETION VERDICT / COMPLETION GATE
 *   NOT RUNNING != COMPLETE
 *   NO NEW EVENTS != COMPLETE
 *   CHECKPOINT EXISTS != WORK HEALTHY / RECOVERY SUCCEEDED
 *   NO RECENT HEARTBEAT != PROVEN DEAD (no liveness verdicts are drawn here)
 *   RESULT EXISTS != VERIFIED COMPLETION
 *   WORKER CLAIM != EVIDENCE
 *
 * Unknown stays unknown: a subject with no summary, a channel with no events,
 * and a resolver-less alert rule all surface as explicitly unknown/missing —
 * never false, never zero:
 *
 *   NOT OBSERVED != FALSE
 *   UNKNOWN != ZERO
 *   NO EVENT != NO ACTIVITY
 *
 * Nothing is invented. There is no percent-complete (TASK COUNT != TRUE
 * COMPLETION PERCENTAGE), no ETA (ELAPSED TIME != RELIABLE REMAINING TIME),
 * and no CPU/GPU/token/cost telemetry — unavailable telemetry is UNAVAILABLE,
 * and telemetry-shaped fields are rejected outright:
 *
 *   NO INVENTED PROGRESS, NO INVENTED ETA, NO INVENTED TELEMETRY
 *
 * Frames project only declared fields; full event payloads are never dumped,
 * so monitoring cannot leak secret values that happen to ride an event:
 *
 *   SECRET REF != SECRET VALUE
 *
 * Timestamps keep their identity. Every frame carries the event's own `at`
 * alongside the caller-supplied observation time; one is never substituted
 * for the other, and no freshness threshold is invented:
 *
 *   EVENT_AT != OBSERVED_AT
 *   CAPTURED_AT != PERSISTED_AT (still true here)
 */

export type MonitorProblemCode =
  | "MONITOR_INVALID_INPUT"
  | "MONITOR_UNKNOWN_FIELD"
  | "MONITOR_AUTHORITY_REJECTED"
  | "MONITOR_EXECUTION_REJECTED"
  | "MONITOR_PERSONALITY_REJECTED"
  | "MONITOR_SECRET_REJECTED"
  | "MONITOR_CHANNEL_DENIED"
  | "MONITOR_BAD_THRESHOLD"
  | "MONITOR_UNKNOWN_THRESHOLD_FIELD"
  | "MONITOR_TELEMETRY_REJECTED"
  | "MONITOR_BAD_LIMIT"
  | "MONITOR_OBSERVED_AT_REQUIRED";

export class MonitorError extends Error {
  readonly code: MonitorProblemCode;
  constructor(code: MonitorProblemCode, message: string) {
    super(message);
    this.name = "MonitorError";
    this.code = code;
  }
}

/** Closed operator vocabulary. No invented comparators. */
export const THRESHOLD_OPERATORS = ["==", "!=", ">=", "<=", ">", "<"] as const;
export type ThresholdOperator = (typeof THRESHOLD_OPERATORS)[number];

/**
 * Closed threshold fields, grounded in what summarize()/inspect() actually
 * return. Anything else — percentages, ETAs, telemetry — is rejected.
 */
export const RUN_THRESHOLD_FIELDS = [
  "state",
  "failedStepCount",
  "waitingApprovalCount",
  "nextReadyCount",
  "maxAttempts",
] as const;
export type RunThresholdField = (typeof RUN_THRESHOLD_FIELDS)[number];

export const ROUTINE_THRESHOLD_FIELDS = ["enabled", "lastState"] as const;
export type RoutineThresholdField = (typeof ROUTINE_THRESHOLD_FIELDS)[number];

/** Fields that would smuggle invented telemetry or progress into a rule. */
const TELEMETRY_KEYS = [
  "percentComplete",
  "progress",
  "eta",
  "etaMs",
  "timeRemaining",
  "cpu",
  "cpuUsage",
  "gpu",
  "gpuUsage",
  "memoryUsage",
  "memoryMb",
  "tokens",
  "tokenUsage",
  "cost",
  "costUsd",
  "energy",
  "throughput",
];

export interface ThresholdRule {
  ruleId: string;
  scope: "run" | "routine";
  field: string;
  operator: ThresholdOperator;
  value: string | number | boolean;
}

export interface WorkSubscription {
  subscriptionId: string;
  subscriber: Subscriber;
  runIds: string[];
  routineIds: string[];
  channels: string[];
  thresholds: ThresholdRule[];
}

export interface ProgressFrame {
  seq: number;
  channel: string;
  kind: string;
  /** From payload.subject when it is a non-empty string, else UNKNOWN. */
  subject: string;
  /** The event's own timestamp. Never substituted. */
  eventAt: string;
  /** Caller-supplied observation time. Never defaulted. */
  observedAt: string;
}

export interface RunSummaryView {
  runId: string;
  status: "REPORTED" | "UNKNOWN";
  summary?: {
    state: string;
    failedStepCount: number;
    waitingApprovalCount: number;
    nextReadyCount: number;
    maxAttempts: number;
  };
}

export interface RoutineSummaryView {
  routineId: string;
  status: "REPORTED" | "UNKNOWN";
  summary?: { enabled: boolean; lastState: string | null };
}

export interface Alert {
  alertId: string;
  ruleId: string;
  scope: "run" | "routine";
  subject: string;
  detail: string;
  observedAt: string;
}

export interface StreamResult {
  frames: ProgressFrame[];
  headByChannel: Record<string, number>;
}

export interface WorkView {
  subscriptionId: string;
  frames: ProgressFrame[];
  headByChannel: Record<string, number>;
  runs: RunSummaryView[];
  routines: RoutineSummaryView[];
  alerts: Alert[];
  observedAt: string;
}

/** Shapes accepted from injected summarize()/inspect() projections. */
export interface InjectedRunSummary {
  state: string;
  steps: Array<{ state: string; attempts: number }>;
  waiting_approval: string[];
  next_ready: string[];
}

export interface InjectedRoutineView {
  routine_id: string;
  enabled: boolean;
  last_state: string | null;
}

const SUBSCRIPTION_FIELDS = ["subscriptionId", "subscriber", "runIds", "routineIds", "channels", "thresholds"] as const;
const RULE_FIELDS = ["ruleId", "scope", "field", "operator", "value"] as const;

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "canDeploy", "policyBypass",
  "ownerOverride", "mergeAuthority", "grantApproved", "permissionGranted",
];

const EXECUTION_KEYS = [
  "spawnWorker", "terminateWorker", "extendLease", "recoverWorker",
  "executeTool", "toolResult", "schedule", "scheduled", "dispatched",
  "messagedHuman", "published", "deployed", "merged", "startedPolling",
  "pollIntervalMs", "watcher", "timer", "daemon",
];

const PERSONALITY_KEYS = [
  "personality", "persona", "traits", "backstory", "biography",
  "autobiography", "identity", "dna", "soul", "selfModel",
];

const SECRET_KEYS = ["apiKey", "secret", "token", "password", "privateKey", "credential"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Security-significant violations are diagnosed BEFORE generic shape errors,
 * so a smuggled authority claim is reported as itself and never disappears
 * into an unknown-field complaint.
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
      throw new MonitorError("MONITOR_AUTHORITY_REJECTED", `${path}.${key}: monitoring observes authorization; it never grants it`);
    }
    if (EXECUTION_KEYS.includes(key)) {
      throw new MonitorError("MONITOR_EXECUTION_REJECTED", `${path}.${key}: monitoring never spawns, schedules, dispatches, or polls`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new MonitorError("MONITOR_PERSONALITY_REJECTED", `${path}.${key}: a monitoring view carries no stored person`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new MonitorError("MONITOR_SECRET_REJECTED", `${path}.${key}: raw secrets never ride a monitoring view`);
    }
    if (TELEMETRY_KEYS.includes(key)) {
      throw new MonitorError("MONITOR_TELEMETRY_REJECTED", `${path}.${key}: telemetry is unavailable here; invented measurements are refused`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

function assertIdList(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((id) => !nonEmpty(id))) {
    throw new MonitorError("MONITOR_INVALID_INPUT", `${path} must be an array of non-empty strings`);
  }
  return [...new Set(value as string[])].sort();
}

function assertThresholdRule(value: unknown, index: number): ThresholdRule {
  if (!isPlainObject(value)) {
    throw new MonitorError("MONITOR_INVALID_INPUT", `thresholds[${index}] must be an object`);
  }
  assertNoViolations(value, `thresholds[${index}]`, new Set());
  for (const key of Object.keys(value)) {
    if (!(RULE_FIELDS as readonly string[]).includes(key)) {
      throw new MonitorError("MONITOR_UNKNOWN_FIELD", `unknown threshold field ${key}`);
    }
  }
  if (!nonEmpty(value.ruleId)) {
    throw new MonitorError("MONITOR_INVALID_INPUT", `thresholds[${index}] needs a non-empty ruleId`);
  }
  if (value.scope !== "run" && value.scope !== "routine") {
    throw new MonitorError("MONITOR_INVALID_INPUT", `thresholds[${index}] scope must be "run" or "routine"`);
  }
  const allowed = value.scope === "run" ? RUN_THRESHOLD_FIELDS : ROUTINE_THRESHOLD_FIELDS;
  if (typeof value.field !== "string" || !(allowed as readonly string[]).includes(value.field)) {
    throw new MonitorError(
      "MONITOR_UNKNOWN_THRESHOLD_FIELD",
      `thresholds[${index}] field ${String(value.field)} is not a projected ${value.scope} field; invented progress, ETA, and telemetry fields are refused`,
    );
  }
  if (!THRESHOLD_OPERATORS.includes(value.operator as ThresholdOperator)) {
    throw new MonitorError("MONITOR_BAD_THRESHOLD", `thresholds[${index}] operator is not a registered comparator`);
  }
  const t = typeof value.value;
  if (t !== "string" && t !== "number" && t !== "boolean") {
    throw new MonitorError("MONITOR_BAD_THRESHOLD", `thresholds[${index}] value must be a string, number, or boolean`);
  }
  if (t === "number" && !Number.isFinite(value.value as number)) {
    throw new MonitorError("MONITOR_BAD_THRESHOLD", `thresholds[${index}] numeric value must be finite`);
  }
  return {
    ruleId: value.ruleId as string,
    scope: value.scope as "run" | "routine",
    field: value.field as string,
    operator: value.operator as ThresholdOperator,
    value: value.value as string | number | boolean,
  };
}

/**
 * Validate and bind a subscription. Returns the record for the caller to hold;
 * nothing is stored, scheduled, or started. Channel allowlists fail closed:
 * a subscription may not name channels its subscriber may not read.
 */
export function subscribe(input: unknown): WorkSubscription {
  if (!isPlainObject(input)) {
    throw new MonitorError("MONITOR_INVALID_INPUT", "subscription input must be an object");
  }
  assertNoViolations(input, "input", new Set());
  for (const key of Object.keys(input)) {
    if (!(SUBSCRIPTION_FIELDS as readonly string[]).includes(key)) {
      throw new MonitorError("MONITOR_UNKNOWN_FIELD", `unknown subscription field ${key}`);
    }
  }
  if (!nonEmpty(input.subscriptionId)) {
    throw new MonitorError("MONITOR_INVALID_INPUT", "subscriptionId must be a non-empty string");
  }
  const sub = input.subscriber;
  if (!isPlainObject(sub) || !nonEmpty(sub.subscriberId) || !Array.isArray(sub.channels)) {
    throw new MonitorError("MONITOR_INVALID_INPUT", "subscriber must carry a non-empty subscriberId and a channels array");
  }
  const subscriber: Subscriber = {
    subscriberId: sub.subscriberId as string,
    channels: [...(sub.channels as unknown[])].filter(nonEmpty) as string[],
  };
  const channels = assertIdList(input.channels ?? [], "channels");
  for (const channel of channels) {
    if (!subscriber.channels.includes(channel)) {
      throw new MonitorError("MONITOR_CHANNEL_DENIED", `subscriber may not read ${channel}: subscription channels must stay inside the subscriber allowlist`);
    }
  }
  if (!Array.isArray(input.thresholds)) {
    throw new MonitorError("MONITOR_INVALID_INPUT", "thresholds must be an array");
  }
  const thresholds = (input.thresholds as unknown[]).map(assertThresholdRule);
  const ruleIds = thresholds.map((t) => t.ruleId);
  if (new Set(ruleIds).size !== ruleIds.length) {
    throw new MonitorError("MONITOR_BAD_THRESHOLD", "threshold ruleIds must be unique within a subscription");
  }
  return {
    subscriptionId: input.subscriptionId as string,
    subscriber,
    runIds: assertIdList(input.runIds ?? [], "runIds"),
    routineIds: assertIdList(input.routineIds ?? [], "routineIds"),
    channels,
    thresholds: [...thresholds].sort((a, b) => (a.ruleId < b.ruleId ? -1 : 1)),
  };
}

function assertObservedAt(value: unknown): string {
  // Observation time is caller-supplied evidence, never a wall-clock default.
  if (!nonEmpty(value)) {
    throw new MonitorError("MONITOR_OBSERVED_AT_REQUIRED", "observedAt must be a caller-supplied non-empty timestamp string");
  }
  return value;
}

function projectFrame(event: LogEvent, observedAt: string): ProgressFrame {
  const subject = (event.payload as Record<string, unknown>)?.subject;
  return {
    seq: event.seq,
    channel: event.channel,
    kind: event.kind,
    subject: nonEmpty(subject) ? (subject as string) : "UNKNOWN",
    eventAt: event.at,
    observedAt,
  };
}

export interface StreamInput {
  subscription: WorkSubscription;
  transport: RealtimeTransport;
  /** Resume cursors per channel; absent means from the retention head. */
  fromSeq?: Record<string, number>;
  limit?: number;
  observedAt: string;
}

/**
 * Pull one bounded progress window per subscribed channel. Pure pull: no
 * timers, no retained cursor, no background work. The returned heads are for
 * the caller to feed back as fromSeq.
 */
export function streamProgress(input: StreamInput): StreamResult {
  const observedAt = assertObservedAt(input.observedAt);
  const limit = input.limit ?? 50;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new MonitorError("MONITOR_BAD_LIMIT", "limit must be a positive integer");
  }
  const frames: ProgressFrame[] = [];
  const headByChannel: Record<string, number> = {};
  for (const channel of [...input.subscription.channels].sort()) {
    const from = input.fromSeq?.[channel] ?? 0;
    if (!Number.isInteger(from) || from < 0) {
      throw new MonitorError("MONITOR_INVALID_INPUT", `fromSeq for ${channel} must be a non-negative integer`);
    }
    const { events, head } = input.transport.resume(input.subscription.subscriber, channel, from);
    headByChannel[channel] = head;
    for (const event of events.slice(0, limit)) {
      frames.push(projectFrame(event, observedAt));
    }
  }
  frames.sort((a, b) => (a.channel === b.channel ? a.seq - b.seq : a.channel < b.channel ? -1 : 1));
  return { frames, headByChannel };
}

function summarizeRun(runId: string, summarize: (runId: string) => InjectedRunSummary | null): RunSummaryView {
  const summary = summarize(runId);
  // No summary is UNKNOWN — never false, never zero, never complete.
  if (summary === null) return { runId, status: "UNKNOWN" };
  const failedStepCount = summary.steps.filter((s) => s.state === "FAILED").length;
  const maxAttempts = summary.steps.reduce((m, s) => Math.max(m, s.attempts), 0);
  return {
    runId,
    status: "REPORTED",
    summary: {
      state: summary.state,
      failedStepCount,
      waitingApprovalCount: summary.waiting_approval.length,
      nextReadyCount: summary.next_ready.length,
      maxAttempts,
    },
  };
}

function summarizeRoutine(routineId: string, views: InjectedRoutineView[]): RoutineSummaryView {
  const view = views.find((v) => v.routine_id === routineId);
  if (view === undefined) return { routineId, status: "UNKNOWN" };
  return { routineId, status: "REPORTED", summary: { enabled: view.enabled, lastState: view.last_state } };
}

function compareValue(actual: string | number | boolean, operator: ThresholdOperator, expected: string | number | boolean): boolean {
  // Cross-type comparison is never silently true: a string threshold against a
  // numeric field simply does not match rather than coercing.
  if (typeof actual !== typeof expected) return false;
  switch (operator) {
    case "==": return actual === expected;
    case "!=": return actual !== expected;
    case ">=": return (actual as number) >= (expected as number);
    case "<=": return (actual as number) <= (expected as number);
    case ">": return (actual as number) > (expected as number);
    case "<": return (actual as number) < (expected as number);
  }
}

function runFieldValue(view: RunSummaryView, field: string): string | number | boolean | undefined {
  if (view.status !== "REPORTED" || view.summary === undefined) return undefined;
  const summary = view.summary as unknown as Record<string, string | number | boolean>;
  return summary[field];
}

function routineFieldValue(view: RoutineSummaryView, field: string): string | number | boolean | null | undefined {
  if (view.status !== "REPORTED" || view.summary === undefined) return undefined;
  const summary = view.summary as unknown as Record<string, string | number | boolean | null>;
  return summary[field] ?? undefined;
}

/**
 * Evaluate thresholds against projected views. UNKNOWN subjects never fire:
 * an unobserved run cannot trip a rule. Alerts are records for the caller to
 * route — this module publishes nothing and messages nobody.
 */
export function evaluateAlerts(
  subscription: WorkSubscription,
  runs: RunSummaryView[],
  routines: RoutineSummaryView[],
  observedAt: string,
): Alert[] {
  const at = assertObservedAt(observedAt);
  const alerts: Alert[] = [];
  for (const rule of subscription.thresholds) {
    if (rule.scope === "run") {
      for (const runId of subscription.runIds) {
        const view = runs.find((r) => r.runId === runId);
        const actual = view === undefined ? undefined : runFieldValue(view, rule.field);
        if (actual === undefined || actual === null) continue;
        if (compareValue(actual, rule.operator, rule.value)) {
          alerts.push({
            alertId: `${subscription.subscriptionId}:${rule.ruleId}:${runId}`,
            ruleId: rule.ruleId,
            scope: "run",
            subject: runId,
            detail: `run ${runId} ${rule.field} ${rule.operator} ${String(rule.value)} (observed ${String(actual)})`,
            observedAt: at,
          });
        }
      }
    } else {
      for (const routineId of subscription.routineIds) {
        const view = routines.find((r) => r.routineId === routineId);
        const actual = view === undefined ? undefined : routineFieldValue(view, rule.field);
        if (actual === undefined || actual === null) continue;
        if (compareValue(actual, rule.operator, rule.value)) {
          alerts.push({
            alertId: `${subscription.subscriptionId}:${rule.ruleId}:${routineId}`,
            ruleId: rule.ruleId,
            scope: "routine",
            subject: routineId,
            detail: `routine ${routineId} ${rule.field} ${rule.operator} ${String(rule.value)} (observed ${String(actual)})`,
            observedAt: at,
          });
        }
      }
    }
  }
  alerts.sort((a, b) => (a.alertId < b.alertId ? -1 : 1));
  return alerts;
}

export interface ComposeInput {
  subscription: WorkSubscription;
  transport: RealtimeTransport;
  /** Injected summarize projection; null return means UNKNOWN, never an error. */
  summarize: (runId: string) => InjectedRunSummary | null;
  /** Injected inspect projection. */
  inspectRoutines: () => InjectedRoutineView[];
  fromSeq?: Record<string, number>;
  limit?: number;
  observedAt: string;
}

/**
 * The streaming/alerting join: transport events + run summaries + routine
 * inspection + threshold alerts, composed into one deterministic view. Reads
 * canonical owners; stores nothing; mutates nothing.
 */
export function composeWorkView(input: ComposeInput): WorkView {
  const at = assertObservedAt(input.observedAt);
  const { frames, headByChannel } = streamProgress({
    subscription: input.subscription,
    transport: input.transport,
    fromSeq: input.fromSeq,
    limit: input.limit,
    observedAt: at,
  });
  const runs = input.subscription.runIds.map((runId) => summarizeRun(runId, input.summarize));
  const routineViews = input.inspectRoutines();
  const routines = input.subscription.routineIds.map((routineId) => summarizeRoutine(routineId, routineViews));
  const alerts = evaluateAlerts(input.subscription, runs, routines, at);
  return {
    subscriptionId: input.subscription.subscriptionId,
    frames,
    headByChannel,
    runs,
    routines,
    alerts,
    observedAt: at,
  };
}
