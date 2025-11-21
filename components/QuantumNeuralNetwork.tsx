
import React, { useState, useEffect, useRef } from 'react';
import { CpuChipIcon, BoltIcon, ChartBarIcon, PlayIcon, StopIcon, ArrowPathIcon, SparklesIcon } from './Icons';

const MetricCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className={`bg-gray-800/50 border border-gray-700 p-3 rounded-lg flex flex-col items-center justify-center`}>
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
        <span className={`text-xl font-bold ${color} font-mono`}>{value}</span>
    </div>
);

const QubitNode: React.FC<{ x: number; y: number; active: boolean; value: number }> = ({ x, y, active, value }) => (
    <div 
        className={`absolute w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${active ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-gray-800 border-gray-600'}`}
        style={{ left: `${x}%`, top: `${y}%`, border: '2px solid', transform: 'translate(-50%, -50%)' }}
    >
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-cyan-400 animate-ping' : 'bg-gray-600'}`} />
        <span className="absolute -bottom-5 text-[10px] font-mono text-cyan-200">{value.toFixed(2)}</span>
    </div>
);

export const QuantumNeuralNetwork: React.FC = () => {
    const [isAnnealing, setIsAnnealing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [energy, setEnergy] = useState(1.0); // Normalized energy
    const [temperature, setTemperature] = useState(100); // mK
    const [prediction, setPrediction] = useState<string | null>(null);
    const [confidence, setConfidence] = useState(0);
    
    // Mock Qubit States
    const [qubits, setQubits] = useState(Array.from({ length: 8 }, () => Math.random()));

    // Simulation Loop
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isAnnealing) {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        setIsAnnealing(false);
                        completeAnnealing();
                        return 100;
                    }
                    return prev + 1;
                });

                // Simulate Annealing Physics
                setEnergy(prev => Math.max(0.1, prev * 0.98 + (Math.random() * 0.05 - 0.025))); // Energy minimization with noise
                setTemperature(prev => Math.max(10, prev * 0.95)); // Cooling schedule
                
                // Update Qubits (simulating tunneling/fluctuation)
                setQubits(prev => prev.map(q => {
                    const noise = (Math.random() - 0.5) * 0.2 * (1 - progress / 100);
                    return Math.max(0, Math.min(1, q + noise));
                }));

            }, 50);
        }
        return () => clearInterval(interval);
    }, [isAnnealing, progress]);

    const startAnnealing = () => {
        setIsAnnealing(true);
        setProgress(0);
        setEnergy(1.0);
        setTemperature(100);
        setPrediction(null);
        setConfidence(0);
    };

    const completeAnnealing = () => {
        const patterns = [
            "Anomalous Market Vector",
            "Protein Folding Structure Alpha",
            "Cryptographic Key Shard",
            "Seismic Precursor Signal",
            "Neural Mapping Pattern Delta"
        ];
        const result = patterns[Math.floor(Math.random() * patterns.length)];
        setPrediction(result);
        setConfidence(94 + Math.random() * 5.9);
        setQubits(prev => prev.map(() => Math.round(Math.random()))); // Collapse to 0 or 1
    };

    return (
        <div className="h-full bg-gray-900 text-gray-100 p-4 sm:p-6 overflow-y-auto flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <header className="flex justify-between items-center border-b border-gray-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-cyan-400 flex items-center gap-3">
                        <CpuChipIcon className="w-8 h-8" /> Quantum Neural Network
                    </h1>
                    <p className="text-sm text-gray-400 mt-1 font-mono">Q-Annealer v4.0 | Topology: Chimera Graph | Qubits: 2048</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={startAnnealing}
                        disabled={isAnnealing}
                        className={`px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all ${isAnnealing ? 'bg-gray-700 text-gray-500' : 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'}`}
                    >
                        {isAnnealing ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <PlayIcon className="w-5 h-5"/>}
                        {isAnnealing ? 'Annealing...' : 'Run Optimization'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Left: Control & Monitor */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-black/40 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                            <BoltIcon className="w-4 h-4 text-yellow-400"/> System Metrics
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard label="System Energy" value={`${energy.toFixed(4)} eV`} color="text-yellow-400" />
                            <MetricCard label="Temperature" value={`${temperature.toFixed(1)} mK`} color="text-blue-400" />
                            <MetricCard label="Coherence" value={`${(100 - progress * 0.1).toFixed(1)}%`} color="text-purple-400" />
                            <MetricCard label="Tunneling Rate" value={`${(energy * 40).toFixed(1)} MHz`} color="text-green-400" />
                        </div>
                    </div>

                    <div className="bg-black/40 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-300 mb-4">Annealing Schedule</h3>
                        <div className="space-y-4">
                             <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Initial Hamiltonian</span>
                                    <span>Final Hamiltonian</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 h-full transition-all duration-100" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                             </div>
                             <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                                 <span>Transverse Field: {(1 - progress/100).toFixed(2)}</span>
                                 <span>Problem Hamiltonian: {(progress/100).toFixed(2)}</span>
                             </div>
                        </div>
                    </div>

                    {/* Output Console */}
                    <div className="bg-black border border-gray-800 rounded-xl p-4 font-mono text-xs h-48 overflow-hidden flex flex-col">
                        <div className="text-gray-500 border-b border-gray-800 pb-2 mb-2">QPU Output Log</div>
                        <div className="flex-1 overflow-y-auto space-y-1">
                            <p className="text-green-500">>> System initialized.</p>
                            {isAnnealing && (
                                <>
                                    <p className="text-gray-400">>> Applying transverse magnetic field...</p>
                                    <p className="text-gray-400">>> Reducing quantum fluctuations...</p>
                                    <p className="text-blue-400">>> Tunneling through energy barriers...</p>
                                </>
                            )}
                            {!isAnnealing && prediction && (
                                <>
                                    <p className="text-cyan-400">>> Global Minimum Found.</p>
                                    <p className="text-white">>> Pattern Identified: {prediction}</p>
                                    <p className="text-yellow-400">>> Confidence: {confidence.toFixed(4)}%</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Visualization */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* QNN Topology */}
                    <div className="flex-1 bg-black rounded-xl border border-gray-800 relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-slate-900/[0.1] bg-[center_1px_center]" style={{ maskImage: 'radial-gradient(circle, white, transparent)' }}></div>
                        <div className="absolute top-4 left-4 z-10">
                            <h3 className="text-sm font-bold text-gray-400">Quantum Topology</h3>
                        </div>
                        
                        {/* Simulated Graph Connections */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <defs>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
                                    <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.5" />
                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
                                </linearGradient>
                            </defs>
                            {/* Random connections based on qubit count */}
                            <line x1="20%" y1="30%" x2="50%" y2="20%" stroke="url(#lineGradient)" strokeWidth="1" />
                            <line x1="50%" y1="20%" x2="80%" y2="30%" stroke="url(#lineGradient)" strokeWidth="1" />
                            <line x1="20%" y1="30%" x2="20%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1" />
                            <line x1="80%" y1="30%" x2="80%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1" />
                            <line x1="20%" y1="70%" x2="50%" y2="80%" stroke="url(#lineGradient)" strokeWidth="1" />
                            <line x1="50%" y1="80%" x2="80%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1" />
                            <line x1="50%" y1="20%" x2="50%" y2="50%" stroke="url(#lineGradient)" strokeWidth="1" />
                            <line x1="50%" y1="80%" x2="50%" y2="50%" stroke="url(#lineGradient)" strokeWidth="1" />
                        </svg>

                        {/* Qubit Nodes */}
                        <QubitNode x={20} y={30} active={qubits[0] > 0.5} value={qubits[0]} />
                        <QubitNode x={50} y={20} active={qubits[1] > 0.5} value={qubits[1]} />
                        <QubitNode x={80} y={30} active={qubits[2] > 0.5} value={qubits[2]} />
                        <QubitNode x={20} y={70} active={qubits[3] > 0.5} value={qubits[3]} />
                        <QubitNode x={50} y={80} active={qubits[4] > 0.5} value={qubits[4]} />
                        <QubitNode x={80} y={70} active={qubits[5] > 0.5} value={qubits[5]} />
                        <QubitNode x={50} y={50} active={qubits[6] > 0.5} value={qubits[6]} />
                        <QubitNode x={35} y={50} active={qubits[7] > 0.5} value={qubits[7]} />
                    </div>

                    {/* Result Card */}
                    {prediction && !isAnnealing && (
                         <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 p-6 rounded-xl flex items-center justify-between animate-fade-in-up">
                            <div>
                                <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">Pattern Recognition Result</p>
                                <h2 className="text-2xl font-bold text-white">{prediction}</h2>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end text-cyan-300">
                                    <SparklesIcon className="w-5 h-5" />
                                    <span className="text-3xl font-mono font-bold">{confidence.toFixed(2)}%</span>
                                </div>
                                <p className="text-xs text-gray-400">Probability Certainty</p>
                            </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};
