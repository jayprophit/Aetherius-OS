#!/usr/bin/env python3
"""Emit CycloneDX components for the kernel's installed Python dependencies.

The inventory is derived from installed distribution metadata, not from a
hand-written list. Only the runtime dependency tree and the declared dev
dependency tree are included; build tooling such as setuptools is excluded and
documented as out of scope in THIRD_PARTY_NOTICES.md.
"""

from __future__ import annotations

import json
import re
import sys
from importlib import metadata

from packaging.requirements import Requirement

RUNTIME_ROOTS = ("numpy",)
DEV_ROOTS = ("pytest",)


def normalise(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def requirement_name(requirement: str) -> str | None:
    match = re.match(r"^\s*([A-Za-z0-9][A-Za-z0-9._-]*)", requirement)
    return normalise(match.group(1)) if match else None


def installed() -> dict[str, metadata.Distribution]:
    return {normalise(dist.metadata["Name"]): dist for dist in metadata.distributions()}


def dependency_names(dist: metadata.Distribution) -> list[str]:
    names: list[str] = []
    for requirement in dist.requires or []:
        try:
            parsed = Requirement(requirement)
        except Exception:
            name = requirement_name(requirement)
            if name and name not in names:
                names.append(name)
            continue
        # Skip extras (pytest[dev], etc.) and requirements that do not apply to
        # this interpreter or platform. The SBOM must describe what is present.
        if parsed.marker and not parsed.marker.evaluate({"extra": ""}):
            continue
        name = normalise(parsed.name)
        if name not in names:
            names.append(name)
    return names


def license_of(dist: metadata.Distribution) -> dict:
    expression = dist.metadata.get("License-Expression")
    if expression:
        return {"expression": expression}

    license_text = (dist.metadata.get("License") or "").strip()
    if license_text and "\n" not in license_text and license_text.upper() != "UNKNOWN":
        return {"license": {"name": license_text}}

    for classifier in dist.metadata.get_all("Classifier") or []:
        if classifier.startswith("License ::"):
            name = classifier.rsplit("::", 1)[-1].strip()
            if name:
                return {"license": {"name": name}}

    return {"license": {"name": "UNKNOWN"}}


def main() -> int:
    distributions = installed()
    components: list[dict] = []
    seen: set[str] = set()

    def visit(name: str, scope: str) -> None:
        key = normalise(name)
        if key in seen or key not in distributions:
            return
        seen.add(key)
        dist = distributions[key]
        purl = f"pkg:pypi/{key}@{dist.version}"
        components.append(
            {
                "type": "library",
                "bom-ref": purl,
                "name": key,
                "version": dist.version,
                "purl": purl,
                "scope": scope,
                "group": "python",
                "description": (dist.metadata.get("Summary") or "").strip() or None,
                "licenses": [license_of(dist)],
            }
        )
        for dependency in dependency_names(dist):
            visit(dependency, scope)

    for root in RUNTIME_ROOTS:
        visit(root, "required")
    for root in DEV_ROOTS:
        visit(root, "optional")

    for component in components:
        if component["description"] is None:
            del component["description"]

    json.dump(components, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
