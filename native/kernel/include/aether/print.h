/*
 * Aetherius kernel: console and serial output.
 *
 * The kernel cannot rely on the firmware for output once boot services
 * are gone, and the fault path must work even when nothing else does. So
 * the serial port is driven directly: COM1 at 0x3F8, polled.
 */

#ifndef AETHER_PRINT_H
#define AETHER_PRINT_H

#include "aether/types.h"

/* Write one byte to COM1, waiting for the transmitter to drain. */
void aether_serial_putc(char c);

/* Write a NUL-terminated string to COM1. */
void aether_serial_puts(const char *text);

/* Write a length-delimited string to COM1. */
void aether_serial_write(const char *data, size_t length);

/* Write an unsigned 32-bit value in decimal to COM1. */
void aether_serial_put_u32(uint32_t value);

/* Write an unsigned 64-bit value in decimal to COM1. */
void aether_serial_put_u64(uint64_t value);

/* Write a hexadecimal 64-bit value to COM1, with a 0x prefix. */
void aether_serial_put_hex64(uint64_t value);

/* Write a newline. */
void aether_serial_putnl(void);

/* Halt the CPU forever, with interrupts disabled. */
AETHER_NORETURN void aether_halt(void);

#endif /* AETHER_PRINT_H */
