#!/usr/bin/env python3
"""Read what the conversations say about each project.

The owner has said the conversations explain the apps, the plugins, the
functions, the features and the mechanisms. This tool finds every
conversation that mentions a project and extracts what was asked about
it, so that the reorganisation is based on what the owner actually
wanted rather than on what a repository's README says.

The output for each project is grouped by what kind of statement it is:
a feature the owner asked for, a plugin or extension, a mechanism, an
architectural decision, or a decision about where it lives.

Usage:
    python tools/read_conversations_about.py [project ...]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# The projects the owner is reorganising, and the words that find them.
PROJECTS: dict[str, tuple[str, ...]] = {
    "crossplatform": ("crossplatform", "multiplatform", "cross platform"),
    "football-card-game": ("football card", "card game", "football-card"),
    "athena": ("athena",),
    "aetherial-platform": ("aetherial-platform", "aetherial platform"),
    "decentralized-messaging-app": ("decentralized messaging", "decentralised messaging",
                                    "decentralized message", "messaging app"),
    "food-wiki": ("food wiki", "fatawiki", "food-wiki", "nutrition wiki"),
    "hermes-config-audit": ("hermes", "config audit", "supervisor"),
    "aetherial": ("aetherial",),
    "ide-workspace": ("ide-workspace", "ide workspace"),
    "ledgerlands": ("ledgerlands", "ledger lands"),
    "niche-platform": ("niche_platform", "niche platform"),
    "poietek": ("poietek",),
    "quantum-os": ("quantum-os", "quantum os"),
    "self-building-ai": ("self-building-ai", "self building ai"),
    "universal-bridge": ("universal-bridge", "universal bridge"),
    "virtual-assistant": ("virtualassistant", "virtual assistant"),
    "web-platform": ("web-platform", "web platform", "webplatform"),
    "aetherius-os": ("aetherius os", "aetherius-os"),
    "genesis": ("genesis",),
}

# The kinds of statement the owner wants recovered.
KINDS: list[tuple[str, re.Pattern[str]]] = [
    ("feature", re.compile(
        r"(?i)\b(feature|add|support|implement|build|create|allow|should (?:be|have)|"
        r"want|need)\b")),
    ("plugin", re.compile(
        r"(?i)\b(plugin|extension|addon|module|integration|hook|api endpoint|"
        r"adapter|provider)\b")),
    ("mechanism", re.compile(
        r"(?i)\b(mechanism|how (?:it|they) work|workflow|process|algorithm|"
        r"architecture|pipeline|protocol|loop|engine)\b")),
    ("placement", re.compile(
        r"(?i)\b(part of|belongs to|inside|within|under|part of the|fold into|"
        r"merge into|dissolve|integrate into|combine)\b")),
    ("decision", re.compile(
        r"(?i)\b(decide|decision|must not|never|always|only if|rule|requirement|"
        r"should not)\b")),
]

# A block of owner text worth quoting.
BLOCK_SPLIT = re.compile(r"\n\s*\n")


def load_sources() -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    corpus = REPO / "research" / "conversation-corpus" / "index.json"
    if corpus.exists():
        for rec in json.loads(corpus.read_text(encoding="utf-8")):
            body = "\n\n".join([rec.get("opening", "")] + rec.get("asks", []))
            out.append((rec.get("source", "?"), body))
    api = REPO / "research" / "chatgpt-all-conversations.json"
    if api.exists():
        for rec in json.loads(api.read_text(encoding="utf-8")):
            body = "\n\n".join([rec.get("first", "")] + rec.get("later", []))
            out.append((f"chatgpt/{rec.get('id')}", body))
    codex = REPO / "research" / "codex-history"
    if codex.is_dir():
        for p in codex.rglob("*.txt"):
            try:
                out.append((f"codex/{p.name}", p.read_text(encoding="utf-8", errors="replace")))
            except OSError:
                pass
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("projects", nargs="*", help="project keys to read about")
    ap.add_argument("--out", default=str(REPO / "research" / "conversations"))
    args = ap.parse_args()

    wanted = [p.lower() for p in args.projects] if args.projects else list(PROJECTS)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    sources = load_sources()
    print(f"reading {len(sources)} conversation sources", flush=True)

    results: dict[str, dict] = {}
    for key in wanted:
        terms = PROJECTS.get(key)
        if not terms:
            print(f"  unknown project key: {key}")
            continue
        buckets: dict[str, list[tuple[str, str]]] = defaultdict(list)
        hits = 0
        for source, body in sources:
            low = body.lower()
            if not any(t in low for t in terms):
                continue
            hits += 1
            for block in BLOCK_SPLIT.split(body):
                b = " ".join(block.split())
                if not b or len(b) > 1200:
                    continue
                bl = b.lower()
                if not any(t in bl for t in terms):
                    continue
                for kind, rx in KINDS:
                    if rx.search(b):
                        buckets[kind].append((source, b))
                        break
        results[key] = {
            "sources": hits,
            "buckets": {k: v for k, v in buckets.items()},
        }
        print(f"  {key:<28} {hits} conversations, "
              f"{sum(len(v) for v in buckets.values())} statements")

    (out_dir / "project-conversations.json").write_text(
        json.dumps(results, indent=1, ensure_ascii=False), encoding="utf-8")

    lines = ["# What the conversations say about each project", "",
             f"{len(sources)} conversation sources were read. For each project the",
             "owner's own statements are grouped by what kind of statement they",
             "are: a feature asked for, a plugin or extension, a mechanism, a",
             "statement about where the project belongs, or a decision.", ""]
    for key, res in results.items():
        lines.append(f"## {key}")
        lines.append("")
        lines.append(f"{res['sources']} conversations mention it.")
        lines.append("")
        for kind, _rx in KINDS:
            items = res["buckets"].get(kind) or []
            if not items:
                continue
            lines.append(f"### {kind} ({len(items)})")
            lines.append("")
            seen: set[str] = set()
            for source, text in items:
                if text in seen:
                    continue
                seen.add(text)
                lines.append(f"- {text[:600]}")
                if len(seen) >= 30:
                    break
            lines.append("")
    (out_dir / "project-conversations.md").write_text("\n".join(lines) + "\n",
                                                       encoding="utf-8")
    print("wrote", out_dir / "project-conversations.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
