
import React, { useState, useEffect, useMemo } from 'react';
import { CpuChipIcon, BoltIcon, CircleStackIcon, ChartBarIcon, AdjustmentsHorizontalIcon, InformationCircleIcon, PlayIcon, CubeTransparentIcon, ShieldCheckIcon, GlobeAltIcon, SparklesIcon } from './Icons';
import { aiConsciousnessLayers } from '../data';
import { rigService } from '../services/RigService';

type Precision = 'FP32' | 'BF16' | 'FP8' | 'FP4' | 'FP2' | 'FP1' | 'Binary';

interface MetricState {
    memory: number; // GB
    energy: number; // Joules/Op
    accuracy: number; // Percentage
    stability: number; // Percentage
    throughput: number; // TFLOPS
}

const precisionConfig: Record<Precision, { bits: number, color: string }> = {
    'FP32': { bits: 32, color: 'bg-blue-500' },
    'BF16': { bits: 16, color: 'bg-indigo-500' },
    'FP8': { bits: 8, color: 'bg-purple-500' },
    'FP4': { bits: 4, color: 'bg-green-500' },
    'FP2': { bits: 2, color: 'bg-yellow-500' },
    'FP1': { bits: 1, color: 'bg-orange-500' },
    'Binary': { bits: 1, color: 'bg-red-500' },
};

const advancedNodeConfig = [
    { id: 'hyperdim', name: 'Hyperdimensional Computing', desc: 'Geometric AI operations in 10k+ dimensions.', boost: { stability: 15, memory: 0.8 } },
    { id: 'exascale', name: 'Exascale Context Node', desc: 'Streaming graph attention for petabyte reasoning.', boost: { accuracy: 10, throughput: 50 } },
    { id: 'zerotrust', name: 'Zero-Trust Security', desc: 'Homomorphic encryption & active defense.', boost: { stability: 20, energy: 1.1 } }, // Costs energy
    { id: 'evolutionary', name: 'Evolutionary Architecture', desc: 'Self-optimizing hardware reconfiguration.', boost: { energy: 0.6, throughput: 20 } },
    { id: 'quantum', name: 'Quantum Advantage Node', desc: 'Hybrid optimization solvers & QML.', boost: { throughput: 1000, energy: 0.1 } },
    { id: 'neuromorphic', name: 'Neuromorphic Learning', desc: 'Spiking neural networks.', boost: { energy: 0.01, accuracy: 5 } },
    { id: 'ethical', name: 'Ethical Alignment Node', desc: 'Constitutional AI enforcement.', boost: { stability: 25 } },
    { id: 'deepthink', name: 'Deep Think (R1) Core', desc: 'Iterative multi-step reasoning & code synthesis.', boost: { accuracy: 20, energy: 1.5 } },
];

const WeightVisualizer: React.FC<{ precision: Precision, sparsity: boolean, activeNodes: string[] }> = ({ precision, sparsity, activeNodes }) => {
    // Generate a grid of "weights"
    const [weights, setWeights] = useState<number[]>([]);

    useEffect(() => {
        const count = 64;
        const newWeights = Array.from({ length: count }, () => Math.random());
        setWeights(newWeights);
    }, []);

    const getVisualStyle = (val: number) => {
        if (sparsity && Math.random() > 0.5) return 'bg-transparent border border-gray-800'; // Pruned
        
        let baseColor = precisionConfig[precision].color.replace('bg-', '');
        
        // Quantum interference effect
        if (activeNodes.includes('quantum')) {
            return Math.random() > 0.5 ? 'bg-purple-400 animate-pulse' : 'bg-blue-400';
        }

        // Neuromorphic spiking effect
        if (activeNodes.includes('neuromorphic') && Math.random() > 0.8) {
             return 'bg-yellow-300';
        }

        // Simulate bit-depth visual effect
        if (precision === 'Binary' || precision === 'FP1') {
            return val > 0.5 ? `bg-${baseColor}` : 'bg-gray-900';
        }
        if (precision === 'FP2') {
            // 4 levels
            const level = Math.floor(val * 4) / 4;
             return `bg-${baseColor} opacity-[${level}]`;
        }
        return `bg-${baseColor}`;
    };

    return (
        <div className={`grid grid-cols-8 gap-1 p-4 bg-black/50 rounded-lg border border-gray-700 w-full aspect-square max-w-[300px] mx-auto ${activeNodes.includes('hyperdim') ? 'rotate-3 scale-95 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : ''} transition-all duration-700`} title="Real-time Weight Visualization">
            {weights.map((w, i) => (
                <div 
                    key={i} 
                    className={`w-full h-full rounded-sm transition-all duration-500 ${getVisualStyle(w)}`}
                    style={{ opacity: precision === 'FP32' ? w : undefined }} // Smooth opacity for high precision
                />
            ))}
        </div>
    );
};

