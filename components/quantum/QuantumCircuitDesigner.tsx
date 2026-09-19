
import React, { useState } from 'react';
import { PlayIcon, ArrowPathIcon, PlusIcon, TrashIcon, BoltIcon } from '../Icons';

interface Gate {
    id: string;
    type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'M';
    qubit: number;
    step: number;
}

export const QuantumCircuitDesigner: React.FC = () => {
    const [qubits, setQubits] = useState(4);
    const [steps, setSteps] = useState(8);
    const [gates, setGates] = useState<Gate[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<string[]>([]);

    const gateTypes = ['H', 'X', 'Y', 'Z', 'CNOT', 'M'];

    const addGate = (type: Gate['type'], qubit: number, step: number) => {
        const newGate: Gate = { id: `g-${Date.now()}`, type, qubit, step };
        setGates(prev => [...prev.filter(g => !(g.qubit === qubit && g.step === step)), newGate]);
    };

    const removeGate = (qubit: number, step: number) => {
        setGates(prev => prev.filter(g => !(g.qubit === qubit && g.step === step)));
    };

    const runCircuit = () => {
        setIsRunning(true);
        setResults([]);
        
        // Simulate quantum processing delay
        setTimeout(() => {
            // Generate pseudo-random quantum measurement results based on gates
            const outcomes = [];
            const hasHadamard = gates.some(g => g.type === 'H');
            
            for (let i = 0; i < 5; i++) {
                let binary = "";
                for (let q = 0; q < qubits; q++) {
                    // Simple logic: if H gate present, random 0/1, else 0
                    const val = hasHadamard ? Math.round(Math.random()) : 0;
                    binary += val;
                }
                outcomes.push(`|${binary}⟩`);
            }
            setResults(outcomes);
            setIsRunning(false);
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white font-mono p-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 bg-gray-800 p-2 rounded-lg border border-gray-700">
                <div className="flex gap-2">
                    {gateTypes.map(gate => (
                        <div key={gate} className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold shadow-lg cursor-grab hover:bg-blue-500">
                                {gate}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                     <button onClick={() => setQubits(q => Math.min(8, q + 1))} className="p-2 bg-gray-700 rounded hover:bg-gray-600"><PlusIcon className="w-4 h-4"/></button>
                     <button onClick={() => setGates([])} className="p-2 bg-red-900/50 text-red-400 rounded hover:bg-red-900/80"><TrashIcon className="w-4 h-4"/></button>
                     <button onClick={runCircuit} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded flex items-center gap-2">
                        {isRunning ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <PlayIcon className="w-4 h-4"/>}
                        Execute
                    </button>
                </div>
            </div>

            {/* Circuit Grid */}
            <div className="flex-1 bg-black/50 rounded-xl border border-gray-700 overflow-auto p-6 relative">
                <div className="min-w-[800px]">
                    {Array.from({ length: qubits }).map((_, qIdx) => (
                        <div key={qIdx} className="flex items-center h-16 border-b border-gray-800/50 relative group">
                            <div className="w-16 text-gray-400 font-bold text-sm flex items-center justify-center border-r border-gray-700 bg-gray-900 z-10 sticky left-0">
                                q[{qIdx}]
                            </div>
                            
                            {/* Wire Line */}
                            <div className="absolute left-16 right-0 top-1/2 h-0.5 bg-gray-600 z-0"></div>

                            {/* Steps */}
                            <div className="flex-1 flex pl-4 relative z-10">
                                {Array.from({ length: steps }).map((_, sIdx) => {
                                    const gate = gates.find(g => g.qubit === qIdx && g.step === sIdx);
                                    return (
                                        <div 
                                            key={sIdx} 
                                            className="w-16 h-full flex items-center justify-center border-r border-gray-800/30 hover:bg-white/5 cursor-pointer transition-colors relative"
                                            onClick={() => gate ? removeGate(qIdx, sIdx) : addGate('H', qIdx, sIdx)} // Default add H on click for demo
                                        >
                                            {gate && (
                                                <div className={`w-10 h-10 ${gate.type === 'CNOT' ? 'rounded-full bg-purple-600' : gate.type === 'M' ? 'rounded-md bg-red-600' : 'rounded bg-blue-600'} flex items-center justify-center shadow-md text-sm font-bold`}>
                                                    {gate.type}
                                                </div>
                                            )}
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-0 text-[9px] text-gray-600">{sIdx}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Results Panel */}
            <div className="h-48 mt-4 bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <BoltIcon className="w-4 h-4 text-yellow-400"/> Quantum Measurement Outcomes (1024 Shots)
                </h3>
                <div className="flex-1 flex items-end gap-4 overflow-x-auto pb-2">
                    {results.length > 0 ? (
                        results.map((res, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="w-12 bg-blue-500/30 border border-blue-400 rounded-t" style={{ height: `${Math.random() * 80 + 20}px` }}></div>
                                <span className="text-xs font-mono text-blue-300">{res}</span>
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm italic">
                            {isRunning ? "Collapsing Wavefunctions..." : "Run circuit to see probabilities."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
