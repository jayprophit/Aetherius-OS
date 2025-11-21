
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    CpuChipIcon, CircleStackIcon, ServerIcon, BoltIcon, 
    SpeakerWaveIcon, Square2StackIcon, WrenchIcon, 
    EyeIcon, ArrowPathIcon, PlusIcon, CheckCircleIcon, 
    XMarkIcon, SparklesIcon, CubeTransparentIcon, ChipIcon,
    GlobeAltIcon, ShieldCheckIcon, ExclamationTriangleIcon,
    PlayIcon, StopIcon, ChartBarIcon, ShareIcon, LinkIcon
} from './Icons';

// --- Types ---

type SystemParadigm = 'Binary' | 'Ternary' | 'Quantum' | 'Bridge';
type ComponentType = 
    // Binary
    | 'Binary_CPU' | 'Binary_GPU' | 'Binary_RAM' | 'Binary_Storage'
    // Ternary
    | 'Ternary_CPU' | 'Ternary_RAM'
    // Quantum
    | 'Quantum_QPU' | 'Quantum_Cooling'
    // Bridge (Sync)
    | 'Bridge_Controller' | 'Bridge_Accelerator' | 'Power_Matrix';

interface HardwareComponent {
    id: string;
    paradigm: SystemParadigm;
    type: ComponentType;
    name: string;
    manufacturer: string;
    year: string;
    specs: Record<string, string | number>;
    description: string;
    powerDraw: number; // Watts
    performanceScore: number; // 0-100
    heatGeneration: number; // 0-100
    coherenceBonus?: number; // Specifically for Bridge items
}

// --- Database of Components ---

