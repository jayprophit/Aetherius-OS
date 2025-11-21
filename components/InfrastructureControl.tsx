
import React, { useState, useEffect } from 'react';
import { 
    BoltIcon, ServerIcon, CircleStackIcon, SignalIcon, 
    ShieldCheckIcon, ArrowPathIcon, ExclamationTriangleIcon, 
    BeakerIcon, FireIcon, CpuChipIcon, CubeIcon, WrenchIcon,
    ChartBarIcon, StopIcon, PlayIcon, GlobeAltIcon
} from './Icons';

// --- Types & Data ---
type RigArchetype = 'Scientific' | 'Gamer' | 'Enterprise' | 'Bio-Organic';

interface HardwareModule {
    id: string;
    name: string;
    type: 'Processing' | 'Cooling' | 'Storage' | 'Power';
    status: 'Online' | 'Optimizing' | 'Overclocked' | 'Idle';
    load: number;
    temp: number;
}

const archetypes: Record<RigArchetype, HardwareModule[]> = {
    'Scientific': [
        { id: 'qpu-1', name: 'D-Wave 9000 QPU', type: 'Processing', status: 'Online', load: 45, temp: 0.015 },
        { id: 'cool-1', name: 'He3 Dilution Fridge', type: 'Cooling', status: 'Online', load: 80, temp: -273 },
        { id: 'store-1', name: 'Holographic Crystal', type: 'Storage', status: 'Idle', load: 12, temp: 20 },
        { id: 'pow-1', name: 'Fusion Micro-Cell', type: 'Power', status: 'Online', load: 30, temp: 400 },
    ],
    'Gamer': [
        { id: 'gpu-1', name: 'NVIDIA-X Omniverse Core', type: 'Processing', status: 'Overclocked', load: 98, temp: 85 },
        { id: 'cool-2', name: 'Liquid Nitrogen Loop', type: 'Cooling', status: 'Online', load: 100, temp: -196 },
        { id: 'store-2', name: 'NVMe RAID 0 Array', type: 'Storage', status: 'Online', load: 60, temp: 45 },
        { id: 'pow-2', name: '1.6GW Reactor PSU', type: 'Power', status: 'Online', load: 90, temp: 60 },
    ],
    'Enterprise': [
        { id: 'cpu-1', name: 'Hive-Mind Cluster', type: 'Processing', status: 'Online', load: 75, temp: 50 },
        { id: 'net-1', name: 'Global Mesh Uplink', type: 'Storage', status: 'Online', load: 99, temp: 30 },
        { id: 'sec-1', name: 'Blockchain Sentinel', type: 'Processing', status: 'Online', load: 20, temp: 35 },
        { id: 'pow-3', name: 'Redundant Grid Tie', type: 'Power', status: 'Online', load: 40, temp: 25 },
    ],
    'Bio-Organic': [
        { id: 'bio-1', name: 'Organoid Neural Net', type: 'Processing', status: 'Optimizing', load: 88, temp: 37 },
        { id: 'cool-3', name: 'Homeostatic Fluid', type: 'Cooling', status: 'Online', load: 50, temp: 37 },
        { id: 'store-3', name: 'Synthetic DNA Vial', type: 'Storage', status: 'Idle', load: 5, temp: 4 },
        { id: 'pow-4', name: 'ATP Synthase Gen', type: 'Power', status: 'Online', load: 65, temp: 38 },
    ]
};

// --- Sub-Components ---

const Gauge: React.FC<{ label: string, value: number, max: number, unit: string, color: string }> = ({ label, value, max, unit, color }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 relative overflow-hidden">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                    <circle 
                        className={`transition-all duration-1000 ease-out ${color}`} 
                        strokeWidth="8" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="40" 
                        cx="50" 
                        cy="50" 
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-100">
                    <span className="text-xl font-bold font-mono">{value.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">{unit}</span>
                </div>
            </div>
            <span className="mt-2 text-sm font-bold text-gray-300 uppercase tracking-wider">{label}</span>
        </div>
    );
};

