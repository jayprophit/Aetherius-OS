# Cloud & Sync

Aetherius OS is local-first. The shell keeps working with no network at all.
Cloud sync is an optional, free-tier backend that lets two devices share the
same records.

## Architecture

```
Shell (browser)                Cloudflare (free tier)
┌─────────────────────┐        ┌──────────────────────┐
│ local replica       │        │ aetherius-sync Worker│
│ outbox (pending)    │ push   │   /v1/sync/push      │
│ cursor              │ ─────► │   /v1/sync/pull      │
│ conflict log        │ pull   │   /v1/sync/state     │
└─────────────────────┘        │   /health            │
                               │        │              │
                               │        ▼              │
                               │   D1 (aetherius-     │
                               │   preview)          │
                               │   sync_heads         │
                               │   sync_changes       │
                               └──────────────────────┘
```

- **Local engine**: `apps/aetherius-sync/` — protocol, local store, HTTP
  transport and the engine. Framework-free and transport-agnostic.
- **Worker**: `apps/aetherius-cloud/worker/` — a Cloudflare Worker in front of
  D1. The same handler runs in Node against an in-memory repository in tests.
- **Schema**: `apps/aetherius-cloud/d1/0001_sync.sql`.

## Conflict resolution

Every write is a **change** with a content-hash **revision**. Resolution is
deterministic last-writer-wins:

1. the later `updatedAt` wins;
2. at the same millisecond, a tombstone (delete) beats a value;
3. then the lexicographically greater revision wins;
4. then the lexicographically greater device id wins.

Every step is total, so any pair of records has exactly one winner and two
devices converge without a coordinator. The loser is never silently
discarded — the engine keeps it in the conflict log so the user can see what
they lost.

Deletes are **tombstones**, not disappearances: a device that has been
offline learns that a record was removed rather than inferring it from
silence.

## Wire format

```jsonc
// POST /v1/sync/push  { deviceId, records: SyncChange[] }
// GET  /v1/sync/pull?cursor=N&limit=200   -> { records, cursor, hasMore }
// GET  /v1/sync/state                    -> { cursor, records, collections }
// GET  /health                            -> { ok, service, version, auth, time }
```

Push is idempotent: pushing the same revision twice is a no-op (`"same"`).
The server verifies every revision hash and rejects mismatches, so a client
cannot invent history.

## Security posture

- **Fail closed.** If `SYNC_TOKEN` is unset or shorter than 16 characters,
  every `/v1` route returns `503` rather than serving an unauthenticated
  sync endpoint.
- The token is compared in constant time.
- Request bodies are bounded (1 MB).
- CORS is opt-in: only origins in `ALLOWED_ORIGIN` receive a
  `Access-Control-Allow-Origin` header.
- No secret is stored in D1. The token lives in a Worker secret.

## Deploying

```sh
# 1. Apply the schema (creates sync_heads + sync_changes).
wrangler d1 execute aetherius-preview --remote \
  --file apps/aetherius-cloud/d1/0001_sync.sql

# 2. Set the token (a Worker secret, never in wrangler.toml).
wrangler secret put SYNC_TOKEN

# 3. Deploy.
wrangler deploy --config apps/aetherius-cloud/worker/wrangler.toml

# 4. Verify.
curl https://<worker>.workers.dev/health
```

## Using it from the shell

Open **Settings → Cloud & Sync**:

1. Enter the endpoint (defaults to the deployed worker URL).
2. Paste the token — it is **session-only**: kept in memory, never written to
   localStorage, lost when the tab closes.
3. **Test connection** → `GET /health`.
4. **Sync now** → pushes the outbox, then pulls from the cursor.
5. Status shows records, pending outbox, cursor, last sync and last error.
   Conflicts are listed when two devices changed the same record.

If the browser blocks storage, the replica still works for the session; the
panel says so.

## Supabase (preview backend)

Supabase (`aetherius-preview`, `eu-west-2`) is the preview backend for the
commerce/community surfaces. It is not part of the sync path. Its keys live
in KeePass; the build carries no credential.

## Free-tier limits to know

- Workers: 100k requests/day on the free plan — ample for device sync.
- D1: 5M rows read / 100k rows written / 5 GB per day on the free plan. The
  change log needs a retention window longer than the longest expected
  offline period; the SQL file contains a commented retention helper and it
  is deliberately not automatic.
- R2 object storage was enabled by the owner on 2026-11-07 (card on file);
  the `aetherius-blobs` bucket is provisioned and bound to the worker as
  `BLOBS`, but holds nothing yet. The free tier is 10 GB storage /
  1M Class A ops / 10M Class B ops per month; staying under it costs $0.
  Blob sync (photos, audio, attachments) is the future use.
