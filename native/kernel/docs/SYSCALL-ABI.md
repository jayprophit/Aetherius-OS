# Aetherius Syscall ABI, version 1

**Status:** proposed, version 1
**Header:** `native/kernel/include/aether/syscall.h`
**Owner:** Aetherius kernel

This document is the contract between the Aetherius kernel and every
language that runs above it.

## Why this exists

Aetherius is a kernel, in the same sense that Linux, Windows, macOS,
Android and iOS are kernels. That has a specific consequence: a program
written in any language must be able to use the machine, and the machine
must be able to control the program, without either side being rewritten.

The mechanism is a syscall interface. A program asks the kernel to do
something; the kernel decides whether it may, does it, and reports the
result. Everything else — the language the program is written in, the
runtime it uses, the editor it was written in — is a detail the kernel
does not care about.

Without this contract, Aetherius would be an application with a library
bolted on. With it, Aetherius is a platform, and a Rust program, a
TypeScript program and a Python program are all first-class citizens on
the same machine.

## The calling convention

x86-64, following the Linux convention, because every compiler and every
runtime already knows it:

| Purpose | Register |
|---|---|
| syscall number | `RAX` |
| argument 0 | `RDI` |
| argument 1 | `RSI` |
| argument 2 | `RDX` |
| argument 3 | `R10` |
| argument 4 | `R8` |
| argument 5 | `R9` |
| return value | `RAX` |

The `syscall` instruction traps to the kernel. The kernel preserves the
caller's register set, so a caller may use any register across the
boundary. `RCX` and `R11` are clobbered by the instruction itself, as
they are on Linux.

Errors are negative return values. Zero or above is success. The
magnitude is the error code, and the codes match the POSIX ones closely
enough that a language runtime's existing error plumbing works unchanged:

| Code | Name | Meaning |
|---|---|---|
| -1 | `EPERM` | operation not permitted |
| -2 | `ENOENT` | no such file, handle or capability |
| -3 | `EINVAL` | invalid argument |
| -4 | `ENOSYS` | syscall not implemented in this build |
| -5 | `EAGAIN` | would block |
| -6 | `ENOMEM` | out of memory |
| -7 | `EFAULT` | bad user pointer |
| -8 | `EIO` | input/output failure |
| -9 | `EBUSY` | resource busy |
| -10 | `ENOTSUP` | not supported on this target |
| -11 | `EOVERFLOW` | value too large for the field |
| -12 | `EPROTO` | wrong protocol or ABI version |
| -13 | `EDENIED` | explicitly denied by policy |
| -14 | `ENOSPC` | no space |

## The syscall table

Numbers are permanent. A number, once assigned, is never reused and never
renumbered; a retired number stays retired.

| Number | Name | Arguments | Returns |
|---|---|---|---|
| 0 | `WRITE` | fd, buf, count | bytes written, or negative |
| 1 | `READ` | fd, buf, count | bytes read, or negative |
| 2 | `EXIT` | status | never returns |
| 3 | `YIELD` | — | 0 |
| 4 | `CLOCK_MONOTONIC` | — | nanoseconds since boot |
| 5 | `THREAD_SELF` | — | thread id |
| 6 | `MEMORY_MAP` | request pointer | address, or negative |
| 7 | `MEMORY_UNMAP` | address, length | 0, or negative |
| 8 | `CAPABILITY_CHECK` | capability id | grant result |
| 9 | `CAPABILITY_LIST` | — | capability count |
| 10 | `MESSAGE_SEND` | message pointer | 0, or negative |
| 11 | `MESSAGE_RECV` | buffer, capacity | bytes read, or negative |
| 12 | `WORKSPACE_OPEN` | request pointer | handle, or negative |
| 13 | `WORKSPACE_READ` | handle, buf, count | bytes read, or negative |
| 14 | `WORKSPACE_WRITE` | handle, buf, count | bytes written, or negative |
| 15 | `WORKSPACE_LIST` | — | workspace count |
| 16 | `KV_GET` | request pointer | bytes, or negative |
| 17 | `KV_SET` | request pointer | 0, or negative |
| 18 | `EVENT_POST` | event pointer | 0, or negative |
| 19 | `EVENT_WAIT` | timeout ms | event, or negative |

The highest assigned number is 19, exposed as `AETHER_SYS_MAX`. A
binding may size its dispatch table from it.

## Capabilities

The kernel is the only authority. A caller asks; the kernel answers from
the policy engine, never from the caller's own belief about itself.

`CAPABILITY_CHECK` returns the grant in the low bits and the reason in
the high bits, so a caller can distinguish *denied* from *not yet known*
and can log why:

| Value | Meaning |
|---|---|
| 0 | `GRANTED` |
| 1 | `DENIED` |
| 2 | `UNKNOWN` — the capability is not registered |
| 3 | `PENDING` — awaiting a decision |

The reason code is shifted left by 32 bits, so it does not collide with
the grant.

## Structures that cross the boundary

Every structure that crosses the boundary begins with its own size and the
ABI version it was built against:

```c
#define AETHER_STRUCT_HEADER(name) \
    uint32_t name##_size;          \
    uint32_t name##_abi_version
```

The kernel refuses a structure whose size it does not recognise. A caller
built against a newer header is rejected rather than silently misread,
and a caller built against an older header still works, because the
kernel reads only the fields it knows.

No structure contains a pointer, a Rust enum, or anything whose size
depends on the compiler. Pointers never cross; the kernel takes an
address and a length and copies.

## Binding from other languages

The header is C, but nothing in it is C-specific. A binding is four
instructions:

```
mov rax, number
mov rdi, arg0
mov rsi, arg1
mov rdx, arg2
mov r10, arg3
mov r8,  arg4
mov r9,  arg5
syscall
```

**Rust:** `core::arch::asm!` with the same register constraints. The
`aether_syscall6` inline in the header is already valid Rust-safe
C, and can be copied verbatim.

**TypeScript / JavaScript:** a WebAssembly host with a `wasi_snapshot_preview1`-style
import, or a native addon that performs the same trap. The important
property is that the WASM or native host is the thing that holds the
capability, not the script: a script that cannot reach the syscall
cannot escalate.

**Python:** a `ctypes` binding to a small shared library that performs
the trap, or a `cffi` layer over the same header.

**Any language:** the requirement is only that it can express the register
convention. A language that cannot inline the sequence links a small
assembly shim; the convention is identical either way.

## What the kernel guarantees

- The capability check happens in the kernel, before the operation, not
  in the caller.
- A call that is refused is refused with a reason, not silently ignored.
- An unknown syscall number returns `ENOSYS` rather than doing something
  arbitrary.
- A structure of an unrecognised size is refused rather than misread.
- The register set is preserved across the boundary.

## What the kernel does not guarantee

- That a call is cheap. Some calls will block.
- That a grant is permanent. Grants are time-bounded and can be revoked.
- That a capability implies another. Capability `N` grants exactly
  capability `N` and nothing else.
- That a caller can be trusted. The kernel assumes it cannot.

## Status

The header and the dispatch table are implemented. The machine-level
entry path, the GDT and TSS installation, the IDT and the scheduler are
ported from the Rust kernel and are covered by the host test suite for
their pure logic. The UEFI image and the QEMU boot proof are the next
step, and are recorded as such rather than claimed.

See `docs/GAP-ANALYSIS-REGISTRY.yaml` for the capability gaps this ABI
does not yet close, and `docs/adr/` for the decision to write the kernel
in C.
