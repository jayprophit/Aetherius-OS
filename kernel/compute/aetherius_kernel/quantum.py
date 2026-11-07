"""Local state-vector quantum simulator.

Scope is explicit: ``QUANTUM_SIMULATED``. There is no remote QPU path that
pretends to work. ``RemoteQPUBackend`` raises a precise dependency error until
a provider, credentials, and a device are configured.

A ternary symbol is **not** a qutrit. Any ternary-to-quantum bridge must encode
``{-1,0,+1}`` onto qubit pairs with one reserved state and say so.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field

import numpy as np

MAX_SIMULATED_QUBITS = 24

_H = np.array([[1, 1], [1, -1]], complex) / np.sqrt(2)
_X = np.array([[0, 1], [1, 0]], complex)
_Y = np.array([[0, -1j], [1j, 0]], complex)
_Z = np.array([[1, 0], [0, -1]], complex)
_S = np.array([[1, 0], [0, 1j]], complex)
_T = np.array([[1, 0], [0, np.exp(1j * np.pi / 4)]], complex)


def _rx(theta: float) -> np.ndarray:
    return np.array(
        [[np.cos(theta / 2), -1j * np.sin(theta / 2)],
         [-1j * np.sin(theta / 2), np.cos(theta / 2)]],
        complex,
    )


def _ry(theta: float) -> np.ndarray:
    return np.array(
        [[np.cos(theta / 2), -np.sin(theta / 2)],
         [np.sin(theta / 2), np.cos(theta / 2)]],
        complex,
    )


def _rz(theta: float) -> np.ndarray:
    return np.array(
        [[np.exp(-1j * theta / 2), 0], [0, np.exp(1j * theta / 2)]], complex
    )


@dataclass(frozen=True)
class Gate:
    name: str
    targets: tuple[int, ...]
    params: tuple[float, ...] = ()


@dataclass
class QuantumProgram:
    n_qubits: int
    gates: list[Gate] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not isinstance(self.n_qubits, int) or isinstance(self.n_qubits, bool):
            raise TypeError("n_qubits must be an int")
        if not (1 <= self.n_qubits <= MAX_SIMULATED_QUBITS):
            raise ValueError(
                f"n_qubits must be 1..{MAX_SIMULATED_QUBITS} for the local simulator"
            )

    def _add(self, name: str, targets: tuple[int, ...], params: tuple[float, ...] = ()) -> "QuantumProgram":
        self.gates.append(Gate(name, targets, params))
        return self

    def h(self, q: int) -> "QuantumProgram": return self._add("h", (q,))
    def x(self, q: int) -> "QuantumProgram": return self._add("x", (q,))
    def y(self, q: int) -> "QuantumProgram": return self._add("y", (q,))
    def z(self, q: int) -> "QuantumProgram": return self._add("z", (q,))
    def s(self, q: int) -> "QuantumProgram": return self._add("s", (q,))
    def t(self, q: int) -> "QuantumProgram": return self._add("t", (q,))
    def rx(self, q: int, theta: float) -> "QuantumProgram": return self._add("rx", (q,), (float(theta),))
    def ry(self, q: int, theta: float) -> "QuantumProgram": return self._add("ry", (q,), (float(theta),))
    def rz(self, q: int, theta: float) -> "QuantumProgram": return self._add("rz", (q,), (float(theta),))
    def cnot(self, c: int, t: int) -> "QuantumProgram": return self._add("cnot", (c, t))
    def cz(self, c: int, t: int) -> "QuantumProgram": return self._add("cz", (c, t))
    def swap(self, a: int, b: int) -> "QuantumProgram": return self._add("swap", (a, b))
    def toffoli(self, c1: int, c2: int, t: int) -> "QuantumProgram": return self._add("toffoli", (c1, c2, t))

    def validate(self) -> None:
        arity = {
            "h": 1, "x": 1, "y": 1, "z": 1, "s": 1, "t": 1,
            "rx": 1, "ry": 1, "rz": 1,
            "cnot": 2, "cz": 2, "swap": 2, "toffoli": 3,
        }
        param_arity = {"rx": 1, "ry": 1, "rz": 1}
        for gate in self.gates:
            if gate.name not in arity:
                raise ValueError(f"unknown gate {gate.name!r}")
            if len(gate.targets) != arity[gate.name]:
                raise ValueError(f"{gate.name} expects {arity[gate.name]} targets")
            if len(gate.params) != param_arity.get(gate.name, 0):
                raise ValueError(f"{gate.name} has the wrong parameter count")
            for q in gate.targets:
                if not isinstance(q, int) or not (0 <= q < self.n_qubits):
                    raise ValueError(f"target qubit {q!r} is out of range")
            if len(set(gate.targets)) != len(gate.targets):
                raise ValueError(f"{gate.name} targets must be distinct")


@dataclass
class ExecutionResult:
    domain: str
    n_qubits: int
    shots: int
    counts: dict[str, int]
    statevector: list[complex] | None
    backend: str
    seed: int | None
    runtime_s: float
    metadata: dict

    def probabilities(self) -> dict[str, float]:
        if self.statevector is None:
            return {}
        sv = np.asarray(self.statevector, dtype=complex)
        probs = np.abs(sv) ** 2
        total = float(probs.sum())
        if total <= 0:
            raise ValueError("statevector has zero norm")
        probs = probs / total
        return {
            format(i, f"0{self.n_qubits}b"): float(p)
            for i, p in enumerate(probs)
        }

    def to_dict(self) -> dict:
        return {
            "domain": self.domain,
            "n_qubits": self.n_qubits,
            "shots": self.shots,
            "counts": dict(self.counts),
            "statevector": (
                None if self.statevector is None
                else [[float(z.real), float(z.imag)] for z in self.statevector]
            ),
            "backend": self.backend,
            "seed": self.seed,
            "runtime_s": self.runtime_s,
            "metadata": dict(self.metadata),
        }


class QuantumUnavailableError(RuntimeError):
    code = "QUANTUM_HARDWARE_BLOCKED_DEPENDENCY"


def _apply_1q(state: np.ndarray, n: int, q: int, U: np.ndarray) -> np.ndarray:
    out = np.zeros_like(state)
    for i in range(1 << n):
        b = (i >> q) & 1
        j = i ^ (1 << q)
        if b == 0:
            out[i] = U[0, 0] * state[i] + U[0, 1] * state[j]
        else:
            out[i] = U[1, 0] * state[j] + U[1, 1] * state[i]
    return out


def _apply_cnot(state: np.ndarray, n: int, c: int, t: int) -> np.ndarray:
    out = state.copy()
    for i in range(1 << n):
        if ((i >> c) & 1) and not ((i >> t) & 1):
            j = i ^ (1 << t)
            out[i], out[j] = state[j], state[i]
    return out


def _apply_cz(state: np.ndarray, n: int, c: int, t: int) -> np.ndarray:
    out = state.copy()
    for i in range(1 << n):
        if ((i >> c) & 1) and ((i >> t) & 1):
            out[i] = -state[i]
    return out


def _apply_swap(state: np.ndarray, n: int, a: int, b: int) -> np.ndarray:
    out = state.copy()
    for i in range(1 << n):
        if ((i >> a) & 1) and not ((i >> b) & 1):
            j = i ^ (1 << a) ^ (1 << b)
            out[i], out[j] = state[j], state[i]
    return out


def _apply_toffoli(state: np.ndarray, n: int, c1: int, c2: int, t: int) -> np.ndarray:
    out = state.copy()
    for i in range(1 << n):
        if ((i >> c1) & 1) and ((i >> c2) & 1) and not ((i >> t) & 1):
            j = i ^ (1 << t)
            out[i], out[j] = state[j], state[i]
    return out


class LocalStatevectorBackend:
    name = "LocalStatevectorBackend"
    execution_class = "SIMULATED"

    def run(self, prog: QuantumProgram, shots: int = 0, seed: int | None = 85) -> ExecutionResult:
        if not isinstance(prog, QuantumProgram):
            raise TypeError("prog must be a QuantumProgram")
        if shots < 0:
            raise ValueError("shots must be >= 0")
        prog.validate()
        t0 = time.perf_counter()
        state = np.zeros(1 << prog.n_qubits, complex)
        state[0] = 1.0
        for gate in prog.gates:
            name, targets, params = gate.name, gate.targets, gate.params
            if name == "h": state = _apply_1q(state, prog.n_qubits, targets[0], _H)
            elif name == "x": state = _apply_1q(state, prog.n_qubits, targets[0], _X)
            elif name == "y": state = _apply_1q(state, prog.n_qubits, targets[0], _Y)
            elif name == "z": state = _apply_1q(state, prog.n_qubits, targets[0], _Z)
            elif name == "s": state = _apply_1q(state, prog.n_qubits, targets[0], _S)
            elif name == "t": state = _apply_1q(state, prog.n_qubits, targets[0], _T)
            elif name == "rx": state = _apply_1q(state, prog.n_qubits, targets[0], _rx(params[0]))
            elif name == "ry": state = _apply_1q(state, prog.n_qubits, targets[0], _ry(params[0]))
            elif name == "rz": state = _apply_1q(state, prog.n_qubits, targets[0], _rz(params[0]))
            elif name == "cnot": state = _apply_cnot(state, prog.n_qubits, *targets)
            elif name == "cz": state = _apply_cz(state, prog.n_qubits, *targets)
            elif name == "swap": state = _apply_swap(state, prog.n_qubits, *targets)
            elif name == "toffoli": state = _apply_toffoli(state, prog.n_qubits, *targets)
            else: raise ValueError(f"unknown gate {name!r}")
        probs = (np.abs(state) ** 2).real
        total = float(probs.sum())
        if total <= 0:
            raise ValueError("statevector has zero norm")
        probs = probs / total
        counts: dict[str, int] = {}
        if shots:
            rng = np.random.default_rng(seed)
            draws = rng.choice(1 << prog.n_qubits, size=shots, p=probs)
            for d in draws:
                key = format(int(d), f"0{prog.n_qubits}b")
                counts[key] = counts.get(key, 0) + 1
        return ExecutionResult(
            domain="QUANTUM_SIMULATED",
            n_qubits=prog.n_qubits,
            shots=shots,
            counts=counts,
            statevector=[complex(z) for z in state],
            backend=self.name,
            seed=seed,
            runtime_s=time.perf_counter() - t0,
            metadata={"gate_count": len(prog.gates), "execution_class": self.execution_class},
        )


class RemoteQPUBackend:
    name = "RemoteQPUBackend"
    execution_class = "BLOCKED_DEPENDENCY"

    def run(self, prog: QuantumProgram, **kwargs) -> ExecutionResult:
        raise QuantumUnavailableError(
            "NOT_AVAILABLE: no QPU provider, credentials, or device are configured; "
            "quantum hardware execution is BLOCKED_DEPENDENCY"
        )


def probs_of(res: ExecutionResult, bitstring: str) -> float:
    if res.statevector is None:
        raise ValueError("no statevector available")
    if len(bitstring) != res.n_qubits or set(bitstring) - {"0", "1"}:
        raise ValueError("bitstring length/domain does not match the program")
    idx = int(bitstring, 2)
    sv = np.asarray(res.statevector, dtype=complex)
    return float((np.abs(sv[idx]) ** 2).real)
