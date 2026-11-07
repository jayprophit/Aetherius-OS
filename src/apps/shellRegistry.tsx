import React from "react";

/**
 * Central shell registry for window-integrated app views.
 *
 * `src/main.tsx` renders windows via a switch. This registry is the typed
 * map for the 30 components that were unwired at the 2026-11-07 baseline,
 * so the launcher, menu bar and shell share one source of truth. Legacy
 * components that expect the old view-switcher props (`context` +
 * `onSetView`) are wrapped by `legacyWrapper`, which supplies an in-window
 * context and a no-escape `onSetView`: a legacy app cannot open a second
 * copy of itself or take the shell down.
 *
 * Each entry is `React.lazy` so a window only loads its own code when
 * opened. The error boundary + loading fallback live in `src/main.tsx`.
 */

type LegacyProps = {
  context: { menuItem: any };
  onSetView: (view: string, context?: any) => void;
};

const legacyWrapper = (
  Component: React.ComponentType<LegacyProps>,
  title: string
): React.FC => {
  const onSetView = (_view: string, _context?: any) => {
    // In-window navigation is handled by AppContainer itself. Shell-level
    // navigation (opening another app) is deliberately not exposed here.
  };
  const menuItem = { title, children: [] };
  return (
    <React.Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading {title}…</div>}>
      <Component context={{ menuItem }} onSetView={onSetView} />
    </React.Suspense>
  );
}

function lazyNamed<T extends Record<string, React.ComponentType<any>>>(
  loader: () => Promise<T>,
  key: keyof T,
) {
  return React.lazy(() => loader().then((m) => ({ default: m[key] })));
}

const TaskManager = lazyNamed(() => import("../../components/apps/TaskManager"), "TaskManager");
const SystemMonitor = lazyNamed(() => import("../../components/apps/SystemMonitor"), "SystemMonitor");
const SystemInfoApp = lazyNamed(() => import("../../components/apps/SystemInfoApp"), "SystemInfoApp");
const ServiceRegistry = lazyNamed(() => import("../../components/apps/ServiceRegistry"), "ServiceRegistry");
const CloudOpsApp = lazyNamed(() => import("../../components/apps/CloudOpsApp"), "CloudOpsApp");
const AiProductivityPlatform = lazyNamed(
  () => import("../../components/apps/AiProductivityPlatform"),
  "AiProductivityPlatform",
);
const AiSuiteApp = lazyNamed(() => import("../../components/apps/AiSuiteApp"), "AiSuiteApp");
const OmniDashboard = lazyNamed(() => import("../../components/apps/OmniDashboard"), "OmniDashboard");

const AccountApp = lazyNamed(() => import("../../components/apps/AccountApp"), "AccountApp");
const AppMarketApp = lazyNamed(() => import("../../components/apps/AppMarketApp"), "AppMarketApp");
const CareersApp = lazyNamed(() => import("../../components/apps/CareersApp"), "CareersApp");
const ContentGenApp = lazyNamed(() => import("../../components/apps/ContentGenApp"), "ContentGenApp");
const DevelopmentApp = lazyNamed(() => import("../../components/apps/DevelopmentApp"), "DevelopmentApp");
const ECommerceApp = lazyNamed(() => import("../../components/apps/ECommerceApp"), "ECommerceApp");
const ElearningApp = lazyNamed(() => import("../../components/apps/ElearningApp"), "ElearningApp");
const EngineeringApp = lazyNamed(() => import("../../components/apps/EngineeringApp"), "EngineeringApp");
const EnterpriseApp = lazyNamed(() => import("../../components/apps/EnterpriseApp"), "EnterpriseApp");
const FinanceApp = lazyNamed(() => import("../../components/apps/FinanceApp"), "FinanceApp");
const GamingApp = lazyNamed(() => import("../../components/apps/GamingApp"), "GamingApp");
const GuestOS = lazyNamed(() => import("../../components/apps/GuestOS"), "GuestOS");
const HealthApp = lazyNamed(() => import("../../components/apps/HealthApp"), "HealthApp");
const Hypervisor = lazyNamed(() => import("../../components/apps/Hypervisor"), "Hypervisor");
const MediaApp = lazyNamed(() => import("../../components/apps/MediaApp"), "MediaApp");
const OmniPlatformApp = lazyNamed(() => import("../../components/apps/OmniPlatformApp"), "OmniPlatformApp");
const OmniVisualBuilder = lazyNamed(() => import("../../components/apps/OmniVisualBuilder"), "OmniVisualBuilder");
const OperationsCenterApp = lazyNamed(
  () => import("../../components/apps/OperationsCenterApp"),
  "OperationsCenterApp",
);
const ProductivityApp = lazyNamed(() => import("../../components/apps/ProductivityApp"), "ProductivityApp");
const QuantumLabApp = lazyNamed(() => import("../../components/apps/QuantumLabApp"), "QuantumLabApp");
const RD_HubApp = lazyNamed(() => import("../../components/apps/RD_HubApp"), "RD_HubApp");
const SocialApp = lazyNamed(() => import("../../components/apps/SocialApp"), "SocialApp");

