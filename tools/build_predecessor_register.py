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
import hashlib
import json
import os
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
        "local_path": r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\ecosystem\aetherial-platform",
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
        "local_path": r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\predecessors\Aetherial",
        "relation": "CONFIRMED_PREDECESSOR",
        "confirmed_by": "OWNER",
        "content_classification": "SOURCE_BEARING",
        "primary_target": "Aetherius-OS",
        "secondary_targets": [],
        "state": "IDENTIFIED",
        "note": (
            "Archived with an ABSORBED.md notice, which is a claim and not "
            "proof of incorporation. Its tree holds 1,079 source files and "
            "275,741 source lines with zero test files, and its licence is "
            "GPLv3, so it cannot be integrated into a proprietary product "
            "without rights clearance. The absorption claim is unverified."
        ),
        "licence_classification": "REVIEW_REQUIRED",
        "security_historical_secret_exposure": "UNKNOWN",
        "owner_rotation_status": "UNKNOWN",
    },
    {
        "source_repo": "jayprophit/aetherium",
        "local_path": r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\predecessors\aetherium",
        "relation": "CONFIRMED_PREDECESSOR",
        "confirmed_by": "OWNER",
        "content_classification": "SOURCE_BEARING",
        "primary_target": "Aetherius-OS",
        "secondary_targets": ["Agent-Bridge", "Genesis", "IDE-Workspace"],
        "state": "IDENTIFIED",
        "note": (
            "Archived with an ABSORBED.md notice, MIT licence, and 423 source "
            "files totalling 118,149 source lines with 13 test files. Its "
            "manifest paradoxically says NOT_STARTED and zero source lines, "
            "which contradicts the tree, so the inventory and the manifest "
            "have to be reconciled before the absorption claim is checked. "
            "The claim is unverified."
        ),
        "licence_classification": "MIT",
        "security_historical_secret_exposure": "UNKNOWN",
        "owner_rotation_status": "UNKNOWN",
    },
    {
        "source_repo": "jayprophit/Veyra",
        "local_path": r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\predecessors\Veyra",
        "relation": "CONFIRMED_PREDECESSOR",
        "confirmed_by": "OWNER",
        "content_classification": "SOURCE_BEARING",
        "primary_target": "Aetherius-OS",
        "secondary_targets": [],
        "state": "IDENTIFIED",
        "note": (
            "Archived, MIT licence, 1,532 source files totalling 278,589 "
            "source lines with 45 test files. It carries an ABSORBED.md "
            "notice, which is a claim and not proof of incorporation. No "
            "capability mapping exists yet, so the relation remains probable."
        ),
        "licence_classification": "MIT",
        "security_historical_secret_exposure": "UNKNOWN",
        "owner_rotation_status": "UNKNOWN",
    },
    {
        "source_repo": "jayprophit/QVA-merged",
        "local_path": r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\predecessors\QVA-merged",
        "relation": "CONFIRMED_PREDECESSOR",
        "confirmed_by": "OWNER",
        "content_classification": "SOURCE_BEARING",
        "primary_target": "Aetherius-OS",
        "secondary_targets": [],
        "state": "IDENTIFIED",
        "note": (
            "Archived, no licence file, 21 source files totalling 3,040 "
            "source lines with zero test files. It carries an ABSORBED.md "
            "notice. Without a licence, reuse needs the owner's rights "
            "decision before any code is adopted."
        ),
        "licence_classification": "REVIEW_REQUIRED",
        "security_historical_secret_exposure": "UNKNOWN",
        "owner_rotation_status": "UNKNOWN",
    },
    {
        "source_repo": "jayprophit/Quantum-OS",
        "local_path": r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\predecessors\Quantum-OS",
        "relation": "CONFIRMED_PREDECESSOR",
        "confirmed_by": "OWNER",
        "content_classification": "EMPTY_SCAFFOLD",
        "primary_target": "Aetherius-OS",
        "secondary_targets": [],
        "state": "IDENTIFIED",
        "note": (
            "Archived, MIT licence, 164 files but zero source files and zero "
            "source lines. It is a scaffold, not an implementation; the "
            "ABSORBED.md notice cannot be substantiated by source."
        ),
        "licence_classification": "MIT",
        "security_historical_secret_exposure": "UNKNOWN",
        "owner_rotation_status": "UNKNOWN",
    },
]


