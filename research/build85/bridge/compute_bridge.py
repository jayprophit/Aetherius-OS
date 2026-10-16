"""BUILD85 - tri-compute middle bridge (ComputeEnvelope + domain conversions).

The bridge is the interchange contract, NOT the execution format:
  Compute Router decides WHERE a workload executes.
  Tri-Compute Middle Bridge decides HOW information moves between domains.
  Kernels decide HOW the operation is computed inside a domain.

Every conversion is classified: LOSSLESS | QUANTISATION_LOSS | STOCHASTIC |
APPROXIMATE | UNSUPPORTED, with numerical error recorded where applicable.
"""
from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE.parent / "kernel_binary"))
sys.path.insert(0, str(_HERE.parent / "kernel_quantum"))
from kernel_binary import pack_bits  # noqa: E402
from quantum_kernel import (ExecutionResult, LocalStatevectorBackend,  # noqa: E402
                            QuantumProgram)

DOMAINS = ("BINARY", "TERNARY", "QUANTUM")

# ternary <-> 2-qubit encoding; 11 is RESERVED (never a valid ternary symbol)
TER2Q = {-1: "00", 0: "01", 1: "10"}
Q2TER = {v: k for k, v in TER2Q.items()}


@dataclass
class ComputeEnvelope:
    source_domain: str
    target_domain: str
    data: object
    shape: tuple
    datatype: str
    encoding: str
    scale: float | None = None
    zero_point: float | None = None
    precision: str = ""
    confidence: float | None = None
    provenance: list = field(default_factory=list)
    execution_metadata: dict = field(default_factory=dict)
    conversion_history: list = field(default_factory=list)
    error_bounds: dict = field(default_factory=dict)

    def step(self, target: str, loss: str, err: dict | None = None) -> "ComputeEnvelope":
        import copy
        e = copy.copy(self)
        e.source_domain = self.target_domain
        e.target_domain = target
        e.conversion_history = list(self.conversion_history) + [
            {"from": self.target_domain, "to": target, "loss": loss,
             "error": err or {}}]
        return e


