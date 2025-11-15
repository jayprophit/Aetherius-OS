import React from 'react';

const SpecItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 px-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-right">{value}</span>
    </div>
);

export const AboutSettings: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {/* Top Section */}
            <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center font-bold text-white text-6xl tracking-tighter shadow-lg mb-6">
                    A
                </div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Aetherius OS</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Version 24H2 (OS Build 22631.3007)</p>
                <p className="max-w-md mt-4 text-gray-600 dark:text-gray-300">
                    This web-based interface demonstrates the conceptual features of Aetherius OS, including its hierarchical network, multi-paradigm computing, and integrated personal AI.
                </p>
                <div className="mt-8 space-x-4">
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                        Check for Updates
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        Legal & Regulatory
                    </button>
                </div>
            </div>

            {/* Device Specs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-xl font-bold p-2 text-gray-800 dark:text-gray-100">Device specifications</h2>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <SpecItem label="Device name" value="Aetherius-VM" />
                    <SpecItem label="Processor" value="Virtual Quantum/CPU Hybrid @ 4.5GHz" />
                    <SpecItem label="Installed RAM" value="256 GB" />
                    <SpecItem label="System type" value="64-bit operating system, x64-based processor" />
                </div>
            </div>

            {/* OS Specs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-xl font-bold p-2 text-gray-800 dark:text-gray-100">Aetherius OS specifications</h2>
               <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <SpecItem label="Edition" value="Aetherius OS Pro (Grandchild Build)" />
                    <SpecItem label="Version" value="24H2" />
                    <SpecItem label="Installed on" value={new Date().toLocaleDateString()} />
                    <SpecItem label="OS build" value="22631.3007" />
                </div>
            </div>
            
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
                <p>&copy; {new Date().getFullYear()} Aetherius Corporation. All rights reserved.</p>
            </div>
        </div>
    );
};