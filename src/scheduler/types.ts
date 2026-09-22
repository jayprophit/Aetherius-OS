/**
 * P19/2 durable scheduler + trigger contracts. Time/event causes activation;
 * activation never grants authority. All timestamps are UTC epoch ms unless
 * a schedule explicitly carries a timezone (v1 supports UTC only).
 */

export interface Clock {
  nowMs(): number;
}

export type ScheduleKind = "ONE_TIME" | "INTERVAL" | "DAILY";

export interface Schedule {
  schedule_id: string;
  version: string;
  kind: ScheduleKind;
  /** ONE_TIME instant, INTERVAL anchor, DAILY first eligible day (UTC ms). */
  startAt: number;
  intervalMs?: number;
  /** DAILY: hour/minute UTC. */
  hourUtc?: number;
  minuteUtc?: number;
  /** v1 supports "UTC" only; anything else is rejected explicitly. */
  timezone?: string;
  endAt?: number;
  maxOccurrences?: number;
  misfireAfterMs?: number;
  misfirePolicy?: MisfirePolicy;
  enabled: boolean;
}

export type MisfirePolicy =
  | { policy: "SKIP" }
  | { policy: "RUN_ONCE_NOW" }
  | { policy: "CATCH_UP_BOUNDED"; maxMissed: number; maxAgeMs: number; maxPerCycle: number };

export interface AetheriusEvent {
  event_id: string;
  event_type: string;
  source: string;
  occurred_at: number;
  received_at: number;
  correlation_id?: string;
  /** JSON-safe payload. Never persisted wholesale; matched fields only. */
  payload: Record<string, unknown>;
  provenance: string;
  classification?: string;
}

export interface EventTrigger {
  trigger_id: string;
  version: string;
  event_type: string;
  source?: string;
  /** Declarative equality match on payload dot-paths. No expressions. */
  match?: Record<string, unknown>;
  routine_id: string;
  routine_version: string;
  enabled: boolean;
}

export type ActivationState =
  | "DETECTED"
  | "CLAIMED"
  | "STARTING"
  | "STARTED"
  | "SKIPPED"
  | "FAILED"
  | "CANCELLED"
  | "MISFIRED"
  | "RECONCILE_REQUIRED";

export interface Activation {
  activation_id: string;
  routine_id: string;
  routine_version: string;
  workflow_ref: string;
  workflow_version: string;
  trigger_kind: "schedule" | "event";
  schedule_id?: string;
  schedule_version?: string;
  /** Logical occurrence instant (schedules) or event id (triggers). */
  occurrence_key: string;
  scheduled_for?: number;
  event_id?: string;
  detected_at: number;
  claimed_by?: string;
  claimed_at?: number;
  run_id?: string;
  state: ActivationState;
  attempts: number;
  provenance: string;
  detail?: string;
}

export interface SchedulerState {
  /** occurrence_key -> activation_id (duplicate-fire protection). */
  claimed: Record<string, string>;
  /** `${trigger_id}:${event_id}` -> activation_id (redelivery dedup). */
  processedEvents: Record<string, string>;
  paused: boolean;
  lastTickAt?: number;
}

export type SchedulerErrorCode =
  | "INVALID_SCHEDULE"
  | "INVALID_TRIGGER"
  | "UNKNOWN_ROUTINE"
  | "UNKNOWN_WORKFLOW"
  | "ACTIVATION_CONFLICT"
  | "MISFIRE_LIMIT"
  | "EVENT_DUPLICATE"
  | "EVENT_INVALID"
  | "WORKFLOW_START_FAILED"
  | "CLOCK_ERROR"
  | "PERSISTENCE_ERROR";

export class SchedulerError extends Error {
  readonly code: SchedulerErrorCode;
  constructor(code: SchedulerErrorCode, message: string) {
    super(message);
    this.name = "SchedulerError";
    this.code = code;
  }
}
