import numpy as np
import pytest

from aetherius_kernel import TernaryKernel, pack_ternary


def ref_dot(w, a):
    return int((np.asarray(w, np.int64) * np.asarray(a, np.int64)).sum())


def test_known_dot():
    assert TernaryKernel().dot([1, 0, -1], [1, -1, 0]) == 1


@pytest.mark.parametrize("K", [1, 7, 63, 64, 65, 127, 512, 1000])
def test_random_dot_matches_reference(K):
    rng = np.random.default_rng(85)
    w = rng.choice([-1, 0, 1], size=K).astype(np.int8)
    a = rng.choice([-1, 0, 1], size=K).astype(np.int8)
    assert TernaryKernel().dot(w, a) == ref_dot(w, a)


def test_zero_annihilates():
    rng = np.random.default_rng(3)
    w = rng.choice([-1, 0, 1], size=257).astype(np.int8)
    z = np.zeros(257, np.int8)
    assert TernaryKernel().dot(w, z) == 0


def test_negation_flips_sign():
    rng = np.random.default_rng(4)
    w = rng.choice([-1, 0, 1], size=300).astype(np.int8)
    a = rng.choice([-1, 0, 1], size=300).astype(np.int8)
    assert TernaryKernel().dot(-w, a) == -TernaryKernel().dot(w, a)


def test_linear_matches_reference():
    rng = np.random.default_rng(5)
    W = rng.choice([-1, 0, 1], size=(5, 130)).astype(np.int8)
    a = rng.choice([-1, 0, 1], size=130).astype(np.int8)
    assert TernaryKernel().linear(W, a) == [ref_dot(W[r], a) for r in range(W.shape[0])]


def test_invalid_ternary_domain_rejected():
    with pytest.raises(ValueError):
        pack_ternary([0, 2, -1])


def test_overlap_guard():
    import numpy as np

    from aetherius_kernel import ter_dot

    bad = np.ones(1, dtype=np.uint64)
    with pytest.raises(ValueError):
        ter_dot(bad, bad, bad, bad, 1, 63)
