# Supervisor handoff — Aetherius OS orchestration

**Date:** 2026-11-08
**Repository:** `C:\Users\jpowe\Desktop\Projects\Aetherius-OS`
**Branch:** `master`
**Last pushed commit:** `b665453` — *Fix truncated globe icon paths, add performance baseline and backup verification report*
**Handoff reason:** supervisor token/usage continuity. Any capable agent can resume from this file.

> Read this file first. Then read:
> 1. `docs/CROSS-PLATFORM-DELIVERY-2026-11-08.md`
> 2. `docs/MASTER-REQUIREMENTS-REGISTER-2026-11-08.md`
> 3. `docs/PROJECT-TODOS.yaml`
> 4. `orchestration/README.md` (once created in this workstream)

---

## 1. Non-negotiable rules

1. **Free only.** No paid model, API, plan, subscription or store fee may be used. Every model call must go through a free local or free-tier provider. Codex is currently configured to `gpt-6-astra` and is **disabled** until it is pointed at the free router.
2. **KeePass stays local.** Database: `C:\Users\jpowe\Documents\Database.kdbx`. The master password is the empty string. Never print, log, commit, upload or paste secret values. Use `scripts/keepass.py` to inject secrets into a child process environment only.
3. **Do not rotate credentials, delete data, force-push, rewrite history, or touch Hermes/Genesis training.**
4. **One writer per file.** Parallel agents must not edit the same file. The supervisor commits and pushes.
5. **Honest labels.** A configuration file is not a built artifact. A browser viewport is not a mobile device. Use `SCAFFOLDED`, `BUILT`, `INSTALLED`, `VERIFIED`, `UNVERIFIED`, `OWNER_GATED`.
6. **No destructive action without explicit owner approval.** Preserve uncommitted work, recorder WAVs, `apps/aetherius-cloud/src/fabric.ts`, `.wrangler-dry-run/`.

---

## 2. Current state (verified facts)

### 2.1 CI

Root cause of the five failed GitHub Actions runs on `master`:

- `src/apps/catalogue.test.ts` failed the byte-identical check because `scripts/generate-app-catalogue.mjs` sorted with `localeCompare`, which is ICU/locale-dependent. Windows and Linux produced different orderings.
- `ci.yml` pinned Node 20. Vitest 5's reporter uses `Map.groupBy` (Node 21+), so it crashed while printing the failure and hid the real diff.

Fix already applied locally (not yet committed/pushed):

- `scripts/generate-app-catalogue.mjs` now uses a deterministic code-unit comparator.
- `src/apps/catalogue.ts` regenerated (98 reordered lines; 143 entries, 135 `@aetherius` slices).
- `.github/workflows/ci.yml` now uses Node 22 for `verify` and `registers`.
- `package.json` gained `"engines": { "node": ">=22" }`.
- `package-lock.json` updated.
- Targeted catalogue test passes; `npm run typecheck` passes.

**Current full-suite failure:** `npm run verify` = `1 failed | 103 passed`, `3 failed | 1823 passed | 3 skipped`.

All three failures are in `src/programme/sourceRegistry.test.ts`:

- expected 1131 sources, observed **1149** (+18). The new cross-platform and orchestration files changed the on-disk source count; the source registry was not regenerated.
- Fix: find the source-registry generator/validation command, regenerate it, and update the committed registry. Do **not** just change the expected number unless the registry is genuinely derived.
- Inspect `src/programme/sourceRegistry.test.ts` and the generator it references before editing.

### 2.2 Working tree

Modified (pre-existing test-output churn, preserve):

- `apps/aetherius-canvas/test-canvas-data/boards.json`
- `apps/aetherius-cloud/tests/sync-worker.test.ts`
- `apps/aetherius-notes/test-notes-data/notes.json`
- `apps/aetherius-renderer/test-canvas-raster/boards.json`
- `apps/aetherius-renderer/test-slides-raster/{boards,decks}.json`
- `apps/aetherius-sheets/test-sheets-data/workbooks.json`
- `apps/aetherius-slides/test-slides-data/decks.json`
- `apps/aetherius-writer/test-writer-data/documents.json`

