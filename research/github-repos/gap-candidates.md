# Which repositories can inform which open gap

This is the join between the two registers. Each open gap in the
Genesis analysis is listed with the repositories in the account
that speak to it. The licence column decides whether a repository
may be read for ideas, or may also be copied from.

26 open gaps, 609 repositories.

## GAP-HIVE-001 — Delegation with narrowing scope

- Axis: `multi_agent`
- Priority: 1
- Status: MISSING
- The gap: Genesis proposes and Agent Bridge executes, but there is no delegation primitive that issues a scoped grant to a child agent, checks that the child cannot widen it, and proves it.
- Own repositories on this axis: `Aetherius-OS`, `Agent-Bridge`, `Docker`, `Kafka`, `Universal-Bridge`
- Candidate forks: 42

  - `A2A` — Apache-2.0 — may copy
  - `accelerate` — Apache-2.0 — may copy
  - `agent-framework` — MIT — may copy
  - `arrow` — Apache-2.0 — may copy
  - `autogen` — CC-BY-4.0 — check the licence
  - `automerge` — MIT — may copy
  - `browser-use` — MIT — may copy
  - `ceph` — NOASSERTION — check the licence
  - `cockroach` — NOASSERTION — check the licence
  - `crewAI` — MIT — may copy
  - `electric` — Apache-2.0 — may copy
  - `grpc` — Apache-2.0 — may copy
  - `inspector` — unknown — no licence found
  - `IsaacLab` — BSD-3-Clause — may copy
  - `juicefs` — Apache-2.0 — may copy
  - `liblo` — LGPL-2.1 — named files only
  - `livekit` — Apache-2.0 — may copy
  - `nats-server` — Apache-2.0 — may copy
  - `opa` — Apache-2.0 — may copy
  - `OpenHands` — MIT — may copy
  - `opentelemetry-collector` — Apache-2.0 — may copy
  - `openthread` — BSD-3-Clause — may copy
  - `phone-harness` — MIT — may copy
  - `playwright` — Apache-2.0 — may copy
  - `protobuf` — NOASSERTION — check the licence
  - ... and 17 more

## GAP-HIVE-002 — Hive communication and messaging

- Axis: `multi_agent`
- Priority: 1
- Status: MISSING
- The gap: No agent can address another agent. There is no message type, no transport and no record of who said what to whom.
- Own repositories on this axis: `Aetherius-OS`, `Agent-Bridge`, `Docker`, `Kafka`, `Universal-Bridge`
- Candidate forks: 42

  - `A2A` — Apache-2.0 — may copy
  - `accelerate` — Apache-2.0 — may copy
  - `agent-framework` — MIT — may copy
  - `arrow` — Apache-2.0 — may copy
  - `autogen` — CC-BY-4.0 — check the licence
  - `automerge` — MIT — may copy
  - `browser-use` — MIT — may copy
  - `ceph` — NOASSERTION — check the licence
  - `cockroach` — NOASSERTION — check the licence
  - `crewAI` — MIT — may copy
  - `electric` — Apache-2.0 — may copy
  - `grpc` — Apache-2.0 — may copy
  - `inspector` — unknown — no licence found
  - `IsaacLab` — BSD-3-Clause — may copy
  - `juicefs` — Apache-2.0 — may copy
  - `liblo` — LGPL-2.1 — named files only
  - `livekit` — Apache-2.0 — may copy
  - `nats-server` — Apache-2.0 — may copy
  - `opa` — Apache-2.0 — may copy
  - `OpenHands` — MIT — may copy
  - `opentelemetry-collector` — Apache-2.0 — may copy
  - `openthread` — BSD-3-Clause — may copy
  - `phone-harness` — MIT — may copy
  - `playwright` — Apache-2.0 — may copy
  - `protobuf` — NOASSERTION — check the licence
  - ... and 17 more

## GAP-LIFE-001 — Crash recovery and checkpoint resume

- Axis: `lifecycle_recovery`
- Priority: 1
- Status: MISSING
- The gap: A crash loses the run. There is no checkpoint, no idempotency key and no recovery, so a remote worker that dies leaves work half done with no way to resume it.
- Own repositories on this axis: `Poietek`
- Candidate forks: 1

  - `temporal` — MIT — may copy

