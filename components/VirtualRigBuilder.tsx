


import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    CpuChipIcon, CircleStackIcon, ServerIcon, BoltIcon, 
    SpeakerWaveIcon, Square2StackIcon, WrenchIcon, 
    EyeIcon, ArrowPathIcon, PlusIcon, CheckCircleIcon, 
    XMarkIcon, SparklesIcon, CubeTransparentIcon, ChipIcon,
    GlobeAltIcon, ShieldCheckIcon, ExclamationTriangleIcon,
    PlayIcon, StopIcon, ChartBarIcon, ShareIcon, LinkIcon, 
    MagnifyingGlassIcon, TrashIcon
} from './Icons';
import { 
    RigState, HardwareComponent, ComponentType, 
    componentDatabase, rigService 
} from '../services/RigService';

// --- 3D Visualizer Components ---

const ConnectionLine: React.FC<{ x1: number; y1: number; x2: number; y2: number; color: string; active: boolean }> = ({ x1, y1, x2, y2, color, active }) => {
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return (
        <div 
            className={`absolute h-0.5 origin-center-left pointer-events-none z-0 transition-all duration-500 ${active ? 'opacity-100 animate-pulse' : 'opacity-30'}`}
            style={{ 
                width: length, 
                left: x1, 
                top: y1, 
                backgroundColor: color,
                transform: `rotate(${angle}deg)`, 
                transformOrigin: '0 50%',
                boxShadow: active ? `0 0 8px ${color}` : 'none'
            }}
        />
    );
};

const ChassisSlot: React.FC<{
    type: ComponentType;
    components: HardwareComponent[];
    x: number; y: number; w: number; h: number;
    onInteract: (type: ComponentType) => void;
    inspectionMode: boolean;
}> = ({ type, components, x, y, w, h, onInteract, inspectionMode }) => {
    
    const count = components.length;
    const isEmpty = count === 0;
    
    // Status Color Logic
    let statusColor = 'border-gray-600 bg-gray-900/50';
    if (isEmpty) statusColor = 'border-red-500/50 bg-red-900/20'; // Critical missing
    else if (count > 0) statusColor = 'border-green-500/50 bg-green-900/30';
    
    // Icon Selection
    const getIcon = () => {
        if (type.includes('CPU')) return <CpuChipIcon className="w-6 h-6"/>;
        if (type.includes('QPU')) return <SparklesIcon className="w-8 h-8 animate-spin-slow"/>;
        if (type.includes('GPU')) return <CubeTransparentIcon className="w-6 h-6"/>;
        if (type.includes('RAM')) return <CircleStackIcon className="w-5 h-5"/>;
        if (type.includes('Cooling')) return <ArrowPathIcon className="w-6 h-6 animate-spin"/>;
        if (type.includes('Power')) return <BoltIcon className="w-6 h-6"/>;
        return <ChipIcon className="w-6 h-6"/>;
    };

    return (
        <div 
            className={`absolute border-2 rounded-md flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_currentColor] hover:scale-105 ${statusColor} backdrop-blur-sm group`}
            style={{ 
                left: x, top: y, width: w, height: h,
                transform: 'translateZ(20px)', // Slight 3D pop
                color: isEmpty ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)'
            }}
            onClick={(e) => { e.stopPropagation(); onInteract(type); }}
            title={!isEmpty ? `${count} Unit(s) Installed (Click to Manage)` : `Empty ${type.split('_')[1]} Slot (Click to Install)`}
        >
            {getIcon()}
            <div className="mt-1 flex flex-col items-center">
                <span className="text-[8px] font-mono font-bold uppercase tracking-tighter bg-black/60 px-1 rounded mb-0.5">
                    {type.split('_')[1]}
                </span>
                {!isEmpty && (
                    <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 rounded-full">
                        x{count}
                    </span>
                )}
            </div>
            
            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-sm z-10">
                <div className="text-white flex flex-col items-center">
                    <WrenchIcon className="w-5 h-5 mb-1" />
                    <span className="text-[8px] font-bold">CONFIGURE</span>
                </div>
            </div>
            
            {/* Stack effect visualization */}
            {count > 1 && (
                <div className="absolute -right-1 -bottom-1 w-full h-full border border-gray-500/30 bg-gray-800/30 rounded-md -z-10"></div>
            )}
        </div>
    );
};

