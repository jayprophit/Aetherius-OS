#!/usr/bin/env python3
"""Ingest the owner's external chat corpus.

The owner has 340 plain-text chat transcripts on an external drive, taken
from several assistants. The instruction was explicit: ignore the
conversation names and read the content, because every chat carries some
data that helps the projects, and the names are arbitrary.

So this tool does not use the file names as its subject. It reads each
transcript, pulls out what the owner actually asked for, and records the
things that make the conversation actionable:

  - the opening ask, which is what the conversation is for
  - the later asks, which are the corrections and refinements
  - every local path, project name, repository and URL mentioned
  - the technical vocabulary the conversation uses

The output is an index that can be searched, and a digest grouped by the
project each conversation touches. A conversation that names D:\\Aetherius
OS belongs to Aetherius OS whatever its file is called, and that is how it
is filed.

Usage:
    python tools/ingest_external_chats.py [--root "E:/external drive/ai chat conversations"]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEFAULT_ROOT = Path(r"E:\external drive\ai chat conversations")

# The owner's own turns are short, imperative, and lack the assistant's
# characteristic structure. A block that opens with an instruction and
# stays under a few sentences is the owner talking.
IMPERATIVE_START = re.compile(
    r"(?i)^(?:please\s+|i\s+(?:want|need|ask|would like|am asking|own|have)\b|"
    r"continue\b|make sure\b|add\b|build\b|create\b|implement\b|turn\b|read\b|take\b|"
    r"check\b|analyse\b|analyze\b|use\b|finish\b|complete\b|fix\b|generate\b|"
    r"give me\b|help me\b|can you\b|could you\b|do\b|design\b|extract\b|abstract\b|"
    r"compile\b|research\b|write\b|show\b|explain\b|what\b|how\b|why\b|"
    r"ok\b|okay\b|yes\b|no\b|so\b|now\b|then\b|also\b|and\b|but\b)"
)

# A path on this machine or a Windows drive.
LOCAL_PATH = re.compile(r"(?i)\b([A-Z]:\\(?:[^\s\"'<>|:*?\r\n\\/]+\\)*[^\s\"'<>|:*?\r\n\\/]*)")
# A repository reference.
REPO_REF = re.compile(r"(?i)\b(jayprophit/[A-Za-z0-9._-]+)\b")
# A URL.
URL = re.compile(r"https?://[^\s\"'<>)\]]+")
# The programmes the corpus talks about, by name.
KNOWN_PROJECTS = [
    "Aetherius OS", "Aetherius-OS", "Aetherial", "Genesis", "Agent Bridge", "Agent-Bridge",
    "IDE Workspace", "IDE-Workspace", "Universal-Bridge", "Universal Bridge", "Poietek",
    "Materials Atlas", "MAT ", "LedgerLands", "Crypto Monopoly", "Veyra", "Quantum AI",
    "openCDE", "Athena", "Food Wiki", "NaturaWiki", "Nanos", "QVM",
]
# Vocabulary that marks a conversation as technical and actionable.
TECH_VOCAB = re.compile(
    r"(?i)\b(kernel|syscall|interrupt|driver|device|daemon|api|schema|migration|"
    r"registry|protocol|buffer|thread|process|compiler|build|test|benchmark|"
    r"repository|monorepo|package|dependency|licence|license|plugin|format|"
    r"pipeline|queue|cache|state|memory|storage|network|serial|bluetooth|usb|"
    r"midi|audio|dsp|plugin|host|abi|struct|async|await|thread|mutex|atomic)\b"
)
# Non-content noise that should not be counted as an ask.
NOISE = re.compile(
    r"(?i)^(read \d+ (?:web )?pages?|show \d+ (?:web )?pages?|\[object Object\]|"
    r"https?://\S+|you said:|i said:|\d+ \w+ \d{4}|attachments?:|sources?:)\s*$"
)


def blocks(text: str) -> list[str]:
    """Split a transcript into blocks separated by blank lines."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    out: list[str] = []
    current: list[str] = []
    for line in text.split("\n"):
        if not line.strip():
            if current:
                out.append("\n".join(current).strip())
                current = []
            continue
        current.append(line.rstrip())
    if current:
        out.append("\n".join(current).strip())
    return [b for b in out if b]


def is_ask(block: str) -> bool:
    """Whether a block reads as the owner rather than the assistant."""
    if len(block) > 1200:
        return False
    if NOISE.match(block.strip()):
        return False
    if not IMPERATIVE_START.match(block.strip()):
        return False
    # The assistant tends to write in a structured, longer register.
    if block.count("\n") > 12:
        return False
    return True


