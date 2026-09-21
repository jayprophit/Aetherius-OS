//! IDT + 8259 PIC + 8253 PIT bring-up (P11-INT).
//!
//! Runs inside the UEFI boot-services epoch on QEMU: installs CPU
//! exception handlers plus IRQ0 (timer), remaps the PIC, programs a 100 Hz
//! PIT, and self-tests with INT3. Fault path: any other exception prints
//! its vector on serial and halts that CPU.

use core::arch::{asm, naked_asm};
use core::sync::atomic::{AtomicU64, Ordering};

use aether_boot_logic::int::{GateDesc, PicRemap, GATE_INTERRUPT, IDT_ENTRY_COUNT};

#[repr(C, packed)]
struct IdtPointer {
    limit: u16,
    base: u64,
}

static mut IDT: [GateDesc; IDT_ENTRY_COUNT] = [GateDesc {
    offset_low: 0,
    selector: 0,
    ist: 0,
    type_attr: 0,
    offset_mid: 0,
    offset_high: 0,
    reserved: 0,
}; IDT_ENTRY_COUNT];

pub fn ticks() -> u64 {
    TICKS.load(Ordering::SeqCst)
}

unsafe fn outb(port: u16, value: u8) {
    unsafe {
        asm!("out dx, al", in("dx") port, in("al") value, options(nomem, nostack, preserves_flags));
    }
}

fn read_cs() -> u16 {
    let cs: u16;
    unsafe {
        asm!("mov {0:x}, cs", out(reg) cs, options(nomem, nostack, preserves_flags));
    }
    cs
}

fn set_gate(vector: u8, handler: usize) {
    let gate = GateDesc::new(handler as u64, read_cs(), GATE_INTERRUPT, 0, true);
    unsafe {
        core::ptr::addr_of_mut!(IDT[vector as usize]).write(gate);
    }
}

pub unsafe fn load_idt() {
    let pointer = IdtPointer {
        limit: (core::mem::size_of::<[GateDesc; IDT_ENTRY_COUNT]>() - 1) as u16,
        base: unsafe { IDT.as_ptr() as u64 },
    };
    unsafe {
        asm!("lidt [{}]", in(reg) &pointer, options(nostack));
    }
}

// Serial COM1 for the fault path (no allocator, no firmware calls).
fn serial_write_byte(byte: u8) {
    unsafe {
        loop {
            let status: u8;
            asm!(
                "in al, dx",
                in("dx") 0x3FDu16,
                out("al") status,
                options(nomem, nostack, preserves_flags),
            );
            if status & 0x20 != 0 {
                break;
            }
        }
        outb(0x3F8, byte);
    }
}

fn serial_write(text: &str) {
    for byte in text.bytes() {
        if byte == b'\n' {
            serial_write_byte(b'\r');
        }
        serial_write_byte(byte);
    }
}

pub fn serial_emit(text: &str) {
    serial_write(text);
}

pub fn serial_emit_u32(mut value: u32) {
    if value == 0 {
        serial_write_byte(b'0');
        return;
    }
    let mut digits = [0u8; 10];
    let mut length = 0usize;
    while value > 0 {
        digits[length] = b'0' + (value % 10) as u8;
        value /= 10;
        length += 1;
    }
    for index in (0..length).rev() {
        serial_write_byte(digits[index]);
    }
}

/// Pending interrupt record. Written by the common entry through a Rust
/// handler (relative call); drained in main context. Firmware GS state is
/// never touched.
#[derive(Clone, Copy)]
struct PendingEvent {
    vector: u64,
    error: u64,
    ready: bool,
}

static mut PENDING: PendingEvent = PendingEvent { vector: 0, error: 0, ready: false };

static TICKS: AtomicU64 = AtomicU64::new(0);

const ENTRY_MAGIC: u64 = 0x1DE70001;

/// Direct-dispatch handlers: each vector carries its own number as an
/// immediate. NOTE: x86_64-unknown-uefi uses the Windows x64 ABI for
/// extern "C": arg1=RCX, arg2=RDX, arg3=R8 (NOT SysV RDI/RSI/RDX).
/// The trampolines below follow the Win64 order.
extern "C" fn handle_event(vector: u64, error_code: u64, magic: u64) {
    if magic != ENTRY_MAGIC {
        return;
    }
    unsafe {
        core::ptr::addr_of_mut!(PENDING).write(PendingEvent { vector, error: error_code, ready: true });
    }
    if vector == 0x28 {
        unsafe {
            outb(0x20, 0x20);
        }
        TICKS.fetch_add(1, Ordering::SeqCst);
    }
}

