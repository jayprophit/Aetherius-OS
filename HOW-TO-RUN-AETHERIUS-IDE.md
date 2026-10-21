# HOW TO RUN AETHERIUS IDE

The Aetherius IDE is the interface to the Aetherius OS stack. It is only
useful when it can reach a model, so it runs on top of two services that
have to be up first:

```
Ollama  ->  Agent Bridge  ->  Aetherius IDE
(local     (execution       (the interface
 models)    runtime)
```

- **Ollama** serves the local models. Without it the Bridge reports
  `UNAVAILABLE` and the IDE shows no models.
- **Agent Bridge** is the execution runtime. The IDE talks to it and to
  nothing else.
- **Aetherius IDE** is the interface. It never talks to a model directly.

Every path and every port below was checked by starting the stack from
cold and reading the result back, not by reading the source.

---

## Quick start

```powershell
cd "C:\Users\jpowe\Desktop\Projects\Aetherius-OS"
powershell -ExecutionPolicy Bypass -File scripts\start-ide-stack.ps1
```

Then open **<http://127.0.0.1:5199>**.

The launcher starts each service only if it is not already running, waits
for it, and then prints what is actually true:

```
1. The local model runtime
  up on port 11434
  serving 10 local model(s)

2. Agent Bridge
  up on port 8471

3. The Aetherius IDE
  up on port 5199

4. What is actually true
  the Bridge health is HEALTHY
  the Bridge sees 10 local model(s)
  the IDE answers with HTTP 200
```

If a step fails the launcher says which one and why, rather than leaving
you to work it out.

To stop it:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-ide-stack.ps1 -Stop
```

---

## Manual launch

Use this when you want to see the output of a service directly.

### 1. The local model runtime

Ollama is installed at `C:\Users\jpowe\AppData\Local\Programs\Ollama`.

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" serve
```

It listens on `127.0.0.1:11434`.

**Wait for it to be ready, not just listening.** The port opens well
before the model runtime can answer, and until it can, the Bridge
reports no models and the IDE shows an empty ModelCenter. Check with:

```powershell
(Invoke-RestMethod http://127.0.0.1:11434/api/tags).models.Count
```

Ten models are expected. The ones that matter most are the local role
pool:

| Model | Role |
|---|---|
| `hhao/qwen2.5-coder-tools:3b` | PRIMARY_CODER |
| `granite3.3:2b` | GENERAL_REASONER |
| `qwen3.5:2b-q4_K_M` | SECONDARY_GENERAL |
| `qwen3:1.7b` | TERTIARY_REASONER |
| `qwen3:latest` | FALLBACK |
| `nomic-embed-text:latest` | EMBEDDING |
| `moondream:latest` | vision |

### 2. Agent Bridge

```powershell
cd "C:\Users\jpowe\Desktop\Projects\Agent-Bridge"
python service.py --port 8471 `
  --cors-origin "http://127.0.0.1:5199" `
  --root "C:\Users\jpowe\Desktop\Projects\Aetherius-OS\apps\IDE-Workspace\workspace"
```

**The `--cors-origin` flag is not optional.** The Bridge sends no CORS
header unless the requesting origin is explicitly allowlisted, and it
never sends `*`. Without this flag the browser refuses the response and
the IDE shows `backend: disconnected` with no error visible anywhere.

The `--root` flag sets the directories the Bridge is allowed to read and
write. Without it the Bridge's workspace roots do not pass their own
health check and the whole runtime reports `UNAVAILABLE`.

Check it:

```powershell
(Invoke-RestMethod http://127.0.0.1:8471/v1/runtime).health
```

### 3. The Aetherius IDE

```powershell
cd "C:\Users\jpowe\Desktop\Projects\Aetherius-OS\apps\IDE-Workspace\workspace\app"
npm install     # only the first time
npm run dev
```

It listens on `127.0.0.1:5199`. Open that address.

---

## What you should see

| In the IDE | Means |
|---|---|
| `backend: connected (HEALTHY)` | the IDE reached the Bridge |
| `Models (10)` in the ModelCenter | the Bridge reached the local models |
| `model: no model connected` | no model is *selected* yet — this is correct and honest until you pick one |
| `agent: no agent connected` | no agent is running yet |
| `workers: 0 registered` | the Bridge has no live worker roster endpoint yet — a known gap, not a fault |

**`backend: connected` and `Models (10)` together are the acceptance
signal.** A connected Bridge with no models means the model runtime is
down, not that the IDE is broken.

---

## The routes worth knowing

| Route | What it is |
|---|---|
| `GET /v1/runtime` | the live runtime snapshot: tasks, queue, workers, approvals, models, health |
| `GET /v1/models` | the local model inventory, straight from the model runtime |
| `GET /v1/diagnostics` | full health checks and the inventory |
| `GET /v1/selfcheck` | one PASS/FAIL/WARN line per subsystem |
| `GET /health` | the short health status |

`/v1/runtime` and `/v1/models` agree about the model list. They did not
always: the runtime snapshot used to report no models while `/v1/models`
reported ten, and that inconsistency is now covered by a test.

There is no `/v1/health`. The short status route is `/health`.

---

## When something is wrong

**`backend: disconnected` in the IDE, but the Bridge answers in
PowerShell.** The CORS origin is not allowlisted. The IDE origin is
`http://127.0.0.1:5199` — note that `localhost:5199` is a *different*
origin and will not be allowed.

**The Bridge says `UNAVAILABLE` and lists no models.** Ollama is not
running, or is running but not ready yet. Check `/v1/selfcheck` and the
`ollama` line in it.

**The Bridge says `UNAVAILABLE` and the `workspace_roots` check fails.**
The `--root` path does not exist. After the workspace was reorganised
this path changed; the current one is above.

**The IDE shows `backend: connected` but `Models (0)`.** The model
runtime came up after the Bridge did. The Bridge re-reads the inventory
on each request, so this resolves on the next poll; if it does not,
restart the Bridge.

**The IDE will not start.** Port 5199 is in use, or `npm install` has
not been run in `workspace\app`.

---

## The other entry point

`http://127.0.0.1:5199/genesis-ui.html` is the standalone Genesis
scaffold, mounted separately from the workspace shell. It defaults to
**fixture mode**, which is labelled as such and cannot pretend to be
live. It is not the same thing as the IDE.

---

## Related

- `scripts/start-ide-stack.ps1` — the launcher
- `apps/IDE-Workspace/workspace/app/src/genesis-ui/docs/RUNTIME_BINDING.md`
  — how the IDE binds to the Bridge, and the honesty rules it enforces
- `apps/IDE-Workspace/build.yaml` — the IDE's build manifest
- `docs/PROJECT-TODOS.yaml` — the single work list for the whole programme
