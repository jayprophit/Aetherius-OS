"""BUILD85 - binary kernel correctness + regression tests.

Every test compares the packed-word kernel against the explicit +/-1 reference
dot product. Exact integer agreement is required before any scaling.
"""
import numpy as np

from kernel_binary import bin_dot, bin_linear, pack_bits, to_pm1

rng = np.random.default_rng(85)
FAILS = []


def check(name, cond, detail=""):
    print(("PASS " if cond else "FAIL ") + name + (f" [{detail}]" if detail and not cond else ""))
    if not cond:
        FAILS.append(name)


def ref_dot(wb, ab):
    return int((to_pm1(wb) * to_pm1(ab)).sum())


shapes = [(1,), (7,), (63,), (64,), (65,), (100,), (127,), (128,), (512,), (1000,), (1536,)]
for i, (K,) in enumerate(shapes):
    wb = rng.integers(0, 2, size=K).astype(np.uint8)
    ab = rng.integers(0, 2, size=K).astype(np.uint8)
    for trial in range(5 if K < 200 else 2):
        if trial:
            wb = rng.integers(0, 2, size=K).astype(np.uint8)
            ab = rng.integers(0, 2, size=K).astype(np.uint8)
        ww, K1, pad = pack_bits(wb)
        aw, K2, pad2 = pack_bits(ab)
        got = bin_dot(ww, aw, K1, pad)
        want = ref_dot(wb, ab)
        check(f"dot K={K} t{trial}", got == want, f"got={got} want={want}")
        check(f"pad K={K}", pad == pad2 == (64 - K % 64) % 64, f"pad={pad}")

# all-ones / all-zeros extremes
for K in (1, 64, 65, 1000):
    for v in (0, 1):
        wb = np.full(K, v, np.uint8)
        ab = np.full(K, v, np.uint8)
        ww, _, pad = pack_bits(wb)
        aw, _, _ = pack_bits(ab)
        check(f"extreme K={K} v={v}", bin_dot(ww, aw, K, pad) == K, "")
    wb = np.full(K, 1, np.uint8)
    ab = np.full(K, 0, np.uint8)
    ww, _, pad = pack_bits(wb)
    aw, _, _ = pack_bits(ab)
    check(f"anti K={K}", bin_dot(ww, aw, K, pad) == -K, "")

# matrix path
for R, K in ((1, 64), (3, 100), (8, 512), (16, 1536)):
    Wb = rng.integers(0, 2, size=(R, K)).astype(np.uint8)
    ab = rng.integers(0, 2, size=K).astype(np.uint8)
    Ww, _, pad = pack_bits(Wb)
    aw, _, _ = pack_bits(ab)
    got = bin_linear(Ww, aw, K, pad)
    want = np.array([ref_dot(Wb[r], ab) for r in range(R)])
    check(f"linear R={R} K={K}", bool((got == want).all()),
          f"max|err|={(np.abs(got - want)).max()}")

# serialization round-trip: packed words -> bytes -> words is lossless
Wb = rng.integers(0, 2, size=(4, 300)).astype(np.uint8)
Ww, K, pad = pack_bits(Wb)
blob = Ww.tobytes()
Ww2 = np.frombuffer(blob, dtype=np.uint64).reshape(Ww.shape)
ab = rng.integers(0, 2, size=300).astype(np.uint8)
aw, _, _ = pack_bits(ab)
check("roundtrip", bool((bin_linear(Ww2, aw, K, pad) ==
                         np.array([ref_dot(Wb[r], ab) for r in range(4)])).all()), "")

# dtype guard: kernel refuses float input (no silent FP materialisation path)
try:
    bin_dot(np.ones(1), np.ones(1), 1, 0)
    check("dtype-guard", False, "float accepted")
except TypeError:
    check("dtype-guard", True)

print(f"\n{len(FAILS)} failures" if FAILS else "\nALL CORRECTNESS TESTS PASSED")
raise SystemExit(1 if FAILS else 0)
