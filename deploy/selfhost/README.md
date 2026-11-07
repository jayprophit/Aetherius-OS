# Aetherius Self-Hosted Cloud Stack

**Status:** local deployment template, validated with `docker compose config`.
**Not** a public production deployment until TLS, backups, monitoring, and
secrets management are configured.

This stack is the free/open-source replacement layer for paid SaaS. It runs on
your own hardware or cloud account and can host Aetherius app engines.

## Services

| Service | Port (localhost) | Purpose | Licence note |
|---|---|---|---|
| PostgreSQL | 5432 | Shared database | PostgreSQL Licence |
| Valkey | 6379 | Cache/session store | BSD-3-Clause |
| Keycloak | 8080 | Identity, SSO, OIDC | Apache-2.0 |
| Nextcloud | 8081 | Files, calendar, contacts, collaboration | AGPL-3.0 |
| Collabora Online | 9980 | Office editing | MPL-2.0 |
| SeaweedFS | 8333 (S3), 9333 (master) | S3-compatible object storage | Apache-2.0 |
| Metabase | 3000 | BI/analytics | AGPL-3.0 |
| Forgejo | 3001 | Git forge | GPL-3.0 |
| Prometheus | 9090 | Metrics | Apache-2.0 |
| Grafana OSS | 3002 | Dashboards | AGPL-3.0 |
| Uptime Kuma | 3003 | Uptime monitoring | MIT |
| Ollama | 11434 | Local LLM runtime | MIT |
| Qdrant | 6333 | Vector database | Apache-2.0 |
| SearXNG | 8088 | Private metasearch | AGPL-3.0 |

All ports bind to `127.0.0.1` by default. Do not expose them directly to the
internet. Put a TLS reverse proxy in front and open only 443.

## Quick start

```powershell
cd deploy/selfhost
Copy-Item .env.example .env
# Edit .env and replace every CHANGE_ME value
docker compose up -d
docker compose ps
```

Linux/macOS:

```sh
cd deploy/selfhost
cp .env.example .env
# Edit .env and replace every CHANGE_ME value
docker compose up -d
docker compose ps
```

First run:

1. Open `http://localhost:8080` and create the Keycloak admin realm.
2. Open `http://localhost:8081` and finish Nextcloud setup.
3. Open `http://localhost:3001` and create the first Forgejo admin.
4. Open `http://localhost:3000` and complete Metabase setup.
5. Open `http://localhost:3002` and change the Grafana admin password.
6. Open `http://localhost:3003` and create the Uptime Kuma admin.
7. Pull a local model: `docker compose exec ollama ollama pull qwen2.5:7b`.

## TLS and public access

Use Caddy, Traefik, or nginx. Example Caddy site block (subdomain per service):

```caddyfile
cloud.example.com {
    reverse_proxy 127.0.0.1:8081
}

auth.example.com {
    reverse_proxy 127.0.0.1:8080
}

git.example.com {
    reverse_proxy 127.0.0.1:3001
}

bi.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Then set `NEXTCLOUD_PROTOCOL=https`, `NEXTCLOUD_TRUSTED_DOMAINS=cloud.example.com`,
`NEXTCLOUD_HOST=cloud.example.com`, `COLLABORA_ALIAS=https://cloud.example.com`,
and `GIT_ROOT_URL=https://git.example.com/` in `.env`, then restart.

Do **not** expose PostgreSQL, Valkey, SeaweedFS, or Ollama directly.

## Backups

Minimum:

```sh
docker compose exec -T postgres pg_dumpall -U aetherius > backup.sql
docker run --rm -v aetherius-selfhost_nextcloud-data:/data -v "$PWD":/backup alpine tar czf /backup/nextcloud-data.tgz /data
docker run --rm -v aetherius-selfhost_forgejo-data:/data -v "$PWD":/backup alpine tar czf /backup/forgejo-data.tgz /data
```

Store backups off-host, encrypt them, and test restore quarterly. A backup you
have not restored is not a backup.

## Updates

1. Back up.
2. Pin image tags in `docker-compose.yml` (replace `latest` with tested versions).
3. `docker compose pull`
4. `docker compose up -d`
5. Run the service migrations and smoke tests.
6. Roll back by restoring the previous tags and backup if needed.

## Licence obligations

- **AGPL-3.0** (Nextcloud, Metabase, Grafana, SearXNG): if you modify them and
  provide network access, you must offer the corresponding source to users.
- **GPL-3.0** (Forgejo): distribution of modified binaries triggers source
  obligations.
- **MPL-2.0** (Collabora): file-level copyleft; modifications to MPL files must
  be published.
- **Apache/MIT/BSD** services have permissive terms but still require notices.

This is not legal advice. Review obligations before offering the stack to third
parties.

## What is not included

- Transactional email/SMTP (add Mailcow, Mailu, or a paid relay)
- Video calls (add Jitsi or LiveKit)
- Payments, banking, brokerage, or market data (regulated/licensed)
- Mobile push (APNs needs an Apple Developer account)
- Code signing or notarisation
- Public DNS, TLS certificates, WAF, or DDoS protection
- Hardware-backed key custody (add an HSM/KMS)

## Verification

```sh
docker compose --env-file .env.example config --quiet
```

Expected: exit 0. This only proves the compose file is syntactically valid and
all required variables are present; it does not prove the services start or
that the deployment is secure.

## Owner inputs needed before public use

1. Domain and DNS control.
2. TLS certificate or ACME setup.
3. Strong passwords/secrets in `.env` or a secret manager.
4. Off-host backup target.
5. SMTP relay for notifications.
6. Firewall rules and fail2ban/WAF.
7. Resource plan: at least 4 CPU, 8 GB RAM, 40 GB disk for the core stack;
   more for local models.
8. Decision on AGPL obligations if you expose modified services to third parties.
