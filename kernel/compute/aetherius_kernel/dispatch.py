"""Unified dispatch surface for binary, ternary, and quantum execution.

The dispatcher never upgrades a simulated result to a hardware claim. Call
``capabilities()`` to see exactly what is available.
"""

from __future__ import annotations

import numpy as np

from .binary import bin_dot, bin_linear, pack_bits, to_pm1
from .capabilities import capability_report
from .quantum import (
    ExecutionResult,
    LocalStatevectorBackend,
    QuantumProgram,
    RemoteQPUBackend,
)
from .ternary import pack_ternary, ter_dot, ter_linear, to_ter_ref


class BinaryKernel:
    word_bits = 64

    def dot(self, weights, activations) -> int:
        ww, K, pad = pack_bits(weights)
        aw, Ka, _ = pack_bits(activations)
        if K != Ka:
            raise ValueError("weights and activations must have the same K")
        return bin_dot(ww, aw, K, pad)

    def linear(self, weights, activations) -> list[int]:
        W = np.asarray(weights)
        if W.ndim != 2:
            raise ValueError("weights must be 2-D (rows, K)")
        Ww, K, pad = pack_bits(W)
        aw, Ka, _ = pack_bits(activations)
        if K != Ka:
            raise ValueError("weights and activations must have the same K")
        return [int(x) for x in bin_linear(Ww, aw, K, pad)]


class TernaryKernel:
    word_bits = 64

    def dot(self, weights, activations) -> int:
        wp, wn, K, pad = pack_ternary(weights)
        ap, an, Ka, _ = pack_ternary(activations)
        if K != Ka:
            raise ValueError("weights and activations must have the same K")
        return ter_dot(wp, wn, ap, an, K, pad)

    def linear(self, weights, activations) -> list[int]:
        W = np.asarray(weights)
        if W.ndim != 2:
            raise ValueError("weights must be 2-D (rows, K)")
        Wp, Wn, K, pad = pack_ternary(W)
        ap, an, Ka, _ = pack_ternary(activations)
        if K != Ka:
            raise ValueError("weights and activations must have the same K")
        return [int(x) for x in ter_linear(Wp, Wn, ap, an, K, pad)]


class QuantumKernel:
    def __init__(self, backend=None):
        self.backend = backend or LocalStatevectorBackend()

    def run(self, program: QuantumProgram, shots: int = 0, seed: int | None = 85) -> ExecutionResult:
        return self.backend.run(program, shots=shots, seed=seed)


class ComputeKernel:
    """One entry point for all three compute domains."""

    def __init__(self, quantum_backend=None):
        self.binary = BinaryKernel()
        self.ternary = TernaryKernel()
        self.quantum = QuantumKernel(quantum_backend)

    def capabilities(self) -> dict:
        return capability_report()

    def execute(self, domain: str, operation: str, **kwargs):
        domain = domain.upper()
        operation = operation.lower()
        if domain == "BINARY" and operation == "dot":
            return self.binary.dot(kwargs["weights"], kwargs["activations"])
        if domain == "BINARY" and operation == "linear":
            return self.binary.linear(kwargs["weights"], kwargs["activations"])
        if domain == "TERNARY" and operation == "dot":
            return self.ternary.dot(kwargs["weights"], kwargs["activations"])
        if domain == "TERNARY" and operation == "linear":
            return self.ternary.linear(kwargs["weights"], kwargs["activations"])
        if domain == "QUANTUM" and operation == "run":
            return self.quantum.run(
                kwargs["program"],
                shots=int(kwargs.get("shots", 0)),
                seed=kwargs.get("seed", 85),
            )
        raise ValueError(f"unsupported compute operation: {domain}/{operation}")

    def selftest(self) -> dict:
        binary_expected = -1
        binary_actual = self.binary.dot([1, 0, 1], [1, 1, 0])
        ternary_expected = 1
        ternary_actual = self.ternary.dot([1, 0, -1], [1, -1, 0])

        bell = QuantumProgram(2).h(0).cnot(0, 1)
        bell_result = self.quantum.run(bell, shots=200, seed=85)
        bell_keys = set(bell_result.counts)
        bell_ok = bell_keys <= {"00", "11"} and sum(bell_result.counts.values()) == 200

        checks = {
            "binary_dot": {
                "passed": binary_actual == binary_expected,
                "expected": binary_expected,
                "actual": binary_actual,
            },
            "ternary_dot": {
                "passed": ternary_actual == ternary_expected,
                "expected": ternary_expected,
                "actual": ternary_actual,
            },
            "quantum_bell": {
                "passed": bell_ok,
                "counts": dict(bell_result.counts),
            },
        }
        return {
            "all_passed": all(c["passed"] for c in checks.values()),
            "checks": checks,
            "capabilities": self.capabilities(),
        }
