import React, { useState } from 'react';
import { PlayIcon, ArrowPathIcon, ArrowsPointingOutIcon, PlusIcon, XMarkIcon } from './Icons';
import { ICON_BUTTON_CLASSES } from '../constants';

const Viewport: React.FC<{ isRunning: boolean }> = ({ isRunning }) => (
    <div className="w-full h-full bg-black rounded-lg border border-gray-700 flex items-center justify-center relative overflow-hidden">
        {/* Placeholder for 3D/2D simulation rendering */}
        <p className="z-10 text-gray-500">Simulation Viewport</p>
        {isRunning && (
            <>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 opacity-20"></div>
                <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-indigo-500/10 rounded-full filter blur-3xl animate-pulse"></div>
            </>
        )}
    </div>
);

export const SimulationHub: React.FC = () => {
    const [prompt, setPrompt] = useState('Simulate the economic impact of introducing universal basic income in a mid-sized city over 20 years.');
    const [isRunning, setIsRunning] = useState(false);
    
    return (
        <div className="flex h-full bg-gray-100 dark:bg-gray-900">
            {/* Main Content */}
            <main className="flex-1 flex flex-col p-4">
                <div className="flex-1 relative mb-4">
                    <Viewport isRunning={isRunning} />
                </div>
                {/* Timeline & Controls */}
                <div className="h-32 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex flex-col">
                    {/* Timeline placeholder */}
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 relative">
                        <div className="absolute top-0 left-0 h-2 bg-blue-500 rounded-full" style={{ width: '35%' }} />
                    </div>
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <button className={ICON_BUTTON_CLASSES} onClick={() => setIsRunning(!isRunning)}>
                                {isRunning ? <div className="w-5 h-5 bg-currentColor rounded-sm" /> : <PlayIcon className="w-5 h-5" />}
                            </button>
                            <span className="text-sm font-mono">Year: 7/20</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <button className={ICON_BUTTON_CLASSES}>-</button>
                             <span>1.0x</span>
                             <button className={ICON_BUTTON_CLASSES}>+</button>
                         </div>
                         <button className={ICON_BUTTON_CLASSES}><ArrowsPointingOutIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </main>
            {/* Right Sidebar */}
            <aside className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 flex flex-col">
                <h2 className="text-xl font-bold mb-4">Simulation Controls</h2>
                <div className="space-y-4 flex-1 overflow-y-auto">
                    <div>
                        <label className="text-sm font-semibold mb-1 block">Initial Prompt</label>
                        <textarea 
                            rows={6}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full text-sm p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                        />
                    </div>
                     <div>
                        <label className="text-sm font-semibold mb-1 block">Modify Mid-Simulation</label>
                        <textarea 
                            rows={3}
                            placeholder="e.g., 'Introduce a sudden housing market crash in year 10...'"
                            className="w-full text-sm p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                        />
                         <button className="w-full mt-2 text-sm py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md font-semibold">Inject Event</button>
                    </div>
                </div>
                 <div className="flex-shrink-0 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => setIsRunning(true)} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-md hover:bg-blue-700">
                        Run Simulation
                    </button>
                 </div>
            </aside>
        </div>
    );
};