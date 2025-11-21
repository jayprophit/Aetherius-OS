
import React, { useState, useEffect } from 'react';
import { 
    ShieldCheckIcon, LockClosedIcon, CubeTransparentIcon, GlobeAltIcon, 
    ClockIcon, UserCircleIcon, BeakerIcon, SparklesIcon, EyeIcon, BoltIcon,
    ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon, FireIcon,
    CubeIcon, ServerIcon, ClipboardDocumentCheckIcon
} from './Icons';

// The Omni-Dimensional Security Polyhedron - Dimension Map
const dimensionsData = [
    // Absolute Realm (Foundational)
    { id: '0D', name: 'Singularity Root', description: 'Hardware-enforced root of trust. The atomic level of security.', realm: 'Absolute', icon: LockClosedIcon, color: 'text-gray-200' },
    { id: '1D', name: 'Physical Barrier', description: 'Quantum-physical access locks and biometric hardware gates.', realm: 'Absolute', icon: ShieldCheckIcon, color: 'text-gray-300' },
    
    // Structural Realm (Architecture)
    { id: '2D', name: 'Planar Segmentation', description: 'VLANs, flat security zones, and standard network separation.', realm: 'Structural', icon: CubeTransparentIcon, color: 'text-blue-400' },
    { id: '3D', name: 'Volumetric Firewall', description: 'Nested firewalls, deep packet inspection, and layered depth.', realm: 'Structural', icon: CubeIcon, color: 'text-blue-500' },
    { id: '27D', name: 'Crystalline Lattice', description: 'Self-healing security structures with rigid yet flexible redundancy.', realm: 'Structural', icon: SparklesIcon, color: 'text-blue-300' },

    // Dynamic Realm (Adaptive)
    { id: '4D', name: 'Temporal Defense', description: 'Time-based policies, session lifespans, and causality checks.', realm: 'Dynamic', icon: ClockIcon, color: 'text-green-500' },
    { id: '5D', name: 'Behavioral Analytics', description: 'UEBA, dynamic risk scoring, and anomaly detection.', realm: 'Dynamic', icon: UserCircleIcon, color: 'text-green-400' },
    { id: '26D', name: 'Plasma Shield', description: 'Dynamic, self-organizing conductive defense that behaves like plasma.', realm: 'Dynamic', icon: FireIcon, color: 'text-orange-500' },

    // Cognitive Realm (Intelligent)
    { id: '6D', name: 'Contextual Awareness', description: 'Environmental, device, and location state verification.', realm: 'Cognitive', icon: GlobeAltIcon, color: 'text-yellow-500' },
    { id: '7D', name: 'Predictive AI', description: 'Threat forecasting and pre-crime attack path simulation.', realm: 'Cognitive', icon: EyeIcon, color: 'text-yellow-400' },
    { id: '9D', name: 'Cognitive Intent', description: 'Natural language policy creation and intent analysis.', realm: 'Cognitive', icon: BeakerIcon, color: 'text-yellow-300' },
    { id: '15D', name: 'Psychological Shield', description: 'Social engineering detection and cognitive defense patterns.', realm: 'Cognitive', icon: UserCircleIcon, color: 'text-yellow-600' },

    // Advanced Tech Realm (Quantum/Future)
    { id: '11D', name: 'Quantum Shield', description: 'Post-quantum cryptography and superposition defense.', realm: 'Advanced Tech', icon: BoltIcon, color: 'text-purple-500' },
    { id: '12D', name: 'Holographic Dist.', description: 'Fractal security where every part contains the whole.', realm: 'Advanced Tech', icon: CubeTransparentIcon, color: 'text-purple-400' },
    { id: '13D', name: 'Temporal Paradox', description: 'Forward secrecy and cryptographic agility against time attacks.', realm: 'Advanced Tech', icon: ClockIcon, color: 'text-purple-600' },

    // Existential Realm (Reality/Truth)
    { id: '23D', name: 'Reality Anchor', description: 'Protection against reality-manipulating attacks and deepfakes.', realm: 'Existential', icon: LockClosedIcon, color: 'text-red-500' },
    { id: '30D', name: 'Noospheric Mind', description: 'Protection of the global collective intelligence.', realm: 'Existential', icon: GlobeAltIcon, color: 'text-red-400' },
    { id: '32D', name: 'Kabbalistic Geometry', description: 'Security based on sacred geometry and numerical patterns.', realm: 'Existential', icon: SparklesIcon, color: 'text-red-300' },

    // Cosmic Realm (Universal)
    { id: '29D', name: 'Gravitational Well', description: 'Attracts and analyzes traffic in high-gravity security zones.', realm: 'Cosmic', icon: GlobeAltIcon, color: 'text-indigo-500' },
    { id: '40D', name: 'Dark Matter', description: 'Invisible security influence that cannot be directly detected.', realm: 'Cosmic', icon: EyeIcon, color: 'text-indigo-400' },
    { id: '42D', name: 'Cosmic Sync', description: 'Universal pulsar timing synchronization for perfect coordination.', realm: 'Cosmic', icon: SparklesIcon, color: 'text-indigo-300' },

    // Meta Realm (Self-Reflective)
    { id: '10D', name: 'Meta-Security', description: 'The system that secures the security system itself.', realm: 'Meta', icon: ShieldCheckIcon, color: 'text-white' },
];

