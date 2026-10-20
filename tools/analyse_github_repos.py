#!/usr/bin/env python3
"""Analyse every repository in the owner's GitHub account.

The account holds six hundred repositories: a few dozen the owner wrote,
and several hundred forks of other people's work. The forks are the prior
art, and the owner's instruction is to use the repositories to help finish
the projects. The way a fork helps is not by reading it end to end, but
by knowing what it is, whether it can be reused, and which gap in the
Genesis analysis it speaks to.

So every repository is recorded on four things:

  - what it is, from its README, description, topics and language;
  - which capability axis it informs, using the same axis vocabulary as
    the gap analysis, so the two registers can be compared directly;
  - its licence, and whether that licence permits reuse in a first-party
    repository or only permits reading for design;
  - whether the fork is stale, because a fork the owner never touched is
    a different thing from one the owner is actively working in.

The output the analysis is for is the gap-candidate table: for each open
gap, the forks that could inform it, and which of them may legally be
read for ideas versus copied.

Usage:
    python tools/analyse_github_repos.py
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import subprocess
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OWNER = "jayprophit"

# --------------------------------------------------------------------------
# The capability axes. These match the axes in the Genesis gap analysis
# registry, so a fork can be matched against an open gap rather than
# against a loose topic.
# --------------------------------------------------------------------------
GAP_AXES: dict[str, tuple[str, ...]] = {
    "model_integration": (
        "llm", "inference", "vllm", "ollama", "gguf", "quantization", "quantise",
        "litellm", "llama", "sglang", "mlx", "embedding", "whisper", "tts",
        "model router", "model-routing", "provider", "transformers", "diffusers",
        "comfyui", "stable-diffusion", "openai", "anthropic", "mistral",
    ),
    "tool_execution": (
        "sandbox", "e2b", "firecracker", "gvisor", "container", "wasm", "wasmtime",
        "wasmer", "deno", "code interpreter", "code-interpreter", "tool calling",
        "tool-calling", "function calling", "function-calling", "shell", "exec",
        "playwright", "puppeteer", "selenium", "browser", "registry", "mcp",
        "model context protocol",
    ),
    "planning": (
        "planner", "planning", "task decomposition", "task-decomposition",
        "workflow", "dag", "orchestrat", "crewai", "autogen", "agent",
        "swarm", "benchmark", "todo", "sdlc", "devops",
    ),
    "memory_context": (
        "memory", "mem0", "zep", "letta", "memary", "context window",
        "rag", "retrieval", "vector", "chroma", "qdrant", "weaviate",
        "pinecone", "knowledge graph", "knowledge-graph", "langchain",
        "langgraph", "llamaindex",
    ),
    "multi_agent": (
        "multi-agent", "multiagent", "agent", "crewai", "autogen", "swarm",
        "messaging", "zeromq", "zmq", "nats", "kafka", "grpc", "protocol",
        "bridge", "distributed", "micro-service", "microservice",
    ),
    "identity_persistence": (
        "oauth", "oidc", "saml", "keycloak", "zitadel", "auth0", "session",
        "jwt", "passkey", "webauthn", "credential", "identity", "sign-in",
        "signin", "login",
    ),
    "permissions_authority": (
        "authoriz", "authent", "rbac", "abac", "acl", "policy", "permission",
        "casbin", "cerbos", "opa", "open policy agent", "spiffe", "spire",
        "kyverno", "gatekeeper", "vault", "least privilege", "sandbox",
    ),
    "observability_audit": (
        "opentelemetry", "otel", "langfuse", "phoenix", "helicone", "trace",
        "tracing", "audit", "observability", "log", "replay", "inspect",
        "metrics", "telemetry",
    ),
    "workspace_files": (
        "file manager", "filesystem", "storage", "sync", "git", "worktree",
        "workspace", "sandbox", "code-server", "jupyter", "notes", "editor",
    ),
    "browser_computer": (
        "playwright", "puppeteer", "selenium", "browser", "webdriver",
        "headless", "chrome", "computer use", "computer-use", "stagehand",
        "browsergym",
    ),
    "knowledge_retrieval": (
        "retrieval", "search", "index", "elastic", "meilisearch", "typesense",
        "tavily", "exa", "perplexity", "semantic", "embeddings", "wikipedia",
        "scraper", "crawler",
    ),
    "lifecycle_recovery": (
        "crash", "checkpoint", "recovery", "resume", "wal", "write-ahead",
        "saga", "temporal", "restate", "durable", "retry", "circuit breaker",
        "resilience", "fault tolerance",
    ),
    "interface_presence": (
        "react", "svelte", "vue", "tauri", "electron", "avatar", "chat ui",
        "chat-ui", "widget", "extension", "copilot", "ide", "vscode",
        "jetbrains", "ui ", "design system",
    ),
}

# A second, looser axis: what domain the repository is in. This is what
# the owner browses when they want to know what they have collected.
DOMAINS: list[tuple[str, tuple[str, ...]]] = [
    ("kernel_os", ("linux", "kernel", "plan9", "9front", "systemd", "nixos",
                   "zephyr", "sel4", "fuchsia", "redox", "bootc", "ostree",
                   "unikraft", "firecracker", "gvisor", "genode", "coreos",
                   "zircon", "freertos", "rtos", "embecos", "uefi",
                   "operating system", "microkernel", "hypervisor")),
    ("audio_engine", ("juce", "portaudio", "rtaudio", "rtmidi", "alsa",
                      "pipewire", "pulseaudio", "jack", "miniaudio", "libsndfile",
                      "libsamplerate", "soxr", "soundtouch", "portmidi",
                      "opensoundcontrol", "supercollider", "ardour", "csound",
                      "audiowaveform", "speex", "opus", "ffmpeg", "audio",
                      "dsp", "vst", "lv2", "aax", "au vst", "audioplug")),
    ("plugin_host", ("clap", "vst3", "vst sdk", "vstsdk", "plugin host",
                     "plugin-host", "lsp", "lv2", "dpf", "iplug", "carla",
                     "distrho", "auv3", "jalv", "plugin")),
    ("midi", ("midi", "mpe", "ump", "midifile", "midi2", "libremidi", "webmidi")),
    ("synthesis_dsp", ("synth", "synthes", "sampler", "soundfont", "sfz",
                       "drum machine", "drum-machine", "piano roll",
                       "piano-roll", "sequencer", "tracktion", "chowdsp",
                       "sfizz", "fluidsynth", "am synth", "wavetable")),
    ("machine_learning", ("pytorch", "tensorflow", "jax", "scikit", "sklearn",
                          "transformers", "diffusers", "comfyui", "autogpt",
                          "agent", "mcp", "a2a", "crewai", "autogen",
                          "machine learning", "neural", "llm", "gpt")),
    ("simulation", ("nest", "opensim", "neuron", "moose", "brainflow",
                    "openusd", "blender", "webots", "gazebo", "pybullet",
                    "mujoco", "omnet", "mininet", "quantum")),
    ("observability", ("opentelemetry", "prometheus", "grafana", "jaeger",
                       "zipkin", "tempo", "mimir", "loki", "otlp", "sentry",
                       "telemetry", "metrics")),
    ("distributed_systems", ("cockroach", "yugabyte", "tidb", "etcd",
                              "zookeeper", "nats", "zenoh", "libp2p", "helm",
                              "temporal", "airflow", "dagster", "dbos",
                              "kafka", "pulsar", "n8n", "rqlite", "consensus")),
    ("networking_security", ("wireguard", "tailscale", "zerotier", "quic",
                              "envoy", "cilium", "calico", "opa", "cosign",
                              "sigstore", "vault", "age", "sops", "spiffe",
                              "spire", "caddy", "traefik", "proxy", "vpn")),
    ("language_parsing", ("tree-sitter", "semgrep", "ast-grep", "antlr",
                          "bison", "flex", "rust-analyzer", "ccls", "clangd",
                          "pyright", "mypy", "ruff", "parser", "compiler",
                          "interpreter", "language")),
    ("desktop_shell", ("qt", "gtk", "sway", "i3", "wayfire", "river", "dwl",
                       "x11", "xorg", "winit", "tauri", "electron", "wails",
                       "iced", "slint", "dioxus", "cosmic", "window manager")),
    ("data_science", ("scanpy", "anndata", "deepcell", "deeplabcut", "polars",
                      "pandas", "numpy", "scipy", "rapids", "cuml", "dask",
                      "jupyter", "dataset", "corpus")),
    ("web_framework", ("react", "vue", "svelte", "next", "nuxt", "astro",
                       "remix", "vite", "webpack", "express", "fastify",
                       "nestjs", "django", "flask", "axum", "actix", "rocket",
                       "web app", "website", "frontend", "backend")),
    ("blockchain", ("bitcoin", "ethereum", "solana", "polkadot", "hyperledger",
                    "corda", "tendermint", "monero", "zcash", "cardano",
                    "dogecoin", "litecoin", "smart contract", "blockchain",
                    "crypto")),
    ("tooling", ("neovim", "tmux", "fzf", "ripgrep", "emacs", "dotfiles",
                 "linter", "formatter", "package manager", "build tool")),
]

# A licence that permits reading but not copying into a first-party
# repository.
COPYLEFT_MARKERS = ("GPL", "AGPL", "SSPL", "OSL", "EUPL", "RPL", "CC-BY-SA",
                     "CDDL", "MPL")
# A licence that permits reuse with attribution.
WEAK_COPYLEFT = ("MPL", "LGPL", "CDDL")

OWNER_ROLES = {
    "aetherius-os": "platform",
    "genesis": "intelligence",
    "agent-bridge": "execution",
    "ide-workspace": "interface",
    "poietek": "creative",
    "universal-bridge": "interoperability",
    "aetherial": "legacy_predecessor",
    "niche_platform": "legacy_predecessor",
    "self-building-ai": "legacy_predecessor",
    "materials-atlas-table-codex---mat": "knowledge",
}

WORD = re.compile(r"[a-z0-9][a-z0-9+.#_-]{2,}")


def gh(args: list[str], attempts: int = 4) -> str:
    """Run gh with the output decoded as UTF-8.

    The default locale on this host is cp1252, and a README containing a
    non-Latin character makes the decode fail. That failure must not be
    mistaken for an empty result, so the encoding is pinned and errors
    are replaced rather than raised.
    """
    last = ""
    for attempt in range(attempts):
        proc = subprocess.run(
            ["gh", *args], capture_output=True, timeout=600,
            encoding="utf-8", errors="replace",
        )
        if proc.returncode == 0:
            return proc.stdout
        last = (proc.stderr or "").strip()
        if "502" not in last and "503" not in last and "504" not in last \
                and "rate limit" not in last.lower():
            break
        time.sleep(2 * (attempt + 1))
    raise RuntimeError(last[:200] or "gh failed")


def fetch_all() -> list[dict]:
    """Every repository the owner can see, including the private ones."""
    raw = gh(["api", "--paginate", "/user/repos?per_page=100&type=all"])
    repos = json.loads(raw)
    out = []
    for r in repos:
        lic = r.get("license") or {}
        parent = r.get("parent") or {}
        out.append({
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "description": r.get("description") or "",
            "language": r.get("language"),
            "stars": r.get("stargazers_count") or 0,
            "forks": r.get("forks_count") or 0,
            "size_kb": r.get("size") or 0,
            "created_at": r.get("created_at"),
            "pushed_at": r.get("pushed_at"),
            "updated_at": r.get("updated_at"),
            "fork": bool(r.get("fork")),
            "private": bool(r.get("private")),
            "archived": bool(r.get("archived")),
            "disabled": bool(r.get("disabled")),
            "upstream": parent.get("full_name"),
            "default_branch": r.get("default_branch"),
            "spdx": lic.get("spdx_id"),
            "topics": r.get("topics") or [],
            "open_issues": r.get("open_issues_count") or 0,
        })
    return out


def fetch_readmes(names: list[str], cache_dir: Path) -> dict[str, str]:
    """The README of each repository, cached on disk between runs."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    out: dict[str, str] = {}
    for i, name in enumerate(names):
        safe = re.sub(r"[^A-Za-z0-9._-]", "_", name)
        cached = cache_dir / f"{safe}.md"
        if cached.exists():
            out[name] = cached.read_text(encoding="utf-8", errors="replace")
            continue
        try:
            raw = gh(["api", f"/repos/{OWNER}/{name}/readme"])
            payload = json.loads(raw)
            text = ""
            if payload.get("encoding") == "base64" and payload.get("content"):
                text = base64.b64decode(payload["content"]).decode(
                    "utf-8", errors="replace")
            elif payload.get("text"):
                text = payload["text"]
            cached.write_text(text, encoding="utf-8")
            out[name] = text
        except Exception:
            out[name] = ""
        if (i + 1) % 50 == 0:
            print(f"    readmes {i + 1}/{len(names)}", flush=True)
    return out


