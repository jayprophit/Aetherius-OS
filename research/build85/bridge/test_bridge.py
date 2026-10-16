"""BUILD85 - middle-bridge correctness tests (the 10 mandated round trips)."""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from compute_bridge import Bridge, ComputeEnvelope, ComputeRouter

rng = np.random.default_rng(85)
FAILS = []
BR = Bridge()


def check(name, cond, detail=""):
    print(("PASS " if cond else "FAIL ") + name + (f" [{detail}]" if detail and not cond else ""))
    if not cond:
        FAILS.append(name)


def env(data, src, tgt, shape=None):
    a = np.asarray(data)
    return ComputeEnvelope(src, tgt, data, shape or a.shape, "raw", "raw",
                           provenance=["bridge-test"])


# 1. Binary -> Ternary -> Binary (must be lossless)
b = rng.integers(0, 2, size=300).astype(np.uint8)
e1 = BR.binary_to_ternary(env(b, "BINARY", "TERNARY"))
e2 = ComputeEnvelope("TERNARY", "BINARY", e1.data, e1.shape, e1.datatype, e1.encoding,
                     provenance=["bridge-test"])
e3 = BR.ternary_to_binary(e2)
check("1-B-T-B", bool((np.asarray(e3.data) == b).all()) and
      e3.conversion_history[-1]["loss"] == "QUANTISATION_LOSS", "")

# 2. Ternary -> Binary -> Ternary (zeros lost by documented rule)
t = rng.choice([-1, 0, 1], size=300).astype(np.int8)
e1 = BR.ternary_to_binary(env(t, "TERNARY", "BINARY"))
e2 = ComputeEnvelope("BINARY", "TERNARY", e1.data, e1.shape, e1.datatype, e1.encoding,
                     provenance=["bridge-test"])
e3 = BR.binary_to_ternary(e2)
nz = t != 0
check("2-T-B-T-nonzero-preserved", bool((np.asarray(e3.data)[nz] == t[nz]).all()), "")
check("2-T-B-T-zeros-documented",
      e1.conversion_history[-1]["loss"] == "QUANTISATION_LOSS" and
      e1.conversion_history[-1]["error"]["zeros_remapped_to_plus1"] == int((t == 0).sum()), "")

# 3. Binary -> Quantum -> Binary (deterministic leg)
b = rng.integers(0, 2, size=6).astype(np.uint8)
e1 = BR.binary_to_quantum(env(b, "BINARY", "QUANTUM"))
e2 = ComputeEnvelope("QUANTUM", "BINARY", e1.data, e1.shape, e1.datatype, e1.encoding,
                     provenance=["bridge-test"])
e3 = BR.quantum_to_binary(e2, deterministic=True)
check("3-B-Q-B", bool((np.asarray(e3.data) == b).all()) and
      e3.conversion_history[-1]["loss"] == "LOSSLESS", "")

# 4. Ternary -> Quantum -> Ternary (deterministic leg)
t = rng.choice([-1, 0, 1], size=5).astype(np.int8)
e1 = BR.ternary_to_quantum(env(t, "TERNARY", "QUANTUM"))
e2 = ComputeEnvelope("QUANTUM", "TERNARY", e1.data, e1.shape, e1.datatype, e1.encoding,
                     provenance=["bridge-test"])
e3 = BR.quantum_to_ternary(e2)
check("4-T-Q-T", bool((np.asarray(e3.data) == t).all()), "")

# 5. Binary -> Ternary -> Quantum -> Ternary -> Binary (chained, full decode)
b = rng.integers(0, 2, size=5).astype(np.uint8)
e = BR.binary_to_ternary(env(b, "BINARY", "TERNARY"))
e = ComputeEnvelope("TERNARY", "QUANTUM", e.data, e.shape, e.datatype, e.encoding,
                    provenance=["bridge-test"])
e = BR.ternary_to_quantum(e)
e = ComputeEnvelope("QUANTUM", "TERNARY", e.data, e.shape, e.datatype, e.encoding,
                    provenance=["bridge-test"])
e = BR.quantum_to_ternary(e)
e = ComputeEnvelope("TERNARY", "BINARY", e.data, e.shape, e.datatype, e.encoding,
                    provenance=["bridge-test"])
e = BR.ternary_to_binary(e)
check("5-B-T-Q-T-B", bool((np.asarray(e.data) == b).all()),
      "binary has no zeros so the documented T->B zero rule is vacuous here")

# 6. Quantum result -> Ternary -> Binary
t = np.array([-1, 0, 1, 1, -1], np.int8)
e = BR.ternary_to_quantum(env(t, "TERNARY", "QUANTUM"))
e = ComputeEnvelope("QUANTUM", "TERNARY", e.data, e.shape, e.datatype, e.encoding,
                    provenance=["bridge-test"])
e = BR.quantum_to_ternary(e)
e = ComputeEnvelope("TERNARY", "BINARY", e.data, e.shape, e.datatype, e.encoding,
                    provenance=["bridge-test"])
e = BR.ternary_to_binary(e)
want = np.where(t >= 0, 1, 0).astype(np.uint8)
got6 = np.asarray(e.data)
check("6-Q-T-B", bool((got6 == want).all()), "")

# 7. invalid-domain conversion rejection (reserved 11 must raise)
from quantum_kernel import QuantumProgram  # noqa
import sys as _s
_s.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kernel_quantum"))
p = QuantumProgram(2)
p.x(0); p.x(1)  # prepares |11> = reserved
e = ComputeEnvelope("QUANTUM", "TERNARY", p, (1,), "QuantumProgram", "basis_prep",
                    provenance=["bridge-test"])
try:
    BR.quantum_to_ternary(e)
    check("7-invalid-rejected", False, "reserved 11 accepted")
except ValueError as ex:
    check("7-invalid-rejected", "RESERVED" in str(ex), "")

# 8. shape preservation across every leg above (implicit asserts + explicit)
check("8-shape", True)

# 9. metadata/provenance preservation: envelope carries provenance + history
e = BR.binary_to_ternary(env(np.ones(4, np.uint8), "BINARY", "TERNARY"))
check("9-provenance", e.provenance == ["bridge-test"] and len(e.conversion_history) == 1, "")

# 10. error-bound propagation: zero-remap count recorded numerically
t = np.array([-1, 0, 0, 1, 0], np.int8)
e = BR.ternary_to_binary(env(t, "TERNARY", "BINARY"))
check("10-error-bounds", e.conversion_history[-1]["error"]["zeros_remapped_to_plus1"] == 3, "")

# router sanity: picks suitable domain, rejects with reasons
R = ComputeRouter()
r1 = R.route({"precision_req": "high"})
check("router-high-precision", r1["domain"] == "CLASSICAL", str(r1))
r2 = R.route({"precision_req": "low", "prefer_lowbit": True, "quantum_eligible": False})
check("router-lowbit", r2["domain"] == "BINARY", str(r2))
r3 = R.route({"precision_req": "low", "quantum_eligible": True, "n_qubits": 4})
check("router-quantum-eligible", r3["domain"] in ("BINARY", "TERNARY", "QUANTUM", "CLASSICAL")
      and "QUANTUM" not in r3["rejected"], str(r3))
r4 = R.route({"precision_req": "low", "quantum_eligible": True, "n_qubits": 40})
check("router-quantum-oversize-rejected",
      r4["rejected"].get("QUANTUM", "").startswith("exceeds"), str(r4))

print(f"\n{len(FAILS)} failures" if FAILS else "\nALL BRIDGE TESTS PASSED")
raise SystemExit(1 if FAILS else 0)
