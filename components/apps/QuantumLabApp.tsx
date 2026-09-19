
import React, { useState } from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { QuantumNeuralNetwork } from '../QuantumNeuralNetwork';
import { QuantumCircuitDesigner } from '../quantum/QuantumCircuitDesigner';
import { SparklesIcon, CpuChipIcon, ClockIcon } from '../Icons';

// --- Time Crystal Visualizer Stub ---
const TimeCrystalVis: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full bg-black text-white p-8 text-center">
        <div className="relative w-64 h-64">
             <div className="absolute inset-0 border-4 border-purple-500/50 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
             <div className="absolute inset-4 border-4 border-cyan-500/50 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
             <div className="absolute inset-0 flex items-center justify-center">
                 <SparklesIcon className="w-32 h-32 text-white animate-spin-slow" style={{ animationDuration: '10s' }} />
             </div>
        </div>
        <h2 className="text-2xl font-bold mt-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Time Crystal State: STABLE</h2>
        <p className="text-gray-400 mt-2 max-w-md">Non-equilibrium matter phase locked. Temporal coherence maintained at 99.999%.</p>
    </div>
);

const quantumComponentMap: { [key: string]: React.FC<any> } = {
  circuitDesigner: QuantumCircuitDesigner,
  quantumNN: QuantumNeuralNetwork,
  timeCrystal: TimeCrystalVis,
};

interface QuantumLabAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const QuantumLabApp: React.FC<QuantumLabAppProps> = ({ context, onSetView }) => {
    // Construct menu if not passed fully
    const menu = context.menuItem || { title: 'Quantum Lab', icon: CpuChipIcon, children: [] };
    
    // Ensure default children exist
    if (!menu.children || menu.children.length === 0) {
        menu.children = [
            { title: 'Circuit Designer', icon: CpuChipIcon, component: 'circuitDesigner' },
            { title: 'Quantum Neural Net', icon: SparklesIcon, component: 'quantumNN' },
            { title: 'Time Crystal Monitor', icon: ClockIcon, component: 'timeCrystal' }
        ];
    }

    return <AppContainer menuItem={menu} componentMap={quantumComponentMap} onSetView={onSetView} />;
};
