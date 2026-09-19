
import React from 'react';
import { UserCircleIcon, FingerPrintIcon, HiveMindIcon } from './Icons';
import { loggedInUser } from '../data';

const InfoCard: React.FC<{ label: string; value?: string; children?: React.ReactNode }> = ({ label, value, children }) => (
    <div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
        {value && <p className="text-lg font-mono text-gray-800 dark:text-gray-200">{value}</p>}
        {children}
    </div>
);

export const PersonalAI: React.FC = () => {
    const identity = loggedInUser.systemIdentity;
    const buildType = identity?.buildType || 'Grandchild';
    const aiName = identity?.aiNickname || identity?.aiCoreName || 'Aether';
    const coreName = identity?.aiCoreName || 'Aether Core';

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Personal AI ({buildType} Node)</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {buildType === 'Genesis' 
                        ? 'The Master Control Unit. You have unrestricted access.' 
                        : 'Your personalized companion. A localized instance of the Genesis architecture.'}
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side: Avatar */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-bold mb-4">{aiName}</h2>
                    <p className="text-xs text-gray-500 mb-4">Core: {coreName}</p>
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center relative shadow-lg">
                        {/* Placeholder for 3D Holographic Avatar */}
                        <div className="w-full h-full rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
                             <img src="https://i.imgur.com/2y5W1qG.png" alt="AI Avatar" className="w-44 h-44 object-cover opacity-80" />
                        </div>
                         <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm">
                        This is your personal <strong>Master AI</strong>. It manages your local sub-agents and syncs secure data to the Child Network.
                    </p>
                </div>

                {/* Right side: Details */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <FingerPrintIcon className="w-6 h-6" />
                        Identity & Status
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InfoCard label="AI ID" value={identity?.aiId || 'AI-UNK'} />
                        <InfoCard label="Node Status" value="Online & Syncing" />
                        <InfoCard label="Architecture Class" value={`Universal ${buildType} Standard`} />
                        <InfoCard label="Memory Link" value="Unified Vector Store (Local Shard)" />
                        <div className="sm:col-span-2">
                            <InfoCard label="Learning Focus">
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-full">Web Development</span>
                                    <span className="text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded-full">Quantum Physics</span>
                                    <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-1 rounded-full">Music Theory</span>
                                </div>
                            </InfoCard>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-8 mb-4 flex items-center gap-2">
                        <HiveMindIcon className="w-6 h-6" />
                        Core Directives
                    </h3>
                     <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>**Personal Friend:** I am here for {loggedInUser.name}. I learn your habits to help you better.</li>
                        <li>**Assist & Augment:** I proactively offer assistance and automate your repetitive tasks.</li>
                        <li>**Sync with Network:** I receive architectural updates from the Child Node while keeping your data private.</li>
                        <li>**Secure & Protect:** I ensure your identity and assets are safe within this node.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
