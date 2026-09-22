import type { FileStateStore } from "../state/store";
import { StateError } from "../state/types";
import { dueOccurrences, occurrenceKey, validateSchedule, DEFAULT_MISFIRE_AFTER_MS } from "./schedules";
import { normalizeEvent, triggerMatches, validateTrigger } from "./triggers";
import type {
  Activation,
  AetheriusEvent,
  Clock,
  EventTrigger,
  MisfirePolicy,
  Schedule,
  SchedulerState,
} from "./types";
import { SchedulerError } from "./types";

export interface RoutineBinding {
  routine_id: string;
  version: string;
  workflow_ref: string;
  workflow_version: string;
  policy: string;
  capability_requirements?: string[];
  enabled: boolean;
  schedule?: Schedule;
  triggers?: EventTrigger[];
  default_inputs?: Record<string, unknown>;
}

export interface StartRunFn {
  (routine: RoutineBinding, inputs: Record<string, unknown>): Promise<{ runId: string }> | { runId: string };
}

export interface TickReport {
  at: number;
  evaluated: number;
  activated: string[];
  skipped: string[];
  misfired: string[];
  errors: Array<{ routine: string; code: string; message: string }>;
}

const STATE_ID = "scheduler-state";
const ACTIVATION_PREFIX = "activation-";
const LEASE_MS = 5 * 60 * 1000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Durable routine scheduler. Deterministic tick-based core (no background
 * threads in the core path): tick(nowMs) evaluates due occurrences and
 * trusted events, claims each logical occurrence atomically via P17
 * optimistic versioning, then starts runs. One occurrence → at most one
 * canonical activation, even across restarts or racing instances.
 */
export class RoutineScheduler {
  private readonly routines = new Map<string, RoutineBinding>();
  private readonly store: FileStateStore | null;
  private readonly startRun: StartRunFn;
  private readonly ownerId: string;

  constructor(store: FileStateStore | null, startRun: StartRunFn, ownerId = "scheduler-1") {
    this.store = store;
    this.startRun = startRun;
    this.ownerId = ownerId;
  }

  registerRoutine(binding: RoutineBinding): void {
    if (!binding.routine_id.trim()) throw new SchedulerError("UNKNOWN_ROUTINE", "routine_id is required");
    if (!/^\d+\.\d+\.\d+$/.test(binding.version)) {
      throw new SchedulerError("UNKNOWN_ROUTINE", `invalid routine version ${binding.version}`);
    }
    if (binding.schedule) {
      const problems = validateSchedule(binding.schedule);
      if (problems.length > 0) {
        throw new SchedulerError("INVALID_SCHEDULE", problems.join("; "));
      }
    }
    for (const trigger of binding.triggers ?? []) {
      const problems = validateTrigger(trigger);
      if (problems.length > 0) {
        throw new SchedulerError("INVALID_TRIGGER", `trigger ${trigger.trigger_id}: ${problems.join("; ")}`);
      }
    }
    const triggerIds = (binding.triggers ?? []).map((t) => t.trigger_id);
    if (new Set(triggerIds).size !== triggerIds.length) {
      throw new SchedulerError("INVALID_TRIGGER", "duplicate trigger ID within routine");
    }
    this.routines.set(binding.routine_id, JSON.parse(JSON.stringify(binding)) as RoutineBinding);
  }

  listRoutines(): RoutineBinding[] {
    return [...this.routines.values()]
      .sort((a, b) => (a.routine_id < b.routine_id ? -1 : 1))
      .map((r) => JSON.parse(JSON.stringify(r)) as RoutineBinding);
  }

  setRoutineEnabled(routineId: string, enabled: boolean): void {
    const routine = this.routines.get(routineId);
    if (!routine) throw new SchedulerError("UNKNOWN_ROUTINE", `unknown routine ${routineId}`);
    routine.enabled = enabled;
  }

  setPaused(paused: boolean): void {
    const state = this.readState();
    state.paused = paused;
    this.writeState(state);
  }

  isPaused(): boolean {
    return this.readState().paused;
  }

