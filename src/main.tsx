import React from "react";
import { createRoot } from "react-dom/client";
import { Desktop } from "../components/Desktop";
import { TopBar } from "../components/TopBar";
import { Taskbar } from "../components/Taskbar";
import type { LaunchableApp } from "../App";

function launchApp(_app: LaunchableApp): void {}

function Shell() {
  return (
    <div>
      <div role="status">
        Backend unreachable — showing empty shell. No demo data.
      </div>
      <TopBar />
      <Desktop launchApp={launchApp} />
      <Taskbar
        windows={[]}
        pinnedAppIds={[]}
        onFocus={() => {}}
        activeWindowId={null}
        activeWorkspace={0}
        onSwitchWorkspace={() => {}}
        config={{} as any}
        onLaunchApp={launchApp}
        onTogglePin={() => {}}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Shell />
  </React.StrictMode>,
);
