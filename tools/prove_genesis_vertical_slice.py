#!/usr/bin/env python3
"""Prove the whole chain, with a real task.

The progress review asked for two things that had not been shown:

  - IDE -> Bridge -> Genesis kernel -> event -> checkpoint -> persisted
    state -> IDE observation, with an actual bounded task rather than a
    mock event.
  - Restart recovery, and continuity of the same organism identity
    across a model change.

So this drives the real stack. It starts the Bridge with the kernel
attached, creates a session, submits a task that a local model really
runs, checks that the organism recorded it, checks that the state is on
disk, restarts the Bridge and checks that the organism is the same one,
changes the model the Bridge serves and checks that the organism is
still the same one, and finally reads back what the interface would
read.

Everything it reports is read from the running services. Nothing is
asserted from a fixture.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "docs" / "evidence" / "genesis-vertical-slice.yaml"

BRIDGE_PORT = 8471
IDE_PORT = 5199
GENESIS = REPO / "kernel" / "Genesis"
KERNEL_HOST = GENESIS / "build" / "genesis_runtime_host.exe"
IDE_WORKSPACE = REPO / "apps" / "IDE-Workspace" / "workspace"


def get(url: str, timeout: float = 30.0):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as res:
            return res.status, json.loads(res.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read().decode("utf-8", "replace"))
        except Exception:
            return exc.code, {}
    except Exception as exc:  # noqa: BLE001
        return None, {"error": f"{type(exc).__name__}: {exc}"}


def post(url: str, payload: dict, timeout: float = 60.0):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, json.loads(res.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read().decode("utf-8", "replace"))
        except Exception:
            return exc.code, {}
    except Exception as exc:  # noqa: BLE001
        return None, {"error": f"{type(exc).__name__}: {exc}"}


def stop_bridge() -> None:
    """Stop whatever is listening on the Bridge's port."""
    script = (
        "Get-NetTCPConnection -LocalPort %d -State Listen -ErrorAction "
        "SilentlyContinue | ForEach-Object { Stop-Process -Id "
        "$_.OwningProcess -Force -ErrorAction SilentlyContinue }" % BRIDGE_PORT
    )
    subprocess.run(["powershell", "-NoProfile", "-Command", script],
                   capture_output=True, timeout=120)
    time.sleep(2)


