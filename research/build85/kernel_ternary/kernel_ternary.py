"""BUILD85 - native ternary kernel ({-1,0,+1}) via dual bit-masks.

Representation (no FP in the loop): each row is TWO uint64 word streams -
  pos : bit=1 where value is +1
  neg : bit=1 where value is -1
  zero where neither bit is set (pos & neg must be 0 everywhere).

Dot product of ternary weight row w and ternary activation a:
  dot = pop(pos_w & pos_a) + pop(neg_w & neg_a)
      - pop(pos_w & neg_a) - pop(neg_w & pos_a)
All operations are integer on packed words. Padding bits are 0 in both masks
of the final word, hence contribute nothing. An optional scalar scale is
applied by the caller AFTER accumulation (documented as outside-loop).
"""
from __future__ import annotations

import numpy as np

from kernel_binary import _POP16, _u64, pack_bits

WORD = 64


def pack_ternary(tv: np.ndarray) -> tuple[np.ndarray, np.ndarray, int, int]:
    """Pack a {-1,0,+1} array (last axis K) into (pos_words, neg_words, K, pad)."""
    t = np.ascontiguousarray(np.asarray(tv, dtype=np.int8))
    if not np.isin(t, (-1, 0, 1)).all():
        raise ValueError("ternary domain is {-1,0,+1}")
    pos, K, pad = pack_bits((t == 1).astype(np.uint8))
    neg, _, _ = pack_bits((t == -1).astype(np.uint8))
    return pos, neg, K, pad


def _masked_pop(x: np.ndarray, y: np.ndarray, pad: int) -> int:
    m = np.bitwise_and(_u64(np.asarray(x).reshape(-1)),
                       _u64(np.asarray(y).reshape(-1)))
    if pad:
        m = m.copy()
        m[-1] = m[-1] & (np.uint64(0xFFFFFFFFFFFFFFFF) << np.uint64(pad))
    return int(_POP16[m.view(np.uint16)].sum(dtype=np.int64))


def ter_dot(wp, wn, ap, an, K: int, pad: int) -> int:
    """Integer ternary dot product."""
    if bool((np.asarray(wp, np.uint64) & np.asarray(wn, np.uint64)).any()):
        raise ValueError("pos & neg overlap in weights")
    pp = _masked_pop(wp, ap, pad)
    nn = _masked_pop(wn, an, pad)
    pn = _masked_pop(wp, an, pad)
    npp = _masked_pop(wn, ap, pad)
    return pp + nn - pn - npp


def ter_linear(Wp, Wn, ap, an, K: int, pad: int) -> np.ndarray:
    """rows(W) ternary matrix times ternary vector -> int64 results."""
    Wp = _u64(np.asarray(Wp))
    out = np.empty(Wp.shape[0], dtype=np.int64)
    # vectorised over rows via the same masked-pop primitive on stacked pairs
    for r in range(Wp.shape[0]):
        out[r] = ter_dot(Wp[r], np.asarray(Wn)[r], ap, an, K, pad)
    return out


def to_ter_ref(tv: np.ndarray) -> np.ndarray:
    return np.ascontiguousarray(np.asarray(tv, dtype=np.int64))