def tokens(*parts: str) -> set[str]:
    blob = " ".join(p for p in parts if p).lower()
    return set(WORD.findall(blob))


def pick(hay: set[str], needles: tuple[str, ...]) -> list[str]:
    """Which of the needles appear, as whole tokens or token phrases."""
    found = []
    for needle in needles:
        parts = needle.split()
        if len(parts) == 1:
            if parts[0] in hay:
                found.append(needle)
        else:
            joined = " ".join(parts)
            if joined in hay or all(p in hay for p in parts):
                found.append(needle)
    return found


def score(hay_name: set[str], hay_desc: set[str], hay_topic: set[str],
          hay_readme: set[str], needles: tuple[str, ...]) -> int:
    """How strongly a set of needles identifies a subject.

    A hit in the repository's own name or description is the owner
    saying what it is, and counts for much more than the same word
    appearing somewhere in a README. Weighting this way stops a Linux
    distribution that merely mentions the word "os" in its description
    from being filed as an operating system.
    """
    total = 0
    for needle in needles:
        parts = needle.split()
        if len(parts) == 1:
            w = parts[0]
            if w in hay_name:
                total += 3
            elif w in hay_desc:
                total += 3
            elif w in hay_topic:
                total += 2
            elif w in hay_readme:
                total += 1
        else:
            joined = " ".join(parts)
            if joined in hay_desc or joined in hay_name:
                total += 3
            elif joined in hay_topic:
                total += 2
            elif joined in hay_readme:
                total += 1
    return total


