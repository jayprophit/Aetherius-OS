import type { BenchmarkRecord, BenchmarkStore } from "./benchmarks";
import {
  routeCapabilityRequest,
  type CapabilityRequest,
  type ModelCard,
} from "./capabilities";
import { effectiveStatus, type HealthRecord } from "./health";

export interface LiveModel extends ModelCard {
  /** Freshness-aware observed state (stale decays to UNKNOWN). */
  observed: HealthRecord;
  observedFresh: boolean;
}

export interface LiveRouteExclusion {
  model: string;
  reason: string;
  observedStatus: string;
}

export interface LiveRouteResult {
  ranked: Array<LiveModel & { decision: string }>;
  excluded: LiveRouteExclusion[];
}

export interface BenchmarkPreference {
  metric: string;
  task: string;
}

/** Metrics where a lower value is better; all others are higher-better. */
const LOWER_BETTER = new Set(["latency", "cost", "resource_use"]);

function benchmarkHit(
  store: BenchmarkStore | undefined,
  model: string,
  prefer: BenchmarkPreference | undefined,
  nowMs: number,
  maxAgeMs: number,
): BenchmarkRecord | null {
  if (!store || !prefer) return null;
  const hit = store.latestLocal(model, prefer.metric, prefer.task);
  if (!hit) return null;
  if (nowMs - hit.timestamp > maxAgeMs) return null;
  return hit;
}

/**
 * Route with live state layered over P18/1 static compatibility.
 *
 * Eligibility tiers (deterministic, documented):
 *   fresh HEALTHY → declared-only → fresh DEGRADED; a fresh benchmark hit
 *   for the preferred (metric, task) promotes within tier. Everything else
 *   (UNAVAILABLE, AUTH_REQUIRED, stale/unknown, static-incompatible) is
 *   excluded with an explicit reason. Privacy/static failures from P18/1
 *   still fail explicitly — live state never overrides them.
 */
export function routeWithLiveState(
  models: LiveModel[],
  request: CapabilityRequest,
  store?: BenchmarkStore,
  prefer?: BenchmarkPreference,
  nowMs: number = Date.now(),
  benchmarkMaxAgeMs = 7 * 24 * 3600 * 1000,
): LiveRouteResult {
  // Static compatibility first (P18/1 authoritative, privacy included).
  const staticModels: ModelCard[] = models.map((m) => ({ ...m, healthy: true }));
  const staticResult = routeCapabilityRequest(staticModels, request);
  const staticallyOut = new Map(staticResult.excluded.map((e) => [e.model, e.reason]));

  const scored: Array<{ model: LiveModel; tier: number; decision: string }> = [];
  const excluded: LiveRouteExclusion[] = [];

  for (const model of models) {
    const staticReason = staticallyOut.get(model.id);
    if (staticReason !== undefined) {
      excluded.push({ model: model.id, reason: `static: ${staticReason}`, observedStatus: effectiveStatus(model.observed, nowMs) });
      continue;
    }
    const observed = effectiveStatus(model.observed, nowMs);
    const fresh = model.observed.status !== "UNKNOWN" && observed === model.observed.status;
    if (observed === "UNAVAILABLE" || observed === "AUTH_REQUIRED" || observed === "RATE_LIMITED" || observed === "MISCONFIGURED" || observed === "UNSUPPORTED") {
      excluded.push({ model: model.id, reason: `live: ${observed.toLowerCase()} (${model.observed.reason})`, observedStatus: observed });
      continue;
    }
    if (observed === "UNKNOWN") {
      excluded.push({ model: model.id, reason: "live: no fresh health observation (never UNKNOWN-as-healthy)", observedStatus: observed });
      continue;
    }
    const hit = benchmarkHit(store, model.id, prefer, nowMs, benchmarkMaxAgeMs);
    const tier = (observed === "HEALTHY" ? 0 : 2) + (hit ? 0 : 1);
    scored.push({
      model: { ...model, observedFresh: fresh },
      tier,
      decision:
        `tier ${tier} (${observed.toLowerCase()}${hit ? ` + fresh ${prefer?.metric} evidence` : ", no benchmark evidence"}); ` +
        `static-compatible; provenance: registry + ${model.observed.source}`,
    });
  }

  scored.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    // Within a tier, P18/1 static order (local, context, cost, id).
    if (a.model.localRemote !== b.model.localRemote) return a.model.localRemote === "local" ? -1 : 1;
    if (a.model.capabilities.contextLimit !== b.model.capabilities.contextLimit) {
      return b.model.capabilities.contextLimit - a.model.capabilities.contextLimit;
    }
    if (a.model.costRank !== b.model.costRank) return a.model.costRank - b.model.costRank;
    return a.model.id < b.model.id ? -1 : a.model.id > b.model.id ? 1 : 0;
  });
  const ranked = scored.map((s) => ({ ...s.model, decision: s.decision }));
  excluded.sort((a, b) => (a.model < b.model ? -1 : a.model > b.model ? 1 : 0));
  return { ranked, excluded };
}

export { LOWER_BETTER };
