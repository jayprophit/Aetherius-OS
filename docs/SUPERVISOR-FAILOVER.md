# Supervisor failover

**Date:** 2026-11-08
**Status:** IMPLEMENTED and tested locally (`orchestration/supervisor/failover.test.mjs`, 7 tests).
**Purpose:** OpenCode is the first supervisor, but its session usage and credits are finite. The supervisor role must move to another free-model agent without losing the task board, work ledger or release state. OpenCode then continues as a worker.

## 1. What is authoritative

The supervisor role is a **lease in the hive**, not a property of the OpenCode process.

| Item | Location |
| --- | --- |
| Lease | hive table `leases`, key `supervisor.lease` |
| Candidates and policy | `orchestration/supervisor/registry.json` |
| Failover tool | `orchestration/supervisor/failover.mjs` |
| Work ledger | hive `/work`, `/work/summary`; Obsidian `Work Ledger.md` |
| Handoff brief | Obsidian `Supervisor Handoff.md` |
| Long-form state | `docs/SUPERVISOR-HANDOFF-2026-11-08.md` |

The lease is acquired with `BEGIN IMMEDIATE` in SQLite. Two agents cannot both hold an active lease: the second acquire returns HTTP 409. A stale lease expires after `ttl_seconds` (default 900) and can be taken over.

## 2. Candidates

All candidates must have `billing` starting with `free`; the tool refuses anything else.

| Priority | Agent | Model | Provider | Billing |
| --- | --- | --- | --- | --- |
| 1 | OpenCode | `opencode/deepseek-v4.1-flash-free` | OpenCode CLI | free |
| 2 | Kilo | `openrouter/nvidia/nemotron-3-super-120b-a12b:free` (fallback `auto`) | local free router | free |
| 3 | Hermes | `upstage/solar-mini4:free` | Nous Portal | free |
| 4 | Cline | `auto` | local free router | free |
| 5 | Mistral Vibe | `mistral-small-latest` | Mistral free tier | free-tier |
| 6 | OpenClaw | `ollama/qwen3.5:2b-q4_K_M` | local Ollama | free-local |

Kilo with the Nemotron 120B free model is the preferred successor when the free router is healthy. Hermes is the independent fallback when the router or OpenRouter quota is the problem.

## 3. Commands

```powershell
cd C:\Users\jpowe\Desktop\Projects\Aetherius-OS

# Who supervises now, and what is pending?
node orchestration\supervisor\failover.mjs status

# List takeover candidates and their models
node orchestration\supervisor\failover.mjs candidates

# Preview the handoff brief
node orchestration\supervisor\failover.mjs plan --to kilo

# Take the lease (fails if another live lease exists)
node orchestration\supervisor\failover.mjs acquire --agent kilo

# Hand the lease from OpenCode to Kilo and write Supervisor Handoff.md
node orchestration\supervisor\failover.mjs handoff --from opencode --to kilo

# Release the lease
node orchestration\supervisor\failover.mjs release --agent kilo
```

Every acquire, release, handoff and takeover appends to the hive work ledger. The outgoing supervisor is recorded as `done`; the incoming supervisor is recorded as `in_progress`.

## 4. Handoff procedure

Use this when OpenCode is near its limit, a provider is exhausted, or the owner wants a different supervisor.

1. Run `node orchestration\hive\cli.mjs work export` to refresh the Obsidian ledger.
2. Run `node orchestration\supervisor\failover.mjs plan --to <agent>` and read the brief.
3. Make sure the successor can run its model for free. If the local router is the problem, choose Hermes (independent provider).
4. Run `handoff --from opencode --to <agent>`.
5. In the new supervisor session, read:
   - `knowledge/Aetherius-Vault/Supervisor Handoff.md`
   - `knowledge/Aetherius-Vault/Work Ledger.md`
   - `docs/SUPERVISOR-FAILOVER.md`
   - `docs/SUPERVISOR-HANDOFF-2026-11-08.md`
6. Run `npm run verify` before committing anything.
7. Claim unowned hive tasks before editing their file scope.
8. Keep free-only. A paid model is refused by the failover tool, and the router returns HTTP 402 for paid models unless `AETHERIUS_ALLOW_PAID=1` is explicitly set.

The outgoing agent must not commit or push after the handoff. It can keep working as a worker on claimed tasks.

## 5. OpenCode as a worker after handoff

OpenCode switches to a free model and keeps its tools:

```powershell
# Free cloud model
opencode run --model opencode/deepseek-v4.1-flash-free "<task>"

# Local fallback when cloud quota is exhausted
opencode run --model ollama/qwen3.5:2b-q4_K_M "<task>"
```

Worker rules:

- Claim a hive task and stay inside its file scope.
- Do not change the supervisor lease.
- Do not commit or push while another agent holds the lease.
- Report work with `node orchestration\hive\cli.mjs work log --agent opencode --task <id> --status done|pending|blocked --summary "..."`.

## 6. What is verified

| Claim | Status | Evidence |
| --- | --- | --- |
| Lease is exclusive and expires | VERIFIED | `hive.test.mjs` lease test; 409 on concurrent acquire |
| Handoff records both sides | VERIFIED | `failover.test.mjs` handoff test |
| Paid candidate refused | VERIFIED | `failover.test.mjs` paid-candidate test |
| Brief includes blocked/pending work | VERIFIED | `failover.test.mjs` blocked-task test |
| Hermes has the shared MCP tools | VERIFIED | Hermes connected and found 29 tools; saved to `~/AppData/Local/hermes/config.yaml` |
| Vibe / Cline / Kilo / OpenClaw registration | PARTIAL | See `docs/AGENT-MCP-REGISTRATION.md` for per-agent status |

## 7. Failure signals to act on

- OpenCode reports usage or credit exhaustion, or model calls start failing with quota errors.
- The free router repeatedly rotates and returns 429/503 for every candidate.
- The owner's machine must go offline; a local-model supervisor (OpenClaw) may keep the board alive.
- The current supervisor process dies without releasing the lease. Wait for TTL or acquire with force after an explicit owner decision.

Do not silently continue on a paid model. Stop and hand off.
