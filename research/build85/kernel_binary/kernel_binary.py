"""BUILD85 - native binary kernel (packed words + XNOR + popcount).

Mathematical definition (fixed before coding):
  weights and activations are mapped to bits b in {0,1} with value v = 2*b - 1
  (i.e. bit 1 -> +1, bit 0 -> -1). For vectors of K valid elements:
      dot = sum_i v_i * u_i = 2 * popcount(XNOR(w, a)) - K
  XNOR(w,a) = NOT (w XOR a), with padding bits masked to 0 before counting.

The inner loop operates ONLY on uint64 words. No float array is allocated for
weights or activations inside the kernel path; an optional scalar scale is
applied by the caller to the final integer result (documented as outside-loop).
"""
from __future__ import annotations

import numpy as np

WORD = 64
_POP16 = np.array([bin(i).count("1") for i in range(65536)], dtype=np.uint8)


def _u64(x: np.ndarray) -> np.ndarray:
    if x.dtype != np.uint64:
        raise TypeError(f"kernel path requires uint64, got {x.dtype}")
    return np.ascontiguousarray(x)


def pack_bits(bits: np.ndarray) -> tuple[np.ndarray, int, int]:
    """Pack a {0,1} array (last axis = K) into uint64 words, MSB-first.

    Returns (words, K, pad) where pad = number of zero padding bits in the
    final word. Padding bits are always 0.
    """
    b = np.ascontiguousarray(bits.astype(np.uint8))
    K = b.shape[-1]
    nwords = (K + WORD - 1) // WORD
    pad = nwords * WORD - K
    if pad:
        extra = np.zeros(b.shape[:-1] + (pad,), np.uint8)
        b = np.concatenate([b, extra], axis=-1)
    flat = b.reshape(-1, nwords, WORD)
    # MSB-first: bit j of word = flat[..., j]
    weights = (1 << np.arange(WORD - 1, -1, -1, dtype=np.uint64))
    words = np.einsum("...wj,j->...w", flat.astype(np.uint64), weights)
    words = np.ascontiguousarray(words.reshape(b.shape[:-1] + (nwords,)))
    return words, K, pad


def _popcount_words(xnor: np.ndarray) -> int:
    """Sum popcount over uint64 words via the uint16 lookup table."""
    xnor = _u64(xnor)
    as16 = xnor.view(np.uint16)
    return int(_POP16[as16].sum(dtype=np.int64))


def bin_dot(w_words: np.ndarray, a_words: np.ndarray, K: int, pad: int) -> int:
    """Integer dot product of two packed ±1 vectors of K valid elements."""
    w = _u64(np.asarray(w_words).reshape(-1))
    a = _u64(np.asarray(a_words).reshape(-1))
    assert w.shape == a.shape, "word-count mismatch"
    xnor = np.bitwise_not(np.bitwise_xor(w, a))
    if pad:
        # padding bits must not contribute: they are 0 in both words, so XNOR
        # sets them to 1; mask the low `pad` bits of the final word to 0.
        mask = np.uint64(0xFFFFFFFFFFFFFFFF) << np.uint64(pad)
        xnor = xnor.copy()
        xnor[-1] = xnor[-1] & mask
    return 2 * _popcount_words(xnor) - K


def bin_linear(W_words: np.ndarray, a_words: np.ndarray, K: int, pad: int) -> np.ndarray:
    """rows(W) x K binary matrix times K binary vector -> int64 row results."""
    return bin_linear_vec(W_words, a_words, K, pad)


def bin_linear_vec(W_words: np.ndarray, a_words: np.ndarray, K: int, pad: int) -> np.ndarray:
    """Vectorised across rows: one XOR over (R, W), one LUT pass, one row-sum.

    Still integer-only on packed words; no Python per-row loop, no FP arrays.
    """
    W = _u64(np.asarray(W_words))
    a = _u64(np.asarray(a_words).reshape(-1))
    xnor = np.bitwise_not(np.bitwise_xor(W, a[None, :]))
    if pad:
        mask = np.uint64(0xFFFFFFFFFFFFFFFF) << np.uint64(pad)
        xnor = xnor.copy()
        xnor[:, -1] = xnor[:, -1] & mask
    counts = _POP16[xnor.view(np.uint16).reshape(xnor.shape[0], -1)].sum(
        axis=1, dtype=np.int64)
    return 2 * counts - K


def bin_linear_loop(W_words: np.ndarray, a_words: np.ndarray, K: int, pad: int) -> np.ndarray:
    """Original per-row loop, kept for cross-checking the vectorised path."""
    W = _u64(np.asarray(W_words))
    out = np.empty(W.shape[0], dtype=np.int64)
    for r in range(W.shape[0]):
        out[r] = bin_dot(W[r], a_words, K, pad)
    return out


def to_pm1(bits: np.ndarray) -> np.ndarray:
    """Explicit ±1 reference mapping (used by tests, not by the kernel)."""
    return np.where(np.asarray(bits, dtype=np.uint8) == 1, 1, -1).astype(np.int64)
