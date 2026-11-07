# Aetherius Compute Kernel

**Status:** `PARTIAL_COMPLETE`
**Version:** `0.1.0`
**Date:** 2026-11-02

One dispatch surface for three compute domains:

| Domain | Implementation | Execution class | Hardware claim |
|---|---|---|---|
| Binary | Packed `uint64` XNOR + popcount | `NATIVE_HOST` | Host CPU integer path, **not** a custom ISA |
| Ternary | Dual `uint64` bit-masks for `{-1,0,+1}` | `SIMULATED` | **No** ternary hardware |
| Quantum | Local state-vector simulator, up to 24 qubits | `SIMULATED` | **No** quantum hardware |
| Remote QPU | Fails closed with `QUANTUM_HARDWARE_BLOCKED_DEPENDENCY` | `BLOCKED_DEPENDENCY` | Requires provider, credentials, device, budget |
| Native OS kernel | x86_64 C scaffold (GDT, IDT, scheduler, syscall ABI) | `NATIVE_HOST` | Host-tested; **not** a bootable general-purpose OS |

The capability report is the source of truth:

```sh
python -m aetherius_kernel capabilities
```

## Why this exists

The BUILD85 research kernels proved the arithmetic and simulator behaviour.
This package promotes them into a canonical runtime with:

- one import surface (`from aetherius_kernel import ComputeKernel`);
- honest capability labels;
- pytest coverage for every backend;
- a machine-readable manifest;
- a fail-closed remote-QPU path;
- no duplicated runtime copy under `research/` (that tree remains evidence).

## Usage

```python
from aetherius_kernel import ComputeKernel, QuantumProgram

k = ComputeKernel()

# Binary: {0,1} mapped to {-1,+1}
assert k.binary.dot([1, 0, 1], [1, 1, 0]) == -1

# Ternary: {-1,0,+1}
assert k.ternary.dot([1, 0, -1], [1, -1, 0]) == 1

# Quantum: Bell state
bell = QuantumProgram(2).h(0).cnot(0, 1)
result = k.quantum.run(bell, shots=1000, seed=85)
print(result.counts)       # only 00 and 11
print(result.to_dict())    # JSON-safe
```

Unified dispatch:

```python
k.execute("BINARY", "dot", weights=[1, 0, 1], activations=[1, 1, 0])
k.execute("TERNARY", "dot", weights=[1, 0, -1], activations=[1, -1, 0])
k.execute("QUANTUM", "run", program=bell, shots=100)
```

## Tests

```sh
# Optional: reproducible dev dependencies
python -m pip install -r kernel/compute/requirements-dev.txt

# Canonical package
python -m pytest kernel/compute/tests -q

# Full verification: Python tests + capability JSON + native C host tests
node kernel/compute/verify.mjs
```

Tested with Python 3.13.14, NumPy 2.5.3, pytest 9.1.1 on Windows x86_64.
`requirements-dev.txt` pins those versions; `pyproject.toml` keeps the runtime
range wider.

The verify script exits non-zero if any backend fails or if the native kernel
host test binary is missing.

## Supported gates

`h`, `x`, `y`, `z`, `s`, `t`, `rx`, `ry`, `rz`, `cnot`, `cz`, `swap`, `toffoli`.

There is no mid-circuit measurement, noise model, error correction, or qutrit
execution. A ternary symbol is not a qutrit; any bridge must encode onto qubit
pairs.

## Limits

- Local quantum simulation is capped at 24 qubits (state dimension `2^24`).
- Binary and ternary kernels require NumPy arrays with the expected dtypes.
- The remote QPU backend is intentionally unavailable until owner-supplied
  provider access exists.
- The native kernel is a scaffold. Boot, paging, user mode, drivers, SMP, and
  context-switch behaviour require QEMU/hardware evidence that this package
  does not claim.

## Provenance

Promoted from `research/build85/kernel_binary`, `kernel_ternary`,
`kernel_quantum`, and `native/kernel`. The research copies remain as evidence.
See `manifest.json` for the exact claim set and reference tests.

## What would make this `COMPLETE`

1. QEMU boot harness for the native kernel (GDT/IDT loading, interrupt entry,
   context switch, syscall round-trip).
2. Paging, heap, VFS, driver model, SMP, and user-mode ELF loading.
3. Physical ternary hardware or an FPGA target with reproducible synthesis.
4. Real QPU provider access with noise characterization and shot-level
   validation against the simulator.
5. Performance baselines for binary/ternary kernels across architectures.

None of those are claimed here.
