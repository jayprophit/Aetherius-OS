"""CLI for the Aetherius compute kernel."""

from __future__ import annotations

import argparse
import json
import sys

from .capabilities import capability_report
from .dispatch import ComputeKernel
from .quantum import QuantumProgram


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="aetherius-kernel")
    parser.add_argument(
        "command",
        choices=["capabilities", "selftest", "demo"],
        help="capabilities: print the honest backend report; selftest: run built-in checks; demo: run a Bell circuit",
    )
    args = parser.parse_args(argv)

    if args.command == "capabilities":
        print(json.dumps(capability_report(), indent=2))
        return 0

    if args.command == "selftest":
        result = ComputeKernel().selftest()
        print(json.dumps(result, indent=2))
        return 0 if result["all_passed"] else 1

    bell = QuantumProgram(2).h(0).cnot(0, 1)
    result = ComputeKernel().quantum.run(bell, shots=1000, seed=85)
    print(json.dumps(result.to_dict(), indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
