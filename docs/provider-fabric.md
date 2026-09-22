# Provider / model fabric (P18/1 + P18/2)

Genesis asks for capabilities; Aetherius routes. Vendors are replaceable.

## Layers

1. **P10 health registry** (`src/providers/registry.ts`): availability/latency
   checks per provider. Never throws; failures become ERROR reports.
2. **P18/1 capability routing** (`src/providers/capabilities.ts`): static
   compatibility filter + deterministic rank (local-first, context, cost,
   stable id). Manual pin still enforces hard requirements. Explicit failure,
   never silent cross-privacy fallback.
3. **P18/2 live state** (`src/providers/health.ts`, `benchmarks.ts`,
   `live.ts`): declared capability is kept separate from observed state.
   Health records carry status, observedAt, TTL, source and reason; stale
   observations decay to UNKNOWN, and UNKNOWN is never routable.
   Benchmark evidence is multidimensional, provenance-tagged
   (LOCAL_MEASURED beats marketing only when fresh and relevant) and
   append-only. Live cards persist through the P17 owned-state layer.

## Routing pipeline

capability request → static filter (P18/1, privacy included) → live
availability/health filter → pin rules → benchmark-informed deterministic
rank → select + provenance. Observability: every rejection carries a reason;
every selection carries tier, provenance and evidence age.

## Probes

Ollama (`/api/version`, `/api/tags`), LM Studio (`/v1/models`) and Codex
CLI (`--version` only; auth never inferred, tokens never read) run
read-only with short timeouts. Nothing is started, downloaded or launched
by probing. Cloud providers without configuration are honestly
NOT_CONFIGURED/UNKNOWN.
