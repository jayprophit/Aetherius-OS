"""BUILD86-R5 secret/credential scan."""
import os
import re
from pathlib import Path

# Resolve project root relative to this script's location
_PROJECT = Path(__file__).resolve().parent.parent  # .../build86
build86_dir = str(_PROJECT / "research" / "build86")
secrets_found = []

# Check for common secret patterns in .py files
for root, dirs, files in os.walk(build86_dir):
    dirs[:] = [d for d in dirs if d != "__pycache__"]
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            try:
                with open(path, encoding="utf-8", errors="replace") as fh:
                    content = fh.read()
                    patterns = [
                        (r"[sk]?[a-zA-Z0-9]{32,}", "possible API key/token"),
                        (r"[a-zA-Z0-9]{20,}:\w+", "possible key:val format"),
                        (r"password\s*=\s*['\"", "password assignment"),
                        (r"__[a-z]+__\s*=\s*['\"][^\'\"]{10,}['\"]", "hardcoded secret"),
                    ]
                    for pattern, desc in patterns:
                        matches = re.findall(pattern, content)
                        if matches:
                            secrets_found.append((path, desc, matches[:2]))
            except Exception as e:
                pass

if secrets_found:
    print("SECRETS FOUND:")
    for path, desc, matches in secrets_found:
        print(f"  {path}: {desc} -> {matches}")
else:
    print("No secrets detected in BUILD86 Python files")

# Also check for .env files
for root, dirs, files in os.walk(build86_dir):
    for f in files:
        if f == ".env":
            path = os.path.join(root, f)
            print(f"WARNING: .env file found: {path}")