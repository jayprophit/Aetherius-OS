import React, { useEffect, useState } from "react";
import { ComputerDesktopIcon } from "../Icons";
import {
  DEFAULT_DESKTOP_PREFS,
  DEFAULT_WIDGET_PREFS,
  PREFS_EVENT,
  desktopPrefs,
  widgetPrefs,
  type DesktopPrefs,
  type WidgetPrefs,
} from "../desktopPreferences";

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
    {children}
  </div>
);

const Toggle: React.FC<{
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, description, value, onChange }) => (
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

const ChoiceRow: React.FC<{
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div className="py-2">
    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
            value === option.value
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

/**
 * Desktop organisation: icon size, grid behaviour, sorting/grouping,
 * wallpaper and widget visibility. Every control writes the shared
 * `aetherius.desktop` / `aetherius.widgets` preferences the Desktop reads,
 * so changes apply live without a reload.
 */
export const DesktopSettings: React.FC<{ title: string }> = ({ title }) => {
  const [desktop, setDesktop] = useState<DesktopPrefs>(() => desktopPrefs.read());
  const [widgets, setWidgets] = useState<WidgetPrefs>(() => widgetPrefs.read());

  useEffect(() => {
    const onPrefs = () => {
      setDesktop(desktopPrefs.read());
      setWidgets(widgetPrefs.read());
    };
    window.addEventListener(PREFS_EVENT, onPrefs);
    return () => window.removeEventListener(PREFS_EVENT, onPrefs);
  }, []);

  const updateDesktop = (patch: Partial<DesktopPrefs>) => {
    const next = { ...desktop, ...patch };
    setDesktop(next);
    desktopPrefs.write(next);
  };

  const updateWidget = (id: keyof WidgetPrefs, patch: Partial<WidgetPrefs[typeof id]>) => {
    const next = { ...widgets, [id]: { ...widgets[id], ...patch } };
    setWidgets(next);
    widgetPrefs.write(next);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-3 px-1 text-3xl font-bold text-gray-800 dark:text-gray-100">
        <ComputerDesktopIcon className="h-8 w-8 text-blue-500" />
        {title}
      </h1>

      <Card title="Desktop organisation">
        <ChoiceRow
          label="Icon size"
          value={desktop.iconSize}
          onChange={(value) => updateDesktop({ iconSize: value as DesktopPrefs["iconSize"] })}
          options={[
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
          ]}
        />
        <Toggle label="Snap to grid" description="Icons land on the nearest grid cell when dragged." value={desktop.snapToGrid} onChange={(value) => updateDesktop({ snapToGrid: value })} />
        <Toggle label="Auto-arrange on launch" description="Icons are laid out in a grid every time the shell loads." value={desktop.autoArrange} onChange={(value) => updateDesktop({ autoArrange: value })} />
        <Toggle label="Show icon labels" description="Text under every desktop icon." value={desktop.showIconLabels} onChange={(value) => updateDesktop({ showIconLabels: value })} />
        <Toggle label="Lock layout" description="Prevents dragging icons and resizing widgets." value={desktop.locked} onChange={(value) => updateDesktop({ locked: value })} />
        <ChoiceRow
          label="Sort icons by"
          value={desktop.sortBy}
          onChange={(value) => updateDesktop({ sortBy: value as DesktopPrefs["sortBy"] })}
          options={[
            { value: "none", label: "Manual" },
            { value: "name", label: "Name" },
            { value: "type", label: "Type" },
          ]}
        />
        <ChoiceRow
          label="Group icons by"
          value={desktop.groupBy}
          onChange={(value) => updateDesktop({ groupBy: value as DesktopPrefs["groupBy"] })}
          options={[
            { value: "none", label: "No groups" },
            { value: "type", label: "App / Folder" },
            { value: "firstLetter", label: "First letter" },
          ]}
        />
      </Card>

      <Card title="Widgets — size and placement you control">
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          Drag any widget on the desktop to move it. Hover (or focus) a widget and use the size button to cycle S / M / L.
          Default is S so widgets stay compact; the old sizes were too big.
        </p>
        {(
          [
            ["weather", "Weather"],
            ["calendar", "Calendar"],
            ["system", "System"],
          ] as Array<[keyof WidgetPrefs, string]>
        ).map(([id, label]) => (
          <div key={id} className="border-t border-gray-200 py-2 dark:border-gray-700">
            <Toggle
              label={`${label} widget visible`}
              description={`Show the ${label.toLowerCase()} widget on the desktop.`}
              value={widgets[id].visible}
              onChange={(value) => updateWidget(id, { visible: value })}
            />
            <ChoiceRow
              label={`${label} size`}
              value={widgets[id].size}
              onChange={(value) => updateWidget(id, { size: value as "S" | "M" | "L" })}
              options={[
                { value: "S", label: "Small (180×120)" },
                { value: "M", label: "Medium (240×160)" },
                { value: "L", label: "Large (320×215)" },
              ]}
            />
          </div>
        ))}
        <button
          onClick={() => {
            setWidgets({ ...DEFAULT_WIDGET_PREFS });
            widgetPrefs.write({ ...DEFAULT_WIDGET_PREFS });
          }}
          className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium dark:border-gray-600"
        >
          Reset widget positions
        </button>
      </Card>

      <Card title="Wallpaper">
        <ChoiceRow
          label="Wallpaper style"
          value={desktop.wallpaper ? "custom" : "default"}
          onChange={(value) =>
            updateDesktop({ wallpaper: value === "default" ? "" : "linear-gradient(135deg,#0b1020 0%,#1b2a4a 50%,#4a2a5a 100%)" })
          }
          options={[
            { value: "default", label: "Default gradient" },
            { value: "custom", label: "Same gradient (local only)" },
          ]}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          The default wallpaper is a local gradient so the shell works offline. Full image wallpapers live in the
          Wallpaper page.
        </p>
        <button
          onClick={() => {
            setDesktop({ ...DEFAULT_DESKTOP_PREFS });
            desktopPrefs.write({ ...DEFAULT_DESKTOP_PREFS });
          }}
          className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium dark:border-gray-600"
        >
          Reset to defaults
        </button>
      </Card>
    </div>
  );
};
