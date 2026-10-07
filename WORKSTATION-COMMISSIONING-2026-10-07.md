# Workstation Commissioning Report - 2026-10-07

Post-BUILD86-R7B execution directive. Owner: Jonathan.
Mode: BUILD / EXECUTION. Live machine state is the evidence authority.
Prior reports were read as input, never trusted over measurement.
Several 2026-10-06 registry verdicts were proven WRONG by live state and
corrected (details per tool below).

## 1. Machine baseline (measured, not inherited)

- OS: Windows 10 Pro 22H2, build 19045 (10.0.19045.7725), x64
- Host: Dell Precision T1500 (2010 workstation), BIOS legacy era
- CPU: Intel i7-870 @ 2.93GHz, 4c/8t, Lynnfield/Nehalem - **NO AVX/AVX2**
  (SSE4.2 max). This single fact governs all compatibility decisions.
- RAM: 16GB total; typical commissioning load 85-92% (vmmem ~3.5GB,
  owner ChatGPT app ~1GB, Docker, Postgres recovery, GIMP init).
  Sequential testing is MANDATORY; parallel heavy work thrashes.
- GPU: NVIDIA GTX 1050 Ti, 4GB VRAM, driver 32.0.15.8266, 1920x1080
- Disks: C: 1.86TB (1.35TB free), E: 466GB (373GB free),
  F: AETHERIUS 2.63TB (2.63TB free)
- Network: up (Docker Hub pull, GIMP download, Ollama, Nous Portal OK)
- Python: Store 3.13 default (`python`), python.org 3.14 via `py`;
  pip + venv proven; torch 2.14.1+cpu + transformers 5.18.0 import OK
- Key toolchain (all `--version` proven): uv 0.12.17, Node 24.21.0,
  npm 11.19.0, Git 2.55.0, gh 2.100.0, Git LFS 3.8.0, Rust 1.98.0,
  CMake 4.4.2, Ninja 1.13.2, MinGW GCC 16.1.0, Clang 22.1.8,
  MSVC 19.52 (VS2026 BuildTools, cl.exe proven), dotnet 10.0.401,
  Java 21 LTS, Go 1.27.0, ripgrep 15.2.0, jq 1.8.2, ffmpeg 9.0.1,
  7-Zip 26.03, SQLite 3.53.4, QEMU 11.1.0, Arduino CLI 1.5.2-rc.1

## 2. Discovery corrections (registry was stale)

The 2026-10-06 seed claimed these were NOT installed / BLOCKED_OWNER.
Live state 2026-10-07 proves ALL installed (uninstall registry + Start
Menu + executed binaries). Root cause of the error: the prior check
relied on winget/registry gaps and missed machine-wide installers,
Store (MSIX) packages, and portable trees:
CAMotics 1.2.0, LaserGRBL 7.14.1, LibreCAD 2.2.1.5, OpenModelica 1.27.1,
OpenSCAD 2021.01 (healthy despite odd uninstall label), Inkscape 1.4.4
(Store), MeshLab 2025.07, Krita 5.3.4, KubeUI 1.1.0, plus portable
CalculiX 2.20/2.21/2.22, CloudCompare 2.13.2 x64, Godot 4.7.2-mono,
Arduino IDE (Store) + Arduino CLI, and agent apps Hermes, Codex (Store),
Manus (Store), ChatGPT (via OpenAI.Codex pkg), Copilot (Store).
Hermes/Codex/Manus/ChatGPT are absent from the classic uninstall
registry (user-scope/Store) but present via Appx + StartApps + lnk.

## 3. Installed vs working (evidence statuses)

VERIFIED (launched, real test, artifact independently checked):
- FreeCAD 1.0.2 - 10x20x30 box, volume 6000.0, STEP 6854B + binary STL
  12 facets (684B). freecad_adapter.py exists.
- Blender 5.2.2 LTS (Store) - version-to-file transcript + Cycles CPU
  render of default cube (107688B valid PNG magic). Headless Eevee
  FAILS (no GL context) - use Cycles CPU. blender_adapter.py exists.
