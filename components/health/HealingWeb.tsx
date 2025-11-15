import React from 'react';
import { GlobeAltIcon } from '../Icons';
import { healthAndWellnessData } from '../../healthData';

const ComparisonCard: React.FC<{ ailment: string, pharma: React.ReactNode, nature: React.ReactNode }> = ({ ailment, pharma, nature }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">{ailment}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-lg text-blue-600 dark:text-blue-400 mb-2">Pharmaceutical Approach</h4>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                    {pharma}
                </div>
            </div>
            <div className="p-4">
                <h4 className="font-semibold text-lg text-green-600 dark:text-green-400 mb-2">Natural & Holistic Approach</h4>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                    {nature}
                </div>
            </div>
        </div>
    </div>
);

export const HealingWeb: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <GlobeAltIcon className="w-8 h-8" />
                    The Healing Web: Nature vs. Pharmaceuticals
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">A comparative look at different approaches to common health concerns.</p>
            </header>

            <div className="space-y-6 max-w-5xl mx-auto">
                {healthAndWellnessData.healingWeb.map(item => (
                     <ComparisonCard 
                        key={item.ailment}
                        ailment={item.ailment}
                        pharma={<ul>{item.pharma.points.map((p, i) => <li key={i} dangerouslySetInnerHTML={{__html: p}}/>)}</ul>}
                        nature={<ul>{item.nature.points.map((p, i) => <li key={i} dangerouslySetInnerHTML={{__html: p}}/>)}</ul>}
                    />
                ))}
            </div>
        </div>
    );
};