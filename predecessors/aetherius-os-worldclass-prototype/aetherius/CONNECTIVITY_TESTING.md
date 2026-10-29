# Aetherius OS — Parent/Child/Grandchild Connectivity Testing (Concept Harness)

This build includes a minimal connectivity harness so you can **test the routing + permissions model** you described:

- **Parent OS** (owner/admin): can push updates, toggle modules, run diagnostics.
- **Child OS** (network middle-layer): 3D+ blockchain internet hub.
- **Grandchild OS** (public clients): local-first clones with restricted admin.

## What is included in this ZIP

- `server/` – minimal Express service with:
  - `POST /api/connectivity/ping` (loopback test)
  - `POST /api/automation/run` placeholder
- UI: Health → **Frequency Lab (Beta)** uses local dataset extraction.

## Run locally

### 1) Frontend

```bash
cd aetherius
npm i
npm run dev
```

### 2) Server (separate terminal)

```bash
cd aetherius/server
npm i
npm run dev
```

## Connectivity tests

### Parent → Child

```bash
curl -s http://localhost:8787/api/connectivity/ping \
  -H 'content-type: application/json' \
  -d '{"from":"parent","to":"child","nonce":"p2c-001"}' | jq
```

### Child → Grandchild

```bash
curl -s http://localhost:8787/api/connectivity/ping \
  -H 'content-type: application/json' \
  -d '{"from":"child","to":"grandchild:alice","nonce":"c2g-001"}' | jq
```

### Grandchild ↔ Grandchild

```bash
curl -s http://localhost:8787/api/connectivity/ping \
  -H 'content-type: application/json' \
  -d '{"from":"grandchild:alice","to":"grandchild:bob","nonce":"g2g-001"}' | jq
```

## Next implementation steps (blueprint)

1. Add **signed envelopes** (Ed25519): every message includes `from_id`, `to_id`, `timestamp`, `nonce`, `payload_hash`, `signature`.
2. Implement **capabilities**:
   - `cap:admin.toggle_module`
   - `cap:wallet.spend`
   - `cap:marketplace.sell`
3. Add **policy engine**:
   - Grandchild cannot call child admin methods.
   - Parent can always call child.
4. Add **network simulator** in UI:
   - buttons to run the above calls and show latency/packet loss.