- CuraEngine 5.13.0 - NEW VERIFIED: 10mm box STL + shipped
  fdmprinter/fdmextruder defs + roofing_layer_count=0 +
  flooring_layer_count=0 -> 576863B gcode, 298 layers, 13832 G1 moves,
  zero errors. Bare chain dies mid-slice without those two settings
  (prior PARTIAL root-caused and FIXED). cura_adapter.py created.
- OpenCode 1.18.30 - headless `run -m ollama-local/qwen3:1.7b --dir`
  wrote correct RESULT2.txt, clean cwd scoping (delegation proof).
- Ollama 0.34.4 - daemon + 15-model fleet + inference (READY-42) +
  native tool_calls for llama3.2:1b + ministral-3:3b.
- Docker engine 29.7.2 / Desktop 4.86.0 - hello-world + ws-postgres
  (healthy after recovery) + ws-redis (healthy).
- Kubernetes (docker-desktop ctx) - busybox pod Completed, SMOKE-OK.
- OpenModelica path via omc - see PARTIAL (sim proven, no adapter).
- CalculiX path via ccx - see PARTIAL (solve proven, no adapter).
- KiCad 10.0.6 kicad-cli - see PARTIAL (export proven, no adapter).
- OpenSCAD 2021.01 - see PARTIAL (render proven, no adapter).
- CloudCompare 2.13.2 x64 portable - see PARTIAL (convert proven).
- CAMotics 1.2.0 camsim - see PARTIAL (project sim proven).
- Python AI stack - torch matmul, transformers import, pandas/
  sklearn/fastapi/vaderSentiment installed+imported (see 5).
PARTIAL (executed, documented limit):
- KiCad 10.0.6 - full Battery.pretty lib -> SVG plots (31-46KB).
  NO create-project subcommand exists. Hand schematics rejected
  (v10 strict). PCB/DRC/Gerber untested. No adapter yet.
- OpenModelica 1.27.1 - omc decay-model sim FINISHED: compile 117s,
  dassl ok, x(2)=0.1353 exactly e^-2 (parsed from .mat). No adapter.
- CalculiX 2.22 (portable) - cantilever B31: 1-elem tip -0.144,
  2-elem -0.1786, converging to Euler-Bernoulli -0.1905 (single-elem
  constant-curvature behavior confirmed, solver CORRECT). Manual .inp.
- OpenSCAD 2021.01 - headless CGAL render 2.4s -> 8729B STL.
- CloudCompare 2.13.2 x64 portable - -SILENT STL->BIN 0.63s.
  Downloads holds a WRONG-ARCH ARM64 installer (do not use on x64).
- CAMotics 1.2.0 - camsim on shipped box.camotics -> 5.9MB STL,
  117732 tris. Bare g-code without tool/stock removes NOTHING.
- GIMP 3.2.6 (NEW install, official, user-scope) - init+profile done;
  script-fu + python-fu interpreters proven (--batch-interpreter
  MANDATORY in 3.x; gimp-layer-new takes image LAST;
  procedural-db-proc-info removed). Batch RENDER unproven.
- Godot 4.7.2-mono (portable) - --version proven; headless/export untested.
- Hermes 0.21.3 - headless -z delegation PROVEN via new `local`
  profile (Ollama ministral-3:3b, -t file): RESULT.txt written with
  correct content, independently verified. Caveats: default Nous free
  model solar-pro4:free is DEAD (free period ended); needs
  ollama_num_ctx>=65536; only native-tool-call models work
  (llama3.2/ministral; qwen/phi4-mini emit content-JSON); writes can
  escape --in dir (ALWAYS use absolute task paths); 10393 commits
  behind upstream (do NOT update mid-build).
- OpenClaw 2026.9.6 - distro boots, CLI ok, but systemd user sessions
  broken and gateway dies silently headless (no 18789). Wedge cleared
  (wsl --terminate). Restart needs OWNER via Companion GUI/tray.
- Codex CLI 0.155.1 - installed + LOGGED IN via ChatGPT; exec/mcp/
  app-server surface present, task run untested.
