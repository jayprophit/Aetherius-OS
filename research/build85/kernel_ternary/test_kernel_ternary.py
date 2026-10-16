"""BUILD85 - ternary kernel correctness + regression tests."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kernel_binary"))
import numpy as np

from kernel_ternary import pack_ternary, ter_dot, ter_linear

rng = np.random.default_rng(85)
FAILS = []


def check(name, cond, detail=""):
    print(("PASS " if cond else "FAIL ") + name + (f" [{detail}]" if detail and not cond else ""))
    if not cond:
        FAILS.append(name)


def ref_dot(w, a):
    return int((np.asarray(w, np.int64) * np.asarray(a, np.int64)).sum())


for K in (1, 7, 63, 64, 65, 100, 127, 128, 512, 1000):
    for trial in range(4):
        w = rng.choice([-1, 0, 1], size=K).astype(np.int8)
        a = rng.choice([-1, 0, 1], size=K).astype(np.int8)
        wp, wn, _, pad = pack_ternary(w)
        ap, an, _, _ = pack_ternary(a)
        check(f"dot K={K} t{trial}", ter_dot(wp, wn, ap, an, K, pad) == ref_dot(w, a), "")

# zero handling: all-zero vector annihilates
for K in (64, 65, 500):
    w = rng.choice([-1, 0, 1], size=K).astype(np.int8)
    z = np.zeros(K, np.int8)
    wp, wn, _, pad = pack_ternary(w)
    zp, zn, _, _ = pack_ternary(z)
    check(f"zero-annihilates K={K}", ter_dot(wp, wn, zp, zn, K, pad) == 0, "")
    check(f"zero-self K={K}", ter_dot(zp, zn, zp, zn, K, pad) == 0, "")

# sign handling: negation flips the sign exactly
for K in (64, 100, 511):
    w = rng.choice([-1, 0, 1], size=K).astype(np.int8)
    a = rng.choice([-1, 0, 1], size=K).astype(np.int8)
    wp, wn, _, pad = pack_ternary(w)
    ap, an, _, _ = pack_ternary(a)
    nwp, nwn, _, _ = pack_ternary(-w)
    check(f"neg K={K}",
          ter_dot(nwp, nwn, ap, an, K, pad) == -ter_dot(wp, wn, ap, an, K, pad), "")

# matrix path
for R, K in ((1, 64), (4, 100), (8, 512)):
    W = rng.choice([-1, 0, 1], size=(R, K)).astype(np.int8)
    a = rng.choice([-1, 0, 1], size=K).astype(np.int8)
    Wp, Wn, _, pad = pack_ternary(W)
    ap, an, _, _ = pack_ternary(a)
    got = ter_linear(Wp, Wn, ap, an, K, pad)
    want = np.array([ref_dot(W[r], a) for r in range(R)])
    check(f"linear R={R} K={K}", bool((got == want).all()), "")

# serialization round-trip
W = rng.choice([-1, 0, 1], size=(3, 300)).astype(np.int8)
Wp, Wn, K, pad = pack_ternary(W)
Wp2 = np.frombuffer(Wp.tobytes(), dtype=np.uint64).reshape(Wp.shape)
Wn2 = np.frombuffer(Wn.tobytes(), dtype=np.uint64).reshape(Wn.shape)
a = rng.choice([-1, 0, 1], size=300).astype(np.int8)
ap, an, _, _ = pack_ternary(a)
check("roundtrip", bool((ter_linear(Wp2, Wn2, ap, an, K, pad) ==
                         np.array([ref_dot(W[r], a) for r in range(3)])).all()), "")

# overlap guard: pos&neg overlap must raise, never silently compute
bad_p = np.ones(1, dtype=np.uint64)
try:
    ter_dot(bad_p, bad_p, bad_p, bad_p, 1, 63)
    check("overlap-guard", False, "overlap accepted")
except ValueError:
    check("overlap-guard", True)

print(f"\n{len(FAILS)} failures" if FAILS else "\nALL TERNARY TESTS PASSED")
raise SystemExit(1 if FAILS else 0)