const componentDatabase: HardwareComponent[] = [
    // --- BINARY SYSTEM ---
    {
        id: 'bin-cpu-1', paradigm: 'Binary', type: 'Binary_CPU', name: 'Core i9-14900K', manufacturer: 'Intel', year: '2023',
        specs: { 'Cores': '24', 'Clock': '6.0 GHz' }, description: 'Standard binary processor.', powerDraw: 250, performanceScore: 40, heatGeneration: 80
    },
    {
        id: 'bin-cpu-2', paradigm: 'Binary', type: 'Binary_CPU', name: 'Neural-Silicon X1', manufacturer: 'Aetherius', year: '2030',
        specs: { 'N-Cores': '1024', 'Clock': '12 GHz' }, description: 'Bio-mimetic binary logic.', powerDraw: 120, performanceScore: 85, heatGeneration: 40
    },
    {
        id: 'bin-cpu-3', paradigm: 'Binary', type: 'Binary_CPU', name: 'Cerebras WSE-3', manufacturer: 'Cerebras', year: '2024',
        specs: { 'Cores': '4 Trillion', 'Memory': '128GB SRAM' }, description: 'Wafer-scale engine for massive AI training.', powerDraw: 900, performanceScore: 95, heatGeneration: 100
    },
    {
        id: 'bin-gpu-1', paradigm: 'Binary', type: 'Binary_GPU', name: 'RTX 5090 Ti', manufacturer: 'NVIDIA', year: '2025',
        specs: { 'VRAM': '48GB', 'Cores': '32k' }, description: 'Massive parallel binary compute.', powerDraw: 600, performanceScore: 90, heatGeneration: 95
    },
    {
        id: 'bin-gpu-2', paradigm: 'Binary', type: 'Binary_GPU', name: 'Blackwell B200 AI', manufacturer: 'NVIDIA', year: '2026',
        specs: { 'PetaFLOPS': '20', 'VRAM': '192GB' }, description: 'The engine of the AI revolution.', powerDraw: 1000, performanceScore: 110, heatGeneration: 120
    },
    {
        id: 'bin-ram-1', paradigm: 'Binary', type: 'Binary_RAM', name: '64GB DDR6', manufacturer: 'Corsair', year: '2026',
        specs: { 'Speed': '12000 MHz' }, description: 'Volatile binary memory.', powerDraw: 15, performanceScore: 45, heatGeneration: 15
    },
    {
        id: 'bin-ram-2', paradigm: 'Binary', type: 'Binary_RAM', name: 'Memristor Non-Volatile', manufacturer: 'HP Labs', year: '2028',
        specs: { 'Density': '1TB', 'Speed': 'Instant' }, description: 'Combines RAM speed with SSD storage.', powerDraw: 5, performanceScore: 80, heatGeneration: 5
    },
    {
        id: 'bin-store-1', paradigm: 'Binary', type: 'Binary_Storage', name: '4TB NVMe Gen6', manufacturer: 'Samsung', year: '2027',
        specs: { 'Read': '20 GB/s' }, description: 'Solid state binary storage.', powerDraw: 8, performanceScore: 50, heatGeneration: 20
    },
    {
        id: 'bin-store-2', paradigm: 'Binary', type: 'Binary_Storage', name: 'Helix-7 DNA Drive', manufacturer: 'Catalog', year: '2032',
        specs: { 'Capacity': '500 PB', 'Retention': '1000y' }, description: 'Synthetic DNA-based massive archival storage.', powerDraw: 2, performanceScore: 60, heatGeneration: 0
    },
    {
        id: 'bin-store-3', paradigm: 'Binary', type: 'Binary_Storage', name: '5D Optical Crystal', manufacturer: 'Microsoft', year: '2029',
        specs: { 'Capacity': '360 TB', 'Lifespan': 'Eternal' }, description: 'Femtosecond laser etched quartz storage.', powerDraw: 1, performanceScore: 55, heatGeneration: 0
    },

    // --- TERNARY SYSTEM (Trits: -1, 0, 1) ---
    {
        id: 'tri-cpu-1', paradigm: 'Ternary', type: 'Ternary_CPU', name: 'Triton T-300', manufacturer: 'TriLogic', year: '2029',
        specs: { 'T-Cores': '128', 'Logic': 'Balanced Ternary' }, description: 'Uses 3 states for higher logic density.', powerDraw: 180, performanceScore: 70, heatGeneration: 60
    },
    {
        id: 'tri-cpu-2', paradigm: 'Ternary', type: 'Ternary_CPU', name: 'Photonic Trit-Weaver', manufacturer: 'LightMatter', year: '2033',
        specs: { 'Speed': 'Light', 'Logic': 'Optical' }, description: 'Computes with light phase states (-1, 0, 1).', powerDraw: 30, performanceScore: 90, heatGeneration: 5
    },
    {
        id: 'tri-ram-1', paradigm: 'Ternary', type: 'Ternary_RAM', name: '32GT Tri-RAM', manufacturer: 'Hynix-3', year: '2030',
        specs: { 'States': '3', 'Latency': 'Ultra-Low' }, description: 'Stores trits instead of bits.', powerDraw: 25, performanceScore: 75, heatGeneration: 30
    },

    // --- QUANTUM SYSTEM (Qubits) ---
    {
        id: 'quant-qpu-1', paradigm: 'Quantum', type: 'Quantum_QPU', name: 'Aether-Q Photonic', manufacturer: 'Aetherius', year: '2032',
        specs: { 'Qubits': '4096', 'Topology': 'Lattice' }, description: 'Processing in Hilbert space.', powerDraw: 50, performanceScore: 100, heatGeneration: 10
    },
    {
        id: 'quant-qpu-2', paradigm: 'Quantum', type: 'Quantum_QPU', name: 'Majorana Braid Core', manufacturer: 'Microsoft Q', year: '2035',
        specs: { 'Qubits': '10k+', 'Error': 'Zero' }, description: 'Topological qubits resistant to decoherence.', powerDraw: 60, performanceScore: 150, heatGeneration: 15
    },
    {
        id: 'quant-qpu-3', paradigm: 'Quantum', type: 'Quantum_QPU', name: 'Willow QPU (Virtual)', manufacturer: 'Google Quantum AI', year: '2025',
        specs: { 'Qubits': '72', 'Topology': 'Square Grid', 'Error': 'Tunable' }, description: 'High-fidelity virtualization of the Willow chip architecture with realistic noise modeling.', powerDraw: 85, performanceScore: 130, heatGeneration: 25
    },
    {
        id: 'quant-qpu-4', paradigm: 'Quantum', type: 'Quantum_QPU', name: 'Osprey-V', manufacturer: 'IBM', year: '2024',
        specs: { 'Qubits': '433', 'Topology': 'Heavy Hex' }, description: 'Large-scale superconducting qubit simulation for complex entanglement studies.', powerDraw: 95, performanceScore: 140, heatGeneration: 30
    },
    {
        id: 'quant-cool-1', paradigm: 'Quantum', type: 'Quantum_Cooling', name: 'Zero-Point Dilution', manufacturer: 'BlueFors', year: '2031',
        specs: { 'Temp': '10 mK' }, description: 'Maintains quantum coherence.', powerDraw: 400, performanceScore: 0, heatGeneration: -200
    },
    {
        id: 'quant-cool-2', paradigm: 'Quantum', type: 'Quantum_Cooling', name: 'T-2000 Liquid Metal Loop', manufacturer: 'Cyberdyne', year: '2035',
        specs: { 'Temp': 'Stable', 'Conductivity': 'Infinite' }, description: 'Mimetic poly-alloy cooling solution for variable thermal loads.', powerDraw: 150, performanceScore: 0, heatGeneration: -500
    },

    // --- BRIDGE / INTERFACE ---
    {
        id: 'bridge-ctrl-1', paradigm: 'Bridge', type: 'Bridge_Controller', name: 'Omni-Bus Translator', manufacturer: 'Aetherius', year: '2028',
        specs: { 'Bandwidth': '100 PB/s', 'Protocol': 'Universal' }, description: 'Translates Bits <-> Trits <-> Qubits.', powerDraw: 100, performanceScore: 20, heatGeneration: 50, coherenceBonus: 20
    },
    {
        id: 'bridge-ctrl-2', paradigm: 'Bridge', type: 'Bridge_Controller', name: 'Wetware Synapse Link', manufacturer: 'Neuralink', year: '2034',
        specs: { 'Type': 'Biological', 'Bandwidth': 'Thought-Speed' }, description: 'Direct consciousness-to-machine interface.', powerDraw: 5, performanceScore: 40, heatGeneration: 37, coherenceBonus: 40
    },
    {
        id: 'bridge-acc-1', paradigm: 'Bridge', type: 'Bridge_Accelerator', name: 'Time Crystal Oscillator', manufacturer: 'Google Quantum', year: '2035',
        specs: { 'Stability': 'Eternal', 'Freq': 'Zero-Loss' }, description: 'Synchronizes all 3 timelines perfectly.', powerDraw: 10, performanceScore: 50, heatGeneration: 0, coherenceBonus: 100
    },
    {
        id: 'bridge-acc-2', paradigm: 'Bridge', type: 'Bridge_Accelerator', name: 'Photonic Interconnect Fabric', manufacturer: 'Cisco Quantum', year: '2030',
        specs: { 'Bandwidth': '10 Tbps', 'Latency': 'Near-Zero' }, description: 'Entangles distributed quantum modules via light.', powerDraw: 40, performanceScore: 65, heatGeneration: 10, coherenceBonus: 60
    },
    {
        id: 'power-matrix', paradigm: 'Bridge', type: 'Power_Matrix', name: 'Tri-Fusion Reactor', manufacturer: 'General Fusion', year: '2033',
        specs: { 'Output': '5000W', 'Efficiency': '99.9%' }, description: 'Powers all 3 subsystems.', powerDraw: 0, performanceScore: 0, heatGeneration: 100, coherenceBonus: 10
    },
    {
        id: 'power-matrix-2', paradigm: 'Bridge', type: 'Power_Matrix', name: 'Vacuum Energy Harvester', manufacturer: 'Unknown', year: '2050',
        specs: { 'Output': 'Infinite', 'Efficiency': '100%' }, description: 'Extracts energy from quantum fluctuations.', powerDraw: 0, performanceScore: 0, heatGeneration: 0, coherenceBonus: 50
    },
];

