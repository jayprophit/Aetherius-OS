import React, { useEffect, useState } from "react";
import { SettingsStore, type ShellSettings } from "../../src/settings/store";

/**
 * Shell settings. Backed by the real SettingsStore (localStorage with
 * validation), so every value here is the value the shell is using.
 */
export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<ShellSettings>(() => new SettingsStore().get());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(new SettingsStore().get());
  }, []);

  const update = (patch: Partial<ShellSettings>) => {
    const next = new SettingsStore().update(patch);
    setSettings(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Shell</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Stored locally and validated on load. These are the values the shell
          is using right now.
        </p>

        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Theme
            <select
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700/60"
              value={settings.theme}
              onChange={(event) => update({ theme: event.target.value as ShellSettings["theme"] })}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Provider status poll interval (milliseconds)
            <input
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700/60"
              type="number"
              min={1000}
              max={300000}
              value={settings.providerPollMs}
              onChange={(event) => update({ providerPollMs: Number(event.target.value) })}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Allowed range is 1,000–300,000 ms. Out-of-range values fall back to 15,000 ms.
            </span>
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Agent Bridge endpoint
            <input
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700/60"
              value={settings.bridgeEndpoint}
              onChange={(event) => update({ bridgeEndpoint: event.target.value })}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Loopback only — `http://127.0.0.1` or `http://localhost`.
            </span>
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            MAT endpoint
            <input
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700/60"
              value={settings.matEndpoint}
              onChange={(event) => update({ matEndpoint: event.target.value })}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Loopback only — `http://127.0.0.1` or `http://localhost`.
            </span>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              onClick={() => update({})}
            >
              Reset to defaults
            </button>
            {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved.</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
