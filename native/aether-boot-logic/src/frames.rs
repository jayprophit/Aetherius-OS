//! Physical frame bookkeeping over firmware memory regions.
//!
//! Pre-ExitBootServices allocator: tracks conventional frames reported by
//! the firmware map. Allocation here is ownership bookkeeping for the boot
//! phase; the live heap remains the UEFI pool (global_allocator) until the
//! ExitBootServices milestone introduces the kernel heap.

use super::memmap::{Descriptor, MemoryKind, PAGE_BYTES};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Frame(pub u64);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AllocError {
    Exhausted,
    NotAllocated,
    OutOfRange,
}

#[derive(Debug, Clone, Copy)]
struct Region {
    start_frame: u64,
    frame_count: u64,
    next_free: u64,
}

#[derive(Debug)]
pub struct FrameAllocator {
    regions: [Region; 32],
    region_count: usize,
    total_frames: u64,
    free_frames: u64,
    allocated: [u64; 256],
    allocated_count: usize,
}

impl FrameAllocator {
    pub fn empty() -> Self {
        Self {
            regions: [Region { start_frame: 0, frame_count: 0, next_free: 0 }; 32],
            region_count: 0,
            total_frames: 0,
            free_frames: 0,
            allocated: [0; 256],
            allocated_count: 0,
        }
    }

    /// Adopt conventional regions. Regions are frame-aligned down/up so only
    /// whole frames are ever handed out. Returns false when nothing usable.
    pub fn adopt(&mut self, descriptors: &[Descriptor]) -> bool {
        for descriptor in descriptors {
            if descriptor.kind != MemoryKind::Conventional || descriptor.page_count == 0 {
                continue;
            }
            // Align start up to a frame boundary; UEFI already reports
            // page-aligned regions, so this is normally a no-op guard.
            let start = descriptor.phys_start.div_ceil(PAGE_BYTES);
            let end = descriptor
                .phys_start
                .saturating_add(descriptor.page_count.saturating_mul(PAGE_BYTES))
                / PAGE_BYTES;
            if end <= start || self.region_count >= self.regions.len() {
                continue;
            }
            let count = end - start;
            self.regions[self.region_count] = Region {
                start_frame: start,
                frame_count: count,
                next_free: start,
            };
            self.region_count += 1;
            self.total_frames += count;
            self.free_frames += count;
        }
        self.total_frames > 0
    }

    pub fn alloc(&mut self) -> Result<Frame, AllocError> {
        for index in 0..self.region_count {
            let (start, count, cursor) = {
                let region = &self.regions[index];
                (region.start_frame, region.frame_count, region.next_free)
            };
            // Scan forward for a free frame; freed frames below the cursor
            // are found by the linear rescan.
            let mut candidate = cursor;
            loop {
                if candidate >= start + count {
                    break;
                }
                if !self.is_tracked(candidate) {
                    // Bounded tracking table: refuse rather than risk a
                    // double allocation once it is full.
                    if self.allocated_count >= self.allocated.len() {
                        return Err(AllocError::Exhausted);
                    }
                    self.regions[index].next_free = candidate + 1;
                    self.allocated[self.allocated_count] = candidate;
                    self.allocated_count += 1;
                    self.free_frames -= 1;
                    return Ok(Frame(candidate * PAGE_BYTES));
                }
                candidate += 1;
                if candidate - start > count + 1 {
                    break;
                }
            }
        }
        Err(AllocError::Exhausted)
    }

    pub fn free(&mut self, frame: Frame) -> Result<(), AllocError> {
        if frame.0 % PAGE_BYTES != 0 {
            return Err(AllocError::OutOfRange);
        }
        let number = frame.0 / PAGE_BYTES;
        let owned = self.regions[..self.region_count]
            .iter()
            .any(|region| number >= region.start_frame && number < region.start_frame + region.frame_count);
        if !owned {
            return Err(AllocError::OutOfRange);
        }
        if let Some(position) = self.allocated[..self.allocated_count]
            .iter()
            .position(|tracked| *tracked == number)
        {
            self.allocated.copy_within(position + 1.., position);
            self.allocated_count -= 1;
            self.free_frames += 1;
            // Rewind cursors so freed frames are reused promptly.
            for region in self.regions[..self.region_count].iter_mut() {
                if number >= region.start_frame && number < region.next_free {
                    region.next_free = number;
                }
            }
            return Ok(());
        }
        Err(AllocError::NotAllocated)
    }

    pub fn total_frames(&self) -> u64 {
        self.total_frames
    }

    pub fn free_frames(&self) -> u64 {
        self.free_frames
    }

    fn is_tracked(&self, number: u64) -> bool {
        self.allocated[..self.allocated_count].contains(&number)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn descriptors() -> [Descriptor; 3] {
        [
            Descriptor { kind: MemoryKind::Conventional, phys_start: 0x100000, page_count: 4 },
            Descriptor { kind: MemoryKind::Reserved, phys_start: 0x200000, page_count: 99 },
            Descriptor { kind: MemoryKind::Conventional, phys_start: 0x300000, page_count: 2 },
        ]
    }

    #[test]
    fn adopts_only_conventional() {
        let mut allocator = FrameAllocator::empty();
        assert!(allocator.adopt(&descriptors()));
        assert_eq!(allocator.total_frames(), 6);
        assert_eq!(allocator.free_frames(), 6);
    }

    #[test]
    fn rejects_empty_maps() {
        let mut allocator = FrameAllocator::empty();
        assert!(!allocator.adopt(&[]));
    }

    #[test]
    fn alloc_exhausts_then_frees() {
        let mut allocator = FrameAllocator::empty();
        assert!(allocator.adopt(&descriptors()));
        let mut frames = Vec::new();
        for _ in 0..6 {
            frames.push(allocator.alloc().expect("frame"));
        }
        assert_eq!(allocator.alloc(), Err(AllocError::Exhausted));
        assert_eq!(allocator.free_frames(), 0);
        for frame in &frames {
            assert!(allocator.free(*frame).is_ok());
        }
        assert_eq!(allocator.free_frames(), 6);
        // Reuse after free.
        assert!(allocator.alloc().is_ok());
    }

    #[test]
    fn rejects_double_free_and_out_of_range() {
        let mut allocator = FrameAllocator::empty();
        assert!(allocator.adopt(&descriptors()));
        let frame = allocator.alloc().expect("frame");
        assert!(allocator.free(frame).is_ok());
        assert_eq!(allocator.free(frame), Err(AllocError::NotAllocated));
        assert_eq!(allocator.free(Frame(0xDEAD000)), Err(AllocError::OutOfRange));
        assert_eq!(allocator.free(Frame(1)), Err(AllocError::OutOfRange));
    }

    #[test]
    fn frames_are_page_aligned() {
        let mut allocator = FrameAllocator::empty();
        assert!(allocator.adopt(&descriptors()));
        let frame = allocator.alloc().expect("frame");
        assert_eq!(frame.0 % PAGE_BYTES, 0);
        assert_eq!(frame.0, 0x100000);
    }
}
