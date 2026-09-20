//! AETHERIUS boot milestone (P11-BOOT): UEFI entry, serial + console
//! evidence, GOP mode report, firmware memory-map summary, controlled halt.
#![no_main]
#![no_std]

extern crate alloc;

use alloc::vec::Vec;
use core::fmt::Write as _;
use uefi::mem::memory_map::MemoryMap;
use uefi::prelude::*;
use uefi::proto::console::gop::{GraphicsOutput, PixelFormat};
use uefi::proto::console::serial::Serial;
use uefi::boot::{MemoryType, ScopedProtocol, SearchType};

use aether_boot_logic::fb::FramebufferMode;
use aether_boot_logic::memmap::{self, Descriptor, MemoryKind};

mod idt;

struct SerialOut {
    serial: ScopedProtocol<Serial>,
}

impl SerialOut {
    fn open() -> Option<Self> {
        let handles = uefi::boot::locate_handle_buffer(SearchType::from_proto::<Serial>()).ok()?;
        for handle in handles.iter() {
            if let Ok(serial) =
                uefi::boot::open_protocol_exclusive::<Serial>(*handle)
            {
                return Some(Self { serial });
            }
        }
        None
    }

    fn write_all(&mut self, text: &str) {
        let _ = self.serial.write(text.as_bytes());
    }
}

fn uefi_memory_kind(ty: MemoryType) -> MemoryKind {
    match ty {
        MemoryType::CONVENTIONAL => MemoryKind::Conventional,
        MemoryType::RESERVED => MemoryKind::Reserved,
        MemoryType::ACPI_RECLAIM => MemoryKind::Reclaimable,
        MemoryType::BOOT_SERVICES_CODE
        | MemoryType::BOOT_SERVICES_DATA
        | MemoryType::LOADER_CODE
        | MemoryType::LOADER_DATA => MemoryKind::BootServices,
        _ => MemoryKind::Runtime,
    }
}