  /** Operator inspection: routines with next due, last activation, state. */
  inspect(nowMs: number): Array<{
    routine_id: string; version: string; enabled: boolean;
    next_due: number | null; last_activation: string | null; last_state: string | null;
  }> {
    const state = this.readState();
    const byRoutine = new Map<string, { id: string; state: string; at: number }>();
    for (const activationId of Object.values(state.claimed)) {
      const activation = this.readActivation(activationId);
      if (!activation) continue;
      const prev = byRoutine.get(activation.routine_id);
      if (!prev || activation.detected_at >= prev.at) {
        byRoutine.set(activation.routine_id, { id: activationId, state: activation.state, at: activation.detected_at });
      }
    }
    const out: Array<{
      routine_id: string; version: string; enabled: boolean;
      next_due: number | null; last_activation: string | null; last_state: string | null;
    }> = [];
    for (const routine of this.listRoutines()) {
      let nextDue: number | null = null;
      if (routine.enabled && routine.schedule) {
        const upcoming = dueOccurrences(routine.schedule, nowMs, nowMs + 366 * 24 * 3600 * 1000);
        nextDue = upcoming.length > 0 ? upcoming[0] : null;
      }
      const last = byRoutine.get(routine.routine_id) ?? null;
      out.push({
        routine_id: routine.routine_id, version: routine.version, enabled: routine.enabled,
        next_due: nextDue, last_activation: last?.id ?? null, last_state: last?.state ?? null,
      });
    }
    return out;
  }

  inspectHuman(nowMs: number): string {
    return this.inspect(nowMs)
      .map((r) =>
        `ROUTINE: ${r.routine_id}\nNEXT_DUE: ${r.next_due === null ? "none" : new Date(r.next_due).toISOString()}\n` +
        `STATE: ${r.enabled ? "ENABLED" : "DISABLED"}\nLAST: ${r.last_activation ?? "none"}${r.last_state ? ` (${r.last_state})` : ""}`,
      )
      .join("\n");
  }

  /**
   * Deterministic tick: evaluate schedules + (no events here; use
   * dispatchEvent for the event path). Returns a full report.
   */
  async tick(nowMs: number): Promise<TickReport> {
    const report: TickReport = { at: nowMs, evaluated: 0, activated: [], skipped: [], misfired: [], errors: [] };
    const state = this.readState();
    if (state.paused) return report;
    // Lifetime MISFIRED counts scanned ONCE per tick (not per occurrence).
    const misfireCounts = new Map<string, number>();
    for (const activationId of Object.values(state.claimed)) {
      const existing = this.readActivation(activationId);
      if (existing && existing.state === "MISFIRED") {
        misfireCounts.set(existing.routine_id, (misfireCounts.get(existing.routine_id) ?? 0) + 1);
      }
    }
    // First tick observes from epoch: recent occurrences fire, older ones
    // enter the honest misfire path. Nothing is silently dropped.
    const lastTick = state.lastTickAt ?? 0;
    for (const routine of this.listRoutines()) {
      if (!routine.enabled || !routine.schedule) continue;
      report.evaluated += 1;
      let occurrences: number[];
      try {
        occurrences = dueOccurrences(routine.schedule, lastTick, nowMs);
      } catch (error) {
        report.errors.push({ routine: routine.routine_id, code: "INVALID_SCHEDULE", message: errorMessage(error) });
        continue;
      }
      for (const at of occurrences) {
        const key = occurrenceKey(routine.schedule.schedule_id, routine.schedule.version, at);
        if (state.claimed[key] !== undefined) continue; // already handled: never duplicate
        const ageMs = nowMs - at;
        const misfireAfter = routine.schedule.misfireAfterMs ?? DEFAULT_MISFIRE_AFTER_MS;
        if (ageMs > misfireAfter) {
          await this.applyMisfire(routine, key, at, nowMs, state, report, misfireCounts);
          continue;
        }
        await this.claimAndStart(
          routine, key, { kind: "schedule", at }, nowMs, state, report,
        );
      }
    }
    state.lastTickAt = nowMs;
    this.writeStateTolerant(state, () => {
      state.lastTickAt = nowMs;
    });
    return report;
  }

