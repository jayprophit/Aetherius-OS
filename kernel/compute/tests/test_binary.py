import numpy as np
import pytest

from aetherius_kernel import BinaryKernel, bin_linear, pack_bits, to_pm1


def ref_dot(w, a):
    return int((to_pm1(w) * to_pm1(a)).sum())


def test_known_dot():
    # [1,0,1] -> [+1,-1,+1]; [1,1,0] -> [+1,+1,-1]; dot = -1
    assert BinaryKernel().dot([1, 0, 1], [1, 1, 0]) == -1


@pytest.mark.parametrize("K", [1, 7, 63, 64, 65, 127, 512, 1000])
def test_random_dot_matches_reference(K):
    rng = np.random.default_rng(85)
    w = rng.integers(0, 2, size=K).astype(np.uint8)
    a = rng.integers(0, 2, size=K).astype(np.uint8)
    ww, K1, pad = pack_bits(w)
    aw, K2, _ = pack_bits(a)
    assert K1 == K2 == K
    assert pad == (64 - K % 64) % 64
    assert BinaryKernel().dot(w, a) == ref_dot(w, a)


def test_linear_matches_reference():
    rng = np.random.default_rng(7)
    W = rng.integers(0, 2, size=(6, 130)).astype(np.uint8)
    a = rng.integers(0, 2, size=130).astype(np.uint8)
    got = BinaryKernel().linear(W, a)
    want = [ref_dot(W[r], a) for r in range(W.shape[0])]
    assert got == want


def test_padding_masked():
    rng = np.random.default_rng(11)
    for K in (63, 65, 100):
        w = rng.integers(0, 2, size=K).astype(np.uint8)
        a = rng.integers(0, 2, size=K).astype(np.uint8)
        ww, _, pad = pack_bits(w)
        aw, _, _ = pack_bits(a)
        assert bin_linear(np.stack([ww]), aw, K, pad)[0] == ref_dot(w, a)


def test_invalid_binary_domain_rejected():
    with pytest.raises(ValueError):
        pack_bits([0, 2, 1])


def test_float_words_rejected():
    with pytest.raises(TypeError):
        from aetherius_kernel import bin_dot

        bin_dot(np.ones(1), np.ones(1), 1, 0)


def test_shape_mismatch_rejected():
    with pytest.raises(ValueError):
        BinaryKernel().dot([1, 0], [1, 0, 1])
