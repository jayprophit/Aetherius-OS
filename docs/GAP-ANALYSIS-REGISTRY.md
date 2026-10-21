# Genesis Gap Analysis — agent platform capability

> Generated from `docs/GAP-ANALYSIS-REGISTRY.yaml`. Do not hand-edit
> this file; edit the YAML and regenerate.

- Source date: 2026-10-20
- Capabilities assessed: **31**
- States: VERIFIED 7 · IMPLEMENTED 4 · PARTIAL 14 · MISSING 6
- Open (missing or partial): **20** (65% of assessed capabilities)

## Next to build

Open capabilities in priority order. Priority 1 is the next real thing.

| Pri | Id | Axis | Capability | What is missing |
|---|---|---|---|---|
| 1 | GAP-TOOL-001 | tool_execution | Tool execution and sandboxing | Tools are declared with grants and a sandbox requirement, and workflows are described, but nothing executes a tool. The runtime prepares a run and sto |
| 2 | GAP-AUTH-002 | permissions_authority | Secret isolation | Key custody and a crypto provider exist and are well tested, but there is no path from a secret to a caller that never shows the model the plaintext. |
| 2 | GAP-FS-001 | workspace_files | Workspace and file management | The agent has a filesystem capability and a path, but no workspace object, no sandboxed root and no read/write path through the kernel. |
| 2 | GAP-FS-002 | workspace_files | Per-agent worktree isolation | Two agents writing at once have no isolation mechanism inside Genesis. The handoff requires one autonomous writer per checkout, and nothing enforces i |
| 2 | GAP-HIVE-003 | multi_agent | Dynamic team formation and roles | Agent definitions are static and registered by hand. Nothing forms a team for a task, sizes it, or retires it when the work is done. |
| 2 | GAP-ID-002 | identity_persistence | Session and conversation continuity | Continuity is modelled but there is no session object a user can resume, and no per-session memory scope. |
| 2 | GAP-KNOW-001 | knowledge_retrieval | Source-linked retrieval | Genesis holds a memory graph but no retrieval over external sources with provenance, so a claim cannot be traced to where it came from. |
| 2 | GAP-LIFE-002 | lifecycle_recovery | Continuous background operation | Triggers and a schedule registry exist, and the organism loop runs, but nothing keeps the work alive when the browser is closed or the machine sleeps, |
| 2 | GAP-LIFE-003 | lifecycle_recovery | Failure domains and circuit breakers | There is no isolated failure domain and no circuit breaker in the Genesis runtime, so one bad tool call can take the whole agent down. |
| 2 | GAP-MEM-001 | memory_context | Working memory and context management | The conscious workspace exists and the memory graph is implemented, but there is no context assembly, no budget, and no eviction policy for what goes  |
| 2 | GAP-MEM-003 | memory_context | Shared knowledge fabric across the hive | There is no mechanism for agents to publish findings to each other with provenance, so every agent re-derives what another already knows. |
| 2 | GAP-OBS-001 | observability_audit | Tool call attribution and replay | The provenance ledger can record an event, but a tool call is not tied to an agent id, a task id, a model id, an outcome and a trace, so a run cannot  |
| 2 | GAP-OBS-002 | observability_audit | Honest status reporting | The system can report that it did something without proving that it did. The evidence vocabulary exists in the programme documentation but is not enfo |
| 2 | GAP-TOOL-002 | tool_execution | Tool discovery and capability advertisement | The capability set is static per agent definition. A worker cannot discover what the platform can currently do. |
| 2 | GAP-UI-001 | interface_presence | Direct agent-to-user conversation | The user can talk to Genesis, but cannot address an individual worker, and there is no conversation to persist and revisit. |
| 3 | GAP-BROW-001 | browser_computer | First-party browser and computer control | Genesis has no way to see or drive a computer. The browser automation the workspace uses is done by the operator tools, not by Genesis, so an agent th |
| 3 | GAP-HIVE-004 | multi_agent | Solo versus hive benchmarking | There is no way to compare doing the work alone against doing it with a team, so the cost of the hive is never measured. |
| 3 | GAP-MODEL-003 | model_integration | Local and offline model support | Local models are reachable through the adapter interface but there is no offline mode, no local-first routing and no degraded behaviour when the netwo |
| 3 | GAP-TOOL-003 | tool_execution | Computer and browser control | No computer-use or browser automation capability exists in Genesis. The adapter kind is declared but there is no implementation behind it. |
| 3 | GAP-UI-002 | interface_presence | Avatar-first and multi-surface presence | The organism has a body and an embodiment model, but the user-facing surfaces live in the IDE and the supervisor rather than in Genesis itself. |

## Coverage by axis