## GAP-MODEL-002 — Free-first admission and zero-spend guard

- Axis: `model_integration`
- Priority: 1
- Status: MISSING
- The gap: Nothing refuses a paid or unknown endpoint. The policy is described in the handoff and enforced nowhere in the kernel or the runtime.
- Own repositories on this axis: `Veyra`
- Candidate forks: 35

  - `agent-framework` — MIT — may copy
  - `audiocraft` — MIT — may copy
  - `avex` — MIT — may copy
  - `beans-next` — unknown — no licence found
  - `bioacoustics-model-zoo` — MIT — may copy
  - `BitNet` — MIT — may copy
  - `browser-use` — MIT — may copy
  - `ComfyUI` — GPL-3.0 — read for design only
  - `Depth-Anything-V2` — Apache-2.0 — may copy
  - `diffusers` — Apache-2.0 — may copy
  - `executorch` — NOASSERTION — check the licence
  - `F5-TTS` — MIT — may copy
  - `faster-whisper` — MIT — may copy
  - `ggml` — MIT — may copy
  - `k3s` — Apache-2.0 — may copy
  - `litellm` — NOASSERTION — check the licence
  - `livekit` — Apache-2.0 — may copy
  - `llama.cpp` — MIT — may copy
  - `llama_index` — MIT — may copy
  - `mlc-llm` — Apache-2.0 — may copy
  - `n8n` — NOASSERTION — check the licence
  - `NatureLM-audio` — MIT — may copy
  - `ollama` — MIT — may copy
  - `open-webui` — NOASSERTION — check the licence
  - `peft` — Apache-2.0 — may copy
  - ... and 10 more

## GAP-PLAN-001 — Task decomposition and planning

- Axis: `planning`
- Priority: 1
- Status: PARTIAL
- The gap: Workflows are flat ordered steps with one tool call each. There is no decomposition, no dependency graph, no re-planning when a step fails, and the organism loop is missing its plan stage entirely.
- Own repositories on this axis: `aetherial-platform`, `Aetherius-OS`, `DevOps`, `Universal-Bridge`, `Veyra`
- Candidate forks: 30

  - `autogen` — CC-BY-4.0 — check the licence
  - `beans-next` — unknown — no licence found
  - `compose` — Apache-2.0 — may copy
  - `crewAI` — MIT — may copy
  - `electric` — Apache-2.0 — may copy
  - `faster-whisper` — MIT — may copy
  - `gtsam` — NOASSERTION — check the licence
  - `inspector` — unknown — no licence found
  - `iree` — Apache-2.0 — may copy
  - `IsaacLab` — BSD-3-Clause — may copy
  - `juicefs` — Apache-2.0 — may copy
  - `kind` — Apache-2.0 — may copy
  - `kubo` — NOASSERTION — check the licence
  - `langgraph` — MIT — may copy
  - `livekit` — Apache-2.0 — may copy
  - `mem0` — Apache-2.0 — may copy
  - `n8n` — NOASSERTION — check the licence
  - `opa` — Apache-2.0 — may copy
  - `OpenHands` — MIT — may copy
  - `opentelemetry-collector` — Apache-2.0 — may copy
  - `phone-harness` — MIT — may copy
  - `playwright` — Apache-2.0 — may copy
  - `pydantic-ai` — MIT — may copy
  - `qdrant` — Apache-2.0 — may copy
  - `seaweedfs` — Apache-2.0 — may copy
  - ... and 5 more

## GAP-PLAN-002 — Durable task state, checkpoints and resume

