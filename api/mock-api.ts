/** Mock API endpoints for Aetherius OS — created for simulation / testing.
 * Provides endpoints for Genesis integration, benchmark fixtures, and cross-platform deployment. */

export interface MockEndpoint {
  path: string; method: string; description: string; handler: () => any;
}

export const mockEndpoints: MockEndpoint[] = [
  { path: "/api/genesis/financial/state", method: "GET", description: "Genesis-Sovereign-Finance balance and audit summary", handler: () => ({ status: "ok", layer: "Genesis-Sovereign-Finance", balanceCheck: true }) },
  { path: "/api/genesis/financial/post", method: "POST", description: "Genesis-Sovereign-Finance post entry", handler: () => ({ status: "ok", event: "POST", audit: true }) },
  { path: "/api/genesis/trading/state", method: "GET", description: "Genesis-Trading-Bot paper state", handler: () => ({ status: "ok", layer: "Genesis-Trading-Bot", killSwitch: false }) },
  { path: "/api/genesis/trading/order", method: "POST", description: "Genesis-Trading-Bot paper order submit", handler: () => ({ status: "ok", event: "PAPER_ORDER", audit: true }) },
  { path: "/api/benchmark/fixtures", method: "GET", description: "List benchmark fixtures", handler: () => ({ fixtures: ["fix-docx-200", "fix-xlsx-1m", "fix-cad-brep"], allMeasured: false }) },
  { path: "/api/deploy/status", method: "GET", description: "Cross-platform deployment artifacts status", handler: () => ({ signedArtifacts: 0, formatsDefined: ["MSIX", "DEB", "RPM", "APK", "DMG"], installationsVerified: false }) },
];