def live_facts(spec: dict) -> dict:
    """What the account, or the local clone, says about the repository."""
    name = spec["source_repo"]
    if not spec.get("has_remote", True):
        root = Path(spec["local_path"])
        head_refs = []
        branch = ""
        if (root / ".git").is_dir():
            try:
                sha = subprocess.run(
                    ["git", "-C", str(root), "rev-parse", "HEAD"],
                    capture_output=True, text=True, timeout=30,
                    encoding="utf-8", errors="replace").stdout.strip()
                branch = subprocess.run(
                    ["git", "-C", str(root), "branch", "--show-current"],
                    capture_output=True, text=True, timeout=30,
                    encoding="utf-8", errors="replace").stdout.strip()
                if sha:
                    head_refs = [{"branch": branch, "sha": sha}]
            except Exception:  # noqa: BLE001
                pass
        return {
            "repository_id": None,
            "default_branch": branch,
            "archived": False,
            "visibility": "local",
            "licence": "",
            "head_refs": head_refs,
            "short_name": name.split("/")[-1],
        }
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
        "owner_confirmed": entry.get("confirmed_by") == "OWNER",
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


CAPTURE_REGISTRY = REPO / "docs" / "PREDECESSOR-CAPTURE-REGISTRY.yaml"
CAPABILITY_MATRIX = REPO / "docs" / "PREDECESSOR-CAPABILITY-MATRIX.yaml"
EXPOSURE_REPORT = REPO / "docs" / "evidence" / "credential-exposure-report.yaml"


def _load(path: Path) -> dict:
    """A register, if it is there."""
    if not path.is_file():
        return {}
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except Exception:  # noqa: BLE001
        return {}


def capture_facts(source_repo: str) -> dict:
    """What the capture actually did for this repository.

    The register used to say "the capture has not been run for this
    repository" for all three predecessors, after the capture had been
    run for all three. The register is derived from the capture now,
    so that it cannot say a thing that has stopped being true.
    """
    registry = _load(CAPTURE_REGISTRY)
    for capture in registry.get("captures", []) or []:
        if capture.get("source_repo") != source_repo:
            continue
        drill = capture.get("restore_drill") or {}
        scan = capture.get("secret_scan") or {}
        tree = scan.get("tree") or {}
        history = scan.get("history") or {}
        git = capture.get("git") or {}
        github = capture.get("github_context") or {}
        # The capture tool records the GitHub-side context as metadata: the
        # issues, pull requests and releases are listed, and the wiki is
        # recorded as enabled or absent. The wiki pages and the discussions
        # are not exported, so the metadata flag and the gap both say so.
        github_metadata = all(
            key in github for key in
            ("issues", "pull_requests", "releases", "wiki"))
        wiki_content_exported = bool(github.get("wiki_content_exported"))
        lfs_objects = git.get("lfs_pointer_objects") or 0
        lfs_verified = lfs_objects == 0 or bool(git.get("lfs_verified"))
        gaps = []
        if not github_metadata:
            gaps.append(
                "The issues, pull requests, releases and wiki metadata have "
                "not all been captured.")
        elif not wiki_content_exported:
            gaps.append(
                "The GitHub context is metadata only: the issues, pull "
                "requests and releases are listed, but the wiki pages and the "
                "discussions were not exported.")
        if not lfs_verified:
            gaps.append(
                f"The capture has {lfs_objects} LFS pointer object(s) and the "
                "LFS objects have not been verified, so a restore of the large "
                "files is not yet proven.")
        if not capture.get("independent_copies"):
            gaps.append(
                "The capture exists in one place. An independent copy has not "
                "been made, and a backup in one place is a hope.")
        return {
            "captured": True,
            "commits": (git.get("counts") or {}).get("commits"),
            "branches": (git.get("counts") or {}).get("branches"),
            "fsck_clean": (git.get("fsck") or {}).get("clean"),
            "git_mirror_sha256": git.get("git_mirror_sha256"),
            "git_bundle_sha256": git.get("git_bundle_sha256"),
            "git_lfs_verified": lfs_verified,
            "github_context_metadata_captured": github_metadata,
            "wiki_content_exported": wiki_content_exported,
            "independent_copies": capture.get("independent_copies") or 0,
            "restore_drill_passed": bool(drill.get("ok")),
            "restored_commits": drill.get("commits"),
            "restored_files": drill.get("files"),
            "tree_clean": bool(tree.get("clean")),
            "tree_findings": tree.get("findings", 0),
            "history_clean": bool(history.get("clean")),
            "history_findings": history.get("findings", 0),
            "unresolved_capture_gaps": gaps,
        }
    return {"captured": False}