New/untracked (created by this workstream unless noted):

- `.dockerignore`
- `.github/workflows/release-desktop.yml`
- `src-tauri/**` (Tauri 2 desktop/mobile host scaffold)
- `packaging/vm/**` (Dockerfile, nginx, compose, systemd, cloud-init)
- `packaging/mobile/README.md`
- `scripts/platform-preflight.mjs`
- `scripts/keepass.py`
- `orchestration/hive/{server,client,cli,mcp-server}.mjs`
- `orchestration/model-router/{providers.json,server.mjs}`
- `orchestration/start.mjs`
- `orchestration/agents.manifest.json`
- `docs/CROSS-PLATFORM-DELIVERY-2026-11-08.md`
- `docs/MASTER-REQUIREMENTS-REGISTER-2026-11-08.md`
- `docs/HANDOFF-ACTIONS-2026-11-08.md`
- `docs/SUPERVISOR-HANDOFF-2026-11-08.md` (this file)

Pre-existing untracked, provenance not fully determined — preserve:

- `apps/aetherius-cloud/src/fabric.ts`
- `apps/aetherius-cloud/.wrangler-dry-run/`
- `apps/aetherius-app-suite/recorder-data/`
- `apps/aetherius-recorder/test-recorder-compat/*.wav`

### 2.3 Orchestration layer (in progress)

| Component | State | Notes |
|---|---|---|
| Hive HTTP server | **WRITTEN, NOT TESTED** | `orchestration/hive/server.mjs`, port 7317, SQLite `hive.db`, messages/tasks/memory/SSE/A2A |
| Hive client | **WRITTEN, NOT TESTED** | `orchestration/hive/client.mjs` |
| Hive CLI | **WRITTEN, NOT TESTED** | `orchestration/hive/cli.mjs` |
| Hive MCP server | **WRITTEN, NOT TESTED** | `orchestration/hive/mcp-server.mjs`; `@modelcontextprotocol/sdk` installed |
| Free model router | **WRITTEN, NOT TESTED** | `orchestration/model-router/server.mjs`, port 7318 |
| Free provider registry | **WRITTEN** | `orchestration/model-router/providers.json` |
| Start script | **WRITTEN** | `orchestration/start.mjs` |
| Agent manifest | **WRITTEN** | `orchestration/agents.manifest.json` |
| Hive tests | **NOT WRITTEN** | Add `orchestration/hive/hive.test.mjs` |
| MCP registration in agents | **NOT DONE** | See §5 |
| Obsidian vault | **NOT CREATED** | Target `knowledge/Aetherius-Vault/` |
| Graphify project graph | **NOT BUILT** | Run `graphify install --project --platform opencode`, then `graphify . --code-only` |
| REA analysis | **NOT RUN** | `rea --help`; produce `docs/REA-ANALYSIS-2026-11-08.md` |

### 2.4 Free model pool

**Local Ollama** (11 models, `http://127.0.0.1:11434`):

- `qwen3.5:2b-q4_K_M`, `qwen3.5:0.8b`, `qwen3:latest`, `qwen3:1.7b`, `local-qwen3:1.7b-cpu`, `granite4:3b`, `granite3.3:2b`, `ministral-3:3b`, `hhao/qwen2.5-coder-tools:3b`, `moondream:latest`, `nomic-embed-text:latest`.

**Free cloud providers with credentials already present:**

