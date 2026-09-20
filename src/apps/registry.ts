// Canonical application registry (P10). Metadata only; launch and health
// come from defined interfaces, not hardcoded component wiring.
export type AppStatus = "registered" | "available" | "unavailable";

export interface AppEntry {
  id: string;
  name: string;
  version: string;
  owner: string;
  entrypoint: string;
  icon: string | null;
  capabilities: string[];
  permissions: string[];
  platforms: string[];
  status: AppStatus;
  launch: { kind: "repo" | "url" | "command"; target: string };
  healthEndpoint: string | null;
}

export const APPLICATIONS: AppEntry[] = [
  {
    id: "genesis",
    name: "Genesis",
    version: "0.31.0",
    owner: "Aetherius",
    entrypoint: "tools/genesis_runtime_host",
    icon: null,
    capabilities: ["organism-runtime", "memory", "cognition"],
    permissions: ["local-process"],
    platforms: ["windows", "linux"],
    status: "registered",
    launch: { kind: "repo", target: "Genesis" },
    healthEndpoint: null,
  },
  {
    id: "agent-bridge",
    name: "Agent Bridge",
    version: "v1",
    owner: "Aetherius",
    entrypoint: "cli.py serve",
    icon: null,
    capabilities: ["tool-execution", "sessions", "approvals"],
    permissions: ["loopback-http", "workspace-scoped-fs"],
    platforms: ["windows", "linux", "macos"],
    status: "available",
    launch: { kind: "repo", target: "Agent-Bridge" },
    healthEndpoint: "http://127.0.0.1:8471/health",
  },
  {
    id: "mat",
    name: "MAT",
    version: "1.0.0",
    owner: "Aetherius",
    entrypoint: "scripts/mat-query-service.mjs --serve",
    icon: null,
    capabilities: ["material-query", "search", "provenance"],
    permissions: ["loopback-http", "read-only-data"],
    platforms: ["windows", "linux", "macos"],
    status: "available",
    launch: { kind: "repo", target: "Materials-Atlas-Table-Codex---MAT" },
    healthEndpoint: "http://127.0.0.1:8472/health",
  },
  {
    id: "ide-workspace",
    name: "IDE Workspace",
    version: "0.8.1",
    owner: "Aetherius",
    entrypoint: "workspace/app",
    icon: null,
    capabilities: ["editor", "presence", "bridge-client"],
    permissions: ["workspace-scoped-fs"],
    platforms: ["windows", "linux", "macos", "web"],
    status: "registered",
    launch: { kind: "repo", target: "IDE-Workspace" },
    healthEndpoint: null,
  },
  {
    id: "poietek",
    name: "Poietek",
    version: "1.0.0",
    owner: "Aetherius",
    entrypoint: "scripts/build-web.mjs",
    icon: null,
    capabilities: ["daw", "audio", "session"],
    permissions: ["audio-device", "local-fs"],
    platforms: ["windows", "linux", "macos", "web"],
    status: "registered",
    launch: { kind: "repo", target: "Poietek" },
    healthEndpoint: null,
  },
  {
    id: "universal-bridge",
    name: "Universal-Bridge",
    version: "0.5.0",
    owner: "Aetherius",
    entrypoint: "ubridge devices",
    icon: null,
    capabilities: ["midi", "mpc", "daw-interop"],
    permissions: ["local-process", "midi-device"],
    platforms: ["windows", "linux", "macos"],
    status: "registered",
    launch: { kind: "repo", target: "Universal-Bridge" },
    healthEndpoint: null,
  },
];

export function getApp(id: string): AppEntry | undefined {
  return APPLICATIONS.find((app) => app.id === id);
}

export function listApps(): AppEntry[] {
  return [...APPLICATIONS];
}
