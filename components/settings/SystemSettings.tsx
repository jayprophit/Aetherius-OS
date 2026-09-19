import React from 'react';

const SpecItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-right">{value}</span>
    </div>
);

export const SystemSettings: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
             <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <SpecItem label="Device name" value="Aetherius-VM" />
                    <SpecItem label="Processor" value="Virtual Quantum/CPU Hybrid @ 4.5GHz" />
                    <SpecItem label="Installed RAM" value="256 GB" />
                    <SpecItem label="System type" value="64-bit operating system, x64-based processor" />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
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
