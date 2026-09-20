//! Interrupt/timekeeping math (host-testable pure logic).
//!
//! Gate descriptor encoding follows the x86-64 IDT entry layout; PIC/PIT
//! constants follow the 8259/8253 programming sequences.

pub const IDT_ENTRY_COUNT: usize = 256;
pub const GATE_INTERRUPT: u8 = 0xE;
pub const GATE_TRAP: u8 = 0xF;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(C)]
pub struct GateDesc {
    pub offset_low: u16,
    pub selector: u16,
    pub ist: u8,
    pub type_attr: u8,
    pub offset_mid: u16,
    pub offset_high: u32,
    pub reserved: u32,
}

impl GateDesc {
    pub fn new(offset: u64, selector: u16, gate_type: u8, dpl: u8, present: bool) -> Self {
        let present_bit = if present { 0x80 } else { 0x00 };
        Self {
            offset_low: offset as u16,
            selector,
            ist: 0,
            type_attr: present_bit | ((dpl & 0x3) << 5) | (gate_type & 0xF),
            offset_mid: (offset >> 16) as u16,
            offset_high: (offset >> 32) as u32,
            reserved: 0,
        }
    }

    pub fn offset(&self) -> u64 {
        self.offset_low as u64
            | ((self.offset_mid as u64) << 16)
            | ((self.offset_high as u64) << 32)
    }

    pub fn is_present(&self) -> bool {
        self.type_attr & 0x80 != 0
    }
}

// 8259 PIC remap: master at `base1`, slave at `base2` (classic 0x20/0x28).
#[derive(Debug, Clone, Copy)]
pub struct PicRemap {
    pub base1: u8,
    pub base2: u8,
}

impl PicRemap {
    pub fn irq_vector(&self, irq: u8) -> Option<u8> {
        if irq < 8 {
            self.base1.checked_add(irq)
        } else if irq < 16 {
            self.base2.checked_add(irq - 8)
        } else {
            None
        }
    }
}

// 8253 PIT channel 0, mode 3 (square wave): divisor for `hz`.
pub fn pit_divisor(hz: u32) -> Option<u16> {
    if hz == 0 {
        return None;
    }
    const PIT_BASE_HZ: u32 = 1_193_182;
    let divisor = PIT_BASE_HZ / hz;
    if divisor == 0 || divisor > 0xFFFF {
        return None;
    }
    Some(divisor as u16)
}

pub fn pit_bytes(divisor: u16) -> (u8, u8) {
    (divisor as u8, (divisor >> 8) as u8)
}

pub fn ticks_to_ms(ticks: u64, hz: u64) -> u64 {
    if hz == 0 {
        return 0;
    }
    ticks.saturating_mul(1000) / hz
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gate_is_16_bytes() {
        assert_eq!(core::mem::size_of::<GateDesc>(), 16);
    }

    #[test]
    fn gate_byte_layout_matches_x86() {
        let gate = GateDesc::new(0x1122_3344_5566_7788, 0x08, GATE_INTERRUPT, 0, true);
        // SAFETY: GateDesc is repr(C) plain data.
        let bytes: [u8; 16] = unsafe { core::mem::transmute(gate) };
        assert_eq!(&bytes[0..2], &[0x88, 0x77]);
        assert_eq!(&bytes[2..4], &[0x08, 0x00]);
        assert_eq!(bytes[4], 0x00);
        assert_eq!(bytes[5], 0x8E);
        assert_eq!(&bytes[6..8], &[0x66, 0x55]);
        assert_eq!(&bytes[8..12], &[0x44, 0x33, 0x22, 0x11]);
        assert_eq!(&bytes[12..16], &[0x00, 0x00, 0x00, 0x00]);
    }

    #[test]
    fn gate_round_trips_offset() {
        let gate = GateDesc::new(0xFFFF_8000_0010_1234, 0x08, GATE_INTERRUPT, 0, true);
        assert_eq!(gate.offset(), 0xFFFF_8000_0010_1234);
        assert!(gate.is_present());
        assert_eq!(gate.type_attr & 0xF, 0xE);
    }

    #[test]
    fn absent_gate_is_not_present() {
        let gate = GateDesc::new(0, 0x08, GATE_TRAP, 3, false);
        assert!(!gate.is_present());
    }

    #[test]
    fn pic_remap_vectors() {
        let remap = PicRemap { base1: 0x20, base2: 0x28 };
        assert_eq!(remap.irq_vector(0), Some(0x20));
        assert_eq!(remap.irq_vector(7), Some(0x27));
        assert_eq!(remap.irq_vector(8), Some(0x28));
        assert_eq!(remap.irq_vector(15), Some(0x2F));
        assert_eq!(remap.irq_vector(16), None);
    }

    #[test]
    fn pit_100hz_divisor() {
        let divisor = pit_divisor(100).expect("divisor");
        assert_eq!(divisor, 11931);
        assert_eq!(pit_bytes(divisor), (0x9B, 0x2E));
        assert_eq!(pit_divisor(0), None);
    }

    #[test]
    fn tick_conversion() {
        assert_eq!(ticks_to_ms(200, 100), 2000);
        assert_eq!(ticks_to_ms(1, 0), 0);
    }
}