- Axis: `planning`
- Priority: 1
- Status: MISSING
- The gap: A run exists only as an in-memory record. There is no durable task registry, no checkpoint, no lease and no resume, so a job cannot survive a restart or a crash.
- Own repositories on this axis: `aetherial-platform`, `Aetherius-OS`, `DevOps`, `Universal-Bridge`, `Veyra`
- Candidate forks: 30

  - `autogen` — CC-BY-4.0 — check the licence
  - `beans-next` — unknown — no licence found
  - `compose` — Apache-2.0 — may copy
  - `crewAI` — MIT — may copy
  - `electric` — Apache-2.0 — may copy
  - `faster-whisper` — MIT — may copy
  - `gtsam` — NOASSERTION — check the licence
  - `inspector` — unknown — no licence found
  - `iree` — Apache-2.0 — may copy
  - `IsaacLab` — BSD-3-Clause — may copy
  - `juicefs` — Apache-2.0 — may copy
  - `kind` — Apache-2.0 — may copy
  - `kubo` — NOASSERTION — check the licence
  - `langgraph` — MIT — may copy
  - `livekit` — Apache-2.0 — may copy
  - `mem0` — Apache-2.0 — may copy
  - `n8n` — NOASSERTION — check the licence
  - `opa` — Apache-2.0 — may copy
  - `OpenHands` — MIT — may copy
  - `opentelemetry-collector` — Apache-2.0 — may copy
  - `phone-harness` — MIT — may copy
  - `playwright` — Apache-2.0 — may copy
  - `pydantic-ai` — MIT — may copy
  - `qdrant` — Apache-2.0 — may copy
  - `seaweedfs` — Apache-2.0 — may copy
  - ... and 5 more

## GAP-TOOL-001 — Tool execution and sandboxing

- Axis: `tool_execution`
- Priority: 1
- Status: PARTIAL
- The gap: Tools are declared with grants and a sandbox requirement, and workflows are described, but nothing executes a tool. The runtime prepares a run and stops at the approval gate.
- Own repositories on this axis: `aetherium`, `Agent-Bridge`, `Genesis`, `Poietek`, `Puppeteer`, `Shell`
- Candidate forks: 30

  - `autogen` — CC-BY-4.0 — check the licence
  - `automerge` — MIT — may copy
  - `bootc` — NOASSERTION — check the licence
  - `buildkit` — unknown — no licence found
  - `code-server` — MIT — may copy
  - `containerd` — Apache-2.0 — may copy
  - `cosign` — Apache-2.0 — may copy
  - `crewAI` — MIT — may copy
  - `crm` — MIT — may copy
  - `emscripten` — NOASSERTION — check the licence
  - `F5-TTS` — MIT — may copy
  - `firecracker` — Apache-2.0 — may copy
  - `gods-eye-view` — NOASSERTION — check the licence
  - `gvisor` — Apache-2.0 — may copy
  - `inspector` — unknown — no licence found
  - `mlc-llm` — Apache-2.0 — may copy
  - `moby` — Apache-2.0 — may copy
  - `monaco-editor` — MIT — may copy
  - `open-webui` — NOASSERTION — check the licence
  - `openvsx` — EPL-2.0 — check the licence
  - `oras` — Apache-2.0 — may copy
  - `pglite` — Apache-2.0 — may copy
  - `playwright` — Apache-2.0 — may copy
  - `servers` — NOASSERTION — check the licence
  - `SkillSpector` — Apache-2.0 — may copy
  - ... and 5 more

## GAP-AUTH-002 — Secret isolation

- Axis: `permissions_authority`
- Priority: 2
- Status: PARTIAL
- The gap: Key custody and a crypto provider exist and are well tested, but there is no path from a secret to a caller that never shows the model the plaintext.
- Own repositories on this axis: `Universal-Bridge`
- Candidate forks: 1

  - `opa` — Apache-2.0 — may copy

## GAP-FS-001 — Workspace and file management

- Axis: `workspace_files`
- Priority: 2
- Status: PARTIAL
- The gap: The agent has a filesystem capability and a path, but no workspace object, no sandboxed root and no read/write path through the kernel.
- Own repositories on this axis: `aetherial-platform`, `Git`, `Poietek`
- Candidate forks: 59

  - `alp-data` — MIT — may copy
  - `arrow` — Apache-2.0 — may copy
  - `aubio` — GPL-3.0 — read for design only
  - `automerge` — MIT — may copy
  - `beans-next` — unknown — no licence found
  - `bioacoustic-ssl` — MIT — may copy
  - `biodenoising` — MIT — may copy
  - `biopython` — NOASSERTION — check the licence
  - `bullet3` — NOASSERTION — check the licence
  - `ceph` — NOASSERTION — check the licence
  - `cFS` — Apache-2.0 — may copy
  - `circt` — NOASSERTION — check the licence
  - `code-server` — MIT — may copy
  - `containerd` — Apache-2.0 — may copy
  - `cosign` — Apache-2.0 — may copy
  - `cr-sqlite` — MIT — may copy
  - `crm` — MIT — may copy
  - `demucs` — MIT — may copy
  - `dolfinx` — LGPL-3.0 — named files only
  - `gatk` — NOASSERTION — check the licence
  - `git-lfs` — NOASSERTION — check the licence
  - `ibex` — Apache-2.0 — may copy
  - `influxdb` — Apache-2.0 — may copy
  - `libsigrok` — GPL-3.0 — read for design only
  - `link` — NOASSERTION — check the licence
  - ... and 34 more

