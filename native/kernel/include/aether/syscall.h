/*
 * Aetherius kernel syscall ABI, version 1.
 *
 * This header is the contract between the Aetherius kernel and every
 * language that runs above it. A C program, a Rust program, a TypeScript
 * runtime and a Python program all reach the kernel the same way, through
 * the same numbered calls, with the same argument convention, and they all
 * see the same results. That is what makes Aetherius a kernel rather than
 * an application with a library bolted on.
 *
 * Stability rules, in order of importance:
 *
 *  1. A syscall number, once assigned, is never reused and never
 *     renumbered. A retired number stays retired.
 *  2. An existing call never changes its meaning. New behaviour is a new
 *     number.
 *  3. A structure that crosses the boundary has an explicit layout, an
 *     explicit size, and never contains a pointer, a Rust enum, or
 *     anything whose size depends on the compiler.
 *  4. Every structure states its size in the first field, so the kernel
 *     can reject a caller built against a newer header.
 *
 * Register convention, following the x86-64 Linux convention because it is
 * the one every compiler and runtime already knows:
 *
 *   number   RAX
 *   arg0     RDI
 *   arg1     RSI
 *   arg2     RDX
 *   arg3     R10
 *   arg4     R8
 *   arg5     R9
 *   return   RAX
 *
 * The kernel enters through the SYSCALL instruction. The kernel restores
 * the full user register set before returning, so a caller may use any
 * register it likes across the boundary.
 *
 * Error convention: a call returns a negative value on failure, with the
 * magnitude being an Aetherius error code (see aether_errno below). A
 * return of zero or above is success. This matches POSIX closely enough
 * that a language runtime's existing error plumbing works unchanged.
 */

#ifndef AETHER_SYSCALL_H
#define AETHER_SYSCALL_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* The ABI version this header describes. Bumped only for a change that
 * existing callers could notice. */
#define AETHER_ABI_VERSION 1u

/* The instruction the kernel traps. Defined here so that every language
 * binding can reach the kernel without knowing the instruction. */
#define AETHER_SYSCALL_INSTRUCTION "syscall"

/* ------------------------------------------------------------------------ */
/* Syscall numbers                                                          */
/* ------------------------------------------------------------------------ */
/* Assigned in blocks. A block is never reused, even when fully retired. */

#define AETHER_SYS_WRITE 0u             /* fd, buf, count -> ssize_t        */
#define AETHER_SYS_READ 1u              /* fd, buf, count -> ssize_t        */
#define AETHER_SYS_EXIT 2u              /* status -> never returns          */
#define AETHER_SYS_YIELD 3u             /* -> 0                             */
#define AETHER_SYS_CLOCK_MONOTONIC 4u   /* -> int64 nanoseconds             */
#define AETHER_SYS_THREAD_SELF 5u       /* -> uint64                        */
#define AETHER_SYS_MEMORY_MAP 6u        /* req -> int64 address or -errno   */
#define AETHER_SYS_MEMORY_UNMAP 7u      /* addr, len -> int64               */
#define AETHER_SYS_CAPABILITY_CHECK 8u  /* cap_id -> int64 grant            */
#define AETHER_SYS_CAPABILITY_LIST 9u   /* -> uint64 count                  */
#define AETHER_SYS_MESSAGE_SEND 10u     /* msg -> int64                     */
#define AETHER_SYS_MESSAGE_RECV 11u     /* buf, cap -> int64 bytes          */
#define AETHER_SYS_WORKSPACE_OPEN 12u   /* path -> int64 handle             */
#define AETHER_SYS_WORKSPACE_READ 13u   /* handle, buf, count -> int64      */
#define AETHER_SYS_WORKSPACE_WRITE 14u  /* handle, buf, count -> int64      */
#define AETHER_SYS_WORKSPACE_LIST 15u   /* -> uint64 count                  */
#define AETHER_SYS_KV_GET 16u           /* key, klen, val, vcap -> int64    */
#define AETHER_SYS_KV_SET 17u           /* key, klen, val, vlen -> int64    */
#define AETHER_SYS_EVENT_POST 18u       /* type, payload, len -> int64      */
#define AETHER_SYS_EVENT_WAIT 19u       /* timeout_ms -> int64              */

