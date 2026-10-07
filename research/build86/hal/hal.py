"""BUILD86 - hybrid compute HAL: device abstraction + discovery.

Physicality is explicit. The HAL MUST NEVER report physical=true for ternary,
quantum or time-crystal devices on this PC (enforced by test_hal.py).
"""
from __future__ import annotations

import json
import platform
from dataclasses import asdict, dataclass, field
from pathlib import Path

HERE = Path(__file__).resolve().parent


@dataclass
class ComputeDevice:
    device_id: str
    physicality: str          # PHYSICAL_LOCAL | SIMULATED_LOCAL | EMULATED_LOCAL | REMOTE_*
    domain: str               # BINARY | TERNARY | QUANTUM | ACCELERATOR
    subtype: str = ""
    backend: str = ""
    architecture: str = ""
    profile_id: str | None = None
    capabilities: list = field(default_factory=list)
    available: bool = True
    health: str = "UNKNOWN"
    memory_mb: float | None = None
    supported_operations: list = field(default_factory=list)
    precision: list = field(default_factory=list)
    locality: str = "LOCAL"
    execution_backend: str = ""


def _have(mod: str) -> bool:
    try:
        __import__(mod)
        return True
    except Exception:
        return False


def discover() -> list[ComputeDevice]:
    devs = [
        ComputeDevice("cpu0", "PHYSICAL_LOCAL", "BINARY", backend="numpy/torch CPU",
                      architecture=platform.machine(), capabilities=["matmul", "simd"],
                      available=True, health="OK",
                      memory_mb=None, supported_operations=["matmul", "elementwise"],
                      precision=["fp32", "fp16", "bf16", "int8"],
                      execution_backend="host-numpy-torch"),
    ]
    # GPU present? (torch CUDA) - record truthfully
    try:
        import torch
        if torch.cuda.is_available():
            devs.append(ComputeDevice("gpu0", "PHYSICAL_LOCAL", "BINARY",
                                      backend="torch CUDA", available=True, health="OK",
                                      execution_backend="torch-cuda"))
    except Exception:
        pass
    devs += [
        ComputeDevice("ternary_5500fp_sim0", "SIMULATED_LOCAL", "TERNARY",
                      subtype="TERNARY_CPU_RUNTIME", backend="aetherius-ternary-kernel",
                      architecture="24-trit profile", profile_id="ternary-5500fp-r1",
                      capabilities=["ternary-add", "ternary-matmul-mask-kernel"],
                      available=True, health="OK",
                      supported_operations=["ternary-add", "ternary-dot", "pack"],
                      precision=["ternary"], execution_backend="numpy-mask-kernel"),
        ComputeDevice("qpu_ibm_heron_sim0", "SIMULATED_LOCAL", "QUANTUM",
                      subtype="QUANTUM_LOCAL_SIMULATOR", backend="aetherius-statevector",
                      profile_id="qpu-ibm-heron-r1",
                      capabilities=["statevector<=20q", "shots", "seeds"],
                      available=True, health="OK",
                      supported_operations=["circuit-exec", "measure"],
                      precision=["complex128"], execution_backend="numpy-statevector"),
        ComputeDevice("qpu_h2_sim0", "SIMULATED_LOCAL", "QUANTUM",
                      subtype="QUANTUM_LOCAL_SIMULATOR", backend="aetherius-statevector",
                      profile_id="qpu_h2_r1",
                      capabilities=["statevector<=20q", "shots", "all-to-all-emulation"],
                      available=True, health="OK",
                      supported_operations=["circuit-exec", "measure"],
                      precision=["complex128"], execution_backend="numpy-statevector"),
        ComputeDevice("timecrystal_dtc_sim0", "SIMULATED_LOCAL", "ACCELERATOR",
                      subtype="TIME_CRYSTAL", backend="aetherius-dtc-sim",
                      profile_id="accel-dtc-sim-r1",
                      capabilities=["floquet-evolution", "period-doubling-measure"],
                      available=True, health="RESEARCH",
                      supported_operations=["dtc-run"],
                      precision=["complex128"], execution_backend="numpy-exact"),
        ComputeDevice("qpu_physical_0", "REMOTE_PHYSICAL", "QUANTUM",
                      backend="none-configured", available=False, health="NOT_CONNECTED",
                      execution_backend="none"),
    ]
    return devs


def vm_b_inventory() -> dict:
    return {"mode": "HOSTED_RUNTIME",
            "devices": [asdict(d) for d in discover()]}


def main() -> None:
    inv = vm_b_inventory()
    (HERE / "vm_b_inventory.json").write_text(json.dumps(inv, indent=1))
    for d in inv["devices"]:
        print(f"{d['device_id']:22s} {d['physicality']:16s} {d['domain']:10s} "
              f"avail={d['available']}")
    print("wrote vm_b_inventory.json")


if __name__ == "__main__":
    main()