// NOTE: x86_64-unknown-uefi uses the Windows x64 ABI for extern "C":
// arg1=RCX, arg2=RDX, arg3=R8 (NOT SysV RDI/RSI/RDX).
macro_rules! exception_no_code {
    ($name:ident, $vector:expr) => {
        #[unsafe(naked)]
        extern "C" fn $name() {
            unsafe {
                naked_asm!(
                    "push rax", "push rcx", "push rdx", "push rbx",
                    "push rbp", "push rsi", "push rdi",
                    "push r8", "push r9", "push r10", "push r11",
                    "push r12", "push r13", "push r14", "push r15",
                    "mov rcx, {vector}",
                    "mov edx, 0xC0DE",
                    "mov r8, 0x1DE70001",
                    "call {entry}",
                    "pop r15", "pop r14", "pop r13", "pop r12",
                    "pop r11", "pop r10", "pop r9", "pop r8",
                    "pop rdi", "pop rsi", "pop rbp", "pop rbx",
                    "pop rdx", "pop rcx", "pop rax",
                    "iretq",
                    vector = const $vector,
                    entry = sym handle_event,
                );
            }
        }
    };
}

macro_rules! exception_with_code {
    ($name:ident, $vector:expr) => {
        #[unsafe(naked)]
        extern "C" fn $name() {
            unsafe {
                // CPU error code sits above RIP: copy it out, then leave
                // the CPU frame untouched for iretq.
                naked_asm!(
                    "push rax", "push rcx", "push rdx", "push rbx",
                    "push rbp", "push rsi", "push rdi",
                    "push r8", "push r9", "push r10", "push r11",
                    "push r12", "push r13", "push r14", "push r15",
                    "mov rcx, {vector}",
                    "mov rdx, [rsp + 128]",
                    "mov r8, 0x1DE70001",
                    "call {entry}",
                    "pop r15", "pop r14", "pop r13", "pop r12",
                    "pop r11", "pop r10", "pop r9", "pop r8",
                    "pop rdi", "pop rsi", "pop rbp", "pop rbx",
                    "pop rdx", "pop rcx", "pop rax",
                    "add rsp, 8",
                    "iretq",
                    vector = const $vector,
                    entry = sym handle_event,
                );
            }
        }
    };
}

/// Drain one pending event in main context. Returns true when one fired.
pub fn poll_event() -> Option<(u64, u64)> {
    unsafe {
        let pending = core::ptr::addr_of!(PENDING).read_volatile();
        if !pending.ready {
            return None;
        }
        core::ptr::addr_of_mut!(PENDING).write_volatile(PendingEvent {
            vector: 0,
            error: 0,
            ready: false,
        });
        Some((pending.vector, pending.error))
    }
}

exception_no_code!(exc00, 0);
exception_no_code!(exc01, 1);
exception_no_code!(exc02, 2);
exception_no_code!(exc03, 3);
exception_no_code!(exc04, 4);
exception_no_code!(exc05, 5);
exception_no_code!(exc06, 6);
exception_no_code!(exc07, 7);
exception_no_code!(exc09, 9);
exception_no_code!(exc15, 15);
exception_no_code!(exc16, 16);
exception_no_code!(exc18, 18);
exception_no_code!(exc19, 19);
exception_no_code!(exc20, 20);
exception_no_code!(exc28, 28);
exception_with_code!(exc08, 8);
exception_with_code!(exc10, 10);
exception_with_code!(exc11, 11);
exception_with_code!(exc12, 12);
exception_with_code!(exc13, 13);
exception_with_code!(exc14, 14);
exception_with_code!(exc17, 17);
exception_with_code!(exc21, 21);
exception_with_code!(exc29, 29);
exception_with_code!(exc30, 30);

// Per-vector PIC-range trampolines plus one catch-all, so every hardware
// vector records instead of #GP-faulting the delivery.
exception_no_code!(irq_tramp_20, 0x20);
exception_no_code!(irq_tramp_21, 0x21);
exception_no_code!(irq_tramp_22, 0x22);
exception_no_code!(irq_tramp_23, 0x23);
exception_no_code!(irq_tramp_24, 0x24);
exception_no_code!(irq_tramp_25, 0x25);
exception_no_code!(irq_tramp_26, 0x26);
exception_no_code!(irq_tramp_27, 0x27);
exception_no_code!(irq_tramp_28, 0x28);
exception_no_code!(irq_tramp_29, 0x29);
exception_no_code!(irq_tramp_2a, 0x2A);
exception_no_code!(irq_tramp_2b, 0x2B);
exception_no_code!(irq_tramp_2c, 0x2C);
exception_no_code!(irq_tramp_2d, 0x2D);
exception_no_code!(irq_tramp_2e, 0x2E);
exception_no_code!(irq_tramp_2f, 0x2F);
exception_no_code!(irq_unknown, 0xFF);

