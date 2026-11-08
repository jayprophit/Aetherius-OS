//! Aetherius OS desktop/mobile shell.
//!
//! The web application remains the single UI implementation. This Rust host
//! only supplies the native window and the platform webview; it deliberately
//! adds no privileged commands. Native privileged operations require the
//! separately gated companion service (see docs/CROSS-PLATFORM-DELIVERY-2026-11-08.md).

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Aetherius OS");
}
