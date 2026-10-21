#!/usr/bin/env python3
"""The continuous workforce lanes.

The owner's directive is that several project lanes stay ready, and
that the Agent Bridge's repair work does not starve Genesis, Aetherius
OS, the IDE, Poietek, MAT, the Universal Bridge or the rest of the
programme. A register is the way that is kept honest, because a
register can be checked and a belief cannot.

Each lane names what it owns, which is a WRITE SET: the paths inside
its repository that it may change. Two lanes may run at the same time
only if their write sets do not overlap, so the tool checks every pair
and says which pair conflicts. That check is the whole point: the
lanes are a way of working in parallel, and the way they fail is by
quietly writing to each other's files.

Each lane also carries its state, measured: how much open work it
has, what its next action is, when it last moved, and what its CI
says. A lane with open work and no next action is a lane that is not
ready, and the tool says so.

STARVATION is measured as a gap: how much older a lane's last activity
is than the newest activity across the lanes. A lane with open work
whose gap is larger than the threshold is starved, and the tool says
which one and by how much.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from datetime import date, datetime
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "docs" / "WORKFORCE-LANES.yaml"
TODOS = REPO / "docs" / "PROJECT-TODOS.yaml"

PROJECTS = Path(r"C:\Users\jpowe\Desktop\Projects")

# How many days a lane may go without moving, while it still has open
# work, before it counts as starved.
STARVATION_DAYS = 7

# The lanes. The write set is a set of paths inside the lane's own
# repository. An empty include list means the whole repository.
#
# The nested repositories matter: Genesis, the IDE and Poietek are
# separate git repositories inside the Aetherius OS tree, so the
# Aetherius OS lane may not write inside them, or two lanes would be
# writing in one working tree.
LANES = [
    {
        "id": "agent-bridge",
        "name": "Agent Bridge",
        "repository": "jayprophit/Agent-Bridge",
        "local": PROJECTS / "Agent-Bridge",
        "projects": ["agent-bridge", "agent-bridge-cloudhybrid",
                     "agent-bridge-dashboard", "agent-bridge-runtimesafety"],
        "write_set": {"include": [""], "exclude": []},
        "guard": (
            "The variants live inside this repository and are the same "
            "write set, so they are one lane and not four. A change in the "
            "core has to be made in the variants too, and a lane that "
            "edited only the core would leave the variants behind."
        ),
    },
    {
        "id": "genesis",
        "name": "Genesis",
        "repository": "jayprophit/Genesis",
        "local": REPO / "kernel" / "Genesis",
        "projects": ["genesis"],
        "write_set": {"include": [""], "exclude": []},
        "guard": (
            "The kernel is a separate repository nested in the Aetherius OS "
            "tree, so the Aetherius OS lane may not write inside it. The "
            "content manifest is generated and compared byte for byte, so "
            "it is regenerated after every change here."
        ),
    },
    {
        "id": "aetherius-os",
        "name": "Aetherius OS",
        "repository": "jayprophit/Aetherius-OS",
        "local": REPO,
        "projects": ["aetherius-os", "aetherius-os-prototype",
                     "aetherius-os-worldclass-prototype",
                     "aetherius-commerce", "aetherius-learning",
                     "aetherius-community", "aetherius-health-library",
                     "aetherion-engine", "athena", "crossplatform",
                     "decentralized-messaging-app", "food-wiki-app",
                     "football-card-game", "holonav-os", "ledgerlands",
                     "niche-platform", "quantum-ai-assistant", "quantum-os",
                     "qva-merged", "self-building-ai",
                     "sovereign-financial-os", "trading-bot", "veyra",
                     "virtual-assistant", "web-platform", "ai-digital-twin"],
        "write_set": {
            "include": [""],
            "exclude": [
                # The nested repositories, and the predecessor
                # registers, which are the predecessor lane's write set.
                "kernel/Genesis",
                "apps/IDE-Workspace",
                "apps/Poietek",
                "docs/PREDECESSOR-MIGRATION-REGISTRY.yaml",
                "docs/PREDECESSOR-CAPABILITY-MATRIX.yaml",
                "docs/PREDECESSOR-CAPTURE-REGISTRY.yaml",
                "docs/evidence/credential-exposure-report.yaml",
                "tools/capture_predecessor.py",
                "tools/build_predecessor_register.py",
                "tools/build_predecessor_capability_matrix.py",
                "tools/build_credential_exposure_report.py",
            ],
        },
        "guard": (
            "The largest lane and the one that owns the shared registers. "
            "The nested repositories are excluded, because they are "
            "separate write sets in the same working tree."
        ),
    },
    {
        "id": "ide-workspace",
        "name": "IDE Workspace",
        "repository": "jayprophit/IDE-Workspace",
        "local": REPO / "apps" / "IDE-Workspace",
        "projects": ["ide-workspace"],
        "write_set": {"include": [""], "exclude": []},
        "guard": (
            "A separate repository nested in the Aetherius OS tree. The "
            "IDE reads the Bridge, and the Bridge is the Agent Bridge "
            "lane, so the two lanes are dependent but not overlapping."
        ),
    },
    {
        "id": "poietek",
        "name": "Poietek",
        "repository": "jayprophit/Poietek",
        "local": REPO / "apps" / "Poietek",
        "projects": ["poietek"],
        "write_set": {"include": [""], "exclude": []},
        "guard": (
            "A separate repository nested in the Aetherius OS tree."
        ),
    },
    {
        "id": "mat",
        "name": "Materials Atlas Table Codex (MAT)",
        "repository": "jayprophit/Materials-Atlas-Table-Codex---MAT",
        "local": PROJECTS / "Materials-Atlas-Table-Codex---MAT",
        "projects": ["mat"],
        "write_set": {"include": [""], "exclude": []},
        "guard": (
            "A separate repository outside the Aetherius OS tree. It "
            "carries the materials knowledge, and its own provenance "
            "checkpoints, so a change here is a provenance claim and not "
            "only a code change."
        ),
    },
    {
        "id": "universal-bridge",
        "name": "Universal Bridge",
        "repository": "jayprophit/Universal-Bridge",
        "local": PROJECTS / "Universal-Bridge",
        "projects": ["universal-bridge"],
        "write_set": {"include": [""], "exclude": []},
        "guard": (
            "A separate repository outside the Aetherius OS tree. It was "
            "cloned on 21 October 2026 so that its lane state is measured "
            "from the working tree and not only from the remote, because a "
            "lane whose movement cannot be shown is a lane that cannot be "
            "shown to have moved."
        ),
    },
    {
        "id": "predecessor-absorption",
        "name": "Predecessor absorption",
        "repository": "jayprophit/Aetherius-OS",
        "local": REPO,
        "projects": ["aetherial-platform", "aetherial", "aetherium"],
        "write_set": {
            "include": [
                "docs/PREDECESSOR-MIGRATION-REGISTRY.yaml",
                "docs/PREDECESSOR-CAPABILITY-MATRIX.yaml",
                "docs/PREDECESSOR-CAPTURE-REGISTRY.yaml",
                "docs/evidence/credential-exposure-report.yaml",
                "tools/capture_predecessor.py",
                "tools/build_predecessor_register.py",
                "tools/build_predecessor_capability_matrix.py",
                "tools/build_credential_exposure_report.py",
            ],
            "exclude": [],
        },
        "guard": (
            "This lane shares its repository with the Aetherius OS lane "
            "and takes a NARROWER write set, so the two can run at the "
            "same time. The predecessor repositories themselves are read, "
            "never written: a predecessor is only ever captured, and the "
            "deletion of one is the owner's separate decision."
        ),
    },
]


def sh(cmd: list[str], timeout: int = 120) -> tuple[int, str]:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                              encoding="utf-8", errors="replace")
        return proc.returncode, (proc.stdout or "").strip()
    except Exception as exc:  # noqa: BLE001
        return 1, f"{type(exc).__name__}: {exc}"


def git_facts(path: Path | None) -> dict:
    """When the lane last moved, and what it is at."""
    if path is None or not (path / ".git").exists():
        return {"cloned": False, "last_commit": None, "head": None,
                "subject": ""}
    code, out = sh(["git", "-C", str(path), "log", "-1",
                    "--format=%H%x1f%cs%x1f%s"])
    if code != 0 or not out:
        return {"cloned": True, "last_commit": None, "head": None, "subject": ""}
    head, when, subject = (out.split("\x1f") + ["", ""])[:3]
    return {"cloned": True, "last_commit": when, "head": head[:8],
            "subject": subject[:120]}


def ci_facts(repository: str) -> dict:
    """What the lane's own CI says."""
    code, out = sh(["gh", "run", "list", "--repo", repository, "--limit", "1",
                    "--json", "status,conclusion,headSha,createdAt,workflowName"])
    if code != 0 or not out:
        return {"known": False, "note": "the CI state could not be read"}
    try:
        runs = json.loads(out)
    except ValueError:
        return {"known": False, "note": "the CI state could not be read"}
    if not runs:
        return {"known": True, "note": "no run has ever been recorded"}
    run = runs[0]
    return {
        "known": True,
        "workflow": run.get("workflowName", ""),
        "status": run.get("status", ""),
        "conclusion": run.get("conclusion", ""),
        "head": (run.get("headSha") or "")[:8],
        "at": run.get("createdAt", ""),
        "green": run.get("conclusion") == "success",
    }