| Axis | Capabilities | Readiness | Verified | Implemented | Partial | Missing | Research | N/A |
|---|---|---|---|---|---|---|---|---|
| model_integration | 3 | 67% | 1 | 1 | 1 | 0 | 0 | 0 |
| tool_execution | 3 | 0% | 0 | 0 | 2 | 1 | 0 | 0 |
| planning | 2 | 100% | 2 | 0 | 0 | 0 | 0 | 0 |
| memory_context | 3 | 33% | 0 | 1 | 1 | 1 | 0 | 0 |
| multi_agent | 4 | 50% | 2 | 0 | 1 | 1 | 0 | 0 |
| identity_persistence | 2 | 50% | 1 | 0 | 1 | 0 | 0 | 0 |
| permissions_authority | 3 | 67% | 0 | 2 | 1 | 0 | 0 | 0 |
| observability_audit | 2 | 0% | 0 | 0 | 2 | 0 | 0 | 0 |
| workspace_files | 2 | 0% | 0 | 0 | 1 | 1 | 0 | 0 |
| browser_computer | 1 | 0% | 0 | 0 | 0 | 1 | 0 | 0 |
| knowledge_retrieval | 1 | 0% | 0 | 0 | 1 | 0 | 0 | 0 |
| lifecycle_recovery | 3 | 33% | 1 | 0 | 1 | 1 | 0 | 0 |
| interface_presence | 2 | 0% | 0 | 0 | 2 | 0 | 0 | 0 |

Readiness is the share of an axis's capabilities that are VERIFIED or
IMPLEMENTED. It is a coverage measure, not a quality judgement.

## Full detail

### model_integration

#### 🟢 GAP-MODEL-002 — Free-first admission and zero-spend guard

- **Status:** VERIFIED (priority 1)
- **Present:** The admission gate decides what may be called and what may be spent. An endpoint whose cost is not known is refused, because a guard that admits what it does not understand is not a guard. A free or local endpoint is admitted without question, and it is the preferred answer for everything. A metered endpoint spends its free allowance before any money is involved. Money is refused unless it is budgeted: spending is off by default, and a caller that turns it on must state how many paid uses are permitted, which the gate enforces as a ceiling rather than an intention. The spend is zero until a paid endpoint is admitted and the budget allows it
- **Missing:** Nothing refuses a paid or unknown endpoint. The policy is described in the handoff and enforced nowhere in the kernel or the runtime.
- **Cross-references:** requirements: REQ-POL-001, REQ-PLATFORM-SERVICES-001, REQ-ADMISSION-FREE-001 · acceptance: AT-07, AT-18 · gap register: B03, B04 · platforms: hermes, opencode · implementation: src/agents/admission.cpp, src/agents/authority.cpp · tests: tests/admission_tests.cpp, tests/authority_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-POL-001=UNIT_TESTED, REQ-PLATFORM-SERVICES-001=SPECIFIED, REQ-ADMISSION-FREE-001=UNIT_TESTED. Source present on disk: src/agents/admission.cpp, src/agents/authority.cpp. Tests present on disk: tests/admission_tests.cpp, tests/authority_tests.cpp.
```

#### 🟡 GAP-MODEL-001 — Multi-provider model routing

- **Status:** IMPLEMENTED (priority 2)
- **Genesis spec area:** 18-IMAGINATION
- **Present:** genesis/agents/platform.hpp declares AdapterKind::model and a ModelRouter alias over AdapterRegistry, with declaration, observation and qualification as separate evidence-bearing transitions.
- **Missing:** The agent platform has an adapter registry and a model route field, but no provider registry that answers 'which model should run this task' from measured capability rather than from a static configuration.
- **Cross-references:** requirements: REQ-MODEL-001, REQ-MODAL-001, REQ-ADAPT-001 · acceptance: AT-12, AT-13 · gap register: B05, B06 · platforms: claude, chatgpt, gemini, qwen, kimi · implementation: src/perception/pipeline.cpp · tests: tests/memory_cognition_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-MODEL-001=SCAFFOLDED, REQ-MODAL-001=DISCOVERED, REQ-ADAPT-001=BENCHMARKED. Source present on disk: src/perception/pipeline.cpp. Tests present on disk: tests/memory_cognition_tests.cpp.
```

#### 🟠 GAP-MODEL-003 — Local and offline model support

- **Status:** PARTIAL (priority 3)
- **Present:** The adapter registry distinguishes a declared adapter from an observed one, so a local endpoint can be registered and qualified.
- **Missing:** Local models are reachable through the adapter interface but there is no offline mode, no local-first routing and no degraded behaviour when the network is gone.
- **Cross-references:** requirements: REQ-ADAPT-001, REQ-PLATFORM-SERVICES-001 · acceptance: AT-05 · gap register: C04 · platforms: hermes, opencode, antigravity · implementation: src/perception/pipeline.cpp · tests: tests/memory_cognition_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-ADAPT-001=BENCHMARKED, REQ-PLATFORM-SERVICES-001=SPECIFIED. Source present on disk: src/perception/pipeline.cpp. Tests present on disk: tests/memory_cognition_tests.cpp.
```

### tool_execution

#### 🟠 GAP-TOOL-001 — Tool execution and sandboxing

- **Status:** PARTIAL (priority 1)
- **Present:** genesis/agents/platform.hpp defines ToolGrant with allowed actions and network and filesystem write permissions, ResourceLimits, and AgentRuntime::prepare which performs a static preflight and returns a pending-approval record.
- **Missing:** Tools are declared with grants and a sandbox requirement, and workflows are described, but nothing executes a tool. The runtime prepares a run and stops at the approval gate.
- **Cross-references:** requirements: REQ-AGENT-PLATFORM-001, REQ-AGENT-PLATFORM-PERSIST-001 · acceptance: AT-02, AT-09 · gap register: F05 · platforms: claude_code, opencode, hermes, copilot, manus · implementation: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp · tests: tests/agent_platform_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-AGENT-PLATFORM-001=UNIT_TESTED, REQ-AGENT-PLATFORM-PERSIST-001=UNIT_TESTED. Source present on disk: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp. Tests present on disk: tests/agent_platform_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp.
```

