//! Host-testable boot logic: memory-map filtering and framebuffer math.
//! No UEFI dependency; the UEFI crate consumes this from main.rs.
//! core-only so the same code compiles for the UEFI target.
#![cfg_attr(not(test), no_std)]
extern crate alloc;

pub mod fb;
pub mod frames;
pub mod gdt;
pub mod identity;
pub mod policy;
pub mod provider;
pub mod int;
pub mod memmap;
pub mod sched;
pub mod mat_query;
pub mod mat_genesis;
pub mod storage;
pub mod settings;
pub mod search;
pub mod notifications;
pub mod appreg;
pub mod plugins;
pub mod media;
pub mod comms;
