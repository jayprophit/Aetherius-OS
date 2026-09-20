//! GDT/TSS/syscall-MSR encoding (host-testable pure logic).
//!
//! Layout (byte offsets): null=0x00, kernel code=0x08, kernel data=0x10,
//! user data=0x18, user code=0x20, TSS=0x28.

pub const SEL_KCODE: u16 = 0x08;
pub const SEL_KDATA: u16 = 0x10;
pub const SEL_UDATA: u16 = 0x18;
pub const SEL_UCODE: u16 = 0x20;
pub const SEL_TSS: u16 = 0x28;

/// Encode a 64-bit code/data segment descriptor (base 0, limit 4 GiB).
/// `code`: executable segment. `dpl`: 0 (kernel) or 3 (user).
pub fn segment_descriptor(code: bool, dpl: u8) -> u64 {
    let access: u64 = 0x80
        | ((dpl as u64 & 0x3) << 5)
        | if code {
            // S=1, non-conforming exec, readable (accessed bit clear).
            0x1A
        } else {
            // S=1, writable data (accessed bit clear).
            0x12
        };
    // 64-bit code: L=1, D/B=0. Data: D/B=1, L=0. G=1, limit 0xFFFFF.
    let flags: u64 = if code { 0xA } else { 0xC };
    (0xFFFF) | (access << 40) | (0xF << 48) | (flags << 52)
}

/// STAR value for SYSCALL/SYSRET with the layout above: syscall CS=0x08,
/// sysret CS=0x20 (base+16), SS=0x18 (base+8) with base 0x10.
pub fn star_value() -> u64 {
    (0x10 << 48) | (SEL_KCODE as u64) << 32
}

/// TSS descriptor pair (16 bytes) for a base address and limit.
pub fn tss_descriptor(base: u64, limit: u32) -> [u64; 2] {
    let low = (limit as u64 & 0xFFFF)
        | ((base & 0xFFFF) << 16)
        | (((base >> 16) & 0xFF) << 32)
        | (0x89 << 40) // P=1, DPL=0, type=9 (available 64-bit TSS)
        | (((limit >> 16) as u64 & 0xF) << 48)
        | (((base >> 24) & 0xFF) << 56);
    let high = base >> 32;
    [low, high]
}

/// TSS byte offset of RSP0 (ring-0 stack for CPL3 traps).
pub const TSS_RSP0_OFFSET: usize = 4;
/// Minimum architectural TSS size we provide.
pub const TSS_SIZE: usize = 104;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kernel_code_descriptor() {
        assert_eq!(segment_descriptor(true, 0), 0x00AF9A000000FFFF);
    }

    #[test]
    fn kernel_data_descriptor() {
        assert_eq!(segment_descriptor(false, 0), 0x00CF92000000FFFF);
    }

    #[test]
    fn user_code_descriptor() {
        // DPL 3, 64-bit code.
        assert_eq!(segment_descriptor(true, 3), 0x00AFFA000000FFFF);
    }

    #[test]
    fn user_data_descriptor() {
        assert_eq!(segment_descriptor(false, 3), 0x00CFF2000000FFFF);
    }

    #[test]
    fn star_routes_syscall_and_sysret() {
        let star = star_value();
        assert_eq!(((star >> 32) & 0xFFFF) as u16, SEL_KCODE);
        let base = ((star >> 48) & 0xFFFF) as u16;
        assert_eq!(base + 16, SEL_UCODE);
        assert_eq!(base + 8, SEL_UDATA);
    }

    #[test]
    fn tss_descriptor_round_trips_base() {
        let [low, high] = tss_descriptor(0x1DE2_5040, 103);
        assert_eq!(low & 0xFFFF, 103);
        let base = (low >> 16 & 0xFFFF) | ((low >> 32 & 0xFF) << 16) | ((low >> 56) << 24) | (high << 32);
        assert_eq!(base, 0x1DE2_5040);
        assert_eq!((low >> 40) & 0xFF, 0x89);
    }
}
