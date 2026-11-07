import json

import numpy as np
import pytest

from aetherius_kernel import (
    MAX_SIMULATED_QUBITS,
    LocalStatevectorBackend,
    QuantumProgram,
    QuantumUnavailableError,
    RemoteQPUBackend,
    probs_of,
)

BE = LocalStatevectorBackend()


def test_x_gate():
    r = BE.run(QuantumProgram(1).x(0))
    assert abs(probs_of(r, "1") - 1.0) < 1e-12


def test_hadamard_superposition():
    r = BE.run(QuantumProgram(1).h(0), shots=4000, seed=85)
    f0 = r.counts.get("0", 0) / 4000
    assert abs(f0 - 0.5) < 0.03


def test_bell_entanglement():
    r = BE.run(QuantumProgram(2).h(0).cnot(0, 1), shots=4000, seed=85)
    assert set(r.counts) <= {"00", "11"}
    assert sum(r.counts.values()) == 4000
    assert abs(r.counts.get("00", 0) - r.counts.get("11", 0)) / 4000 < 0.05


@pytest.mark.parametrize("a,b", [(0, 0), (0, 1), (1, 0), (1, 1)])
def test_toffoli_truth_table(a, b):
    p = QuantumProgram(3)
    if a:
        p.x(0)
    if b:
        p.x(1)
    p.toffoli(0, 1, 2)
    r = BE.run(p)
    sv = np.asarray(r.statevector)
    mass = sum(
        float(abs(sv[i]) ** 2)
        for i in range(8)
        if ((i >> 2) & 1) == (a & b)
    )
    assert abs(mass - 1.0) < 1e-12


@pytest.mark.parametrize("deg", [0, 45, 90, 135, 180])
def test_rx_analytic(deg):
    theta = np.deg2rad(deg)
    r = BE.run(QuantumProgram(1).rx(0, theta))
    assert abs(probs_of(r, "0") - np.cos(theta / 2) ** 2) < 1e-9


def test_bernstein_vazirani():
    hidden = (1, 0, 1)
    p = QuantumProgram(4)
    for q in range(3):
        p.h(q)
    p.x(3).h(3)
    for i, bit in enumerate(hidden):
        if bit:
            p.cnot(i, 3)
    for q in range(3):
        p.h(q)
    r = BE.run(p, shots=500, seed=85)
    top = max(r.counts, key=r.counts.get)
    assert top[1:] == "101"


def test_remote_qpu_fails_closed():
    with pytest.raises(QuantumUnavailableError) as exc:
        RemoteQPUBackend().run(QuantumProgram(1).x(0))
    assert exc.value.code == "QUANTUM_HARDWARE_BLOCKED_DEPENDENCY"


def test_max_qubits_rejected():
    with pytest.raises(ValueError):
        QuantumProgram(MAX_SIMULATED_QUBITS + 1)


def test_unknown_gate_rejected():
    from aetherius_kernel.quantum import Gate

    p = QuantumProgram(1)
    p.gates.append(Gate("bogus", (0,)))
    with pytest.raises(ValueError):
        p.validate()


def test_result_json_serializable():
    r = BE.run(QuantumProgram(1).h(0), shots=10, seed=1)
    blob = json.dumps(r.to_dict())
    assert "QUANTUM_SIMULATED" in blob
    assert "statevector" in blob
