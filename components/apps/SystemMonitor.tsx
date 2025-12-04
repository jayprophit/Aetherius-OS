
import React, { useState, useEffect } from 'react';
import { CpuChipIcon, CircleStackIcon, GlobeAltIcon, BoltIcon, ChartBarIcon } from '../Icons';
import { TaskManager } from './TaskManager';

const RealtimeGraph: React.FC<{ color: string }> = ({ color }) => {
    // Simulate a moving graph
    const [points, setPoints] = useState<number[]>(Array(20).fill(0));

    useEffect(() => {
        const interval = setInterval(() => {
            setPoints(prev => {
                const next = [...prev.slice(1), Math.random() * 100];
                return next;
            });
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
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
}

const MetricTile: React.FC<{ title: string, value: string, icon: React.FC<any>, color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">{title}</span>
            <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{value}</div>
        <RealtimeGraph color={color.replace('text-', 'bg-')} />
    </div>
);

export const SystemMonitor: React.FC = () => {
    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
            <header className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <ChartBarIcon className="w-8 h-8 text-blue-600" /> System Monitor
                </h1>
            </header>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricTile title="CPU Usage" value="14%" icon={CpuChipIcon} color="text-blue-500" />
                <MetricTile title="Memory Usage" value="8.4 GB" icon={CircleStackIcon} color="text-purple-500" />
                <MetricTile title="Network IO" value="12 MB/s" icon={GlobeAltIcon} color="text-green-500" />
                <MetricTile title="Power Draw" value="65 W" icon={BoltIcon} color="text-yellow-500" />
            </div>

            <div className="flex-1 p-6 pt-0 overflow-hidden flex flex-col">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Active Processes</h2>
                <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <TaskManager />
                </div>
            </div>
        </div>
    );
};
