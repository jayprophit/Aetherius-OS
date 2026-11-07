# Backup and restore drill

**Status:** runbook and evidence template. The drill has **not** been run. The
release gate requires a real drill with recorded output and owner sign-off.

**Scope:** the local Docker self-host stack in `deploy/selfhost`. This drill
does not cover the owner's separate `ws-*` containers unless they are part of
the declared deployment.

## 1. What must be backed up

| Item | Source | Why | Restore method |
|---|---|---|---|
| PostgreSQL databases | `postgres` container, `postgres-data` volume | Keycloak, Nextcloud, Forgejo, Metabase and app data | `pg_dumpall` then `psql` into a fresh container |
| Nextcloud files and config | `nextcloud-data` volume | User files and Nextcloud state | Restore the volume before starting Nextcloud |
| SeaweedFS objects | `seaweed-data` volume | S3-compatible object data | Restore the volume before starting SeaweedFS |
| Forgejo repositories | `forgejo-data` volume plus PostgreSQL | Git data, LFS and configuration | Restore volume and database together |
| Qdrant vectors | `qdrant-data` volume | Local embeddings and collections | Restore the volume, then verify collections |
| Grafana state | `grafana-data` volume | Dashboards and datasources | Restore the volume |
| Uptime Kuma state | `uptime-data` volume | Monitors and history | Restore the volume |
| Valkey append-only data | `valkey-data` volume | Cache and queue state | Restore only if the data is not reconstructible |
| Prometheus data | `prometheus-data` volume | Metrics history | Optional; can be rebuilt |
| Ollama models | `ollama-data` volume | Local models | Optional; re-pull from the model source |
| Secrets and configuration | `deploy/selfhost/.env`, compose files, `initdb/`, `prometheus/` | The stack cannot be recreated faithfully without them | Restore from the encrypted secret backup |

`.env` contains generated secrets. Back it up to encrypted storage. Do not
commit it, email it or paste it into a ticket.

## 2. Preconditions

- The stack is healthy and the operator has a maintenance window.
- There is enough free disk for the dump, the volume archives and a second copy.
- The restore target is isolated from the live stack and uses a different
  Compose project name.
- The operator has the `.env` secrets available from the approved secret store.
- The owner has agreed the RPO and RTO for the preview. Proposed values:
  RPO 24 hours, RTO 4 hours. These are proposals, not approved targets.

## 3. Port conflict check

The template maps PostgreSQL to `127.0.0.1:5432` and Valkey to
`127.0.0.1:6379`. The owner's existing `ws-postgres` and `ws-redis` containers
may already use those host ports. Before starting the stack, either:

- stop the conflicting containers for the drill, or
- parameterise the host ports in `docker-compose.yml`, for example
  `127.0.0.1:55432:5432` and `127.0.0.1:16379:6379`, and update the local
  connection strings.

Record which option was used. Do not silently reuse another project's database.

## 4. Backup procedure

Run from `deploy/selfhost` in a shell with Docker access. Use a timestamped
directory outside the repository.

```sh
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP=/srv/aetherius-backup/$STAMP
mkdir -p "$BACKUP"

# 1. Database dump (all databases and roles).
docker compose exec -T postgres pg_dumpall -U aetherius > "$BACKUP/postgres.sql"

# 2. Volume archives. Stop writers first for a consistent copy.
docker compose stop nextcloud forgejo seaweedfs qdrant grafana uptime-kuma valkey

for volume in nextcloud-data forgejo-data seaweed-data qdrant-data \
              grafana-data uptime-data valkey-data prometheus-data; do
  docker run --rm \
    -v "aetherius-selfhost_${volume}:/source:ro" \
    -v "$BACKUP:/backup" \
    alpine:3.20 \
    tar -czf "/backup/${volume}.tar.gz" -C /source .
done

docker compose start

# 3. Configuration and secrets: copy .env into the encrypted backup store,
#    not into the plain backup directory.
cp docker-compose.yml "$BACKUP/"
cp -r initdb prometheus "$BACKUP/"

# 4. Checksums.
sha256sum "$BACKUP"/* > "$BACKUP/SHA256SUMS"
```

PowerShell equivalents for checksums:

```powershell
Get-FileHash -Algorithm SHA256 (Get-ChildItem $BACKUP -File) |
  ForEach-Object { "$($_.Hash)  $($_.Path)" } |
  Set-Content "$BACKUP\SHA256SUMS"
```

Copy the backup to a second location. A backup on the same disk is not a
backup. Encrypt the copy at rest and record where the key is held.

## 5. Restore procedure

Use a separate directory and Compose project so the live stack is untouched.

```sh
RESTORE=/srv/aetherius-restore
cp -r /path/to/deploy/selfhost "$RESTORE"
cd "$RESTORE"

# Use a distinct project name and the same .env values.
export COMPOSE_PROJECT_NAME=aetherius-restore

docker compose up -d postgres valkey
# Wait for the health check.
docker compose exec -T postgres psql -U aetherius -d postgres < "$BACKUP/postgres.sql"

# Restore volumes before starting their services.
for volume in nextcloud-data forgejo-data seaweed-data qdrant-data \
              grafana-data uptime-data valkey-data; do
  docker run --rm \
    -v "aetherius-restore_${volume}:/target" \
    -v "$BACKUP:/backup:ro" \
    alpine:3.20 \
    sh -c "rm -rf /target/* && tar -xzf /backup/${volume}.tar.gz -C /target"
done

docker compose up -d
```

If the dump was taken with `pg_dumpall`, it includes roles. If a role already
exists in the fresh cluster, resolve the conflict before importing rather than
ignoring the error.

## 6. Verification checklist

Record PASS or FAIL for each item. A check that was not run is not a pass.

| Check | Expected | Result |
|---|---|---|
| PostgreSQL starts and accepts connections | Healthy | |
| Keycloak admin login works | Realm and users present | |
| Nextcloud admin login works | Files and shares present | |
| Forgejo login works | Repositories, issues and LFS intact | |
| SeaweedFS S3 endpoint responds | Object counts match the source | |
| Qdrant endpoint responds | Collection names and point counts match | |
| Grafana login works | Dashboards and datasources present | |
| Uptime Kuma login works | Monitors present | |
| Application files open | Hashes match a sample from the source | |
| Secrets in `.env` still work | No stale credential errors | |
| No data from the live stack was overwritten | Live stack still healthy | |
| Backup and restore logs are retained | Hashed and stored | |

## 7. Evidence record

Write `docs/evidence/backup-restore.json` after a real drill:

```json
{
  "schema_version": "1.0.0",
  "status": "PASS",
  "drill_id": "BR-YYYYMMDD-01",
  "performed_at": "ISO-8601",
  "performed_by": "name",
  "approved_by": "owner name",
  "stack_version": "compose file commit or hash",
  "backup_location": "redacted",
  "restore_location": "isolated host or project name",
  "rpo_hours": 24,
  "rto_hours": 4,
  "backup_sha256": "hash of the checksum manifest",
  "checks": [],
  "findings": [],
  "notes": "facts only"
}
```

Do not write `PASS` before every check has a recorded result. A failed drill is
useful evidence; a fabricated pass is not.

## 8. After the drill

- Record how long the backup and restore actually took.
- Record the size of each artifact.
- Record any manual step that would fail under pressure.
- Fix the runbook and, where possible, automate the step.
- Re-run the drill after a material change to the stack.
- Ask the owner to sign the result before the release gate uses it.
