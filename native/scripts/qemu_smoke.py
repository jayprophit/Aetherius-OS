"""QEMU UEFI smoke test for aether-boot (P11-BOOT).

Boots esp.img with OVMF, captures COM1 serial to a file, and asserts the
boot markers. Usage: qemu_smoke.py <esp.img> <serial.log> [--qemu PATH]
Requires: qemu-system-x86_64 + edk2 OVMF code firmware.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

MARKERS = ["AETHERIUS-BOOT v0.1.0", "MEMMAP: regions=", "AETHERIUS-HALT"]

QEMU_CANDIDATES = [
    os.environ.get("QEMU_SYSTEM_X86_64", ""),
    r"C:\Program Files\qemu\qemu-system-x86_64.exe",
    shutil.which("qemu-system-x86_64") or "",
]

OVMF_CANDIDATES = [
    os.environ.get("OVMF_CODE", ""),
    r"C:\Program Files\qemu\share\edk2-x86_64-code.fd",
]


def pick(candidates: list[str], what: str) -> str:
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return candidate
    raise SystemExit(f"missing {what}; checked: {[c for c in candidates if c]}")


def main(argv: list[str]) -> int:
    if len(argv) < 3:
        print("usage: qemu_smoke.py <esp.img> <serial.log> [--qemu PATH]")
        return 2
    esp, serial_log = argv[1], argv[2]
    qemu = argv[argv.index("--qemu") + 1] if "--qemu" in argv else pick(QEMU_CANDIDATES, "qemu")
    ovmf = pick(OVMF_CANDIDATES, "OVMF code firmware")
    Path(serial_log).unlink(missing_ok=True)
    cmd = [
        qemu,
        "-nodefaults",
        "-display", "none",
        "-vga", "std",
        "-machine", "q35,accel=tcg",
        "-cpu", "qemu64",
        "-m", "512",
        "-drive", f"if=pflash,format=raw,readonly=on,file={ovmf}",
        "-drive", f"file={esp},format=raw,if=ide",
        "-serial", f"file:{serial_log}",
        "-no-reboot",
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.time() + 90
    text = ""
    try:
        while time.time() < deadline:
            if Path(serial_log).exists():
                text = Path(serial_log).read_text(errors="replace")
                if all(marker in text for marker in MARKERS):
                    break
            if proc.poll() is not None:
                break
            time.sleep(0.5)
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()
    missing = [marker for marker in MARKERS if marker not in text]
    print("---- serial ----")
    print(text[-3000:])
    print("----------------")
    if missing:
        print(f"SMOKE FAIL: missing markers {missing}")
        return 1
    print("SMOKE PASS: all boot markers on serial")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