/* The highest number assigned so far. A binding can use this to size a
 * dispatch table. */
#define AETHER_SYS_MAX 19u

/* ------------------------------------------------------------------------ */
/* Errors                                                                   */
/* ------------------------------------------------------------------------ */
/* Negative return values. Magnitude is the code. */

#define AETHER_EPERM (-1)      /* operation not permitted                     */
#define AETHER_ENOENT (-2)     /* no such file, handle or capability          */
#define AETHER_EINVAL (-3)     /* invalid argument                           */
#define AETHER_ENOSYS (-4)     /* syscall not implemented in this build        */
#define AETHER_EAGAIN (-5)     /* would block                                */
#define AETHER_ENOMEM (-6)     /* out of memory                              */
#define AETHER_EFAULT (-7)     /* bad user pointer                           */
#define AETHER_EIO (-8)       /* input/output failure                       */
#define AETHER_EBUSY (-9)     /* resource busy                              */
#define AETHER_ENOTSUP (-10)   /* not supported on this target                */
#define AETHER_EOVERFLOW (-11) /* value too large for the field               */
#define AETHER_EPROTO (-12)   /* wrong protocol or ABI version              */
#define AETHER_EDENIED (-13)   /* explicitly denied by policy                */
#define AETHER_ENOSPC (-14)   /* no space                                   */

/* ------------------------------------------------------------------------ */
/* Capabilities                                                             */
/* ------------------------------------------------------------------------ */
/*
 * A capability is a permission to do something. The kernel is the only
 * authority: a caller asks, the kernel answers, and the answer comes from
 * the policy engine rather than from the caller's own belief about itself.
 *
 * These are the identifiers the kernel understands. The full registry lives
 * in the policy engine; the kernel holds a cached view of the grants that
 * matter for the currently running agent.
 */
typedef uint64_t aether_capability_t;

#define AETHER_CAP_NONE ((aether_capability_t)0u)
#define AETHER_CAP_FS_READ ((aether_capability_t)1u)
#define AETHER_CAP_FS_WRITE ((aether_capability_t)2u)
#define AETHER_CAP_NET ((aether_capability_t)3u)
#define AETHER_CAP_PROC_SPAWN ((aether_capability_t)4u)
#define AETHER_CAP_MESSAGE ((aether_capability_t)5u)
#define AETHER_CAP_KV ((aether_capability_t)6u)
#define AETHER_CAP_BROWSER ((aether_capability_t)7u)
#define AETHER_CAP_MODEL ((aether_capability_t)8u)
#define AETHER_CAP_MAX ((aether_capability_t)8u)

/* ------------------------------------------------------------------------ */
/* Cross-boundary structures                                                */
/* ------------------------------------------------------------------------ */
/* Every one of these begins with its own size in bytes. The kernel refuses
 * a structure whose size it does not recognise, so a caller built against a
 * newer header is rejected rather than silently misread. */

#define AETHER_STRUCT_HEADER(name) \
    uint32_t name##_size;          \
    uint32_t name##_abi_version

/* A memory mapping request. */
typedef struct aether_memmap_request {
    AETHER_STRUCT_HEADER(aether_memmap_request);
    uint64_t address;   /* requested base, 0 for any                 */
    uint64_t length;    /* bytes                                    */
    uint64_t protect;   /* AETHER_PROT_* flags                      */
} aether_memmap_request;

/* Protection flags for aether_memmap_request.protect. */
#define AETHER_PROT_READ 0x1u
#define AETHER_PROT_WRITE 0x2u
#define AETHER_PROT_EXEC 0x4u

/* A message header. The payload follows immediately after the header in
 * the same buffer, which is why the header records the total length. */