## GAP-FS-002 — Per-agent worktree isolation

- Axis: `workspace_files`
- Priority: 2
- Status: MISSING
- The gap: Two agents writing at once have no isolation mechanism inside Genesis. The handoff requires one autonomous writer per checkout, and nothing enforces it.
- Own repositories on this axis: `aetherial-platform`, `Git`, `Poietek`
- Candidate forks: 59

  - `alp-data` — MIT — may copy
  - `arrow` — Apache-2.0 — may copy
  - `aubio` — GPL-3.0 — read for design only
  - `automerge` — MIT — may copy
  - `beans-next` — unknown — no licence found
  - `bioacoustic-ssl` — MIT — may copy
  - `biodenoising` — MIT — may copy
  - `biopython` — NOASSERTION — check the licence
  - `bullet3` — NOASSERTION — check the licence
  - `ceph` — NOASSERTION — check the licence
  - `cFS` — Apache-2.0 — may copy
  - `circt` — NOASSERTION — check the licence
  - `code-server` — MIT — may copy
  - `containerd` — Apache-2.0 — may copy
  - `cosign` — Apache-2.0 — may copy
  - `cr-sqlite` — MIT — may copy
  - `crm` — MIT — may copy
  - `demucs` — MIT — may copy
  - `dolfinx` — LGPL-3.0 — named files only
  - `gatk` — NOASSERTION — check the licence
  - `git-lfs` — NOASSERTION — check the licence
  - `ibex` — Apache-2.0 — may copy
  - `influxdb` — Apache-2.0 — may copy
  - `libsigrok` — GPL-3.0 — read for design only
  - `link` — NOASSERTION — check the licence
  - ... and 34 more

## GAP-HIVE-003 — Dynamic team formation and roles

- Axis: `multi_agent`
- Priority: 2
- Status: PARTIAL
- The gap: Agent definitions are static and registered by hand. Nothing forms a team for a task, sizes it, or retires it when the work is done.
- Own repositories on this axis: `Aetherius-OS`, `Agent-Bridge`, `Docker`, `Kafka`, `Universal-Bridge`
- Candidate forks: 42

  - `A2A` — Apache-2.0 — may copy
  - `accelerate` — Apache-2.0 — may copy
  - `agent-framework` — MIT — may copy
  - `arrow` — Apache-2.0 — may copy
  - `autogen` — CC-BY-4.0 — check the licence
  - `automerge` — MIT — may copy
  - `browser-use` — MIT — may copy
  - `ceph` — NOASSERTION — check the licence
  - `cockroach` — NOASSERTION — check the licence
  - `crewAI` — MIT — may copy
  - `electric` — Apache-2.0 — may copy
  - `grpc` — Apache-2.0 — may copy
  - `inspector` — unknown — no licence found
  - `IsaacLab` — BSD-3-Clause — may copy
  - `juicefs` — Apache-2.0 — may copy
  - `liblo` — LGPL-2.1 — named files only
  - `livekit` — Apache-2.0 — may copy
  - `nats-server` — Apache-2.0 — may copy
  - `opa` — Apache-2.0 — may copy
  - `OpenHands` — MIT — may copy
  - `opentelemetry-collector` — Apache-2.0 — may copy
  - `openthread` — BSD-3-Clause — may copy
  - `phone-harness` — MIT — may copy
  - `playwright` — Apache-2.0 — may copy
  - `protobuf` — NOASSERTION — check the licence
  - ... and 17 more

## GAP-ID-002 — Session and conversation continuity

