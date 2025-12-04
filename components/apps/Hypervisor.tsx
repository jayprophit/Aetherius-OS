


import React, { useState } from 'react';
import { PlayIcon, StopIcon, PlusIcon, ServerIcon, ComputerDesktopIcon, CpuChipIcon, CircleStackIcon, TrashIcon, CloudIcon } from '../Icons';
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
    mode: 'Local' | 'Cloud-Synced';
}

const initialVMs: VirtualMachine[] = [
    { id: 'vm-1', name: 'Aetherius Prime (Genesis)', os: 'Custom', status: 'Running', cpu: 16, ram: 64, disk: 1024, ip: '10.0.0.1 (VLAN 0)', mode: 'Cloud-Synced' },
    { id: 'vm-2', name: 'Dev Environment (Win11)', os: 'Windows', status: 'Stopped', cpu: 16, ram: 32, disk: 512, ip: '192.168.122.102', mode: 'Cloud-Synced' },
    { id: 'vm-4', name: 'macOS Sequoia (Build Server)', os: 'macOS', status: 'Stopped', cpu: 16, ram: 64, disk: 1024, ip: '192.168.122.104', mode: 'Cloud-Synced' },
    { id: 'vm-3', name: 'Kali Security Node', os: 'Linux', status: 'Stopped', cpu: 8, ram: 16, disk: 256, ip: '192.168.122.103', mode: 'Cloud-Synced' },
];

const VMCard: React.FC<{ vm: VirtualMachine; onAction: (id: string, action: string) => void; onConsole: (vm: VirtualMachine) => void }> = ({ vm, onAction, onConsole }) => {
    const isRunning = vm.status === 'Running';
    const osColor = vm.os === 'Windows' ? 'bg-blue-100 text-blue-600' : 
                    vm.os === 'macOS' ? 'bg-gray-200 text-gray-800' :
                    vm.os === 'Linux' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600';

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow relative overflow-hidden">
            {vm.mode === 'Cloud-Synced' && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-bl-md font-bold flex items-center gap-1">
                    <CloudIcon className="w-3 h-3" /> HYBRID CLOUD
                </div>
            )}
            <div className="flex justify-between items-start mb-4 mt-2">
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
                <button 
                    onClick={() => onAction(vm.id, 'delete')}
                    className="px-2 py-1.5 rounded hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20"
                    title="Delete VM"
                >
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
        if (action === 'delete') {
            if (window.confirm("Are you sure you want to delete this Virtual Machine? This action cannot be undone.")) {
                 setVms(prev => prev.filter(v => v.id !== id));
            }
            return;
        }
        
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
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 flex flex-col md:flex-row justify-between gap-4 text-xs font-mono text-gray-500">
                <div className="flex gap-6">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> HOST ONLINE</span>
                    <span>CPU: 12% / 1024 CORES (Cloud-Boosted)</span>
                    <span>RAM: 24 / 4096 GB</span>
                </div>
                <div className="flex items-center gap-2">
                    <CloudIcon className="w-4 h-4 text-blue-500" />
                    <span>Universal Access: Enabled (Any Device Sync)</span>
                </div>
            </footer>
        </div>
    );
};
