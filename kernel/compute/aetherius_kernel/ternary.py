"""Balanced-ternary kernel over dual bit-masks.

Each ternary row is two ``uint64`` streams:

* ``pos``: bit = 1 where the value is ``+1``
* ``neg``: bit = 1 where the value is ``-1``
* ``0`` where neither bit is set

The dot product is four masked popcounts. No floating point is used inside the
loop. This is a simulated ternary execution path: no commercial ternary CPU is
assumed or claimed.
"""

from __future__ import annotations

import numpy as np

from .binary import _POP16, _u64, WORD, pack_bits


def pack_ternary(tv: np.ndarray) -> tuple[np.ndarray, np.ndarray, int, int]:
    """Pack ``{-1,0,+1}`` (last axis K) into ``(pos, neg, K, pad)``."""
    t = np.ascontiguousarray(np.asarray(tv, dtype=np.int8))
    if t.ndim == 0:
        raise ValueError("ternary values must have at least one dimension")
    if t.size and not np.isin(t, (-1, 0, 1)).all():
        raise ValueError("ternary domain is {-1,0,+1}")
    pos, K, pad = pack_bits((t == 1).astype(np.uint8))
    neg, _, _ = pack_bits((t == -1).astype(np.uint8))
    return pos, neg, K, pad


def _masked_pop(x: np.ndarray, y: np.ndarray, pad: int) -> int:
    m = np.bitwise_and(
        _u64(np.asarray(x).reshape(-1)), _u64(np.asarray(y).reshape(-1))
    )
    if m.shape[0] == 0:
        raise ValueError("empty word stream")
    if pad:
        if pad >= WORD:
            raise ValueError("pad must be < 64")
        m = m.copy()
        m[-1] = m[-1] & (np.uint64(0xFFFFFFFFFFFFFFFF) << np.uint64(pad))
    return int(_POP16[m.view(np.uint16)].sum(dtype=np.int64))


def ter_dot(
    wp: np.ndarray,
    wn: np.ndarray,
    ap: np.ndarray,
    an: np.ndarray,
    K: int,
    pad: int,
) -> int:
    """Integer ternary dot product with an explicit overlap guard."""
    wp = _u64(np.asarray(wp).reshape(-1))
    wn = _u64(np.asarray(wn).reshape(-1))
    ap = _u64(np.asarray(ap).reshape(-1))
    an = _u64(np.asarray(an).reshape(-1))
    if not (wp.shape == wn.shape == ap.shape == an.shape):
        raise ValueError("word-count mismatch")
    if bool((wp & wn).any()):
        raise ValueError("pos & neg overlap in weights")
    if bool((ap & an).any()):
        raise ValueError("pos & neg overlap in activations")
    pp = _masked_pop(wp, ap, pad)
    nn = _masked_pop(wn, an, pad)
    pn = _masked_pop(wp, an, pad)
    np_ = _masked_pop(wn, ap, pad)
    return pp + nn - pn - np_


def ter_linear(
    Wp: np.ndarray,
    Wn: np.ndarray,
    ap: np.ndarray,
    an: np.ndarray,
    K: int,
    pad: int,
) -> np.ndarray:
    """Rows(W) ternary matrix times one ternary vector -> int64 results."""
    Wp = _u64(np.asarray(Wp))
    Wn = _u64(np.asarray(Wn))
    if Wp.ndim != 2 or Wn.shape != Wp.shape:
        raise ValueError("Wp and Wn must be matching 2-D arrays")
    ap = _u64(np.asarray(ap).reshape(-1))
    an = _u64(np.asarray(an).reshape(-1))
    if ap.shape[0] != Wp.shape[1] or an.shape != ap.shape:
        raise ValueError("word-count mismatch")
    out = np.empty(Wp.shape[0], dtype=np.int64)
    for r in range(Wp.shape[0]):
        out[r] = ter_dot(Wp[r], Wn[r], ap, an, K, pad)
    return out


def to_ter_ref(tv: np.ndarray) -> np.ndarray:
    """Explicit integer reference mapping (tests only)."""
    return np.ascontiguousarray(np.asarray(tv, dtype=np.int64))