  /**
   * Final state write: on version conflict, re-read fresh state, re-apply
   * the caller's update, and retry once. Claims are already persisted
   * per-occurrence, so a second failure only delays the cursor update —
   * already-claimed occurrences still cannot duplicate.
   */
  private writeStateTolerant(state: SchedulerState, reapply: () => void): void {
    try {
      this.writeStateInner(state);
    } catch (error) {
      if (!this.isVersionConflict(error)) throw error;
      const fresh = this.readState();
      Object.assign(state, fresh);
      reapply();
      this.writeStateInner(state);
    }
  }

  /** Trusted internal event path: match → dedup → claim → start. */
  async dispatchEvent(raw: Partial<AetheriusEvent> & { event_id: string; event_type: string; source: string }, nowMs: number): Promise<TickReport> {
    const report: TickReport = { at: nowMs, evaluated: 0, activated: [], skipped: [], misfired: [], errors: [] };
    const event = normalizeEvent(raw);
    const state = this.readState();
    if (state.paused) return report;
    for (const routine of this.listRoutines()) {
      if (!routine.enabled) continue;
      for (const trigger of routine.triggers ?? []) {
        if (!trigger.enabled) continue;
        report.evaluated += 1;
        if (!triggerMatches(trigger, event)) continue;
        const dedupKey = `${trigger.trigger_id}:${event.event_id}`;
        if (state.processedEvents[dedupKey] !== undefined) continue; // redelivery: no duplicate
        await this.claimAndStart(
          routine, dedupKey,
          { kind: "event", event, trigger },
          nowMs, state, report,
        );
      }
    }
    this.writeStateTolerant(state, () => undefined);
    return report;
  }

  // -- internals ----------------------------------------------------------

  private blankState(): SchedulerState {
    return { claimed: {}, processedEvents: {}, paused: false };
  }

  private readState(): SchedulerState {
    if (!this.store) return this.blankState();
    try {
      return this.store.load<SchedulerState>(STATE_ID).payload;
    } catch (error) {
      if (error instanceof StateError && error.code === "STATE_NOT_FOUND") {
        return this.blankState();
      }
      throw new SchedulerError("PERSISTENCE_ERROR", `scheduler state unreadable: ${errorMessage(error)}`);
    }
  }

  private isVersionConflict(error: unknown): boolean {
    let current: unknown = error;
    for (let depth = 0; depth < 4 && current instanceof Error; depth++) {
      if (current instanceof StateError && current.code === "STATE_VERSION_CONFLICT") return true;
      current = (current as { cause?: unknown }).cause;
    }
    return false;
  }

  private writeStateInner(state: SchedulerState): void {
    if (!this.store) return;
    const now = Date.now();
    try {
      if (this.store.exists(STATE_ID)) {
        const current = this.store.load<SchedulerState>(STATE_ID);
        this.store.save(
          {
            id: STATE_ID, kind: "scheduler-state", schemaVersion: 1,
            recordVersion: current.recordVersion + 1,
            createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
            owner: "aetherius-os", provenance: "routine-scheduler",
            sensitivity: "SYSTEM", integrity: "", payload: state,
          },
          { expectedRecordVersion: current.recordVersion },
        );
      } else {
        this.store.save({
          id: STATE_ID, kind: "scheduler-state", schemaVersion: 1, recordVersion: 1,
          createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
          owner: "aetherius-os", provenance: "routine-scheduler",
          sensitivity: "SYSTEM", integrity: "", payload: state,
        });
      }
    } catch (error) {
      const wrapped = new SchedulerError("PERSISTENCE_ERROR", `scheduler state unwritable: ${errorMessage(error)}`);
      (wrapped as { cause?: unknown }).cause = error;
      throw wrapped;
    }
  }

  private writeState(state: SchedulerState): void {
    this.writeStateInner(state);
  }

