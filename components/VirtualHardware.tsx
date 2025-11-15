import React from 'react';
import { ComputerDesktopIcon, CircleStackIcon } from './Icons';

const components = [
    { name: 'Virtual Quantum Processing Unit (vQPU)', spec: 'Simulated 20 Qubit Processor', status: 'Optimal' },
    { name: 'Virtual Central Processing Unit (vCPU)', spec: '32-Core, 4.5GHz', status: 'Optimal' },
    { name: 'Virtual Graphics Processing Unit (vGPU)', spec: '24GB VRAM, Ray Tracing Enabled', status: 'Optimal' },
    { name: 'Virtual RAM', spec: '256 GB DDR5', status: 'Optimal' },
    { name: 'Virtual Storage', spec: '500 TB NVMe Array', status: 'Optimal' },
    { name: 'Virtual Power Supply Unit (vPSU)', spec: '1600W Titanium Grade', status: 'Stable' },
    { name: 'Virtual Motherboard', spec: 'Z-Quantum Chipset', status: 'Connected' },
    { name: 'Virtual Network Interface', spec: '100 Gb/s Fiber', status: 'Connected' },
];

const ComponentRow: React.FC<{ component: typeof components[0] }> = ({ component }) => (
    <tr className="border-b border-gray-200 dark:border-gray-700">
        <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">{component.name}</td>
        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{component.spec}</td>
        <td className="py-3 px-4">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                component.status === 'Optimal' || component.status === 'Connected' || component.status === 'Stable'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800'
            }`}>
                {component.status}
            </span>
        </td>
    </tr>
);

export const VirtualHardware: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Virtual Hardware Monitor</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">System specifications for the Aetherius OS Virtual Machine.</p>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-4 font-semibold uppercase text-gray-600 dark:text-gray-300">Component</th>
                                <th className="py-3 px-4 font-semibold uppercase text-gray-600 dark:text-gray-300">Specification</th>
                                <th className="py-3 px-4 font-semibold uppercase text-gray-600 dark:text-gray-300">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {components.map(comp => <ComponentRow key={comp.name} component={comp} />)}
                        </tbody>
                    </table>
                </div>
            </div>
             <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>All components are virtualized and can be upgraded or swapped via the system settings.</p>
            </div>
        </div>
    );
};