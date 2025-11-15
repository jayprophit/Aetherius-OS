import React from 'react';
import { CubeTransparentIcon, GlobeIcon, UserCircleIcon, ShareIcon } from './Icons';

const ArchitectureCard: React.FC<{
    icon: React.FC<any>;
    title: string;
    description: string;
    status: string;
    statusColor: string;
}> = ({ icon: Icon, title, description, status, statusColor }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-7 h-7 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-baseline">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`}></div>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{status}</span>
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{description}</p>
            </div>
        </div>
    </div>
);


export const SystemArchitecture: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">System Architecture</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Visualizing the hierarchical network structure of Aetherius OS.</p>
            </header>

            <div className="space-y-8">
                <ArchitectureCard 
                    icon={CubeTransparentIcon}
                    title="Parent: The Core"
                    description="The main OS and AI engine, owned by the primary user. It learns and adapts to the owner's patterns, preferences, and behaviors."
                    status="Online"
                    statusColor="bg-green-500"
                />

                <div className="text-center">
                    <ShareIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 transform rotate-90 mx-auto" />
                </div>

                <ArchitectureCard 
                    icon={GlobeIcon}
                    title="Child: The Network Layer"
                    description="A decentralized network that combines the internet with a built-in 3D blockchain. It has its own self-teaching AI to manage the network."
                    status="Healthy"
                    statusColor="bg-green-500"
                />

                <div className="text-center">
                    <ShareIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 transform rotate-90 mx-auto" />
                </div>

                <ArchitectureCard 
                    icon={UserCircleIcon}
                    title="Grandchild: The User Node"
                    description="Each user operates a 'grandchild' node. This is their personal instance of the OS, containing their data and a unique personalized AI, acting as a mini-node on the blockchain."
                    status="Connected"
                    statusColor="bg-blue-500"
                />
            </div>
        </div>
    );
};