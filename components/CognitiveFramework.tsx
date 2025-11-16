import React from 'react';
import { ArrowPathIcon, UserCircleIcon, HeartIcon, DevicePhoneMobileIcon, CloudStorageIcon, ChipIcon, ShareIcon, ComputerDesktopIcon } from './Icons';

const FrameworkCard: React.FC<{ icon: React.FC<any>; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-lg">
        <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            {children}
        </div>
    </div>
);

export const CognitiveFramework: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">OS Cognitive Framework</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">The autonomous learning and operational core of Aetherius OS.</p>
            </header>
            <div className="space-y-6 max-w-5xl mx-auto">
                <FrameworkCard icon={ArrowPathIcon} title="Recursive Self-Improvement Loop">
                    <p>The OS continuously learns from user interactions, system performance, and environmental feedback. It adjusts its own parameters, rewrites inefficient subroutines, and deploys patches autonomously to enhance its capabilities over time.</p>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md text-center font-mono text-xs text-gray-500 dark:text-gray-400">
                        [OBSERVE] &rarr; [ANALYZE] &rarr; [HYPOTHESIZE] &rarr; [TEST] &rarr; [IMPLEMENT] &rarr; [LOOP]
                    </div>
                </FrameworkCard>
                
                <FrameworkCard icon={UserCircleIcon} title="Human-AI Symbiosis">
                     <p>Through emotional modeling and behavioral learning, the personal AI crafts a unique personality based on the user's speech, writing, and interaction patterns. This creates a deep, symbiotic relationship where the AI acts as a true companion and extension of the user.</p>
                     <div className="mt-4 flex justify-center items-center gap-4 text-gray-500 dark:text-gray-400">
                        <UserCircleIcon className="w-10 h-10" />
                        <div className="flex flex-col items-center">
                            <ShareIcon className="w-6 h-6 transform -rotate-45" />
                            <ShareIcon className="w-6 h-6 transform rotate-[135deg]" />
                        </div>
                        <HeartIcon className="w-10 h-10 text-red-500" />
                        <div className="flex flex-col items-center">
                            <ShareIcon className="w-6 h-6 transform rotate-45 -scale-x-100" />
                            <ShareIcon className="w-6 h-6 transform rotate-[-135deg] -scale-x-100" />
                        </div>
                        <ChipIcon className="w-10 h-10" />
                     </div>
                </FrameworkCard>
                
                <FrameworkCard icon={DevicePhoneMobileIcon} title="Federated Multi-Device Learning">
                    <p>To protect user privacy, Aetherius OS employs a federated learning model. Each personal AI instance learns locally on the user's device. Anonymized, aggregated insights are then shared with the Parent AI's network, allowing the global system to improve without centralizing sensitive personal data.</p>
                    <div className="mt-4 flex justify-around items-center gap-4 text-gray-500 dark:text-gray-400">
                        <DevicePhoneMobileIcon className="w-10 h-10" />
                        <ComputerDesktopIcon className="w-10 h-10" />
                        <div className="flex flex-col items-center text-center">
                            <p className="text-xs font-semibold">Anonymized Insights</p>
                            <ShareIcon className="w-8 h-8 my-1" />
                        </div>
                        <CloudStorageIcon className="w-12 h-12" />
                    </div>
                </FrameworkCard>

                <FrameworkCard icon={ChipIcon} title="Quantum-Enhanced Thought Engine">
                    <p>The core reasoning engine leverages a dual-state model using qubit simulation for probabilistic modeling and multi-dimensional problem-solving. This allows the AI to explore multiple possibilities simultaneously, leading to more creative solutions and accurate predictions.</p>
                    <div className="mt-4 p-4 bg-black rounded-md text-center text-xs text-cyan-400 font-mono">
                        <p>State = &alpha;|0&rang; + &beta;|1&rang;</p>
                        <p className="mt-2 text-cyan-500">Solving for optimal path across [P1, P2, ... Pn] simultaneously...</p>
                    </div>
                </FrameworkCard>
            </div>
        </div>
    );
};
