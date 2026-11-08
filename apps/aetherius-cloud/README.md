# Aetherius Cloud Fabric

**Status:** operational control plane; inference verified; Agent Bridge worker
lifecycle bridged to the control plane; several providers pending owner action.
**Spend:** £0 (free tiers only).

## Implemented and verified

| Component | Evidence |
|---|---|
| Provider adapters (Groq, Gemini) | `src/providers/{groq,gemini}.ts`; 12 unit tests; live inference `READY` |
| Local fallback (Ollama) | `src/providers/ollama.ts`; live inference `READY` |
| Agent Bridge AI Gateway | `groq`/`gemini`/`local` all returned `READY` through `/aetherius/v1/inference` |
| Persistent control plane | `apps/aetherius-cloud/src/control-plane.ts`; 5 unit tests; live read/write |
| Provider health monitoring | `apps/aetherius-cloud/src/health-monitor.ts`; 3 unit tests; rows persisted |
| Free/freemium service catalog | `apps/aetherius-cloud/src/services.ts`; 33 services; BYO storage marked |
| Supabase control plane | 6 tables, RLS on all, zero policies; migration applied and verified |
| Cloudflare resources | Pages `aetherius-preview`, D1, KV, Queue, Worker `aetherius-sync` — all enumerated |
| Agent Bridge worker bridge | `compute/fabric_worker.py` + `compute/supabase_control_plane.py`; 31 tests; live run verified |

## Genesis Cloud Fabric — Agent Bridge worker bridge

Agent Bridge owns durable task state, leases, heartbeats, retries and recovery
(`task_dag.WorkQueue`, `task_dag.RetryPolicy`, `task_dag.RecoveryManager`,
`worker_runtime.SupervisedTask`). The bridge adds the missing server-side record
on top of that machinery — no second scheduler, task database or queue.

`cloud_task.history` is append-only and carries every transition, heartbeat,
retry decision, lease expiry and cancellation; `cloud_task.state` mirrors
`TaskStatus`. A task that ran without an independent verifier reaches `COMPLETE`,
never `VERIFIED_COMPLETE`.

Live run (`fab-smoke-` synthetic tasks, `degraded=false`, `dead_letters=0`):

| Case | Result |
|---|---|
| Verified artifact | `VERIFIED_COMPLETE` — verifier re-read the file and re-hashed it |
| Idempotent replay | one task id, one execution |
| Transient failure | `RETRYING` → `COMPLETE` |
| Cancellation | `CANCELLED`, handler never invoked |
| Permanent failure | `FAILED`, not requeued |

Details: `Agent-Bridge/CLOUD_FABRIC_WORKER_REPORT_2026-11-08.md`.

## Supabase control plane (applied)

Migration `supabase/migrations/0001_cloud_control_plane.sql` — **APPLIED 2026-11-08**.

| Table | Purpose | Rows |
|---|---|---|
| `cloud_provider` | provider registry | 3 (`local`, `groq`, `gemini`) |
| `cloud_resource` | provider resources | 0 |
| `provider_health` | health observations | written by the monitor |
| `cloud_task` | task state + history | written by the client |
| `cloud_usage` | token/cost tracking | 0 |
| `cloud_deployment` | deployment records | 0 |

**Access model:** RLS enabled on every table, **zero** policies → `anon`/`authenticated`
are denied (verified: anon reads return `[]`). Only the service_role (server-side)
reads or writes. See `supabase/README.md`.

## Blocked / pending

| Item | Blocker | Owner action |
|---|---|---|
| OpenRouter authenticated inference | Stored key is masked/incomplete | Issue a new key |
| Cloudflare Workers AI / AI Gateway | OAuth now carries `ai (write)` + `ai-search`; 12+ models listable | Approve a binding + test deploy |
| Cloudflare R2 | Bucket `aetherius-blobs` exists (created 2026-11-07); empty | Approve blob-sync use |
| Credential rotation (Gemini, Groq, HF, Vercel, opencode) | Awaiting approval | Approve, or accept the exposure risk |
| anon/authenticated table grants | **Resolved** — revoked by `0002`; anon now gets `401 42501` | None |
| `cloud_worker` table | Not in the schema; worker health shares `provider_health` under the `local` provider | Approve a `0003` migration |

## Architecture rules

- One adapter set, one router, one credential mechanism — shared by the OS, the
  cloud app, Genesis and Agent Bridge.
- Credentials are resolved **by reference** (`keepass:…`); never hardcoded, never
  logged, never sent to a model prompt.
- Remote adapters are `local = false`; `invokeRoute` rejects `LOCAL_ONLY` requests
  structurally.
- Bring-your-own storage keeps user data under user control.
