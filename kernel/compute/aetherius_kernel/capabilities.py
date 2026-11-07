"""Honest capability report for the Aetherius compute kernel.

The report is deliberately fail-closed: a backend is only ``HARDWARE`` when a
real device is configured and proven. Everything else is ``NATIVE_HOST``,
``SIMULATED``, or ``BLOCKED_DEPENDENCY``.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class BackendCapability:
    backend_id: str
    domain: str
    execution_class: str
    available: bool
    reason: str
    limits: dict
    evidence: list[str]

    def to_dict(self) -> dict:
        return asdict(self)


BINARY_BACKEND = BackendCapability(
    backend_id="aetherius.binary.packed-u64",
    domain="BINARY",
    execution_class="NATIVE_HOST",
    available=True,
    reason=(
        "Integer-only packed uint64 kernels executed on the host CPU. "
        "This is a host-native implementation, not a custom binary ISA."
    ),
    limits={"word_bits": 64, "domain": "{0,1} mapped to {-1,+1}"},
    evidence=[
        "kernel/compute/tests/test_binary.py",
        "research/build85/kernel_binary/test_kernel_binary.py",
    ],
)

TERNARY_BACKEND = BackendCapability(
    backend_id="aetherius.ternary.dual-mask",
    domain="TERNARY",
    execution_class="SIMULATED",
    available=True,
    reason=(
        "Balanced ternary {-1,0,+1} encoded as dual uint64 bit-masks. "
        "No commercial ternary CPU is assumed or claimed."
    ),
    limits={"word_bits": 64, "domain": "{-1,0,+1}", "hardware_ternary": False},
    evidence=[
        "kernel/compute/tests/test_ternary.py",
        "research/build85/kernel_ternary/test_kernel_ternary.py",
    ],
)

QUANTUM_SIM_BACKEND = BackendCapability(
    backend_id="aetherius.quantum.statevector",
    domain="QUANTUM",
    execution_class="SIMULATED",
    available=True,
    reason=(
        "Local state-vector simulator. A ternary symbol is not a qutrit; "
        "ternary-to-quantum bridges must encode onto qubit pairs."
    ),
    limits={
        "max_qubits": 24,
        "state_dimension": "2^n complex amplitudes",
        "hardware_quantum": False,
    },
    evidence=[
        "kernel/compute/tests/test_quantum.py",
        "research/build85/kernel_quantum/test_quantum.py",
    ],
)

QUANTUM_HW_BACKEND = BackendCapability(
    backend_id="aetherius.quantum.remote-qpu",
    domain="QUANTUM",
    execution_class="BLOCKED_DEPENDENCY",
    available=False,
    reason=(
        "No QPU provider, credentials, device, or budget are configured. "
        "The remote backend fails closed rather than fabricating results."
    ),
    limits={"provider": None, "device": None, "shots": None},
    evidence=["kernel/compute/aetherius_kernel/quantum.py#RemoteQPUBackend"],
)

NATIVE_KERNEL = BackendCapability(
    backend_id="aetherius.native.x86_64",
    domain="OS_KERNEL",
    execution_class="NATIVE_HOST",
    available=True,
    reason=(
        "x86_64 C kernel scaffold with GDT, IDT, scheduler, and syscall ABI. "
        "Host tests pass; it is not yet a bootable general-purpose OS."
    ),
    limits={"architecture": "x86_64", "bootable": False, "drivers": "partial"},
    evidence=[
        "native/kernel/tests/test_kernel.c",
        "native/kernel/build/host/test_kernel.exe",
    ],
)


def capability_report() -> dict:
    return {
        "schema_version": "1.0.0",
        "kernel": "aetherius-compute",
        "version": "0.1.0",
        "verdict": "PARTIAL_COMPLETE",
        "backends": [
            BINARY_BACKEND.to_dict(),
            TERNARY_BACKEND.to_dict(),
            QUANTUM_SIM_BACKEND.to_dict(),
            QUANTUM_HW_BACKEND.to_dict(),
            NATIVE_KERNEL.to_dict(),
        ],
        "claims": {
            "binary_host_integer": True,
            "binary_custom_isa": False,
            "ternary_simulated": True,
            "ternary_hardware": False,
            "quantum_simulated": True,
            "quantum_hardware": False,
            "bootable_general_purpose_os": False,
        },
        "notes": [
            "Passing arithmetic tests do not imply hardware ternary or quantum execution.",
            "The native kernel is a scaffold; machine-level boot and context-switch tests require QEMU/hardware evidence.",
            "Remote QPU execution remains BLOCKED_DEPENDENCY until an owner supplies provider access.",
        ],
    }