#[entry]
fn main() -> Status {
    uefi::helpers::init().unwrap();

    let mut serial = SerialOut::open();
    let mut emit = |text: &str| {
        uefi::println!("{text}");
        if let Some(port) = serial.as_mut() {
            port.write_all(text);
            port.write_all("\r\n");
        }
    };

    emit("AETHERIUS-BOOT v0.1.0 x86_64-uefi");

    // Framebuffer: report the active GOP mode; fill the top band as proof
    // of write access using our own offset math.
    let mut fb_line = alloc::string::String::from("GOP: unavailable");
    if let Ok(handles) =
        uefi::boot::locate_handle_buffer(SearchType::from_proto::<GraphicsOutput>())
    {
        for handle in handles.iter() {
            if let Ok(mut gop) =
                uefi::boot::open_protocol_exclusive::<GraphicsOutput>(*handle)
            {
                let info = gop.current_mode_info();
                let (width, height) = info.resolution();
                let mode = FramebufferMode {
                    width: width as u32,
                    height: height as u32,
                    stride_pixels: info.stride() as u32,
                    bytes_per_pixel: 4,
                };
                let format = match info.pixel_format() {
                    PixelFormat::Rgb => "rgb",
                    PixelFormat::Bgr => "bgr",
                    _ => "other",
                };
                let mut line = alloc::string::String::new();
                let _ = core::write!(
                    &mut line,
                    "GOP: {width}x{height} stride={} fmt={format}",
                    info.stride()
                );
                fb_line = line;
                if info.pixel_format() == PixelFormat::Bgr
                    || info.pixel_format() == PixelFormat::Rgb
                {
                    let mut frame = gop.frame_buffer();
                    let base = frame.as_mut_ptr();
                    let rows = height.min(8);
                    for y in 0..rows {
                        for x in 0..width.min(320) {
                            if let Some(offset) = mode.pixel_offset(x as u32, y as u32) {
                                unsafe {
                                    let pixel = base.add(offset) as *mut u32;
                                    // Dark blue with a cyan top-left block.
                                    let color: u32 = if x < 64 && y < 8 {
                                        0x00C8C8C8
                                    } else {
                                        0x00081838
                                    };
                                    pixel.write_volatile(color);
                                }
                            }
                        }
                    }
                }
                break;
            }
        }
    }
    emit(&fb_line);

    // Firmware memory map: full enumeration, usable-RAM summary.
    // (The argument selects the backing-buffer type, not a filter.)
    match uefi::boot::memory_map(MemoryType::LOADER_DATA) {
        Ok(map) => {
            let mut descriptors = Vec::new();
            for entry in map.entries() {
                descriptors.push(Descriptor {
                    kind: uefi_memory_kind(entry.ty),
                    phys_start: entry.phys_start,
                    page_count: entry.page_count,
                });
            }
            // Count non-conventional regions too for an honest total.
            let total = descriptors.len();
            let summary = memmap::summarize(&descriptors);
            let mut line = alloc::string::String::new();
            let _ = core::write!(
                &mut line,
                "MEMMAP: regions={total} conventional_pages={} conventional_bytes={} usable_regions={}",
                summary.usable_pages,
                summary.usable_bytes,
                summary.usable_regions
            );
            emit(&line);

            // Frame allocator proof: adopt conventional regions, take 16
            // frames of bookkeeping ownership, report the counters.
            let mut frames = aether_boot_logic::frames::FrameAllocator::empty();
            if frames.adopt(&descriptors) {
                let mut taken = 0u32;
                while taken < 16 {
                    if frames.alloc().is_err() {
                        break;
                    }
                    taken += 1;
                }
                let mut alloc_line = alloc::string::String::new();
                let _ = core::write!(
                    &mut alloc_line,
                    "ALLOC: total_frames={} free_frames={} probation_taken={taken}",
                    frames.total_frames(),
                    frames.free_frames()
                );
                emit(&alloc_line);
            } else {
                emit("ALLOC: no usable frames adopted");
            }
        }
        Err(error) => {
            let mut line = alloc::string::String::new();
            let _ = core::write!(&mut line, "MEMMAP: unavailable ({error:?})");
            emit(&line);
        }
    }

    // Interrupts + timer: IDT, PIC remap, 100 Hz PIT, INT3 self-test,
    // then count 200 ticks (~2 s) as the timekeeping proof.
    emit("INIT: idt enter");
    unsafe {
        crate::idt::init_stage1();
    }
    emit("INIT: idt loaded, int3 next");
    emit("MAIN: calling selftest");
    let breakpoint = unsafe { crate::idt::int3_selftest() };
    emit("MAIN: selftest returned");
    match breakpoint {
        Some((3, _)) => emit("INT: breakpoint OK"),
        other => {
            let mut line = alloc::string::String::new();
            let _ = core::write!(&mut line, "INT: breakpoint FAILED: {other:?}");
            emit(&line);
        }
    }
    emit("INIT: int3 done, enabling timer");
    unsafe {
        crate::idt::init_stage2(100);
    }
    emit("INIT: timer live");
    // Timekeeping via firmware timer events (correct owner in the
    // boot-services epoch): 200 wakes at 100 Hz ~= 2000 ms.
    unsafe extern "efiapi" fn timer_notify(
        _event: uefi::Event,
        _context: Option<core::ptr::NonNull<core::ffi::c_void>>,
    ) {
    }
    let ticks: u64 = 'timer: {
        use uefi::boot::{EventType, TimerTrigger, Tpl};
        emit("TIMER: creating event");
        let mut event = match unsafe {
            uefi::boot::create_event(
                EventType::NOTIFY_WAIT | EventType::TIMER,
                Tpl::CALLBACK,
                Some(timer_notify),
                None,
            )
        } {
            Ok(event) => event,
            Err(error) => {
                let mut line = alloc::string::String::new();
                let _ = core::write!(&mut line, "TIMER: create failed ({error:?})");
                emit(&line);
                break 'timer 0;
            }
        };
        emit("TIMER: arming");
        if let Err(error) = uefi::boot::set_timer(&event, TimerTrigger::Periodic(100_000)) {
            let mut line = alloc::string::String::new();
            let _ = core::write!(&mut line, "TIMER: arm failed ({error:?})");
            emit(&line);
            let _ = uefi::boot::close_event(event);
            break 'timer 0;
        }
        emit("TIMER: waiting");
        // Firmware timer ticks require IF; the IDT is fully installed.
        unsafe {
            core::arch::asm!("sti", options(nostack));
        }
        // Primary: our own IRQ0 ticks (bounded spins so a dead timer
        // reports STALLED instead of hanging the harness). Any foreign
        // vector is reported as it arrives.
        let start_ticks = crate::idt::ticks();
        let mut spins: u64 = 0;
        let mut last_report = 0u64;
        let mut foreign: u64 = 0;
        let mut foreign_vector: u64 = 0;
        while crate::idt::ticks() - start_ticks < 200 {
            unsafe {
                core::arch::asm!("hlt", options(nomem, nostack, preserves_flags));
            }
            spins += 1;
            while let Some((vector, _)) = unsafe { crate::idt::poll_event() } {
                if vector != 0x28 {
                    foreign += 1;
                    foreign_vector = vector;
                }
            }
            if foreign >= 200 {
                break;
            }
            if spins - last_report >= 2_000_000 {
                last_report = spins;
                let mut line = alloc::string::String::new();
                let _ = core::write!(
                    &mut line,
                    "TICKS: waiting ticks={} spins={spins} foreign={foreign} last_foreign={foreign_vector}",
                    crate::idt::ticks() - start_ticks
                );
                emit(&line);
            }
            if spins > 20_000_000 {
                break;
            }
        }
        let _ = uefi::boot::close_event(event);
        let elapsed = crate::idt::ticks() - start_ticks;
        let mut line = alloc::string::String::new();
        let _ = core::write!(
            &mut line,
            "TIMER: irq_ticks={elapsed} firmware_ticks={foreign} spins={spins}"
        );
        emit(&line);
        elapsed.max(foreign)
    };
    {
        let ms = aether_boot_logic::int::ticks_to_ms(ticks, 100);
        let mut line = alloc::string::String::new();
        let _ = core::write!(&mut line, "TICKS: {ticks} ~= {ms}ms @100Hz");
        emit(&line);
    }
    emit("AETHERIUS-HALT: controlled halt");
    // Controlled halt: stall forever; the emulator harness cuts power after
    // the marker line appears on serial.
    loop {
        uefi::boot::stall(1_000_000);
    }
}