- Axis: `identity_persistence`
- Priority: 2
- Status: PARTIAL
- The gap: Continuity is modelled but there is no session object a user can resume, and no per-session memory scope.
- Own repositories on this axis: `aetherial-platform`, `Universal-Bridge`
- Candidate forks: 5

  - `anoncreds-rs` — Apache-2.0 — may copy
  - `antigravity-sdk-python` — Apache-2.0 — may copy
  - `keycloak` — Apache-2.0 — may copy
  - `livekit` — Apache-2.0 — may copy
  - `playwright` — Apache-2.0 — may copy

## GAP-KNOW-001 — Source-linked retrieval

- Axis: `knowledge_retrieval`
- Priority: 2
- Status: PARTIAL
- The gap: Genesis holds a memory graph but no retrieval over external sources with provenance, so a claim cannot be traced to where it came from.
- Candidate forks: 14

  - `avex` — MIT — may copy
  - `BirdNET-Analyzer` — MIT — may copy
  - `graphiti` — Apache-2.0 — may copy
  - `mem0` — Apache-2.0 — may copy
  - `ollama` — MIT — may copy
  - `open-webui` — NOASSERTION — check the licence
  - `pydantic-ai` — MIT — may copy
  - `qdrant` — Apache-2.0 — may copy
  - `servers` — NOASSERTION — check the licence
  - `surrealdb` — NOASSERTION — check the licence
  - `ultralytics` — AGPL-3.0 — read for design only
  - `VibeVoice-community` — MIT — may copy
  - `vllm` — Apache-2.0 — may copy
  - `audio-embeddings` — unknown — no licence found — stale

## GAP-LIFE-002 — Continuous background operation

- Axis: `lifecycle_recovery`
- Priority: 2
- Status: PARTIAL
- The gap: Triggers and a schedule registry exist, and the organism loop runs, but nothing keeps the work alive when the browser is closed or the machine sleeps, and no task checkpoint and resumes.
- Own repositories on this axis: `Poietek`
- Candidate forks: 1

  - `temporal` — MIT — may copy

## GAP-LIFE-003 — Failure domains and circuit breakers

- Axis: `lifecycle_recovery`
- Priority: 2
- Status: MISSING
- The gap: There is no isolated failure domain and no circuit breaker in the Genesis runtime, so one bad tool call can take the whole agent down.
- Own repositories on this axis: `Poietek`
- Candidate forks: 1

  - `temporal` — MIT — may copy

## GAP-MEM-001 — Working memory and context management

- Axis: `memory_context`
- Priority: 2
- Status: PARTIAL
- The gap: The conscious workspace exists and the memory graph is implemented, but there is no context assembly, no budget, and no eviction policy for what goes into a model's window.
- Own repositories on this axis: `Aetherius-OS`
- Candidate forks: 14

  - `A2A` — Apache-2.0 — may copy
  - `arrow` — Apache-2.0 — may copy
  - `gdal` — NOASSERTION — check the licence
  - `graphiti` — Apache-2.0 — may copy
  - `kokkos` — NOASSERTION — check the licence
  - `kubo` — NOASSERTION — check the licence
  - `langgraph` — MIT — may copy
  - `llama_index` — MIT — may copy
  - `mem0` — Apache-2.0 — may copy
  - `open-webui` — NOASSERTION — check the licence
  - `qdrant` — Apache-2.0 — may copy
  - `servers` — NOASSERTION — check the licence
  - `surrealdb` — NOASSERTION — check the licence
  - `vllm` — Apache-2.0 — may copy

## GAP-MEM-003 — Shared knowledge fabric across the hive

- Axis: `memory_context`
- Priority: 2
- Status: MISSING
- The gap: There is no mechanism for agents to publish findings to each other with provenance, so every agent re-derives what another already knows.
- Own repositories on this axis: `Aetherius-OS`
- Candidate forks: 14

  - `A2A` — Apache-2.0 — may copy
  - `arrow` — Apache-2.0 — may copy
  - `gdal` — NOASSERTION — check the licence
  - `graphiti` — Apache-2.0 — may copy
  - `kokkos` — NOASSERTION — check the licence
  - `kubo` — NOASSERTION — check the licence
  - `langgraph` — MIT — may copy
  - `llama_index` — MIT — may copy
  - `mem0` — Apache-2.0 — may copy
  - `open-webui` — NOASSERTION — check the licence
  - `qdrant` — Apache-2.0 — may copy
  - `servers` — NOASSERTION — check the licence
  - `surrealdb` — NOASSERTION — check the licence
  - `vllm` — Apache-2.0 — may copy