const realms = Array.from(new Set(dimensionsData.map(d => d.realm)));

const threatTypes = [
    'Memetic Virus', 'Temporal Inversion', 'Quantum Decoherence', 'SQL Injection', 
    'Narrative Breach', 'Entropy Spike', 'Zero-Day Exploit', 'Social Engineering'
];

const actions = [
    'Neutralized', 'Collapsed', 'Stabilized', 'Blocked (2D)', 'Rewritten', 'Isolated', 'Purged'
];

// CISA Data
const nodeStandards = [
    { id: 1, check: 'MFA Enforced (Root)', status: 'Pass' },
    { id: 2, check: 'Data Encryption (At Rest)', status: 'Pass' },
    { id: 3, check: 'Data Encryption (In Transit)', status: 'Pass' },
    { id: 4, check: 'Least Privilege Access', status: 'Warning' },
    { id: 5, check: 'Auto-Patching Enabled', status: 'Pass' },
    { id: 6, check: 'Immutable Logging', status: 'Pass' },
    { id: 7, check: 'Air-Gapped Backup', status: 'Pass' },
];

const softwareInventory = [
    { id: 1, name: 'AetherKernel', version: '5.14.2-q', status: 'Secure', cve: null },
    { id: 2, name: 'OpenSSL-Quantum', version: '3.4.1', status: 'Secure', cve: null },
    { id: 3, name: 'Node.js', version: '20.9.0', status: 'Vulnerable', cve: 'CVE-2024-22019' },
    { id: 4, name: 'PyTorch-Fusion', version: '2.1.1', status: 'Secure', cve: null },
    { id: 5, name: 'Docker-Runtime', version: '24.0.5', status: 'Secure', cve: null },
];

interface LogEntry {
    id: number;
    time: string;
    type: string;
    source: string;
    action: string;
}