#### 🟠 GAP-TOOL-002 — Tool discovery and capability advertisement

- **Status:** PARTIAL (priority 2)
- **Present:** AgentDefinition carries a model route and a list of tool grants, and the adapter registry tracks per-adapter capabilities.
- **Missing:** The capability set is static per agent definition. A worker cannot discover what the platform can currently do.
- **Cross-references:** requirements: REQ-CAP-001, REQ-AGENT-PLATFORM-001 · acceptance: AT-01, AT-11 · gap register: D01 · platforms: claude_code, opencode, copilot, gemini · implementation: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp · tests: tests/agent_platform_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-CAP-001=SCAFFOLDED, REQ-AGENT-PLATFORM-001=UNIT_TESTED. Source present on disk: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp. Tests present on disk: tests/agent_platform_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp.
```

#### 🔴 GAP-TOOL-003 — Computer and browser control

- **Status:** MISSING (priority 3)
- **Present:** AdapterKind includes browser, and the platform models an adapter that could be a browser, but no such adapter is implemented or tested.
- **Missing:** No computer-use or browser automation capability exists in Genesis. The adapter kind is declared but there is no implementation behind it.
- **Cross-references:** requirements: REQ-MODAL-001, REQ-ADAPT-001 · acceptance: AT-10 · gap register: C05 · platforms: manus, antigravity, chatgpt, opencode · implementation: src/perception/pipeline.cpp · tests: tests/memory_cognition_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-MODAL-001=DISCOVERED, REQ-ADAPT-001=BENCHMARKED. Source present on disk: src/perception/pipeline.cpp. Tests present on disk: tests/memory_cognition_tests.cpp.
```

### planning

#### 🟢 GAP-PLAN-001 — Task decomposition and planning

- **Status:** VERIFIED (priority 1)
- **Present:** The planner turns an objective into a plan whose steps carry their dependencies, so the steps that may run now are computed rather than guessed. A plan that cannot be executed is refused: a dependency on a step that does not exist, a dependency on itself and a dependency cycle are all refused, because a plan that waits for ever is worse than no plan. When a step fails, the steps that depended on it are held and the objective is decomposed again with the reason, so the work continues rather than restarting. The organism loop borrows the planner and records the plan it produced, so its plan stage is executed rather than marked missing
- **Missing:** Workflows are flat ordered steps with one tool call each. There is no decomposition, no dependency graph, no re-planning when a step fails, and the organism loop is missing its plan stage entirely.
- **Cross-references:** requirements: REQ-DEV-001, REQ-COG-PREDICT-001, REQ-ORGAN-001, REQ-PLAN-DECOMPOSE-001 · acceptance: AT-01, AT-15 · gap register: D03 · platforms: claude_code, chatgpt, opencode, manus · implementation: src/agents/planner.cpp, src/development/maturity.cpp, src/memory/graph.cpp, src/organism/anatomy.cpp, src/organism/loop.cpp · tests: tests/genesis_tests.cpp, tests/memory_cognition_tests.cpp, tests/organism_loop_tests.cpp, tests/organism_tests.cpp, tests/planner_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-DEV-001=UNIT_TESTED, REQ-COG-PREDICT-001=UNIT_TESTED, REQ-ORGAN-001=UNIT_TESTED, REQ-PLAN-DECOMPOSE-001=UNIT_TESTED. Source present on disk: src/agents/planner.cpp, src/development/maturity.cpp, src/memory/graph.cpp, src/organism/anatomy.cpp, src/organism/loop.cpp. Tests present on disk: tests/genesis_tests.cpp, tests/memory_cognition_tests.cpp, tests/organism_loop_tests.cpp, tests/organism_tests.cpp, tests/planner_tests.cpp.
```

#### 🟢 GAP-PLAN-002 — Durable task state, checkpoints and resume

- **Status:** VERIFIED (priority 1)
- **Present:** The durable task registry records work that outlives the process. Every task carries an idempotency key, so submitting the same work twice returns the same task and the work is done once. A worker holds a bounded lease, so a second worker cannot take a task that is still live, and a worker that dies does not hold it for ever. A checkpoint records the progress, opaque to the registry, which stores it and hands it back without pretending to understand it. The record carries a checksum, so a tampered one is refused rather than mistaken for an empty registry, which would silently forget every task that was owed.
- **Missing:** A durable task registry, with a checkpoint, a lease and a resume, so a job can survive a restart or a crash.
- **Cross-references:** requirements: REQ-PROV-001, REQ-LIFE-RECORD-001, REQ-RUN-001, REQ-TASK-DURABLE-001 · acceptance: AT-05, AT-06, AT-16 · gap register: C02, C03, C06 · platforms: claude_code, opencode, manus, chatgpt · implementation: src/agents/tasks.cpp, src/identity/life_record.cpp, src/provenance/ledger.cpp, src/runtime/runtime.cpp · tests: tests/genesis_tests.cpp, tests/life_record_tests.cpp, tests/runtime_tests.cpp, tests/task_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-PROV-001=BENCHMARKED, REQ-LIFE-RECORD-001=BENCHMARKED, REQ-RUN-001=BENCHMARKED, REQ-TASK-DURABLE-001=UNIT_TESTED. Source present on disk: src/agents/tasks.cpp, src/identity/life_record.cpp, src/provenance/ledger.cpp, src/runtime/runtime.cpp. Tests present on disk: tests/genesis_tests.cpp, tests/life_record_tests.cpp, tests/runtime_tests.cpp, tests/task_tests.cpp.
```

