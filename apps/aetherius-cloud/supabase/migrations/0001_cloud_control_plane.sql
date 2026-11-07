-- Aetherius Cloud — control-plane schema (free tier)
-- Target: Supabase (Postgres 15+). Applied with the service_role key ONLY.
--
-- Scope: the minimum tables needed for cloud control-plane metadata,
-- provider health, task state and usage tracking. Mirrors the canonical
-- application models (app-kit WorkflowInstance, apps/aetherius-cloud
-- Deployment) so the app and the database agree on names and shapes.
--
-- SECURITY: every table has Row Level Security enabled with NO policies for
-- anon/authenticated. Only the service_role (which bypasses RLS) may read or
-- write. The service_role key never leaves the server.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- providers
create table if not exists cloud_provider (
  id            text primary key,
  display_name  text not null,
  kind          text not null check (kind in ('REAL_LOCAL','REMOTE','SIMULATED','UNAVAILABLE')),
  credential_ref text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- resources
create table if not exists cloud_resource (
  id            uuid primary key default gen_random_uuid(),
  provider_id   text not null references cloud_provider(id) on delete cascade,
  resource_type text not null,
  provider_ref  text not null,
  region        text,
  plan          text,
  state         text not null default 'ACTIVE',
  created_at    timestamptz not null default now(),
  unique (provider_id, resource_type, provider_ref)
);

-- ---------------------------------------------------------------- health
create table if not exists provider_health (
  id          uuid primary key default gen_random_uuid(),
  provider_id text not null references cloud_provider(id) on delete cascade,
  state       text not null,
  latency_ms  integer,
  detail      text,
  observed_at timestamptz not null default now()
);
create index if not exists provider_health_recent_idx
  on provider_health (provider_id, observed_at desc);

-- ---------------------------------------------------------------- tasks
-- Mirrors app-kit WorkflowInstance (id, definition, subject, state, history).
create table if not exists cloud_task (
  id         text primary key,
  definition text not null,
  subject    text not null,
  state      text not null,
  history    jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cloud_task_state_idx on cloud_task (state, updated_at desc);

-- ---------------------------------------------------------------- usage
create table if not exists cloud_usage (
  id            uuid primary key default gen_random_uuid(),
  provider_id   text not null references cloud_provider(id) on delete cascade,
  model         text not null,
  input_tokens  integer,
  output_tokens integer,
  total_tokens  integer,
  cost_gbp      numeric(12,6) not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists cloud_usage_recent_idx on cloud_usage (created_at desc);

-- ---------------------------------------------------------------- deployments
-- Mirrors apps/aetherius-cloud Deployment (id, name, provider, region).
create table if not exists cloud_deployment (
  id         text primary key,
  name       text not null,
  provider   text not null,
  region     text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS
alter table cloud_provider   enable row level security;
alter table cloud_resource   enable row level security;
alter table provider_health  enable row level security;
alter table cloud_task       enable row level security;
alter table cloud_usage      enable row level security;
alter table cloud_deployment enable row level security;

-- No anon/authenticated policies: with RLS enabled and no policy, access is
-- denied by default. The service_role bypasses RLS (Postgres built-in).

-- ---------------------------------------------------------------- seed
insert into cloud_provider (id, display_name, kind, credential_ref) values
  ('local',  'Local Ollama',        'REAL_LOCAL', null),
  ('groq',   'Groq',                'REMOTE',     'keepass:API/groq'),
  ('gemini', 'Google Gemini',       'REMOTE',     'keepass:API/gemini')
on conflict (id) do nothing;