export const Firewall: React.FC = () => {
    const [viewMode, setViewMode] = useState<'Defense' | 'Compliance'>('Defense');
    const [activeRealm, setActiveRealm] = useState<string>('All');
    const [logs, setLogs] = useState<LogEntry[]>([
        { id: 1, time: new Date().toLocaleTimeString(), type: 'System Init', source: 'Core', action: 'Polyhedron Assembled' }
    ]);
    const [integrity, setIntegrity] = useState(100);
    const [rotation, setRotation] = useState(0);
    
    // Compliance States
    const [softwareList, setSoftwareList] = useState(softwareInventory);
    const [lastAudit, setLastAudit] = useState<string>('2 hours ago');
    const [isAuditing, setIsAuditing] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setRotation(r => r + 0.5);
            if (Math.random() > 0.6 && viewMode === 'Defense') {
                const type = threatTypes[Math.floor(Math.random() * threatTypes.length)];
                const action = actions[Math.floor(Math.random() * actions.length)];
                const newLog = {
                    id: Date.now(),
                    time: new Date().toLocaleTimeString(),
                    type,
                    source: `Sector ${Math.floor(Math.random() * 99)}`,
                    action
                };
                setLogs(prev => [newLog, ...prev.slice(0, 50)]);
                setIntegrity(prev => Math.min(100, Math.max(98, prev + (Math.random() - 0.5))));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [viewMode]);

    const handlePatch = (id: number) => {
        setSoftwareList(prev => prev.map(item => 
            item.id === id ? { ...item, status: 'Secure', cve: null, version: item.version + '-p1' } : item
        ));
    };

    const runAudit = () => {
        setIsAuditing(true);
        setTimeout(() => {
            setIsAuditing(false);
            setLastAudit('Just now');
        }, 2000);
    };

    const filteredDimensions = activeRealm === 'All' ? dimensionsData : dimensionsData.filter(d => d.realm === activeRealm);

    const renderPolyhedron = () => (
        <div className="relative h-80 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-gray-800 shadow-2xl perspective-1000">
            {/* 3D Polyhedron Visualizer */}
            <div 
                className="relative w-48 h-48 transform-style-3d transition-transform duration-100"
                style={{ transform: `rotateY(${rotation}deg) rotateX(${rotation * 0.5}deg)` }}
            >
                {/* Core */}
                <div className="absolute inset-0 border-2 border-blue-500/50 rounded-full animate-pulse opacity-50 transform translate-z-10"></div>
                <div className="absolute inset-0 border-2 border-purple-500/50 rounded-full animate-pulse opacity-50 transform rotate-90 translate-z-10"></div>
                <div className="absolute inset-0 border-2 border-green-500/50 rounded-full animate-pulse opacity-50 transform rotate-45 translate-z-10"></div>
                
                {/* Outer Shell Faces (Simulated with CSS transforms) */}
                <div className="absolute w-full h-full border border-cyan-500/30 bg-cyan-500/5 transform translate-z-12"></div>
                <div className="absolute w-full h-full border border-cyan-500/30 bg-cyan-500/5 transform -translate-z-12"></div>
                <div className="absolute w-full h-full border border-cyan-500/30 bg-cyan-500/5 transform rotate-y-90 translate-z-12"></div>
                <div className="absolute w-full h-full border border-cyan-500/30 bg-cyan-500/5 transform rotate-y-90 -translate-z-12"></div>
                <div className="absolute w-full h-full border border-cyan-500/30 bg-cyan-500/5 transform rotate-x-90 translate-z-12"></div>
                <div className="absolute w-full h-full border border-cyan-500/30 bg-cyan-500/5 transform rotate-x-90 -translate-z-12"></div>

                {/* Inner Icon */}
                <div className="absolute inset-0 flex items-center justify-center transform -rotate-y-0">
                     <ShieldCheckIcon className="w-20 h-20 text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                </div>
            </div>
            
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping"></div>
                <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping delay-1000"></div>
                <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-500"></div>
            </div>

            {/* HUD Overlay */}
            <div className="absolute top-4 left-4 font-mono text-xs text-blue-400 bg-black/50 p-2 rounded border border-blue-500/30 backdrop-blur-sm">
                <div>POLYHEDRON: ONLINE</div>
                <div>DIMENSIONS: {dimensionsData.length}</div>
                <div>REALMS: {realms.length}</div>
            </div>
            <div className="absolute bottom-4 right-4 font-mono text-xs text-green-400 bg-black/50 p-2 rounded border border-green-500/30 backdrop-blur-sm text-right">
                <div>INTEGRITY: {integrity.toFixed(2)}%</div>
                <div>THREAT_LEVEL: LOW</div>
                <div>SYNC: LOCKED</div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-100 overflow-hidden animate-fade-in">
            <header className="p-4 sm:p-6 border-b border-gray-800 bg-gray-900/95 backdrop-blur z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
                        <ShieldCheckIcon className="w-8 h-8 text-blue-500" />
                        Omni-Dimensional Security
                    </h1>
                    <p className="text-gray-400 text-xs md:text-sm mt-1 font-mono tracking-wide">POLYHEDRON ARCHITECTURE: 0D - 42D+</p>
                </div>
                <div className="flex gap-3 bg-gray-800 p-1 rounded-lg border border-gray-700">
                    <button 
                        onClick={() => setViewMode('Defense')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${viewMode === 'Defense' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Live Defense
                    </button>
                    <button 
                        onClick={() => setViewMode('Compliance')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${viewMode === 'Compliance' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        CISA Compliance
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {viewMode === 'Defense' ? (
                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        {/* Left Panel: Visualizer & Logs */}
                        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
                            {renderPolyhedron()}
                            
                            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex-1 min-h-[300px]">
                                <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                                    <h3 className="font-bold text-sm flex items-center gap-2">
                                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500"/> 
                                        Active Threat Matrix
                                    </h3>
                                    <span className="text-xs text-gray-500 font-mono">LIVE FEED</span>
                                </div>
                                <div className="overflow-y-auto max-h-[400px]">
                                    {logs.map((log) => (
                                        <div key={log.id} className="p-2 px-3 border-b border-gray-700/50 flex items-center justify-between text-xs hover:bg-gray-700/30 font-mono">
                                            <span className="text-gray-500 w-20">{log.time}</span>
                                            <span className="text-blue-400 w-24">{log.source}</span>
                                            <span className="text-yellow-400 flex-1 truncate px-2">{log.type}</span>
                                            <span className="text-green-400 text-right">{log.action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Dimensions Grid */}
                        <div className="w-full lg:w-96 bg-gray-800/50 border-l border-gray-800 flex flex-col">
                            <div className="p-4 border-b border-gray-800">
                                <h3 className="font-bold text-sm mb-3 text-gray-300">Security Realms</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        onClick={() => setActiveRealm('All')}
                                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${activeRealm === 'All' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'}`}
                                    >
                                        All
                                    </button>
                                    {realms.map(realm => (
                                        <button 
                                            key={realm}
                                            onClick={() => setActiveRealm(realm)}
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${activeRealm === realm ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'}`}
                                        >
                                            {realm}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {filteredDimensions.map(dim => (
                                    <div key={dim.id} className="bg-gray-900 p-3 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all group">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded bg-gray-800 ${dim.color}`}>
                                                <dim.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-sm ${dim.color}`}>{dim.id}</span>
                                                    <span className="text-gray-200 text-sm font-semibold">{dim.name}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{dim.description}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 h-0.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500/50 w-full animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- CISA COMPLIANCE VIEW ---
                    <div className="flex-1 p-6 overflow-y-auto bg-gray-900">
                        <div className="max-w-6xl mx-auto space-y-6">
                            <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-800/50 p-6 rounded-xl flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">CISA Compliance Dashboard</h2>
                                    <p className="text-gray-400 text-sm">Automated validation against Cybersecurity & Infrastructure Security Agency guidelines.</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Audit Status</div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${isAuditing ? 'bg-yellow-500 animate-ping' : 'bg-green-500'}`}></div>
                                        <span className="font-mono text-white">{isAuditing ? 'RUNNING...' : 'COMPLIANT'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Secure Node Standards */}
                                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
                                        <ServerIcon className="w-5 h-5 text-blue-400"/> Secure Node Standards
                                    </h3>
                                    <div className="space-y-4">
                                        {nodeStandards.map(standard => (
                                            <div key={standard.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                                <div className="flex items-center gap-3">
                                                    {standard.status === 'Pass' ? 
                                                        <CheckCircleIcon className="w-5 h-5 text-green-500" /> : 
                                                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                                                    }
                                                    <span className="text-sm font-medium text-gray-200">{standard.check}</span>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${
                                                    standard.status === 'Pass' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
                                                }`}>
                                                    {standard.status.toUpperCase()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Software Validation */}
                                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg flex flex-col">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
                                        <CubeIcon className="w-5 h-5 text-purple-400"/> Software Inventory & KEV
                                    </h3>
                                    <div className="flex-1 overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-900/50">
                                                <tr>
                                                    <th className="px-3 py-2">Component</th>
                                                    <th className="px-3 py-2">Version</th>
                                                    <th className="px-3 py-2 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {softwareList.map(sw => (
                                                    <tr key={sw.id} className="hover:bg-gray-700/30">
                                                        <td className="px-3 py-3 font-medium text-gray-200">{sw.name}</td>
                                                        <td className="px-3 py-3 text-gray-400 font-mono text-xs">{sw.version}</td>
                                                        <td className="px-3 py-3 text-right">
                                                            {sw.status === 'Secure' ? (
                                                                <span className="text-green-400 text-xs font-bold flex items-center justify-end gap-1">
                                                                    <CheckCircleIcon className="w-3 h-3"/> Secure
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <span className="text-red-400 text-xs font-bold" title={sw.cve || ''}>VULNERABLE</span>
                                                                    <button 
                                                                        onClick={() => handlePatch(sw.id)}
                                                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] rounded font-bold"
                                                                    >
                                                                        PATCH
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Audit Controls */}
                            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-900 rounded-full border border-gray-600">
                                        <ClipboardDocumentCheckIcon className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">Periodic Security Audit</h4>
                                        <p className="text-sm text-gray-400">Automated deep-scan of all nodes and software dependencies.</p>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-500 font-mono">
                                            <span>LAST RUN: {lastAudit}</span>
                                            <span>NEXT RUN: 22:00:00</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={runAudit}
                                    disabled={isAuditing}
                                    className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
                                        isAuditing ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
                                    }`}
                                >
                                    {isAuditing ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <BoltIcon className="w-5 h-5"/>}
                                    {isAuditing ? 'Auditing System...' : 'Run Manual Audit'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
