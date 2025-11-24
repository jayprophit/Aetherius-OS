
import React, { useState } from 'react';
import { PlayIcon, StopIcon, PlusIcon, ServerIcon, ComputerDesktopIcon, CpuChipIcon, CircleStackIcon, TrashIcon } from '../Icons';
import { LaunchableApp } from '../../App';

interface VirtualMachine {
    id: string;
    name: string;
    os: 'Linux' | 'Windows' | 'macOS' | 'Custom';
    status: 'Running' | 'Stopped' | 'Suspended';
    cpu: number; // Cores
    ram: number; // GB
    disk: number; // GB
    ip: string;
}

const initialVMs: VirtualMachine[] = [
    { id: 'vm-1', name: 'Ubuntu 24.04 LTS', os: 'Linux', status: 'Running', cpu: 4, ram: 8, disk: 64, ip: '192.168.122.101' },
    { id: 'vm-2', name: 'Win11 Dev Env', os: 'Windows', status: 'Stopped', cpu: 8, ram: 16, disk: 128, ip: '192.168.122.102' },
    { id: 'vm-4', name: 'macOS Sequoia', os: 'macOS', status: 'Stopped', cpu: 6, ram: 12, disk: 256, ip: '192.168.122.104' },
    { id: 'vm-3', name: 'Kali Security', os: 'Custom', status: 'Stopped', cpu: 2, ram: 4, disk: 32, ip: '192.168.122.103' },
];

const VMCard: React.FC<{ vm: VirtualMachine; onAction: (id: string, action: string) => void; onConsole: (vm: VirtualMachine) => void }> = ({ vm, onAction, onConsole }) => {
    const isRunning = vm.status === 'Running';
    const osColor = vm.os === 'Windows' ? 'bg-blue-100 text-blue-600' : 
                    vm.os === 'macOS' ? 'bg-gray-200 text-gray-800' :
                    vm.os === 'Linux' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600';

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${osColor} dark:bg-gray-700 dark:text-gray-200`}>
                        <ComputerDesktopIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">{vm.name}</h3>
                        <p className="text-xs text-gray-500">{vm.os} • {vm.ip}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${isRunning ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {vm.status}
                </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4 font-mono bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                <div className="flex items-center gap-1"><CpuChipIcon className="w-3 h-3"/> {vm.cpu} vCPU</div>
                <div className="flex items-center gap-1"><CircleStackIcon className="w-3 h-3"/> {vm.ram} GB</div>
                <div className="flex items-center gap-1"><ServerIcon className="w-3 h-3"/> {vm.disk} GB</div>
            </div>

            <div className="flex gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                <button 
                    onClick={() => onAction(vm.id, isRunning ? 'stop' : 'start')}
                    className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 ${isRunning ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'} dark:bg-opacity-10`}
                >
                    {isRunning ? <><StopIcon className="w-3 h-3"/> Stop</> : <><PlayIcon className="w-3 h-3"/> Start</>}
                </button>
                <button 
                    onClick={() => onConsole(vm)}
                    className="px-3 py-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 text-xs font-bold"
                >
                    Console
                </button>
                <button className="px-2 py-1.5 rounded hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

interface HypervisorProps {
    launchApp: (app: LaunchableApp) => void;
}

export const Hypervisor: React.FC<HypervisorProps> = ({ launchApp }) => {
    const [vms, setVms] = useState<VirtualMachine[]>(initialVMs);

    const handleAction = (id: string, action: string) => {
        const vm = vms.find(v => v.id === id);
        setVms(prev => prev.map(v => {
            if (v.id === id) {
                return { ...v, status: action === 'start' ? 'Running' : 'Stopped' };
            }
            return v;
        }));
        
        // Auto-launch console on start
        if (action === 'start' && vm) {
             handleLaunch(vm);
        }
    };

    const handleLaunch = (vm: VirtualMachine) => {
         launchApp({
            component: 'guestOS',
            title: `${vm.name} - Console`,
            icon: ComputerDesktopIcon,
            context: { os: vm.os, name: vm.name }
        });
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 animate-fade-in">
            <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <ServerIcon className="w-6 h-6 text-purple-500" /> Hypervisor Manager
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Virtual Environment Orchestrator | Quantum-Hybrid Backend</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-4 h-4" /> New VM
                </button>
            </header>

            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {vms.map(vm => (
                    <VMCard key={vm.id} vm={vm} onAction={handleAction} onConsole={handleLaunch} />
                ))}
                
                {/* Add New Placeholder Card */}
                <button className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all min-h-[200px] bg-white/50 dark:bg-transparent">
                    <PlusIcon className="w-8 h-8 mb-2" />
                    <span className="font-bold text-sm">Deploy New Instance</span>
                    <span className="text-xs mt-1">Supports ISO, IMG, QCOW2</span>
                </button>
            </div>
            
            {/* Resource Footer */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 flex gap-6 text-xs font-mono text-gray-500">
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> HOST ONLINE</span>
                <span>CPU: 12% / 1024 CORES</span>
                <span>RAM: 24 / 2048 GB</span>
                <span>STORAGE: 1.2 PB FREE</span>
            </footer>
        </div>
    );
};