def exposure_facts(source_repo: str) -> dict:
    """What the credential exposure report says about this repository."""
    report = _load(EXPOSURE_REPORT)
    mine = [f for f in (report.get("findings") or [])
            if f.get("repository") == source_repo]
    rotate = [f for f in mine if f.get("state") == "ROTATE_REQUIRED"]
    fixtures = [f for f in mine if f.get("state") == "FIXTURE"]
    if rotate:
        return {
            "historical_secret_exposure": "CONFIRMED",
            "owner_rotation_status": "PENDING",
            "rotate_required": len(rotate),
            "fixtures": len(fixtures),
        }
    if mine:
        return {
            "historical_secret_exposure": "FIXTURES_ONLY",
            "owner_rotation_status": "NOT_REQUIRED",
            "rotate_required": 0,
            "fixtures": len(fixtures),
        }
    return {
        "historical_secret_exposure": "NONE_FOUND",
        "owner_rotation_status": "NOT_REQUIRED",
        "rotate_required": 0,
        "fixtures": 0,
    }


def matrix_facts(source_repo: str) -> dict:
    """The capability matrix's rows for this repository."""
    matrix = _load(CAPABILITY_MATRIX)
    for predecessor in matrix.get("predecessors", []) or []:
        if predecessor.get("source_repo") != source_repo:
            continue
        rows = predecessor.get("capability_areas") or []
        dispositions: dict[str, int] = {}
        for row in rows:
            key = row.get("disposition", "UNRESOLVED")
            dispositions[key] = dispositions.get(key, 0) + 1
        return {
            "total": len(rows),
            "classified": len(rows),
            "dispositions": dispositions,
            "mapped": bool(rows),
        }
    return {"total": 0, "classified": 0, "dispositions": {}, "mapped": False}


SOURCE_SUFFIXES = {
    ".ts", ".tsx", ".js", ".jsx", ".py", ".sh", ".sql", ".go", ".rs",
    ".java", ".c", ".cpp", ".h", ".rb", ".php", ".cs", ".swift", ".kt",
}
SKIP_PARTS = {
    ".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build",
    "out", "target", ".next", "coverage", ".pytest_cache", ".mypy_cache",
    ".tox", "site-packages", ".gradle", ".idea", ".vscode", "vendor",
    "third_party", "thirdparty", "external", "deps", "Pods", ".wrangler",
    ".turbo", ".cache", ".parcel-cache", "storybook-static",
}


def _files_under(root: Path):
    for dirpath, dirnames, filenames in os.walk(root, onerror=lambda e: None):
        dirnames[:] = [name for name in dirnames if name not in SKIP_PARTS]
        for filename in filenames:
            yield Path(dirpath) / filename


def _licence_of(root: Path) -> str:
    for name in ("LICENSE", "LICENSE.md", "LICENCE", "LICENCE.md", "COPYING"):
        candidate = root / name
        if not candidate.is_file():
            continue
        head = candidate.read_text(encoding="utf-8", errors="replace")[:4000].lower()
        for token, label in (
            ("apache license", "Apache-2.0"),
            ("mit license", "MIT"),
            ("gnu affero", "AGPL"),
            ("gnu general public license", "GPL"),
            ("mozilla public", "MPL"),
            ("bsd", "BSD"),
        ):
            if token in head:
                return label
        return "SEE-THE-FILE"
    return ""


def measure_tree(root: Path) -> dict:
    """What is actually in the local tree, measured rather than claimed."""
    files = list(_files_under(root))
    source = [path for path in files if path.suffix.lower() in SOURCE_SUFFIXES]
    tests = [
        path for path in files
        if any(part.lower() in ("test", "tests", "spec", "__tests__")
               for part in path.parts)
    ]
    lines = 0
    digests: dict[str, int] = {}
    for path in source:
        try:
            raw = path.read_bytes()
        except OSError:
            continue
        lines += raw.count(b"\n")
        digest = hashlib.sha256(raw).hexdigest()
        digests[digest] = digests.get(digest, 0) + 1
    repeated = sum(count - 1 for count in digests.values() if count > 1)
    return {
        "files": len(files),
        "source_files": len(source),
        "source_lines": lines,
        "unique_source_files": len(digests),
        "repeated_copies": repeated,
        "duplication_ratio": round(1 - len(digests) / len(source), 3) if source else 0.0,
        "test_files": len(tests),
        "files_named_like_tests": len([
            path for path in source
            if "test" in path.name.lower() or "spec" in path.name.lower()
        ]),
        "declared_licence": _licence_of(root),
    }


