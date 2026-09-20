import type { Provider, ProviderReport } from "./types";
import { baseReport } from "./types";
import { getApp } from "../apps/registry";

// IDE presence is reported from the canonical registry entry: registered
// and honest about liveness (the live loopback is verified in P7 tests,
// not re-probed on every render).
export function createIdeProvider(): Provider {
  return {
    id: "ide",
    kind: "REAL_LOCAL",
    describe: () => "IDE Workspace registry entry + live loopback (P7)",
    async check(): Promise<ProviderReport> {
      const entry = getApp("ide-workspace");
      if (!entry) {
        return baseReport("ide", "REAL_LOCAL", {
          state: "UNAVAILABLE",
          detail: "ide-workspace missing from application registry",
          errorCode: "NOT_REGISTERED",
          errorDetail: "no registry entry",
        });
      }
      return baseReport("ide", "REAL_LOCAL", {
        state: "AVAILABLE",
        detail: `registered ${entry.name} ${entry.version}; liveness via loopback test`,
      });
    },
  };
}