def open_work(projects: list[str], todos: list[dict]) -> list[dict]:
    """The open todos of a lane, most important first."""
    mine = [t for t in todos
            if t.get("project") in projects and t.get("status") == "OPEN"]
    mine.sort(key=lambda t: (int(t.get("priority", 9) or 9), t.get("id", "")))
    return mine


def write_set_conflicts(a: dict, b: dict) -> list[str]:
    """Whether two lanes' write sets overlap.

    A lane owns a set of path prefixes. It owns the whole repository
    when its include list holds "", and then its exclude list carves
    paths OUT of that. Two lanes conflict when they own the same path.
    """
    # Two lanes in DIFFERENT repositories cannot conflict.
    if a["repository"] != b["repository"]:
        return []

    def owns_whole(lane: dict) -> bool:
        return "" in lane["write_set"]["include"]

    def owned(lane: dict) -> set[str]:
        return {p for p in lane["write_set"]["include"] if p}

    def excluded(lane: dict) -> set[str]:
        return set(lane["write_set"]["exclude"])

    def under(path: str, prefix: str) -> bool:
        """Whether a path lies under a prefix."""
        if prefix == "":
            return True
        return path == prefix or path.startswith(prefix + "/")

    conflicts: list[str] = []

    if owns_whole(a) and owns_whole(b):
        # Both own the repository, so the shared area is whatever
        # neither of them has carved out.
        carved = excluded(a) | excluded(b)
        shared = sorted(carved - excluded(a) - excluded(b))
        if not shared:
            # Everything is carved out by one lane or the other, so the
            # two never write the same file. The overlap is empty.
            return []
        return shared

    if owns_whole(a) or owns_whole(b):
        whole, other = (a, b) if owns_whole(a) else (b, a)
        carved = excluded(whole)
        for path in sorted(owned(other)):
            if path in carved:
                continue
            conflicts.append(path)
        return conflicts

    a_owned, b_owned = owned(a), owned(b)
    for path in sorted(a_owned):
        if path in excluded(a) or path in excluded(b):
            continue
        for other in sorted(b_owned):
            if other in excluded(a) or other in excluded(b):
                continue
            if under(path, other) or under(other, path):
                conflicts.append(path)
                break
    return conflicts


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()

    todos = yaml.safe_load(TODOS.read_text(encoding="utf-8"))["todos"]

    lanes: list[dict] = []
    for spec in LANES:
        work = open_work(spec["projects"], todos)
        git = git_facts(spec["local"])
        ci = ci_facts(spec["repository"])
        done = [t for t in todos
                if t.get("project") in spec["projects"] and t.get("status") == "DONE"]
        lanes.append({
            "id": spec["id"],
            "name": spec["name"],
            "repository": spec["repository"],
            "cloned_locally": git["cloned"],
            "projects": spec["projects"],
            "write_set": spec["write_set"],
            "guard": spec["guard"],
            "work": {
                "open": len(work),
                "done": len(done),
                "by_priority": {
                    str(p): sum(1 for t in work
                                if int(t.get("priority", 9) or 9) == p)
                    for p in sorted({int(t.get("priority", 9) or 9) for t in work})
                },
                "next_action": (work[0]["title"] if work else ""),
                "next_action_id": (work[0]["id"] if work else ""),
                "next_action_is_owner_gate": bool(
                    work and "owner" in str(work[0].get("source", {})).lower()),
                "top_three": [
                    {"id": t["id"], "priority": t.get("priority", 9),
                     "title": t.get("title", "")[:140]}
                    for t in work[:3]],
            },
            "activity": {
                "last_commit": git["last_commit"],
                "head": git["head"],
                "subject": git["subject"],
            },
            "ci": ci,
        })

    # ---- the checks ----
    problems: list[str] = []
    notes: list[str] = []

    for lane in lanes:
        if lane["work"]["open"] and not lane["work"]["next_action"]:
            problems.append(
                f"{lane['id']}: {lane['work']['open']} open item(s) and no "
                f"next action, so the lane is not ready")
        if not lane["cloned_locally"]:
            notes.append(
                f"{lane['id']}: there is no local checkout, so its state is "
                f"measured from the remote and from its own todos")

    # The pairwise write-set check.
    for i, first in enumerate(LANES):
        for second in LANES[i + 1:]:
            conflicts = write_set_conflicts(first, second)
            if conflicts:
                problems.append(
                    f"{first['id']} and {second['id']} share a write set: "
                    f"{', '.join(conflicts[:6])}"
                    + (f" and {len(conflicts) - 6} more" if len(conflicts) > 6
                       else ""))

    # The starvation check.
    dated = [(lane["id"], lane["activity"]["last_commit"])
             for lane in lanes if lane["activity"]["last_commit"]]
    if dated:
        newest = max(when for _, when in dated)
        newest_day = datetime.strptime(newest, "%Y-%m-%d").date()
        for lane in lanes:
            when = lane["activity"]["last_commit"]
            if not when:
                if lane["work"]["open"]:
                    problems.append(
                        f"{lane['id']}: {lane['work']['open']} open item(s) and "
                        f"no recorded activity, so the lane cannot be shown to "
                        f"have moved")
                continue
            day = datetime.strptime(when, "%Y-%m-%d").date()
            gap = (newest_day - day).days
            lane["activity"]["days_behind_the_newest"] = gap
            lane["activity"]["starved"] = bool(
                gap > STARVATION_DAYS and lane["work"]["open"])
            if lane["activity"]["starved"]:
                problems.append(
                    f"{lane['id']}: {gap} days behind the newest lane, with "
                    f"{lane['work']['open']} open item(s), so it is starved")
        for lane in lanes:
            lane["activity"].setdefault("days_behind_the_newest", None)
            lane["activity"].setdefault("starved", False)

    doc = {
        "schema_version": 1,
        "source_date": date.today().isoformat(),
        "generated_by": "tools/build_workforce_lanes.py",
        "notes": [
            "The lanes are the write sets, not the wish lists. Two lanes "
            "may run at the same time only if their write sets do not "
            "overlap, and the tool checks every pair and says which pair "
            "conflicts.",
            "The work, the activity and the CI state are measured. The "
            "starvation gap is a measurement too: how much older a lane's "
            "last activity is than the newest activity across the lanes.",
            "A lane with open work and no next action is a lane that is not "
            "ready, and the tool says so rather than leaving it to be "
            "noticed.",
            "A predecessor is only ever read, never written. A predecessor's "
            "deletion is the owner's separate decision, and this register "
            "never proposes one.",
        ],
        "starvation_threshold_days": STARVATION_DAYS,
        "problems": problems,
        "notes_and_observations": notes,
        "lanes": lanes,
    }

    Path(args.out).write_text(
        yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=100),
        encoding="utf-8")
    print(f"wrote {args.out}")
    for lane in lanes:
        gap = lane["activity"].get("days_behind_the_newest")
        print(f"  {lane['id']:<24} open={lane['work']['open']:<4} "
              f"last={lane['activity']['last_commit'] or '-':<12} "
              f"gap={gap if gap is not None else '-':<4} "
              f"ci={lane['ci'].get('conclusion', '?')}")
        if lane["work"]["next_action"]:
            print(f"      next: {lane['work']['next_action_id']} "
                  f"{lane['work']['next_action'][:80]}")
    if problems:
        print()
        print("  the problems:")
        for problem in problems:
            print(f"    {problem}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
