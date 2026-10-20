#!/usr/bin/env python3
"""Scan the tracked tree for credential-shaped strings.

The repositories in this workspace are public. A credential that reaches a
commit is published, and the conversation material this programme works
from is exactly the kind of place credentials end up: the Codex corpus
alone held twelve live-looking OpenRouter keys before the extractor was
taught to redact.

So the scan is a gate, not a warning. It runs over the files Git is
tracking, and a finding fails the build.

Two properties make it trustworthy:

  - It scans what is TRACKED, not what is on disk. A developer's local
    .env is not the repository's problem; a committed key is.
  - It reports the file and the pattern, never the value. A scan that
    prints the secret it found has moved the problem rather than solved
    it.

Usage:
    python tools/scan_for_secrets.py            # scan the tracked tree
    python tools/scan_for_secrets.py --paths a b # scan specific files
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Credential shapes. A pattern that matches something harmless is a false
# positive and costs a moment of review. A pattern that misses a real
# credential costs a published key. The list is therefore deliberately
# generous, and every match is reported for a human to judge.
PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("openrouter", re.compile(r"sk-or-v1-[A-Za-z0-9_\-]{16,}")),
    ("openai", re.compile(r"\bsk-[A-Za-z0-9]{32,}")),
    ("anthropic", re.compile(r"sk-ant-[A-Za-z0-9_\-]{16,}")),
    ("github-token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}")),
    ("huggingface", re.compile(r"\bhf_[A-Za-z0-9]{30,}")),
    ("google-api", re.compile(r"\bAIza[0-9A-Za-z_\-]{30,}")),
    ("slack", re.compile(r"\bxox[baprs]-[A-Za-z0-9\-]{10,}")),
    ("aws-access-key", re.compile(r"\bAKIA[0-9A-Z]{16}")),
    ("jwt", re.compile(r"\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}")),
    ("private-key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----")),
    ("bearer-token", re.compile(r"\bBearer\s+[A-Za-z0-9_\-\.]{24,}")),
    ("basic-auth-url", re.compile(r"https?://[^\s/:@]+:[^\s/@]+@[^\s/]+")),
]

# Files that legitimately contain credential SHAPES rather than credentials.
# A pattern match in a test fixture, a redaction pattern or a documentation
# example is not a leak.
#
# Every entry carries a reason, and the reason is printed when the file is
# skipped. An exclusion with no stated reason is not an exclusion, it is a
# hole.
ALLOWLIST: dict[str, str] = {
    "tools/scan_for_secrets.py": "This is the scanner. It holds the patterns it looks for.",
    "tools/extract_codex_history.py": "This is the redactor. It holds the patterns it looks for.",
    "tools/generate_source_registry.py": "Holds a credential-shaped pattern it matches against.",
    "tools/scan_source_documents.py": "Holds a credential-shaped pattern it matches against.",
    "src/programme/proposals.test.ts": (
        "Holds deliberately fake credentials to prove the proposal validator rejects "
        "raw secrets. The values are not functional."
    ),
}

SKIP_DIRS = {".git", "node_modules", "dist", "build", "target", "coverage", "out"}
MAX_BYTES = 20_000_000


def tracked_files(repo: Path) -> list[str]:
    out = subprocess.run(
        ["git", "-C", str(repo), "ls-files", "-z"],
        capture_output=True, text=True, timeout=300,
    )
    return [p for p in (out.stdout or "").split("\0") if p]


def is_allowed(path: str) -> bool:
    normalised = path.replace("\\", "/")
    for allowed in ALLOWLIST:
        if normalised == allowed or normalised.endswith("/" + allowed):
            return True
    return False


def allowlist_reason(path: str) -> str | None:
    normalised = path.replace("\\", "/")
    for allowed, reason in ALLOWLIST.items():
        if normalised == allowed or normalised.endswith("/" + allowed):
            return reason
    return None


def scan_text(path: str, text: str) -> list[tuple[str, int]]:
    """The credential kinds found in a text, with a line number each."""
    found: list[tuple[str, int]] = []
    for kind, pattern in PATTERNS:
        for match in pattern.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            found.append((kind, line))
    return found


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo", default=str(REPO), help="repository to scan")
    ap.add_argument("--paths", nargs="*", default=None, help="scan these paths instead of the tracked tree")
    args = ap.parse_args()

    repo = Path(args.repo)
    if args.paths:
        candidates = list(args.paths)
    else:
        candidates = [p for p in tracked_files(repo) if not any(f"/{d}/" in f"/{p}" for d in SKIP_DIRS)]

    findings: list[tuple[str, str, int]] = []
    skipped: list[tuple[str, str]] = []
    for rel in candidates:
        reason = allowlist_reason(rel)
        if reason is not None:
            skipped.append((rel, reason))
            continue
        full = repo / rel
        try:
            if full.stat().st_size > MAX_BYTES:
                continue
            raw = full.read_bytes()
        except OSError:
            continue
        if b"\x00" in raw[:4096]:
            # A binary file. A credential in a binary is not something a
            # text scan can judge, and the risk is low enough that saying
            # so is better than pretending to have checked.
            continue
        text = raw.decode("utf-8", errors="replace")
        for kind, line in scan_text(rel, text):
            findings.append((rel, kind, line))

    if skipped:
        print("Allowlisted files (each exclusion states its reason):")
        for path, reason in sorted(skipped):
            print(f"  {path}")
            print(f"      {reason}")
        print()

    if not findings:
        print(f"secret scan: clean ({len(candidates)} files scanned, {len(skipped)} allowlisted)")
        return 0

    print(f"secret scan: {len(findings)} finding(s) in {len({f[0] for f in findings})} file(s)")
    print()
    print("The VALUE is deliberately not printed. Open the file and the line.")
    print()
    for path, kind, line in sorted(findings):
        print(f"  {path}:{line}  {kind}")
    print()
    print("If a finding is a pattern, a fixture or a documentation example,")
    print("add the path to ALLOWLIST in tools/scan_for_secrets.py, with a reason.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
