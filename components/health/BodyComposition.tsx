import React from 'react';
import { BeakerIcon } from '../Icons';
import { healthAndWellnessData } from '../../healthData';

const Section: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
            {children}
        </div>
    </div>
);

const { bodyComposition } = healthAndWellnessData;

export const BodyComposition: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3"><BeakerIcon className="w-8 h-8"/>Body Composition Analysis</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">A breakdown of DEXA, MRI, and BIA scans for analyzing body composition.</p>
            </header>

            <div className="space-y-6 max-w-5xl mx-auto">
                <Section title="At a Glance: Comparison Table">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50">
                                    <th className="p-3 font-semibold text-left border border-gray-200 dark:border-gray-700">Feature</th>
                                    <th className="p-3 font-semibold text-left border border-gray-200 dark:border-gray-700">DEXA (DXA)</th>
                                    <th className="p-3 font-semibold text-left border border-gray-200 dark:border-gray-700">MRI</th>
                                    <th className="p-3 font-semibold text-left border border-gray-200 dark:border-gray-700">BIA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bodyComposition.table.map(row => (
                                    <tr key={row.feature} className="odd:bg-white dark:odd:bg-gray-800 even:bg-gray-50/50 dark:even:bg-gray-800/50">
                                        <td className="p-3 font-semibold border border-gray-200 dark:border-gray-700">{row.feature}</td>
                                        <td className="p-3 border border-gray-200 dark:border-gray-700">{row.dexa}</td>
                                        <td className="p-3 border border-gray-200 dark:border-gray-700">{row.mri}</td>
                                        <td className="p-3 border border-gray-200 dark:border-gray-700">{row.bia}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
                
                <Section title="In-Depth Look">
                    <div className="space-y-4">
                        {bodyComposition.inDepth.map((method, index) => (
                             <React.Fragment key={method.id}>
                                <h3>{method.title}</h3>
                                <p><strong>Principle:</strong> {method.principle}</p>
                                <p><strong>{method.primaryUse.title}:</strong></p>
                                <ul>
                                  {method.primaryUse.points.map((point, i) => <li key={i} dangerouslySetInnerHTML={{ __html: point }} />)}
                                </ul>
                                <p><strong>Pros:</strong> {method.pros}</p>
                                <p><strong>Cons:</strong> {method.cons}</p>
                                {index < bodyComposition.inDepth.length - 1 && <hr className="my-6 border-gray-200 dark:border-gray-700" />}
                             </React.Fragment>
                        ))}
                    </div>
                </Section>
            </div>
        </div>
    );
};