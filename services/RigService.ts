
import { BehaviorSubject } from 'rxjs';

export type SystemParadigm = 'Binary' | 'Ternary' | 'Quantum' | 'Bridge';
export type ComponentType = 
    | 'Binary_CPU' | 'Binary_GPU' | 'Binary_RAM' | 'Binary_Storage'
    | 'Ternary_CPU' | 'Ternary_RAM'
    | 'Quantum_QPU' | 'Quantum_Cooling'
    | 'Bridge_Controller' | 'Bridge_Accelerator' | 'Power_Matrix';

export interface HardwareComponent {
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
    coherenceBonus?: number;
}

// CHANGED: Support arrays of components
export type RigState = Record<ComponentType, HardwareComponent[]>;

// --- EXTENDED DATABASE ---
export const componentDatabase: HardwareComponent[] = [
    // BINARY CPUs
    { id: 'bin-cpu-1', paradigm: 'Binary', type: 'Binary_CPU', name: 'Core i9-14900K', manufacturer: 'Intel', year: '2023', specs: { 'Cores': '24', 'Clock': '6.0 GHz' }, description: 'Standard high-performance binary processor.', powerDraw: 250, performanceScore: 40, heatGeneration: 80 },
    { id: 'bin-cpu-2', paradigm: 'Binary', type: 'Binary_CPU', name: 'Neural-Silicon X1', manufacturer: 'Aetherius', year: '2030', specs: { 'N-Cores': '1024', 'Clock': '12 GHz' }, description: 'Bio-mimetic binary logic optimized for neural nets.', powerDraw: 120, performanceScore: 85, heatGeneration: 40 },
    { id: 'bin-cpu-3', paradigm: 'Binary', type: 'Binary_CPU', name: 'Threadripper 9000', manufacturer: 'AMD', year: '2025', specs: { 'Cores': '96', 'Clock': '5.5 GHz' }, description: 'Extreme multi-threading capabilities.', powerDraw: 350, performanceScore: 75, heatGeneration: 90 },
    
    // BINARY GPUs
    { id: 'bin-gpu-1', paradigm: 'Binary', type: 'Binary_GPU', name: 'RTX 5090 Ti', manufacturer: 'NVIDIA', year: '2025', specs: { 'VRAM': '48GB', 'Cores': '32k' }, description: 'Massive parallel binary compute.', powerDraw: 600, performanceScore: 90, heatGeneration: 95 },
    { id: 'bin-gpu-2', paradigm: 'Binary', type: 'Binary_GPU', name: 'Omniverse H200', manufacturer: 'NVIDIA', year: '2026', specs: { 'VRAM': '128GB', 'Tensor': 'Active' }, description: 'Data center grade AI accelerator.', powerDraw: 700, performanceScore: 110, heatGeneration: 100 },
    { id: 'bin-gpu-3', paradigm: 'Binary', type: 'Binary_GPU', name: 'Radeon Pro W8000', manufacturer: 'AMD', year: '2025', specs: { 'VRAM': '64GB', 'Ray': 'Gen5' }, description: 'Workstation graphics powerhouse.', powerDraw: 450, performanceScore: 80, heatGeneration: 70 },

    // BINARY RAM
    { id: 'bin-ram-1', paradigm: 'Binary', type: 'Binary_RAM', name: '64GB DDR6', manufacturer: 'Corsair', year: '2026', specs: { 'Speed': '12000 MHz' }, description: 'Next-gen volatile memory.', powerDraw: 15, performanceScore: 45, heatGeneration: 15 },
    { id: 'bin-ram-2', paradigm: 'Binary', type: 'Binary_RAM', name: '128GB ECC DDR6', manufacturer: 'G.Skill', year: '2026', specs: { 'Speed': '10000 MHz' }, description: 'Error-correcting high capacity memory.', powerDraw: 25, performanceScore: 55, heatGeneration: 20 },

    // BINARY STORAGE
    { id: 'bin-store-1', paradigm: 'Binary', type: 'Binary_Storage', name: '4TB NVMe Gen6', manufacturer: 'Samsung', year: '2027', specs: { 'Read': '20 GB/s' }, description: 'Ultra-fast solid state storage.', powerDraw: 8, performanceScore: 50, heatGeneration: 20 },
    { id: 'bin-store-2', paradigm: 'Binary', type: 'Binary_Storage', name: '100TB DNA-Drive', manufacturer: 'Helix', year: '2035', specs: { 'Density': 'Petabyte', 'Life': '1000y' }, description: 'Archival DNA storage medium.', powerDraw: 5, performanceScore: 30, heatGeneration: 5 },

    // TERNARY
    { id: 'tri-cpu-1', paradigm: 'Ternary', type: 'Ternary_CPU', name: 'Triton T-300', manufacturer: 'TriLogic', year: '2029', specs: { 'T-Cores': '128', 'Logic': 'Balanced Ternary' }, description: 'Uses 3 states (-1, 0, 1) for higher logic density.', powerDraw: 180, performanceScore: 70, heatGeneration: 60 },
    { id: 'tri-ram-1', paradigm: 'Ternary', type: 'Ternary_RAM', name: '32GT Tri-RAM', manufacturer: 'Hynix-3', year: '2030', specs: { 'States': '3', 'Latency': 'Ultra-Low' }, description: 'Stores trits instead of bits.', powerDraw: 25, performanceScore: 75, heatGeneration: 30 },

    // QUANTUM
    { id: 'quant-qpu-1', paradigm: 'Quantum', type: 'Quantum_QPU', name: 'Aether-Q Photonic', manufacturer: 'Aetherius', year: '2032', specs: { 'Qubits': '4096', 'Topology': 'Lattice' }, description: 'Processing in Hilbert space using light.', powerDraw: 50, performanceScore: 100, heatGeneration: 10 },
    { id: 'quant-qpu-3', paradigm: 'Quantum', type: 'Quantum_QPU', name: 'Willow QPU (Virtual)', manufacturer: 'Google', year: '2025', specs: { 'Qubits': '72', 'Topology': 'Square Grid' }, description: 'High-fidelity virtualization of superconducting qubits.', powerDraw: 85, performanceScore: 130, heatGeneration: 25 },
    { id: 'quant-qpu-4', paradigm: 'Quantum', type: 'Quantum_QPU', name: 'Osprey Supercond', manufacturer: 'IBM', year: '2026', specs: { 'Qubits': '433', 'Error': 'Low' }, description: 'Deep-freeze superconducting processor.', powerDraw: 120, performanceScore: 110, heatGeneration: 50 },
    { id: 'quant-cool-1', paradigm: 'Quantum', type: 'Quantum_Cooling', name: 'Zero-Point Dilution', manufacturer: 'BlueFors', year: '2031', specs: { 'Temp': '10 mK' }, description: 'Maintains quantum coherence via dilution.', powerDraw: 400, performanceScore: 0, heatGeneration: -200 },
    { id: 'quant-cool-2', paradigm: 'Quantum', type: 'Quantum_Cooling', name: 'Laser Cooling Array', manufacturer: 'Photonics Inc', year: '2030', specs: { 'Method': 'Doppler', 'Temp': '1 mK' }, description: 'Active laser cooling for photonic chips.', powerDraw: 300, performanceScore: 0, heatGeneration: -150 },

    // BRIDGE & POWER
    { id: 'bridge-ctrl-1', paradigm: 'Bridge', type: 'Bridge_Controller', name: 'Omni-Bus Translator', manufacturer: 'Aetherius', year: '2028', specs: { 'Bandwidth': '100 PB/s', 'Protocol': 'Universal' }, description: 'Translates Bits <-> Trits <-> Qubits in real-time.', powerDraw: 100, performanceScore: 20, heatGeneration: 50, coherenceBonus: 20 },
    { id: 'bridge-acc-1', paradigm: 'Bridge', type: 'Bridge_Accelerator', name: 'Time Crystal Oscillator', manufacturer: 'Google', year: '2035', specs: { 'Stability': 'Eternal', 'Freq': 'Zero-Loss' }, description: 'Synchronizes timelines and prevents decoherence.', powerDraw: 10, performanceScore: 50, heatGeneration: 0, coherenceBonus: 100 },
    { id: 'power-matrix', paradigm: 'Bridge', type: 'Power_Matrix', name: 'Tri-Fusion Reactor', manufacturer: 'General Fusion', year: '2033', specs: { 'Output': '5000W', 'Efficiency': '99.9%' }, description: 'Micro-fusion generator powering all subsystems.', powerDraw: 0, performanceScore: 0, heatGeneration: 100, coherenceBonus: 10 },
    { id: 'power-matrix-2', paradigm: 'Bridge', type: 'Power_Matrix', name: 'ZPE Module', manufacturer: 'Alterra', year: '2040', specs: { 'Output': '10000W', 'Source': 'Vacuum' }, description: 'Zero Point Energy extraction unit.', powerDraw: 0, performanceScore: 0, heatGeneration: 5, coherenceBonus: 50 },
];

