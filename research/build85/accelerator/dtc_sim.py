"""BUILD85-R4 - bounded discrete-time-crystal (DTC) simulator experiment.

A DTC is a periodically driven many-body system whose observables respond at a
multiple of the drive period, robustly. Minimal model: N spins, Floquet cycle
of (imperfect global pi-flip about X) followed by (disordered ZZ evolution).
Signature under test: stroboscopic magnetisation shows period-DOUBLING that
persists for 50+ cycles despite flip error eps>0, while the non-interacting
control (J=0) dephases. Execution domain: QUANTUM_SIMULATED (exact classical
statevector of the driven spin chain). This is an accelerator-lane experiment,
not a claim of physical time-crystal hardware.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

OUT = Path(__file__).resolve().parent
N = 8
PERIODS = 60
EPS = 0.06
SEED = 85


def _kron_many(ops):
    M = ops[0]
    for o in ops[1:]:
        M = np.kron(M, o)
    return M


def build_floquet(J: float, hx: np.ndarray):
    X = np.array([[0, 1], [1, 0]], complex)
    Z = np.array([[1, 0], [0, -1]], complex)
    I = np.eye(2, dtype=complex)
    # imperfect global flip
    flip = _kron_many([np.cos(np.pi / 2 - EPS) * I - 1j * np.sin(np.pi / 2 - EPS) * X
                       for _ in range(N)])
    # disordered ZZ + longitudinal fields
    H = np.zeros((2 ** N, 2 ** N), dtype=complex)
    for i in range(N):
        ops = [I] * N
        ops[i] = Z
        H += hx[i] * _kron_many(ops)
        ops2 = [I] * N
        ops2[i] = Z
        ops2[(i + 1) % N] = Z
        H += J * _kron_many(ops2)
    evo = np.eye(2 ** N, dtype=complex)
    # exact evolution via eigendecomposition (2^8 is trivial)
    w, v = np.linalg.eigh(H)
    evo = (v * np.exp(-1j * w)) @ v.conj().T
    return evo @ flip


def run(J: float, hx: np.ndarray) -> dict:
    U = build_floquet(J, hx)
    Z = np.array([[1, 0], [0, -1]], complex)
    I = np.eye(2, dtype=complex)
    Z0 = _kron_many([Z] + [I] * (N - 1))
    psi = np.zeros(2 ** N, dtype=complex)
    psi[0] = 1.0  # all |0>
    mags = []
    for _ in range(PERIODS):
        psi = U @ psi
        mags.append(float((psi.conj() @ (Z0 @ psi)).real))
    mags = np.array(mags)
    # period-doubling score: correlation of m[t] with -m[t-1], late-time window
    late = mags[PERIODS // 2:]
    score = float((late[1:] * -late[:-1]).mean() / max((late ** 2).mean(), 1e-12))
    alt = float(np.mean(np.sign(late[1:]) != np.sign(late[:-1])))
    return {"mags": [round(float(v), 5) for v in mags],
            "late_window": [PERIODS // 2, PERIODS],
            "period2_score": round(score, 4),
            "alternation_fraction": round(alt, 4),
            "mean_abs_late": round(float(np.abs(late).mean()), 4)}


def main() -> None:
    rng = np.random.default_rng(SEED)
    hx = rng.uniform(-1.0, 1.0, N) * 0.8
    dtc = run(1.0, hx)
    ctrl = run(0.0, hx)
    verdict = ("DTC_SIGNATURE_PRESENT" if dtc["period2_score"] > 0.95 and
               dtc["mean_abs_late"] > 0.9 and
               dtc["mean_abs_late"] - ctrl["mean_abs_late"] > 0.2
               else "DTC_SIGNATURE_ABSENT")
    report = {
        "experiment_id": "B85-TC-DTC-8SPIN",
        "execution_domain": "QUANTUM_SIMULATED",
        "model": "N=8 driven spin chain, eps=0.06, 60 Floquet periods, exact evolution",
        "interacting_J1.0": {k: v for k, v in dtc.items() if k != "mags"},
        "control_J0.0": {k: v for k, v in ctrl.items() if k != "mags"},
        "verdict": verdict,
        "status": "OK",
        "notes": "simulator experiment for the accelerator lane; not physical hardware",
    }
    (OUT / "timecrystal_dtc.json").write_text(json.dumps(report, indent=2))
    print(json.dumps({k: report[k] for k in
                      ("interacting_J1.0", "control_J0.0", "verdict", "status")}, indent=2))


if __name__ == "__main__":
    main()