type RigState = Record<ComponentType, HardwareComponent | null>;

const DEFAULT_RIG: RigState = {
    // Binary
    'Binary_CPU': componentDatabase.find(c => c.id === 'bin-cpu-1') || null,
    'Binary_GPU': null,
    'Binary_RAM': componentDatabase.find(c => c.id === 'bin-ram-1') || null,
    'Binary_Storage': componentDatabase.find(c => c.id === 'bin-store-1') || null,
    // Ternary
    'Ternary_CPU': null,
    'Ternary_RAM': null,
    // Quantum
    'Quantum_QPU': null,
    'Quantum_Cooling': null,
    // Bridge
    'Bridge_Controller': null,
    'Bridge_Accelerator': null,
    'Power_Matrix': componentDatabase.find(c => c.id === 'power-matrix') || null,
};

// --- 3D Visualization Helper ---

const ParadigmZone: React.FC<{
    paradigm: SystemParadigm,
    slots: { type: ComponentType, x: number, y: number, z: number, w: number, h: number }[],
    rig: RigState,
    onSlotClick: (t: ComponentType) => void,
    color: string
}> = ({ paradigm, slots, rig, onSlotClick, color }) => {
    return (
        <div className="absolute" style={{ transformStyle: 'preserve-3d' }}>
             {/* Baseplate for the Zone */}
             <div 
                className={`absolute border-2 ${color} bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
                style={{ 
                    width: 220, 
                    height: 220, 
                    transform: paradigm === 'Quantum' ? 'translateY(-150px) rotateX(20deg)' : 
                               paradigm === 'Binary' ? 'translateX(-180px) translateY(50px) rotateY(20deg)' : 
                               paradigm === 'Ternary' ? 'translateX(180px) translateY(50px) rotateY(-20deg)' : 
                               'translateZ(50px)', // Bridge center
                    boxShadow: `0 0 20px ${color.replace('border-', '')}` 
                }}
             >
                <div className="absolute top-2 left-2 text-xs font-bold text-white uppercase opacity-70 tracking-widest">{paradigm} Core</div>
                
                {slots.map(slot => {
                    const component = rig[slot.type];
                    const isMissing = !component && (slot.type.includes('CPU') || slot.type.includes('QPU') || slot.type === 'Power_Matrix');

                    return (
                        <div
                            key={slot.type}
                            onClick={(e) => { e.stopPropagation(); onSlotClick(slot.type); }}
                            className={`absolute flex items-center justify-center border cursor-pointer transition-all duration-300 shadow-lg group 
                                ${isMissing ? 'bg-red-900/40 border-red-500 animate-pulse' : component ? 'bg-gray-800/90 ' + color : 'bg-gray-800/30 border-dashed border-gray-600 hover:bg-gray-700/50'}`}
                            style={{
                                width: slot.w,
                                height: slot.h,
                                left: slot.x,
                                top: slot.y,
                                transform: `translateZ(${slot.z}px)`,
                                borderRadius: '4px'
                            }}
                        >
                            {component ? (
                                <div className="text-center">
                                    {slot.type.includes('CPU') && <CpuChipIcon className="w-6 h-6 text-white mx-auto"/>}
                                    {slot.type.includes('QPU') && <SparklesIcon className="w-6 h-6 text-white mx-auto"/>}
                                    {slot.type.includes('GPU') && <CubeTransparentIcon className="w-6 h-6 text-white mx-auto"/>}
                                    {slot.type.includes('RAM') && <CircleStackIcon className="w-5 h-5 text-white mx-auto"/>}
                                    {slot.type.includes('Cooling') && <ArrowPathIcon className="w-6 h-6 text-cyan-300 mx-auto animate-spin"/>}
                                    {slot.type.includes('Bridge') && <LinkIcon className="w-6 h-6 text-white mx-auto"/>}
                                    {slot.type.includes('Power') && <BoltIcon className="w-6 h-6 text-yellow-400 mx-auto"/>}
                                    
                                    <span className="text-[7px] text-white bg-black/70 px-1 rounded mt-1 block truncate max-w-[45px] mx-auto">{component.name}</span>
                                </div>
                            ) : (
                                <span className="text-[7px] text-gray-400 font-bold uppercase text-center leading-tight">{slot.type.split('_')[1]}</span>
                            )}
                        </div>
                    )
                })}
             </div>
             
             {/* Connections to Center (if not bridge) */}
             {paradigm !== 'Bridge' && (
                 <div 
                    className={`absolute w-1 h-32 ${color.replace('border', 'bg')} opacity-50`}
                    style={{
                        top: 110,
                        left: 110,
                        transformOrigin: 'top center',
                        transform: paradigm === 'Quantum' ? 'rotateX(-70deg) translateZ(-20px)' : 
                                   paradigm === 'Binary' ? 'rotateY(-70deg) rotateZ(90deg) translateX(50px)' : 
                                   'rotateY(70deg) rotateZ(-90deg) translateX(-50px)'
                    }}
                 ></div>
             )}
        </div>
    )
}

// --- 3D Viewport ---

const RigViewport: React.FC<{ 
    rig: RigState, 
    onSlotClick: (type: ComponentType) => void,
    issues: string[]
}> = ({ rig, onSlotClick, issues }) => {
    const [rotation, setRotation] = useState({ x: 70, y: 0, z: 0 });
    const [zoom, setZoom] = useState(0.8);
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const deltaX = e.clientX - lastMouse.current.x;
        const deltaY = e.clientY - lastMouse.current.y;
        
        setRotation(prev => ({
            x: Math.min(85, Math.max(20, prev.x - deltaY * 0.5)), 
            y: prev.y,
            z: prev.z + deltaX * 0.5 
        }));
        
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => isDragging.current = false;
    const handleWheel = (e: React.WheelEvent) => setZoom(prev => Math.min(1.5, Math.max(0.4, prev - e.deltaY * 0.001)));

    return (
        <div 
            className="w-full h-full bg-gray-900 relative overflow-hidden cursor-move flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* Overlay Info */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <ServerIcon className="w-6 h-6 text-indigo-500"/> Tri-Core Motherboard
                </h3>
                <p className="text-gray-400 text-xs">Binary • Ternary • Quantum</p>
            </div>

            {issues.length > 0 && (
                <div className="absolute bottom-4 left-4 z-10 bg-red-900/80 border border-red-500 text-white p-4 rounded-lg backdrop-blur-md max-w-sm pointer-events-none animate-pulse">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-sm"><ExclamationTriangleIcon className="w-4 h-4"/> System Critical</h4>
                    <ul className="list-disc list-inside text-[10px] space-y-1">
                        {issues.slice(0,3).map(i => <li key={i}>{i}</li>)}
                        {issues.length > 3 && <li>...and {issues.length - 3} more</li>}
                    </ul>
                    <p className="text-[10px] mt-2 font-bold text-red-200">Boot sequence locked to prevent OS corruption.</p>
                </div>
            )}

            {/* 3D Scene */}
            <div 
                style={{ 
                    transform: `perspective(1200px) rotateX(${rotation.x}deg) rotateZ(${rotation.z}deg) scale(${zoom})`,
                    transformStyle: 'preserve-3d',
                    transition: isDragging.current ? 'none' : 'transform 0.3s ease-out'
                }}
                className="relative w-1 h-1" // Center point
            >
                {/* Binary Zone (Left, Blue) */}
                <ParadigmZone 
                    paradigm="Binary"
                    color="border-blue-500"
                    rig={rig}
                    onSlotClick={onSlotClick}
                    slots={[
                        { type: 'Binary_CPU', x: 30, y: 30, w: 60, h: 60, z: 10 },
                        { type: 'Binary_RAM', x: 100, y: 30, w: 20, h: 60, z: 5 },
                        { type: 'Binary_GPU', x: 30, y: 110, w: 120, h: 40, z: 15 },
                        { type: 'Binary_Storage', x: 160, y: 30, w: 30, h: 80, z: 5 },
                    ]}
                />

                {/* Ternary Zone (Right, Orange) */}
                <ParadigmZone 
                    paradigm="Ternary"
                    color="border-orange-500"
                    rig={rig}
                    onSlotClick={onSlotClick}
                    slots={[
                        { type: 'Ternary_CPU', x: 60, y: 60, w: 60, h: 60, z: 10 },
                        { type: 'Ternary_RAM', x: 130, y: 60, w: 40, h: 60, z: 5 },
                    ]}
                />

                {/* Quantum Zone (Top, Purple) */}
                <ParadigmZone 
                    paradigm="Quantum"
                    color="border-purple-500"
                    rig={rig}
                    onSlotClick={onSlotClick}
                    slots={[
                        { type: 'Quantum_QPU', x: 80, y: 80, w: 60, h: 60, z: 10 },
                        { type: 'Quantum_Cooling', x: 20, y: 20, w: 180, h: 180, z: 30 }, // Large cooler covering mostly everything
                    ]}
                />

                {/* Bridge Zone (Center, White/Gold) */}
                <ParadigmZone 
                    paradigm="Bridge"
                    color="border-yellow-400"
                    rig={rig}
                    onSlotClick={onSlotClick}
                    slots={[
                        { type: 'Bridge_Controller', x: 70, y: 70, w: 80, h: 80, z: 20 },
                        { type: 'Bridge_Accelerator', x: 30, y: 30, w: 40, h: 40, z: 10 },
                        { type: 'Power_Matrix', x: 150, y: 150, w: 50, h: 50, z: 10 },
                    ]}
                />
            </div>
        </div>
    );
};

// --- Boot Sequence Overlay ---
const BootSequenceOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [steps, setSteps] = useState<{msg: string, status: 'pending'|'active'|'done'}[]>([
        { msg: "Validating Hardware Integrity...", status: 'active' },
        { msg: "Simulating Power Load Stability...", status: 'pending' },
        { msg: "Grandchild Node: Encrypting Config...", status: 'pending' },
        { msg: "Child Node: Analyzing Heuristic Improvements...", status: 'pending' },
        { msg: "Blockchain: Committing Proof-of-Contribution...", status: 'pending' },
        { msg: "Parent AI: Integrating Global Logic...", status: 'pending' }
    ]);

    useEffect(() => {
        let currentStep = 0;
        const interval = setInterval(() => {
            setSteps(prev => {
                const newSteps = [...prev];
                if (currentStep < newSteps.length) {
                    newSteps[currentStep].status = 'done';
                    if (currentStep + 1 < newSteps.length) {
                        newSteps[currentStep + 1].status = 'active';
                    }
                }
                return newSteps;
            });
            currentStep++;
            if (currentStep >= steps.length) {
                clearInterval(interval);
                setTimeout(onComplete, 1500);
            }
        }, 800);
        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-4">
                <ArrowPathIcon className="w-10 h-10 animate-spin text-blue-500"/> System Boot & Network Sync
            </h2>
            <div className="w-full max-w-md space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-2xl">
                {steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full border transition-all duration-500 ${
                            step.status === 'done' ? 'bg-green-500 border-green-500' : 
                            step.status === 'active' ? 'border-blue-500 animate-pulse' : 
                            'border-gray-700'
                        }`}>
                            {step.status === 'done' && <CheckCircleIcon className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`${
                            step.status === 'done' ? 'text-green-400' : 
                            step.status === 'active' ? 'text-blue-400 font-bold' : 
                            'text-gray-600'
                        } font-mono text-sm transition-colors duration-300`}>{step.msg}</span>
                    </div>
                ))}
            </div>
            <div className="mt-8 text-xs text-gray-500 font-mono">
                Aetherius Network Protocol v12.4 | Secure Channel
            </div>
        </div>
    );
};

