
import React from 'react';
import { ComputerDesktopIcon, CircleStackIcon, CpuChipIcon, CubeTransparentIcon, BoltIcon } from './Icons';

// This component now serves as the "Task Manager" / "System Monitor" view of the active rig.
// The actual building happens in VirtualRigBuilder.

const systemStatus = [
    { name: 'vCPU Core', spec: 'Neural-Silicon X1 (Custom)', status: 'Active', load: '34%', temp: '45°C' },
    { name: 'Quantum Co-Proc', spec: 'Aether-Q Photonic', status: 'Entangled', load: '12%', temp: '22°C' },
    { name: 'Graphics Engine', spec: 'H1000 Hopper-X', status: 'Idle', load: '5%', temp: '30°C' },
    { name: 'Memory Fabric', spec: '256 GB DDR5', status: 'Nominal', load: '45%', temp: '35°C' },
    { name: 'Primary Storage', spec: 'Helix-7 DNA Drive', status: 'Read/Write', load: '1%', temp: '4°C' },
    { name: 'Power Grid', spec: 'Virtual Micro-Fusion', status: 'Stable', load: '420W', temp: '60°C' },
];

const ComponentRow: React.FC<{ component: typeof systemStatus[0], icon: React.FC<any> }> = ({ component, icon: Icon }) => (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <td className="py-3 px-4 flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <span className="font-semibold text-gray-800 dark:text-gray-200 block">{component.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{component.spec}</span>
            </div>
        </td>
        <td className="py-3 px-4">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                component.status === 'Active' || component.status === 'Entangled' || component.status === 'Stable' || component.status === 'Nominal'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
            }`}>
                {component.status}
            </span>
        </td>
        <td className="py-3 px-4 font-mono text-sm">{component.load}</td>
        <td className="py-3 px-4 font-mono text-sm">{component.temp}</td>
    </tr>
);

export const VirtualHardware: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">System Monitor</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time telemetry of your active virtual hardware stack.</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border border-blue-200 dark:border-blue-800">
                    <BoltIcon className="w-4 h-4" />
                    <span>Total Draw: 1.2 GW</span>
                </div>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-4 font-semibold uppercase text-gray-600 dark:text-gray-300">Component</th>
                                <th className="py-3 px-4 font-semibold uppercase text-gray-600 dark:text-gray-300">Status</th>
                                <th className="py-3 px-4 font-semibold uppercase text-gray-600 dark:text-gray-300">Load</th>
                                <th className="py-3 px-4 font-semibold uppercase text-gray-600 dark:text-gray-300">Temp</th>
                            </tr>
                        </thead>
                        <tbody>
                            <ComponentRow component={systemStatus[0]} icon={CpuChipIcon} />
                            <ComponentRow component={systemStatus[1]} icon={BoltIcon} />
                            <ComponentRow component={systemStatus[2]} icon={CubeTransparentIcon} />
                            <ComponentRow component={systemStatus[3]} icon={CircleStackIcon} />
                            <ComponentRow component={systemStatus[4]} icon={ComputerDesktopIcon} />
                            <ComponentRow component={systemStatus[5]} icon={BoltIcon} />
                        </tbody>
                    </table>
                </div>
            </div>
             <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>To swap components, clone parts, or modify specs, visit the <strong>Virtual Rig Builder</strong> in the Engineering App.</p>
            </div>
        </div>
    );
};