def classify(rec: dict, readme: str) -> None:
    hay_name = tokens(rec["name"])
    hay_desc = tokens(rec.get("description") or "")
    hay_topic = tokens(" ".join(rec.get("topics") or []))
    hay_readme = tokens(readme[:6000])

    axes = []
    for axis, needles in GAP_AXES.items():
        s = score(hay_name, hay_desc, hay_topic, hay_readme, needles)
        if s >= 2:
            axes.append((axis, s))
    axes.sort(key=lambda x: (-x[1], x[0]))
    rec["gap_axes"] = [a for a, _ in axes]
    rec["gap_axis_scores"] = {a: s for a, s in axes}

    dom = []
    for name, needles in DOMAINS:
        s = score(hay_name, hay_desc, hay_topic, hay_readme, needles)
        if s >= 3:
            dom.append((name, s))
    dom.sort(key=lambda x: (-x[1], x[0]))
    rec["domains"] = [d for d, _ in dom]
    rec["domain"] = dom[0][0] if dom else "unclassified"


def licence_verdict(spdx: str | None) -> str:
    if not spdx:
        return "unknown"
    up = spdx.upper()
    if any(m in up for m in COPYLEFT_MARKERS):
        if any(m in up for m in WEAK_COPYLEFT):
            return "weak-copyleft"
        return "copyleft"
    if "MIT" in up or "APACHE" in up or "BSD" in up or "ISC" in up:
        return "permissive"
    return "other"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(REPO / "research" / "github-repos"))
    ap.add_argument("--skip-readmes", action="store_true")
    args = ap.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    print("fetching repository list", flush=True)
    repos = fetch_all()
    print(f"  {len(repos)} repositories", flush=True)

    readmes: dict[str, str] = {}
    if not args.skip_readmes:
        print("fetching readmes", flush=True)
        readmes = fetch_readmes([r["name"] for r in repos], out_dir / ".readme-cache")

    now = datetime.now(timezone.utc)
    for r in repos:
        readme = readmes.get(r["name"], "")
        classify(r, readme)
        r["licence_verdict"] = licence_verdict(r.get("spdx"))
        r["readme_bytes"] = len(readme.encode("utf-8", errors="replace"))
        pushed = r.get("pushed_at")
        r["stale"] = bool(pushed) and (now - datetime.fromisoformat(
            pushed.replace("Z", "+00:00"))).days > 365
        r["owner_role"] = OWNER_ROLES.get((r["name"] or "").lower())
        r["first_party"] = not r["fork"] and not r["private"]
        r["empty"] = r["size_kb"] == 0 and r["readme_bytes"] == 0

    (out_dir / "index.json").write_text(
        json.dumps(repos, indent=1, ensure_ascii=False), encoding="utf-8")

    own = [r for r in repos if not r["fork"]]
    forks = [r for r in repos if r["fork"]]
    by_domain: Counter[str] = Counter(r["domain"] for r in repos)
    verdicts: Counter[str] = Counter(r["licence_verdict"] for r in repos)
    axis_counts: Counter[str] = Counter()
    for r in repos:
        for a in r["gap_axes"]:
            axis_counts[a] += 1

    # -- the digest --------------------------------------------------------
    lines = [
        "# GitHub repository analysis",
        "",
        f"{len(repos)} repositories: {len(own)} the owner wrote, {len(forks)} forks.",
        "",
        "The forks are the prior art. For each one this records what it is,",
        "which capability axis it informs, its licence, and whether the owner",
        "has touched it in the last year. The gap-candidate table that follows",
        "is the part that decides what gets read next.",
        "",
        "## What is in the account",
        "",
        "| Measure | Count |",
        "|---|---|",
        f"| Repositories | {len(repos)} |",
        f"| Written by the owner | {len(own)} |",
        f"| Forks of other people's work | {len(forks)} |",
        f"| Forks not touched in over a year | {sum(1 for r in forks if r['stale'])} |",
        f"| Private | {sum(1 for r in repos if r['private'])} |",
        f"| Archived | {sum(1 for r in repos if r['archived'])} |",
        f"| Empty, a bookmark rather than a project | {sum(1 for r in repos if r['empty'])} |",
        "",
        "## Licence position",
        "",
        "| Verdict | Repositories | Meaning |",
        "|---|---|---|",
        f"| permissive | {verdicts['permissive']} | reusable with attribution |",
        f"| weak-copyleft | {verdicts['weak-copyleft']} | reusable in named files only |",
        f"| copyleft | {verdicts['copyleft']} | read for design, do not paste |",
        f"| other | {verdicts['other']} | check before reuse |",
        f"| unknown | {verdicts['unknown']} | no licence file found |",
        "",
        "The copyleft count is the one that matters. A GPL or AGPL fork may be",
        "read to learn how a problem was solved, and its ideas may be written",
        "fresh, but its code does not enter a first-party repository.",
        "",
        "## Domains",
        "",
        "| Domain | Repositories |",
        "|---|---|",
    ]
    for dom, n in by_domain.most_common():
        lines.append(f"| {dom} | {n} |")
    lines += ["", "## Capability axes the account can inform", "",
              "| Axis | Repositories |", "|---|---|"]
    for axis, n in axis_counts.most_common():
        lines.append(f"| {axis} | {n} |")

    lines += ["", "## Repositories the owner wrote", "",
              "| Repository | Role | Language | Size | Last push |",
              "|---|---|---|---|---|"]
    for r in sorted(own, key=lambda x: (x["owner_role"] is None, x["name"].lower())):
        lines.append(
            f"| [{r['name']}]({r['full_name'] and 'https://github.com/' + r['full_name']}) "
            f"| {r['owner_role'] or '-'} | {r['language'] or '-'} "
            f"| {r['size_kb'] // 1024} MB | {(r['pushed_at'] or '')[:10]} |")

    lines += ["", "## The forks, by domain", ""]
    for dom, n in by_domain.most_common():
        rs = [r for r in forks if r["domain"] == dom]
        if not rs:
            continue
        lines.append(f"### {dom} ({len(rs)})")
        lines.append("")
        for r in sorted(rs, key=lambda x: x["name"].lower()):
            lic = r["spdx"] or "unknown"
            flags = []
            if r["licence_verdict"] in ("copyleft", "weak-copyleft"):
                flags.append(r["licence_verdict"])
            if r["stale"]:
                flags.append("stale")
            if r["archived"]:
                flags.append("archived")
            flag = ("  [" + ", ".join(flags) + "]") if flags else ""
            lines.append(f"- `{r['name']}` — {lic}{flag}")
        lines.append("")
    (out_dir / "digest.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    # -- the gap candidates ------------------------------------------------
    gap_file = REPO / "docs" / "GAP-ANALYSIS-REGISTRY.yaml"
    gap_lines: list[str] = []
    if gap_file.exists():
        import yaml  # noqa: PLC0415  - optional dependency
        gaps = (yaml.safe_load(gap_file.read_text(encoding="utf-8")) or {}).get("gaps", [])
        open_gaps = [g for g in gaps if str(g.get("status", "")).upper() not in
                     {"IMPLEMENTED", "UNIT_TESTED", "VERIFIED", "COMPLETE"}]
        open_gaps.sort(key=lambda g: (g.get("priority") or 9, g.get("id") or ""))

        axis_repos: dict[str, list[dict]] = defaultdict(list)
        for r in repos:
            for a in r["gap_axes"]:
                axis_repos[a].append(r)

        gap_lines = [
            "# Which repositories can inform which open gap",
            "",
            "This is the join between the two registers. Each open gap in the",
            "Genesis analysis is listed with the repositories in the account",
            "that speak to it. The licence column decides whether a repository",
            "may be read for ideas, or may also be copied from.",
            "",
            f"{len(open_gaps)} open gaps, {len(repos)} repositories.",
            "",
        ]
        for g in open_gaps:
            axis = g.get("axis")
            cands = sorted(
                [r for r in axis_repos.get(axis, []) if r["fork"]],
                key=lambda x: (x["stale"], -x["stars"], x["name"].lower()),
            )
            own_cands = [r for r in axis_repos.get(axis, []) if not r["fork"]]
            gap_lines.append(f"## {g.get('id')} — {g.get('name')}")
            gap_lines.append("")
            gap_lines.append(f"- Axis: `{axis}`")
            gap_lines.append(f"- Priority: {g.get('priority')}")
            gap_lines.append(f"- Status: {g.get('status')}")
            gap_lines.append(f"- The gap: {g.get('gap')}")
            if own_cands:
                gap_lines.append("- Own repositories on this axis: " +
                                 ", ".join(f"`{r['name']}`" for r in own_cands))
            gap_lines.append(f"- Candidate forks: {len(cands)}")
            gap_lines.append("")
            for r in cands[:25]:
                verdict = r["licence_verdict"]
                reuse = {
                    "permissive": "may copy",
                    "weak-copyleft": "named files only",
                    "copyleft": "read for design only",
                    "other": "check the licence",
                    "unknown": "no licence found",
                }[verdict]
                gap_lines.append(
                    f"  - `{r['name']}` — {r['spdx'] or 'unknown'} — {reuse}"
                    + (" — stale" if r["stale"] else "")
                )
            if len(cands) > 25:
                gap_lines.append(f"  - ... and {len(cands) - 25} more")
            gap_lines.append("")
        (out_dir / "gap-candidates.md").write_text(
            "\n".join(gap_lines) + "\n", encoding="utf-8")

    print(f"  first-party: {len(own)}  forks: {len(forks)}")
    print(f"  stale forks: {sum(1 for r in forks if r['stale'])}")
    print(f"  licence: {dict(verdicts)}")
    print(f"  top domains: {by_domain.most_common(6)}")
    print(f"  wrote {out_dir / 'digest.md'}")
    if gap_lines:
        print(f"  wrote {out_dir / 'gap-candidates.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
