# ADR-002: The kernel platform and staged portability plan

**Status:** accepted
**Date:** 2026-11-04
**Owner:** Jonathan (Aetherius project)
**Related:** `ADR-001-KERNEL-IN-C.md`, `native/kernel/docs/SYSCALL-ABI.md`

## Context

ADR-001 settled the language and the shape of the kernel: a freestanding C11
kernel with assembly only where the CPU requires it, a versioned C syscall ABI,
and host tests for the parts that can be proven without booting. The owner has
now answered the platform questions that ADR-001 deliberately left open:

- Which architectures: x86_64 only, or also ARM64 and RISC-V?
- Which firmware: BIOS, UEFI, or both?
- Which filesystems, including usable read/write access for AI agents?
- Which network stack: in-tree, permissive third-party, or a hybrid?
- Which driver policy: in-tree only, loadable modules, or both?
- Which userland ABI: native, Linux-compatible, WASM, or several?
- Which deployment target: bare metal, virtual machines, or both?
- Whether ternary and quantum execution may be simulated in v1.

The answers are a direction, not evidence. The current tree contains a
host-tested x86_64 C kernel scaffold, not a bootable general-purpose operating
system. This ADR records the target and the gates that must pass before any
part of that target becomes a claim.

**Ambition (recorded 2026-11-05):** the long-term target is a production-grade
general-purpose operating system, not a hobby or research-only kernel. The
`0.1.0` release does not contain a bootable general-purpose kernel, and the
production ambition is not evidence that one exists. Ternary and quantum
execution remain simulation-only until physical hardware is available and
measured.

## Decision

### 1. Architectures: x86_64 first, then ARM64, then RISC-V

x86_64 is the first-class target because it is the architecture of the current
development host, the best served by QEMU, and the architecture with the most
complete reference material for the existing kernel scaffold.

ARM64 is the second port. It is the architecture of most phones, tablets and
Apple Silicon machines, and it is the natural target for a future mobile or
edge product.

RISC-V is the third port. It is included because the owner wants an open
instruction set in scope, not because it is needed for the first release.

A "universal build" means one source tree, one build system and one release
pipeline producing per-architecture artifacts. It does **not** mean one binary
that executes on every architecture. No such binary exists for native kernels,
and claiming one would be false.

### 2. Firmware: UEFI first, with BIOS and Multiboot2

UEFI is the first boot path. It is what modern hardware and most virtual
machines provide, and it is the path the existing Rust proof and the C
`gnu-efi` plan already target.

BIOS and Multiboot2 are also in scope. They keep QEMU, older hardware and
simpler boot harnesses usable, and they give the kernel a second, independent
way to prove that its entry contract is not accidentally tied to one firmware.

The kernel has one entry contract. The firmware-specific code is a thin boot
shim that hands over a memory map, a framebuffer description, an ACPI or device
tree pointer and a boot-info structure. Everything after that handover is the
same kernel.

### 3. Filesystems: AetherFS, FAT32, ISO9660 and ext4

- **AetherFS** is the native read/write root filesystem. It is designed for the
  kernel, with a documented on-disk format, checksums, atomic metadata updates
  and a userspace inspection tool. It is not a clone of an existing filesystem.
- **FAT32** is the EFI system partition and the exchange format for removable
  media. It is deliberately simple and universally readable.
- **ISO9660** is the installer and recovery image format. It is read-only.
- **ext4** is available through a user-space implementation, initially
  `lwext4`, rather than a new in-kernel ext4 driver. This keeps a large,
  security-sensitive filesystem parser out of the privileged kernel where
  possible. The exact library and its licence must be reviewed before it is
  linked or shipped; if the licence is incompatible with the project's
  distribution model, the fallback is a separate user-space ext4 service or
  read-only support only.

"AI read/write access" means mediated access through the virtual filesystem
and the capability system, not raw block-device access. An AI agent uses the
same file API as any other userland process, subject to the same permissions,
with every write recorded in the audit trail. An agent that is granted a
directory can read and write files there; an agent is never granted the block
device by default. Offline inspection is provided by a host-side tool that
understands AetherFS, so a machine that will not boot can still be examined.

