# The Aetherius IDE: an owner walkthrough

Eight steps, each one checked against the running system rather than
described. The evidence is at
`docs/evidence/ide-owner-walkthrough.yaml`, and it is produced by
`tools/prove_ide_owner_walkthrough.py`, which drives the real stack.

Last run: 2026-10-21T18:01:03.091228+00:00 — 14 of
14 steps succeeded.

---

## 1. Launch

```powershell
cd "C:\Users\jpowe\Desktop\Projects\Aetherius-OS"
powershell -ExecutionPolicy Bypass -File scripts\start-ide-stack.ps1
```

The launcher starts the local model runtime, then Agent Bridge with the
Genesis kernel attached, then the IDE. It starts each one only if it is
not already running, waits for it, and prints what is actually true.

Then open <http://127.0.0.1:5199>. The tab title is **Aetherius IDE**.

The launcher is **idempotent**: running it again with the whole stack
already up is safe, and so is running it with only part of it up. Both
were exercised.

## 2. The organism's identity

The status panel shows a row labelled `genesis`. It reads:

```
genesis.entity.v1.organism.f50890581d8d1250baa4845309b49cdd4a76acfa1d515ea7cb29821113b08634 v23
```

That is the real organism, with the identity the Genesis kernel derived
from its own namespace and key. It is **not** a name typed into the
interface, and it does not change when the model does.

If the kernel is not attached, the row says `not attached`. It never
shows a name for an organism that is not there.

## 3. The models

The ModelCenter lists **10** local models, read from the model
runtime at the moment the panel refreshes. On this machine:
local-qwen3:1.7b-cpu, moondream:latest, granite4:3b, ministral-3:3b, nomic-embed-text:latest, granite3.3:2b.

The panel says `model: no model connected` until a model is selected.
That is the truth: the models are available, none is chosen.

## 4. The workers

The panel says `workers: 0 registered` and `agent: no agent connected`.

**This is honest, and it is the next thing to build.** No worker has
been commissioned, so none is shown. The display is not to be
green-washed: the review was explicit that the model and agent statuses
stay disconnected until the connections genuinely exist.

## 5. Task submission

From the interface, the AI panel's task bar creates a session and
submits a task. The Bridge accepts it and the task runs against a local
model.

## 6. Execution evidence

The task ends in `COMPLETED`, and the files it produced are on disk:
haiku.txt.

The same work is recorded by the organism: the kernel's version advances
and the state is written to
`apps/IDE-Workspace/workspace/.genesis-kernel/`.

## 7. Restart

Stop and start the Bridge, or simply run the launcher again. The
organism is **the same organism**: the same identity, the same version
history, the same state on disk. The kernel is a one-shot command over
durable state, so the durability is that state and the scheduling is
whoever invokes it. It is not a permanently running process, and
nothing here claims it is.

## 8. Recovery

After the restart the stack is whole: the Bridge is `HEALTHY`, the
organism is attached, and the interface is served.

The same proof, with a real task and with the Bridge stopped and
started twice, is at
`docs/evidence/genesis-vertical-slice.yaml` — thirteen of thirteen
steps, including the same organism after a model change.

---

## What is still to be built

- **A worker.** Nothing is commissioned, so the agent row stays
  disconnected. That is the honest position and it is the next unit.
- **A model that is selected**, so the model row stops saying
  `no model connected`.
- **The Bridge's security findings**, which are recorded in the todo
  list and are not skipped to make a build green.
