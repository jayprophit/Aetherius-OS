import React, { useEffect, useState } from "react";
import { AppWindowIcon } from "../Icons";
import { PREFS_EVENT, windowPrefs, type WindowPrefs } from "../desktopPreferences";

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
    {children}
  </div>
);

const Toggle: React.FC<{ label: string; description: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className="font-medium text-gray-800 dark:text-gray-100">{label}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

/**
 * Window management: default size, edge snapping, animations.
 * Writes `aetherius.windows`; the shell reads it when opening windows.
 * The web preview cannot control OS-level window rules, so the page says
 * it only governs in-shell windows.
 */
export const WindowSettings: React.FC<{ title: string }> = ({ title }) => {
  const [prefs, setPrefs] = useState<WindowPrefs>(() => windowPrefs.read());

  useEffect(() => {
    const onPrefs = () => setPrefs(windowPrefs.read());
    window.addEventListener(PREFS_EVENT, onPrefs);
    return () => window.removeEventListener(PREFS_EVENT, onPrefs);
  }, []);

  const update = (patch: Partial<WindowPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    windowPrefs.write(next);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-3 px-1 text-3xl font-bold text-gray-800 dark:text-gray-100">
        <AppWindowIcon className="h-8 w-8 text-blue-500" />
        {title}
      </h1>
      <Card title="App windows">
        <div className="py-2">
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Default window size</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["compact", "Compact (480×360)"],
                ["standard", "Standard (560×420)"],
                ["large", "Large (760×560)"],
              ] as Array<[WindowPrefs["defaultSize"], string]>
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => update({ defaultSize: value })}
                aria-pressed={prefs.defaultSize === value}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  prefs.defaultSize === value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            New windows open at this size unless the app needs more (Genesis Human opens larger). Drag the title bar to
            move a window; drag the bottom-right corner to resize; double-click the title bar to maximise.
          </p>
        </div>
        <Toggle label="Snap to edges" description="Dragging a window to a screen edge snaps it to that half." value={prefs.snapToEdges} onChange={(v) => update({ snapToEdges: v })} />
        <Toggle label="Window animations" description="Fade/slide animation when windows open." value={prefs.animations} onChange={(v) => update({ animations: v })} />
      </Card>
      <Card title="Scope">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          These controls govern windows inside the Aetherius web preview only. The browser and the host operating
          system keep their own window rules.
        </p>
      </Card>
    </div>
  );
};
