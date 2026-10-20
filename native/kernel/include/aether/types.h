/*
 * Aetherius kernel: fixed-width types and compiler attributes.
 *
 * The kernel is built with freestanding C11. It has no libc, no dynamic
 * allocation before the heap exists, and no hosted runtime. Everything
 * here is therefore written to compile under -ffreestanding with no
 * headers beyond the compiler's own freestanding subset.
 */

#ifndef AETHER_TYPES_H
#define AETHER_TYPES_H

#include <stdint.h>
#include <stddef.h>

#if defined(__GNUC__) || defined(__clang__)

/* A function that must not return. */
#define AETHER_NORETURN __attribute__((noreturn))

/* A function whose result must be used. */
#define AETHER_MUST_USE __attribute__((warn_unused_result))

/* A symbol that must not be preempted or interposed. */
#define AETHER_EXPORT __attribute__((visibility("default")))

/* Code that runs exactly once, before any other initialiser. */
#define AETHER_USED __attribute__((used))

/* Tell the compiler a packed struct member is deliberately unaligned. */
#define AETHER_PACKED __attribute__((packed))

/* Structure layout the kernel shares with user space. The kernel and
 * user space are built by the same compiler, so this is belt and braces,
 * but it is the difference between a silent misread and a rejected call. */
#define AETHER_PACKED_STRUCT_BEGIN

#else
#error "Aetherius kernel requires GCC or clang"
#endif

/* The number of elements in a fixed-size array, at compile time. */
#define AETHER_ARRAY_LEN(a) (sizeof(a) / sizeof((a)[0]))

/* A byte offset within a structure, at compile time. */
#define AETHER_OFFSET_OF(type, member) ((size_t) & (((type *)0)->member))

/* Round up to a multiple of `align`. Used for stack and page alignment. */
#define AETHER_ALIGN_UP(value, align) (((value) + ((align) - 1u)) & ~((uint64_t)(align) - 1u))

/* The page size the kernel uses. 4 KiB, because that is what every
 * x86-64 firmware hands over and what the page tables are shaped around. */
#define AETHER_PAGE_SIZE 4096u
#define AETHER_PAGE_SHIFT 12u

#define AETHER_PAGE_ALIGN_DOWN(value) ((value) & ~((uint64_t)AETHER_PAGE_SIZE - 1u))
#define AETHER_PAGE_ALIGN_UP(value) AETHER_ALIGN_UP(value, AETHER_PAGE_SIZE)

/* The size of one page frame, in bytes, and the number of frames in it. */
#define AETHER_BYTES_PER_PAGE AETHER_PAGE_SIZE
#define AETHER_FRAMES_PER_PAGE (AETHER_PAGE_SIZE / 4096u)

#endif /* AETHER_TYPES_H */
