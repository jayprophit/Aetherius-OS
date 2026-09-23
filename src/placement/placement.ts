import type { Isolation, RunnerKind } from "../runners/types";

/**
 * REQ-cloud-persistent-exec (P30): cloud persistent execution placement.
 *
 * Always-on/scheduled heavy workloads on VPS/cloud runners under P20/P30
 * with the same worker bounds: temporary, observable, killable.
 *
 * No cloud runner exists on this workstation, so this module is placement
 * POLICY, not provisioning: it decides where a workload may go and under
 * which bounds, against the declared backend capabilities. Cloud
 * placements resolve to DEFERRED (honest: no backend), never to a
 * pretended runner. Local placements resolve to the honest-sim runner.
 *
 * Worker bounds are preconditions, not prose:
 * - temporary: every placement requires a positive ttlMs lease;
 * - observable: every placement names its run-record channel;
 * - killable: every placement requires a teardown plan (runner teardown).
 * Missing any of them DENIES the placement with reasons.
 *
 * Reference: Saraev always-on/scheduled workload patterns (STUDY_ONLY).
 */

export type WorkloadKind = "scheduled" | "always-on";

export interface PlacementRequest {
  workloadId: string;
  kind: WorkloadKind;
  /** Requested runner family. */
  runnerKind: RunnerKind;
  /** Lease in ms: placements are temporary, always. */
  ttlMs?: number;
  isolation?: Isolation;
  /** Channel where run records are observable. */
  recordChannel?: string;
  /** Estimated heavy-workload hours (scheduling hint). */
  estHours?: number;
}

export type PlacementVerdict = "PLACE_LOCAL" | "DEFER_CLOUD" | "DENY";

export interface PlacementDecision {
  workloadId: string;
  verdict: PlacementVerdict;
  runnerKind: RunnerKind;
  reasons: string[];
  bounds: { ttlMs: number; recordChannel: string; isolation: Isolation };
}

export interface BackendAvailability {
  localSimAvailable: boolean;
  cloudAvailable: boolean;
  cloudReason: string;
}

const DEFAULT_ISOLATION: Isolation = { network: "none", filesystem: "temp-only", label: "placement-default" };

export function decidePlacement(
  request: PlacementRequest,
  backends: BackendAvailability,
): PlacementDecision {
  const reasons: string[] = [];
  if (!request.workloadId.trim()) {
    return deny(request, ["workloadId is required"]);
  }
  if (request.kind !== "scheduled" && request.kind !== "always-on") {
    return deny(request, [`unknown workload kind ${String(request.kind)}`]);
  }
  // Worker bounds as preconditions.
  if (!Number.isInteger(request.ttlMs) || (request.ttlMs as number) < 1) {
    reasons.push("temporary bound: ttlMs lease is required (positive integer ms)");
  }
  if (!request.recordChannel?.trim()) {
    reasons.push("observable bound: recordChannel is required");
  }
  const isolation = request.isolation ?? DEFAULT_ISOLATION;
  if (isolation.filesystem !== "temp-only" && request.runnerKind === "local-directory") {
    reasons.push("killable bound: local placements enforce temp-only isolation for clean teardown");
  }
  if (reasons.length > 0) {
    return deny(request, reasons);
  }
  const bounds = {
    ttlMs: request.ttlMs as number,
    recordChannel: (request.recordChannel as string).trim(),
    isolation,
  };
  if (request.runnerKind === "local-directory") {
    if (!backends.localSimAvailable) {
      return deny(request, ["local sim runner unavailable"]);
    }
    return {
      workloadId: request.workloadId.trim(),
      verdict: "PLACE_LOCAL",
      runnerKind: request.runnerKind,
      reasons: [`${request.kind} workload placed on honest-sim local runner under lease ${bounds.ttlMs}ms`],
      bounds,
    };
  }
  if (request.runnerKind === "ssh" || request.runnerKind === "container") {
    if (!backends.cloudAvailable) {
      return {
        workloadId: request.workloadId.trim(),
        verdict: "DEFER_CLOUD",
        runnerKind: request.runnerKind,
        reasons: [`no ${request.runnerKind} backend: ${backends.cloudReason}`, "placement deferred, never pretended"],
        bounds,
      };
    }
    return {
      workloadId: request.workloadId.trim(),
      verdict: "PLACE_LOCAL",
      runnerKind: request.runnerKind,
      reasons: [`${request.kind} workload placed on ${request.runnerKind} under lease ${bounds.ttlMs}ms`],
      bounds,
    };
  }
  return deny(request, [`unknown runner kind ${String(request.runnerKind)}`]);
}

function deny(request: PlacementRequest, reasons: string[]): PlacementDecision {
  return {
    workloadId: typeof request.workloadId === "string" ? request.workloadId.trim() : "",
    verdict: "DENY",
    runnerKind: request.runnerKind,
    reasons,
    bounds: {
      ttlMs: 0,
      recordChannel: "",
      isolation: request.isolation ?? DEFAULT_ISOLATION,
    },
  };
}
