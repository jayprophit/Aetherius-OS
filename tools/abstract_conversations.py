#!/usr/bin/env python3
"""Abstract the recovered conversations into per-thread digests.

The corpus is the owner's own working history: 71 Codex threads, thirteen
of which carry the owner's directives, and several of which are imported
ChatGPT project conversations in full. Reading it means two different
things, and this tool does both.

WHAT THE OWNER ASKED FOR is already recovered by the directive extractor
into owner-directives.txt. This tool does the other half.

WHERE THE WORK STOPPED. A conversation that was abandoned mid-task is the
most useful thing in the corpus, because the abandonment is a statement of
what was not finished. For every thread this records the last state the
agent reported, the requirement identifiers it touched, the files it
changed, and the checkpoints it left behind. That is the difference
between "there are 1,407 Agent Bridge tests" and "this specific thing
was still open when the thread ended".

The digests are written per thread and then rolled up, so a reader can
start from a thread or from the whole programme.

Usage:
    python tools/abstract_conversations.py [--out research/codex-history/digests]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CORPUS = REPO / "research" / "codex-history"

# Requirement identifiers, in the shapes the programme actually uses.
REQ_ID = re.compile(r"\bREQ-[A-Z0-9][A-Z0-9-]{2,}\b")
# Checkpoint and next-step markers the agents left behind.
CHECKPOINT = re.compile(
    r"(?im)^\s*(?:#+\s*)?(next (?:executable )?(?:todo|step|action)|"
    r"next_executable_todo|current[_ ]todo|resume (?:point|from)|checkpoint|"
    r"remaining|still (?:open|pending|needed)|not (?:yet )?implemented|"
    r"blocked (?:on|by)|blocker)\b.{0,240}"
)
# A statement that something was finished.
COMPLETED = re.compile(
    r"(?im)^\s*(?:#+\s*)?(done|complete[d]?|finished|passed|verified|shipped|"
    r"landed|committed|pushed)\b.{0,200}"
)


def load_index() -> dict[str, dict]:
    out: dict[str, dict] = {}
    path = CORPUS / "index.jsonl"
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        out[row["id"]] = row
    return out


def read_thread(path: Path) -> list[dict]:
    items: list[dict] = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if not line.strip():
            continue
        try:
            items.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return items


def summarise(thread_id: str, meta: dict, items: list[dict]) -> dict:
    user_messages: list[str] = []
    agent_messages: list[str] = []
    commands: list[str] = []
    files: Counter[str] = Counter()
    requirements: Counter[str] = Counter()
    checkpoints: list[str] = []
    completed: list[str] = []
    searches: list[str] = []

    for item in items:
        kind = item.get("type")
        text = item.get("text") or ""
        if kind == "userMessage":
            user_messages.append(text)
            for m in REQ_ID.findall(text):
                requirements[m] += 1
        elif kind == "agentMessage":
            agent_messages.append(text)
            for m in REQ_ID.findall(text):
                requirements[m] += 1
            for m in CHECKPOINT.finditer(text):
                line = " ".join(m.group(0).split())
                if line not in checkpoints:
                    checkpoints.append(line)
            for m in COMPLETED.finditer(text):
                line = " ".join(m.group(0).split())
                if line not in completed:
                    completed.append(line)
        elif kind == "commandExecution":
            if item.get("command"):
                commands.append(item["command"])
        elif kind == "fileChange":
            for p in item.get("paths") or []:
                files[p] += 1
        elif kind == "webSearch":
            if item.get("text"):
                searches.append(item["text"][:200])

    return {
        "id": thread_id,
        "title": meta.get("title", ""),
        "is_root": meta.get("is_root"),
        "created_at": meta.get("created_at"),
        "updated_at": meta.get("updated_at"),
        "cwd": meta.get("cwd"),
        "git_branch": meta.get("git_branch"),
        "model": meta.get("model"),
        "agent_nickname": meta.get("agent_nickname"),
        "user_message_count": len(user_messages),
        "agent_message_count": len(agent_messages),
        "command_count": len(commands),
        "file_change_count": sum(files.values()),
        "requirements_touched": sorted(requirements),
        "files_changed": [{"path": p, "edits": n} for p, n in files.most_common(30)],
        "last_agent_message": agent_messages[-1][:4000] if agent_messages else "",
        "first_agent_message": agent_messages[0][:1500] if agent_messages else "",
        "checkpoints": checkpoints[:25],
        "completed_markers": completed[:25],
        "web_searches": searches[:10],
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(CORPUS / "digests"))
    args = ap.parse_args()

    index = load_index()
    raw = CORPUS / "raw"
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    digests: list[dict] = []
    for path in sorted(raw.glob("*.jsonl")):
        items = read_thread(path)
        meta = index.get(path.stem, {})
        digests.append(summarise(path.stem, meta, items))

    for d in digests:
        (out_dir / f"{d['id']}.json").write_text(
            json.dumps(d, indent=1, ensure_ascii=False), encoding="utf-8"
        )

    # The roll-up across every thread.
    all_reqs: Counter[str] = Counter()
    all_files: Counter[str] = Counter()
    for d in digests:
        for r in d["requirements_touched"]:
            all_reqs[r] += 1
        for f in d["files_changed"]:
            all_files[f["path"]] += f["edits"]

    with_directives = [d for d in digests if d["user_message_count"] > 0]
    still_open = [d for d in with_directives if d["checkpoints"]]

    summary = {
        "thread_count": len(digests),
        "threads_with_owner_messages": len(with_directives),
        "threads_with_checkpoints": len(still_open),
        "requirements_touched": len(all_reqs),
        "most_touched_requirements": [{"id": k, "threads": v} for k, v in all_reqs.most_common(40)],
        "most_changed_files": [{"path": k, "edits": v} for k, v in all_files.most_common(40)],
        "threads": [
            {
                "id": d["id"],
                "title": (d["title"] or "")[:90],
                "updated_at": d["updated_at"],
                "owner_messages": d["user_message_count"],
                "checkpoints": len(d["checkpoints"]),
                "checkpoint_text": d["checkpoints"][:8],
                "last_agent_message": d["last_agent_message"][:600],
            }
            for d in sorted(with_directives, key=lambda x: x["updated_at"] or "", reverse=True)
        ],
    }
    (out_dir / "rollup.json").write_text(
        json.dumps(summary, indent=1, ensure_ascii=False), encoding="utf-8"
    )

    # A readable digest.
    lines = ["# Conversation digests", "",
             f"{len(digests)} threads, {len(with_directives)} carrying the owner's own",
             f"messages, {len(still_open)} leaving a checkpoint behind.",
             "", "## Where each thread stopped", ""]
    for d in sorted(with_directives, key=lambda x: x["updated_at"] or "", reverse=True):
        lines.append(f"### {d['id'][:8]} — {(d['title'] or '').replace(chr(10), ' ')[:90]}")
        lines.append("")
        lines.append(f"- dates: {(d['created_at'] or '')[:10]} to {(d['updated_at'] or '')[:10]}")
        lines.append(f"- owner messages: {d['user_message_count']}, agent messages: {d['agent_message_count']}")
        lines.append(f"- working directory: `{d['cwd']}`")
        if d["requirements_touched"]:
            lines.append(f"- requirements touched: {', '.join(d['requirements_touched'][:12])}")
        if d["checkpoints"]:
            lines.append("- checkpoints:")
            for c in d["checkpoints"][:6]:
                lines.append(f"    - {c[:200]}")
        if d["last_agent_message"]:
            lines.append("- last thing the agent said:")
            lines.append("")
            lines.append("```")
            lines.append(d["last_agent_message"][:1200])
            lines.append("```")
        lines.append("")

    (out_dir / "digests.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"wrote {len(digests)} digests to {out_dir}")
    print(f"  {len(with_directives)} threads carry owner messages")
    print(f"  {len(still_open)} of those left a checkpoint")
    print(f"  {len(all_reqs)} distinct requirement identifiers touched")
    return 0


if __name__ == "__main__":
    sys.exit(main())
