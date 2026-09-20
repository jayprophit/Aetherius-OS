//! Framebuffer offset math (host-testable pure logic).

#[derive(Debug, Clone, Copy)]
pub struct FramebufferMode {
    pub width: u32,
    pub height: u32,
    pub stride_pixels: u32,
    pub bytes_per_pixel: u32,
}

impl FramebufferMode {
    pub fn pixel_offset(&self, x: u32, y: u32) -> Option<usize> {
        if x >= self.width || y >= self.height {
            return None;
        }
        (y as usize)
            .checked_mul(self.stride_pixels as usize)?
            .checked_add(x as usize)?
            .checked_mul(self.bytes_per_pixel as usize)
    }

    pub fn frame_bytes(&self) -> Option<usize> {
        (self.height as usize)
            .checked_mul(self.stride_pixels as usize)?
            .checked_mul(self.bytes_per_pixel as usize)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn offset_is_row_major_with_stride() {
        let mode = FramebufferMode { width: 800, height: 600, stride_pixels: 1024, bytes_per_pixel: 4 };
        assert_eq!(mode.pixel_offset(0, 0), Some(0));
        assert_eq!(mode.pixel_offset(1, 0), Some(4));
        assert_eq!(mode.pixel_offset(0, 1), Some(1024 * 4));
        assert_eq!(mode.pixel_offset(799, 599), Some((599 * 1024 + 799) * 4));
    }

    #[test]
    fn out_of_bounds_is_none() {
        let mode = FramebufferMode { width: 800, height: 600, stride_pixels: 800, bytes_per_pixel: 4 };
        assert_eq!(mode.pixel_offset(800, 0), None);
        assert_eq!(mode.pixel_offset(0, 600), None);
    }
}
