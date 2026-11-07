/// <reference types="vite/client" />
import './index.css';
import React, { useMemo, useState, useCallback } from "react";
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
import { mainMenuItems } from "../data";
import type { LaunchableApp } from "../App";
import { RecorderApp } from "../components/apps/RecorderApp";
import { NotesApp } from "../components/apps/NotesApp";
import { WriterApp } from "../components/apps/WriterApp";
import { SheetsApp } from "../components/apps/SheetsApp";
import { SlidesApp } from "../components/apps/SlidesApp";
import { CanvasApp } from "../components/apps/CanvasApp";
import { SettingsView } from "../components/settings/SettingsModal";

/**
 * Isolates a failing app view so one bad window cannot take the shell down.
 */
interface AppErrorBoundaryProps {
  title: string;
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

// The repo does not carry full @types/react (React ships no types), so the
// React.Component base class does not typecheck with `this.props`. Using the
// base through the untyped escape hatch is deliberate: an error boundary is
// the one place a class component is unavoidable.
const ReactComponentBase: any = React.Component;

class AppErrorBoundary extends ReactComponentBase {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: "" } as AppErrorBoundaryState;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message ?? "unknown error" };
  }

  render() {
    const state = this.state as AppErrorBoundaryState;
    const props = this.props as AppErrorBoundaryProps;
    if (state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-6 text-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{props.title} stopped</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              The view hit an error and was closed safely. The shell is unaffected.
            </p>
            <p className="mt-2 font-mono text-xs text-red-600 dark:text-red-400">{state.message}</p>
          </div>
        </div>
      );
    }
    return props.children;
  }
}