### memory_context

#### 🟠 GAP-MEM-001 — Working memory and context management

- **Status:** PARTIAL (priority 2)
- **Present:** genesis/cognition/workspace.cpp implements the conscious workspace and genesis/memory/graph.cpp the memory graph, both with persistence.
- **Missing:** The conscious workspace exists and the memory graph is implemented, but there is no context assembly, no budget, and no eviction policy for what goes into a model's window.
- **Cross-references:** requirements: REQ-COG-001, REQ-MEM-001, REQ-MEM-INDEX-001 · acceptance: AT-01, AT-13 · gap register: B07, D02 · platforms: claude_code, chatgpt, opencode · implementation: src/cognition/workspace.cpp, src/memory/graph.cpp · tests: tests/memory_cognition_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-COG-001=UNIT_TESTED, REQ-MEM-001=BENCHMARKED, REQ-MEM-INDEX-001=BENCHMARKED. Source present on disk: src/cognition/workspace.cpp, src/memory/graph.cpp. Tests present on disk: tests/memory_cognition_tests.cpp.
```

#### 🔴 GAP-MEM-003 — Shared knowledge fabric across the hive

- **Status:** MISSING (priority 2)
- **Present:** The provenance ledger records what happened and the knowledge registry in Aetherius-OS holds sources, but Genesis cannot publish into it.
- **Missing:** There is no mechanism for agents to publish findings to each other with provenance, so every agent re-derives what another already knows.
- **Cross-references:** requirements: REQ-PROV-001, REQ-RESEARCH-001, REQ-SHARED-DOMAIN-001 · acceptance: AT-04 · gap register: D06 · platforms: hermes, opencode, claude_code · implementation: docs/specifications/TECHNOLOGY_MINING_INGEST.md, src/provenance/ledger.cpp · tests: tests/genesis_tests.cpp, tests/research_registry_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-PROV-001=BENCHMARKED, REQ-RESEARCH-001=UNIT_TESTED, REQ-SHARED-DOMAIN-001=SCAFFOLDED. Source present on disk: docs/specifications/TECHNOLOGY_MINING_INGEST.md, src/provenance/ledger.cpp. Tests present on disk: tests/genesis_tests.cpp, tests/research_registry_tests.cpp.
```

#### 🟡 GAP-MEM-002 — Long-term and cross-session memory

- **Status:** IMPLEMENTED (priority 3)
- **Present:** genesis/memory/graph.cpp, genesis/memory/persistence.cpp and genesis/learning/consolidation.cpp implement the graph, its persistence and consolidation, each with a test.
- **Missing:** Memory is implemented and persisted, but the consolidation and forgetting policies are not proven to resist catastrophic forgetting.
- **Cross-references:** requirements: REQ-MEM-001, REQ-LRN-CONSOLIDATE-001, REQ-MEM-PERSIST-001 · acceptance: AT-13, AT-16 · gap register: D02 · platforms: chatgpt, claude, mem0 · implementation: src/learning/consolidation.cpp, src/memory/graph.cpp, src/memory/persistence.cpp · tests: tests/learning_tests.cpp, tests/memory_cognition_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-MEM-001=BENCHMARKED, REQ-LRN-CONSOLIDATE-001=UNIT_TESTED, REQ-MEM-PERSIST-001=BENCHMARKED. Source present on disk: src/learning/consolidation.cpp, src/memory/graph.cpp, src/memory/persistence.cpp. Tests present on disk: tests/learning_tests.cpp, tests/memory_cognition_tests.cpp.
```

### multi_agent

#### 🟢 GAP-HIVE-001 — Delegation with narrowing scope

- **Status:** VERIFIED (priority 1)
- **Present:** The hive issues a child a scope that is within its parent's, through the authority engine, so the rule that a delegated grant may only narrow is the rule that already governs grants rather than a second one. A child cannot hold a capability, an action, a network or filesystem permission, or a lifetime that its parent lacks, and a chain of delegations can only subtract: the second level of a chain cannot reach the first level's wider scope. The tests prove each of those.
- **Missing:** A delegation primitive that issues a scoped grant to a child agent, checks that the child cannot widen it, and proves it.
- **Cross-references:** requirements: REQ-AGENT-PLATFORM-001, REQ-POL-001, REQ-CAP-001 · acceptance: AT-03, AT-17 · gap register: D04, F04 · platforms: hermes, opencode, claude_code, chatgpt · implementation: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/authority.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp · tests: tests/agent_platform_tests.cpp, tests/authority_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-AGENT-PLATFORM-001=UNIT_TESTED, REQ-POL-001=UNIT_TESTED, REQ-CAP-001=SCAFFOLDED. Source present on disk: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/authority.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp. Tests present on disk: tests/agent_platform_tests.cpp, tests/authority_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp.
```

#### 🟢 GAP-HIVE-002 — Hive communication and messaging