| Provider | Credential source | Free models in router |
|---|---|---|
| GitHub Models | `gh auth token` (confirmed HTTP 200) | `openai/gpt-4.1-mini`, `openai/gpt-4.1`, `meta/Llama-4-Scout-17B-16E-Instruct` |
| OpenRouter | KeePass `Aetherius/AI/OpenRouter/OpenRouter API`; also Kilo OpenRouter credential and OpenClaw config | 4 `:free` models |
| Groq | KeePass `Aetherius/AI/Groq/Groq API`; OpenClaw config | `openai/gpt-oss-120b`, `qwen/qwen3.6-27b` |
| Google AI Studio | KeePass `Aetherius/AI/Gemini/Gemini API`; OpenClaw config | `gemini-3.8-flash` |
| Cerebras | OpenClaw config only | `gpt-oss-120b` |
| Mistral | KeePass `Aetherius/AI/Mistral/Mistral API`; OpenClaw config | `mistral-small-latest` |
| Nous Portal | Hermes internal auth | `upstage/solar-mini4:free` (Hermes only) |

**Not free / disabled:** OpenAI Codex (`gpt-6-astra`), paid OpenRouter models, NVIDIA credits (finite, excluded from default rotation), LM Studio (endpoint down).

### 2.5 KeePass

- 128 entries.
- Helper: `scripts/keepass.py`.
- Commands:
  - `python scripts/keepass.py inventory` — metadata only, no secrets.
  - `python scripts/keepass.py compact` — one line per entry, no secrets.
  - `python scripts/keepass.py verify` — reopen and count.
  - `python scripts/keepass.py exec --map <map.json> -- <command>` — inject env vars from entries, then exec.
  - `python scripts/keepass.py add ...` / `update ...` — writes create a timestamped local backup first.
- Empty password workaround: `_open()` monkeypatches `getpass.getpass` only for the process, because pykeepass otherwise prompts and hangs.
- Opening the database can take 60–120 seconds (KDF). Use a timeout of at least 180s.
- Secret values must never be printed. A `get` command exists for piping only; avoid shell output.

### 2.6 Agent roster and free invocation

| Agent | Version | Free mode | Headless command (verified/assumed) | Protocol |
|---|---|---|---|---|
| Hermes | 0.22.6 | `upstage/solar-mini4:free` via Nous | `hermes chat -q "..." --oneshot -Q` | CLI |
| OpenClaw | 2026.10.7 | `ollama/qwen3.5:2b-q4_K_M` (config primary) | `openclaw agent --local --json -m "..."` | ACP, MCP, Gateway, CLI |
| Kilo CLI | 7.8.17 | force `-m openrouter/<free>:free` or router | `kilo run --format json "..."` | ACP, MCP, CLI |
| Cline CLI | 3.0.73 | force `-P openrouter -m <free>:free` or Ollama | `cline --json "..."` | ACP, CLI |
| Mistral Vibe | 3.0.2 | `mistral-small-latest` free tier + `--max-price 0` | `vibe -p "..." --output json --max-price 0` | ACP (`vibe-acp`), MCP, CLI |
| Freebuff | 0.2.34 | free service | `freebuff "..."` (headless positional **unverified**) | CLI, repo `mcp.json` |
| Codex | 0.155.1 | **DISABLED (paid model)** | do not invoke | MCP, app-server, CLI |
| OpenCode | 2.2.6 | supervisor | n/a | MCP, CLI |

GUI-only, manual verification only: Kilo Desktop, Cursor, Windsurf, Claude Desktop, Gemini Desktop, LM Studio.

**Warning:** Kilo's default model may be paid. Always pass a free model or point it at `http://127.0.0.1:7318/v1`. Cline's default `cline` provider may consume paid credits; force OpenRouter `:free` or Ollama. Vibe must use `--max-price 0`.

GUI-only, manual verification only: Kilo Desktop, Cursor, Windsurf, Claude Desktop, Gemini Desktop, LM Studio.

---

## 3. Hive protocol (how agents talk)

Start everything:

```powershell
cd C:\Users\jpowe\Desktop\Projects\Aetherius-OS
python scripts\keepass.py exec --map orchestration\model-router\keepass-map.json -- node orchestration\start.mjs
```

`keepass-map.json` is **not yet created**. It must map:

