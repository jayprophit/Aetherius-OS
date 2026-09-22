import { SchedulerError } from "./types";
import type { Schedule } from "./types";

export const DEFAULT_MISFIRE_AFTER_MS = 5 * 60 * 1000;

function isVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

export function validateSchedule(def: Schedule): string[] {
  const problems: string[] = [];
  if (!def.schedule_id.trim()) problems.push("schedule_id is required");
  if (!isVersion(def.version)) problems.push(`invalid version ${def.version}`);
  if (!["ONE_TIME", "INTERVAL", "DAILY"].includes(def.kind)) {
    problems.push(`unsupported schedule kind ${def.kind}`);
    return [...problems].sort();
  }
  if (!Number.isFinite(def.startAt) || def.startAt < 0) {
    problems.push("startAt must be a non-negative epoch ms");
  }
  if (def.timezone !== undefined && def.timezone !== "UTC") {
    problems.push(`unsupported timezone ${def.timezone} (UTC only in v1)`);
  }
  if (def.kind === "INTERVAL") {
    if (def.intervalMs === undefined || !Number.isFinite(def.intervalMs) || def.intervalMs <= 0) {
      problems.push("INTERVAL schedules require a positive intervalMs");
    }
  }
  if (def.kind === "DAILY") {
    if (def.hourUtc === undefined || def.hourUtc < 0 || def.hourUtc > 23 || !Number.isInteger(def.hourUtc)) {
      problems.push("DAILY schedules require integer hourUtc 0..23");
    }
    if (def.minuteUtc === undefined || def.minuteUtc < 0 || def.minuteUtc > 59 || !Number.isInteger(def.minuteUtc)) {
      problems.push("DAILY schedules require integer minuteUtc 0..59");
    }
  }
  if (def.endAt !== undefined && (!Number.isFinite(def.endAt) || def.endAt <= def.startAt)) {
    problems.push("endAt must be after startAt");
  }
  if (def.maxOccurrences !== undefined && (!Number.isInteger(def.maxOccurrences) || def.maxOccurrences < 1)) {
    problems.push("maxOccurrences must be a positive integer");
  }
  if (def.misfireAfterMs !== undefined && (!Number.isFinite(def.misfireAfterMs) || def.misfireAfterMs < 0)) {
    problems.push("misfireAfterMs must be non-negative");
  }
  const policy = def.misfirePolicy;
  if (policy !== undefined) {
    if (policy.policy === "CATCH_UP_BOUNDED") {
      if (!Number.isInteger(policy.maxMissed) || policy.maxMissed < 1) {
        problems.push("CATCH_UP_BOUNDED requires positive integer maxMissed");
      }
      if (!Number.isFinite(policy.maxAgeMs) || policy.maxAgeMs < 0) {
        problems.push("CATCH_UP_BOUNDED requires non-negative maxAgeMs");
      }
      if (!Number.isInteger(policy.maxPerCycle) || policy.maxPerCycle < 1) {
        problems.push("CATCH_UP_BOUNDED requires positive integer maxPerCycle");
      }
    } else if (policy.policy !== "SKIP" && policy.policy !== "RUN_ONCE_NOW") {
      problems.push(`unknown misfire policy ${(policy as { policy: string }).policy}`);
    }
  }
  return [...problems].sort();
}

/**
 * Pure due-occurrence calculation: all occurrence instants in (fromMs, toMs]
 * for one schedule. No side effects, no clock reads. INTERVAL uses
 * scheduled-time semantics anchored at startAt (predictable cadence).
 */
export function dueOccurrences(schedule: Schedule, fromMs: number, toMs: number): number[] {
  const problems = validateSchedule(schedule);
  if (problems.length > 0) {
    throw new SchedulerError("INVALID_SCHEDULE", problems.join("; "));
  }
  if (toMs <= fromMs) return [];
  const end = schedule.endAt !== undefined ? Math.min(toMs, schedule.endAt) : toMs;
  const limit = schedule.maxOccurrences;
  const out: number[] = [];

  if (schedule.kind === "ONE_TIME") {
    if (schedule.startAt > fromMs && schedule.startAt <= end) out.push(schedule.startAt);
    return out;
  }

  // Candidate instants in ascending order (INTERVAL anchors at startAt;
  // DAILY uses UTC calendar days), then one uniform window/limit filter.
  // `prior` counts occurrences at or before fromMs for maxOccurrences.
  let candidates: number[];
  let prior = 0;
  if (schedule.kind === "INTERVAL") {
    const every = schedule.intervalMs as number;
    candidates = [];
    if (limit !== undefined && fromMs >= schedule.startAt) {
      prior = Math.floor((fromMs - schedule.startAt) / every) + 1;
    }
    const k0 = Math.max(0, Math.ceil((fromMs + 1 - schedule.startAt) / every));
    for (let k = k0, guard = 0; guard < 100000; guard++, k++) {
      const at = schedule.startAt + k * every;
      if (at > end) break;
      candidates.push(at);
    }
  } else {
    const dayMs = 24 * 3600 * 1000;
    const tod = (schedule.hourUtc as number) * 3600000 + (schedule.minuteUtc as number) * 60000;
    const firstDay = Math.floor(schedule.startAt / dayMs) * dayMs;
    const firstEligible = firstDay + tod >= schedule.startAt ? firstDay + tod : firstDay + dayMs + tod;
    candidates = [];
    if (limit !== undefined && fromMs >= firstEligible) {
      prior = Math.floor((fromMs - firstEligible) / dayMs) + 1;
    }
    // Jump straight to days that can fall inside the window.
    const jumpStart = Math.max(firstEligible, fromMs + 1);
    const d0 = firstDay + Math.max(0, Math.floor((jumpStart - firstDay - tod) / dayMs)) * dayMs;
    for (let d = d0, guard = 0; guard < 100000; guard++, d += dayMs) {
      const at = d + tod;
      if (at > end) break;
      if (at <= fromMs || at < firstEligible) continue;
      candidates.push(at);
    }
  }
  for (const at of candidates) {
    if (limit !== undefined && prior >= limit) break;
    out.push(at);
    prior += 1;
  }
  return out;
}

export function occurrenceKey(scheduleId: string, version: string, atMs: number): string {
  return `${scheduleId}@${version}:${atMs}`;
}
