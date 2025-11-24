
import React from 'react';
import { CpuChipIcon, CircleStackIcon, ServerIcon, BoltIcon, CheckCircleIcon, ExclamationTriangleIcon, LockClosedIcon } from './Icons';

const ReqCard: React.FC<{ 
    title: string; 
    icon: React.FC<any>; 
    min: string; 
    rec: string; 
    current: string; 
    status: 'Met' | 'Warning' | 'Critical';
}> = ({ title, icon: Icon, min, rec, current, status }) => {
    const statusColors = {
        'Met': 'text-green-500 bg-green-500/10 border-green-500/30',
        'Warning': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
        'Critical': 'text-red-500 bg-red-500/10 border-red-500/30',
    };

    return (
        <div className={`p-4 rounded-lg border flex flex-col gap-3 ${statusColors[status].replace('text-', 'border-').split(' ')[2] || 'border-gray-700'} bg-gray-800/50`}>
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-100 flex items-center gap-2">
                    <Icon className="w-5 h-5 text-blue-400"/> {title}
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[status]}`}>{status}</span>
            </div>
            <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                    <span className="text-gray-500">Minimum:</span>
                    <span className="text-gray-300 font-mono">{min}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Recommended:</span>
                    <span className="text-gray-300 font-mono">{rec}</span>
                </div>
                <div className="pt-2 border-t border-gray-700 flex justify-between items-center">
                    <span className="text-gray-400 font-semibold">Current Rig:</span>
                    <span className="text-white font-mono font-bold">{current}</span>
                </div>
            </div>
        </div>
    );
};

export const SystemRequirements: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-900 text-gray-100 h-full overflow-y-auto">
            <header className="mb-8 border-b border-gray-800 pb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <ServerIcon className="w-8 h-8 text-indigo-500" />
                    System Requirements & Readiness
                </h1>
                <p className="text-gray-400 mt-2">
                    Hardware specifications required to run the full Aetherius OS ecosystem (Phase 3 Maturity).
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReqCard 
                    title="Quantum Processing" 
                    icon={CpuChipIcon}
                    min="50 Qubits (Noisy)"
                    rec="1024+ Qubits (Logical)"
                    current="4096 Qubits (Simulated)"
                    status="Met"
                />
                <ReqCard 
                    title="Neuromorphic Memory" 
                    icon={CircleStackIcon}
                    min="128 GB DRAM"
                    rec="1 PB Holographic Crystal"
                    current="256 GB DDR5 + Virtual LIF"
                    status="Warning"
                />
                <ReqCard 
                    title="Energy Throughput" 
                    icon={BoltIcon}
                    min="500W Continuous"
                    rec="Zero-Point Module (ZPM)"
                    current="Micro-Fusion Cell (Draft)"
                    status="Warning"
                />
                <ReqCard 
                    title="Network Latency" 
                    icon={ServerIcon}
                    min="< 50ms Global"
                    rec="Entanglement Link (Instant)"
                    current="12ms (Fiber/5G)"
                    status="Met"
                />
                <ReqCard 
                    title="Security Clearance" 
                    icon={LockClosedIcon}
                    min="Level 3 (Biometric)"
                    rec="Level 5 (DNA/Quantum)"
                    current="Level 4 (Palm Vein)"
                    status="Met"
                />
            </div>

            <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                    <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500"/> Compatibility Analysis
                </h2>
                <p className="text-sm text-gray-300 mb-4">
                    Your current virtual rig configuration is sufficient for <strong>Phase 1 (Foundation)</strong> operations. 
                    To unlock full AGI capabilities (Phase 3), you must upgrade your Memory and Energy modules in the 
                    <strong> Virtual Rig Builder</strong>.
                </p>
                <div className="bg-black/50 p-4 rounded font-mono text-xs text-green-400">
                    > CHECKING KERNEL COMPATIBILITY... OK<br/>
                    > VALIDATING Q-GATES... OK<br/>
                    > MEMORY BANDWIDTH... LIMIT REACHED (WARN)<br/>
                    > CONSCIOUSNESS FIELD... STABLE
                </div>
            </div>
        </div>
    );
};