- Cursor 3.20.17 - Electron cli.js --version proven; no headless mode.
- Arduino CLI 1.5.2-rc.1 - version proven; cores/compile/upload untested.
- LM Studio 0.4.25 - lms CLI 1.3.3 INCOMPATIBLE (SIGILL 0xC000001D,
  Bun binary needs AVX); GUI/server untested. Ollama covers automation.
- COLMAP 4.2.1 CPU - --help re-verified; feature_extractor crash
  (0xC0000409) stands from prior evidence (no inputs to retest).
- Gmsh (pip API) - import re-verified; STL meshing per prior evidence.

INTERACTIVE_ONLY (installed, shortcut healthy, no automation surface):
Shapr3D 26.170, SolveSpace 3.2, OrcaSlicer 2.4.2 (no headless flags),
MeshLab 2025.07 (meshlabserver long removed), Krita 5.3.4 (launched,
window confirmed+closed), LibreCAD 2.2.1.5, LaserGRBL 7.14.1 (NO
hardware actuation permitted), Inkscape 1.4.4 (Store sandbox blocks
direct-exe: Access denied, no execution alias), Arduino IDE (Store),
Manus 2.0.4, ChatGPT (OpenAI.Codex pkg), Copilot.
UNVERIFIED (present, never executed - GUI chatbots, no PATH CLI):
Qwen, Kimi, DeepSeek, Devin, Claude, Antigravity, Bionic, Canva.
BLOCKED_HARDWARE: stock TensorFlow (no AVX on i7-870; use PyTorch);
lms CLI (SIGILL, same cause).
BLOCKED_OWNER (exact requirement, other work continued):
- OpenClaw gateway restart (Companion GUI/tray owns lifecycle).
- Code-Aster 2025 (379MB MSI in Downloads, likely needs elevation).
- Salome-Meca (1.8GB installer present, heavy install, owner call).
- BIMvision 3.2.0 installer present, not installed (owner call).
- Hermes/portal paid tools (no credits), provider API keys (none set).
REMOVED: none. No uninstall was justified (nothing proven unusable
after repair attempts; lms/TF are cli-only/hardware cases, apps stay).

## 4. Configuration performed (best-for-purpose, not merely inspected)

- Docker: diagnosed WSL-proxy timeout (integration service could not
  list distros), repaired via targeted `wsl --terminate docker-desktop`
  (OpenClawGateway left running) + Desktop restart. Engine + compose
  + K8s verified. No factory reset, no data loss.
- Hermes: created `local` profile (cloned, owner profiles untouched),
  provider=ollama, base http://127.0.0.1:11434/v1,
  ollama_num_ctx=65536, model=ministral-3:3b (proven best local agent
  loop: native tool_calls + correct args; llama3.2:1b calls but too
  weak; qwen3:1.7b/phi4-mini/coders fail tool protocol).
- OpenCode: no config change needed; ollama-local provider + curated
  models verified working headless.
- Python: installed pandas 3.0.6 + scikit-learn 1.9.1 + fastapi
  0.142.2 + uvicorn 0.54.0 + vaderSentiment 3.3.2 (+requests 2.34.2)
  into the canonical Store-3.13 interpreter (torch/transformers/numpy/
  scipy/matplotlib/PIL/pytest/psutil/yaml already present and working).
- GIMP: official 3.2.6 user-scope install (/CURRENTUSER, no UAC),
  first-run init completed, Start Menu entry by installer.
- Shortcuts: 9 added to user Start Menu - Manus, Copilot
  (explorer shell:AppsFolder method), Blender, Arduino IDE, ChatGPT,
  Inkscape, Docker Desktop (copied working links), Godot 4.7.2 (new),
  Programming & Code folder. GIMP entry already existed.
- OpenClaw: wedged WSL distro diagnosed (systemd user-session failure
  + stdin-blocking CLI red herring: always </dev/null) and cleared;
  gateway left STOPPED pending owner GUI restart (documented).
- KiCad/Cura/OpenSCAD/etc: no config changes needed (CLIs work as
  shipped; Cura needs 2 explicit settings per invocation - encoded
  in cura_adapter.py defaults).

## 5. Python stack verdict (user question)

