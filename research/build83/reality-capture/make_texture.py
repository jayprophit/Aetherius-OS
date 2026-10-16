"""Generate a high-contrast speckle texture for SIFT keypoint extraction.

Random blobs at several scales give features across a wide size range, which is
what SIFT needs. Written as PNG and consumed as an image texture in Blender.
"""
import struct
import zlib
from pathlib import Path

import numpy as np

OUT = Path(__file__).resolve().parent / "speckle_texture.png"
N = 1024


def main() -> None:
    rng = np.random.default_rng(83)
    img = np.zeros((N, N), dtype=np.float64)

    # multi-scale random blobs
    for cell, strength in ((8, 0.55), (16, 0.30), (32, 0.15)):
        m = N // cell
        small = rng.random((m, m))
        big = np.kron(small, np.ones((cell, cell)))
        img += strength * big[:N, :N]

    # fine per-pixel speckle
    img += 0.35 * rng.random((N, N))

    img = (img - img.min()) / (img.max() - img.min())
    # add a few dark fiducial squares: strong corners
    for _ in range(28):
        r, c = rng.integers(0, N - 40, 2)
        img[r:r + 40, c:c + 40] = 0.02
    for _ in range(22):
        r, c = rng.integers(0, N - 60, 2)
        img[r:r + 60, c:c + 60] = 0.98

    rgb = np.clip(img * 255, 0, 255).astype(np.uint8)
    arr = np.dstack([rgb, rgb, rgb])

    raw = b"".join(b"\x00" + arr[y].tobytes() for y in range(N))

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    hdr = struct.pack(">IIBBBBB", N, N, 8, 2, 0, 0, 0)
    OUT.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", hdr)
                    + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b""))
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes) std={rgb.std():.1f}")


if __name__ == "__main__":
    main()