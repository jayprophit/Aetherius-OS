# Cloud Persistent Execution Placement (REQ-cloud-persistent-exec, P30)

Always-on/scheduled heavy workloads on VPS/cloud runners under P20/P30
with the same worker bounds: temporary, observable, killable. No cloud
runner exists here, so this unit is placement POLICY, not provisioning.

## Policy (`src/placement/placement.ts`)

`decidePlacement(request, backends)` returns one of:

- `PLACE_LOCAL` — honest-sim local runner, under lease.
- `DEFER_CLOUD` — ssh/container requested but no backend: deferred with
  the reason, never pretended. Bounds still attached for when a backend
  exists.
- `DENY` — with explicit reasons.

Worker bounds are preconditions, mechanically checked:

- **temporary**: positive `ttlMs` lease required — always-on included;
- **observable**: `recordChannel` required for run records;
- **killable**: local placements enforce temp-only isolation so teardown
  is clean; teardown itself runs through the P20 runner lifecycle.

Unknown workload/runner kinds, empty ids, and unavailable local sim fail
closed with reasons.

Tests: `src/placement/placement.test.ts` (5 tests: local placement,
honest cloud deferral, bound denials, malformed requests, live-backend
path).
