import React, { useEffect, useState } from "react";
import { FaceSmileIcon } from "../Icons";
import { PREFS_EVENT, genesisPrefs, type GenesisPrefs } from "../desktopPreferences";

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
 * Genesis Human agent defaults. Writes `aetherius.genesis`; the Genesis
 * Human window reads it on mount and on change.
 */
export const GenesisSettings: React.FC<{ title: string }> = ({ title }) => {
  const [prefs, setPrefs] = useState<GenesisPrefs>(() => genesisPrefs.read());

  useEffect(() => {
    const onPrefs = () => setPrefs(genesisPrefs.read());
    window.addEventListener(PREFS_EVENT, onPrefs);
    return () => window.removeEventListener(PREFS_EVENT, onPrefs);
  }, []);

  const update = (patch: Partial<GenesisPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    genesisPrefs.write(next);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-3 px-1 text-3xl font-bold text-gray-800 dark:text-gray-100">
        <FaceSmileIcon className="h-8 w-8 text-indigo-500" />
        {title}
      </h1>
      <Card title="Genesis Human">
        <Toggle label="Speak replies aloud" description="Read Genesis replies with the browser speech synthesizer." value={prefs.speakReplies} onChange={(v) => update({ speakReplies: v })} />
        <Toggle label="Prefer the local model" description="Use the on-machine Ollama daemon first; fall back to the labelled offline responder." value={prefs.preferLocalModel} onChange={(v) => update({ preferLocalModel: v })} />
        <Toggle label="Show the research panel" description="Show the Tavus Griffin benchmark notes inside the Genesis window." value={prefs.showResearchPanel} onChange={(v) => update({ showResearchPanel: v })} />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Microphone and camera stay off until you enable them inside the Genesis Human window. Nothing is recorded,
          uploaded, or sent off this device by the preview.
        </p>
      </Card>
    </div>
  );
};