fn pic_trampoline(vector: u8) -> Option<usize> {
    Some(match vector {
        0x20 => irq_tramp_20 as usize,
        0x21 => irq_tramp_21 as usize,
        0x22 => irq_tramp_22 as usize,
        0x23 => irq_tramp_23 as usize,
        0x24 => irq_tramp_24 as usize,
        0x25 => irq_tramp_25 as usize,
        0x26 => irq_tramp_26 as usize,
        0x27 => irq_tramp_27 as usize,
        0x28 => irq_tramp_28 as usize,
        0x29 => irq_tramp_29 as usize,
        0x2A => irq_tramp_2a as usize,
        0x2B => irq_tramp_2b as usize,
        0x2C => irq_tramp_2c as usize,
        0x2D => irq_tramp_2d as usize,
        0x2E => irq_tramp_2e as usize,
        0x2F => irq_tramp_2f as usize,
        _ => return None,
    })
}

unsafe fn pic_remap(remap: PicRemap) {
    unsafe {
        outb(0x20, 0x11);
        outb(0xA0, 0x11);
        outb(0x21, remap.base1);
        outb(0xA1, remap.base2);
        outb(0x21, 0x04);
        outb(0xA1, 0x02);
        outb(0x21, 0x01);
        outb(0xA1, 0x01);
        // Mask everything except IRQ0 (timer).
        outb(0x21, 0xFE);
        outb(0xA1, 0xFF);
    }
}

unsafe fn pit_init(divisor: u16) {
    unsafe {
        outb(0x43, 0x36);
        outb(0x40, divisor as u8);
        outb(0x40, (divisor >> 8) as u8);
    }
}

/// Stage 1: install IDT + exception handlers, load IDTR.
/// Disables interrupts first: the firmware timer keeps firing across our
/// lidt, and its vectors are meaningless once our table is live.
pub unsafe fn init_stage1() {
    unsafe {
        asm!("cli", options(nostack));
    }
    set_gate(0, exc00 as usize);
    set_gate(1, exc01 as usize);
    set_gate(2, exc02 as usize);
    set_gate(3, exc03 as usize);
    set_gate(4, exc04 as usize);
    set_gate(5, exc05 as usize);
    set_gate(6, exc06 as usize);
    set_gate(7, exc07 as usize);
    set_gate(8, exc08 as usize);
    set_gate(9, exc09 as usize);
    set_gate(10, exc10 as usize);
    set_gate(11, exc11 as usize);
    set_gate(12, exc12 as usize);
    set_gate(13, exc13 as usize);
    set_gate(14, exc14 as usize);
    set_gate(15, exc15 as usize);
    set_gate(16, exc16 as usize);
    set_gate(17, exc17 as usize);
    set_gate(18, exc18 as usize);
    set_gate(19, exc19 as usize);
    set_gate(20, exc20 as usize);
    set_gate(21, exc21 as usize);
    set_gate(28, exc28 as usize);
    set_gate(29, exc29 as usize);
    set_gate(30, exc30 as usize);
    // Cover every hardware vector NOW (not in stage 2): firmware calls
    // re-enable IF behind our back, and OVMF's own timer (vector 0x20)
    // must record instead of faulting the delivery.
    for vector in 0x20u8..=0xFFu8 {
        let handler = pic_trampoline(vector).unwrap_or(irq_unknown as usize);
        set_gate(vector, handler);
    }
    unsafe {
        load_idt();
    }
}

/// INT3 self-test: fire int3, then drain the recorded event in main
/// context. Returns the observed (vector, error).
pub unsafe fn int3_selftest() -> Option<(u64, u64)> {
    serial_write("INT: firing int3\n");
    // Mask IRQs for the trap: firmware calls re-enable IF, and a timer
    // tick landing between int3 and the poll would overwrite the record.
    unsafe {
        asm!("cli", options(nostack));
        asm!("int3", options(nostack));
    }
    poll_event()
}

/// Stage 2: remap PIC, start the PIT, install IRQ0, enable interrupts.
/// Returns the remap in use.
pub unsafe fn init_stage2(pit_hz: u32) -> PicRemap {
    // NOTE: base 0x28 keeps our timer clear of the firmware's own
    // vector-0x20 timer, which keeps firing through our table.
    let remap = PicRemap { base1: 0x28, base2: 0x30 };
    unsafe {
        pic_remap(remap);
        let raw = 1_193_182u32 / pit_hz.max(1);
        pit_init(raw.min(0xFFFF) as u16);
        // Gates already cover every vector (stage 1); re-assert ours.
        // All gates installed: enable interrupts for timer delivery.
        asm!("sti", options(nostack));
    }
    remap
}