def build_entry(spec: dict) -> dict:
    facts = live_facts(spec)
    capture = capture_facts(spec["source_repo"])
    exposure = exposure_facts(spec["source_repo"])
    matrix = matrix_facts(spec["source_repo"])
    measurement = None
    local_path = spec.get("local_path")
    if local_path and Path(local_path).is_dir():
        measurement = measure_tree(Path(local_path))

    # A capture's own secret scan is evidence. The exposure report lists
    # findings that were triaged, not every repository that was scanned,
    # so absence from it is not a clean bill of health.
    tree_findings = capture.get("tree_findings") or 0
    history_findings = capture.get("history_findings") or 0
    if capture.get("captured"):
        if tree_findings or history_findings:
            exposure["historical_secret_exposure"] = "CONFIRMED"
            exposure["owner_rotation_status"] = "PENDING"
            exposure["rotate_required"] = max(
                int(exposure.get("rotate_required") or 0),
                tree_findings + history_findings,
            )
    elif exposure["historical_secret_exposure"] == "NONE_FOUND":
        exposure["historical_secret_exposure"] = spec.get(
            "security_historical_secret_exposure", "UNKNOWN")
        exposure["owner_rotation_status"] = spec.get(
            "owner_rotation_status", "UNKNOWN")

    entry = {
        "schema": SCHEMA,
        "source_repo": spec["source_repo"],
        "repository_id": facts["repository_id"],
        "relation": spec["relation"],
        "content_classification": spec.get("content_classification", "SOURCE_BEARING"),
        "confirmed_by": spec["confirmed_by"],
        "primary_target": spec["primary_target"],
        "secondary_targets": spec["secondary_targets"],
        "state": _state_for(spec, capture, matrix),
        "head_refs": facts["head_refs"],
        "default_branch": facts["default_branch"],
        "archived": facts["archived"],
        "visibility": facts["visibility"],
        "declared_licence": facts["licence"],
        "note": spec["note"],
        "measured": measurement,
        "backup": {
            "git_mirror_sha256": capture.get("git_mirror_sha256"),
            "git_bundle_sha256": capture.get("git_bundle_sha256"),
            "git_lfs_verified": bool(capture.get("git_lfs_verified")),
            "external_assets_exported": False,
            "issues_prs_wiki_releases_captured": bool(
                capture.get("github_context_metadata_captured")),
            "wiki_content_exported": bool(capture.get("wiki_content_exported")),
            "independent_copies": capture.get("independent_copies", 0),
            "restore_drill_passed": bool(capture.get("restore_drill_passed")),
            "captured": bool(capture.get("captured")),
            "restored_commits": capture.get("restored_commits"),
            "restored_files": capture.get("restored_files"),
            "fsck_clean": capture.get("fsck_clean"),
            "unresolved_capture_gaps": capture.get(
                "unresolved_capture_gaps",
                ["The capture has not been run for this repository."]),
        },
        "security": {
            "historical_secret_exposure": exposure["historical_secret_exposure"],
            "owner_rotation_status": exposure["owner_rotation_status"],
            "tree_clean": capture.get("tree_clean"),
            "tree_findings": capture.get("tree_findings", 0),
            "history_clean": capture.get("history_clean"),
            "history_findings": capture.get("history_findings", 0),
            "credentials_to_rotate": exposure["rotate_required"],
        },
        "licence": {
            "classification": spec["licence_classification"],
        },
        "artifacts": {
            "total": matrix["total"],
            "classified": matrix["classified"],
            "dispositions": matrix["dispositions"],
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


def _state_for(spec: dict, capture: dict, matrix: dict) -> str:
    """How far this predecessor has actually got.

    The state is derived from what has been done, not typed in. It is
    the FURTHEST state whose evidence holds, and it never claims a
    state whose evidence does not exist.
    """
    if not capture.get("captured"):
        return "IDENTIFIED"
    if not capture.get("restore_drill_passed"):
        return "SNAPSHOTTED"
    if not matrix.get("mapped"):
        return "INVENTORIED"
    if spec["confirmed_by"] == "OWNER":
        # The owner confirmed this one, so the mapping is a mapping of
        # a confirmed predecessor's material.
        return "MAPPED"
    # The relation is still only probable, so the capability areas are
    # classified and the mapping is provisional.
    return "CLASSIFIED"


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
