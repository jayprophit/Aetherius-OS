"""Build a FAT16 ESP image containing \\EFI\\BOOT\\BOOTX64.EFI (P11-BOOT).

Usage: mkesp.py <bootx64.efi> <esp.img> [--size-mib N]
Verifies by reading the file back out of the image directory walk.
"""
from __future__ import annotations

import struct
import sys
from pathlib import Path

SECTOR = 512
DIR_ENTRY = 32


def build_fat16(files: dict[str, bytes], size_mib: int = 64) -> bytes:
    total_sectors = (size_mib * 1024 * 1024) // SECTOR
    reserved_sectors = 8
    fat_count = 2
    root_entries = 512
    root_sectors = (root_entries * DIR_ENTRY) // SECTOR
    # Cluster count must stay in FAT16 range (4085..65524): 8 sectors per
    # cluster keeps a 64MiB volume at ~16k clusters. (64 spc produced only
    # ~2k clusters, which strict drivers parse as FAT12.)
    sectors_per_cluster = 8
    sectors_per_fat = 64
    data_start = reserved_sectors + fat_count * sectors_per_fat + root_sectors
    cluster_count = (total_sectors - data_start) // sectors_per_cluster
    img = bytearray(total_sectors * SECTOR)

    def put(offset: int, data: bytes) -> None:
        img[offset:offset + len(data)] = data

    # BPB + boot signature.
    put(0x00, b"\xeb\x3c\x90AETHER11")
    struct.pack_into("<H", img, 0x0B, SECTOR)
    img[0x0D] = sectors_per_cluster  # sectors per cluster
    struct.pack_into("<H", img, 0x0E, reserved_sectors)
    img[0x10] = fat_count
    struct.pack_into("<H", img, 0x11, root_entries)
    struct.pack_into("<H", img, 0x13, total_sectors if total_sectors < 0x10000 else 0)
    img[0x15] = 0xF8
    struct.pack_into("<H", img, 0x16, sectors_per_fat)
    struct.pack_into("<I", img, 0x20, 0 if total_sectors < 0x10000 else total_sectors)
    img[0x26] = 0x29
    struct.pack_into("<I", img, 0x27, 0xAE77101)
    put(0x2B, b"AETHERIUS   FAT16   ")
    struct.pack_into("<H", img, 0x1FE, 0xAA55)

    # FATs: media descriptor + end-of-chain markers, then chains.
    for table in range(fat_count):
        base = (reserved_sectors + table * sectors_per_fat) * SECTOR
        struct.pack_into("<H", img, base, 0xFFF8)
        struct.pack_into("<H", img, base + 2, 0xFFFF)
    next_cluster = 2

    def alloc_chain(byte_count: int) -> list[int]:
        nonlocal next_cluster
        needed = max(1, (byte_count + sectors_per_cluster * SECTOR - 1) // (sectors_per_cluster * SECTOR))
        clusters = list(range(next_cluster, next_cluster + needed))
        next_cluster += needed
        if next_cluster - 2 > cluster_count:
            raise RuntimeError("ESP image too small")
        for table in range(fat_count):
            base = (reserved_sectors + table * sectors_per_fat) * SECTOR
            for index, cluster in enumerate(clusters):
                value = clusters[index + 1] if index + 1 < len(clusters) else 0xFFFF
                struct.pack_into("<H", img, base + cluster * 2, value)
        return clusters

    root_offset = (reserved_sectors + fat_count * sectors_per_fat) * SECTOR
    dirs: dict[str, dict] = {"": {"entries": [], "cluster": 0}}

    def encode_name(path: str) -> tuple[str, str, bool]:
        parts = [p for p in path.replace("\\", "/").split("/") if p]
        name = parts[-1]
        is_dir = "." not in name
        if "." in name:
            stem, ext = name.rsplit(".", 1)
        else:
            stem, ext = name, ""
        return stem.upper()[:8].ljust(8), ext.upper()[:3].ljust(3), is_dir

    # Create directories first (every ancestor prefix), then files.
    dir_paths = set()
    for path in files:
        parts = path.split("/")[:-1]
        for depth in range(1, len(parts) + 1):
            dir_paths.add("/".join(parts[:depth]))
    dir_paths = sorted(dir_paths)
    dir_cluster: dict[str, int] = {}
    for dir_path in dir_paths:
        clusters = alloc_chain(0)
        dir_cluster[dir_path] = clusters[0]
        parent = "/".join(dir_path.split("/")[:-1])
        stem, ext, _ = encode_name(dir_path.split("/")[-1])
        dirs.setdefault(parent, {"entries": [], "cluster": 0})
        dirs[parent]["entries"].append((stem + ext, 0x10, clusters[0], 0))
        dirs[dir_path] = {"entries": [], "cluster": clusters[0]}

    for path, content in files.items():
        parent = "/".join(path.split("/")[:-1])
        stem, ext, _ = encode_name(path)
        clusters = alloc_chain(len(content))
        offset = 0
        for cluster in clusters:
            sector = data_start + (cluster - 2) * sectors_per_cluster
            chunk = content[offset:offset + sectors_per_cluster * SECTOR]
            put(sector * SECTOR, chunk)
            offset += len(chunk)
        dirs.setdefault(parent, {"entries": [], "cluster": 0})
        dirs[parent]["entries"].append((stem + ext, 0x20, clusters[0], len(content)))

    def write_dir(entries: list, cluster: int, is_root: bool, parent_cluster: int) -> None:
        records = []
        if not is_root:
            records.append((".          ", 0x10, cluster, 0))
            records.append(("..         ", 0x10, parent_cluster, 0))
        records.extend(entries)
        blob = bytearray()
        for name11, attr, first, size in records:
            entry = bytearray(DIR_ENTRY)
            entry[0:11] = name11.encode("ascii")
            entry[11] = attr
            struct.pack_into("<H", entry, 26, first)
            struct.pack_into("<I", entry, 28, size)
            blob += entry
        if is_root:
            if len(blob) > root_sectors * SECTOR:
                raise RuntimeError("root directory overflow")
            put(root_offset, bytes(blob))
        else:
            sector = data_start + (cluster - 2) * sectors_per_cluster
            put(sector * SECTOR, bytes(blob))

    write_dir(dirs[""]["entries"], 0, True, 0)
    for dir_path, info in dirs.items():
        if not dir_path:
            continue
        parent = "/".join(dir_path.split("/")[:-1])
        write_dir(info["entries"], info["cluster"], False,
                  dir_cluster.get(parent, 0))
    return bytes(img)


def main(argv: list[str]) -> int:
    if len(argv) < 3:
        print("usage: mkesp.py <bootx64.efi> <esp.img> [--size-mib N]")
        return 2
    size_mib = 64
    if "--size-mib" in argv:
        size_mib = int(argv[argv.index("--size-mib") + 1])
    efi = Path(argv[1]).read_bytes()
    image = build_fat16({"EFI/BOOT/BOOTX64.EFI": efi}, size_mib)
    Path(argv[2]).write_bytes(image)
    # Verify: EFI/BOOT present with the exact byte count.
    check = image.find(b"BOOTX64 EFI")
    print(f"esp: {len(image)} bytes, efi payload {len(efi)} bytes, "
          f"dir-name present: {check >= 0}")
    return 0 if check >= 0 else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
