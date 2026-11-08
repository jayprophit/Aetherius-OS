# Aetherius Cloud — Supabase control-plane schema

**Status:** APPLIED 2026-11-08 and verified. Grant hardening `0002` applied and
verified 2026-11-08.
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
| Applied to `aetherius-preview` via the Supavisor pooler | 2026-11-08, 0 failures |
| Tables present | all 6, no missing, no unexpected |
| RLS | enabled on all 6 |
| Policies | 0 (anon/authenticated denied) |
| anon boundary (PostgREST) | 200 with `[]` — zero rows |
| service_role boundary (PostgREST) | 200 with the 3 provider rows |
| Persistent read/write | `cloud_task` insert → read → delete OK |
| Live control-plane + health run | providers listed, 3 health rows persisted, task created/updated/read |

### Grant hardening — APPLIED 2026-11-08 (`0002`)

`anon` and `authenticated` held full table grants (`INSERT, SELECT, UPDATE,
DELETE, TRUNCATE, REFERENCES, TRIGGER`) on all six tables. RLS blocked them,
but the grants were latent: adding any policy later would have exposed the
control plane without a second review.

Preconditions verified before applying: tables owned by `postgres`, RLS enabled
on all six, **no** views / functions / triggers / sequences depending on them,
zero policies, `service_role` retaining `BYPASSRLS` and its own grants.

Migration `0002_revoke_anon_authenticated_grants.sql` revokes those grants.
Rollback `0002_revoke_anon_authenticated_grants_rollback.sql` restores the exact
prior privilege shape (`GRANT ALL` on a table grants those same seven).

| Check | Result |
|---|---|
| Statements applied | 6 of 6, 0 failures |
| anon / authenticated grants after | **none** on all six |
| service_role grants after | unchanged on all six |
| RLS | still enabled on all six |
| Policies | still 0 |
| anon boundary (PostgREST) | **401 `42501` permission denied** on all six |
| service_role boundary (PostgREST) | 200 / 201 — provider list, task create/read/delete |
| Persistent task CRUD | insert → read → update → delete OK |
| Provider health + usage tracking | rows written and cleaned up OK |
| Unrelated objects | none touched (no views, functions, triggers, sequences) |

**Residual risk:** `pg_default_acl` still grants `arwdDxtm` on **future** tables
created by `postgres` to `anon`/`authenticated`. `0002` covers only the six
existing control-plane tables. `alter default privileges revoke all on tables
from anon, authenticated` would close this for new tables — **awaiting approval**
(outside the six-table scope of this change).

### Worker registry — APPLIED 2026-11-08 (`0003`)

`cloud_worker` holds worker registration, identity, capabilities, availability,
lease/heartbeat state and audit metadata. RLS enabled, **zero** policies,
anon/authenticated grants revoked.

`auth_ref` stores a *reference* to a worker credential (`keepass:Workers/<id>`),
never the credential. Cloud workers never receive the service-role key; they
authenticate to a trusted server-side gateway.

| Check | Result |
|---|---|
| Table created | `cloud_worker`, 7 tables in `public` |
| RLS / policies | enabled / 0 |
| Grants | `postgres` + `service_role` only |
| Seeded worker | `local` (`LOCAL`, `IDLE`, `keepass:Workers/local`) |
| Worker CRUD | heartbeat update, insert, update, delete all OK |

### Default privileges — APPLIED 2026-11-08 (`0004`)

Only `postgres` and `supabase_admin` can `CREATE` in `public` (verified), and
only `postgres` runs Aetherius migrations, so `0004` is scoped to that role in
that schema. Functions were deliberately left unchanged (EXECUTE is a code
concern, not data exposure) and recorded rather than silently omitted.

| Check | Result |
|---|---|
| Statements | 2 of 2, 0 failures |
| New table created by `postgres` | grants for `postgres` + `service_role` only — **no** anon/authenticated |
| Probe table | dropped, confirmed gone |
| Six control-plane tables | unaffected; task CRUD still OK; grants unchanged |
| anon boundary (PostgREST) | `401 42501` on `cloud_task`; `404 PGRST205` on `cloud_worker` |
| service_role boundary (PostgREST) | `200` on `cloud_worker` (1 row) and `cloud_task` (8 rows) |

**Precise residual:** `pg_default_acl` holds a *global* relation ACL for
`postgres` (all schemas) that still names anon/authenticated, plus the
schema-specific `public` ACL that `0004` changed. Postgres applies the more
specific schema ACL, which is why the `public` probe came back clean. Tables in
`auth`, `storage`, `realtime`, `vault`, `extensions`, `graphql` and `pgbouncer`
follow their own provider conventions and are not Aetherius control-plane
tables.

### Notes

- The migration was applied directly through the pooler, so
  `supabase_migrations.schema_migrations` does not exist. Future migrations
  should use `supabase db execute` (or create the history table) so the schema
  and its history stay in sync.

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
