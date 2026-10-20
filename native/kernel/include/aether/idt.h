/*
 * Aetherius kernel: IDT entry encoding, 8259 PIC remap and 8253 PIT
 * programming.
 *
 * The gate descriptor layout and the PIC/PIT sequences follow the x86-64
 * and 8259/8253 hardware. The pure parts - the encoding, the vector
 * arithmetic and the divisor maths - are separated from the port I/O so
 * they can be tested on the host.
 */

#ifndef AETHER_IDT_H
#define AETHER_IDT_H

#include "aether/types.h"

#define AETHER_IDT_ENTRY_COUNT 256u

/* Gate type bytes. */
#define AETHER_GATE_INTERRUPT 0x0Eu  /* interrupt gate, clears IF      */
#define AETHER_GATE_TRAP 0x0Fu      /* trap gate, leaves IF set       */

/*
 * An x86-64 IDT gate descriptor. Exactly 16 bytes, laid out to match the
 * hardware byte for byte.
 */
typedef struct aether_gate_desc {
    uint16_t offset_low;
    uint16_t selector;
    uint8_t ist;
    uint8_t type_attr;
    uint16_t offset_mid;
    uint32_t offset_high;
    uint32_t reserved;
} AETHER_PACKED_STRUCT_BEGIN aether_gate_desc;

/* Build a gate descriptor. */
aether_gate_desc aether_gate_new(uint64_t offset,
                                 uint16_t selector,
                                 uint8_t gate_type,
                                 uint8_t dpl,
                                 int present);

/* Recover the handler address a gate points at. */
uint64_t aether_gate_offset(const aether_gate_desc *gate);

/* Whether the gate is marked present. */
int aether_gate_is_present(const aether_gate_desc *gate);

/* The 8259 PIC remap: master at base1, slave at base2. */
typedef struct aether_pic_remap {
    uint8_t base1;
    uint8_t base2;
} aether_pic_remap;

/* The vector an IRQ number lands on, or -1 when the IRQ is out of range. */
int aether_pic_irq_vector(const aether_pic_remap *remap, uint8_t irq);

/* The 8253 PIT channel 0 divisor for a given tick rate, or -1 when the
 * rate cannot be represented. */
int32_t aether_pit_divisor(uint32_t hz);

/* The two bytes written to the PIT data port for a divisor. */
void aether_pit_bytes(uint16_t divisor, uint8_t out[2]);

/* Convert a tick count to milliseconds at a given rate. */
uint64_t aether_ticks_to_ms(uint64_t ticks, uint64_t hz);

#endif /* AETHER_IDT_H */
