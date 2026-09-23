import type { AetheriusEvent } from "../scheduler/types";
import type { LogEvent } from "../realtime/types";
import type { HistoryEvent } from "../workflows/types";
import type { StewardReport } from "../steward/types";
import type { BridgeActionRequest } from "../workflows/bridgeAction";

/**
 * REQ-p19-event-envelope: unified event correlation envelope.
 *
 * Five incompatible per-domain event shapes exist (scheduler, realtime,
 * workflow, steward, bridge). This module does NOT replace them: domain
 * events stay valid independently with their own validation. The
 * envelope is an additive correlation view — common metadata plus the
 * untouched domain payload — so cross-domain tracing works without
 * lossy flattening.
 *
 * Envelope != event bus: no broker, queue, delivery or retry lives
 * here (P27 owns transport). Event occurred != evidence passed.
 * Correlation != causation: separate optional ids, never equated,
 * absent stays absent (never guessed).
 */

export type EventDomain = "scheduler" | "realtime" | "workflow" | "steward" | "bridge";

export const EVENT_DOMAINS: readonly EventDomain[] = ["scheduler", "realtime", "workflow", "steward", "bridge"];

export interface EventEnvelope<TPayload = Record<string, unknown>> {
  /** Deterministic domain-derived id (never random, never guessed). */
  eventId: string;
  /** Domain-qualified original type, e.g. scheduler:REVIEW.PR_OPENED. */
  eventType: string;
  schemaVersion: "1";
  domain: EventDomain;
  /** Occurrence time, epoch ms. */
  occurredAt: number;
  /** Ingress/record time where the domain tracks one; else absent. */
  receivedAt?: number;
  source: string;
  /** Same broader operation. Optional, never invented. */
  correlationId?: string;
  /** The event that directly caused this one. Optional, never equated with correlation. */
  causationId?: string;
  taskId?: string;
  workflowRunId?: string;
  stepRunId?: string;
  workerId?: string;
  principalId?: string;
  projectId?: string;
  /** Untouched domain payload. */
  payload: TPayload;
  evidenceRefs?: string[];
  provenance: string;
}

export type EnvelopeProblem =
  | "event-id"
  | "event-type"
  | "schema-version"
  | "domain"
  | "occurred-at"
  | "received-at"
  | "source"
  | "correlation"
  | "causation"
  | "provenance";

