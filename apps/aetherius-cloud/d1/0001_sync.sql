-- Aetherius sync worker schema.
--
-- Apply with:
--   wrangler d1 execute aetherius-preview --remote \
--     --file apps/aetherius-cloud/d1/0001_sync.sql
--
-- Two tables:
--
--   sync_heads    one row per (tenant, app, collection, key) -- the winner.
--   sync_changes  append-only log; every attempted write gets an id, and
--                 clients replay the log through the same last-writer-wins
--                 ordering. The head is the authority; the log supplies the
--                 cursor.
--
-- The tenant column is a single-tenant default today and a hard partition
-- tomorrow. No secret is stored here: the worker token lives in a Worker
-- secret, never in D1.

create table if not exists sync_heads (
  tenant       text    not null,
  app_id       text    not null,
  collection   text    not null,
  record_key   text    not null,
  value_json   text    not null,
  revision     text    not null,
  updated_at   integer not null,
  deleted      integer not null check (deleted in (0, 1)),
  device_id    text    not null,
  change_id    integer not null,
  primary key (tenant, app_id, collection, record_key)
);

create index if not exists sync_heads_tenant_collection
  on sync_heads (tenant, app_id, collection);

create table if not exists sync_changes (
  id          integer primary key autoincrement,
  tenant      text    not null,
  app_id      text    not null,
  collection  text    not null,
  record_key  text    not null,
  value_json  text    not null,
  revision    text    not null,
  updated_at  integer not null,
  deleted     integer not null check (deleted in (0, 1)),
  device_id   text    not null,
  server_time integer not null
);

create index if not exists sync_changes_tenant_id
  on sync_changes (tenant, id);

-- Retention helper for the free tier. A real deployment should run this
-- from a scheduled Worker and keep the window longer than the longest
-- expected offline period. It is deliberately not applied by this script:
-- deleting a log that a device still needs is a data-loss decision.
--
-- delete from sync_changes where server_time < (unixepoch('now') - 2592000) * 1000;