const DEFAULT_RIG: RigState = {
    'Binary_CPU': [componentDatabase.find(c => c.id === 'bin-cpu-1')!],
    'Binary_GPU': [componentDatabase.find(c => c.id === 'bin-gpu-1')!],
    'Binary_RAM': [componentDatabase.find(c => c.id === 'bin-ram-1')!],
    'Binary_Storage': [componentDatabase.find(c => c.id === 'bin-store-1')!],
    'Ternary_CPU': [componentDatabase.find(c => c.id === 'tri-cpu-1')!],
    'Ternary_RAM': [componentDatabase.find(c => c.id === 'tri-ram-1')!],
    'Quantum_QPU': [componentDatabase.find(c => c.id === 'quant-qpu-1')!],
    'Quantum_Cooling': [componentDatabase.find(c => c.id === 'quant-cool-1')!],
    'Bridge_Controller': [componentDatabase.find(c => c.id === 'bridge-ctrl-1')!],
    'Bridge_Accelerator': [componentDatabase.find(c => c.id === 'bridge-acc-1')!],
    'Power_Matrix': [componentDatabase.find(c => c.id === 'power-matrix')!],
};

class RigService {
    private static instance: RigService;
    public rigState$ = new BehaviorSubject<RigState>(DEFAULT_RIG);

