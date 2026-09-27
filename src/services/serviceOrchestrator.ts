/**
 * REQ-p24-service-orchestrator: OS service lifecycle orchestration.
 *
 * The registered requirement is the scope authority:
 *
 *   "Service install/configure/start/stop/restart/health/dependency-ordering/
 *    recovery/registration lifecycle; P19 workflow is task orchestration, not
 *    OS service orchestration."
 *
 * The lifecycle verbs name STAGES, and this unit models them as an explicit,
 * evidence-gated state machine over caller-declared service definitions —
 * planning and state composition, not process actuation:
 *
 *   AUDITOR != ACTUATOR
 *   ORCHESTRATION PLAN != EXECUTION
 *
 * There is no controlled execution substrate for OS processes anywhere in this
 * repository (no shell executor, no process manager, no sandbox runner), so
 * actuating start/stop here would mean inventing a new privileged surface —
 * exactly what the programme forbids. Transitions are therefore RECORDED
 * against caller-supplied evidence of effect, never performed:
 *
 *   COMMAND ACCEPTED != EFFECT VERIFIED
 *   START REQUEST != STARTED
 *   STARTED != READY
 *
 * SERVICE ORCHESTRATION != PROJECT ORCHESTRATION. The P22 project orchestrator
 * owns TaskGraph/WorkerRegistry/WorktreeRegistry and temporary-worker
 * lifecycle. This unit owns none of that and references none of it:
 *
 *   SERVICE != TASK
 *   SERVICE INSTANCE != WORKER INSTANCE
 *   SERVICE != TEMPORARY WORKER
 *
 * It is not a second registry either. `src/apps/registry.ts` stays the
 * canonical application registry; definitions here REFERENCE app entries
 * (`apps:<id>`) and toolchain entries (`toolchain:<toolId>`) but never copy
 * them, and the definition set itself is a caller-constructed working set,
 * not a durable store:
 *
 *   ORCHESTRATOR != REGISTRY
 *
 * LIVENESS != READINESS, and RUNNING != READY. A service may be alive without
 * being ready to serve dependents, and a readiness failure is not process
 * death. Health is reported observations gated into transitions — never
 * probed, never fetched:
 *
 *   HEALTHY != AUTHORIZED
 *   SERVICE READY != AUTHORIZED TO USE SERVICE
 *
 * DEPENDENCY FAILURE != DEPENDENT SERVICE FAILURE. When a required dependency
 * is not READY, the dependent is BLOCKED — computed as a derived overlay that
 * never corrupts stored lifecycle state — not FAILED:
 *
 *   BLOCKED != FAILED
 *
 * FAILURE != PERMISSION FOR INFINITE RETRY. Restart budgets are declared on
 * the definition and enforced; exhaustion is reported, never bypassed. No
 * backoff, watchdog, or crash-loop policy is invented.
 *
 * LOCAL SERVICE ORCHESTRATION != CLUSTER ORCHESTRATION. No placement (P30),
 * no authorization (P25), no network discovery, no upgrades, no migrations.
 * P25 decision references may be cited by id only.
 *
 * IN-MEMORY STATE != DURABLE SERVICE STATE. Everything here is
 * caller-constructed and returned anew; restart durability is never claimed.
 * Timestamps are caller-supplied and keep their identity (requested, started,
 * ready, stopped, and observed times are never overwritten with each other,
 * and none is ever invented).
 */

export type ServiceProblemCode =
  | "SERVICE_INVALID_INPUT"
  | "SERVICE_UNKNOWN_FIELD"
  | "SERVICE_AUTHORITY_REJECTED"
  | "SERVICE_SECRET_REJECTED"
  | "SERVICE_PERSONALITY_REJECTED"
  | "SERVICE_DUPLICATE_ID"
  | "SERVICE_UNKNOWN_SERVICE"
  | "SERVICE_BAD_ENTRYPOINT"
  | "SERVICE_BAD_DEPENDENCY"
  | "SERVICE_CYCLE"
  | "SERVICE_BAD_TRANSITION"
  | "SERVICE_EVIDENCE_REQUIRED"
  | "SERVICE_RESTART_EXHAUSTED";

