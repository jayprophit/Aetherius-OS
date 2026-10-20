/*
 * Aetherius kernel: IDT gate encoding, PIC remap and PIT divisor maths.
 */

#include "aether/idt.h"

aether_gate_desc aether_gate_new(uint64_t offset,
                                uint16_t selector,
                                uint8_t gate_type,
                                uint8_t dpl,
                                int present) {
    aether_gate_desc gate;
    gate.offset_low = (uint16_t)(offset & 0xFFFFu);
    gate.selector = selector;
    gate.ist = 0;
    gate.type_attr = (uint8_t)((present ? 0x80u : 0x00u)
                               | ((dpl & 0x3u) << 5)
                               | (gate_type & 0x0Fu));
    gate.offset_mid = (uint16_t)((offset >> 16) & 0xFFFFu);
    gate.offset_high = (uint32_t)((offset >> 32) & 0xFFFFFFFFu);
    gate.reserved = 0;
    return gate;
}

uint64_t aether_gate_offset(const aether_gate_desc *gate) {
    return (uint64_t)gate->offset_low
         | ((uint64_t)gate->offset_mid << 16)
         | ((uint64_t)gate->offset_high << 32);
}

int aether_gate_is_present(const aether_gate_desc *gate) {
    return (gate->type_attr & 0x80u) != 0u;
}

int aether_pic_irq_vector(const aether_pic_remap *remap, uint8_t irq) {
    if (irq < 8u) {
        unsigned int vector = (unsigned int)remap->base1 + irq;
        return vector > 0xFFu ? -1 : (int)vector;
    }
    if (irq < 16u) {
        unsigned int vector = (unsigned int)remap->base2 + (irq - 8u);
        return vector > 0xFFu ? -1 : (int)vector;
    }
    return -1;
}

int32_t aether_pit_divisor(uint32_t hz) {
    if (hz == 0u) {
        return -1;
    }
    const uint32_t pit_base_hz = 1193182u;
    uint32_t divisor = pit_base_hz / hz;
    if (divisor == 0u || divisor > 0xFFFFu) {
        return -1;
    }
    return (int32_t)divisor;
}

void aether_pit_bytes(uint16_t divisor, uint8_t out[2]) {
    out[0] = (uint8_t)(divisor & 0xFFu);
    out[1] = (uint8_t)((divisor >> 8) & 0xFFu);
}

uint64_t aether_ticks_to_ms(uint64_t ticks, uint64_t hz) {
    if (hz == 0u) {
        return 0u;
    }
    /* Saturating: ticks * 1000 overflows for absurd tick counts, and a
     * wrapped value would be a lie. */
    if (ticks > UINT64_MAX / 1000u) {
        return UINT64_MAX / hz;
    }
    return (ticks * 1000u) / hz;
}