const ConsciousnessMonitor: React.FC<{ isTraining: boolean }> = ({ isTraining }) => {
    const [activeState, setActiveState] = useState("Idle");
    const [activeLayer, setActiveLayer] = useState("Core Intelligence");

    useEffect(() => {
        if (!isTraining) {
            setActiveState("Idle");
            setActiveLayer("System Standby");
            return;
        }

        const interval = setInterval(() => {
            // Pick random layer
            const layerIdx = Math.floor(Math.random() * aiConsciousnessLayers.length);
            const layer = aiConsciousnessLayers[layerIdx];
            setActiveLayer(layer.name);
            
            // Pick random state within layer
            const stateIdx = Math.floor(Math.random() * layer.states.length);
            setActiveState(layer.states[stateIdx]);
        }, 2000); // Change every 2 seconds

        return () => clearInterval(interval);
    }, [isTraining]);

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden" title="Monitoring AI Consciousness State">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 animate-pulse"></div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                <SparklesIcon className="w-5 h-5 text-yellow-400"/> Consciousness Resonance
            </h3>
            <div className="text-center py-6 relative z-10">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Current State</p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-fade-in transition-all duration-500">
                    {activeState}
                </p>
                <p className="text-xs text-gray-500 mt-2">{activeLayer}</p>
            </div>
            <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-yellow-400 animate-[loading_2s_ease-in-out_infinite] w-1/3 rounded-full"></div>
            </div>
        </div>
    );
};