### 4. Networking: an lwIP-based hybrid behind an Aetherius policy layer

The kernel will not grow a new TCP/IP stack from scratch for v1. The protocol
engine is a permissive third-party stack, initially lwIP, integrated behind an
Aetherius-owned socket and policy layer. The Aetherius layer owns:

- the socket API exposed to userland,
- capability checks for network access,
- per-process network policy and audit,
- address and route configuration,
- the boundary between the kernel and the protocol engine.

The third-party stack owns the protocol state machines. This is a hybrid: not
invented protocols, and not an unmodified library pretending to be a kernel
subsystem. The integration must record the exact upstream version, licence and
local patches, and the patches must be maintainable across upstream releases.

If lwIP proves unsuitable, the same boundary allows another permissive stack to
replace it without changing the userland socket contract.

### 5. Drivers: in-tree core drivers plus signed loadable modules

Core drivers are in-tree and built with the kernel:

- interrupt controller and timer,
- serial console,
- framebuffer and basic graphics output,
- platform and PCI enumeration,
- block storage,
- keyboard and basic input,
- the virtual devices used by the QEMU test matrix.

Non-core and hot-pluggable devices may be loadable modules. Modules are:

- signed by a key the kernel trusts,
- versioned against the kernel ABI,
- capability-scoped, so a module cannot silently take privileges it did not
  declare,
- rejected when unsigned, wrongly signed, built for a different kernel version,
  or missing a declared capability.

The default build is in-tree only. Modules are an extension mechanism, not a
way to avoid writing the core.

### 6. Userland ABI: native first, Linux subset second, WASM/WASI third

The native Aether ABI is the primary and stable contract. It is the ABI that
the syscall header defines, that the generated language bindings target, and
that the kernel's own userland uses.

A Linux x86_64 syscall subset is a compatibility personality. It exists so that
some existing Linux binaries can run without a full Linux kernel. It is a
documented subset, not a claim of Linux compatibility. Unsupported syscalls
return a clear error, and the compatibility matrix is tested.

WASM/WASI is the portable sandbox. It runs on any architecture the kernel
supports and gives agents and portable applications a narrow, capability-based
interface. It is not used to implement the kernel or the core userland.

The three ABIs share one process, memory and capability model. A process does
not get a different security model because it chose a different ABI.

### 7. Deployment: VM-first, with bare-metal validation

Development and continuous integration run in virtual machines:

- QEMU x86_64 with UEFI,
- QEMU x86_64 with BIOS/Multiboot2,
- QEMU ARM64 `virt`,
- QEMU RISC-V `virt`.

Virtual machines are the first target because they are reproducible, they can
run on the current Windows x86_64 host, and they make failure diagnosis
possible without spare hardware.

Bare metal is a required validation target, not a substitute for the VM
matrix. A hardware platform is not claimed as supported until the kernel has
booted on that named device, exercised storage and network, survived a power
cycle and completed a soak test. The current machine is the first bare-metal
candidate, not a support claim.

### 8. Ternary and quantum: simulation-only in v1

Ternary arithmetic and quantum state-vector simulation are in scope. They run
locally and offline. Real ternary hardware and real quantum processing units
are not claimed.

An optional online QPU or FPGA backend may be added later. It is disabled by
default, requires an explicit owner decision and credentials, and fails closed
with a named blocked-dependency error when the backend is unavailable. A
simulated result is never labelled as hardware execution, and a remote result
is never labelled as local.

## Staged implementation and gates

Each stage has a measurable gate. A stage is not "done" because the code
compiles; it is done when the gate has evidence in the repository.

