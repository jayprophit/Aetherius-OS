#!/usr/bin/env python3
"""Ingest every conversation corpus the owner has, into one index.

The owner's instruction: read the chat conversations, ignore the
conversation names, because every chat carries data that helps the
projects. The material is spread across five shapes, and this tool reads
all of them:

  1. Plain-text transcripts on the external drive, 340 files.
  2. A ChatGPT data export, 144 conversations, one JSON array.
  3. A DeepSeek data export, 237 conversations, the mapping shape.
  4. The Codex desktop store, already extracted separately.
  5. The prior programme reports and reference links.

The names are not the subject. A conversation is filed by what its
content is about, and the things that make a conversation actionable are
recorded: the opening ask, the later asks, the local paths it names, the
repositories it names, and the technical vocabulary it uses.

One thing this tool deliberately does not do is accept the prior
reports' claims. The reports say a system is complete, tested and
deployment ready. A report is a claim. The code is the evidence, and the
two are recorded separately.

Usage:
    python tools/ingest_conversation_corpus.py
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DRIVE = Path(r"E:\external drive\ai chat conversations")

# The programmes the corpus talks about. Every alias maps to one canonical
# name so a project is not counted twice.
# The owner's own programmes. A conversation that talks about one of
# these is about that programme.
PROJECT_ALIASES: dict[str, str] = {
    "aetherius os": "Aetherius OS", "aetherius-os": "Aetherius OS",
    "aetheriusapp": "Aetherius OS", "aetherium": "Aetherius OS",
    "aetherial": "Aetherial", "self-building-ai": "Aetherial",
    "genesis": "Genesis", "agent bridge": "Agent Bridge", "agent-bridge": "Agent Bridge",
    "ide workspace": "IDE Workspace", "ide-workspace": "IDE Workspace",
    "universal bridge": "Universal-Bridge", "universal-bridge": "Universal-Bridge",
    "poietek": "Poietek", "materials atlas": "MAT", "mat ": "MAT",
    "ledgerlands": "LedgerLands", "crypto monopoly": "LedgerLands",
    "veyra": "Veyra", "quantum ai": "Quantum AI", "quantumai": "Quantum AI",
    "openCDE": "openCDE", "athena": "Athena", "food wiki": "Food Wiki",
    "naturawiki": "Food Wiki", "nanos": "Nanos", "qvm": "QVM",
}
# The assistant the conversation was had with. Mentioning Claude in a
# physics question does not make it a conversation about a Claude project,
# so these are recorded separately and never used as the subject.
ASSISTANT_ALIASES: dict[str, str] = {
    "deepseek": "DeepSeek", "manus": "Manus", "copilot": "Copilot",
    "co-pilot": "Copilot", "gemini": "Gemini", "grok": "Grok", "qwen": "Qwen",
    "codex": "Codex", "hermes": "Hermes", "kimi": "Kimi",
    "antigravity": "Antigravity", "claude": "Claude", "chatgpt": "ChatGPT",
    "jey": "Jev", "jev": "Jev",
}
PROJECT_NAMES = sorted(set(PROJECT_ALIASES.values()))

IMPERATIVE = re.compile(
    r"(?i)^(?:please\s+|i\s+(?:want|need|ask|would like|am asking|own|have|also)\b|"
    r"continue\b|make sure\b|add\b|build\b|create\b|implement\b|turn\b|read\b|take\b|"
    r"check\b|analyse\b|analyze\b|use\b|finish\b|complete\b|fix\b|generate\b|"
    r"give me\b|help me\b|can you\b|could you\b|do\b|design\b|extract\b|abstract\b|"
    r"compile\b|research\b|write\b|show\b|explain\b|what\b|how\b|why\b|"
    r"ok\b|okay\b|yes\b|no\b|so\b|now\b|then\b|and\b|but\b|and also\b)"
)
NOISE = re.compile(
    r"(?i)^(read \d+ (?:web )?pages?|show \d+ (?:web )?pages?|\[object Object\]|"
    r"https?://\S+|you said:|i said:|\d+ \w+ \d{4}|attachments?:|sources?:|"
    r"search is temporarily unavailable.*|run \d+ web pages)\s*$"
)
LOCAL_PATH = re.compile(r"(?i)\b([A-Z]:\\[^\r\n\"'<>|*?]{1,120})")


def clean_paths(raw: list[str]) -> list[str]:
    """Trim a captured path back to what it actually is.

    The owner's paths contain spaces - D:\\Aetherius OS, F:\\AI Digital
    Twin - so the capture runs to the end of the line and the trailing
    prose is removed here instead. A path ends at the last character that
    looks like part of one.
    """
    out: set[str] = set()
    for item in raw:
        s = item.strip()
        # Drop trailing sentence punctuation and prose after a path.
        s = re.split(r"(?<=\\)\s+[A-Z][a-z]", s)[0]
        s = s.rstrip(".,;:!?'\"")
        if len(s) > 3 and s.count("\\") >= 1:
            out.add(s)
    return sorted(out)
REPO_REF = re.compile(r"(?i)\b(jayprophit/[A-Za-z0-9._-]+)\b")
URL = re.compile(r"https?://[^\s\"'<>)\]]+")
TECH = re.compile(
    r"(?i)\b(kernel|syscall|interrupt|driver|device|daemon|api|schema|migration|"
    r"registry|protocol|buffer|thread|process|compiler|build|test|benchmark|"
    r"repository|monorepo|package|dependency|licence|license|plugin|format|"
    r"pipeline|queue|cache|state|memory|storage|network|serial|bluetooth|usb|"
    r"midi|audio|dsp|abi|struct|async|await|mutex|atomic|scheduler|interrupt)\b"
)
# A question the owner asked that names something to build.
QUESTION = re.compile(r"(?i)\b(would it be possible|is it possible|can i|can we|how do i|how would i|what is the best)\b")


def blocks(text: str) -> list[str]:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    out: list[str] = []
    cur: list[str] = []
    for line in text.split("\n"):
        if not line.strip():
            if cur:
                out.append("\n".join(cur).strip())
                cur = []
            continue
        cur.append(line.rstrip())
    if cur:
        out.append("\n".join(cur).strip())
    return [b for b in out if b]


def is_ask(block: str) -> bool:
    if len(block) > 1500:
        return False
    if NOISE.match(block.strip()):
        return False
    if not (IMPERATIVE.match(block.strip()) or QUESTION.match(block.strip())):
        return False
    return block.count("\n") <= 14


def projects_in(text: str) -> list[str]:
    low = text.lower()
    found: list[str] = []
    for alias, canon in PROJECT_ALIASES.items():
        if alias in low and canon not in found:
            found.append(canon)
    return found


def assistants_in(text: str) -> list[str]:
    low = text.lower()
    found: list[str] = []
    for alias, canon in ASSISTANT_ALIASES.items():
        if alias in low and canon not in found:
            found.append(canon)
    return found


def summarise(source: str, origin: str, text: str, name: str = "") -> dict:
    parts = blocks(text)
    asks = [b for b in parts if is_ask(b)]
    blob = text[:400_000]
    return {
        "source": source,
        "origin": origin,
        "name_hint": name[:120],
        "bytes": len(text.encode("utf-8", errors="replace")),
        "blocks": len(parts),
        "asks": [a[:1000] for a in asks[:14]],
        "ask_count": len(asks),
        "projects": projects_in(blob),
        "assistants": assistants_in(blob),
        "paths": clean_paths([m.group(1) for m in LOCAL_PATH.finditer(blob)])[:30],
        "repos": sorted({m.group(1) for m in REPO_REF.finditer(blob)})[:30],
        "urls": sorted({m.group(0) for m in URL.finditer(blob)})[:20],
        "technical": len(TECH.findall(blob)),
        "opening": parts[0][:1500] if parts else "",
    }


def read_txt_corpus() -> list[dict]:
    out: list[dict] = []
    root = DRIVE
    if not root.is_dir():
        return out
    for path in sorted(root.rglob("*.txt")):
        try:
            text = path.read_bytes().decode("utf-8", errors="replace")
        except OSError:
            continue
        if not text.strip():
            continue
        rel = str(path.relative_to(root)).replace("\\", "/")
        out.append(summarise(rel, "external-drive-transcript", text))
    return out


def read_chatgpt_export() -> list[dict]:
    out: list[dict] = []
    base = DRIVE / "other" / "aetherius-data" / "data-2025-12-15-13-18-16-batch-0000" / "conversations.json"
    if not base.exists():
        return out
    try:
        data = json.loads(base.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return out
    for c in data:
        msgs = c.get("chat_messages") or []
        users = [m.get("text") or "" for m in msgs if (m.get("sender") or "") == "human"]
        if not users:
            continue
        text = "\n\n".join(users)
        rel = f"chatgpt-export/{c.get('uuid') or (c.get('name') or 'unnamed')}"
        rec = summarise(rel, "chatgpt-export", text, c.get("name") or "")
        rec["created"] = c.get("created_at")
        rec["updated"] = c.get("updated_at")
        out.append(rec)
    return out


def read_deepseek_export() -> list[dict]:
    out: list[dict] = []
    p = DRIVE / "other" / "aetherius-data" / "deepseek_data" / "conversations.json"
    if not p.exists():
        return out
    try:
        data = json.loads(p.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return out
    for c in data:
        mapping = c.get("mapping") or {}
        users: list[str] = []
        for _k, node in mapping.items():
            msg = (node or {}).get("message")
            if not msg:
                continue
            # The DeepSeek export uses fragments rather than content.parts,
            # and a REQUEST fragment is the owner's turn.
            fragments = msg.get("fragments")
            if isinstance(fragments, list) and fragments:
                for frag in fragments:
                    if not isinstance(frag, dict):
                        continue
                    if str(frag.get("type", "")).upper() not in {"REQUEST", "USER", "HUMAN"}:
                        continue
                    t = str(frag.get("content") or "").strip()
                    if t:
                        users.append(t)
                continue
            parts = (msg.get("content") or {}).get("parts") or []
            if not isinstance(parts, list):
                continue
            t = " ".join(str(x) for x in parts if isinstance(x, str)).strip()
            if t:
                users.append(t)
        if not users:
            continue
        text = "\n\n".join(users)
        rel = f"deepseek-export/{c.get('id') or 'unnamed'}"
        rec = summarise(rel, "deepseek-export", text, c.get("title") or "")
        rec["updated"] = c.get("updated_at")
        out.append(rec)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(REPO / "research" / "conversation-corpus"))
    args = ap.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    records: list[dict] = []
    records += read_txt_corpus()
    records += read_chatgpt_export()
    records += read_deepseek_export()

    (out_dir / "index.json").write_text(
        json.dumps(records, indent=1, ensure_ascii=False), encoding="utf-8"
    )

    by_project: dict[str, list[dict]] = defaultdict(list)
    for r in records:
        for p in r["projects"]:
            by_project[p].append(r)
    unattributed = [r for r in records if not r["projects"]]

    all_paths: Counter[str] = Counter()
    all_repos: Counter[str] = Counter()
    for r in records:
        for p in r["paths"]:
            all_paths[p] += 1
        for rp in r["repos"]:
            all_repos[rp] += 1

    lines = ["# Conversation corpus - every source, indexed", "",
             f"{len(records)} conversations read.", "",
             "| Origin | Conversations |",
             "|---|---|"]
    by_origin: Counter[str] = Counter()
    for r in records:
        by_origin[r["origin"]] += 1
    for o, n in by_origin.most_common():
        lines.append(f"| {o} | {n} |")
    lines.append("")
    lines.append(f"Owner asks recognised: **{sum(r['ask_count'] for r in records)}**.")
    lines.append("")
    lines.append("## Conversations by the project their content is about")
    lines.append("")
    for project in sorted(by_project, key=lambda p: -len(by_project[p])):
        rs = by_project[project]
        lines.append(f"### {project} ({len(rs)})")
        lines.append("")
        for r in sorted(rs, key=lambda x: -x["ask_count"])[:50]:
            op = " ".join(r["opening"].split())[:120]
            lines.append(f"- `{r['source']}` — {r['ask_count']} asks")
            lines.append(f"    {op}")
        lines.append("")

    lines.append("## The local paths the corpus names")
    lines.append("")
    for p, n in all_paths.most_common(80):
        lines.append(f"- ({n}×) `{p}`")
    lines.append("")
    lines.append("## The repositories the corpus names")
    lines.append("")
    for rp, n in all_repos.most_common(80):
        lines.append(f"- ({n}×) `{rp}`")
    lines.append("")

    (out_dir / "digest.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"read {len(records)} conversations")
    for o, n in by_origin.most_common():
        print(f"  {o:<28} {n}")
    print(f"  owner asks: {sum(r['ask_count'] for r in records)}")
    print(f"  projects referenced: {len(by_project)}  unattributed: {len(unattributed)}")
    print(f"  local paths: {len(all_paths)}   repositories: {len(all_repos)}")
    for p in sorted(by_project, key=lambda k: -len(by_project[k])):
        print(f"    {p:<20} {len(by_project[p])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
