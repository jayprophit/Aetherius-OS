-- Aetherius Cloud — worker registry (free tier)
-- Target: Supabase (Postgres 15+). Applied with the table owner ONLY.
--
-- Scope: one table, cloud_worker, for worker registration, identity,
-- capabilities, availability, lease/heartbeat state and audit metadata.
--
-- SECURITY: RLS enabled with NO policies for anon/authenticated, and their
-- grants are revoked explicitly so the server-only access model is explicit at
-- the privilege layer (matching 0002).
--
-- `auth_ref` stores a REFERENCE to a worker credential (for example
-- `keepass:Workers/<id>`), never the credential itself. Cloud workers never
-- receive the Supabase service-role key; they authenticate to a trusted
-- server-side gateway, which holds the key.
--
-- Preconditions verified before applying:
--   * only `postgres` and `supabase_admin` can CREATE in schema `public`
--   * no views, functions, triggers or sequences depend on the control plane
--   * `cloud_provider` contains the `local` row referenced by the seed below
--
-- Rollback: 0003_cloud_worker_rollback.sql

create table if not exists cloud_worker (
  worker_id        text primary key,
  display_name     text not null,
  kind             text not null check (kind in ('LOCAL', 'REMOTE', 'SIMULATED')),
  status           text not null default 'OFFLINE'
                   check (status in ('IDLE', 'BUSY', 'DRAINING', 'OFFLINE')),
  capabilities     jsonb not null default '[]'::jsonb,
  environments     jsonb not null default '[]'::jsonb,
  provider_id      text references cloud_provider (id) on delete set null,
  current_task     text,
  lease_owner      text,
  lease_expires_at timestamptz,
  heartbeat_at     timestamptz,
  auth_ref         text,
  last_event       text,
  last_event_at    timestamptz,
  metadata         jsonb not null default '{}'::jsonb,
  registered_at    timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists cloud_worker_status_idx
  on cloud_worker (status, kind);
create index if not exists cloud_worker_lease_idx
  on cloud_worker (lease_expires_at);

alter table cloud_worker enable row level security;

-- Explicit privilege-layer denial, matching the six tables hardened by 0002.
revoke all on table public.cloud_worker from anon, authenticated;

-- The worker this project actually runs. Non-destructive: never overwrites.
insert into cloud_worker
  (worker_id, display_name, kind, status, capabilities, environments,
   provider_id, auth_ref, last_event, last_event_at)
values
  ('local', 'Local Agent Bridge worker', 'LOCAL', 'IDLE',
   '["local", "synthetic"]'::jsonb, '["local"]'::jsonb,
   'local', 'keepass:Workers/local', 'registered', now())
on conflict (worker_id) do nothing;