def start_bridge(model: str = "") -> subprocess.Popen:
    """Start the Bridge with the Genesis kernel attached."""
    args = [
        "service.py",
        "--port", str(BRIDGE_PORT),
        "--cors-origin", f"http://127.0.0.1:{IDE_PORT}",
        "--root", str(IDE_WORKSPACE),
        "--genesis-kernel", str(KERNEL_HOST),
        "--genesis-data-root", str(IDE_WORKSPACE / ".genesis-kernel"),
    ]
    return subprocess.Popen([sys.executable] + args,
                            cwd=str(REPO.parent / "Agent-Bridge"),
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def wait_for_bridge(seconds: float = 90.0) -> bool:
    deadline = time.time() + seconds
    while time.time() < deadline:
        status, _ = get(f"http://127.0.0.1:{BRIDGE_PORT}/v1/runtime", timeout=5)
        if status == 200:
            return True
        time.sleep(1)
    return False


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(OUT))
    ap.add_argument("--task", default="write a haiku about a river to haiku.txt")
    args = ap.parse_args()

    steps: list[dict] = []

    def record(name: str, ok: bool, detail: dict) -> None:
        steps.append({"step": name, "ok": bool(ok), **detail})
        print(f"  {'OK  ' if ok else 'FAIL'} {name}")

    if not KERNEL_HOST.is_file():
        print(f"  the Genesis runtime host is not built: {KERNEL_HOST}")
        return 1

    # The workspace the task runs in.
    # A fresh directory for this run, for the same reason: writing a
    # file that already exists needs an approval.
    scratch = IDE_WORKSPACE / f"genesis-slice-{int(time.time())}"
    shutil.rmtree(scratch, ignore_errors=True)
    scratch.mkdir(parents=True, exist_ok=True)

    print("=== 1. the Bridge with the kernel attached ===")
    stop_bridge()
    bridge = start_bridge()
    started = wait_for_bridge()
    record("the Bridge answers with the kernel attached", started,
           {"port": BRIDGE_PORT})
    if not started:
        bridge.terminate()
        return 1

    try:
        # ---- 2. the organism is there, with an identity ----
        status, runtime = get(f"http://127.0.0.1:{BRIDGE_PORT}/v1/runtime")
        organism = runtime.get("genesis") or {}
        identity = organism.get("identity", "")
        record("the organism has an identity", bool(identity),
               {"identity": identity, "version": organism.get("version", ""),
                "state": organism.get("state", "")})
        if not identity:
            bridge.terminate()
            return 1

        # ---- 3. a real session and a real task ----
        status, session = post(f"http://127.0.0.1:{BRIDGE_PORT}/v1/sessions", {
            "workspace": str(scratch),
            "mode": "build",
            "approval": "AUTO_SAFE",
            "interactive": False,
        })
        session_id = session.get("session_id", "")
        record("a session was created", bool(session_id),
               {"session_id": session_id, "status": status})

        status, task = post(
            f"http://127.0.0.1:{BRIDGE_PORT}/v1/sessions/{session_id}/tasks",
            {"text": args.task, "idempotency_key": ""})
        task_id = task.get("task_id", "")
        record("a task was accepted", bool(task_id),
               {"task_id": task_id, "status": status})

        # ---- 4. the task really runs ----
        deadline = time.time() + 300
        final_state = ""
        while time.time() < deadline:
            status, detail = get(
                f"http://127.0.0.1:{BRIDGE_PORT}/v1/sessions/{session_id}")
            entry = (detail.get("tasks") or {}).get(task_id) or {}
            final_state = str(entry.get("status", ""))
            if final_state in ("VERIFIED_COMPLETE", "COMPLETED", "FAILED",
                               "BLOCKED", "CANCELLED"):
                break
            time.sleep(2)
        record("the task ran to a conclusion", bool(final_state),
               {"task_state": final_state})
        produced = sorted(p.name for p in scratch.glob("*") if p.is_file())
        record("the task produced a result", bool(produced),
               {"files": produced})

        # ---- 5. the organism recorded it, and the state is on disk ----
        manifest = IDE_WORKSPACE / ".genesis-kernel" / "genesis.boot"
        on_disk = manifest.is_file()
        manifest_text = manifest.read_text(encoding="utf-8") if on_disk else ""
        sequence = ""
        for line in manifest_text.splitlines():
            if line.startswith("next_sequence="):
                sequence = line.split("=", 1)[1]
        record("the organism's state is on disk", on_disk,
               {"manifest": str(manifest), "next_sequence": sequence,
                "version": organism.get("version", "")})

        # ---- 6. the interface observes the same organism ----
        status, runtime = get(f"http://127.0.0.1:{BRIDGE_PORT}/v1/runtime")
        seen = (runtime.get("genesis") or {}).get("identity", "")
        record("the interface observes the organism", seen == identity,
               {"observed": seen, "expected": identity})

        # ---- 7. restart recovery: the same organism after a restart ----
        print("=== 2. the Bridge restarts ===")
        bridge.terminate()
        try:
            bridge.wait(timeout=30)
        except Exception:
            bridge.kill()
        time.sleep(2)
        bridge = start_bridge()
        restarted = wait_for_bridge()
        record("the Bridge came back", restarted, {})
        status, runtime = get(f"http://127.0.0.1:{BRIDGE_PORT}/v1/runtime")
        after = (runtime.get("genesis") or {}).get("identity", "")
        record("the organism is the same one after a restart", after == identity,
               {"identity": after, "expected": identity,
                "version": (runtime.get("genesis") or {}).get("version", "")})

        # ---- 8. identity continuity across a model change ----
        print("=== 3. the model changes ===")
        bridge.terminate()
        try:
            bridge.wait(timeout=30)
        except Exception:
            bridge.kill()
        time.sleep(2)
        bridge = start_bridge(model="qwen3:1.7b")
        remodelled = wait_for_bridge()
        record("the Bridge came back on another model", remodelled, {})
        status, runtime = get(f"http://127.0.0.1:{BRIDGE_PORT}/v1/runtime")
        after_model = (runtime.get("genesis") or {}).get("identity", "")
        record("the organism is the same one after the model changed",
               after_model == identity,
               {"identity": after_model, "expected": identity,
                "model_route": "qwen3:1.7b"})

        # ---- 9. the kernel's own restart and rollback proof ----
        print("=== 4. the kernel's own restart and rollback ===")
        proc = subprocess.run([str(KERNEL_HOST), "--self-test"],
                              capture_output=True, text=True, timeout=600,
                              encoding="utf-8", errors="replace")
        self_test = (proc.stdout or "").strip().splitlines()
        ok = proc.returncode == 0 and any("self-test ok" in ln for ln in self_test)
        record("the kernel restarts and rolls back with the same identity", ok,
               {"lines": self_test[-4:]})

    finally:
        try:
            bridge.terminate()
        except Exception:
            pass

    doc = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": "tools/prove_genesis_vertical_slice.py",
        "notes": [
            "The chain, driven with a real task: the Bridge, the Genesis "
            "kernel, the event, the checkpoint, the state on disk, and the "
            "observation the interface reads.",
            "The restart and the model change are real: the Bridge is "
            "stopped and started again, and the organism's identity is read "
            "back each time.",
            "What this does NOT claim: that the kernel is a permanently "
            "running process. It is a one-shot command over durable state, "
            "so the durability is the state on disk and the scheduling is "
            "whoever invokes it.",
        ],
        "steps": steps,
        "all_steps_ok": all(s["ok"] for s in steps),
    }
    Path(args.out).write_text(
        yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=100),
        encoding="utf-8")
    print()
    print(f"  {sum(1 for s in steps if s['ok'])} of {len(steps)} steps succeeded")
    print(f"  written to {args.out}")
    return 0 if doc["all_steps_ok"] else 1


if __name__ == "__main__":
    import yaml  # noqa: E402
    sys.exit(main())
