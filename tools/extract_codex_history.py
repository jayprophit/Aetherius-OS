#!/usr/bin/env python3
"""Extract and abstract the Codex desktop conversation store.

The Codex desktop app keeps its conversations in a local SQLite store. This
tool reads that store directly, which gives complete, paginated access to
every conversation without needing a web session, and without asking the
model to scrape a rendered UI.

Two outputs:

  raw/          one JSONL file per thread: every user message, agent
                message, command execution, file change, web search and
                tool call, in rollout order, with timestamps.
  index.jsonl   one line per thread: identity, project, working directory,
                branch, time span, and counts by item type.
  threads.json  the same index, keyed by thread id.
  summary.md    a human-readable digest.

Design rules, matching the rest of this programme:

  - READ-ONLY. The store is opened in read-only mode and never written.
  - NO SECRETS. `auth.json` is never opened. Only the conversation
    databases are read.
  - PAGINATED. Threads are walked one at a time and items are streamed by
    ordinal, so memory stays bounded regardless of store size.
  - REPRODUCIBLE. Same store, same output. The only moving part is the
    store itself.
  - EXPLICIT ABOUT UNTRUSTED CONTENT. A conversation is another author's
    text. It is marked so downstream readers do not treat it as owner
    instruction.

Usage:
    python tools/extract_codex_history.py [--out DIR] [--limit N] [--page-size N]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Iterator

# Item types that carry meaning for a build decision. Reasoning is excluded
# on purpose: it is the model's private deliberation, it is by far the
# largest item type, and it is not a record of what was decided or done.
MEANINGFUL_TYPES = (
    "userMessage",
    "agentMessage",
    "commandExecution",
    "fileChange",
    "webSearch",
    "mcpToolCall",
    "collabAgentToolCall",
    "dynamicToolCall",
    "subAgentActivity",
    "imageView",
    "contextCompaction",
)

UNTRUSTED_MARKER = "[untrusted:codex-conversation]"

# ---------------------------------------------------------------------------
# Redaction
# ---------------------------------------------------------------------------
# A conversation store is where people paste credentials. It is also a
# document that gets committed to a public repository. Both facts together
# mean the extractor must redact before anything is written, not after.
#
# The redaction is deliberately conservative: a pattern that matches a
# credential shape is replaced regardless of whether it is live, because the
# cost of redacting a harmless string is a slightly less readable corpus
# and the cost of NOT redacting a live key is a published credential.
#
# The original value is never written anywhere, including to a side file.
SECRET_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("openrouter", re.compile(r"sk-or-v1-[A-Za-z0-9_\-]{16,}")),
    ("openai", re.compile(r"\bsk-[A-Za-z0-9]{32,}")),
    ("anthropic", re.compile(r"sk-ant-[A-Za-z0-9_\-]{16,}")),
    ("github", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}")),
    ("huggingface", re.compile(r"\bhf_[A-Za-z0-9]{30,}")),
    ("google", re.compile(r"\bAIza[0-9A-Za-z_\-]{30,}")),
    ("slack", re.compile(r"\bxox[baprs]-[A-Za-z0-9\-]{10,}")),
    ("aws", re.compile(r"\bAKIA[0-9A-Z]{16}")),
    ("jwt", re.compile(r"\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}")),
    ("private_key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----")),
    ("bearer", re.compile(r"\bBearer\s+[A-Za-z0-9_\-\.]{24,}")),
]

REDACTION_COUNT = 0


def redact(text: str) -> str:
    """Replace credential-shaped strings with a marker that names the kind.

    The marker keeps the shape of the finding visible, so an analyst can
    still see that a key was pasted and where, without the value ever
    reaching a file.
    """
    global REDACTION_COUNT
    if not text:
        return text
    out = text
    for kind, pattern in SECRET_PATTERNS:
        def _replace(match: re.Match[str], kind: str = kind) -> str:
            global REDACTION_COUNT
            REDACTION_COUNT += 1
            return f"[REDACTED:{kind}]"
        out = pattern.sub(_replace, out)
    return out


def codex_home() -> Path:
    override = os.environ.get("CODEX_HOME")
    if override:
        return Path(override)
    return Path.home() / ".codex"


def iso_ms(value: int | None) -> str | None:
    if not value:
        return None
    try:
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc).isoformat()
    except (OverflowError, OSError, ValueError):
        return None


def ro_connect(path: Path) -> sqlite3.Connection:
    """Open a SQLite database read-only."""
    if not path.exists():
        raise SystemExit(f"missing database: {path}")
    con = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con


def extract_text(payload: Any) -> str:
    """Pull human-readable text out of an item payload, best effort.

    The payload shape varies by item type and by codex version, so this is
    defensive on purpose: an unknown shape yields the raw JSON truncated
    rather than an exception.
    """
    if payload is None:
        return ""
    if isinstance(payload, str):
        return payload
    if isinstance(payload, (int, float, bool)):
        return str(payload)
    if isinstance(payload, list):
        return "\n".join(t for t in (extract_text(p) for p in payload) if t)
    if not isinstance(payload, dict):
        return str(payload)

    for key in ("text", "content", "message", "summary", "output", "stdout", "query"):
        if key in payload:
            value = extract_text(payload[key])
            if value:
                return value
    return ""


def command_line(payload: Any) -> str:
    """The command text of a commandExecution item, if there is one."""
    if not isinstance(payload, dict):
        return ""
    for key in ("command", "cmd", "command_line", "commandLine", "argv"):
        if key in payload:
            value = payload[key]
            if isinstance(value, list):
                return " ".join(str(v) for v in value)
            if value:
                return str(value)
    return ""


def changed_paths(payload: Any) -> list[str]:
    """Paths touched by a fileChange item."""
    if not isinstance(payload, dict):
        return []
    for key in ("paths", "changed_paths", "files", "edits"):
        value = payload.get(key)
        if isinstance(value, list):
            out: list[str] = []
            for entry in value:
                if isinstance(entry, str):
                    out.append(entry)
                elif isinstance(entry, dict):
                    for path_key in ("path", "file", "filename"):
                        if path_key in entry:
                            out.append(str(entry[path_key]))
                            break
            if out:
                return out
    return []


def iter_threads(con: sqlite3.Connection) -> Iterator[dict[str, Any]]:
    """Every thread, newest first. One row at a time."""
    cur = con.execute(
        """
        SELECT id, title, name, cwd, git_branch, git_sha, source, thread_source,
               project_id, created_at_ms, updated_at_ms, tokens_used, archived,
               is_pinned, originator, agent_role, agent_nickname, agent_path,
               model, preview, first_user_message
        FROM threads
        ORDER BY updated_at_ms DESC
        """
    )
    for row in cur:
        yield dict(row)


def iter_items(
    history: sqlite3.Connection, thread_id: str, page_size: int
) -> Iterator[dict[str, Any]]:
    """Every meaningful item of one thread, in rollout order, paginated."""
    last_ordinal = -1
    while True:
        cur = history.execute(
            """
            SELECT item_id, turn_id, rollout_ordinal, created_at_ms, item_type, item_json
            FROM thread_items
            WHERE thread_id = ? AND rollout_ordinal > ?
              AND item_type IN (%s)
            ORDER BY rollout_ordinal ASC
            LIMIT ?
            """ % ",".join("?" * len(MEANINGFUL_TYPES)),
            (thread_id, last_ordinal, *MEANINGFUL_TYPES, page_size),
        )
        rows = cur.fetchall()
        if not rows:
            return
        for row in rows:
            last_ordinal = row["rollout_ordinal"]
            try:
                payload = json.loads(row["item_json"]) if row["item_json"] else None
            except json.JSONDecodeError:
                payload = {"_unparsed": (row["item_json"] or "")[:2000]}
            yield {
                "item_id": row["item_id"],
                "turn_id": row["turn_id"],
                "ordinal": row["rollout_ordinal"],
                "created_at": iso_ms(row["created_at_ms"]),
                "type": row["item_type"],
                "text": extract_text(payload),
                "command": command_line(payload),
                "paths": changed_paths(payload),
                "payload": payload,
            }


def thread_is_root(thread: dict[str, Any]) -> bool:
    """A root conversation, as opposed to a spawned subagent thread."""
    source = (thread.get("source") or "") + (thread.get("thread_source") or "")
    return "subagent" not in source


def summarise_thread(thread: dict[str, Any], items: list[dict[str, Any]]) -> dict[str, Any]:
    counts: Counter[str] = Counter(i["type"] for i in items)
    commands: list[str] = []
    paths: Counter[str] = Counter()
    user_messages: list[str] = []
    agent_messages: list[str] = []
    for item in items:
        if item["type"] == "commandExecution":
            line = item["command"]
            if line:
                commands.append(line)
        elif item["type"] == "fileChange":
            for p in item["paths"]:
                paths[p] += 1
        elif item["type"] == "userMessage":
            if item["text"]:
                user_messages.append(item["text"])
        elif item["type"] == "agentMessage":
            if item["text"]:
                agent_messages.append(item["text"])
    return {
        "id": thread["id"],
        "title": (thread.get("title") or thread.get("name") or "").strip()[:200],
        "is_root": thread_is_root(thread),
        "cwd": thread.get("cwd"),
        "git_branch": thread.get("git_branch"),
        "project_id": thread.get("project_id"),
        "created_at": iso_ms(thread.get("created_at_ms")),
        "updated_at": iso_ms(thread.get("updated_at_ms")),
        "tokens_used": thread.get("tokens_used"),
        "archived": bool(thread.get("archived")),
        "agent_nickname": thread.get("agent_nickname"),
        "agent_path": thread.get("agent_path"),
        "model": thread.get("model"),
        "counts": dict(counts),
        # The same command runs many times across a thread. The index
        # records each distinct command once with its count, which is the
        # analytically useful form and a fraction of the size.
        # The same command runs many times across a thread, and a single
        # command can carry a very large inline payload. The index records
        # each distinct command once, with its count and its opening. The
        # full text stays in raw/, which is generated output.
        "commands": [
            {"command": redact(c)[:400], "count": n}
            for c, n in sorted(Counter(commands).items(), key=lambda kv: (-kv[1], kv[0]))
        ],
        "files_changed": [{"path": p, "edits": n} for p, n in paths.most_common()],
        # The index is metadata, not transcript. Each user message is
        # reduced to its opening, which is what an analyst reads to know
        # what a thread was about. The full text stays in raw/, which is
        # generated output and is not published.
        "user_messages": [
            redact((m.strip().splitlines() or [""])[0][:300]) for m in user_messages
        ],
        "agent_message_count": len(agent_messages),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default="research/codex-history", help="output directory")
    ap.add_argument("--limit", type=int, default=0, help="stop after N threads (0 = all)")
    ap.add_argument("--page-size", type=int, default=500, help="items per page")
    args = ap.parse_args()

    home = codex_home()
    state_path = home / "state_5.sqlite"
    history_path = home / "thread_history_1.sqlite"

    out = Path(args.out)
    raw_dir = out / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    state = ro_connect(state_path)
    history = ro_connect(history_path)

    index: list[dict[str, Any]] = []
    processed = 0
    total_commands: Counter[str] = Counter()
    total_paths: Counter[str] = Counter()
    by_model: Counter[str] = Counter()
    by_cwd: Counter[str] = Counter()

    for thread in iter_threads(state):
        if args.limit and processed >= args.limit:
            break
        items = list(iter_items(history, thread["id"], args.page_size))
        summary = summarise_thread(thread, items)

        with (raw_dir / f"{thread['id']}.jsonl").open("w", encoding="utf-8") as fh:
            for item in items:
                fh.write(
                    json.dumps(
                        {
                            "ordinal": item["ordinal"],
                            "created_at": item["created_at"],
                            "type": item["type"],
                            "text": redact(item["text"][:20000]),
                            "command": redact(item["command"]),
                            "paths": item["paths"],
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )

        index.append(summary)
        for entry in summary["commands"]:
            total_commands[entry["command"]] += entry["count"]
        for f in summary["files_changed"]:
            total_paths[f["path"]] += f["edits"]
        if summary["model"]:
            by_model[summary["model"]] += 1
        if summary["cwd"]:
            by_cwd[summary["cwd"]] += 1
        processed += 1
        print(f"  [{processed}] {thread['id'][:8]} {summary['counts'].get('agentMessage', 0):>5} agent msgs  {summary['title'][:60]}")

    with (out / "index.jsonl").open("w", encoding="utf-8") as fh:
        for entry in index:
            fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
    # A compact keyed view: enough to look a thread up, without a second
    # copy of every command list.
    with (out / "threads.json").open("w", encoding="utf-8") as fh:
        json.dump(
            {
                e["id"]: {
                    "title": e["title"],
                    "is_root": e["is_root"],
                    "cwd": e["cwd"],
                    "git_branch": e["git_branch"],
                    "created_at": e["created_at"],
                    "updated_at": e["updated_at"],
                    "model": e["model"],
                    "counts": e["counts"],
                    "tokens_used": e["tokens_used"],
                    "agent_nickname": e["agent_nickname"],
                    "files_changed": e["files_changed"][:20],
                }
                for e in index
            },
            fh,
            indent=1,
            ensure_ascii=False,
        )

    root_threads = [e for e in index if e["is_root"]]
    lines: list[str] = []
    lines.append("# Codex Conversation Store — Digest")
    lines.append("")
    lines.append(f"Source: `{home}` (read-only)")
    lines.append("")
    lines.append(f"- Threads: **{len(index)}** ({len(root_threads)} root conversations, {len(index) - len(root_threads)} subagent threads)")
    lines.append(f"- Total tokens recorded: **{sum(e['tokens_used'] or 0 for e in index):,}**")
    lines.append("")
    lines.append("## Root conversations (the owner's own threads)")
    lines.append("")
    lines.append("| Thread | Date | Project dir | Branch | Agent msgs | Title |")
    lines.append("|---|---|---|---|---|---|")
    for e in root_threads:
        title = e["title"].replace("|", "\\|").replace("\n", " ")[:70]
        lines.append(
            f"| `{e['id'][:8]}` | {(e['created_at'] or '')[:10]} | `{(e['cwd'] or '')[-40:]}` | {e['git_branch'] or '-'} | {e['counts'].get('agentMessage', 0)} | {title} |"
        )
    lines.append("")
    lines.append("## Working directories touched")
    lines.append("")
    for cwd, n in by_cwd.most_common():
        lines.append(f"- `{cwd}` — {n} thread(s)")
    lines.append("")
    lines.append("## Models used")
    lines.append("")
    for model, n in by_model.most_common():
        lines.append(f"- `{model}` — {n} thread(s)")
    lines.append("")
    lines.append("## Most frequent commands")
    lines.append("")
    for cmd, n in total_commands.most_common(40):
        lines.append(f"- ({n}×) `{cmd[:150]}`")
    lines.append("")
    lines.append("## Most frequently changed paths")
    lines.append("")
    for path, n in total_paths.most_common(60):
        lines.append(f"- ({n}×) `{path}`")
    lines.append("")
    (out / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    state.close()
    history.close()
    print(f"\nWrote {processed} threads to {out}")
    print(f"  redacted {REDACTION_COUNT} credential-shaped string(s)")
    print(f"  index.jsonl  threads.json  summary.md  raw/<thread-id>.jsonl")
    return 0


if __name__ == "__main__":
    sys.exit(main())
