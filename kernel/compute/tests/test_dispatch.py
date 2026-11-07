from aetherius_kernel import ComputeKernel, QuantumProgram


def test_unified_selftest_passes():
    result = ComputeKernel().selftest()
    assert result["all_passed"] is True
    assert result["checks"]["binary_dot"]["actual"] == -1
    assert result["checks"]["ternary_dot"]["actual"] == 1


def test_capabilities_are_honest():
    caps = ComputeKernel().capabilities()
    claims = caps["claims"]
    assert claims["binary_host_integer"] is True
    assert claims["binary_custom_isa"] is False
    assert claims["ternary_simulated"] is True
    assert claims["ternary_hardware"] is False
    assert claims["quantum_simulated"] is True
    assert claims["quantum_hardware"] is False
    assert claims["bootable_general_purpose_os"] is False

    by_id = {b["backend_id"]: b for b in caps["backends"]}
    assert by_id["aetherius.ternary.dual-mask"]["execution_class"] == "SIMULATED"
    assert by_id["aetherius.quantum.statevector"]["execution_class"] == "SIMULATED"
    assert by_id["aetherius.quantum.remote-qpu"]["execution_class"] == "BLOCKED_DEPENDENCY"
    assert by_id["aetherius.quantum.remote-qpu"]["available"] is False


def test_execute_dispatch():
    k = ComputeKernel()
    assert k.execute("BINARY", "dot", weights=[1, 0, 1], activations=[1, 1, 0]) == -1
    assert k.execute("TERNARY", "dot", weights=[1, 0, -1], activations=[1, -1, 0]) == 1
    r = k.execute("QUANTUM", "run", program=QuantumProgram(1).x(0), shots=10)
    assert r.counts == {"1": 10}


def test_unknown_operation_rejected():
    try:
        ComputeKernel().execute("BINARY", "divide", weights=[1], activations=[1])
    except ValueError as exc:
        assert "unsupported" in str(exc)
    else:
        raise AssertionError("expected ValueError")
