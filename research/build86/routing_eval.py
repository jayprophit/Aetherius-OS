"""BUILD86 - routing evaluation against deterministic baselines.

Per R1 §29-§36: compare intelligent routing against:
  - always binary
  - static lookup
  - task-type rule
  - fixed priority

Record predicted vs actual for Genesis route learning (§37-§44).
"""
from __future__ import annotations

import sys
from pathlib import Path

# Resolve to build86 directory directly
ROOT = Path(__file__).resolve().parent  # .../build86
LEDGER = ROOT / "results.jsonl"  # .../build86/results.jsonl