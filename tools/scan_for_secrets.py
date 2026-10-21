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
    # Found by the tree scan of the predecessor aetherial-platform on
    # 21 October 2026. The file is a spec for a JWT VALIDATOR, and the
    # two values are the fixtures that spec tests against: a JWT shape
    # with an alg/typ header and iat/name/sub claims, and no exp, iss or
    # aud. A token that a real system issues carries its expiry, its
    # issuer and its audience. These carry none of them, they are
    # declared as "validJWT" in a test file, and they are the subject of
    # the test rather than a credential the test uses.
    "tests/auth/validators/auth.validators.spec.ts": (
        "A spec for a JWT validator, holding the two JWT fixtures it tests "
        "against. The values have an alg/typ header and iat/name/sub claims "
        "and no exp, iss or aud, which is the shape of a hand-made fixture "
        "rather than of a token a real system issues."
    ),
    "tools/extract_codex_history.py": "This is the redactor. It holds the patterns it looks for.",
    "tools/generate_source_registry.py": "Holds a credential-shaped pattern it matches against.",
    "tools/scan_source_documents.py": "Holds a credential-shaped pattern it matches against.",
    "src/programme/proposals.test.ts": (
        "Holds deliberately fake credentials to prove the proposal validator rejects "
        "raw secrets. The values are not functional."
    ),
    # These were found by the history scan on 21 October 2026. Each one holds
    # a credential SHAPE and not a credential, and each has been checked.
    "tests/test_h07_h09.py": (
        "A test file for the secret detector itself. It holds a deliberately fake "
        "Anthropic-shaped key to prove the detector fires, and the file has since "
        "been deleted from the tree. The value is not functional."
    ),
    "knowledge_index.json": (
        "An indexed document that quotes a code sample showing an OpenRouter "
        "call. The key in the sample is seventeen characters, where a real one "
        "is seventy-four, so it is a truncated example rather than a working "
        "key. The file has since been deleted from the tree."
    ),
    "scripts/tests/chat-reconciliation.test.mjs": (
        "A test that proves the reconciler notices a URL carrying credentials. "
        "The URL is example.org and the userinfo is made up."
    ),
    "scripts/tests/scientific-catalogue-intake.test.mjs": (
        "A test that proves the intake rejects URLs it should not follow. The "
        "hosts are evil.example and the userinfo is made up."
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


def history_blobs(repo: Path) -> list[tuple[str, str]]:
    """Every blob ever committed, with the path it was committed at.

    A credential that was removed from the latest commit is still in the
    history, and the history is what the account publishes. Redaction in
    the tip is not redaction.

    The blob is identified by its content hash, and the path is the
    first one it was seen at, so a file that was renamed does not appear
    once per name.
    """
    out = subprocess.run(
        ["git", "-C", str(repo), "rev-list", "--objects", "--all"],
        capture_output=True, text=True, timeout=1800,
    )
    # A blob is identified by its content hash, so the same content
    # committed at two paths is one scan. But two DIFFERENT blobs at the
    # same path are two different pieces of content and both have to be
    # scanned: the earlier version of a file is exactly where a
    # credential that was later redacted still lives.
    seen: dict[str, str] = {}
    for line in (out.stdout or "").splitlines():
        if not line:
            continue
        parts = line.split(" ", 1)
        sha = parts[0]
        path = parts[1] if len(parts) > 1 else ""
        if not path:
            continue
        if any(f"/{d}/" in f"/{path}" for d in SKIP_DIRS):
            continue
        seen.setdefault(sha, path)
    return list(seen.items())


def blob_contents(repo: Path, shas: list[str]) -> dict[str, bytes]:
    """The bytes of many blobs, read in one pass.

    One `git cat-file` per blob is a process per blob, which is far too
    slow to run in a build. The batch form reads them all in one.
    """
    if not shas:
        return {}
    request = "\n".join(shas) + "\n"
    try:
        proc = subprocess.run(
            ["git", "-C", str(repo), "cat-file", "--batch"],
            input=request.encode("utf-8"), capture_output=True, timeout=1800,
        )
    except (OSError, subprocess.SubprocessError):
        return {}
    out = proc.stdout or b""
    contents: dict[str, bytes] = {}
    pos = 0
    for sha in shas:
        header_end = out.find(b"\n", pos)
        if header_end < 0:
            break
        header = out[pos:header_end].decode("utf-8", "replace").split()
        pos = header_end + 1
        if len(header) < 3:
            # "<sha> missing" or "<sha> ambiguous": the object is not here.
            continue
        try:
            size = int(header[2])
        except ValueError:
            continue
        contents[sha] = out[pos:pos + size]
        pos += size + 1
    return contents


def commits_with_blob(repo: Path, sha: str) -> list[str]:
    """The commits that carried a blob, so an owner can find it."""
    try:
        proc = subprocess.run(
            ["git", "-C", str(repo), "log", "--all", "--format=%H %cs %s",
             "--find-object=" + sha],
            capture_output=True, text=True, timeout=600,
        )
    except (OSError, subprocess.SubprocessError):
        return []
    return [ln for ln in (proc.stdout or "").splitlines() if ln.strip()]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo", default=str(REPO), help="repository to scan")
    ap.add_argument("--paths", nargs="*", default=None, help="scan these paths instead of the tracked tree")
    ap.add_argument("--history", action="store_true",
                    help="scan every blob ever committed, not only the ones in "
                         "the current tree. A credential removed from the tip "
                         "is still published in the history.")
    ap.add_argument("--history-limit", type=int, default=20000,
                    help="the most blobs to scan in a history scan")
    args = ap.parse_args()

    repo = Path(args.repo)
    if args.paths:
        candidates = list(args.paths)
    elif args.history:
        candidates = []
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

    if args.history:
        blobs = history_blobs(repo)[: args.history_limit]
        print(f"history scan: {len(blobs)} blob(s) ever committed")
        contents = blob_contents(repo, [sha for sha, _ in blobs])
        for sha, path in blobs:
            if allowlist_reason(path) is not None:
                continue
            raw = contents.get(sha)
            if not raw or len(raw) > MAX_BYTES:
                continue
            if b"\x00" in raw[:4096]:
                continue
            text = raw.decode("utf-8", errors="replace")
            hits = scan_text(path, text)
            if not hits:
                continue
            for kind, line in hits:
                print(f"  HISTORY FINDING {path} ({kind}) at line {line}, blob {sha[:12]}")
                for commit in commits_with_blob(repo, sha)[:5]:
                    print(f"      {commit[:120]}")
                print("      The value is not printed. Rotate it at the provider:")
                print("      a credential in a published history cannot be un-published.")
                findings.append((path, kind, line))

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