export interface AppWindow {
  id: string;
  component: string;
  title: string;
  icon: React.FC<any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

let nextZ = 100;
let nextWindowId = 1;

function Shell() {
  const { registry, pollMs } = useProviders();
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [zoom, setZoom] = useState(1);

  const apps = useMemo<LaunchableApp[]>(() => {
    const byComponent = new Map<string, LaunchableApp>();
    for (const group of mainMenuItems) {
      for (const child of group?.children ?? []) {
        if (child?.component && child?.title && child?.icon) {
          byComponent.set(child.component, {
            component: child.component,
            title: child.title,
            icon: child.icon,
            context: { menuItem: child },
          });
        }
      }
    }
    return [...byComponent.values()];
  }, []);

  const renderAppButton = (app: LaunchableApp, className: string) => {
    const Icon = app.icon;
    return (
      <button key={app.component} onClick={() => launchApp(app)} className={className} title={`Open ${app.title}`}>
        <Icon className="w-5 h-5" />
        <span>{app.title}</span>
      </button>
    );
  };

  const launchApp = useCallback((app: LaunchableApp) => {
    const existing = windows.find((w) => w.component === app.component);
    if (existing) {
      setActiveWindowId(existing.id);
      setWindows((prev) => prev.map((w) => (w.id === existing.id ? { ...w, isMinimized: false } : w)));
      return;
    }

    const id = `win-${nextWindowId++}`;
    const newWindow: AppWindow = {
      id,
      component: app.component,
      title: app.title || "App",
      icon: app.icon || (() => null),
      position: { x: 80 + windows.length * 30, y: 80 + windows.length * 30 },
      size: { width: 800, height: 600 },
      zIndex: nextZ++,
      isMinimized: false,
      isMaximized: false,
    };
    setWindows((prev) => [...prev, newWindow]);
    setActiveWindowId(id);
  }, [windows]);

  const handleFocus = useCallback((id: string) => {
    setActiveWindowId(id);
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const updated = { ...w, isMinimized: false, zIndex: nextZ++ };
        return updated;
      })
    );
  }, []);

  const handleClose = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  }, [activeWindowId]);

  const handleTogglePin = useCallback((appId: string) => {
    setPinnedAppIds((prev) => (prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]));
  }, []);

  const renderAppContent = (win: AppWindow) => {
    let view: React.ReactNode;
    switch (win.component) {
      case "aetherius-recorder":
        view = <RecorderApp />;
        break;
      case "aetherius-notes":
        view = <NotesApp />;
        break;
      case "aetherius-writer":
        view = <WriterApp />;
        break;
      case "aetherius-sheets":
        view = <SheetsApp />;
        break;
      case "aetherius-slides":
        view = <SlidesApp />;
        break;
      case "aetherius-canvas":
        view = <CanvasApp />;
        break;
      case "settings":
        view = <SettingsView />;
        break;
      default:
        view = (
          <div className="flex h-full items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-bold">Component Not Found</h3>
              <p className="text-sm">The view "{win.component}" is not registered.</p>
            </div>
          </div>
        );
    }
    return <AppErrorBoundary title={win.title}>{view}</AppErrorBoundary>;
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden" style={{ zoom } as React.CSSProperties}>
      <div role="status" className="sr-only">Local-first shell. Provider-dependent data stays empty until a backend is connected.</div>
      <ProviderStatus registry={registry} pollMs={pollMs} />
      <TopBar
        toggleLeftSidebar={() => setSidebarOpen((open) => !open)}
        onLaunchApp={launchApp}
        contextualActions={[]}
        aetheriusMenu={mainMenuItems}
        zoom={zoom}
        onZoom={(next) => setZoom(Math.min(5, Math.max(0.25, next)))}
        viewMode={viewMode}
        onToggleViewMode={() =>
          setViewMode((mode) => (mode === "desktop" ? "mobile" : "desktop"))
        }
        onToggleNotifications={() => setNotificationsOpen((open) => !open)}
      />

      {sidebarOpen && (
        <aside className="fixed left-0 top-16 bottom-12 z-40 w-64 overflow-y-auto border-r border-gray-200 bg-white/95 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/95">
          <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Applications
          </p>
          <nav className="flex flex-col gap-1 p-2">
            {apps.map((app) =>
              renderAppButton(
                app,
                "flex items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10",
              ),
            )}
          </nav>
        </aside>
      )}

      {notificationsOpen && (
        <div className="fixed right-4 top-20 z-40 w-80 rounded-md border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/95">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Notifications</h2>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="rounded px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            No notifications. Provider events will appear here when a backend is connected.
          </p>
        </div>
      )}

      <main className="relative flex-1 overflow-hidden">
        {viewMode === "desktop" ? (
          <Desktop launchApp={launchApp} />
        ) : (
          <div className="grid h-full grid-cols-2 content-start gap-4 overflow-auto p-6 sm:grid-cols-3 md:grid-cols-4">
            {apps.map((app) =>
              renderAppButton(
                app,
                "flex flex-col items-center gap-2 rounded p-4 text-sm hover:bg-black/5 dark:hover:bg-white/10",
              ),
            )}
          </div>
        )}
      </main>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 50 }}>
        {windows.map((win) => (
          <div
            key={win.id}
            className="absolute pointer-events-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-2xl flex flex-col"
            style={{
              left: win.position.x,
              top: win.position.y,
              width: win.size.width,
              height: win.size.height,
              zIndex: win.zIndex,
              display: win.isMinimized ? "none" : "flex",
            }}
            onMouseDown={() => handleFocus(win.id)}
          >
            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 select-none">
              <div className="flex items-center gap-2">
                {win.icon && <win.icon className="w-4 h-4" />}
                <span className="text-sm font-medium">{win.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isMinimized: !w.isMinimized } : w)))}
                  className="px-2 py-0.5 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  _
                </button>
                <button
                  onClick={() => handleClose(win.id)}
                  className="px-2 py-0.5 text-xs hover:bg-red-500 hover:text-white rounded"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">{renderAppContent(win)}</div>
          </div>
        ))}
      </div>
      <div className="h-12 shrink-0">
        <Taskbar
          windows={windows}
          pinnedAppIds={pinnedAppIds}
          onFocus={handleFocus}
          activeWindowId={activeWindowId}
          activeWorkspace={0}
          onSwitchWorkspace={() => {}}
          config={{} as any}
          onLaunchApp={launchApp}
          onTogglePin={handleTogglePin}
        />
      </div>
    </div>
  );
}

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

declare const __AETHERIUS_BUILD_ID__: string;

// Expose which production bundle is live. Deployment checks and the rollback
// drill read this attribute; it is not a user-facing feature.
document.documentElement.dataset.aetheriusBuildId = __AETHERIUS_BUILD_ID__;

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Shell />
  </React.StrictMode>
);

function registerServiceWorker() {
  navigator.serviceWorker
    .register(new URL("sw.js", document.baseURI))
    .catch((error) => {
      console.warn("Aetherius service worker registration failed", error);
    });
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  if (document.readyState === "complete") {
    registerServiceWorker();
  } else {
    window.addEventListener("load", registerServiceWorker, { once: true });
  }
}
