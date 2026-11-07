# Self-host stack status

**Status:** 2026-11-04. The Compose file and `.env` exist and `docker compose
config --quiet` passed. The stack is **not** health-verified. This document
records the known blockers and the acceptance checks; it is not evidence that
the services are running.

## 1. Services and host ports

All ports bind to `127.0.0.1`, not the LAN.

| Service | Host port | Container port | Purpose |
|---|---:|---:|---|
| PostgreSQL | 5432 | 5432 | Shared database |
| Valkey | 6379 | 6379 | Cache and queues |
| Keycloak | 8080 | 8080 | Identity and SSO |
| Nextcloud | 8081 | 80 | Files and collaboration |
| Collabora | 9980 | 9980 | Document editing |
| SeaweedFS S3 | 8333 | 8333 | Object storage |
| SeaweedFS master | 9333 | 9333 | Cluster status |
| Metabase | 3000 | 3000 | Internal analytics |
| Forgejo | 3001 | 3000 | Git hosting |
| Prometheus | 9090 | 9090 | Metrics |
| Grafana | 3002 | 3000 | Dashboards |
| Uptime Kuma | 3003 | 3001 | Uptime monitoring |
| Ollama | 11434 | 11434 | Local inference |
| Qdrant | 6333 | 6333 | Vector store |
| SearXNG | 8088 | 8080 | Meta-search |

## 2. Known blockers

### 2.1 Host-port conflicts

| Port | Likely existing user | Risk | Resolution |
|---:|---|---|---|
| 5432 | `ws-postgres` container | The self-host PostgreSQL cannot bind, or connects to the wrong database | Stop `ws-postgres` for the drill or remap to `127.0.0.1:55432:5432` |
| 6379 | `ws-redis` container | Same for Valkey | Stop `ws-redis` or remap to `127.0.0.1:16379:6379` |
| 11434 | Host Ollama, used by the live OpenClaw config | The Docker Ollama cannot bind, or the host client silently talks to a different runtime | Keep the host Ollama and do not start the Docker one, or remap the container to `127.0.0.1:11435:11434` and update the client |
| 3000 | Any local dev server or Metabase | Bind failure | Remap or stop the other process |
| 8080 | Any local service or Keycloak | Bind failure | Remap or stop the other process |

Do not start the stack until the chosen resolution is written down. The worst
outcome is a service that appears healthy because it bound to a different
project's database or cache.

### 2.2 Image pull and disk load

The first start pulls large images (Nextcloud, Keycloak, Metabase, Grafana,
Prometheus, Ollama, Qdrant, Collabora, Forgejo, SeaweedFS). Pulls were slow and
were still in progress when this note was written. Disk and CPU contention also
made unrelated shell commands slow. Run the first pull with the machine otherwise
idle, or pull services in phases.

### 2.3 Secrets

`deploy/selfhost/.env` contains generated secrets and is gitignored. Do not
print it, commit it, paste it into a chat or put it in a screenshot. Back it up
only to encrypted storage. See `docs/BACKUP-RESTORE-DRILL.md`.

## 3. Start procedure

Use a maintenance window and record the start time.

```sh
cd deploy/selfhost
docker compose config --quiet
docker compose pull
docker compose up -d
docker compose ps
```

Start in phases if the host is short of memory:

```sh
docker compose up -d postgres valkey
docker compose up -d keycloak nextcloud forgejo
docker compose up -d seaweedfs qdrant ollama searxng
docker compose up -d collabora metabase
docker compose up -d prometheus grafana uptime-kuma
```

## 4. Health acceptance checks

Record the HTTP status and a short response sample for each check.

| Service | Check | Pass condition |
|---|---|---|
| PostgreSQL | `docker compose exec -T postgres pg_isready -U aetherius` | `accepting connections` |
| Valkey | `docker compose exec -T valkey valkey-cli ping` | `PONG` |
| Keycloak | `GET http://127.0.0.1:8080/realms/master` | HTTP 200 with a realm document |
| Nextcloud | `GET http://127.0.0.1:8081/status.php` | HTTP 200 with `installed: true` |
| Forgejo | `GET http://127.0.0.1:3001/api/healthz` | HTTP 200 |
| SeaweedFS | `GET http://127.0.0.1:9333/cluster/status` | HTTP 200 with a leader |
| Ollama | `GET http://127.0.0.1:11434/api/tags` | HTTP 200 with a model list |
| Qdrant | `GET http://127.0.0.1:6333/collections` | HTTP 200 |
| SearXNG | `GET http://127.0.0.1:8088/` | HTTP 200 with the search page |
| Collabora | `GET http://127.0.0.1:9980/hosting/discovery` | HTTP 200 with discovery XML |
| Metabase | `GET http://127.0.0.1:3000/api/health` | HTTP 200 with `ok` |
| Prometheus | `GET http://127.0.0.1:9090/-/healthy` | HTTP 200 |
| Grafana | `GET http://127.0.0.1:3002/api/health` | HTTP 200 with a database status |
| Uptime Kuma | `GET http://127.0.0.1:3003/` | HTTP 200 |

`docker compose ps` must show `running` or `healthy`, not `restarting` or
`unhealthy`. A container that is running but failing its health check is not a
pass.

## 5. Configuration acceptance checks

After the health checks:

1. Keycloak: create or import a realm, create a test user, sign in, then sign
   out. Do not use the admin account for application login.
2. Nextcloud: sign in, upload a small text file, download it, compare the hash,
   delete it.
3. Forgejo: create a private test repository, push one commit over SSH or HTTP,
   clone it back, verify the commit.
4. SeaweedFS: create a test bucket, put and get a small object, delete it.
5. Qdrant: create a test collection, upsert one vector, search it, delete it.
6. Ollama: pull a small model, run one plain turn and one tool turn. Record the
   exact model and whether it worked offline.
7. SearXNG: run one query and confirm it returns results.
8. Grafana: confirm the Prometheus datasource is healthy.
9. Uptime Kuma: add one monitor and confirm the first check.

Do not record a configuration check as PASS until the exact action has been
performed.

## 6. Shutdown and rollback

Normal stop, preserving volumes:

```sh
docker compose stop
```

Stop and remove containers but keep named volumes:

```sh
docker compose down
```

**Do not run `docker compose down -v`** until a verified backup exists. It
deletes the named volumes and the data with them.

If a host-port conflict caused the failure, fix the mapping or stop the other
container, then start again. Do not delete volumes to "start clean" unless the
owner has approved data loss.

## 7. What is still missing

- A recorded successful `docker compose up` with no port conflict.
- Health results for every service above.
- Login, file, git, vector, search and AI smoke tests.
- A backup and restore drill (`docs/BACKUP-RESTORE-DRILL.md`).
- A resource-usage measurement (idle RAM and CPU for the full stack).
- A decision on whether observability and analytics services are needed in the
  preview, or should move behind a Compose profile.
- A documented LAN/TLS/reverse-proxy design. The current stack is loopback-only.

## 8. Honest claim

The stack is a template under test. It is not a production service, not
hardened, not independently reviewed and not backed up. Do not describe it as
deployed, monitored or production-ready until the checks above are recorded.
