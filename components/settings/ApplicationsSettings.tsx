import React, { useMemo, useState } from "react";
import { Squares2X2Icon, SearchIcon } from "../Icons";
import { APP_CATALOGUE, type CatalogueEntry } from "../../src/apps/catalogue";

/**
 * Applications catalogue.
 *
 * Generated from the slices on disk by scripts/generate-app-catalogue.mjs.
 * Shows every directory under apps/ — including absorbed products and
 * engine stubs — with the status its own build manifest declares.
 */

const KIND_LABELS: Record<CatalogueEntry["kind"], string> = {
  application: "Application",
  library: "Library",
  engine: "Engine",
  product: "Product",
  placeholder: "Placeholder",
};

const STATUS_STYLES: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  TESTED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  PARTIAL: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  PLAN: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  NOT_STARTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  UNSET: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  VERIFIED: "Verified",
  TESTED: "Tested",
  PARTIAL: "Partial",
  PLAN: "Planned",
  NOT_STARTED: "Not started",
  UNSET: "No manifest",
};

export const ApplicationsSettings: React.FC<{ title: string }> = ({ title }) => {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");

  const counts = useMemo(() => {
    const byKind = new Map<string, number>();
    for (const entry of APP_CATALOGUE) {
      byKind.set(entry.kind, (byKind.get(entry.kind) ?? 0) + 1);
    }
    return byKind;
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return APP_CATALOGUE.filter((entry) => {
      if (kindFilter !== "all" && entry.kind !== kindFilter) return false;
      if (!needle) return true;
      return (
        entry.directory.toLowerCase().includes(needle) ||
        entry.name.toLowerCase().includes(needle) ||
        (entry.description ?? "").toLowerCase().includes(needle)
      );
    });
  }, [query, kindFilter]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-3 px-1 text-3xl font-bold text-gray-800 dark:text-gray-100">
        <Squares2X2Icon className="h-8 w-8 text-blue-500" />
        {title}
      </h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          {APP_CATALOGUE.length} applications and products on disk
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generated from <span className="font-mono">apps/</span> by{" "}
          <span className="font-mono">scripts/generate-app-catalogue.mjs</span>.
          Status is the state each directory&apos;s own build manifest declares.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {[...counts.entries()].map(([kind, count]) => (
            <span
              key={kind}
              className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            >
              {KIND_LABELS[kind as CatalogueEntry["kind"]]}: {count}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative min-w-52 flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter applications"
              className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm dark:border-gray-600 dark:bg-gray-700/50"
            />
          </div>
          <select
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700/50"
          >
            <option value="all">All kinds</option>
            <option value="application">Applications</option>
            <option value="library">Libraries</option>
            <option value="engine">Engines</option>
            <option value="product">Products</option>
            <option value="placeholder">Placeholders</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Kind</th>
              <th className="px-4 py-3 font-semibold">Manifest status</th>
              <th className="px-4 py-3 font-semibold">Tests</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {visible.map((entry) => {
              const statusStyle = STATUS_STYLES[entry.status ?? "UNSET"] ?? STATUS_STYLES.UNSET;
              const statusLabel = STATUS_LABELS[entry.status ?? "UNSET"] ?? entry.status;
              return (
                <tr key={entry.directory} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 dark:text-gray-100">{entry.name}</div>
                    <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      apps/{entry.directory}
                      {entry.packageName ? ` · ${entry.packageName}` : ""}
                    </div>
                    {entry.description && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{entry.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {KIND_LABELS[entry.kind]}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyle}`}>
                      {statusLabel}
                    </span>
                    {entry.lastVerified && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{entry.lastVerified}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {entry.testFiles > 0 ? `${entry.testFiles} file(s)` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No applications match the current filter.
          </p>
        )}
      </div>
    </div>
  );
};
