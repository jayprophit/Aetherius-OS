# Aetherius kernel build (Unix / GNU make).
#
# Two products from one source tree:
#
#   make test    - the host test suite. Ordinary compiler, no kernel, no
#                  emulator. Covers the arithmetic and policy of the
#                  kernel: GDT/TSS/STAR encoding, IDT gates, PIC/PIT, the
#                  scheduling policy, and syscall dispatch.
#
#   make uefi    - the UEFI kernel image. Freestanding C11, built with the
#                  UEFI calling convention.
#
# The host tests are the fast gate and run on every change. The UEFI image
# is verified separately by the QEMU boot harness, because booting is the
# only honest way to prove an interrupt handler works.
#
# On Windows, use build.ps1 instead: GNU make's process spawning does not
# work reliably under PowerShell, and the Windows script does the same
# steps with Windows-correct directory handling.

CC       ?= gcc
BUILD    ?= build
INCLUDE  := -Iinclude

# Freestanding: no hosted runtime, no libc.
CFLAGS   := -std=c11 -ffreestanding -fno-builtin -fno-stack-protector \
            -Wall -Wextra -Werror -Wpedantic -Wshadow -Wconversion \
            -Wno-unused-parameter -O2 -g $(INCLUDE)

# The host tests do link libc, because they are ordinary programs.
HOST_CFLAGS := -std=c11 -Wall -Wextra -Werror -Wpedantic -Wshadow \
               -Wno-unused-parameter -O1 -g $(INCLUDE)

# Freestanding code may not use these; catching it at compile time is
# cheaper than finding it on a crashed machine.
FREESTANDING_WARN := -Wmissing-prototypes -Wstrict-prototypes -Wold-style-definition

.PHONY: all test uefi clean check

all: test

# ---------------------------------------------------------------------------
# Host tests
# ---------------------------------------------------------------------------
HOST_SRC := \
  tests/test_kernel.c \
  arch/x86_64/gdt.c \
  arch/x86_64/idt.c \
  kernel/sched.c \
  kernel/syscall.c

HOST_OBJ := $(patsubst %.c,$(BUILD)/host/%.o,$(HOST_SRC))
HOST_BIN := $(BUILD)/host/test_kernel

test: $(HOST_BIN)
	@$(HOST_BIN)

$(BUILD)/host/%.o: %.c
	@mkdir -p $(dir $@)
	$(CC) $(HOST_CFLAGS) -c $< -o $@

$(HOST_BIN): $(HOST_OBJ)
	@mkdir -p $(dir $@)
	$(CC) $(HOST_OBJ) -o $@

# ---------------------------------------------------------------------------
# UEFI kernel
# ---------------------------------------------------------------------------
# The kernel image links against gnu-efi when it is available, because
# the UEFI boot services are how a kernel gets its memory map, its
# framebuffer and its exit path. Without it the kernel cannot be built,
# and that is stated rather than worked around.
UEFI_CFLAGS := $(CFLAGS) $(FREESTANDING_WARN) -I/usr/include/efi \
               -I/usr/include/efi/x86_64 -fshort-wchar -mno-red-zone

UEFI_LDFLAGS := -nostdlib -znocombreloc -T target/x86_64-unknown-uefi.lds \
                -shared -Bsymbolic -L/usr/lib -lgnuefi -lelf

UEFI_SRC := \
  arch/x86_64/gdt.c \
  arch/x86_64/idt.c \
  arch/x86_64/io.c \
  arch/x86_64/gdt_install.c \
  arch/x86_64/idt_install.c \
  arch/x86_64/isr.c \
  kernel/sched.c \
  kernel/syscall.c \
  kernel/print.c \
  kernel/main.c \
  mm/memmap.c

UEFI_OBJ := $(patsubst %.c,$(BUILD)/uefi/%.o,$(UEFI_SRC))
UEFI_ASM := $(BUILD)/uefi/arch/x86_64/entry.o
UEFI_BIN := $(BUILD)/uefi/aether-boot.efi

uefi: $(UEFI_BIN)

$(BUILD)/uefi/%.o: %.c
	@mkdir -p $(dir $@)
	$(CC) $(UEFI_CFLAGS) -c $< -o $@

$(BUILD)/uefi/%.o: %.S
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

$(UEFI_BIN): $(UEFI_OBJ) $(UEFI_ASM)
	@mkdir -p $(dir $@)
	$(CC) $(UEFI_LDFLAGS) $(UEFI_OBJ) $(UEFI_ASM) -o $@

# ---------------------------------------------------------------------------
# Gates
# ---------------------------------------------------------------------------
check: test

clean:
	rm -rf $(BUILD)
