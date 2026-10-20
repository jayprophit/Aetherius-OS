#!/usr/bin/env python3
"""Generate the GitHub repository registry.

The owner's GitHub account holds two kinds of repository, and they play
different roles in the programme:

  - OWN repositories. These are the canonical upstream for the local
    projects. A local project that has drifted from its remote is a
    finding, not a detail.

  - FORKED repositories. These are the prior art. A fork is a reference
    implementation of a mechanism somebody else built, kept locally so it
    can be read, compared against, and used to decide what a first-party
    implementation should do. This is the corpus the reverse-engineering
    work reads from, and it is the reason the account has 342 of them.

The registry records both, with the metadata needed to decide what to read
and what to compare. Forks are additionally mapped to the capability axis
they inform, so the gap analysis can be pointed at a specific reference
implementation rather than at the repository list as a whole.

Usage:
    python tools/generate_repo_registry.py [--out docs/REPO-REGISTRY.yaml]
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OWNER = "jayprophit"

# Which capability axis a fork informs. Matched against the repository
# name and description, lowercased. The first match wins, so the order is
# most-specific first.
AXIS_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("kernel_os", (
        "9front", "systemd", "plan9", "linux", "kernel", "seL4", "redox", "fuchsia",
        "zircon", "nixos", "guix", "ostree", "rpm-ostree", "unikraft", "firecracker",
        "gvisor", "kata", "bootc", "coreos", "genode", "zephyr", "freebsd", "netbsd",
    )),
    ("build_tooling", (
        "cmake", "ninja", "meson", "bazel", "buildsystem", "cargo", "gradle", "maven",
        "make", "conan", "vcpkg", "spack", "c3", "scons",
    )),
    ("audio_engine", (
        "juce", "portaudio", "rtaudio", "alsa", "pipewire", "pulseaudio", "jack",
        "opensoundcontrol", "soundtouch", "soxr", "libsndfile", "miniaudio", "speex",
        "opus", "ffmpeg", "supercollider", "csound", "audiowaveform", "ardour",
    )),
    ("media_pipeline", (
        "comfyui", "audiowaveform", "reaper", "ardour", "shotcut", "kdenlive",
        "blender", "openshot", "handbrake", "obs", "mlt", "gstreamer",
    )),
    ("ai_agent", (
        "litellm", "langchain", "llama_index", "llama", "a2a", "mem0", "autogen",
        "agent", "crewai", "langgraph", "autogpt", "openai", "anthropic", "gemini",
        "mcp", "modelcontext", "vllm", "ollama", "gpt4all", "sglang", "llama-cpp",
        "transformers", "huggingface", "deepspeed", "optimum", "text-generation",
    )),
    ("simulation_science", (
        "nest-simulator", "opensim", "neuron", "moose", "genesis", "brainflow",
        "openusd", "opendome", "blender", "sundials", "coppelia", "webots", "gazebo",
        "pybullet", "mujoco", "isaac", "omnet", "ns3", "mininet", "riverbed",
    )),
    ("data_science", (
        "scanpy", "anndata", "deepcell", "deeplabcut", "pytorch", "tensorflow",
        "jax", "sklearn", "scikit", "pandas", "polars", "dask", "rapids", "cuml",
    )),
    ("observability", (
        "opentelemetry", "prometheus", "grafana", "jaeger", "zipkin", "datadog",
        "sentry", "tempo", "mimir", "loki", "vector", "fluent", "otel",
    )),
    ("distributed_systems", (
        "cockroach", "yugabyte", "tidb", "etcd", "zookeeper", "nats", "zenoh",
        "libp2p", "helm", "temporal", "cadence", "airflow", "dagster", "prefect",
        "dbos", "kafka", "pulsar", "n8n", "temporal",
    )),
    ("networking_security", (
        "wireguard", "tailscale", "zerotier", "quic", "envoy", "cilium", "calico",
        "opa", "cosign", "sigstore", "vault", "age", "sops", "spiffe", "spire",
    )),
    ("language_parsing", (
        "tree-sitter", "semgrep", "ast-grep", "antlr", "bison", "flex", "rust-analyzer",
        "ccls", "clangd", "pyright", "mypy",
    )),
    ("desktop_shell", (
        "qt", "gtk", "sway", "i3", "wayfire", "river", "dwl", "x11", "xorg",
        "winit", "tauri", "electron", "wails", "iced", "slint", "dioxus",
    )),
]

# Local project -> the GitHub repository that is its upstream.
LOCAL_TO_REMOTE = {
    "Aetherius-OS": "Aetherius-OS",
    "Genesis": "Genesis",
    "Agent-Bridge": "Agent-Bridge",
    "IDE-Workspace": "IDE-Workspace",
    "Poietek": "Poietek",
    "Materials-Atlas-Table-Codex---MAT": "Materials-Atlas-Table-Codex---MAT",
    "Universal-Bridge": "Universal-Bridge",
}


def fetch_repos() -> list[dict]:
    fields = ("name,description,primaryLanguage,stargazerCount,forkCount,"
              "diskUsage,pushedAt,isFork,isPrivate,url,defaultBranchRef")
    for attempt in range(4):
        try:
            out = subprocess.run(
                ["gh", "repo", "list", OWNER, "--limit", "600", "--json", fields],
                capture_output=True, text=True, timeout=300,
            )
            if out.returncode == 0 and out.stdout.strip().startswith("["):
                data = json.loads(out.stdout)
                return data if isinstance(data, list) else [data]
        except Exception:
            pass
    raise SystemExit("could not fetch the repository list from GitHub")


def axis_for(name: str, description: str) -> str:
    haystack = f"{name} {description}".lower()
    for axis, needles in AXIS_RULES:
        for needle in needles:
            if needle in haystack:
                return axis
    return "unclassified"


def yaml_escape(text: str) -> str:
    return '"' + str(text).replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ") + '"'


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(REPO / "docs" / "REPO-REGISTRY.yaml"))
    args = ap.parse_args()

    repos = fetch_repos()
    own = [r for r in repos if not r["isFork"]]
    forks = [r for r in repos if r["isFork"]]

    by_axis: dict[str, int] = {}
    by_lang: dict[str, int] = {}
    for r in forks:
        a = axis_for(r["name"], r.get("description") or "")
        by_axis[a] = by_axis.get(a, 0) + 1
        lang = (r.get("primaryLanguage") or {}).get("name") or "unclassified"
        by_lang[lang] = by_lang.get(lang, 0) + 1

    lines: list[str] = []
    lines.append("# " + "=" * 76)
    lines.append("# GITHUB REPOSITORY REGISTRY")
    lines.append("# " + "=" * 76)
    lines.append("# GENERATED by tools/generate_repo_registry.py.")
    lines.append("#")
    lines.append("# The account holds two kinds of repository and they do different")
    lines.append("# jobs. Own repositories are the upstream for the local projects.")
    lines.append("# Forked repositories are the prior art: reference implementations of")
    lines.append("# mechanisms somebody else built, kept so the first-party work can be")
    lines.append("# compared against them. The forks are what the reverse-engineering")
    lines.append("# work reads from.")
    lines.append("#")
    lines.append("A fork's axis records which capability it informs. An unclassified")
    lines.append("fork is a finding: it is reference material that nobody has decided")
    lines.append("what it is for.")
    lines.append("# " + "=" * 76)
    lines.append('schema_version: "1.0.0"')
    lines.append(f'source_date: "{datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")}"')
    lines.append(f'owner: "{OWNER}"')
    lines.append("")
    lines.append("totals:")
    lines.append(f"  repositories: {len(repos)}")
    lines.append(f"  own: {len(own)}")
    lines.append(f"  forks: {len(forks)}")
    lines.append(f"  total_stars: {sum(r.get('stargazerCount') or 0 for r in repos)}")
    lines.append(f"  total_size_kb: {sum(r.get('diskUsage') or 0 for r in repos)}")
    lines.append("")
    lines.append("forks_by_axis:")
    for axis in sorted(by_axis):
        lines.append(f"  {axis}: {by_axis[axis]}")
    lines.append("")
    lines.append("forks_by_language:")
    for lang in sorted(by_lang, key=lambda k: -by_lang[k]):
        lines.append(f"  {lang}: {by_lang[lang]}")
    lines.append("")
    lines.append("own_repositories:")
    for r in sorted(own, key=lambda x: x["name"].lower()):
        lines.append(f"  - name: {yaml_escape(r['name'])}")
        if r.get("description"):
            lines.append(f"    description: {yaml_escape(r['description'])}")
        lang = (r.get("primaryLanguage") or {}).get("name")
        if lang:
            lines.append(f"    language: {lang}")
        lines.append(f"    stars: {r.get('stargazerCount') or 0}")
        lines.append(f"    size_kb: {r.get('diskUsage') or 0}")
        lines.append(f"    pushed_at: {r.get('pushedAt') or ''}")
        lines.append(f"    url: {yaml_escape(r.get('url') or '')}")
        local = [k for k, v in LOCAL_TO_REMOTE.items() if v == r["name"]]
        if local:
            lines.append(f"    local_project: {local[0]}")
    lines.append("")
    lines.append("forks:")
    for r in sorted(forks, key=lambda x: x["name"].lower()):
        lines.append(f"  - name: {yaml_escape(r['name'])}")
        if r.get("description"):
            lines.append(f"    description: {yaml_escape(r['description'])}")
        lang = (r.get("primaryLanguage") or {}).get("name")
        if lang:
            lines.append(f"    language: {lang}")
        lines.append(f"    axis: {axis_for(r['name'], r.get('description') or '')}")
        lines.append(f"    size_kb: {r.get('diskUsage') or 0}")
        lines.append(f"    pushed_at: {r.get('pushedAt') or ''}")
        lines.append(f"    url: {yaml_escape(r.get('url') or '')}")

    out = Path(args.out)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out}")
    print(f"  {len(own)} own, {len(forks)} forks")
    for axis in sorted(by_axis):
        print(f"  {axis}: {by_axis[axis]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
