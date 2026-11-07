import React, { useEffect, useState } from 'react';
import {
    CpuChipIcon, CircleStackIcon, GlobeAltIcon
} from '../Icons';

/**
 * Honest system snapshot for the web preview.
 *
 * Browsers expose only a few real signals (logical core count, JS heap on
 * Chromium, network status). Process CPU, memory and network numbers cannot
 * be measured from a web page, so this view shows only what the browser
 * reports and labels everything else as unavailable instead of inventing
 * process telemetry.
 */

interface Snapshot {
    cpuCores: number;
    jsHeapMb: number | null;
    jsHeapMaxMb: number | null;
    online: boolean;
    batteryLevel: number | null;
}

export const TaskManager: React.FC = () => {
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

    useEffect(() => {
        const read = async () => {
            const perf = performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } };
            let batteryLevel: number | null = null;
            try {
                const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number }> };
                if (nav.getBattery) {
                    const battery = await nav.getBattery();
                    batteryLevel = Math.round(battery.level * 100);
                }
            } catch {
                batteryLevel = null;
            }
            setSnapshot({
                cpuCores: navigator.hardwareConcurrency ?? 0,
                jsHeapMb: perf.memory ? Math.round((perf.memory.usedJSHeapSize / 1048576) * 10) / 10 : null,
                jsHeapMaxMb: perf.memory ? Math.round((perf.memory.jsHeapSizeLimit / 1048576) * 10) / 10 : null,
                online: navigator.onLine,
                batteryLevel,
            });
        };
        void read();
        const interval = setInterval(() => void read(), 3000);
        window.addEventListener('online', () => void read());
        window.addEventListener('offline', () => void read());
        return () => {
            clearInterval(interval);
            window.removeEventListener('online', () => void read());
            window.removeEventListener('offline', () => void read());
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans text-sm">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-base font-bold">Task Manager</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Browser preview shows real browser signals only. Per-process CPU, memory and network usage are
                    not measurable from a web page and are not simulated.
                </p>
            </header>
            <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <CpuChipIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400">CPU CORES</p>
                            <p className="text-2xl font-bold">{snapshot?.cpuCores ?? '—'}</p>
                            <p className="text-xs text-gray-500">Per-process CPU is unavailable in the browser.</p>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <CircleStackIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400">JS HEAP</p>
                            <p className="text-lg font-bold">
                                {snapshot?.jsHeapMb == null ? 'Unknown (non-Chromium)' : `${snapshot.jsHeapMb} / ${snapshot.jsHeapMaxMb} MB`}
                            </p>
                            <p className="text-xs text-gray-500">Total RAM is not exposed to web pages.</p>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                            <GlobeAltIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400">NETWORK</p>
                            <p className="text-2xl font-bold">{snapshot?.online === undefined ? '…' : snapshot.online ? 'Online' : 'Offline'}</p>
                            <p className="text-xs text-gray-500">Bandwidth is not measurable from a web page.</p>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <p className="text-xs font-bold text-gray-400 mb-1">BATTERY</p>
                        <p className="text-lg font-bold">{snapshot?.batteryLevel == null ? 'Unavailable' : `${snapshot.batteryLevel}%`}</p>
                        <p className="text-xs text-gray-500 mt-1">Shown only where the browser exposes the Battery API.</p>
                    </div>
                </div>
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 p-4 text-xs">
                    End Task is unavailable in the browser preview: a web page cannot terminate OS processes. Process
                    management belongs to the native companion service (unverified in 0.1.0).
                </div>
            </div>
            <footer className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500">
                <span>Signals refresh every 3 seconds · real browser APIs only</span>
            </footer>
        </div>
    );
};