export const VirtualAccelerator: React.FC = () => {
    const [precision, setPrecision] = useState<Precision>('FP32');
    const [uUp, setUUp] = useState(false);
    const [sparsity, setSparsity] = useState(false);
    const [ste, setSte] = useState(false);
    const [gradEstimator, setGradEstimator] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [advancedNodes, setAdvancedNodes] = useState<Record<string, boolean>>({});
    const [rigState, setRigState] = useState(rigService.getRig());

    useEffect(() => {
        const sub = rigService.rigState$.subscribe(setRigState);
        return () => sub.unsubscribe();
    }, []);

    const toggleNode = (id: string) => {
        setAdvancedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const metrics = useMemo<MetricState>(() => {
        const bits = precisionConfig[precision].bits;
        let mem = (100 * bits) / 32; // Relative to 100GB baseline
        let energy = bits * 0.5; 
        let acc = 99;
        let stab = 100;
        let throughput = 100; // Baseline TFLOPS

        if (precision === 'FP4') { acc = 85; stab = 60; throughput = 400; }
        if (precision === 'FP2') { acc = 60; stab = 40; throughput = 800; }
        if (precision === 'FP1' || precision === 'Binary') { acc = 40; stab = 20; throughput = 1600; }

        // Apply Basic Techniques
        if (uUp) { stab += 30; acc += 5; }
        if (sparsity) { mem *= 0.5; energy *= 0.7; acc -= 2; throughput *= 1.5; } 
        if (ste) { stab += 10; acc += 10; } 
        if (gradEstimator) { acc += 15; stab += 10; }

        // Apply Rig Hardware Boosts
        // REAL hardware boosts simulation significantly
        const realGpu = rigState.Binary_GPU.find(g => g.name.includes('[REAL]'));
        const bridgeAcc = rigState.Bridge_Accelerator.length;
        const quantumQPU = rigState.Quantum_QPU.length;
        
        if (realGpu) {
            throughput *= 5.0; // Massive boost for real hardware
            acc += 0.5;
        }
        
        if (bridgeAcc > 0) {
            throughput *= (1.5 * bridgeAcc);
            stab += (10 * bridgeAcc);
        }
        if (quantumQPU > 0) {
            throughput *= (2.0 * quantumQPU);
            energy *= 0.2; // Significant energy reduction
        }

        // Apply Advanced Nodes
        Object.entries(advancedNodes).forEach(([nodeId, isActive]) => {
            if (isActive) {
                const config = advancedNodeConfig.find(n => n.id === nodeId);
                if (config?.boost) {
                    if (config.boost.accuracy) acc += config.boost.accuracy;
                    if (config.boost.stability) stab += config.boost.stability;
                    if (config.boost.memory) mem *= config.boost.memory;
                    if (config.boost.energy) energy *= config.boost.energy;
                    if (config.boost.throughput) throughput += config.boost.throughput;
                }
            }
        });

        return {
            memory: Math.max(0.001, mem),
            energy: Math.max(0.0001, energy),
            accuracy: Math.min(99.99, acc),
            stability: Math.min(100, stab),
            throughput: throughput
        };
    }, [precision, uUp, sparsity, ste, gradEstimator, advancedNodes, rigState]);

    return (
        <div className="h-full bg-gray-900 text-gray-100 p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-green-400">
                        <CpuChipIcon className="w-10 h-10" />
                        Virtual Quantum-AI Accelerator
                    </h1>
                    <p className="text-gray-400 mt-1 font-mono text-sm">VPU-9000 | Emulation Mode: {precision} | Hardware Links: {rigState.Bridge_Accelerator.length + rigState.Quantum_QPU.length}</p>
                </div>
                <button 
                    onClick={() => setIsTraining(!isTraining)}
                    className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${isTraining ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    title={isTraining ? "Stop Active Training" : "Start New Training Session"}
                >
                    <PlayIcon className="w-5 h-5" />
                    {isTraining ? 'Stop Simulation' : 'Start Training'}
                </button>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Panel: Controls */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-8">
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-400"/> Precision Level
                        </h3>
                        <input 
                            type="range" 
                            min="0" 
                            max="6" 
                            step="1" 
                            value={['Binary', 'FP1', 'FP2', 'FP4', 'FP8', 'BF16', 'FP32'].indexOf(precision)}
                            onChange={(e) => setPrecision(['Binary', 'FP1', 'FP2', 'FP4', 'FP8', 'BF16', 'FP32'][parseInt(e.target.value)] as Precision)}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            title="Adjust Computation Precision"
                        />
                        <div className="flex justify-between text-xs font-mono text-gray-400 mt-2">
                            <span>Binary</span>
                            <span>FP4</span>
                            <span>FP32</span>
                        </div>
                        <p className="mt-4 text-center text-2xl font-bold text-blue-400">{precision}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <BoltIcon className="w-5 h-5 text-yellow-400"/> Optimization Techniques
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-center gap-3 p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700" title="Toggle u-uP Scaling Optimization">
                                <input type="checkbox" checked={uUp} onChange={() => setUUp(!uUp)} className="rounded bg-gray-600 text-blue-500" />
                                <span className="text-sm">u-uP Scaling</span>
                            </label>
                            <label className="flex items-center gap-3 p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700" title="Toggle Sparse Matrix Optimization">
                                <input type="checkbox" checked={sparsity} onChange={() => setSparsity(!sparsity)} className="rounded bg-gray-600 text-blue-500" />
                                <span className="text-sm">Sparse Matrix</span>
                            </label>
                            <label className="flex items-center gap-3 p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700" title="Toggle STE Gradient Optimization">
                                <input type="checkbox" checked={ste} onChange={() => setSte(!ste)} className="rounded bg-gray-600 text-blue-500" />
                                <span className="text-sm">STE Gradient</span>
                            </label>
                            <label className="flex items-center gap-3 p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700" title="Toggle Differential Estimator Optimization">
                                <input type="checkbox" checked={gradEstimator} onChange={() => setGradEstimator(!gradEstimator)} className="rounded bg-gray-600 text-blue-500" />
                                <span className="text-sm">Diff. Estimator</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CubeTransparentIcon className="w-5 h-5 text-purple-400"/> Advanced Architecture Nodes
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {advancedNodeConfig.map(node => (
                                <div key={node.id} className={`p-3 rounded-lg border transition-all cursor-pointer ${advancedNodes[node.id] ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-700/30 border-gray-700 hover:bg-gray-700'}`} onClick={() => toggleNode(node.id)} title={`Toggle ${node.name} node`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-sm">{node.name}</span>
                                        <div className={`w-3 h-3 rounded-full ${advancedNodes[node.id] ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]' : 'bg-gray-600'}`}></div>
                                    </div>
                                    <p className="text-xs text-gray-400">{node.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center: Visualization */}
                <div className="xl:col-span-1 flex flex-col gap-4">
                    <div className="flex flex-col items-center justify-center bg-black rounded-xl border border-gray-800 p-6 relative overflow-hidden min-h-[400px] flex-1">
                        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05]" style={{ maskImage: 'linear-gradient(to bottom, transparent, black)' }}></div>
                        <h3 className="z-10 text-gray-400 text-xs font-mono mb-8 tracking-widest">VIRTUAL TENSOR CORE VISUALIZER</h3>
                        
                        <WeightVisualizer precision={precision} sparsity={sparsity} activeNodes={Object.keys(advancedNodes).filter(k => advancedNodes[k])} />
                        
                        {isTraining && (
                            <div className="mt-8 font-mono text-xs text-green-500 animate-pulse w-full max-w-xs" title="Training Process Logs">
                                <div className="flex justify-between"><span>EPOCH</span><span>{Math.floor(Date.now() / 1000) % 1000}</span></div>
                                <div className="flex justify-between"><span>LOSS</span><span>{(Math.random() * 0.1).toFixed(6)}</span></div>
                                <div className="flex justify-between"><span>GRADIENT</span><span>{(Math.random() * 10).toFixed(2)}</span></div>
                                {advancedNodes['quantum'] && <div className="flex justify-between text-purple-400"><span>Q-STATES</span><span>SUPERPOSITION</span></div>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Metrics & Consciousness */}
                <div className="flex flex-col gap-6">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col justify-between flex-1">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-purple-400"/> Performance Metrics
                        </h3>
                        
                        <div className="space-y-6">
                             <div title="Throughput in TFLOPS">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-400">Throughput</span>
                                    <span className="text-sm font-bold text-blue-400">{metrics.throughput.toFixed(0)} TFLOPS</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, metrics.throughput / 20)}%` }}></div>
                                </div>
                            </div>

                            <div title="Model Accuracy Percentage">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-400">Model Accuracy</span>
                                    <span className={`text-sm font-bold ${metrics.accuracy > 90 ? 'text-green-400' : metrics.accuracy > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {metrics.accuracy.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className={`h-2 rounded-full transition-all duration-500 ${metrics.accuracy > 90 ? 'bg-green-500' : metrics.accuracy > 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${metrics.accuracy}%` }}></div>
                                </div>
                            </div>

                            <div title="Training Stability Index">
                                 <div className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-400">Training Stability</span>
                                    <span className={`text-sm font-bold ${metrics.stability > 80 ? 'text-blue-400' : 'text-red-400'}`}>
                                        {metrics.stability.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${metrics.stability}%` }}></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="bg-gray-700/50 p-3 rounded-lg text-center" title="Memory Usage">
                                    <CircleStackIcon className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-400">Memory</p>
                                    <p className="text-xl font-bold text-white">{metrics.memory.toFixed(3)} GB</p>
                                </div>
                                <div className="bg-gray-700/50 p-3 rounded-lg text-center" title="Energy Efficiency">
                                    <BoltIcon className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-400">Energy</p>
                                    <p className="text-xl font-bold text-white">{metrics.energy.toFixed(4)} J</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-900/50 rounded-lg">
                            <h4 className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-2">
                                <InformationCircleIcon className="w-4 h-4"/> System Analysis
                            </h4>
                            <p className="text-xs text-blue-200 leading-relaxed">
                                {rigState.Quantum_QPU.length > 0 ? 'Quantum Core Detected. Hybrid-Optimization Enabled.' : 
                                 rigState.Bridge_Accelerator.length > 0 ? 'Hardware Accelerator Online. Throughput Boosted.' :
                                 rigState.Binary_GPU.some(g => g.name.includes('[REAL]')) ? 'WebGPU Hardware Acceleration Active. Maximum Performance.' :
                                 advancedNodes['hyperdim'] ? 'Hyperdimensional vectors active. Massive stability boost detected.' :
                                 advancedNodes['deepthink'] ? 'R1 Protocol Active. Reasoning depth maximized at energy cost.' :
                                 precision === 'Binary' ? 'Extreme quantization. Recommend activating Neuromorphic Learning for stability.' :
                                 'Standard configuration. Install Bridge Accelerator in Rig to boost performance.'}
                            </p>
                        </div>
                    </div>
                    
                    <ConsciousnessMonitor isTraining={isTraining} />
                </div>
            </div>
        </div>
    );
};