# Repository Relay-Cache (REQ-p30-repo-relay, P30)

Authorized scoped read relay with shared cache, budget-aware identity
routing and scoped tokens. Owner-authorized only — explicitly NOT a
rate-limit/ToS evasion tool. Reference: OctoPool relay/budget v0.7.1
(MIT, STUDY_ONLY).

## Rules (`src/relay/`)

- **Owner allowlist**: only `owner/name` or `owner/*` repos are servable;
  bare `*` never authorizes (policy validation rejects it).
- **Scoped tokens**: per-token repo allowlist + expiry; unknown, expired
  or mis-scoped tokens fail closed.
- **Shared content-addressed cache**: sha256-keyed entries with upstream
  URL, fetch time, token provenance; TTL + entry cap with oldest-first
  eviction.
- **Budget-aware routing without borrowing**: per-identity
  request/byte/window quotas; cache hits count as requests; exhaustion
  DENIES — the relay never reroutes to another identity's budget to dodge
  limits (tested: one identity's exhaustion while another sits idle).
- **Read-only, no network inside**: upstream bytes arrive through an
  injected fetcher (fixtures in tests); unsafe paths (`..`) rejected.

Tests: `src/relay/relay.test.ts` (6 tests: policy tightness, fetch/cache/
provenance, auth denials, budget isolation, upstream failures, eviction).