class Bridge:
    """Deterministic, inspectable conversions. Quantum legs use the local
    statevector backend; shot-based legs are labelled STOCHASTIC."""

    def __init__(self, shots: int = 200, seed: int = 85):
        self.be = LocalStatevectorBackend()
        self.shots = shots
        self.seed = seed

    # -- BINARY <-> TERNARY (deterministic) --
    @staticmethod
    def binary_to_ternary(env: ComputeEnvelope) -> ComputeEnvelope:
        assert env.target_domain == "TERNARY"
        bits = np.asarray(env.data, dtype=np.uint8)
        t = np.where(bits == 1, 1, -1).astype(np.int8)
        out = env.step("TERNARY", "LOSSLESS")
        out.data, out.shape, out.datatype, out.encoding = t, t.shape, "int8", "ternary_pm1"
        return out

    @staticmethod
    def ternary_to_binary(env: ComputeEnvelope) -> ComputeEnvelope:
        """Documented mapping rule: 0 -> +1 (bit 1). Round trip T->B->T does NOT
        recover zeros; that loss is recorded, not hidden."""
        assert env.target_domain == "BINARY"
        t = np.asarray(env.data, dtype=np.int8)
        zeros = int((t == 0).sum())
        b = np.where(t >= 0, 1, 0).astype(np.uint8)
        out = env.step("BINARY", "QUANTISATION_LOSS",
                       {"zeros_remapped_to_plus1": zeros,
                        "fraction": zeros / t.size if t.size else 0.0})
        out.data, out.shape, out.datatype, out.encoding = b, b.shape, "uint8", "binary_pm1_bits"
        return out

    # -- BINARY <-> QUANTUM (basis-state legs are deterministic) --
    def binary_to_quantum(self, env: ComputeEnvelope) -> ComputeEnvelope:
        """Array index i maps to qubit i (LSB-first); this is documented, and the
        MSB-first bit-string convention is display-only. Deterministic decode
        returns the same array order."""
        assert env.target_domain == "QUANTUM"
        bits = np.asarray(env.data, dtype=np.uint8).reshape(-1)
        prog = QuantumProgram(len(bits))
        for i, b in enumerate(bits):
            if b:
                prog.x(i)
        out = env.step("QUANTUM", "LOSSLESS")
        out.data, out.shape = prog, (len(bits),)
        out.datatype, out.encoding = "QuantumProgram", "basis_prep"
        out.execution_metadata = {"n_qubits": len(bits)}
        return out

    def quantum_to_binary(self, env: ComputeEnvelope, deterministic: bool = True) -> ComputeEnvelope:
        assert env.target_domain == "BINARY"
        prog = env.data
        if deterministic:
            r = self.be.run(prog, shots=0)
            sv = np.array(r.statevector)
            idx = int(np.argmax(np.abs(sv) ** 2))
            n = prog.n_qubits
            # LSB-first array order, matching binary_to_quantum's qubit mapping
            bits = np.array([(idx >> q) & 1 for q in range(n)], np.uint8)
            out = env.step("BINARY", "LOSSLESS",
                           {"mode": "statevector_argmax", "n_qubits": n})
        else:
            r = self.be.run(prog, shots=self.shots, seed=self.seed)
            top = max(r.counts, key=r.counts.get)
            bits = np.array([int(c) for c in top], np.uint8)
            out = env.step("BINARY", "STOCHASTIC",
                           {"mode": f"shots={self.shots}", "top": top,
                            "top_fraction": r.counts[top] / self.shots})
        out.data, out.shape, out.datatype, out.encoding = bits, bits.shape, "uint8", "binary_pm1_bits"
        return out

    # -- TERNARY <-> QUANTUM (2-qubit encoding; 11 reserved) --
    def ternary_to_quantum(self, env: ComputeEnvelope) -> ComputeEnvelope:
        assert env.target_domain == "QUANTUM"
        t = np.asarray(env.data, dtype=np.int8).reshape(-1)
        prog = QuantumProgram(2 * len(t))
        for i, v in enumerate(t):
            bits = TER2Q[int(v)]
            if bits[0] == "1":
                prog.x(2 * i + 1)
            if bits[1] == "1":
                prog.x(2 * i)
        out = env.step("QUANTUM", "LOSSLESS")
        out.data, out.shape = prog, (len(t),)
        out.datatype, out.encoding = "QuantumProgram", "ternary_pair_encoding"
        out.execution_metadata = {"n_qubits": 2 * len(t), "reserved_state": "11"}
        return out

    def quantum_to_ternary(self, env: ComputeEnvelope) -> ComputeEnvelope:
        assert env.target_domain == "TERNARY"
        prog = env.data
        assert prog.n_qubits % 2 == 0, "ternary decode needs qubit pairs"
        r = self.be.run(prog, shots=0)
        sv = np.array(r.statevector)
        idx = int(np.argmax(np.abs(sv) ** 2))
        syms = []
        for i in range(prog.n_qubits // 2):
            pair = f"{(idx >> (2 * i + 1)) & 1}{(idx >> (2 * i)) & 1}"
            if pair == "11":
                raise ValueError("RESERVED state 11 observed - invalid ternary symbol")
            syms.append(Q2TER[pair])
        t = np.array(syms, np.int8)
        out = env.step("TERNARY", "LOSSLESS", {"mode": "statevector_argmax"})
        out.data, out.shape, out.datatype, out.encoding = t, t.shape, "int8", "ternary_pm1"
        return out


class ComputeRouter:
    """Decides WHERE a workload executes (router), never HOW bits move (bridge)."""

    def __init__(self, available=("BINARY", "TERNARY", "QUANTUM", "CLASSICAL")):
        self.available = set(available)

    def route(self, task: dict) -> dict:
        """task: {op, shape, precision_req, kernels, backend, latency_budget_ms,
        memory_budget_mb, quantum_eligible}. Returns {domain, reason, rejected}."""
        rejected = {}
        cands = []
        prec = task.get("precision_req", "low")
        for d in ("BINARY", "TERNARY", "QUANTUM", "CLASSICAL"):
            if d not in self.available:
                rejected[d] = "kernel unavailable"
                continue
            if d == "QUANTUM" and not task.get("quantum_eligible", False):
                rejected[d] = "no meaningful quantum formulation / ineligible"
                continue
            if d in ("BINARY", "TERNARY") and prec == "high":
                rejected[d] = "precision requirement exceeds 1-bit/ternary fidelity"
                continue
            if d == "QUANTUM" and task.get("n_qubits", 0) > 12:
                rejected[d] = "exceeds local simulator resource bound"
                continue
            cands.append(d)
        order = ({"BINARY": 0, "TERNARY": 1, "CLASSICAL": 2, "QUANTUM": 3}
                 if task.get("prefer_lowbit") else
                 {"CLASSICAL": 0, "BINARY": 1, "TERNARY": 2, "QUANTUM": 3})
        cands.sort(key=lambda d: order[d])
        pick = cands[0] if cands else "CLASSICAL"
        return {"domain": pick,
                "reason": f"eligible={cands}; precision={prec}",
                "rejected": rejected}