| Env var | KeePass title |
|---|---|
| `OPENROUTER_API_KEY` | `OpenRouter API` |
| `GROQ_API_KEY` | `Groq API` |
| `GEMINI_API_KEY` | `Gemini API` |
| `MISTRAL_API_KEY` | `Mistral API` |
| `HUGGINGFACE_API_KEY` | `Hugging Face API` |
| `VERCEL_AI_GATEWAY_API_KEY` | `Vercel AI Gateway API` |
| `OMNIROUTE_API_KEY` | `OmniRoute API` |

Format:

```json
{
  "env": [
    { "env": "OPENROUTER_API_KEY", "title": "OpenRouter API", "field": "password" }
  ]
}
```

Endpoints:

- `GET http://127.0.0.1:7317/health`
- `GET /status`
- `POST /agents/register` `{id, kind, protocol, model, status}`
- `POST /messages` `{sender, recipient, topic, body, correlation_id}`
- `GET /messages?since=0&to=kilo&limit=50`
- `GET /events` (SSE)
- `POST /tasks` `{created_by, title, detail, assignee?, priority, files}`
- `POST /tasks/:id/claim` `{agent}`
- `POST /tasks/:id/update` `{agent, status, result, evidence}`
- `GET/PUT /memory/:key`
- `POST /a2a` (JSON-RPC `message/send`, `tasks/get`, `tasks/list`)

CLI:

```powershell
node orchestration\hive\cli.mjs status
node orchestration\hive\cli.mjs register --id kilo --kind kilo --model auto
node orchestration\hive\cli.mjs send --from supervisor --to kilo "claim task X"
node orchestration\hive\cli.mjs tasks --status open
```

MCP tools exposed: `hive_status`, `hive_register_agent`, `hive_list_agents`, `hive_send_message`, `hive_read_messages`, `hive_create_task`, `hive_list_tasks`, `hive_claim_task`, `hive_update_task`, `hive_memory_get`, `hive_memory_set`.

---

## 4. Immediate queue (priority order)

1. **Finish and test the hive.**
   - Add `orchestration/hive/hive.test.mjs` (register, message, broadcast, task lifecycle, memory).
   - Run `npx vitest run orchestration/hive/hive.test.mjs`.
   - Fix any `node:sqlite` or MCP SDK issues.
2. **Finish and test the free router.**
   - Add `orchestration/model-router/keepass-map.json`.
   - Start the router with KeePass env injection.
   - `GET /v1/models` must list only free models.
   - Send a tiny `POST /v1/chat/completions` with `model: "auto"`; confirm it reaches Ollama/GitHub and rotates on failure.
   - Confirm a paid model request returns HTTP 402.
3. **Fix `sourceRegistry.test.ts`.**
   - Find the generator; regenerate the source registry; rerun targeted test.
   - Do not inflate or hand-edit expected counts.
4. **Commit and push the CI fix** once `npm run verify` is green.
   - Commit only the CI/catalogue/package files first, not the whole tree.
   - Push to `master`; watch the Actions run to green.
5. **Register the hive MCP server with each free agent.**
   - Kilo: `kilo mcp add aetherius-hive -- node orchestration/hive/mcp-server.mjs` (verify syntax with `kilo mcp add --help`).
   - Vibe: `vibe mcp add aetherius-hive --transport stdio --command node --arg orchestration/hive/mcp-server.mjs`.
   - Codex: `codex mcp add aetherius-hive -- node orchestration/hive/mcp-server.mjs` (only if Codex is re-enabled with a free provider).
   - Hermes: `hermes mcp --help`, then add the stdio server.
   - OpenClaw: `openclaw mcp --help`, then add the stdio server.
   - Cline: inspect `~/.cline` or Cline docs for MCP config; add the same server.
   - Freebuff: create repo `mcp.json` with the hive stdio server; Freebuff loads it with `--trust-agents`.
   - Do not edit global configs without backing them up; only add entries.
