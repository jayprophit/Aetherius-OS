import React, { useEffect, useState } from "react";
import { CursorArrowRaysIcon } from "../Icons";
import { PREFS_EVENT, inputPrefs, type InputPrefs } from "../desktopPreferences";

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
 * Mouse, keyboard and touch in-shell input behaviour.
 * Every control writes `aetherius.input`. The preview cannot change
 * hardware-level pointer speed or keyboard repeat — the page says so.
 */
export const InputSettings: React.FC<{ title: string }> = ({ title }) => {
  const [prefs, setPrefs] = useState<InputPrefs>(() => inputPrefs.read());

  useEffect(() => {
    const onPrefs = () => setPrefs(inputPrefs.read());
    window.addEventListener(PREFS_EVENT, onPrefs);
    return () => window.removeEventListener(PREFS_EVENT, onPrefs);
  }, []);

  const update = (patch: Partial<InputPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    inputPrefs.write(next);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-3 px-1 text-3xl font-bold text-gray-800 dark:text-gray-100">
        <CursorArrowRaysIcon className="h-8 w-8 text-blue-500" />
        {title}
      </h1>
      <Card title="Mouse and touch">
        <div className="py-2">
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Touch long-press for context menu: {prefs.longPressMs} ms
          </p>
          <input
            type="range"
            min={300}
            max={900}
            step={50}
            value={prefs.longPressMs}
            onChange={(event) => update({ longPressMs: Number(event.target.value) })}
            className="w-full"
            aria-label="Touch long-press duration"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Press and hold on the desktop or a window for this long to open the right-click menu on a tablet or phone.
            Right-click and two-finger click open it instantly with a mouse or trackpad.
          </p>
        </div>
        <div className="py-2">
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Drag threshold: {prefs.dragThresholdPx} px
          </p>
          <input
            type="range"
            min={2}
            max={12}
            step={1}
            value={prefs.dragThresholdPx}
            onChange={(event) => update({ dragThresholdPx: Number(event.target.value) })}
            className="w-full"
            aria-label="Drag threshold"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Movement below this distance counts as a click, not a drag.
          </p>
        </div>
        <div className="py-2">
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Touch target size</p>
          <div className="flex gap-2">
            {(
              [
                ["standard", "Standard"],
                ["large", "Large (tablets)"],
              ] as Array<[InputPrefs["touchTargets"], string]>
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => update({ touchTargets: value })}
                aria-pressed={prefs.touchTargets === value}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  prefs.touchTargets === value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Toggle label="Show keyboard hints" description="Holds the shortcuts list in menus where the platform supports it." value={prefs.showKeyboardHints} onChange={(v) => update({ showKeyboardHints: v })} />
      </Card>
      <Card title="Keyboard">
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
          <li><strong>Shift+F10</strong> or the Menu key — open the desktop context menu.</li>
          <li><strong>Esc</strong> — close menus and dialogs.</li>
          <li><strong>Enter / Space</strong> — launch the focused desktop icon.</li>
          <li><strong>Arrow keys</strong> — nudge a focused widget; <strong>+</strong> resizes it.</li>
          <li><strong>Tab</strong> — move between controls (all menus and windows are reachable).</li>
        </ul>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Hardware pointer speed, mouse acceleration and keyboard repeat are host-OS settings and stay outside the web
          preview.
        </p>
      </Card>
    </div>
  );
};