NEED + HAVE: python 3.13/3.14, pip, venv (stdlib), numpy 2.5.3,
scipy 1.11+/1.18.1, matplotlib 3.11.2, PIL 12.3.0, pytest 9.1.1,
psutil 7.2.2 (=Agent-Bridge pin), yaml 6.0.3, torch 2.14.1+cpu
(matmul256 in 3.4s, PROVEN), transformers 5.18.0 (imports fine;
earlier hangs were system thrash, not breakage).
NEEDED + INSTALLED TODAY: pandas 3.0.6, scikit-learn 1.9.1, fastapi,
uvicorn, vaderSentiment 3.3.2 (Veyra/Genesis requirements).
DO NOT NEED: dask (pandas suffices single-machine), tensorflow
(BLOCKED_HARDWARE: stock builds need AVX, absent here - PyTorch +
sklearn cover ML), Spyder/PyCharm (VS Code + CLion + Vim cover
editing; 16GB box cannot afford another heavy IDE; no project
requires them), "piprepl" (not a real package - REPL + pip both
proven working).
KNOWLEDGE (not software): EAFP vs LBYL (you wrote LYBL - "look before
you leap") are error-handling styles; DRY/OOP are design principles;
PEP = enhancement-proposal process (PEP 8 = style); BDFL is HISTORICAL
(Guido retired 2018, now Steering Council); LEGB = scope order;
MRO = C3 method resolution. Follow them in code; nothing to install.
## 6. Supervisor bake-off (real evidence, no marketing)

| Candidate | Headless | Delegate proof | Verdict |
|---|---|---|---|
| Hermes 0.21.3 | YES (-z, profiles, worktree, cron, kanban, gateway, mcp serve, acp, dashboard) | YES (ministral-3:3b wrote verified RESULT.txt; tool verifier engaged) | PRIMARY_CURRENT_SUPERVISOR |
| OpenCode 1.18.30 | YES (run/serve/acp/mcp/attach/sessions) | YES (qwen3:1.7b wrote verified RESULT2.txt, clean scoping) | BEST CODING WORKER + alternate supervisor |
| OpenClaw 2026.9.6 | CLI yes, gateway NO (headless start fails) | none | candidate PENDING owner GUI restart |
| Codex CLI 0.155.1 | YES (exec/review/mcp/app-server, logged in) | none (untested) | BEST DEEP-REASONING/FRONTIER candidate (cost-gated) |
| Cursor 3.20.17 | shim only, no task mode | none | IDE worker, not supervisor |
| Manus/ChatGPT/Copilot | none found | none | GUI chatbots, not supervisors |
| Ollama fleet | API+CLI (the worker substrate, not a supervisor) | supports both winners | BEST LOCAL/OFFLINE WORKER pool |

PRIMARY_CURRENT_SUPERVISOR = Hermes: broadest proven orchestration
surface (sessions/resume, cron, kanban, gateway, worktrees, MCP server,
A2A, computer-use) + working local delegation + already wired as MCP
server in owner opencode.json. OpenCode is the best coding worker and
the cleaner headless coding loop; route coding tasks there, own the
orchestration in Hermes (long-term: Genesis owns it; these are tools).
Specialists: research->Codex/ChatGPT (account present);
browser/automation->none proven (gap); GUI/computer-control->Hermes
computer-use backend (present, untested); low-cost/free->Ollama fleet;
long-running->Hermes cron/gateway or opencode serve; independent
reviewer->Agent-Bridge reviewer.py (in-repo, untested today).

## 7. Interoperability matrix (executed links only)

- FreeCAD box -> STEP (self) + STL (self) -> CuraEngine -> 576KB gcode:
  PROVEN end-to-end (commission-test artifacts in Temp, not committed).
- Cura gcode -> camsim: parses+runs; NEEDS .camotics project for
  material removal (proven via shipped box example).
- OM .mat -> scipy.io -> exact physics: PROVEN.
- Ollama -> Hermes -> file; Ollama -> OpenCode -> file: PROVEN.
- Docker -> postgres/redis healthy; kubectl -> pod Completed: PROVEN.
- untried honestly: FreeCAD->Blender mesh handoff, KiCad sch->pcb
  (no valid files), COLMAP chain (no input views located), Inkscape->
  LaserGRBL prep (GUI), OrcaSlicer headless (no flags exist).

## 8. Agent Bridge readiness + resources + security

- New seam: cura_adapter.py (+8 tests incl. real slice) mirrors the
  freecad/blender adapter contract (discover/bounded-run/verify,
  refusal-first). Next adapters in priority order: openmodelica,
  calculix, kicad-fp-export, cloudcompare, openscad (all PARTIAL with
  proven CLIs, so adapters are thin).
- Registry: Agent-Bridge/app_registry.py updated 16 -> 33 records
  (7 stale BLOCKED_OWNER corrected, 17 new), APPLICATION_IDS extended,
  slicing test updated to proven truth; pytest green incl. hygiene.
- Resources: 4c/8t + 16GB + 4GB VRAM is the ceiling. Ollama <=3B fits
  VRAM; OM compile ~2min; GIMP/Cycles/FreeCAD strictly sequential;
  K8s adds ~1.5GB overhead (fine when needed, not by default).
- Security: NO secrets created/printed/committed (secret-hygiene suite
  green). No credential entry performed (Nous Portal login + Codex
  ChatGPT login are the OWNERs, untouched). Open ports observed:
  11434 (ollama), 18789 was gateway (now closed), K8s 51631, Docker
  named pipes. No anomaly introduced. LaserGRBL/CNC: no actuation.

## 9. Registry / Temp / git

- Registry: all findings above are IN app_registry.py (update existing
  records, stable IDs preserved, no parallel registry created) +
  cura_adapter.py + tests. Provenance per record (dates + evidence).
- Temp: Projects/Temp audited - prior-session staging only
  (backups, ledgers, probes, quarantine dirs, integrity record
  2026-09-30). NOTHING of this session was put there (scratch lives
  in AppData Local Temp opencode). No moves justified (ownership of
  prior items unclear, all tiny, deletion ledgers are provenance).
- This session: GIMP installer kept in Downloads (181MB, official,
  reusable). No other downloads (CloudCompare ARM64 stub predates me).

## 10. Remaining work + owner blockers + next task

Machine-solvable remainder: cura-adjacent profile tuning (real print
values need a tuned machine profile); openmodelica/calculix/kicad/
cloudcompare/openscad thin adapters; GIMP batch render via python-fu
GI API (needs API doc, not guessing); COLMAP retest with input views;
OrcaSlicer/GUI-app owner acceptance; Hermes upstream update (NOT now);
code-aster/BIMvision/Salome install decisions; full Delta inventory
phase is EXPLICITLY out of scope for this run.
Genuine owner blockers: OpenClaw gateway GUI restart; any paid
provider/API key; UAC/admin installs (code-aster MSI); physical
machine actuation (never permitted here).
Exact next dependency-ready task: pick ONE - (a) wire cura_adapter
into Agent-Bridge worker_runtime tool allowlist, or (b) author the
openmodelica_adapter the same way, or (c) owner restarts OpenClaw
gateway via tray and we verify :18789.

## 11. Success criteria check

Discovered: yes (492 installs + Store + portable + Start Menu).
Evidence statuses: yes (table above, no vague wording).
Configured: yes (section 4). Repaired: Docker, Cura chain, OpenClaw
triage, shortcuts. Compatible versions: GIMP 3.2.6, portable x64 CC,
kept older OpenSCAD 2021.01 (works). Removals: none justified.
Interop: section 7. Supervisors compared with real delegation: yes,
Hermes selected with reasons. Docker/WSL/K8s: commissioned. CAD:
commissioned to machine limits. Registries current: yes. Temp
reconciled: yes. Commits/pushes: see git log (SHAs verified below).
Remote verification: pending in terminal (recorded honestly).
Claimed scope: WORKSTATION COMMISSIONING only, not Genesis completion.

--- end of report (evidence: Temp logs under AppData Local Temp opencode,
registry diff in Agent-Bridge, test runs in CI-equivalent pytest) ---
