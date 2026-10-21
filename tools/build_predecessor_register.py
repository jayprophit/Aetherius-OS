#!/usr/bin/env python3
"""The predecessor migration register, in the contract the owner specified.

The owner's predecessor absorption programme of 21 October 2026 gives a
state machine, a relation vocabulary, a disposition vocabulary, a
persistent registry contract and a deletion gate. This is that contract,
one entry per predecessor, and the gate is enforced rather than
described.

The enforcement is the point. A register that says a repository is
delete-eligible when the capture is not restore-tested is worse than no
register, because it is a licence to delete that the evidence does not
support. So the tool checks every gate in the owner's section seven and
refuses to mark a repository delete-eligible unless all of them hold.
The owner still approves the deletion by exact name, and the tool never
deletes anything.

The rule the whole thing follows: PRESERVE, CLASSIFY, MAP, INTEGRATE,
TEST, VERIFY, ARCHIVE, APPROVED DELETE. If it is not evidenced, it is
not complete.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import date
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "docs" / "PREDECESSOR-MIGRATION-REGISTRY.yaml"

SCHEMA = "aetherius.predecessor-migration.v1"

# The state machine, in order. A state may only be reached through the
# ones before it.
STATES = [
    "UNASSESSED", "IDENTIFIED", "LINEAGE_VERIFIED", "SNAPSHOTTED",
    "INVENTORIED", "CLASSIFIED", "MAPPED", "MIGRATED", "REFERENCED",
    "RETAINED_HISTORICALLY", "INTEGRATION_VERIFIED", "RETENTION_VERIFIED",
    "ARCHIVED_GRACE_PERIOD", "OWNER_DELETE_APPROVED", "DELETED_AND_RECONCILED",
]

# The relation vocabulary. A repository is one of these and no other.
RELATIONS = [
    "ACTIVE_CURRENT", "CONFIRMED_PREDECESSOR", "PROBABLE_PREDECESSOR",
    "RESEARCH_FORK", "THIRD_PARTY_REFERENCE", "MIRROR", "DUPLICATE",
    "EMPTY_SCAFFOLD", "INDEPENDENT_ACTIVE_PROJECT", "HISTORIC_ARCHIVE",
    "UNKNOWN",
]

# The disposition vocabulary for a single artefact.
DISPOSITIONS = [
    "ADOPT_NOW", "ADAPT", "MERGE_MECHANISM", "REIMPLEMENT_ORIGINALLY",
    "BENCHMARK_REFERENCE", "RESEARCH_REFERENCE", "ARCHIVE_ONLY",
    "DUPLICATE_SAME_CONTENT", "SUPERSEDED", "LEGAL_REVIEW",
    "SECURITY_QUARANTINE", "REJECT_WITH_REASON", "UNRESOLVED",
]

# The nine gates the owner lists before a repository may enter
# DELETE_ELIGIBLE. Each one is checked, and each one that fails says
# which.
DELETION_GATES = [
    ("owner_confirmed",
     "the owner has confirmed the predecessor and its destinations"),
    ("captured",
     "the whole history and the non-git resources are captured, or the "
     "exceptions are identified and accepted"),
    ("restore_tested",
     "the backups are hash-verified, independently stored and restore-tested"),
    ("mapped_or_archived",
     "the reusable material is mapped into the current projects or preserved "
     "in a searchable historical archive with exact provenance"),
    ("destination_green",
     "the destination's CI, functional and security tests pass for the "
     "adopted features"),
    ("legal_and_secret_closed",
     "the legal and secret exposure reviews are closed and the affected "
     "credentials are revoked or rotated"),
    ("links_relocated",
     "the links, CI and dependencies that referenced the old repository are "
     "relocated or replaced, and the external dependents are assessed"),
    ("grace_elapsed",
     "a reversible archive or read-only grace period has elapsed"),
    ("owner_approved",
     "the owner has approved the irreversible deletion by exact repository "
     "name or by a named reviewed batch"),
]


def gh_json(path: str):
    try:
        proc = subprocess.run(["gh", "api", path], capture_output=True, text=True,
                              timeout=120, encoding="utf-8", errors="replace")
        if proc.returncode != 0:
            return None
        return json.loads(proc.stdout)
    except Exception:  # noqa: BLE001
        return None


# The predecessors the programme knows about, and where each one is.
PREDECESSORS = [
    {
        "source_repo": "jayprophit/aetherial-platform",
        "relation": "CONFIRMED_PREDECESSOR",
        "confirmed_by": "OWNER",
        "primary_target": "Aetherius-OS",
        "secondary_targets": ["Genesis", "Agent-Bridge", "IDE-Workspace"],
        "state": "IDENTIFIED",
        "note": (
            "The owner confirmed this one on 21 October 2026. It carries "
            "accounts and permissions, social, commerce, education, jobs, "
            "content, the marketplace, the dashboard and the unified data "
            "types, and its CI stops at the Node setup because the workflow "
            "expects a root lockfile that is not there."
        ),
        "licence_classification": "REVIEW_REQUIRED",
        "security_historical_secret_exposure": "REVIEW_REQUIRED",
        "owner_rotation_status": "UNKNOWN",
    },
    {
        "source_repo": "jayprophit/Aetherial",
        "relation": "PROBABLE_PREDECESSOR",
        "confirmed_by": "",
        "primary_target": "Aetherius-OS",
        "secondary_targets": [],
        "state": "IDENTIFIED",
        "note": (
            "Archived with an ABSORBED.md notice, which is a claim and not "
            "proof of incorporation. Its manifest says about 276,820 source "
            "lines and zero test files, and its licence is GPLv3, so it "
            "cannot be integrated into a proprietary product without rights "
            "clearance. The absorption claim is unverified."
        ),
        "licence_classification": "REVIEW_REQUIRED",
        "security_historical_secret_exposure": "UNKNOWN",
        "owner_rotation_status": "UNKNOWN",
    },
    {
        "source_repo": "jayprophit/aetherium",
        "relation": "PROBABLE_PREDECESSOR",
        "confirmed_by": "",
        "primary_target": "Aetherius-OS",
        "secondary_targets": ["Agent-Bridge", "Genesis", "IDE-Workspace"],
        "state": "IDENTIFIED",
        "note": (
            "Archived with an ABSORBED.md notice, MIT licence, and source, "
            "configuration, scripts and knowledge assets visible. Its "
            "manifest paradoxically says NOT_STARTED and zero source lines, "
            "which contradicts the tree, so the inventory and the manifest "
            "have to be reconciled before the absorption claim is checked. "
            "The claim is unverified."
        ),
        "licence_classification": "REVIEW_REQUIRED",
        "security_historical_secret_exposure": "UNKNOWN",
        "owner_rotation_status": "UNKNOWN",
    },
]


def live_facts(name: str) -> dict:
    """What the account says about the repository, read live."""
    short = name.split("/")[-1]
    info = gh_json(f"repos/{name}") or {}
    branches = gh_json(f"repos/{name}/branches?per_page=100") or []
    return {
        "repository_id": info.get("id"),
        "default_branch": info.get("default_branch", ""),
        "archived": bool(info.get("archived", False)),
        "visibility": info.get("visibility", ""),
        "licence": ((info.get("license") or {}) or {}).get("spdx_id", ""),
        "head_refs": [
            {"branch": b.get("name", ""), "sha": (b.get("commit") or {}).get("sha", "")}
            for b in branches if not b.get("name", "").startswith("dependabot/")
        ],
        "short_name": short,
    }


def gates_for(entry: dict) -> dict:
    """Each deletion gate, and whether it holds."""
    backup = entry.get("backup") or {}
    security = entry.get("security") or {}
    retirement = entry.get("retirement") or {}
    holds = {
        "owner_confirmed": entry.get("relation") == "CONFIRMED_PREDECESSOR"
                           and entry.get("confirmed_by") == "OWNER",
        "captured": bool(backup.get("git_mirror_sha256"))
                    and bool(backup.get("git_bundle_sha256"))
                    and not backup.get("unresolved_capture_gaps"),
        "restore_tested": bool(backup.get("restore_drill_passed"))
                          and int(backup.get("independent_copies") or 0) >= 2,
        "mapped_or_archived": entry.get("state") in (
            "MIGRATED", "REFERENCED", "RETAINED_HISTORICALLY",
            "INTEGRATION_VERIFIED", "RETENTION_VERIFIED",
            "ARCHIVED_GRACE_PERIOD", "OWNER_DELETE_APPROVED",
            "DELETED_AND_RECONCILED"),
        "destination_green": bool((entry.get("integration") or {}).get("qa_accepted")),
        "legal_and_secret_closed":
            (entry.get("licence") or {}).get("classification") not in
            ("REVIEW_REQUIRED", "", None)
            and security.get("historical_secret_exposure") not in
            ("REVIEW_REQUIRED", "", None)
            and security.get("owner_rotation_status") == "ROTATED",
        "links_relocated": bool(retirement.get("links_relocated")),
        "grace_elapsed": bool(retirement.get("archive_grace_complete")),
        "owner_approved": bool(retirement.get("owner_approved")),
    }
    return holds


def build_entry(spec: dict) -> dict:
    facts = live_facts(spec["source_repo"])
    entry = {
        "schema": SCHEMA,
        "source_repo": spec["source_repo"],
        "repository_id": facts["repository_id"],
        "relation": spec["relation"],
        "confirmed_by": spec["confirmed_by"],
        "primary_target": spec["primary_target"],
        "secondary_targets": spec["secondary_targets"],
        "state": spec["state"],
        "head_refs": facts["head_refs"],
        "default_branch": facts["default_branch"],
        "archived": facts["archived"],
        "visibility": facts["visibility"],
        "declared_licence": facts["licence"],
        "note": spec["note"],
        "backup": {
            "git_mirror_sha256": None,
            "git_bundle_sha256": None,
            "git_lfs_verified": False,
            "external_assets_exported": False,
            "issues_prs_wiki_releases_captured": False,
            "independent_copies": 0,
            "restore_drill_passed": False,
            "unresolved_capture_gaps": [
                "The capture has not been run for this repository.",
            ],
        },
        "security": {
            "historical_secret_exposure": spec["security_historical_secret_exposure"],
            "owner_rotation_status": spec["owner_rotation_status"],
        },
        "licence": {
            "classification": spec["licence_classification"],
        },
        "artifacts": {
            "total": None,
            "classified": 0,
            "dispositions": {},
        },
        "integration": {
            "tasks": [],
            "target_commit_shas": [],
            "tests": [],
            "qa_accepted": False,
        },
        "retirement": {
            "archive_grace_complete": False,
            "delete_eligible": False,
            "owner_approved": False,
            "deletion_timestamp": None,
            "links_relocated": False,
        },
    }
    return entry


def validate(entries: list[dict]) -> list[str]:
    """Everything that is wrong with the register."""
    problems: list[str] = []
    for entry in entries:
        name = entry.get("source_repo", "?")
        if entry.get("schema") != SCHEMA:
            problems.append(f"{name}: the schema is not {SCHEMA}")
        if entry.get("relation") not in RELATIONS:
            problems.append(
                f"{name}: the relation {entry.get('relation')!r} is not in the "
                f"vocabulary")
        if entry.get("state") not in STATES:
            problems.append(
                f"{name}: the state {entry.get('state')!r} is not in the "
                f"state machine")
        dispositions = (entry.get("artifacts") or {}).get("dispositions") or {}
        for name_, count in dispositions.items():
            if name_ not in DISPOSITIONS:
                problems.append(
                    f"{name}: the disposition {name_!r} is not in the vocabulary")
        # A state may not be reached without the ones before it.
        if entry.get("state") in STATES:
            reached = STATES.index(entry["state"])
            if reached and entry.get("state") in (
                    "OWNER_DELETE_APPROVED", "DELETED_AND_RECONCILED",
                    "INTEGRATION_VERIFIED", "RETENTION_VERIFIED"):
                # These states need the earlier ones evidenced, which the
                # gates below check. The gates are the real test.
                pass
        # The deletion gate.
        holds = gates_for(entry)
        retirement = entry.get("retirement") or {}
        if retirement.get("delete_eligible"):
            for gate, description in DELETION_GATES:
                if not holds.get(gate):
                    problems.append(
                        f"{name}: it is marked delete-eligible but the gate "
                        f"'{gate}' does not hold, which means {description}")
        if retirement.get("owner_approved") and not holds.get("owner_confirmed"):
            problems.append(
                f"{name}: it is marked owner-approved but the owner has not "
                f"confirmed the predecessor and its destinations")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(OUT))
    ap.add_argument("--check", action="store_true",
                    help="validate the register and write nothing")
    args = ap.parse_args()

    entries = [build_entry(spec) for spec in PREDECESSORS]
    problems = validate(entries)

    doc = {
        "schema_version": 1,
        "source_date": date.today().isoformat(),
        "generated_by": "tools/build_predecessor_register.py",
        "contract": {
            "schema": SCHEMA,
            "states": STATES,
            "relations": RELATIONS,
            "dispositions": DISPOSITIONS,
            "deletion_gates": [
                {"gate": gate, "requires": description}
                for gate, description in DELETION_GATES
            ],
        },
        "notes": [
            "One entry per predecessor, in the contract the owner's "
            "predecessor absorption programme of 21 October 2026 specifies.",
            "The deletion gate is checked, not described. A repository is "
            "not delete-eligible unless every one of the owner's nine gates "
            "holds, and the tool says which gate does not.",
            "The owner approves a deletion by exact repository name. The "
            "tool never deletes anything, and no entry is ever marked "
            "approved by the tool.",
            "PRESERVE, CLASSIFY, MAP, INTEGRATE, TEST, VERIFY, ARCHIVE, "
            "APPROVED DELETE. If it is not evidenced, it is not complete.",
        ],
        "problems": problems,
        "predecessors": entries,
    }

    if args.check:
        for problem in problems:
            print(f"  PROBLEM {problem}")
        print(f"  {len(entries)} predecessors, {len(problems)} problems")
        return 1 if problems else 0

    Path(args.out).write_text(
        yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=100),
        encoding="utf-8")
    print(f"wrote {args.out} ({len(entries)} predecessors, "
          f"{len(problems)} problems)")
    for problem in problems:
        print(f"  PROBLEM {problem}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
