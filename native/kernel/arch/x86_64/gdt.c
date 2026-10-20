/*
 * Aetherius kernel: GDT, TSS and SYSCALL/SYSRET encoding.
 *
 * Pure logic, no machine instructions, so it is testable on the host.
 */

#include "aether/gdt.h"

uint64_t aether_segment_descriptor(int code, uint8_t dpl) {
    uint64_t access = 0x80u                          /* present            */
                     | ((((uint64_t)dpl) & 0x3u) << 5) /* RPL             */
                     | (code ? 0x1Au : 0x12u);      /* S=1, exec or RW   */

    /* 64-bit code: L=1, D/B=0. Data: D/B=1, L=0. G=1, limit 0xFFFFF.
     * The 0xF and the flags must be 64-bit before shifting: shifting a
     * 32-bit literal by 48 is undefined, and the compiler says so. */
    uint64_t flags = code ? 0xAull : 0xCull;

    return 0xFFFFull | (access << 40) | (0xFull << 48) | (flags << 52);
}

uint64_t aether_star_value(void) {
    /* CS base (bits 47:32) = kernel code; SS base (bits 63:48) = 0x10, so
     * that SYSRET reaches user code at base+16 and user data at base+8. */
    return ((uint64_t)0x10u << 48) | ((uint64_t)AETHER_SEL_KCODE << 32);
}

void aether_tss_descriptor(uint64_t base, uint32_t limit, uint64_t out[2]) {
    uint64_t low = ((uint64_t)limit & 0xFFFFu)
                 | ((base & 0xFFFFu) << 16)
                 | (((base >> 16) & 0xFFu) << 32)
                 | ((uint64_t)0x89u << 40)   /* P=1, DPL=0, type=9: avail 64-bit TSS */
                 | ((((uint64_t)limit >> 16) & 0xFu) << 48)
                 | (((base >> 24) & 0xFFu) << 56);
    out[0] = low;
    out[1] = base >> 32;
}

uint64_t aether_tss_descriptor_base(const uint64_t pair[2]) {
    uint64_t low = pair[0];
    return ((low >> 16) & 0xFFFFu)
         | (((low >> 32) & 0xFFu) << 16)
         | (((low >> 56) & 0xFFu) << 24)
         | (pair[1] << 32);
}
