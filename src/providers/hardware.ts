/**
 * REQ-p18-hardware-profiles: empirical hardware profiles for routing.
 *
 * Measured CPU/GPU/NPU precision-matrix profiles replace name-pattern
 * heuristics with provenanced, machine-readable capability data for
 * P18/P20 routing. This module is NOT a model router (capabilities.ts
 * owns routing) and NOT the blocked Model Fabric: profiles are local
 * measurable inputs, never live-provider proof.
 *
 * Permanent distinctions, enforced by validation:
 * - HARDWARE NAME != MEASURED CAPABILITY (names never imply numbers)
 * - DECLARED SUPPORT != EMPIRICALLY VERIFIED (only MEASURED carries numbers)
 * - MISSING MEASUREMENT != ZERO PERFORMANCE (UNMEASURED/UNAVAILABLE are
 *   distinct exclusion reasons, never zeros)
 * - Provenance classes never mix: one profile, one provenance.
 */

export type DeviceClass = "CPU" | "GPU" | "NPU";

export const DEVICE_CLASSES: readonly DeviceClass[] = ["CPU", "GPU", "NPU"];

/** Conventional labels; the vocabulary is open but only MEASURED entries carry numbers. */
export const WELL_KNOWN_PRECISIONS: readonly string[] = ["FP32", "FP16", "BF16", "INT8", "INT4"];

export type PrecisionSupport = "MEASURED" | "UNMEASURED" | "KNOWN_UNSUPPORTED" | "UNAVAILABLE";

export type ProfileProvenance =
  | "LOCAL_EMPIRICAL"
  | "EXTERNAL_BENCHMARK"
  | "VENDOR_REPORTED"
  | "ESTIMATED"
  | "UNVERIFIED";

export interface PrecisionEntry {
  precision: string;
  support: PrecisionSupport;
  latencyMs?: number;
  throughputOps?: number;
  peakMemoryMB?: number;
  samples?: number;
}

export interface HardwareProfile {
  profileId: string;
  deviceClass: DeviceClass;
  vendor?: string;
  model?: string;
  architecture?: string;
  runtime?: string;
  hostFingerprint?: string;
  measuredAt: string;
  workloadId: string;
  workloadVersion: string;
  provenance: ProfileProvenance;
  precisions: PrecisionEntry[];
}

export type HardwareProblem =
  | "profile-id"
  | "device-class"
  | "timestamp"
  | "workload"
  | "provenance"
  | "precision-label"
  | "precision-support"
  | "numbers-required"
  | "numbers-forbidden";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Validate a profile. Empty problems = registrable. */
export function validateHardwareProfile(profile: HardwareProfile): HardwareProblem[] {
  const problems: HardwareProblem[] = [];
  if (!nonEmpty(profile.profileId)) problems.push("profile-id");
  if (!DEVICE_CLASSES.includes(profile.deviceClass)) problems.push("device-class");
  if (!nonEmpty(profile.measuredAt) || Number.isNaN(Date.parse(profile.measuredAt))) problems.push("timestamp");
  if (!nonEmpty(profile.workloadId) || !nonEmpty(profile.workloadVersion)) problems.push("workload");
  const provenances: ProfileProvenance[] = ["LOCAL_EMPIRICAL", "EXTERNAL_BENCHMARK", "VENDOR_REPORTED", "ESTIMATED", "UNVERIFIED"];
  if (!provenances.includes(profile.provenance)) problems.push("provenance");
  if (!Array.isArray(profile.precisions) || profile.precisions.length === 0) {
    problems.push("precision-support");
    return [...new Set(problems)].sort() as HardwareProblem[];
  }
  const seen = new Set<string>();
  for (const entry of profile.precisions) {
    if (!nonEmpty(entry.precision)) {
      problems.push("precision-label");
      continue;
    }
    if (seen.has(entry.precision.trim())) problems.push("precision-label");
    seen.add(entry.precision.trim());
    const supports: PrecisionSupport[] = ["MEASURED", "UNMEASURED", "KNOWN_UNSUPPORTED", "UNAVAILABLE"];
    if (!supports.includes(entry.support)) {
      problems.push("precision-support");
      continue;
    }
    const numbers = [entry.latencyMs, entry.throughputOps, entry.peakMemoryMB, entry.samples];
    const anyNumber = numbers.some((n) => n !== undefined);
    if (entry.support === "MEASURED") {
      // Measured means measured: latency + samples required, all numbers finite.
      if (entry.latencyMs === undefined || entry.samples === undefined ||
          !numbers.every((n) => n === undefined || finiteNonNegative(n))) {
        problems.push("numbers-required");
      }
    } else if (anyNumber) {
      // Non-measured entries must not carry numbers (anti-fabrication).
      problems.push("numbers-forbidden");
    }
  }
  return [...new Set(problems)].sort() as HardwareProblem[];
}