const RigViewport: React.FC<{ 
    rig: RigState, 
    onSlotClick: (type: ComponentType) => void,
    inspectionMode: boolean
}> = ({ rig, onSlotClick, inspectionMode }) => {
    const [rotation, setRotation] = useState({ x: 20, y: -15 }); // Default isometric-ish view
    const [isDragging, setIsDragging] = useState(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - lastMouse.current.x;
        const deltaY = e.clientY - lastMouse.current.y;
        setRotation(prev => ({
            x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.5)),
            y: Math.max(-60, Math.min(60, prev.y + deltaX * 0.5))
        }));
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    // Helper coordinates for slots centers to draw lines
    const centers = {
        Binary_CPU: { x: 80, y: 80 },
        Ternary_CPU: { x: 255, y: 95 },
        Quantum_QPU: { x: 440, y: 100 },
        Bridge_Controller: { x: 355, y: 380 }
    };

    return (
        <div 
            className="w-full h-full bg-gray-950 relative overflow-hidden cursor-move flex items-center justify-center perspective-1000"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
        >
            {/* 3D Chassis Container */}
            <div 
                style={{ 
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    transformStyle: 'preserve-3d',
                    transition: isDragging ? 'none' : 'transform 0.5s ease-out',
                    width: '600px',
                    height: '450px',
                }}
                className="relative bg-gray-900 border-4 border-gray-700 rounded-xl shadow-2xl"
            >
                {/* Glass Front Panel Reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-lg z-20" style={{transform: 'translateZ(50px)'}}></div>

                {/* Internal Backplate */}
                <div className="absolute inset-2 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-50 rounded z-0"></div>
                
                {/* Motherboard Trace Lines (Decoration) */}
                <svg className="absolute inset-0 w-full h-full z-0 opacity-20 pointer-events-none">
                    <path d="M 50 50 L 50 400 L 550 400" stroke="#3b82f6" strokeWidth="2" fill="none" />
                    <path d="M 100 50 L 100 350 L 550 350" stroke="#eab308" strokeWidth="2" fill="none" />
                    <path d="M 150 50 L 150 300 L 550 300" stroke="#a855f7" strokeWidth="2" fill="none" />
                </svg>

                {/* --- WIRES / CONNECTIONS --- */}
                {/* Connecting Sectors to Bridge */}
                <ConnectionLine x1={centers.Binary_CPU.x} y1={centers.Binary_CPU.y} x2={centers.Bridge_Controller.x} y2={centers.Bridge_Controller.y} color="#3b82f6" active={true} />
                <ConnectionLine x1={centers.Ternary_CPU.x} y1={centers.Ternary_CPU.y} x2={centers.Bridge_Controller.x} y2={centers.Bridge_Controller.y} color="#f59e0b" active={true} />
                <ConnectionLine x1={centers.Quantum_QPU.x} y1={centers.Quantum_QPU.y} x2={centers.Bridge_Controller.x} y2={centers.Bridge_Controller.y} color="#a855f7" active={true} />

                {/* --- COMPONENTS LAYOUT --- */}
                
                {/* Power & Bridge (Bottom Section) */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-bold tracking-widest">BRIDGE & POWER</div>
                <ChassisSlot type="Power_Matrix" components={rig.Power_Matrix} x={450} y={350} w={120} h={80} onInteract={onSlotClick} inspectionMode={inspectionMode} />
                <ChassisSlot type="Bridge_Controller" components={rig.Bridge_Controller} x={280} y={350} w={150} h={60} onInteract={onSlotClick} inspectionMode={inspectionMode} />
                
                {/* Binary Sector (Left) */}
                <div className="absolute left-4 top-4 text-[10px] text-blue-500 font-bold border-b border-blue-500/50 pb-1 w-32">BINARY SECTOR</div>
                <ChassisSlot type="Binary_CPU" components={rig.Binary_CPU} x={40} y={40} w={80} h={80} onInteract={onSlotClick} inspectionMode={inspectionMode} />
                <ChassisSlot type="Binary_RAM" components={rig.Binary_RAM} x={140} y={40} w={40} h={80} onInteract={onSlotClick} inspectionMode={inspectionMode} />
                <ChassisSlot type="Binary_GPU" components={rig.Binary_GPU} x={40} y={140} w={140} h={60} onInteract={onSlotClick} inspectionMode={inspectionMode} />
                <ChassisSlot type="Binary_Storage" components={rig.Binary_Storage} x={40} y={220} w={140} h={40} onInteract={onSlotClick} inspectionMode={inspectionMode} />

                {/* Ternary Sector (Middle) */}
                <div className="absolute left-1/2 -translate-x-1/2 top-4 text-[10px] text-orange-500 font-bold border-b border-orange-500/50 pb-1 w-32 text-center">TERNARY SECTOR</div>
                <ChassisSlot type="Ternary_CPU" components={rig.Ternary_CPU} x={220} y={60} w={70} h={70} onInteract={onSlotClick} inspectionMode={inspectionMode} />
                <ChassisSlot type="Ternary_RAM" components={rig.Ternary_RAM} x={310} y={60} w={30} h={70} onInteract={onSlotClick} inspectionMode={inspectionMode} />

                {/* Quantum Sector (Right) */}
                <div className="absolute right-4 top-4 text-[10px] text-purple-500 font-bold border-b border-purple-500/50 pb-1 w-32 text-right">QUANTUM CORE</div>
                <ChassisSlot type="Quantum_QPU" components={rig.Quantum_QPU} x={400} y={60} w={80} h={80} onInteract={onSlotClick} inspectionMode={inspectionMode} />
                <ChassisSlot type="Quantum_Cooling" components={rig.Quantum_Cooling} x={400} y={160} w={140} h={140} onInteract={onSlotClick} inspectionMode={inspectionMode} />
                
            </div>

            {/* Orientation Reset */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                 <button 
                    onClick={() => setRotation({ x: 20, y: -15 })}
                    className="p-2 bg-gray-800 rounded-md hover:bg-gray-700 text-xs text-white border border-gray-600 shadow-md"
                >
                    Reset View
                </button>
            </div>
        </div>
    );
};

// --- Stats & AI Advisor Panel ---

const StatsPanel: React.FC<{ 
    rig: RigState, 
    onBoot: () => void, 
    issues: string[],
    onReset: () => void,
    inspectionMode: boolean,
    setInspectionMode: (v: boolean) => void
}> = ({ rig, onBoot, issues, onReset, inspectionMode, setInspectionMode }) => {
    
    const stats = useMemo(() => rigService.calculateStats(rig), [rig]);
    const canBoot = issues.length === 0;

    return (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col p-4 overflow-y-auto z-20 shadow-xl">
            <h2 className="font-bold text-white mb-6 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-blue-400"/> System Diagnostics
            </h2>

            {/* AI Advisor / Inspection Toggle */}
            <div className="mb-6 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4"/> AI Overseer
                    </h3>
                    <label className="flex items-center cursor-pointer">
                        <span className="mr-2 text-[10px] text-gray-400 uppercase font-bold">{inspectionMode ? 'ON' : 'OFF'}</span>
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={inspectionMode} onChange={(e) => setInspectionMode(e.target.checked)} />
                            <div className={`block w-8 h-5 rounded-full ${inspectionMode ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition ${inspectionMode ? 'transform translate-x-3' : ''}`}></div>
                        </div>
                    </label>
                </div>
                <p className="text-xs text-gray-400 leading-tight">
                    {inspectionMode 
                        ? "Inspection Mode Active. Review component performance deltas." 
                        : "System nominal. Enable Inspection Mode for multi-chip analysis."}
                </p>
            </div>

            {/* Critical Issues Alert */}
            {issues.length > 0 && (
                <div className="mb-6 p-3 bg-red-900/20 border border-red-500/50 rounded-lg animate-pulse">
                    <h4 className="text-red-400 font-bold text-xs flex items-center gap-2 mb-2">
                        <ExclamationTriangleIcon className="w-4 h-4"/> SYSTEM CRITICAL
                    </h4>
                    <ul className="list-disc list-inside text-[10px] text-red-300 space-y-1">
                        {issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                    </ul>
                </div>
            )}

            <div className="space-y-6 mb-8">
                <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Coherence (Sync)</span>
                        <span className="text-yellow-400 font-bold">{Math.min(100, stats.coherence)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.coherence)}%` }}></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Power Grid Load</span>
                        <span className={`${stats.power > stats.capacity ? 'text-red-500 animate-pulse' : 'text-green-400'} font-bold`}>
                            {stats.power} / {stats.capacity} W
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className={`h-2 rounded-full transition-all duration-500 ${stats.power > stats.capacity ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (stats.power / (stats.capacity || 1)) * 100)}%` }}></div>
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                     <div className="bg-gray-900 p-2 rounded border border-gray-700">
                         <p className="text-[10px] text-gray-500 uppercase">Binary</p>
                         <p className="text-sm font-bold text-blue-400">{stats.perf.binary}</p>
                     </div>
                     <div className="bg-gray-900 p-2 rounded border border-gray-700">
                         <p className="text-[10px] text-gray-500 uppercase">Ternary</p>
                         <p className="text-sm font-bold text-orange-400">{stats.perf.ternary}</p>
                     </div>
                     <div className="bg-gray-900 p-2 rounded border border-gray-700">
                         <p className="text-[10px] text-gray-500 uppercase">Quantum</p>
                         <p className="text-sm font-bold text-purple-400">{stats.perf.quantum}</p>
                     </div>
                </div>
            </div>

            <div className="mt-auto space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={onReset} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-bold text-sm transition-colors">
                        Restore Defaults
                    </button>
                    <button 
                        onClick={onBoot} 
                        disabled={!canBoot}
                        className={`px-4 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all ${canBoot ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                    >
                        <PlayIcon className="w-4 h-4" /> Apply Build
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Component Drawer ---

const ComponentDrawer: React.FC<{
    slotType: ComponentType;
    onClose: () => void;
    onSelect: (component: HardwareComponent, action: 'add' | 'remove') => void;
    currentInstalled: HardwareComponent[];
    inspectionMode: boolean;
}> = ({ slotType, onClose, onSelect, currentInstalled, inspectionMode }) => {
    const parts = componentDatabase.filter(c => c.type === slotType);

    return (
        <div className="absolute inset-y-0 left-0 w-96 bg-gray-800 border-r border-gray-700 z-50 flex flex-col animate-slide-in-left shadow-2xl">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <WrenchIcon className="w-5 h-5 text-blue-500"/> Install {slotType.replace('_', ' ')}
                </h3>
                <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400 hover:text-white"/></button>
            </div>
            <div className="p-3 bg-blue-900/20 text-xs text-blue-300 border-b border-blue-900/30">
                 ℹ️ Multi-Chip Architecture Enabled. You can install multiple components in this slot.
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {parts.map(part => {
                    const count = currentInstalled.filter(c => c.id === part.id).length;
                    
                    return (
                        <div 
                            key={part.id} 
                            className={`p-4 rounded-lg border transition-all relative ${count > 0 ? 'bg-blue-900/20 border-blue-500' : 'bg-gray-700/50 border-transparent hover:bg-gray-600 hover:border-gray-500'}`}
                        >
                            {count > 0 && (
                                <div className="absolute top-2 right-2 flex items-center gap-2">
                                    <span className="text-blue-400 text-[10px] font-bold uppercase">x{count} Installed</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onSelect(part, 'remove'); }}
                                        className="p-1 bg-red-600 rounded text-white hover:bg-red-500"
                                        title="Remove one instance"
                                    >
                                        <TrashIcon className="w-3 h-3"/>
                                    </button>
                                </div>
                            )}
                            
                            <div className="cursor-pointer" onClick={() => onSelect(part, 'add')}>
                                <h4 className="font-bold text-white text-sm">{part.name}</h4>
                                <p className="text-xs text-gray-400 mb-2">{part.manufacturer} • {part.year}</p>
                                <p className="text-xs text-gray-300 leading-tight">{part.description}</p>
                                <div className="mt-3 flex gap-3 text-[10px] font-mono text-gray-400">
                                    <span className="flex items-center gap-1"><BoltIcon className="w-3 h-3 text-yellow-500"/> {part.powerDraw}W</span>
                                    <span className="flex items-center gap-1"><ChartBarIcon className="w-3 h-3 text-green-500"/> Score: {part.performanceScore}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const VirtualRigBuilder: React.FC = () => {
    const [rig, setRig] = useState<RigState>(rigService.getRig());
    const [activeSlot, setActiveSlot] = useState<ComponentType | null>(null);
    const [inspectionMode, setInspectionMode] = useState(false);
    const [validation, setValidation] = useState(rigService.validateRig(rig));

    // Sync with Service
    useEffect(() => {
        const sub = rigService.rigState$.subscribe(state => {
            setRig(state);
            setValidation(rigService.validateRig(state));
        });
        return () => sub.unsubscribe();
    }, []);

    const handleSlotInteract = (type: ComponentType) => {
        setActiveSlot(type);
    };

    const handlePartAction = (part: HardwareComponent, action: 'add' | 'remove') => {
        rigService.updatePart(part.type, part, action);
    };

    const handleReset = () => rigService.resetToDefault();
    
    const handleBoot = () => {
        alert("Configuration applied successfully. System metrics updated across the OmniChain.");
    };

    return (
        <div className="flex h-full bg-gray-900 text-white overflow-hidden animate-fade-in relative font-sans">
            {activeSlot && (
                <ComponentDrawer 
                    slotType={activeSlot} 
                    onClose={() => setActiveSlot(null)} 
                    onSelect={handlePartAction}
                    currentInstalled={rig[activeSlot]}
                    inspectionMode={inspectionMode}
                />
            )}

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-gray-700 flex items-center justify-between px-6 bg-gray-900 z-10">
                    <div className="flex items-center gap-3">
                        <ServerIcon className="w-8 h-8 text-blue-500" />
                        <div>
                            <h1 className="text-xl font-bold text-white">Virtual Rig Builder</h1>
                            <p className="text-xs text-gray-400 font-mono">3D Multi-Chip Assembly Environment | Cloud-Synced Virtual Hardware</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${validation.valid ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-red-900/20 border-red-500 text-red-400 animate-pulse'}`}>
                            {validation.valid ? 'SYSTEM NOMINAL' : 'SYSTEM CRITICAL'}
                        </div>
                    </div>
                </header>
                <div className="flex-1 relative bg-black">
                    <RigViewport 
                        rig={rig} 
                        onSlotClick={handleSlotInteract} 
                        inspectionMode={inspectionMode}
                    />
                </div>
            </div>

            <StatsPanel 
                rig={rig} 
                issues={validation.issues} 
                onBoot={handleBoot} 
                onReset={handleReset} 
                inspectionMode={inspectionMode}
                setInspectionMode={setInspectionMode}
            />
        </div>
    );
};