const TYPE_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validMs(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Parse an ISO timestamp to epoch ms, or null when unparseable. */
export function epochMs(value: string | number): number | null {
  if (typeof value === "number") return validMs(value) ? value : null;
  if (!nonEmpty(value)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && ms >= 0 ? ms : null;
}

/** Validate an envelope structurally. Domain payloads keep their own validation. */
export function validateEnvelope<TPayload>(envelope: EventEnvelope<TPayload>): EnvelopeProblem[] {
  const problems: EnvelopeProblem[] = [];
  if (!nonEmpty(envelope.eventId)) problems.push("event-id");
  if (!nonEmpty(envelope.eventType) || !TYPE_RE.test(envelope.eventType)) problems.push("event-type");
  if (envelope.schemaVersion !== "1") problems.push("schema-version");
  if (!EVENT_DOMAINS.includes(envelope.domain)) problems.push("domain");
  if (!validMs(envelope.occurredAt)) problems.push("occurred-at");
  if (envelope.receivedAt !== undefined && !validMs(envelope.receivedAt)) problems.push("received-at");
  if (!nonEmpty(envelope.source)) problems.push("source");
  for (const [field, code] of [["correlationId", "correlation"], ["causationId", "causation"]] as const) {
    const value = envelope[field];
    if (value !== undefined && !nonEmpty(value)) problems.push(code);
  }
  if (!nonEmpty(envelope.provenance)) problems.push("provenance");
  return [...new Set(problems)].sort() as EnvelopeProblem[];
}

/** Deterministic canonical serialization for hashing/comparison. */
export function canonicalEnvelope<TPayload>(envelope: EventEnvelope<TPayload>): string {
  return JSON.stringify(envelope);
}

interface AdapterInput {
  eventId: string;
  eventType: string;
  occurredAt: number | string;
  source: string;
  provenance: string;
  receivedAt?: number;
  correlationId?: string;
  causationId?: string;
  taskId?: string;
  workflowRunId?: string;
  stepRunId?: string;
  workerId?: string;
  principalId?: string;
  projectId?: string;
  evidenceRefs?: string[];
}

function buildEnvelope<TPayload>(
  domain: EventDomain,
  payload: TPayload,
  input: AdapterInput,
): EventEnvelope<TPayload> {
  const occurredAt = epochMs(input.occurredAt);
  if (occurredAt === null) {
    throw new Error(`cannot envelope ${domain} event: unparseable occurredAt`);
  }
  const envelope: EventEnvelope<TPayload> = {
    eventId: input.eventId,
    eventType: input.eventType,
    schemaVersion: "1",
    domain,
    occurredAt,
    source: input.source,
    payload,
    provenance: input.provenance,
  };
  const optional = {
    receivedAt: input.receivedAt,
    correlationId: input.correlationId,
    causationId: input.causationId,
    taskId: input.taskId,
    workflowRunId: input.workflowRunId,
    stepRunId: input.stepRunId,
    workerId: input.workerId,
    principalId: input.principalId,
    projectId: input.projectId,
    evidenceRefs: input.evidenceRefs,
  } as const;
  for (const [key, value] of Object.entries(optional)) {
    if (value !== undefined) {
      (envelope as unknown as Record<string, unknown>)[key] = value;
    }
  }
  const problems = validateEnvelope(envelope);
  if (problems.length > 0) {
    throw new Error(`invalid ${domain} envelope: ${problems.join(",")}`);
  }
  return envelope;
}

/** Seed adapter: scheduler AetheriusEvent (externally-supplied id, dual epoch-ms timestamps). */
export function envelopeSchedulerEvent(event: AetheriusEvent): EventEnvelope<Record<string, unknown>> {
  return buildEnvelope("scheduler", event.payload, {
    eventId: event.event_id,
    eventType: `scheduler:${event.event_type}`,
    occurredAt: event.occurred_at,
    receivedAt: event.received_at,
    source: event.source,
    correlationId: event.correlation_id,
    provenance: event.provenance,
  });
}

/** Realtime LogEvent: deterministic (channel,seq) identity, single ISO timestamp. */
export function envelopeRealtimeEvent(event: LogEvent): EventEnvelope<Record<string, unknown>> {
  return buildEnvelope("realtime", event.payload, {
    eventId: `${event.channel}:${event.seq}`,
    eventType: `realtime:${event.kind}`,
    occurredAt: event.at,
    source: `realtime:${event.channel}`,
    provenance: "p27-realtime-transport",
  });
}

/** Workflow HistoryEvent: deterministic (run,seq) identity, ISO timestamp. */
export function envelopeWorkflowEvent(
  runId: string,
  event: HistoryEvent,
): EventEnvelope<{ stepId?: string; detail?: string }> {
  return buildEnvelope(
    "workflow",
    { ...(event.step_id !== undefined ? { stepId: event.step_id } : {}), ...(event.detail !== undefined ? { detail: event.detail } : {}) },
    {
      eventId: `${runId}:${event.seq}`,
      eventType: `workflow:${event.kind}`,
      occurredAt: event.at,
      source: `workflow:${runId}`,
      workflowRunId: runId,
      ...(event.step_id !== undefined ? { stepRunId: `${runId}:${event.step_id}` } : {}),
      provenance: "p19-workflow-runtime",
    },
  );
}

/** Steward report: deterministic target-derived id, trigger as causation class. */
export function envelopeStewardReport(report: StewardReport): EventEnvelope<StewardReport> {
  return buildEnvelope("steward", report, {
    eventId: report.id,
    eventType: `steward:review-${report.readiness.verdict}`,
    occurredAt: report.generatedAt,
    source: `steward:${report.target.repo}#${report.target.kind}-${report.target.number}`,
    causationId: `steward-trigger:${report.trigger}`,
    provenance: "p16-steward-automation",
  });
}

/** Bridge action request: deterministic runId:stepId dedup id, explicit run/step causation. */
export function envelopeBridgeAction(
  request: BridgeActionRequest,
  occurredAt: number,
): EventEnvelope<Record<string, unknown> | undefined> {
  return buildEnvelope("bridge", request.payload, {
    eventId: request.actionId,
    eventType: `bridge:${request.action}`,
    occurredAt,
    source: `bridge:${request.sessionId}`,
    causationId: `${request.provenance.runId}:${request.provenance.stepId}`,
    workflowRunId: request.provenance.runId,
    stepRunId: `${request.provenance.runId}:${request.provenance.stepId}`,
    principalId: request.principal,
    provenance: `bridge-action:${request.provenance.runId}:${request.provenance.stepId}`,
  });
}