const ModuleCard: React.FC<{ module: HardwareModule }> = ({ module }) => (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center justify-between group hover:border-blue-500/50 transition-colors">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${module.type === 'Processing' ? 'bg-blue-900/20 text-blue-400' : module.type === 'Power' ? 'bg-yellow-900/20 text-yellow-400' : module.type === 'Cooling' ? 'bg-cyan-900/20 text-cyan-400' : 'bg-purple-900/20 text-purple-400'}`}>
                {module.type === 'Processing' ? <CpuChipIcon className="w-6 h-6"/> :
                 module.type === 'Power' ? <BoltIcon className="w-6 h-6"/> :
                 module.type === 'Cooling' ? <FireIcon className="w-6 h-6"/> :
                 <CircleStackIcon className="w-6 h-6"/>}
            </div>
            <div>
                <h4 className="font-bold text-gray-200">{module.name}</h4>
                <p className="text-xs text-gray-500">{module.type} Unit</p>
            </div>
        </div>
        <div className="text-right">
             <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full mb-1 inline-block ${module.status === 'Online' ? 'bg-green-900/30 text-green-400' : module.status === 'Overclocked' ? 'bg-red-900/30 text-red-400 animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                {module.status}
             </div>
             <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                <span>LOAD: {module.load}%</span>
                <span>TEMP: {module.temp}°C</span>
             </div>
        </div>
    </div>
);

// --- Main Component ---

export const InfrastructureControl: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'Forge' | 'Network'>('Overview');
    const [archetype, setArchetype] = useState<RigArchetype>('Scientific');
    const [modules, setModules] = useState<HardwareModule[]>(archetypes['Scientific']);
    const [isBooting, setIsBooting] = useState(false);

    // Live Data Simulation
    const [zpeOutput, setZpeOutput] = useState(98.4);
    const [coherence, setCoherence] = useState(99.9);
    const [dnaIntegrity, setDnaIntegrity] = useState(100);
    const [netThroughput, setNetThroughput] = useState(880);

    useEffect(() => {
        const interval = setInterval(() => {
            setZpeOutput(p => Math.min(120, Math.max(80, p + (Math.random() - 0.5) * 2)));
            setCoherence(p => Math.min(100, Math.max(90, p + (Math.random() - 0.5) * 0.1)));
            setNetThroughput(p => Math.min(1200, Math.max(500, p + (Math.random() - 0.5) * 50)));
            
            // Update modules slightly
            setModules(prev => prev.map(m => ({
                ...m,
                load: Math.min(100, Math.max(0, m.load + (Math.random() - 0.5) * 5))
            })));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSwitchArchetype = (type: RigArchetype) => {
        setIsBooting(true);
        setArchetype(type);
        setTimeout(() => {
            setModules(archetypes[type]);
            setIsBooting(false);
        }, 1500);
    };

    return (
        <div className="h-full bg-gray-950 text-gray-100 p-4 sm:p-6 overflow-y-auto animate-fade-in font-sans flex flex-col">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                        <ServerIcon className="w-8 h-8 text-indigo-500" />
                        Infrastructure Control
                    </h1>
                    <p className="text-gray-400 mt-1 font-mono text-sm">Global Hardware Orchestration | Root Access Level 0</p>
                </div>
                <div className="flex gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
                    {['Overview', 'Forge', 'Network'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === tab ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 mt-6 overflow-y-auto">
                {activeTab === 'Overview' && (
                    <div className="space-y-8">
                        {/* Gauges */}
                        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Gauge label="ZPE Output" value={zpeOutput} max={120} unit="TW" color="text-yellow-400" />
                            <Gauge label="Q-Coherence" value={coherence} max={100} unit="%" color="text-blue-400" />
                            <Gauge label="DNA Integrity" value={dnaIntegrity} max={100} unit="%" color="text-pink-400" />
                            <Gauge label="Throughput" value={netThroughput} max={1200} unit="Tbps" color="text-cyan-400" />
                        </section>

                        {/* Active Modules Grid */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                                    <CpuChipIcon className="w-5 h-5 text-gray-500"/> Active Hardware Stack
                                </h2>
                                <span className="text-xs font-mono text-gray-500">ARCHETYPE: {archetype.toUpperCase()}</span>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {modules.map(m => <ModuleCard key={m.id} module={m} />)}
                            </div>
                        </section>

                        {/* Console */}
                        <section className="bg-black rounded-lg border border-gray-800 p-4 font-mono text-xs h-48 overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-2 text-gray-500">
                                <span>SYSTEM_LOG_STREAM</span>
                                <span className="animate-pulse text-green-500">● LIVE</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1 opacity-80">
                                <p className="text-blue-400">> [KERNEL] Hardware abstraction layer synced.</p>
                                <p className="text-gray-400">> [COOLING] Cryo-pumps operating at 98% efficiency.</p>
                                <p className="text-yellow-500">> [WARN] Thermal spike detected in Sector 7 (Virtual GPU). Fans spooling.</p>
                                <p className="text-gray-400">> [NET] Handshake established with 12,400 remote nodes.</p>
                                <p className="text-green-500">> [SYS] All systems nominal. Ready for heavy compute tasks.</p>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'Forge' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                        {/* Archetype Selector */}
                        <div className="lg:col-span-1 space-y-4">
                            <h2 className="text-xl font-bold text-white mb-4">Select Build Archetype</h2>
                            {(Object.keys(archetypes) as RigArchetype[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleSwitchArchetype(type)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${archetype === type ? 'bg-blue-900/20 border-blue-500 ring-1 ring-blue-500' : 'bg-gray-900 border-gray-800 hover:bg-gray-800'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg">{type}</span>
                                        {archetype === type && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        {type === 'Scientific' ? 'Optimized for simulation, folding, and quantum calculation.' :
                                         type === 'Gamer' ? 'Maximum framerates, ray-tracing, and sensory immersion.' :
                                         type === 'Enterprise' ? 'High availability, massive storage, and distributed consensus.' :
                                         'Experimental neural interfacing and wetware processing.'}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {/* Build Visualization */}
                        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6 relative overflow-hidden flex flex-col items-center justify-center">
                            {isBooting ? (
                                <div className="flex flex-col items-center gap-4">
                                    <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin" />
                                    <p className="font-mono text-blue-400">RECONFIGURING VIRTUAL SUBSTRATE...</p>
                                </div>
                            ) : (
                                <>
                                    <div className={`absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')]`}></div>
                                    <div className="relative z-10 grid grid-cols-2 gap-8 w-full max-w-2xl">
                                        {modules.map((m, i) => (
                                            <div key={i} className="bg-black/50 backdrop-blur-md border border-gray-700 p-4 rounded-lg flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                                                <div className={`p-3 rounded-full ${m.type === 'Power' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                    {m.type === 'Processing' ? <CpuChipIcon className="w-6 h-6"/> : <BoltIcon className="w-6 h-6"/>}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 font-bold uppercase">{m.type}</p>
                                                    <p className="font-bold text-gray-100">{m.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute bottom-6 right-6">
                                        <span className="px-3 py-1 bg-green-900/30 border border-green-800 text-green-400 rounded text-xs font-mono">
                                            BUILD_VERIFIED_v24.2
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'Network' && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <GlobeAltIcon className="w-24 h-24 text-gray-800 mb-6" />
                        <h2 className="text-2xl font-bold text-gray-300">Global Topology Visualization</h2>
                        <p className="text-gray-500 max-w-md mt-2">
                            Rendering the 3D node map of the distributed Aetherius network. Active nodes: 14,203. Latency: 12ms.
                        </p>
                        <div className="mt-8 w-full max-w-3xl h-64 bg-gray-900 border border-gray-800 rounded-lg relative overflow-hidden">
                             {/* Fake map animation */}
                             <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping absolute top-1/2 left-1/2"></div>
                                <div className="w-1 h-1 bg-purple-500 rounded-full animate-ping absolute top-1/3 left-1/3 animation-delay-500"></div>
                                <div className="w-1 h-1 bg-green-500 rounded-full animate-ping absolute bottom-1/4 right-1/4 animation-delay-1000"></div>
                                <svg className="absolute inset-0 w-full h-full opacity-20">
                                    <line x1="50%" y1="50%" x2="33%" y2="33%" stroke="currentColor" strokeWidth="1" className="text-blue-500"/>
                                    <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="currentColor" strokeWidth="1" className="text-blue-500"/>
                                </svg>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
