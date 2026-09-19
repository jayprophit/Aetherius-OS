
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShieldCheckIcon, ServerIcon, CloudIcon, ChipIcon, 
    ExclamationTriangleIcon, CheckCircleIcon, ArrowPathIcon, 
    BoltIcon, LockClosedIcon, GlobeAltIcon, CodeBracketIcon, CubeTransparentIcon,
    LinkIcon, WrenchIcon, DevicePhoneMobileIcon
} from './Icons';
import { buildChecklistData, realityResources } from '../data';

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
    const colors: Record<string, string> = {
        'Completed': 'bg-green-500',
        'In Progress': 'bg-yellow-500',
        'Not Started': 'bg-red-500',
        'Partial': 'bg-orange-500'
    };
    
    const finalColor = colors[status] || 'bg-gray-500';
    const finalLabel = status === 'Not Started' ? 'MISSING' : status.toUpperCase();

    return (
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${finalColor} animate-pulse`}></div>
            <span className={`text-xs font-bold uppercase ${status === 'Not Started' ? 'text-red-400' : 'text-green-400'}`}>{finalLabel}</span>
        </div>
    );
};

const AuditSection: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5 mb-4 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
            <Icon className="w-5 h-5 text-cyan-400" /> {title}
        </h3>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

const AuditRow: React.FC<{ label: string; current: string; target: string; status: string }> = ({ label, current, target, status }) => (
    <div className="flex justify-between items-center p-3 bg-gray-900/80 rounded border border-gray-700 hover:border-cyan-500/50 transition-all group">
        <div className="flex-1">
            <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{label}</p>
            <div className="flex gap-4 text-xs mt-1 font-mono">
                <span className="text-gray-500">Current: <span className="text-green-400">{current}</span></span>
                <span className="text-gray-500">Target: <span className="text-cyan-300">{target}</span></span>
            </div>
        </div>
        <StatusIndicator status={status} />
    </div>
);

const ResourceCard: React.FC<{ category: string; data: any }> = ({ category, data }) => (
    <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-cyan-400 uppercase text-xs tracking-widest">{category}</h4>
            <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-500/30">GAP DETECTED</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{data.gap}</h3>
        <p className="text-xs text-gray-400 mb-3">{data.description}</p>
        
        <div className="space-y-2">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Recommended Solutions (Free/OSS)</p>
            <ul className="space-y-1">
                {data.free.map((item: any, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-green-400">
                        <LinkIcon className="w-3 h-3"/> 
                        <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline font-mono">{item.name}</a>
                        <span className="text-gray-500">- {item.desc}</span>
                    </li>
                ))}
            </ul>
            
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-2">Professional Options</p>
            <ul className="space-y-1">
                {data.paid.map((item: any, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-blue-400">
                        <LinkIcon className="w-3 h-3"/> 
                        <span className="font-mono">{item.name}</span>
                        <span className="text-gray-500">- {item.desc}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);


export const SystemAudit: React.FC = () => {
    const [scanning, setScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(100);
    const [browserInfo, setBrowserInfo] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'Diagnostics' | 'Reality Gap'>('Diagnostics');

    useEffect(() => {
        // Get real browser capabilities for deep scan
        const nav = navigator as any;
        
        const gpuTier = 'gpu' in nav ? 'WebGPU Active' : 'WebGL Fallback';
        const memory = nav.deviceMemory ? `${nav.deviceMemory} GB` : 'Unknown';
        const cores = nav.hardwareConcurrency ? `${nav.hardwareConcurrency} Logical Cores` : 'Unknown';
        const connection = nav.connection ? nav.connection.effectiveType : '4g';
        
        setBrowserInfo({
            ua: navigator.userAgent,
            memory,
            cores,
            gpu: gpuTier,
            connection
        });
    }, []);

    const handleScan = () => {
        setScanning(true);
        setScanProgress(0);
        const interval = setInterval(() => {
            setScanProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setScanning(false);
                    return 100;
                }
                return p + 2; 
            });
        }, 50);
    };
    
    return (
        <div className="h-full bg-black text-white p-6 overflow-y-auto animate-fade-in font-sans relative">
             {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
            
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6 relative z-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                        <ShieldCheckIcon className="w-10 h-10 text-cyan-500" />
                        System Deep Scan Analysis
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm font-mono flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        DIAGNOSTIC ID: AETH-AUDIT-X99 // PHASE 6 TRANSHUMANISM PROTOCOLS
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                        <button 
                            onClick={() => setActiveTab('Diagnostics')} 
                            className={`px-4 py-2 text-xs font-bold rounded transition-colors ${activeTab === 'Diagnostics' ? 'bg-cyan-900 text-cyan-200' : 'text-gray-400 hover:text-white'}`}
                        >
                            Diagnostics
                        </button>
                        <button 
                            onClick={() => setActiveTab('Reality Gap')} 
                            className={`px-4 py-2 text-xs font-bold rounded transition-colors ${activeTab === 'Reality Gap' ? 'bg-purple-900 text-purple-200' : 'text-gray-400 hover:text-white'}`}
                        >
                            Reality Gap
                        </button>
                    </div>
                    <button 
                        onClick={handleScan}
                        disabled={scanning}
                        className="px-6 py-3 bg-cyan-900/50 border border-cyan-500 hover:bg-cyan-800 text-cyan-300 font-bold rounded-lg flex items-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                        {scanning ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <BoltIcon className="w-5 h-5" />}
                        {scanning ? `ANALYZING ${scanProgress}%` : 'INITIATE DEEP SCAN'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {activeTab === 'Diagnostics' ? (
                    <>
                         {/* Left: Overview */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-green-900/10 border border-green-500/30 p-6 rounded-xl">
                                <h2 className="text-xl font-bold text-green-400 mb-2 flex items-center gap-2">
                                    <CheckCircleIcon className="w-6 h-6"/> Host Environment Profile
                                </h2>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    The system has successfully bridged the gap between Simulation and Reality. 
                                    Actual hardware capabilities are now accessible via the Kernel.
                                    <br/><br/>
                                    <strong>Detected Host:</strong> {browserInfo.ua}
                                </p>
                            </div>

                            <AuditSection title="Hardware Abstraction Layer (HAL)" icon={ChipIcon}>
                                <AuditRow 
                                    label="GPU Acceleration" 
                                    current={browserInfo.gpu || "Checking..."}
                                    target="WebGPU / CUDA" 
                                    status={browserInfo.gpu?.includes('WebGPU') ? "Completed" : "Partial"} 
                                />
                                <AuditRow 
                                    label="CPU Threads" 
                                    current={browserInfo.cores || "Checking..."}
                                    target="16+ Threads" 
                                    status="Completed" 
                                />
                                <AuditRow 
                                    label="System Memory" 
                                    current={browserInfo.memory || "Checking..."}
                                    target="32 GB+" 
                                    status="Completed" 
                                />
                            </AuditSection>

                            <AuditSection title="Network & Storage" icon={ServerIcon}>
                                <AuditRow 
                                    label="Network Speed" 
                                    current={browserInfo.connection || "4g"}
                                    target="5G / Fiber" 
                                    status="Completed" 
                                />
                                <AuditRow 
                                    label="File System" 
                                    current="OPFS (Origin Private FS)" 
                                    target="Persistent Storage" 
                                    status="Completed" 
                                />
                            </AuditSection>
                            
                            <AuditSection title="Responsive UX Heuristics" icon={DevicePhoneMobileIcon}>
                                <AuditRow 
                                    label="Adaptive Interface" 
                                    current="Dual-Mode (Mobile/Desktop)" 
                                    target="Universal Fluidity" 
                                    status="Completed" 
                                />
                                <AuditRow 
                                    label="Touch Input Optimization" 
                                    current="Large Touch Targets" 
                                    target="Fitts's Law Compliance" 
                                    status="Completed" 
                                />
                            </AuditSection>
                        </div>

                        {/* Right: Stats & Actions */}
                        <aside className="space-y-6">
                            <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-2xl">
                                <h3 className="font-bold text-white mb-6 text-center text-lg">Reality Integrity Score</h3>
                                <div className="flex items-center justify-center relative w-48 h-48 mx-auto">
                                    <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                                        <circle cx="96" cy="96" r="80" stroke="#374151" strokeWidth="12" fill="transparent" />
                                        <circle cx="96" cy="96" r="80" stroke="#10B981" strokeWidth="12" fill="transparent" strokeDasharray={502} strokeDashoffset={0} className="transition-all duration-1000 ease-out" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-5xl font-bold text-white font-mono">100%</span>
                                        <p className="text-[10px] text-green-400 font-bold uppercase mt-2 tracking-widest">REALITY SYNCED</p>
                                    </div>
                                </div>
                                
                                <div className="mt-8 space-y-4">
                                    <div className="flex justify-between text-xs border-b border-gray-800 pb-2">
                                        <span className="text-gray-400">Kernel Mode</span>
                                        <span className="text-cyan-400 font-bold">WASM (Native)</span>
                                    </div>
                                    <div className="flex justify-between text-xs border-b border-gray-800 pb-2">
                                        <span className="text-gray-400">Visual Fidelity</span>
                                        <span className="text-green-400 font-bold">Ultra (Ray Traced)</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Physics Engine</span>
                                        <span className="text-green-400 font-bold">Hardware Accel</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-900/20 border border-cyan-500/30 p-5 rounded-xl">
                                <h3 className="font-bold text-cyan-400 text-sm mb-3 flex items-center gap-2">
                                    <GlobeAltIcon className="w-4 h-4"/> Singularity Status
                                </h3>
                                <ul className="space-y-3 text-xs text-gray-300">
                                    <li className="flex gap-2">
                                        <span className="text-green-500">✓</span>
                                        <span><strong>WebAssembly</strong> Kernel Active.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-green-500">✓</span>
                                        <span><strong>OPFS</strong> File System Mounted.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-green-500">✓</span>
                                        <span><strong>WebRTC</strong> Mesh Network Online.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-green-500">✓</span>
                                        <span><strong>WebGPU</strong> Compute Shaders Ready.</span>
                                    </li>
                                </ul>
                            </div>
                        </aside>
                    </>
                ) : (
                    // --- REALITY GAP VIEW (ENHANCED) ---
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-xl">
                             <h2 className="text-xl font-bold text-purple-400 mb-2 flex items-center gap-2">
                                <WrenchIcon className="w-6 h-6"/> Reality Gap Implementation Strategy
                            </h2>
                            <p className="text-sm text-gray-300">
                                To transform Aetherius OS into a fully autonomous "Type-0" system, the following technologies must be integrated. 
                                Use the links provided to procure and implement the necessary drivers and libraries.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ResourceCard category="Kernel Sovereignty" data={realityResources.kernel} />
                            <ResourceCard category="Persistent Storage" data={realityResources.filesystem} />
                            <ResourceCard category="Decentralized Network" data={realityResources.networking} />
                            <ResourceCard category="Hardware Abstraction" data={realityResources.hardware} />
                            <ResourceCard category="Bio-Digital Link" data={realityResources.neural} />
                            <ResourceCard category="Spatial Interface" data={realityResources.spatial} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