6. **Create the Obsidian vault** `knowledge/Aetherius-Vault/` with linked notes:
   - Home, Architecture, Agents, Hive, Free Model Router, Requirements, Delivery, External Services, Release Gates.
   - Link to `docs/MASTER-REQUIREMENTS-REGISTER-2026-11-08.md`, `docs/CROSS-PLATFORM-DELIVERY-2026-11-08.md`, `docs/PROJECT-TODOS.yaml`.
7. **Build the Graphify graph.**
   - `graphify install --project --platform opencode`
   - `graphify . --code-only`
   - Add `graphify-out/` to `.gitignore`; commit a compact `public/knowledge/graph-summary.json` only if useful.
   - Optionally add a read-only Knowledge Graph app/Settings page.
8. **Run REA** (`rea --help`) and produce `docs/REA-ANALYSIS-2026-11-08.md` with a real, bounded analysis (e.g., built JS bundle endpoints/capabilities). Do not claim capabilities you did not observe.
9. **Update `docs/PROJECT-TODOS.yaml`** with all new requirements (cross-platform, hive, free router, Graphify, Obsidian, REA, CI, external services, Kaggle/Colab) and regenerate `docs/PROJECT-TODOS.md` with `REGENERATE_TODO_REPORT=1 npm test`.
10. **Delegate lanes** once the hive is up (see §6).
11. **Re-run `npm run verify`, `npm run test:apps`, `npm run release:gate`.**
12. **Commit/push/deploy only verified changes.**

---

## 5. External services (owner-gated)

These cannot be completed by an agent alone. Produce exact owner steps and status, never fake success.

| Service | Status | What is missing |
|---|---|---|
| Oracle VM | `OWNER_GATED` | No `~/.oci/config`; `oci` CLI missing. User asked to retry manual browser/tunnel. Prepare a click-by-click runbook; do not create a paid account. |
| Brevo | `OWNER_GATED` | No API key in env; account sign-in required. KeePass may contain credentials; check titles first. |
| UptimeRobot | `OWNER_GATED` | No API key in env; prepare monitor spec and owner steps. |
| Codecov | `OWNER_GATED` | No token/config; add a coverage workflow gated on `CODECOV_TOKEN` secret. |
| AWS | Decision: **skip** | No credentials. Recommended decision record: do not adopt AWS; Cloudflare remains primary. |
| Signing / stores | `OWNER_GATED` | No Apple/Google/Microsoft signing identities or developer accounts. Unsigned local builds only. |
| Security audit | `BLOCKED` | External auditor required. |
| Accessibility audit | `BLOCKED` | External auditor required. |
| Legal/privacy review | `OWNER_GATED` | Lawyer-reviewed policy required. |

Current release gate (before this workstream): **13 pass / 5 blocker fails / 1 warning = 19 checks, `NOT_RELEASABLE`**. Blockers: `signed-artifacts`, `security-audit`, `accessibility-audit`, `full-acceptance-fixtures`, `five-star-benchmark`. Warning: `kernel-status`.

---

## 6. Delegation lanes (free agents only)

| Lane | Owner | Deliverable | File scope |
|---|---|---|---|
| CI + registers | Cline or Kilo | Fix `sourceRegistry.test.ts`, verify CI, report exact commands | `src/programme/sourceRegistry.test.ts`, registry generator, CI files |
| Knowledge graph + Obsidian | Kilo | Graph build, summary, vault notes | `scripts/knowledge-graph.mjs`, `public/knowledge/**`, `knowledge/**` |
| E2E + browser workflows | Freebuff or Cline | Playwright desktop/mobile specs, window-launch sweep | `tests/e2e/**`, `playwright.config.ts` (supervisor adds deps) |
| Cross-platform evidence | Vibe | Desktop installer, Docker VM build, hashes | `docs/RELEASE-EVIDENCE-2026-11-08.md`, `packaging/**` |
| External-services report | Hermes | Status/runbooks, Codecov/UptimeRobot/Brevo configs | `docs/EXTERNAL-SERVICES-*`, `.github/workflows/coverage.yml`, `codecov.yml` |
| TODO register | OpenClaw | YAML + regenerated MD | `docs/PROJECT-TODOS.yaml`, `docs/PROJECT-TODOS.md` |
| Kaggle/Colab scaffold | Hermes or Codex (free router only) | Notebook + bundle script, owner-login gate | `training/**` |