- **Status:** VERIFIED (priority 1)
- **Present:** The hive carries a typed message between agents, with a sender, a recipient, the capability the message exercises and the action within it. A message is authorised before it is sent: the sender must hold a live grant permitting the action, and a message from an agent that holds nothing, or that exercises an action its grant does not permit, is refused and is neither delivered nor recorded. Messages are delivered in order, a broadcast reaches every agent but the sender, and the hive keeps the record of what was said.
- **Missing:** A message type, a transport, and a record of who said what to whom.
- **Cross-references:** requirements: REQ-PROV-001, REQ-PROTO-001, REQ-POL-001, REQ-AGENT-PLATFORM-001 · acceptance: AT-04, AT-11 · gap register: E01, D06 · platforms: hermes, opencode, claude_code, manus · implementation: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/authority.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp, src/provenance/ledger.cpp · tests: tests/agent_platform_tests.cpp, tests/authority_tests.cpp, tests/genesis_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-PROV-001=BENCHMARKED, REQ-PROTO-001=SCAFFOLDED, REQ-POL-001=UNIT_TESTED, REQ-AGENT-PLATFORM-001=UNIT_TESTED. Source present on disk: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/authority.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp, src/provenance/ledger.cpp. Tests present on disk: tests/agent_platform_tests.cpp, tests/authority_tests.cpp, tests/genesis_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp.
```

#### 🟠 GAP-HIVE-003 — Dynamic team formation and roles

- **Status:** PARTIAL (priority 2)
- **Present:** AgentRegistry holds definitions with a role, a purpose, grants and limits, and the agent platform test covers registration and lookup.
- **Missing:** Agent definitions are static and registered by hand. Nothing forms a team for a task, sizes it, or retires it when the work is done.
- **Cross-references:** requirements: REQ-AGENT-PLATFORM-001, REQ-SPECIALIST-COGNITION-001 · acceptance: AT-02, AT-15 · gap register: D05 · platforms: hermes, manus, opencode · implementation: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp · tests: tests/agent_platform_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-AGENT-PLATFORM-001=UNIT_TESTED, REQ-SPECIALIST-COGNITION-001=SPECIFIED. Source present on disk: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp. Tests present on disk: tests/agent_platform_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp.
```

#### 🔴 GAP-HIVE-004 — Solo versus hive benchmarking

- **Status:** MISSING (priority 3)
- **Present:** The benchmarks directory holds per-subsystem benchmarks, none of which compare a solo run against a delegated one.
- **Missing:** There is no way to compare doing the work alone against doing it with a team, so the cost of the hive is never measured.
- **Cross-references:** requirements: REQ-COMPLETION-001 · acceptance: AT-15 · gap register: D08 · platforms: claude_code, hermes · implementation: tools/report_program_completion.ps1
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-COMPLETION-001=COMPILED. Source present on disk: tools/report_program_completion.ps1.
```

### identity_persistence

#### 🟠 GAP-ID-002 — Session and conversation continuity

- **Status:** PARTIAL (priority 2)
- **Present:** genesis/cognition/continuity.cpp and its persistence implement continuity state, and the agent platform models a session concept indirectly.
- **Missing:** Continuity is modelled but there is no session object a user can resume, and no per-session memory scope.
- **Cross-references:** requirements: REQ-SELF-CONTINUITY-001, REQ-LIFE-RECORD-001 · acceptance: AT-11, AT-13 · gap register: D02 · platforms: chatgpt, claude, opencode · implementation: src/cognition/continuity.cpp, src/identity/life_record.cpp · tests: tests/life_record_tests.cpp, tests/memory_cognition_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-SELF-CONTINUITY-001=BENCHMARKED, REQ-LIFE-RECORD-001=BENCHMARKED. Source present on disk: src/cognition/continuity.cpp, src/identity/life_record.cpp. Tests present on disk: tests/life_record_tests.cpp, tests/memory_cognition_tests.cpp.
```

#### 🟢 GAP-ID-001 — Persistent identity independent of the model

- **Status:** VERIFIED (priority 3)
- **Present:** The identity module implements an entity registry, genesis identity, life records and lineage, each with its own test executable and a persisted form.
- **Missing:** The identity itself is proven, but it is not yet bound to the agent platform's authorisation path: a verified identity does not yet grant a scoped capability, so the kernel cannot check who is asking.
- **Cross-references:** requirements: REQ-ID-001, REQ-ENTITY-ADDRESS-001, REQ-LIN-001 · acceptance: AT-13, AT-16 · gap register: A04 · platforms: chatgpt, claude, hermes · implementation: src/identity/entity_registry.cpp, src/identity/lineage.cpp · tests: tests/genesis_tests.cpp, tests/identity_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-ID-001=UNIT_TESTED, REQ-ENTITY-ADDRESS-001=BENCHMARKED, REQ-LIN-001=UNIT_TESTED. Source present on disk: src/identity/entity_registry.cpp, src/identity/lineage.cpp. Tests present on disk: tests/genesis_tests.cpp, tests/identity_tests.cpp.
```

### permissions_authority

#### 🟡 GAP-AUTH-001 — Capability-scoped authority

- **Status:** IMPLEMENTED (priority 1)
- **Present:** genesis/agents/authority.hpp and src/agents/authority.cpp implement the evaluation: AuthorityRegistry, CapabilityRequest, AuthorityGrant, and a decision for every outcome. A delegated grant can only narrow - it may not hold a capability the parent lacks, an action the parent does not permit, a broader network or filesystem permission, or a longer lifetime. tests/authority_tests.cpp covers thirty cases including the delegation chain, and REQ-POL-001 moves from specified to unit tested.
- **Missing:** The authority engine now evaluates a grant: default deny, one capability per grant, only the listed actions, and an expired grant refused. What is still missing is the binding of that engine to the tool execution path, so a tool call does not yet consult it before it runs.
- **Cross-references:** requirements: REQ-POL-001, REQ-KEY-PREFLIGHT-001, REQ-CAP-001 · acceptance: AT-09, AT-17 · gap register: F04, F03 · platforms: claude_code, opencode, hermes, copilot · implementation: src/agents/authority.cpp, src/security/key_custody.cpp · tests: tests/authority_tests.cpp, tests/key_custody_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-POL-001=UNIT_TESTED, REQ-KEY-PREFLIGHT-001=UNIT_TESTED, REQ-CAP-001=SCAFFOLDED. Source present on disk: src/agents/authority.cpp, src/security/key_custody.cpp. Tests present on disk: tests/authority_tests.cpp, tests/key_custody_tests.cpp.
```

