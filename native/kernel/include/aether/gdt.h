/*
 * Aetherius kernel: GDT, TSS and SYSCALL/SYSRET encoding.
 *
 * Pure logic, with no machine instructions, so it is testable on the host
 * exactly as the Rust original was. The kernel proper installs what this
 * file describes; it never re-derives the encoding.
 *
 * GDT layout (byte offsets):
 *
 *   0x00  null
 *   0x08  kernel code
 *   0x10  kernel data
 *   0x18  user data
 *   0x20  user code
 *   0x28  TSS
 *
 * The user data segment sits below the user code segment deliberately. It
 * has to, because SYSCALL/SYSRET derive the user CS and SS from a single
 * STAR base: CS comes from base+16 and SS from base+8.
 */

#ifndef AETHER_GDT_H
#define AETHER_GDT_H

#include "aether/types.h"

#define AETHER_SEL_KCODE 0x08u
#define AETHER_SEL_KDATA 0x10u
#define AETHER_SEL_UDATA 0x18u
#define AETHER_SEL_UCODE 0x20u
#define AETHER_SEL_TSS 0x28u

/* Byte offset of RSP0 inside the TSS: the ring-0 stack a CPL3 trap lands
 * on when it crosses the privilege boundary. */
#define AETHER_TSS_RSP0_OFFSET 4u

/* The minimum architectural TSS size. */
#define AETHER_TSS_SIZE 104u

/*
 * Encode a 64-bit code or data segment descriptor with base 0 and a limit
 * of 4 GiB.
 *
 *   code  non-zero for an executable segment
 *   dpl   privilege level: 0 for the kernel, 3 for user space
 */
uint64_t aether_segment_descriptor(int code, uint8_t dpl);

/*
 * The STAR MSR value for SYSCALL/SYSRET with the layout above.
 *
 * SYSCALL loads CS from bits 47:32 and SS from bits 63:48 plus 8.
 * SYSRET loads CS from bits 47:32 plus 16 and SS from bits 63:48 plus 8.
 * With kernel code at 0x08 and user code at 0x20, the base is 0x10.
 */
uint64_t aether_star_value(void);

/*
 * Encode a TSS descriptor as the pair of 8-byte halves the GDT holds.
 * out must have room for two uint64_t.
 */
void aether_tss_descriptor(uint64_t base, uint32_t limit, uint64_t out[2]);

/* Recover the base address from a TSS descriptor pair. */
uint64_t aether_tss_descriptor_base(const uint64_t pair[2]);

#endif /* AETHER_GDT_H */
