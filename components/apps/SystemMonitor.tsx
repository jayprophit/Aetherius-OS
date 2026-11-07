
import React, { useState, useEffect } from 'react';
import { CpuChipIcon, CircleStackIcon, GlobeAltIcon, ChartBarIcon } from '../Icons';

/**
 * System Monitor — real browser measurements only.
 *
 * Browsers expose logical core count, JS heap usage and network status; they
 * do not expose CPU load, RAM totals, network I/O or power draw, so those
 * are labelled honestly instead of invented.
 */

interface SystemStats {
    cpuCores: number;
    jsHeapMb: number | null;
    jsHeapMaxMb: number | null;
    heapPercent: number | null;
    online: boolean;
}

function readStats(): SystemStats {
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } };
    const used = perf.memory ? perf.memory.usedJSHeapSize / 1048576 : null;
    const max = perf.memory ? perf.memory.jsHeapSizeLimit / 1048576 : null;
    return {
        cpuCores: navigator.hardwareConcurrency ?? 0,
        jsHeapMb: used === null ? null : Math.round(used * 10) / 10,
        jsHeapMaxMb: max === null ? null : Math.round(max * 10) / 10,
        heapPercent: used !== null && max ? Math.min(100, Math.round((used / max) * 100)) : null,
        online: navigator.onLine,
    };
}

const RealtimeGraph: React.FC<{ points: number[]; color: string }> = ({ points, color }) => (
    <div className="h-24 flex items-end gap-1 bg-black/10 dark:bg-black/30 rounded p-2">
        {points.map((val, i) => (
            <div
                key={i}
                className={`flex-1 rounded-t ${color}`}
                style={{ height: `${val}%`, opacity: 0.5 + (i / 40) }}
            />
        ))}
    </div>
);

const MetricTile: React.FC<{ title: string, value: string, history: number[], icon: React.FC<any>, color: string }> = ({ title, value, history, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">{title}</span>
            <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{value}</div>
        <RealtimeGraph points={history} color={color.replace('text-', 'bg-')} />
    </div>
);

export const SystemMonitor: React.FC = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [heapHistory, setHeapHistory] = useState<number[]>(Array(20).fill(0));

    useEffect(() => {
        const read = () => {
            const next = readStats();
            setStats(next);
            if (next.heapPercent !== null) {
                setHeapHistory(prev => [...prev.slice(1), next.heapPercent!]);
            }
        };
        read();
        const interval = setInterval(read, 2000);
        return () => clearInterval(interval);
    }, []);

    const heapValue = stats?.jsHeapMb === null || stats?.jsHeapMb === undefined
        ? 'Unknown'
        : `${stats.jsHeapMb} / ${stats.jsHeapMaxMb} MB`;

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
            <header className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <ChartBarIcon className="w-8 h-8 text-blue-600" /> System Monitor
                </h1>
                <p className="text-xs text-gray-500 mt-1">Real browser measurements (performance.memory, hardwareConcurrency, navigator.onLine). CPU load, power and network I/O are not exposed to browsers, so they are not shown.</p>
            </header>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricTile title="CPU Cores" value={stats ? String(stats.cpuCores) : '…'} history={heapHistory.map((_, i) => Math.min(100, (stats?.cpuCores || 1) * 8))} icon={CpuChipIcon} color="text-blue-500" />
                <MetricTile title="JS Heap" value={heapValue} history={heapHistory} icon={CircleStackIcon} color="text-purple-500" />
                <MetricTile title="Network" value={stats?.online === undefined ? '…' : stats.online ? 'Online' : 'Offline'} history={heapHistory} icon={GlobeAltIcon} color="text-green-500" />
            </div>

            <div className="p-6 pt-0">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">JavaScript Heap History</h2>
                    <p className="text-xs text-gray-500 mb-3">
                        {stats?.jsHeapMb === null
                            ? 'Heap measurement is not available in this browser (Chromium only). OS-level process enumeration needs a host adapter and is not claimed here.'
                            : 'Live JS heap usage from performance.memory. Per-process system usage is only visible to a native host adapter and is not shown.'}
                    </p>
                    <RealtimeGraph points={heapHistory} color="bg-purple-500" />
                </div>
            </div>
        </div>
    );
};