typedef struct aether_message_header {
    AETHER_STRUCT_HEADER(aether_message_header);
    uint64_t sender_id;     /* identity of the sending agent          */
    uint64_t receiver_id;    /* identity of the intended recipient     */
    uint64_t task_id;       /* task this message belongs to, or 0     */
    uint64_t parent_id;     /* parent task, for lineage               */
    uint64_t intent;        /* what the message is for                */
    uint64_t confidence;    /* 0..10000, hundredths of a percent      */
    uint64_t payload_length; /* bytes after this header                */
} aether_message_header;

/* Intent codes for aether_message_header.intent. */
#define AETHER_INTENT_TASK 1u
#define AETHER_INTENT_EVIDENCE 2u
#define AETHER_INTENT_HYPOTHESIS 3u
#define AETHER_INTENT_DECISION 4u
#define AETHER_INTENT_STATUS 5u
#define AETHER_INTENT_REQUEST 6u
#define AETHER_INTENT_QUESTION 7u

/* A workspace handle request. */
typedef struct aether_workspace_request {
    AETHER_STRUCT_HEADER(aether_workspace_request);
    uint64_t path_length;
    uint64_t flags;
} aether_workspace_request;

#define AETHER_WORKSPACE_READ 0x1u
#define AETHER_WORKSPACE_WRITE 0x2u
#define AETHER_WORKSPACE_CREATE 0x4u

/* A key-value request. Keys and values are byte strings that follow the
 * request in the caller's buffer; the kernel copies them and never
 * retains a pointer. */
typedef struct aether_kv_request {
    AETHER_STRUCT_HEADER(aether_kv_request);
    uint64_t key_length;
    uint64_t value_length;
} aether_kv_request;

/* An event posted to the kernel event bus. */
typedef struct aether_event {
    AETHER_STRUCT_HEADER(aether_event);
    uint64_t type;
    uint64_t payload_length;
    uint64_t severity; /* 0 info, 1 warn, 2 error, 3 fatal */
} aether_event;

/* ------------------------------------------------------------------------ */
/* Capability check result                                                  */
/* ------------------------------------------------------------------------ */
/* Returned by AETHER_SYS_CAPABILITY_CHECK in the low bits, with the
 * reason code in the high bits, so a caller can distinguish "not granted"
 * from "granted but not yet", and can log why. */

#define AETHER_GRANT_GRANTED 0u
#define AETHER_GRANT_DENIED 1u
#define AETHER_GRANT_UNKNOWN 2u
#define AETHER_GRANT_PENDING 3u

#define AETHER_GRANT_REASON_SHIFT 32u

/* ------------------------------------------------------------------------ */
/* The entry point every language binds to                                 */
/* ------------------------------------------------------------------------ */
/*
 * Inline so that a binding needs no library: the sequence is four
 * instructions. A language that cannot inline it may link the small
 * assembly shim in arch/x86_64/syscall_entry.S instead; the register
 * convention is identical either way.
 */
#if defined(__x86_64__) && (defined(__GNUC__) || defined(__clang__))

static inline int64_t aether_syscall6(int64_t nr,
                                      int64_t a0, int64_t a1, int64_t a2,
                                      int64_t a3, int64_t a4, int64_t a5) {
    int64_t ret;
    __asm__ volatile(
        "syscall"
        : "=a"(ret)
        : "a"(nr), "D"(a0), "S"(a1), "d"(a2), "r"(a3), "r"(a4), "r"(a5)
        : "rcx", "r11", "memory");
    return ret;
}

static inline int64_t aether_syscall(int64_t nr) {
    return aether_syscall6(nr, 0, 0, 0, 0, 0, 0);
}

#define AETHER_SYSCALL_CLOBBERS "rcx", "r11", "memory"

#endif /* __x86_64__ && (GNU C or clang) */

#ifdef __cplusplus
}
#endif

#endif /* AETHER_SYSCALL_H */
