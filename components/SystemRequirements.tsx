
import React, { useEffect, useState, useMemo } from 'react';
import { CpuChipIcon, CircleStackIcon, ServerIcon, BoltIcon, ShieldCheckIcon, SparklesIcon, LockClosedIcon, CheckCircleIcon, GlobeAltIcon, DnaIcon, EyeIcon, CloudIcon, WrenchIcon, HiveMindIcon } from './Icons';
import { rigService, RigState } from '../services/RigService';

const RequirementRow: React.FC<{ 
    label: string;
    icon: React.FC<any>;
    safetyDefault: string;
    currentSpec: string;
    status: 'Met' | 'Exceeded' | 'Critical' | 'Pending';
}> = ({ label, icon: Icon, safetyDefault, currentSpec, status }) => {
    
    const statusColor = 
        status === 'Exceeded' ? 'text-blue-400' :
        status === 'Met' ? 'text-green-400' : 
        status === 'Pending' ? 'text-yellow-400' : 'text-red-500';
    
    const statusBg = 
        status === 'Exceeded' ? 'bg-blue-900/20 border-blue-500/30' :
        status === 'Met' ? 'bg-green-900/20 border-green-500/30' : 
        status === 'Pending' ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-red-900/20 border-red-500/30';

    const StatusIcon = status === 'Critical' ? LockClosedIcon : status === 'Pending' ? WrenchIcon : CheckCircleIcon;

    return (
        <div className={`p-4 rounded-lg border ${statusBg} flex items-center justify-between transition-all duration-500`}>
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
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center justify-end gap-1">
                     <StatusIcon className="w-3 h-3" /> {status}
                </div>
            </div>
        </div>
    );
};