// --- Stats & Controls Panel ---

const StatsPanel: React.FC<{ 
    rig: RigState, 
    onBoot: () => void, 
    issues: string[],
    onReset: () => void
}> = ({ rig, onBoot, issues, onReset }) => {
    
    const stats = useMemo(() => {
        let power = 0;
        let capacity = 0;
        let coherence = 0;
        let perf = { binary: 0, ternary: 0, quantum: 0 };

        (Object.values(rig) as (HardwareComponent | null)[]).forEach(c => {
            if (!c) return;
            if (c.type === 'Power_Matrix') {
                capacity += parseInt(c.specs['Output'].toString());
            } else {
                power += c.powerDraw;
                if (c.paradigm === 'Binary') perf.binary += c.performanceScore;
                if (c.paradigm === 'Ternary') perf.ternary += c.performanceScore;
                if (c.paradigm === 'Quantum') perf.quantum += c.performanceScore;
            }
            if (c.coherenceBonus) coherence += c.coherenceBonus;
        });

        return { power, capacity, coherence, perf };
    }, [rig]);

    const canBoot = issues.length === 0;

    return (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col p-4 overflow-y-auto z-20 shadow-xl">
            <h2 className="font-bold text-white mb-6 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-blue-400"/> Draft Metrics
            </h2>

            <div className="space-y-6 mb-8">
                <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Synchronization (Coherence)</span>
                        <span className="text-yellow-400 font-bold">{Math.min(100, stats.coherence)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.coherence)}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Higher coherence allows stable cross-paradigm logic.</p>
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

                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Projected Performance</h4>
                    <div className="flex justify-between text-xs text-gray-300 bg-gray-900/50 p-2 rounded">
                        <span>Binary (Logic)</span>
                        <span className="text-blue-400">{stats.perf.binary} pts</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-300 bg-gray-900/50 p-2 rounded">
                        <span>Ternary (Heuristics)</span>
                        <span className="text-orange-400">{stats.perf.ternary} pts</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-300 bg-gray-900/50 p-2 rounded">
                        <span>Quantum (Probability)</span>
                        <span className="text-purple-400">{stats.perf.quantum} pts</span>
                    </div>
                </div>
            </div>

            <div className="mt-auto space-y-3">
                 <div className={`p-3 rounded-lg text-xs border ${canBoot ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-400'}`}>
                    {canBoot ? 'Configuration Stable. Ready to Boot.' : 'Configuration Faulty. Review issues in viewport.'}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button onClick={onReset} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-bold text-sm transition-colors">
                        Reset to Default
                    </button>
                    <button 
                        onClick={onBoot} 
                        disabled={!canBoot}
                        className={`px-4 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all ${canBoot ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                    >
                        <PlayIcon className="w-4 h-4" /> Boot System
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export const VirtualRigBuilder: React.FC = () => {
    const [rig, setRig] = useState<RigState>(DEFAULT_RIG);
    const [activeSlot, setActiveSlot] = useState<ComponentType | null>(null);
    const [isBooting, setIsBooting] = useState(false);

    // Validation Logic
    const issues = useMemo(() => {
        const list: string[] = [];
        if (!rig.Binary_CPU) list.push("Missing Binary CPU (Logic Core)");
        if (!rig.Binary_RAM) list.push("Missing Binary RAM (Memory)");
        if (!rig.Power_Matrix) list.push("Missing Power Matrix (Energy)");
        if (!rig.Bridge_Controller) list.push("Missing Bridge Controller (Sync)");
        
        // Check Quantum dependencies
        if (rig.Quantum_QPU && !rig.Quantum_Cooling) list.push("Quantum QPU requires Cooling System");

        // Power Check
        let draw = 0;
        let supply = rig.Power_Matrix ? parseInt(rig.Power_Matrix.specs['Output'].toString()) : 0;
        (Object.values(rig) as (HardwareComponent | null)[]).forEach(c => { if (c && c.type !== 'Power_Matrix') draw += c.powerDraw; });
        
        if (draw > supply) list.push(`Insufficient Power! (${draw}W > ${supply}W)`);

        return list;
    }, [rig]);

    const handlePartSelect = (part: HardwareComponent) => {
        setRig(prev => ({ ...prev, [part.type]: part }));
        setActiveSlot(null);
    };

    const handleBoot = () => {
        setIsBooting(true);
    };

    const handleBootComplete = () => {
        setIsBooting(false);
        // In a real app, this would commit the rig to the global state
        alert("System Boot Successful. Virtual Machine updated with new architecture.");
    };

    // Drawer
    const Drawer = () => {
        if (!activeSlot) return null;
        const type = activeSlot;
        const parts = componentDatabase.filter(c => c.type === type);

        return (
            <div className="absolute inset-y-0 left-0 w-80 bg-gray-800 border-r border-gray-700 z-30 flex flex-col animate-slide-in-left shadow-2xl">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                    <h3 className="font-bold text-white">Select {type.replace('_', ' ')}</h3>
                    <button onClick={() => setActiveSlot(null)}><XMarkIcon className="w-5 h-5 text-gray-400 hover:text-white"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {parts.length === 0 && <p className="text-gray-500 text-sm p-4 text-center">No components found for this slot.</p>}
                    {parts.map(part => (
                        <div key={part.id} onClick={() => handlePartSelect(part)} className="p-3 bg-gray-700/50 hover:bg-gray-600 rounded-lg cursor-pointer border border-transparent hover:border-blue-500 transition-all group">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-200 text-sm group-hover:text-white">{part.name}</h4>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${part.paradigm === 'Quantum' ? 'bg-purple-900 text-purple-300' : part.paradigm === 'Ternary' ? 'bg-orange-900 text-orange-300' : 'bg-blue-900 text-blue-300'}`}>{part.paradigm}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{part.description}</p>
                            <div className="mt-2 flex gap-2 text-[10px] font-mono text-gray-300">
                                <span>⚡ {part.powerDraw}W</span>
                                {part.coherenceBonus && <span className="text-yellow-400">★ +{part.coherenceBonus} Sync</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-gray-900 text-white overflow-hidden animate-fade-in relative">
            {isBooting && <BootSequenceOverlay onComplete={handleBootComplete} />}
            
            <Drawer />
            
            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-gray-700 flex items-center justify-between px-6 bg-gray-900 z-10">
                    <div className="flex items-center gap-3">
                        <ServerIcon className="w-8 h-8 text-blue-500" />
                        <div>
                            <h1 className="text-xl font-bold text-white">Tri-Logic Rig Forge</h1>
                            <p className="text-xs text-gray-400 font-mono">Quantum-Ternary-Binary Interlink</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Safe Mode</span>
                        <span>|</span>
                        <span>Draft Mode Active</span>
                    </div>
                </header>
                <div className="flex-1 relative bg-black">
                    <RigViewport rig={rig} onSlotClick={setActiveSlot} issues={issues} />
                </div>
            </div>

            {/* Stats */}
            <StatsPanel 
                rig={rig} 
                issues={issues} 
                onBoot={handleBoot} 
                onReset={() => setRig(DEFAULT_RIG)}
            />
        </div>
    );
};
