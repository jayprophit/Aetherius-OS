# OmniAgent prototype — reference index and provenance

`REQ-omniagent-reference-index`. A **read-only** index of an external prototype,
plus the record of why that prototype is deliberately not part of this
repository.

## What the material is

| Field | Value |
| --- | --- |
| Name (as shipped) | `react-example` |
| Version | `0.0.0`, `private: true` |
| Hosted at | `https://ai.studio/apps/72382b85-5abd-4c0d-9639-9b14edcc361d` |
| Generator | Google AI Studio applet scaffold (`@google/genai`, `express`, `vite`, `react 19`) |
| Declared capabilities | `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`; `requestFramePermissions: ["camera", "microphone"]` |
| Local copy | `Genesis/references/omniagent-runtime-&-workspace/` (47 files, ~6.2 MB) |
| Licence | **none present in the tree** |

## Classification

**THIRD-PARTY VENDORED SOURCE — untracked, unlicensed, and deliberately not
committed.**

Three independent facts establish this, and each was verified rather than
assumed:

1. It is an unmodified vendor scaffold: `package.json` still reads
   `"name": "react-example"`, `"version": "0.0.0"`, `"private": true`.
2. Its README points at a Google-hosted AI Studio app rather than any
   first-party origin.
3. **There is no `LICENSE` file anywhere in the tree.** Committing
   third-party source of unknown licence into a programme repository is not
   something an agent should do on its own initiative.

`Genesis/references/` is *not* gitignored — the tree is untracked but not
ignored, so a careless `git add` would put unlicensed third-party code into
source control. `docs/omniagent-reference.provenance.test.ts` exists to make
that failure loud.

## Why it is not made reproducible

The reproducibility requirement applies to **capabilities the programme
ships**. This prototype is not one: it is a reference that was reviewed. What
is reproducible is *this index and the first-party code it points at* — not a
byte-identical copy of someone else's unlicensed applet.

Recording a URL, a component inventory and a disposition is durable evidence.
Committing 6 MB of unlicensed third-party React would not be.

## Component inventory (24 components, read-only review)

`AetheriusAdminPanel`, `AIVideoCallModal`, `AuditLogView`, `BottomDockPanel`,
`ChatWorkspace`, `DesktopBridgeView`, `FileExplorerTree`, `Header`,
`IDEMenuBar`, `LiveWorkSurface`, `MemoryInspector`, `ModelAdapterHub`,
`NovaAvatarView`, `NovaTeamWorkspace`, `OELifeAmplifiedDashboard`,
`OwnedLayerBlueprint`, `RightSidebarSurface`, `RoutinesScheduler`,
`SetupConfigModal`, `Sidebar`, `SkillsLibrary`, `SubAgentsTeam`,
`UniversalWorkspaceView`, `VoiceCallModal`, `WorkspaceHealthDashboard`,
plus `App.tsx`, `types.ts`, `src/data/mockInitialData.ts`, `server.ts`.

## Disposition of the useful surfaces

The prototype's genuinely useful surfaces correspond to capabilities that
**already exist as tracked, tested first-party code** in
`IDE-Workspace/workspace/app/src/`. Verified by file inspection:

| Prototype component | Tracked first-party equivalent | Tests |
| --- | --- | --- |
| `ModelAdapterHub.tsx` | `model-center/ModelCenter.tsx` | `App.test.tsx` (48 tests) |
| `FileExplorerTree.tsx` | `components/FileExplorer.tsx` | `App.test.tsx` |
| `Terminal` (prototype workspace) | `components/Terminal.tsx` | `App.test.tsx` |
| `ChatWorkspace.tsx`, `Sidebar.tsx`, `RightSidebarSurface.tsx`, `BottomDockPanel.tsx` | `App.tsx` + `workspace/state.ts` | `App.test.tsx`, `workspace/state.test.ts` |
| `DesktopBridgeView.tsx` | `bridge.ts` | `App.test.tsx` |
| `SubAgentsTeam.tsx`, `LiveWorkSurface.tsx` | `task-center/TaskCenter.tsx` | `App.test.tsx` |
| `IDEMenuBar.tsx` | `IDEMenuBar` layout in `App.tsx` | `App.test.tsx` |
| `MemoryInspector.tsx` | `inspection.ts` | `inspection.test.ts` |
| `UniversalWorkspaceView.tsx`, `DetachedView` | `DetachedView.tsx`, `workspace/detach.ts` | `workspace/detach.test.ts` |

The correspondence is recorded as *review outcome*, not asserted lineage: the
equivalent capability exists as tracked code, and the prototype supplied no
code that was copied.

## What was deliberately NOT adopted

Both are unacceptable for this programme, and neither appears in tracked code:

- **Server-side Gemini API key.** The prototype declares
  `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. A server-held model key is a
  credential-ownership problem. `IDE-Workspace` contains **no** reference to
  `gemini` or `@google/genai` (verified by search).
- **Camera / microphone frame permissions.** Declared via
  `requestFramePermissions`. No tracked IDE code calls `getUserMedia` or
  requests device permissions (verified by search).

The prototype is therefore not a dependency, not a source, and not a
capability. It is a record of what was looked at and what was refused.

## If the reference is ever needed again

Re-fetch it from the AI Studio app id above. Do not commit it. If a
first-party feature genuinely needs one of these surfaces, implement it in
the owning repository — the tracked equivalents already exist for most of
them.