def projects_in(text: str) -> list[str]:
    low = text.lower()
    found: list[str] = []
    for name in KNOWN_PROJECTS:
        if name.lower() in low:
            found.append(name.strip())
    # Collapse the alias pairs so one project is not counted twice.
    canon = {
        "aetherius os": "Aetherius OS", "aetherius-os": "Aetherius OS",
        "aetherial": "Aetherial", "agent bridge": "Agent Bridge", "agent-bridge": "Agent Bridge",
        "ide workspace": "IDE Workspace", "ide-workspace": "IDE Workspace",
        "universal bridge": "Universal-Bridge", "universal-bridge": "Universal-Bridge",
        "materials atlas": "MAT", "mat ": "MAT", "crypto monopoly": "LedgerLands",
        "quantum ai": "Quantum AI", "food wiki": "Food Wiki",
    }
    out: list[str] = []
    for n in found:
        key = canon.get(n.lower(), n)
        if key not in out:
            out.append(key)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", default=str(DEFAULT_ROOT))
    ap.add_argument("--out", default=str(REPO / "research" / "external-chats"))
    args = ap.parse_args()

    root = Path(args.root)
    if not root.is_dir():
        raise SystemExit(f"not found: {root}")

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    records: list[dict] = []
    read = 0
    for path in sorted(root.rglob("*.txt")):
        try:
            raw = path.read_bytes()
        except OSError:
            continue
        text = raw.decode("utf-8", errors="replace")
        if not text.strip():
            continue
        read += 1
        parts = blocks(text)
        asks = [b for b in parts if is_ask(b)]
        blob = text[:200_000]
        rel = str(path.relative_to(root)).replace("\\", "/")
        records.append({
            "source": rel,
            "bytes": len(raw),
            "blocks": len(parts),
            "asks": [a[:1200] for a in asks[:12]],
            "ask_count": len(asks),
            "projects": projects_in(blob),
            "paths": sorted({m.group(1) for m in LOCAL_PATH.finditer(blob)})[:25],
            "repos": sorted({m.group(1) for m in REPO_REF.finditer(blob)})[:25],
            "urls": sorted({m.group(0) for m in URL.finditer(blob)})[:15],
            "technical": len(TECH_VOCAB.findall(blob)),
            "opening": parts[0][:1500] if parts else "",
        })

    (out_dir / "index.json").write_text(
        json.dumps(records, indent=1, ensure_ascii=False), encoding="utf-8"
    )

    # Which project does each conversation belong to?
    by_project: dict[str, list[dict]] = defaultdict(list)
    for r in records:
        if r["projects"]:
            for p in r["projects"]:
                by_project[p].append(r)
        else:
            by_project["(unattributed)"].append(r)

    # Which local paths does the corpus actually touch?
    all_paths: Counter[str] = Counter()
    for r in records:
        for p in r["paths"]:
            all_paths[p] += 1
    all_repos: Counter[str] = Counter()
    for r in records:
        for rp in r["repos"]:
            all_repos[rp] += 1

    lines = ["# External chat corpus - ingestion", "",
             f"{len(records)} transcripts read, {sum(r['bytes'] for r in records):,} bytes.",
             f"{sum(r['ask_count'] for r in records)} owner asks recognised.",
             "",
             "The conversation names are not used as the subject. Each transcript",
             "is filed by the project its content talks about, and the local paths,",
             "repositories and URLs it mentions are recorded so the work can be",
             "traced back to where it was asked for.",
             "",
             "## Conversations by project",
             ""]
    for project in sorted(by_project, key=lambda p: -len(by_project[p])):
        rs = by_project[project]
        lines.append(f"### {project} ({len(rs)})")
        lines.append("")
        for r in sorted(rs, key=lambda x: -x["ask_count"])[:40]:
            opening = " ".join(r["opening"].split())[:130]
            lines.append(f"- `{r['source']}` — {r['ask_count']} asks, {r['bytes']:,} bytes")
            lines.append(f"    {opening}")
        lines.append("")

    lines.append("## The local paths the corpus touches")
    lines.append("")
    for p, n in all_paths.most_common(60):
        lines.append(f"- ({n}×) `{p}`")
    lines.append("")
    lines.append("## The repositories the corpus names")
    lines.append("")
    for rp, n in all_repos.most_common(60):
        lines.append(f"- ({n}×) `{rp}`")
    lines.append("")

    (out_dir / "digest.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"read {len(records)} transcripts from {root}")
    print(f"  owner asks recognised: {sum(r['ask_count'] for r in records)}")
    print(f"  projects referenced: {len([p for p in by_project if p != '(unattributed)'])}")
    print(f"  local paths referenced: {len(all_paths)}")
    print(f"  repositories referenced: {len(all_repos)}")
    for p in sorted(by_project, key=lambda x: -len(by_project[x])):
        print(f"    {p:<22} {len(by_project[p])} conversations")
    return 0


if __name__ == "__main__":
    sys.exit(main())