    private constructor() {}

    public static getInstance(): RigService {
        if (!RigService.instance) {
            RigService.instance = new RigService();
        }
        return RigService.instance;
    }

    public getRig(): RigState {
        return this.rigState$.getValue();
    }

    public updatePart(type: ComponentType, part: HardwareComponent, action: 'add' | 'remove') {
        const current = this.getRig();
        let currentList = current[type] || [];

        if (action === 'add') {
            // Allow duplicates? For RAM/GPU yes. For others, maybe limit.
            // For simplicity, we allow multiple of anything in this upgraded rig.
            currentList = [...currentList, part];
        } else {
            // Remove first instance of this ID
            const idx = currentList.findIndex(c => c.id === part.id);
            if (idx > -1) {
                currentList = currentList.filter((_, i) => i !== idx);
            }
        }

        this.rigState$.next({
            ...current,
            [type]: currentList
        });
    }
    
    public setParts(type: ComponentType, parts: HardwareComponent[]) {
        const current = this.getRig();
        this.rigState$.next({
            ...current,
            [type]: parts
        });
    }

    public resetToDefault() {
        this.rigState$.next(DEFAULT_RIG);
    }

    public validateRig(rig: RigState): { valid: boolean, issues: string[] } {
        const issues: string[] = [];
        
        // Ensure at least one of essential components
        if (!rig.Power_Matrix.length) issues.push("CRITICAL: Power Matrix missing.");
        if (!rig.Binary_CPU.length) issues.push("CRITICAL: Binary Core missing.");
        if (!rig.Quantum_QPU.length) issues.push("CRITICAL: Quantum Core missing.");
        if (rig.Quantum_QPU.length && !rig.Quantum_Cooling.length) issues.push("CRITICAL: Quantum Core requires cooling.");
        if (!rig.Bridge_Controller.length) issues.push("CRITICAL: Bridge Controller missing (No Sync).");

        // Power Check
        let draw = 0;
        let supply = 0;
        
        rig.Power_Matrix.forEach(p => {
            let out = p.specs['Output'];
            supply += typeof out === 'string' ? parseInt(out) : out;
        });

        Object.keys(rig).forEach(key => {
            if (key !== 'Power_Matrix') {
                rig[key as ComponentType].forEach(c => { draw += c.powerDraw; });
            }
        });
        
        if (draw > supply) issues.push(`WARNING: Power Overload (${draw}W > ${supply}W)`);

        return { valid: issues.length === 0, issues };
    }
    
    public calculateStats(rig: RigState) {
        let power = 0;
        let capacity = 0;
        let coherence = 0;
        let perf = { binary: 0, ternary: 0, quantum: 0 };

        Object.entries(rig).forEach(([type, components]) => {
            components.forEach(c => {
                if (type === 'Power_Matrix') {
                    let out = c.specs['Output'];
                    capacity += typeof out === 'string' ? parseInt(out) : out;
                } else {
                    power += c.powerDraw;
                    if (c.paradigm === 'Binary') perf.binary += c.performanceScore;
                    if (c.paradigm === 'Ternary') perf.ternary += c.performanceScore;
                    if (c.paradigm === 'Quantum') perf.quantum += c.performanceScore;
                }
                if (c.coherenceBonus) coherence += c.coherenceBonus;
            });
        });
        
        return { power, capacity, coherence, perf };
    }
}

export const rigService = RigService.getInstance();