export class ServiceOrchestratorError extends Error {
  readonly code: ServiceProblemCode;
  constructor(code: ServiceProblemCode, message: string) {
    super(message);
    this.name = "ServiceOrchestratorError";
    this.code = code;
  }
}

/** Closed lifecycle states. BLOCKED is derived, never stored; see effectiveStatus. */
export const SERVICE_STATES = [
  "DECLARED",
  "INSTALLED",
  "CONFIGURED",
  "STARTING",
  "RUNNING",
  "READY",
  "DEGRADED",
  "STOPPING",
  "STOPPED",
  "FAILED",
  "RECOVERING",
  "UNKNOWN",
] as const;
export type ServiceState = (typeof SERVICE_STATES)[number];

/** Closed failure classes. Stored failures never collapse into bare FAILED. */
export const FAILURE_CLASSES = [
  "DEPENDENCY_UNAVAILABLE",
  "DEPENDENCY_FAILED",
  "START_FAILED",
  "NOT_READY",
  "HEALTH_CHECK_FAILED",
  "TIMEOUT",
  "AUTH_BLOCKED",
  "UNKNOWN",
] as const;
export type FailureClass = (typeof FAILURE_CLASSES)[number];

/** Allowed lifecycle edges. Anything else is rejected, not silently permitted. */
const TRANSITIONS: Readonly<Record<Exclude<ServiceState, "UNKNOWN" | "BLOCKED" | never>, readonly ServiceState[]>> = {
  DECLARED: ["INSTALLED"],
  INSTALLED: ["CONFIGURED"],
  CONFIGURED: ["STARTING"],
  STARTING: ["RUNNING", "FAILED"],
  RUNNING: ["READY", "DEGRADED", "FAILED", "STOPPING"],
  READY: ["DEGRADED", "FAILED", "STOPPING"],
  DEGRADED: ["READY", "FAILED", "STOPPING"],
  STOPPING: ["STOPPED", "FAILED"],
  STOPPED: ["STARTING"],
  FAILED: ["RECOVERING", "STOPPED"],
  RECOVERING: ["STARTING", "FAILED"],
};

export interface ServiceDefinition {
  /** Stable identity. SERVICE DISPLAY NAME != SERVICE ID. */
  serviceId: string;
  /** Definition version. NEW DEFINITION AVAILABLE != INSTANCE UPGRADED. */
  version: string;
  displayName?: string;
  /** Required dependencies only — optional semantics are not invented. */
  dependencies: string[];
  capabilities: string[];
  /**
   * Reference only, never a raw command: `apps:<id>`, `toolchain:<toolId>`,
   * or `repo:<path>`. Arbitrary shell strings are refused.
   */
  entrypointRef: string;
  /** Declared signal names health/readiness observations refer to. */
  healthContract?: { readySignal: string; liveSignal: string };
  /** Restart budget. Required: FAILURE != PERMISSION FOR INFINITE RETRY. */
  maxRestarts: number;
  /** Secret references only. Values are rejected by key name. */
  secretRefs?: string[];
  /** P25 decision/grant identity cited by id only. */
  authGrantRef?: string;
  provenance: string;
}

export interface ServiceInstanceState {
  serviceId: string;
  /** Definition version this instance follows. Never silently upgraded. */
  definitionVersion: string;
  state: Exclude<ServiceState, "UNKNOWN">;
  restartAttemptsUsed: number;
  timestamps: {
    declaredAt: string;
    installedAt?: string;
    configuredAt?: string;
    startedAt?: string;
    readyAt?: string;
    stoppedAt?: string;
  };
  lastFailure?: { failureClass: FailureClass; reason: string; at: string };
  lastTransition: { from: string; to: string; at: string; note?: string };
}

export interface TransitionEvidence {
  /** Caller-supplied observation time. Never invented, never defaulted. */
  observedAt: string;
  note?: string;
  /** Required when entering RUNNING: the start took effect. */
  effectObserved?: boolean;
  /** Required when entering READY: readiness was observed. */
  readinessObserved?: boolean;
  /** Required when entering FAILED: what kind of failure. */
  failureClass?: FailureClass;
  /** Required when entering FAILED: why, in the caller's words. */
  reason?: string;
}