Rules: each lane writes a task to the hive before starting and posts evidence when done. One writer per file. No pushes.

---

## 7. Known pitfalls

1. **PowerShell inline Python quoting** breaks f-strings. Use `scripts/keepass.py` or a temp `.py` file.
2. **pykeepass hangs** on an empty password unless `getpass.getpass` is patched. The helper does this.
3. **KeePass KDF is slow** (60–120s). Use a 180s timeout.
4. **`npm run verify` takes ~10 minutes** (610s observed). Use targeted tests during development.
5. **`localeCompare` is not deterministic across hosts.** Use code-unit sort for generated files.
6. **Node 20 lacks `Map.groupBy`.** CI must use Node 22+.
7. **Background shells on Windows** can hold file handles; do not start two agents writing the same file.
8. **Do not print secrets.** `keepass.py get` is pipe-only. `exec` injects env without output.
9. **Codex is paid** until reconfigured. Do not run it.
10. **Kilo/Cline default models may be paid.** Force free models/router.
11. **Freebuff headless positional prompt is unverified.** Test with a trivial prompt before delegating real work.
12. **Ollama endpoint** may be down for a few seconds after start; `ollama list` is the reliable check.

---

## 8. Resume prompt (paste into the next supervisor)

```text
You are taking over as supervisor for Aetherius-OS at C:\Users\jpowe\Desktop\Projects\Aetherius-OS.
Read docs/SUPERVISOR-HANDOFF-2026-11-08.md first, then
docs/CROSS-PLATFORM-DELIVERY-2026-11-08.md,
docs/MASTER-REQUIREMENTS-REGISTER-2026-11-08.md, and docs/PROJECT-TODOS.yaml.

Hard rules: free-only models and services; no paid action; KeePass stays local and
secret values are never printed; one writer per file; no force-push; no deletion of
uncommitted work; preserve Hermes/Genesis training.

Current job: finish and test orchestration/hive and orchestration/model-router, fix
src/programme/sourceRegistry.test.ts (expected 1131, observed 1149 after new files),
get `npm run verify` green, push the CI fix, then delegate the lanes in section 6.
Start the hive/router with:
  python scripts/keepass.py exec --map orchestration/model-router/keepass-map.json -- node orchestration/start.mjs
```

---

## 9. Evidence index

- CI failure log: GitHub Actions run `42401938661` (failed), `gh run view 42401938661 --log-failed`.
- Cascade: `catalogue.test.ts` byte-identical failure; `Map.groupBy` Node 20 reporter crash.
- Catalogue: 143 entries, 135 slices, 5 products, 2 engines, 1 placeholder.
- Typecheck: passed after Node 22/catalogue changes.
- Full suite: 1823 passed, 3 failed, 3 skipped (only sourceRegistry).
- KeePass: 128 entries; free AI credentials present for OpenRouter, Groq, Gemini, Mistral, Hugging Face, Vercel AI Gateway, OmniRoute.
- GitHub Models: HTTP 200 with `gh auth token` against `https://models.github.ai/inference`.
- Wrangler: logged in as `jprophit@googlemail.com`, account `87bcfffe9dac799fa69e44d3e0abeb4d`.
- Ollama: 11 local models available.
- Agents installed: Hermes 0.22.6, OpenClaw 2026.10.7, Kilo 7.8.17, Vibe 3.0.2, Cline 3.0.73, Freebuff 0.2.34, Codex 0.155.1, OpenCode 2.2.6.