## GAP-OBS-001 — Tool call attribution and replay

- Axis: `observability_audit`
- Priority: 2
- Status: PARTIAL
- The gap: The provenance ledger can record an event, but a tool call is not tied to an agent id, a task id, a model id, an outcome and a trace, so a run cannot be replayed or audited end to end.
- Own repositories on this axis: `Materials-Atlas-Table-Codex---MAT`, `powershell-ops-scripts`, `Veyra`
- Candidate forks: 16

  - `agent-framework` — MIT — may copy
  - `ardupilot` — GPL-3.0 — read for design only
  - `buildkit` — unknown — no licence found
  - `circom` — GPL-3.0 — read for design only
  - `clap` — MIT — may copy
  - `crewAI` — MIT — may copy
  - `depthai-core` — MIT — may copy
  - `electric` — Apache-2.0 — may copy
  - `grafana` — AGPL-3.0 — read for design only
  - `influxdb` — Apache-2.0 — may copy
  - `livekit` — Apache-2.0 — may copy
  - `n8n` — NOASSERTION — check the licence
  - `opentelemetry-collector` — Apache-2.0 — may copy
  - `pipewire` — NOASSERTION — check the licence
  - `playwright` — Apache-2.0 — may copy
  - `PX4-Autopilot` — BSD-3-Clause — may copy

## GAP-OBS-002 — Honest status reporting

- Axis: `observability_audit`
- Priority: 2
- Status: PARTIAL
- The gap: The system can report that it did something without proving that it did. The evidence vocabulary exists in the programme documentation but is not enforced in the code that produces the claims.
- Own repositories on this axis: `Materials-Atlas-Table-Codex---MAT`, `powershell-ops-scripts`, `Veyra`
- Candidate forks: 16

  - `agent-framework` — MIT — may copy
  - `ardupilot` — GPL-3.0 — read for design only
  - `buildkit` — unknown — no licence found
  - `circom` — GPL-3.0 — read for design only
  - `clap` — MIT — may copy
  - `crewAI` — MIT — may copy
  - `depthai-core` — MIT — may copy
  - `electric` — Apache-2.0 — may copy
  - `grafana` — AGPL-3.0 — read for design only
  - `influxdb` — Apache-2.0 — may copy
  - `livekit` — Apache-2.0 — may copy
  - `n8n` — NOASSERTION — check the licence
  - `opentelemetry-collector` — Apache-2.0 — may copy
  - `pipewire` — NOASSERTION — check the licence
  - `playwright` — Apache-2.0 — may copy
  - `PX4-Autopilot` — BSD-3-Clause — may copy

## GAP-TOOL-002 — Tool discovery and capability advertisement

- Axis: `tool_execution`
- Priority: 2
- Status: PARTIAL
- The gap: The capability set is static per agent definition. A worker cannot discover what the platform can currently do.
- Own repositories on this axis: `aetherium`, `Agent-Bridge`, `Genesis`, `Poietek`, `Puppeteer`, `Shell`
- Candidate forks: 30

  - `autogen` — CC-BY-4.0 — check the licence
  - `automerge` — MIT — may copy
  - `bootc` — NOASSERTION — check the licence
  - `buildkit` — unknown — no licence found
  - `code-server` — MIT — may copy
  - `containerd` — Apache-2.0 — may copy
  - `cosign` — Apache-2.0 — may copy
  - `crewAI` — MIT — may copy
  - `crm` — MIT — may copy
  - `emscripten` — NOASSERTION — check the licence
  - `F5-TTS` — MIT — may copy
  - `firecracker` — Apache-2.0 — may copy
  - `gods-eye-view` — NOASSERTION — check the licence
  - `gvisor` — Apache-2.0 — may copy
  - `inspector` — unknown — no licence found
  - `mlc-llm` — Apache-2.0 — may copy
  - `moby` — Apache-2.0 — may copy
  - `monaco-editor` — MIT — may copy
  - `open-webui` — NOASSERTION — check the licence
  - `openvsx` — EPL-2.0 — check the licence
  - `oras` — Apache-2.0 — may copy
  - `pglite` — Apache-2.0 — may copy
  - `playwright` — Apache-2.0 — may copy
  - `servers` — NOASSERTION — check the licence
  - `SkillSpector` — Apache-2.0 — may copy
  - ... and 5 more

