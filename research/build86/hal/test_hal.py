"""BUILD86 - HAL regression tests, especially the no-phantom-device rule."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hal import discover

FAILS = []


def check(name, cond, detail=""):
    print(("PASS " if cond else "FAIL ") + name + (f" [{detail}]" if detail and not cond else ""))
    if not cond:
        FAILS.append(name)


devs = discover()
by_id = {d.device_id: d for d in devs}

# no phantom physical ternary/quantum/accelerator on this PC
for d in devs:
    if d.domain in ("TERNARY", "QUANTUM", "ACCELERATOR"):
        check(f"no-phantom-physical:{d.device_id}",
              d.physicality != "PHYSICAL_LOCAL",
              f"physicality={d.physicality}")

# binary CPU is genuinely physical and available
check("cpu0-physical-available",
      by_id["cpu0"].physicality == "PHYSICAL_LOCAL" and by_id["cpu0"].available, "")

# every simulated device names a profile
for d in devs:
    if d.physicality == "SIMULATED_LOCAL":
        check(f"profile-pinned:{d.device_id}", bool(d.profile_id), "")

# physical QPU is present-but-not-connected, never available
q = by_id["qpu_physical_0"]
check("qpu-not-connected", (not q.available) and q.health == "NOT_CONNECTED", "")

# required device ids for VM-B inventory
for need in ("cpu0", "ternary_5500fp_sim0", "qpu_ibm_heron_sim0",
             "qpu_h2_sim0", "timecrystal_dtc_sim0"):
    check(f"inventory-has:{need}", need in by_id, "")

print(f"\n{len(FAILS)} failures" if FAILS else "\nALL HAL TESTS PASSED")
raise SystemExit(1 if FAILS else 0)