  private readActivation(activationId: string): Activation | null {
    if (!this.store) return null;
    try {
      return this.store.load<Activation>(`${ACTIVATION_PREFIX}${activationId}`).payload;
    } catch {
      return null;
    }
  }

  private writeActivation(activation: Activation): void {
    if (!this.store) return;
    const id = `${ACTIVATION_PREFIX}${activation.activation_id}`;
    try {
      if (this.store.exists(id)) {
        const current = this.store.load<Activation>(id);
        this.store.save(
          {
            id, kind: "routine-activation", schemaVersion: 1,
            recordVersion: current.recordVersion + 1,
            createdAt: new Date(Date.now()).toISOString(), updatedAt: new Date(Date.now()).toISOString(),
            owner: "aetherius-os", provenance: activation.provenance,
            sensitivity: "SYSTEM", integrity: "", payload: activation,
          },
          { expectedRecordVersion: current.recordVersion },
        );
      } else {
        this.store.save({
          id, kind: "routine-activation", schemaVersion: 1, recordVersion: 1,
          createdAt: new Date(Date.now()).toISOString(), updatedAt: new Date(Date.now()).toISOString(),
          owner: "aetherius-os", provenance: activation.provenance,
          sensitivity: "SYSTEM", integrity: "", payload: activation,
        });
      }
    } catch (error) {
      throw new SchedulerError("PERSISTENCE_ERROR", `activation unwritable: ${errorMessage(error)}`);
    }
  }

  private async applyMisfire(
    routine: RoutineBinding,
    key: string,
    at: number,
    nowMs: number,
    state: SchedulerState,
    report: TickReport,
    misfireCounts: Map<string, number>,
  ): Promise<void> {
    const policy: MisfirePolicy = routine.schedule?.misfirePolicy ?? { policy: "SKIP" };
    const noteMisfire = (why: string): void => {
      const activation = this.buildActivation(routine, key, { kind: "schedule", at }, nowMs, "MISFIRED", why);
      this.recordClaim(state, key, activation, undefined);
      misfireCounts.set(routine.routine_id, (misfireCounts.get(routine.routine_id) ?? 0) + 1);
      report.misfired.push(activation.activation_id);
    };
    if (policy.policy === "SKIP") {
      noteMisfire("misfire policy SKIP");
      return;
    }
    if (policy.policy === "RUN_ONCE_NOW") {
      await this.claimAndStart(routine, key, { kind: "schedule", at }, nowMs, state, report, true);
      return;
    }
    // Bounds: per-occurrence age, per-cycle cap this tick, and lifetime
    // MISFIRED cap for this routine (prevents unbounded backlog storms).
    // Lifetime counts come from the once-per-tick scan (no per-occurrence
    // I/O scan), incremented as this tick adds more.
    const caughtUp = report.activated.filter((id) => id.startsWith("catchup:")).length;
    const priorMisfires = misfireCounts.get(routine.routine_id) ?? 0;
    const ageOk = nowMs - at <= policy.maxAgeMs;
    if (!ageOk || caughtUp >= policy.maxPerCycle || priorMisfires >= policy.maxMissed) {
      noteMisfire("catch-up bounds exceeded");
      return;
    }
    await this.claimAndStart(routine, key, { kind: "schedule", at }, nowMs, state, report, true);
  }

  private buildActivation(
    routine: RoutineBinding,
    key: string,
    origin: { kind: "schedule"; at: number } | { kind: "event"; event: AetheriusEvent; trigger: { trigger_id: string; version: string } },
    nowMs: number,
    state: Activation["state"],
    detail: string,
  ): Activation {
    const schedule = routine.schedule;
    const slug = (value: string): string =>
      value.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";
    return {
      activation_id: `${slug(routine.routine_id)}-${slug(routine.version)}-${slug(key)}`,
      routine_id: routine.routine_id,
      routine_version: routine.version,
      workflow_ref: routine.workflow_ref,
      workflow_version: routine.workflow_version,
      trigger_kind: origin.kind,
      schedule_id: schedule?.schedule_id,
      schedule_version: schedule?.version,
      occurrence_key: key,
      scheduled_for: origin.kind === "schedule" ? origin.at : undefined,
      event_id: origin.kind === "event" ? origin.event.event_id : undefined,
      detected_at: nowMs,
      state,
      attempts: 0,
      provenance: origin.kind === "schedule"
        ? `schedule ${schedule?.schedule_id}@${schedule?.version}`
        : `event ${origin.event.event_id} via ${origin.trigger.trigger_id}@${origin.trigger.version}`,
      detail,
    };
  }