export interface ShellRegistryEntry {
  component: string;
  title: string;
  size?: { width: number; height: number };
  render: () => React.ReactNode;
}

/** The 30 previously-unwired components. */
export const SHELL_REGISTRY: ShellRegistryEntry[] = [
  { component: "aetherius-task-manager", title: "Task Manager", render: () => <TaskManager /> },
  { component: "aetherius-system-monitor", title: "System Monitor", render: () => <SystemMonitor /> },
  { component: "aetherius-system-info", title: "System Info", render: () => <SystemInfoApp /> },
  { component: "aetherius-services", title: "Service Registry", render: () => <ServiceRegistry /> },
  { component: "aetherius-cloud-ops", title: "Cloud Ops", size: { width: 760, height: 560 }, render: () => <CloudOpsApp /> },
  { component: "aetherius-ai-platform", title: "AI Productivity", size: { width: 760, height: 560 }, render: () => <AiProductivityPlatform /> },
  { component: "aetherius-ai-suite", title: "AI Studio", size: { width: 760, height: 560 }, render: () => <AiSuiteApp onSetView={() => {}} /> },
  { component: "aetherius-omni-dashboard", title: "Omni Dashboard", render: () => <OmniDashboard onLaunchBuilder={() => {}} /> },
  { component: "aetherius-omni-builder", title: "Visual Builder", size: { width: 860, height: 620 }, render: () => <OmniVisualBuilder onExit={() => {}} /> },
  { component: "aetherius-account", title: "Accounts", render: () => legacyWrapper(AccountApp, "Accounts")() },
  { component: "aetherius-app-market", title: "App Market", render: () => legacyWrapper(AppMarketApp, "App Market")() },
  { component: "aetherius-careers", title: "Careers", render: () => legacyWrapper(CareersApp, "Careers")() },
  { component: "aetherius-content-gen", title: "Content Studio", render: () => legacyWrapper(ContentGenApp, "Content Studio")() },
  { component: "aetherius-development", title: "Development", size: { width: 760, height: 560 }, render: () => legacyWrapper(DevelopmentApp, "Development")() },
  { component: "aetherius-commerce", title: "Commerce", size: { width: 760, height: 560 }, render: () => legacyWrapper(ECommerceApp, "Commerce")() },
  { component: "aetherius-elearning", title: "E-Learning", render: () => legacyWrapper(ElearningApp, "E-Learning")() },
  { component: "aetherius-engineering", title: "Engineering", render: () => legacyWrapper(EngineeringApp, "Engineering")() },
  { component: "aetherius-enterprise", title: "Enterprise", render: () => legacyWrapper(EnterpriseApp, "Enterprise")() },
  { component: "aetherius-finance", title: "Finance", size: { width: 760, height: 560 }, render: () => legacyWrapper(FinanceApp, "Finance")() },
  { component: "aetherius-gaming", title: "Gaming", render: () => legacyWrapper(GamingApp, "Gaming")() },
  { component: "aetherius-guest-os", title: "Guest OS", size: { width: 860, height: 620 }, render: () => legacyWrapper(GuestOS, "Guest OS")() },
  { component: "aetherius-health", title: "Health", render: () => legacyWrapper(HealthApp, "Health")() },
  { component: "aetherius-hypervisor", title: "Hypervisor", size: { width: 760, height: 560 }, render: () => <Hypervisor launchApp={() => {}} /> },
  { component: "aetherius-media", title: "Media", render: () => legacyWrapper(MediaApp, "Media")() },
  { component: "aetherius-omni-platform", title: "Omni Platform", size: { width: 860, height: 620 }, render: () => legacyWrapper(OmniPlatformApp, "Omni Platform")() },
  { component: "aetherius-operations", title: "Operations Center", render: () => legacyWrapper(OperationsCenterApp, "Operations Center")() },
  { component: "aetherius-productivity", title: "Productivity", render: () => legacyWrapper(ProductivityApp, "Productivity")() },
  { component: "aetherius-quantum-lab", title: "Quantum Lab", render: () => legacyWrapper(QuantumLabApp, "Quantum Lab")() },
  { component: "aetherius-rd-hub", title: "R&D Hub", render: () => legacyWrapper(RD_HubApp, "R&D Hub")() },
  { component: "aetherius-social", title: "Social", render: () => legacyWrapper(SocialApp, "Social")() },
];

export function findShellEntry(component: string): ShellRegistryEntry | undefined {
  return SHELL_REGISTRY.find((entry) => entry.component === component);
}
