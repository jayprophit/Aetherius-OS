import type { Provider, ProviderReport } from "./types";
import { baseReport } from "./types";

// Genesis has no HTTP surface: genesis_runtime_host is a CLI whose lifecycle
// is verified via the P14 E2E. This provider reports that honestly instead
// of inventing runtime state.
export function createGenesisProvider(): Provider {
  return {
    id: "genesis",
    kind: "UNAVAILABLE",
    describe: () => "Genesis organism runtime (CLI-verified, no HTTP transport)",
    async check(): Promise<ProviderReport> {
      return baseReport("genesis", "UNAVAILABLE", {
        state: "UNAVAILABLE",
        detail: "no HTTP transport; lifecycle verified via runtime host CLI (P14)",
        errorCode: "NO_TRANSPORT",
        errorDetail: "genesis_runtime_host exposes boot/event/checkpoint over CLI only",
      });
    },
  };
}
