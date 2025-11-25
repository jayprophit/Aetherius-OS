
import React, { useEffect, useState, useMemo } from 'react';
import { CpuChipIcon, CircleStackIcon, ServerIcon, BoltIcon, ShieldCheckIcon, SparklesIcon, LockClosedIcon } from './Icons';
import { rigService, RigState } from '../services/RigService';

const RequirementRow: React.FC<{ 
    label: string;
    icon: React.FC<any>;
    safetyDefault: string;
    currentSpec: string;
    status: 'Met' | 'Exceeded' | 'Critical';
}> = ({ label, icon: Icon, safetyDefault, currentSpec, status }) => {
    
    const statusColor = 
        status === 'Exceeded' ? 'text-blue-400' :
        status === 'Met' ? 'text-green-400' : 'text-red-500';
    
    const statusBg = 
        status === 'Exceeded' ? 'bg-blue-900/20 border-blue-500/30' :
        status === 'Met' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30';

    return (
        <div className={`p-4 rounded-lg border ${statusBg} flex items-center justify-between`}>
            <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-800 rounded-lg">
                    <Icon className={`w-6 h-6 ${statusColor}`} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-200 text-sm">{label}</h4>
                    <p className="text-xs text-gray-500">Safety Minimum: <span className="text-gray-400">{safetyDefault}</span></p>
                </div>
            </div>
            <div className="text-right">
                <div className={`font-mono font-bold ${statusColor}`}>{currentSpec}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{status}</div>
            </div>
        </div>
    );
};

export const SystemRequirements: React.FC = () => {
    const [rig, setRig] = useState<RigState>(rigService.getRig());

    useEffect(() => {
        const sub = rigService.rigState$.subscribe(setRig);
        return () => sub.unsubscribe();
    }, []);

    // Helper to calculate status
    const getStatus = (hasPart: boolean, score: number, minScore: number): 'Met' | 'Exceeded' | 'Critical' => {
        if (!hasPart) return 'Critical';
        if (score > minScore * 1.2) return 'Exceeded';
        if (score >= minScore) return 'Met';
        return 'Critical';
    };

    const analysis = useMemo(() => {
        const stats = rigService.calculateStats(rig);
        const binaryCpuCount = rig.Binary_CPU.length;
        const quantumCpuCount = rig.Quantum_QPU.length;
        
        return [
            {
                label: 'Logic Processing (Binary)',
                icon: CpuChipIcon,
                min: 'Score 40',
                curr: binaryCpuCount > 0 ? `Total Score: ${stats.perf.binary}` : 'MISSING',
                status: getStatus(binaryCpuCount > 0, stats.perf.binary, 40)
            },
            {
                label: 'System Memory (Binary RAM)',
                icon: CircleStackIcon,
                min: 'Active Module',
                curr: rig.Binary_RAM.length > 0 ? `${rig.Binary_RAM.length} Modules` : 'MISSING',
                status: rig.Binary_RAM.length > 0 ? 'Met' : 'Critical'
            },
            {
                label: 'Power Output',
                icon: BoltIcon,
                min: '500W Capacity',
                curr: `${stats.capacity}W (Load: ${stats.power}W)`,
                status: stats.capacity >= stats.power && stats.capacity >= 500 ? 'Met' : 'Critical'
            },
            {
                label: 'Quantum Core',
                icon: SparklesIcon,
                min: 'Active QPU',
                curr: quantumCpuCount > 0 ? `${quantumCpuCount} QPU(s)` : 'MISSING',
                status: quantumCpuCount > 0 ? 'Met' : 'Critical'
            },
            {
                label: 'Hardware Bridge',
                icon: ServerIcon,
                min: 'Bridge Controller',
                curr: rig.Bridge_Controller.length > 0 ? 'Online' : 'MISSING',
                status: rig.Bridge_Controller.length > 0 ? 'Met' : 'Critical'
            }
        ];
    }, [rig]);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-900 text-gray-100 h-full overflow-y-auto">
            <header className="mb-8 border-b border-gray-800 pb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <ShieldCheckIcon className="w-8 h-8 text-indigo-500" />
                    System Requirements & Validation
                </h1>
                <p className="text-gray-400 mt-2 max-w-3xl">
                    This panel displays the <strong>Safety Defaults</strong> (Hard Minimums) required for Aetherius OS stability, 
                    compared against your <strong>Custom Build</strong> from the Virtual Rig Builder.
                    <br/><span className="text-xs text-red-400">* Any "Critical" status will prevent system boot or revert to safe mode.</span>
                </p>
            </header>

            <div className="grid grid-cols-1 gap-4 max-w-4xl">
                {analysis.map((item, idx) => (
                    <RequirementRow key={idx} {...item} />
                ))}
            </div>

            <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700 flex items-start gap-4">
                <div className="p-3 bg-blue-900/30 rounded-full">
                    <LockClosedIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">Safety Protocol: Immutable Defaults</h3>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                        The "Safety Minimum" data set is hardcoded into the OS kernel. It acts as a failsafe. 
                        If you attempt to install a faulty or insufficient component in the Rig Builder, the system will flag it as 
                        <strong> Critical</strong> and refuse to apply the configuration, preventing data corruption or quantum decoherence.
                    </p>
                </div>
            </div>
        </div>
    );
};