| Stage | Scope | Gate |
|---|---|---|
| 0 | Host-tested pure kernel logic (existing) | The C host suite passes in the build gate. Current evidence: 126 checks, 0 failures. |
| 1 | x86_64 UEFI boot proof | The C kernel boots under QEMU and emits the same marker sequence as the Rust proof, compared automatically. |
| 2 | BIOS and Multiboot2 boot | The same kernel emits the same marker sequence through the second firmware path. |
| 3 | Core kernel services | User-mode entry, syscall round trip, fault isolation, timer and scheduler tests pass in QEMU. |
| 4 | Filesystems and VFS | AetherFS mounts, reads, writes and recovers from an interrupted write; FAT32 and ISO9660 mount; ext4 access is proven through the chosen user-space path. |
| 5 | Networking | Loopback and virtio-net pass; the policy layer allows, denies and audits connections; packet captures are recorded. |
| 6 | Driver model and modules | Core devices work in QEMU; a signed module loads; unsigned, wrong-key and wrong-version modules are rejected. |
| 7 | ABI trio | Native ABI conformance passes; the Linux subset matrix passes for the supported calls; WASM/WASI sandbox tests pass and cannot escape the capability set. |
| 8 | ARM64 and RISC-V ports | Each architecture boots under QEMU and passes the same core test suite and marker comparison. |
| 9 | Bare-metal validation | A named device boots, uses storage and network, survives a power cycle and completes a recorded soak test. |
| 10 | Production hardening | Fuzzing, secure boot, TPM, signed updates, a vulnerability process and independent review are complete. |

Stages 1 and 2 depend on the machine-level C modules and the UEFI toolchain
already tracked as `TODO-KRN-001` and `TODO-KRN-002`. Stage 3 and later are
new work recorded as `TODO-KRN-007` through `TODO-KRN-014`.

## Explicit non-goals for 0.1.0

This ADR does not expand the `0.1.0` public-release scope. In particular:

- `0.1.0` does not ship a bootable general-purpose Aetherius kernel.
- `0.1.0` does not claim x86_64 bare-metal support, ARM64 support or RISC-V
  support.
- `0.1.0` does not claim full Linux binary compatibility.
- `0.1.0` does not claim hardware ternary or hardware quantum execution.
- `0.1.0` does not claim secure boot, TPM-backed measured boot, or a
  production update system.
- `0.1.0` does not claim complete GPU, audio, USB or power-management support.

The kernel work that ships in `0.1.0` remains the host-tested C scaffold and
the simulation-only compute paths that already exist.

## Consequences

**Good:**

- The target is explicit, so work can be sequenced instead of argued about.
- x86_64 and QEMU give the fastest honest path to a boot proof on the current
  machine.
- The lwIP and lwext4 choices avoid inventing a TCP/IP stack and an ext4 driver
  while keeping the Aetherius policy boundary.
- The ABI trio gives native performance, a pragmatic compatibility path and a
  portable sandbox without pretending they are the same thing.

**Bad, and accepted:**

- Three architectures and two firmware paths multiply the test matrix.
- Third-party code brings licence, security and upstream-maintenance
  obligations. lwIP is permissive; lwext4's licence must be reviewed before it
  is linked or distributed.
- Loadable modules add a signing and versioning burden that an in-tree-only
  kernel would not have.
- A native ABI, a Linux subset and a WASM runtime are three interfaces to keep
  honest, not one.
- Simulation-only ternary and quantum work will not satisfy a claim of hardware
  capability, and it is not meant to.

**Neutral:**

- The choice of C from ADR-001 is unchanged.
- The release scope is unchanged. A platform decision is not a shipped
  platform.

## Verification and claim rules

A capability in this ADR may be described as implemented only when the
corresponding gate has recorded evidence. Until then the honest labels are:

- `PLANNED`: decided, not started.
- `IN_PROGRESS`: code exists, gate not passed.
- `SIMULATED`: runs in a simulator or emulator, not on the named hardware.
- `VERIFIED`: the gate has evidence in the repository.

The kernel claim manifest (`kernel/compute/manifest.json`) and the build
manifests remain the authority for what is claimed. This ADR does not change
`bootable_general_purpose_os`, any hardware flag, or any live-adapter flag.
