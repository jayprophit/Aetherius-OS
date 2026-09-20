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
import { SettingsStore } from "./settings/store";
import type { LaunchableApp } from "../App";

function launchApp(_app: LaunchableApp): void {}

function useProviders(): { registry: ProviderRegistry; pollMs: number } {
  return useMemo(() => {
    const settings = new SettingsStore().get();
    const registry = new ProviderRegistry();
    registry.register(createAgentBridgeProvider(settings.bridgeEndpoint));
    registry.register(createMatProvider(settings.matEndpoint));
    registry.register(createComputeProvider());
    registry.register(createGenesisProvider());
    registry.register(createIdeProvider());
    return { registry, pollMs: settings.providerPollMs };
  }, []);
}

function Shell() {
  const { registry, pollMs } = useProviders();
  return (
    <div>
      <div role="status">
        Backend unreachable — showing empty shell. No demo data.
      </div>
      <ProviderStatus registry={registry} pollMs={pollMs} />
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
