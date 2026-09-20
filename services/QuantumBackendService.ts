// QuantumBackendService proxy (P10). Mirrors the used surface; every call
// reports the backend as unreachable instead of simulating results.
export const quantumBackend = {
  async runQuantumTask(_task: string, _options?: any): Promise<never> {
    throw new Error("Aetherius backend unreachable: cannot run quantum task.");
  },
  async establishSecureChannel(): Promise<boolean> {
    return false;
  },
};
