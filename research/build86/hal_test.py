"""BUILD86 HAL acceptance test - portability fixed version."""
import os
import sys

# Use module-relative paths instead of hard-coded Windows paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(SCRIPT_DIR, "..", "..")

sys.path.insert(0, os.path.join(ROOT, "hal"))
sys.path.insert(0, os.path.join(ROOT, "..", "Aetherius-OS", "research", "build85", "kernel_ternary"))

from hal import discover

devices = discover()
print(f"HAL device discovery from {SCRIPT_DIR}:")
for d in devices:
    print(f"  {d.device_id}: phys={d.physicality} domain={d.domain}")