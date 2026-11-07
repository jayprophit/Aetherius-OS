"""Aetherius compute kernel: binary, balanced ternary, and quantum simulation."""

from .binary import bin_dot, bin_linear, pack_bits, to_pm1
from .capabilities import capability_report
from .dispatch import BinaryKernel, ComputeKernel, QuantumKernel, TernaryKernel
from .quantum import (
    MAX_SIMULATED_QUBITS,
    ExecutionResult,
    LocalStatevectorBackend,
    QuantumProgram,
    QuantumUnavailableError,
    RemoteQPUBackend,
    probs_of,
)
from .ternary import pack_ternary, ter_dot, ter_linear, to_ter_ref

__all__ = [
    "BinaryKernel",
    "ComputeKernel",
    "ExecutionResult",
    "LocalStatevectorBackend",
    "MAX_SIMULATED_QUBITS",
    "QuantumKernel",
    "QuantumProgram",
    "QuantumUnavailableError",
    "RemoteQPUBackend",
    "TernaryKernel",
    "bin_dot",
    "bin_linear",
    "capability_report",
    "pack_bits",
    "pack_ternary",
    "probs_of",
    "ter_dot",
    "ter_linear",
    "to_pm1",
    "to_ter_ref",
]
