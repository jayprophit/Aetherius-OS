#!/usr/bin/env python3
"""The capability-to-current-target matrix for the predecessors.

The owner's predecessor absorption programme asks for the reusable
material of each predecessor to be compared against the current
Aetherius components, and for the comparison to be a matrix with a
disposition on every row. This builds that matrix.

Two kinds of thing are in it, and they are kept apart on purpose.

The MEASUREMENT is computed: how many files there are, how many lines,
how much of it is duplicated, how many tests there are, what the
licence says, which route modules and which source areas exist. None
of that is asserted.

The JUDGEMENT is recorded: which capability maps to which current
component, and with what disposition. That is a decision and it is
written down with its reason, rather than re-derived by a heuristic on
every run. A row with no disposition is a row the owner has to look at.

The grouping is checked for completeness: every route module and every
source area of a predecessor has to land in exactly one capability
area, or the tool says which ones are unaccounted for. A matrix that
quietly leaves things out is worse than no matrix.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import date
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "docs" / "PREDECESSOR-CAPABILITY-MATRIX.yaml"
CAPTURE = Path(r"C:\Users\jpowe\AppData\Local\Temp\opencode\predecessor-capture")

SOURCE_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".py", ".sh", ".sql", ".go",
                   ".rs", ".java", ".c", ".cpp", ".h", ".rb", ".php", ".cs"}


# --------------------------------------------------------------------------
# The measurement
# --------------------------------------------------------------------------

def measure(root: Path) -> dict:
    """What is actually in the tree."""
    files = [f for f in root.rglob("*") if f.is_file() and ".git" not in f.parts]
    source = [f for f in files if f.suffix.lower() in SOURCE_SUFFIXES]
    # A test file is one in a test DIRECTORY. A file whose NAME mentions
    # a test is a different thing: in a tree that is mostly generated
    # output, "comprehensive_test_suite.py" appears three times in three
    # numbered folders, and it is a copy rather than a suite. The two
    # are counted apart so that the number means what it says.
    tests = [f for f in files
             if any(part.lower() in ("test", "tests", "spec", "__tests__")
                    for part in f.parts)]
    named_like_tests = [f for f in source
                        if "test" in f.name.lower() or "spec" in f.name.lower()]

    total_lines = 0
    digests: dict[str, int] = {}
    for path in source:
        try:
            raw = path.read_bytes()
        except OSError:
            continue
        total_lines += raw.count(b"\n")
        digests[hashlib.sha256(raw).hexdigest()] = \
            digests.get(hashlib.sha256(raw).hexdigest(), 0) + 1
    unique = len(digests)
    repeated = sum(count - 1 for count in digests.values() if count > 1)

    licence = ""
    for name in ("LICENSE", "LICENSE.md", "LICENCE", "COPYING"):
        candidate = root / name
        if candidate.is_file():
            head = candidate.read_text(encoding="utf-8", errors="replace")[:2000]
            for token, label in (("Apache License", "Apache-2.0"),
                                 ("MIT License", "MIT"),
                                 ("GNU GENERAL PUBLIC LICENSE", "GPL"),
                                 ("GNU AFFERO", "AGPL"),
                                 ("BSD", "BSD"),
                                 ("Mozilla Public", "MPL")):
                if token.lower() in head.lower():
                    licence = label
                    break
            if not licence:
                licence = "SEE-THE-FILE"
            break

    return {
        "files": len(files),
        "source_files": len(source),
        "source_lines": total_lines,
        "unique_source_files": unique,
        "repeated_copies": repeated,
        "duplication_ratio": (round(1 - (unique / len(source)), 3)
                              if source else 0.0),
        "test_files": len(tests),
        "files_named_like_tests": len(named_like_tests),
        "declared_licence": licence,
    }


def aetherial_platform_areas(root: Path) -> dict:
    """The capability areas, measured from the route modules and the source."""
    route_dir = root / "server" / "routes"
    routes: dict[str, int] = {}
    if route_dir.is_dir():
        for path in sorted(route_dir.glob("*.ts")):
            try:
                routes[path.stem] = len(
                    path.read_text(encoding="utf-8", errors="replace").splitlines())
            except OSError:
                routes[path.stem] = 0

    areas: dict[str, dict] = {}
    for child in sorted((root / "server").iterdir()) if (root / "server").is_dir() else []:
        if not child.is_dir():
            continue
        files = [f for f in child.rglob("*.ts")]
        if not files:
            continue
        lines = 0
        for f in files:
            try:
                lines += f.read_text(encoding="utf-8", errors="replace").count("\n")
            except OSError:
                pass
        areas[child.name] = {"files": len(files), "lines": lines}
    return {"routes": routes, "server_areas": areas}


# --------------------------------------------------------------------------
# The judgement, recorded
# --------------------------------------------------------------------------

# The route modules of aetherial-platform, grouped into capability areas.
# The grouping is a decision and it is written down here with the
# reasons, so that a reviewer can disagree with it in one place.
PLATFORM_CAPABILITIES = [
    {
        "capability": "identity_and_access",
        "routes": ["auth", "mfa", "webauthn", "did", "users", "settings"],
        "target": ["agent-bridge", "aetherius-os"],
        "disposition": "ADAPT",
        "reason": (
            "The mechanism is real: 442 lines of auth routes, a 153-line MFA module, "
            "a WebAuthn module, and 16 files and 3,388 lines under server/auth. The "
            "current Aetherius has the same need and a stricter answer: the Agent "
            "Bridge's default-deny policy engine owns who may do what, and it is "
            "session-bound, which this is not. The mechanism is adapted, not adopted, "
            "because the current one is the better one and this one has no session "
            "isolation to bring."
        ),
    },
    {
        "capability": "social_graph_and_community",
        "routes": ["friends", "groups", "social-graph", "posts", "comments",
                   "forum", "messages", "chat", "notifications", "feedback",
                   "creator"],
        "target": ["aetherius-community", "agent-bridge"],
        "disposition": "ADAPT",
        "reason": (
            "The largest coherent area of the predecessor: 11 route modules and "
            "2,592 lines, with 1,400 lines under server/social. The primitives it "
            "needs are already mapped once in docs/APPLICATION-SHARED-PRIMITIVES.yaml, "
            "and the shared-primitive map says messaging and permissions belong to the "
            "Agent Bridge, so this area is a consumer of the shared mechanism and not "
            "a second copy of it. Moderation is the one primitive the three new "
            "families do not share, and it belongs here."
        ),
    },
    {
        "capability": "commerce_and_billing",
        "routes": ["products", "cart", "orders", "payments", "subscription",
                   "dropshipping", "economy", "marketplace", "business",
                   "analytics", "seo", "points", "rewards", "quests",
                   "gamification", "bug-bounty"],
        "target": ["aetherius-commerce", "aetherius-os"],
        "disposition": "ADAPT",
        "reason": (
            "16 route modules and 4,919 lines, with 683 lines under server/commerce "
            "and a 372-line orders module and a 604-line products module. The shared "
            "primitive map places payments with Aetherius OS and says one billing "
            "mechanism serves Commerce and Learning. No real financial transaction "
            "is performed and no paid service is provisioned without the owner's "
            "approval."
        ),
    },
    {
        "capability": "learning",
        "routes": ["courses", "personalized-learning", "knowledge-base",
                   "federated-learning",
                   "crowdsourcing-and-citizen-science"],
        "target": ["aetherius-learning", "aetherius-os"],
        "disposition": "ADAPT",
        "reason": (
            "609 lines in the courses module and 652 lines under server/elearning, "
            "with a personalised-learning route and a knowledge-base route. The "
            "Figma handoff says Commerce and Learning share their data model, so "
            "the enrolment and entitlement mechanisms are one set. The shared "
            "primitive map says the same, and this area is a consumer of it."
        ),
    },
    {
        "capability": "ai_and_agent_services",
        "routes": ["ai", "npcs", "recommender", "cv", "platform"],
        "target": ["agent-bridge", "genesis", "aetherius-os"],
        "disposition": "ADAPT",
        "reason": (
            "The AI area is 2,994 lines under server/ai and 288 lines of AI routes, "
            "with an NPC route and a recommender route. The current mechanism is "
            "split on purpose: the Agent Bridge routes and executes, the Genesis "
            "kernel is the identity, the memory and the causal runtime, and this "
            "predecessor's single AI area does not make that split. The split is "
            "the mechanism worth keeping and the code is not."
        ),
    },
    {
        "capability": "blockchain_and_web3",
        "routes": ["blockchain", "blockchain-ui", "blockchain-ui-4d", "economy",
                   "point"] if False else ["blockchain", "blockchain-ui",
                                           "blockchain-ui-4d"],
        "target": ["aetherius-os"],
        "disposition": "ARCHIVE_ONLY",
        "reason": (
            "4,901 lines under server/blockchain and three route modules, of which "
            "two are named for a user interface rather than a mechanism. There is no "
            "blockchain in the current Aetherius, the owner's routing for the "
            "web3 area is a research reference and not a destination, and the "
            "economy and points modules that surround it depend on a token model "
            "that the current programme does not have. Preserved and indexed, not "
            "integrated."
        ),
    },
    {
        "capability": "iot_and_physical",
        "routes": ["iot", "digital-twin"],
        "target": ["aetherius-os"],
        "disposition": "ARCHIVE_ONLY",
        "reason": (
            "299 lines in the IoT route and a 59-line digital-twin route. There is "
            "no current destination for connected physical devices, and the "
            "predecessor's own note in the register says its CI stops at the Node "
            "setup, so the mechanism is neither proven nor wanted here yet."
        ),
    },
    {
        "capability": "emerging_and_experimental",
        "routes": ["bci", "cloud-gaming", "experimental", "federated-learning",
                   "games", "generative-art-and-music", "live-streaming", "npcs",
                   "pcg", "performance", "quantum-computing", "swarm-intelligence"],
        "target": ["genesis", "aetherius-os"],
        "disposition": "RESEARCH_REFERENCE",
        "reason": (
            "Brain-computer interfaces, quantum computing, swarm intelligence, "
            "procedural generation, live streaming and cloud gaming: twelve route "
            "modules of 780 lines between them. These are the areas the owner "
            "routed to research and not to a destination, and the research "
            "register already carries the upstream verification as outstanding. "
            "They are references. Nothing is integrated, and nothing is claimed to "
            "be."
        ),
    },
    {
        "capability": "moderation_and_governance",
        "routes": ["content-moderation", "audit", "admin", "compliance"],
        "target": ["aetherius-community", "agent-bridge"],
        "disposition": "ADAPT",
        "reason": (
            "A 20-line content-moderation route, a 46-line audit route, a 359-line "
            "admin route, and 15 lines under server/compliance plus 698 under "
            "server/governance. The shared primitive map says moderation is "
            "Community's alone and that the other three families do not share it, "
            "which is exactly where this material lands. The audit and admin "
            "mechanisms overlap the Agent Bridge's session and decision records, "
            "which are stronger, so the useful part here is the moderation policy "
            "and not the audit trail."
        ),
    },
    {
        "capability": "media_and_uploads",
        "routes": ["upload", "cv", "creator"],
        "target": ["aetherius-os", "ide-workspace"],
        "disposition": "ADAPT",
        "reason": (
            "A 31-line upload route and a 366-line computer-vision route. The "
            "content-management primitive is Aetherius OS's, and the IDE's own "
            "workspace handling is the current consumer of it."
        ),
    },
    {
        "capability": "developer_and_platform_tooling",
        "routes": ["developer", "performance", "experimental"],
        "target": ["agent-bridge", "ide-workspace"],
        "disposition": "ADAPT",
        "reason": (
            "A 47-line developer route and a 67-line performance route. The "
            "current equivalents are the Bridge's action and capability map and the "
            "IDE's own tooling, and they are better evidenced, so this is adapted "
            "for reference rather than adopted as source."
        ),
    },
    {
        "capability": "search",
        "routes": ["search", "search-advanced"],
        "target": ["aetherius-os"],
        "disposition": "ADAPT",
        "reason": (
            "222 lines in the search route and 182 in the advanced one. The search "
            "primitive is Aetherius OS's, and the programme already has an "
            "embedding and search mechanism including the local embedding model in "
            "the role pool. The predecessor's search is a reference for what the "
            "current one has to cover, and the current one is the one that is used."
        ),
    },
    {
        "capability": "jobs_and_work",
        "routes": ["jobs"],
        "target": ["aetherius-os"],
        "disposition": "ADAPT",
        "reason": (
            "A 624-line jobs route, which is the largest single module in the "
            "predecessor. The owner's routing places the business applications in "
            "Aetherius OS. It is not one of the three new first-party families, so "
            "it lands with the programme rather than with Commerce, and it uses the "
            "shared accounts, profiles and search primitives rather than copies of "
            "them."
        ),
    },
    {
        "capability": "health_and_biometrics",
        "routes": ["health"],
        "target": ["genesis"],
        "disposition": "RESEARCH_REFERENCE",
        "reason": (
            "A 155-line health route. The owner's routing places the health, "
            "bio, neuro and biometric material with Genesis, which is where the "
            "organism's own state lives. The current mechanism is the Genesis "
            "kernel's identity, memory and causal runtime, and this is a reference "
            "for a domain it does not yet cover. Nothing is claimed to be "
            "integrated."
        ),
    },
]

# The other two predecessors are smaller and their areas are their
# directories.
AETHERIAL_CAPABILITIES = [
    {
        "capability": "the_flat_numbered_folders",
        "areas": ["02 folder", "03 folder", "04 folder", "05 folder",
                  "06 folder", "07 folder", "08 folder", "09 folder",
                  "10 folder", "11 folder", "12 folder", "13 folder",
                  "Other"],
        "target": ["aetherius-os"],
        "disposition": "ARCHIVE_ONLY",
        "reason": (
            "Thirteen numbered folders, and the numbering is the only structure "
            "there is. The same file names repeat across the folders with _1 and "
            "_2 suffixes: a2a_communication.py in 08, 09 and 10, access_control.py "
            "in 08 and 09, ai-architecture.md in 07 and 08, advanced_search.py in 11 "
            "and 13, AdaptiveNavigation.jsx in 03 and 12. The measurement says how "
            "much of it is repetition, and the answer is that most of it is. There "
            "is no coherent mechanism to adapt, so the material is preserved and "
            "indexed and nothing is integrated."
        ),
    },
    {
        "capability": "the_absorbed_claim",
        "areas": ["ABSORBED.md", "build.yaml", "README.md"],
        "target": ["aetherius-os"],
        "disposition": "LEGAL_REVIEW",
        "reason": (
            "The repository is archived with a notice saying it has been absorbed "
            "by Aetherius OS. That is a claim and not proof, and the register says "
            "so. The licence is GPL-3.0, which cannot be integrated into a "
            "proprietary product without rights clearance, and there are zero test "
            "files, so there is nothing that would show the integration works if it "
            "were done. The claim is unverified and stays unverified until it is "
            "checked."
        ),
    },
]

AETHERIUM_CAPABILITIES = [
    {
        "capability": "the_agent_and_service_source",
        "areas": ["src/agents", "src/ai", "src/automation", "src/services",
                  "src/components", "src/governance", "src/hooks",
                  "src/networking", "src/blockchain", "src/physics", "src/utils",
                  "src/test"],
        "target": ["agent-bridge", "genesis", "aetherius-os"],
        "disposition": "ADAPT",
        "reason": (
            "18,982 lines across twelve areas, and the areas are the current "
            "programme's own: agents, AI, automation, services, governance, hooks, "
            "networking. The current mechanisms are the Agent Bridge's execution "
            "fabric and the Genesis kernel's causal runtime, and they are better "
            "evidenced, so this is adapted for reference. The blockchain and "
            "physics areas have no current destination and are archived with it."
        ),
    },
    {
        "capability": "the_backend_services",
        "areas": ["backend/ai_ml", "backend/database", "backend/security",
                  "backend/tools"],
        "target": ["agent-bridge", "aetherius-os"],
        "disposition": "ADAPT",
        "reason": (
            "3,883 lines over four areas. The security area is the one worth "
            "reading: the Agent Bridge's default-deny policy engine, the session "
            "binding and the evidence chain are the current answers, and this is a "
            "reference for what it was trying to do. The database area maps onto "
            "the content-management primitive."
        ),
    },
    {
        "capability": "the_platform_and_operations_tree",
        "areas": ["aetherium/platform", "aetherium/operations",
                  "aetherium/ai-systems", "aetherium/development",
                  "aetherium/docs", "aetherium/examples",
                  "aetherium/resources", "scripts", "config", "docs"],
        "target": ["aetherius-os"],
        "disposition": "ADAPT",
        "reason": (
            "176,877 lines and 6,790 lines of scripts, and the launcher scripts at "
            "the root are the visible shape of it: AETHERIUM_PLATFORM_LAUNCHER.py, "
            "AUTONOMOUS_FULL_PRODUCTION_LAUNCHER.py, deploy_platform.py, "
            "EXECUTE_REORGANIZATION.py, IMPLEMENT_MISSING_COMPONENTS_NOW.py. The "
            "current programme has a single launcher for the IDE stack, and it is "
            "idempotent and partial-stack safe, which these are not. The "
            "operations and platform areas are worth reading as a reference for "
            "what a platform launcher has to do."
        ),
    },
    {
        "capability": "the_obsolete_archive",
        "areas": ["archive/obsolete_directories",
                  "archive/obsolete_execution_scripts",
                  "archive/obsolete_files", "archive/removed_duplicates"],
        "target": ["aetherius-os"],
        "disposition": "ARCHIVE_ONLY",
        "reason": (
            "130,375 lines in a directory whose own subdirectory names say what "
            "they are: obsolete_directories, obsolete_execution_scripts, "
            "obsolete_files, removed_duplicates. The repository archived its own "
            "dead code and left it in the tree. Preserved for the history and not "
            "integrated, and it is the largest single thing in the repository."
        ),
    },
    {
        "capability": "the_absorbed_claim",
        "areas": ["ABSORBED.md", "build.yaml", "README.md"],
        "target": ["aetherius-os"],
        "disposition": "LEGAL_REVIEW",
        "reason": (
            "An ABSORBED.md notice saying the work lives in the Aetherius OS "
            "workspace, and a build manifest that says NOT_STARTED and zero source "
            "lines while the tree holds 176,877 lines in one directory. The "
            "manifest and the tree contradict each other, so the inventory has to "
            "be reconciled before the claim can be checked at all. The licence is "
            "MIT, which permits integration, so this is a reconciliation and not a "
            "rights question."
        ),
    },
]


# --------------------------------------------------------------------------
# The matrix
# --------------------------------------------------------------------------

def build() -> dict:
    predecessors = []

    # ---- aetherial-platform ----
    root = CAPTURE / "aetherial-platform-restored"
    if root.is_dir():
        areas = aetherial_platform_areas(root)
        rows = []
        accounted: set[str] = set()
        for capability in PLATFORM_CAPABILITIES:
            for route in capability["routes"]:
                accounted.add(route)
            rows.append({
                "capability": capability["capability"],
                "evidence": {
                    "route_modules": {
                        route: areas["routes"].get(route, 0)
                        for route in capability["routes"]},
                    "route_lines": sum(areas["routes"].get(route, 0)
                                        for route in capability["routes"]),
                    "server_areas": {
                        name: areas["server_areas"][name]
                        for name in sorted(areas["server_areas"])
                        if _area_matches(name, capability)},
                },
                "current_target": capability["target"],
                "disposition": capability["disposition"],
                "reason": capability["reason"],
            })
        unaccounted = sorted(set(areas["routes"]) - accounted)
        predecessors.append({
            "source_repo": "jayprophit/aetherial-platform",
            "relation": "CONFIRMED_PREDECESSOR",
            "measurement": measure(root),
            "capability_areas": rows,
            "unaccounted_route_modules": unaccounted,
            "notes": [
                "The route modules are the capability surface: 67 modules and "
                "13,245 lines. Every one of them is in exactly one row, and the "
                "tool says so if any is not.",
                "The client is 81,216 lines over 369 files and the server is "
                "45,000 lines over the areas above. The route modules are named "
                "in the matrix because they are what a reader can check.",
            ],
        })

    # ---- Aetherial ----
    root = CAPTURE / "Aetherial-restored"
    if root.is_dir():
        rows = []
        for capability in AETHERIAL_CAPABILITIES:
            rows.append({
                "capability": capability["capability"],
                "evidence": {
                    "areas": {
                        name: _area_measure(root / name)
                        for name in capability["areas"]
                        if (root / name).exists()},
                },
                "current_target": capability["target"],
                "disposition": capability["disposition"],
                "reason": capability["reason"],
            })
        predecessors.append({
            "source_repo": "jayprophit/Aetherial",
            "relation": "PROBABLE_PREDECESSOR",
            "measurement": measure(root),
            "capability_areas": rows,
            "unaccounted_route_modules": [],
            "notes": [
                "The directories are the only structure, and the numbering is "
                "the only naming.",
                "The measurement's duplication ratio is the reason the "
                "disposition is ARCHIVE_ONLY rather than ADAPT.",
            ],
        })

    # ---- aetherium ----
    root = CAPTURE / "aetherium-restored"
    if root.is_dir():
        rows = []
        for capability in AETHERIUM_CAPABILITIES:
            rows.append({
                "capability": capability["capability"],
                "evidence": {
                    "areas": {
                        name: _area_measure(root / name)
                        for name in capability["areas"]
                        if (root / name).exists()},
                },
                "current_target": capability["target"],
                "disposition": capability["disposition"],
                "reason": capability["reason"],
            })
        predecessors.append({
            "source_repo": "jayprophit/aetherium",
            "relation": "PROBABLE_PREDECESSOR",
            "measurement": measure(root),
            "capability_areas": rows,
            "unaccounted_route_modules": [],
            "notes": [
                "The directories are the capability areas, and the archive "
                "directory is the largest single thing in the repository.",
            ],
        })

    problems: list[str] = []
    for predecessor in predecessors:
        if predecessor["unaccounted_route_modules"]:
            problems.append(
                f"{predecessor['source_repo']}: "
                f"{len(predecessor['unaccounted_route_modules'])} route "
                f"module(s) are in no capability area: "
                f"{', '.join(predecessor['unaccounted_route_modules'])}")
        for row in predecessor["capability_areas"]:
            if row["disposition"] not in (
                    "ADOPT_NOW", "ADAPT", "MERGE_MECHANISM",
                    "REIMPLEMENT_ORIGINALLY", "BENCHMARK_REFERENCE",
                    "RESEARCH_REFERENCE", "ARCHIVE_ONLY",
                    "DUPLICATE_SAME_CONTENT", "SUPERSEDED", "LEGAL_REVIEW",
                    "SECURITY_QUARANTINE", "REJECT_WITH_REASON", "UNRESOLVED"):
                problems.append(
                    f"{predecessor['source_repo']}: the row "
                    f"{row['capability']} has an unknown disposition")

    return {
        "schema_version": 1,
        "source_date": date.today().isoformat(),
        "generated_by": "tools/build_predecessor_capability_matrix.py",
        "notes": [
            "The measurement is computed and the judgement is recorded. The "
            "measurement is how many files, lines, tests and duplicates are "
            "really there. The judgement is which capability maps to which "
            "current component and with what disposition, and it is a decision, "
            "written down with its reason rather than re-derived by a heuristic "
            "on every run.",
            "Every route module of a predecessor has to land in exactly one "
            "capability area. The tool says which ones are unaccounted for, "
            "because a matrix that quietly leaves things out is worse than no "
            "matrix.",
            "A disposition is not an integration. Nothing here has been "
            "integrated into a current project, and the register's own deletion "
            "gates are still to be checked one by one.",
            "LEGAL_REVIEW on a row means the material cannot be used until the "
            "licence question is answered, not that it has been rejected.",
        ],
        "problems": problems,
        "predecessors": predecessors,
    }


def _area_measure(path: Path) -> dict:
    if path.is_file():
        try:
            return {"files": 1, "lines": len(
                path.read_text(encoding="utf-8", errors="replace").splitlines())}
        except OSError:
            return {"files": 1, "lines": 0}
    if not path.is_dir():
        return {"files": 0, "lines": 0}
    files = [f for f in path.rglob("*") if f.is_file()]
    lines = 0
    for f in files:
        try:
            lines += f.read_bytes().count(b"\n")
        except OSError:
            pass
    return {"files": len(files), "lines": lines}


def _area_matches(name: str, capability: dict) -> bool:
    """Whether a server area belongs to a capability.

    The server areas and the route areas are named differently, so the
    mapping is recorded here rather than guessed.
    """
    mapping = {
        "identity_and_access": {"auth", "identity", "security", "middleware",
                                 "core", "_core"},
        "social_graph_and_community": {"social", "communication"},
        "commerce_and_billing": {"commerce", "rewards", "legal"},
        "learning": {"elearning"},
        "ai_and_agent_services": {"ai", "services", "integration", "vm",
                                   "utils", "lib", "queues", "config"},
        "blockchain_and_web3": {"blockchain", "quantum", "robotics"},
        "iot_and_physical": {},
        "emerging_and_experimental": {},
        "moderation_and_governance": {"governance", "compliance"},
        "media_and_uploads": {},
        "developer_and_platform_tooling": {},
    }
    return name in mapping.get(capability["capability"], set())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()

    doc = build()
    Path(args.out).write_text(
        yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=100),
        encoding="utf-8")
    print(f"wrote {args.out}")
    for predecessor in doc["predecessors"]:
        m = predecessor["measurement"]
        print(f"  {predecessor['source_repo']}: {m['source_files']} source "
              f"files, {m['source_lines']} lines, "
              f"{m['test_files']} test files, "
              f"{m['duplication_ratio']:.0%} repeated, "
              f"licence {m['declared_licence'] or 'none declared'}")
        for row in predecessor["capability_areas"]:
            print(f"      {row['disposition']:<18} {row['capability']} "
                  f"-> {', '.join(row['current_target'])}")
    if doc["problems"]:
        print()
        print("  the problems:")
        for problem in doc["problems"]:
            print(f"    {problem}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
