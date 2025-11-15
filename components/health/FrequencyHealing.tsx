import React from 'react';
import { healthAndWellnessData } from '../../healthData';
import { BeakerIcon } from '../Icons';

const Section: React.FC<{title: string, icon: React.FC<any>, children: React.ReactNode}> = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
            <Icon className="w-7 h-7 text-blue-500" />
            {title}
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
            {children}
        </div>
    </div>
);

export const FrequencyHealing: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Frequency Healing & Genetic Analysis</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Exploring concepts related to bio-frequencies and genetic scanning.</p>
            </header>

            <div className="space-y-6 max-w-4xl mx-auto">
                {healthAndWellnessData.frequencyHealing.map(concept => (
                    <Section key={concept.id} title={concept.title} icon={concept.icon}>
                        {concept.content.map((paragraph, index) => (
                            <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
                        ))}
                    </Section>
                ))}
                
                 <Section title="Genetic Sound Editing (Conceptual)" icon={BeakerIcon}>
                    <p>This module integrates the principles of <strong>Cymatics</strong> (visualizing sound), <strong>Rife Frequencies</strong> (resonant destruction), <strong>Walter Russell's</strong> vortex mechanics (creation/destruction cycles), and <strong>CRISPR</strong> (gene editing) into a single powerful tool.</p>
                    <p>It allows for the manipulation of matter at a molecular and genetic level through precisely controlled sound, light, and vibration. The conceptual interface below demonstrates how a user might target a specific gene or element and apply a frequency for a desired outcome.</p>
                    <div className="mt-4 not-prose p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200">Simulation Interface</h4>
                        <div>
                            <label className="block text-xs font-semibold mb-1">Target Element/Gene ID</label>
                            <input type="text" defaultValue="Gene-HBB (Sickle Cell Anemia)" className="w-full text-sm p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1">Target Action</label>
                            <select className="w-full text-sm p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                                <option>Repair (CRISPR)</option>
                                <option>Destroy (Rife)</option>
                                <option>Create/Synthesize (Russell)</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-semibold mb-1">Frequency (Hz)</label>
                            <input type="text" defaultValue="432 Hz (Solfeggio)" className="w-full text-sm p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                        </div>
                        <button className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700">Initiate Sequence</button>
                    </div>
                </Section>
            </div>
        </div>
    );
};