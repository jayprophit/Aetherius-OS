//! Host-testable boot logic: memory-map filtering and framebuffer math.
//! No UEFI dependency; the UEFI crate consumes this from main.rs.
//! core-only so the same code compiles for the UEFI target.
#![cfg_attr(not(test), no_std)]
pub mod fb;
pub mod memmap;
