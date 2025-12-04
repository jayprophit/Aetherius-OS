
import React, { useState, useEffect } from 'react';
import { ComputerDesktopIcon, CircleStackIcon, CpuChipIcon, CubeTransparentIcon, BoltIcon, ChipIcon, ArrowPathIcon, SparklesIcon, DnaIcon, UserCircleIcon } from './Icons';
import { rigService, RigState, HardwareComponent } from '../services/RigService';

const ComponentRow: React.FC<{ type: string, components: HardwareComponent[], icon: React.FC<any> }> = ({ type, components, icon: Icon }) => {
    // Aggregate data if multiple components
    if (!components || components.length === 0) return null;

    const name = components.length > 1 ? `${components[0].name} (x${components.length})` : components[0].name;
    const load = Math.round(components.reduce((acc, c) => acc + (Math.random() * 80 + 10), 0) / components.length);
    const temp = Math.round(components.reduce((acc, c) => acc + c.heatGeneration, 0) / components.length);
    
    return (
        <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td className="py-3 px-4 flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 block">{name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{type}</span>
                </div>
            </td>
            <td className="py-3 px-4">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    Online
                </span>
            </td>
            <td className="py-3 px-4 font-mono text-sm">{load}%</td>
            <td className="py-3 px-4 font-mono text-sm">{temp}°C</td>
        </tr>
    );
};

export const VirtualHardware: React.FC = () => {
    const [rig, setRig] = useState<RigState>(rigService.getRig());
    const [stats, setStats] = useState(rigService.calculateStats(rig));

    useEffect(() => {
        const sub = rigService.rigState$.subscribe(state => {
            setRig(state);
            setStats(rigService.calculateStats(state));
        });
        return () => sub.unsubscribe();
    }, []);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">System Monitor</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Real-time telemetry of your active virtual hardware stack. Running on <strong>Cloud/Local Hybrid Sync</strong>.
                    </p>
                </div>
                <div className="flex gap-4">
                     <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border border-purple-200 dark:border-purple-800">
                        <SparklesIcon className="w-4 h-4" />
                        <span>Coherence: {Math.min(100, stats.coherence)}%</span>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border border-blue-200 dark:border-blue-800">
                        <BoltIcon className="w-4 h-4" />
                        <span>Draw: {stats.power}W</span>
                    </div>
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
                            <ComponentRow type="Binary CPU" components={rig.Binary_CPU} icon={CpuChipIcon} />
                            <ComponentRow type="Quantum QPU" components={rig.Quantum_QPU} icon={SparklesIcon} />
                            <ComponentRow type="GPU / Graphics" components={rig.Binary_GPU} icon={CubeTransparentIcon} />
                            <ComponentRow type="System RAM" components={rig.Binary_RAM} icon={CircleStackIcon} />
                            <ComponentRow type="Storage" components={rig.Binary_Storage} icon={ComputerDesktopIcon} />
                            <ComponentRow type="Ternary Logic" components={rig.Ternary_CPU} icon={ChipIcon} />
                            <ComponentRow type="Bio-Neural Net" components={rig.Biological_Neural_Net} icon={DnaIcon} />
                            <ComponentRow type="Positronic Brain" components={rig.Positronic_Brain} icon={UserCircleIcon} />
                            <ComponentRow type="Cooling Loop" components={rig.Quantum_Cooling} icon={ArrowPathIcon} />
                            <ComponentRow type="Power Supply" components={rig.Power_Matrix} icon={BoltIcon} />
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
