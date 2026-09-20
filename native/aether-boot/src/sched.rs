//! Cooperative scheduler machine layer (P11-SCHED).
//!
//! Round-robin policy comes from aether_boot_logic::sched; this module owns
//! stacks, FPU areas, and the register switch (GPRs + FXSAVE area). Tasks
//! are integer-only by contract until userspace brings xsave management.

use core::arch::asm;

use aether_boot_logic::sched::Scheduler;

pub const MAX_TASKS: usize = 2;
pub const STACK_SIZE: usize = 4096;
const MAIN_SLOT: usize = 2;
const FXSAVE_SIZE: usize = 512;

#[repr(align(16))]
#[derive(Clone, Copy)]
struct AlignedStack([u8; STACK_SIZE]);

#[repr(align(16))]
#[derive(Clone, Copy)]
struct FxArea([u8; FXSAVE_SIZE]);

static mut STACKS: [AlignedStack; MAX_TASKS] =
    [AlignedStack([0; STACK_SIZE]), AlignedStack([0; STACK_SIZE])];
static mut FXAREAS: [FxArea; MAX_TASKS + 1] = [FxArea([0; FXSAVE_SIZE]); MAX_TASKS + 1];
static mut CONTEXTS: [u64; MAX_TASKS + 1] = [0; MAX_TASKS + 1];
static mut CURRENT: usize = MAIN_SLOT;
static mut SCHEDULER: Option<Scheduler> = None;
static mut SWITCHES: u64 = 0;

extern "C" fn task_exit() -> ! {
    unsafe {
        if let Some(scheduler) = SCHEDULER.as_mut() {
            let current = CURRENT;
            scheduler.finish(current);
            if let Some(next) = scheduler.pick_next() {
                switch_to(next);
            } else {
                switch_to(MAIN_SLOT);
            }
        }
        // Unreachable: we always switch away above.
        core::hint::unreachable_unchecked()
    }
}

/// Raw context switch: saves GPRs + FPU area of the outgoing context,
/// restores the incoming context, returns into it.
#[unsafe(naked)]
unsafe extern "C" fn context_switch(old_rsp: *mut u64, new_rsp: u64, old_fx: *mut u8, new_fx: *const u8) {
    unsafe {
        core::arch::naked_asm!(
                "push rax", "push rcx", "push rdx", "push rbx",
                "push rbp", "push rsi", "push rdi",
                "push r8", "push r9", "push r10", "push r11",
                "push r12", "push r13", "push r14", "push r15",
                // Win64 order: rcx=old_rsp, rdx=new_rsp, r8=old_fx, r9=new_fx.
                // Save FPU state of the outgoing task.
                "mov rax, r8",
                "fxsave64 [rax]",
                // Publish outgoing RSP, adopt incoming RSP.
                "mov [rcx], rsp",
                "mov rsp, rdx",
                // Restore incoming FPU state.
                "mov rax, r9",
                "fxrstor64 [rax]",
            "pop r15", "pop r14", "pop r13", "pop r12",
            "pop r11", "pop r10", "pop r9", "pop r8",
            "pop rdi", "pop rsi", "pop rbp", "pop rbx",
            "pop rdx", "pop rcx", "pop rax",
            "ret",
        );
    }
}

fn switch_to(next: usize) {
    unsafe {
        let previous = CURRENT;
        CURRENT = next;
        SWITCHES += 1;
        context_switch(
            core::ptr::addr_of_mut!(CONTEXTS[previous]),
            CONTEXTS[next],
            core::ptr::addr_of_mut!(FXAREAS[previous].0).cast(),
            core::ptr::addr_of!(FXAREAS[next].0).cast(),
        );
    }
}

/// Yield the current task: mark ready, run the next READY task, or return
/// to main when none remain.
pub fn sched_yield() {
    unsafe {
        let current = CURRENT;
        if let Some(scheduler) = SCHEDULER.as_mut() {
            scheduler.yield_back(current);
            if let Some(next) = scheduler.pick_next() {
                switch_to(next);
                return;
            }
        }
        switch_to(MAIN_SLOT);
    }
}

/// Enable SSE/FXSR save support (kernels own CR4; firmware may leave it clear).
unsafe fn enable_fpu() {
    unsafe {
        let mut cr4: u64;
        core::arch::asm!("mov {}, cr4", out(reg) cr4, options(nomem, nostack, preserves_flags));
        cr4 |= (1 << 9) | (1 << 10);
        core::arch::asm!("mov cr4, {}", in(reg) cr4, options(nostack, preserves_flags));
    }
}

/// Spawn two tasks and run until both finish. Returns (switches, all_done).
pub fn run_demo(task_a: extern "C" fn(), task_b: extern "C" fn()) -> (u64, bool) {
    unsafe {
        enable_fpu();
        SCHEDULER = Some(Scheduler::new());
        let scheduler = SCHEDULER.as_mut().unwrap();
        let a = scheduler.spawn().expect("task a");
        let b = scheduler.spawn().expect("task b");
        debug_assert_eq!((a, b), (0, 1));
        for (index, entry) in [(0usize, task_a), (1usize, task_b)] {
            let top = STACKS[index].0.as_mut_ptr() as u64 + STACK_SIZE as u64;
            // 15 dummy regs + entry address; rsp ≡ 8 (mod 16) so the entry
            // observes standard function-entry alignment after ret.
            let rsp = top - 136;
            core::ptr::write_bytes(rsp as *mut u8, 0, 15 * 8 + 8);
            core::ptr::write((rsp + 15 * 8) as *mut u64, entry as usize as u64);
            CONTEXTS[index] = rsp;
        }
        SWITCHES = 0;
        // Enter the first task; control returns here when none are READY.
        if let Some(first) = SCHEDULER.as_mut().unwrap().pick_next() {
            switch_to(first);
        }
        let switches = SWITCHES;
        let done = SCHEDULER.as_ref().unwrap().remaining() == 0;
        (switches, done)
    }
}

pub fn switches() -> u64 {
    unsafe { SWITCHES }
}

/// End the calling task. Never returns.
pub fn task_done() -> ! {
    task_exit()
}
