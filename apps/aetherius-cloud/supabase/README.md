# Aetherius Cloud — Supabase control-plane schema

**Status:** PREPARED, NOT APPLIED. Awaiting owner approval.
**Target:** Supabase project `aetherius-preview` (ref `uympblyzeckxngglifnz`), `eu-west-2`.
**Spend:** £0 (free plan, nano compute).

## 1. What is proposed

One migration, `migrations/0001_cloud_control_plane.sql`, creating the minimum
tables for the cloud control plane:

| Table | Purpose | Canonical model mirrored |
|---|---|---|
| `cloud_provider` | Provider registry (local + remote) | `src/providers/types.ts` `ProviderKind` |
| `cloud_resource` | Provider resources (D1, KV, Queue, Pages, project) | KeePass `Aetherius/Cloud/*` entries |
| `provider_health` | Health observations with latency | `src/providers/health.ts` `HealthRecord` |
| `cloud_task` | Task/workflow state + append-only history | `app-kit` `WorkflowInstance` |
| `cloud_usage` | Token usage and cost per call | `InvokeUsage` + `cost_gbp` |
| `cloud_deployment` | Deployment records | `apps/aetherius-cloud` `Deployment` |

## 2. Security model

- **Row Level Security enabled on every table**, with **no** `anon`/`authenticated`
  policies — access is denied by default.
- Only the **service_role** key (which bypasses RLS) may read or write.
- The service_role key **never** reaches a browser, a hosted model prompt, a
  public endpoint or a client bundle.
- `credential_ref` stores a stable reference (`keepass:...`), never a secret.
- `cost_gbp` defaults to `0`; the £0 policy is enforced in application code.

## 3. Validation performed

| Check | Result |
|---|---|
| `sqlglot` (postgres dialect) parse | 17 statements, OK |
| `pglast` / libpg_query (real Postgres parser) | 17 statements, OK |
| Rollback parse | 6 statements, OK |
| Live apply | **NOT DONE** — awaiting approval (no local Postgres; Docker daemon stopped) |

## 4. Rollback strategy

`migrations/0001_cloud_control_plane_rollback.sql` drops the six tables in
reverse dependency order. It is destructive and requires explicit approval.

Additional safeguards before any apply:

1. Take a Supabase point-in-time backup (free plan retains 7 days).
2. Apply in a transaction; verify `\dt` and row counts.
3. Confirm the app reads correctly, then keep the rollback script ready.

## 5. Apply procedure (on approval)

```bash
# server-side only; never from a browser
supabase db execute --file apps/aetherius-cloud/supabase/migrations/0001_cloud_control_plane.sql
```

## 6. Owner approval gate

- [ ] Approve applying `0001_cloud_control_plane.sql` to `aetherius-preview`
- [ ] Approve the rollback script being retained (not run)
- [ ] Confirm no client application receives the service_role key
