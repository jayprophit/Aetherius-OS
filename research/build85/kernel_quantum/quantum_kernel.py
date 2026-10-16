"""BUILD85 - quantum execution kernel (local statevector simulator).

Scope: QUANTUM_SIMULATED only. No remote QPU path is faked; the remote backend
raises a precise NOT_AVAILABLE error. A ternary symbol is NOT a qutrit: the
bridge encodes {-1,0,+1} onto qubit pairs with one reserved state.

Interface separation (mandated):
  QUANTUM_PROGRAM (circuit) / QUANTUM_BACKEND (executor) / EXECUTION_RESULT
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent

_H = np.array([[1, 1], [1, -1]], complex) / np.sqrt(2)
_X = np.array([[0, 1], [1, 0]], complex)
_CNOT = np.array([[1, 0, 0, 0], [0, 1, 0, 0],
                  [0, 0, 0, 1], [0, 0, 1, 0]], complex)


def _rx(theta: float) -> np.ndarray:
    return np.array([[np.cos(theta / 2), -1j * np.sin(theta / 2)],
                     [-1j * np.sin(theta / 2), np.cos(theta / 2)]], complex)


@dataclass
class QuantumProgram:
    n_qubits: int
    gates: list = field(default_factory=list)   # (name, targets, params)

    def h(self, q: int): self.gates.append(("h", (q,), ()))
    def x(self, q: int): self.gates.append(("x", (q,), ()))
    def cnot(self, c: int, t: int): self.gates.append(("cnot", (c, t), ()))
    def rx(self, q: int, theta: float): self.gates.append(("rx", (q,), (theta,)))
    def toffoli(self, c1: int, c2: int, t: int):
        self.gates.append(("toffoli", (c1, c2, t), ()))


def _apply_1q(state: np.ndarray, n: int, q: int, U: np.ndarray) -> np.ndarray:
    out = np.zeros_like(state)
    for i in range(2 ** n):
        b = (i >> q) & 1
        j = i ^ (1 << q)
        if b == 0:
            out[i] = U[0, 0] * state[i] + U[0, 1] * state[j]
        else:
            out[i] = U[1, 0] * state[j] + U[1, 1] * state[i]
    return out


def _apply_cnot(state: np.ndarray, n: int, c: int, t: int) -> np.ndarray:
    out = state.copy()
    for i in range(2 ** n):
        if ((i >> c) & 1) and not ((i >> t) & 1):
            j = i ^ (1 << t)
            out[i], out[j] = state[j], state[i]
    return out


def _apply_toffoli(state: np.ndarray, n: int, c1: int, c2: int, t: int) -> np.ndarray:
    out = state.copy()
    for i in range(2 ** n):
        if ((i >> c1) & 1) and ((i >> c2) & 1) and not ((i >> t) & 1):
            j = i ^ (1 << t)
            out[i], out[j] = state[j], state[i]
    return out


@dataclass
class ExecutionResult:
    domain: str                      # QUANTUM_SIMULATED
    n_qubits: int
    shots: int
    counts: dict
    statevector: list | None
    backend: str
    seed: int | None
    runtime_s: float
    metadata: dict


class LocalStatevectorBackend:
    name = "LocalStatevectorBackend"

    def run(self, prog: QuantumProgram, shots: int = 0, seed: int = 85):
        t0 = time.perf_counter()
        state = np.zeros(2 ** prog.n_qubits, complex)
        state[0] = 1.0
        for g, tgt, par in prog.gates:
            if g == "h":
                state = _apply_1q(state, prog.n_qubits, tgt[0], _H)
            elif g == "x":
                state = _apply_1q(state, prog.n_qubits, tgt[0], _X)
            elif g == "cnot":
                state = _apply_cnot(state, prog.n_qubits, *tgt)
            elif g == "rx":
                state = _apply_1q(state, prog.n_qubits, tgt[0], _rx(par[0]))
            elif g == "toffoli":
                state = _apply_toffoli(state, prog.n_qubits, *tgt)
            else:
                raise ValueError(f"unknown gate {g}")
        probs = (np.abs(state) ** 2).real
        counts = {}
        if shots:
            rng = np.random.default_rng(seed)
            draws = rng.choice(2 ** prog.n_qubits, size=shots, p=probs / probs.sum())
            for d in draws:
                key = format(int(d), f"0{prog.n_qubits}b")
                counts[key] = counts.get(key, 0) + 1
        return ExecutionResult("QUANTUM_SIMULATED", prog.n_qubits, shots, counts,
                               [complex(z) for z in state], self.name, seed,
                               time.perf_counter() - t0,
                               {"gate_count": len(prog.gates)})


class RemoteQPUBackend:
    name = "RemoteQPUBackend"

    def run(self, prog, **kw):
        raise RuntimeError("NOT_AVAILABLE: no QPU provider, credentials, or device are "
                           "configured; quantum hardware execution is BLOCKED_DEPENDENCY")


def probs_of(res: ExecutionResult, bitstring: str) -> float:
    idx = int(bitstring, 2)
    sv = np.array(res.statevector)
    return float((np.abs(sv[idx]) ** 2).real)
