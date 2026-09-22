import { SchedulerError } from "./types";
import type { AetheriusEvent, EventTrigger } from "./types";

function getPath(root: unknown, path: string[]): unknown {
  let current = root;
  for (const seg of path) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function validateTrigger(def: EventTrigger): string[] {
  const problems: string[] = [];
  if (!def.trigger_id.trim()) problems.push("trigger_id is required");
  if (!/^\d+\.\d+\.\d+$/.test(def.version)) {
    problems.push(`invalid version ${def.version} (x.y.z required)`);
  }
  if (!def.event_type.trim()) problems.push("event_type is required");
  if (!def.routine_id.trim()) problems.push("routine_id is required");
  if (!def.routine_version.trim() || !/^\d+\.\d+\.\d+$/.test(def.routine_version)) {
    problems.push(`invalid routine_version ${def.routine_version}`);
  }
  if (def.match !== undefined) {
    if (typeof def.match !== "object" || def.match === null || Array.isArray(def.match)) {
      problems.push("match must be an object of payload dot-paths to expected values");
    } else {
      for (const key of Object.keys(def.match)) {
        if (!/^[A-Za-z0-9_.]+$/.test(key)) {
          problems.push(`invalid match path ${key}`);
        }
      }
    }
  }
  return [...problems].sort();
}

export function validateEvent(event: AetheriusEvent): string[] {
  const problems: string[] = [];
  if (!event.event_id.trim()) problems.push("event_id is required");
  if (!event.event_type.trim()) problems.push("event_type is required");
  if (!event.source.trim()) problems.push("source is required");
  if (!Number.isFinite(event.occurred_at) || event.occurred_at < 0) {
    problems.push("occurred_at must be a non-negative epoch ms");
  }
  if (!Number.isFinite(event.received_at) || event.received_at < 0) {
    problems.push("received_at must be a non-negative epoch ms");
  }
  if (typeof event.payload !== "object" || event.payload === null || Array.isArray(event.payload)) {
    problems.push("payload must be an object");
  }
  if (!event.provenance.trim()) problems.push("provenance is required");
  return [...problems].sort();
}

/**
 * Declarative matching: event type, optional source, and equality on
 * payload dot-paths. No expressions, no eval. Pure + deterministic.
 */
export function triggerMatches(trigger: EventTrigger, event: AetheriusEvent): boolean {
  if (event.event_type !== trigger.event_type) return false;
  if (trigger.source !== undefined && event.source !== trigger.source) return false;
  for (const [path, expected] of Object.entries(trigger.match ?? {})) {
    if (!deepEqual(getPath(event.payload, path.split(".")), expected)) return false;
  }
  return true;
}

export function normalizeEvent(raw: Partial<AetheriusEvent> & { event_id: string; event_type: string; source: string }): AetheriusEvent {
  const event: AetheriusEvent = {
    event_id: raw.event_id.trim(),
    event_type: raw.event_type.trim(),
    source: raw.source.trim(),
    occurred_at: raw.occurred_at ?? Date.now(),
    received_at: raw.received_at ?? Date.now(),
    correlation_id: raw.correlation_id,
    payload: raw.payload ?? {},
    provenance: (raw.provenance ?? "internal").trim(),
    classification: raw.classification,
  };
  const problems = validateEvent(event);
  if (problems.length > 0) {
    throw new SchedulerError("EVENT_INVALID", problems.join("; "));
  }
  return event;
}