export const SystemRequirements: React.FC = () => {
    const [rig, setRig] = useState<RigState>(rigService.getRig());
    const [browserCaps, setBrowserCaps] = useState<any>({});

    useEffect(() => {
        const sub = rigService.rigState$.subscribe(setRig);
        
        // Real browser capability check for "Live OS" status
        const checkCaps = async () => {
            const nav = navigator as any;
            const gpu = nav.gpu ? 'Available' : 'Missing';
            const worker = 'Worker' in window ? 'Available' : 'Missing';
            const wasm = 'WebAssembly' in window ? 'Available' : 'Missing';
            const opfs = nav.storage && nav.storage.getDirectory ? 'Available' : 'Missing';
            const bluetooth = nav.bluetooth ? 'Available' : 'Missing';
            const xr = nav.xr ? 'Available' : 'Missing';
            
            setBrowserCaps({ gpu, worker, wasm, opfs, bluetooth, xr });
        };
        checkCaps();
        
        return () => sub.unsubscribe();
    }, []);

    // Helper to calculate status
    const getStatus = (hasPart: boolean, score: number, minScore: number): 'Met' | 'Exceeded' | 'Critical' | 'Pending' => {
        if (!hasPart) return 'Critical';
        if (score > minScore * 1.2) return 'Exceeded';
        if (score >= minScore) return 'Met';
        return 'Critical';
    };

    const analysis = useMemo(() => {
        const stats = rigService.calculateStats(rig);
        const binaryCpuCount = rig.Binary_CPU.length;
        const quantumCpuCount = rig.Quantum_QPU.length;
        
        const items: {
            label: string;
            icon: React.FC<any>;
            safetyDefault: string;
            currentSpec: string;
            status: 'Met' | 'Exceeded' | 'Critical' | 'Pending';
        }[] = [
            {
                label: 'Logic Processing (Binary)',
                icon: CpuChipIcon,
                safetyDefault: 'Score 40',
                currentSpec: binaryCpuCount > 0 ? `Total Score: ${stats.perf.binary}` : 'MISSING',
                status: getStatus(binaryCpuCount > 0, stats.perf.binary, 40)
            },
            {
                label: 'Reality Bridge (WebGPU)',
                icon: GlobeAltIcon,
                safetyDefault: 'Hardware Accel',
                currentSpec: browserCaps.gpu === 'Available' ? 'LINK ESTABLISHED' : 'SIMULATION ONLY',
                status: browserCaps.gpu === 'Available' ? 'Met' : 'Critical'
            },
            {
                label: 'Kernel Core (WASM)',
                icon: SparklesIcon,
                safetyDefault: 'Native Support',
                currentSpec: browserCaps.wasm === 'Available' ? 'ACTIVE' : 'MISSING',
                status: browserCaps.wasm === 'Available' ? 'Met' : 'Critical'
            },
            {
                label: 'System Memory (Binary RAM)',
                icon: CircleStackIcon,
                safetyDefault: 'Active Module',
                currentSpec: rig.Binary_RAM.length > 0 ? `${rig.Binary_RAM.length} Modules` : 'MISSING',
                status: rig.Binary_RAM.length > 0 ? 'Met' : 'Critical'
            },
            {
                label: 'AI Vector Memory',
                icon: HiveMindIcon,
                safetyDefault: 'Pinecone/Qdrant',
                currentSpec: 'Local Simulation',
                status: 'Pending'
            },
            {
                label: 'Model Serving',
                icon: ServerIcon,
                safetyDefault: 'Triton Inference',
                currentSpec: 'In-Browser Only',
                status: 'Pending'
            },
            {
                label: 'Distributed Caching',
                icon: CircleStackIcon,
                safetyDefault: 'Redis Cluster',
                currentSpec: 'LocalStorage',
                status: 'Pending'
            },
            {
                label: 'CI/CD Pipeline',
                icon: BoltIcon,
                safetyDefault: 'Automated Workflows',
                currentSpec: 'Manual Deployment',
                status: 'Pending'
            },
             {
                label: 'Security WAF',
                icon: ShieldCheckIcon,
                safetyDefault: 'Rate Limiting',
                currentSpec: 'Basic CORS',
                status: 'Pending'
            },
            {
                label: 'Neural Interface (BCI)',
                icon: DnaIcon,
                safetyDefault: 'Bluetooth Adapter',
                currentSpec: browserCaps.bluetooth === 'Available' ? 'READY TO PAIR' : 'MISSING',
                status: browserCaps.bluetooth === 'Available' ? 'Met' : 'Critical'
            },
            {
                label: 'Spatial Computing',
                icon: EyeIcon,
                safetyDefault: 'WebXR Support',
                currentSpec: browserCaps.xr === 'Available' ? 'READY' : 'MISSING',
                status: browserCaps.xr === 'Available' ? 'Met' : 'Critical'
            }
        ];
        return items;
    }, [rig, browserCaps]);

    const allMet = analysis.every(a => a.status === 'Met' || a.status === 'Exceeded');

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-900 text-gray-100 h-full overflow-y-auto">
            <header className="mb-8 border-b border-gray-800 pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <ShieldCheckIcon className={`w-8 h-8 ${allMet ? 'text-green-500' : 'text-red-500'}`} />
                            Platform Readiness Audit
                        </h1>
                        <p className="text-gray-400 mt-2 max-w-3xl">
                            Automated gap analysis of current environment against production-grade Aetherius OS specifications.
                            <br/>
                            <strong>Current Status:</strong> Prototype Environment. Critical infrastructure gaps identified.
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border ${allMet ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-red-900/20 border-red-500 text-red-400 animate-pulse'}`}>
                        <span className="font-bold text-sm">{allMet ? 'SYSTEM 100% COMPLIANT' : 'CRITICAL GAPS DETECTED'}</span>
                    </div>
                </div>
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
                    <h3 className="font-bold text-white text-lg">Critical Path to Production</h3>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                        The system has identified critical infrastructure gaps preventing full "Type-1 Civilization" status. 
                        Immediate action required: Deploy <strong>Vector Database</strong> for long-term AI memory, implement <strong>CI/CD Pipelines</strong> for automated updates, activate <strong>WAF</strong> for security hardening, and establish <strong>Model Serving Infrastructure</strong>.
                        Cloud Sync currently mitigates local hardware limitations.
                    </p>
                </div>
            </div>
        </div>
    );
};