  private recordClaim(
    state: SchedulerState,
    key: string,
    activation: Activation,
    eventDedupKey: string | undefined,
  ): void {
    state.claimed[key] = activation.activation_id;
    if (eventDedupKey !== undefined) state.processedEvents[eventDedupKey] = activation.activation_id;
    this.writeActivation(activation);
  }

  private async claimAndStart(
    routine: RoutineBinding,
    key: string,
    origin: { kind: "schedule"; at: number } | { kind: "event"; event: AetheriusEvent; trigger: { trigger_id: string; version: string } },
    nowMs: number,
    state: SchedulerState,
    report: TickReport,
    isCatchUp = false,
  ): Promise<void> {
    if (state.claimed[key] !== undefined) return; // already claimed: exit cleanly
    const activation = this.buildActivation(routine, key, origin, nowMs, "CLAIMED", `claimed by ${this.ownerId}`);
    activation.claimed_by = this.ownerId;
    activation.claimed_at = nowMs;
    const dedupKey = origin.kind === "event" ? key : undefined;
    this.recordClaim(state, key, activation, dedupKey);
    // Persist the claim immediately so a racing instance observes it.
    // On version conflict, re-read: if the key is now claimed, the other
    // instance won and we exit quietly; otherwise the conflict is real.
    try {
      this.writeStateInner(state);
    } catch (error) {
      if (!this.isVersionConflict(error)) throw error;
      const fresh = this.readState();
      const won =
        fresh.claimed[key] !== undefined ||
        (dedupKey !== undefined && fresh.processedEvents[dedupKey] !== undefined);
      if (won) {
        Object.assign(state, fresh);
        return;
      }
      throw error;
    }
    activation.attempts += 1;
    activation.state = "STARTING";
    this.writeActivation(activation);
    try {
      const started = await this.startRun(routine, routine.default_inputs ?? {});
      activation.run_id = started.runId;
      activation.state = "STARTED";
      this.writeActivation(activation);
      report.activated.push(isCatchUp ? `catchup:${activation.activation_id}` : activation.activation_id);
    } catch (error) {
      // Start failed: record FAILED without a run. The occurrence stays
      // claimed so a retry cannot silently duplicate side effects; an
      // operator may reconcile explicitly later.
      activation.state = "FAILED";
      activation.detail = `workflow start failed: ${errorMessage(error)}`;
      this.writeActivation(activation);
      report.errors.push({ routine: routine.routine_id, code: "WORKFLOW_START_FAILED", message: errorMessage(error) });
    }
  }

  /** Recover stale claims (crashed between claim and start): mark for reconcile. */
  reconcileStaleClaims(nowMs: number, leaseMs: number = LEASE_MS): string[] {
    const reconciled: string[] = [];
    if (!this.store) return reconciled;
    const state = this.readState();
    let changed = false;
    for (const activationId of Object.values(state.claimed)) {
      const activation = this.readActivation(activationId);
      if (!activation) continue;
      if ((activation.state === "CLAIMED" || activation.state === "STARTING") && !activation.run_id) {
        const age = nowMs - (activation.claimed_at ?? activation.detected_at);
        if (age > leaseMs) {
          activation.state = "RECONCILE_REQUIRED";
          activation.detail = `stale claim older than ${leaseMs}ms without a run`;
          this.writeActivation(activation);
          reconciled.push(activationId);
          changed = true;
        }
      }
    }
    if (changed) this.writeState(state);
    return reconciled.sort();
  }
}

export type { Clock };
