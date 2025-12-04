
import React, { useState, useEffect } from 'react';
import { 
    CpuChipIcon, CircleStackIcon, GlobeAltIcon, ServerIcon, 
    StopIcon, ArrowPathIcon, ChartBarIcon 
} from '../Icons';

interface Process {
    id: number;
    name: string;
    user: string;
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    status: 'Running' | 'Suspended' | 'Not Responding';
}

const initialProcesses: Process[] = [
    { id: 1001, name: 'Aetherius Kernel', user: 'SYSTEM', cpu: 1.2, memory: 450, disk: 0.1, network: 0, status: 'Running' },
    { id: 1024, name: 'Desktop Window Manager', user: 'SYSTEM', cpu: 4.5, memory: 1200, disk: 1.2, network: 0, status: 'Running' },
    { id: 1045, name: 'Quantum Visualizer', user: 'User', cpu: 12.4, memory: 8500, disk: 45.0, network: 12.5, status: 'Running' },
    { id: 1092, name: 'Network Daemon', user: 'NetworkService', cpu: 0.5, memory: 120, disk: 0.5, network: 850.0, status: 'Running' },
    { id: 2048, name: 'AI Orchestrator', user: 'SYSTEM', cpu: 8.5, memory: 4096, disk: 12.0, network: 5.4, status: 'Running' },
    { id: 3392, name: 'File Explorer', user: 'User', cpu: 0.2, memory: 180, disk: 0, network: 0, status: 'Running' },
    { id: 4401, name: 'Chrome (Sandboxed)', user: 'User', cpu: 5.1, memory: 2400, disk: 2.0, network: 1.2, status: 'Running' },
    { id: 5502, name: 'Spotify', user: 'User', cpu: 1.1, memory: 350, disk: 0, network: 0.2, status: 'Suspended' },
];

export const TaskManager: React.FC = () => {
    const [processes, setProcesses] = useState<Process[]>(initialProcesses);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [sortField, setSortField] = useState<keyof Process>('cpu');
    const [sortAsc, setSortAsc] = useState(false);

    // Simulation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setProcesses(prev => prev.map(p => ({
                ...p,
                cpu: Math.max(0, p.cpu + (Math.random() - 0.5)),
                memory: Math.max(50, p.memory + (Math.random() - 0.5) * 10),
                network: Math.max(0, p.network + (Math.random() - 0.5) * 2),
            })));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSort = (field: keyof Process) => {
        if (sortField === field) setSortAsc(!sortAsc);
        else {
            setSortField(field);
            setSortAsc(false);
        }
    };

    const sortedProcesses = [...processes].sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    const killTask = () => {
        if (selectedId) {
            setProcesses(prev => prev.filter(p => p.id !== selectedId));
            setSelectedId(null);
        }
    };

    const totalCpu = processes.reduce((acc, p) => acc + p.cpu, 0);
    const totalMem = processes.reduce((acc, p) => acc + p.memory, 0);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans text-sm">
            {/* Header & Overview */}
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                <div className="flex gap-6">
                    <div className="flex flex-col items-center cursor-pointer p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-1 text-blue-500">
                            <CpuChipIcon className="w-5 h-5" /> <span className="font-bold text-lg">{totalCpu.toFixed(1)}%</span>
                        </div>
                        <span className="text-xs text-gray-500">CPU</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-1 text-purple-500">
                            <CircleStackIcon className="w-5 h-5" /> <span className="font-bold text-lg">{(totalMem / 1024).toFixed(1)} GB</span>
                        </div>
                        <span className="text-xs text-gray-500">Memory</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-1 text-green-500">
                            <GlobeAltIcon className="w-5 h-5" /> <span className="font-bold text-lg">1.2 Gbps</span>
                        </div>
                        <span className="text-xs text-gray-500">Network</span>
                    </div>
                </div>
                <button 
                    disabled={!selectedId}
                    onClick={killTask}
                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded font-bold text-xs flex items-center gap-2 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <StopIcon className="w-4 h-4"/> End Task
                </button>
            </header>

            {/* Process Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 sticky top-0 z-10">
                        <tr>
                            <th className="p-2 pl-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => handleSort('name')}>Name</th>
                            <th className="p-2 w-24 text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => handleSort('id')}>PID</th>
                            <th className="p-2 w-24 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => handleSort('status')}>Status</th>
                            <th className="p-2 w-24 text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => handleSort('cpu')}>CPU</th>
                            <th className="p-2 w-24 text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => handleSort('memory')}>Memory</th>
                            <th className="p-2 w-24 text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => handleSort('disk')}>Disk</th>
                            <th className="p-2 w-24 text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => handleSort('network')}>Network</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedProcesses.map(proc => (
                            <tr 
                                key={proc.id} 
                                onClick={() => setSelectedId(proc.id)}
                                className={`cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 ${selectedId === proc.id ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                            >
                                <td className="p-2 pl-4 flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-400 rounded-sm"></div> {/* Icon placeholder */}
                                    <span className="font-medium truncate max-w-[200px]">{proc.name}</span>
                                </td>
                                <td className="p-2 text-right font-mono text-xs text-gray-500">{proc.id}</td>
                                <td className="p-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${proc.status === 'Running' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                        {proc.status}
                                    </span>
                                </td>
                                <td className={`p-2 text-right font-mono ${proc.cpu > 10 ? 'text-red-500 font-bold' : ''}`}>
                                    {proc.cpu.toFixed(1)}%
                                </td>
                                <td className="p-2 text-right font-mono">
                                    {(proc.memory).toFixed(1)} MB
                                </td>
                                <td className="p-2 text-right font-mono text-gray-500">
                                    {proc.disk.toFixed(1)} MB/s
                                </td>
                                <td className="p-2 text-right font-mono text-gray-500">
                                    {proc.network.toFixed(1)} Mbps
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <footer className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 flex justify-between">
                <span>Processes: {processes.length}</span>
                <span>Update Speed: Normal (1s)</span>
            </footer>
        </div>
    );
};