#### 🟠 GAP-AUTH-002 — Secret isolation

- **Status:** PARTIAL (priority 2)
- **Present:** genesis/security/key_custody.cpp, crypto_provider.cpp and provider_open_observation.cpp implement custody, provider selection and observation of what a provider exposes, each with a test.
- **Missing:** Key custody and a crypto provider exist and are well tested, but there is no path from a secret to a caller that never shows the model the plaintext.
- **Cross-references:** requirements: REQ-KEY-CUSTODY-001, REQ-CRYPTO-PROVIDER-001, REQ-KEY-PREFLIGHT-001 · acceptance: AT-09 · gap register: F03 · platforms: claude_code, opencode, hermes · implementation: src/security/crypto_provider.cpp, src/security/key_custody.cpp · tests: tests/key_custody_tests.cpp, tests/security_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-KEY-CUSTODY-001=BENCHMARKED, REQ-CRYPTO-PROVIDER-001=BENCHMARKED, REQ-KEY-PREFLIGHT-001=UNIT_TESTED. Source present on disk: src/security/crypto_provider.cpp, src/security/key_custody.cpp. Tests present on disk: tests/key_custody_tests.cpp, tests/security_tests.cpp.
```

#### 🟡 GAP-AUTH-003 — Default-deny and approval gates

- **Status:** IMPLEMENTED (priority 2)
- **Present:** ApprovalMode distinguishes never, risky_actions and always, and AgentRuntime::prepare returns a pending-approval run record that a caller must resolve before anything executes.
- **Missing:** The gate exists and the policy contract is specified, but the deny-by-default policy decision contract is only specified: nothing evaluates a capability request against a grant, so the gate cannot yet be exercised by a real caller.
- **Cross-references:** requirements: REQ-POL-001, REQ-KEY-PREFLIGHT-001 · acceptance: AT-17 · gap register: F04 · platforms: claude_code, opencode, hermes · implementation: src/agents/authority.cpp, src/security/key_custody.cpp · tests: tests/authority_tests.cpp, tests/key_custody_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-POL-001=UNIT_TESTED, REQ-KEY-PREFLIGHT-001=UNIT_TESTED. Source present on disk: src/agents/authority.cpp, src/security/key_custody.cpp. Tests present on disk: tests/authority_tests.cpp, tests/key_custody_tests.cpp.
```

### observability_audit

#### 🟠 GAP-OBS-001 — Tool call attribution and replay

- **Status:** PARTIAL (priority 2)
- **Present:** genesis/provenance/ledger.cpp records provenance entries, and the requirements registry and the platform module record identifiers for agents and runs.
- **Missing:** The provenance ledger can record an event, but a tool call is not tied to an agent id, a task id, a model id, an outcome and a trace, so a run cannot be replayed or audited end to end.
- **Cross-references:** requirements: REQ-PROV-001, REQ-EVAL-001, REQ-AGENT-PLATFORM-001 · acceptance: AT-19 · gap register: G01, G02 · platforms: claude_code, opencode, hermes, copilot · implementation: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, registry/requirements.tsv, src/agents/admission.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp, src/provenance/ledger.cpp · tests: tests/agent_platform_tests.cpp, tests/genesis_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-PROV-001=BENCHMARKED, REQ-EVAL-001=UNIT_TESTED, REQ-AGENT-PLATFORM-001=UNIT_TESTED. Source present on disk: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, registry/requirements.tsv, src/agents/admission.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp, src/provenance/ledger.cpp. Tests present on disk: tests/agent_platform_tests.cpp, tests/genesis_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp.
```

#### 🟠 GAP-OBS-002 — Honest status reporting

- **Status:** PARTIAL (priority 2)
- **Present:** The requirement registry carries a status, an evidence field and a last-verified date for every requirement, and the completion report records a percentage per component.
- **Missing:** The system can report that it did something without proving that it did. The evidence vocabulary exists in the programme documentation but is not enforced in the code that produces the claims.
- **Cross-references:** requirements: REQ-EVAL-001, REQ-PROV-001, REQ-COMPLETION-001 · acceptance: AT-19 · gap register: G01, G02 · platforms: chatgpt, claude_code · implementation: registry/requirements.tsv, src/provenance/ledger.cpp, tools/report_program_completion.ps1 · tests: tests/genesis_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-EVAL-001=UNIT_TESTED, REQ-PROV-001=BENCHMARKED, REQ-COMPLETION-001=COMPILED. Source present on disk: registry/requirements.tsv, src/provenance/ledger.cpp, tools/report_program_completion.ps1. Tests present on disk: tests/genesis_tests.cpp.
```