## GAP-UI-001 — Direct agent-to-user conversation

- Axis: `interface_presence`
- Priority: 2
- Status: PARTIAL
- The gap: The user can talk to Genesis, but cannot address an individual worker, and there is no conversation to persist and revisit.
- Own repositories on this axis: `aetherial-platform`, `Aetherius-OS`, `Agent-Bridge`, `Devcontainer-setup`, `Electron`, `React`, `React-native`, `Vue`
- Candidate forks: 10

  - `cr-sqlite` — MIT — may copy
  - `git-lfs` — NOASSERTION — check the licence
  - `monaco-editor` — MIT — may copy
  - `opa` — Apache-2.0 — may copy
  - `playwright` — Apache-2.0 — may copy
  - `supercollider` — GPL-3.0 — read for design only
  - `tauri` — Apache-2.0 — may copy
  - `theia` — EPL-2.0 — check the licence
  - `timescaledb` — NOASSERTION — check the licence
  - `vscode` — MIT — may copy

## GAP-BROW-001 — First-party browser and computer control

- Axis: `browser_computer`
- Priority: 3
- Status: MISSING
- The gap: Genesis has no way to see or drive a computer. The browser automation the workspace uses is done by the operator tools, not by Genesis, so an agent that needs a page cannot get one and an agent that needs a screenshot cannot take one.
- Own repositories on this axis: `Puppeteer`
- Candidate forks: 7

  - `autogen` — CC-BY-4.0 — check the licence
  - `code-server` — MIT — may copy
  - `gods-eye-view` — NOASSERTION — check the licence
  - `monaco-editor` — MIT — may copy
  - `playwright` — Apache-2.0 — may copy
  - `servers` — NOASSERTION — check the licence
  - `xterm.js` — MIT — may copy

## GAP-HIVE-004 — Solo versus hive benchmarking

- Axis: `multi_agent`
- Priority: 3
- Status: MISSING
- The gap: There is no way to compare doing the work alone against doing it with a team, so the cost of the hive is never measured.
- Own repositories on this axis: `Aetherius-OS`, `Agent-Bridge`, `Docker`, `Kafka`, `Universal-Bridge`
- Candidate forks: 42

  - `A2A` — Apache-2.0 — may copy
  - `accelerate` — Apache-2.0 — may copy
  - `agent-framework` — MIT — may copy
  - `arrow` — Apache-2.0 — may copy
  - `autogen` — CC-BY-4.0 — check the licence
  - `automerge` — MIT — may copy
  - `browser-use` — MIT — may copy
  - `ceph` — NOASSERTION — check the licence
  - `cockroach` — NOASSERTION — check the licence
  - `crewAI` — MIT — may copy
  - `electric` — Apache-2.0 — may copy
  - `grpc` — Apache-2.0 — may copy
  - `inspector` — unknown — no licence found
  - `IsaacLab` — BSD-3-Clause — may copy
  - `juicefs` — Apache-2.0 — may copy
  - `liblo` — LGPL-2.1 — named files only
  - `livekit` — Apache-2.0 — may copy
  - `nats-server` — Apache-2.0 — may copy
  - `opa` — Apache-2.0 — may copy
  - `OpenHands` — MIT — may copy
  - `opentelemetry-collector` — Apache-2.0 — may copy
  - `openthread` — BSD-3-Clause — may copy
  - `phone-harness` — MIT — may copy
  - `playwright` — Apache-2.0 — may copy
  - `protobuf` — NOASSERTION — check the licence
  - ... and 17 more

## GAP-MODEL-003 — Local and offline model support

