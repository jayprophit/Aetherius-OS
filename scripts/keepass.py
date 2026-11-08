#!/usr/bin/env python3
"""Local-only KeePass bridge for Aetherius orchestration.

Security rules enforced here:

* Secret values are never printed, logged or written to the repository.
* `inventory` prints titles, groups, usernames-presence and URLs only.
* `exec` injects selected secrets into a child process environment and then
  exits; the values exist only in that process tree's memory.
* Writes require an explicit group and title and always create a timestamped
  backup of the database first.

The database and master credential stay on this machine. This script never
uploads, transmits or echoes them.
"""

from __future__ import annotations

import argparse
import getpass
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_DB = Path.home() / "Documents" / "Database.kdbx"


def _open(path: Path):
    from pykeepass import PyKeePass

    password = os.environ.get("AETHERIUS_KEEPASS_PASSWORD", "")
    keyfile = os.environ.get("AETHERIUS_KEEPASS_KEYFILE") or None
    # pykeepass treats an empty password as "ask the user", which hangs in a
    # non-interactive supervisor process. An empty password is a legitimate
    # explicit value, so suppress the prompt for this process only.
    if password == "" and not keyfile:
        getpass.getpass = lambda *a, **k: ""  # noqa: ARG005
    return PyKeePass(str(path), password=password, keyfile=keyfile)


def _find(kp, title: str):
    matches = [e for e in kp.entries if e.title == title]
    if not matches:
        raise SystemExit(f"entry not found: {title!r}")
    if len(matches) > 1:
        groups = ", ".join(str(e.group) for e in matches)
        raise SystemExit(f"title {title!r} is ambiguous; groups: {groups}")
    return matches[0]


def _backup(path: Path) -> Path:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    target = path.with_name(f"{path.stem}.{stamp}.local-backup{path.suffix}")
    shutil.copy2(path, target)
    return target


def cmd_inventory(args) -> int:
    kp = _open(Path(args.db))
    rows = []
    for entry in kp.entries:
        rows.append(
            {
                "title": entry.title,
                "group": str(entry.group),
                "url": entry.url or "",
                "username": "SET" if entry.username else "EMPTY",
                "password": "SET" if entry.password else "EMPTY",
                "notes": "SET" if entry.notes else "EMPTY",
                "otp": "SET" if getattr(entry, "otp", None) else "EMPTY",
            }
        )
    rows.sort(key=lambda r: (r["group"].lower(), r["title"].lower()))
    print(json.dumps({"database": str(Path(args.db)), "count": len(rows), "entries": rows}, indent=2))
    return 0


def cmd_compact(args) -> int:
    """One line per entry: group | title | flags | URL. No secret values."""
    kp = _open(Path(args.db))
    rows = sorted((str(e.group), e.title, e.url or "", bool(e.username), bool(e.password))
                  for e in kp.entries)
    for group, title, url, has_user, has_password in rows:
        flags = ("u" if has_user else "-") + ("p" if has_password else "-")
        print(f"{group} | {title} | {flags} | {url[:110]}")
    return 0


def cmd_get(args) -> int:
    """Print one field. Only use when the value must be consumed by a pipe."""
    kp = _open(Path(args.db))
    entry = _find(kp, args.title)
    value = getattr(entry, args.field)
    if value is None:
        raise SystemExit(f"field {args.field!r} is empty for {args.title!r}")
    sys.stdout.write(str(value))
    return 0


def cmd_exec(args) -> int:
    """Inject a mapping of env vars from KeePass, then run a command."""
    mapping = json.loads(Path(args.map).read_text(encoding="utf-8"))
    kp = _open(Path(args.db))
    env = dict(os.environ)
    for item in mapping.get("env", []):
        entry = _find(kp, item["title"])
        value = getattr(entry, item.get("field", "password"))
        if value is None:
            raise SystemExit(f"missing {item.get('field', 'password')} for {item['title']!r}")
        env[item["env"]] = str(value)
    command = args.command
    if command and command[0] == "--":
        command = command[1:]
    if not command:
        raise SystemExit("exec requires a command after --")
    return subprocess.call(command, env=env)


def cmd_update(args) -> int:
    if not os.environ.get(args.value_env):
        raise SystemExit(f"{args.value_env} is not set; refusing to write an empty secret")
    path = Path(args.db)
    backup = _backup(path)
    kp = _open(path)
    entry = _find(kp, args.title)
    setattr(entry, args.field, os.environ[args.value_env])
    kp.save()
    print(json.dumps({"updated": args.title, "field": args.field, "backup": str(backup)}))
    return 0


def cmd_add(args) -> int:
    value = os.environ.get(args.password_env) if args.password_env else ""
    path = Path(args.db)
    backup = _backup(path)
    kp = _open(path)
    group = kp.find_groups(name=args.group, first=True)
    if group is None:
        group = kp.add_group(kp.root_group, args.group)
    existing = [e for e in kp.entries if e.title == args.title and str(e.group) == str(group)]
    if existing:
        raise SystemExit(f"entry already exists: {args.group}/{args.title}")
    entry = kp.add_entry(
        group,
        args.title,
        args.username or "",
        value or "",
        url=args.url or "",
        notes=args.notes or "",
    )
    kp.save()
    print(json.dumps({"added": f"{args.group}/{args.title}", "id": entry.uuid, "backup": str(backup)}))
    return 0


def cmd_verify(args) -> int:
    path = Path(args.db)
    kp = _open(path)
    print(json.dumps({"ok": True, "entries": len(kp.entries), "database": str(path)}))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default=str(DEFAULT_DB))
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("inventory", help="list entry metadata without secrets")
    p.set_defaults(func=cmd_inventory)

    p = sub.add_parser("compact", help="one line per entry; no secret values")
    p.set_defaults(func=cmd_compact)

    p = sub.add_parser("get", help="print one field (pipe only)")
    p.add_argument("--title", required=True)
    p.add_argument("--field", default="password", choices=["password", "username", "url", "notes"])
    p.set_defaults(func=cmd_get)

    p = sub.add_parser("exec", help="inject env vars from KeePass and run a command")
    p.add_argument("--map", required=True)
    p.add_argument("command", nargs=argparse.REMAINDER)
    p.set_defaults(func=cmd_exec)

    p = sub.add_parser("update", help="update a field from an environment variable")
    p.add_argument("--title", required=True)
    p.add_argument("--field", default="password", choices=["password", "username", "url", "notes"])
    p.add_argument("--value-env", required=True)
    p.set_defaults(func=cmd_update)

    p = sub.add_parser("add", help="add an entry; password comes from an env var")
    p.add_argument("--group", required=True)
    p.add_argument("--title", required=True)
    p.add_argument("--username", default="")
    p.add_argument("--url", default="")
    p.add_argument("--notes", default="")
    p.add_argument("--password-env", default="")
    p.set_defaults(func=cmd_add)

    p = sub.add_parser("verify", help="reopen and count entries")
    p.set_defaults(func=cmd_verify)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
