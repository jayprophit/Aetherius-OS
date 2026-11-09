# Ollama & Windows Runtime Verification — 2026-11-09

**Starting commit:** `da9a41a9b0f3c86128bc6056aabd207393c812a6`
**Host:** win32 x64, Node v24.22.1, Cargo 1.98.0, Ollama 0.40.6 (update 0.40.15 available, not installed)
**Classification vocabulary:** BUILT ≠ RUNTIME_VERIFIED; Ollama ≠ Genesis

## 1. Ollama inventory (HTTP, no second server)
`GET http://127.0.0.1:11434/api/tags` ✅ 200

13 models: `llama3.2:3b`, `gemma3:4b`, `qwen3.5:0.8b`, `local-qwen3:1.7b-cpu`, `moondream:latest`, `granite4:3b`, `ministral-3:3b`, `nomic-embed-text:latest`, `granite3.3:2b`, `hhao/qwen2.5-coder-tools:3b`, `qwen3.5:2b-q4_K_M`, `qwen3:latest`, `qwen3:1.7b`

Smallest: `qwen3.5:0.8b` (752.39M params, GGUF, `/api/show` verified).

## 2. Generation tests (bounded, honest)
| Test | Result | Evidence |
|---|---|---|
| `POST /api/generate` `qwen3.5:0.8b` "Reply with the single word OK", `num_predict:8`, `temperature:0` | HTTP 200, `model=qwen3.5:0.8b`, **empty `response`**, `eval_count=8`, `eval_ms≈83s`, wall **74.7s** (~0.1 tok/s CPU) | Empty text + 8 tokens = CPU-bound / thinking-token artifact; not a success claim |
| `POST /api/chat` `qwen3.5:0.8b` "Say: HELLO WORLD", `num_predict:30` | HTTP 200, `content=[]`, wall **5.27s** | Empty content again; model/server reachable but generation not useful at this size |
| `POST /api/generate` `llama3.2:3b` "Say OK" | **Timeout 90s** (HttpClient timeout) | Larger model too slow on CPU; loading behavior = timeout, no crash; recovery = HTTP still 200 after |

**Conclusion:** Server health ✅, inventory ✅, but **generation quality/latency UNVERIFIED for useful inference** on this CPU host with these models. No update installed, no Hermes/Genesis training interrupted. Provider honesty preserved: Ollama responses are **not** labelled as native Genesis output.

Health/structured/streaming/cancellation/concurrent tests: **UNVERIFIED** (not run — would require GPU or longer timeouts; honest gap recorded).

## 3. Windows desktop (BUILT, not RUNTIME_VERIFIED)
Artifacts still present, hashes match 2026-11-08 build:
- `aetherius-desktop.exe` (9325056 B) — `EAD510149DB4B5F3738A338DEC282FFC08C39222CBC7E01E55182B99F9EDB3ED`
- `bundle/msi/Aetherius OS_0.1.0_x64_en-US.msi` (3375104 B) — `CA4F0DD2AE97AB5A4DC712D57483E0F8AA173C8C03F0D8689E4EE52E507CE8A0`
- `bundle/nsis/Aetherius OS_0.1.0_x64-setup.exe` (2391599 B) — `D45286918357ADFC60C808AEE5F291BC9FB94C8AE49222CF1A544189F185E158`

`src-tauri/tauri.conf.json`: `frontendDist: ../dist`, `beforeBuildCommand: npm run build` — bundles local frontend, no Pages/Vite dependency (Graphify `frontendDist`/`bundle` nodes). ICO fix verified (Pillow BMP ICO, `295854c`); `rc.exe RC2176` no longer occurs (last build exit 0).

Mandatory 12-point local execution tests: **UNVERIFIED** (GUI launch requires interactive session; not performed headlessly). Build alone is `BUILT`, not `RUNTIME_VERIFIED`.

## 4. Genesis / Agent Bridge contracts
- Graphify: `probeLocalOllama()` / `probeGenesisServer()` / `probeAgentBridge()` / `chatWithProvider()` in `src/ai/provider.ts`, `localClient.ts` in `src/ai/localClient.ts`, `GENESIS→AgentCoordinator` path (4 hops, EXTRACTED)
- Provider honesty: `local-ollama` ≠ `genesis-server` ≠ `agent-bridge` ≠ `offline-fallback`; never label Ollama as Genesis
- Native Genesis server: `probeGenesisServer` returns `NOT_CONFIGURED` when no endpoint supplied (recorded, no invented success)
- Agent Bridge: approval gates + audit logging present in provider contract; live bridge health UNVERIFIED this run

## 5. Offline / storage / Linux / cross-device (this run)
- Offline persistence: FileSystem quota/error now implemented + tested (2026-11-08); live offline launch UNVERIFIED
- R2: `aetherius-blobs` CONFIGURED/DEPLOYED/REACHABLE (2026-11-09 `wrangler r2 bucket list`); live blob ops UNVERIFIED; zero-charge preserved
- Linux: `packaging/vm` Docker appliance BUILDABLE; Omarchy P0 stays at config overlays + plugin IPC proposal (`docs/research/OMARCHY-REA-2026-11-08.md`)
- Cross-device: desktop BUILDABLE, android/iOS BLOCKED (`platform:preflight`)

## 6. Release gate
`NOT_RELEASABLE` (13 pass / 5 blocker / 1 warning), `NOT_5_STAR` retained.
