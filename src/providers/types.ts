// Provider contracts (P10-PROVIDERS). UI depends on these, never on demo data.
export type ProviderState =
  | "AVAILABLE"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "ERROR"
  | "SIMULATED";

export type ProviderKind =
  | "REAL_LOCAL"
  | "REMOTE"
  | "SIMULATED"
  | "UNAVAILABLE";

export interface ProviderReport {
  id: string;
  kind: ProviderKind;
  state: ProviderState;
  detail: string;
  latencyMs: number | null;
  updatedAt: string;
  errorCode: string | null;
  errorDetail: string | null;
}

export interface Provider {
  readonly id: string;
  readonly kind: ProviderKind;
  describe(): string;
  check(signal?: AbortSignal): Promise<ProviderReport>;
}

export function baseReport(
  id: string,
  kind: ProviderKind,
  partial: Partial<ProviderReport> & { state: ProviderState; detail: string },
): ProviderReport {
  return {
    id,
    kind,
    latencyMs: null,
    updatedAt: new Date().toISOString(),
    errorCode: null,
    errorDetail: null,
    ...partial,
  };
}
