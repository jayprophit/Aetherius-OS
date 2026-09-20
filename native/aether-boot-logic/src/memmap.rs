//! Firmware memory-map filtering (host-testable pure logic).
//!
//! A descriptor is usable RAM when the firmware marks it conventional AND
//! our policy accepts it. Everything else is reported, never touched.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MemoryKind {
    Conventional,
    Reserved,
    Reclaimable,
    BootServices,
    Runtime,
    Unknown(u32),
}

#[derive(Debug, Clone, Copy)]
pub struct Descriptor {
    pub kind: MemoryKind,
    pub phys_start: u64,
    pub page_count: u64,
}

pub const PAGE_BYTES: u64 = 4096;

#[derive(Debug, Default)]
pub struct MapSummary {
    pub usable_pages: u64,
    pub usable_bytes: u64,
    pub usable_regions: usize,
    pub total_regions: usize,
}

pub fn summarize(descriptors: &[Descriptor]) -> MapSummary {
    let mut summary = MapSummary {
        total_regions: descriptors.len(),
        ..Default::default()
    };
    for descriptor in descriptors {
        if descriptor.kind == MemoryKind::Conventional && descriptor.page_count > 0 {
            summary.usable_pages += descriptor.page_count;
            summary.usable_regions += 1;
        }
    }
    summary.usable_bytes = summary.usable_pages * PAGE_BYTES;
    summary
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_only_conventional_pages() {
        let descriptors = [
            Descriptor { kind: MemoryKind::Conventional, phys_start: 0x1000, page_count: 10 },
            Descriptor { kind: MemoryKind::Reserved, phys_start: 0xB000, page_count: 99 },
            Descriptor { kind: MemoryKind::Conventional, phys_start: 0x0, page_count: 0 },
            Descriptor { kind: MemoryKind::BootServices, phys_start: 0x2000, page_count: 5 },
        ];
        let summary = summarize(&descriptors);
        assert_eq!(summary.usable_pages, 10);
        assert_eq!(summary.usable_bytes, 10 * PAGE_BYTES);
        assert_eq!(summary.usable_regions, 1);
        assert_eq!(summary.total_regions, 4);
    }

    #[test]
    fn empty_map_summarizes_to_zero() {
        let summary = summarize(&[]);
        assert_eq!(summary.usable_pages, 0);
        assert_eq!(summary.usable_regions, 0);
    }
}
