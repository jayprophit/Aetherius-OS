"""Packed-word binary kernel.

The inner loop is integer-only over ``uint64`` words. Bits map to values as
``1 -> +1`` and ``0 -> -1``, so a dot product of K valid elements is:

    dot = 2 * popcount(XNOR(w, a)) - K

This is a host-native integer path, not a custom instruction-set architecture.
No floating-point array is allocated inside the kernel path.
"""

from __future__ import annotations

import numpy as np

WORD = 64
_POP16 = np.array([bin(i).count("1") for i in range(1 << 16)], dtype=np.uint8)


def _u64(x: np.ndarray) -> np.ndarray:
    if x.dtype != np.uint64:
        raise TypeError(f"kernel path requires uint64, got {x.dtype}")
    return np.ascontiguousarray(x)


def pack_bits(bits: np.ndarray) -> tuple[np.ndarray, int, int]:
    """Pack a ``{0,1}`` array (last axis = K) into uint64 words, MSB-first.

    Returns ``(words, K, pad)``. Padding bits are zero and are masked out of
    every dot product.
    """
    b = np.asarray(bits)
    if b.ndim == 0:
        raise ValueError("bits must have at least one dimension")
    b = np.ascontiguousarray(b.astype(np.uint8))
    if b.size and not np.isin(b, (0, 1)).all():
        raise ValueError("binary domain is {0,1}")
    K = int(b.shape[-1])
    if K == 0:
        raise ValueError("K must be >= 1")
    nwords = (K + WORD - 1) // WORD
    pad = nwords * WORD - K
    if pad:
        extra = np.zeros(b.shape[:-1] + (pad,), np.uint8)
        b = np.concatenate([b, extra], axis=-1)
    flat = b.reshape(-1, nwords, WORD)
    weights = (1 << np.arange(WORD - 1, -1, -1, dtype=np.uint64))
    words = np.einsum("...wj,j->...w", flat.astype(np.uint64), weights)
    words = np.ascontiguousarray(words.reshape(b.shape[:-1] + (nwords,)))
    return words, K, pad


def _popcount_words(xnor: np.ndarray) -> int:
    xnor = _u64(xnor)
    as16 = xnor.view(np.uint16)
    return int(_POP16[as16].sum(dtype=np.int64))


def bin_dot(w_words: np.ndarray, a_words: np.ndarray, K: int, pad: int) -> int:
    """Integer dot product of two packed ±1 vectors of K valid elements."""
    w = _u64(np.asarray(w_words).reshape(-1))
    a = _u64(np.asarray(a_words).reshape(-1))
    if w.shape != a.shape:
        raise ValueError("word-count mismatch")
    xnor = np.bitwise_not(np.bitwise_xor(w, a))
    if pad:
        if pad >= WORD:
            raise ValueError("pad must be < 64")
        mask = np.uint64(0xFFFFFFFFFFFFFFFF) << np.uint64(pad)
        xnor = xnor.copy()
        xnor[-1] = xnor[-1] & mask
    return 2 * _popcount_words(xnor) - K


def bin_linear(W_words: np.ndarray, a_words: np.ndarray, K: int, pad: int) -> np.ndarray:
    """Rows(W) binary matrix times one binary vector -> int64 row results."""
    W = _u64(np.asarray(W_words))
    if W.ndim != 2:
        raise ValueError("W_words must be 2-D (rows, words)")
    a = _u64(np.asarray(a_words).reshape(-1))
    if a.shape[0] != W.shape[1]:
        raise ValueError("word-count mismatch")
    xnor = np.bitwise_not(np.bitwise_xor(W, a[None, :]))
    if pad:
        if pad >= WORD:
            raise ValueError("pad must be < 64")
        mask = np.uint64(0xFFFFFFFFFFFFFFFF) << np.uint64(pad)
        xnor = xnor.copy()
        xnor[:, -1] = xnor[:, -1] & mask
    counts = _POP16[xnor.view(np.uint16).reshape(xnor.shape[0], -1)].sum(
        axis=1, dtype=np.int64
    )
    return 2 * counts - K


def bin_linear_loop(W_words: np.ndarray, a_words: np.ndarray, K: int, pad: int) -> np.ndarray:
    """Per-row cross-check path for the vectorised linear kernel."""
    W = _u64(np.asarray(W_words))
    out = np.empty(W.shape[0], dtype=np.int64)
    for r in range(W.shape[0]):
        out[r] = bin_dot(W[r], a_words, K, pad)
    return out


def to_pm1(bits: np.ndarray) -> np.ndarray:
    """Explicit ±1 reference mapping (tests only, never the kernel path)."""
    return np.where(np.asarray(bits, dtype=np.uint8) == 1, 1, -1).astype(np.int64)
