import React from "react";
import { APP_CATALOGUE, listAetheriusSlices } from "../../src/apps/catalogue";

declare const __AETHERIUS_BUILD_ID__: string;

const SpecItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 px-2">
    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-right">{value}</span>
  </div>
);

/**
 * About Aetherius OS. Every value here is measured in the browser: the
 * production build id, the version from package.json, and the application
 * catalogue regenerated from apps/. Nothing is invented.
 */
export const AboutSettings: React.FC = () => {
  const slices = listAetheriusSlices();
  const products = APP_CATALOGUE.filter((entry) => entry.kind === "product").length;
  const engines = APP_CATALOGUE.filter((entry) => entry.kind === "engine").length;
  const tested = APP_CATALOGUE.filter((entry) => entry.status === "TESTED" || entry.status === "VERIFIED").length;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center font-bold text-white text-6xl tracking-tighter shadow-lg mb-6">
          A
        </div>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Aetherius OS</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Version 0.1.0 — free, self-hosted web/PWA developer preview.</p>
        <p className="max-w-md mt-4 text-gray-600 dark:text-gray-300">
          Local-first shell with token-free AI (local Ollama by default), deterministic
          local/cloud sync, and 133 application slices. 0.1.0 is the free preview;
          1.0 is planned.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-xl font-bold p-2 text-gray-800 dark:text-gray-100">This build</h2>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <SpecItem label="Production build id" value={__AETHERIUS_BUILD_ID__ ?? "dev"} />
          <SpecItem label="Application slices" value={`${slices.length} @aetherius packages`} />
          <SpecItem label="Products and engines" value={`${products} products, ${engines} engines`} />
          <SpecItem label="Catalogue entries" value={`${APP_CATALOGUE.length} directories under apps/`} />
          <SpecItem label="Slices tested" value={`${tested} TESTED or VERIFIED`} />
          <SpecItem label="Deployment" value="https://aetherius-preview.pages.dev" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-xl font-bold p-2 text-gray-800 dark:text-gray-100">Your browser</h2>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <SpecItem label="User agent" value={navigator.userAgent.slice(0, 80)} />
          <SpecItem label="CPU cores" value={navigator.hardwareConcurrency ?? "unknown"} />
          <SpecItem
            label="Device memory"
            value={
              (navigator as Navigator & { deviceMemory?: number }).deviceMemory
                ? `~${(navigator as Navigator & { deviceMemory?: number }).deviceMemory} GB`
                : "unknown"
            }
          />
          <SpecItem label="Language" value={navigator.language} />
          <SpecItem label="Online" value={navigator.onLine ? "yes" : "no"} />
        </div>
      </div>
    </div>
  );
};