/** Declare an unmeasured device honestly (no numbers, UNVERIFIED provenance). */
export function unmeasuredProfile(
  profileId: string,
  deviceClass: DeviceClass,
  precisions: readonly string[],
  reason: string,
  measuredAt: string,
): HardwareProfile {
  return {
    profileId,
    deviceClass,
    measuredAt,
    workloadId: "none",
    workloadVersion: "0.0.0",
    provenance: "UNVERIFIED",
    precisions: precisions.map((precision) => ({ precision, support: "UNMEASURED" as const })),
    hostFingerprint: reason,
  };
}

export class HardwareProfileRegistry {
  private readonly profiles = new Map<string, HardwareProfile>();

  register(profile: HardwareProfile): HardwareProfile {
    const problems = validateHardwareProfile(profile);
    if (problems.length > 0) throw new Error(`invalid hardware profile: ${problems.join(",")}`);
    if (this.profiles.has(profile.profileId)) throw new Error(`duplicate hardware profile ${profile.profileId}`);
    const stored: HardwareProfile = JSON.parse(JSON.stringify(profile)) as HardwareProfile;
    this.profiles.set(profile.profileId, stored);
    return stored;
  }

  lookup(profileId: string): HardwareProfile | null {
    return this.profiles.get(profileId) ?? null;
  }

  list(): HardwareProfile[] {
    return [...this.profiles.values()].sort((a, b) => (a.profileId < b.profileId ? -1 : 1));
  }
}

export interface PrecisionRank {
  profile: HardwareProfile;
  latencyMs: number;
}

export interface PrecisionRouteResult {
  ranked: PrecisionRank[];
  excluded: { profile: string; reason: string }[];
}

/**
 * Rank profiles with MEASURED support for a precision by latency, then
 * profile id. Everything else is excluded with an explicit reason —
 * names, vendors and declarations never outrank measurements.
 */
export function rankForPrecision(
  profiles: readonly HardwareProfile[],
  precision: string,
): PrecisionRouteResult {
  const ranked: PrecisionRank[] = [];
  const excluded: { profile: string; reason: string }[] = [];
  for (const profile of [...profiles].sort((a, b) => (a.profileId < b.profileId ? -1 : 1))) {
    const entry = profile.precisions.find((p) => p.precision === precision);
    if (!entry) {
      excluded.push({ profile: profile.profileId, reason: `precision ${precision} not listed` });
      continue;
    }
    if (entry.support === "MEASURED" && entry.latencyMs !== undefined) {
      ranked.push({ profile, latencyMs: entry.latencyMs });
      continue;
    }
    const reason =
      entry.support === "KNOWN_UNSUPPORTED"
        ? `precision ${precision} unsupported on ${profile.profileId}`
        : entry.support === "UNAVAILABLE"
          ? `device ${profile.profileId} unavailable`
          : `precision ${precision} unmeasured on ${profile.profileId}`;
    excluded.push({ profile: profile.profileId, reason });
  }
  ranked.sort((a, b) => (a.latencyMs !== b.latencyMs ? a.latencyMs - b.latencyMs : a.profile.profileId < b.profile.profileId ? -1 : 1));
  return { ranked, excluded };
}
