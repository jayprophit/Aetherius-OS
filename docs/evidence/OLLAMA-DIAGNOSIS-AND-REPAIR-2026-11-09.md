# Ollama Diagnosis & LocalClient Repair — 2026-11-09 (follow-up)

**Starting commit:** `e5be1b20e467353caf6b03cc0547b8e1cfb3d7c8`
**Previous evidence:** `docs/evidence/OLLAMA-WINDOWS-VERIFICATION-2026-11-09.md` (empty Qwen3.5 without `think:false`)

## Diagnosis — thinking tokens consumed `num_predict`
- `POST /api/chat` without `think` returned `content=[]` for `qwen3.5:0.8b`.
- Same request with top-level `"think": false` returned **`HELLO WORLD`**:
  - `model=qwen3.5:0.8b`, `content=[HELLO WORLD]`, `thinking_present=False`
  - `done=true`, `done_reason=stop`, `eval_count=4`, `eval_ns=324139000` (0.32s)
  - `load_ns=40235525000` (40.24s CPU load), `total_ns=41950917800` (41.95s)
  - Wall **42977 ms** — duration discrepancy: wall ≫ `total_ns` is explained by model-load on CPU (first load), not by server misreporting. Client wall-clock is authoritative for user latency.
- `POST /api/chat` `llama3.2:3b` with `think:false`: **Timeout 90s** on CPU (larger model). Recovery: HTTP still 200 after.
- `/api/show` `qwen3.5:0.8b`: `format=gguf`, `parameter_size=752.39M` — model supports top-level `think`.

**Root cause:** Qwen3.5 thinking tokens filled the output budget when `think` was omitted; client previously sent no `think` and accepted empty content as success. Not a crash, not a parsing bug.

## Repair (`src/ai/localClient.ts`)
1. ✅ Empty/whitespace-only → `EMPTY_OUTPUT` (never success)
2. ✅ Top-level `think` sent (default `false`, verified); `num_predict` passthrough
3. ✅ `done_reason: "length"` + empty → `TRUNCATED` (no fabricated output shown)
4. ✅ Explicit `model` selection preserved; auto-selection optional (`chooseLocalModel`)
5. ✅ Preference re-ordered to measured-functioning `qwen3.5:0.8b` first
6. ✅ Bounded timeout + `AbortSignal` cancellation preserved
7. ✅ Honest labels: Ollama never labelled Genesis
8. ✅ No external upload; `unit tests` for empty/thinking/truncated/timeout/cancel/valid (`src/ai/localClient.test.ts`, 12/12, typecheck 0)

## Windows runtime (still `BUILT`)
- Artifacts unchanged, hash `EAD51014…` matches
- `frontendDist: ../dist` verified; 12-point GUI acceptance: `UNVERIFIED` (requires interactive session; no headless claim)

## Evidence matrix
- `BUILT`: Tauri exe/MSI/NSIS ✅
- `UNIT_TESTED`: `localClient` 12/12 ✅
- `INTEGRATED`: Ollama `INTEGRATED` for `qwen3.5:0.8b` (HELLO WORLD) — `llama3.2:3b` `UNVERIFIED` (timeout)
- `RUNTIME_VERIFIED` / `E2E_VERIFIED`: pending interactive GUI + GPU
- `NOT_RELEASABLE` / `NOT_5_STAR` retained
