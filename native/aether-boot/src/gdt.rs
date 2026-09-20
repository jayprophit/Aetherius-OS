//! GDT + TSS + SYSCALL/SYSRET bring-up (P11-USER).
//!
//! Installs our own GDT (kernel/user code+data, TSS with a kernel RSP0),
//! enables SYSCALL/SYSRET, and proves a CPL3 round-trip: user stub invokes
//! syscall #1, the kernel records it, returns, and the stub parks.

use core::arch::asm;

use aether_boot_logic::gdt::{
    SEL_KCODE, SEL_KDATA, SEL_TSS, SEL_UCODE, SEL_UDATA, TSS_RSP0_OFFSET, TSS_SIZE,
    segment_descriptor, star_value, tss_descriptor,
};

#[repr(C, packed)]
struct DescriptorTablePointer {
    limit: u16,
    base: u64,
}

#[repr(align(8))]
struct TssArea([u8; 128]);

static mut GDT: [u64; 7] = [0; 7];
static mut TSS: TssArea = TssArea([0; 128]);
static mut KERNEL_RSP0_STACK: [u8; 4096] = [0; 4096];
static mut USER_STACK: [u8; 4096] = [0; 4096];
static mut SYSCALL_COUNT: u64 = 0;
static mut SYSCALL_LAST_NR: u64 = 0;

pub fn syscall_count() -> u64 {
    unsafe { core::ptr::addr_of!(SYSCALL_COUNT).read_volatile() }
}

pub fn syscall_last_nr() -> u64 {
    unsafe { core::ptr::addr_of!(SYSCALL_LAST_NR).read_volatile() }
}

unsafe fn wrmsr(msr: u32, value: u64) {
    let low = value as u32;
    let high = (value >> 32) as u32;
    unsafe {
        asm!(
            "wrmsr",
            in("ecx") msr,
            in("eax") low,
            in("edx") high,
            options(nostack, preserves_flags),
        );
    }
}

unsafe fn rdmsr(msr: u32) -> u64 {
    let low: u32;
    let high: u32;
    unsafe {
        asm!(
            "rdmsr",
            in("ecx") msr,
            out("eax") low,
            out("edx") high,
            options(nomem, nostack, preserves_flags),
        );
    }
    ((high as u64) << 32) | low as u64
}

/// Install GDT + TSS, enable SYSCALL/SYSRET. Returns false when the CPU
/// lacks syscall support (checked via CPUID, no fault possible).
pub unsafe fn init() -> bool {
    // CPUID.80000001H:EDX[11] = SYSCALL/SYSRET support in 64-bit mode.
    let edx: u32;
    unsafe {
        asm!(
            "mov eax, 0x80000001",
            "cpuid",
            "mov {0:e}, edx",
            out(reg) edx,
            out("eax") _,
            out("ebx") _,
            out("ecx") _,
            options(nomem, nostack, preserves_flags),
        );
    }
    if edx & (1 << 11) == 0 {
        return false;
    }
    unsafe {
        GDT[0] = 0;
        GDT[1] = segment_descriptor(true, 0);
        GDT[2] = segment_descriptor(false, 0);
        GDT[3] = segment_descriptor(false, 3);
        GDT[4] = segment_descriptor(true, 3);
        let tss_base = core::ptr::addr_of!(TSS) as u64;
        let [tss_low, tss_high] = tss_descriptor(tss_base, (TSS_SIZE - 1) as u32);
        GDT[5] = tss_low;
        GDT[6] = tss_high;
        // Ring-0 stack for CPL3 traps (IDT handlers use the current stack
        // at CPL0; RSP0 matters once userspace faults or syscalls nest).
        let rsp0 = core::ptr::addr_of!(KERNEL_RSP0_STACK) as u64 + 4096;
        core::ptr::write_unaligned(
            (tss_base + TSS_RSP0_OFFSET as u64) as *mut u64,
            rsp0,
        );
        let pointer = DescriptorTablePointer {
            limit: (core::mem::size_of::<[u64; 7]>() - 1) as u16,
            base: core::ptr::addr_of!(GDT) as u64,
        };
        asm!("lgdt [{}]", in(reg) &pointer, options(nostack));
        // Reload segments onto our descriptors.
        asm!(
            "push {kcode}",
            "lea rax, [rip + 2f]",
            "push rax",
            "retfq",
            "2:",
            "mov ds, {kdata:e}",
            "mov es, {kdata:e}",
            "mov ss, {kdata:e}",
            kcode = const SEL_KCODE as u64,
            kdata = in(reg) SEL_KDATA as u64,
            options(nostack),
        );
        asm!("ltr {0:x}", in(reg) SEL_TSS, options(nostack, preserves_flags));
        // Enable SYSCALL/SYSRET (EFER.SCE) and program the entry/exit legs.
        const EFER: u32 = 0xC000_0080;
        const SCE: u64 = 1;
        wrmsr(EFER, rdmsr(EFER) | SCE);
        const STAR: u32 = 0xC000_0081;
        const LSTAR: u32 = 0xC000_0082;
        const SFMASK: u32 = 0xC000_0084;
        wrmsr(STAR, star_value());
        wrmsr(LSTAR, syscall_entry as usize as u64);
        // Mask IF/TF/DF/AC/NT on entry (0x25700); user RFLAGS restored after.
        wrmsr(SFMASK, 0x25700);
    }
    true
}

/// SYSCALL entry (CPL0, IF/TF cleared by SFMASK). Records RAX, returns via
/// SYSRET. Uses only caller-saved state plus a scratch swap; async-safe.
#[unsafe(naked)]
unsafe extern "C" fn syscall_entry() {
    unsafe {
        core::arch::naked_asm!(
            // Save caller state we touch (RCX holds user RIP, R11 RFLAGS).
            "push rcx",
            "push r11",
            "push rax",
            "push rdi",
            "push rsi",
            "push rdx",
            "push r8",
            "push r9",
            "push r10",
            // Record the call number.
            "mov rdi, rax",
            "call {record}",
            // Restore and return to CPL3.
            "pop r10",
            "pop r9",
            "pop r8",
            "pop rsi",
            "pop rdi",
            "pop rax",
            "pop r11",
            "pop rcx",
            "sysretq",
            record = sym record_syscall,
        );
    }
}

extern "C" fn record_syscall(number: u64) {
    unsafe {
        SYSCALL_COUNT += 1;
        SYSCALL_LAST_NR = number;
    }
}

/// User stub: one syscall, then park with PAUSE (hlt faults at CPL3).
#[unsafe(naked)]
unsafe extern "C" fn user_stub() {
    unsafe {
        core::arch::naked_asm!(
            "mov eax, 1",
            "syscall",
            "2:",
            "pause",
            "jmp 2b",
        );
    }
}

/// Enter CPL3 at the user stub with the given stack top. Returns only via
/// faults (none expected); the stub parks itself after its syscall.
pub unsafe fn enter_user() {
    let user_stack =
        unsafe { core::ptr::addr_of!(USER_STACK) as u64 + 4096 };
    unsafe {
        core::arch::asm!(
            "push {ss}",
            "push {rsp}",
            "pushfq",
            "or qword ptr [rsp], 0x200",
            "push {cs}",
            "push {rip}",
            "iretq",
            ss = in(reg) SEL_UDATA as u64 | 3,
            rsp = in(reg) user_stack,
            cs = in(reg) SEL_UCODE as u64 | 3,
            rip = in(reg) user_stub as usize as u64,
            options(nostack),
        );
    }
}
