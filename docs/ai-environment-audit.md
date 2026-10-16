# Installed AI environment audit (BUILD73, 2026-10-03)

Machine truth, observed read-only on this Windows host. A GUI being installed
does not establish an automation API; each row names the mechanism actually
demonstrated. Spending: zero. Nothing was installed, uninstalled, started,
stopped or reconfigured.

## Host resources (measured)

- CPU: Intel i7-870, 4 cores / 8 threads.
- RAM: 16 GB total, ~2.9 GB free during audit.
- GPU: GTX 1050 Ti, 4 GB VRAM.
- Policy consequence: at most ONE model-intensive local worker at a time.
  Parallel local-model workers are not viable here; schedule sequentially.

## Application inventory

| Application | Version | Entry point | Demonstrated mechanism |
|---|---|---|---|
| OpenCode (provisional supervisor) | CLI 1.18.30 (installed 1.18.33) | `opencode run/serve/acp/mcp/agent` | SUPPORTED_CLI; this session is the demonstration |
| Codex CLI | 0.155.1 | `codex exec` / `codex review` (non-interactive) | SUPPORTED_CLI; 3 live processes observed, MAT worktree dirty — ACTIVE RESERVED, not touched |
| Hermes agent | v0.21.3 | `hermes --cli`, sessions, `--worktree` | BLOCKED: `hermes config` shows all API keys unset; a live probe failed with "Nous Portal didn't answer" + "this model's free period has ended" — needs owner provider setup |
| Ollama | 0.34.4, API live | `http://127.0.0.1:11434`, 11 local models | MODEL_BACKEND + proven worker: `qwen3:1.7b` answered delegated questions through the canonical runtime with independent verification (`tests/test_supervised_workers.py::TestModelBackendWorker`) |
| LM Studio CLI (`lms`) | 0.4.25+1 installed | server `127.0.0.1:1234` unreachable | UNAVAILABLE until its server is started (owner action, not taken) |
| Docker Desktop | 29.7.2 client | daemon pipe missing | UNAVAILABLE; G04 BLOCKED_EXTERNAL stands |
| VS Code / Cursor | 1.139.1 / 3.20.17 | no agent CLI verified | INTERACTIVE_ONLY |
| Claude Desktop | 2.9939.2 | no CLI; config file exists, contents never read | INTERACTIVE_ONLY; automation REQUIRES_OWNER_CONFIGURATION |
| Devin | 3.10.23 | no CLI | INTERACTIVE_ONLY |
| OpenClaw Companion | 2026.9.4 | no CLI | INTERACTIVE_ONLY |
| Antigravity | 2.15.0 + IDE 2.5.5 | no CLI | INTERACTIVE_ONLY |
| Manus / Windsurf | not found | — | UNAVAILABLE |
| `gh` | 2.100.0 | CLI present | SPECIALIST_PROVIDER (source control only, not probed further) |

Provider credentials and allowances: UNKNOWN throughout (credential stores
were not touched). Nothing here establishes paid API access.

## Eligibility matrix

- SUPERVISOR_ELIGIBLE: OpenCode (demonstrated), Hermes (mechanism demonstrated, provider unverified).
- WORKER_ELIGIBLE: `codex exec` (mechanism demonstrated; quota spend avoided this session), Hermes `--cli`, supervised OS processes via Agent Bridge `worker_runtime.py` (proven).
- REVIEW_ONLY: `codex review`, Agent Bridge reviewer/oracle path.
- MODEL_BACKEND: Ollama local endpoint only.
- A second verified supervisor-capable provider does not yet exist with a
  checked provider behind it, so supervisor handoff (scenario G) is explicitly
  BLOCKED, not simulated.

## What was proven this session (Agent Bridge, real processes)

`worker_runtime.py` + `worker_main.py` + `tests/test_supervised_workers.py`
(12 tests): spawn → heartbeat/checkpoint observation → result → independent
world-readback verification → lease release → cleanup; real mid-run kill →
STALLED → INTERRUPTED with partial output discarded → retry → verified;
supervisor crash → new supervisor attaches via durable binding and observes
completion through durable files; both-dead → recover → respawn → verified;
budget overrun → TIMEOUT; second supervisor refused on a leased task;
tampered output refuses completion; `model-query` tasks delegate answering to
Ollama with supervisor-declared ground truth and match rules, and unreachable
backends fail honestly. Two genuine defects found by the tests:
Windows text-mode newline translation breaking digest identity, and torn
heartbeat reads fixed with atomic writes.

## BUILD76 additions

- FreeCAD 1.0.2 (`C:\Program Files\FreeCAD 1.0\bin\freecadcmd.exe`, headless console works): Blender absent (exact missing dependency recorded, no substitution). Adapter `Agent-Bridge/freecad_adapter.py` (discover/run-script/verify, path containment, timeouts) + 8 tests, green under pytest and unittest. Native bracket FCStd created, reopened, dimensions verified 60×40×40; delegated end-to-end through the canonical runtime (`freecad-task` kind, 14/14 worker tests). Notable app behavior: FreeCADCmd exits 0 even when the script raises — verification uses transcript markers, never exit codes alone.
- Audio pipeline (all local, disposable sample): Windows SAPI synthesis → `faster-whisper` tiny (CPU int8, pip-installed) → EXACT transcript (7.8s load, 15.4s inference) → granite reasoning ("Fox", correct). Known defect recorded: faster-whisper 1.2.1 is incompatible with PyAV 19 (`metadata_errors` kwarg removed); worked around via the documented numpy-array API, stdlib `wave` decode. No TTS engine installed (optional, not configured).
- Ministral native vision on a synthetic set (self-generated PNGs): red circle 65s correct; blue square + green diamond 13s correct; diagonal line 7s correct — 3/3. Reviewer role vision-capable.
- Teamwork (disposable project): granite authored `slugify` via runtime delegation → pytest 3/3 → ministral review CLEAN → FreeCAD bracket via runtime → verified. Distinct executables recorded per task.
- Selector still returns null (no executable requirement); Docker daemon still down (G04 stands); Codex/MAT untouched.

Start LM Studio server; start Docker daemon (G04); cloud credentials (G07);
regulated-evidence legal review (G06); actuator boundary (G09); release
version/platform/publication (G12); provider credentials for Hermes or any
second supervisor; any push/tag/publication.
