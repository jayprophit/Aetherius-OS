import React, { useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Desktop } from "../components/Desktop";
import { TopBar } from "../components/TopBar";
import { Taskbar } from "../components/Taskbar";
import { ProviderStatus } from "../components/ProviderStatus";
import { ProviderRegistry } from "./providers/registry";
import { createAgentBridgeProvider } from "./providers/agentBridge";
import { createMatProvider } from "./providers/mat";
import { createComputeProvider } from "./providers/compute";
import { createGenesisProvider } from "./providers/genesis";
import { createIdeProvider } from "./providers/ide";
import type { LaunchableApp } from "../App";

function launchApp(_app: LaunchableApp): void {}

function useProviders(): ProviderRegistry {
  return useMemo(() => {
    const registry = new ProviderRegistry();
    registry.register(createAgentBridgeProvider());
    registry.register(createMatProvider());
    registry.register(createComputeProvider());
    registry.register(createGenesisProvider());
    registry.register(createIdeProvider());
    return registry;
  }, []);
}

function Shell() {
  const registry = useProviders();
  return (
    <div>
      <div role="status">
        Backend unreachable — showing empty shell. No demo data.
      </div>
      <ProviderStatus registry={registry} />
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
