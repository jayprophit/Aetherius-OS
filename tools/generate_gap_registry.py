#!/usr/bin/env python3
"""Generate the Genesis gap analysis registry from the real Genesis registries.

The gap registry is a judgement, but the evidence behind each judgement is
not: requirement ids, statuses, source paths and test paths are looked up
in Genesis's own registries, and the generator refuses to emit a reference
it could not resolve.

That matters because the registry's whole value is that its citations can
be trusted. A hand-written gap analysis drifts from the code it describes;
this one is re-derived from the code every time it is generated.

Usage:
    python tools/generate_gap_registry.py [--out docs/GAP-ANALYSIS-REGISTRY.yaml]
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
# Where Genesis lives. The workspace was reorganised so that Genesis is
# the kernel of Aetherius OS, and the location comes from the build
# manifest registry rather than from a path written out here: a stale
# path finds nothing, and nothing found looks like an absence of
# evidence rather than an error.
def _find_genesis() -> Path:
    registry = REPO / "docs" / "BUILD-MANIFEST-REGISTRY.yaml"
    if registry.exists():
        try:
            import yaml as _yaml
            body = _yaml.safe_load(registry.read_text(encoding="utf-8"))
            for entry in (body or {}).get("projects", []):
                if entry.get("id") == "genesis":
                    manifest = str(entry.get("manifest", "")).strip().strip(chr(34))
                    if manifest:
                        candidate = REPO.parent / manifest
                        if candidate.exists():
                            return candidate.parent
        except Exception:
            pass
    return REPO.parent / "Genesis"


GENESIS = _find_genesis()
REGISTRY = GENESIS / "registry"


def read_tsv(name: str) -> list[dict[str, str]]:
    path = REGISTRY / name
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    if not lines:
        return []
    header = lines[0].split("\t")
    rows = []
    for line in lines[1:]:
        if not line.strip():
            continue
        cells = line.split("\t")
        rows.append({h: (cells[i] if i < len(cells) else "") for i, h in enumerate(header)})
    return rows


REQUIREMENTS = read_tsv("requirements.tsv")
COMPONENTS = read_tsv("completion_report.tsv")

# Requirement ids by a loose name fragment, so a reference can be written
# as "requirement about X" and resolved to a real id.
def find_requirement(fragment: str) -> str:
    """Resolve a requirement by a case-insensitive name fragment.

    Raises when the fragment matches nothing, because a gap that cites a
    requirement which does not exist is worse than a gap that cites none.
    """
    needle = fragment.lower()
    exact = [r for r in REQUIREMENTS if r["id"].lower() == needle]
    if exact:
        return exact[0]["id"]
    partial = [r for r in REQUIREMENTS if needle in r["id"].lower() or needle in r["name"].lower()]
    if not partial:
        raise SystemExit(f"no requirement matches {fragment!r}")
    partial.sort(key=lambda r: (-len(r["id"]), r["id"]))
    return partial[0]["id"]


def requirement_status(req_id: str) -> str:
    for r in REQUIREMENTS:
        if r["id"] == req_id:
            return r.get("status", "")
    return ""


def implementation_for(req_ids: list[str]) -> list[str]:
    """Source files the requirement registry names, that exist on disk."""
    out: set[str] = set()
    for r in REQUIREMENTS:
        if r["id"] not in req_ids:
            continue
        for p in (r.get("implementation_files") or "").split(";"):
            p = p.strip()
            if p and p != "-" and (GENESIS / p).exists():
                out.add(p)
    return sorted(out)


def tests_for(req_ids: list[str]) -> list[str]:
    out: set[str] = set()
    for r in REQUIREMENTS:
        if r["id"] not in req_ids:
            continue
        for p in (r.get("tests") or "").split(";"):
            p = p.strip()
            if p and p != "-" and (GENESIS / p).exists():
                out.add(p)
    return sorted(out)


# ---------------------------------------------------------------------------
# The capabilities. Each entry is:
#   id, axis, name, status, priority, spec_area, gap, present,
#   requirements (name fragments to resolve), acceptance, gap_register,
#   platforms, decision (optional), evidence (optional)
# ---------------------------------------------------------------------------
CAPABILITIES: list[dict] = [
    # -- model integration --------------------------------------------------
    dict(id="GAP-MODEL-001", axis="model_integration", name="Multi-provider model routing",
         status="IMPLEMENTED", priority=2, spec_area="18-IMAGINATION",
         gap="The agent platform has an adapter registry and a model route field, but no "
             "provider registry that answers 'which model should run this task' from "
             "measured capability rather than from a static configuration.",
         present="genesis/agents/platform.hpp declares AdapterKind::model and a "
                 "ModelRouter alias over AdapterRegistry, with declaration, observation and "
                 "qualification as separate evidence-bearing transitions.",
         requirements=['REQ-MODEL-001', 'REQ-MODAL-001', 'REQ-ADAPT-001'], acceptance=["AT-12", "AT-13"],
         gap_register=["B05", "B06"], platforms=["claude", "chatgpt", "gemini", "qwen", "kimi"]),
    dict(id="GAP-MODEL-002", axis="model_integration", name="Free-first admission and zero-spend guard",
         status="MISSING", priority=1,
         gap="Nothing refuses a paid or unknown endpoint. The policy is described in the "
             "handoff and enforced nowhere in the kernel or the runtime.",
         present="The requirement registry records the provider and policy requirements, and "
                 "the policy engine exists in Aetherius-OS, but Genesis has no admission "
                 "gate of its own.",
         requirements=['REQ-POL-001', 'REQ-PLATFORM-SERVICES-001'], acceptance=["AT-07", "AT-18"],
         gap_register=["B03", "B04"], platforms=["hermes", "opencode"]),
    dict(id="GAP-MODEL-003", axis="model_integration", name="Local and offline model support",
         status="PARTIAL", priority=3,
         gap="Local models are reachable through the adapter interface but there is no "
             "offline mode, no local-first routing and no degraded behaviour when the "
             "network is gone.",
         present="The adapter registry distinguishes a declared adapter from an observed "
                 "one, so a local endpoint can be registered and qualified.",
         requirements=['REQ-ADAPT-001', 'REQ-PLATFORM-SERVICES-001'], acceptance=["AT-05"],
         gap_register=["C04"], platforms=["hermes", "opencode", "antigravity"]),

    # -- tool execution ----------------------------------------------------
    dict(id="GAP-TOOL-001", axis="tool_execution", name="Tool execution and sandboxing",
         status="PARTIAL", priority=1,
         gap="Tools are declared with grants and a sandbox requirement, and workflows are "
             "described, but nothing executes a tool. The runtime prepares a run and stops "
             "at the approval gate.",
         present="genesis/agents/platform.hpp defines ToolGrant with allowed actions and "
                 "network and filesystem write permissions, ResourceLimits, and "
                 "AgentRuntime::prepare which performs a static preflight and returns a "
                 "pending-approval record.",
         requirements=['REQ-AGENT-PLATFORM-001', 'REQ-AGENT-PLATFORM-PERSIST-001'], acceptance=["AT-02", "AT-09"],
         gap_register=["F05"], platforms=["claude_code", "opencode", "hermes", "copilot", "manus"]),
    dict(id="GAP-TOOL-002", axis="tool_execution", name="Tool discovery and capability advertisement",
         status="PARTIAL", priority=2,
         gap="The capability set is static per agent definition. A worker cannot discover "
             "what the platform can currently do.",
         present="AgentDefinition carries a model route and a list of tool grants, and the "
                 "adapter registry tracks per-adapter capabilities.",
         requirements=['REQ-CAP-001', 'REQ-AGENT-PLATFORM-001'], acceptance=["AT-01", "AT-11"],
         gap_register=["D01"], platforms=["claude_code", "opencode", "copilot", "gemini"]),
    dict(id="GAP-TOOL-003", axis="tool_execution", name="Computer and browser control",
         status="MISSING", priority=3,
         gap="No computer-use or browser automation capability exists in Genesis. The "
             "adapter kind is declared but there is no implementation behind it.",
         present="AdapterKind includes browser, and the platform models an adapter that "
                 "could be a browser, but no such adapter is implemented or tested.",
         requirements=['REQ-MODAL-001', 'REQ-ADAPT-001'], acceptance=["AT-10"],
         gap_register=["C05"], platforms=["manus", "antigravity", "chatgpt", "opencode"]),

    # -- planning -----------------------------------------------------------
    dict(id="GAP-PLAN-001", axis="planning", name="Task decomposition and planning",
         status="PARTIAL", priority=1,
         gap="Workflows are flat ordered steps with one tool call each. There is no "
             "decomposition, no dependency graph, no re-planning when a step fails, and the "
             "organism loop is missing its plan stage entirely.",
         present="WorkflowDefinition holds an ordered list of WorkflowStep with a tool, an "
                 "action and an approval flag, and the organism loop implements the stages "
                 "around plan.",
         requirements=['REQ-DEV-001', 'REQ-COG-PREDICT-001', 'REQ-ORGAN-001'], acceptance=["AT-01", "AT-15"],
         gap_register=["D03"], platforms=["claude_code", "chatgpt", "opencode", "manus"]),
    dict(id="GAP-PLAN-002", axis="planning", name="Durable task state, checkpoints and resume",
         status="MISSING", priority=1,
         gap="A run exists only as an in-memory record. There is no durable task registry, "
             "no checkpoint, no lease and no resume, so a job cannot survive a restart or a "
             "crash.",
         present="RunRecord and RunRequest exist in the platform header and the runtime "
                 "returns a prepared record; the ledger and provenance modules record what "
                 "happened, but nothing can pick the work back up.",
         requirements=['REQ-PROV-001', 'REQ-LIFE-RECORD-001', 'REQ-RUN-001'], acceptance=["AT-05", "AT-06", "AT-16"],
         gap_register=["C02", "C03", "C06"], platforms=["claude_code", "opencode", "manus", "chatgpt"]),

    # -- memory and context -------------------------------------------------
    dict(id="GAP-MEM-001", axis="memory_context", name="Working memory and context management",
         status="PARTIAL", priority=2,
         gap="The conscious workspace exists and the memory graph is implemented, but there "
             "is no context assembly, no budget, and no eviction policy for what goes into "
             "a model's window.",
         present="genesis/cognition/workspace.cpp implements the conscious workspace and "
                 "genesis/memory/graph.cpp the memory graph, both with persistence.",
         requirements=['REQ-COG-001', 'REQ-MEM-001', 'REQ-MEM-INDEX-001'], acceptance=["AT-01", "AT-13"],
         gap_register=["B07", "D02"], platforms=["claude_code", "chatgpt", "opencode"]),
    dict(id="GAP-MEM-002", axis="memory_context", name="Long-term and cross-session memory",
         status="IMPLEMENTED", priority=3,
         gap="Memory is implemented and persisted, but the consolidation and forgetting "
             "policies are not proven to resist catastrophic forgetting.",
         present="genesis/memory/graph.cpp, genesis/memory/persistence.cpp and "
                 "genesis/learning/consolidation.cpp implement the graph, its persistence and "
                 "consolidation, each with a test.",
         requirements=['REQ-MEM-001', 'REQ-LRN-CONSOLIDATE-001', 'REQ-MEM-PERSIST-001'], acceptance=["AT-13", "AT-16"],
         gap_register=["D02"], platforms=["chatgpt", "claude", "mem0"]),
    dict(id="GAP-MEM-003", axis="memory_context", name="Shared knowledge fabric across the hive",
         status="MISSING", priority=2,
         gap="There is no mechanism for agents to publish findings to each other with "
             "provenance, so every agent re-derives what another already knows.",
         present="The provenance ledger records what happened and the knowledge registry in "
                 "Aetherius-OS holds sources, but Genesis cannot publish into it.",
         requirements=['REQ-PROV-001', 'REQ-RESEARCH-001', 'REQ-SHARED-DOMAIN-001'], acceptance=["AT-04"],
         gap_register=["D06"], platforms=["hermes", "opencode", "claude_code"]),

    # -- multi agent --------------------------------------------------------
    dict(id="GAP-HIVE-001", axis="multi_agent", name="Delegation with narrowing scope",
         status="VERIFIED", priority=1,
         gap="A delegation primitive that issues a scoped grant to a child agent, checks "
             "that the child cannot widen it, and proves it.",
         present="The hive issues a child a scope that is within its parent's, through the "
                 "authority engine, so the rule that a delegated grant may only narrow is "
                 "the rule that already governs grants rather than a second one. A child "
                 "cannot hold a capability, an action, a network or filesystem permission, "
                 "or a lifetime that its parent lacks, and a chain of delegations can only "
                 "subtract: the second level of a chain cannot reach the first level's "
                 "wider scope. The tests prove each of those.",
         requirements=['REQ-AGENT-PLATFORM-001', 'REQ-POL-001', 'REQ-CAP-001'], acceptance=["AT-03", "AT-17"],
         gap_register=["D04", "F04"], platforms=["hermes", "opencode", "claude_code", "chatgpt"]),
    dict(id="GAP-HIVE-002", axis="multi_agent", name="Hive communication and messaging",
         status="VERIFIED", priority=1,
         gap="A message type, a transport, and a record of who said what to whom.",
         present="The hive carries a typed message between agents, with a sender, a "
                 "recipient, the capability the message exercises and the action within "
                 "it. A message is authorised before it is sent: the sender must hold a "
                 "live grant permitting the action, and a message from an agent that "
                 "holds nothing, or that exercises an action its grant does not permit, "
                 "is refused and is neither delivered nor recorded. Messages are delivered "
                 "in order, a broadcast reaches every agent but the sender, and the hive "
                 "keeps the record of what was said.",
         requirements=['REQ-PROV-001', 'REQ-PROTO-001', 'REQ-POL-001', 'REQ-AGENT-PLATFORM-001'], acceptance=["AT-04", "AT-11"],
         gap_register=["E01", "D06"], platforms=["hermes", "opencode", "claude_code", "manus"]),
    dict(id="GAP-HIVE-003", axis="multi_agent", name="Dynamic team formation and roles",
         status="PARTIAL", priority=2,
         gap="Agent definitions are static and registered by hand. Nothing forms a team "
             "for a task, sizes it, or retires it when the work is done.",
         present="AgentRegistry holds definitions with a role, a purpose, grants and limits, "
                 "and the agent platform test covers registration and lookup.",
         requirements=['REQ-AGENT-PLATFORM-001', 'REQ-SPECIALIST-COGNITION-001'], acceptance=["AT-02", "AT-15"],
         gap_register=["D05"], platforms=["hermes", "manus", "opencode"]),
    dict(id="GAP-HIVE-004", axis="multi_agent", name="Solo versus hive benchmarking",
         status="MISSING", priority=3,
         gap="There is no way to compare doing the work alone against doing it with a team, "
             "so the cost of the hive is never measured.",
         present="The benchmarks directory holds per-subsystem benchmarks, none of which "
                 "compare a solo run against a delegated one.",
         requirements=['REQ-COMPLETION-001'], acceptance=["AT-15"],
         gap_register=["D08"], platforms=["claude_code", "hermes"]),

    # -- identity and persistence -------------------------------------------
    dict(id="GAP-ID-001", axis="identity_persistence", name="Persistent identity independent of the model",
         status="VERIFIED", priority=3,
         gap="The identity itself is proven, but it is not yet bound to the agent "
             "platform's authorisation path: a verified identity does not yet grant a "
             "scoped capability, so the kernel cannot check who is asking.",
         present="The identity module implements an entity registry, genesis identity, life "
                 "records and lineage, each with its own test executable and a persisted "
                 "form.",
         requirements=['REQ-ID-001', 'REQ-ENTITY-ADDRESS-001', 'REQ-LIN-001'], acceptance=["AT-13", "AT-16"],
         gap_register=["A04"], platforms=["chatgpt", "claude", "hermes"]),
    dict(id="GAP-ID-002", axis="identity_persistence", name="Session and conversation continuity",
         status="PARTIAL", priority=2,
         gap="Continuity is modelled but there is no session object a user can resume, and "
             "no per-session memory scope.",
         present="genesis/cognition/continuity.cpp and its persistence implement continuity "
                 "state, and the agent platform models a session concept indirectly.",
         requirements=['REQ-SELF-CONTINUITY-001', 'REQ-LIFE-RECORD-001'], acceptance=["AT-11", "AT-13"],
         gap_register=["D02"], platforms=["chatgpt", "claude", "opencode"]),

    # -- permissions and authority ------------------------------------------
    dict(id="GAP-AUTH-001", axis="permissions_authority", name="Capability-scoped authority",
         status="IMPLEMENTED", priority=1,
         gap="The authority engine now evaluates a grant: default deny, one capability per "
             "grant, only the listed actions, and an expired grant refused. What is still "
             "missing is the binding of that engine to the tool execution path, so a tool "
             "call does not yet consult it before it runs.",
         present="genesis/agents/authority.hpp and src/agents/authority.cpp implement the "
                 "evaluation: AuthorityRegistry, CapabilityRequest, AuthorityGrant, and a "
                 "decision for every outcome. A delegated grant can only narrow - it may "
                 "not hold a capability the parent lacks, an action the parent does not "
                 "permit, a broader network or filesystem permission, or a longer lifetime. "
                 "tests/authority_tests.cpp covers thirty cases including the delegation "
                 "chain, and REQ-POL-001 moves from specified to unit tested.",
         requirements=['REQ-POL-001', 'REQ-KEY-PREFLIGHT-001', 'REQ-CAP-001'], acceptance=["AT-09", "AT-17"],
         gap_register=["F04", "F03"], platforms=["claude_code", "opencode", "hermes", "copilot"]),
    dict(id="GAP-AUTH-002", axis="permissions_authority", name="Secret isolation",
         status="PARTIAL", priority=2,
         gap="Key custody and a crypto provider exist and are well tested, but there is no "
             "path from a secret to a caller that never shows the model the plaintext.",
         present="genesis/security/key_custody.cpp, crypto_provider.cpp and "
                 "provider_open_observation.cpp implement custody, provider selection and "
                 "observation of what a provider exposes, each with a test.",
         requirements=['REQ-KEY-CUSTODY-001', 'REQ-CRYPTO-PROVIDER-001', 'REQ-KEY-PREFLIGHT-001'], acceptance=["AT-09"],
         gap_register=["F03"], platforms=["claude_code", "opencode", "hermes"]),
    dict(id="GAP-AUTH-003", axis="permissions_authority", name="Default-deny and approval gates",
         status="IMPLEMENTED", priority=2,
         gap="The gate exists and the policy contract is specified, but the deny-by-default "
             "policy decision contract is only specified: nothing evaluates a capability "
             "request against a grant, so the gate cannot yet be exercised by a real caller.",
         present="ApprovalMode distinguishes never, risky_actions and always, and "
                 "AgentRuntime::prepare returns a pending-approval run record that a caller "
                 "must resolve before anything executes.",
         requirements=['REQ-POL-001', 'REQ-KEY-PREFLIGHT-001'], acceptance=["AT-17"],
         gap_register=["F04"], platforms=["claude_code", "opencode", "hermes"]),

    # -- observability ------------------------------------------------------
    dict(id="GAP-OBS-001", axis="observability_audit", name="Tool call attribution and replay",
         status="PARTIAL", priority=2,
         gap="The provenance ledger can record an event, but a tool call is not tied to an "
             "agent id, a task id, a model id, an outcome and a trace, so a run cannot be "
             "replayed or audited end to end.",
         present="genesis/provenance/ledger.cpp records provenance entries, and the "
                 "requirements registry and the platform module record identifiers for "
                 "agents and runs.",
         requirements=['REQ-PROV-001', 'REQ-EVAL-001', 'REQ-AGENT-PLATFORM-001'], acceptance=["AT-19"],
         gap_register=["G01", "G02"], platforms=["claude_code", "opencode", "hermes", "copilot"]),
    dict(id="GAP-OBS-002", axis="observability_audit", name="Honest status reporting",
         status="PARTIAL", priority=2,
         gap="The system can report that it did something without proving that it did. The "
             "evidence vocabulary exists in the programme documentation but is not enforced "
             "in the code that produces the claims.",
         present="The requirement registry carries a status, an evidence field and a "
                 "last-verified date for every requirement, and the completion report "
                 "records a percentage per component.",
         requirements=['REQ-EVAL-001', 'REQ-PROV-001', 'REQ-COMPLETION-001'], acceptance=["AT-19"],
         gap_register=["G01", "G02"], platforms=["chatgpt", "claude_code"]),

    # -- workspace and files ------------------------------------------------
    dict(id="GAP-FS-001", axis="workspace_files", name="Workspace and file management",
         status="PARTIAL", priority=2,
         gap="The agent has a filesystem capability and a path, but no workspace object, no "
             "sandboxed root and no read/write path through the kernel.",
         present="ToolGrant grants filesystem write permission and a tool id; the ledger "
                 "integration and storage provider in Aetherius-OS hold the durable side.",
         requirements=['REQ-LIFE-RECORD-PERSIST-001', 'REQ-INGEST-PIPELINE-001', 'REQ-DATA-SOVEREIGNTY-001'], acceptance=["AT-10", "AT-12"],
         gap_register=["F05"], platforms=["claude_code", "opencode", "cursor", "antigravity"]),
    dict(id="GAP-FS-002", axis="workspace_files", name="Per-agent worktree isolation",
         status="MISSING", priority=2,
         gap="Two agents writing at once have no isolation mechanism inside Genesis. The "
             "handoff requires one autonomous writer per checkout, and nothing enforces it.",
         present="The agent platform models a workspace concept only as a path string on the "
                 "definition.",
         requirements=['REQ-AGENT-PLATFORM-001', 'REQ-POL-001'], acceptance=["AT-03"],
         gap_register=["F04"], platforms=["claude_code", "opencode", "hermes"]),

    # -- browser and computer ------------------------------------------------
    dict(id="GAP-BROW-001", axis="browser_computer", name="First-party browser and computer control",
         status="MISSING", priority=3,
         gap="Genesis has no way to see or drive a computer. The browser automation the "
             "workspace uses is done by the operator tools, not by Genesis, so an agent that "
             "needs a page cannot get one and an agent that needs a screenshot cannot take "
             "one.",
         present="The adapter kinds and the platform service contracts anticipate a browser "
                 "or device capability, and Aetherius-OS holds a supervisor UI, but no "
                 "computer-control capability is implemented in Genesis.",
         requirements=['REQ-MODAL-001', 'REQ-PLATFORM-SERVICES-001', 'REQ-UI-SHELL-001'], acceptance=["AT-10"],
         gap_register=["C05"], platforms=["manus", "chatgpt", "antigravity", "opencode"]),

    # -- knowledge and retrieval ---------------------------------------------
    dict(id="GAP-KNOW-001", axis="knowledge_retrieval", name="Source-linked retrieval",
         status="PARTIAL", priority=2,
         gap="Genesis holds a memory graph but no retrieval over external sources with "
             "provenance, so a claim cannot be traced to where it came from.",
         present="The memory graph, its origin module and the provenance ledger record "
                 "where things came from, and the research registry classifies research "
                 "items and dead ends.",
         requirements=['REQ-RESEARCH-001', 'REQ-CORPUS-001', 'REQ-PROV-001'], acceptance=["AT-04", "AT-19"],
         gap_register=["D06", "G04"], platforms=["chatgpt", "perplexity", "gemini"]),

    # -- lifecycle and recovery ----------------------------------------------
    dict(id="GAP-LIFE-001", axis="lifecycle_recovery", name="Crash recovery and checkpoint resume",
         status="MISSING", priority=1,
         gap="A crash loses the run. There is no checkpoint, no idempotency key and no "
             "recovery, so a remote worker that dies leaves work half done with no way to "
             "resume it.",
         present="The ledger and provenance modules can record what happened, and the "
                 "platform records a prepared run, but neither can restore a run.",
         requirements=['REQ-PROV-001', 'REQ-LIFE-RECORD-PERSIST-001', 'REQ-RUN-001'], acceptance=["AT-06", "AT-16"],
         gap_register=["C03", "C02"], platforms=["claude_code", "opencode", "manus", "chatgpt"]),
    dict(id="GAP-LIFE-002", axis="lifecycle_recovery", name="Continuous background operation",
         status="PARTIAL", priority=2,
         gap="Triggers and a schedule registry exist, and the organism loop runs, but nothing "
             "keeps the work alive when the browser is closed or the machine sleeps, and no "
             "task checkpoint and resumes.",
         present="TriggerRegistry models manual, schedule and event triggers, and the "
                 "organism loop implements the stages that keep work moving while the "
                 "process lives.",
         requirements=['REQ-RUN-001', 'REQ-EVT-001', 'REQ-SVC-001'], acceptance=["AT-05"],
         gap_register=["C01", "C04"], platforms=["hermes", "manus", "opencode"]),
    dict(id="GAP-LIFE-003", axis="lifecycle_recovery", name="Failure domains and circuit breakers",
         status="MISSING", priority=2,
         gap="There is no isolated failure domain and no circuit breaker in the Genesis "
             "runtime, so one bad tool call can take the whole agent down.",
         present="The runtime has an exception and event model, and the platform reports a "
                 "failed run, but a failure is not contained.",
         requirements=['REQ-RUN-001', 'REQ-EVT-001', 'REQ-SVC-001'], acceptance=["AT-06", "AT-17"],
         gap_register=["C03", "G03"], platforms=["hermes", "opencode", "kimi"]),

    # -- interface and presence ----------------------------------------------
    dict(id="GAP-UI-001", axis="interface_presence", name="Direct agent-to-user conversation",
         status="PARTIAL", priority=2,
         gap="The user can talk to Genesis, but cannot address an individual worker, and "
             "there is no conversation to persist and revisit.",
         present="The agent platform models a communication endpoint per agent and the "
                 "continuity module holds state across sessions.",
         requirements=['REQ-SELF-CONTINUITY-001', 'REQ-UI-SHELL-001', 'REQ-AGENT-PLATFORM-001'], acceptance=["AT-11"],
         gap_register=["D08"], platforms=["chatgpt", "claude", "manus", "hermes"]),
    dict(id="GAP-UI-002", axis="interface_presence", name="Avatar-first and multi-surface presence",
         status="PARTIAL", priority=3,
         gap="The organism has a body and an embodiment model, but the user-facing surfaces "
             "live in the IDE and the supervisor rather than in Genesis itself.",
         present="The embodiment and organism modules model the body, and the IDE carries "
                 "the supervisor UI that renders it.",
         requirements=['REQ-UI-SHELL-001', 'REQ-DUAL-ANATOMY-ATLAS-001', 'REQ-ACCESSIBILITY-001'], acceptance=["AT-11", "AT-12"],
         gap_register=["A03"], platforms=["chatgpt", "antigravity", "manus"]),
]


def yaml_escape(text: str) -> str:
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(REPO / "docs" / "GAP-ANALYSIS-REGISTRY.yaml"))
    args = ap.parse_args()

    lines: list[str] = []
    lines.append("# " + "=" * 76)
    lines.append("# GAP ANALYSIS REGISTRY - Genesis as a first-party agent platform")
    lines.append("# " + "=" * 76)
    lines.append("# What Genesis has, what it has not, and what a mature agent platform")
    lines.append("# has that Genesis does not.")
    lines.append("#")
    lines.append("# GENERATED by tools/generate_gap_registry.py. The judgement above the")
    lines.append("# evidence is the author's; the evidence below it is looked up in")
    lines.append("# Genesis's own registries, so the citations cannot drift from the code.")
    lines.append("# Regenerate rather than hand-edit.")
    lines.append("#")
    lines.append("# Status vocabulary:")
    lines.append("#   VERIFIED       implemented and proven by a repeatable test")
    lines.append("#   IMPLEMENTED    code exists and compiles, but no test proves it yet")
    lines.append("#   PARTIAL        some of it exists; the rest is named explicitly")
    lines.append("#   MISSING        nothing exists, and the gap is stated")
    lines.append("#   RESEARCH       studied, deliberately not built yet")
    lines.append("#   NOT_APPLICABLE the owner decided this does not apply")
    lines.append("# " + "=" * 76)
    lines.append('schema_version: "1.0.0"')
    lines.append('source_date: "2026-10-20"')
    # The path is written from where Genesis actually is, so it cannot
    # become a path that leads nowhere.
    try:
        relative = GENESIS.relative_to(REPO.parent).as_posix()
    except ValueError:
        relative = GENESIS.as_posix()
    lines.append(f'genesis_requirement_registry: "{relative}/registry/requirements.tsv"')
    lines.append('platform_inventory: "Aetherius-OS/research/platform-capability-inventory.md"')
    lines.append("gaps:")

    for cap in CAPABILITIES:
        req_ids = [find_requirement(f) for f in cap.get("requirements", [])]
        impl = implementation_for(req_ids)
        tests = tests_for(req_ids)
        lines.append(f"  - id: {cap['id']}")
        lines.append(f"    name: {yaml_escape(cap['name'])}")
        lines.append(f"    axis: {cap['axis']}")
        if cap.get("spec_area"):
            lines.append(f"    spec_area: {cap['spec_area']}")
        lines.append(f"    status: {cap['status']}")
        lines.append(f"    gap: {yaml_escape(cap['gap'])}")
        lines.append(f"    present: {yaml_escape(cap['present'])}")
        lines.append(f"    priority: {cap['priority']}")
        if req_ids:
            lines.append("    requirement_refs:")
            for rid in req_ids:
                lines.append(f"      - {rid}")
        if impl:
            lines.append("    implementation_refs:")
            for p in impl:
                lines.append(f"      - {p}")
        if tests:
            lines.append("    test_refs:")
            for p in tests:
                lines.append(f"      - {p}")
        if cap.get("acceptance"):
            lines.append("    acceptance_refs:")
            for a in cap["acceptance"]:
                lines.append(f"      - {a}")
        if cap.get("gap_register"):
            lines.append("    gap_register_refs:")
            for g in cap["gap_register"]:
                lines.append(f"      - {g}")
        if cap.get("platforms"):
            lines.append("    platform_refs:")
            for p in cap["platforms"]:
                lines.append(f"      - {p}")
        # The evidence is not a claim about the gap; it is the registry
        # state the judgement was made from. A reader can therefore re-check
        # the judgement against the same records.
        statuses = ", ".join(
            f"{rid}={requirement_status(rid) or 'UNKNOWN'}" for rid in req_ids
        )
        evidence = f"Genesis requirement registry status: {statuses or 'no requirement cited'}."
        if impl:
            evidence += f" Source present on disk: {', '.join(impl)}."
        if tests:
            evidence += f" Tests present on disk: {', '.join(tests)}."
        lines.append(f"    evidence: {yaml_escape(evidence)}")
        lines.append(f"    provenance: {yaml_escape(cap.get('provenance', 'gap analysis 2026-10-20, against Genesis registries and the master handoff'))}")
        if cap.get("decision"):
            lines.append(f"    decision: {yaml_escape(cap['decision'])}")

    out = Path(args.out)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out} with {len(CAPABILITIES)} capabilities")
    return 0


if __name__ == "__main__":
    sys.exit(main())
