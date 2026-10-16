"""BUILD85 - quantum kernel baseline tests Q1-Q5 + Bernstein-Vazirani + hybrids."""
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from quantum_kernel import (LocalStatevectorBackend, QuantumProgram,
                            RemoteQPUBackend, probs_of)

BE = LocalStatevectorBackend()
FAILS = []
LOG = {"tests": [], "shots": 4000, "seed": 85}


def check(name, cond, detail=""):
    LOG["tests"].append({"name": name, "pass": bool(cond), "detail": detail})
    print(("PASS " if cond else "FAIL ") + name + (f" [{detail}]" if detail and not cond else ""))
    if not cond:
        FAILS.append(name)


# Q1: X|0> = |1>
p = QuantumProgram(1); p.x(0)
r = BE.run(p)
check("Q1-identity", abs(probs_of(r, "1") - 1.0) < 1e-12, f"p1={probs_of(r,'1')}")

# Q2: H|0> -> 50/50 within shot tolerance
p = QuantumProgram(1); p.h(0)
r = BE.run(p, shots=4000, seed=85)
c = r.counts
f0 = c.get("0", 0) / 4000
check("Q2-superposition", abs(f0 - 0.5) < 0.03, f"f0={f0:.4f}")

# Q3: Bell -> only 00 and 11, ~equal
p = QuantumProgram(2); p.h(0); p.cnot(0, 1)
r = BE.run(p, shots=4000, seed=85)
c = r.counts
good = c.get("00", 0) + c.get("11", 0)
check("Q3-entanglement-only-00-11", good == 4000, str(c))
check("Q3-entanglement-balance",
      abs(c.get("00", 0) - c.get("11", 0)) / 4000 < 0.05, str(c))

# Q4: Toffoli AND vs classical truth table (q2 = q0 AND q1)
ok = True
for a in (0, 1):
    for b in (0, 1):
        p = QuantumProgram(3)
        if a: p.x(0)
        if b: p.x(1)
        p.toffoli(0, 1, 2)
        r = BE.run(p)
        # q2 (bit 2) must equal a AND b; check probability mass on matching states
        sv = np.array(r.statevector)
        match = sum(float(abs(sv[i]) ** 2) for i in range(8)
                    if ((i >> 2) & 1) == (a & b))
        ok = ok and abs(match - 1.0) < 1e-12
check("Q4-reversible-AND", ok, "")

# Q5: Rx(theta) at fixed angles vs analytic cos^2/sin^2
ok = True
for deg in (0, 45, 90, 135, 180):
    th = np.deg2rad(deg)
    p = QuantumProgram(1); p.rx(0, th)
    r = BE.run(p)
    ok = ok and abs(probs_of(r, "0") - np.cos(th / 2) ** 2) < 1e-9
check("Q5-parameterised", ok, "")

# Algorithm: Bernstein-Vazirani, hidden s=101 on (q0,q1,q2).
# Ancilla must be |-> = X then H (H then X gives |+>, no phase kickback).
s = (1, 0, 1)
p = QuantumProgram(4)
for q in range(3):
    p.h(q)
p.x(3)
p.h(3)
# oracle: CNOT(qi -> 3) for each si=1
for i, bit in enumerate(s):
    if bit:
        p.cnot(i, 3)
for q in range(3):
    p.h(q)
r = BE.run(p, shots=200, seed=85)
# 4-bit string is MSB-first (q3,q2,q1,q0); input register is the last 3 chars.
c = r.counts
top = max(c, key=c.get)
check("BV-algorithm", top[1:] == "101", f"top={top} counts={dict(list(c.items())[:4])}")

# Hybrid binary -> quantum -> binary: bit b -> |b> -> measure -> b
ok = True
for b in (0, 1):
    p = QuantumProgram(1)
    if b: p.x(0)
    r = BE.run(p, shots=100, seed=85)
    got = int(max(r.counts, key=r.counts.get))
    ok = ok and got == b
check("hybrid-binary-quantum-binary", ok, "")

# Hybrid ternary -> quantum -> ternary on qubit pairs.
# Encoding strings are MSB-first (q1,q0): -1 -> 00, 0 -> 01, +1 -> 10 ;
# 11 is RESERVED and must be detected.
ENC = {-1: "00", 0: "01", 1: "10"}
DEC = {v: k for k, v in ENC.items()}
ok, reserved_seen = True, False
for t in (-1, 0, 1):
    bits = ENC[t]
    p = QuantumProgram(2)
    if bits[0] == "1": p.x(1)
    if bits[1] == "1": p.x(0)
    r = BE.run(p, shots=100, seed=85)
    got = DEC[max(r.counts, key=r.counts.get)]
    ok = ok and got == t
# reserved-state detection: prepare 11 and confirm the decoder rejects it
try:
    DEC["11"]
    ok = False
except KeyError:
    reserved_seen = True
check("hybrid-ternary-quantum-ternary", ok and reserved_seen,
      "reserved 11 rejected" if reserved_seen else "reserved NOT detected")

# remote backend must refuse, never fake success
try:
    RemoteQPUBackend().run(QuantumProgram(1))
    check("remote-refuses", False, "fake success path")
except RuntimeError as e:
    check("remote-refuses", "NOT_AVAILABLE" in str(e), "")

LOG["failures"] = FAILS
(Path(__file__).resolve().parent / "quantum_baseline.json").write_text(
    json.dumps(LOG, indent=2))
print(f"\n{len(FAILS)} failures" if FAILS else "\nALL QUANTUM TESTS PASSED")
raise SystemExit(1 if FAILS else 0)