const DEFINITION_FIELDS = [
  "serviceId", "version", "displayName", "dependencies", "capabilities",
  "entrypointRef", "healthContract", "maxRestarts", "secretRefs", "authGrantRef", "provenance",
] as const;

const EVIDENCE_FIELDS = [
  "observedAt", "note", "effectObserved", "readinessObserved", "failureClass", "reason",
] as const;

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "executeNow", "policyBypass",
  "ownerOverride", "mergeAuthority", "grantApproved", "permissionGranted",
];

const SECRET_VALUE_KEYS = ["apiKey", "secret", "secretValue", "token", "password", "privateKey", "credential"];

const PERSONALITY_KEYS = [
  "personality", "persona", "traits", "backstory", "biography",
  "autobiography", "identity", "dna", "soul", "selfModel",
];

const ENTRYPOINT_REF_RE = /^(apps|toolchain|repo):[A-Za-z0-9._/-]+$/;

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
      throw new ServiceOrchestratorError("SERVICE_AUTHORITY_REJECTED", `${path}.${key}: service state never carries authority`);
    }
    if (SECRET_VALUE_KEYS.includes(key)) {
      throw new ServiceOrchestratorError("SERVICE_SECRET_REJECTED", `${path}.${key}: secret references only, never values`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new ServiceOrchestratorError("SERVICE_PERSONALITY_REJECTED", `${path}.${key}: a service definition carries no stored person`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

function assertStringList(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((id) => !nonEmpty(id))) {
    throw new ServiceOrchestratorError("SERVICE_INVALID_INPUT", `${path} must be an array of non-empty strings`);
  }
  return [...new Set(value as string[])].sort();
}

/**
 * Register one service definition into a caller-held working set. Pure:
 * returns a new sorted set; the input set is never mutated. This is planning
 * input, not a canonical registry write.
 */
export function declareService(
  definitions: ServiceDefinition[],
  input: unknown,
): ServiceDefinition[] {
  if (!Array.isArray(definitions)) {
    throw new ServiceOrchestratorError("SERVICE_INVALID_INPUT", "definitions must be an array");
  }
  if (!isPlainObject(input)) {
    throw new ServiceOrchestratorError("SERVICE_INVALID_INPUT", "service definition must be an object");
  }
  assertNoViolations(input, "definition", new Set());
  for (const key of Object.keys(input)) {
    if (!(DEFINITION_FIELDS as readonly string[]).includes(key)) {
      throw new ServiceOrchestratorError("SERVICE_UNKNOWN_FIELD", `unknown service definition field ${key}`);
    }
  }
  if (!nonEmpty(input.serviceId)) {
    throw new ServiceOrchestratorError("SERVICE_INVALID_INPUT", "serviceId must be a non-empty stable id");
  }
  if (!nonEmpty(input.version)) {
    throw new ServiceOrchestratorError("SERVICE_INVALID_INPUT", "version must be a non-empty string");
  }
  if (definitions.some((d) => d.serviceId === input.serviceId)) {
    throw new ServiceOrchestratorError("SERVICE_DUPLICATE_ID", `service ${input.serviceId} is already declared`);
  }
  const dependencies = input.dependencies === undefined ? [] : assertStringList(input.dependencies, "dependencies");
  if (dependencies.includes(input.serviceId as string)) {
    throw new ServiceOrchestratorError("SERVICE_BAD_DEPENDENCY", `service ${input.serviceId} cannot depend on itself`);
  }
  const capabilities = input.capabilities === undefined ? [] : assertStringList(input.capabilities, "capabilities");
  if (!nonEmpty(input.entrypointRef) || !ENTRYPOINT_REF_RE.test(input.entrypointRef as string)) {
    throw new ServiceOrchestratorError(
      "SERVICE_BAD_ENTRYPOINT",
      "entrypointRef must be a reference (apps:<id>, toolchain:<toolId>, repo:<path>); raw commands are refused",
    );
  }
  if (input.healthContract !== undefined) {
    if (
      !isPlainObject(input.healthContract) ||
      !nonEmpty((input.healthContract as Record<string, unknown>).readySignal) ||
      !nonEmpty((input.healthContract as Record<string, unknown>).liveSignal)
    ) {
      throw new ServiceOrchestratorError("SERVICE_INVALID_INPUT", "healthContract needs non-empty readySignal and liveSignal names");
    }
    const keys = Object.keys(input.healthContract);
    if (keys.length !== 2 || !keys.includes("readySignal") || !keys.includes("liveSignal")) {
      throw new ServiceOrchestratorError("SERVICE_UNKNOWN_FIELD", "healthContract carries exactly readySignal and liveSignal");
    }
  }
  if (!Number.isInteger(input.maxRestarts) || (input.maxRestarts as number) < 0) {
    throw new ServiceOrchestratorError("SERVICE_INVALID_INPUT", "maxRestarts must be an explicit non-negative integer: no bound, no restart budget");
  }
  if (input.secretRefs !== undefined) {
    assertStringList(input.secretRefs, "secretRefs");
  }
  if (input.authGrantRef !== undefined && !nonEmpty(input.authGrantRef)) {
    throw new ServiceOrchestratorError("SERVICE_INVALID_INPUT", "authGrantRef must be a non-empty P25 decision id when present");
  }
  if (input.displayName !== undefined && !nonEmpty(input.displayName)) {
    throw new ServiceOrchestratorError("SERVICE_INVALID_INPUT", "displayName must be non-empty when present");
  }
  if (!nonEmpty(input.provenance)) {
    throw new ServiceOrchestratorError("SERVICE_INVALID_INPUT", "provenance must be a non-empty string");
  }
  const definition: ServiceDefinition = {
    serviceId: input.serviceId as string,
    version: input.version as string,
    ...(input.displayName === undefined ? {} : { displayName: input.displayName as string }),
    dependencies,
    capabilities,
    entrypointRef: input.entrypointRef as string,
    ...(input.healthContract === undefined
      ? {}
      : {
          healthContract: {
            readySignal: (input.healthContract as Record<string, string>).readySignal,
            liveSignal: (input.healthContract as Record<string, string>).liveSignal,
          },
        }),
    maxRestarts: input.maxRestarts as number,
    ...(input.secretRefs === undefined ? {} : { secretRefs: [...(input.secretRefs as string[])].sort() }),
    ...(input.authGrantRef === undefined ? {} : { authGrantRef: input.authGrantRef as string }),
    provenance: input.provenance as string,
  };
  return [...definitions, definition].sort((a, b) => (a.serviceId < b.serviceId ? -1 : 1));
}

export interface OrderPlan {
  /** Deterministic topological start order over known services. */
  order: string[];
  /** Services that cannot be ordered, with reasons. Never silently dropped. */
  blocked: Array<{ serviceId: string; reason: string }>;
}

function topologicalOrder(definitions: ServiceDefinition[]): { order: string[]; blocked: OrderPlan["blocked"] } {
  const byId = new Map(definitions.map((d) => [d.serviceId, d]));
  const blocked: OrderPlan["blocked"] = [];
  // Unknown dependencies exclude their dependents from ordering, explicitly.
  const known = definitions.filter((d) => {
    const unknown = d.dependencies.filter((dep) => !byId.has(dep));
    if (unknown.length > 0) {
      blocked.push({ serviceId: d.serviceId, reason: `unknown dependencies: ${unknown.sort().join(", ")}` });
      return false;
    }
    return true;
  });
  // Cycle detection with evidence: iterative DFS reporting the actual cycle path.
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>(known.map((d) => [d.serviceId, WHITE]));
  const order: string[] = [];
  const visit = (id: string, stack: string[]): void => {
    color.set(id, GRAY);
    const deps = [...(byId.get(id)?.dependencies ?? [])].sort();
    for (const dep of deps) {
      const c = color.get(dep);
      if (c === GRAY) {
        const cycle = [...stack.slice(stack.indexOf(dep)), dep];
        throw new ServiceOrchestratorError("SERVICE_CYCLE", `dependency cycle: ${cycle.join(" -> ")}`);
      }
      if (c === WHITE) visit(dep, [...stack, dep]);
    }
    color.set(id, BLACK);
    order.push(id);
  };
  for (const id of known.map((d) => d.serviceId).sort()) {
    if (color.get(id) === WHITE) visit(id, [id]);
  }
  return { order, blocked: blocked.sort((a, b) => (a.serviceId < b.serviceId ? -1 : 1)) };
}

/**
 * Deterministic dependency start order: dependencies before dependents.
 * A DEPENDS ON B != B DEPENDS ON A — direction is load-bearing and tested.
 */
export function planStartOrder(definitions: ServiceDefinition[]): OrderPlan {
  const { order, blocked } = topologicalOrder(definitions);
  return { order, blocked };
}

/**
 * Safe shutdown order: reverse the dependency constraints (dependents stop
 * before the services they depend on). Stop order != start order, by rule.
 */
export function planStopOrder(definitions: ServiceDefinition[]): OrderPlan {
  const { order, blocked } = topologicalOrder(definitions);
  return { order: [...order].reverse(), blocked };
}

export type InstanceStates = Record<string, ServiceInstanceState>;

function assertEvidence(value: unknown): TransitionEvidence {
  if (!isPlainObject(value)) {
    throw new ServiceOrchestratorError("SERVICE_EVIDENCE_REQUIRED", "transition evidence must be an object");
  }
  assertNoViolations(value, "evidence", new Set());
  for (const key of Object.keys(value)) {
    if (!(EVIDENCE_FIELDS as readonly string[]).includes(key)) {
      throw new ServiceOrchestratorError("SERVICE_UNKNOWN_FIELD", `unknown evidence field ${key}`);
    }
  }
  if (!nonEmpty(value.observedAt)) {
    throw new ServiceOrchestratorError("SERVICE_EVIDENCE_REQUIRED", "observedAt is required: timestamps are caller-supplied, never invented");
  }
  return {
    observedAt: value.observedAt,
    ...(value.note === undefined ? {} : { note: value.note as string }),
    ...(value.effectObserved === undefined ? {} : { effectObserved: value.effectObserved as boolean }),
    ...(value.readinessObserved === undefined ? {} : { readinessObserved: value.readinessObserved as boolean }),
    ...(value.failureClass === undefined ? {} : { failureClass: value.failureClass as FailureClass }),
    ...(value.reason === undefined ? {} : { reason: value.reason as string }),
  };
}

/**
 * Record one lifecycle transition. Every transition is evidence-gated:
 * RUNNING requires effectObserved, READY requires readinessObserved, FAILED
 * requires a failure class plus reason, and RECOVERING requires restart
 * budget. The caller's states map is never mutated.
 */
export function transitionState(
  definitions: ServiceDefinition[],
  states: InstanceStates,
  serviceId: string,
  to: ServiceState,
  evidence: unknown,
): InstanceStates {
  const definition = definitions.find((d) => d.serviceId === serviceId);
  if (definition === undefined) {
    throw new ServiceOrchestratorError("SERVICE_UNKNOWN_SERVICE", `service ${serviceId} is not declared`);
  }
  if (to === "UNKNOWN") {
    throw new ServiceOrchestratorError("SERVICE_BAD_TRANSITION", "UNKNOWN is reported, never entered by transition");
  }
  const current = states[serviceId];
  const from: ServiceState = current?.state ?? "DECLARED";
  const allowed = TRANSITIONS[from as keyof typeof TRANSITIONS] ?? [];
  if (!allowed.includes(to)) {
    throw new ServiceOrchestratorError("SERVICE_BAD_TRANSITION", `${from} -> ${to} is not a lifecycle edge for ${serviceId}`);
  }
  const proof = assertEvidence(evidence);
  if (to === "RUNNING" && proof.effectObserved !== true) {
    throw new ServiceOrchestratorError("SERVICE_EVIDENCE_REQUIRED", "entering RUNNING requires effectObserved: COMMAND ACCEPTED != EFFECT VERIFIED");
  }
  if (to === "READY" && proof.readinessObserved !== true) {
    throw new ServiceOrchestratorError("SERVICE_EVIDENCE_REQUIRED", "entering READY requires readinessObserved: STARTED != READY");
  }
  if (to === "FAILED") {
    if (proof.failureClass === undefined || !FAILURE_CLASSES.includes(proof.failureClass)) {
      throw new ServiceOrchestratorError("SERVICE_EVIDENCE_REQUIRED", "entering FAILED requires a registered failure class: failures are never bare");
    }
    if (!nonEmpty(proof.reason)) {
      throw new ServiceOrchestratorError("SERVICE_EVIDENCE_REQUIRED", "entering FAILED requires a reason");
    }
  }
  const used = current?.restartAttemptsUsed ?? 0;
  if (to === "RECOVERING" && used >= definition.maxRestarts) {
    throw new ServiceOrchestratorError(
      "SERVICE_RESTART_EXHAUSTED",
      `${serviceId} used ${used}/${definition.maxRestarts} restarts: exhaustion is reported, never bypassed`,
    );
  }
  if (current !== undefined && current.definitionVersion !== definition.version) {
    throw new ServiceOrchestratorError(
      "SERVICE_BAD_TRANSITION",
      `${serviceId} follows definition ${current.definitionVersion} but ${definition.version} is declared: NEW DEFINITION AVAILABLE != INSTANCE UPGRADED`,
    );
  }
  const base: ServiceInstanceState = current ?? {
    serviceId,
    definitionVersion: definition.version,
    state: "DECLARED",
    restartAttemptsUsed: 0,
    timestamps: { declaredAt: proof.observedAt },
    lastTransition: { from: "DECLARED", to: "DECLARED", at: proof.observedAt },
  };
  const timestamps = { ...base.timestamps };
  if (to === "INSTALLED") timestamps.installedAt = proof.observedAt;
  if (to === "CONFIGURED") timestamps.configuredAt = proof.observedAt;
  if (to === "STARTING" && base.state !== "RECOVERING") timestamps.startedAt = proof.observedAt;
  if (to === "READY") timestamps.readyAt = proof.observedAt;
  if (to === "STOPPED") timestamps.stoppedAt = proof.observedAt;
  const next: ServiceInstanceState = {
    ...base,
    state: to,
    restartAttemptsUsed: to === "RECOVERING" ? used + 1 : used,
    timestamps,
    ...(to === "FAILED"
      ? { lastFailure: { failureClass: proof.failureClass as FailureClass, reason: proof.reason as string, at: proof.observedAt } }
      : { ...(base.lastFailure === undefined ? {} : { lastFailure: base.lastFailure }) }),
    lastTransition: {
      from,
      to,
      at: proof.observedAt,
      ...(proof.note === undefined ? {} : { note: proof.note }),
    },
  };
  return { ...states, [serviceId]: next };
}

export interface EffectiveStatus {
  serviceId: string;
  /** BLOCKED is derived here and never stored. */
  status: ServiceState | "BLOCKED";
  blockedBy?: string[];
  storedState: ServiceState | "UNDECLARED";
}

/**
 * Effective status with the dependency overlay applied. A service whose
 * required dependency is not READY reports BLOCKED with the blockers named —
 * the stored lifecycle state is left untouched, and the dependent is never
 * blamed for its dependency's failure.
 */
export function effectiveStatus(
  definitions: ServiceDefinition[],
  states: InstanceStates,
  serviceId: string,
): EffectiveStatus {
  const definition = definitions.find((d) => d.serviceId === serviceId);
  if (definition === undefined) {
    return { serviceId, status: "UNKNOWN", storedState: "UNDECLARED" };
  }
  const stored = states[serviceId]?.state ?? "DECLARED";
  const byId = new Map(definitions.map((d) => [d.serviceId, d]));
  const blockedBy: string[] = [];
  for (const dep of definition.dependencies) {
    const depDef = byId.get(dep);
    if (depDef === undefined) {
      blockedBy.push(`${dep} (unknown service)`);
      continue;
    }
    if (states[dep]?.state !== "READY") {
      blockedBy.push(dep);
    }
  }
  if (blockedBy.length > 0) {
    return { serviceId, status: "BLOCKED", blockedBy: [...blockedBy].sort(), storedState: stored };
  }
  return { serviceId, status: stored, storedState: stored };
}