### workspace_files

#### 🟠 GAP-FS-001 — Workspace and file management

- **Status:** PARTIAL (priority 2)
- **Present:** ToolGrant grants filesystem write permission and a tool id; the ledger integration and storage provider in Aetherius-OS hold the durable side.
- **Missing:** The agent has a filesystem capability and a path, but no workspace object, no sandboxed root and no read/write path through the kernel.
- **Cross-references:** requirements: REQ-LIFE-RECORD-PERSIST-001, REQ-INGEST-PIPELINE-001, REQ-DATA-SOVEREIGNTY-001 · acceptance: AT-10, AT-12 · gap register: F05 · platforms: claude_code, opencode, cursor, antigravity · tests: tests/life_record_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-LIFE-RECORD-PERSIST-001=BENCHMARKED, REQ-INGEST-PIPELINE-001=SPECIFIED, REQ-DATA-SOVEREIGNTY-001=SPECIFIED. Tests present on disk: tests/life_record_tests.cpp.
```

#### 🔴 GAP-FS-002 — Per-agent worktree isolation

- **Status:** MISSING (priority 2)
- **Present:** The agent platform models a workspace concept only as a path string on the definition.
- **Missing:** Two agents writing at once have no isolation mechanism inside Genesis. The handoff requires one autonomous writer per checkout, and nothing enforces it.
- **Cross-references:** requirements: REQ-AGENT-PLATFORM-001, REQ-POL-001 · acceptance: AT-03 · gap register: F04 · platforms: claude_code, opencode, hermes · implementation: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/authority.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp · tests: tests/agent_platform_tests.cpp, tests/authority_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-AGENT-PLATFORM-001=UNIT_TESTED, REQ-POL-001=UNIT_TESTED. Source present on disk: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/authority.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp. Tests present on disk: tests/agent_platform_tests.cpp, tests/authority_tests.cpp, tests/hive_tests.cpp, tests/task_tests.cpp.
```

### browser_computer

#### 🔴 GAP-BROW-001 — First-party browser and computer control

- **Status:** MISSING (priority 3)
- **Present:** The adapter kinds and the platform service contracts anticipate a browser or device capability, and Aetherius-OS holds a supervisor UI, but no computer-control capability is implemented in Genesis.
- **Missing:** Genesis has no way to see or drive a computer. The browser automation the workspace uses is done by the operator tools, not by Genesis, so an agent that needs a page cannot get one and an agent that needs a screenshot cannot take one.
- **Cross-references:** requirements: REQ-MODAL-001, REQ-PLATFORM-SERVICES-001, REQ-UI-SHELL-001 · acceptance: AT-10 · gap register: C05 · platforms: manus, chatgpt, antigravity, opencode
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-MODAL-001=DISCOVERED, REQ-PLATFORM-SERVICES-001=SPECIFIED, REQ-UI-SHELL-001=SPECIFIED.
```

### knowledge_retrieval

#### 🟠 GAP-KNOW-001 — Source-linked retrieval

- **Status:** PARTIAL (priority 2)
- **Present:** The memory graph, its origin module and the provenance ledger record where things came from, and the research registry classifies research items and dead ends.
- **Missing:** Genesis holds a memory graph but no retrieval over external sources with provenance, so a claim cannot be traced to where it came from.
- **Cross-references:** requirements: REQ-RESEARCH-001, REQ-CORPUS-001, REQ-PROV-001 · acceptance: AT-04, AT-19 · gap register: D06, G04 · platforms: chatgpt, perplexity, gemini · implementation: provenance/SOURCE_MANIFEST.tsv, src/provenance/ledger.cpp · tests: tests/genesis_tests.cpp, tests/research_registry_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-RESEARCH-001=UNIT_TESTED, REQ-CORPUS-001=UNIT_TESTED, REQ-PROV-001=BENCHMARKED. Source present on disk: provenance/SOURCE_MANIFEST.tsv, src/provenance/ledger.cpp. Tests present on disk: tests/genesis_tests.cpp, tests/research_registry_tests.cpp.
```

### lifecycle_recovery

#### 🟢 GAP-LIFE-001 — Crash recovery and checkpoint resume

