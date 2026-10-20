#!/usr/bin/env python3
"""Abstract the ChatGPT Genesis project conversations.

The owner asked for this explicitly: "take the data from all these chat
conversations in docs. use the data to help me finish building my
projects. this data is all useful."

The ChatGPT project named Genesis holds seventy-five conversations. This
tool extracts the owner's own words from them, and then does the thing
the owner also asked for: it looks for the predecessor names. The
programme's earlier selves are in here under other names - QVM, Veyra,
Quantum AI - and a conversation called "Test a theory" or "Bare Metal
Kernel MVP" is not obviously the same thread as one called "Veyra". The
predecessors have to be found, or the same work gets done twice.

Usage:
    python tools/abstract_chatgpt_genesis.py
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SOURCE = REPO / "research" / "chatgpt-genesis-project.json"
OUT_DIR = REPO / "research" / "chatgpt-genesis-project"

# The predecessor names. The programme was renamed several times, and the
# earlier selves are in the corpus under their own names.
PREDECESSORS = {
    "qvm": ["qvm", "quantum virtual machine", "quantum computing machine"],
    "veyra": ["veyra", "vra"],
    "quantum_ai": ["quantum ai", "quantumai", "quantum-ai"],
    "aetherial": ["aetherial"],
    "nanos": ["nanos", "nanos core"],
    "gaia": ["gaia"],
    "genesis_v1": ["genesis 1", "genesis v1", "genesis1"],
    "genesis_v2": ["genesis 2", "genesis v2", "genesis2"],
    "genesis_v3": ["genesis 3", "genesis v3", "genesis3"],
    "genesis_v4": ["genesis 4", "genesis v4", "genesis4"],
    "mvp_desktop": ["desktop mvp", "windows 11 mvp", "macos as mvp", "linux mvp"],
    "bare_metal": ["bare metal"],
    "touch_first": ["touch-first", "touch first"],
    "bitnet": ["bitnet"],
    "smart_mesh": ["smart mesh"],
    "jey": ["jev", "jey"],
    "genesis": ["genesis"],
    "aetherius": ["aetherius"],
}

# A sentence that asks for something. Matched per sentence, so the pattern
# anchors at a sentence start rather than at a line start.
ASK_START = re.compile(
    r"(?i)^(?:please\s+|i\s+(?:want|need|ask|would like|am asking|also)\s+|"
    r"continue\b|make sure\b|add\b|build\b|create\b|implement\b|turn\b|read\b|"
    r"take\b|check\b|analyse\b|analyze\b|use\b|finish\b|complete\b|fix\b|"
    r"generate\b|give me\b|help me\b|can you\b|could you\b|do\b|design\b|"
    r"extract\b|abstract\b|compile\b|research\b|write\b|show\b|explain\b|"
    r"what\b|how\b|why\b|where\b|which\b|when\b)"
)

# The operating rule the owner set, in their own words. It appears in the
# conversation and it is the programme's own build loop.
LOOP_MARKERS = [
    "UNDERSTAND", "OBSERVE", "RETRIEVE CONTEXT", "PLAN", "BUILD ONE BOUNDED UNIT",
    "RUN", "MEASURE", "TEST", "VERIFY", "CRITIQUE", "DIAGNOSE", "ADAPT", "RETEST",
    "RECORD", "COMMIT", "PUSH", "VERIFY REMOTE", "UPDATE TODO",
]


def normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def main() -> int:
    if not SOURCE.exists():
        raise SystemExit(f"missing {SOURCE}")
    data = json.loads(SOURCE.read_text(encoding="utf-8"))

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Where each predecessor name appears, and how much.
    hits: dict[str, list[dict]] = {k: [] for k in PREDECESSORS}
    for c in data:
        blob = " ".join([c.get("t") or "", c.get("first") or "", " ".join(c.get("later") or [])])
        low = blob.lower()
        for key, needles in PREDECESSORS.items():
            if any(n in low for n in needles):
                hits[key].append({"id": c["id"], "t": c.get("t", "")[:80]})

    # The owner's own asks, per conversation.
    directives: list[dict] = []
    for c in data:
        asks: list[str] = []
        for chunk in [c.get("first") or ""] + list(c.get("later") or []):
            for sentence in re.split(r"(?<=[.!?])\s+|\n+", chunk):
                s = normalise(sentence)
                if not (12 <= len(s) <= 600):
                    continue
                if not ASK_START.match(s):
                    continue
                if s not in asks:
                    asks.append(s)
        directives.append({
            "id": c["id"],
            "title": normalise(c.get("t", ""))[:110],
            "date": c.get("u", ""),
            "turns": c.get("turns", 0),
            "owner_messages": c.get("usern", 0),
            "opening": normalise(c.get("first") or "")[:900],
            "asks": asks[:12],
        })

    (OUT_DIR / "directives.json").write_text(
        json.dumps(directives, indent=1, ensure_ascii=False), encoding="utf-8"
    )
    (OUT_DIR / "predecessor-hits.json").write_text(
        json.dumps(hits, indent=1, ensure_ascii=False), encoding="utf-8"
    )

    # A readable digest.
    lines = [
        "CHATGPT GENESIS PROJECT - what the owner asked for",
        "=" * 72,
        f"{len(data)} conversations, "
        f"{sum(c.get('usern', 0) for c in data)} owner messages, "
        f"{sum(c.get('turns', 0) for c in data)} turns.",
        "",
        "The predecessor names, and where they appear.",
        "",
    ]
    for key in sorted(hits, key=lambda k: -len(hits[k])):
        titles = ", ".join(h["t"] for h in hits[key][:6])
        lines.append(f"  {key:<16} {len(hits[key]):>3} conversation(s): {titles}")
    lines.append("")
    lines.append("=" * 72)
    lines.append("")
    for d in directives:
        lines.append(f"--- {d['date']}  {d['title']}")
        lines.append(f"    {d['owner_messages']} owner messages over {d['turns']} turns")
        if d["opening"]:
            lines.append(f"    opening: {d['opening'][:400]}")
        for a in d["asks"][:5]:
            lines.append(f"      * {a[:260]}")
        lines.append("")

    (OUT_DIR / "digest.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"abstracted {len(directives)} conversations")
    print(f"  {sum(len(d['asks']) for d in directives)} distinct asks")
    print("  predecessor names found:")
    for key in sorted(hits, key=lambda k: -len(hits[k])):
        if hits[key]:
            print(f"    {key:<16} {len(hits[key])} conversation(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
