import React, { useEffect, useState } from "react";
import type { ProviderReport } from "../src/providers/types";
import type { ProviderRegistry } from "../src/providers/registry";

interface ProviderStatusProps {
  registry: ProviderRegistry;
  pollMs?: number;
}

export const ProviderStatus: React.FC<ProviderStatusProps> = ({ registry, pollMs = 15000 }) => {
  const [reports, setReports] = useState<Record<string, ProviderReport>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const next = await registry.checkAll();
        if (!cancelled) {
          setReports(next);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };
    poll();
    const timer = setInterval(poll, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [registry, pollMs]);

  if (error) {
    return <div role="alert">Provider poll failed: {error}</div>;
  }
  return (
    <section aria-label="Provider status">
      {Object.values(reports).map((report: ProviderReport) => (
        <div key={report.id} data-provider={report.id} data-state={report.state}>
          <span>{report.id}</span>
          <span>{report.kind}</span>
          <span>{report.state}</span>
          <span>{report.detail}</span>
          {report.errorCode && <span>{report.errorCode}</span>}
        </div>
      ))}
    </section>
  );
};