- Axis: `model_integration`
- Priority: 3
- Status: PARTIAL
- The gap: Local models are reachable through the adapter interface but there is no offline mode, no local-first routing and no degraded behaviour when the network is gone.
- Own repositories on this axis: `Veyra`
- Candidate forks: 35

  - `agent-framework` — MIT — may copy
  - `audiocraft` — MIT — may copy
  - `avex` — MIT — may copy
  - `beans-next` — unknown — no licence found
  - `bioacoustics-model-zoo` — MIT — may copy
  - `BitNet` — MIT — may copy
  - `browser-use` — MIT — may copy
  - `ComfyUI` — GPL-3.0 — read for design only
  - `Depth-Anything-V2` — Apache-2.0 — may copy
  - `diffusers` — Apache-2.0 — may copy
  - `executorch` — NOASSERTION — check the licence
  - `F5-TTS` — MIT — may copy
  - `faster-whisper` — MIT — may copy
  - `ggml` — MIT — may copy
  - `k3s` — Apache-2.0 — may copy
  - `litellm` — NOASSERTION — check the licence
  - `livekit` — Apache-2.0 — may copy
  - `llama.cpp` — MIT — may copy
  - `llama_index` — MIT — may copy
  - `mlc-llm` — Apache-2.0 — may copy
  - `n8n` — NOASSERTION — check the licence
  - `NatureLM-audio` — MIT — may copy
  - `ollama` — MIT — may copy
  - `open-webui` — NOASSERTION — check the licence
  - `peft` — Apache-2.0 — may copy
  - ... and 10 more

## GAP-TOOL-003 — Computer and browser control

- Axis: `tool_execution`
- Priority: 3
- Status: MISSING
- The gap: No computer-use or browser automation capability exists in Genesis. The adapter kind is declared but there is no implementation behind it.
- Own repositories on this axis: `aetherium`, `Agent-Bridge`, `Genesis`, `Poietek`, `Puppeteer`, `Shell`
- Candidate forks: 30

  - `autogen` — CC-BY-4.0 — check the licence
  - `automerge` — MIT — may copy
  - `bootc` — NOASSERTION — check the licence
  - `buildkit` — unknown — no licence found
  - `code-server` — MIT — may copy
  - `containerd` — Apache-2.0 — may copy
  - `cosign` — Apache-2.0 — may copy
  - `crewAI` — MIT — may copy
  - `crm` — MIT — may copy
  - `emscripten` — NOASSERTION — check the licence
  - `F5-TTS` — MIT — may copy
  - `firecracker` — Apache-2.0 — may copy
  - `gods-eye-view` — NOASSERTION — check the licence
  - `gvisor` — Apache-2.0 — may copy
  - `inspector` — unknown — no licence found
  - `mlc-llm` — Apache-2.0 — may copy
  - `moby` — Apache-2.0 — may copy
  - `monaco-editor` — MIT — may copy
  - `open-webui` — NOASSERTION — check the licence
  - `openvsx` — EPL-2.0 — check the licence
  - `oras` — Apache-2.0 — may copy
  - `pglite` — Apache-2.0 — may copy
  - `playwright` — Apache-2.0 — may copy
  - `servers` — NOASSERTION — check the licence
  - `SkillSpector` — Apache-2.0 — may copy
  - ... and 5 more

## GAP-UI-002 — Avatar-first and multi-surface presence

- Axis: `interface_presence`
- Priority: 3
- Status: PARTIAL
- The gap: The organism has a body and an embodiment model, but the user-facing surfaces live in the IDE and the supervisor rather than in Genesis itself.
- Own repositories on this axis: `aetherial-platform`, `Aetherius-OS`, `Agent-Bridge`, `Devcontainer-setup`, `Electron`, `React`, `React-native`, `Vue`
- Candidate forks: 10

  - `cr-sqlite` — MIT — may copy
  - `git-lfs` — NOASSERTION — check the licence
  - `monaco-editor` — MIT — may copy
  - `opa` — Apache-2.0 — may copy
  - `playwright` — Apache-2.0 — may copy
  - `supercollider` — GPL-3.0 — read for design only
  - `tauri` — Apache-2.0 — may copy
  - `theia` — EPL-2.0 — check the licence
  - `timescaledb` — NOASSERTION — check the licence
  - `vscode` — MIT — may copy

