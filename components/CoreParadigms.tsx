import React from 'react';
import { BeakerIcon, CodeBracketIcon, InformationCircleIcon, ChipIcon } from './Icons';

const ParadigmInfoCard: React.FC<{
    title: string;
    description: string;
    icon: React.FC<any>;
}> = ({ title, description, icon: Icon }) => (
    <div className="p-6 h-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center flex flex-col items-center">
        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title} Computing</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm flex-grow">{description}</p>
    </div>
);


export const CoreParadigms: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Core Computing Paradigms</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Aetherius OS dynamically utilizes different computing models in sync to achieve optimal results.</p>
            </header>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><InformationCircleIcon className="w-6 h-6" /> Automatic & Synchronized Processing</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                    The AI core intelligently analyzes each task to determine the most efficient processing strategy. It can leverage Binary, Ternary, and Quantum paradigms individually, sequentially, or all at once. By analyzing data on different levels, the system achieves a more nuanced and accurate final result, seamlessly converting data between paradigms as needed.
                </p>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                <ParadigmInfoCard
                    title="Binary"
                    description="The traditional base layer, representing states as 0s and 1s. Ideal for standard computations and serves as the compatibility layer for current technology."
                    icon={CodeBracketIcon}
                />
                <ParadigmInfoCard
                    title="Ternary"
                    description="An intermediate layer with three states (-1, 0, 1). Used for more nuanced data processing and complex logic where a third state is beneficial."
                    icon={BeakerIcon}
                />
                <ParadigmInfoCard
                    title="Quantum"
                    description="The most advanced layer, utilizing qubits in superposition for complex problem-solving, simulations, and deep data analysis."
                    icon={ChipIcon}
                />
            </div>
        </div>
    );
};