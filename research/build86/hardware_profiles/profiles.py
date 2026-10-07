"""BUILD86 - HardwareProfile schema + reference profiles.

Every profile carries explicit provenance (source, source_class, confidence,
retrieved_at). Values NOT verified from primary sources on this host are marked
source_class PROJECT_CLAIM / HISTORICAL with confidence low and a verification
requirement. Nothing here is presented as a vendor datasheet.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent
NOW = datetime.now(timezone.utc).isoformat()

SCHEMA_KEYS = ("profile_id", "domain", "device_family", "manufacturer_or_project",
               "model", "architecture", "execution_domain", "source", "source_date",
               "source_class", "state", "availability", "evidence",
               "parameters", "topology", "timing", "error_model", "memory_model",
               "precision", "instruction_or_gate_set", "confidence", "limitations",
               "retrieved_at", "hash", "architecture_family",
               "signal_line_capacity", "nominal_target_qubit_scale",
               "interconnect_model", "chiplet_architecture",
               "control_interconnect_assumptions", "cooling_requirements",
               "planned_availability", "profile_version", "calibration_snapshots")


def _base(pid, domain, family, mfr, model, arch, source, sclass, confidence,
          limitations, **kw):
    p = {
        "profile_id": pid, "domain": domain, "device_family": family,
        "manufacturer_or_project": mfr, "model": model, "architecture": arch,
        "execution_domain": kw.get("execution_domain"),
        "source": source, "source_date": kw.get("source_date"),
        "source_class": sclass, "state": kw.get("state"),
        "availability": kw.get("availability"), "evidence": kw.get("evidence"),
        "parameters": kw.get("parameters", {}),
        "topology": kw.get("topology", {}),
        "timing": kw.get("timing", {}),
        "error_model": kw.get("error_model", {}),
        "memory_model": kw.get("memory_model", {}),
        "precision": kw.get("precision", {}),
        "instruction_or_gate_set": kw.get("instruction_or_gate_set", {}),
        "confidence": confidence,
        "limitations": limitations,
        "retrieved_at": NOW, "hash": kw.get("hash"),
        "architecture_family": kw.get("architecture_family"),
        "signal_line_capacity": kw.get("signal_line_capacity"),
        "nominal_target_qubit_scale": kw.get("nominal_target_qubit_scale"),
        "interconnect_model": kw.get("interconnect_model"),
        "chiplet_architecture": kw.get("chiplet_architecture"),
        "control_interconnect_assumptions": kw.get("control_interconnect_assumptions"),
        "cooling_requirements": kw.get("cooling_requirements"),
        "planned_availability": kw.get("planned_availability"),
        "profile_version": kw.get("profile_version", "1"),
        "calibration_snapshots": kw.get("calibration_snapshots", []),
    }
    missing = [k for k in SCHEMA_KEYS if k not in p or p[k] is None]
    if missing:
        # Allow some keys to be None for backward compatibility
        missing_ok = {"execution_domain", "state", "availability", "evidence",
                      "architecture_family", "signal_line_capacity",
                      "nominal_target_qubit_scale", "interconnect_model",
                      "chiplet_architecture", "control_interconnect_assumptions",
                      "cooling_requirements", "planned_availability",
                      "source_date", "hash"}
        missing = [m for m in missing if m not in missing_ok]
    assert not missing, f"schema gap: {missing}"
    return p


PROFILES = [
    _base("ternary-5500fp-r1", "TERNARY", "balanced-ternary CPU",
          "ternary-computing.com project", "5500FP", "24-trit word FPGA",
          source="BUILD86 prompt section 9, citing ternary-computing.com (NOT verified from this host)",
          sclass="PROJECT_CLAIM", confidence="low",
          limitations=["values need primary-source verification", "no local hardware",
                       "timing is reference only"],
          parameters={"states": [-1, 0, 1], "word_trits": 24, "tryte_trits": 6,
                      "short_trits": 12, "registers": 81, "address_bus_trits": 22,
                      "data_bus_trits": 24, "reference_clock_mhz": 20.0,
                      "implementation": "FPGA"},
          topology={"bus": "24-trit data / 22-trit address", "registers": 81},
          timing={"reference_clock_mhz": 20.0, "cycle_ns": 50.0},
          error_model={"deterministic": True},
          memory_model={"addressable_trits": "22-trit address space"},
          precision={"native": "balanced ternary integer"},
          instruction_or_gate_set={"isa": "UNVERIFIED - needs primary source"},
          profile_version="1", calibration_snapshots=[]),
    _base("qpu-ibm-heron-r1", "QUANTUM", "superconducting gate-model QPU",
          "IBM Quantum", "Heron family (r1/r2 generation)", "heavy-hex superconducting",
          source="public IBM Quantum hardware pages (NOT re-verified from this host; specs drift with calibration)",
          sclass="PROJECT_CLAIM", confidence="low",
          limitations=["qubit count/topology/error rates change per device and calibration",
                       "no QPU access from this host", "snapshot required before any run"],
          parameters={"programmable_qubits": 133, "family_variants": [133, 156],
                      "topology": "heavy-hex", "native_gates": ["RZ", "SX", "X", "CZ", "ID"]},
          topology={"coupling": "heavy-hex nearest-neighbour", "programmable_qubits": 133},
          timing={"cLOPS_reference": "vendor-reported, snapshot-dependent"},
          error_model={"two_qubit_error": "order 1e-3, device- and date-dependent",
                       "readout_error": "order 1e-2, device-dependent",
                       "t1_t2_us": "device-dependent; see calibration snapshot"},
          memory_model={"coherence_limited": True},
          precision={"gates": "analogue-calibrated single/two-qubit"},
          instruction_or_gate_set={"native": ["RZ", "SX", "X", "CZ", "ID"]},
          profile_version="1",
          calibration_snapshots=[{"snapshot_id": "none-captured",
                                  "note": "no calibration data retrieved; runs must pin a snapshot first"}]),
    _base("qpu-quantinuum-h2-r1", "QUANTUM", "trapped-ion gate-model QPU",
          "Quantinuum", "H2 generation", "trapped-ion QCCD",
          source="public Quantinuum H2 materials (NOT re-verified from this host)",
          sclass="PROJECT_CLAIM", confidence="low",
          limitations=["specs evolve per system upgrade", "no QPU access from this host"],
          parameters={"qubits": 56, "connectivity": "all-to-all",
                      "native_gates": ["arbitrary 1Q", "arbitrary-angle 2Q ZZ"],
                      "mid_circuit_measurement": True},
          topology={"coupling": "all-to-all (QCCD transport)"},
          timing={"gate_times_us": "device-dependent; see snapshot"},
          error_model={"two_qubit_infidelity": "order 1e-3, system-dependent",
                       "spam": "order 1e-3", "memory_error_per_qubit": "see snapshot"},
          memory_model={"coherence": "long vs gate time; see snapshot"},
          precision={"gates": "arbitrary-angle native"},
          instruction_or_gate_set={"native": ["1Q arbitrary", "ZZ arbitrary angle"]},
          profile_version="1",
          calibration_snapshots=[{"snapshot_id": "none-captured",
                                  "note": "no calibration data retrieved"}]),
    _base("accel-dtc-sim-r1", "ACCELERATOR", "time-crystal simulator",
          "Aetherius BUILD85 experiment", "DTC-8spin", "driven spin chain (exact)",
          source="Aetherius-OS/research/build85/accelerator/timecrystal_dtc.json (locally measured)",
          sclass="MEASURED_LOCAL", confidence="medium",
          limitations=["simulator only; not physical hardware", "N=8 exact evolution"],
          parameters={"spins": 8, "periods": 60, "flip_error_eps": 0.06,
                      "period2_score": 0.9998, "late_amplitude": 0.9735,
                      "control_amplitude": 0.6089},
          topology={"chain": "1-D ring, nearest-neighbour ZZ"},
          timing={"periods_simulated": 60},
          error_model={"exact_evolution": True},
          memory_model={"statevector_2N": 256},
          precision={"amplitudes": "complex128 exact"},
          instruction_or_gate_set={"floquet": ["imperfect X flip", "disordered ZZ evolution"]},
          profile_version="1", calibration_snapshots=[]),
_base("vio-40k-future-r1", "QUANTUM", "QuantWare VIO-40K future profile",
      "QuantWare", "VIO-40K", "scalable superconducting QPU roadmap",
      source="QuantWare VIO-40K technical roadmap / official technical materials (NOT verified from this host; roadmap subject to change)",
      sclass="FUTURE_VENDOR_HARDWARE_PROFILE", confidence="low",
      limitations=["no local QPU access; roadmap is forward-looking",
                   "quantum statevector beyond host RAM not simulated",
                   "calibration snapshot required before any run"],
      architecture_family="scalable-superconducting",
      signal_line_capacity="configurable per tile",
      nominal_target_qubit_scale="up to 10,000 programmable qubits (roadmap target)",
      interconnect_model="3D hybrid wire-bond / fiber-optical",
      chiplet_architecture="modular tile-based with coherent interface",
      control_interconnect_assumptions="local acoustic control, global microwave distribution",
      cooling_requirements="millikelvin dilution refrigerator",
      planned_availability="phased rollout starting Q4 2026, full deployment 2028",
      state="FUTURE_HARDWARE_REFERENCE_PROFILE",
      availability="NOT_SHIPPING_FOR_LOCAL_USE",
      profile_version="1", calibration_snapshots=[]),
]


def main() -> None:
    for p in PROFILES:
        (OUT / f"{p['profile_id']}.json").write_text(json.dumps(p, indent=1))
    print(f"wrote {len(PROFILES)} profiles to {OUT}")


if __name__ == "__main__":
    main()
