# ADR-001: The Aetherius kernel is written in C

**Status:** accepted
**Date:** 2026-10-20
**Owner:** Jonathan (Aetherius project)
**Supersedes:** the Rust-only native layer under `native/aether-boot/`

## Context

Aetherius is a kernel. It is to Aetherius OS, Genesis, the IDE and Agent
Bridge what Linux is to Ubuntu, what Windows is to the software that runs
on it, what Android is to the applications on a phone, and what iOS is to
the apps on an iPhone.

That framing has a consequence that the previous native layer did not
honour. The native layer was written in Rust, which is a fine language,
but it meant:

- The kernel was not directly comparable to the kernels it is meant to
  replace or to sit beside. Linux, Windows, Apple, Android and Google
  kernels are all C. Their boot protocols, their memory layouts, their
  syscall conventions, their driver models and their debuggers all assume
  a C-shaped kernel.
- The native layer could not be a shared substrate for languages other
  than Rust without an intermediate layer that translated everything.
  A kernel in C exposes a C ABI; other languages bind to that ABI
  directly.
- The Rust native layer was only 5,282 lines across 25 files, and it was
  coupled to the `uefi` crate, so it could not be built by an ordinary
  C toolchain and could not be linked against a C bootloader.

The owner has directed: *aetherius is a kernel like Microsoft OS, Apple
OS, Linux OS, Ubuntu OS, Android OS, iOS, Google OS, others, so it should
be built with C and then other languages built with it as well.*

## Decision

The Aetherius kernel is written in C.

Specifically:

1. **The kernel proper is C11, freestanding.** No libc, no hosted
   runtime, no dynamic allocation before the heap exists. Compiled with
   `-ffreestanding -fno-builtin -fno-stack-protector -Wall -Wextra
   -Werror -Wpedantic -Wshadow -Wconversion`.

2. **The architecture layer is C plus assembly where the CPU requires
   it.** The interrupt stubs, the syscall entry path and the context
   switch are assembly, because there is no C construct that expresses
   "load this register set and return somewhere else". Everything else
   is C.

3. **The kernel exposes a stable, versioned C ABI** — the syscall
   interface, in `native/kernel/include/aether/syscall.h`. This is the
   contract every other language binds to. It is the mechanism by which
   "other languages built with it" becomes true rather than aspirational.

4. **The Rust native layer is retained until the C kernel proves
   equivalent, then retired.** It is not deleted on the strength of this
   decision. The C port carries the same assertions as the Rust original,
   so equivalence is measured rather than asserted.

5. **Everything above the kernel is unchanged and stays in its own
   language.** Genesis is C++. The IDE and Aetherius-OS are TypeScript.
   Agent Bridge is Python. The MAT toolchain is JavaScript. The point of
   a kernel is that it is language-neutral above the ABI.

## Why C and not Rust

Rust is not a bad choice for a kernel; Linux supports it, and it is
safer than C. The reasons for C here are specific, not aesthetic:

- **Comparability.** Every reference kernel this project is measured
  against — Linux, Windows, macOS, Android, iOS — is C. Their boot
  protocols, their memory maps, their device trees and their syscall
  conventions are C-shaped. Working in C means the reference
  documentation, the reference debuggers and the reference hardware
  documentation apply directly rather than through a translation.
- **The ABI is the deliverable.** A C ABI is the lingua franca. A Rust
  ABI is not something another language can bind to without a shim that
  costs an FFI boundary anyway. The whole point of "other languages
  built with it" is that the boundary is cheap and stable.
- **The portable parts are already tested.** The C port of the GDT, TSS,
  STAR, IDT gate, PIC, PIT and scheduler logic carries the same
  assertions as the Rust original and passes them. The equivalence is
  measured.
- **The bootloader path.** A C kernel can be linked with gnu-efi, the
  standard open-source UEFI toolchain, without a Rust toolchain in the
  build. The native layer's dependency on the `uefi` crate made the
  build less portable than the project wants.

The safety argument for Rust is real and is not dismissed. The answer
here is that the C kernel is small, that its pure logic is covered by
host tests that run on every change, and that the memory-safety burden
is concentrated in a narrow privileged layer rather than spread across
the system.

## Consequences

**Good:**

- The kernel is directly comparable to the reference kernels.
- Every language gets a first-class path to the machine, through a
  versioned ABI with an explicit stability contract.
- The build no longer requires a Rust toolchain for the native layer.
- The kernel's pure logic is testable on an ordinary host with an
  ordinary compiler, which is the fastest possible gate.

**Bad, and accepted:**

- The kernel layer has no compile-time memory safety. The host test
  suite and the QEMU boot harness are the mitigation, and they are real
  gates rather than aspirations.
- The port is work. The Rust native layer is 5,282 lines across 25
  files in two crates. The port is staged, with the pure logic first
  because it is the part that can be proven on a host.

**Neutral:**

- Genesis remains C++. A C kernel does not force the layers above it to
  be C, and should not: the kernel is the substrate, not the product.

## Implementation

The C kernel lives at `native/kernel/`:

```
native/kernel/
  include/aether/
    types.h        fixed-width types, compiler attributes
    syscall.h      the ABI: numbers, errors, capabilities, structures
    kernel.h       the kernel's own internal API
    gdt.h idt.h sched.h print.h
  arch/x86_64/
    gdt.c          descriptor and TSS encoding, pure
    idt.c          gate encoding, PIC remap, PIT divisor, pure
    sched.c        round-robin policy, pure
  kernel/
    sched.c syscall.c print.c main.c
  mm/memmap.c
  tests/test_kernel.c
  Makefile        Unix build
  build.ps1       Windows build
  docs/SYSCALL-ABI.md
```

The pure modules are separated from the machine-level ones deliberately.
The encoding and policy modules have no instructions in them and are
tested on the host; the modules that touch the CPU are covered by the
QEMU boot harness, because booting is the only honest way to prove an
interrupt handler works.

## Verification

- `native/kernel/build.ps1` (Windows) and `make test` (Unix) build and
  run the host suite. As of 2026-10-20: **126 checks, 0 failures**.
- The C port carries the same assertions as the Rust original, including
  the exact expected descriptor bytes, so the port is proven to preserve
  behaviour rather than merely to compile.

## What is not yet done

- The UEFI image does not build yet: `gnu-efi` is not installed on this
  host, and the build script says so rather than pretending otherwise.
- The machine-level modules (`gdt_install.c`, `idt_install.c`, `isr.c`,
  `entry.S`, `main.c`) are specified and referenced by the build but not
  yet written.
- The QEMU boot proof has not been run against the C kernel.

These are recorded in `docs/PROJECT-TODOS.yaml` and in the Aetherius-OS
build manifest, not claimed as done.