- **Status:** VERIFIED (priority 1)
- **Present:** A crash does not lose the work. A task whose worker dies has its lease expire, and an expired lease is recoverable, so the task is picked up again. Resuming it keeps the checkpoint, so the work continues from where it stopped rather than from the beginning, and the attempt count says how many times it has been tried. The idempotency key means the resumed task is not submitted as new work. The tests cover the whole crash, from the checkpoint to the completion, with the registry written and read back in between.
- **Missing:** A crash that loses the work, with no checkpoint, no idempotency key and no recovery.
- **Cross-references:** requirements: REQ-PROV-001, REQ-LIFE-RECORD-PERSIST-001, REQ-RUN-001, REQ-TASK-DURABLE-001 · acceptance: AT-06, AT-16 · gap register: C03, C02 · platforms: claude_code, opencode, manus, chatgpt · implementation: src/agents/tasks.cpp, src/provenance/ledger.cpp, src/runtime/runtime.cpp · tests: tests/genesis_tests.cpp, tests/life_record_tests.cpp, tests/runtime_tests.cpp, tests/task_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-PROV-001=BENCHMARKED, REQ-LIFE-RECORD-PERSIST-001=BENCHMARKED, REQ-RUN-001=BENCHMARKED, REQ-TASK-DURABLE-001=UNIT_TESTED. Source present on disk: src/agents/tasks.cpp, src/provenance/ledger.cpp, src/runtime/runtime.cpp. Tests present on disk: tests/genesis_tests.cpp, tests/life_record_tests.cpp, tests/runtime_tests.cpp, tests/task_tests.cpp.
```

#### 🟠 GAP-LIFE-002 — Continuous background operation

- **Status:** PARTIAL (priority 2)
- **Present:** TriggerRegistry models manual, schedule and event triggers, and the organism loop implements the stages that keep work moving while the process lives.
- **Missing:** Triggers and a schedule registry exist, and the organism loop runs, but nothing keeps the work alive when the browser is closed or the machine sleeps, and no task checkpoint and resumes.
- **Cross-references:** requirements: REQ-RUN-001, REQ-EVT-001, REQ-SVC-001 · acceptance: AT-05 · gap register: C01, C04 · platforms: hermes, manus, opencode · implementation: src/runtime/runtime.cpp · tests: tests/runtime_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-RUN-001=BENCHMARKED, REQ-EVT-001=BENCHMARKED, REQ-SVC-001=BENCHMARKED. Source present on disk: src/runtime/runtime.cpp. Tests present on disk: tests/runtime_tests.cpp.
```

#### 🔴 GAP-LIFE-003 — Failure domains and circuit breakers

- **Status:** MISSING (priority 2)
- **Present:** The runtime has an exception and event model, and the platform reports a failed run, but a failure is not contained.
- **Missing:** There is no isolated failure domain and no circuit breaker in the Genesis runtime, so one bad tool call can take the whole agent down.
- **Cross-references:** requirements: REQ-RUN-001, REQ-EVT-001, REQ-SVC-001 · acceptance: AT-06, AT-17 · gap register: C03, G03 · platforms: hermes, opencode, kimi · implementation: src/runtime/runtime.cpp · tests: tests/runtime_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-RUN-001=BENCHMARKED, REQ-EVT-001=BENCHMARKED, REQ-SVC-001=BENCHMARKED. Source present on disk: src/runtime/runtime.cpp. Tests present on disk: tests/runtime_tests.cpp.
```

### interface_presence

#### 🟠 GAP-UI-001 — Direct agent-to-user conversation

- **Status:** PARTIAL (priority 2)
- **Present:** The agent platform models a communication endpoint per agent and the continuity module holds state across sessions.
- **Missing:** The user can talk to Genesis, but cannot address an individual worker, and there is no conversation to persist and revisit.
- **Cross-references:** requirements: REQ-SELF-CONTINUITY-001, REQ-UI-SHELL-001, REQ-AGENT-PLATFORM-001 · acceptance: AT-11 · gap register: D08 · platforms: chatgpt, claude, manus, hermes · implementation: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp, src/cognition/continuity.cpp · tests: tests/agent_platform_tests.cpp, tests/hive_tests.cpp, tests/memory_cognition_tests.cpp, tests/task_tests.cpp
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-SELF-CONTINUITY-001=BENCHMARKED, REQ-UI-SHELL-001=SPECIFIED, REQ-AGENT-PLATFORM-001=UNIT_TESTED. Source present on disk: include/genesis/agents/admission.hpp, include/genesis/agents/hive.hpp, include/genesis/agents/planner.hpp, include/genesis/agents/tasks.hpp, src/agents/admission.cpp, src/agents/hive.cpp, src/agents/planner.cpp, src/agents/platform.cpp, src/agents/tasks.cpp, src/cognition/continuity.cpp. Tests present on disk: tests/agent_platform_tests.cpp, tests/hive_tests.cpp, tests/memory_cognition_tests.cpp, tests/task_tests.cpp.
```

#### 🟠 GAP-UI-002 — Avatar-first and multi-surface presence

- **Status:** PARTIAL (priority 3)
- **Present:** The embodiment and organism modules model the body, and the IDE carries the supervisor UI that renders it.
- **Missing:** The organism has a body and an embodiment model, but the user-facing surfaces live in the IDE and the supervisor rather than in Genesis itself.
- **Cross-references:** requirements: REQ-UI-SHELL-001, REQ-DUAL-ANATOMY-ATLAS-001, REQ-ACCESSIBILITY-001 · acceptance: AT-11, AT-12 · gap register: A03 · platforms: chatgpt, antigravity, manus
- **Provenance:** gap analysis 2026-10-20, against Genesis registries and the master handoff

```
Genesis requirement registry status: REQ-UI-SHELL-001=SPECIFIED, REQ-DUAL-ANATOMY-ATLAS-001=SPECIFIED, REQ-ACCESSIBILITY-001=SPECIFIED.
```

## Platforms compared

The comparison is against: `manus`, `claude`, `claude_code`, `chatgpt`, `kimi`, `copilot`, `jev`, `qwen`, `hermes`, `opencode`, `antigravity`, `gemini`, `deepseek`, `mem0`, `cursor`, `perplexity`, `mem0ai`.

Platform names are reference ids only. A gap that names a platform
means the owner has evidence that platform provides the capability.

## Axes with no assessed capability

None. Every axis has at least one assessed capability.
