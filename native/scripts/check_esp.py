"""Inspect the FAT16 ESP image: list dirs, extract BOOTX64.EFI, compare."""
import struct
import sys
from pathlib import Path

SECTOR = 512


def read_dir(img: bytes, offset: int, count: int) -> list:
    entries = []
    for i in range(count):
        entry = img[offset + i * 32:offset + (i + 1) * 32]
        if entry[0] in (0x00, 0xE5):
            if entry[0] == 0x00:
                break
            continue
        name = entry[0:8].decode("ascii").rstrip()
        ext = entry[8:11].decode("ascii").rstrip()
        attr = entry[11]
        cluster = struct.unpack_from("<H", entry, 26)[0]
        size = struct.unpack_from("<I", entry, 28)[0]
        full = f"{name}.{ext}" if ext else name
        entries.append((full, attr, cluster, size))
    return entries


def cluster_chain(img: bytes, fat_base: int, start: int) -> list[int]:
    clusters, seen = [], start
    while seen < 0xFFF8:
        clusters.append(seen)
        if len(clusters) > 100000:
            raise RuntimeError("chain too long")
        seen = struct.unpack_from("<H", img, fat_base + seen * 2)[0]
    return clusters


def read_file(img: bytes, data_start: int, clusters: list[int], size: int) -> bytes:
    out = bytearray()
    for cluster in clusters:
        out += img[(data_start + (cluster - 2) * 64) * SECTOR:][:64 * SECTOR]
    return bytes(out[:size])


def main() -> int:
    img = Path(sys.argv[1]).read_bytes()
    reserved = struct.unpack_from("<H", img, 0x0E)[0]
    fats = img[0x10]
    root_entries = struct.unpack_from("<H", img, 0x11)[0]
    fat_sectors = struct.unpack_from("<H", img, 0x16)[0]
    root_offset = (reserved + fats * fat_sectors) * SECTOR
    fat_base = reserved * SECTOR
    data_start = reserved + fats * fat_sectors + (root_entries * 32) // SECTOR
    print(f"reserved={reserved} fats={fats} root_entries={root_entries} "
          f"fat_sectors={fat_sectors} data_start_sector={data_start}")

    def walk(offset: int, count: int | None, prefix: str) -> None:
        if count is None:  # subdir via cluster: read whole cluster
            raw = img[offset:offset + 64 * SECTOR]
            count = len(raw) // 32
        for name, attr, cluster, size in read_dir(img, offset, count):
            is_dir = bool(attr & 0x10)
            print(f"{prefix}{name} attr={attr:#04x} cluster={cluster} size={size}")
            if is_dir and name not in (".", ".."):
                sub = (data_start + (cluster - 2) * 64) * SECTOR
                walk(sub, None, prefix + name + "/")

    walk(root_offset, root_entries, "/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
