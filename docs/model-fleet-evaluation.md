# Local model fleet evaluation (BUILD75, 2026-10-03)

Evidence-backed dispositions. A download is not an integration; only measured
results below count. Hardware ceiling (measured): 4 GB VRAM with ~2.9 GB
usable after desktop use, so 3B-class Q4 is the largest tier that runs, always
ONE model at a time with `num_ctx` ≤ 4096, and 8B+ is CPU-bound.

## Root-cause diagnosis (reproducible)

1. **Model limitation**: qwen3 thinking-trace variants (0.6b, 1.7b) leak
   reasoning into output and cannot follow exact-output constraints
   (28–68s, verbose, never just "PONG").
2. **Runtime/config limitation**: Ollama's default 60-min keep-alive stacked
   three models into 4 GB VRAM (271 MB free) → thrash. Remediation applied:
   `ollama stop` idle models after use; one-model-at-a-time discipline.
3. **Hardware limitation**: qwen3:8B (5.2 GB) and LM Studio Qwen3.5-9B
   (5.24 GB) exceed VRAM → CPU offload, unusable as interactive agents.

## Batch A results

| Model | Arch / params / quant | Exact-output | Tool call (structured) | Speed (num_ctx 4096) | GPU | Verdict |
|---|---|---|---|---|---|---|
| ministral-3:3b (3.0 GB) | mistral3 / 3.8B / Q4_K_M | PASS ("PONG") | PASS with explicit prompt (`get_weather(city=Paris)`, correct JSON); will NOT self-initiate | ~2s/short answer | 52% (3.1 GB resident) | PROMOTE — primary general worker |
| granite4:3b (2.1 GB) | granite / 3.4B / Q4_K_M | PASS ("PONG") | PASS first attempt, explicit prompt | fast | 88% | PROMOTE — coding/structured worker |
| phi4-mini (3.6 GB) | phi3 / 3.8B / Q4_K_M | PASS ("PONG") | FAIL twice — emits `[get_weather({...})]` as text, never the `tool_calls` field | — | 66% | EXPERIMENTAL for tool use; reasoning-only candidate |
| moondream (1.2 GB) | phi2+CLIP / 1B | n/a (vision) | n/a | 282s + wrong answer ("urn" for a red circle) | 100% | REJECT on this hardware — too slow and wrong |

## Teamwork demonstration (disposable project, Temp/opencode/team-demo)

- Supervisor (opencode): authored 3 acceptance tests for `slugify`.
- Coding worker (granite4:3b via canonical `worker_runtime`: lease, taskcenter node, heartbeats, result artifact, pid 28404, 33s): authored implementation.
- Independent verification (pytest, separate mechanism): **3/3 pass**.
- Review worker (ministral-3:3b, different model): **CLEAN** (78.8s, includes model-switch load).
- Recovery (granite worker killed mid-inference): STALLED → INTERRUPTED → retry → verified → completed.
- MAT/Codex untouched throughout.

## Existing fleet notes (no removals performed)

- qwen3:1.7b: RETAIN — proven delegation backend (`TestModelBackendWorker`).
- qwen3:0.6b, qwen2.5-coder (1.5b/3b), hhao tools-3b, qwen3.5:2b, deepseek-coder:1.3b: retirement CANDIDATES — Qwen-heavy duplication, but removal requires the full §7 sequence (reproduced failure + verified replacement + dependency check), not yet completed for these.
- qwen3:latest (8B): candidate for limited CPU-offload specialist; not yet evaluated.
- nomic-embed-text: RETAIN — embeddings specialist, tiny.
- LM Studio Qwen3.5-9B: not usable here; leave installed (owner data, no action taken).

## Deferred (not rejected)

llama3.2:3b, EXAONE 3.5 2.4B, LFM2.5-Thinking, Gemma 3 4B, audio models — no
justified capability gap remains after Batch A + vision verdict; adding them
would grow the collection without improving the team.

## Supervisor selection

Only OpenCode has verified supervisor capabilities. Hermes cannot supervise
(no provider: portal unreachable, free period ended). Switching stays
explicitly BLOCKED — no simulated handoff.
